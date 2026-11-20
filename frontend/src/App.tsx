import React, { useEffect } from "react";
import { Sidebar } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { DashboardPage } from "./pages/DashboardPage";
import { MissionPage } from "./pages/MissionPage";
import { AgentsPage, ModelsPage, LabPage, MemoryPage, SettingsPage } from "./pages/SystemPages";
import { FindingsTriageTab } from "./components/terminal/FindingsTriageTab";
import { AgentLogStream } from "./components/terminal/AgentLogStream";
import { LiveTerminal } from "./components/terminal/LiveTerminal";
import { AuditHistoryDeck } from "./components/terminal/AuditHistoryDeck";
import { useCampaignStore, AppPage } from "./stores/useCampaignStore";

const PAGES: Record<AppPage, React.ReactNode> = {
  dashboard: <DashboardPage />,
  mission: <MissionPage />,
  findings: <FindingsTriageTab />,
  agent_log: <AgentLogStream />,
  terminal: <LiveTerminal />,
  history: <AuditHistoryDeck />,
  agents: <AgentsPage />,
  models: <ModelsPage />,
  lab: <LabPage />,
  memory: <MemoryPage />,
  settings: <SettingsPage />,
};

export const App: React.FC = () => {
  const {
    fetchRunnerStatus,
    fetchLabStatus,
    fetchHardLabStatus,
    fetchMemorySummary,
    fetchAgents,
    fetchModels,
    fetchModelSplitConfig,
    fetchScopeConfig,
    fetchAuditSessions,
    activePage,
    theme,
    lang,
    showLabs,
  } = useCampaignStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = lang;
  }, [theme, lang]);

  useEffect(() => {
    fetchRunnerStatus();
    fetchMemorySummary();
    fetchAgents();
    fetchModels();
    fetchModelSplitConfig();
    fetchScopeConfig();
    fetchAuditSessions();
    if (showLabs) {
      fetchLabStatus();
      fetchHardLabStatus();
    }

    const interval = setInterval(() => {
      fetchRunnerStatus();
      fetchMemorySummary();
      if (useCampaignStore.getState().showLabs) {
        fetchLabStatus();
        fetchHardLabStatus();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [showLabs]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app-bg text-app-text p-2.5 gap-2.5">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden rounded-2xl border border-app-border bg-app-panel2/55 shadow-shell">
        <Topbar />
        <main className="flex-1 min-h-0 overflow-y-auto">{PAGES[activePage]}</main>
      </div>
      <CommandPalette />
    </div>
  );
};

export default App;
