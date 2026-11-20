import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Cpu,
  Database,
  Sun,
  Moon,
  Trash2,
  Lock,
  Unlock,
  ChevronDown,
  Search,
  ShieldCheck,
  Check,
  Globe,
  Server,
  KeyRound,
  ShieldAlert,
  Waypoints,
  Languages,
  FlaskConical,
  ArrowUpRight,
} from "lucide-react";
import { useCampaignStore } from "../stores/useCampaignStore";
import { LabPanel } from "./MissionPage";
import {
  Card,
  ConfirmButton,
  EmptyState,
  inputCls,
  PageContainer,
  PageHeader,
  SecondaryButton,
  StatCard,
} from "../components/ui/Primitives";
import { useI18n } from "../i18n";

const RECOMMENDED_AGENTS = new Set([
  "kali_pentester_agent",
  "web_pentester_agent",
  "ctf_agent",
  "red_team_swarm_agent",
  "apt_agent",
]);

/* ---------- Agents ---------- */
export const AgentsPage: React.FC = () => {
  const { availableAgents, agent, setAgent, setActivePage } = useCampaignStore();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "agent" | "pattern">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableAgents
      .filter((a) => {
        if (kindFilter !== "all" && (a.type || "agent") !== kindFilter) return false;
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Number(RECOMMENDED_AGENTS.has(b.key)) - Number(RECOMMENDED_AGENTS.has(a.key)));
  }, [availableAgents, query, kindFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Agents"
        subtitle={`${availableAgents.length} ${t("agent khả dụng · chọn để gán vào Chiến dịch", "available agents · click to assign to Mission")}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-app-border bg-app-panel p-0.5 text-xs">
              {(["all", "agent", "pattern"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    kindFilter === k ? "bg-app-active text-app-text" : "text-app-muted hover:text-app-text"
                  }`}
                >
                  {k === "all" ? t("Tất cả", "All") : k === "agent" ? "Agent" : "Pattern"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-panel border border-app-border w-56">
              <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Tìm agent…", "Search agents…")}
                aria-label={t("Tìm agent", "Search agents")}
                className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
              />
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            availableAgents.length === 0
              ? t("Chưa nạp được danh sách agent", "Unable to load agent catalog")
              : t("Không tìm thấy agent phù hợp", "No matching agents")
          }
          description={t(
            "Kiểm tra kết nối backend FastAPI tại /api/v1/agents hoặc thử từ khóa khác.",
            "Check FastAPI backend connectivity at /api/v1/agents or adjust your search."
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((a) => {
            const active = agent === a.key;
            const toolCount = a.tools?.length || 0;
            return (
              <Card
                key={a.key}
                className={`p-4 flex flex-col transition-colors ${
                  active ? "ring-2 ring-app-accent/50 border-app-accent/60" : "hover:border-app-text/20"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-app-panel2 border border-app-border flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-app-text" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-sm text-app-text truncate">{a.name}</div>
                      {RECOMMENDED_AGENTS.has(a.key) && (
                        <span className="px-1.5 py-0.5 rounded bg-app-accent-soft text-app-accent text-[10px] font-medium shrink-0">
                          {t("Khuyên dùng", "Core")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-app-muted font-mono truncate">{a.key}</div>
                  </div>
                </div>
                {a.description && <p className="text-xs text-app-muted mt-2.5 line-clamp-3 leading-relaxed">{a.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-app-muted">
                    <span className="px-1.5 py-0.5 rounded bg-app-panel2 border border-app-border uppercase text-[10px]">
                      {a.type || "agent"}
                    </span>
                    <span className="font-mono tabular-nums">{toolCount} tools</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAgent(a.key);
                      setActivePage("mission");
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? "bg-app-primary text-app-primary-fg border-transparent font-medium"
                        : "bg-app-panel2 border-app-border text-app-muted hover:text-app-text"
                    }`}
                  >
                    {active ? t("Đang chọn", "Selected") : t("Dùng agent", "Use agent")}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
};

/* ---------- Models ---------- */
export const ModelsPage: React.FC = () => {
  const { availableModels, model, modelSplitConfig, setModel, setActivePage } = useCampaignStore();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");

  const providers = useMemo(() => {
    const counts = new Map<string, number>();
    availableModels.forEach((m) => {
      const p = m.provider || "other";
      counts.set(p, (counts.get(p) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([p]) => p);
  }, [availableModels]);

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    return availableModels.filter((m) => {
      if (providerFilter !== "ALL" && (m.provider || "other") !== providerFilter) return false;
      if (ql && !m.name.toLowerCase().includes(ql) && !(m.provider || "").toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [availableModels, q, providerFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Models"
        subtitle={`${availableModels.length} ${t("model · chọn để áp dụng cho Chiến dịch", "models · click to assign to Mission")}`}
        actions={
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-panel border border-app-border w-64">
            <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Tìm model hoặc provider…", "Search model or provider…")}
              aria-label={t("Tìm model", "Search models")}
              className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
            />
          </div>
        }
      />

      {(model || (modelSplitConfig && (modelSplitConfig.lead || modelSplitConfig.fast))) && (
        <Card className="p-3.5 mb-4 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-app-text font-medium flex-wrap">
            <Cpu className="w-4 h-4 text-app-accent shrink-0" aria-hidden="true" />
            <span>{t("Đang chọn:", "Active model:")}</span>
            <code className="px-2 py-0.5 rounded bg-app-panel2 border border-app-border font-mono">
              {model || modelSplitConfig?.lead || "auto"}
            </code>
            {modelSplitConfig?.lead && model && model !== modelSplitConfig.lead && (
              <span className="text-app-muted font-mono">(.env: {modelSplitConfig.lead})</span>
            )}
          </div>
          {modelSplitConfig?.split_active && (
            <div className="flex items-center gap-3 text-app-muted font-mono">
              <span>Fast: {modelSplitConfig.fast}</span>
              <span>Reason: {modelSplitConfig.reason}</span>
            </div>
          )}
        </Card>
      )}

      {providers.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <button
            type="button"
            onClick={() => setProviderFilter("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
              providerFilter === "ALL"
                ? "bg-app-active border-app-text/30 text-app-text font-medium"
                : "bg-app-panel border-app-border text-app-muted hover:text-app-text"
            }`}
          >
            {t("Tất cả", "All")}
          </button>
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProviderFilter(p)}
              className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                providerFilter === p
                  ? "bg-app-active border-app-text/30 text-app-text font-medium"
                  : "bg-app-panel border-app-border text-app-muted hover:text-app-text"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title={t("Không có model khớp", "No matching models")}
          description={t("Thử thay đổi bộ lọc provider hoặc từ khóa tìm kiếm.", "Try changing provider filter or search text.")}
        />
      ) : (
        <Card className="divide-y divide-app-border overflow-hidden">
          {list.slice(0, 120).map((m) => {
            const active = model === m.name;
            return (
              <div key={m.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-app-panel2/50 transition-colors">
                <Cpu className="w-4 h-4 text-app-muted shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-app-text font-mono truncate">{m.name}</div>
                  <div className="text-[11px] text-app-muted">
                    {m.provider ? `[${m.provider}]` : ""} {m.category || ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModel(m.name);
                    setActivePage("mission");
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border shrink-0 transition-colors cursor-pointer ${
                    active
                      ? "bg-app-primary text-app-primary-fg border-transparent font-medium"
                      : "bg-app-panel2 border-app-border text-app-muted hover:text-app-text"
                  }`}
                >
                  {active ? t("Đang chọn", "Selected") : t("Dùng", "Select")}
                </button>
              </div>
            );
          })}
        </Card>
      )}
    </PageContainer>
  );
};

/* ---------- Lab ---------- */
export const LabPage: React.FC = () => {
  const { labStatus, hardLabStatus, toggleLab, fillMockLabTarget, toggleHardLab, fillHardLabTarget, setActivePage } =
    useCampaignStore();
  const { t } = useI18n();
  return (
    <PageContainer>
      <PageHeader
        title={t("Phòng Lab", "Lab")}
        subtitle={t("Môi trường thực hành lỗ hổng cục bộ tích hợp sẵn", "Built-in local vulnerable web environments")}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LabPanel
          title={t("Mock Lab (Cổng 8888)", "Mock Lab (Port 8888)")}
          subtitle="OWASP Top 10 · SQLi · XSS · CSRF · IDOR · RCE · LFI"
          url="http://127.0.0.1:8888"
          running={!!labStatus?.running}
          solved={labStatus?.challenges_solved || 0}
          total={labStatus?.challenges_total || 7}
          challenges={labStatus?.challenges || []}
          onToggle={toggleLab}
          onFill={() => {
            fillMockLabTarget();
            setActivePage("mission");
          }}
        />
        <LabPanel
          title={t("Lab Nâng Cao (Cổng 8889)", "Advanced Lab (Port 8889)")}
          subtitle="SSTI (Jinja2) · UNION SQLi · JWT alg:none · SSRF"
          url="http://127.0.0.1:8889"
          running={!!hardLabStatus?.running}
          solved={hardLabStatus?.challenges_solved || 0}
          total={hardLabStatus?.challenges_total || 4}
          challenges={hardLabStatus?.challenges || []}
          onToggle={toggleHardLab}
          onFill={() => {
            fillHardLabTarget();
            setActivePage("mission");
          }}
        />
      </div>
    </PageContainer>
  );
};

/* ---------- Memory (Asset & Intel Explorer) ---------- */
type MemoryTab = "hosts" | "ports" | "endpoints" | "credentials" | "findings";

export const MemoryPage: React.FC = () => {
  const { memoryRaw, findings, credentials, clearMemory } = useCampaignStore();
  const { t } = useI18n();
  const [tab, setTab] = useState<MemoryTab>("hosts");
  const [q, setQ] = useState("");

  const s = memoryRaw?.stats;
  const hosts = memoryRaw?.hosts || [];
  const ports = memoryRaw?.ports || [];
  const endpoints = memoryRaw?.endpoints || [];
  const ql = q.trim().toLowerCase();

  const tabs: Array<{ id: MemoryTab; label: string; count: number }> = [
    { id: "hosts", label: "Hosts", count: s?.hosts ?? hosts.length },
    { id: "ports", label: "Ports", count: s?.ports ?? ports.length },
    { id: "endpoints", label: "Endpoints", count: s?.endpoints ?? endpoints.length },
    { id: "credentials", label: "Credentials & Flags", count: s?.credentials ?? credentials.length },
    { id: "findings", label: "Findings", count: s?.findings ?? findings.length },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t("Trí nhớ", "Memory")}
        subtitle={t(
          "Kho dữ kiện chiến dịch SQLite (hosts, ports, endpoints, credentials & findings)",
          "Persistent SQLite campaign intelligence across hosts, ports, endpoints, creds & findings"
        )}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-app-panel border border-app-border w-56">
              <Search className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("Lọc trong bảng…", "Filter table…")}
                aria-label={t("Lọc bộ nhớ chiến dịch", "Filter campaign memory")}
                className="w-full bg-transparent text-xs text-app-text placeholder:text-app-muted/70 focus:outline-none"
              />
            </div>
            <ConfirmButton
              label={t("Xóa bộ nhớ", "Clear memory")}
              confirmLabel={t("Xác nhận xóa SQLite?", "Confirm wipe SQLite?")}
              icon={Trash2}
              onConfirm={clearMemory}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <StatCard icon={Globe} label="Hosts" value={s?.hosts ?? hosts.length} active={tab === "hosts"} onClick={() => setTab("hosts")} />
        <StatCard icon={Server} label="Ports" value={s?.ports ?? ports.length} active={tab === "ports"} onClick={() => setTab("ports")} />
        <StatCard icon={Waypoints} label="Endpoints" value={s?.endpoints ?? endpoints.length} active={tab === "endpoints"} onClick={() => setTab("endpoints")} />
        <StatCard icon={KeyRound} label="Cred / Flag" value={s?.credentials ?? credentials.length} active={tab === "credentials"} onClick={() => setTab("credentials")} />
        <StatCard icon={ShieldAlert} label="Findings" value={s?.findings ?? findings.length} active={tab === "findings"} onClick={() => setTab("findings")} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-1 px-3 pt-2.5 border-b border-app-border overflow-x-auto bg-app-panel2/40">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? "border-app-text text-app-text"
                    : "border-transparent text-app-muted hover:text-app-text"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-app-panel border border-app-border text-app-muted">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {tab === "hosts" && (
            <MemoryTable
              emptyText={t("Chưa ghi nhận host nào.", "No hosts recorded yet.")}
              headers={["Host", "Hostname", "OS Guess", "Last seen"]}
              rows={hosts
                .filter((h) => !ql || JSON.stringify(h).toLowerCase().includes(ql))
                .map((h) => [
                  <span className="font-mono font-medium text-app-text">{h.host}</span>,
                  h.hostname || "—",
                  h.os_guess || "—",
                  <span className="font-mono text-xs text-app-muted">{(h.last_seen || "").slice(0, 19).replace("T", " ")}</span>,
                ])}
            />
          )}

          {tab === "ports" && (
            <MemoryTable
              emptyText={t("Chưa ghi nhận cổng mở nào.", "No open ports recorded yet.")}
              headers={["Host", "Port / Proto", "State", "Service", "Version"]}
              rows={ports
                .filter((p) => !ql || JSON.stringify(p).toLowerCase().includes(ql))
                .map((p) => [
                  <span className="font-mono text-app-text">{p.host}</span>,
                  <span className="font-mono font-medium text-app-text">
                    {p.port}/{p.proto}
                  </span>,
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">{p.state}</span>,
                  p.service || "—",
                  <span className="text-xs text-app-muted">{p.version || "—"}</span>,
                ])}
            />
          )}

          {tab === "endpoints" && (
            <MemoryTable
              emptyText={t("Chưa ghi nhận web endpoint nào.", "No web endpoints recorded yet.")}
              headers={["Host", "URL", "Status", "Tool"]}
              rows={endpoints
                .filter((ep) => !ql || JSON.stringify(ep).toLowerCase().includes(ql))
                .map((ep) => [
                  <span className="font-mono text-xs text-app-muted">{ep.host}</span>,
                  <span className="font-mono text-xs text-app-text break-all">{ep.url}</span>,
                  <span className="font-mono text-xs tabular-nums">{ep.status_code ?? "—"}</span>,
                  <span className="text-xs text-app-muted">{ep.source_tool || "—"}</span>,
                ])}
            />
          )}

          {tab === "credentials" && (
            <MemoryTable
              emptyText={t("Chưa thu thập được credential hay flag nào.", "No credentials or flags captured yet.")}
              headers={["Type", "Host", "Username", "Secret", "Service"]}
              rows={credentials
                .filter((c) => !ql || JSON.stringify(c).toLowerCase().includes(ql))
                .map((c) => [
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium uppercase">
                    {c.secret_type}
                  </span>,
                  <span className="font-mono text-xs">{c.host}</span>,
                  <span className="font-mono text-xs">{c.username || "—"}</span>,
                  <span className="font-mono text-xs text-app-text break-all">{c.secret}</span>,
                  <span className="text-xs text-app-muted">{c.service || "—"}</span>,
                ])}
            />
          )}

          {tab === "findings" && (
            <MemoryTable
              emptyText={t("Chưa có phát hiện lỗ hổng nào.", "No findings recorded yet.")}
              headers={["Severity", "Title", "Host", "Source"]}
              rows={findings
                .filter((f) => !ql || JSON.stringify(f).toLowerCase().includes(ql))
                .map((f) => [
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{f.severity}</span>,
                  <span className="font-medium text-app-text">{f.title}</span>,
                  <span className="font-mono text-xs text-app-muted">{f.host}</span>,
                  <span className="text-xs text-app-muted">{f.source_tool || "—"}</span>,
                ])}
            />
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

const MemoryTable: React.FC<{
  headers: string[];
  rows: React.ReactNode[][];
  emptyText: string;
}> = ({ headers, rows, emptyText }) => {
  if (rows.length === 0) {
    return <EmptyState icon={Database} title={emptyText} className="py-10" />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-app-muted border-b border-app-border">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border/60">
          {rows.map((cells, idx) => (
            <tr key={idx} className="hover:bg-app-panel2/45 transition-colors">
              {cells.map((cell, ci) => (
                <td key={ci} className="py-2.5 pr-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- Settings ---------- */
export const SettingsPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    showLabs,
    toggleShowLabs,
    setActivePage,
    isRedactEnabled,
    toggleRedact,
    clearTerminalLogs,
    clearMemory,
    scopeConfig,
    fetchScopeConfig,
    updateScopeConfig,
  } = useCampaignStore();
  const { lang, setLang, t } = useI18n();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    try {
      return localStorage.getItem("cai-api-base") || "";
    } catch {
      return "";
    }
  });
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("cai-api-key") || "";
    } catch {
      return "";
    }
  });
  const [scopeInput, setScopeInput] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    fetchScopeConfig();
  }, []);

  useEffect(() => {
    if (scopeConfig?.scope?.length) {
      setScopeInput(scopeConfig.scope.join(", "));
    }
  }, [scopeConfig]);

  const saveConnection = () => {
    try {
      localStorage.setItem("cai-api-base", apiBaseUrl.trim());
      localStorage.setItem("cai-api-key", apiKey.trim());
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch {}
  };

  return (
    <PageContainer className="max-w-[900px]">
      <PageHeader
        title={t("Cài đặt", "Settings")}
        subtitle={t(
          "Tùy chọn ngôn ngữ, giao diện, Scope Guard và bảo mật",
          "Display language, appearance, Scope Guard, and security preferences"
        )}
      />

      <div className="space-y-4">
        <Card className="divide-y divide-app-border">
          <Row
            label={t("Ngôn ngữ hiển thị", "Display language")}
            desc={t("Chuyển đổi nhanh giao diện giữa Tiếng Việt và English", "Switch console UI between Vietnamese and English")}
          >
            <div className="inline-flex items-center gap-1 rounded-lg border border-app-border bg-app-panel2 p-0.5 text-xs">
              <Languages className="w-3.5 h-3.5 text-app-muted ml-2 mr-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setLang("vi")}
                aria-pressed={lang === "vi"}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  lang === "vi" ? "bg-app-panel text-app-text shadow-card" : "text-app-muted hover:text-app-text"
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  lang === "en" ? "bg-app-panel text-app-text shadow-card" : "text-app-muted hover:text-app-text"
                }`}
              >
                English
              </button>
            </div>
          </Row>

          <Row
            label={t("Giao diện (Theme)", "Appearance")}
            desc={t("Chuyển đổi giữa Light Mode tối giản và Dark Mode", "Toggle between clean Light Mode and Dark Mode")}
          >
            <SecondaryButton size="sm" onClick={toggleTheme}>
              {theme === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === "light" ? "Light" : "Dark"}</span>
            </SecondaryButton>
          </Row>

          <Row
            label={t("Chế độ Practice Lab (Dev/Test)", "Practice Lab mode (Dev/Test)")}
            desc={t(
              "Hiện mục Phòng Lab cục bộ (:8888 / :8889) trên thanh điều hướng để kiểm thử offline",
              "Show local vulnerable Practice Labs (:8888 / :8889) in sidebar for offline agent testing"
            )}
          >
            <div className="inline-flex items-center gap-2">
              {showLabs && (
                <button
                  type="button"
                  onClick={() => setActivePage("lab")}
                  className="text-xs text-app-accent hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t("Mở Lab", "Open")}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleShowLabs}
                aria-pressed={showLabs}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  showLabs
                    ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
                    : "bg-app-panel2 border-app-border text-app-muted"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{showLabs ? t("Đang bật", "Enabled") : t("Đang tắt", "Hidden")}</span>
              </button>
            </div>
          </Row>

          <Row
            label={t("Che secret trong log & báo cáo", "Redact secrets in logs & exports")}
            desc={t("Tự động ẩn Bearer/Basic token, JWT, API key và mật khẩu", "Mask Bearer/Basic tokens, JWTs, API keys, and passwords")}
          >
            <button
              type="button"
              onClick={toggleRedact}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isRedactEnabled
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
                  : "bg-app-panel2 border-app-border text-app-muted"
              }`}
            >
              {isRedactEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isRedactEnabled ? t("Đang bật", "Enabled") : t("Đang tắt", "Disabled")}</span>
            </button>
          </Row>

          <Row
            label={t("Xóa log terminal", "Clear terminal logs")}
            desc={t("Dọn bộ đệm đầu ra của Kali Interactive Terminal", "Clear buffered output of Kali Interactive Terminal")}
          >
            <ConfirmButton
              label={t("Xóa log", "Clear logs")}
              confirmLabel={t("Xác nhận xóa?", "Confirm clear?")}
              icon={Trash2}
              onConfirm={clearTerminalLogs}
            />
          </Row>

          <Row
            label={t("Xóa trí nhớ chiến dịch", "Clear campaign memory")}
            desc={t(
              "Xóa toàn bộ hosts, ports, endpoints, credentials & findings trong SQLite",
              "Wipe all stored hosts, ports, endpoints, credentials & findings in SQLite"
            )}
          >
            <ConfirmButton
              label={t("Xóa bộ nhớ", "Clear memory")}
              confirmLabel={t("Xác nhận xóa SQLite?", "Confirm wipe SQLite?")}
              icon={Trash2}
              onConfirm={clearMemory}
            />
          </Row>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-app-muted" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-app-text">Scope Guard (Rules of Engagement)</div>
                <div className="text-xs text-app-muted">
                  {t(
                    "Chặn mọi lệnh vượt ra ngoài phạm vi domain/IP được phép",
                    "Block commands targeting hosts outside the authorized scope"
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateScopeConfig(scopeInput, !(scopeConfig?.enabled ?? false))}
              className={`px-2.5 py-1 rounded-md text-xs border font-medium cursor-pointer ${
                scopeConfig?.enabled
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
                  : "bg-app-panel2 border-app-border text-app-muted"
              }`}
            >
              {scopeConfig?.enabled ? t("Đang bật", "Enabled") : t("Đang tắt", "Disabled")}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={scopeInput}
              onChange={(e) => setScopeInput(e.target.value)}
              placeholder="vd: 192.168.106.1, example.com"
              aria-label={t("Phạm vi Scope Guard", "Scope Guard targets")}
              className={`${inputCls} font-mono text-xs`}
            />
            <SecondaryButton size="sm" onClick={() => updateScopeConfig(scopeInput, scopeConfig?.enabled ?? true)}>
              {t("Lưu Scope", "Save scope")}
            </SecondaryButton>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 text-sm font-medium text-app-text flex items-center justify-between hover:bg-app-panel2/60 transition-colors cursor-pointer"
          >
            <span>{t("Cấu hình kết nối API & Xác thực", "API connection & authentication")}</span>
            <ChevronDown
              className={`w-4 h-4 text-app-muted transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {showAdvanced && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-app-border">
              <div>
                <label htmlFor="settings-api-base" className="text-xs font-medium text-app-muted">
                  API Base URL
                </label>
                <input
                  id="settings-api-base"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder={t("/ (cùng máy chủ) hoặc http://127.0.0.1:8000", "/ (same origin) or http://127.0.0.1:8000")}
                  className={`${inputCls} mt-1 font-mono`}
                />
              </div>
              <div>
                <label htmlFor="settings-api-key" className="text-xs font-medium text-app-muted">
                  {t("API Key (chỉ lưu trên trình duyệt này)", "API Key (stored locally in this browser)")}
                </label>
                <input
                  id="settings-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="X-CAI-API-Key"
                  className={`${inputCls} mt-1 font-mono`}
                />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-app-muted leading-relaxed">
                  {t(
                    "Chỉ dùng cho mục tiêu được ủy quyền kiểm thử. Không mở ra Internet khi chưa bật xác thực.",
                    "Use only against authorized targets. Do not expose publicly without authentication."
                  )}
                </p>
                <SecondaryButton size="sm" onClick={saveConnection}>
                  {savedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> {t("Đã lưu", "Saved")}
                    </>
                  ) : (
                    t("Lưu kết nối", "Save connection")
                  )}
                </SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3.5">
    <div className="min-w-0">
      <div className="text-sm font-medium text-app-text">{label}</div>
      {desc && <div className="text-xs text-app-muted mt-0.5">{desc}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);
