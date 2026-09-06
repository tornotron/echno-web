/**
 * Who recorded a consumption against a task is a way out of the task and into
 * the consumptions register, narrowed to that person (web#35).
 *
 * This is the cross-module half of the request: standing on one record and
 * asking for another module's list already filtered, rather than going to that
 * module and re-selecting the person. The consumptions register loads its whole
 * collection and narrows over it, so the list the link opens is the answer and
 * not one page of it.
 *
 * **`createdBy` is an employee id**, documented "Employee who recorded the
 * consumption", so this is an `?employeeId=` link under the `creator` slug the
 * register already reads. A `?userId=` link would compare an id from the user
 * table against a column of employee ids, which returns the right rows under
 * the right name for as long as the two sequences run in lockstep on a fresh
 * database and then quietly names somebody else.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { ConsumptionType } from '@tornotron/echno-core/materials/types';
import type { MaterialConsumption } from '@tornotron/echno-core/materials/types';
import type { Task } from '@tornotron/echno-core/task/types';

let rows: MaterialConsumption[] = [];

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useRouter: () => ({ push: () => {} }),
}));

import * as realConsumptionHooks from '@tornotron/echno-core/material-consumption/hooks';

mock.module('@tornotron/echno-core/material-consumption/hooks', () => ({
  ...realConsumptionHooks,
  useConsumptionsByTask: () => ({ data: rows, isLoading: false }),
}));

const tabModule = await import('./task-consumptions-tab');
const { TaskConsumptionsTab } = tabModule;

afterEach(() => {
  cleanup();
  rows = [];
});

function consumption(
  overrides: Partial<MaterialConsumption> = {}
): MaterialConsumption {
  return {
    id: 1,
    consumptionDate: '2026-09-01T00:00:00Z',
    materialId: 3,
    materialName: 'OPC 53 cement',
    quantity: 40,
    consumptionType: ConsumptionType.usedFromStock,
    createdBy: { id: 8, name: 'Ravi Kumar' },
    ...overrides,
  } as MaterialConsumption;
}

/** Every href the tab rendered for the given consumptions. */
function hrefs(consumptions: MaterialConsumption[]): string[] {
  rows = consumptions;
  const { container } = render(
    createElement(TaskConsumptionsTab, {
      task: { id: 5, title: 'Slab pour' } as Task,
    })
  );
  return [...container.querySelectorAll('a')].map(
    (a) => a.getAttribute('href') ?? ''
  );
}

describe('the person who recorded a consumption on a task', () => {
  test('links to the consumptions register narrowed to them', () => {
    const found = hrefs([consumption()]);

    expect(
      found.some((h) =>
        h.includes('/resources/material-consumptions?employeeId=8&role=creator')
      )
    ).toBe(true);
  });

  test('travels as an employee id and not a user id', () => {
    const found = hrefs([consumption()]);

    expect(found.some((h) => h.includes('userId=8'))).toBe(false);
  });

  test('carries the id of the person on that row', () => {
    // Two rows recorded by two people. An href built once outside the row
    // passes a single-row fixture and fails here, which is the failure a short
    // fixture hides.
    const found = hrefs([
      consumption({ id: 1, createdBy: { id: 8, name: 'Ravi Kumar' } }),
      consumption({ id: 2, createdBy: { id: 21, name: 'Meera Nair' } }),
    ]);

    expect(found.some((h) => h.includes('employeeId=8&role=creator'))).toBe(
      true
    );
    expect(found.some((h) => h.includes('employeeId=21&role=creator'))).toBe(
      true
    );
  });

  test('does not link the "Record Consumption" action to a person filter', () => {
    // The tab already had an anchor to the register's create route. A guard
    // that only counted anchors, or matched the route without the parameters,
    // would pass on that one whatever happened to the name in the table.
    const found = hrefs([]);

    expect(found.some((h) => h.includes('role=creator'))).toBe(false);
  });
});
