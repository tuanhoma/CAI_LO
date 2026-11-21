import { create } from "zustand";
import {
  RunnerStatus,
  MockLabStatus,
  FindingItem,
  CredentialItem,
  AgentItem,
  ModelItem,
  ModelSplitConfig,
  ScopeConfig,
  AgentStep,
  AuditSessionItem,
  MemorySummaryData,
} from "../types";

export type AppPage =
  | "dashboard"
  | "mission"
  | "findings"
  | "agent_log"
  | "terminal"
  | "history"
  | "agents"
  | "models"
  | "lab"
  | "memory"
  | "settings";

function readLS(key: string, fallback: string): string {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch { }
}

function readTheme(): "light" | "dark" {
  const t = readLS("cai-theme", "light");
  return t === "dark" ? "dark" : "light";
}

function readLang(): "vi" | "en" {
  const l = readLS("cai-lang", "vi");
  return l === "en" ? "en" : "vi";
}

function readBoolLS(key: string, fallback: boolean): boolean {
  const v = readLS(key, "");
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function readNumLS(key: string, fallback: number): number {
  const n = parseInt(readLS(key, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function buildApiUrl(path: string): string {
  const base = readLS("cai-api-base", "").trim().replace(/\/+$/, "");
  if (!base || base === "/") return path;
  return `${base}${path}`;
}

export function buildApiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const apiKey = readLS("cai-api-key", "").trim();
  if (apiKey) {
    headers["X-CAI-API-Key"] = apiKey;
  }
  return headers;
}

interface CampaignState {
  target: string;
  prompt: string;
  agent: string;
  model: string;
  maxTurns: number;
  isAutonomy: boolean;
  isRunning: boolean;
  missionStartedAt: number | null;
  statusText: string;
  currentPhase: string;
  turnsUsed: number;
  sessionId: string;

  runnerStatus: RunnerStatus | null;
  labStatus: MockLabStatus | null;
  hardLabStatus: MockLabStatus | null;
  findings: FindingItem[];
  credentials: CredentialItem[];
  availableAgents: AgentItem[];
  availableModels: ModelItem[];
  modelSplitConfig: ModelSplitConfig | null;
  scopeConfig: ScopeConfig | null;
  isRedactEnabled: boolean;
  agentSteps: AgentStep[];
  auditSessions: AuditSessionItem[];
  memoryRaw: MemorySummaryData | null;

  activePage: AppPage;
  theme: "light" | "dark";
  lang: "vi" | "en";
  showLabs: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;

  // UI Actions
  setActivePage: (page: AppPage) => void;
  toggleTheme: () => void;
  setLang: (lang: "vi" | "en") => void;
  toggleShowLabs: () => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleRedact: () => void;
  clearAgentSteps: () => void;

  // Form Actions
  setTarget: (target: string) => void;
  setPrompt: (prompt: string) => void;
  setAgent: (agent: string) => void;
  setModel: (model: string) => void;
  setMaxTurns: (turns: number) => void;
  setIsAutonomy: (val: boolean) => void;

  // API Actions
  fetchAgents: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchModelSplitConfig: () => Promise<void>;
  fetchScopeConfig: () => Promise<void>;
  updateScopeConfig: (scope: string, enabled: boolean) => Promise<void>;
  fetchAuditSessions: () => Promise<void>;
  fetchRunnerStatus: () => Promise<void>;
  fetchLabStatus: () => Promise<void>;
  fetchHardLabStatus: () => Promise<void>;
  fetchMemorySummary: () => Promise<void>;
  clearMemory: () => Promise<void>;
  clearTerminalLogs: () => Promise<void>;
  toggleLab: () => Promise<void>;
  fillMockLabTarget: () => void;
  toggleHardLab: () => Promise<void>;
  fillHardLabTarget: () => void;
  startMission: () => Promise<void>;
  stopMission: () => Promise<void>;
}

const DEFAULT_TARGET = "";
const DEFAULT_PROMPT = "";

export const useCampaignStore = create<CampaignState>((set, get) => ({
  target: readLS("cai-target", DEFAULT_TARGET),
  prompt: readLS("cai-prompt", DEFAULT_PROMPT),
  agent: readLS("cai-agent", "kali_pentester_agent"),
  model: readLS("cai-model", "gemini/gemini-3.5-flash-lite"),
  maxTurns: readNumLS("cai-max-turns", 30),
  isAutonomy: readBoolLS("cai-autonomy", true),
  isRunning: false,
  missionStartedAt: null,
  statusText: "",
  currentPhase: "ready",
  turnsUsed: 0,
  sessionId: "",

  runnerStatus: null,
  labStatus: null,
  hardLabStatus: null,
  findings: [],
  credentials: [],
  availableAgents: [],
  availableModels: [],
  modelSplitConfig: null,
  scopeConfig: null,
  isRedactEnabled: readBoolLS("cai-redact", true),
  agentSteps: [],
  auditSessions: [],
  memoryRaw: null,

  activePage: "dashboard",
  theme: readTheme(),
  lang: readLang(),
  showLabs: readBoolLS("cai-show-labs", false),
  sidebarCollapsed: readBoolLS("cai-sidebar-collapsed", false),
  mobileMenuOpen: false,
  commandPaletteOpen: false,

  setActivePage: (page) => set({ activePage: page, mobileMenuOpen: false }),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      writeLS("cai-theme", next);
      return { theme: next };
    }),
  setLang: (lang) => {
    writeLS("cai-lang", lang);
    set({ lang });
  },
  toggleShowLabs: () =>
    set((s) => {
      const next = !s.showLabs;
      writeLS("cai-show-labs", String(next));
      return {
        showLabs: next,
        activePage: !next && s.activePage === "lab" ? "settings" : s.activePage,
      };
    }),
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      writeLS("cai-sidebar-collapsed", String(next));
      return { sidebarCollapsed: next };
    }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleRedact: () =>
    set((s) => {
      const next = !s.isRedactEnabled;
      writeLS("cai-redact", String(next));
      return { isRedactEnabled: next };
    }),
  clearAgentSteps: () => set({ agentSteps: [] }),

  setTarget: (target) => {
    writeLS("cai-target", target);
    set({ target });
  },
  setPrompt: (prompt) => {
    writeLS("cai-prompt", prompt);
    set({ prompt });
  },
  setAgent: (agent) => {
    writeLS("cai-agent", agent);
    set({ agent });
  },
  setModel: (model) => {
    writeLS("cai-model", model);
    set({ model });
  },
  setMaxTurns: (maxTurns) => {
    writeLS("cai-max-turns", String(maxTurns));
    set({ maxTurns });
  },
  setIsAutonomy: (isAutonomy) => {
    writeLS("cai-autonomy", String(isAutonomy));
    set({ isAutonomy });
  },

  fetchAuditSessions: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/audit/sessions"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: AuditSessionItem[] = await res.json();
      set({ auditSessions: data || [] });
    } catch { }
  },

  fetchAgents: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/agents"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ availableAgents: data.agents || [] });
    } catch { }
  },

  fetchModels: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/models"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({ availableModels: data.models || [] });
    } catch { }
  },

  fetchModelSplitConfig: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/config/models"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: ModelSplitConfig = await res.json();
      set({ modelSplitConfig: data });
    } catch { }
  },

  fetchScopeConfig: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/security/scope"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: ScopeConfig = await res.json();
      set({ scopeConfig: data });
    } catch { }
  },

  updateScopeConfig: async (scope, enabled) => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/security/scope"), {
        method: "POST",
        headers: buildApiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ scope, enabled }),
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ scopeConfig: { enabled: !!data.enabled, scope: data.scope || [] } });
    } catch { }
  },

  clearTerminalLogs: async () => {
    try {
      await fetch(buildApiUrl("/api/v1/runner/terminal/logs"), {
        method: "DELETE",
        headers: buildApiHeaders(),
      });
    } catch { }
  },

  fetchRunnerStatus: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/runner/status"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: RunnerStatus = await res.json();
      set({ runnerStatus: data });
    } catch { }
  },

  fetchLabStatus: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/lab/status"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: MockLabStatus = await res.json();
      set({ labStatus: data });
    } catch { }
  },

  fetchHardLabStatus: async () => {
    try {
      const res = await fetch(buildApiUrl("/api/v1/lab/hard/status"), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: MockLabStatus = await res.json();
      set({ hardLabStatus: data });
    } catch { }
  },

  fetchMemorySummary: async () => {
    try {
      const { target } = get();
      const q = target ? `?target=${encodeURIComponent(target)}` : "";
      const res = await fetch(buildApiUrl(`/api/v1/memory/summary${q}`), { headers: buildApiHeaders() });
      if (!res.ok) return;
      const data: MemorySummaryData = await res.json();
      set({
        findings: data.findings || [],
        credentials: data.credentials || [],
        memoryRaw: data,
      });
    } catch { }
  },

  clearMemory: async () => {
    try {
      await fetch(buildApiUrl("/api/v1/memory"), {
        method: "DELETE",
        headers: buildApiHeaders(),
      });
      await get().fetchMemorySummary();
    } catch { }
  },

  toggleLab: async () => {
    const { labStatus, fetchLabStatus } = get();
    try {
      const url = labStatus?.running ? "/api/v1/lab/stop" : "/api/v1/lab/start";
      await fetch(buildApiUrl(url), { method: "POST", headers: buildApiHeaders() });
      await fetchLabStatus();
    } catch { }
  },

  toggleHardLab: async () => {
    const { hardLabStatus, fetchHardLabStatus } = get();
    try {
      const url = hardLabStatus?.running ? "/api/v1/lab/hard/stop" : "/api/v1/lab/hard/start";
      await fetch(buildApiUrl(url), { method: "POST", headers: buildApiHeaders() });
      await fetchHardLabStatus();
    } catch { }
  },

  fillMockLabTarget: () => {
    const { runnerStatus } = get();
    const hostIp = runnerStatus?.preferred_ip || "127.0.0.1";
    const nextTarget = `http://${hostIp}:8888`;
    const nextPrompt = `Khảo sát và đánh giá bảo mật toàn diện mục tiêu ${nextTarget}. Rà quét và phát hiện các lỗ hổng OWASP Top 10 (SQL Injection, CSRF, IDOR, OS Command Injection, Path Traversal, XSS), thực hiện khai thác chứng minh lỗ hổng (PoC) và lập báo cáo tổng kết an ninh hệ thống hoàn chỉnh kèm khuyến nghị khắc phục.`;
    writeLS("cai-target", nextTarget);
    writeLS("cai-prompt", nextPrompt);
    set({ target: nextTarget, prompt: nextPrompt });
  },

  fillHardLabTarget: () => {
    const { runnerStatus } = get();
    const hostIp = runnerStatus?.preferred_ip || "127.0.0.1";
    const nextTarget = `http://${hostIp}:8889`;
    const nextPrompt = `Pentest nâng cao mục tiêu ${nextTarget}. Khai thác toàn bộ lỗ hổng server-side và lấy mọi FLAG{...}: SSTI (Jinja2) ở /greet, UNION SQLi ở /products rồi đăng nhập admin, JWT alg:none bypass ở /admin, và SSRF bypass filter ở /fetch để đọc /internal/flag. Dùng curl qua generic_linux_command, báo cáo từng FLAG kèm lỗ hổng tương ứng.`;
    writeLS("cai-target", nextTarget);
    writeLS("cai-prompt", nextPrompt);
    set({ target: nextTarget, prompt: nextPrompt });
  },

  startMission: async () => {
    const { target, prompt, agent, model, maxTurns, isAutonomy, lang } = get();
    const isVi = lang === "vi";
    set({
      isRunning: true,
      missionStartedAt: Date.now(),
      statusText: isVi ? "Đang khởi tạo phiên tác chiến..." : "Initializing mission session...",
      turnsUsed: 1,
      activePage: "agent_log",
      agentSteps: [],
    });

    try {
      if (target) {
        await fetch(buildApiUrl("/api/v1/security/scope"), {
          method: "POST",
          headers: buildApiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ scope: target, enabled: true }),
        });
        get().fetchScopeConfig();
      }

      const sessRes = await fetch(buildApiUrl("/api/v1/sessions"), {
        method: "POST",
        headers: buildApiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          agent: agent || "kali_pentester_agent",
          model: model || undefined,
          metadata: { target, max_turns: maxTurns, autonomy: isAutonomy },
        }),
      });

      if (!sessRes.ok) {
        set({
          isRunning: false,
          missionStartedAt: null,
          statusText: isVi ? `Lỗi khởi tạo phiên (${sessRes.status})` : `Session init error (${sessRes.status})`,
        });
        return;
      }
      const sessData = await sessRes.json();
      const sid = sessData.session_id || sessData.id;
      set({ sessionId: sid, statusText: isVi ? "Đang chạy chiến dịch..." : "Mission in progress..." });

      const composed = target ? `${prompt}\n\n[Target / scope: ${target}]` : prompt;
      const streamRes = await fetch(buildApiUrl(`/api/v1/sessions/${sid}/messages/stream`), {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        }),
        body: JSON.stringify({
          input: composed,
          context: { target: target || null, autonomy: isAutonomy },
          max_turns: maxTurns,
        }),
      });

      if (!streamRes.ok || !streamRes.body) {
        const errText = await streamRes.text().catch(() => "");
        console.error("SSE stream error:", streamRes.status, errText);
        set({
          isRunning: false,
          missionStartedAt: null,
          statusText: isVi ? `Lỗi kết nối SSE (${streamRes.status})` : `SSE stream error (${streamRes.status})`,
        });
        return;
      }

      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          let eventName = "message";
          const dataLines: string[] = [];
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) continue;
          let parsedData: any;
          try {
            parsedData = JSON.parse(dataLines.join("\n"));
          } catch {
            parsedData = { raw: dataLines.join("\n") };
          }

          const now = new Date();
          const timeStr = now.toTimeString().split(" ")[0];
          const stepId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          if (eventName === "reasoning_step") {
            const stepItem: AgentStep = {
              id: stepId,
              time: timeStr,
              type: parsedData.type || "message",
              agent: parsedData.agent,
              tool: parsedData.tool,
              args: parsedData.args,
              command: parsedData.command,
              output: parsedData.output,
              text: parsedData.text,
              phase: parsedData.phase,
              phase_label: parsedData.phase_label,
              cycle: parsedData.cycle,
              max_cycles: parsedData.max_cycles,
              turns_used: parsedData.turns_used,
              max_turns: parsedData.max_turns,
              reason: parsedData.reason,
            };

            set((state) => ({
              agentSteps: [...state.agentSteps, stepItem],
              statusText:
                parsedData.reason ||
                (parsedData.tool ? `${state.lang === "vi" ? "Đang chạy" : "Running"}: ${parsedData.tool}` : state.statusText),
              turnsUsed: parsedData.turns_used !== undefined ? parsedData.turns_used : state.turnsUsed,
              currentPhase: parsedData.phase || state.currentPhase,
            }));
          } else if (eventName === "final") {
            const finalMsg =
              parsedData.final_message || (parsedData.final_output ? JSON.stringify(parsedData.final_output, null, 2) : "");
            const stepItem: AgentStep = {
              id: stepId,
              time: timeStr,
              type: "final",
              final_message: finalMsg,
              final_output: parsedData.final_output,
            };

            set((state) => ({
              agentSteps: [...state.agentSteps, stepItem],
              isRunning: false,
              missionStartedAt: null,
              statusText: state.lang === "vi" ? "Chiến dịch hoàn tất" : "Mission completed",
            }));

            get().fetchMemorySummary();
            get().fetchAuditSessions();
            try {
              await reader.cancel();
            } catch { }
            return;
          } else if (eventName === "error") {
            const stepItem: AgentStep = {
              id: stepId,
              time: timeStr,
              type: "error",
              text: parsedData.message || JSON.stringify(parsedData),
            };

            set((state) => ({
              agentSteps: [...state.agentSteps, stepItem],
              isRunning: false,
              missionStartedAt: null,
              statusText: `${state.lang === "vi" ? "Lỗi" : "Error"}: ${stepItem.text}`,
            }));
          }
        }
      }

      set((state) => ({
        isRunning: false,
        missionStartedAt: null,
        statusText: state.lang === "vi" ? "Chiến dịch hoàn tất" : "Mission completed",
      }));
      get().fetchMemorySummary();
      get().fetchAuditSessions();
    } catch (err: any) {
      set((state) => ({
        isRunning: false,
        missionStartedAt: null,
        statusText: `${state.lang === "vi" ? "Lỗi" : "Error"}: ${err?.message || "Unknown"}`,
      }));
    }
  },

  stopMission: async () => {
    const { sessionId, lang } = get();
    if (sessionId) {
      try {
        await fetch(buildApiUrl(`/api/v1/sessions/${sessionId}/interrupt`), {
          method: "POST",
          headers: buildApiHeaders(),
        });
      } catch { }
    }
    set({
      isRunning: false,
      missionStartedAt: null,
      statusText: lang === "vi" ? "Đã dừng bởi người điều hành" : "Stopped by operator",
    });
  },
}));
