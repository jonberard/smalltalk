import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail?: ReactNode;
  className?: string;
};

export function StatCard({ icon, label, value, detail, className = "" }: StatCardProps) {
  return (
    <div className={`rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] ${className}`}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[var(--dash-radius-sm)] bg-[#E05A3D]/8">
        {icon}
      </div>
      <p className="text-[24px] font-bold tracking-tight text-[var(--dash-text)]">{value}</p>
      <p className="mt-0.5 text-[13px] text-[var(--dash-muted)]">{label}</p>
      {detail && <div className="mt-2">{detail}</div>}
    </div>
  );
}
