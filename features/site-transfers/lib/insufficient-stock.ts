import { ApiError } from '@/lib/api/api-client';

/**
 * The backend answers a transfer it cannot fill with 409 and a message naming
 * the shortfall (`InsufficientStockException`). Other conflicts share that
 * status, so the message decides.
 */
export function isInsufficientStock(err: unknown, message: string): boolean {
  return (
    err instanceof ApiError &&
    err.status === 409 &&
    message.toLowerCase().includes('insufficient stock')
  );
}
