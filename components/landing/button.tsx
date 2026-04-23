type LandingButtonVariant = "primary" | "secondary";
type LandingButtonSize = "nav" | "md" | "lg";

export function landingButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: LandingButtonVariant;
  size?: LandingButtonSize;
  fullWidth?: boolean;
} = {}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-pill border text-center font-semibold tracking-[-0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 active:translate-y-px";

  const sizeClasses =
    size === "nav"
      ? "h-11 px-5 text-[14px]"
      : size === "lg"
        ? "h-14 px-8 text-[17px]"
        : "h-12 px-7 text-[16px]";

  const variantClasses =
    variant === "primary"
      ? "border-[#C84F34] bg-primary text-white shadow-[0_1px_0_rgba(128,52,34,0.65)] hover:-translate-y-[1px] hover:border-[#B9472E] hover:shadow-[0_4px_0_rgba(128,52,34,0.12)]"
      : "border-[#D1C4B0] bg-surface text-text shadow-none hover:-translate-y-[1px] hover:border-primary hover:text-primary";

  return `${base} ${sizeClasses} ${variantClasses} ${fullWidth ? "w-full" : ""}`;
}
