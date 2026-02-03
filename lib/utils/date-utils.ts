/**
 * lib/utils/date-utils.ts
 *
 * Centralized date formatting utilities used throughout the application.
 * Consolidates date formatting logic from multiple locations to avoid duplication.
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Safely converts a value to a Date object
 * @param date - Date, string, or undefined
 * @returns Date object or null if invalid
 */
function safeDate(date: Date | string | undefined): Date | null {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Formats a date to a readable string using Intl.DateTimeFormat
 * Format: "January 15, 2024"
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats a date to a short string
 * Format: "Jan 15, 2024"
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string
 */
export function formatDateShort(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats a date using date-fns format
 * Format: "15 Jan 2024"
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string
 */
export function formatDateMedium(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  return format(d, 'dd MMM yyyy');
}

/**
 * Formats a date with hyphens
 * Format: "15-01-2024" (DD-MM-YYYY)
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string
 */
export function formatDateHyphen(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  return format(d, 'dd-MM-yyyy');
}

/**
 * Formats a date with slashes
 * Format: "15/01/2024" (DD/MM/YYYY)
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date string
 */
export function formatDateSlash(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date and time with hyphens
 * Format: "15-01-2024 14:30"
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date-time string
 */
export function formatDateTimeHyphen(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  return format(d, 'dd-MM-yyyy HH:mm');
}

/**
 * Formats a date and time with slashes
 * Format: "15/01/2024 14:30"
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Formatted date-time string
 */
export function formatDateTimeSlash(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a date to ISO string for input fields
 * Format: "2024-01-15"
 * @param date - Date to format
 * @returns ISO date string or empty string if invalid
 */
export function formatDateForInput(date: Date | string | undefined): string {
  const d = safeDate(date);
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Formats a date for backend API calls
 * Format: "2024-01-15T00:00:00"
 * @param date - Date to format
 * @returns Backend-compatible date string
 */
export function formatDateForBackend(date: Date | string | undefined): string {
  const d = safeDate(date);
  if (!d) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00`;
}

/**
 * Formats a date relative to now
 * Format: "2 hours ago", "3 days ago", etc.
 * @param date - Date to format
 * @param fallback - Fallback string if date is invalid
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string | undefined,
  fallback = 'Not specified'
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Calculates age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years or null if invalid
 */
export function calculateAge(
  dateOfBirth: Date | string | undefined
): number | null {
  const dob = safeDate(dateOfBirth);
  if (!dob) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Calculates years of service from a joining date
 * @param joiningDate - Date when service started
 * @returns Years of service or 0 if invalid
 */
export function calculateYearsOfService(
  joiningDate: Date | string | undefined
): number {
  const joinDate = safeDate(joiningDate);
  if (!joinDate) return 0;
  return new Date().getFullYear() - joinDate.getFullYear();
}

/**
 * Checks if a date is in the past
 * @param date - Date to check
 * @returns true if date is in the past
 */
export function isPast(date: Date | string | undefined): boolean {
  const d = safeDate(date);
  if (!d) return false;
  return d < new Date();
}

/**
 * Checks if a date is in the future
 * @param date - Date to check
 * @returns true if date is in the future
 */
export function isFuture(date: Date | string | undefined): boolean {
  const d = safeDate(date);
  if (!d) return false;
  return d > new Date();
}

/**
 * Checks if a date is today
 * @param date - Date to check
 * @returns true if date is today
 */
export function isToday(date: Date | string | undefined): boolean {
  const d = safeDate(date);
  if (!d) return false;

  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}
