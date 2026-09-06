# Project structure and dependency rules

How this Next.js app is organised, and the import rules that go with it. These
apply to everyone working in the repo, human or assistant. `eslint.config.mjs`
enforces them through `boundaries/element-types`, so a violation fails the
`Lint` step of the pull request workflow rather than waiting for review to
catch it.

## 1. Files are grouped by feature, not by type

Everything belonging to one domain lives together. All of the authentication
code (components, hooks, actions) is in `features/auth`, so working on a
feature means working in one folder.

## 2. Directory structure

```
├── app/                  Routing. Thin pages that compose feature components.
│
├── components/
│   ├── shadcn/           The UI layer everything else imports.
│   ├── ui/               Base primitives, written by the shadcn CLI.
│   ├── kibo-ui/          Vendored registry (kibo-ui).
│   ├── reui/             Vendored registry (reui).
│   ├── providers/        Root context providers, mounted from app/layout.tsx.
│   ├── shared/           Global components (EmployeeAvatar, AccountCombobox).
│   ├── common/           Global building blocks used across features.
│   └── errors/           Error boundary and recovery components.
│
├── features/             Business logic, one folder per domain.
│   └── auth/
│       ├── components/   Used only by "auth".
│       ├── hooks/
│       └── actions/
│
├── hooks/                Shared hooks.
├── lib/                  Pure helpers, API client, RBAC, utils.
├── services/             API service layer.
├── types/                Shared TypeScript types.
│
├── components.json       shadcn CLI config. Its `ui` alias points at
│                         components/ui, which is correct: the CLI writes
│                         base primitives, and our variants go elsewhere.
└── eslint.config.mjs
```

## 3. The two primitive folders

This is the part that has caused trouble, so it is worth stating plainly.

`components/ui` holds the primitives as the shadcn CLI generates them. Treat
that folder as vendored: run the CLI to add or update a component, and do not
hand-edit it.

`components/shadcn` is our layer on top. Most of its files are one-line
pass-throughs (`export * from '@/components/ui/x'`). The rest wrap the base
component to add variants this product needs: the `gradient`, `glass` and
`social` button variants, the dialog `size`, `animation` and `overlayBlur`
props, the card and badge and empty variants, the keydown guard on numeric
inputs.

**Application code imports `@/components/shadcn/*` and never
`@/components/ui/*`.** Only `components/shadcn` and the two vendored
registries may reach the base layer. Going straight to `components/ui` skips
our variants, and it is how the app ended up rendering two different Buttons
depending on which folder a screen's author picked (#394).

```tsx
// Right
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';

// Wrong, and the lint step will say so
import { Button } from '@/components/ui/button';
```

Adding a primitive the app does not have yet:

1. `bunx shadcn@latest add <name>`, which writes `components/ui/<name>.tsx`.
2. Add `components/shadcn/<name>.tsx`. If no extra variants are needed it is
   two lines: `'use client';` and `export * from '@/components/ui/<name>';`.
3. Import the `components/shadcn` path from your feature.

## 4. Dependency rules

The flow is one-way. Reading down the list, each layer may import from the
ones below it and not the other way round.

1. **`app`** routes. Pages stay thin and compose from `features`,
   `components/shared` and `components/shadcn`.
2. **`components/providers`**. The composition root, mounted in
   `app/layout.tsx`. Unlike the other component folders it may import from
   `features`, because that is where the hooks it wires up live.
3. **`features`**. May import `components/shadcn`, `components/shared`,
   `components/providers`, `hooks`, `lib` and `types`. **A feature must not
   import another feature.** Shared logic moves up to `hooks` or `lib`.
4. **`components/shared`, `components/common`, `components/errors`**. Global
   UI with no business logic. **These must not import from `features`.**
5. **`components/shadcn`**. The only place allowed to import
   `components/ui`.
6. **`components/ui`** and the vendored registries. The bottom of the UI
   stack. They import `lib` and `types` and nothing above.
7. **`lib`** and **`types`**. Lowest level. `lib` cannot import from `app`,
   `features` or `components`.

## 5. Adding a feature

1. Create the route: `app/(dashboard)/analytics/page.tsx`.
2. Create `features/analytics/`.
3. Add any missing primitives with the CLI, then the matching
   `components/shadcn` file (section 3).
4. Build the components under `features/analytics/components/`, importing
   from `@/components/shadcn/*`.
5. Compose them in the page:

   ```tsx
   // app/(dashboard)/analytics/page.tsx
   import { SalesChart } from '@/features/analytics/components/sales-chart';

   export default function AnalyticsPage() {
     return (
       <div>
         <h1 className="text-2xl font-bold">Analytics</h1>
         <SalesChart />
       </div>
     );
   }
   ```
