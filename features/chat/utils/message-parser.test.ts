import { describe, expect, test } from 'bun:test';
import { ChatEntityType } from '@/types/chat';
import {
  buildEntityToken,
  buildMentionToken,
  parseMentions,
  stripMentions,
} from './message-parser';

describe('parseMentions', () => {
  test('empty string yields no segments', () => {
    expect(parseMentions('')).toEqual([]);
  });

  test('plain text only', () => {
    expect(parseMentions('hello world')).toEqual([
      { type: 'text', text: 'hello world' },
    ]);
  });

  test('a lone mention token', () => {
    expect(parseMentions('@[Alice](1)')).toEqual([
      { type: 'mention', name: 'Alice', employeeId: 1 },
    ]);
  });

  test('a lone entity token', () => {
    expect(parseMentions('#[Task A](task:5)')).toEqual([
      {
        type: 'entity',
        label: 'Task A',
        entityType: ChatEntityType.task,
        entityId: 5,
      },
    ]);
  });

  test('mixed text, mention and entity in order', () => {
    expect(
      parseMentions('Hello @[Alice](1) see #[Task A](task:5)')
    ).toEqual([
      { type: 'text', text: 'Hello ' },
      { type: 'mention', name: 'Alice', employeeId: 1 },
      { type: 'text', text: ' see ' },
      {
        type: 'entity',
        label: 'Task A',
        entityType: ChatEntityType.task,
        entityId: 5,
      },
    ]);
  });

  test('adjacent tokens with no text between them', () => {
    expect(parseMentions('@[A](1)#[B](issue:2)')).toEqual([
      { type: 'mention', name: 'A', employeeId: 1 },
      {
        type: 'entity',
        label: 'B',
        entityType: ChatEntityType.issue,
        entityId: 2,
      },
    ]);
  });

  test('an unknown entity type falls back to task', () => {
    expect(parseMentions('#[X](bogus:9)')).toEqual([
      {
        type: 'entity',
        label: 'X',
        entityType: ChatEntityType.task,
        entityId: 9,
      },
    ]);
  });

  test('malformed tokens are treated as plain text', () => {
    // Missing id / bad shape -> not a token, stays text
    expect(parseMentions('@[Alice]()')).toEqual([
      { type: 'text', text: '@[Alice]()' },
    ]);
    expect(parseMentions('#[Label](task:)')).toEqual([
      { type: 'text', text: '#[Label](task:)' },
    ]);
  });
});

describe('stripMentions', () => {
  test('reduces mentions to @Name and entities to #Label', () => {
    expect(stripMentions('Hi @[Alice](1) and #[Task A](task:5)')).toBe(
      'Hi @Alice and #Task A'
    );
  });

  test('leaves plain text untouched', () => {
    expect(stripMentions('nothing here')).toBe('nothing here');
  });
});

describe('token builders round-trip through the parser', () => {
  test('buildMentionToken is the inverse of parsing a mention', () => {
    const token = buildMentionToken('Bob Ray', 42);
    expect(token).toBe('@[Bob Ray](42)');
    expect(parseMentions(token)).toEqual([
      { type: 'mention', name: 'Bob Ray', employeeId: 42 },
    ]);
  });

  test('buildEntityToken is the inverse of parsing an entity', () => {
    const token = buildEntityToken('Big Project', ChatEntityType.project, 7);
    expect(token).toBe('#[Big Project](project:7)');
    expect(parseMentions(token)).toEqual([
      {
        type: 'entity',
        label: 'Big Project',
        entityType: ChatEntityType.project,
        entityId: 7,
      },
    ]);
  });
});
