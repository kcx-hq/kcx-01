import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactPerf from "eslint-plugin-react-perf";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "node_modules", "coverage"]),

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-perf": reactPerf,
      "react-refresh": reactRefresh,
      import: importPlugin,
      "unused-imports": unusedImports,
    },

    settings: {
      react: { version: "detect" },
    },

    rules: {
      // Base
      ...js.configs.recommended.rules,

      // React (good static checks)
      ...react.configs.recommended.rules,

      // Hooks (correctness + avoids perf bugs)
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",

      // Vite React Refresh
      ...reactRefresh.configs.vite.rules,

      // ---- PERF: biggest static wins ----
      // Catch new references passed to children (causes rerenders)
      "react-perf/jsx-no-new-object-as-prop": "warn",
      "react-perf/jsx-no-new-array-as-prop": "warn",
      "react-perf/jsx-no-new-function-as-prop": "warn",

      // Helps avoid creating new context values/props objects inline
      "react-perf/jsx-no-jsx-as-prop": "warn",

      // ---- Bundle / hygiene (static) ----
      // Remove dead imports (directly reduces bundle)
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Import sanity (prevents messy dependency graphs)
      "import/no-duplicates": "error",
      "import/no-cycle": "warn",
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],

      // Your original intent (keep it, but better handled by unused-imports)
      "no-unused-vars": "off",

      // React 17+ new JSX transform: not needed
      "react/react-in-jsx-scope": "off",
    },
  },
]);
