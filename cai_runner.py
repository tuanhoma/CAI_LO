#!/usr/bin/env python3
"""
CAI Reverse Runner for Kali Linux (VMware / VirtualBox).
=========================================================
Runs inside Kali Linux VM. Initiates an outbound reverse connection back to the
CAI Controller (Windows/Host) to execute pentest tools in an isolated sandbox.

ZERO INBOUND OPEN PORTS — Immune to network scans and counter-attacks from targets!
Zero pip requirements — Uses Python 3 standard library only.

Usage:
    python3 cai_runner.py --server http://<WINDOWS_HOST_IP>:8000 --token <SECRET_TOKEN>
"""

import argparse
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, List, Optional

# ANSI colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

COMMON_PENTEST_TOOLS = [
    "nmap", "sqlmap", "gobuster", "ffuf", "hydra", "nikto", "wpscan",
    "john", "hashcat", "msfconsole", "nc", "netcat", "tcpdump", "tshark",
    "curl", "wget", "dig", "whois", "dirb", "dirbuster", "masscan",
    "subfinder", "sublist3r", "amass", "responder", "smbclient",
    "crackmapexec", "impacket-psexec", "searchsploit", "wfuzz", "commix"
]


def detect_tools() -> List[str]:
    """Scan the environment for available offensive tools."""
    found = []
    for tool in COMMON_PENTEST_TOOLS:
        if shutil.which(tool):
            found.append(tool)
    return found


def get_local_ip() -> str:
    """Detect local IP of Kali VM."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("1.1.1.1", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class ReverseRunner:
    def __init__(self, server_url: str, token: str, runner_id: Optional[str] = None):
        self.server_url = server_url.rstrip("/")
        self.token = token
        self.runner_id = runner_id or f"kali_{socket.gethostname()}_{os.getpid()}"
        self.hostname = socket.gethostname()
        self.os_info = f"{platform.system()} {platform.release()} ({platform.machine()})"
        self.tools = detect_tools()
        self.running = True
        self.workspace = os.path.expanduser("~/cai_workspace")
        os.makedirs(self.workspace, exist_ok=True)

    def _make_request(self, endpoint: str, data: Optional[Dict] = None, timeout: int = 35) -> Optional[Dict]:
        """Make JSON HTTP request to CAI Controller."""
        url = f"{self.server_url}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "X-Runner-Token": self.token,
            "User-Agent": f"CAI-Reverse-Runner/{self.runner_id}",
        }
        post_data = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=post_data, headers=headers)

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                res_body = response.read().decode("utf-8")
                if res_body:
                    return json.loads(res_body)
                return {}
        except urllib.error.HTTPError as e:
            if e.code == 401 or e.code == 403:
                print(f"{RED}[!] Authentication Failed (HTTP {e.code})! Please check your --token.{RESET}")
            return None
        except Exception:
            return None

    def register(self) -> bool:
        """Register Kali VM with the CAI Windows Controller."""
        payload = {
            "runner_id": self.runner_id,
            "hostname": self.hostname,
            "os_info": self.os_info,
            "tools": self.tools,
            "client_ip": get_local_ip(),
            "workspace": self.workspace,
        }
        res = self._make_request("/api/v1/runner/register", data=payload, timeout=10)
        return res is not None and res.get("status") == "registered"

    def send_update(
        self,
        task_id: str,
        chunk: Optional[str] = None,
        completed: bool = False,
        return_code: Optional[int] = None,
        error: Optional[str] = None,
    ):
        """Send execution output chunk or completion status to Controller."""
        payload = {
            "task_id": task_id,
            "chunk": chunk,
            "completed": completed,
            "return_code": return_code,
            "error": error,
        }
        self._make_request("/api/v1/runner/result", data=payload, timeout=10)

    def execute_command(self, task_id: str, command: str, timeout: int):
        """Run command inside Kali environment and stream output back."""
        print(f"\n{YELLOW}[>] EXECUTING TASK [{task_id}]:{RESET} {BOLD}{command}{RESET}")
        start_time = time.time()
        output_buffer = []

        try:
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                cwd=self.workspace,
            )

            chunk_accum = []
            last_flush = time.time()

            # Stream stdout line by line
            for line in iter(process.stdout.readline, ""):
                if not line:
                    break
                sys.stdout.write(line)
                sys.stdout.flush()
                chunk_accum.append(line)
                output_buffer.append(line)

                # Send chunk every 0.3s or 5 lines
                if len(chunk_accum) >= 5 or (time.time() - last_flush > 0.3):
                    chunk_text = "".join(chunk_accum)
                    self.send_update(task_id=task_id, chunk=chunk_text)
                    chunk_accum = []
                    last_flush = time.time()

            # Flush remaining chunks
            if chunk_accum:
                self.send_update(task_id=task_id, chunk="".join(chunk_accum))

            process.stdout.close()
            ret_code = process.wait(timeout=timeout)
            duration = time.time() - start_time

            print(f"{GREEN}[<] COMPLETED in {duration:.2f}s (Exit code: {ret_code}){RESET}")
            self.send_update(
                task_id=task_id,
                completed=True,
                return_code=ret_code,
            )

        except subprocess.TimeoutExpired:
            print(f"{RED}[!] Command timed out after {timeout}s!{RESET}")
            process.kill()
            self.send_update(
                task_id=task_id,
                chunk=f"\n[ERROR] Command timed out on Kali after {timeout} seconds",
                completed=True,
                return_code=124,
                error="TimeoutExpired",
            )
        except Exception as e:
            print(f"{RED}[!] Execution error: {e}{RESET}")
            self.send_update(
                task_id=task_id,
                chunk=f"\n[ERROR] Runner execution exception: {str(e)}",
                completed=True,
                return_code=1,
                error=str(e),
            )

    def run(self):
        """Main runner loop."""
        print(f"{CYAN}{BOLD}=================================================================={RESET}")
        print(f"{GREEN}{BOLD}      CAI Autonomous Reverse Runner — Kali Linux Sandbox{RESET}")
        print(f"{CYAN}{BOLD}=================================================================={RESET}")
        print(f"[*] Target Controller: {BOLD}{self.server_url}{RESET}")
        print(f"[*] Runner ID:         {self.runner_id}")
        print(f"[*] Local Hostname:    {self.hostname} ({get_local_ip()})")
        print(f"[*] Workspace:         {self.workspace}")
        print(f"[*] Offensive Tools:   {GREEN}{len(self.tools)} tools detected{RESET}")
        print(f"    ({', '.join(self.tools[:10])}{'...' if len(self.tools) > 10 else ''})")
        print(f"{CYAN}[*] Connecting to Controller...{RESET}")

        retry_count = 0
        while self.running:
            try:
                # 1. Register with controller
                if not self.register():
                    retry_count += 1
                    if retry_count % 5 == 1:
                        print(f"{YELLOW}[*] Waiting for CAI Controller at {self.server_url}... (Retrying in 5s){RESET}")
                    time.sleep(5)
                    continue

                if retry_count > 0:
                    print(f"{GREEN}[+] Successfully connected to CAI Controller!{RESET}")
                else:
                    print(f"{GREEN}[+] Connected & Authenticated! Ready for AI Agent commands.{RESET}")
                retry_count = 0

                # 2. Polling loop
                while self.running:
                    task = self._make_request(
                        f"/api/v1/runner/poll?runner_id={urllib.parse.quote(self.runner_id)}",
                        timeout=35,
                    )

                    if task is None:
                        # Controller unreachable or connection reset
                        print(f"{YELLOW}[!] Lost connection to Controller. Reconnecting...{RESET}")
                        break

                    if task.get("task_id"):
                        task_id = task["task_id"]
                        command = task["command"]
                        timeout = task.get("timeout", 120)
                        # Execute task in separate thread so polling can continue if needed
                        threading.Thread(
                            target=self.execute_command,
                            args=(task_id, command, timeout),
                            daemon=True,
                        ).start()

                    time.sleep(0.1)

            except KeyboardInterrupt:
                print(f"\n{YELLOW}[*] Runner stopped by user (Ctrl+C).{RESET}")
                self.running = False
                break
            except Exception as e:
                time.sleep(3)


def _collect_local_gateway_candidates(port: int) -> List[str]:
    """Discover host controller URLs from Kali Linux routing table and attached subnets."""
    candidates: List[str] = []

    def _add(ip: str) -> None:
        if not ip or ip.startswith("0.") or ip.startswith("169.254."):
            return
        url = f"http://{ip}:{port}"
        if url not in candidates:
            candidates.append(url)

    # 1. Inspect /proc/net/route for all gateways and attached /24 VM subnets
    try:
        import struct
        with open("/proc/net/route", "r", encoding="utf-8", errors="ignore") as f:
            for line in f.readlines()[1:]:
                fields = line.strip().split()
                if len(fields) < 8:
                    continue
                dest_hex, gw_hex, mask_hex = fields[1], fields[2], fields[7]
                if gw_hex != "00000000":
                    gw_ip = socket.inet_ntoa(struct.pack("<L", int(gw_hex, 16)))
                    if gw_ip.endswith(".2"):
                        _add(gw_ip[:-1] + "1")  # VMware NAT host adapter (.1)
                    _add(gw_ip)
                elif dest_hex != "00000000" and mask_hex == "00FFFFFF":
                    net_ip = socket.inet_ntoa(struct.pack("<L", int(dest_hex, 16)))
                    parts = net_ip.split(".")
                    if len(parts) == 4 and parts[3] == "0":
                        _add(f"{parts[0]}.{parts[1]}.{parts[2]}.1")
    except Exception:
        pass

    # 2. Check local interface subnets via `ip` command (covers secondary NICs)
    try:
        out = subprocess.check_output(
            ["ip", "-o", "-4", "addr", "show"],
            stderr=subprocess.DEVNULL,
            timeout=2,
        ).decode("utf-8", errors="ignore")
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 4:
                ip_part = parts[3].split("/")[0]
                octets = ip_part.split(".")
                if len(octets) == 4 and not ip_part.startswith("127."):
                    _add(f"{octets[0]}.{octets[1]}.{octets[2]}.1")
    except Exception:
        pass

    # 3. Standard hypervisor fallback IPs (VirtualBox NAT/Host-Only, loopback)
    for ip in ("10.0.2.2", "192.168.56.1", "127.0.0.1"):
        _add(ip)

    return candidates


def find_controller_server(explicit_server: Optional[str] = None, port: int = 8000) -> str:
    """Auto-detect or resolve reachable CAI controller server URL."""
    candidates: List[str] = []
    explicit_clean = (explicit_server or "").strip().rstrip("/")
    if explicit_clean and explicit_clean.lower() != "auto":
        candidates.append(explicit_clean)
        # Extract port from explicit --server so fallback discovery probes the same port
        try:
            parsed = urllib.parse.urlparse(explicit_clean)
            if parsed.port:
                port = parsed.port
        except Exception:
            pass

    env_srv = os.getenv("CAI_SERVER", "").strip().rstrip("/")
    if env_srv and env_srv not in candidates:
        candidates.append(env_srv)

    for cand in _collect_local_gateway_candidates(port):
        if cand not in candidates:
            candidates.append(cand)

    # Probe candidates for /api/v1/runner/status
    for idx, srv in enumerate(candidates):
        try:
            req = urllib.request.Request(f"{srv}/api/v1/runner/status", headers={"User-Agent": "CAI-Probe"})
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                if resp.status == 200:
                    if explicit_clean and explicit_clean.lower() != "auto" and idx > 0:
                        print(f"{YELLOW}[!] Could not reach {explicit_clean}; auto-discovered controller at {srv}{RESET}")
                    return srv
        except Exception:
            continue

    return candidates[0] if candidates else f"http://127.0.0.1:{port}"


def main():
    parser = argparse.ArgumentParser(description="CAI Reverse Runner for Kali VM")
    parser.add_argument(
        "--server",
        default=None,
        help="URL of the CAI Windows Controller (omit or use 'auto' to auto-discover)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Controller port for auto-discovery when --server is omitted (default: 8000)",
    )
    parser.add_argument(
        "--token",
        default="cai-kali-secret",
        help="Authentication token matching CAI_RUNNER_TOKEN in .env",
    )
    parser.add_argument(
        "--id",
        default=None,
        help="Custom Runner ID",
    )
    args = parser.parse_args()

    resolved_server = find_controller_server(args.server, port=args.port)

    runner = ReverseRunner(
        server_url=resolved_server,
        token=args.token,
        runner_id=args.id,
    )
    runner.run()


if __name__ == "__main__":
    main()

