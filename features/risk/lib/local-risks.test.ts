import { describe, expect, it } from 'bun:test';
import { toImportRequests } from './local-risks';

describe('toImportRequests', () => {
  it('keeps a well formed entry as it was, with its id as the import reference', () => {
    const [line] = toImportRequests([
      {
        id: 'local-1',
        projectId: 7,
        riskId: 'R-001',
        title: ' Late drawings ',
        description: 'Podium slab',
        category: 'design-engineering',
        status: 'analysed',
        owner: 'Ravi',
        probability: 'high',
        impact: 'major',
        riskScore: 16,
        residualProbability: 'low',
        residualImpact: 'minor',
        residualScore: 4,
        responseType: 'avoid',
        contingencyPlan: '',
        identifiedDate: '2026-09-01',
        reviewDate: '2026-09-15',
        costImpact: 1500.555,
        scheduleImpact: 3,
      },
    ]);
    expect(line).toEqual({
      title: 'Late drawings',
      description: 'Podium slab',
      category: 'design-engineering',
      subCategory: undefined,
      status: 'analysed',
      owner: 'Ravi',
      probability: 'high',
      impact: 'major',
      residualProbability: 'low',
      residualImpact: 'minor',
      responseType: 'avoid',
      contingencyPlan: undefined,
      identifiedDate: '2026-09-01',
      reviewDate: '2026-09-15',
      closedDate: undefined,
      costImpact: 1500.56,
      scheduleImpact: 3,
      importRef: 'local-1',
    });
  });

  it('orders by the local R-number and keeps an old generic category', () => {
    const lines = toImportRequests([
      { id: 'b', riskId: 'R-010', title: 'Ten', category: 'schedule' },
      { id: 'a', riskId: 'R-002', title: 'Two', category: 'cost' },
    ]);
    expect(lines.map((l) => l.title)).toEqual(['Two', 'Ten']);
    expect(lines.map((l) => l.category)).toEqual(['cost', 'schedule']);
  });

  it('repairs what the server would refuse rather than failing the import', () => {
    const [line] = toImportRequests([
      {
        id: 'x',
        title: '   ',
        category: 'weather',
        status: 'escalated',
        probability: 'likely',
        identifiedDate: '01/09/2026',
        costImpact: -5,
        scheduleImpact: 'soon',
      },
    ]);
    expect(line.title).toBe('Untitled risk');
    expect(line.category).toBe('schedule-planning');
    expect(line.status).toBe('identified');
    expect(line.probability).toBe('medium');
    expect(line.identifiedDate).toBeUndefined();
    expect(line.costImpact).toBeUndefined();
    expect(line.scheduleImpact).toBeUndefined();
  });

  it('skips entries that are not objects', () => {
    expect(toImportRequests([null, 'text', 3])).toEqual([]);
  });
});
