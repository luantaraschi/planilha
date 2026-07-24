export function localDateTimeToIso(value: string, timeZone: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const expected = {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
    second: match[6] ?? "00",
  };
  const representedAsUtc = Date.UTC(
    Number(expected.year),
    Number(expected.month) - 1,
    Number(expected.day),
    Number(expected.hour),
    Number(expected.minute),
    Number(expected.second),
  );
  const calendarCheck = new Date(representedAsUtc);
  if (
    calendarCheck.getUTCFullYear() !== Number(expected.year) ||
    calendarCheck.getUTCMonth() + 1 !== Number(expected.month) ||
    calendarCheck.getUTCDate() !== Number(expected.day) ||
    calendarCheck.getUTCHours() !== Number(expected.hour) ||
    calendarCheck.getUTCMinutes() !== Number(expected.minute) ||
    calendarCheck.getUTCSeconds() !== Number(expected.second)
  ) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  const matches: number[] = [];
  for (
    let instant = representedAsUtc - 14 * 60 * 60_000;
    instant <= representedAsUtc + 14 * 60 * 60_000;
    instant += 15 * 60_000
  ) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .map((part) => [part.type, part.value]),
    );
    if (
      parts.year === expected.year &&
      parts.month === expected.month &&
      parts.day === expected.day &&
      parts.hour === expected.hour &&
      parts.minute === expected.minute &&
      parts.second === expected.second
    ) {
      matches.push(instant);
    }
  }
  if (!matches.length) return null;
  return new Date(Math.max(...matches)).toISOString();
}

export function localDayWindow(date: string, timeZone: string) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const start = localDateTimeToIso(`${date}T00:00`, timeZone);
  const end = localDateTimeToIso(
    `${next.toISOString().slice(0, 10)}T00:00`,
    timeZone,
  );
  if (!start || !end) throw new Error("Data local inválida.");
  return [start, end] as const;
}
