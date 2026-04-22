import type { ReactNode } from "react";
import { dashboardButtonClassName } from "@/components/dashboard/button";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dash-border)]/50">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--dash-text)]">{title}</p>
        <p className="mt-1 max-w-[320px] text-[13px] text-[var(--dash-muted)]">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={`mt-2 ${dashboardButtonClassName({ variant: "primary" })}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
