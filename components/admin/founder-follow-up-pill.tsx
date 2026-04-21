"use client";

import type { AdminBusinessFollowUpStatus } from "@/lib/types";

const STATUS_COPY: Record<Exclude<AdminBusinessFollowUpStatus, "none">, string> = {
  watching: "Watching",
  follow_up: "Follow up",
  blocked: "Blocked",
  resolved: "Resolved",
};

const STATUS_CLASSES: Record<Exclude<AdminBusinessFollowUpStatus, "none">, string> = {
  watching: "border-[#D8E2F2] bg-[#F6F9FF] text-[#4161A6]",
  follow_up: "border-[#F6D9A8] bg-[#FFF8EA] text-[#9A6404]",
  blocked: "border-[#F3C4BE] bg-[#FFF4F1] text-[#A6452F]",
  resolved: "border-[#CDE9D6] bg-[#F3FBF6] text-[#2F7A4A]",
};

export function FounderFollowUpPill({
  status,
  className = "",
}: {
  status: AdminBusinessFollowUpStatus;
  className?: string;
}) {
  if (status === "none") {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASSES[status]} ${className}`.trim()}
    >
      {STATUS_COPY[status]}
    </span>
  );
}
