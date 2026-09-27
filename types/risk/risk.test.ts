import { describe, expect, it } from 'bun:test';
import {
  RISK_CATEGORIES,
  RISK_CATEGORY_DESCRIPTIONS,
  isRiskCategory,
  riskCategoryLabel,
} from './risk';

describe('risk categories', () => {
  it('offers the nineteen construction categories, each with a description', () => {
    expect(RISK_CATEGORIES).toHaveLength(19);
    expect(RISK_CATEGORIES[0]).toBe('design-engineering');
    for (const category of RISK_CATEGORIES) {
      expect(RISK_CATEGORY_DESCRIPTIONS[category].length).toBeGreaterThan(0);
    }
  });

  it('labels a new category from the construction list', () => {
    expect(riskCategoryLabel('health-safety-security')).toBe(
      'Health, Safety & Security'
    );
  });

  it('still labels a risk saved under the earlier generic list', () => {
    expect(isRiskCategory('schedule')).toBe(false);
    expect(riskCategoryLabel('schedule')).toBe('Schedule');
    expect(riskCategoryLabel('quality')).toBe('Quality');
  });
});
