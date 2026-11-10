'use client';

import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Check, Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  ObservationDecision,
  RejectReason,
  isRegionActive,
  rejectReasonLabels,
} from '@tornotron/echno-core/inspection/types';
import type {
  Observation,
  ObservationRegion,
  ReviewBatchRequest,
  ReviewBatchResult,
} from '@tornotron/echno-core/inspection/types';
import { useReviewObservationBatch } from '@/hooks/inspection';
import type { ObservationEvidenceState } from '@/hooks/inspection';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Textarea } from '@/components/shadcn/textarea';
import { userFacingErrorMessage } from '@/lib/utils/api-utils';
import { cn } from '@/lib/utils/index';
import {
  EMPTY_SELECTION,
  applyBatchResults,
  chunkIds,
  moveFocusIndex,
  pageCheckState,
  selectRange,
  selectedOnPage,
  setPageSelection,
  summariseOutcome,
  toggleSelection,
} from '../lib/grid-selection';
import type { GridSelection } from '../lib/grid-selection';
import { tileCrop } from '../lib/region-geometry';
import { classLabel, regionColour } from '../lib/region-taxonomy';
import { regionsOf } from './observation-evidence';

/** Tile side in CSS pixels. */
const TILE_SIZE = 144;

/** The note a one-key false-positive rejection carries; a rejection always needs one. */
export const QUICK_REJECT_NOTE =
  'Rejected as a false positive in the grid review.';

/** The region a tile crops to: the first active one in draw order. */
export function firstRegion(
  observation: Pick<Observation, 'regions'>
): ObservationRegion | undefined {
  return regionsOf(observation)
    .filter((region) => isRegionActive(region))
    .toSorted((a, b) => a.lineOrder - b.lineOrder)[0];
}

interface ObservationGridProps {
  rows: readonly Observation[];
  pageEvidence: Map<string, ObservationEvidenceState>;
  /** Opens the single-item review sheet, where a box can be corrected. */
  onOpen: (observation: Observation) => void;
}

/**
 * The grid review for model findings: one tile per observation, cropped to
 * its first region, with a bulk bar. Click toggles a tile, Shift-click
 * selects a range from the last tile clicked, and the header checkbox takes
 * the page. "Accept (no action)" applies outcome NONE; creating a defect or
 * correcting a box stays in the review sheet, where the whole photo is in
 * view. Keys: `a` accepts and `r` rejects as a false positive (the
 * selection, or the focused tile when nothing is selected), arrows move
 * focus, Space toggles, Enter opens the sheet.
 *
 * Only ids the reviewer has seen are sent: the selection is limited to the
 * page in view, and a page change clears it.
 */
export function ObservationGrid({
  rows,
  pageEvidence,
  onOpen,
}: ObservationGridProps) {
  const batch = useReviewObservationBatch();
  const [selection, setSelection] = useState<GridSelection>(EMPTY_SELECTION);
  const [failures, setFailures] = useState<Map<string, string>>(new Map());
  const [focus, setFocus] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<RejectReason>(
    RejectReason.FALSE_POSITIVE
  );
  const [note, setNote] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pageIds = rows.map((row) => row.id);
  const selectedIds = selectedOnPage(selection, pageIds);
  const headerState = pageCheckState(selection, pageIds);
  const busy = batch.isPending;

  const targets = (): string[] => {
    if (selectedIds.length > 0) return selectedIds;
    const focused = rows[focus];
    return focused ? [focused.id] : [];
  };

  const run = async (
    req: Omit<ReviewBatchRequest, 'observationIds'>,
    ids: string[]
  ) => {
    if (ids.length === 0 || busy) return;
    const results: ReviewBatchResult[] = [];
    let failed: { ids: string[]; message: string } | undefined;
    for (const chunk of chunkIds(ids)) {
      if (failed) {
        failed.ids.push(...chunk);
        continue;
      }
      try {
        results.push(
          await batch.mutateAsync({ ...req, observationIds: chunk })
        );
      } catch (error) {
        failed = {
          ids: [...chunk],
          message: userFacingErrorMessage(
            error,
            'The decision could not be saved.'
          ),
        };
      }
    }
    const outcome = applyBatchResults(ids, results, {
      selected: new Set([...selection.selected, ...ids]),
      anchor: selection.anchor,
    });
    if (failed) {
      for (const id of failed.ids) outcome.failures.set(id, failed.message);
    }
    setSelection(outcome.selection);
    setFailures(outcome.failures);
    const summary = summariseOutcome(outcome);
    if (outcome.failures.size > 0) toast.error(summary);
    else toast.success(summary);
  };

  const accept = (ids: string[]) =>
    run({ decision: ObservationDecision.ACCEPT }, ids);
  const rejectFalsePositive = (ids: string[]) =>
    run(
      {
        decision: ObservationDecision.REJECT,
        rejectReason: RejectReason.FALSE_POSITIVE,
        note: QUICK_REJECT_NOTE,
      },
      ids
    );

  const focusTile = (index: number) => {
    setFocus(index);
    tileRefs.current[index]?.focus();
  };

  const columns = (): number => {
    const grid = gridRef.current;
    if (!grid || typeof getComputedStyle !== 'function') return 1;
    const template = getComputedStyle(grid).gridTemplateColumns;
    const count = template ? template.split(' ').filter(Boolean).length : 1;
    return Math.max(1, count);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey || rejectOpen) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select')) return;
    switch (event.key) {
      case 'a': {
        event.preventDefault();
        void accept(targets());
        break;
      }
      case 'r': {
        event.preventDefault();
        void rejectFalsePositive(targets());
        break;
      }
      case ' ': {
        const row = rows[focus];
        if (!row) break;
        event.preventDefault();
        setSelection((current) =>
          event.shiftKey
            ? selectRange(current, pageIds, row.id)
            : toggleSelection(current, row.id)
        );
        break;
      }
      case 'Enter': {
        const row = rows[focus];
        if (!row) break;
        event.preventDefault();
        onOpen(row);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        event.preventDefault();
        focusTile(moveFocusIndex(focus, event.key, columns(), rows.length));
        break;
      }
      default: {
        break;
      }
    }
  };

  return (
    <div className="space-y-3" data-testid="observation-grid">
      <div className="bg-background sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-md border p-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="grid-select-page"
            checked={headerState}
            onCheckedChange={(checked) =>
              setSelection((current) =>
                setPageSelection(current, pageIds, checked === true)
              )
            }
            aria-label="Select every tile on this page"
          />
          <Label htmlFor="grid-select-page" className="text-sm">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : 'Select page'}
          </Label>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={selectedIds.length === 0 || busy}
            onClick={() => void accept(selectedIds)}
          >
            <Check className="h-4 w-4" />
            Accept (no action)
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={selectedIds.length === 0 || busy}
            onClick={() => void rejectFalsePositive(selectedIds)}
          >
            <X className="h-4 w-4" />
            Reject as false positive
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedIds.length === 0 || busy}
            onClick={() => setRejectOpen(true)}
          >
            Reject...
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Click to select, Shift-click for a range. Keys: a accepts, r rejects as
        a false positive, arrows move, Enter opens the full photo.
      </p>

      <div
        ref={gridRef}
        role="listbox"
        aria-label="Detections"
        aria-multiselectable="true"
        className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3"
        onKeyDown={onKeyDown}
      >
        {rows.map((observation, index) => {
          const region = firstRegion(observation);
          const evidence = pageEvidence.get(observation.id);
          const image = region
            ? evidence?.attachments?.find(
                (item) => item.id === region.attachmentId
              )
            : undefined;
          const crop = region
            ? tileCrop(region.box, TILE_SIZE, {
                width: region.imageWidth,
                height: region.imageHeight,
              })
            : undefined;
          const checked = selection.selected.has(observation.id);
          const failure = failures.get(observation.id);
          const classKey = region?.classKey ?? observation.category ?? '';
          const score = region?.score ?? observation.confidence;
          return (
            <div
              key={observation.id}
              ref={(element) => {
                tileRefs.current[index] = element;
              }}
              role="option"
              aria-selected={checked}
              aria-label={`${classLabel(classKey)}${
                score === undefined ? '' : `, ${Math.round(score * 100)}%`
              }`}
              data-testid="grid-tile"
              tabIndex={index === focus ? 0 : -1}
              onFocus={() => setFocus(index)}
              onClick={(event) => {
                setFocus(index);
                setSelection((current) =>
                  event.shiftKey
                    ? selectRange(current, pageIds, observation.id)
                    : toggleSelection(current, observation.id)
                );
              }}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500',
                checked && 'border-blue-500 bg-blue-50 dark:bg-blue-950',
                failure && 'border-destructive'
              )}
            >
              <div
                className="bg-muted relative overflow-hidden rounded-sm"
                style={{
                  width: crop?.size ?? TILE_SIZE,
                  height: crop?.size ?? TILE_SIZE,
                  backgroundImage: image
                    ? `url(${JSON.stringify(image.file)})`
                    : undefined,
                  backgroundSize: crop?.backgroundSize,
                  backgroundPosition: crop?.backgroundPosition,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {crop && region && (
                  <span
                    className="pointer-events-none absolute border-2"
                    style={{
                      left: crop.region.left,
                      top: crop.region.top,
                      width: crop.region.width,
                      height: crop.region.height,
                      borderColor: regionColour(region.classKey),
                    }}
                  />
                )}
                {!image && (
                  <span className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
                    {evidence?.isLoading ? 'Loading' : 'No image'}
                  </span>
                )}
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  aria-hidden
                  className="bg-background pointer-events-none absolute top-1 left-1"
                />
              </div>
              <div className="flex w-full items-center justify-between gap-1 text-xs">
                <span className="truncate font-medium">
                  {classLabel(classKey)}
                </span>
                {score !== undefined && (
                  <span className="tabular-nums">
                    {Math.round(score * 100)}%
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex w-full items-center justify-between gap-1 text-[11px]">
                <span className="truncate">
                  {observation.modelVersion
                    ? `v${observation.modelVersion}`
                    : ''}
                </span>
                <button
                  type="button"
                  className="hover:text-foreground flex items-center gap-1"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(observation);
                  }}
                >
                  <Maximize2 className="h-3 w-3" />
                  Open
                </button>
              </div>
              {failure && (
                <p
                  className="text-destructive w-full text-[11px]"
                  data-testid="grid-tile-failure"
                >
                  {failure}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {selectedIds.length} findings</DialogTitle>
            <DialogDescription>
              One reason and note for all of them. Only a false positive is used
              to retrain the model.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="grid-reject-reason">Reason</Label>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as RejectReason)}
              >
                <SelectTrigger id="grid-reject-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RejectReason).map((value) => (
                    <SelectItem key={value} value={value}>
                      {rejectReasonLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="grid-reject-note">Note (required)</Label>
              <Textarea
                id="grid-reject-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Why these are not findings"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={note.trim() === '' || busy}
              onClick={async () => {
                setRejectOpen(false);
                await run(
                  {
                    decision: ObservationDecision.REJECT,
                    rejectReason: reason,
                    note: note.trim(),
                  },
                  selectedIds
                );
                setNote('');
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
