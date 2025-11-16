import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

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

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  customRulesConfig,
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
