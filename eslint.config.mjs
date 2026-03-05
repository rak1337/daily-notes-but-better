import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
  // Ignore config + build files
  {
    ignores: [
      "node_modules/**",
      "main.js",
      "eslint.config.mjs",
      ".eslintrc.js"
    ],
  },

  // Base Obsidian recommended rules
  ...obsidianmd.configs.recommended,

  // TypeScript files only
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        window: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs["recommended-type-checked"].rules,
    },
  },
]);
