import { ApiError } from '@tornotron/echno-core';

/**
 * The server's reason for a refused write, such as "You do not hold
 * assets:delete", or `fallback` when there is none. A taken name (409) and
 * a starting role that cannot be deleted (422) come back with a message too.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 403 && !error.message)
    return 'You do not have permission to make this change.';
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
