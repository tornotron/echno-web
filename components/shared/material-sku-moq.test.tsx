/**
 * Picking a material in a consumption, stock adjustment or indent form showed
 * only its name. The form now shows its SKU and minimum order quantity too.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { MaterialSkuMoq } from './material-sku-moq';

afterEach(cleanup);

describe('MaterialSkuMoq', () => {
  test('shows the SKU and the MOQ with its unit', () => {
    const { container } = render(
      <MaterialSkuMoq material={{ sku: 'TMT-12', moq: 50, unit: 'MT' }} />
    );
    expect(container.textContent).toBe('SKU: TMT-12 · MOQ: 50 MT');
  });

  test('shows only what the record has', () => {
    const { container } = render(
      <MaterialSkuMoq material={{ sku: 'TMT-12', unit: 'MT' }} />
    );
    expect(container.textContent).toBe('SKU: TMT-12');
  });

  test('an MOQ of 0 means no minimum, so it is left out', () => {
    const { container } = render(
      <MaterialSkuMoq material={{ moq: 0, unit: 'MT' }} />
    );
    expect(container.textContent).toBe('');
  });

  test('shows nothing before a material is picked', () => {
    const { container } = render(<MaterialSkuMoq />);
    expect(container.textContent).toBe('');
  });
});
