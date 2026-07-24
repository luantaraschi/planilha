const frequencies = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const weekdays = /^(MO|TU|WE|TH|FR|SA|SU)(,(MO|TU|WE|TH|FR|SA|SU))*$/;

export function isSupportedRecurrenceRule(rule: string) {
  const components = rule.split(";");
  const seen = new Set<string>();
  for (const [index, component] of components.entries()) {
    const separator = component.indexOf("=");
    if (separator <= 0) return false;
    const key = component.slice(0, separator);
    const value = component.slice(separator + 1);
    if (seen.has(key)) return false;
    seen.add(key);
    if (index === 0 && key !== "FREQ") return false;
    if (key === "FREQ" && !frequencies.has(value)) return false;
    if (
      (key === "INTERVAL" || key === "COUNT") &&
      !/^[1-9]\d*$/.test(value)
    ) {
      return false;
    }
    if (key === "UNTIL" && !/^\d{8}T\d{6}Z$/.test(value)) return false;
    if (key === "BYDAY" && !weekdays.test(value)) return false;
    if (!["FREQ", "INTERVAL", "COUNT", "UNTIL", "BYDAY"].includes(key)) {
      return false;
    }
  }
  return seen.has("FREQ");
}
