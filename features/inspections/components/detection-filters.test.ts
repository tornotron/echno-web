import { describe, expect, test } from 'bun:test';
import { RegionShape } from '@tornotron/echno-core/inspection/types';
import {
  CvModelFamily,
  CvModelTask,
  CvModelVersionStatus,
} from '@tornotron/echno-core/vision/types';
import type {
  CvModel,
  CvModelVersion,
} from '@tornotron/echno-core/vision/types';
import { RegionOrigin } from '@tornotron/echno-core/inspection/types';
import {
  EMPTY_DETECTION_FILTERS,
  classOptions,
  detectionListParams,
  percentToFraction,
} from './detection-filters';
import { regionDash, visibleRegions } from './region-overlay';

/**
 * The queue's detection filters and the overlay's drawing rules (Phase 4
 * WP5): unset filters stay out of the query, the class list follows the
 * chosen model version, a model's guess is dashed until reviewed, and
 * retired regions only show with history on.
 */

function version(v: string, classes: string[]): CvModelVersion {
  return {
    id: `id-${v}`,
    modelKey: 'safety',
    version: v,
    status: CvModelVersionStatus.ACTIVE,
    classes: classes.map((key) => ({
      key,
      shape: RegionShape.BOX,
      threshold: 0.5,
    })),
    licence: 'Apache-2.0',
    baseWeights: '',
    weightsUri: '',
    weightsSha256: '',
    runtime: 'onnx',
    inputSize: 640,
  };
}

const models: CvModel[] = [
  {
    key: 'safety',
    name: 'Site safety',
    task: CvModelTask.DETECT,
    family: CvModelFamily.SAFETY,
    versions: [
      version('0.1.0', ['worker', 'ppe_helmet']),
      version('0.2.0', ['worker', 'ppe_helmet', 'ppe_vest']),
    ],
  },
];

describe('detection list params', () => {
  test('an empty filter adds nothing to the query', () => {
    expect(detectionListParams(EMPTY_DETECTION_FILTERS)).toEqual({});
  });

  test('every set field goes through; a version without a model does not', () => {
    expect(
      detectionListParams({
        modelName: 'safety',
        modelVersion: '0.2.0',
        categories: ['ppe_helmet', 'ppe_vest'],
        minConfidence: 0.3,
        maxConfidence: 0.9,
        hasRegions: true,
        sortByConfidence: 'asc',
      })
    ).toEqual({
      modelName: 'safety',
      modelVersion: '0.2.0',
      categories: ['ppe_helmet', 'ppe_vest'],
      minConfidence: 0.3,
      maxConfidence: 0.9,
      hasRegions: true,
      sortByConfidence: 'asc',
    });
    expect(
      detectionListParams({ categories: [], modelVersion: '0.2.0' })
    ).toEqual({});
  });

  test('a typed percentage becomes a clamped fraction, empty is no bound', () => {
    expect(percentToFraction('35')).toBe(0.35);
    expect(percentToFraction('140')).toBe(1);
    expect(percentToFraction('')).toBeUndefined();
    expect(percentToFraction('abc')).toBeUndefined();
  });

  test('the class list follows the chosen version, then the model, then the taxonomy', () => {
    expect(classOptions(models, 'safety', '0.1.0')).toEqual([
      'worker',
      'ppe_helmet',
    ]);
    expect(classOptions(models, 'safety', undefined)).toEqual([
      'worker',
      'ppe_helmet',
      'ppe_vest',
    ]);
    expect(classOptions(undefined, undefined, undefined)).toContain('crack');
  });
});

describe('overlay drawing rules', () => {
  test('a model region is dashed until reviewed; a reviewer region is solid', () => {
    expect(regionDash({ origin: RegionOrigin.PRODUCER }, false)).toBe('6 4');
    expect(regionDash({ origin: RegionOrigin.PRODUCER }, true)).toBeUndefined();
    expect(
      regionDash({ origin: RegionOrigin.REVIEWER }, false)
    ).toBeUndefined();
    expect(
      regionDash({ origin: RegionOrigin.PRODUCER, retired: true }, true)
    ).toBe('2 3');
  });

  test('retired regions are hidden unless history is on', () => {
    const regions = [{ id: 'a' }, { id: 'b', retired: true }];
    expect(visibleRegions(regions, false).map((r) => r.id)).toEqual(['a']);
    expect(visibleRegions(regions, true).map((r) => r.id)).toEqual(['a', 'b']);
  });
});
