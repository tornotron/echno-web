/**
 * The core subpaths the feature imports, replaced for the component tests.
 * Bun's `mock.module` is process wide, so one shape serves every test file:
 * the query hooks read the exported state objects, the mutation hooks share
 * one `mutate` each, and a test sets the state and clears the mocks it
 * asserts on. The subpaths that exist in the installed core are spread so
 * the rest of the app keeps its real exports.
 */
import { mock } from 'bun:test';
import { createElement } from 'react';
import * as realEmployeeHooks from '@tornotron/echno-core/employee/hooks';
import * as realProjectHooks from '@tornotron/echno-core/project/hooks';

export const ToolboxTalkStatus = {
  DRAFT: 'DRAFT',
  RECORDED: 'RECORDED',
} as const;
export const EmployeeStatus = {
  active: 'active',
  inactive: 'inactive',
} as const;
export const AttachmentType = { image: 'image', document: 'document' } as const;
export const SpatialLevel = {
  BUILDING: 'BUILDING',
  FLOOR: 'FLOOR',
  ZONE: 'ZONE',
  ELEMENT: 'ELEMENT',
} as const;

export function mutation() {
  const mutate = mock((..._args: unknown[]) => {});
  const mutateAsync = mock(async (..._args: unknown[]) => {});
  const hook = () => ({
    mutate,
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  });
  return { mutate, mutateAsync, hook };
}

export const settled = <T>(data: T) => ({
  data,
  isPending: false,
  isLoading: false,
  isError: false,
  error: null,
});

export const loading = {
  data: undefined,
  isPending: true,
  isLoading: true,
  isError: false,
  error: null,
};

export const projects = [
  { id: 7, projectName: 'Tower A' },
  { id: 8, projectName: 'Tower B' },
];

export const employees = [
  { id: 12, name: 'Ravi Kumar', designation: 'Supervisor', status: 'active' },
  { id: 21, name: 'Anil Das', designation: 'Mason', status: 'active' },
  { id: 22, name: 'Gone Person', designation: 'Mason', status: 'inactive' },
];

/** What the toolbox-talks query hooks return; a test assigns before rendering. */
export const state: {
  list: Record<string, unknown>;
  talk: Record<string, unknown>;
  photos: Record<string, unknown>;
} = { list: loading, talk: loading, photos: settled([]) };

export const useToolboxTalks = mock((_params: unknown) => state.list);
export const create = mutation();
export const update = mutation();
export const record = mutation();
export const addAttendees = mutation();
export const removeAttendee = mutation();
export const registerPhotos = mutation();
export const downloadPdf = mock(async (_id: string) => new Blob(['%PDF']));

export function resetCoreMocks() {
  state.list = loading;
  state.talk = loading;
  state.photos = settled([]);
  useToolboxTalks.mockClear();
  for (const m of [
    create,
    update,
    record,
    addAttendees,
    removeAttendee,
    registerPhotos,
  ]) {
    m.mutate.mockClear();
    m.mutateAsync.mockClear();
  }
  downloadPdf.mockClear();
}

export function installCoreMocks() {
  mock.module('@tornotron/echno-core/toolbox-talks/types', () => ({
    ToolboxTalkStatus,
  }));
  mock.module('@tornotron/echno-core/toolbox-talks/hooks', () => ({
    useToolboxTalks,
    useToolboxTalk: () => state.talk,
    useToolboxTalkPhotos: () => state.photos,
    useCreateToolboxTalk: create.hook,
    useUpdateToolboxTalk: update.hook,
    useAddToolboxTalkAttendees: addAttendees.hook,
    useRemoveToolboxTalkAttendee: removeAttendee.hook,
    useRecordToolboxTalk: record.hook,
    useRegisterToolboxTalkPhotos: registerPhotos.hook,
  }));
  mock.module('@tornotron/echno-core/toolbox-talks/services', () => ({
    toolboxTalksService: { downloadPdf },
  }));
  mock.module('@tornotron/echno-core/employee/types', () => ({
    EmployeeStatus,
  }));
  mock.module('@tornotron/echno-core/attachment/types', () => ({
    AttachmentType,
  }));
  mock.module('@tornotron/echno-core/spatial/types', () => ({
    SpatialLevel,
    spatialLevelLabels: {
      BUILDING: 'Building',
      FLOOR: 'Floor',
      ZONE: 'Zone',
      ELEMENT: 'Element',
    },
  }));
  mock.module('@tornotron/echno-core/project/hooks', () => ({
    ...realProjectHooks,
    useProjects: () => settled(projects),
  }));
  mock.module('@tornotron/echno-core/employee/hooks', () => ({
    ...realEmployeeHooks,
    useEmployeeLookup: () => settled(employees),
  }));
  mock.module('@tornotron/echno-core/spatial/hooks', () => ({
    useSpatialTree: () => settled([]),
    useSpatialNode: () => settled(undefined),
  }));
  mock.module('next/link', () => ({
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => createElement('a', { href }, children),
  }));
}
