import { useQuery } from '@tanstack/react-query';
import { organizationService } from '@/services/organization-service';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
  });
}

export function useOrganization(id: number) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  });
}
