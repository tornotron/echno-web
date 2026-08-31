'use client';

import { useMaterialsPage } from '@tornotron/echno-core/materials/hooks';

/**
 * Rows to ask for when all that is wanted is the count.
 *
 * One. `totalElements` is the size of the whole catalogue whatever page
 * size was requested, so fetching rows to count them would be fetching
 * them twice: the screens that call this already hold a material list.
 */
const COUNT_ONLY_PAGE_SIZE = 1;

/** What the catalogue size says about a material list already on hand. */
export interface MaterialCatalogueSize {
  /**
   * How many materials the organization has. `undefined` until the server
   * has answered, and never inferred from a list: a number made up from a
   * page is the defect this replaces.
   */
  total?: number;
  /**
   * Whether the list passed in is the whole catalogue. False while the
   * total is unknown, which is deliberate: a figure summed over the list
   * is a total only if the list is complete, and "probably complete" is
   * not a basis for printing a money figure.
   */
  holdsWholeCatalogue: boolean;
  isLoading: boolean;
  isError: boolean;
}

/**
 * The catalogue size, read from the server, and what it says about a
 * material list the caller already has.
 *
 * `GET /materials/web` serves at most 500 rows and reports the cut in an
 * `X-Result-Capped` response header. The console's API proxy rebuilds
 * every response and forwards `Content-Type` alone, so that header does
 * not reach the browser; the count on `GET /materials/web/all`'s page
 * envelope carries the same fact in the body, and carries the size itself
 * as well.
 *
 * Two questions come off that one number. How many materials are there,
 * which a "Total Materials" tile must not answer with an array length.
 * And is the list on hand all of them, which everything derived from that
 * list quietly depends on before it may be called a total.
 *
 * @param loadedCount - How many materials the caller is holding.
 */
export function useMaterialCatalogueSize(
  loadedCount: number
): MaterialCatalogueSize {
  const query = useMaterialsPage({ pageSize: COUNT_ONLY_PAGE_SIZE });
  const total = query.data?.totalElements;

  return {
    total,
    holdsWholeCatalogue: total !== undefined && loadedCount >= total,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
