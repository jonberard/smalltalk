"use client";

export type DashboardRailOption = {
  key: string;
  label: string;
  count?: number;
};

export function DashboardRailSwitcher({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  options: DashboardRailOption[];
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex min-w-max shrink-0 gap-5 overflow-x-auto border-b border-[var(--dash-border)] pr-1"
    >
      {options.map((option) => {
        const active = value === option.key;

        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.key)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-0 pb-3 text-[13px] font-semibold transition-colors ${
              active
                ? "border-[var(--dash-primary)] text-[var(--dash-text)]"
                : "border-transparent text-[var(--dash-muted)] hover:text-[var(--dash-text)]"
            }`}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] ${
                  active
                    ? "bg-[#FFF1E8] text-[#BC4A2F]"
                    : "bg-[#F4F0E9] text-[var(--dash-muted)]"
                }`}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
