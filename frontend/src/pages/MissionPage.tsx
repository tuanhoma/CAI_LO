import React, { useState } from "react";
import {
  Target,
  Bot,
  Cpu,
  Layers,
  Zap,
  Play,
  Square,
  RotateCcw,
  Database,
  Server,
  Copy,
  Check,
  ExternalLink,
  FlaskConical,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useCampaignStore } from "../stores/useCampaignStore";
import {
  Card,
  ConfirmButton,
  FieldLabel,
  inputCls,
  PageContainer,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
} from "../components/ui/Primitives";
import { useI18n } from "../i18n";

const quickModels = [
  { label: "Gemini 3.5 Lite", val: "gemini/gemini-3.5-flash-lite" },
  { label: "Gemini 3.1 Lite", val: "gemini/gemini-3.1-flash-lite" },
  { label: "Groq GPT-OSS 20B", val: "groq/openai/gpt-oss-20b" },
  { label: "Ollama Local", val: "ollama/qwen2.5-coder:7b" },
];

export const MissionPage: React.FC = () => {
  const {
    target,
    prompt,
    agent,
    model,
    maxTurns,
    isAutonomy,
    isRunning,
    statusText,
    turnsUsed,
    availableAgents,
    availableModels,
    modelSplitConfig,
    runnerStatus,
    scopeConfig,
    isRedactEnabled,
    memoryRaw,
    clearMemory,
    setTarget,
    setPrompt,
    setAgent,
    setModel,
    setMaxTurns,
    setIsAutonomy,
    startMission,
    stopMission,
    setActivePage,
  } = useCampaignStore();
  const { t } = useI18n();

  const [copied, setCopied] = useState(false);
  const [runnerCmdMode, setRunnerCmdMode] = useState<"setup" | "auto">("setup");
  const [hostChoice, setHostChoice] = useState<string>(() => {
    try {
      return localStorage.getItem("cai-runner-host-choice") || "auto";
    } catch {
      return "auto";
    }
  });
  const [customHostIp, setCustomHostIp] = useState<string>(() => {
    try {
      return localStorage.getItem("cai-runner-custom-ip") || "";
    } catch {
      return "";
    }
  });

  const builtinAgents = [
    {
      group: t("Đơn Agent (Khuyên dùng — Kali VM)", "Single Agent (Recommended — Kali VM)"),
      value: "kali_pentester_agent",
      label: t("Kali Pentester (Agent chính)", "Kali Pentester (Primary Agent)"),
    },
    {
      group: t("Đơn Agent (Khuyên dùng — Kali VM)", "Single Agent (Recommended — Kali VM)"),
      value: "web_pentester_agent",
      label: "Web Pentester (Web/API)",
    },
    {
      group: t("Đơn Agent (Khuyên dùng — Kali VM)", "Single Agent (Recommended — Kali VM)"),
      value: "ctf_agent",
      label: "CTF Agent (Challenge & Flag)",
    },
    {
      group: t("Đa Agent (Swarm / APT)", "Multi-Agent (Swarm / APT)"),
      value: "red_team_swarm_agent",
      label: "Swarm Orchestrator",
    },
    {
      group: t("Đa Agent (Swarm / APT)", "Multi-Agent (Swarm / APT)"),
      value: "apt_agent",
      label: "APT Simulation Agent",
    },
  ];

  const builtinKeys = new Set(builtinAgents.map((a) => a.value));
  const extraAgents = availableAgents.filter((a) => !builtinKeys.has(a.key));

  const promptTemplates = [
    {
      label: "Web OWASP Top 10",
      build: (tgt: string) =>
        t(
          `Khảo sát và đánh giá bảo mật toàn diện mục tiêu ${tgt || "<target>"}. Rà quét endpoint, kiểm thử SQLi, XSS, CSRF, IDOR, LFI, Command Injection, xác minh PoC và viết báo cáo kèm khuyến nghị.`,
          `Assess security on ${tgt || "<target>"} across OWASP Top 10 (SQLi, XSS, CSRF, IDOR, LFI, Command Injection), verify PoCs, and generate a remediation report.`
        ),
    },
    {
      label: t("Recon & Quét cổng", "Recon & Port Scan"),
      build: (tgt: string) =>
        t(
          `Thực hiện trinh sát hạ tầng và dịch vụ trên ${tgt || "<target>"}: quét cổng mở (nmap), nhận diện phiên bản dịch vụ, kiểm tra thư mục/API ẩn và liệt kê bề mặt tấn công.`,
          `Perform infrastructure and service reconnaissance on ${tgt || "<target>"}: scan open ports (nmap), fingerprint services, enumerate hidden directories/APIs, and map attack surface.`
        ),
    },
    {
      label: "API Security Audit",
      build: (tgt: string) =>
        t(
          `Kiểm thử bảo mật API tại ${tgt || "<target>"}: kiểm tra xác thực JWT/Session, phân quyền BOLA/IDOR, injection, SSRF và lộ thông tin cấu hình.`,
          `Audit API security at ${tgt || "<target>"}: test JWT/Session auth, BOLA/IDOR authorization, injection, SSRF, and configuration exposure.`
        ),
    },
  ];

  const agentGroups = Array.from(new Set(builtinAgents.map((a) => a.group)));
  const isLocalhost = target.includes("127.0.0.1") || target.includes("localhost");

  const endpoints =
    runnerStatus?.controller_endpoints && runnerStatus.controller_endpoints.length > 0
      ? runnerStatus.controller_endpoints
      : (runnerStatus?.controller_ips || []).map((ip) => ({ ip, label: "Host IP" }));

  const autoIp = runnerStatus?.preferred_ip || endpoints[0]?.ip || "127.0.0.1";
  const resolvedChoiceExists = hostChoice === "auto" || hostChoice === "__custom__" || endpoints.some((e) => e.ip === hostChoice);
  const effectiveChoice = resolvedChoiceExists ? hostChoice : "auto";
  const hostIp =
    effectiveChoice === "__custom__"
      ? customHostIp.trim() || autoIp
      : effectiveChoice === "auto"
        ? autoIp
        : effectiveChoice;

  const browserPort = typeof window !== "undefined" ? window.location.port : "";
  const activePort = browserPort && browserPort !== "5173" ? browserPort : String(runnerStatus?.port || 8000);
  const runnerToken = runnerStatus?.token || "cai-kali-secret";
  const runnerCmd =
    runnerCmdMode === "auto"
      ? `python3 cai_runner.py${activePort !== "8000" ? ` --port ${activePort}` : ""} --token ${runnerToken}`
      : `curl -s http://${hostIp}:${activePort}/cai_runner.py -o cai_runner.py && python3 cai_runner.py --server http://${hostIp}:${activePort} --token ${runnerToken}`;

  const memStats = [
    { label: "Hosts", value: memoryRaw?.stats?.hosts || 0, cls: "text-app-text" },
    { label: t("Cổng", "Ports"), value: memoryRaw?.stats?.ports || 0, cls: "text-app-text" },
    { label: "Endpoints", value: memoryRaw?.stats?.endpoints || 0, cls: "text-app-text" },
    { label: "Creds", value: memoryRaw?.stats?.credentials || 0, cls: "text-amber-600 dark:text-amber-400" },
    { label: t("Lỗ hổng", "Findings"), value: memoryRaw?.stats?.findings || 0, cls: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t("Chiến dịch", "Mission")}
        subtitle={t(
          "Thiết lập phạm vi RoE, agent điều phối và phát động chiến dịch pentest",
          "Configure RoE scope, select agent & model, and launch autonomous testing"
        )}
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={() => {
                setTarget("");
                setPrompt("");
              }}
              disabled={!target && !prompt}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("Xóa biểu mẫu", "Clear form")}</span>
            </SecondaryButton>
            <SecondaryButton size="sm" onClick={() => setActivePage("agent_log")}>
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("Nhật ký Agent", "Agent log")}</span>
            </SecondaryButton>
          </div>
        }
      />

      {isRunning && (
        <Card className="p-3.5 mb-4 border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-sm font-medium text-app-text truncate">
              {t("Đang tác chiến", "Mission running")} ·{" "}
              <span className="font-mono tabular-nums">
                {turnsUsed}/{maxTurns} {t("lượt", "turns")}
              </span>
            </div>
            {statusText && <span className="text-xs text-app-muted truncate hidden sm:inline">— {statusText}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SecondaryButton size="sm" onClick={() => setActivePage("agent_log")}>
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> {t("Xem Agent log", "View stream")}
            </SecondaryButton>
            <button
              type="button"
              onClick={stopMission}
              className="px-3 py-1.5 rounded-lg bg-rose-500/12 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-rose-500/20 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" /> {t("Dừng", "Stop")}
            </button>
          </div>
        </Card>
      )}

      {/* Balanced 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card className="p-4 sm:p-5 space-y-3.5">
            <div>
              <FieldLabel
                htmlFor="mission-target"
                icon={Target}
                hint={t("Scope Guard tự động khóa theo target", "Scope Guard locks to target")}
              >
                {t("Mục tiêu (Scope RoE)", "Target (Scope RoE)")}
              </FieldLabel>
              <input
                id="mission-target"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t("vd: https://target.example.com hoặc 192.168.1.50", "e.g. https://target.example.com or 192.168.1.50")}
                className={`${inputCls} font-mono`}
              />
              {runnerStatus?.active && isLocalhost && (
                <div className="mt-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 flex-wrap">
                  <p className="leading-snug flex-1 min-w-[200px]">
                    {t(
                      "127.0.0.1 trỏ tới nội bộ máy Kali. Nếu dịch vụ mục tiêu chạy trên Windows host, hãy chuyển sang IP card mạng host.",
                      "127.0.0.1 points inside Kali VM. If the target runs on Windows host, switch to host adapter IP."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTarget(target.replace("127.0.0.1", hostIp).replace("localhost", hostIp));
                      setPrompt(prompt.replace(/127\.0\.0\.1/g, hostIp).replace(/localhost/g, hostIp));
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    {t("Đổi sang", "Switch to")} {hostIp}
                  </button>
                </div>
              )}
            </div>

            <div>
              <FieldLabel
                htmlFor="mission-prompt"
                icon={Bot}
                hint={t("Mô tả mục tiêu kiểm thử & yêu cầu đầu ra", "Describe objectives & deliverables")}
              >
                {t("Chỉ thị tác chiến (Prompt)", "Mission prompt")}
              </FieldLabel>
              <textarea
                id="mission-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t(
                  "Nhập yêu cầu kiểm thử, phạm vi cho phép và định dạng báo cáo mong muốn...",
                  "Describe testing scope, allowed methods, and expected findings report..."
                )}
                className={`${inputCls} resize-y leading-relaxed`}
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-app-muted mr-1">{t("Mẫu nhanh:", "Templates:")}</span>
                {promptTemplates.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => setPrompt(tpl.build(target))}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-app-panel2 border border-app-border text-app-muted hover:text-app-text hover:border-app-text/25 transition-colors cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-center">
            <div>
              <FieldLabel
                htmlFor="mission-agent"
                icon={Layers}
                hint={
                  availableAgents.length > 0
                    ? `${availableAgents.length} ${t("agents sẵn sàng", "agents ready")}`
                    : t("Mặc định", "Default")
                }
              >
                {t("Agent phụ trách", "Assigned agent")}
              </FieldLabel>
              <select id="mission-agent" value={agent} onChange={(e) => setAgent(e.target.value)} className={inputCls}>
                {agentGroups.map((g) => (
                  <optgroup key={g} label={g}>
                    {builtinAgents
                      .filter((a) => a.group === g)
                      .map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                  </optgroup>
                ))}
                {extraAgents.length > 0 && (
                  <optgroup label={t("Agent chuyên biệt khác", "Other specialized agents")}>
                    {extraAgents.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.name} ({a.key})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <FieldLabel
                htmlFor="mission-model"
                icon={Cpu}
                hint={
                  modelSplitConfig?.lead
                    ? `.env: ${modelSplitConfig.lead}`
                    : t("Gõ để tìm hoặc nhập tên model", "Type to search or enter model")
                }
              >
                Model (LLM)
              </FieldLabel>
              <input
                id="mission-model"
                type="text"
                list="cai-model-list"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={t("(tự động — theo cấu hình .env)", "(auto — from .env config)")}
                className={`${inputCls} font-mono`}
              />
              <datalist id="cai-model-list">
                {quickModels.map((m) => (
                  <option key={m.val} value={m.val} />
                ))}
                {availableModels.slice(0, 60).map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.provider ? `[${m.provider}] ${m.name}` : m.name}
                  </option>
                ))}
              </datalist>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {quickModels.map((qm) => (
                  <button
                    key={qm.val}
                    type="button"
                    onClick={() => setModel(qm.val)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      model === qm.val
                        ? "bg-app-active border-app-text/30 text-app-text font-medium"
                        : "bg-app-panel2 border-app-border text-app-muted hover:text-app-text"
                    }`}
                  >
                    {qm.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right column — aligned flush bottom with left column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="mission-turns">{t("Ngân sách lượt", "Turn budget")}</FieldLabel>
                <input
                  id="mission-turns"
                  type="number"
                  min={1}
                  max={300}
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(parseInt(e.target.value, 10) || 30)}
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </div>
              <div className="flex items-end">
                <label
                  htmlFor="mission-autonomy"
                  className="flex items-center justify-between w-full h-[38px] px-3 rounded-lg bg-app-panel2 border border-app-border cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-app-text">
                    <Zap className="w-3.5 h-3.5 text-app-accent" aria-hidden="true" />
                    <span>Autonomy</span>
                  </span>
                  <input
                    id="mission-autonomy"
                    type="checkbox"
                    checked={isAutonomy}
                    onChange={(e) => setIsAutonomy(e.target.checked)}
                    className="w-4 h-4 accent-app-accent cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-app-muted mr-0.5">{t("Mốc nhanh:", "Presets:")}</span>
              {[30, 60, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMaxTurns(val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] border tabular-nums transition-colors cursor-pointer ${
                    maxTurns === val
                      ? "bg-app-active border-app-text/30 text-app-text font-medium"
                      : "bg-app-panel2 border-app-border text-app-muted hover:text-app-text"
                  }`}
                >
                  {val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMaxTurns(200);
                  setIsAutonomy(true);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors cursor-pointer ${
                  maxTurns >= 150
                    ? "bg-app-active border-app-text/30 text-app-text font-medium"
                    : "bg-app-panel2 border-app-border text-app-muted hover:text-app-text"
                }`}
              >
                {t("200 · Tự dừng khi đạt mục tiêu", "200 · Auto-stop on goal")}
              </button>
            </div>

            <div className="pt-1 border-t border-app-border/70">
              {!isRunning ? (
                <PrimaryButton
                  onClick={startMission}
                  disabled={!prompt.trim() && !target.trim()}
                  className="w-full py-2.5"
                >
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>{t("Phát động chiến dịch", "Start mission")}</span>
                </PrimaryButton>
              ) : (
                <button
                  type="button"
                  onClick={stopMission}
                  className="w-full py-2.5 px-4 rounded-lg bg-rose-500/12 border border-rose-500/50 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>{t("Dừng chiến dịch", "Stop mission")}</span>
                </button>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold text-app-text text-sm">
                <Server className="w-4 h-4 text-app-muted" aria-hidden="true" />
                <span>Kali VM Sandbox</span>
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                  runnerStatus?.active
                    ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
                    : "bg-app-panel2 border-app-border text-app-muted"
                }`}
              >
                {runnerStatus?.active ? "Online" : "Offline"}
              </span>
            </div>

            <p className="text-xs text-app-muted leading-snug">
              {runnerStatus?.active && runnerStatus.runners?.[0] ? (
                <>
                  {runnerStatus.runners[0].hostname} ({runnerStatus.runners[0].ip}) ·{" "}
                  <b className="text-app-text">
                    {runnerStatus.runners[0].tools?.length || 28} {t("công cụ", "tools")}
                  </b>
                </>
              ) : (
                t(
                  "Chọn card mạng cùng lớp với Kali VM (hoặc dùng Auto IP sau khi đã tải script).",
                  "Pick the adapter subnet matching your Kali VM (or use Auto IP once script is downloaded)."
                )
              )}
            </p>

            {/* Adapter IP Selector & Mode Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                aria-label={t("Chọn IP kết nối tới Controller", "Select controller host IP")}
                value={effectiveChoice}
                onChange={(e) => {
                  const val = e.target.value;
                  setHostChoice(val);
                  try {
                    localStorage.setItem("cai-runner-host-choice", val);
                  } catch {}
                }}
                className="flex-1 min-w-[160px] h-8 px-2.5 rounded-lg bg-app-panel2 border border-app-border text-xs text-app-text font-mono focus:outline-none focus:border-app-text/40"
              >
                <option value="auto">
                  {t("Tự động", "Auto")}: {autoIp}
                </option>
                {endpoints.map((ep) => (
                  <option key={ep.ip} value={ep.ip}>
                    {ep.ip} · {ep.label}
                  </option>
                ))}
                <option value="__custom__">{t("Nhập IP khác…", "Custom IP…")}</option>
              </select>

              <div className="inline-flex rounded-lg border border-app-border bg-app-panel2 p-0.5 text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => setRunnerCmdMode("setup")}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    runnerCmdMode === "setup" ? "bg-app-panel text-app-text shadow-card" : "text-app-muted hover:text-app-text"
                  }`}
                >
                  {t("Tải & chạy", "First run")}
                </button>
                <button
                  type="button"
                  onClick={() => setRunnerCmdMode("auto")}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    runnerCmdMode === "auto" ? "bg-app-panel text-app-text shadow-card" : "text-app-muted hover:text-app-text"
                  }`}
                >
                  Auto IP
                </button>
              </div>
            </div>

            {effectiveChoice === "__custom__" && (
              <input
                type="text"
                value={customHostIp}
                onChange={(e) => {
                  setCustomHostIp(e.target.value);
                  try {
                    localStorage.setItem("cai-runner-custom-ip", e.target.value);
                  } catch {}
                }}
                placeholder={t("Nhập IP máy chủ (vd: 192.168.1.50)", "Enter host IP (e.g. 192.168.1.50)")}
                aria-label={t("IP tùy chỉnh", "Custom host IP")}
                className="w-full h-8 px-2.5 rounded-lg bg-app-panel2 border border-app-border text-xs font-mono text-app-text focus:outline-none focus:border-app-text/40"
              />
            )}

            <div className="flex items-center gap-1.5">
              <code className="flex-1 p-2 rounded-lg bg-app-panel2 border border-app-border text-[10px] text-app-text break-all font-mono select-all">
                {runnerCmd}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(runnerCmd);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                aria-label={t("Sao chép lệnh Kali runner", "Copy Kali runner command")}
                className="p-2 rounded-lg bg-app-panel2 border border-app-border text-app-muted hover:text-app-text transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActivePage("memory")}
                className="flex items-center gap-2 font-semibold text-app-text text-sm hover:text-app-accent transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-app-muted" aria-hidden="true" />
                <span>{t("Trí nhớ chiến dịch", "Campaign memory")}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-app-muted" aria-hidden="true" />
              </button>
              <ConfirmButton label={t("Xóa", "Clear")} confirmLabel={t("Xóa bộ nhớ?", "Confirm?")} onConfirm={clearMemory} />
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {memStats.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setActivePage("memory")}
                  className="rounded-lg bg-app-panel2 border border-app-border/80 px-2 py-2 text-center hover:border-app-text/25 transition-colors cursor-pointer"
                >
                  <div className={`text-sm font-semibold tabular-nums leading-none ${m.cls}`}>{m.value}</div>
                  <div className="text-[10px] text-app-muted mt-1 truncate">{m.label}</div>
                </button>
              ))}
            </div>

            <div className="pt-2.5 border-t border-app-border/70 flex items-center justify-between gap-2 text-[11px] text-app-muted flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-app-muted" aria-hidden="true" />
                <span>
                  Scope Guard:{" "}
                  <b className="text-app-text font-medium">
                    {scopeConfig?.enabled ? t("Bật", "On") : t("Theo target", "Auto")}
                  </b>
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-app-muted" aria-hidden="true" />
                <span>
                  {t("Che secret", "Redact")}:{" "}
                  <b className="text-app-text font-medium">{isRedactEnabled ? t("Bật", "On") : t("Tắt", "Off")}</b>
                </span>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export const LabPanel: React.FC<{
  title: string;
  subtitle?: string;
  url: string;
  running: boolean;
  solved: number;
  total: number;
  challenges?: Array<{ id: string; name: string; solved: boolean; points: number }>;
  onToggle: () => void;
  onFill: () => void;
}> = ({ title, subtitle, url, running, solved, total, challenges = [], onToggle, onFill }) => {
  const { t } = useI18n();
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <Card className="p-5 flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-app-text text-base">
            <FlaskConical className="w-4 h-4 text-app-muted shrink-0" aria-hidden="true" />
            <span>{title}</span>
          </div>
          {subtitle && <div className="text-xs text-app-muted font-mono mt-1">{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`px-3 py-1 rounded-lg text-xs border font-medium transition-colors cursor-pointer shrink-0 ${
            running
              ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15"
              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
          }`}
        >
          {running ? t("Dừng Lab", "Stop Lab") : t("Bật Lab", "Start Lab")}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs text-app-muted flex items-center justify-between">
          <span>{t("Tiến độ xác thực PoC", "PoC verification progress")}</span>
          <span className="font-mono tabular-nums font-medium text-app-text">
            {solved}/{total} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-app-panel2 overflow-hidden border border-app-border/60">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {challenges.length > 0 && (
        <div className="divide-y divide-app-border/70 border border-app-border rounded-lg bg-app-panel2/40 overflow-hidden">
          {challenges.map((ch) => (
            <div key={ch.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${ch.solved ? "bg-emerald-500" : "bg-zinc-400/70"}`} />
                <span className={`truncate ${ch.solved ? "text-app-text font-medium" : "text-app-muted"}`}>
                  {ch.name}
                </span>
              </span>
              <span className="font-mono text-[11px] text-app-muted tabular-nums shrink-0">{ch.points} pts</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        {running && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 px-3 rounded-lg bg-app-panel2 border border-app-border text-xs font-medium text-app-text flex items-center justify-center gap-1.5 hover:bg-app-active transition-colors"
          >
            <span>{t("Mở Lab", "Open Lab")}</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
        <PrimaryButton size="sm" onClick={onFill} className="flex-1 py-2">
          {t("Nạp vào Chiến dịch", "Load into Mission")}
        </PrimaryButton>
      </div>
    </Card>
  );
};
