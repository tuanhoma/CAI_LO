import React, { useEffect, useState } from "react";

export const inputCls =
  "w-full bg-app-panel2 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:outline-none focus:border-app-text/40 focus:ring-2 focus:ring-app-accent/15 transition-all";

export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}> = ({ children, className = "", fullHeight = false }) => (
  <div
    className={`w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-5 sm:py-6 ${
      fullHeight ? "h-full flex flex-col overflow-hidden" : ""
    } ${className}`}
  >
    {children}
  </div>
);

export const PageHeader: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, className = "" }) => (
  <div className={`flex items-start sm:items-center justify-between gap-4 flex-wrap mb-5 shrink-0 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-[22px] font-semibold text-app-text tracking-[-0.02em] leading-tight">{title}</h1>
      {subtitle && <p className="text-[13px] text-app-muted mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = "",
  children,
}) => (
  <div className={`bg-app-panel border border-app-border rounded-xl shadow-card ${className}`}>
    {children}
  </div>
);

export const StatCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, sub, active = false, onClick }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-app-panel border rounded-xl shadow-card p-4 text-left transition-colors ${
        active
          ? "border-app-text/45 ring-2 ring-app-accent/20"
          : "border-app-border"
      } ${
        onClick ? "hover:border-app-text/25 hover:bg-app-panel2/60 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-app-muted text-xs font-medium mb-2.5">
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl sm:text-[26px] font-semibold text-app-text leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-2.5 text-xs text-app-muted leading-snug">{sub}</div>}
    </Tag>
  );
};

export const EmptyState: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, description, action, className = "" }) => (
  <div
    className={`rounded-xl border border-dashed border-app-border bg-app-panel2/35 py-11 px-6 flex flex-col items-center justify-center text-center ${className}`}
  >
    <div className="w-10 h-10 rounded-full bg-app-panel border border-app-border flex items-center justify-center mb-3 text-app-muted">
      <Icon className="w-5 h-5" aria-hidden="true" />
    </div>
    <p className="text-sm font-medium text-app-text">{title}</p>
    {description && <p className="text-xs text-app-muted mt-1 max-w-md leading-relaxed">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const FieldLabel: React.FC<{
  htmlFor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  hint?: React.ReactNode;
}> = ({ htmlFor, icon: Icon, children, hint }) => (
  <div className="flex items-center justify-between gap-2 mb-1.5">
    <label htmlFor={htmlFor} className="text-xs font-medium text-app-text flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-app-muted shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </label>
    {hint && <span className="text-[11px] text-app-muted">{hint}</span>}
  </div>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }
> = ({ size = "md", className = "", children, ...props }) => (
  <button
    {...props}
    className={`bg-app-primary text-app-primary-fg font-medium rounded-lg inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
      size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
    } ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" }
> = ({ size = "md", className = "", children, ...props }) => (
  <button
    {...props}
    className={`bg-app-panel border border-app-border text-app-text font-medium rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-app-panel2 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
      size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
    } ${className}`}
  >
    {children}
  </button>
);

export const ConfirmButton: React.FC<{
  label: string;
  confirmLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm: () => void;
  size?: "sm" | "md";
  className?: string;
}> = ({ label, confirmLabel = "Xác nhận xóa?", icon: Icon, onConfirm, size = "sm", className = "" }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={`rounded-lg border font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
      } ${
        armed
          ? "bg-rose-500/12 border-rose-500/50 text-rose-600 dark:text-rose-400"
          : "bg-app-panel border-app-border text-app-muted hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30"
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{armed ? confirmLabel : label}</span>
    </button>
  );
};
