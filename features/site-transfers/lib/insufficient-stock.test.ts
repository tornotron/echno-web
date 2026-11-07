import { describe, expect, test } from 'bun:test';
import { ApiError } from '@/lib/api/api-client';
import { isInsufficientStock } from './insufficient-stock';

const message = 'Insufficient stock for material ID 4 at project ID 2.';

function apiError(status: number) {
  const error = new ApiError(message, status);
  return error;
}

describe('isInsufficientStock', () => {
  test('recognises the 409 the backend sends', () => {
    expect(isInsufficientStock(apiError(409), message)).toBe(true);
  });

  test('ignores another conflict', () => {
    expect(isInsufficientStock(apiError(409), 'Version conflict')).toBe(false);
  });

  test('ignores a 400 that happens to use the words', () => {
    expect(isInsufficientStock(apiError(400), message)).toBe(false);
  });

  test('ignores an error that is not from the API', () => {
    expect(isInsufficientStock(new Error(message), message)).toBe(false);
  });
});
