/**
 * The photo path is presign, PUT, register, on the module's own endpoints:
 * one slot per file, only the keys whose PUT succeeded are registered, and
 * a file that fails is named rather than dropped silently.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';

const presignPhotos = mock(
  async (_id: string, requests: { filename: string }[]) =>
    requests.map((request, index) => ({
      key: `k${index}`,
      url: `https://store/${request.filename}`,
      contentType: 'image/png',
      expiresInSeconds: 900,
    }))
);
const registerPhotos = mock(async (_id: string, requests: unknown[]) =>
  requests.map((_request, index) => ({ id: index + 1 }))
);
const putToStorage = mock(async (url: string) => {
  if (url.endsWith('bad.png')) throw new Error('storage refused');
});

mock.module('@tornotron/echno-core/toolbox-talks/services', () => ({
  toolboxTalksService: { presignPhotos, registerPhotos },
}));
mock.module('@tornotron/echno-core/attachment/services', () => ({
  attachmentService: { putToStorage },
}));

const { uploadTalkPhotos } = await import('./talk-photos');

afterEach(() => {
  presignPhotos.mockClear();
  registerPhotos.mockClear();
  putToStorage.mockClear();
});

describe('uploadTalkPhotos', () => {
  test('presigns on the talk, puts each file, registers the successes', async () => {
    const good = new File(['a'], 'good.png', { type: 'image/png' });
    const bad = new File(['b'], 'bad.png', { type: 'image/png' });
    const result = await uploadTalkPhotos('t-1', [good, bad]);

    expect(presignPhotos).toHaveBeenCalledWith('t-1', [
      { filename: 'good.png', contentType: 'image/png', fileSize: 1 },
      { filename: 'bad.png', contentType: 'image/png', fileSize: 1 },
    ]);
    expect(putToStorage).toHaveBeenCalledTimes(2);
    expect(registerPhotos).toHaveBeenCalledWith('t-1', [
      {
        key: 'k0',
        filename: 'good.png',
        contentType: 'image/png',
        fileSize: 1,
      },
    ]);
    expect(result.attachments).toHaveLength(1);
    expect(result.errors).toEqual([
      { filename: 'bad.png', message: 'storage refused' },
    ]);
  });

  test('nothing to upload touches no endpoint', async () => {
    const result = await uploadTalkPhotos('t-1', []);
    expect(presignPhotos).not.toHaveBeenCalled();
    expect(result).toEqual({ attachments: [], errors: [] });
  });

  test('a caller can register through its own path, for the cache', async () => {
    const register = mock(async () => [{ id: 9 }]);
    const file = new File(['a'], 'good.png', { type: 'image/png' });
    await uploadTalkPhotos('t-1', [file], register as never);
    expect(register).toHaveBeenCalledTimes(1);
    expect(registerPhotos).not.toHaveBeenCalled();
  });
});
