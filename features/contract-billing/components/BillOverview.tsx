'use client';

import {
  BillingModel,
  type Bill,
} from '@tornotron/echno-core/contract-billing/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { formatDate, formatDateTime, formatInr } from '../lib/format';
import type { ClaimHeader, MeasurementForm } from '../lib/requests';

interface BillOverviewProps {
  bill: Bill;
  header: ClaimHeader;
  onHeaderChange: (header: ClaimHeader) => void;
  editable: boolean;
  measurement: MeasurementForm;
  onMeasurementChange: (form: MeasurementForm) => void;
  measuring: boolean;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm font-medium">{value || '-'}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between border-b py-1.5 text-sm last:border-0 ${strong ? 'font-semibold' : ''}`}
    >
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * The bill's basic information, summary and joint measurement. The header of
 * the claim is edited here while the bill is a draft or returned, and the
 * measurement header while it is submitted.
 */
export function BillOverview({
  bill,
  header,
  onHeaderChange,
  editable,
  measurement,
  onMeasurementChange,
  measuring,
}: BillOverviewProps) {
  const ra = bill.billingModel === BillingModel.RUNNING_ACCOUNT;
  const set =
    (field: keyof ClaimHeader) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onHeaderChange({ ...header, [field]: e.target.value });
  const setM =
    (field: 'measurementDate' | 'measuredBy' | 'clientRepresentative') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onMeasurementChange({ ...measurement, [field]: e.target.value });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Project" value={bill.projectName} />
          <Info
            label="Contract"
            value={`${bill.contractName}${bill.contractRef ? ` (${bill.contractRef})` : ''}`}
          />
          <Info label="Contractor" value={bill.contractorName} />
          {ra ? (
            editable ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="ov-from">Period from</Label>
                  <Input
                    id="ov-from"
                    type="date"
                    value={header.periodFrom}
                    onChange={set('periodFrom')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ov-to">Period to</Label>
                  <Input
                    id="ov-to"
                    type="date"
                    value={header.periodTo}
                    onChange={set('periodTo')}
                  />
                </div>
              </div>
            ) : (
              <Info
                label="Billing period"
                value={`${formatDate(bill.periodFrom)} to ${formatDate(bill.periodTo)}`}
              />
            )
          ) : (
            <Info
              label="Milestone"
              value={`${bill.milestoneName ?? '-'} (target ${formatDate(bill.milestoneTargetDate)})`}
            />
          )}
          {editable ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="ov-ref">Contractor&apos;s bill no.</Label>
                <Input
                  id="ov-ref"
                  value={header.contractorReference}
                  onChange={set('contractorReference')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ov-location">Location</Label>
                <Input
                  id="ov-location"
                  value={header.location}
                  onChange={set('location')}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ov-remarks">Remarks</Label>
                <Textarea
                  id="ov-remarks"
                  rows={2}
                  value={header.remarks}
                  onChange={set('remarks')}
                />
              </div>
            </>
          ) : (
            <>
              <Info
                label="Contractor's bill no."
                value={bill.contractorReference}
              />
              <Info label="Location" value={bill.location} />
              <Info label="Remarks" value={bill.remarks} />
            </>
          )}
          <Info label="Prepared by" value={bill.preparedByName} />
          <Info
            label="Submitted"
            value={
              bill.submittedAt
                ? `${formatDateTime(bill.submittedAt)} by ${bill.submittedByName ?? 'unknown'}`
                : 'Not yet'
            }
          />
          <Info
            label="Verified"
            value={
              bill.verifiedAt
                ? `${formatDateTime(bill.verifiedAt)} by ${bill.verifiedByName ?? 'unknown'}`
                : 'Not yet'
            }
          />
          <Info
            label="Certified"
            value={
              bill.certifiedAt
                ? `${formatDateTime(bill.certifiedAt)} by ${bill.certifiedByName ?? 'unknown'}`
                : 'Not yet'
            }
          />
          <Info
            label="Approved"
            value={
              bill.approvedAt
                ? `${formatDateTime(bill.approvedAt)} by ${bill.approvedByName ?? 'unknown'}`
                : 'Not yet'
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill summary</CardTitle>
          {!bill.amountsFinal && (
            <p className="text-muted-foreground text-xs">
              Provisional until certification: accepted quantities where
              measured, claimed otherwise, and the contract&apos;s rules as they
              stand today.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Row
            label="Gross amount claimed"
            value={formatInr(bill.grossClaimed)}
          />
          <Row
            label="Gross amount of this bill"
            value={formatInr(bill.grossAmount)}
          />
          <Row label="Additions" value={formatInr(bill.additionsTotal)} />
          <Row label="Deductions" value={formatInr(bill.deductionsTotal)} />
          <Row label="Net payable" value={formatInr(bill.netPayable)} strong />
          <Row
            label="Previous certified"
            value={formatInr(bill.previousCertified)}
          />
          <Row
            label="Cumulative certified"
            value={formatInr(bill.cumulativeCertified)}
          />
          <Row label="Contract value" value={formatInr(bill.contractValue)} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Joint measurement</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {measuring ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="jm-date">Measurement date</Label>
                <Input
                  id="jm-date"
                  type="date"
                  value={measurement.measurementDate}
                  onChange={setM('measurementDate')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="jm-engineer">Engineer</Label>
                <Input
                  id="jm-engineer"
                  value={measurement.measuredBy}
                  onChange={setM('measuredBy')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="jm-client">Client representative</Label>
                <Input
                  id="jm-client"
                  value={measurement.clientRepresentative}
                  onChange={setM('clientRepresentative')}
                />
              </div>
            </>
          ) : (
            <>
              <Info
                label="Measurement date"
                value={formatDate(bill.measurementDate)}
              />
              <Info label="Engineer" value={bill.measuredBy} />
              <Info
                label="Client representative"
                value={bill.clientRepresentative}
              />
            </>
          )}
          {!bill.measurementDate && !measuring && (
            <p className="text-muted-foreground text-sm sm:col-span-3">
              Recorded after the bill is submitted, during the joint measurement
              on site.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
