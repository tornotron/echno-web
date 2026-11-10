import { describe, expect, test } from 'bun:test';
import { managersAbove } from './transfer-targets';

const director = { id: 4, name: 'Director' };
const operationsHead = { id: 3, name: 'Operations head', managerId: 4 };
const projectManager = { id: 2, name: 'Project manager', managerId: 3 };
const peer = { id: 5, name: 'Peer', managerId: 3 };
const managers = [director, operationsHead, projectManager, peer];

describe('managersAbove', () => {
  test('lists the reporting line above the approver, nearest first', () => {
    expect(managersAbove(projectManager, managers)).toEqual([
      operationsHead,
      director,
    ]);
  });

  test('leaves out peers and the approver', () => {
    const names = managersAbove(projectManager, managers).map((m) => m.name);
    expect(names).not.toContain('Peer');
    expect(names).not.toContain('Project manager');
  });

  test('offers nobody to the top of the line or an unknown approver', () => {
    expect(managersAbove(director, managers)).toEqual([]);
    expect(managersAbove(undefined, managers)).toEqual([]);
  });

  test('stops at a loop in the manager links', () => {
    const a = { id: 10, managerId: 11 };
    const b = { id: 11, managerId: 10 };
    expect(managersAbove(a, [a, b])).toEqual([b]);
  });
});
