import { describe, expect, test } from 'bun:test';
import { RegionShape } from '@tornotron/echno-core/inspection/types';
import {
  DEFECT_CLASSES,
  OBJECT_CLASSES,
  REGION_PALETTE,
  classLabel,
  classesForShape,
  labelTextColour,
  regionColour,
  taxonomyShape,
} from './region-taxonomy';

/**
 * The class taxonomy mirrored from the backend's
 * `src/main/resources/vision/classes.json`. The lists below are that file's
 * `objectClasses` and `defectClasses` as of datasets commit 4c42531; update
 * both together.
 */
describe('class taxonomy', () => {
  test('matches the backend file', () => {
    expect([...OBJECT_CLASSES]).toEqual([
      'worker',
      'ppe_helmet',
      'ppe_vest',
      'rebar',
      'column',
      'beam',
      'wall',
      'scaffolding',
      'equipment',
      'material',
      'opening',
      'vehicle',
    ]);
    expect([...DEFECT_CLASSES]).toEqual([
      'crack',
      'honeycombing',
      'spalling',
      'surface_defect',
      'misalignment',
      'missing_component',
      'damaged_component',
      'finishing_defect',
    ]);
  });

  test('objects are boxes and defects are polygons, and the picker keeps to the shape', () => {
    expect(taxonomyShape('ppe_helmet')).toBe(RegionShape.BOX);
    expect(taxonomyShape('crack')).toBe(RegionShape.POLYGON);
    expect(taxonomyShape('not_a_class')).toBeUndefined();
    expect(classesForShape(RegionShape.BOX)).toEqual(OBJECT_CLASSES);
    expect(classesForShape(RegionShape.POLYGON)).toEqual(DEFECT_CLASSES);
  });

  test('every taxonomy class has its own fixed colour', () => {
    const all = [...OBJECT_CLASSES, ...DEFECT_CLASSES];
    const colours = all.map((key) => regionColour(key));
    expect(new Set(colours).size).toBe(all.length);
    expect(regionColour('crack')).toBe(regionColour('crack'));
    expect(REGION_PALETTE).toContain(regionColour('some_model_only_class'));
  });

  test('labels read as words and stay legible on their colour', () => {
    expect(classLabel('surface_defect')).toBe('Surface defect');
    expect(classLabel('ppe_helmet')).toBe('Helmet');
    expect(labelTextColour('#ffe119')).toBe('#000000');
    expect(labelTextColour('#000075')).toBe('#ffffff');
  });
});
