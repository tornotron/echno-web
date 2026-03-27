import { useQuery } from '@tanstack/react-query';
import { indentItemsService } from '@/services/indent-items-service';
import { indentItemKeys } from './indent-item-keys';

export const useIndentItems = () =>
  useQuery({
    queryKey: indentItemKeys.lists(),
    queryFn: () => indentItemsService.getAll(),
  });

export const useIndentItem = (id: number) =>
  useQuery({
    queryKey: indentItemKeys.detail(id),
    queryFn: () => indentItemsService.getById(id),
    enabled: !!id,
  });

export const useIndentItemsByIndent = (indentId: number) =>
  useQuery({
    queryKey: indentItemKeys.byIndent(indentId),
    queryFn: () => indentItemsService.getByIndent(indentId),
    enabled: !!indentId,
  });
