import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inspectionTemplateService } from '@/services/inspection-template-service';
import { toast } from '@/lib/styles/toast-styles';
import type {
  CreateInspectionTemplateRequest,
  UpdateInspectionTemplateRequest,
} from '@/types/inspection';
import { inspectionTemplateKeys } from './keys';

export function useInspectionTemplates() {
  return useQuery({
    queryKey: inspectionTemplateKeys.lists(),
    queryFn: () => inspectionTemplateService.getAll(),
  });
}

export function useInspectionTemplate(id: number | undefined) {
  return useQuery({
    queryKey: inspectionTemplateKeys.detail(id ?? 0),
    queryFn: () => inspectionTemplateService.getById(id as number),
    enabled: Boolean(id),
  });
}

export function useTemplateVersions(id: number | undefined) {
  return useQuery({
    queryKey: inspectionTemplateKeys.versions(id ?? 0),
    queryFn: () => inspectionTemplateService.getVersions(id as number),
    enabled: Boolean(id),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInspectionTemplateRequest) =>
      inspectionTemplateService.create(dto),
    onSuccess: (template) => {
      queryClient.setQueryData(
        inspectionTemplateKeys.detail(template.id),
        template
      );
      queryClient.invalidateQueries({
        queryKey: inspectionTemplateKeys.lists(),
      });
      toast.success('Checklist created');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: number;
      dto: UpdateInspectionTemplateRequest;
    }) => inspectionTemplateService.update(id, dto),
    onSuccess: (template, { dto }) => {
      queryClient.setQueryData(
        inspectionTemplateKeys.detail(template.id),
        template
      );
      queryClient.invalidateQueries({
        queryKey: inspectionTemplateKeys.lists(),
      });

      if (dto.publish) {
        // A publish adds an immutable snapshot, so the version list is stale.
        queryClient.invalidateQueries({
          queryKey: inspectionTemplateKeys.versions(template.id),
        });
        toast.success(`Published version ${template.currentVersion}`);
      } else {
        toast.success('Checklist saved');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inspectionTemplateService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inspectionTemplateKeys.lists(),
      });
      toast.success('Checklist deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Clones a template into a new checklist with regenerated element ids. */
export function useUseTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      inspectionTemplateService.use(id, name),
    onSuccess: (template) => {
      queryClient.setQueryData(
        inspectionTemplateKeys.detail(template.id),
        template
      );
      queryClient.invalidateQueries({
        queryKey: inspectionTemplateKeys.lists(),
      });
      toast.success(`Created "${template.name}" from template`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
