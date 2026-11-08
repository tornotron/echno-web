import { describe, expect, it } from 'bun:test';
import { ESLint } from 'eslint';

/**
 * The sign-in library is reached only through `lib/auth`. This lints a few lines as if they sat in
 * different files, with the repository's own configuration.
 */
const eslint = new ESLint({ cwd: process.cwd() });

async function boundaryErrors(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter(
    (message) => message.ruleId === 'no-restricted-imports'
  );
}

describe('sign-in boundary', () => {
  it('refuses the library in a component', async () => {
    const errors = await boundaryErrors(
      "import { useSession } from 'next-auth/react';\nexport const x = useSession;\n",
      'features/example/components/example.tsx'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('@/lib/auth/client');
  });

  it('refuses a WorkOS package outside lib/auth', async () => {
    const errors = await boundaryErrors(
      "import { withAuth } from '@workos-inc/authkit-nextjs';\nexport const x = withAuth;\n",
      'app/example/page.tsx'
    );
    expect(errors).toHaveLength(1);
  });

  it('allows the library inside lib/auth', async () => {
    const errors = await boundaryErrors(
      "import { useSession } from 'next-auth/react';\nexport const x = useSession;\n",
      'lib/auth/example.ts'
    );
    expect(errors).toHaveLength(0);
  });

  it('allows the module everywhere', async () => {
    const errors = await boundaryErrors(
      "import { useAuthSession } from '@/lib/auth/client';\nexport const x = useAuthSession;\n",
      'features/example/components/example.tsx'
    );
    expect(errors).toHaveLength(0);
  });
});
