/**
 * Parse a date string without timezone conversion
 * Handles both ISO date strings (YYYY-MM-DDTHH:mm:ss.sssZ) and simple date strings (YYYY-MM-DD)
 * Returns a Date object preserving the date values (UTC-based extraction)
 *
 * @param dateStr - Date string or Date object
 * @returns Date object with the exact date values
 */
export const parseDateString = (dateStr: string | Date): Date => {
  // If already a Date object, extract UTC date components to avoid timezone shifts
  if (dateStr instanceof Date) {
    const year = dateStr.getUTCFullYear();
    const month = dateStr.getUTCMonth();
    const day = dateStr.getUTCDate();
    return new Date(year, month, day);
  }

  const dateString = dateStr.toString();
  const dateOnly = dateString.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date string to YYYY-MM-DD format without timezone conversion
 * Uses UTC methods to preserve the exact date regardless of local timezone
 *
 * @param dateStr - Date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (dateStr: string | Date): string => {
  if (dateStr instanceof Date) {
    const year = dateStr.getUTCFullYear();
    const month = String(dateStr.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateStr.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return dateStr.toString().split("T")[0];
};

/**
 * Format a date for display using UTC to avoid timezone shifts
 * Returns a human-readable date string like "October 29, 2025"
 *
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "October 29, 2025")
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
