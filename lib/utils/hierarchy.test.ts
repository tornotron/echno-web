import { describe, expect, test } from 'bun:test';
import type { Employee } from '@tornotron/echno-core/employee/types';
import { buildTree } from './hierarchy';

function emp(over: Record<string, unknown>): Employee {
  return over as unknown as Employee;
}

describe('buildTree', () => {
  test('an employee with no manager is a root', () => {
    const roots = buildTree([emp({ id: 1 })]);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(1);
    expect(roots[0].children).toEqual([]);
  });

  test('nests a child under its manager', () => {
    const roots = buildTree([emp({ id: 1 }), emp({ id: 2, managerId: 1 })]);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(1);
    expect(roots[0].children.map((c) => c.id)).toEqual([2]);
  });

  test('a manager not in the set makes the employee a root (orphan)', () => {
    const roots = buildTree([emp({ id: 2, managerId: 99 })]);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(2);
  });

  test('skips employees whose id is undefined', () => {
    const roots = buildTree([emp({ id: undefined }), emp({ id: 1 })]);
    expect(roots).toHaveLength(1);
    expect(roots[0].id).toBe(1);
  });

  test('supports multiple roots and nested children', () => {
    const roots = buildTree([
      emp({ id: 1 }),
      emp({ id: 2, managerId: 1 }),
      emp({ id: 3, managerId: 2 }),
      emp({ id: 10 }),
    ]);
    expect(roots.map((r) => r.id).toSorted((a, b) => a - b)).toEqual([1, 10]);
    const root1 = roots.find((r) => r.id === 1)!;
    expect(root1.children.map((c) => c.id)).toEqual([2]);
    expect(root1.children[0].children.map((c) => c.id)).toEqual([3]);
  });
});
