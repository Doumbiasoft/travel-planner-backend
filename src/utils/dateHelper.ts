/**
 * Parse a date string without timezone conversion
 * Handles both ISO date strings (YYYY-MM-DDTHH:mm:ss.sssZ) and simple date strings (YYYY-MM-DD)
 * Returns a Date object in local timezone
 *
 * @param dateStr - Date string or Date object
 * @returns Date object in local timezone
 */
export const parseDateString = (dateStr: string | Date): Date => {
  const dateString = dateStr.toString();
  const dateOnly = dateString.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date string to YYYY-MM-DD format without timezone conversion
 *
 * @param dateStr - Date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (dateStr: string | Date): string => {
  return dateStr.toString().split("T")[0];
};
