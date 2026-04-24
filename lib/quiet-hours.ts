type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
  };
}

function addLocalDays(parts: ZonedDateParts, days: number): ZonedDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    ...parts,
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(parts: ZonedDateParts, timeZone: string): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  );
  const initialOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const adjusted = new Date(utcGuess.getTime() - initialOffset);
  const adjustedOffset = getTimeZoneOffsetMs(adjusted, timeZone);

  if (adjustedOffset !== initialOffset) {
    return new Date(utcGuess.getTime() - adjustedOffset);
  }

  return adjusted;
}

function isHourInQuietHours(hour: number, start: number, end: number) {
  if (start === end) {
    return false;
  }

  if (start < end) {
    return hour >= start && hour < end;
  }

  return hour >= start || hour < end;
}

export function isInQuietHours(date: Date, timeZone: string, quietHoursStart: number, quietHoursEnd: number) {
  const parts = getZonedParts(date, timeZone);
  return isHourInQuietHours(parts.hour, quietHoursStart, quietHoursEnd);
}

export function getNextAllowedSendAt(
  date: Date,
  timeZone: string,
  quietHoursStart: number,
  quietHoursEnd: number,
) {
  const parts = getZonedParts(date, timeZone);

  if (!isHourInQuietHours(parts.hour, quietHoursStart, quietHoursEnd)) {
    return date;
  }

  let targetParts: ZonedDateParts;

  if (quietHoursStart > quietHoursEnd) {
    targetParts =
      parts.hour >= quietHoursStart
        ? addLocalDays(parts, 1)
        : parts;
  } else {
    targetParts = parts;
  }

  return zonedDateTimeToUtc(
    {
      ...targetParts,
      hour: quietHoursEnd,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

export function getNextBatchSendAt(
  date: Date,
  timeZone: string,
  batchHour: number,
  quietHoursStart: number,
  quietHoursEnd: number,
) {
  const parts = getZonedParts(date, timeZone);

  let targetParts: ZonedDateParts = {
    ...parts,
    hour: batchHour,
    minute: 0,
    second: 0,
  };

  let candidate = zonedDateTimeToUtc(targetParts, timeZone);

  if (candidate.getTime() <= date.getTime()) {
    targetParts = {
      ...addLocalDays(parts, 1),
      hour: batchHour,
      minute: 0,
      second: 0,
    };
    candidate = zonedDateTimeToUtc(targetParts, timeZone);
  }

  return getNextAllowedSendAt(candidate, timeZone, quietHoursStart, quietHoursEnd);
}
