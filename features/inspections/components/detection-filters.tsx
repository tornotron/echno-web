'use client';

import { ChevronDown } from 'lucide-react';
import type { CvModel } from '@tornotron/echno-core/vision/types';
import type { ObservationListParams } from '@tornotron/echno-core/observation/services';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  DEFECT_CLASSES,
  OBJECT_CLASSES,
  classLabel,
} from '../lib/region-taxonomy';

/** Sentinel for "no filter": Radix Select cannot hold an empty string value. */
const ANY = 'ANY';

/** The detection filters on the observation queue, confidences as fractions. */
export interface DetectionFilterValue {
  modelName?: string;
  modelVersion?: string;
  categories: string[];
  minConfidence?: number;
  maxConfidence?: number;
  hasRegions?: boolean;
  sortByConfidence?: 'asc' | 'desc';
}

export const EMPTY_DETECTION_FILTERS: DetectionFilterValue = { categories: [] };

/** The list query parameters for a filter value; unset fields are left out. */
export function detectionListParams(
  value: DetectionFilterValue
): Partial<ObservationListParams> {
  const params: Partial<ObservationListParams> = {};
  if (value.modelName) params.modelName = value.modelName;
  if (value.modelName && value.modelVersion) {
    params.modelVersion = value.modelVersion;
  }
  if (value.categories.length > 0) params.categories = value.categories;
  if (value.minConfidence !== undefined) {
    params.minConfidence = value.minConfidence;
  }
  if (value.maxConfidence !== undefined) {
    params.maxConfidence = value.maxConfidence;
  }
  if (value.hasRegions !== undefined) params.hasRegions = value.hasRegions;
  if (value.sortByConfidence) {
    params.sortByConfidence = value.sortByConfidence;
  }
  return params;
}

/**
 * The classes offered: the chosen version's own classes from the registry,
 * every class of the chosen model's versions, or the whole taxonomy when no
 * model is chosen.
 */
export function classOptions(
  models: readonly CvModel[] | undefined,
  modelName: string | undefined,
  modelVersion: string | undefined
): string[] {
  const model = models?.find((item) => item.key === modelName);
  if (model) {
    const versions = modelVersion
      ? model.versions.filter((version) => version.version === modelVersion)
      : model.versions;
    const keys = [
      ...new Set(versions.flatMap((v) => v.classes.map((c) => c.key))),
    ];
    if (keys.length > 0) return keys;
  }
  return [...OBJECT_CLASSES, ...DEFECT_CLASSES];
}

/** A percentage typed by the reviewer, as a fraction; empty is no bound. */
export function percentToFraction(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, value)) / 100;
}

function fractionToPercent(value: number | undefined): string {
  return value === undefined ? '' : String(Math.round(value * 100));
}

interface DetectionFiltersProps {
  value: DetectionFilterValue;
  onChange: (value: DetectionFilterValue) => void;
  /** The registry's models; only fetched when the vision module is on. */
  models: readonly CvModel[] | undefined;
}

/**
 * Filters for model findings: model and version (from the registry), class,
 * confidence range, whether the finding has regions, and the confidence
 * sort. Shown with the vision module on and the source filter at AI.
 */
export function DetectionFilters({
  value,
  onChange,
  models,
}: DetectionFiltersProps) {
  const model = models?.find((item) => item.key === value.modelName);
  const classes = classOptions(models, value.modelName, value.modelVersion);
  const set = (patch: Partial<DetectionFilterValue>) =>
    onChange({ ...value, ...patch });

  return (
    <div
      className="flex flex-wrap items-end gap-4"
      data-testid="detection-filters"
    >
      <div className="space-y-1">
        <Label htmlFor="detection-model">Model</Label>
        <Select
          value={value.modelName ?? ANY}
          onValueChange={(next) =>
            set({
              modelName: next === ANY ? undefined : next,
              modelVersion: undefined,
              categories: [],
            })
          }
        >
          <SelectTrigger id="detection-model" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All models</SelectItem>
            {(models ?? []).map((item) => (
              <SelectItem key={item.key} value={item.key}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="detection-version">Version</Label>
        <Select
          value={value.modelVersion ?? ANY}
          disabled={!model}
          onValueChange={(next) =>
            set({ modelVersion: next === ANY ? undefined : next })
          }
        >
          <SelectTrigger id="detection-version" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All versions</SelectItem>
            {(model?.versions ?? []).map((version) => (
              <SelectItem key={version.id} value={version.version}>
                {version.version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Class</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-44 justify-between font-normal"
              data-testid="detection-class-trigger"
            >
              {value.categories.length === 0
                ? 'All classes'
                : value.categories.length === 1
                  ? classLabel(value.categories[0])
                  : `${value.categories.length} classes`}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-72 overflow-y-auto">
            {classes.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={value.categories.includes(key)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) =>
                  set({
                    categories: checked
                      ? [...value.categories, key]
                      : value.categories.filter((item) => item !== key),
                  })
                }
              >
                {classLabel(key)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-1">
        <Label htmlFor="detection-min">Confidence %</Label>
        <div className="flex items-center gap-1">
          <Input
            id="detection-min"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            placeholder="0"
            aria-label="Lowest confidence, percent"
            className="w-20"
            value={fractionToPercent(value.minConfidence)}
            onChange={(event) =>
              set({ minConfidence: percentToFraction(event.target.value) })
            }
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            placeholder="100"
            aria-label="Highest confidence, percent"
            className="w-20"
            value={fractionToPercent(value.maxConfidence)}
            onChange={(event) =>
              set({ maxConfidence: percentToFraction(event.target.value) })
            }
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="detection-has-regions">Regions</Label>
        <Select
          value={
            value.hasRegions === undefined
              ? ANY
              : value.hasRegions
                ? 'YES'
                : 'NO'
          }
          onValueChange={(next) =>
            set({ hasRegions: next === ANY ? undefined : next === 'YES' })
          }
        >
          <SelectTrigger id="detection-has-regions" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            <SelectItem value="YES">With regions</SelectItem>
            <SelectItem value="NO">Without regions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="detection-sort">Sort</Label>
        <Select
          value={value.sortByConfidence ?? ANY}
          onValueChange={(next) =>
            set({
              sortByConfidence:
                next === ANY ? undefined : (next as 'asc' | 'desc'),
            })
          }
        >
          <SelectTrigger id="detection-sort" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Default order</SelectItem>
            <SelectItem value="desc">Confidence, high to low</SelectItem>
            <SelectItem value="asc">Confidence, low to high</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
