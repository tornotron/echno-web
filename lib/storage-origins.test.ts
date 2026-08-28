import { afterEach, describe, expect, test } from 'bun:test';

import { storageOrigins, storageRemotePatterns } from './storage-origins';

const original = process.env.NEXT_PUBLIC_STORAGE_ORIGIN;

function setOrigin(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_STORAGE_ORIGIN;
    return;
  }
  process.env.NEXT_PUBLIC_STORAGE_ORIGIN = value;
}

afterEach(() => setOrigin(original));

describe('storageOrigins', () => {
  test('reads one origin', () => {
    setOrigin('https://storage.echno.in');
    expect(storageOrigins()).toEqual(['https://storage.echno.in']);
  });

  test('reads a comma-separated list, trimming what the operator typed', () => {
    setOrigin(' https://storage.echno.in , https://bucket.example.com ');
    expect(storageOrigins()).toEqual([
      'https://storage.echno.in',
      'https://bucket.example.com',
    ]);
  });

  test('is empty when unset, and when set to nothing but separators', () => {
    setOrigin(undefined);
    expect(storageOrigins()).toEqual([]);
    setOrigin(' , , ');
    expect(storageOrigins()).toEqual([]);
  });
});

describe('storageRemotePatterns', () => {
  test('describes the configured origins for next/image', () => {
    setOrigin('https://storage.echno.in');
    expect(storageRemotePatterns()).toEqual([
      {
        protocol: 'https',
        hostname: 'storage.echno.in',
        port: '',
        pathname: '/**',
      },
    ]);
  });

  test('keeps an explicit port, which a self-hosted MinIO often carries', () => {
    setOrigin('http://minio.internal:9000');
    expect(storageRemotePatterns()).toEqual([
      {
        protocol: 'http',
        hostname: 'minio.internal',
        port: '9000',
        pathname: '/**',
      },
    ]);
  });

  test('drops what it cannot parse rather than failing the boot', () => {
    // One typo in the list should cost that one origin, not the application.
    setOrigin('not a url,https://storage.echno.in,ftp://files.example.com');
    expect(storageRemotePatterns().map((p) => p.hostname)).toEqual([
      'storage.echno.in',
    ]);
  });

  test('matches the origins the CSP is built from, one for one', () => {
    // The regression: img-src and remotePatterns named a retired bucket while
    // connect-src followed the environment, so an upload succeeded and the
    // file could never be shown.
    setOrigin('https://storage.echno.in,https://bucket.example.com');
    expect(storageRemotePatterns().map((p) => `https://${p.hostname}`)).toEqual(
      storageOrigins()
    );
  });
});
