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
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-center font-semibold leading-none tracking-[-0.015em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E05A3D]/12 active:translate-y-[1px] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50";

  const sizeClasses =
    size === "sm"
      ? "h-10 rounded-[12px] px-4 text-[12px]"
      : size === "lg"
        ? "h-12 min-w-[144px] rounded-[14px] px-5.5 text-[14px]"
        : "h-11 rounded-[13px] px-4.5 text-[13px]";

  const variantClasses =
    variant === "primary"
      ? "border-[#C65135] bg-[linear-gradient(180deg,#E67656_0%,#DF5F41_58%,#D65237_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_0_rgba(149,57,34,0.75),0_10px_24px_rgba(224,90,61,0.24)] hover:-translate-y-[1px] hover:border-[#BC4A30] hover:bg-[linear-gradient(180deg,#EA7A59_0%,#E16142_58%,#D65237_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_0_rgba(149,57,34,0.75),0_14px_28px_rgba(224,90,61,0.28)]"
      : variant === "accent"
        ? "border-[#E2B39F] bg-[linear-gradient(180deg,#FFF9F5_0%,#FFF0E6_100%)] text-[#BC4A2F] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_1px_0_rgba(223,195,179,0.9),0_8px_18px_rgba(224,90,61,0.08)] hover:-translate-y-[1px] hover:border-[#D79B84] hover:bg-[linear-gradient(180deg,#FFF6F0_0%,#FFE9DA_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.74),0_1px_0_rgba(223,195,179,0.9),0_10px_20px_rgba(224,90,61,0.12)]"
        : variant === "danger"
          ? "border-[#C83131] bg-[linear-gradient(180deg,#E34B4B_0%,#D73232_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_0_rgba(148,30,30,0.75),0_10px_24px_rgba(220,38,38,0.18)] hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#E75151_0%,#D93636_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_0_rgba(148,30,30,0.75),0_14px_28px_rgba(220,38,38,0.22)]"
          : "border-[#E3D7C8] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8F2EA_100%)] text-[var(--dash-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(216,202,186,0.9),0_8px_18px_rgba(26,29,32,0.06)] hover:-translate-y-[1px] hover:border-[#D4C5B5] hover:bg-[linear-gradient(180deg,#FFFFFF_0%,#F4ECE1_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_1px_0_rgba(216,202,186,0.9),0_12px_24px_rgba(26,29,32,0.08)]";

  return `${base} ${sizeClasses} ${variantClasses} ${fullWidth ? "w-full" : ""}`;
}

export function dashboardUtilityLinkClassName({
  tone = "default",
}: {
  tone?: "default" | "danger";
} = {}) {
  return tone === "danger"
    ? "whitespace-nowrap text-[12px] font-medium leading-none text-[#DC2626] underline decoration-[rgba(220,38,38,0.35)] underline-offset-[5px] transition-colors hover:text-[#B91C1C]"
    : "whitespace-nowrap text-[12px] font-medium leading-none text-[var(--dash-muted)] underline decoration-[rgba(94,114,104,0.35)] underline-offset-[5px] transition-colors hover:text-[var(--dash-text)]";
}
