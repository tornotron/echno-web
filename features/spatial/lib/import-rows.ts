// features/spatial/lib/import-rows.ts
//
// Turns pasted spreadsheet text into the rows `POST /project/{id}/spatial/import`
// takes. The backend takes JSON rows; the CSV to row conversion lives here, on
// the client, as the design note puts it.

import type { SpatialImportRow } from '@tornotron/echno-core/spatial/types';

const COLUMNS = [
  'building',
  'floor',
  'zone',
  'element',
  'levelIndex',
  'elementType',
] as const;

type Column = (typeof COLUMNS)[number];

const HEADER_ALIASES: Record<string, Column> = {
  building: 'building',
  block: 'building',
  floor: 'floor',
  level: 'floor',
  zone: 'zone',
  element: 'element',
  levelindex: 'levelIndex',
  level_index: 'levelIndex',
  'level index': 'levelIndex',
  elementtype: 'elementType',
  element_type: 'elementType',
  'element type': 'elementType',
  type: 'elementType',
};

export interface ImportParseResult {
  rows: SpatialImportRow[];
  /** One message per line that could not be read, with its 1-based line number. */
  errors: string[];
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter !== ',') return line.split(delimiter).map((c) => c.trim());
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';') && !line.includes(',')) return ';';
  return ',';
}

/**
 * Parses pasted CSV or TSV text into import rows.
 *
 * The first line is treated as a header when it names at least a building
 * column; otherwise columns are read positionally as
 * `building, floor, zone, element, levelIndex, elementType`. Blank lines are
 * skipped. A row with no building is an error, and so is a non-integer level
 * index.
 */
export function parseSpatialImportText(text: string): ImportParseResult {
  const lines = text.split(/\r?\n/);
  const rows: SpatialImportRow[] = [];
  const errors: string[] = [];
  let order: Column[] = [...COLUMNS];
  let started = false;

  for (const [index, raw] of lines.entries()) {
    if (!raw || !raw.trim()) continue;
    const delimiter = detectDelimiter(raw);
    const cells = splitLine(raw, delimiter);

    if (!started) {
      started = true;
      const mapped = cells.map((c) => HEADER_ALIASES[c.toLowerCase().trim()]);
      if (mapped.includes('building')) {
        order = mapped.map((c) => c ?? ('' as Column));
        continue;
      }
    }

    const row: SpatialImportRow = { building: '' };
    let bad: string | undefined;
    for (const [position, column] of order.entries()) {
      const value = cells[position];
      if (!column || value === undefined || value === '') continue;
      if (column === 'levelIndex') {
        const n = Number(value);
        if (!Number.isInteger(n)) {
          bad = `line ${index + 1}: level index "${value}" is not a whole number`;
          continue;
        }
        row.levelIndex = n;
      } else {
        row[column] = value;
      }
    }
    if (bad) {
      errors.push(bad);
      continue;
    }
    if (!row.building) {
      errors.push(`line ${index + 1}: no building code`);
      continue;
    }
    rows.push(row);
  }

  return { rows, errors };
}
