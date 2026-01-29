/**
 * Date Formatter Utilities
 * Centralized date formatting functions for consistent date handling across the app
 */

/**
 * Formats a Date object to backend-compatible format: "YYYY-MM-DDTHH:mm:ss"
 * This format is required by the Java backend (LocalDateTime without timezone)
 *
 * @param date - Date object to format
 * @returns Formatted date string in "YYYY-MM-DDTHH:mm:ss" format
 * @example
 * formatDateForBackend(new Date('1998-01-01')) // "1998-01-01T00:00:00"
 */
export function formatDateForBackend(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00`;
}

/**
 * Formats a Date object to HTML date input format: "YYYY-MM-DD"
 *
 * @param date - Date object to format
 * @returns Formatted date string in "YYYY-MM-DD" format
 * @example
 * formatDateForInput(new Date('1998-01-01')) // "1998-01-01"
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or string to a readable format: "MMM DD, YYYY"
 *
 * @param date - Date object or string to format
 * @returns Formatted date string or empty string if invalid
 * @example
 * formatDateReadable(new Date('1998-01-01')) // "Jan 01, 1998"
 */
export function formatDateReadable(date: Date | string | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Formats a Date object or string to a long readable format: "Month DD, YYYY"
 *
 * @param date - Date object or string to format
 * @returns Formatted date string or empty string if invalid
 * @example
 * formatDateLong(new Date('1998-01-01')) // "January 01, 1998"
 */
export function formatDateLong(date: Date | string | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}
