export type ReminderDeliverySummary = {
  kind: "initial" | "reminder_1" | "reminder_2";
  status: "pending" | "sent" | "failed" | "skipped";
  skipped_reason: string | null;
};

export type ReminderBadgeState = {
  label: string;
  tone: "neutral" | "warning";
};

export function getReminderBadgeState(
  deliveries: ReminderDeliverySummary[],
  sequenceCompleted: boolean,
): ReminderBadgeState | null {
  const reminderDeliveries = deliveries.filter((delivery) => delivery.kind !== "initial");

  if (reminderDeliveries.length === 0 || sequenceCompleted) {
    return null;
  }

  if (reminderDeliveries.some((delivery) => delivery.skipped_reason === "opted_out")) {
    return { label: "Customer opted out", tone: "neutral" };
  }

  const reminder1 = reminderDeliveries.find((delivery) => delivery.kind === "reminder_1");
  const reminder2 = reminderDeliveries.find((delivery) => delivery.kind === "reminder_2");

  if (reminder2?.status === "failed") {
    return { label: "Reminder 2 failed", tone: "warning" };
  }

  if (reminder1?.status === "failed") {
    return { label: "Reminder failed", tone: "warning" };
  }

  if (reminder2?.status === "sent") {
    return { label: "No response", tone: "neutral" };
  }

  if (reminder2?.status === "pending" && reminder1?.status === "sent") {
    return { label: "Reminder 2 scheduled", tone: "neutral" };
  }

  if (reminder1?.status === "sent") {
    return reminder2 ? { label: "Reminder sent", tone: "neutral" } : { label: "No response", tone: "neutral" };
  }

  if (reminder1?.status === "pending") {
    return { label: "Reminder scheduled", tone: "neutral" };
  }

  return null;
}
