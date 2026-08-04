import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // eslint-config-next already ignores .next/**, out/**, build/**, next-env.d.ts
    // scripts/** are one-off Node tooling (CommonJS, not app code)
    "scripts/**",
    "drizzle/**",
    "sqlite.db",
  ]),
])

export default eslintConfig
