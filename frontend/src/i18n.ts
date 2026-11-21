import { useCampaignStore, AppPage } from "./stores/useCampaignStore";

export type Lang = "vi" | "en";

export const PAGE_LABELS: Record<AppPage, { vi: string; en: string }> = {
  dashboard: { vi: "Tổng quan", en: "Dashboard" },
  mission: { vi: "Chiến dịch", en: "Mission" },
  findings: { vi: "Phát hiện", en: "Findings" },
  agent_log: { vi: "Nhật ký Agent", en: "Agent log" },
  terminal: { vi: "Terminal", en: "Terminal" },
  history: { vi: "Lịch sử", en: "History" },
  agents: { vi: "Agents", en: "Agents" },
  models: { vi: "Models", en: "Models" },
  lab: { vi: "Phòng Lab", en: "Lab" },
  memory: { vi: "Trí nhớ", en: "Memory" },
  settings: { vi: "Cài đặt", en: "Settings" },
};

export function tr(lang: Lang, vi: string, en: string): string {
  return lang === "vi" ? vi : en;
}

export function useI18n() {
  const lang = useCampaignStore((s) => s.lang);
  const setLang = useCampaignStore((s) => s.setLang);
  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);
  return { lang, setLang, t };
}
