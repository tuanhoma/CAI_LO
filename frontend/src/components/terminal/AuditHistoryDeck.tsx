import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, FileText, Search } from "lucide-react";
import { useCampaignStore } from "../../stores/useCampaignStore";
import { Card, EmptyState, PageContainer, PageHeader, SecondaryButton } from "../ui/Primitives";
import { useI18n } from "../../i18n";

export const AuditHistoryDeck: React.FC = () => {
  const { auditSessions, fetchAuditSessions, setTarget, setPrompt, setActivePage } = useCampaignStore();
  const { t } = useI18n();
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    fetchAuditSessions();
  }, []);

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return auditSessions;
    return auditSessions.filter(
      (s) =>
        s.session_id.toLowerCase().includes(q) ||
        (s.target || "").toLowerCase().includes(q) ||
        (s.agent || "").toLowerCase().includes(q)
    );
  }, [auditSessions, filterText]);

  const loadTargetIntoStore = (targetUrl: string) => {
    if (!targetUrl || targetUrl === "—") return;
    setTarget(targetUrl);
    setPrompt(
      t(
        `Đánh giá bảo mật và giải quyết mục tiêu ${targetUrl}.`,
        `Assess security and verify vulnerabilities on ${targetUrl}.`
      )
    );
    setActivePage("mission");
  };

  return (
    <PageContainer fullHeight>
      <PageHeader
        title={t("Lịch sử", "History")}
        subtitle={`${auditSessions.length} ${t("phiên pentest đã lưu trên đĩa (logs/sessions/)", "saved audit sessions on disk (logs/sessions/)")}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-panel border border-app-border w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder={t("Tìm ID, target, agent…", "Search ID, target, agent…")}
                aria-label={t("Tìm lịch sử phiên", "Search audit history")}
                className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
              />
            </div>
            <SecondaryButton size="sm" onClick={fetchAuditSessions} title={t("Làm mới lịch sử", "Refresh history")}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t("Làm mới", "Refresh")}</span>
            </SecondaryButton>
          </div>
        }
      />

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-4 flex-1 flex items-center justify-center">
            <EmptyState
              icon={FileText}
              title={t("Chưa có phiên tác chiến nào", "No audit sessions yet")}
              description={t(
                "Các phiên kiểm thử và báo cáo Markdown sẽ tự động lưu lại sau mỗi chiến dịch.",
                "Pentest sessions and Markdown reports are saved automatically after each run."
              )}
              className="w-full max-w-lg"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-app-panel2/90 backdrop-blur border-b border-app-border">
                <tr className="text-left text-[11px] uppercase tracking-wider text-app-muted">
                  <th className="py-2.5 px-4 font-medium">{t("Thời gian / ID", "Time / ID")}</th>
                  <th className="py-2.5 px-4 font-medium">{t("Mục tiêu", "Target")}</th>
                  <th className="py-2.5 px-4 font-medium">Agent & Model</th>
                  <th className="py-2.5 px-4 font-medium">{t("Trạng thái", "Status")}</th>
                  <th className="py-2.5 px-4 font-medium">{t("Lệnh", "Tools")}</th>
                  <th className="py-2.5 px-4 font-medium text-right">{t("Hành động", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/70">
                {filtered.map((s) => {
                  const dt = (s.created_at || "").replace("T", " ").slice(0, 19);
                  const shortId = s.session_id.slice(0, 8);
                  const isCompleted = s.status === "completed";
                  return (
                    <tr key={s.session_id} className="hover:bg-app-panel2/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-xs font-mono font-medium text-app-text tabular-nums">{dt || "—"}</div>
                        <div className="text-[11px] font-mono text-app-muted">{shortId}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="font-medium text-app-text truncate font-mono text-xs" title={s.target || undefined}>
                          {s.target || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="text-xs text-app-text truncate" title={s.agent}>
                          {s.agent}
                        </div>
                        <div className="text-[11px] text-app-muted font-mono truncate" title={s.model || undefined}>
                          {s.model || t("mặc định", "default")}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-app-muted tabular-nums font-mono">{s.tool_executions}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {s.target && s.target !== "—" && (
                            <button
                              type="button"
                              onClick={() => loadTargetIntoStore(s.target)}
                              className="px-2.5 py-1 rounded-md bg-app-panel2 border border-app-border text-xs text-app-muted hover:text-app-text transition-colors cursor-pointer"
                            >
                              {t("Nạp Target", "Load target")}
                            </button>
                          )}
                          {s.has_report && (
                            <a
                              href={`/api/v1/audit/sessions/${encodeURIComponent(s.session_id)}/report`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-md bg-app-primary text-app-primary-fg text-xs font-medium inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
                            >
                              <span>{t("Báo cáo", "Report")}</span>
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
