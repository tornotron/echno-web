import { describe, expect, test } from 'bun:test';
import {
  DefectSeverity,
  NcrStatus,
  NcrType,
  availableNcrActions,
  isNcrOverdue,
  ncrDaysOverdue,
  ncrStatusLabels,
  ncrStatusVariants,
  parseNcr,
  type Ncr,
} from './ncr';

describe('NCR wire values', () => {
  test('statuses are the hyphenated lowercase strings the backend emits', () => {
    expect(Object.values(NcrStatus).toSorted()).toEqual(
      [
        'open',
        'assigned',
        'corrective-action-complete',
        'verified',
        'closed',
        'rejected',
        'reopened',
      ].toSorted()
    );
  });

  test('types are lowercase on the wire', () => {
    expect(Object.values(NcrType).toSorted()).toEqual(['quality', 'safety']);
  });

  test('every status has a label and a badge variant', () => {
    for (const status of Object.values(NcrStatus)) {
      expect(ncrStatusLabels[status]).toBeTruthy();
      expect(ncrStatusVariants[status]).toBeTruthy();
    }
  });
});

describe('availableNcrActions', () => {
  // Mirror of NcrStatus.allowedNext() on the backend, plus `assign` as a
  // legal self-transition from ASSIGNED (reassignment). Offering anything
  // beyond this map means a button whose endpoint answers 400.
  test('matches the backend lifecycle from every status', () => {
    expect(availableNcrActions(NcrStatus.OPEN)).toEqual(['assign']);
    expect(availableNcrActions(NcrStatus.ASSIGNED)).toEqual([
      'corrective-action-complete',
      'assign',
    ]);
    expect(availableNcrActions(NcrStatus.CORRECTIVE_ACTION_COMPLETE)).toEqual([
      'verify',
      'reject',
    ]);
    expect(availableNcrActions(NcrStatus.VERIFIED)).toEqual([
      'close',
      'reopen',
    ]);
    expect(availableNcrActions(NcrStatus.CLOSED)).toEqual(['reopen']);
  });

  test('rejected and reopened NCRs can only be reassigned', () => {
    expect(availableNcrActions(NcrStatus.REJECTED)).toEqual(['assign']);
    expect(availableNcrActions(NcrStatus.REOPENED)).toEqual(['assign']);
  });
});

const RAW = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  ncrNumber: 'NCR-2026-0007',
  type: 'quality',
  inspectionId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  title: 'Cover blocks missing',
  description: 'Rebar cover below specification on grid line C.',
  severity: 'major',
  status: 'assigned',
  siteEngineerId: 42,
  targetDate: '2026-08-20',
  raisedById: 7,
};

describe('parseNcr', () => {
  test('maps a backend row onto the typed shape', () => {
    const ncr = parseNcr(RAW);
    expect(ncr.ncrNumber).toBe('NCR-2026-0007');
    expect(ncr.type).toBe(NcrType.QUALITY);
    expect(ncr.severity).toBe(DefectSeverity.MAJOR);
    expect(ncr.status).toBe(NcrStatus.ASSIGNED);
    expect(ncr.siteEngineerId).toBe(42);
    expect(ncr.defectId).toBeUndefined();
    expect(ncr.closedAt).toBeUndefined();
  });
});

function ncrWith(overrides: Partial<Ncr>): Ncr {
  return { ...parseNcr(RAW), ...overrides };
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

describe('overdue arithmetic', () => {
  test('an NCR due today is not overdue yet', () => {
    const ncr = ncrWith({ targetDate: isoDaysAgo(0) });
    expect(isNcrOverdue(ncr)).toBe(false);
    expect(ncrDaysOverdue(ncr)).toBe(0);
  });

  test('an NCR three days past target is three days overdue', () => {
    const ncr = ncrWith({ targetDate: isoDaysAgo(3) });
    expect(isNcrOverdue(ncr)).toBe(true);
    expect(ncrDaysOverdue(ncr)).toBe(3);
  });

  test('settled NCRs are never overdue, whatever the date', () => {
    expect(
      isNcrOverdue(
        ncrWith({ targetDate: isoDaysAgo(30), status: NcrStatus.CLOSED })
      )
    ).toBe(false);
    expect(
      isNcrOverdue(
        ncrWith({ targetDate: isoDaysAgo(30), status: NcrStatus.VERIFIED })
      )
    ).toBe(false);
  });

  test('no target date means nothing to be overdue against', () => {
    expect(isNcrOverdue(ncrWith({ targetDate: undefined }))).toBe(false);
  });
});
