# 🚀 Project Directory & Code Structure Guidelines (Root Level)

This document outlines the standard folder structure and code organization principles for this Next.js project. All developers and AI assistants (like GitHub Copilot) MUST adhere to these guidelines to ensure maintainability, scalability, and a clean separation of concerns.

## 1. Core Philosophy: Feature-Based Structure

We do **not** group files by _type_ (e.g., all components in one folder). We group files by **feature** or **domain**.

- **Example:** All code related to user authentication (components, hooks, actions) lives in `features/auth`.
- **Benefits:** This is highly scalable. When you work on the "settings" feature, all the files you need are in `features/settings`.

---

## 2. Directory Structure Explained

```

my-next-project/
├── /app                \<-- (1) ROUTING
│   ├── /(auth)
│   │   └── /login/page.tsx
│   └── /(dashboard)
│       └── /settings/page.tsx
│
├── /components         \<-- (2) SHARED UI
│   ├── /ui             \<-- (DO NOT TOUCH) shadcn/ui primitives.
│   ├── /layout         \<-- Global layout components (SiteHeader, Sidebar).
│   └── /shared         \<-- Other shared, simple components (Logo, ThemeToggle).
│
├── /features           \<-- (3) CORE BUSINESS LOGIC
│   ├── /auth           \<-- Feature "auth"
│   │   ├── /components     \<- Components used ONLY by "auth"
│   │   │   └── login-form.tsx
│   │   └── /actions        \<- Server actions for "auth"
│   │       └── login.ts
│   │
│   └── /settings       \<-- Feature "settings"
│       ├── /components
│       │   └── appearance-form.tsx
│       └── /hooks
│           └── use-appearance.ts
│
├── /lib                \<-- (4) UTILITIES
│   ├── utils.ts        (cn() function)
│   ├── db.ts           (Database connection)
│   └── ...
│
├── /types              \<-- (5) GLOBAL TYPESCRIPT
│   └── index.ts
│
├── components.json     \<-- shadcn/ui config file
├── next.config.mjs
└── tsconfig.json

```

---

## 3. The Rules of Dependency

This is the most important part. To keep the project clean, we follow a strict **one-way dependency flow**.

---

1.  **`app` (Routes)**

    - **PURPOSE:** Routing and data fetching only.
    - **RULE:** `page.tsx` files should be "thin." They should import components directly from `features/*` and `components/layout/*`.
    - **Example:** `app/settings/page.tsx` imports `<AppearanceForm />` from `features/settings/components/appearance-form.tsx`.

2.  **`features` (Business Logic)**

    - **PURPOSE:** The "brain" of your application.
    - **RULE:** A feature can import from `components/ui`, `components/shared`, `lib`, and `types`.
    - **CRITICAL: A feature MUST NOT import from another feature folder.** (e.g., `features/auth` CANNOT import from `features/settings`).
    - **If you need to share logic between features,** elevate it to a shared hook in `hooks` or a utility in `lib`.

3.  **`components` (Shared UI)**

    - **PURPOSE:** Global, reusable UI components that have NO business logic.
    - `components/ui` is for `shadcn/ui` primitives. **Do not manually edit** this folder; use the CLI.
    - `components/layout` & `components/shared` are for your own global components (e.g., `SiteHeader`).
    - **CRITICAL: `components` MUST NOT import from `features/*`.** This is a "dumb" layer and must stay that way.

4.  **`lib` (Utilities)**
    - **PURPOSE:** Pure, reusable functions, helpers, and SDK initializations.
    - **RULE:** `lib` CANNOT import from `app`, `features`, or `components`. It is the lowest-level layer.

---

## 4. Workflow: Adding a New Feature (e.g., "Analytics")

1.  **Create the Route:** Add a new page at `app/(dashboard)/analytics/page.tsx`.
2.  **Create the Feature Folder:** Create a new folder at `features/analytics`.
3.  **Add `shadcn/ui` Primitives:** Run `npx shadcn-ui@latest add card chart`. They land in `components/ui`.
4.  **Build Feature Components:** Create your components inside `features/analytics/components/`.
    - e.g., `features/analytics/components/sales-chart.tsx`.
    - This component will `import { Card } from '@/components/ui/card'` and `import { Chart } from '@/components/ui/chart'`.
5.  **Connect Route to Feature:** In `app/(dashboard)/analytics/page.tsx`, import your new feature component:

    ```tsx
    // app/(dashboard)/analytics/page.tsx
    import { SalesChart } from "@/features/analytics/components/sales-chart";

    export default function AnalyticsPage() {
      return (
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <SalesChart />
        </div>
      );
    }
    ```

---
