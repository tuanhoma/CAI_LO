import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Trash2, Send, ArrowDown } from "lucide-react";
import { buildApiHeaders, buildApiUrl, useCampaignStore } from "../../stores/useCampaignStore";
import { Card, ConfirmButton, PageContainer, PageHeader, PrimaryButton } from "../ui/Primitives";
import { useI18n } from "../../i18n";

export const LiveTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastSeqRef = useRef<number>(0);
  const [inputVal, setInputVal] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const { target, runnerStatus, fetchMemorySummary, activePage, showLabs } = useCampaignStore();
  const { t } = useI18n();

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;

    const term = new XTerm({
      theme: {
        background: "#0b0d12",
        foreground: "#e2e8f0",
        cursor: "#a78bfa",
        selectionBackground: "rgba(167, 139, 250, 0.28)",
        black: "#09090b",
        red: "#fb7185",
        green: "#34d399",
        yellow: "#fbbf24",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
        white: "#f4f4f5",
      },
      fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      lineHeight: 1.45,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    fitAddon.fit();

    term.writeln("\x1b[1;32m[CAI_LO Terminal]\x1b[0m Kali Linux Reverse Runner live console.");
    term.writeln("\x1b[90mType a shell command below to run directly...\x1b[0m\r\n");

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (activePage === "terminal" && xtermInstance.current && fitAddonRef.current) {
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          xtermInstance.current?.scrollToBottom();
        } catch {}
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activePage]);

  useEffect(() => {
    const pollLogs = async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/v1/runner/terminal/logs?since_seq=${lastSeqRef.current}`), {
          headers: buildApiHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        const events = data.events || [];
        if (data.last_seq !== undefined && data.last_seq > lastSeqRef.current) {
          lastSeqRef.current = data.last_seq;
        }
        if (xtermInstance.current && events.length > 0) {
          events.forEach((ev: any) => {
            if (ev.kind === "command") {
              const tag = ev.source === "manual" ? "\x1b[1;32m[MANUAL]\x1b[0m" : "\x1b[1;36m[AGENT]\x1b[0m";
              xtermInstance.current?.writeln(`\r\n${tag} \x1b[1;37m$ ${ev.text}\x1b[0m`);
            } else if (ev.kind === "output") {
              xtermInstance.current?.write(ev.text);
            }
          });
          xtermInstance.current?.scrollToBottom();
        }
      } catch {}
    };
    const interval = setInterval(pollLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  const runCommand = async (cmdToRun: string) => {
    const cmd = cmdToRun.trim();
    if (!cmd || isExecuting) return;
    setIsExecuting(true);
    setCmdHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);
    setHistoryIndex(-1);
    setInputVal("");
    try {
      await fetch(buildApiUrl("/api/v1/runner/terminal/exec"), {
        method: "POST",
        headers: buildApiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ command: cmd, timeout: 60, target }),
      });
      fetchMemorySummary();
    } catch (err: any) {
      xtermInstance.current?.writeln(`\r\n\x1b[1;31m[ERROR] ${err?.message || "Execution failed"}\x1b[0m`);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearTerminal = async () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      lastSeqRef.current = 0;
    }
    try {
      await fetch(buildApiUrl("/api/v1/runner/terminal/logs"), {
        method: "DELETE",
        headers: buildApiHeaders(),
      });
    } catch {}
  };

  const cleanHttpTarget = target && /^https?:\/\//i.test(target.trim()) ? target.trim() : "";
  const quickCommands = [
    { label: "id & uname", cmd: "id && uname -a" },
    { label: "ip a", cmd: "ip -br a" },
    { label: "ss -tulnp", cmd: "ss -tulnp" },
    ...(cleanHttpTarget
      ? [{ label: "curl -I target", cmd: `curl -I ${cleanHttpTarget}` }]
      : showLabs
        ? [{ label: "check MockLab", cmd: "curl -I http://127.0.0.1:8888" }]
        : [{ label: "pwd & ls", cmd: "pwd && ls -la" }]),
  ];

  return (
    <PageContainer fullHeight>
      <PageHeader
        title="Terminal"
        subtitle={
          runnerStatus?.active
            ? `Kali Runner active (${runnerStatus.runners?.[0]?.ip || "connected"}) · ${t("can thiệp trực tiếp", "interactive intervention")}`
            : t("Local shell fallback (chưa kết nối Kali Reverse Runner)", "Local shell fallback (Kali Reverse Runner offline)")
        }
        actions={
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {quickCommands.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => runCommand(q.cmd)}
                className="px-2.5 py-1.5 rounded-lg bg-app-panel border border-app-border text-xs text-app-muted hover:text-app-text hover:bg-app-panel2 transition-colors cursor-pointer font-mono whitespace-nowrap"
              >
                {q.label}
              </button>
            ))}
          </div>
        }
      />

      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="h-10 px-3.5 border-b border-app-border bg-app-panel2/60 flex items-center justify-between text-xs shrink-0">
          <span className="flex items-center gap-2 text-app-text font-medium">
            <span className={`w-2 h-2 rounded-full ${runnerStatus?.active ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <span>{runnerStatus?.active ? "Kali Interactive Terminal" : "Host Fallback Terminal"}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => xtermInstance.current?.scrollToBottom()}
              className="p-1.5 rounded-md text-app-muted hover:text-app-text hover:bg-app-panel transition-colors cursor-pointer"
              aria-label={t("Cuộn xuống dưới cùng", "Scroll to bottom")}
              title={t("Cuộn xuống dưới cùng", "Scroll to bottom")}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <ConfirmButton
              label={t("Xóa", "Clear")}
              confirmLabel={t("Xóa log?", "Confirm?")}
              icon={Trash2}
              onConfirm={clearTerminal}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 p-2.5 bg-[#0b0d12] overflow-hidden" ref={terminalRef} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runCommand(inputVal);
          }}
          className="h-12 border-t border-app-border bg-app-panel2/60 px-3.5 flex items-center gap-2.5 shrink-0"
        >
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-mono">
            {runnerStatus?.active ? "kali@kali-vm:~#" : "local@host:~#"}
          </span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
                  const nextIdx = historyIndex + 1;
                  setHistoryIndex(nextIdx);
                  setInputVal(cmdHistory[nextIdx]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (historyIndex > 0) {
                  const nextIdx = historyIndex - 1;
                  setHistoryIndex(nextIdx);
                  setInputVal(cmdHistory[nextIdx]);
                } else if (historyIndex === 0) {
                  setHistoryIndex(-1);
                  setInputVal("");
                }
              }
            }}
            placeholder={t(
              "Nhập lệnh bash (Enter để chạy, ↑/↓ xem lịch sử)…",
              "Enter bash command (Enter to run, ↑/↓ for history)…"
            )}
            aria-label={t("Nhập lệnh bash", "Enter bash command")}
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-app-text font-mono focus:outline-none placeholder:text-app-muted/70"
          />
          <PrimaryButton type="submit" size="sm" disabled={isExecuting || !inputVal.trim()}>
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isExecuting ? t("Đang chạy…", "Running…") : t("Chạy", "Run")}</span>
          </PrimaryButton>
        </form>
      </Card>
    </PageContainer>
  );
};
