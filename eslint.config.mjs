import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Páginas client que leem estado externo (localStorage / searchParams),
    // disponível só após o mount. O setState no effect é necessário aqui pra
    // evitar mismatch de hidratação (o SSR estático não tem esses valores).
    files: ["src/app/page.tsx", "src/app/palpite/PalpiteBoard.tsx", "src/app/ver/page.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
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
