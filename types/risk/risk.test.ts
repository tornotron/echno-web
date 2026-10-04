import { describe, expect, it } from 'bun:test';
import {
  RISK_CATEGORIES,
  RISK_CATEGORY_DESCRIPTIONS,
  isRiskCategory,
  riskCategoryLabel,
} from './risk';
import { RISK_SUBCATEGORIES } from './risk-subcategories';

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

describe('risk sub-categories', () => {
  it('lists the 133 standard sub-categories under the nineteen categories', () => {
    expect(Object.keys(RISK_SUBCATEGORIES).toSorted()).toEqual(
      [...RISK_CATEGORIES].toSorted()
    );
    const all = Object.values(RISK_SUBCATEGORIES).flat();
    expect(all).toHaveLength(133);
    for (const sub of all) {
      expect(sub.name.length).toBeGreaterThan(0);
      expect(sub.name.length).toBeLessThanOrEqual(255);
    }
    expect(RISK_SUBCATEGORIES['design-engineering'][0].name).toBe(
      'Incomplete or delayed design'
    );
  });
});
