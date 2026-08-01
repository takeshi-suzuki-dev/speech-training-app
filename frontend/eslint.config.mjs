import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Type-aware rules. eslint-config-next ships syntax-level checks only, which
  // cannot see `any` flowing out of response.json() or an unawaited promise.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Async correctness.
      "@typescript-eslint/no-floating-promises": "error",

      // JSX attributes are exempt: `onClick={handleAsync}` is the idiomatic
      // React form, and every async handler here already has its own
      // try/catch. Function arguments stay checked, since a callback typed
      // `() => void` genuinely cannot await what it is given.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      // Keeps `any` from leaking in through untyped JSON responses.
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-call": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // Deliberately not enabled:
      //   consistent-type-definitions - this codebase uses `type` throughout and
      //     that consistency is what matters; switching to `interface` would be
      //     churn with no benefit.
      //   strict-boolean-expressions - correct but noisy, and the rewrites it
      //     forces hurt readability more than the implicit checks it flags.
    },
  },

  // Config files sit outside tsconfig's include, so the project service cannot
  // type them. They need no type-aware linting anyway.
  {
    files: ["**/*.mjs", "**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Test files need looser typing around mocks.
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
