import React from "react";
import { PanelLeft, Sun, Moon, Settings, Search, Menu, Activity } from "lucide-react";
import { useCampaignStore } from "../../stores/useCampaignStore";
import { PAGE_LABELS, useI18n } from "../../i18n";

const APP_VERSION = "0.4.0";

export const Topbar: React.FC = () => {
  const {
    toggleSidebar,
    setMobileMenuOpen,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
    activePage,
    setActivePage,
    isRunning,
    turnsUsed,
    maxTurns,
    runnerStatus,
  } = useCampaignStore();
  const { lang, t } = useI18n();

  return (
    <header className="h-14 shrink-0 px-4 sm:px-5 flex items-center gap-2.5 border-b border-app-border bg-app-panel rounded-t-2xl">
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden p-2 rounded-lg text-app-muted hover:bg-app-panel2 hover:text-app-text transition-colors cursor-pointer"
        aria-label={t("Mở menu điều hướng", "Open navigation menu")}
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden md:inline-flex p-2 rounded-lg text-app-muted hover:bg-app-panel2 hover:text-app-text transition-colors cursor-pointer"
        aria-label={t("Thu gọn hoặc mở rộng sidebar", "Toggle sidebar")}
        title={t("Thu gọn / mở sidebar", "Toggle sidebar")}
      >
        <PanelLeft className="w-[17px] h-[17px]" />
      </button>

      <div className="h-4 w-px bg-app-border hidden sm:block" aria-hidden="true" />

      <span className="font-medium text-sm text-app-text tracking-tight hidden sm:inline">
        {PAGE_LABELS[activePage][lang]}
      </span>

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="ml-1 sm:ml-2 inline-flex items-center gap-2 h-8 px-2.5 rounded-lg bg-app-panel2 border border-app-border text-xs text-app-muted hover:text-app-text hover:border-app-text/20 transition-colors cursor-pointer"
        title={t("Mở bảng lệnh nhanh (Ctrl+K hoặc Ctrl+J)", "Open Command Palette (Ctrl+K or Ctrl+J)")}
      >
        <Search className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{t("Tìm nhanh", "Search")}</span>
        <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-app-panel border border-app-border rounded text-app-muted">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      {isRunning ? (
        <button
          type="button"
          onClick={() => setActivePage("agent_log")}
          className="inline-flex items-center gap-2 h-8 px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors cursor-pointer"
          title={t("Xem luồng Agent đang chạy", "View running agent stream")}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Activity className="w-3.5 h-3.5 hidden sm:inline" aria-hidden="true" />
          <span className="tabular-nums">
            {t("Đang chạy", "Running")} · {turnsUsed}/{maxTurns}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setActivePage("mission")}
          className="hidden lg:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-app-panel2 border border-app-border text-[11px] text-app-muted hover:text-app-text transition-colors cursor-pointer"
          title={t("Trạng thái Kali Reverse Runner", "Kali Reverse Runner status")}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${runnerStatus?.active ? "bg-emerald-500" : "bg-zinc-400"}`} />
          <span>{runnerStatus?.active ? "Kali Online" : "Kali Offline"}</span>
        </button>
      )}

      <span className="hidden xl:inline text-xs text-app-muted font-mono tabular-nums px-1">
        v{APP_VERSION}
      </span>

      <button
        type="button"
        onClick={() => setActivePage("settings")}
        className="w-8 h-8 rounded-lg bg-app-panel2 border border-app-border text-app-muted hover:text-app-text flex items-center justify-center transition-colors cursor-pointer"
        aria-label={t("Cài đặt hệ thống", "System settings")}
        title={t("Cài đặt", "Settings")}
      >
        <Settings className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="w-8 h-8 rounded-lg bg-app-primary text-app-primary-fg flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
        aria-label={theme === "light" ? t("Chuyển sang giao diện tối", "Switch to dark mode") : t("Chuyển sang giao diện sáng", "Switch to light mode")}
        title={theme === "light" ? t("Chế độ sáng (bấm để đổi tối)", "Light mode (click for dark)") : t("Chế độ tối (bấm để đổi sáng)", "Dark mode (click for light)")}
      >
        {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
    </header>
  );
};
