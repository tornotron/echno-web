import { ApiError, api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  ContractType,
  ContractStatus,
  ContractPaymentStatus,
  type SubContract,
  type ContractMilestone,
} from '@/types/third-party/sub-contract';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function parseDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

function parseMaybeDate(val: unknown): Date | undefined {
  if (val == null) return undefined;
  return parseDate(val);
}

function num(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function maybeNum(val: unknown): number | undefined {
  if (val == null || val === '') return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

/** Coerces a free-string column onto the enum, falling back when the stored value predates the enum. */
function coerce<T extends Record<string, string>>(
  e: T,
  val: unknown,
  fallback: T[keyof T]
): T[keyof T] {
  const values = Object.values(e) as string[];
  return typeof val === 'string' && values.includes(val)
    ? (val as T[keyof T])
    : fallback;
}

const MILESTONE_STATUSES = ['pending', 'inProgress', 'completed', 'delayed'] as const;
type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

function parseMilestone(raw: Raw): ContractMilestone {
  const status = MILESTONE_STATUSES.includes(raw?.status)
    ? (raw.status as MilestoneStatus)
    : ('pending' as MilestoneStatus);
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    targetDate: parseDate(raw?.targetDate),
    completionDate: parseMaybeDate(raw?.completionDate),
    paymentPercentage: num(raw?.paymentPercentage),
    amount: num(raw?.amount),
    status,
    remarks: raw?.remarks ?? undefined,
  };
}

/** Derives a coarse payment status from the recorded amounts (the backend does not store one). */
function derivePaymentStatus(
  contractValue: number,
  totalPaid: number
): ContractPaymentStatus {
  if (totalPaid <= 0) return ContractPaymentStatus.notStarted;
  if (totalPaid >= contractValue) return ContractPaymentStatus.fullyPaid;
  return ContractPaymentStatus.inProgress;
}

function daysBetween(start?: Date, end?: Date): number {
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return ms > 0 ? Math.round(ms / 86_400_000) : 0;
}

/**
 * Maps the backend `SubContractDto` onto the web `SubContract` model. The backend
 * uses prefixed names for contractor/bank fields (`contractorContactPerson`,
 * `bankAccountNumber`, `scopeOfWork`, `contractorGst`, ...) which flatten onto the
 * web field names here; contractor company, location, financial links and document
 * urls have no backend column yet, so they default.
 */
function parseSubContract(raw: Raw): SubContract {
  if (!raw?.id) {
    throw new Error('Invalid SubContract data: missing id');
  }
  const contractValue = num(raw.contractValue);
  const totalPaid = num(raw.totalPaid);
  const startDate = parseDate(raw.startDate);
  const endDate = parseDate(raw.endDate);
  return {
    id: raw.id,
    contractId: raw.contractId ?? String(raw.id),
    contractName: raw.contractName ?? '',

    contractorName: raw.contractorName ?? '',
    contractorCompany: raw.contractorCompany ?? '',
    contactPerson: raw.contractorContactPerson ?? '',
    phone: raw.contractorPhone ?? '',
    email: raw.contractorEmail ?? '',
    address: raw.contractorAddress ?? '',

    type: coerce(ContractType, raw.type, ContractType.lumpsum),
    status: coerce(ContractStatus, raw.status, ContractStatus.active),
    workDescription: raw.workDescription ?? '',
    scope: raw.scopeOfWork ?? '',

    contractValue,
    currency: raw.currency ?? 'INR',
    mobilizationAdvance: maybeNum(raw.mobilizationAdvance),
    retentionPercentage: maybeNum(raw.retentionPercentage),
    retentionAmount: undefined,

    paymentStatus: derivePaymentStatus(contractValue, totalPaid),
    totalPaid,
    totalDue: raw.totalDue == null ? contractValue - totalPaid : num(raw.totalDue),
    advancePaid: maybeNum(raw.mobilizationAdvance),

    startDate,
    endDate,
    actualStartDate: undefined,
    actualEndDate: parseMaybeDate(raw.actualCompletionDate),
    duration: daysBetween(startDate, endDate),

    completionPercentage: num(raw.completionPercentage),
    lastMilestone: undefined,
    nextMilestone: undefined,

    projectName: raw.projectName ?? '',
    projectId: raw.projectId == null ? '' : String(raw.projectId),
    siteName: undefined,
    location: '',

    qualityRating: maybeNum(raw.qualityRating),
    timelinessRating: maybeNum(raw.timelinessRating),
    safetyRating: maybeNum(raw.safetyRating),
    overallRating: maybeNum(raw.overallRating),

    gstNumber: raw.contractorGst ?? undefined,
    panNumber: raw.contractorPan ?? undefined,
    licenseNumber: raw.contractorLicense ?? undefined,
    insurancePolicyNumber: raw.insurancePolicyNumber ?? undefined,
    insuranceExpiryDate: parseMaybeDate(raw.insuranceExpiry),

    bankName: raw.bankName ?? undefined,
    accountNumber: raw.bankAccountNumber ?? undefined,
    ifscCode: raw.bankIfsc ?? undefined,

    invoiceIds: [],
    paymentIds: [],
    advancePaymentId: undefined,

    paymentTerms: raw.paymentTerms ?? '',
    penaltyClause: raw.penaltyClause ?? undefined,
    warrantyPeriod: maybeNum(raw.warrantyPeriod),
    defectLiabilityPeriod: undefined,

    supervisorName: undefined,
    supervisorPhone: undefined,
    accountManagerName: undefined,

    safetyIncidents: undefined,
    qualityIssues: undefined,
    delayDays: undefined,

    milestones: Array.isArray(raw.milestones)
      ? raw.milestones.map((m: Raw) => parseMilestone(m))
      : [],

    notes: raw.notes ?? undefined,

    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
  };
}

function safeParse(raw: Raw): SubContract {
  try {
    return parseSubContract(raw);
  } catch (error) {
    logger.error('Failed to parse sub-contract:', error);
    throw new ApiError('Failed to process sub-contract data.', 422);
  }
}

const empty = (v?: string): string | undefined =>
  v && v.trim() !== '' ? v : undefined;

/**
 * Maps the sub-contract form onto the backend `SubContractCreationDto`. The form's
 * flat contractor/bank fields expand to the backend's prefixed names; `contractName`
 * falls back to the contract id (the form collects an id, not a separate name);
 * milestones map percentage/date onto the backend `paymentPercentage`/`targetDate`.
 */
function toPayload(values: SubContractFormValues): Record<string, unknown> {
  return {
    contractId: empty(values.contractId),
    contractName: empty(values.contractId) ?? values.contractorName,
    contractorName: values.contractorName,
    contractorContactPerson: empty(values.contactPerson),
    contractorPhone: empty(values.phone),
    contractorEmail: empty(values.email),
    contractorAddress: empty(values.address),
    contractorGst: empty(values.gstNumber),
    contractorPan: empty(values.panNumber),
    type: empty(values.workType),
    status: empty(values.status),
    scopeOfWork: empty(values.scope),
    contractValue: values.contractValue,
    totalPaid: values.totalPaid,
    totalDue: values.totalDue,
    completionPercentage: values.completionPercentage,
    paymentTerms: empty(values.paymentTerms),
    startDate: empty(values.startDate),
    endDate: empty(values.endDate),
    bankName: empty(values.bankName),
    bankAccountNumber: empty(values.accountNumber),
    bankIfsc: empty(values.ifscCode),
    notes: empty(values.notes),
    milestones: values.milestones.map((m) => ({
      name: m.name,
      paymentPercentage: m.percentage,
      amount: m.amount,
      status: m.status,
      targetDate: empty(m.date),
    })),
  };
}

const BASE = '/sub-contracts/web';

/** Backend-backed sub-contracts (`/api/v1/sub-contracts/web`). */
export const subContractsService = {
  async getAll(): Promise<SubContract[]> {
    const data = await api.get<Raw>(BASE);
    const rows: Raw[] = Array.isArray(data) ? data : (data?.content ?? []);
    return rows.map((row) => safeParse(row));
  },

  async getById(id: number): Promise<SubContract> {
    const raw = await api.get<Raw>(`${BASE}/${id}`);
    return safeParse(raw);
  },

  async create(values: SubContractFormValues): Promise<SubContract> {
    const raw = await api.post<Raw>(BASE, toPayload(values));
    return safeParse(raw);
  },

  async update(id: number, values: SubContractFormValues): Promise<SubContract> {
    const raw = await api.put<Raw>(`${BASE}/${id}`, toPayload(values));
    return safeParse(raw);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },
};
