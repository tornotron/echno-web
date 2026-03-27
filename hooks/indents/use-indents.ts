/**
 * hooks/indents/use-indents.ts
 *
 * React Query hooks for fetching indents (requisitions) and indent items.
 */

import { useQuery } from '@tanstack/react-query';
import { indentsService } from '@/services/indents-service';
import { indentsKeys } from './indent-keys';

export const useIndents = () =>
  useQuery({
    queryKey: indentsKeys.lists(),
    queryFn: () => indentsService.getAll(),
  });

export const useIndentsPaginated = (pageNo = 0, pageSize = 10) =>
  useQuery({
    queryKey: indentsKeys.paginated(pageNo, pageSize),
    queryFn: () => indentsService.getAllPaginated(pageNo, pageSize),
  });

export const useIndent = (id: number) =>
  useQuery({
    queryKey: indentsKeys.detail(id),
    queryFn: () => indentsService.getById(id),
    enabled: !!id,
  });
export { indentsKeys } from './indent-keys';
