/**
 * Typing after a picked mention reopened the list, because the search for the
 * trigger stopped at the '@' inside the mention's own token. The list found
 * nobody, and while open it swallowed Enter, so the message could not be sent.
 */
import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { ChatParticipant } from '@/types/chat';
import { ChatComposer } from './chat-composer';

const participants = [
  { employeeId: 12, employee: { name: 'Asha Menon' } },
] as unknown as ChatParticipant[];

type Sent = { content: string; mentions?: number[] };

function setup() {
  const sent: Sent[] = [];
  const utils = render(
    <ChatComposer
      participants={participants}
      onSend={(content, _replyTo, mentions) => {
        sent.push({ content, mentions });
      }}
    />
  );
  const box = utils.container.querySelector('textarea') as HTMLTextAreaElement;
  const type = (text: string) =>
    fireEvent.change(box, {
      target: { value: text, selectionStart: text.length },
    });
  const press = (key: string) => fireEvent.keyDown(box, { key });
  return { ...utils, box, type, press, sent };
}

afterEach(cleanup);

describe('ChatComposer mentions', () => {
  test('text typed after a picked person leaves the list closed, and Enter sends', () => {
    const { box, type, press, sent, queryByText } = setup();

    type('@As');
    expect(queryByText('Members')).toBeInTheDocument();
    press('Enter');
    expect(box.value).toBe('@[Asha Menon](12) ');

    type('@[Asha Menon](12) please check');
    expect(queryByText('Members')).toBeNull();

    press('Enter');
    expect(sent).toEqual([
      { content: '@[Asha Menon](12) please check', mentions: [12] },
    ]);
  });

  test('text after a task mention stays closed when a person was mentioned earlier', () => {
    const { type, queryByText } = setup();
    type('@[Asha Menon](12) see #[Pour slab](task:5) today');
    expect(queryByText('Members')).toBeNull();
  });

  test('a new @ after a mention opens the list again', () => {
    const { type, queryByText } = setup();
    type('@[Asha Menon](12) and @');
    expect(queryByText('Members')).toBeInTheDocument();
  });

  test('Enter sends when the list has nobody to pick', () => {
    const { type, press, sent, queryByText } = setup();
    type('@nobody here');
    expect(queryByText('No members found')).toBeInTheDocument();
    press('Enter');
    expect(sent.map((s) => s.content)).toEqual(['@nobody here']);
  });

  test('Escape closes the list for that @, and the next key does not reopen it', () => {
    const { type, press, queryByText } = setup();
    type('@A');
    press('Escape');
    expect(queryByText('Members')).toBeNull();
    type('@As');
    expect(queryByText('Members')).toBeNull();
    type('@As and @');
    expect(queryByText('Members')).toBeInTheDocument();
  });
});
