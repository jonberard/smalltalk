type StatusPillProps = {
  status: string;
  className?: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  posted: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Posted" },
  copied: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Copied" },
  active: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Active" },
  drafted: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Drafted" },
  private_feedback: { bg: "bg-[#EFF6FF]", text: "text-[#2563EB]", label: "Private Feedback" },
  handled: { bg: "bg-[#F3F4F6]", text: "text-[#4B5563]", label: "Handled" },
  trialing: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Trialing" },
  trial: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Trialing" },
  in_progress: { bg: "bg-[#FEF2F2]", text: "text-[#E05A3D]", label: "In Progress" },
  past_due: { bg: "bg-[#FEF2F2]", text: "text-[#E05A3D]", label: "Past Due" },
  sent: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Sent" },
  queued: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", label: "Queued" },
  connected: { bg: "bg-[#ECFDF5]", text: "text-[#059669]", label: "Connected" },
  pending: { bg: "bg-[#FFFBEB]", text: "text-[#D97706]", label: "Pending" },
  created: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Opened" },
  delivery_failed: { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", label: "Delivery Failed" },
  opted_out: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Opted Out" },
  none: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "No Plan" },
  canceled: { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]", label: "Canceled" },
  paused: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Paused" },
  incomplete: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Incomplete" },
};

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.none;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  );
}
