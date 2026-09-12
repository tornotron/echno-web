import type { ChecklistTemplate } from '@tornotron/echno-core/inspection/types';
import { templateApplies } from '@tornotron/echno-core/inspection/types';

/** Filters for the checklist list: a trade code and an element type code, either empty for all. */
export interface TemplateListFilters {
  trade: string;
  elementType: string;
}

/**
 * Narrows the template list by trade and by applicability to an element type.
 * A template with no applicability set suits every element, so it survives
 * the element type filter; the trade filter is exact.
 */
export function filterTemplates(
  templates: readonly ChecklistTemplate[],
  filters: TemplateListFilters
): ChecklistTemplate[] {
  return templates.filter(
    (template) =>
      (filters.trade === '' || template.trade === filters.trade) &&
      (filters.elementType === '' ||
        templateApplies(template, filters.elementType))
  );
}
