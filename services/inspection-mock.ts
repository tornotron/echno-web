/**
 * ══════════════════════════════════════════════════════════════════════════
 *  TEMPORARY — DELETE THIS FILE WHEN THE INSPECTION BACKEND SHIPS.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * In-memory stand-in for the inspection REST API. It is the *only* file in the
 * module that holds fake data: the services, hooks, types and components above
 * it are the real implementation and do not change when the backend arrives.
 *
 * To cut over:
 *   1. Delete this file.
 *   2. In each of the three inspection services, delete the `mock*` call and
 *      uncomment the `api.*` line directly above it. Both are already written
 *      out, so the change is mechanical.
 *
 * Behaviour notes:
 *   - The store is mutable, so create / update / publish / submit all persist
 *     for the lifetime of the browser tab. That makes the whole flow
 *     exercisable end to end without a server.
 *   - Every method returns a structural clone, mirroring a real network
 *     boundary so no component can accidentally mutate the store in place.
 *   - `latency()` keeps the loading and skeleton states honest.
 */

import { ApiError } from '@/lib/api/api-client';
import {
  type ChecklistSchema,
  type CreateInspectionRequest,
  type CreateInspectionTemplateRequest,
  type CreateNcrCommentRequest,
  type CreateNcrDefectRequest,
  type Inspection,
  type InspectionAttachment,
  type InspectionSubmission,
  type InspectionTemplate,
  type InspectionTemplateVersion,
  type NcrComment,
  type NcrDefect,
  type ProjectDocument,
  type SaveInspectionSubmissionRequest,
  type UpdateInspectionRequest,
  type UpdateInspectionTemplateRequest,
  type UpdateNcrDefectRequest,
  CURRENT_SCHEMA_VERSION,
  InspectionResult,
  InspectionStatus,
  InspectionType,
  NcrSeverity,
  NcrStatus,
  SubmissionStatus,
  TemplateCategory,
  attachmentKindFromMime,
  resultFromCompliance,
  withNewElementIds,
} from '@/types/inspection';

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

const LATENCY_MS = 220;

function latency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const days = (offset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(9, 0, 0, 0);
  return date;
};

let nextId = 1000;
const newId = (): number => ++nextId;

/**
 * Turns a picked File into a stored-attachment record.
 *
 * The URL is an object URL so images and video actually render in the browser
 * during the mock phase. Those URLs die with the tab, which is the right
 * lifetime for throwaway data — the real uploader returns a durable URL and
 * nothing else here changes.
 */
function storeFile(file: File, uploadedByName = 'You'): InspectionAttachment {
  return {
    id: newId(),
    fileName: file.name,
    url: URL.createObjectURL(file),
    kind: attachmentKindFromMime(file.type),
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
    uploadedByName,
    createdAt: new Date(),
  };
}

/** A seeded attachment with no real bytes behind it. */
function seedAttachment(
  fileName: string,
  contentType: string,
  fileSize: number,
  uploadedByName: string,
  createdAt: Date
): InspectionAttachment {
  return {
    id: newId(),
    fileName,
    url: '',
    kind: attachmentKindFromMime(contentType),
    contentType,
    fileSize,
    uploadedByName,
    createdAt,
  };
}

// ---------------------------------------------------------------------------
// Seed schemas
// ---------------------------------------------------------------------------

/**
 * Sample content only — these live in data, never in application logic, so the
 * engine has no knowledge of PPE, rebar or anything else domain-specific.
 */
const SAFETY_SCHEMA: ChecklistSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  type: 'checklist',
  title: 'Daily Site Safety Inspection',
  description: 'Walk-round safety check completed at the start of each shift.',
  settings: { showProgress: true, allowSaveDraft: true, enableScoring: true },
  elements: [
    {
      id: 'sec-ppe',
      type: 'section',
      label: 'Personal Protective Equipment',
      description: 'Confirm PPE compliance across all trades on site.',
      children: [
        {
          id: 'ppe-helmet',
          type: 'yesNoNa',
          label: 'Safety helmets worn by all personnel',
          required: true,
        },
        {
          id: 'ppe-boots',
          type: 'yesNoNa',
          label: 'Safety footwear worn',
          required: true,
        },
        {
          id: 'ppe-vest',
          type: 'yesNoNa',
          label: 'High-visibility vests worn',
          required: true,
        },
        {
          id: 'ppe-notes',
          type: 'comment',
          label: 'PPE non-compliance details',
          placeholder: 'Who, where, and what action was taken',
          // Only asked when something actually failed.
          visibility: {
            match: 'any',
            when: [
              { element: 'ppe-helmet', operator: 'equals', value: 'NO' },
              { element: 'ppe-boots', operator: 'equals', value: 'NO' },
              { element: 'ppe-vest', operator: 'equals', value: 'NO' },
            ],
          },
        },
      ],
    },
    {
      id: 'sec-emergency',
      type: 'section',
      label: 'Emergency Equipment',
      children: [
        {
          id: 'emg-extinguisher',
          type: 'select',
          label: 'Fire extinguisher condition',
          required: true,
          options: [
            { label: 'Good', value: 'Good' },
            { label: 'Needs Service', value: 'Needs Service' },
            { label: 'Expired', value: 'Expired' },
          ],
        },
        {
          id: 'emg-exits',
          type: 'passFail',
          label: 'Emergency exits clear and signed',
          required: true,
        },
        {
          id: 'emg-signage',
          type: 'passFail',
          label: 'Safety signage displayed and legible',
        },
      ],
    },
    {
      id: 'sec-site',
      type: 'section',
      label: 'Site Conditions',
      collapsible: true,
      children: [
        {
          id: 'site-electrical',
          type: 'passFail',
          label: 'Electrical safety — leads, boards, earthing',
        },
        {
          id: 'site-height',
          type: 'passFail',
          label: 'Working at height controls in place',
        },
        {
          id: 'site-scaffold',
          type: 'passFail',
          label: 'Scaffolding tagged and inspected',
        },
        {
          id: 'site-housekeeping',
          type: 'rating',
          label: 'Housekeeping standard',
          validation: { max: 5 },
        },
        {
          id: 'site-photo',
          type: 'photo',
          label: 'Site condition photos',
        },
      ],
    },
    {
      id: 'sec-signoff',
      type: 'section',
      label: 'Sign-off',
      children: [
        {
          id: 'signoff-comments',
          type: 'textarea',
          label: 'General observations',
          placeholder: 'Anything else worth recording',
        },
        {
          id: 'signoff-signature',
          type: 'signature',
          label: 'Inspector signature',
        },
      ],
    },
  ],
};

const QA_QC_SCHEMA: ChecklistSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  type: 'checklist',
  title: 'Concrete Pour — Pre-Pour Check',
  description: 'Quality gate completed before any concrete is placed.',
  settings: { showProgress: true, allowSaveDraft: true, enableScoring: true },
  elements: [
    {
      id: 'sec-prep',
      type: 'section',
      label: 'Formwork & Preparation',
      children: [
        {
          id: 'prep-formwork',
          type: 'passFail',
          label: 'Formwork aligned, clean and sealed',
          required: true,
        },
        {
          id: 'prep-dimensions',
          type: 'passFail',
          label: 'Dimensions match approved drawing',
          required: true,
        },
        {
          id: 'prep-drawing',
          type: 'text',
          label: 'Drawing reference',
          placeholder: 'e.g. STR-L3-004 Rev C',
        },
      ],
    },
    {
      id: 'sec-rebar',
      type: 'section',
      label: 'Reinforcement',
      children: [
        {
          id: 'rebar-spacing',
          type: 'passFail',
          label: 'Bar spacing as per schedule',
          required: true,
        },
        {
          id: 'rebar-cover',
          type: 'number',
          label: 'Concrete cover (mm)',
          required: true,
          validation: { min: 20, max: 75 },
        },
        {
          id: 'rebar-laps',
          type: 'passFail',
          label: 'Lap lengths correct',
        },
      ],
    },
    {
      id: 'sec-mix',
      type: 'section',
      label: 'Concrete',
      children: [
        {
          id: 'mix-grade',
          type: 'select',
          label: 'Concrete grade',
          required: true,
          options: [
            { label: 'M20', value: 'M20' },
            { label: 'M25', value: 'M25' },
            { label: 'M30', value: 'M30' },
            { label: 'M40', value: 'M40' },
          ],
        },
        {
          id: 'mix-slump',
          type: 'number',
          label: 'Slump (mm)',
          validation: { min: 0, max: 200 },
        },
        {
          id: 'mix-date',
          type: 'date',
          label: 'Scheduled pour date',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface Store {
  templates: InspectionTemplate[];
  versions: InspectionTemplateVersion[];
  inspections: Inspection[];
  submissions: InspectionSubmission[];
  defects: NcrDefect[];
  comments: NcrComment[];
  projectDocuments: ProjectDocument[];
}

const store: Store = {
  templates: [
    {
      id: 1,
      name: 'Daily Site Safety Inspection',
      description: 'Standard shift-start safety walk-round.',
      category: TemplateCategory.safety,
      type: InspectionType.safety,
      schema: SAFETY_SCHEMA,
      currentVersion: 2,
      currentVersionId: 101,
      createdByName: 'Priya Nair',
      createdAt: days(-90),
      updatedAt: days(-12),
    },
    {
      id: 2,
      name: 'Concrete Pour — Pre-Pour Check',
      description: 'Quality gate before placing concrete.',
      category: TemplateCategory.qaQc,
      type: InspectionType.qaQc,
      schema: QA_QC_SCHEMA,
      currentVersion: 1,
      currentVersionId: 102,
      createdByName: 'Arun Mehta',
      createdAt: days(-60),
      updatedAt: days(-30),
    },
    {
      id: 3,
      name: 'Blockwork Quality Check',
      description: 'Draft — not yet published.',
      category: TemplateCategory.qaQc,
      type: InspectionType.qaQc,
      schema: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        type: 'checklist',
        title: 'Blockwork Quality Check',
        description: '',
        settings: {
          showProgress: true,
          allowSaveDraft: true,
          enableScoring: false,
        },
        elements: [
          {
            id: 'block-plumb',
            type: 'passFail',
            label: 'Walls plumb and level',
          },
        ],
      },
      currentVersion: 0,
      createdByName: 'Arun Mehta',
      createdAt: days(-5),
      updatedAt: days(-5),
    },
  ],

  versions: [
    {
      id: 100,
      templateId: 1,
      version: 1,
      schema: SAFETY_SCHEMA,
      createdAt: days(-90),
    },
    {
      id: 101,
      templateId: 1,
      version: 2,
      schema: SAFETY_SCHEMA,
      createdAt: days(-12),
    },
    {
      id: 102,
      templateId: 2,
      version: 1,
      schema: QA_QC_SCHEMA,
      createdAt: days(-30),
    },
  ],

  inspections: [
    {
      id: 501,
      inspectionNumber: 'INS-2026-0001',
      title: 'Level 3 Slab — Pre-Pour',
      description: 'Pre-pour quality gate for the level 3 slab.',
      type: InspectionType.qaQc,
      status: InspectionStatus.completed,
      result: InspectionResult.passed,
      projectId: 1,
      projectName: 'Marina Heights Tower A',
      location: 'Block A, Level 3',
      inspectionDate: days(-2),
      inspectorId: 11,
      inspectorName: 'Arun Mehta',
      templateId: 2,
      templateName: 'Concrete Pour — Pre-Pour Check',
      templateVersionId: 102,
      templateVersion: 1,
      compliancePercentage: 100,
      openDefects: 0,
      referenceDocuments: [],
      createdAt: days(-3),
      updatedAt: days(-2),
    },
    {
      id: 502,
      inspectionNumber: 'INS-2026-0002',
      title: 'Morning Safety Walk — Block B',
      type: InspectionType.safety,
      status: InspectionStatus.inProgress,
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      location: 'Block B',
      inspectionDate: days(-1),
      inspectorId: 12,
      inspectorName: 'Priya Nair',
      templateId: 1,
      templateName: 'Daily Site Safety Inspection',
      templateVersionId: 101,
      templateVersion: 2,
      compliancePercentage: 67,
      openDefects: 2,
      referenceDocuments: [],
      createdAt: days(-1),
      updatedAt: days(-1),
    },
    {
      id: 503,
      inspectionNumber: 'INS-2026-0003',
      title: 'Scaffold Handover Inspection',
      type: InspectionType.safety,
      status: InspectionStatus.completed,
      result: InspectionResult.passedWithRemarks,
      projectId: 1,
      projectName: 'Marina Heights Tower A',
      location: 'North elevation',
      inspectionDate: days(-6),
      inspectorId: 12,
      inspectorName: 'Priya Nair',
      templateId: 1,
      templateName: 'Daily Site Safety Inspection',
      templateVersionId: 100,
      templateVersion: 1,
      compliancePercentage: 88,
      openDefects: 1,
      referenceDocuments: [],
      createdAt: days(-7),
      updatedAt: days(-6),
    },
    {
      id: 504,
      inspectionNumber: 'INS-2026-0004',
      title: 'Basement Waterproofing Check',
      type: InspectionType.qaQc,
      status: InspectionStatus.scheduled,
      projectId: 3,
      projectName: 'Lakeview Residences',
      location: 'Basement B1',
      inspectionDate: days(3),
      inspectorId: 11,
      inspectorName: 'Arun Mehta',
      templateId: 2,
      templateName: 'Concrete Pour — Pre-Pour Check',
      templateVersionId: 102,
      templateVersion: 1,
      compliancePercentage: 0,
      openDefects: 0,
      referenceDocuments: [],
      createdAt: days(-1),
      updatedAt: days(-1),
    },
    {
      id: 505,
      inspectionNumber: 'INS-2026-0005',
      title: 'Façade Defect Survey',
      type: InspectionType.ncrDefect,
      status: InspectionStatus.completed,
      result: InspectionResult.failed,
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      location: 'East façade',
      inspectionDate: days(-9),
      inspectorId: 13,
      inspectorName: 'Sunil Rao',
      compliancePercentage: 54,
      openDefects: 3,
      referenceDocuments: [],
      createdAt: days(-10),
      updatedAt: days(-9),
    },
    {
      id: 506,
      inspectionNumber: 'INS-2026-0006',
      title: 'Electrical Rough-in QA',
      type: InspectionType.qaQc,
      status: InspectionStatus.completed,
      result: InspectionResult.passed,
      projectId: 3,
      projectName: 'Lakeview Residences',
      location: 'Tower 2, Levels 4–6',
      inspectionDate: days(-15),
      inspectorId: 11,
      inspectorName: 'Arun Mehta',
      templateId: 2,
      templateName: 'Concrete Pour — Pre-Pour Check',
      templateVersionId: 102,
      templateVersion: 1,
      compliancePercentage: 96,
      openDefects: 0,
      referenceDocuments: [],
      createdAt: days(-16),
      updatedAt: days(-15),
    },
  ],

  submissions: [
    {
      id: 900,
      inspectionId: 502,
      status: SubmissionStatus.draft,
      responses: {
        'ppe-helmet': 'YES',
        'ppe-boots': 'NO',
        'ppe-vest': 'YES',
        'ppe-notes': 'Two operatives in trainers at the east gate — sent home.',
        'emg-extinguisher': 'Needs Service',
      },
      compliancePercentage: 67,
      submittedByName: 'Priya Nair',
      updatedAt: days(-1),
    },
  ],

  defects: [
    {
      id: 700,
      ncrNumber: 'NCR-2026-0001',
      title: 'Safety footwear not worn',
      description: 'Two operatives observed in non-compliant footwear.',
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      inspectionId: 502,
      inspectionTitle: 'Morning Safety Walk — Block B',
      checklistElementId: 'ppe-boots',
      checklistElementLabel: 'Safety footwear worn',
      location: 'Block B, east gate',
      severity: NcrSeverity.high,
      status: NcrStatus.assigned,
      responsibleName: 'Site Supervisor',
      dueDate: days(2),
      evidence: [],
      createdByName: 'Priya Nair',
      createdAt: days(-1),
      updatedAt: days(-1),
    },
    {
      id: 701,
      ncrNumber: 'NCR-2026-0002',
      title: 'Fire extinguisher overdue for service',
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      inspectionId: 502,
      inspectionTitle: 'Morning Safety Walk — Block B',
      checklistElementId: 'emg-extinguisher',
      checklistElementLabel: 'Fire extinguisher condition',
      location: 'Block B, ground floor',
      severity: NcrSeverity.critical,
      status: NcrStatus.open,
      dueDate: days(1),
      evidence: [],
      createdByName: 'Priya Nair',
      createdAt: days(-1),
      updatedAt: days(-1),
    },
    {
      id: 702,
      ncrNumber: 'NCR-2026-0003',
      title: 'Cracked cladding panel — east façade',
      description: 'Hairline crack across panel E-14, water ingress risk.',
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      inspectionId: 505,
      inspectionTitle: 'Façade Defect Survey',
      location: 'East façade, panel E-14',
      severity: NcrSeverity.high,
      status: NcrStatus.underCorrection,
      responsibleName: 'Façade Subcontractor',
      dueDate: days(5),
      correctiveAction: 'Panel replacement ordered, install scheduled.',
      evidence: [],
      createdByName: 'Sunil Rao',
      createdAt: days(-9),
      updatedAt: days(-4),
    },
    {
      id: 703,
      ncrNumber: 'NCR-2026-0004',
      title: 'Sealant missing at panel joints',
      projectId: 2,
      projectName: 'Riverside Commercial Park',
      inspectionId: 505,
      inspectionTitle: 'Façade Defect Survey',
      location: 'East façade, levels 3–5',
      severity: NcrSeverity.medium,
      status: NcrStatus.submittedForVerification,
      responsibleName: 'Façade Subcontractor',
      dueDate: days(-1),
      correctiveAction: 'Joints resealed, awaiting QA verification.',
      evidence: [],
      createdByName: 'Sunil Rao',
      createdAt: days(-9),
      updatedAt: days(-2),
    },
    {
      id: 704,
      ncrNumber: 'NCR-2026-0005',
      title: 'Scaffold tag out of date',
      projectId: 1,
      projectName: 'Marina Heights Tower A',
      inspectionId: 503,
      inspectionTitle: 'Scaffold Handover Inspection',
      checklistElementId: 'site-scaffold',
      checklistElementLabel: 'Scaffolding tagged and inspected',
      location: 'North elevation',
      severity: NcrSeverity.medium,
      status: NcrStatus.closed,
      responsibleName: 'Scaffold Contractor',
      correctiveAction: 'Re-inspected and re-tagged.',
      evidence: [],
      createdByName: 'Priya Nair',
      createdAt: days(-6),
      updatedAt: days(-3),
      closedAt: days(-3),
    },
    {
      id: 705,
      ncrNumber: 'NCR-2026-0006',
      title: 'Honeycombing at column base',
      projectId: 1,
      projectName: 'Marina Heights Tower A',
      location: 'Block A, column C-7',
      severity: NcrSeverity.low,
      status: NcrStatus.verified,
      responsibleName: 'Structural Contractor',
      correctiveAction: 'Patched and cured; verified by QA.',
      evidence: [],
      createdByName: 'Arun Mehta',
      createdAt: days(-20),
      updatedAt: days(-14),
    },
  ],

  comments: [
    {
      id: 800,
      ncrId: 702,
      body: 'Raised from the façade survey. Panel E-14 shows a hairline crack running the full height.',
      attachments: [
        seedAttachment(
          'panel-e14-crack.jpg',
          'image/jpeg',
          1_842_000,
          'Sunil Rao',
          days(-9)
        ),
      ],
      authorName: 'Sunil Rao',
      createdAt: days(-9),
    },
    {
      id: 801,
      ncrId: 702,
      body: 'Assigned to the façade subcontractor for replacement.',
      attachments: [],
      fromStatus: NcrStatus.open,
      toStatus: NcrStatus.assigned,
      authorName: 'Arun Mehta',
      createdAt: days(-7),
    },
    {
      id: 802,
      ncrId: 702,
      body: 'Replacement panel ordered, lead time two weeks. Temporary weather seal applied.',
      attachments: [
        seedAttachment(
          'temporary-seal.mp4',
          'video/mp4',
          8_410_000,
          'Façade Subcontractor',
          days(-4)
        ),
      ],
      fromStatus: NcrStatus.assigned,
      toStatus: NcrStatus.underCorrection,
      authorName: 'Façade Subcontractor',
      createdAt: days(-4),
    },
    {
      id: 803,
      ncrId: 703,
      body: 'All joints on levels 3–5 resealed. Submitting for QA verification.',
      attachments: [
        seedAttachment(
          'joints-resealed-l4.jpg',
          'image/jpeg',
          1_210_000,
          'Façade Subcontractor',
          days(-2)
        ),
      ],
      fromStatus: NcrStatus.underCorrection,
      toStatus: NcrStatus.submittedForVerification,
      authorName: 'Façade Subcontractor',
      createdAt: days(-2),
    },
    {
      id: 804,
      ncrId: 700,
      body: 'Both operatives sent off site and toolbox talk delivered to the gang.',
      attachments: [],
      fromStatus: NcrStatus.open,
      toStatus: NcrStatus.assigned,
      authorName: 'Priya Nair',
      createdAt: days(-1),
    },
  ],

  projectDocuments: [
    {
      ...seedAttachment(
        'STR-L3-004-RevC.pdf',
        'application/pdf',
        2_450_000,
        'Arun Mehta',
        days(-40)
      ),
      projectId: 1,
      category: 'Drawings',
    },
    {
      ...seedAttachment(
        'STR-L4-001-RevA.pdf',
        'application/pdf',
        2_110_000,
        'Arun Mehta',
        days(-38)
      ),
      projectId: 1,
      category: 'Drawings',
    },
    {
      ...seedAttachment(
        'Concrete-Mix-Spec-M30.pdf',
        'application/pdf',
        880_000,
        'Arun Mehta',
        days(-55)
      ),
      projectId: 1,
      category: 'Specifications',
    },
    {
      ...seedAttachment(
        'Method-Statement-Slab-Pour.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        340_000,
        'Priya Nair',
        days(-30)
      ),
      projectId: 1,
      category: 'Method Statements',
    },
    {
      ...seedAttachment(
        'Site-Layout-Blocks-A-D.dwg',
        'image/vnd.dwg',
        5_600_000,
        'Arun Mehta',
        days(-70)
      ),
      projectId: 2,
      category: 'Drawings',
    },
    {
      ...seedAttachment(
        'Facade-Panel-Schedule.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        190_000,
        'Sunil Rao',
        days(-25)
      ),
      projectId: 2,
      category: 'Schedules',
    },
    {
      ...seedAttachment(
        'Hot-Works-Permit.pdf',
        'application/pdf',
        120_000,
        'Priya Nair',
        days(-3)
      ),
      projectId: 2,
      category: 'Permits',
    },
    {
      ...seedAttachment(
        'Waterproofing-Detail-B1.pdf',
        'application/pdf',
        1_020_000,
        'Arun Mehta',
        days(-12)
      ),
      projectId: 3,
      category: 'Drawings',
    },
  ],
};

// ---------------------------------------------------------------------------
// Sequence helpers
// ---------------------------------------------------------------------------

function nextNumber(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear();
  const sequences = existing
    .map((value) => Number(value.split('-').at(-1)))
    .filter((value) => Number.isFinite(value));
  const highest = sequences.length > 0 ? Math.max(...sequences) : 0;
  return `${prefix}-${year}-${String(highest + 1).padStart(4, '0')}`;
}

function requireTemplate(id: number): InspectionTemplate {
  const template = store.templates.find((item) => item.id === id);
  if (!template) throw new ApiError(`Template ${id} not found.`, 404);
  return template;
}

function requireInspection(id: number): Inspection {
  const inspection = store.inspections.find((item) => item.id === id);
  if (!inspection) throw new ApiError(`Inspection ${id} not found.`, 404);
  return inspection;
}

// ---------------------------------------------------------------------------
// Inspections
// ---------------------------------------------------------------------------

export const mockInspectionApi = {
  async getAll(): Promise<Inspection[]> {
    await latency();
    return clone(store.inspections);
  },

  async getByProject(projectId: number): Promise<Inspection[]> {
    await latency();
    return clone(
      store.inspections.filter((item) => item.projectId === projectId)
    );
  },

  async getById(id: number): Promise<Inspection> {
    await latency();
    return clone(requireInspection(id));
  },

  async create(dto: CreateInspectionRequest): Promise<Inspection> {
    await latency();

    // Pin the template's current published version, exactly as the backend will.
    const template = dto.templateId
      ? requireTemplate(dto.templateId)
      : undefined;
    const version = template
      ? store.versions.findLast((item) => item.templateId === template.id)
      : undefined;

    const inspection: Inspection = {
      id: newId(),
      inspectionNumber: nextNumber(
        'INS',
        store.inspections.map((item) => item.inspectionNumber)
      ),
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: InspectionStatus.scheduled,
      projectId: dto.projectId,
      projectName: undefined,
      location: dto.location,
      inspectionDate: new Date(dto.inspectionDate),
      inspectorId: dto.inspectorId,
      templateId: template?.id,
      templateName: template?.name,
      templateVersionId: version?.id,
      templateVersion: version?.version,
      compliancePercentage: 0,
      openDefects: 0,
      referenceDocuments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.inspections.unshift(inspection);
    return clone(inspection);
  },

  async update(id: number, dto: UpdateInspectionRequest): Promise<Inspection> {
    await latency();
    const inspection = requireInspection(id);

    Object.assign(inspection, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.inspectionDate !== undefined && {
        inspectionDate: new Date(dto.inspectionDate),
      }),
      ...(dto.inspectorId !== undefined && { inspectorId: dto.inspectorId }),
      updatedAt: new Date(),
    });

    return clone(inspection);
  },

  async getChecklist(id: number): Promise<InspectionTemplateVersion> {
    await latency();
    const inspection = requireInspection(id);

    const version = store.versions.find(
      (item) => item.id === inspection.templateVersionId
    );
    if (!version) {
      throw new ApiError(`Inspection ${id} has no checklist attached.`, 404);
    }
    return clone(version);
  },

  async getSubmission(id: number): Promise<InspectionSubmission | null> {
    await latency();
    const submission = store.submissions.find(
      (item) => item.inspectionId === id
    );
    return submission ? clone(submission) : null;
  },

  async saveSubmission(
    id: number,
    dto: SaveInspectionSubmissionRequest
  ): Promise<InspectionSubmission> {
    await latency();
    const inspection = requireInspection(id);
    const compliance = dto.compliancePercentage ?? 0;

    let submission = store.submissions.find((item) => item.inspectionId === id);
    if (submission) {
      Object.assign(submission, {
        responses: dto.responses,
        status: dto.status,
        compliancePercentage: compliance,
        updatedAt: new Date(),
        ...(dto.status === SubmissionStatus.submitted && {
          submittedAt: new Date(),
        }),
      });
    } else {
      submission = {
        id: newId(),
        inspectionId: id,
        status: dto.status,
        responses: dto.responses,
        compliancePercentage: compliance,
        submittedAt:
          dto.status === SubmissionStatus.submitted ? new Date() : undefined,
        updatedAt: new Date(),
      };
      store.submissions.push(submission);
    }

    // Submitting closes out the parent inspection, as the backend will.
    if (dto.status === SubmissionStatus.submitted) {
      const criticalOpen = store.defects.filter(
        (defect) =>
          defect.inspectionId === id &&
          defect.severity === NcrSeverity.critical &&
          defect.status !== NcrStatus.closed
      ).length;

      inspection.status = InspectionStatus.completed;
      inspection.compliancePercentage = compliance;
      inspection.result = resultFromCompliance(compliance, criticalOpen);
      inspection.updatedAt = new Date();
    } else {
      inspection.status = InspectionStatus.inProgress;
      inspection.compliancePercentage = compliance;
      inspection.updatedAt = new Date();
    }

    return clone(submission);
  },
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const mockTemplateApi = {
  async getAll(): Promise<InspectionTemplate[]> {
    await latency();
    return clone(store.templates);
  },

  async getById(id: number): Promise<InspectionTemplate> {
    await latency();
    return clone(requireTemplate(id));
  },

  async getVersions(id: number): Promise<InspectionTemplateVersion[]> {
    await latency();
    return clone(store.versions.filter((item) => item.templateId === id));
  },

  async create(
    dto: CreateInspectionTemplateRequest
  ): Promise<InspectionTemplate> {
    await latency();

    const template: InspectionTemplate = {
      id: newId(),
      name: dto.name,
      description: dto.description,
      category: dto.category,
      type: dto.type,
      schema: dto.schema,
      currentVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.templates.unshift(template);
    return clone(template);
  },

  async update(
    id: number,
    dto: UpdateInspectionTemplateRequest
  ): Promise<InspectionTemplate> {
    await latency();
    const template = requireTemplate(id);

    Object.assign(template, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.schema !== undefined && { schema: dto.schema }),
      updatedAt: new Date(),
    });

    // Publishing snapshots the draft into a new immutable version.
    if (dto.publish) {
      const version: InspectionTemplateVersion = {
        id: newId(),
        templateId: template.id,
        version: template.currentVersion + 1,
        schema: clone(template.schema),
        createdAt: new Date(),
      };
      store.versions.push(version);
      template.currentVersion = version.version;
      template.currentVersionId = version.id;
    }

    return clone(template);
  },

  async remove(id: number): Promise<void> {
    await latency();
    const index = store.templates.findIndex((item) => item.id === id);
    if (index === -1) throw new ApiError(`Template ${id} not found.`, 404);

    store.templates.splice(index, 1);
    // Versions are only reachable through their template.
    store.versions = store.versions.filter((item) => item.templateId !== id);
  },

  async use(id: number, name: string): Promise<InspectionTemplate> {
    await latency();
    const source = requireTemplate(id);

    // Fresh element ids — a copy must never share ids with its source.
    const schema = withNewElementIds(clone(source.schema));
    schema.title = name;

    const copy: InspectionTemplate = {
      id: newId(),
      name,
      description: source.description,
      category: source.category,
      type: source.type,
      schema,
      currentVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.templates.unshift(copy);
    return clone(copy);
  },
};

// ---------------------------------------------------------------------------
// NCR / defects
// ---------------------------------------------------------------------------

/** Recomputes an inspection's open-defect count after an NCR changes. */
function syncOpenDefects(inspectionId?: number): void {
  if (!inspectionId) return;

  const inspection = store.inspections.find((item) => item.id === inspectionId);
  if (!inspection) return;

  inspection.openDefects = store.defects.filter(
    (defect) =>
      defect.inspectionId === inspectionId &&
      defect.status !== NcrStatus.closed &&
      defect.status !== NcrStatus.verified
  ).length;
}

export const mockNcrApi = {
  async getAll(): Promise<NcrDefect[]> {
    await latency();
    return clone(store.defects);
  },

  async getByProject(projectId: number): Promise<NcrDefect[]> {
    await latency();
    return clone(store.defects.filter((item) => item.projectId === projectId));
  },

  async getByInspection(inspectionId: number): Promise<NcrDefect[]> {
    await latency();
    return clone(
      store.defects.filter((item) => item.inspectionId === inspectionId)
    );
  },

  async getById(id: number): Promise<NcrDefect> {
    await latency();
    const defect = store.defects.find((item) => item.id === id);
    if (!defect) throw new ApiError(`NCR ${id} not found.`, 404);
    return clone(defect);
  },

  async create(dto: CreateNcrDefectRequest): Promise<NcrDefect> {
    await latency();

    const inspection = dto.inspectionId
      ? store.inspections.find((item) => item.id === dto.inspectionId)
      : undefined;

    const defect: NcrDefect = {
      id: newId(),
      ncrNumber: nextNumber(
        'NCR',
        store.defects.map((item) => item.ncrNumber)
      ),
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      projectName: inspection?.projectName,
      inspectionId: dto.inspectionId,
      inspectionTitle: inspection?.title,
      checklistElementId: dto.checklistElementId,
      checklistElementLabel: dto.checklistElementLabel,
      location: dto.location,
      severity: dto.severity,
      // Raised straight onto someone's plate is already "assigned"; only an
      // unowned defect sits at "open" waiting to be triaged.
      status: dto.responsibleId ? NcrStatus.assigned : NcrStatus.open,
      responsibleId: dto.responsibleId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      evidence: (dto.files ?? []).map((file) => storeFile(file)),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.defects.unshift(defect);
    syncOpenDefects(defect.inspectionId);
    return clone(defect);
  },

  async update(id: number, dto: UpdateNcrDefectRequest): Promise<NcrDefect> {
    await latency();

    const defect = store.defects.find((item) => item.id === id);
    if (!defect) throw new ApiError(`NCR ${id} not found.`, 404);

    Object.assign(defect, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.severity !== undefined && { severity: dto.severity }),
      ...(dto.status !== undefined && { status: dto.status }),
      // Reassigning drops the denormalised name with it — the real backend
      // re-derives that from the new holder, so keeping the old one would
      // leave the row claiming somebody who is no longer responsible.
      ...(dto.responsibleId !== undefined && {
        responsibleId: dto.responsibleId ?? undefined,
        responsibleName: undefined,
      }),
      ...(dto.dueDate !== undefined && {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      }),
      ...(dto.correctiveAction !== undefined && {
        correctiveAction: dto.correctiveAction,
      }),
      updatedAt: new Date(),
      ...(dto.status === NcrStatus.closed && { closedAt: new Date() }),
    });

    syncOpenDefects(defect.inspectionId);
    return clone(defect);
  },

  async getComments(ncrId: number): Promise<NcrComment[]> {
    await latency();
    return clone(
      store.comments
        .filter((item) => item.ncrId === ncrId)
        .toSorted((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    );
  },

  /**
   * Appends a timeline entry, optionally moving the NCR's status in the same
   * action — progress updates almost always come with an explanation, so the
   * comment and the transition are recorded as one event.
   */
  async addComment(
    ncrId: number,
    dto: CreateNcrCommentRequest
  ): Promise<NcrComment> {
    await latency();

    const defect = store.defects.find((item) => item.id === ncrId);
    if (!defect) throw new ApiError(`NCR ${ncrId} not found.`, 404);

    const fromStatus = defect.status;

    const comment: NcrComment = {
      id: newId(),
      ncrId,
      body: dto.body,
      attachments: (dto.files ?? []).map((file) => storeFile(file)),
      fromStatus: dto.toStatus ? fromStatus : undefined,
      toStatus: dto.toStatus,
      authorName: 'You',
      createdAt: new Date(),
    };
    store.comments.push(comment);

    if (dto.toStatus) {
      defect.status = dto.toStatus;
      defect.updatedAt = new Date();
      if (dto.toStatus === NcrStatus.closed) defect.closedAt = new Date();
      syncOpenDefects(defect.inspectionId);
    }

    return clone(comment);
  },

  /** Adds evidence to an existing NCR outside the comment stream. */
  async addEvidence(ncrId: number, files: File[]): Promise<NcrDefect> {
    await latency();

    const defect = store.defects.find((item) => item.id === ncrId);
    if (!defect) throw new ApiError(`NCR ${ncrId} not found.`, 404);

    defect.evidence.push(...files.map((file) => storeFile(file)));
    defect.updatedAt = new Date();
    return clone(defect);
  },
};

// ---------------------------------------------------------------------------
// Project document library
// ---------------------------------------------------------------------------

export const mockProjectDocumentApi = {
  async getByProject(projectId: number): Promise<ProjectDocument[]> {
    await latency();
    return clone(
      store.projectDocuments.filter((item) => item.projectId === projectId)
    );
  },

  /**
   * Links project documents to an inspection by id. Nothing is copied — the
   * inspection holds references, so the project library stays authoritative.
   */
  async attachToInspection(
    inspectionId: number,
    documentIds: number[]
  ): Promise<Inspection> {
    await latency();
    const inspection = requireInspection(inspectionId);

    const existing = new Set(
      inspection.referenceDocuments.map((item) => item.id)
    );
    const added = store.projectDocuments.filter(
      (item) => documentIds.includes(item.id) && !existing.has(item.id)
    );

    inspection.referenceDocuments.push(...added);
    inspection.updatedAt = new Date();
    return clone(inspection);
  },

  async detachFromInspection(
    inspectionId: number,
    documentId: number
  ): Promise<Inspection> {
    await latency();
    const inspection = requireInspection(inspectionId);

    inspection.referenceDocuments = inspection.referenceDocuments.filter(
      (item) => item.id !== documentId
    );
    inspection.updatedAt = new Date();
    return clone(inspection);
  },
};
