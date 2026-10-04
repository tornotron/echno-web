'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useReplaceBillAdjustments } from '@tornotron/echno-core/contract-billing/hooks';
import {
  AdjustmentEffect,
  AdjustmentSource,
  DeductionKind,
  type Bill,
} from '@tornotron/echno-core/contract-billing/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { toast } from '@/lib/styles/toast-styles';
import { formatInr, formatPercent, parseAmountInput } from '../lib/format';
import { ADDING_KINDS, KIND_LABELS } from '../lib/labels';
import { SELECT_CLASS } from './chips';

interface ManualRow {
  kind: DeductionKind;
  label: string;
  effect: AdjustmentEffect;
  amount: string;
}

/**
 * The bill's commercial adjustments. Rule lines come from the contract's
 * deduction rules: before certification they are a preview worked out from
 * the bill as it stands, and certification freezes them. Manual lines
 * (approved variations, extra items, escalation, other deductions) are
 * entered here before certification by the project manager or admin.
 */
export function BillAdjustments({
  bill,
  editable,
}: {
  bill: Bill;
  editable: boolean;
}) {
  const replace = useReplaceBillAdjustments();
  const manual = bill.adjustments.filter(
    (a) => a.source === AdjustmentSource.MANUAL
  );
  const [rows, setRows] = useState<ManualRow[]>(() =>
    manual.map((a) => ({
      kind: a.kind,
      label: a.label,
      effect: a.effect,
      amount: String(a.amount),
    }))
  );
  const [editing, setEditing] = useState(false);

  const save = () => {
    const adjustments = [];
    for (const row of rows) {
      const amount = parseAmountInput(row.amount);
      if (
        !row.label.trim() ||
        amount === undefined ||
        amount === null ||
        amount <= 0
      ) {
        toast.error('Check the adjustments', {
          description: 'Every line needs a label and an amount above zero.',
        });
        return;
      }
      adjustments.push({
        kind: row.kind,
        label: row.label.trim(),
        effect: row.effect,
        amount,
      });
    }
    replace.mutate(
      { id: bill.id, adjustments },
      {
        onSuccess: () => {
          toast.success('Adjustments saved');
          setEditing(false);
        },
        onError: (err) =>
          toast.error(getErrorTitle(err, 'Could not save the adjustments'), {
            description: getErrorMessage(err),
          }),
      }
    );
  };

  const update = (index: number, patch: Partial<ManualRow>) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Adjustments on this bill</CardTitle>
          <p className="text-muted-foreground text-sm">
            {bill.amountsFinal
              ? 'Frozen at certification.'
              : 'Rule lines are a preview from the contract’s deduction rules and are frozen when the bill is certified.'}
          </p>
        </CardHeader>
        <CardContent>
          {bill.adjustments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No adjustments. Add deduction rules on the contract billing page,
              or manual lines below.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.adjustments.map((a, index) => (
                  <TableRow key={a.id ?? `preview-${index}`}>
                    <TableCell className="font-medium">
                      {a.effect === AdjustmentEffect.ADD ? 'Add: ' : 'Less: '}
                      {a.label}
                    </TableCell>
                    <TableCell>{KIND_LABELS[a.kind]}</TableCell>
                    <TableCell>
                      {a.source === AdjustmentSource.RULE
                        ? a.preview
                          ? 'Rule (preview)'
                          : 'Rule'
                        : 'Manual'}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.rate === undefined ? '-' : formatPercent(a.rate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.effect === AdjustmentEffect.ADD ? '' : '- '}
                      {formatInr(a.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right">
                    Additions
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(bill.additionsTotal)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right">
                    Deductions
                  </TableCell>
                  <TableCell className="text-right">
                    - {formatInr(bill.deductionsTotal)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Net payable
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatInr(bill.netPayable)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editable && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manual lines</CardTitle>
            {!editing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Edit manual lines
              </Button>
            )}
          </CardHeader>
          {editing && (
            <CardContent className="space-y-3">
              {rows.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No manual lines. Add an approved variation or an extra item.
                </p>
              )}
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_1fr_9rem_9rem_auto]"
                >
                  <select
                    aria-label="Kind"
                    className={SELECT_CLASS}
                    value={row.kind}
                    onChange={(e) => {
                      const kind = e.target.value as DeductionKind;
                      update(index, {
                        kind,
                        effect: ADDING_KINDS.has(kind)
                          ? AdjustmentEffect.ADD
                          : AdjustmentEffect.DEDUCT,
                      });
                    }}
                  >
                    {Object.values(DeductionKind).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <Input
                    aria-label="Label"
                    value={row.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder="Approved variation VO-03"
                  />
                  <select
                    aria-label="Effect"
                    className={SELECT_CLASS}
                    value={row.effect}
                    onChange={(e) =>
                      update(index, {
                        effect: e.target.value as AdjustmentEffect,
                      })
                    }
                  >
                    <option value={AdjustmentEffect.ADD}>Add</option>
                    <option value={AdjustmentEffect.DEDUCT}>Deduct</option>
                  </select>
                  <Input
                    aria-label="Amount"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => update(index, { amount: e.target.value })}
                    placeholder="Amount (₹)"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remove line"
                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setRows([
                      ...rows,
                      {
                        kind: DeductionKind.VARIATION,
                        label: '',
                        effect: AdjustmentEffect.ADD,
                        amount: '',
                      },
                    ])
                  }
                >
                  <Plus className="size-4" />
                  Add line
                </Button>
                <Button size="sm" onClick={save} disabled={replace.isPending}>
                  {replace.isPending ? 'Saving...' : 'Save manual lines'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
