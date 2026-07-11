const DISPLAY_TIME_ZONE = "America/Edmonton";

export function formatLocalDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function formatLocalDate(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIME_ZONE,
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatUtcDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "medium",
    timeZoneName: "short",
  }).format(new Date(value));
}
