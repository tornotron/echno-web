import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import perfectionistPlugin from "eslint-plugin-perfectionist";
import unicornPlugin from "eslint-plugin-unicorn";

const customRulesConfig = {
  // Apply these rules to all TypeScript/JavaScript files
  files: ["**/*.{js,jsx,ts,tsx}"],

  // Add the 'eslint-plugin-import'
  plugins: {
    import: importPlugin,
  },

  // Add settings for the import resolver
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },

  // All the rules we discussed before
  rules: {
    // === 1. Enforce Path Aliases ===
    "no-restricted-imports": [
      "error",
      {
        "patterns": ["../../*"],
      },
    ],

    // === 2. Enforce One-Way Dependency Structure (NO SRC) ===
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "lib/**",
            "from": ["features/**", "components/**", "app/**"],
            "message": "The 'lib' layer cannot import from 'features', 'components', or 'app'."
          },
          {
            "target": "components/**",
            "from": ["features/**", "app/**"],
            "message": "Shared 'components' cannot import from 'features' or 'app'."
          },
          {
            "target": "features/**",
            "from": ["app/**"],
            "message": "Features cannot import from 'app'."
          },
          {
            // This rule prevents features from importing each other
            "target": "features/*/**",
            "from": "features/*/**",
            "message": "A feature must not import from another feature. Elevate shared logic to 'lib' or a shared hook.",
            // This filter *allows* a feature to import its *own* sub-files
            "filter": {
              "type": "path",
              "pattern": "^features/{{$1}}/.+"
            }
          }
        ]
      }
    ]
  }
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
        "case": "kebabCase",
        "ignore": [
          // We must ignore these to allow React components (PascalCase)
          // and Next.js files (lowercase).
          /\[...all\]\.tsx?$/,
          /\[.+\]\.tsx?$/,
        ],
        "cases": {
          "pascalCase": true, // Allow PascalCase
        },
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
        "case": "lowercase" // Enforce these specific files are lowercase
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
