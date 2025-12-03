import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import importPlugin from "eslint-plugin-import";
import boundariesPlugin from "eslint-plugin-boundaries";
import prettierConfig from "eslint-config-prettier";
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
        type: "ui",
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
    // Enforce One-Way Dependency Structure using eslint-plugin-boundaries
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: "app",
            allow: ["features", "layout", "shared", "ui", "lib", "types"],
          },
          {
            from: "features",
            allow: ["ui", "shared", "lib", "types"],
          },
          {
            from: "features",
            allow: [
              ["features", { featureName: "${from.featureName}" }],
              "ui",
              "shared",
              "lib",
              "types",
            ],
          },
          {
            from: ["ui", "layout", "shared"],
            allow: ["ui", "layout", "shared", "lib", "types"],
          },
          {
            from: "lib",
            allow: ["types"],
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
          "pascalCase": true, // Allow PascalCase
        },
        "ignore": [
          // We must ignore these to allow React components (PascalCase)
          // and Next.js files (lowercase).
          /\[...all\]\.tsx?$/,
          /\[.+\]\.tsx?$/,
        ],
      }
    ],

    // Next.js 'app' router uses files with `page.tsx` etc.
    // We must disable this rule for the 'app' directory.
    "unicorn/prevent-abbreviations": "off",
    "unicorn/no-null": "off", // 'null' is often needed in Next.js
  }
};

// UNICORN OVERRIDE FOR NEXT.JS FILES ---
// We must allow `page.tsx`, `layout.tsx`, etc.
const nextFileOverrides = {
  files: [
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
  ]),
]);

export default eslintConfig;
