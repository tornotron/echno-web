/**
 * The filter bar, and the two things a later edit could quietly take away.
 *
 * **It is one bar of seven controls.** The count is asserted directly because
 * the reason this component exists is to keep the search box, the four
 * narrowing selects, the day and the page size together; a change that leaves
 * one of them behind on the page is the failure being guarded against, and
 * nothing else in the suite would notice it.
 *
 * **The day control reports a `Date`.** The input hands back `YYYY-MM-DD` and
 * the page stores a `Date`, so the conversion lives here. Its type alone does
 * not pin it: a conversion that ignored the typed value and returned today
 * would still compile.
 */
import { describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import type { Project } from '@tornotron/echno-core/project/types';

const { AttendanceFilterBar } = await import('./attendance-filter-bar');

const projects = [
  { id: 3, projectName: 'Riverside Tower' },
] as unknown as Project[];

function renderBar(
  props: Partial<Parameters<typeof AttendanceFilterBar>[0]> = {}
) {
  const onSelectedDateChange = mock((_value: Date) => {});
  const onSearchQueryChange = mock((_value: string) => {});
  const { container } = render(
    createElement(AttendanceFilterBar, {
      searchQuery: '',
      onSearchQueryChange,
      statusFilter: 'all',
      onStatusFilterChange: () => {},
      geofenceHoldFilter: 'all' as const,
      onGeofenceHoldFilterChange: () => {},
      decisionFilter: 'all' as const,
      onDecisionFilterChange: () => {},
      projectFilter: 'all',
      onProjectFilterChange: () => {},
      projects,
      selectedDate: new Date('2026-08-14T00:00:00Z'),
      onSelectedDateChange,
      itemsPerPage: 10,
      onItemsPerPageChange: () => {},
      ...props,
    })
  );
  return { container, onSelectedDateChange, onSearchQueryChange };
}

describe('AttendanceFilterBar', () => {
  test('renders the whole bar: the search box, the day, and five selects', () => {
    const { container } = renderBar();

    // Radix renders each select trigger as a combobox button.
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(5);
    expect(container.querySelectorAll('input[type="date"]')).toHaveLength(1);
    expect(
      container.querySelectorAll('input:not([type="date"])')
    ).toHaveLength(1);
  });

  test('the day control reports the typed day as a Date', () => {
    const { container, onSelectedDateChange } = renderBar();
    const dateInput = container.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;

    expect(dateInput.value).toBe('2026-08-14');

    fireEvent.change(dateInput, { target: { value: '2026-09-01' } });

    expect(onSelectedDateChange).toHaveBeenCalledTimes(1);
    const reported = onSelectedDateChange.mock.calls[0][0];
    expect(reported).toBeInstanceOf(Date);
    expect(reported.toISOString().slice(0, 10)).toBe('2026-09-01');
  });

  test('the search box reports what was typed', () => {
    const { container, onSearchQueryChange } = renderBar();
    const searchInput = container.querySelector(
      'input:not([type="date"])'
    ) as HTMLInputElement;

    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(onSearchQueryChange).toHaveBeenCalledWith('Priya');
  });
});
