type DashboardButtonVariant = "primary" | "secondary" | "accent" | "danger";
type DashboardButtonSize = "sm" | "md" | "lg";

export function dashboardButtonClassName({
  variant = "secondary",
  size = "md",
  fullWidth = false,
}: {
  variant?: DashboardButtonVariant;
  size?: DashboardButtonSize;
  fullWidth?: boolean;
} = {}) {
  const base =
    "inline-flex items-center justify-center rounded-[10px] font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  const sizeClasses =
    size === "sm"
      ? "px-3 py-2 text-[12px]"
      : size === "lg"
        ? "px-5 py-3 text-[13px]"
        : "px-4 py-2.5 text-[13px]";

  const variantClasses =
    variant === "primary"
      ? "bg-[var(--dash-primary)] text-white shadow-[0_8px_24px_rgba(224,90,61,0.16)] hover:brightness-95"
      : variant === "accent"
        ? "border border-[var(--dash-primary)] bg-white text-[var(--dash-primary)] hover:bg-[var(--dash-primary)]/5"
        : variant === "danger"
          ? "bg-[#DC2626] text-white shadow-[0_8px_24px_rgba(220,38,38,0.14)] hover:brightness-95"
          : "border border-[var(--dash-border)] bg-white text-[var(--dash-text)] hover:bg-[var(--dash-bg)]";

  return `${base} ${sizeClasses} ${variantClasses} ${fullWidth ? "w-full" : ""}`;
}

export function dashboardUtilityLinkClassName({
  tone = "default",
}: {
  tone?: "default" | "danger";
} = {}) {
  return tone === "danger"
    ? "text-[12px] font-medium text-[#DC2626] underline decoration-[rgba(220,38,38,0.35)] underline-offset-4 transition-colors hover:text-[#B91C1C]"
    : "text-[12px] font-medium text-[var(--dash-muted)] underline decoration-[rgba(94,114,104,0.35)] underline-offset-4 transition-colors hover:text-[var(--dash-text)]";
}
