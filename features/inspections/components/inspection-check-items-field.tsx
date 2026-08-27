'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import {
  CheckItemStatus,
  checkItemStatusLabels,
  type InspectionCheckItem,
} from '@/types/inspection';

/**
 * One checkpoint being edited.
 *
 * `key` is a client-side handle used only to keep React rows stable while they
 * are being edited; it never reaches the API. The saved rows carry a server
 * UUID, but a checkpoint that has just been added has no id at all, and the
 * save replaces the whole list anyway, so the row identity has to come from
 * somewhere the client controls.
 */
export interface CheckItemDraft {
  key: string;
  category: string;
  checkPoint: string;
  specification: string;
  status: CheckItemStatus;
  remarks: string;
  photosRequired: boolean;
  photos: string[];
  measurement: string;
  expectedValue: string;
  priority: string;
}

const CHECK_ITEM_STATUS_ORDER: readonly CheckItemStatus[] = [
  CheckItemStatus.PENDING,
  CheckItemStatus.PASSED,
  CheckItemStatus.FAILED,
  CheckItemStatus.NOT_APPLICABLE,
];

let draftCounter = 0;

/** A blank checkpoint, ready to be filled in. */
export function emptyCheckItemDraft(): CheckItemDraft {
  draftCounter += 1;
  return {
    key: `draft-${draftCounter}`,
    category: '',
    checkPoint: '',
    specification: '',
    // A checkpoint is written down before it is carried out, so it starts
    // pending rather than claiming an outcome nobody has recorded yet.
    status: CheckItemStatus.PENDING,
    remarks: '',
    photosRequired: false,
    photos: [],
    measurement: '',
    expectedValue: '',
    priority: '',
  };
}

/** Turns the saved checkpoints of an inspection into editable drafts. */
export function toCheckItemDrafts(
  items: readonly InspectionCheckItem[]
): CheckItemDraft[] {
  return items.map((item, index) => ({
    key: item.id || `saved-${index}`,
    category: item.category ?? '',
    checkPoint: item.checkPoint ?? '',
    specification: item.specification ?? '',
    status: item.status,
    remarks: item.remarks ?? '',
    photosRequired: item.photosRequired,
    photos: item.photos ?? [],
    measurement: item.measurement ?? '',
    expectedValue: item.expectedValue ?? '',
    priority: item.priority ?? '',
  }));
}

interface InspectionCheckItemsFieldProps {
  value: CheckItemDraft[];
  onChange: (next: CheckItemDraft[]) => void;
  /** Per-row messages, keyed by the draft's `key`. */
  errors?: Record<string, string>;
}

export function InspectionCheckItemsField({
  value,
  onChange,
  errors = {},
}: InspectionCheckItemsFieldProps) {
  function updateAt(index: number, patch: Partial<CheckItemDraft>) {
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, emptyCheckItemDraft()]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          Checkpoints
        </CardTitle>
        <CardDescription>
          The individual checks this inspection covers. Each one records what is
          being checked and how it turned out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {value.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No checkpoints yet. Add the checks the inspector should work
            through.
          </p>
        ) : (
          value.map((item, index) => (
            <CheckItemRow
              key={item.key}
              item={item}
              index={index}
              error={errors[item.key]}
              onPatch={(patch) => updateAt(index, patch)}
              onRemove={() => removeAt(index)}
            />
          ))
        )}

        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Add checkpoint
        </Button>
      </CardContent>
    </Card>
  );
}

interface CheckItemRowProps {
  item: CheckItemDraft;
  index: number;
  error?: string;
  onPatch: (patch: Partial<CheckItemDraft>) => void;
  onRemove: () => void;
}

function CheckItemRow({
  item,
  index,
  error,
  onPatch,
  onRemove,
}: CheckItemRowProps) {
  const rowId = `check-item-${item.key}`;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Checkpoint {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove checkpoint ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={`${rowId}-category`}>
            Category <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`${rowId}-category`}
            value={item.category}
            onChange={(e) => onPatch({ category: e.target.value })}
            placeholder="e.g., Reinforcement"
            maxLength={200}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor={`${rowId}-checkpoint`}>
            Check point <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`${rowId}-checkpoint`}
            value={item.checkPoint}
            onChange={(e) => onPatch({ checkPoint: e.target.value })}
            placeholder="e.g., Rebar spacing matches drawing"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${rowId}-status`}>Status</Label>
          <Select
            value={item.status}
            onValueChange={(next) =>
              onPatch({ status: next as CheckItemStatus })
            }
          >
            <SelectTrigger id={`${rowId}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECK_ITEM_STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {checkItemStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${rowId}-specification`}>
            Specification (optional)
          </Label>
          <Input
            id={`${rowId}-specification`}
            value={item.specification}
            onChange={(e) => onPatch({ specification: e.target.value })}
            placeholder="e.g., 150mm c/c +/- 10mm"
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${rowId}-measurement`}>Measured (optional)</Label>
          <Input
            id={`${rowId}-measurement`}
            value={item.measurement}
            onChange={(e) => onPatch({ measurement: e.target.value })}
            placeholder="e.g., 148mm"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${rowId}-expected`}>Expected (optional)</Label>
          <Input
            id={`${rowId}-expected`}
            value={item.expectedValue}
            onChange={(e) => onPatch({ expectedValue: e.target.value })}
            placeholder="e.g., 150mm"
            maxLength={200}
          />
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label htmlFor={`${rowId}-remarks`}>Remarks (optional)</Label>
          <Textarea
            id={`${rowId}-remarks`}
            value={item.remarks}
            onChange={(e) => onPatch({ remarks: e.target.value })}
            placeholder="Anything worth recording against this check"
            maxLength={1000}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${rowId}-priority`}>Priority (optional)</Label>
          <Input
            id={`${rowId}-priority`}
            value={item.priority}
            onChange={(e) => onPatch({ priority: e.target.value })}
            placeholder="e.g., high"
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${rowId}-photos-required`}
          checked={item.photosRequired}
          onCheckedChange={(checked) =>
            onPatch({ photosRequired: checked === true })
          }
        />
        <Label
          htmlFor={`${rowId}-photos-required`}
          className="text-sm font-normal"
        >
          Photo evidence required
        </Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
