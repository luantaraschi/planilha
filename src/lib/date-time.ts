export function localDateTimeToIso(value: string, timeZone: string) {
  const normalized = value.length === 16 ? `${value}:00` : value;
  const guessed = new Date(`${normalized}Z`);
  if (Number.isNaN(guessed.valueOf())) return null;
  let instant = guessed.valueOf();
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZone,
      })
        .formatToParts(new Date(instant))
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    instant += guessed.valueOf() - represented;
  }
  return new Date(instant).toISOString();
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
