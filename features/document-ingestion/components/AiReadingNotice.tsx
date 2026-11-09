'use client';

import { useIngestSettings } from '@tornotron/echno-core/document-ingestion/hooks';

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
  const service = data?.aiProvider || undefined;
  const privacyUrl = data?.aiProviderPrivacyUrl || undefined;
  return (
    <div
      className="rounded-md border border-sky-300/60 bg-sky-50 p-3 text-sm dark:border-sky-500/20 dark:bg-sky-500/5"
      data-testid="ai-reading-notice"
    >
      <p>{data?.llmReadingDisclosure || FALLBACK}</p>
      <p className="mt-1">
        The outside service is{' '}
        {service
          ? `${service}${data?.aiModel ? ` (model ${data.aiModel})` : ''}`
          : 'the configured AI service'}
        .
        {privacyUrl && (
          <>
            {' '}
            Its{' '}
            <a
              href={privacyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              data privacy page
            </a>{' '}
            has what it states about storing and training on the text.
          </>
        )}
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
