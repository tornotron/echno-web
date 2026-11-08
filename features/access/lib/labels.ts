/** What the screen calls each action and scope. */

const ACTION_LABELS: Record<string, string> = {
  read: 'Read',
  create: 'Create',
  edit: 'Edit',
  approve: 'Approve',
  delete: 'Delete',
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  read: 'See the module and read its records',
  create: 'Add new records',
  edit: 'Change existing records',
  approve: 'Approve or reject items waiting for sign-off',
  delete: 'Remove records',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Read", or a named action such as `certify` as "Certify". */
export const actionLabel = (action: string) =>
  ACTION_LABELS[action] ?? capitalize(action.replaceAll('-', ' '));

export const actionDescription = (action: string) =>
  ACTION_DESCRIPTIONS[action] ?? `${actionLabel(action)} records`;

const SCOPE_LABELS: Record<string, string> = {
  ALL: 'All',
  ASSIGNED_PROJECTS: 'Assigned projects',
  RELATED: 'Related',
  OWN: 'Own',
};

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  ALL: 'Every record in the organization',
  ASSIGNED_PROJECTS: 'Records of the projects they are assigned to',
  RELATED: 'Records linked to them',
  OWN: 'Only their own records',
};

export const scopeLabel = (scope: string) =>
  SCOPE_LABELS[scope] ?? capitalize(scope.toLowerCase().replaceAll('_', ' '));

export const scopeDescription = (scope: string) =>
  SCOPE_DESCRIPTIONS[scope] ?? scopeLabel(scope);

/** The common combinations, offered under the action checkboxes. */
export const PRESETS: { label: string; actions: string[] }[] = [
  { label: 'No Access', actions: [] },
  { label: 'Read', actions: ['read'] },
  { label: 'Read + Create', actions: ['read', 'create'] },
  { label: 'Read + Approve', actions: ['read', 'approve'] },
  { label: 'Edit', actions: ['read', 'create', 'edit'] },
  { label: 'Edit + Approve', actions: ['read', 'create', 'edit', 'approve'] },
  { label: 'Full', actions: ['read', 'create', 'edit', 'approve', 'delete'] },
];

const sameActions = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/** "Full", "Edit", "Read + Delete", "R · E · A": the actions part of a cell's text. */
export function actionsLabel(
  shown: readonly string[],
  actions: readonly string[]
): string {
  const preset = PRESETS.find((p) => sameActions(p.actions, actions));
  if (preset) return preset.label;
  if (actions.length > 0 && actions.length === shown.length) return 'Full';
  if (actions.length === 2)
    return actions.map((a) => actionLabel(a)).join(' + ');
  return actions.map((a) => actionLabel(a)[0]).join(' · ');
}

/** "Edit · Assigned projects", or "No Access". */
export function cellLabel(
  shown: readonly string[],
  actions: readonly string[],
  scope: string | undefined
): string {
  const text = actionsLabel(shown, actions);
  if (!scope || actions.length === 0) return text;
  return `${text} · ${scope === 'MIXED' ? 'Mixed' : scopeLabel(scope)}`;
}

/** "1 person", "3 people". */
export const peopleCount = (n: number) =>
  `${n} ${n === 1 ? 'person' : 'people'}`;
