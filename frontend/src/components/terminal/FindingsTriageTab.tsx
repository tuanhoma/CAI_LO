import React, { useMemo, useState } from "react";
import { ShieldAlert, FileJson, FileText, CheckCircle2, Search, KeyRound, Flame, AlertTriangle } from "lucide-react";
import { useCampaignStore } from "../../stores/useCampaignStore";
import { FindingItem } from "../../types";
import { redactSecrets } from "../../utils/redact";
import { Card, EmptyState, PageContainer, PageHeader, SecondaryButton, StatCard } from "../ui/Primitives";
import { useI18n } from "../../i18n";

const sevText: Record<string, string> = {
  CRITICAL: "text-rose-600 dark:text-rose-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  MEDIUM: "text-amber-600 dark:text-amber-400",
  LOW: "text-sky-600 dark:text-sky-400",
  INFO: "text-app-muted",
};

const sevBadge: Record<string, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  LOW: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  INFO: "bg-app-panel2 text-app-muted border-app-border",
};

export const FindingsTriageTab: React.FC = () => {
  const { findings, credentials, target, isRedactEnabled, setActivePage } = useCampaignStore();
  const { t } = useI18n();
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sevCount = (sev: FindingItem["severity"]) => findings.filter((f) => f.severity === sev).length;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return findings.filter((f) => {
      if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
      if (q) {
        const content = `${f.title} ${f.host} ${f.evidence || ""} ${f.source_tool || ""}`.toLowerCase();
        if (!content.includes(q)) return false;
      }
      return true;
    });
  }, [findings, filterSeverity, searchQuery]);

  const download = (data: string, mime: string, name: string) => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    let md = `# ${t("BÁO CÁO PHÁT HIỆN LỖ HỔNG", "VULNERABILITY FINDINGS REPORT")}\n`;
    md += `**${t("Mục tiêu", "Target")}:** \`${target || "None"}\`\n`;
    md += `**${t("Thời gian xuất", "Exported at")}:** \`${new Date().toISOString()}\`\n`;
    md += `**${t("Tổng số phát hiện", "Total findings")}:** ${findings.length}\n\n---\n\n`;
    findings.forEach((f, idx) => {
      const ev = redactSecrets(f.evidence || "", isRedactEnabled);
      md += `### ${idx + 1}. [${f.severity}] ${f.title}\n`;
      md += `- **Host:** \`${f.host}\`\n`;
      if (f.source_tool) md += `- **${t("Nguồn", "Source")}:** \`${f.source_tool}\`\n`;
      if (f.updated_at) md += `- **${t("Thời gian", "Time")}:** \`${f.updated_at}\`\n`;
      if (ev) md += `\n**${t("Bằng chứng", "Evidence")}:**\n\`\`\`\n${ev}\n\`\`\`\n`;
      md += `\n---\n\n`;
    });
    download(md, "text/markdown;charset=utf-8", `findings_report_${new Date().toISOString().slice(0, 10)}.md`);
  };

  const exportJson = () => {
    const safeFindings = findings.map((f) => ({
      ...f,
      evidence: f.evidence ? redactSecrets(f.evidence, isRedactEnabled) : f.evidence,
    }));
    const data = JSON.stringify({ target, export_date: new Date().toISOString(), findings: safeFindings }, null, 2);
    download(data, "application/json;charset=utf-8", `findings_${new Date().toISOString().slice(0, 10)}.json`);
  };

  return (
    <PageContainer fullHeight>
      <PageHeader
        title={t("Phát hiện", "Findings")}
        subtitle={`${findings.length} ${t("lỗ hổng ghi nhận · tổng hợp từ agent & terminal", "findings recorded · aggregated from agents & terminal")}`}
        actions={
          <>
            <SecondaryButton size="sm" onClick={exportMarkdown} disabled={findings.length === 0}>
              <FileText className="w-3.5 h-3.5" aria-hidden="true" /> {t("Xuất .md", "Export .md")}
            </SecondaryButton>
            <SecondaryButton size="sm" onClick={exportJson} disabled={findings.length === 0}>
              <FileJson className="w-3.5 h-3.5" aria-hidden="true" /> {t("Xuất .json", "Export .json")}
            </SecondaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 shrink-0">
        <StatCard
          icon={ShieldAlert}
          label={t("Tổng", "Total")}
          value={findings.length}
          active={filterSeverity === "ALL"}
          onClick={() => setFilterSeverity("ALL")}
        />
        <StatCard
          icon={Flame}
          label="Critical"
          value={sevCount("CRITICAL")}
          active={filterSeverity === "CRITICAL"}
          onClick={() => setFilterSeverity("CRITICAL")}
        />
        <StatCard
          icon={AlertTriangle}
          label="High"
          value={sevCount("HIGH")}
          active={filterSeverity === "HIGH"}
          onClick={() => setFilterSeverity("HIGH")}
        />
        <StatCard
          icon={AlertTriangle}
          label="Medium"
          value={sevCount("MEDIUM")}
          active={filterSeverity === "MEDIUM"}
          onClick={() => setFilterSeverity("MEDIUM")}
        />
        <StatCard
          icon={ShieldAlert}
          label="Low"
          value={sevCount("LOW")}
          active={filterSeverity === "LOW"}
          onClick={() => setFilterSeverity("LOW")}
        />
        <StatCard
          icon={KeyRound}
          label="Creds / Flags"
          value={credentials.length}
          onClick={() => setActivePage("memory")}
        />
      </div>

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-app-border bg-app-panel2/40 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="inline-flex rounded-lg border border-app-border bg-app-panel p-0.5 text-xs overflow-x-auto">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  filterSeverity === sev ? "bg-app-active text-app-text" : "text-app-muted hover:text-app-text"
                }`}
              >
                {sev === "ALL" ? t("Tất cả", "All") : sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-app-panel border border-app-border w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Tìm tiêu đề, host, evidence…", "Search title, host, evidence…")}
              aria-label={t("Tìm lỗ hổng", "Search findings")}
              className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={t("Chưa có phát hiện phù hợp", "No matching findings")}
              description={t(
                "Các lỗ hổng nghi ngờ hoặc đã xác minh PoC từ agent sẽ xuất hiện tại đây.",
                "Suspected or verified PoC vulnerabilities discovered by agents will appear here."
              )}
              action={
                findings.length === 0 ? (
                  <SecondaryButton size="sm" onClick={() => setActivePage("mission")}>
                    {t("Đi tới Chiến dịch", "Go to Mission")}
                  </SecondaryButton>
                ) : undefined
              }
              className="h-full min-h-[220px]"
            />
          ) : (
            filtered.map((f, idx) => {
              const safeEvidence = f.evidence ? redactSecrets(f.evidence, isRedactEnabled) : "";
              return (
                <div
                  key={f.id ?? idx}
                  className="p-3.5 rounded-xl bg-app-panel2/40 border border-app-border hover:border-app-text/20 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${
                        sevBadge[f.severity] || sevBadge.INFO
                      }`}
                    >
                      {f.severity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-app-text break-words">{f.title}</div>
                      <div className="text-xs text-app-muted flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        <span>
                          Host: <b className="text-app-text font-mono">{f.host}</b>
                        </span>
                        {f.source_tool && (
                          <span>
                            Tool: <b className={sevText.LOW}>{f.source_tool}</b>
                          </span>
                        )}
                        {f.updated_at && (
                          <span className="font-mono tabular-nums">{f.updated_at.split("T")[1]?.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {safeEvidence && (
                    <details className="mt-2.5 text-xs">
                      <summary className="text-app-accent hover:underline select-none cursor-pointer font-medium">
                        {t("Xem bằng chứng (Evidence)", "View evidence")}
                      </summary>
                      <pre className="mt-2 p-3 rounded-lg bg-app-panel border border-app-border text-app-text text-[11px] overflow-x-auto whitespace-pre-wrap break-words max-h-56 font-mono">
                        {safeEvidence}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </PageContainer>
  );
};
