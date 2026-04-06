import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import eslintConfig from "@cashbound-id/eslint/react.cjs";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default eslintConfig([
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    plugins: {
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^@?\\w"],
            [
              "^\\u0000",
              "^\\.\\.(?!/?$)",
              "^\\.\\./?$",
              "^\\./(?=.*/)(?!/?$)",
              "^\\.(?!/?$)",
              "^\\./?$",
            ],
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "index.js",
      "etc/*",
      "dist/*",
      "node_modules/*",
      "jest.config.js",
      "coverage/*",
      "rollup.config.cjs",
      "jest.config.cjs",
    ],
  },
]);
