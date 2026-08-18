import { describe, expect, test } from 'bun:test';
import { getSafeDownloadUrl, isValidAttachmentUrl } from './attachment-url';

describe('isValidAttachmentUrl', () => {
  test('accepts absolute http and https URLs', () => {
    expect(isValidAttachmentUrl('http://example.com/file.pdf')).toBe(true);
    expect(isValidAttachmentUrl('https://cdn.echno.xyz/a/b.png')).toBe(true);
  });

  test('accepts same-origin relative paths', () => {
    expect(isValidAttachmentUrl('/uploads/a.pdf')).toBe(true);
    expect(isValidAttachmentUrl('./a.pdf')).toBe(true);
    expect(isValidAttachmentUrl('../a.pdf')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(isValidAttachmentUrl('')).toBe(false);
  });

  test('rejects dangerous schemes (SECURITY)', () => {
    expect(isValidAttachmentUrl('javascript:alert(1)')).toBe(false);
    expect(isValidAttachmentUrl('data:text/html,<script>1</script>')).toBe(
      false
    );
    expect(isValidAttachmentUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isValidAttachmentUrl('ftp://example.com/x')).toBe(false);
  });

  test('rejects a malformed URL with no scheme and no relative prefix', () => {
    // Not a valid absolute URL and does not start with / ./ ..
    expect(isValidAttachmentUrl('not a url')).toBe(false);
    expect(isValidAttachmentUrl('example.com/file')).toBe(false);
  });
});

describe('getSafeDownloadUrl', () => {
  test('returns the file when valid', () => {
    expect(getSafeDownloadUrl({ file: '/uploads/a.pdf' })).toBe('/uploads/a.pdf');
    expect(getSafeDownloadUrl({ id: 3, file: 'https://x.com/a' })).toBe(
      'https://x.com/a'
    );
  });

  test('returns the # fallback when invalid', () => {
    expect(getSafeDownloadUrl({ file: 'javascript:alert(1)' })).toBe('#');
    expect(getSafeDownloadUrl({ file: '' })).toBe('#');
  });
});
