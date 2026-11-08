'use client';

import { useIngestSettings } from '@tornotron/echno-core/document-ingestion/hooks';
import { AI_SERVICE } from '../lib/ai-service';

const FALLBACK =
  'When AI reading is on, the text of tender files uploaded here is sent to an outside AI service so it can be read into values for you to check. The service states that it does not keep the text or train on it.';

/**
 * Says in plain words that tender text leaves Echno to be read, which
 * service reads it, and that the service states it keeps none of it and
 * trains on none of it. Shown on the review screen and beside the admin
 * switch, with whether reading is on for the organization.
 */
export function AiReadingNotice() {
  const { data } = useIngestSettings();
  return (
    <div
      className="rounded-md border border-sky-300/60 bg-sky-50 p-3 text-sm dark:border-sky-500/20 dark:bg-sky-500/5"
      data-testid="ai-reading-notice"
    >
      <p>{data?.llmReadingDisclosure || FALLBACK}</p>
      <p className="mt-1">
        The outside service is {AI_SERVICE.name}. Its{' '}
        <a
          href={AI_SERVICE.privacyUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          data privacy page
        </a>{' '}
        says it does not store inputs or outputs and does not train on them.
      </p>
      {data && (
        <p className="mt-1 font-medium">
          {data.llmReadingEnabled
            ? 'AI reading is on for your organization.'
            : 'AI reading is off for your organization. Nothing is sent; work that needs it waits until it is turned on.'}
        </p>
      )}
    </div>
  );
}
