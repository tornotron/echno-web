import { RegionShape } from '@tornotron/echno-core/inspection/types';

/**
 * The class taxonomy the region editor offers, mirrored from the backend's
 * `src/main/resources/vision/classes.json` (itself generated from
 * `echno_datasets/classes.py`). Object classes are drawn as boxes and defect
 * classes as polygons, which is the shape rule the backend applies at intake
 * (`SHAPE_MISMATCH`). The negative types and progress states in that file
 * are not region classes, so they are left out.
 *
 * Kept as a constant because the picker is needed in the review sheet, which
 * works with the vision module switched off and so cannot ask the model
 * registry. `region-taxonomy.test.ts` pins the lists, so a change to the
 * backend file shows up as a failing test here when this copy is updated.
 */
export const OBJECT_CLASSES = [
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
] as const;

export const DEFECT_CLASSES = [
  'crack',
  'honeycombing',
  'spalling',
  'surface_defect',
  'misalignment',
  'missing_component',
  'damaged_component',
  'finishing_defect',
] as const;

const TAXONOMY: readonly string[] = [...OBJECT_CLASSES, ...DEFECT_CLASSES];

/** The shape a taxonomy class is drawn with, or `undefined` for a key outside it. */
export function taxonomyShape(classKey: string): RegionShape | undefined {
  if ((OBJECT_CLASSES as readonly string[]).includes(classKey)) {
    return RegionShape.BOX;
  }
  if ((DEFECT_CLASSES as readonly string[]).includes(classKey)) {
    return RegionShape.POLYGON;
  }
  return undefined;
}

/**
 * The classes a region of `shape` can be changed to. A class change is a
 * `replace` of the same shape kind, so a box never becomes a crack.
 */
export function classesForShape(shape: RegionShape): readonly string[] {
  return shape === RegionShape.POLYGON ? DEFECT_CLASSES : OBJECT_CLASSES;
}

const LABEL_OVERRIDES: Record<string, string> = {
  ppe_helmet: 'Helmet',
  ppe_vest: 'Safety vest',
};

/** `surface_defect` reads as "Surface defect". */
export function classLabel(classKey: string): string {
  const override = LABEL_OVERRIDES[classKey];
  if (override) return override;
  if (!classKey) return 'Unclassified';
  const words = classKey.replaceAll('_', ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Twenty colours, one per taxonomy class, picked to stay apart from each
 * other on a photo and to read on both light and dark labels.
 */
export const REGION_PALETTE = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#fabed4',
  '#469990',
  '#dcbeff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#a9a9a9',
] as const;

/**
 * The fixed colour for a class. A taxonomy class always gets the same
 * palette entry (its position in the taxonomy), so a helmet is the same
 * colour on every photo; a key outside the taxonomy is hashed onto the
 * palette.
 */
export function regionColour(classKey: string): string {
  const index = TAXONOMY.indexOf(classKey);
  if (index !== -1) return REGION_PALETTE[index % REGION_PALETTE.length];
  let hash = 0;
  for (const char of classKey) {
    hash = Math.trunc(hash * 31 + (char.codePointAt(0) ?? 0)) % 1_000_003;
  }
  return REGION_PALETTE[Math.abs(hash) % REGION_PALETTE.length];
}

/** Black or white, whichever reads on `hex`. */
export function labelTextColour(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#000000' : '#ffffff';
}
