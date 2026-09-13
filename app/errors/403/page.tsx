import { ForbiddenView } from './forbidden-view';
import type { SearchParams } from './forbidden-actions';

/**
 * 403 Forbidden Error Page
 *
 * Displayed when the user is authenticated but doesn't have permission
 * This replaces the old /access-denied page
 */
export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  return <ForbiddenView params={params} />;
}
