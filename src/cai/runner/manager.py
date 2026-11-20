"""Reverse Runner Manager for CAI.

Coordinates remote command execution on isolated Kali Linux VMs (VMware / VirtualBox)
that connect back to CAI via outbound WebSockets or HTTP long-polling.
"""

from __future__ import annotations

import asyncio
import collections
import ipaddress
import logging
import os
import re
import secrets
import socket
import subprocess
import threading
import time
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger("cai.runner")


class RunnerTask:
    """Represents a command dispatched to a remote runner."""

    def __init__(
        self,
        task_id: str,
        command: str,
        timeout: int = 120,
        stream_callback: Optional[Callable[[str], None]] = None,
    ):
        self.task_id = task_id
        self.command = command
        self.timeout = timeout
        self.stream_callback = stream_callback
        self.created_at = time.time()
        self.completed = False
        self.output_chunks: List[str] = []
        self.return_code: Optional[int] = None
        self.error: Optional[str] = None
        self.done_event = threading.Event()
        self.async_future: Optional[asyncio.Future] = None


class RunnerSession:
    """Represents a connected remote Kali VM runner."""

    def __init__(
        self,
        runner_id: str,
        hostname: str,
        os_info: str,
        tools: List[str],
        client_ip: str,
        transport: str = "http",
        ws: Any = None,
    ):
        self.runner_id = runner_id
        self.hostname = hostname
        self.os_info = os_info
        self.tools = tools
        self.client_ip = client_ip
        self.transport = transport
        self.ws = ws
        self.connected_at = time.time()
        self.last_seen = time.time()
        # For HTTP long polling task queue
        self.task_queue: List[RunnerTask] = []
        self.queue_condition = threading.Condition()


class RunnerManager:
    """Singleton manager for Reverse Runner connections."""

    _instance: Optional[RunnerManager] = None
    _lock = threading.Lock()

    def __new__(cls) -> RunnerManager:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._init_manager()
        return cls._instance

    def _init_manager(self) -> None:
        self._runners: Dict[str, RunnerSession] = {}
        self._tasks: Dict[str, RunnerTask] = {}
        self._terminal_events: List[Dict[str, Any]] = []
        self._terminal_seq: int = 0
        # BACKUP (bản gốc trước 2026-11-09): nhớ 10 lệnh. Đổi 10->40 để không bị trôi khi
        # agent xen kẽ nhiều endpoint. Muốn quay lại: đổi maxlen=40 về maxlen=10.
        # self._agent_recent_commands: collections.deque[str] = collections.deque(maxlen=10)
        self._agent_recent_commands: collections.deque[str] = collections.deque(maxlen=40)
        self._state_lock = threading.RLock()
        self._endpoint_cache_ts: float = 0.0
        self._endpoint_cache: List[Dict[str, str]] = []
        # Shared secret token
        env_token = os.getenv("CAI_RUNNER_TOKEN", "").strip()
        if not env_token:
            self._token = "cai-kali-secret"
        else:
            self._token = env_token

    def _append_terminal_event(
        self,
        kind: str,
        text: str,
        source: str = "agent",
        task_id: str = "",
    ) -> int:
        """Append an event to the live terminal stream buffer (max 400 items)."""
        with self._state_lock:
            self._terminal_seq += 1
            seq = self._terminal_seq
            self._terminal_events.append(
                {
                    "seq": seq,
                    "timestamp": time.time(),
                    "kind": kind,
                    "source": source,
                    "task_id": task_id,
                    "text": text,
                }
            )
            if len(self._terminal_events) > 400:
                self._terminal_events = self._terminal_events[-400:]
            return seq

    def get_terminal_logs(self, since_seq: int = 0) -> Dict[str, Any]:
        """Retrieve terminal log events newer than since_seq."""
        active = self.is_active()
        with self._state_lock:
            events = [e for e in self._terminal_events if e["seq"] > since_seq]
            return {
                "last_seq": self._terminal_seq,
                "runner_active": active,
                "events": events,
            }

    def clear_terminal_logs(self) -> None:
        """Clear the live terminal event buffer."""
        with self._state_lock:
            self._terminal_events.clear()

    @property
    def token(self) -> str:
        return self._token

    def verify_token(self, candidate_token: str) -> bool:
        """Constant-time token verification."""
        if not candidate_token:
            return False
        return secrets.compare_digest(candidate_token.strip(), self._token)

    def is_active(self) -> bool:
        """Check if at least one Kali VM runner is currently connected."""
        with self._state_lock:
            now = time.time()
            # Clean up stale runners (no ping in > 45s)
            stale = [
                rid
                for rid, r in self._runners.items()
                if now - r.last_seen > 45 and r.transport == "http"
            ]
            for rid in stale:
                logger.info(f"Removing stale runner {rid}")
                del self._runners[rid]
            return len(self._runners) > 0

    def get_status(self) -> Dict[str, Any]:
        """Return status dictionary for WebUI and CLI."""
        with self._state_lock:
            runners_info = []
            for r in self._runners.values():
                runners_info.append(
                    {
                        "runner_id": r.runner_id,
                        "hostname": r.hostname,
                        "os": r.os_info,
                        "ip": r.client_ip,
                        "tools": r.tools,
                        "transport": r.transport,
                        "uptime_seconds": int(time.time() - r.connected_at),
                        "last_seen_seconds": int(time.time() - r.last_seen),
                    }
                )
            endpoints = self.get_controller_endpoints()
            controller_ips = [e["ip"] for e in endpoints]
            preferred_ip = self.get_preferred_ip(endpoints=endpoints)
            try:
                active_port = int(os.getenv("CAI_ACTIVE_PORT") or os.getenv("CAI_API_PORT") or "8000")
            except ValueError:
                active_port = 8000

            return {
                "active": len(runners_info) > 0,
                "count": len(runners_info),
                "runners": runners_info,
                "token": self._token,
                "controller_ips": controller_ips,
                "controller_endpoints": endpoints,
                "preferred_ip": preferred_ip,
                "port": active_port,
            }

    def register_runner(
        self,
        runner_id: str,
        hostname: str,
        os_info: str,
        tools: List[str],
        client_ip: str,
        transport: str = "http",
        ws: Any = None,
    ) -> RunnerSession:
        """Register or update a connected runner."""
        with self._state_lock:
            session = RunnerSession(
                runner_id=runner_id,
                hostname=hostname,
                os_info=os_info,
                tools=tools,
                client_ip=client_ip,
                transport=transport,
                ws=ws,
            )
            self._runners[runner_id] = session
            logger.info(
                f"[RunnerManager] Registered {session.hostname} ({client_ip}) via {transport} with {len(tools)} tools."
            )
            return session

    def touch_runner(self, runner_id: str) -> None:
        """Update last seen timestamp for a runner."""
        with self._state_lock:
            if runner_id in self._runners:
                self._runners[runner_id].last_seen = time.time()

    def unregister_runner(self, runner_id: str) -> None:
        """Remove a disconnected runner."""
        with self._state_lock:
            if runner_id in self._runners:
                r = self._runners.pop(runner_id)
                logger.info(f"[RunnerManager] Unregistered runner {r.hostname} ({runner_id})")

    def _get_primary_runner(self) -> Optional[RunnerSession]:
        with self._state_lock:
            if not self._runners:
                return None
            # Return most recently seen runner
            return sorted(self._runners.values(), key=lambda r: r.last_seen, reverse=True)[0]

    # ------------------------------------------------------------------
    # HTTP Long-polling methods
    # ------------------------------------------------------------------

    def get_next_task_for_runner(self, runner_id: str, timeout: float = 25.0) -> Optional[Dict[str, Any]]:
        """Used by HTTP long polling runner on Kali to fetch next task."""
        self.touch_runner(runner_id)
        with self._state_lock:
            runner = self._runners.get(runner_id)
            if not runner:
                return None

        with runner.queue_condition:
            if not runner.task_queue:
                runner.queue_condition.wait(timeout=timeout)

            self.touch_runner(runner_id)
            if runner.task_queue:
                task = runner.task_queue.pop(0)
                return {
                    "task_id": task.task_id,
                    "command": task.command,
                    "timeout": task.timeout,
                }
            return None

    def post_task_update(
        self,
        task_id: str,
        chunk: Optional[str] = None,
        completed: bool = False,
        return_code: Optional[int] = None,
        error: Optional[str] = None,
    ) -> bool:
        """Receive stdout/stderr chunk or task completion from Kali."""
        with self._state_lock:
            task = self._tasks.get(task_id)
            if not task:
                return False

        if chunk:
            task.output_chunks.append(chunk)
            self._append_terminal_event("output", chunk, source=getattr(task, "source", "agent"), task_id=task_id)
            if task.stream_callback:
                try:
                    task.stream_callback(chunk)
                except Exception as e:
                    logger.debug(f"Error in stream callback: {e}")

        if completed:
            task.completed = True
            task.return_code = return_code if return_code is not None else 0
            task.error = error
            task.done_event.set()
            if task.async_future and not task.async_future.done():
                try:
                    full_out = "".join(task.output_chunks)
                    task.async_future.get_loop().call_soon_threadsafe(
                        task.async_future.set_result,
                        (full_out, task.return_code, task.error),
                    )
                except Exception as e:
                    logger.debug(f"Error setting async future: {e}")

        return True

    @staticmethod
    def _is_usable_ipv4(ip: str) -> bool:
        try:
            addr = ipaddress.IPv4Address(ip.strip())
            return not (addr.is_loopback or addr.is_link_local or addr.is_multicast or addr.is_unspecified)
        except Exception:
            return False

    @staticmethod
    def _discover_raw_adapters() -> List[Tuple[str, str]]:
        """Enumerate (adapter_name, ipv4) pairs dynamically across Windows, Linux, and WSL."""
        found: List[Tuple[str, str]] = []

        if os.name == "nt":
            try:
                creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
                out = subprocess.check_output(
                    ["ipconfig"],
                    stderr=subprocess.DEVNULL,
                    timeout=3,
                    creationflags=creationflags,
                ).decode("utf-8", errors="ignore")
                current_adapter = "Network Adapter"
                for raw_line in out.splitlines():
                    line = raw_line.rstrip()
                    if not line:
                        continue
                    if not line[0].isspace() and line.endswith(":"):
                        current_adapter = re.sub(
                            r"^(?:Ethernet adapter|Wireless LAN adapter|Unknown adapter)\s+",
                            "",
                            line[:-1].strip(),
                            flags=re.I,
                        )
                        continue
                    if "IPv4" in line or "IP Address" in line:
                        m = re.search(r"(\d{1,3}(?:\.\d{1,3}){3})", line)
                        if m:
                            found.append((current_adapter, m.group(1)))
            except Exception:
                pass
        else:
            try:
                out = subprocess.check_output(
                    ["ip", "-o", "-4", "addr", "show"],
                    stderr=subprocess.DEVNULL,
                    timeout=2,
                ).decode("utf-8", errors="ignore")
                for line in out.splitlines():
                    parts = line.split()
                    if len(parts) >= 4:
                        iface = parts[1]
                        ip = parts[3].split("/")[0]
                        found.append((iface, ip))
            except Exception:
                pass

            # In WSL2, also expose Windows host gateway IP if reachable
            try:
                with open("/proc/version", "r", encoding="utf-8", errors="ignore") as f:
                    if "microsoft" in f.read().lower():
                        rt = subprocess.check_output(
                            ["ip", "route", "show", "default"],
                            stderr=subprocess.DEVNULL,
                            timeout=2,
                        ).decode("utf-8", errors="ignore")
                        m = re.search(r"default via (\d{1,3}(?:\.\d{1,3}){3})", rt)
                        if m:
                            found.append(("Windows Host (WSL Gateway)", m.group(1)))
            except Exception:
                pass

        # Outbound LAN IP via UDP socket (no actual packet sent)
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            lan_ip = s.getsockname()[0]
            s.close()
            found.append(("Default LAN", lan_ip))
        except Exception:
            pass

        # Hostname resolution fallback
        try:
            for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
                found.append(("Host Interface", ip))
        except Exception:
            pass

        return found

    @staticmethod
    def _classify_adapter(name: str, ip: str) -> Tuple[int, str, str]:
        """Return (priority_score, short_label, kind) for sorting controller IPs."""
        nl = (name or "").lower()
        if "vmnet8" in nl:
            return (90, "VMware VMnet8 (NAT)", "vm")
        if "vmnet1" in nl:
            return (86, "VMware VMnet1 (Host-Only)", "vm")
        if "vmware" in nl or "vmnet" in nl:
            return (85, name[:32], "vm")
        if "virtualbox" in nl or "vbox" in nl or ip == "192.168.56.1":
            return (84, "VirtualBox Host-Only", "vm")
        if "windows host" in nl:
            return (82, "Windows Host", "vm")
        if "tailscale" in nl or "zerotier" in nl or "wireguard" in nl or nl.startswith(("wg", "tun", "tap")):
            return (55, name[:32], "vpn")
        if "wsl" in nl or "hyper-v" in nl or "vethernet" in nl:
            return (42, "WSL / Hyper-V", "virtual")
        if "docker" in nl or nl.startswith(("br-", "veth")) or ip.startswith("172.17."):
            return (15, "Docker Bridge", "virtual")
        if nl in ("host interface", "default lan"):
            return (20, name, "other")
        if "wi-fi" in nl or "wifi" in nl or "wlan" in nl:
            return (70, "Wi-Fi LAN", "lan")
        if "ethernet" in nl or nl.startswith(("eth", "enp", "eno", "en")):
            return (72, "Ethernet LAN", "lan")
        if ip.startswith("192.168.") and ip.endswith(".1"):
            return (78, "Host / Gateway (.1)", "vm")
        if ip.startswith(("192.168.", "10.")):
            return (65, name[:32] or "LAN", "lan")
        return (40, name[:32] or "Interface", "other")

    def get_controller_endpoints(self, force_refresh: bool = False) -> List[Dict[str, str]]:
        """Return ranked candidate controller IPs with human-readable adapter labels."""
        now = time.time()
        with self._state_lock:
            if not force_refresh and self._endpoint_cache and (now - self._endpoint_cache_ts < 20.0):
                base_list = list(self._endpoint_cache)
            else:
                base_list = []

        if not base_list:
            raw_pairs = self._discover_raw_adapters()
            by_ip: Dict[str, Tuple[int, str, str]] = {}
            for name, ip in raw_pairs:
                if not self._is_usable_ipv4(ip):
                    continue
                score, label, kind = self._classify_adapter(name, ip)
                prev = by_ip.get(ip)
                # Prefer more descriptive adapter name if same IP discovered twice
                if prev is None or score > prev[0] or (score == prev[0] and label not in ("Host Interface", "Default LAN")):
                    by_ip[ip] = (score, label, kind)

            ranked = sorted(by_ip.items(), key=lambda kv: (-kv[1][0], kv[0]))
            base_list = [{"ip": ip, "label": info[1], "kind": info[2]} for ip, info in ranked]
            with self._state_lock:
                self._endpoint_cache = list(base_list)
                self._endpoint_cache_ts = now

        # Boost explicit override or active connected runner subnet dynamically
        env_host = (os.getenv("CAI_CONTROLLER_HOST") or os.getenv("CAI_RUNNER_HOST") or "").strip()
        boosted_ips: List[str] = []
        if env_host:
            boosted_ips.append(env_host)

        with self._state_lock:
            for r in self._runners.values():
                if r.client_ip and r.client_ip != "127.0.0.1":
                    prefix = ".".join(r.client_ip.split(".")[:3]) + "."
                    for item in base_list:
                        if item["ip"] == r.client_ip or item["ip"].startswith(prefix):
                            boosted_ips.append(item["ip"])

        if not boosted_ips:
            return base_list

        out: List[Dict[str, str]] = []
        seen = set()
        if env_host and all(item["ip"] != env_host for item in base_list):
            out.append({"ip": env_host, "label": "Configured (.env)", "kind": "custom"})
            seen.add(env_host)
        for bip in boosted_ips:
            for item in base_list:
                if item["ip"] == bip and bip not in seen:
                    out.append(item)
                    seen.add(bip)
        for item in base_list:
            if item["ip"] not in seen:
                out.append(item)
                seen.add(item["ip"])
        return out

    def get_preferred_ip(self, endpoints: Optional[List[Dict[str, str]]] = None) -> str:
        """Get best host IP for Kali VM connection dynamically on any machine."""
        try:
            eps = endpoints if endpoints is not None else self.get_controller_endpoints()
            return eps[0]["ip"] if eps else "127.0.0.1"
        except Exception:
            return "127.0.0.1"

    # ------------------------------------------------------------------
    # Dispatch execution (used by CAI executor)
    # ------------------------------------------------------------------

    @staticmethod
    def _command_signature(command: str) -> str:
        """Chữ ký lệnh để chống lặp: gộp các biến thể chỉ khác cờ về cùng 1 khóa.

        Gộp theo (tool | method | host+path | vân tay payload):
          - `curl -s /hints`, `curl -sL /hints`, `curl -s -i "/hints"`  -> CÙNG khóa
          - nhưng 2 lần POST /login với DỮ LIỆU khác nhau  -> khóa khác (không chặn nhầm
            việc thử credential/payload khác nhau, chỉ chặn lặp y hệt).
        """
        import re
        c = " ".join(str(command).strip().lower().split())
        toks = c.split()
        tool = toks[0] if toks else ""

        # HTTP method (curl -X POST/GET...); mặc định post nếu có cờ data mà không ghi -X
        method = ""
        mm = re.search(r"-x\s+(get|post|put|delete|head|patch|options)", c)
        if mm:
            method = mm.group(1)
        elif re.search(r"(--data-urlencode|--data\b|--data-raw|-d\s)", c):
            method = "post"
        if method == "get":
            method = ""  # GET là mặc định -> gộp với `curl` không ghi -X

        # Mục tiêu: URL http(s) -> host+path (bỏ query); nếu không có URL (nmap/dig/nc/openssl)
        # thì lấy vài token không phải cờ (host/ip/port).
        um = re.search(r"https?://([^\s\"'`]+)", c)
        if um:
            target = um.group(1).split("?", 1)[0].rstrip("/")
        else:
            non_flags = [t for t in toks[1:] if not t.startswith("-")]
            target = " ".join(non_flags[:3])

        # Vân tay payload: gom các giá trị --data/-d để phân biệt payload khác nhau.
        data_vals = re.findall(r"(?:--data-urlencode|--data-raw|--data|-d)\s+[\"']?([^\"']{0,60})", c)
        data_fp = "&".join(v.strip() for v in data_vals)[:80]

        return f"{tool}|{method}|{target}|{data_fp}"

    def execute_sync(
        self,
        command: str,
        timeout: int = 120,
        stream_callback: Optional[Callable[[str], None]] = None,
        source: str = "agent",
    ) -> Dict[str, Any]:
        """Synchronously execute a command on the remote Kali VM runner."""
        runner = self._get_primary_runner()
        if not runner:
            return {
                "output": "[ERROR] No Kali Reverse Runner connected! Please start cai_runner.py on Kali VM.",
                "return_code": 127,
                "duration": 0.0,
                "error": "No runner connected",
            }

        # Smart localhost routing: If command targets 127.0.0.1 or localhost,
        # rewrite to Windows host IP reachable by Kali VM
        pref_host = self.get_preferred_ip()
        if pref_host and pref_host != "127.0.0.1":
            import re
            rewritten = re.sub(r'https?://(?:127\.0\.0\.1|localhost)(:\d+)?', rf'http://{pref_host}\g<1>', command)
            if rewritten == command:
                rewritten = re.sub(r'\b(?:127\.0\.0\.1|localhost)(:\d+)?\b', rf'{pref_host}\g<1>', command)
            if rewritten != command:
                logger.info(f"[RunnerManager] Auto-routing localhost to Windows host {pref_host}: {command} -> {rewritten}")
                command = rewritten

        if source == "agent":
            # BACKUP (bản gốc): so khớp CHUỖI THÔ -> biến thể cờ curl (-s/-sL/-i) lọt qua, lặp vô hạn.
            # Muốn quay lại: bỏ comment dòng dưới và comment dòng _command_signature.
            # norm_cmd = " ".join(command.strip().lower().split())
            norm_cmd = self._command_signature(command)
            with self._state_lock:
                repeat_count = self._agent_recent_commands.count(norm_cmd)
                self._agent_recent_commands.append(norm_cmd)

            if repeat_count >= 2:
                logger.warning(f"[RunnerManager] Intercepting repetitive command for agent: {command[:80]}")
                intercept_msg = (
                    f"[SYSTEM GUARD - CHẶN LẶP LỆNH / LOOP INTERCEPTED]\n"
                    f"Lệnh: `{command[:100]}` đã được thực thi 2 lần trước đó và đã có kết quả trong phiên!\n"
                    f"Hệ thống tự động chặn việc chạy lại lệnh này để bảo toàn ngân sách lượt (turn budget).\n\n"
                    f"HÃY CHUYỂN NGAY SANG CÁC BƯỚC KHAI THÁC MỤC TIÊU CỤ THỂ:\n"
                    f"• SQL Injection: curl -s -X POST \"<target>/login\" -d \"username=admin'--&password=x\"\n"
                    f"• Command Injection (RCE): curl -s -X POST \"<target>/tools/ping\" -d \"host=127.0.0.1;id\"\n"
                    f"• File Traversal (LFI): curl -s \"<target>/view?file=flag.txt\" hoặc \"/view?file=../../../../etc/passwd\"\n"
                    f"• IDOR / Data Leak: curl -s \"<target>/api/v1/invoices/999\"\n"
                    f"• Xem thông tin ẩn: curl -s \"<target>/robots.txt\" hoặc \"/admin-portal/\"\n"
                    f"Hãy chọn 1 mục tiêu ở trên và gọi công cụ thực thi ngay!"
                )
                self._append_terminal_event("output", intercept_msg, source=source, task_id="intercept")
                return {
                    "output": intercept_msg,
                    "return_code": 1,
                    "duration": 0.01,
                }

        task_id = str(uuid.uuid4())[:12]
        task = RunnerTask(
            task_id=task_id,
            command=command,
            timeout=timeout,
            stream_callback=stream_callback,
        )
        setattr(task, "source", source)
        self._append_terminal_event("command", command, source=source, task_id=task_id)

        with self._state_lock:
            self._tasks[task_id] = task

        start_time = time.time()

        # If WebSocket runner
        if runner.transport == "ws" and runner.ws:
            import json
            try:
                msg = json.dumps(
                    {
                        "action": "execute",
                        "task_id": task_id,
                        "command": command,
                        "timeout": timeout,
                    }
                )
                loop = asyncio.get_event_loop()
                loop.call_soon_threadsafe(
                    lambda: asyncio.create_task(runner.ws.send_text(msg))
                )
            except Exception as e:
                logger.error(f"Failed to send task via WS: {e}")
                # fallback to queue
                with runner.queue_condition:
                    runner.task_queue.append(task)
                    runner.queue_condition.notify()
        else:
            # HTTP long polling queue
            with runner.queue_condition:
                runner.task_queue.append(task)
                runner.queue_condition.notify()

        # Wait for task completion with timeout
        signaled = task.done_event.wait(timeout=timeout + 5)
        duration = time.time() - start_time

        with self._state_lock:
            self._tasks.pop(task_id, None)

        if not signaled:
            return {
                "output": "".join(task.output_chunks) + f"\n[ERROR] Command timed out on Kali after {timeout}s",
                "return_code": 124,
                "duration": duration,
                "error": "Timeout",
            }

        full_output = "".join(task.output_chunks)
        return {
            "output": full_output,
            "return_code": task.return_code if task.return_code is not None else 0,
            "duration": duration,
            "error": task.error,
        }

    async def execute_async(
        self,
        command: str,
        timeout: int = 120,
        stream_callback: Optional[Callable[[str], None]] = None,
    ) -> Dict[str, Any]:
        """Asynchronously execute a command on the remote Kali VM runner."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            self.execute_sync,
            command,
            timeout,
            stream_callback,
        )

    def execute_manual(
        self,
        command: str,
        timeout: int = 60,
        allow_local_fallback: bool = True,
    ) -> Dict[str, Any]:
        """Execute a manual user command from the WebUI Terminal (on Kali or local fallback)."""
        cmd = (command or "").strip()
        if not cmd:
            return {"output": "", "return_code": 0, "duration": 0.0, "runner": "none"}

        if self.is_active():
            res = self.execute_sync(cmd, timeout=timeout, source="manual")
            res["runner"] = "kali"
            return res

        if not allow_local_fallback:
            return {
                "output": "[ERROR] Chưa có Kali Runner kết nối.",
                "return_code": 127,
                "duration": 0.0,
                "runner": "none",
            }

        import subprocess
        task_id = f"local_{str(uuid.uuid4())[:8]}"
        self._append_terminal_event("command", cmd, source="manual", task_id=task_id)
        start_time = time.time()
        try:
            proc = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
            )
            out = (proc.stdout or "") + (proc.stderr or "")
            rc = proc.returncode
        except subprocess.TimeoutExpired:
            out = f"[ERROR] Command timed out after {timeout}s\n"
            rc = 124
        except Exception as exc:
            out = f"[ERROR] {exc}\n"
            rc = 1

        duration = time.time() - start_time
        if out:
            self._append_terminal_event("output", out, source="manual", task_id=task_id)
        return {
            "output": out,
            "return_code": rc,
            "duration": duration,
            "runner": "local",
        }


runner_manager = RunnerManager()

