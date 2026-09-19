import { describe, expect, test } from 'bun:test';
import {
  camelOf,
  featureKeyOf,
  nameOf,
  pascalOf,
  plan,
  registerMetadata,
  registerPermission,
} from './scaffold-feature';

describe('scaffold-feature naming', () => {
  test('derives every casing from the id', () => {
    expect(pascalOf('toolbox-talks')).toBe('ToolboxTalks');
    expect(camelOf('toolbox-talks')).toBe('toolboxTalks');
    expect(featureKeyOf('toolbox-talks')).toBe('MODULE_TOOLBOX_TALKS');
    expect(nameOf('toolbox-talks')).toBe('Toolbox Talks');
  });
});

describe('scaffold-feature plan', () => {
  test('refuses an id outside the manifest pattern', () => {
    expect(() => plan('Toolbox', 'x')).toThrow(/must match/);
  });

  test('refuses an id that already exists', () => {
    expect(() => plan('bim', 'BIM')).toThrow(/already exists/);
  });

  test('renders every surface with no placeholder left behind', () => {
    const p = plan('ci-probe-plan', 'Probe', true);
    const paths = p.files.map((f) => f.path);
    expect(paths).toContain('features/ci-probe-plan/module.config.ts');
    expect(paths).toContain('features/ci-probe-plan/components/CiProbePlanList.tsx');
    expect(paths).toContain('app/users/dashboard/ci-probe-plan/layout.tsx');
    expect(paths).toContain('nav/metadata/ci-probe-plan.meta.ts');
    expect(paths).toContain('scripts/scaffold/.stub/ci-probe-plan/hooks.ts');
    for (const f of p.files) expect(f.content, f.path).not.toMatch(/__[A-Z_]+__/);
    expect(p.metadataIndex).toInclude("import { ciProbePlanMetadata } from './ci-probe-plan.meta';");
    expect(p.metadataIndex).toInclude('  ciProbePlanMetadata,\n});');
    expect(p.roles).toInclude("  | 'ci-probe-plan:read';");
    expect(p.roles.match(/'ci-probe-plan:read'/g)).toHaveLength(4);
  });

  test('a second permission lands after the first, on every role', () => {
    const once = plan('ci-probe-plan', 'Probe').roles;
    const twice = registerPermission(once, 'other-mod');
    expect(twice).toInclude("  | 'ci-probe-plan:read'\n  | 'other-mod:read';");
    expect(twice.match(/'other-mod:read'/g)).toHaveLength(4);
  });

  test('registration fails loudly when the index loses its anchors', () => {
    expect(() => registerMetadata('export const nothing = 1;', 'x')).toThrow(/anchor shape/);
    expect(() => registerPermission('export const nothing = 1;', 'x')).toThrow(/anchor shape/);
  });
});
