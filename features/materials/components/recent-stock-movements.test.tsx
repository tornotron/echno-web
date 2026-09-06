/**
 * Who recorded a stock movement is a way out of the material and into the
 * consumptions register, narrowed to that person (web#35).
 *
 * The register is the one screen that can answer "everything this person
 * booked out", and until now the material detail named the person without
 * offering the route to it. `useMaterialConsumptions` loads the whole
 * collection and the register narrows over it, so the filtered list is the
 * answer rather than one page of it.
 *
 * **The id kind is the thing to hold still.** `createdBy` on a consumption is
 * documented "Employee who recorded the consumption", so the link is an
 * `?employeeId=` one and the register resolves the name through the employee
 * directory. A `?userId=` link would compare an id from the user table against
 * a column holding employee ids. That does not fail: on a fresh database the
 * two sequences run in lockstep, so it returns the right rows under the right
 * name until enough rows exist on one side to push them apart. The href
 * assertions below pin the parameter name, not just the number.
 *
 * Assertions read the anchor's `href` rather than a rendered node: an assertion
 * that fails while printing a node hangs the reporter.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { ConsumptionType } from '@tornotron/echno-core/materials/types';
import type { MaterialConsumption } from '@tornotron/echno-core/materials/types';
import { RecentStockMovements } from './recent-stock-movements';

afterEach(cleanup);

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

/** Every href the card rendered. */
function hrefs(consumptions: MaterialConsumption[]): string[] {
  const { container } = render(
    createElement(RecentStockMovements, { consumptions })
  );
  return [...container.querySelectorAll('a')].map(
    (a) => a.getAttribute('href') ?? ''
  );
}

describe('the person who recorded a movement', () => {
  test('links to the consumptions register narrowed to them', () => {
    const found = hrefs([consumption()]);

    expect(
      found.some((h) =>
        h.includes('/resources/material-consumptions?employeeId=8&role=creator')
      )
    ).toBe(true);
  });

  test('travels as an employee id and not a user id', () => {
    // The whole failure mode this file guards. `?userId=8` would read as a
    // working link and name the wrong person only once the two sequences
    // diverge, which is long after anybody would connect it to this change.
    const found = hrefs([consumption()]);

    expect(found.some((h) => h.includes('userId=8'))).toBe(false);
  });

  test('carries the id of the person on that row, not the first one rendered', () => {
    // Two movements by two people. Building the href outside the row, or
    // reusing one id across the list, passes a single-row fixture and fails
    // here. Dates are ordered so both survive the five-row slice.
    const found = hrefs([
      consumption({
        id: 1,
        consumptionDate: '2026-09-02T00:00:00Z',
        createdBy: { id: 8, name: 'Ravi Kumar' },
      }),
      consumption({
        id: 2,
        consumptionDate: '2026-09-01T00:00:00Z',
        createdBy: { id: 21, name: 'Meera Nair' },
      }),
    ]);

    expect(found.some((h) => h.includes('employeeId=8&role=creator'))).toBe(
      true
    );
    expect(found.some((h) => h.includes('employeeId=21&role=creator'))).toBe(
      true
    );
  });

  test('is still named when the row carries no id to filter on', () => {
    // A link with no id would point at the register unnarrowed while reading as
    // one person's work, which is worse than plain text.
    const rows = [
      consumption({
        // The name survives; only the id is missing, which is the shape the
        // register's own accessor already guards against with `createdBy?.id`.
        createdBy: {
          name: 'Ravi Kumar',
        } as unknown as MaterialConsumption['createdBy'],
      }),
    ];
    const { container } = render(
      createElement(RecentStockMovements, { consumptions: rows })
    );
    const found = [...container.querySelectorAll('a')].map(
      (a) => a.getAttribute('href') ?? ''
    );

    expect(found.some((h) => h.includes('role=creator'))).toBe(false);
  });
});
