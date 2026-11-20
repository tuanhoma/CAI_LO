import React from "react";
import {
  Activity,
  ShieldAlert,
  Database,
  Server,
  Gauge,
  Bot,
  ArrowUpRight,
  Plus,
  Square,
  Check,
  ShieldCheck,
  FlaskConical,
  Lock,
  Cpu,
} from "lucide-react";
import { useCampaignStore } from "../stores/useCampaignStore";
import { FindingItem } from "../types";
import { Card, EmptyState, PageContainer, PageHeader, PrimaryButton, SecondaryButton, StatCard } from "../components/ui/Primitives";
import { useI18n } from "../i18n";

const sevColor: Record<string, string> = {
  CRITICAL: "text-rose-600 dark:text-rose-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  LOW: "text-sky-600 dark:text-sky-400",
  INFO: "text-app-muted",
};

const sevDot: Record<string, string> = {
  CRITICAL: "bg-rose-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-sky-500",
  INFO: "bg-zinc-400",
};

export const DashboardPage: React.FC = () => {
  const {
    isRunning,
    statusText,
    currentPhase,
    agent,
    model,
    modelSplitConfig,
    turnsUsed,
    maxTurns,
    findings,
    credentials,
    memoryRaw,
    runnerStatus,
    labStatus,
    hardLabStatus,
    showLabs,
    scopeConfig,
    isRedactEnabled,
    agentSteps,
    auditSessions,
    setActivePage,
    setTarget,
    setPrompt,
    stopMission,
  } = useCampaignStore();
  const { t } = useI18n();

  const sevCount = (s: FindingItem["severity"]) => findings.filter((f) => f.severity === s).length;
  const stats = memoryRaw?.stats;
  const assetTotal = (stats?.hosts || 0) + (stats?.ports || 0) + (stats?.endpoints || 0);
  const runners = runnerStatus?.runners ?? [];
  const toolCount = runners.reduce((n, r) => n + (r.tools?.length ?? 0), 0);
  const recentSteps = [...agentSteps].slice(-6).reverse();
  const recentFindings = [...findings].slice(-6).reverse();
  const recentSessions = [...auditSessions].slice(0, 6);

  return (
    <PageContainer>
      <PageHeader
        title={t("Tổng quan", "Overview")}
        subtitle={t("Trạng thái toàn hệ thống · cập nhật trực tiếp", "System-wide status · live updates")}
        actions={
          isRunning ? (
            <>
              <SecondaryButton onClick={() => setActivePage("agent_log")}>
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> {t("Xem Agent log", "View stream")}
              </SecondaryButton>
              <button
                type="button"
                onClick={stopMission}
                className="px-3.5 py-2 rounded-lg bg-rose-500/12 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-sm font-medium inline-flex items-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> {t("Dừng tác chiến", "Stop mission")}
              </button>
            </>
          ) : (
            <PrimaryButton onClick={() => setActivePage("mission")}>
              <Plus className="w-4 h-4" /> {t("Chiến dịch mới", "New mission")}
            </PrimaryButton>
          )
        }
      />

      {/* Top 5 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard
          icon={Activity}
          label={t("Chiến dịch", "Mission")}
          value={isRunning ? t("Đang chạy", "Running") : t("Sẵn sàng", "Ready")}
          onClick={() => setActivePage(isRunning ? "agent_log" : "mission")}
          sub={
            <span className="flex items-center gap-1.5 truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                }`}
              />
              <span className="truncate">
                {isRunning
                  ? statusText || currentPhase
                  : statusText || agent || t("Chờ chỉ thị", "Awaiting mission")}
              </span>
            </span>
          }
        />

        <StatCard
          icon={ShieldAlert}
          label={t("Phát hiện", "Findings")}
          value={findings.length}
          onClick={() => setActivePage("findings")}
          sub={
            <span className="flex flex-wrap gap-x-2.5 gap-y-0.5 tabular-nums">
              <span className="text-rose-600 dark:text-rose-400">Critical {sevCount("CRITICAL")}</span>
              <span className="text-orange-600 dark:text-orange-400">High {sevCount("HIGH")}</span>
              <span className="text-amber-600 dark:text-amber-400">Med {sevCount("MEDIUM")}</span>
              <span className="text-sky-600 dark:text-sky-400">Low {sevCount("LOW")}</span>
            </span>
          }
        />

        <StatCard
          icon={Database}
          label={t("Tài sản & Intel", "Intel & assets")}
          value={assetTotal}
          onClick={() => setActivePage("memory")}
          sub={
            <span className="tabular-nums">
              {stats?.hosts || 0} hosts · {stats?.ports || 0} ports · {credentials.length} creds
            </span>
          }
        />

        <StatCard
          icon={Server}
          label="Kali runners"
          value={runnerStatus?.count ?? 0}
          onClick={() => setActivePage("terminal")}
          sub={runners.length ? `${toolCount} tools · ${runnerStatus?.active ? "online" : "offline"}` : t("Chế độ local shell", "Local shell fallback")}
        />

        <StatCard
          icon={Gauge}
          label={t("Ngân sách lượt", "Turn budget")}
          value={`${turnsUsed}/${maxTurns}`}
          onClick={() => setActivePage("mission")}
          sub={t("Lượt đã dùng / tối đa", "Turns used / max")}
        />
      </div>

      {/* Activity stream & Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <Activity className="w-4 h-4 text-app-muted" aria-hidden="true" />
              <span>{t("Luồng hoạt động", "Activity stream")}</span>
              <span className="text-xs font-normal text-app-muted tabular-nums">
                · {agentSteps.length} {t("sự kiện", "events")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePage("agent_log")}
              className="text-xs text-app-muted hover:text-app-text inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{t("Xem tất cả", "View all")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentSteps.length === 0 ? (
            <EmptyState
              icon={Bot}
              title={t("Chưa có hoạt động", "No activity yet")}
              description={t(
                "Khởi chạy chiến dịch trong Chiến dịch để xem luồng suy luận và lệnh tool trực tiếp.",
                "Start a mission to view live agent reasoning and tool calls."
              )}
              className="py-8 flex-1"
            />
          ) : (
            <div className="divide-y divide-app-border">
              {recentSteps.map((s) => (
                <div key={s.id} className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 text-sm">
                  <Bot className="w-4 h-4 mt-0.5 text-app-accent shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="text-app-text truncate text-[13px] font-medium">
                      {s.tool || s.type}
                      {s.command ? <span className="text-app-muted font-mono font-normal"> · {s.command}</span> : null}
                    </div>
                    <div className="text-[11px] text-app-muted truncate mt-0.5">
                      {s.phase_label || s.agent || "Agent"} {s.time ? `· ${s.time}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <ShieldAlert className="w-4 h-4 text-app-muted" aria-hidden="true" />
              <span>{t("Phát hiện gần đây", "Findings")}</span>
              <span className="text-xs font-normal text-app-muted tabular-nums">
                · {findings.length} {t("tổng", "total")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePage("findings")}
              className="text-xs text-app-muted hover:text-app-text inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{t("Tất cả", "All")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentFindings.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title={t("Chưa có phát hiện", "No findings")}
              description={t(
                "Các lỗ hổng và bằng chứng PoC được phát hiện sẽ tự động tổng hợp tại đây.",
                "Discovered vulnerabilities and PoC evidence will appear here."
              )}
              className="py-8 flex-1"
            />
          ) : (
            <div className="divide-y divide-app-border">
              {recentFindings.map((f, i) => (
                <div key={f.id ?? i} className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 text-sm">
                  <span
                    className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${sevDot[f.severity] || "bg-zinc-400"}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-app-text truncate text-[13px] font-medium">{f.title}</div>
                    <div className="text-[11px] text-app-muted truncate mt-0.5">
                      <span className={`font-medium ${sevColor[f.severity] || ""}`}>{f.severity}</span> · {f.host}
                      {f.source_tool ? ` · ${f.source_tool}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Lower grid: Audit sessions table + System status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <Server className="w-4 h-4 text-app-muted" aria-hidden="true" />
              <span>{t("Phiên kiểm thử", "Audit sessions")}</span>
              <span className="text-xs font-normal text-app-muted tabular-nums">
                · {auditSessions.length} {t("đã lưu", "saved")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePage("history")}
              className="text-xs text-app-muted hover:text-app-text inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{t("Tất cả", "All")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState
              icon={Server}
              title={t("Chưa có phiên audit", "No audit sessions")}
              description={t(
                "Mọi phiên làm việc và báo cáo Markdown sẽ được lưu trong logs/sessions/.",
                "Execution sessions and Markdown reports are saved under logs/sessions/."
              )}
              className="py-8 flex-1"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-app-muted border-b border-app-border">
                    <th className="py-2 pr-4 font-medium">{t("Mục tiêu", "Target")}</th>
                    <th className="py-2 pr-4 font-medium">Agent</th>
                    <th className="py-2 pr-4 font-medium">{t("Trạng thái", "Status")}</th>
                    <th className="py-2 pr-4 font-medium">{t("Lệnh", "Tools")}</th>
                    <th className="py-2 font-medium text-right">{t("Báo cáo", "Report")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/60">
                  {recentSessions.map((s) => (
                    <tr key={s.session_id} className="hover:bg-app-panel2/50 transition-colors">
                      <td className="py-2.5 pr-4 max-w-[240px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (s.target && s.target !== "—") {
                              setTarget(s.target);
                              setPrompt(
                                t(
                                  `Đánh giá bảo mật và giải quyết mục tiêu ${s.target}.`,
                                  `Perform security assessment and exploit targets on ${s.target}.`
                                )
                              );
                              setActivePage("mission");
                            }
                          }}
                          className="text-app-text hover:text-app-accent font-medium truncate block max-w-full text-left cursor-pointer"
                          title={t("Nạp target này vào Chiến dịch", "Load target into Mission")}
                        >
                          {s.target || "—"}
                        </button>
                      </td>
                      <td className="py-2.5 pr-4 text-app-muted text-xs font-mono truncate max-w-[150px]">{s.agent}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-app-text">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-app-muted tabular-nums text-xs">{s.tool_executions}</td>
                      <td className="py-2.5 text-right">
                        {s.has_report ? (
                          <a
                            href={`/api/v1/audit/sessions/${encodeURIComponent(s.session_id)}/report`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-app-accent hover:underline"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                            <span>{t("Xem", "View")}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-app-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-app-text">
              <ShieldCheck className="w-4 h-4 text-app-muted" aria-hidden="true" />
              <span>{t("Trạng thái hệ thống", "System status")}</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePage("settings")}
              className="text-xs text-app-muted hover:text-app-text inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{t("Cài đặt", "Settings")}</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <StatusRow
              icon={Server}
              label="Kali Reverse Runner"
              badge={runnerStatus?.active ? "Online" : "Offline"}
              ok={!!runnerStatus?.active}
            />
            <StatusRow
              icon={ShieldCheck}
              label="Scope Guard"
              badge={scopeConfig?.enabled ? t("Đang bật", "Enabled") : t("Chờ", "Standby")}
              ok={!!scopeConfig?.enabled}
            />
            <StatusRow
              icon={Lock}
              label={t("Che secret", "Secret Redaction")}
              badge={isRedactEnabled ? t("Bật", "On") : t("Tắt", "Off")}
              ok={isRedactEnabled}
            />
            <StatusRow
              icon={Cpu}
              label="LLM Engine"
              badge={(model || modelSplitConfig?.lead || "auto").split("/").pop() || "auto"}
              ok={Boolean(model || modelSplitConfig?.lead)}
            />
            <StatusRow
              icon={Database}
              label="SQLite Memory"
              badge={`${stats?.hosts || 0} hosts · ${findings.length} findings`}
              ok={assetTotal > 0 || findings.length > 0}
            />
            {(showLabs || labStatus?.running || hardLabStatus?.running) && (
              <>
                <StatusRow
                  icon={FlaskConical}
                  label="Mock Lab (:8888)"
                  badge={
                    labStatus?.running
                      ? `${t("Chạy", "Running")} (${labStatus.challenges_solved}/${labStatus.challenges_total})`
                      : t("Tắt", "Off")
                  }
                  ok={!!labStatus?.running}
                />
                <StatusRow
                  icon={FlaskConical}
                  label="Hard Lab (:8889)"
                  badge={
                    hardLabStatus?.running
                      ? `${t("Chạy", "Running")} (${hardLabStatus.challenges_solved}/${hardLabStatus.challenges_total})`
                      : t("Tắt", "Off")
                  }
                  ok={!!hardLabStatus?.running}
                />
              </>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

const StatusRow: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge: string;
  ok: boolean;
}> = ({ icon: Icon, label, badge, ok }) => (
  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-app-panel2/70 border border-app-border">
    <span className="flex items-center gap-2 text-app-text font-medium truncate">
      <Icon className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${
        ok
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          : "bg-app-panel border-app-border text-app-muted"
      }`}
    >
      {badge}
    </span>
  </div>
);
