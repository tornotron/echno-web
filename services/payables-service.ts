import { api, ApiError, logger } from '@tornotron/echno-core';

/**
 * The accounts-payable client.
 *
 * `echno-core` carries no payable module at all: no type, no service, no
 * hooks. The endpoints have existed since the payable table was added, and
 * nothing in the product has ever called them, so vendor payables have only
 * ever existed in the database.
 *
 * This client is held here rather than in core deliberately. Core's contract
 * is hand-maintained with no codegen, so anything added there is a published
 * API and a release, and whether payables survive at all is still open: the
 * construction-invoice flow covers part of the same ground and the module may
 * be retired instead of grown. A screen-local client keeps that decision a
 * one-repo change. The accounts-receivable listing was held here on the same
 * terms until core 2.3.0 took it, and this is what is left of that pattern.
 *
 * Every path is the `/web` controller, which is behind
 * `hasAnyOrgRoleForCurrentTenant('system-admin')` on every mapping, the reads
 * included. The sibling `/api/v1/payables` controller is the mobile one, gated
 * on flat `payable:*` authorities the web session does not carry.
 */
const BASE = '/payables/web';

/** Rows per page. Matches the other finance listings. */
export const PAYABLE_PAGE_SIZE = 20;

/**
 * What the payable is for.
 *
 * These are the values of the backend `ContractType` enum, and the column is
 * `EnumType.STRING`, so anything else is a 400 out of the enum converter.
 */
export const ContractType = {
  MATERIAL_SUPPLY: 'MATERIAL_SUPPLY',
  LABOR_CONTRACT: 'LABOR_CONTRACT',
  EQUIPMENT_RENTAL: 'EQUIPMENT_RENTAL',
  SERVICE_CONTRACT: 'SERVICE_CONTRACT',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  CONSULTANT: 'CONSULTANT',
  OTHER: 'OTHER',
} as const;

export type ContractType = (typeof ContractType)[keyof typeof ContractType];

/**
 * Whether a value is one of the contract types the backend will accept.
 *
 * `hasOwnProperty` rather than `in`, which walks the prototype chain and would
 * accept "toString" and "constructor" as contract types.
 */
export function isContractType(value: unknown): value is ContractType {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ContractType, value)
  );
}

/** An amount owed to a vendor or contractor. Mirrors `PayableDto`. */
export interface Payable {
  id: number;
  payableNumber: string;
  contractorName: string;
  /** Absent on a row saved before the column was populated. */
  contractType?: ContractType;
  /** What the payable was raised for. */
  amountRecorded: number;
  /** What has been paid against it so far. */
  amountPaid: number;
  /** What is still owed, that is `amountRecorded - amountPaid`. */
  amountDue: number;
  vendorId?: number;
  vendorName?: string;
  goodsReceivedNoteId?: number;
  grnNumber?: string;
  projectId?: number;
  projectName?: string;
  /**
   * The employee who raised it.
   *
   * This one really is an employee. `Payable.createdBy` is a `@ManyToOne
   * Employee`, the create endpoint validates the id against the employee
   * repository, and `PayableDto` carries a nested `EmployeeDto` with the name
   * already on it. That makes it the exception to the `*By`-fields-are-user-ids
   * rule that holds on stock adjustments, leave and construction invoices, so
   * the name here is the backend's own and needs no lookup to resolve.
   */
  createdBy?: { id: number; name: string };
  /** ISO 8601 timestamp the payable was raised at. */
  createdAt?: string;
}

/** The fields `POST /payables/web` takes. Mirrors `PayableCreationDto`. */
export interface PayableCreationRequest {
  payableNumber: string;
  contractorName: string;
  contractType: ContractType;
  amountRecorded: number;
  /** Optional opening payment. Defaults to zero server side when omitted. */
  amountPaid?: number;
  vendorId?: number;
  goodsReceivedNoteId?: number;
  projectId: number;
  /** Employee id, not a user id. See {@link Payable.createdBy}. */
  createdBy: number;
}

/** One page of payables, with the count the pager needs to know where it is. */
export interface PayablePage {
  rows: Payable[];
  /** Total payables across every page, from the Spring envelope. */
  totalElements: number;
  /** Total pages at the requested size. */
  totalPages: number;
}

const EMPTY_PAGE: PayablePage = { rows: [], totalElements: 0, totalPages: 0 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Reads a money field.
 *
 * The columns are `BigDecimal`, and Jackson writes those as a JSON number by
 * default but as a string under `WRITE_BIGDECIMAL_AS_PLAIN`. Both are read
 * here so a serialization setting changing under the client does not silently
 * turn every amount into zero. An unreadable value is not defaulted: on a
 * payables screen a missing amount reading as 0.00 says the debt is settled.
 *
 * @param value - The raw field from the response.
 * @returns The amount as a number.
 * @throws {Error} When the value is neither a finite number nor a numeric string.
 */
function readAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`Not a readable amount: ${String(value)}`);
}

function readOptionalId(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function readOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Reads one payable off the wire.
 *
 * `amountDue` is derived on the entity rather than stored, so it is present on
 * a current response and absent on anything that predates the getter. It is
 * recomputed here when it cannot be read, because the two numbers it comes
 * from are always there and a blank balance column on an ageing screen is
 * worse than a derived one. When the server does send it, the server's value
 * wins: it is the one the overpayment check on the next payment will use.
 *
 * @param raw - One `PayableDto` from a response body.
 * @returns The parsed payable.
 * @throws {Error} When a required field is missing or unreadable.
 */
export function parsePayable(raw: unknown): Payable {
  if (!isRecord(raw)) {
    throw new TypeError('A payable must be an object');
  }

  const id = raw.id;
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    throw new TypeError('A payable must carry a numeric id');
  }
  if (typeof raw.payableNumber !== 'string' || raw.payableNumber === '') {
    throw new TypeError(`Payable ${id} has no payable number`);
  }
  if (typeof raw.contractorName !== 'string') {
    throw new TypeError(`Payable ${id} has no contractor name`);
  }

  const amountRecorded = readAmount(raw.amountRecorded);
  const amountPaid = readAmount(raw.amountPaid ?? 0);

  let amountDue: number;
  try {
    amountDue = readAmount(raw.amountDue);
  } catch {
    amountDue = amountRecorded - amountPaid;
  }

  const createdBy = isRecord(raw.createdBy)
    ? {
        id: readOptionalId(raw.createdBy.id) ?? 0,
        name:
          readOptionalText(raw.createdBy.name) ??
          readOptionalText(raw.createdBy.employeeName) ??
          'Unknown',
      }
    : undefined;

  return {
    id,
    payableNumber: raw.payableNumber,
    contractorName: raw.contractorName,
    contractType: isContractType(raw.contractType) ? raw.contractType : undefined,
    amountRecorded,
    amountPaid,
    amountDue,
    vendorId: readOptionalId(raw.vendorId),
    vendorName: readOptionalText(raw.vendorName),
    goodsReceivedNoteId: readOptionalId(raw.goodsReceivedNoteId),
    grnNumber: readOptionalText(raw.grnNumber),
    projectId: readOptionalId(raw.projectId),
    projectName: readOptionalText(raw.projectName),
    createdBy,
    createdAt: readOptionalText(raw.createdAt),
  };
}

/**
 * Reads a Spring `Page<PayableDto>` into typed rows and its counts.
 *
 * A shape that is neither a page nor a bare array is logged and read as an
 * empty page, so a partial outage leaves the screen empty rather than broken.
 * A row that is present but unreadable is a different matter and becomes a
 * 422: dropping a debt from an ageing list quietly is how a vendor stops being
 * paid.
 *
 * @param raw - The parsed JSON body from a listing endpoint.
 * @returns The page's rows and totals.
 * @throws {ApiError} 422 when a row cannot be read.
 */
export function readPayablePage(raw: unknown): PayablePage {
  const items = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.content)
      ? raw.content
      : null;

  if (items === null) {
    logger.warn('The payable listing returned an unexpected format:', {
      type: typeof raw,
      keys: isRecord(raw) ? Object.keys(raw) : null,
    });
    return EMPTY_PAGE;
  }

  let rows: Payable[];
  try {
    rows = items.map((item) => parsePayable(item));
  } catch (error) {
    logger.error('Failed to read the payable listing:', error);
    throw new ApiError(
      'The payables could not be read. Reload the page to try again.',
      422
    );
  }

  // A bare array carries no envelope, so the rows in hand are all there is.
  // The unpaged endpoints cap at 500 rows and put the true total in
  // X-Total-Count, which the shared client does not surface; the paged
  // listing below is the one the screen uses, so nothing is lost here.
  if (Array.isArray(raw)) {
    return { rows, totalElements: rows.length, totalPages: 1 };
  }

  const envelope = raw as Record<string, unknown>;
  return {
    rows,
    totalElements: asCount(envelope.totalElements),
    totalPages: asCount(envelope.totalPages),
  };
}

/** Page parameters the listing accepts. */
export interface PayableListParams {
  /** Zero-based page index. */
  pageNo?: number;
  /** Rows per page. The shared `PageQuery` requires 1 to 500. */
  pageSize?: number;
  /**
   * Restrict to payables that still owe something.
   *
   * There is no filtered listing on the server: `/outstanding` is its own
   * unpaged endpoint returning every open payable at once, so this switches
   * which endpoint is called rather than adding a query parameter.
   */
  outstandingOnly?: boolean;
  /**
   * Restrict to one vendor, using the by-vendor endpoint. Also unpaged.
   *
   * A payable can have no vendor at all, so this can only ever narrow to the
   * ones that name one.
   */
  vendorId?: number;
}

/**
 * Builds the query string for the paged listing.
 *
 * @param params - The page the caller asked for.
 * @returns The query parameters to send.
 */
export function listQuery(
  params: PayableListParams = {}
): Record<string, string | number | boolean> {
  return {
    pageNo: params.pageNo ?? 0,
    pageSize: params.pageSize ?? PAYABLE_PAGE_SIZE,
  };
}

export const payablesService = {
  /**
   * Lists payables in the current organization.
   *
   * The three read endpoints answer different shapes, so which one is called
   * follows from the filter: `outstandingOnly` and `vendorId` are unpaged
   * lists and the plain listing is a Spring page.
   *
   * @param params - Page, and the outstanding / vendor filters.
   * @returns The requested payables.
   * @throws {ApiError} On a non-2xx response, or 422 if a row cannot be read.
   */
  async list(params: PayableListParams = {}): Promise<PayablePage> {
    if (params.vendorId !== undefined) {
      return readPayablePage(
        await api.get<unknown>(`${BASE}/vendor/${params.vendorId}`)
      );
    }
    if (params.outstandingOnly) {
      return readPayablePage(await api.get<unknown>(`${BASE}/outstanding`));
    }
    return readPayablePage(
      await api.get<unknown>(`${BASE}/all`, listQuery(params))
    );
  },

  /**
   * Reads one payable.
   *
   * @param id - The payable's id.
   * @returns The payable.
   * @throws {ApiError} 404 when it is not in the current organization.
   */
  async get(id: number): Promise<Payable> {
    return parsePayable(await api.get<unknown>(`${BASE}/${id}`));
  },

  /**
   * Raises a payable.
   *
   * @param request - The payable to create.
   * @returns The created payable, as the server stored it.
   * @throws {ApiError} 400 on a validation failure, 404 when the project,
   *   employee, vendor or GRN is not in the organization, 409 when the payable
   *   number is already taken.
   */
  async create(request: PayableCreationRequest): Promise<Payable> {
    return parsePayable(await api.post<unknown>(BASE, request));
  },

  /**
   * Records a payment against a payable, reducing what is owed.
   *
   * The server takes a pessimistic lock and re-checks the total, so two people
   * paying the same payable at once cannot between them push it past the
   * recorded amount. The client-side ceiling in `payable-action-gates` is
   * there to answer before the request, not instead of the server.
   *
   * @param id - The payable being paid.
   * @param paymentAmount - The amount to add to what has been paid. Positive.
   * @returns The payable with its new paid total.
   * @throws {ApiError} 400 when the amount is not positive or would overpay.
   */
  async recordPayment(id: number, paymentAmount: number): Promise<Payable> {
    return parsePayable(
      await api.post<unknown>(`${BASE}/${id}/payments`, { paymentAmount })
    );
  },
};
