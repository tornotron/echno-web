'use client';

import type {
  Bill,
  BillLine,
} from '@tornotron/echno-core/contract-billing/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Progress } from '@/components/shadcn/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { formatInr, formatPercent, formatQty } from '../lib/format';
import type { MeasurementForm } from '../lib/requests';
import { LineStatusChip } from './chips';

interface BillQuantitiesProps {
  bill: Bill;
  claims: Record<string, string>;
  onClaimsChange: (claims: Record<string, string>) => void;
  claiming: boolean;
  measurement: MeasurementForm;
  onMeasurementChange: (form: MeasurementForm) => void;
  measuring: boolean;
}

/** Counts of a running account bill's lines by where they stand. */
export function lineCounts(lines: BillLine[]) {
  const claimed = lines.filter((l) => l.claimedQuantity > 0);
  return {
    claimed: claimed.length,
    total: lines.length,
    verified: claimed.filter(
      (l) => l.status === 'VERIFIED' || l.status === 'PART_ACCEPTED'
    ).length,
    underReview: claimed.filter((l) => l.status === 'UNDER_REVIEW').length,
    rejected: claimed.filter((l) => l.status === 'REJECTED').length,
  };
}

/**
 * The running account of an RA bill: one row per BOQ item. The claim is typed
 * here while the bill is a draft or returned, and the measured and accepted
 * quantities while it is submitted. Lines only show their saved figures; the
 * amounts move once the claim or measurement is saved.
 */
export function BillQuantities({
  bill,
  claims,
  onClaimsChange,
  claiming,
  measurement,
  onMeasurementChange,
  measuring,
}: BillQuantitiesProps) {
  const counts = lineCounts(bill.lines);
  const setClaim = (lineId: string, value: string) =>
    onClaimsChange({ ...claims, [lineId]: value });
  const setMeasured = (
    lineId: string,
    field: 'measured' | 'accepted',
    value: string
  ) =>
    onMeasurementChange({
      ...measurement,
      lines: {
        ...measurement.lines,
        [lineId]: {
          ...(measurement.lines[lineId] ?? { measured: '', accepted: '' }),
          [field]: value,
        },
      },
    });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Count
          label="Items claimed"
          value={`${counts.claimed}`}
          hint={`of ${counts.total} BOQ items`}
        />
        <Count
          label="Verified"
          value={`${counts.verified}`}
          hint="Accepted in full or in part"
        />
        <Count
          label="Under review"
          value={`${counts.underReview}`}
          hint="Waiting for the joint measurement"
        />
        <Count
          label="Rejected"
          value={`${counts.rejected}`}
          hint="Nothing accepted"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>BOQ items and claimed quantities</CardTitle>
          {claiming && (
            <p className="text-muted-foreground text-sm">
              Enter this bill&apos;s claim per item, then save the claim or
              submit the bill. A claim cannot take an item past its contract
              quantity; bill excess work as an extra item under Adjustments.
            </p>
          )}
          {measuring && (
            <p className="text-muted-foreground text-sm">
              Enter the measured and accepted quantity of every claimed item.
              Zero accepted rejects the item.
            </p>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {bill.lines.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This bill has no lines.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Contract qty</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">This claim</TableHead>
                  <TableHead className="text-right">Measured</TableHead>
                  <TableHead className="text-right">Accepted</TableHead>
                  <TableHead className="text-right">Cumulative</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>% complete</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">This bill</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.lines.map((line) => {
                  const typed = measurement.lines[line.id] ?? {
                    measured: '',
                    accepted: '',
                  };
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.itemCode}
                      </TableCell>
                      <TableCell className="max-w-56">
                        {line.description}
                      </TableCell>
                      <TableCell>{line.unit}</TableCell>
                      <TableCell className="text-right">
                        {formatQty(line.contractQuantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQty(line.previousQuantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {claiming ? (
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              aria-label={`Claim for ${line.itemCode}`}
                              inputMode="decimal"
                              className="h-8 w-28 text-right"
                              value={
                                claims[line.id] ?? String(line.claimedQuantity)
                              }
                              onChange={(e) =>
                                setClaim(line.id, e.target.value)
                              }
                            />
                            {line.suggestedQuantity !== undefined &&
                              line.suggestedQuantity > 0 && (
                                <Button
                                  type="button"
                                  variant="link"
                                  size="xs"
                                  className="h-auto p-0"
                                  onClick={() =>
                                    setClaim(
                                      line.id,
                                      String(line.suggestedQuantity)
                                    )
                                  }
                                >
                                  Use {formatQty(line.suggestedQuantity)} from
                                  progress
                                </Button>
                              )}
                          </div>
                        ) : (
                          formatQty(line.claimedQuantity)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {measuring && line.claimedQuantity > 0 ? (
                          <Input
                            aria-label={`Measured for ${line.itemCode}`}
                            inputMode="decimal"
                            className="h-8 w-24 text-right"
                            value={typed.measured}
                            onChange={(e) =>
                              setMeasured(line.id, 'measured', e.target.value)
                            }
                          />
                        ) : (
                          formatQty(line.measuredQuantity)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {measuring && line.claimedQuantity > 0 ? (
                          <Input
                            aria-label={`Accepted for ${line.itemCode}`}
                            inputMode="decimal"
                            className="h-8 w-24 text-right"
                            value={typed.accepted}
                            onChange={(e) =>
                              setMeasured(line.id, 'accepted', e.target.value)
                            }
                          />
                        ) : (
                          formatQty(line.acceptedQuantity)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQty(line.cumulativeQuantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQty(line.balanceQuantity)}
                      </TableCell>
                      <TableCell className="min-w-32">
                        <div className="flex items-center gap-2">
                          <span className="w-12 text-xs">
                            {formatPercent(line.percentComplete)}
                          </span>
                          <Progress
                            value={Math.min(100, line.percentComplete)}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatInr(line.rate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatInr(line.thisAmount)}
                      </TableCell>
                      <TableCell>
                        <LineStatusChip status={line.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Count({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="px-4">
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-sm">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}
