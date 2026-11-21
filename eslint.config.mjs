// @ts-check
import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import tseslint from "typescript-eslint";

/** Every folder in src/features is a feature, so a new one is covered without editing this file. */
const FEATURES = readdirSync(new URL("./src/features", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/** ADR-0001: layers. */
const layerZones = [
  {
    target: "./src/lib",
    from: ["./src/app", "./src/features", "./src/components"],
    message: "src/lib is the lowest layer (ADR-0001).",
  },
  {
    target: "./src/lib",
    from: ["./src/i18n/navigation.ts", "./src/i18n/request.ts", "./src/i18n/rich-tags.tsx"],
    message: "src/lib may use only src/i18n/config and src/i18n/routing (ADR-0001).",
  },
  {
    target: "./src/components",
    from: ["./src/app", "./src/features"],
    message: "UI primitives contain no business logic (ADR-0001).",
  },
  { target: "./src/features", from: "./src/app", message: "Features never import routes (ADR-0001)." },
  {
    target: "./src",
    from: ["./content", "./audio", "./scripts", "./docs"],
    message: "App code never imports content/, audio/, scripts/ or docs/ (ADR-0002).",
  },
];

/** ADR-0001: features talk to each other only through index.ts. */
const featureZones = FEATURES.flatMap((from) =>
  FEATURES.filter((target) => target !== from).map((target) => ({
    target: `./src/features/${target}`,
    from: `./src/features/${from}`,
    except: ["./index.ts"],
    message: "Import another feature only through its index.ts (ADR-0001).",
  })),
);

/** ADR-0001: vendor and data confinement. Each folder that may use one of these opts out by key. */
const RESTRICTED = {
  generated: {
    group: ["@/generated/*", "**/generated/content/*"],
    message: "Only src/lib/content/source reads the generated read model (ADR-0002).",
  },
  scripts: { group: ["**/scripts/**"], message: "App code never imports scripts/ (ADR-0001)." },
  fs: {
    group: ["fs", "fs/*", "node:fs", "node:fs/*"],
    message: "App code doesn't read files; content comes through src/lib/content (ADR-0002).",
  },
  baseUi: {
    group: ["@base-ui/react", "@base-ui/react/*"],
    message: "Use primitives from @/components/ui (ADR-0009).",
  },
  lucide: { group: ["lucide-react"], message: "Use <Icon> from @/components/ui/icon (ADR-0009)." },
  idb: { group: ["idb"], message: "Use ProgressStore or RecordingStore (ADR-0008)." },
  speech: {
    group: ["microsoft-cognitiveservices-speech-sdk"],
    message: "Azure Speech is used only in scripts/audio (ADR-0006).",
  },
  nextLink: { group: ["next/link"], message: "Use Link from @/i18n/navigation (ADR-0004)." },
};
/** @param {...string} allowed keys of RESTRICTED that this folder may use */
function restrictedImports(...allowed) {
  return [
    "error",
    {
      patterns: Object.entries(RESTRICTED)
        .filter(([key]) => !allowed.includes(key))
        .map(([, v]) => v),
    },
  ];
}

const A11Y_TEXT_ATTRIBUTES =
  "/^(aria-label|aria-description|aria-valuetext|aria-placeholder|aria-roledescription|alt|title|placeholder|label)$/";
const A11Y_MESSAGE =
  "Accessible names, alt, title, label and placeholder come from messages, with ICU arguments for values (CLAUDE.md rule 5).";

/** no-restricted-syntax selectors for all of src/. */
const SRC_SYNTAX = [
  { selector: `JSXAttribute[name.name=${A11Y_TEXT_ATTRIBUTES}] > Literal`, message: A11Y_MESSAGE },
  {
    selector: `JSXAttribute[name.name=${A11Y_TEXT_ATTRIBUTES}] > JSXExpressionContainer > Literal`,
    message: A11Y_MESSAGE,
  },
  {
    selector: `JSXAttribute[name.name=${A11Y_TEXT_ATTRIBUTES}] > JSXExpressionContainer > TemplateLiteral`,
    message: A11Y_MESSAGE,
  },
  {
    selector: "JSXAttribute[name.name='dir'] Literal[value='rtl']",
    message: "Never hard-code rtl; use getDirection(locale) (ADR-0004).",
  },
  {
    // Named formats carry the digit and calendar config; inline options bypass it (ADR-0004 §5).
    selector:
      "CallExpression[callee.object.name=/^(format|formatter)$/][callee.property.name=/^(dateTime|number)$/]:not([arguments.1.type='Literal'])",
    message:
      "Format with a named format from src/i18n/formats.ts: format.number(n, 'integer') (ADR-0004 §5).",
  },
];
/** Routes also may not export static metadata (it can't be translated). */
const APP_SYNTAX = [
  ...SRC_SYNTAX,
  {
    selector: "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='metadata']",
    message: "Use generateMetadata with translated strings, not a static metadata export (CLAUDE.md rule 5).",
  },
];

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".cache/**",
    "src/generated/**",
    "public/audio/**",
    "messages/*.d.json.ts",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: { "better-tailwindcss": { entryPoint: "src/app/globals.css" } },
    rules: {
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true }],
      "react/no-danger": "error",
      "no-restricted-syntax": ["error", ...SRC_SYNTAX],
      "import/no-restricted-paths": ["error", { zones: [...layerZones, ...featureZones] }],
      "no-restricted-imports": restrictedImports(),
      "better-tailwindcss/enforce-logical-properties": "error",
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              pattern:
                "^(.*:)?(bg|text|border|ring|outline|fill|stroke|decoration|shadow|accent|caret|from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(-\\d+)?(/\\d+)?$",
              message: "Use semantic design tokens, not palette colours (styling rule).",
            },
            { pattern: "\\[#[0-9a-fA-F]{3,8}\\]", message: "No raw hex values; use tokens (styling rule)." },
          ],
        },
      ],
    },
  },
  { files: ["src/app/**/*.{ts,tsx}"], rules: { "no-restricted-syntax": ["error", ...APP_SYNTAX] } },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": restrictedImports("baseUi") },
  },
  {
    // ADR-0009: lucide-react only in the Icon primitive and the theme-icon map.
    files: ["src/components/ui/icon.tsx", "src/components/ui/theme-icon.tsx"],
    rules: { "no-restricted-imports": restrictedImports("baseUi", "lucide") },
  },
  {
    files: ["src/lib/progress/browser/**/*.ts", "src/lib/recordings/**/*.ts"],
    rules: { "no-restricted-imports": restrictedImports("idb") },
  },
  {
    files: ["src/lib/content/source/**/*.ts"],
    rules: { "no-restricted-imports": restrictedImports("generated", "fs") },
  },
  { files: ["src/i18n/**/*.{ts,tsx}"], rules: { "no-restricted-imports": restrictedImports("nextLink") } },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**", "e2e/**"],
    rules: { "react/jsx-no-literals": "off", "@typescript-eslint/no-non-null-assertion": "off" },
  },
  {
    // Tests may read fixture and message files.
    files: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    rules: { "no-restricted-imports": restrictedImports("fs") },
  },
  {
    /**
     * Content pipeline scripts (content-engineer, ADR-0003) get the full type-aware rules, with two
     * narrow allowances for CLI code that builds report strings and reads regex groups:
     * numbers in template literals, and `!` on values the strict grammar has just matched
     * (a missing group is a parser bug and would throw a few lines later anyway).
     * build-read-model.ts, the published-data allow-list (ADR-0002), gets no allowance.
     */
    files: ["scripts/content/**/*.ts"],
    ignores: ["scripts/content/build-read-model.ts", "scripts/content/build-read-model.test.ts"],
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
]);
