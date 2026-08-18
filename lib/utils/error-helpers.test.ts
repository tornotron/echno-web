import { describe, expect, test } from 'bun:test';
import { ApiError } from '@/lib/api/api-client';
import { getErrorMessage, getErrorTitle } from './error-helpers';

// Pins the mapping from a thrown error to the toast title + description. This is
// the contract the backend's RFC 7807 problem responses feed: the client reads
// `details` (the request path) and `message`, and the helpers below decide which
// becomes the title and which the description.
describe('getErrorMessage', () => {
  test('prefers ApiError.details over message', () => {
    const error = new ApiError('Employee not found', 404, 'uri=/api/v1/employee/web/9');
    expect(getErrorMessage(error)).toBe('uri=/api/v1/employee/web/9');
  });

  test('falls back to message when there are no details', () => {
    const error = new ApiError('Employee not found', 404);
    expect(getErrorMessage(error)).toBe('Employee not found');
  });

  test('appends field validation errors to the base', () => {
    const error = new ApiError('Validation Failed', 400, undefined, {
      customerId: ['must not be null'],
      amount: ['must be positive'],
    });
    const message = getErrorMessage(error);
    expect(message).toContain('Validation Failed —');
    expect(message).toContain('customerId: must not be null');
    expect(message).toContain('amount: must be positive');
  });

  test('reads message from a plain Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  test('returns a generic fallback for non-error values', () => {
    expect(getErrorMessage('nope')).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('getErrorTitle', () => {
  test('auth errors take precedence', () => {
    expect(getErrorTitle(new ApiError('x', 401), 'Failed')).toBe('Authentication Required');
    expect(getErrorTitle(new ApiError('x', 403), 'Failed')).toBe('Authentication Required');
  });

  test('timeout maps to Request Timeout', () => {
    expect(getErrorTitle(ApiError.timeout(), 'Failed')).toBe('Request Timeout');
  });

  test('server errors map to Server Error', () => {
    expect(getErrorTitle(new ApiError('x', 500), 'Failed')).toBe('Server Error');
  });

  test('a network error (status 0) maps to Network Error', () => {
    expect(getErrorTitle(ApiError.network(), 'Failed')).toBe('Network Error');
  });

  test('when details are present the backend message becomes the title', () => {
    const error = new ApiError('Employee not found', 404, 'uri=/api/v1/employee/web/9');
    expect(getErrorTitle(error, 'Failed')).toBe('Employee not found');
  });

  test('falls back to the default title otherwise', () => {
    expect(getErrorTitle(new ApiError('x', 404), 'Operation Failed')).toBe('Operation Failed');
    expect(getErrorTitle(new Error('x'), 'Operation Failed')).toBe('Operation Failed');
  });
});
