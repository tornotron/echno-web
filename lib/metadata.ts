import type { Metadata } from 'next';

const APP_NAME = 'Echno Console';
const APP_DESCRIPTION =
  'Construction project management platform by Tornotron E-Commerce Private Limited';
const FALLBACK_URL = 'https://console.echno.in';
function safeAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return FALLBACK_URL;
  try {
    new URL(raw);
    return raw.replace(/\/$/, '');
  } catch {
    return FALLBACK_URL;
  }
}
const APP_URL = safeAppUrl();
const OG_IMAGE = `${APP_URL}/og-image.png`;

/**
 * Site-wide metadata defaults.
 * Used as the base in createMetadata and exported directly for the root layout.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: false, // dashboard app — keep out of search engines
    follow: false,
  },
};

export interface PageMetadataOptions {
  title: string;
  description?: string;
  /** Override OG/Twitter image for this page */
  image?: string;
  /** Allow search engine indexing for this specific page (e.g. login) */
  index?: boolean;
}

/**
 * createMetadata
 *
 * Merges page-level overrides with site-wide defaults.
 * Use this in every page.tsx or layout.tsx instead of constructing
 * a Metadata object from scratch.
 *
 * @example
 * // Static page
 * export const metadata = createMetadata({
 *   title: 'Site Transfers',
 *   description: 'Manage material transfers between sites and projects',
 * });
 *
 * @example
 * // Dynamic page
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const transfer = await fetchTransfer(params.id);
 *   return createMetadata({
 *     title: transfer.transferNumber,
 *     description: `Transfer from ${transfer.sendingProjectName}`,
 *   });
 * }
 */
export function createMetadata({
  title,
  description,
  image,
  index = false,
}: PageMetadataOptions): Metadata {
  const ogImage = image ?? OG_IMAGE;
  const desc = description ?? APP_DESCRIPTION;

  return {
    ...defaultMetadata,
    title,
    description: desc,
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description: desc,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description: desc,
      images: [ogImage],
    },
    robots: { index, follow: index },
  };
}
