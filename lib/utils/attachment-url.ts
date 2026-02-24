/**
 * Validate that a URL string is safe for use as an attachment link.
 *
 * Accepts:
 *  - Absolute http/https URLs
 *  - Same-origin relative paths (starting with `/`, `./`, or `../`)
 *
 * Rejects empty strings and dangerous schemes (javascript:, data:, etc.).
 */
export function isValidAttachmentUrl(url: string): boolean {
  if (!url) return false;

  // Allow same-origin relative paths
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const scheme = parsedUrl.protocol.toLowerCase();
    return scheme === 'http:' || scheme === 'https:';
  } catch {
    return false;
  }
}

/**
 * Return a safe download href for an attachment.
 *
 * Returns the original URL/path when valid, or `'#'` as a safe fallback.
 */
export function getSafeDownloadUrl(attachment: {
  id?: number;
  file: string;
}): string {
  return isValidAttachmentUrl(attachment.file) ? attachment.file : '#';
}
