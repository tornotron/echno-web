import { describe, expect, test } from 'bun:test';
import {
  createErrorResponse,
  createSuccessResponse,
  extractErrorMessage,
  getDefaultErrorMessage,
  getUserFriendlyMessage,
  handleApiError,
  isApiError,
  isApiSuccess,
} from './api-utils';

describe('isApiError / isApiSuccess', () => {
  test('recognises an error response', () => {
    const err = createErrorResponse('E', 'boom');
    expect(isApiError(err)).toBe(true);
    expect(isApiSuccess(err)).toBe(false);
  });

  test('recognises a success response', () => {
    const ok = createSuccessResponse({ x: 1 });
    expect(isApiSuccess(ok)).toBe(true);
    expect(isApiError(ok)).toBe(false);
  });

  test('rejects non-objects and shapes missing the discriminant', () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError('str')).toBe(false);
    expect(isApiError({ success: false })).toBe(false); // no `error` key
    expect(isApiSuccess({ success: true })).toBe(false); // no `data` key
  });
});

describe('getDefaultErrorMessage', () => {
  test('maps each known status to its message', () => {
    expect(getDefaultErrorMessage(400)).toContain('Invalid request');
    expect(getDefaultErrorMessage(401)).toContain('session has expired');
    expect(getDefaultErrorMessage(403)).toContain('permission');
    expect(getDefaultErrorMessage(404)).toContain('not found');
    expect(getDefaultErrorMessage(409)).toContain('Conflict');
    expect(getDefaultErrorMessage(422)).toContain('Invalid data');
    expect(getDefaultErrorMessage(429)).toContain('Too many requests');
    expect(getDefaultErrorMessage(500)).toContain('Server error');
    expect(getDefaultErrorMessage(502)).toContain('temporarily unavailable');
    expect(getDefaultErrorMessage(503)).toContain('temporarily unavailable');
    expect(getDefaultErrorMessage(504)).toContain('timeout');
  });

  test('falls back for an unknown status', () => {
    expect(getDefaultErrorMessage(418)).toContain('unexpected error');
  });
});

describe('extractErrorMessage', () => {
  test('reads the message from an Error', () => {
    expect(extractErrorMessage(new Error('nope'))).toBe('nope');
  });

  test('returns a string error unchanged', () => {
    expect(extractErrorMessage('plain')).toBe('plain');
  });

  test('reads a message property off an object', () => {
    expect(extractErrorMessage({ message: 'obj-msg' })).toBe('obj-msg');
  });

  test('falls back for an unknown shape', () => {
    expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
  });
});

describe('handleApiError', () => {
  test('maps a known message substring case-insensitively', () => {
    expect(handleApiError(new Error('Failed to fetch'))).toContain(
      'Unable to connect'
    );
    expect(handleApiError('unauthorized access')).toContain(
      'session has expired'
    );
    expect(handleApiError('Error 404 not found')).toContain('not found');
  });

  test('returns the original message when nothing matches', () => {
    expect(handleApiError('some bespoke message')).toBe('some bespoke message');
  });
});

describe('getUserFriendlyMessage', () => {
  test('prefers userMessage', () => {
    expect(
      getUserFriendlyMessage({
        userMessage: 'friendly',
        message: 'technical',
      } as never)
    ).toBe('friendly');
  });

  test('falls back to message when userMessage is absent', () => {
    expect(getUserFriendlyMessage({ userMessage: '', message: 'technical' } as never)).toBe(
      'technical'
    );
  });

  test('uses a generic message when both are empty on an error object', () => {
    expect(getUserFriendlyMessage({ userMessage: '', message: '' } as never)).toBe(
      'An unexpected error occurred'
    );
  });

  test('delegates to extractErrorMessage for a plain error', () => {
    expect(getUserFriendlyMessage(new Error('raw'))).toBe('raw');
  });
});

describe('createSuccessResponse / createErrorResponse', () => {
  test('builds a success envelope', () => {
    const ok = createSuccessResponse({ a: 1 }, 'done');
    expect(ok).toEqual({ data: { a: 1 }, message: 'done', success: true });
  });

  test('builds an error envelope with a timestamp and options', () => {
    const err = createErrorResponse('Validation', 'bad', {
      statusCode: 422,
      userMessage: 'Check the form',
    });
    expect(err.error).toBe('Validation');
    expect(err.message).toBe('bad');
    expect(err.statusCode).toBe(422);
    expect(err.userMessage).toBe('Check the form');
    expect(err.success).toBe(false);
    expect(typeof err.timestamp).toBe('string');
  });
});
