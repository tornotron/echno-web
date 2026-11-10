/**
 * Quality: an ITP row says which fields the specification leaves unsaid,
 * copying to a checklist template sends a trade only when one is picked and
 * is offered only to a role that defines checklists, and the project's ITP
 * lists the rows of all its packages.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  access,
  ingest,
  installMocks,
  page,
  renderWithClient,
  resetMocks,
} from '../test/mocks';

installMocks();

const { ProjectItp, QualityRegister } = await import('./QualityReview');

const rows = [
  {
    id: 'q1',
    packageId: 'pkg-1',
    projectId: 7,
    candidateId: 'c-q1',
    subject: 'Concrete',
    activity: 'Cube compressive strength',
    material: 'Concrete',
    grade: 'M25',
    standards: ['IS 516'],
    test: 'Compression test on 150 mm cubes',
    frequency: 'One set per 50 cum',
    acceptanceCriterion: 'Mean of 3 cubes at 28 days not below 25 MPa',
    holdOrWitnessPoint: 'Witness',
    requiredDocuments: ['Test report'],
    notStated: [],
    citations: [],
  },
  {
    id: 'q2',
    packageId: 'pkg-1',
    projectId: 7,
    candidateId: 'c-q2',
    subject: 'Reinforcement',
    activity: 'Tensile test of bars',
    standards: ['IS 1786'],
    requiredDocuments: [],
    notStated: ['frequency'],
    citations: [],
    tradeName: 'Concrete',
    templateId: 'tpl-1',
    templateVersion: 2,
  },
];

beforeEach(() => {
  resetMocks();
  ingest.listQualityRequirements.mockImplementation(async () => page(rows));
  ingest.listProjectQualityRequirements.mockImplementation(async () =>
    page(rows)
  );
  ingest.copyQualityRequirementsToTemplate.mockImplementation(async () => ({
    rows: [{ requirementId: 'q1', outcome: 'COPIED' }],
    templates: [
      {
        templateId: 'tpl-1',
        templateName: 'Concrete ITP',
        tradeId: 'trade-conc',
        tradeName: 'Concrete',
        version: 3,
        active: false,
        created: false,
        itemsAdded: 1,
      },
    ],
  }));
});
afterEach(cleanup);

describe('QualityRegister', () => {
  test('says which fields are not stated, and which rows were copied', async () => {
    const screen = renderWithClient(
      createElement(QualityRegister, { packageId: 'pkg-1' })
    );
    expect(
      await screen.findByText('Not stated: frequency')
    ).toBeInTheDocument();
    expect(screen.getByText('Copied, version 2')).toBeInTheDocument();
  });

  test('copies picked rows without a trade unless one is chosen', async () => {
    access.roles = [OrgRole.SYSTEM_ADMIN];
    const screen = renderWithClient(
      createElement(QualityRegister, { packageId: 'pkg-1' })
    );
    fireEvent.click(
      await screen.findByLabelText('Pick Cube compressive strength')
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Copy 1 row to a checklist template',
      })
    );
    await waitFor(() =>
      expect(ingest.copyQualityRequirementsToTemplate).toHaveBeenCalledTimes(1)
    );
    expect(ingest.copyQualityRequirementsToTemplate.mock.calls[0]?.[0]).toEqual(
      { requirementIds: ['q1'] }
    );
    expect(
      await screen.findByText(/Added to Concrete ITP \(Concrete\)/)
    ).toHaveTextContent('version 3: 1 item added, not active yet.');
    expect(screen.getByText('Cube compressive strength: copied')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Pick Tensile test of bars'));
    fireEvent.change(screen.getByLabelText('Trade'), {
      target: { value: 'trade-conc' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Copy 1 row to a checklist template',
      })
    );
    await waitFor(() =>
      expect(ingest.copyQualityRequirementsToTemplate).toHaveBeenCalledTimes(2)
    );
    expect(ingest.copyQualityRequirementsToTemplate.mock.calls[1]?.[0]).toEqual(
      { requirementIds: ['q2'], tradeId: 'trade-conc' }
    );
  });

  test('a role that cannot define checklists gets no copy action', async () => {
    const screen = renderWithClient(
      createElement(QualityRegister, { packageId: 'pkg-1' })
    );
    await screen.findByText('Cube compressive strength');
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /checklist template/ })
    ).toBeNull();
  });
});

describe('ProjectItp', () => {
  test("lists the project's rows", async () => {
    const screen = renderWithClient(
      createElement(ProjectItp, { projectId: 7 })
    );
    expect(await screen.findByTestId('project-itp')).toHaveTextContent(
      'Tensile test of bars'
    );
    expect(ingest.listProjectQualityRequirements.mock.calls[0]).toEqual([
      7,
      { size: 200 },
    ]);
  });

  test('says when no row came from a document', async () => {
    ingest.listProjectQualityRequirements.mockImplementation(async () =>
      page([])
    );
    const screen = renderWithClient(
      createElement(ProjectItp, { projectId: 7 })
    );
    expect(
      await screen.findByText(
        'No quality requirement of this project came from a document.'
      )
    ).toBeInTheDocument();
  });
});
