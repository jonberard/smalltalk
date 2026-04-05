type SkeletonProps = { className?: string };

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return <div className={`h-4 animate-pulse rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)] ${className}`} />;
}

export function SkeletonCircle({ className = "" }: SkeletonProps) {
  return <div className={`h-9 w-9 animate-pulse rounded-full bg-[var(--dash-border)] ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-[var(--dash-radius)] bg-[var(--dash-surface)] p-5 shadow-[var(--dash-shadow)] ${className}`}>
      <div className="mb-3 h-9 w-9 animate-pulse rounded-[var(--dash-radius-sm)] bg-[var(--dash-border)]" />
      <div className="h-7 w-16 animate-pulse rounded bg-[var(--dash-border)]" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[var(--dash-border)]" />
    </div>
  );
}

export function SkeletonRow({ className = "" }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${className}`}>
      <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--dash-border)]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--dash-border)]" />
        <div className="h-3 w-20 animate-pulse rounded bg-[var(--dash-border)]" />
      </div>
      <div className="h-3 w-12 animate-pulse rounded bg-[var(--dash-border)]" />
    </div>
  );
}
