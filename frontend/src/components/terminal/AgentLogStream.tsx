import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Wrench, ShieldAlert, CheckCircle2, Copy, Search, Trash2, Square, Play } from "lucide-react";
import { useCampaignStore } from "../../stores/useCampaignStore";
import { redactSecrets } from "../../utils/redact";
import { Card, ConfirmButton, EmptyState, PageContainer, PageHeader, PrimaryButton } from "../ui/Primitives";
import { useI18n } from "../../i18n";

export const AgentLogStream: React.FC = () => {
  const {
    agentSteps,
    clearAgentSteps,
    isRunning,
    currentPhase,
    turnsUsed,
    maxTurns,
    statusText,
    isRedactEnabled,
    stopMission,
    setActivePage,
  } = useCampaignStore();
  const { t } = useI18n();

  const [filterKind, setFilterKind] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentSteps.length]);

  const counts = useMemo(
    () => ({
      all: agentSteps.length,
      tool: agentSteps.filter((s) => s.type === "call").length,
      output: agentSteps.filter((s) => s.type === "output").length,
      agent: agentSteps.filter((s) => s.type === "message").length,
      autonomy: agentSteps.filter((s) => s.type === "autonomy_checkpoint").length,
    }),
    [agentSteps]
  );

  const filteredSteps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return agentSteps.filter((s) => {
      if (filterKind !== "all") {
        if (filterKind === "tool" && s.type !== "call") return false;
        if (filterKind === "output" && s.type !== "output") return false;
        if (filterKind === "agent" && s.type !== "message") return false;
        if (filterKind === "autonomy" && s.type !== "autonomy_checkpoint") return false;
      }
      if (q) {
        const content = `${s.tool || ""} ${s.command || ""} ${s.output || ""} ${s.text || ""} ${s.reason || ""}`.toLowerCase();
        if (!content.includes(q)) return false;
      }
      return true;
    });
  }, [agentSteps, filterKind, searchQuery]);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <PageContainer fullHeight>
      <PageHeader
        title={t("Nhật ký Agent", "Agent log")}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="tabular-nums">
              {agentSteps.length} {t("sự kiện", "events")}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}
              />
              <span>
                {isRunning
                  ? `${t("Đang chạy", "Running")} (${currentPhase || "active"} · ${turnsUsed}/${maxTurns})`
                  : statusText || t("Sẵn sàng tác chiến", "Ready")}
              </span>
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={stopMission}
                className="px-3 py-1.5 rounded-lg bg-rose-500/12 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-rose-500/20 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" /> {t("Dừng tác chiến", "Stop mission")}
              </button>
            ) : (
              <PrimaryButton size="sm" onClick={() => setActivePage("mission")}>
                <Play className="w-3.5 h-3.5 fill-current" /> {t("Thiết lập Chiến dịch", "Configure Mission")}
              </PrimaryButton>
            )}
            <ConfirmButton
              label={t("Xóa stream", "Clear stream")}
              confirmLabel={t("Xác nhận xóa?", "Confirm clear?")}
              icon={Trash2}
              onConfirm={clearAgentSteps}
            />
          </div>
        }
      />

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-app-border bg-app-panel2/40 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="inline-flex rounded-lg border border-app-border bg-app-panel p-0.5 text-xs overflow-x-auto">
            {[
              { id: "all", label: t("Tất cả", "All"), n: counts.all },
              { id: "tool", label: "Tool Call", n: counts.tool },
              { id: "output", label: t("Kết quả", "Output"), n: counts.output },
              { id: "agent", label: t("Tư duy", "Reasoning"), n: counts.agent },
              { id: "autonomy", label: t("Vòng lặp", "Autonomy"), n: counts.autonomy },
            ].map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setFilterKind(k.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
                  filterKind === k.id ? "bg-app-active text-app-text" : "text-app-muted hover:text-app-text"
                }`}
              >
                <span>{k.label}</span>
                <span className="text-[10px] font-mono tabular-nums text-app-muted">{k.n}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-app-panel border border-app-border w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Lọc dòng log…", "Filter stream…")}
              aria-label={t("Lọc dòng log agent", "Filter agent stream")}
              className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
          {filteredSteps.length === 0 ? (
            <EmptyState
              icon={Bot}
              title={
                agentSteps.length === 0
                  ? t("Chưa có luồng tác chiến", "No execution stream yet")
                  : t("Không có dòng log khớp bộ lọc", "No matching log entries")
              }
              description={
                agentSteps.length === 0
                  ? t(
                      "Vào trang Chiến dịch và bấm Phát động chiến dịch để theo dõi suy luận & lệnh thực thi trực tiếp.",
                      "Open Mission and start a campaign to watch real-time reasoning and tool execution."
                    )
                  : t("Thử đổi loại bộ lọc hoặc xóa từ khóa tìm kiếm.", "Try changing filter type or clearing search.")
              }
              className="h-full min-h-[240px]"
            />
          ) : (
            filteredSteps.map((s) => {
              if (s.type === "call") {
                const rawArg = s.args ? (typeof s.args === "object" ? JSON.stringify(s.args) : String(s.args)) : "";
                const cmdText = redactSecrets(s.command || rawArg, isRedactEnabled);
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="text-[11px] text-app-muted flex items-center gap-2">
                      <span className="font-mono tabular-nums">[{s.time}]</span>
                      <span className="px-1.5 py-0.5 rounded bg-app-accent-soft text-app-accent text-[10px] font-semibold">
                        TOOL CALL
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-app-panel2/60 border border-app-border flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-app-muted mt-0.5 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0 break-all font-mono text-xs">
                        <b className="text-emerald-600 dark:text-emerald-400 mr-1.5">{s.tool}</b>
                        <span className="text-app-text">{cmdText}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (s.type === "output") {
                const outText = redactSecrets(s.output || "", isRedactEnabled);
                const lineCount = outText.split("\n").length;
                return (
                  <div key={s.id} className="ml-4 space-y-1">
                    <div className="text-[11px] text-app-muted flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">[{s.time}]</span>
                        <span>
                          ↳ Output ({outText.length} {t("ký tự", "chars")})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copy(s.id, outText)}
                        className="text-app-muted hover:text-app-text inline-flex items-center gap-1 cursor-pointer"
                        title={t("Sao chép output", "Copy output")}
                      >
                        <Copy className="w-3 h-3" aria-hidden="true" />
                        <span>{copiedId === s.id ? t("Đã chép", "Copied") : t("Sao chép", "Copy")}</span>
                      </button>
                    </div>
                    <details className="rounded-lg bg-app-panel border border-app-border overflow-hidden" open={lineCount <= 15}>
                      <summary className="px-3 py-1.5 bg-app-panel2/60 text-xs text-app-muted cursor-pointer hover:text-app-text select-none">
                        {t("Xem chi tiết output", "View output")} ({lineCount} {t("dòng", "lines")})
                      </summary>
                      <pre className="p-3 max-h-64 overflow-y-auto text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all text-app-text">
                        {outText}
                      </pre>
                    </details>
                  </div>
                );
              }

              if (s.type === "message") {
                const msgText = redactSecrets(s.text || "", isRedactEnabled);
                return (
                  <div key={s.id} className="p-3.5 rounded-xl bg-app-panel2/50 border border-app-border space-y-1.5">
                    <div className="text-[11px] text-app-muted flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium text-app-text">
                        <Bot className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
                        <span>{s.agent ? `Agent: ${s.agent}` : "Agent Pentester"}</span>
                      </span>
                      <span className="font-mono tabular-nums">{s.time}</span>
                    </div>
                    <div className="text-app-text whitespace-pre-wrap leading-relaxed text-[13px]">{msgText}</div>
                  </div>
                );
              }

              if (s.type === "autonomy_checkpoint") {
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-emerald-500/5 border border-app-border border-l-4 border-l-emerald-500 space-y-1"
                  >
                    <div className="flex items-center justify-between font-medium text-emerald-700 dark:text-emerald-300 text-xs">
                      <span className="font-mono tabular-nums">
                        Autonomy · {t("Vòng", "Cycle")} {s.cycle || 1}/{s.max_cycles || 8} · {t("Lượt", "Turns")}{" "}
                        {s.turns_used || 0}/{s.max_turns || 30}
                      </span>
                      <span className="text-[11px] text-app-muted font-mono tabular-nums">{s.time}</span>
                    </div>
                    <div className="text-app-text text-xs">
                      {t("Pha tác chiến:", "Phase:")} <b className="font-semibold">{s.phase_label || s.phase}</b>
                    </div>
                    {s.reason && <div className="text-app-muted text-xs">↳ {s.reason}</div>}
                  </div>
                );
              }

              if (s.type === "final") {
                const finalText = redactSecrets(
                  s.final_message ||
                    t(
                      "Chiến dịch đã hoàn tất. Xem báo cáo chi tiết trong trang Lịch sử.",
                      "Mission completed. View detailed report in History."
                    ),
                  isRedactEnabled
                );
                return (
                  <div key={s.id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/35 space-y-2">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>{t("Báo cáo chiến dịch hoàn tất", "Final mission report")}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(s.id, finalText)}
                        className="inline-flex items-center gap-1 text-xs text-app-muted hover:text-app-text cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{copiedId === s.id ? t("Đã chép", "Copied") : t("Sao chép", "Copy")}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-app-panel border border-app-border text-app-text text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {finalText}
                    </pre>
                  </div>
                );
              }

              if (s.type === "error") {
                return (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/35 text-rose-700 dark:text-rose-300 flex items-start gap-2 text-xs"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <b>{t("Lỗi:", "Error:")}</b> {s.text}
                    </div>
                  </div>
                );
              }

              return null;
            })
          )}
          <div ref={endRef} />
        </div>
      </Card>
    </PageContainer>
  );
};
