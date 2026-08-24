/**
 * Browser file-download helpers.
 *
 * Used for CSV / binary exports that arrive as a {@link Blob} from the API
 * (chart-of-accounts export, journal export). The browser has no direct
 * "save this Blob" call, so we wrap it in a short-lived object URL, click a
 * temporary anchor, then revoke the URL to release the memory.
 */

/**
 * Triggers a browser download of the given blob under `filename`.
 *
 * Safe to call only in the browser (relies on `document` and
 * `URL.createObjectURL`); guarded so it is a no-op during SSR.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
