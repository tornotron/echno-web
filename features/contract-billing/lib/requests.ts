import type {
  Bill,
  ClaimLineRequest,
  MeasurementLineRequest,
  MeasurementRequest,
  UpdateBillRequest,
} from '@tornotron/echno-core/contract-billing/types';
import { parseAmountInput } from './format';

/** The header of a bill's claim as the form holds it. */
export interface ClaimHeader {
  periodFrom: string;
  periodTo: string;
  claimedPercent: string;
  contractorReference: string;
  location: string;
  remarks: string;
}

export function claimHeaderOf(bill: Bill): ClaimHeader {
  return {
    periodFrom: bill.periodFrom ?? '',
    periodTo: bill.periodTo ?? '',
    claimedPercent:
      bill.claimedPercent === undefined ? '' : String(bill.claimedPercent),
    contractorReference: bill.contractorReference ?? '',
    location: bill.location ?? '',
    remarks: bill.remarks ?? '',
  };
}

export type Built<T> = { ok: true; request: T } | { ok: false; error: string };

const blankToUndefined = (value: string) =>
  value.trim() === '' ? undefined : value.trim();

/**
 * Builds the claim update. The server replaces the header as sent, so every
 * header field goes back; only the lines whose claimed quantity was edited
 * are named.
 */
export function buildClaimRequest(
  bill: Bill,
  header: ClaimHeader,
  claims: Record<string, string>
): Built<UpdateBillRequest> {
  const lines: ClaimLineRequest[] = [];
  for (const line of bill.lines) {
    const raw = claims[line.id];
    if (raw === undefined) continue;
    const value = parseAmountInput(raw);
    if (value === undefined) {
      return {
        ok: false,
        error: `Item ${line.itemCode}: enter a quantity of zero or more.`,
      };
    }
    const claimed = value ?? 0;
    if (claimed === line.claimedQuantity) continue;
    lines.push({
      lineId: line.id,
      claimedQuantity: claimed,
      remarks: line.remarks,
    });
  }
  const request: UpdateBillRequest = {
    contractorReference: blankToUndefined(header.contractorReference),
    location: blankToUndefined(header.location),
    remarks: blankToUndefined(header.remarks),
  };
  if (bill.billingModel === 'RUNNING_ACCOUNT') {
    request.periodFrom = blankToUndefined(header.periodFrom);
    request.periodTo = blankToUndefined(header.periodTo);
    request.lines = lines;
  } else {
    const percent = parseAmountInput(header.claimedPercent);
    if (
      percent === undefined ||
      (percent !== null && (percent <= 0 || percent > 100))
    ) {
      return {
        ok: false,
        error: 'Enter a claimed percent above 0 and up to 100.',
      };
    }
    if (percent !== null) request.claimedPercent = percent;
  }
  return { ok: true, request };
}

/** The joint measurement as the form holds it. */
export interface MeasurementForm {
  measurementDate: string;
  measuredBy: string;
  clientRepresentative: string;
  certifiedPercent: string;
  /** Per line id: the measured and accepted quantities as typed. */
  lines: Record<string, { measured: string; accepted: string }>;
}

const qtyText = (value: number | undefined) =>
  value === undefined ? '' : String(value);

export function measurementFormOf(bill: Bill): MeasurementForm {
  const lines: MeasurementForm['lines'] = {};
  for (const line of bill.lines) {
    lines[line.id] = {
      measured: qtyText(line.measuredQuantity),
      accepted: qtyText(line.acceptedQuantity),
    };
  }
  return {
    measurementDate: bill.measurementDate ?? '',
    measuredBy: bill.measuredBy ?? '',
    clientRepresentative: bill.clientRepresentative ?? '',
    certifiedPercent:
      bill.certifiedPercent === undefined ? '' : String(bill.certifiedPercent),
    lines,
  };
}

/**
 * Builds the measurement. Every claimed line goes back with what the form
 * holds, a blank field meaning "not measured yet"; an accepted quantity above
 * the claim is caught here before the server refuses it.
 */
export function buildMeasurementRequest(
  bill: Bill,
  form: MeasurementForm
): Built<MeasurementRequest> {
  const request: MeasurementRequest = {
    measurementDate: blankToUndefined(form.measurementDate),
    measuredBy: blankToUndefined(form.measuredBy),
    clientRepresentative: blankToUndefined(form.clientRepresentative),
  };
  if (bill.billingModel === 'RUNNING_ACCOUNT') {
    const lines: MeasurementLineRequest[] = [];
    for (const line of bill.lines) {
      if (line.claimedQuantity <= 0) continue;
      const typed = form.lines[line.id] ?? { measured: '', accepted: '' };
      const measured = parseAmountInput(typed.measured);
      const accepted = parseAmountInput(typed.accepted);
      if (measured === undefined || accepted === undefined) {
        return {
          ok: false,
          error: `Item ${line.itemCode}: enter quantities of zero or more.`,
        };
      }
      if (accepted !== null && accepted > line.claimedQuantity) {
        return {
          ok: false,
          error: `Item ${line.itemCode}: the accepted quantity cannot be more than the ${line.claimedQuantity} claimed.`,
        };
      }
      lines.push({
        lineId: line.id,
        measuredQuantity: measured ?? undefined,
        acceptedQuantity: accepted ?? undefined,
        remarks: line.remarks,
      });
    }
    request.lines = lines;
  } else {
    const percent = parseAmountInput(form.certifiedPercent);
    if (percent === undefined || (percent !== null && percent > 100)) {
      return {
        ok: false,
        error: 'Enter an accepted percent between 0 and 100.',
      };
    }
    if (
      percent !== null &&
      bill.claimedPercent !== undefined &&
      percent > bill.claimedPercent
    ) {
      return {
        ok: false,
        error: `The accepted percent cannot be more than the ${bill.claimedPercent}% claimed.`,
      };
    }
    if (percent !== null) request.certifiedPercent = percent;
  }
  return { ok: true, request };
}
