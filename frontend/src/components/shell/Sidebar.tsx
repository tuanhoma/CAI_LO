import React from "react";
import {
  LayoutDashboard,
  Crosshair,
  ShieldAlert,
  Bot,
  Terminal,
  History,
  Users,
  Cpu,
  FlaskConical,
  Database,
  Settings,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useCampaignStore, AppPage } from "../../stores/useCampaignStore";
import { PAGE_LABELS, useI18n } from "../../i18n";

export interface NavItem {
  page: AppPage;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "running" | "findings" | "runner";
}

export const FEATURES_NAV: NavItem[] = [
  { page: "dashboard", icon: LayoutDashboard },
  { page: "mission", icon: Crosshair },
  { page: "findings", icon: ShieldAlert, badge: "findings" },
  { page: "agent_log", icon: Bot, badge: "running" },
  { page: "terminal", icon: Terminal, badge: "runner" },
  { page: "history", icon: History },
];

export const SYSTEM_NAV: NavItem[] = [
  { page: "agents", icon: Users },
  { page: "models", icon: Cpu },
  { page: "lab", icon: FlaskConical },
  { page: "memory", icon: Database },
  { page: "settings", icon: Settings },
];

const NavButton: React.FC<{ item: NavItem; collapsed: boolean }> = ({ item, collapsed }) => {
  const { activePage, setActivePage, isRunning, findings, runnerStatus } = useCampaignStore();
  const { lang } = useI18n();
  const label = PAGE_LABELS[item.page][lang];
  const active = activePage === item.page;
  const Icon = item.icon;

  let badgeEl: React.ReactNode = null;
  if (!collapsed && item.badge === "running" && isRunning) {
    badgeEl = (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  } else if (!collapsed && item.badge === "findings" && findings.length > 0) {
    badgeEl = (
      <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md bg-app-panel text-app-muted border border-app-border">
        {findings.length}
      </span>
    );
  } else if (!collapsed && item.badge === "runner" && runnerStatus?.active) {
    badgeEl = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Kali Runner Online" />;
  }

  return (
    <button
      type="button"
      onClick={() => setActivePage(item.page)}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] transition-colors cursor-pointer ${
        collapsed ? "justify-center px-0" : ""
      } ${
        active
          ? "bg-app-active text-app-text font-semibold ring-1 ring-inset ring-app-border/80"
          : "text-app-muted hover:bg-app-panel2 hover:text-app-text"
      }`}
    >
      <Icon
        className={`w-[17px] h-[17px] shrink-0 transition-colors ${
          active ? "text-app-accent" : "text-app-muted group-hover:text-app-text"
        }`}
        aria-hidden="true"
      />
      {!collapsed && <span className="truncate flex-1 text-left">{label}</span>}
      {badgeEl}
    </button>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, runnerStatus, setActivePage, showLabs } =
    useCampaignStore();
  const { t } = useI18n();
  const collapsed = sidebarCollapsed;
  const visibleSystemNav = showLabs ? SYSTEM_NAV : SYSTEM_NAV.filter((n) => n.page !== "lab");

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = isMobile ? false : collapsed;
    return (
      <div className="h-full bg-app-panel border border-app-border rounded-2xl shadow-shell flex flex-col overflow-hidden">
        {/* Brand */}
        <div
          className={`h-14 flex items-center gap-2.5 px-3.5 shrink-0 border-b border-app-border ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setActivePage("dashboard")}
            className={`flex items-center gap-2.5 min-w-0 cursor-pointer ${isCollapsed ? "justify-center" : "flex-1"}`}
          >
            <BrandLogo size={28} className="shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <div className="font-semibold text-sm text-app-text tracking-tight leading-none">CAI_LO</div>
                <div className="text-[10px] text-app-muted mt-0.5 truncate">Pentest Console</div>
              </div>
            )}
          </button>
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={t("Đóng menu", "Close menu")}
              className="p-1.5 rounded-lg text-app-muted hover:text-app-text hover:bg-app-panel2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation groups */}
        <nav aria-label={t("Điều hướng chính", "Main navigation")} className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3">
          {!isCollapsed && (
            <div className="px-2.5 pb-1.5 text-[11px] font-medium text-app-muted/80">
              {t("Chức năng", "Features")}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {FEATURES_NAV.map((it) => (
              <NavButton key={it.page} item={it} collapsed={isCollapsed} />
            ))}
          </div>

          {!isCollapsed ? (
            <div className="px-2.5 pt-5 pb-1.5 text-[11px] font-medium text-app-muted/80">
              {t("Hệ thống", "System")}
            </div>
          ) : (
            <div className="my-3 mx-2 border-t border-app-border" />
          )}
          <div className="flex flex-col gap-0.5">
            {visibleSystemNav.map((it) => (
              <NavButton key={it.page} item={it} collapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        {/* Footer status */}
        <div className="shrink-0 border-t border-app-border p-2.5">
          <button
            type="button"
            onClick={() => setActivePage("mission")}
            title={
              runnerStatus?.active
                ? `Kali VM Online (${runnerStatus.runners?.[0]?.ip || ""})`
                : t("Local shell — mở Chiến dịch để kết nối Kali", "Local shell — open Mission to connect Kali")
            }
            className={`w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-app-panel2 transition-colors cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
          >
            <div className="relative w-7 h-7 rounded-full bg-app-panel2 border border-app-border flex items-center justify-center text-xs font-semibold text-app-text shrink-0">
              C
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app-panel ${
                  runnerStatus?.active ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-medium text-app-text truncate">CAI-LO</div>
                <div className="text-[11px] text-app-muted truncate">
                  {runnerStatus?.active
                    ? `Kali · ${runnerStatus.runners?.[0]?.tools?.length || 0} tools`
                    : t("Chế độ cục bộ", "Local fallback")}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={`hidden md:block shrink-0 h-full transition-all duration-200 ${
          collapsed ? "w-[64px]" : "w-[232px]"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[260px] max-w-[85vw] h-full p-2.5">{sidebarContent(true)}</aside>
        </div>
      )}
    </>
  );
};
