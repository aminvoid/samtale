<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (all agents, including Codex)

This section is maintained by the project. Next.js manages only the block above.

**Before any task, read:**
- **`CLAUDE.md`:** what the project is, decisions already made, the tech stack and pinned versions, core engineering rules, the definition of done, and the commands.
- **`.claude/rules/*.md`:** detailed rules for the areas you touch:
  - `nextjs-react.md`
  - `i18n-rtl.md`
  - `content-data.md`
  - `speech-audio.md`
  - `styling-a11y.md`
  - `testing.md`
- **The ADR for the area:** `docs/adr/` (index in `docs/adr/README.md`). Product and UX specs are in `docs/product/` and `docs/ux/`.

**Hard rules:**
- **Booklet content:** never edit anything under `docs/resources/`. Never invent or rewrite booklet content in `content/`.
- **Secrets:** never read, print or copy `.env*` values (except `.env.example` placeholders). Never call Azure or any paid service.
- **Git:** never commit, push or rewrite history. The owner decides on commits.
- **Interface text:** no hard-coded user-facing strings; use `messages/fa.json`.
- **Layout:** logical CSS only, including `mbs-*` and `min-block-*`.
- **Danish text:** goes through `DanishText`.
- **Before finishing:** run `npm run typecheck`, `npm run lint` and `npm test`, and report the real results.
