import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Standard data-loading pattern (setState inside async fn called from useEffect)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Enforce design-token usage — ban raw hex literals in app/component source.
    // Use t.* tokens from @/theme/colors instead.
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message: "Hardcoded hex colour detected. Use a t.* token from @/theme/colors instead (e.g. t.accent, t.ai, t.bg).",
        },
      ],
    },
  },
]);

export default eslintConfig;
