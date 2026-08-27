import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";


import boundariesPlugin from "eslint-plugin-boundaries";

import perfectionistPlugin from "eslint-plugin-perfectionist";
import unicornPlugin from "eslint-plugin-unicorn";

const customRulesConfig = {
  // Apply these rules to all TypeScript/JavaScript files
  files: ["**/*.{js,jsx,ts,tsx}"],

  plugins: {
    boundaries: boundariesPlugin,
  },

  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    "boundaries/include": ["**/*"],
    "boundaries/elements": [
      {
        type: "app",
        pattern: "app/*",
      },
      {
        type: "features",
        pattern: "features/*",
        capture: ["featureName"],
      },
      {
        type: "shadcn",   // extension layer — custom CVA variants, consumed by app/features
        pattern: "components/shadcn/*",
      },
      {
        type: "ui",       // base layer — shadcn CLI target, never imported directly by app/features
        pattern: "components/ui/*",
      },
      {
        type: "layout",
        pattern: "components/layout/*",
      },
      {
        type: "shared",
        pattern: "components/shared/*",
      },
      {
        type: "lib",
        pattern: "lib/*",
      },
      {
        type: "types",
        pattern: "types/*",
      },
    ],
  },

  rules: {
    // A leading underscore is how this codebase marks a binding that exists to
    // satisfy a signature and is deliberately not read: the `(..._args)` spies in
    // the service tests, discarded destructured fields, ignored catch bindings.
    // Without these patterns the rule cannot tell that apart from an oversight.
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],

    // Enforce One-Way Dependency Structure using eslint-plugin-boundaries
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: "app",
            allow: ["features", "layout", "shared", "shadcn", "lib", "types"],
          },
          {
            from: "features",
            allow: ["shadcn", "shared", "lib", "types"],
          },
          {
            from: "features",
            allow: [
              ["features", { featureName: "${from.featureName}" }],
              "shadcn",
              "shared",
              "lib",
              "types",
            ],
          },
          {
            from: ["shadcn", "layout", "shared"],
            allow: ["shadcn", "ui", "layout", "shared", "lib", "types"],
          },
          {
            from: "ui",
            allow: ["lib", "types"],
          },
          {
            from: "lib",
            allow: ["types", "lib"],
          },
          {
            from: "types",
            allow: ["types"],
          },
        ],
      },
    ],
  },
};

// PERFECTIONIST (SORTING) RULES ---
const perfectionistRules = {
  ...perfectionistPlugin.configs["eslint-plugin-perfectionist/recommended-natural"],
  // You can also use 'recommended-alphabetical' if you prefer
};

// UNICORN (FILENAME & CODE QUALITY) RULES ---
const unicornRules = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: {
    unicorn: unicornPlugin,
  },
  rules: {
    ...unicornPlugin.configs.recommended.rules,

    // This is the 'ls-lint' replacement.
    // It enforces file naming conventions.
    "unicorn/filename-case": [
      "error",
      {
        "cases": {
          "kebabCase": true,
          "pascalCase": true, // Allow PascalCase for React components
        },
        "ignore": [
          // Ignore Next.js dynamic route filenames like [id].tsx and [...all].tsx
          /\[...all\]\.tsx?$/,
          /\[.+\]\.tsx?$/,
        ],
      }
    ],

    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-null": "off", // 'null' is often needed in Next.js

    // Off because it cannot be satisfied here. The rule is happy once a nested
    // ternary is parenthesised, and that is all its autofix does, but lint-staged
    // runs `eslint --fix` and then `prettier --write`, and prettier strips those
    // parentheses straight back out. Running the pair returns every file to its
    // original bytes, so the rule reports the same findings on the next run
    // forever. The only other way to clear it is to hand-rewrite the ternaries
    // as if/else or helper functions, which is a refactor of rendering code
    // rather than a lint fix.
    "unicorn/no-nested-ternary": "off",

    // Argument checking off. The rule strips a trailing `undefined` argument
    // without consulting the signature, so `parse(undefined)` on a function whose
    // parameter is a required `unknown` becomes `parse()`, which no longer matches
    // the signature. tsc does not catch it either, since tsconfig excludes test
    // files and that is exactly where feeding a parser `undefined` on purpose is
    // the assertion. Declarations are still checked.
    "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
  }
};

// UNICORN OVERRIDE FOR NEXT.JS FILES ---
// We must allow `page.tsx`, `layout.tsx`, etc.
const nextFileOverrides = {
  files: [
    // Next.js 'app' router uses files with `page.tsx` etc.
    // We must disable this rule for the 'app' directory.
    "app/**/{page,layout,template,loading,error,global-error,not-found}.tsx"
  ],
  rules: {
    "unicorn/filename-case": [
      "error",
      {
        "cases": {
          "kebabCase": true
        }
      }
    ]
  }
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  customRulesConfig,
  perfectionistRules,
  unicornRules,
  nextFileOverrides,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // shadcn CLI-managed files — treated as third-party, not linted
    "components/ui/**",
    "components/kibo-ui/**",
    "components/reui/**",
    "hooks/use-mobile.ts",
  ]),
]);

export default eslintConfig;
