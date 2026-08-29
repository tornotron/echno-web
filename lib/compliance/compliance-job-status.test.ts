import { describe, expect, test } from 'bun:test';
import {
  complianceJobOutcome,
  complianceJobPercent,
  complianceJobProgressLabel,
  isComplianceJobActive,
  isComplianceJobTerminal,
} from './compliance-job-status';
import type {
  ComplianceGenerationJob,
  ComplianceJobStatus,
} from '@/types/compliance-job';

function job(over: Partial<ComplianceGenerationJob> = {}): ComplianceGenerationJob {
  return {
    id: 'ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11',
    projectId: 7,
    status: 'queued',
    rulesTotal: 24,
    rulesAssessed: 0,
    batchesTotal: 3,
    batchesDone: 0,
    createdCount: 0,
    errorMessage: null,
    attempt: 0,
    maxAttempts: 3,
    createdAt: '2026-08-29T10:00:00',
    startedAt: null,
    finishedAt: null,
    ...over,
  };
}

describe('which statuses are in flight and which are done', () => {
  test('queued and running are the only active ones', () => {
    expect(isComplianceJobActive('queued')).toBe(true);
    expect(isComplianceJobActive('running')).toBe(true);
    expect(isComplianceJobActive('succeeded')).toBe(false);
    expect(isComplianceJobActive('nothing-to-report')).toBe(false);
    expect(isComplianceJobActive('failed')).toBe(false);
  });

  test('the three outcomes are the only terminal ones', () => {
    expect(isComplianceJobTerminal('succeeded')).toBe(true);
    expect(isComplianceJobTerminal('nothing-to-report')).toBe(true);
    expect(isComplianceJobTerminal('failed')).toBe(true);
    expect(isComplianceJobTerminal('queued')).toBe(false);
    expect(isComplianceJobTerminal('running')).toBe(false);
  });
});

// The whole point of the five-status set. A run that found nothing and a run
// that broke are different facts, and #509 and #528 exist because they used to
// arrive looking identical. Anything that renders them the same way, or renders
// either of them the way a productive run is rendered, puts that back.
describe('the three outcomes never read the same', () => {
  const outcomes: ComplianceJobStatus[] = [
    'succeeded',
    'nothing-to-report',
    'failed',
  ];

  test('each outcome has its own tone', () => {
    const tones = outcomes.map((status) => complianceJobOutcome(job({ status })).tone);
    expect(new Set(tones).size).toBe(outcomes.length);
  });

  test('each outcome has its own title', () => {
    const titles = outcomes.map(
      (status) => complianceJobOutcome(job({ status })).title
    );
    expect(new Set(titles).size).toBe(outcomes.length);
    for (const title of titles) expect(title.length).toBeGreaterThan(0);
  });

  test('each outcome has its own description', () => {
    const descriptions = outcomes.map(
      (status) => complianceJobOutcome(job({ status })).description
    );
    expect(new Set(descriptions).size).toBe(outcomes.length);
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test('a failure says nothing was saved rather than nothing was found', () => {
    const failed = complianceJobOutcome(
      job({ status: 'failed', rulesAssessed: 11, finishedAt: '2026-08-29T10:04:00' })
    );
    expect(failed.description).toMatch(/nothing was saved/i);
    expect(failed.description).not.toMatch(/no new compliances were required/i);
    expect(failed.description).not.toMatch(/nothing to add/i);
  });

  test('an empty run says it assessed every rule and found nothing to add', () => {
    const empty = complianceJobOutcome(
      job({
        status: 'nothing-to-report',
        rulesAssessed: 24,
        batchesDone: 3,
        finishedAt: '2026-08-29T10:04:00',
      })
    );
    expect(empty.description).toMatch(/every rule/i);
    expect(empty.description).not.toMatch(/nothing was saved/i);
  });

  test('a productive run counts what it created', () => {
    const one = complianceJobOutcome(
      job({ status: 'succeeded', createdCount: 1, rulesAssessed: 24 })
    );
    const many = complianceJobOutcome(
      job({ status: 'succeeded', createdCount: 4, rulesAssessed: 24 })
    );
    expect(one.description).toContain('1 compliance');
    expect(many.description).toContain('4 compliances');
  });

  // Since backend #542 the worker re-checks the preconditions before it calls
  // the model, because the row outlives the configuration it was accepted
  // under. The sharpest case is the AI key going missing in a restart: that used
  // to be recorded as nothing-to-report, and is now a failure. So a failure can
  // arrive having assessed nothing and having never reached the model, and the
  // copy must not describe that as a run that broke off part way through.
  test('a failure that never assessed a rule does not claim it stopped part way', () => {
    const early = complianceJobOutcome(
      job({
        status: 'failed',
        rulesAssessed: 0,
        batchesDone: 0,
        attempt: 1,
        finishedAt: '2026-08-29T10:00:03',
        errorMessage:
          'The compliance AI service is not configured, so suggestions cannot be generated. Set the compliance AI key and try again.',
      })
    );
    expect(early.tone).toBe('failure');
    expect(early.description).toMatch(/nothing was saved/i);
    expect(early.description).not.toMatch(/stopped after 0/i);
    // Nothing was assessed, so there is no half-done run to describe.
    expect(early.description).not.toMatch(/did not reach/i);
    expect(early.description).toContain('Set the compliance AI key and try again.');
  });

  test('a run that broke part way still says where it got to', () => {
    const midRun = complianceJobOutcome(
      job({ status: 'failed', rulesAssessed: 11, errorMessage: 'The AI response was cut short.' })
    );
    expect(midRun.description).toContain('11');
    expect(midRun.description).toContain('24');
  });

  test('the two kinds of failure do not read identically', () => {
    const early = complianceJobOutcome(job({ status: 'failed', rulesAssessed: 0 }));
    const midRun = complianceJobOutcome(job({ status: 'failed', rulesAssessed: 11 }));
    expect(early.description).not.toBe(midRun.description);
  });

  test('the backend explanation for a failure is carried through', () => {
    const failed = complianceJobOutcome(
      job({
        status: 'failed',
        errorMessage: 'The AI response was cut short by its token limit.',
      })
    );
    expect(failed.description).toContain(
      'The AI response was cut short by its token limit.'
    );
  });
});

describe('progress while the run is in flight', () => {
  test('a queued run reports no progress yet but knows the size of the job', () => {
    const label = complianceJobProgressLabel(job({ status: 'queued' }));
    expect(label).toContain('24');
    expect(complianceJobPercent(job({ status: 'queued' }))).toBe(0);
  });

  test('a running job reports rules and batches, not just a spinner', () => {
    const label = complianceJobProgressLabel(
      job({ status: 'running', rulesAssessed: 10, batchesDone: 1 })
    );
    expect(label).toContain('10');
    expect(label).toContain('24');
    expect(label).toContain('1');
    expect(label).toContain('3');
  });

  test('the percentage follows the rules assessed', () => {
    expect(
      complianceJobPercent(job({ status: 'running', rulesAssessed: 12 }))
    ).toBe(50);
    expect(
      complianceJobPercent(job({ status: 'running', rulesAssessed: 24 }))
    ).toBe(100);
  });

  test('a job with no rules to assess does not divide by zero', () => {
    expect(
      complianceJobPercent(job({ rulesTotal: 0, batchesTotal: 0 }))
    ).toBe(0);
  });

  // The backend increments the attempt counter when a worker claims the row, so
  // a queued job carries the number of attempts already spent and a running one
  // carries the attempt it is making. Backend #542's per-claim fencing token
  // changed how that counter is guarded, not what it counts.
  test('a running job counts the attempt it is making', () => {
    expect(
      complianceJobProgressLabel(
        job({ status: 'running', attempt: 2, maxAttempts: 3, rulesAssessed: 4 })
      )
    ).toMatch(/attempt 2 of 3/i);
  });

  test('a first attempt is not worth naming', () => {
    expect(
      complianceJobProgressLabel(job({ status: 'running', attempt: 1, maxAttempts: 3 }))
    ).not.toMatch(/attempt/i);
    expect(
      complianceJobProgressLabel(job({ status: 'queued', attempt: 0, maxAttempts: 3 }))
    ).not.toMatch(/attempt/i);
  });

  test('a retried attempt is named, so a stalled bar is explained', () => {
    const label = complianceJobProgressLabel(
      job({ status: 'queued', attempt: 1, maxAttempts: 3, errorMessage: 'timed out' })
    );
    expect(label).toMatch(/attempt 2 of 3/i);
  });
});
