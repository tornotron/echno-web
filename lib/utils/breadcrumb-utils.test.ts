import { describe, expect, test } from 'bun:test';
import type { Employee } from '@tornotron/echno-core/employee/types';
import type { Project } from '@tornotron/echno-core/project/types';
import type { Vendor } from '@tornotron/echno-core/vendor/types';
import {
  applyBreadcrumbOverrides,
  getNameForId,
  truncateText,
  type BreadcrumbItemData,
} from './breadcrumb-utils';

const employees = [
  { id: 3, name: 'Anjali' },
  { id: 4, name: 'Ravi' },
] as unknown as Employee[];
const projects = [
  { id: 2, projectName: 'Tower A' },
] as unknown as Project[];

describe('truncateText', () => {
  test('returns the text unchanged when within the limit', () => {
    expect(truncateText('short', 30)).toBe('short');
    expect(truncateText('exactly-ten', 11)).toBe('exactly-ten');
  });

  test('slices and appends an ellipsis when over the limit', () => {
    expect(truncateText('abcdef', 3)).toBe('abc...');
  });

  test('defaults to a 30-char limit', () => {
    const long = 'x'.repeat(40);
    expect(truncateText(long)).toBe('x'.repeat(30) + '...');
  });
});

describe('getNameForId', () => {
  test('chat rooms use the room name or a Room fallback', () => {
    expect(
      getNameForId('5', ['chat'], undefined, undefined, undefined, undefined, undefined, undefined, 'General')
    ).toBe('General');
    expect(getNameForId('5', ['chat'])).toBe('Room 5');
  });

  test('a vendor resolves by its object or a Vendor fallback', () => {
    const vendor = { name: 'BuildMart' } as unknown as Vendor;
    expect(
      getNameForId('9', ['vendors'], undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, vendor)
    ).toBe('BuildMart');
    expect(getNameForId('9', ['vendors'])).toBe('Vendor 9');
  });

  test('a project is found in the list, else a Project fallback', () => {
    expect(
      getNameForId('2', ['projects'], undefined, undefined, undefined, projects)
    ).toBe('Tower A');
    expect(
      getNameForId('99', ['projects'], undefined, undefined, undefined, projects)
    ).toBe('Project 99');
  });

  test('an employee is found by id, else the literal Employee', () => {
    expect(getNameForId('3', ['employees'], employees)).toBe('Anjali');
    expect(getNameForId('99', ['employees'], employees)).toBe('Employee');
  });

  test('delegates to the fallback resolver for unmapped segments', () => {
    const resolver = (segment: string, numericId: number) =>
      segment === 'gadgets' ? `Gadget ${numericId}` : undefined;
    expect(
      getNameForId('7', ['gadgets'], undefined, undefined, undefined, undefined, undefined, undefined, undefined, resolver)
    ).toBe('Gadget 7');
  });

  test('returns the raw id when nothing matches', () => {
    expect(getNameForId('7', ['unknown-segment'])).toBe('7');
  });
});

function crumb(over: Partial<BreadcrumbItemData>): BreadcrumbItemData {
  return {
    href: '/x',
    label: 'X',
    fullName: 'X',
    isLast: false,
    isNonInteractive: false,
    isTruncated: false,
    ...over,
  };
}

describe('applyBreadcrumbOverrides', () => {
  test('relabels the Apply crumb in leave edit mode', () => {
    const items = [
      crumb({ label: 'Apply for Leave', fullName: 'Apply for Leave' }),
    ];
    applyBreadcrumbOverrides(
      items,
      '/dashboard/workforce/leaves/apply',
      new URLSearchParams('edit=42')
    );
    expect(items[0].label).toBe('Edit Leave Request');
    expect(items[0].fullName).toBe('Edit Leave Request');
  });

  test('leaves items untouched without the edit param', () => {
    const items = [
      crumb({ label: 'Apply for Leave', fullName: 'Apply for Leave' }),
    ];
    applyBreadcrumbOverrides(
      items,
      '/dashboard/workforce/leaves/apply',
      new URLSearchParams('')
    );
    expect(items[0].label).toBe('Apply for Leave');
  });

  test('a new issue from a task replaces Issues with Tasks then the task title', () => {
    const items = [
      crumb({ label: 'Project', href: '/dashboard/projects/1' }),
      crumb({ label: 'Issues', href: '/dashboard/projects/1/issues' }),
      crumb({ label: 'New', href: '/dashboard/projects/1/issues/new', isLast: true }),
    ];
    applyBreadcrumbOverrides(
      items,
      '/dashboard/projects/1/issues/new',
      new URLSearchParams('taskId=8'),
      { title: 'Fix the wall' } as never
    );
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(['Project', 'Tasks', 'Fix the wall', 'New']);
    // hrefs derived from the project href
    const tasksCrumb = items.find((i) => i.label === 'Tasks')!;
    expect(tasksCrumb.href).toBe('/dashboard/projects/1/tasks');
    const taskCrumb = items.find((i) => i.label === 'Fix the wall')!;
    expect(taskCrumb.href).toBe('/dashboard/projects/1/tasks/8');
    // isLast recalculated onto the final crumb only
    expect(items.at(-1)!.isLast).toBe(true);
    expect(tasksCrumb.isLast).toBe(false);
  });
});
