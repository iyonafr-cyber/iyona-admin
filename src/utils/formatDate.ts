/**
 * Locale-aware short date/time formatter used in chat timestamps.
 * Replaces hard-coded English month arrays and AM/PM composition.
 *
 * Example (en-US): "Jan 5 at 3:07 PM"
 * Example (fr-FR): "5 janv. à 15:07"
 */
export const formatShortDateTime = (
  timestamp: number | string | Date,
  language: string,
): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const locale = language === "fr" ? "fr-FR" : "en-US";

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

export const formatShortDate = (
  timestamp: number | string | Date,
  language: string,
): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const locale = language === "fr" ? "fr-FR" : "en-US";

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};
