'use client';

import { useMemo, useRef, useState } from 'react';
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { Square, Trash2, Undo2 } from 'lucide-react';
import {
  RegionEditKind,
  RegionOrigin,
  RegionShape,
} from '@tornotron/echno-core/inspection/types';
import type {
  ObservationRegion,
  RegionBox,
  RegionPoint,
} from '@tornotron/echno-core/inspection/types';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { cn } from '@/lib/utils/index';
import {
  buildRegionOps,
  describeOps,
  draftsFromRegions,
  leavesNoRegion,
} from '../lib/region-edits';
import type { DraftAction, DraftRegion } from '../lib/region-edits';
import {
  BOX_HANDLES,
  boxFromCorners,
  clientToFraction,
  handlePosition,
  isUsableBox,
  moveBox,
  movePoints,
  moveVertex,
  resizeBox,
} from '../lib/region-geometry';
import type { BoxHandle } from '../lib/region-geometry';
import {
  OBJECT_CLASSES,
  classLabel,
  classesForShape,
  regionColour,
} from '../lib/region-taxonomy';
import { RegionOverlay } from './region-overlay';
import type { OverlayRegion } from './region-overlay';

/** An evidence image the editor can draw on. */
export interface EditableImage {
  id: number;
  url: string;
  name: string;
}

type Drag =
  | {
      kind: 'move';
      key: string;
      start: RegionPoint;
      box: RegionBox;
      points?: RegionPoint[];
    }
  | { kind: 'resize'; key: string; handle: BoxHandle }
  | { kind: 'vertex'; key: string; index: number }
  | { kind: 'draw'; start: RegionPoint };

const HANDLE_CURSOR: Record<BoxHandle, string> = {
  nw: 'cursor-nwse-resize',
  se: 'cursor-nwse-resize',
  ne: 'cursor-nesw-resize',
  sw: 'cursor-nesw-resize',
  n: 'cursor-ns-resize',
  s: 'cursor-ns-resize',
  e: 'cursor-ew-resize',
  w: 'cursor-ew-resize',
};

const DRAW_PREVIEW_ID = '__draw__';

interface RegionEditorProps {
  /** The observation's regions as loaded (the editor diffs against these). */
  original: readonly ObservationRegion[];
  drafts: readonly DraftRegion[];
  dispatch: Dispatch<DraftAction>;
  images: readonly EditableImage[];
}

/**
 * The review sheet's region editor (MODIFY). Select a region by clicking it,
 * drag it to move it, drag a box's corner or edge handles or a polygon's
 * vertices to reshape it, pick another class of the same shape, draw a new
 * box with "Draw box", and press Delete to remove the selected region. The
 * drafts live in the sheet (`draftsReducer`), which turns them into the op
 * list with `buildRegionOps`. Adding a vertex to a polygon is not offered.
 */
export function RegionEditor({
  original,
  drafts,
  dispatch,
  images,
}: RegionEditorProps) {
  const [attachmentId, setAttachmentId] = useState<number | undefined>(
    () => drafts[0]?.attachmentId ?? images[0]?.id
  );
  const [selectedKey, setSelectedKey] = useState<string>();
  const [drawing, setDrawing] = useState(false);
  const [preview, setPreview] = useState<RegionBox | null>(null);
  const drag = useRef<Drag | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const added = useRef(0);

  const image = images.find((item) => item.id === attachmentId) ?? images[0];
  const ops = useMemo(
    () => buildRegionOps(original, drafts),
    [original, drafts]
  );
  const corrected = useMemo(
    () =>
      new Set(
        ops.flatMap((op) =>
          op.op === RegionEditKind.REPLACE ? [op.regionId] : []
        )
      ),
    [ops]
  );
  const onImage = drafts.filter(
    (draft) => draft.attachmentId === image?.id && !draft.removed
  );
  const selected = onImage.find((draft) => draft.key === selectedKey);

  const overlayRegions: OverlayRegion[] = onImage.map((draft) => {
    const touched = !draft.sourceId || corrected.has(draft.sourceId);
    return {
      id: draft.key,
      shape: draft.shape,
      box: draft.box,
      points: draft.points,
      classKey: draft.classKey,
      score: touched ? undefined : draft.score,
      origin: touched ? RegionOrigin.REVIEWER : draft.origin,
    };
  });
  if (preview) {
    overlayRegions.push({
      id: DRAW_PREVIEW_ID,
      shape: RegionShape.BOX,
      box: preview,
      classKey: defaultClass(selected, onImage),
      origin: RegionOrigin.REVIEWER,
    });
  }

  if (!image) {
    return (
      <p className="text-muted-foreground text-xs">
        The evidence images have not loaded, so the regions cannot be edited.
      </p>
    );
  }

  const pointAt = (event: { clientX: number; clientY: number }) => {
    const rect = frame.current?.getBoundingClientRect();
    return rect
      ? clientToFraction(event.clientX, event.clientY, rect)
      : ([0, 0] as RegionPoint);
  };
  const capture = (event: ReactPointerEvent<Element>) => {
    frame.current?.setPointerCapture?.(event.pointerId);
    frame.current?.focus();
  };

  const startMove = (key: string, event: ReactPointerEvent<SVGElement>) => {
    const draft = onImage.find((item) => item.key === key);
    if (!draft) return;
    setSelectedKey(key);
    drag.current = {
      kind: 'move',
      key,
      start: pointAt(event),
      box: draft.box,
      points: draft.points,
    };
    capture(event);
  };

  const startBackground = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawing) {
      setSelectedKey(undefined);
      frame.current?.focus();
      return;
    }
    drag.current = { kind: 'draw', start: pointAt(event) };
    setPreview(null);
    capture(event);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const point = pointAt(event);
    switch (current.kind) {
      case 'move': {
        const dx = point[0] - current.start[0];
        const dy = point[1] - current.start[1];
        dispatch(
          current.points
            ? {
                type: 'geometry',
                key: current.key,
                points: movePoints(current.points, dx, dy),
              }
            : {
                type: 'geometry',
                key: current.key,
                box: moveBox(current.box, dx, dy),
              }
        );
        break;
      }
      case 'resize': {
        const draft = drafts.find((item) => item.key === current.key);
        if (draft) {
          dispatch({
            type: 'geometry',
            key: current.key,
            box: resizeBox(draft.box, current.handle, point),
          });
        }
        break;
      }
      case 'vertex': {
        const draft = drafts.find((item) => item.key === current.key);
        if (draft?.points) {
          dispatch({
            type: 'geometry',
            key: current.key,
            points: moveVertex(draft.points, current.index, point),
          });
        }
        break;
      }
      case 'draw': {
        setPreview(boxFromCorners(current.start, point));
        break;
      }
    }
  };

  const onPointerUp = () => {
    const current = drag.current;
    drag.current = null;
    if (current?.kind !== 'draw') return;
    const box = preview;
    setPreview(null);
    setDrawing(false);
    if (!box || !isUsableBox(box)) return;
    added.current += 1;
    const key = `new-${added.current}`;
    const sized = onImage.find((draft) => draft.imageWidth);
    dispatch({
      type: 'add',
      draft: {
        key,
        attachmentId: image.id,
        shape: RegionShape.BOX,
        box,
        classKey: defaultClass(selected, onImage),
        origin: RegionOrigin.REVIEWER,
        removed: false,
        imageWidth: sized?.imageWidth,
        imageHeight: sized?.imageHeight,
      },
    });
    setSelectedKey(key);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && selected) {
      event.preventDefault();
      dispatch({ type: 'remove', key: selected.key });
      setSelectedKey(undefined);
    } else if (event.key === 'Escape' && (drawing || selected)) {
      event.preventDefault();
      event.stopPropagation();
      setDrawing(false);
      setSelectedKey(undefined);
    }
  };

  const handleDown =
    (next: Drag) => (event: ReactPointerEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      event.preventDefault();
      drag.current = next;
      capture(event);
    };

  const classOptions = selected
    ? [
        ...new Set([...classesForShape(selected.shape), selected.classKey]),
      ].filter(Boolean)
    : [];
  const refusal = leavesNoRegion(original, drafts);

  return (
    <div className="space-y-2" data-testid="region-editor">
      <div className="flex flex-wrap items-center gap-2">
        {images.length > 1 &&
          images.map((item, index) => (
            <Button
              key={item.id}
              size="sm"
              variant={item.id === image.id ? 'default' : 'outline'}
              onClick={() => {
                setAttachmentId(item.id);
                setSelectedKey(undefined);
              }}
              title={item.name}
            >
              Image {index + 1}
            </Button>
          ))}
        <Button
          size="sm"
          variant={drawing ? 'default' : 'outline'}
          aria-pressed={drawing}
          onClick={() => setDrawing((value) => !value)}
        >
          <Square className="h-3 w-3" />
          Draw box
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            dispatch({ type: 'remove', key: selected.key });
            setSelectedKey(undefined);
          }}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={ops.length === 0}
          onClick={() => {
            dispatch({ type: 'reset', drafts: draftsFromRegions(original) });
            setSelectedKey(undefined);
          }}
        >
          <Undo2 className="h-3 w-3" />
          Undo all
        </Button>
      </div>

      <div
        tabIndex={0}
        role="application"
        aria-label="Region editor. Delete removes the selected region."
        className={cn(
          'rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          drawing && 'cursor-crosshair'
        )}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <RegionOverlay
          frameRef={frame}
          src={image.url}
          alt={image.name}
          regions={overlayRegions}
          reviewed={false}
          selectedId={selected?.key}
          onRegionPointerDown={drawing ? undefined : startMove}
          onBackgroundPointerDown={startBackground}
        >
          {selected &&
            selected.shape === RegionShape.BOX &&
            BOX_HANDLES.map((handle) => {
              const [x, y] = handlePosition(selected.box, handle);
              return (
                <span
                  key={handle}
                  data-testid={`handle-${handle}`}
                  className={cn(
                    'absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow',
                    HANDLE_CURSOR[handle]
                  )}
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    backgroundColor: regionColour(selected.classKey),
                  }}
                  onPointerDown={handleDown({
                    kind: 'resize',
                    key: selected.key,
                    handle,
                  })}
                />
              );
            })}
          {selected?.shape === RegionShape.POLYGON &&
            (selected.points ?? []).map(([x, y], index) => (
              <span
                key={`vertex-${index}`}
                data-testid="vertex-handle"
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border-2 border-white shadow"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  backgroundColor: regionColour(selected.classKey),
                }}
                onPointerDown={handleDown({
                  kind: 'vertex',
                  key: selected.key,
                  index,
                })}
              />
            ))}
        </RegionOverlay>
      </div>

      {selected ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="region-class">Class</Label>
            <Select
              value={selected.classKey}
              onValueChange={(classKey) =>
                dispatch({ type: 'class', key: selected.key, classKey })
              }
            >
              <SelectTrigger id="region-class" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    {classLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-muted-foreground pb-2 text-xs">
            {selected.shape === RegionShape.POLYGON
              ? 'Drag the polygon or its vertices.'
              : 'Drag the box, or its corners and edges.'}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          {drawing
            ? 'Drag on the image to draw a box.'
            : 'Click a region to select it. Delete removes the selected region.'}
        </p>
      )}

      <p className="text-xs" data-testid="region-ops-summary">
        {describeOps(ops)}
      </p>
      {refusal && (
        <p role="alert" className="text-destructive text-xs">
          Every region is removed. If the model found nothing here, reject the
          observation instead.
        </p>
      )}
    </div>
  );
}

function defaultClass(
  selected: DraftRegion | undefined,
  onImage: readonly DraftRegion[]
): string {
  if (selected?.shape === RegionShape.BOX) return selected.classKey;
  const box = onImage.find((draft) => draft.shape === RegionShape.BOX);
  return box?.classKey ?? OBJECT_CLASSES[0];
}
