type DashboardButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "warning"
  | "danger";
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
        ? "h-12 min-w-[132px] rounded-[14px] px-5 text-[14px]"
        : "h-11 rounded-[13px] px-4.5 text-[13px]";

  const variantClasses =
    variant === "primary"
      ? "border-[#D9593B] bg-[#E05A3D] text-white shadow-[0_2px_0_rgba(201,78,50,0.18),0_10px_18px_rgba(224,90,61,0.10)] hover:-translate-y-[1px] hover:border-[#C94E32] hover:bg-[#D65438] hover:shadow-[0_3px_0_rgba(201,78,50,0.2),0_12px_22px_rgba(224,90,61,0.12)]"
      : variant === "accent"
        ? "border-[#F0C7B7] bg-[#FFF4ED] text-[#BC4A2F] shadow-[0_1px_0_rgba(240,199,183,0.85),0_6px_14px_rgba(26,29,32,0.04)] hover:-translate-y-[1px] hover:border-[#E3B19D] hover:bg-[#FFEBDD] hover:shadow-[0_1px_0_rgba(240,199,183,0.85),0_8px_16px_rgba(26,29,32,0.05)]"
        : variant === "success"
          ? "border-[#365347] bg-[#446457] text-white shadow-[0_2px_0_rgba(43,69,56,0.2),0_10px_18px_rgba(54,83,71,0.12)] hover:-translate-y-[1px] hover:border-[#2D473B] hover:bg-[#365347] hover:shadow-[0_3px_0_rgba(43,69,56,0.22),0_12px_22px_rgba(54,83,71,0.14)]"
        : variant === "warning"
          ? "border-[#E4BF63] bg-[#F1CF6A] text-[#584106] shadow-[0_2px_0_rgba(207,170,79,0.26),0_10px_18px_rgba(177,137,33,0.14)] hover:-translate-y-[1px] hover:border-[#D7AE49] hover:bg-[#E9C45A] hover:shadow-[0_3px_0_rgba(207,170,79,0.28),0_12px_22px_rgba(177,137,33,0.16)]"
        : variant === "danger"
          ? "border-[#D93636] bg-[#D93636] text-white shadow-[0_2px_0_rgba(198,40,40,0.18),0_10px_18px_rgba(217,54,54,0.10)] hover:-translate-y-[1px] hover:border-[#C62828] hover:bg-[#C62828] hover:shadow-[0_3px_0_rgba(198,40,40,0.2),0_12px_22px_rgba(217,54,54,0.12)]"
          : "border-[#DDD2C3] bg-white text-[var(--dash-text)] shadow-[0_1px_0_rgba(221,210,195,0.9),0_6px_14px_rgba(26,29,32,0.04)] hover:-translate-y-[1px] hover:border-[#CFC1AF] hover:bg-[#FBF7F1] hover:shadow-[0_1px_0_rgba(221,210,195,0.9),0_8px_16px_rgba(26,29,32,0.05)]";

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
