/**
 * The bulk-accept rule the backend enforces, mirrored: a flagged row joins a
 * bulk accept only once each flag is ticked, and a value whose quote was not
 * found on its page never does.
 */
import { describe, expect, test } from 'bun:test';
import { pdfCandidate } from '../test/mocks';
import {
  acceptDecision,
  acceptedAlone,
  bulkAcceptable,
  percentTotal,
} from './review';

const flag = (code: string) => ({ code, message: code });

describe('bulkAcceptable', () => {
  const clean = pdfCandidate({ id: 'a' });
  const ocr = pdfCandidate({ id: 'b', flags: [flag('OCR_PAGE')] });
  const noQuote = pdfCandidate({ id: 'c', flags: [flag('QUOTE_NOT_FOUND')] });
  const done = pdfCandidate({ id: 'd', status: 'ACCEPTED' });

  test('takes unflagged rows still to review', () => {
    expect(
      bulkAcceptable([clean, ocr, noQuote, done], {}).map((c) => c.id)
    ).toEqual(['a']);
  });

  test('takes a flagged row once each flag is ticked', () => {
    expect(
      bulkAcceptable([clean, ocr], { b: ['OCR_PAGE'] }).map((c) => c.id)
    ).toEqual(['a', 'b']);
  });

  test('never takes a row whose quote was not found, even ticked', () => {
    const ticked = { c: ['QUOTE_NOT_FOUND'] };
    expect(acceptedAlone(noQuote)).toBe(true);
    expect(bulkAcceptable([noQuote], ticked)).toEqual([]);
    expect(acceptDecision(noQuote, ticked)).toEqual({
      candidateId: 'c',
      action: 'ACCEPT',
      acknowledgedFlags: ['QUOTE_NOT_FOUND'],
    });
  });

  test('a tick for a code the row does not carry is dropped', () => {
    expect(acceptDecision(clean, { a: ['OCR_PAGE'] })).toEqual({
      candidateId: 'a',
      action: 'ACCEPT',
    });
  });
});

describe('percentTotal', () => {
  test('adds printed percentages in hundredths', () => {
    expect(percentTotal(['20', '20%', '12.5 %', '42.5'])).toEqual({
      total: '95',
      counted: 4,
      unread: 0,
    });
    expect(percentTotal(['33.33', '33.33', '33.33']).total).toBe('99.99');
    expect(percentTotal(['10.5']).total).toBe('10.5');
  });

  test('counts text that is not a percentage as unread', () => {
    expect(percentTotal(['50', 'balance', undefined, ''])).toEqual({
      total: '50',
      counted: 1,
      unread: 1,
    });
  });
});
