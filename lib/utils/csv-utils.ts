/**
 * Client-side CSV export.
 *
 * Builds the file in the browser from data already in the query cache, so a
 * table can be exported without a reporting endpoint behind it.
 */

/** A CSV grid: the first row is conventionally the header. */
export type CsvRows = readonly (readonly string[])[];

/**
 * Quotes every cell unconditionally.
 *
 * Cheaper than deciding per cell whether a comma, quote or newline is present,
 * and spreadsheet software strips the quotes on the way back in either way.
 */
function toCsv(rows: CsvRows): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
    )
    .join('\n');
}

/**
 * Triggers a download of `rows` as a CSV file.
 *
 * Prefixed with a UTF-8 BOM so Excel reads accented names and the `£`/`€`
 * signs correctly instead of mojibake. Without it, Excel assumes the legacy
 * system codepage.
 *
 * @param filename - Name offered to the browser, including the `.csv` suffix.
 * @param rows - Grid to serialise, header row included.
 */
export function downloadCsv(filename: string, rows: CsvRows): void {
  const blob = new Blob(['﻿', toCsv(rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
