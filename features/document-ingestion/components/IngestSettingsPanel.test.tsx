/**
 * The admin setting says what AI reading sends, to which service, and that
 * the service states it keeps none of it and trains on none of it, beside
 * the switch. Only a system admin sees it.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  access,
  ingest,
  installMocks,
  renderWithClient,
  resetMocks,
  settings,
} from '../test/mocks';

installMocks();

const { IngestSettingsPanel } = await import('./IngestSettingsPanel');
const { AiReadingNotice } = await import('./AiReadingNotice');

beforeEach(() => {
  resetMocks();
  access.roles = [OrgRole.SYSTEM_ADMIN];
});
afterEach(cleanup);

describe('AiReadingNotice', () => {
  test('names the service and what it states about the text', async () => {
    const screen = renderWithClient(createElement(AiReadingNotice));
    const notice = screen.getByTestId('ai-reading-notice');
    expect(notice).toHaveTextContent(
      /sent to an outside AI service|sent to the AI service/
    );
    expect(
      await screen.findByText('AI reading is on for your organization.')
    ).toBeInTheDocument();
    expect(notice).toHaveTextContent(
      'The outside service is Example AI Cloud (model example-model-1).'
    );
    expect(
      screen.getByRole('link', { name: 'data privacy page' })
    ).toHaveAttribute('href', 'https://ai.example.test/privacy');
  });

  test('with no provider configured it falls back and shows no link', async () => {
    ingest.getSettings.mockImplementation(async () => ({
      ...settings,
      aiProvider: undefined,
      aiModel: undefined,
      aiProviderPrivacyUrl: '',
    }));
    const screen = renderWithClient(createElement(AiReadingNotice));
    await screen.findByText('AI reading is on for your organization.');
    expect(screen.getByTestId('ai-reading-notice')).toHaveTextContent(
      'The outside service is the configured AI service.'
    );
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('IngestSettingsPanel', () => {
  test('the switch turns AI reading off', async () => {
    const screen = renderWithClient(createElement(IngestSettingsPanel));
    const toggle = await screen.findByRole('switch', {
      name: 'Read tender files with the AI service',
    });
    expect(screen.getByTestId('ai-reading-notice')).toBeInTheDocument();
    fireEvent.click(toggle);
    await waitFor(() => expect(ingest.setLlmReading).toHaveBeenCalled());
    expect(ingest.setLlmReading.mock.calls[0]).toEqual([false]);
  });

  test('saves the monthly limit, empty meaning the default', async () => {
    const screen = renderWithClient(createElement(IngestSettingsPanel));
    fireEvent.change(await screen.findByLabelText('Monthly limit, dollars'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save limits' }));
    await waitFor(() => expect(ingest.setMonthlyLlmBudget).toHaveBeenCalled());
    expect(ingest.setMonthlyLlmBudget.mock.calls[0]).toEqual([
      { budgetUsd: 15, budgetTokens: null },
    ]);
  });

  test('a project manager does not see it', () => {
    access.roles = [OrgRole.PROJECT_MANAGER];
    const screen = renderWithClient(createElement(IngestSettingsPanel));
    expect(screen.queryByTestId('ingest-settings')).toBeNull();
    expect(ingest.getSettings).not.toHaveBeenCalled();
  });
});
