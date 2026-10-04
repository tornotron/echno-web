'use client';

import type { Bill } from '@tornotron/echno-core/contract-billing/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { formatDate, formatInr, formatPercent } from '../lib/format';
import { REQUIREMENT_TYPE_LABELS } from '../lib/labels';
import type { ClaimHeader, MeasurementForm } from '../lib/requests';
import { RequirementStatusChip } from './chips';

interface BillMilestoneProps {
  bill: Bill;
  header: ClaimHeader;
  onHeaderChange: (header: ClaimHeader) => void;
  claiming: boolean;
  measurement: MeasurementForm;
  onMeasurementChange: (form: MeasurementForm) => void;
  measuring: boolean;
}

/**
 * A milestone bill's claim and the milestone's requirements. The claimed
 * percent is typed while the bill is a draft or returned, the accepted
 * percent while it is submitted. Certification waits until every mandatory
 * requirement is completed or not applicable; requirements are kept on the
 * contract's billing page.
 */
export function BillMilestone({
  bill,
  header,
  onHeaderChange,
  claiming,
  measurement,
  onMeasurementChange,
  measuring,
}: BillMilestoneProps) {
  const open = bill.requirements.filter(
    (r) =>
      r.mandatory && r.status !== 'COMPLETED' && r.status !== 'NOT_APPLICABLE'
  );
  const left = 100 - (bill.milestoneCertifiedBeforePercent ?? 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{bill.milestoneName ?? 'Milestone'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Milestone value</p>
            <p className="font-medium">{formatInr(bill.milestoneValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Certified on earlier bills
            </p>
            <p className="font-medium">
              {formatPercent(bill.milestoneCertifiedBeforePercent)}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatPercent(left)} left to bill
            </p>
          </div>
          {claiming ? (
            <div className="space-y-1">
              <Label htmlFor="ms-claimed">Claimed percent</Label>
              <Input
                id="ms-claimed"
                inputMode="decimal"
                value={header.claimedPercent}
                onChange={(e) =>
                  onHeaderChange({ ...header, claimedPercent: e.target.value })
                }
              />
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground text-xs">Claimed</p>
              <p className="font-medium">
                {formatPercent(bill.claimedPercent)} (
                {formatInr(bill.grossClaimed)})
              </p>
            </div>
          )}
          {measuring ? (
            <div className="space-y-1">
              <Label htmlFor="ms-accepted">Accepted percent</Label>
              <Input
                id="ms-accepted"
                inputMode="decimal"
                value={measurement.certifiedPercent}
                onChange={(e) =>
                  onMeasurementChange({
                    ...measurement,
                    certifiedPercent: e.target.value,
                  })
                }
              />
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground text-xs">Accepted</p>
              <p className="font-medium">
                {formatPercent(bill.certifiedPercent)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestone requirements</CardTitle>
          <p className="text-muted-foreground text-sm">
            {bill.requirements.length === 0
              ? 'No requirements are recorded for this milestone. Add them on the contract billing page if certification should wait for any.'
              : open.length === 0
                ? 'Every mandatory requirement is met, so the bill can be certified once verified.'
                : `${open.length} mandatory requirement${open.length === 1 ? '' : 's'} still open. Certification waits for them.`}
          </p>
        </CardHeader>
        {bill.requirements.length > 0 && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.requirements.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-medium">{r.title}</span>
                      {r.remarks && (
                        <p className="text-muted-foreground text-xs">
                          {r.remarks}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{REQUIREMENT_TYPE_LABELS[r.type]}</TableCell>
                    <TableCell>{r.mandatory ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{formatDate(r.dueDate)}</TableCell>
                    <TableCell>
                      <RequirementStatusChip status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
