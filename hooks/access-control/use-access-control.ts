import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessControlService } from '@/services/access-control-service';
import {
  normalizeActions,
  type AccessAction,
  type AccessGroupInput,
  type AccessModuleId,
  type AccessRole,
  type AccessRoleInput,
  type AccessUserAssignmentInput,
} from '@/types/access-control';
import { accessControlKeys } from './access-control-keys';

/** Fetches every role in the organization. */
export const useAccessRoles = () =>
  useQuery({
    queryKey: accessControlKeys.roles(),
    queryFn: () => accessControlService.getRoles(),
  });

/** Fetches every department and group in the organization. */
export const useAccessGroups = () =>
  useQuery({
    queryKey: accessControlKeys.groups(),
    queryFn: () => accessControlService.getGroups(),
  });

/** Fetches every user with their direct permissions. */
export const useAccessUsers = () =>
  useQuery({
    queryKey: accessControlKeys.users(),
    queryFn: () => accessControlService.getUsers(),
  });

/**
 * Membership is stored on one side and read from the other, so any write can
 * change what all three tabs show. Every mutation invalidates the whole
 * namespace rather than guessing which lists it touched.
 */
function useInvalidateAccessControl() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: accessControlKeys.all });
}

export const useCreateAccessRole = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: (input: AccessRoleInput) =>
      accessControlService.createRole(input),
    onSuccess: invalidate,
  });
};

export const useUpdateAccessRole = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccessRoleInput }) =>
      accessControlService.updateRole(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteAccessRole = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: (id: number) => accessControlService.deleteRole(id),
    onSuccess: invalidate,
  });
};

/**
 * Sets one cell of the roles matrix. Patches the roles cache first so the
 * switch settles at once, and rolls back if the write is refused.
 */
export const useSetRolePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      moduleId,
      actions,
    }: {
      roleId: number;
      moduleId: AccessModuleId;
      actions: AccessAction[];
    }) => accessControlService.setRolePermission(roleId, moduleId, actions),
    onMutate: async ({ roleId, moduleId, actions }) => {
      await queryClient.cancelQueries({ queryKey: accessControlKeys.roles() });
      const previous = queryClient.getQueryData<AccessRole[]>(
        accessControlKeys.roles()
      );
      queryClient.setQueryData<AccessRole[]>(
        accessControlKeys.roles(),
        (rows) =>
          rows?.map((r) =>
            r.id === roleId
              ? {
                  ...r,
                  permissions: {
                    ...r.permissions,
                    [moduleId]: normalizeActions(actions),
                  },
                }
              : r
          )
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(accessControlKeys.roles(), context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: accessControlKeys.all }),
  });
};

export const useCreateAccessGroup = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: (input: AccessGroupInput) =>
      accessControlService.createGroup(input),
    onSuccess: invalidate,
  });
};

export const useUpdateAccessGroup = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AccessGroupInput }) =>
      accessControlService.updateGroup(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteAccessGroup = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: (id: number) => accessControlService.deleteGroup(id),
    onSuccess: invalidate,
  });
};

export const useUpdateUserAccess = () => {
  const invalidate = useInvalidateAccessControl();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: number;
      input: AccessUserAssignmentInput;
    }) => accessControlService.updateUserAccess(userId, input),
    onSuccess: invalidate,
  });
};
