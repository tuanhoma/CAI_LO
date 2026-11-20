import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Play, Square, Sun, Moon, FlaskConical, ArrowRight, Languages } from "lucide-react";
import { useCampaignStore } from "../../stores/useCampaignStore";
import { FEATURES_NAV, SYSTEM_NAV } from "./Sidebar";
import { PAGE_LABELS, useI18n } from "../../i18n";

interface ActionEntry {
  id: string;
  group: "Features" | "System" | "Quick actions";
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActivePage,
    theme,
    toggleTheme,
    isRunning,
    showLabs,
    startMission,
    stopMission,
    fillMockLabTarget,
    fillHardLabTarget,
  } = useCampaignStore();
  const { lang, setLang, t } = useI18n();

  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "j")) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === "Escape" && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [commandPaletteOpen]);

  const entries: ActionEntry[] = useMemo(() => {
    const navTo = (page: any) => () => {
      setActivePage(page);
      setCommandPaletteOpen(false);
    };

    const visibleSystem = showLabs ? SYSTEM_NAV : SYSTEM_NAV.filter((n) => n.page !== "lab");

    return [
      ...FEATURES_NAV.map((n) => ({
        id: `nav-${n.page}`,
        group: "Features" as const,
        label: PAGE_LABELS[n.page][lang],
        hint: t("Mở trang", "Open page"),
        icon: n.icon,
        run: navTo(n.page),
      })),
      ...visibleSystem.map((n) => ({
        id: `nav-${n.page}`,
        group: "System" as const,
        label: PAGE_LABELS[n.page][lang],
        hint: t("Mở cấu hình", "Open view"),
        icon: n.icon,
        run: navTo(n.page),
      })),
      {
        id: "act-mission",
        group: "Quick actions",
        label: isRunning ? t("Dừng chiến dịch hiện tại", "Stop active mission") : t("Phát động chiến dịch", "Start mission"),
        icon: isRunning ? Square : Play,
        run: () => {
          setCommandPaletteOpen(false);
          if (isRunning) stopMission();
          else startMission();
        },
      },
      {
        id: "act-theme",
        group: "Quick actions",
        label: theme === "light" ? t("Chuyển sang Dark mode", "Switch to Dark mode") : t("Chuyển sang Light mode", "Switch to Light mode"),
        icon: theme === "light" ? Moon : Sun,
        run: () => {
          toggleTheme();
          setCommandPaletteOpen(false);
        },
      },
      {
        id: "act-lang",
        group: "Quick actions",
        label: lang === "vi" ? "Switch language to English" : "Chuyển ngôn ngữ sang Tiếng Việt",
        icon: Languages,
        run: () => {
          setLang(lang === "vi" ? "en" : "vi");
          setCommandPaletteOpen(false);
        },
      },
      ...(showLabs
        ? [
            {
              id: "act-mocklab",
              group: "Quick actions" as const,
              label: t("Nạp mục tiêu Mock Lab (:8888)", "Load Mock Lab target (:8888)"),
              icon: FlaskConical,
              run: () => {
                fillMockLabTarget();
                setActivePage("mission");
                setCommandPaletteOpen(false);
              },
            },
            {
              id: "act-hardlab",
              group: "Quick actions" as const,
              label: t("Nạp mục tiêu Hard Lab (:8889)", "Load Hard Lab target (:8889)"),
              icon: FlaskConical,
              run: () => {
                fillHardLabTarget();
                setActivePage("mission");
                setCommandPaletteOpen(false);
              },
            },
          ]
        : []),
    ];
  }, [
    lang,
    isRunning,
    showLabs,
    theme,
    setActivePage,
    setCommandPaletteOpen,
    startMission,
    stopMission,
    toggleTheme,
    setLang,
    fillMockLabTarget,
    fillHardLabTarget,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q));
  }, [entries, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  if (!commandPaletteOpen) return null;

  const groups: Array<{ key: ActionEntry["group"]; title: string }> = [
    { key: "Features", title: t("Chức năng", "Features") },
    { key: "System", title: t("Hệ thống", "System") },
    { key: "Quick actions", title: t("Thao tác nhanh", "Quick actions") },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setCommandPaletteOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-app-panel border border-app-border shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-app-border">
          <Search className="w-4 h-4 text-app-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter" && filtered[selectedIdx]) {
                e.preventDefault();
                filtered[selectedIdx].run();
              }
            }}
            placeholder={t("Tìm trang, công cụ hoặc thao tác nhanh…", "Search pages, tools, or quick actions…")}
            className="flex-1 bg-transparent text-sm text-app-text placeholder:text-app-muted/70 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-app-border bg-app-panel2 text-app-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-app-muted">
              {t("Không tìm thấy mục phù hợp.", "No matching commands found.")}
            </div>
          ) : (
            groups.map((grp) => {
              const items = filtered.filter((e) => e.group === grp.key);
              if (items.length === 0) return null;
              return (
                <div key={grp.key} className="mb-2 last:mb-0">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-app-muted">{grp.title}</div>
                  {items.map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    const isSelected = globalIdx === selectedIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        onClick={item.run}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          isSelected ? "bg-app-active text-app-text font-medium" : "text-app-muted hover:text-app-text"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.hint && <span className="text-[11px] text-app-muted">{item.hint}</span>}
                        <ArrowRight className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
