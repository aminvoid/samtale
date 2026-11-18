---
paths:
  - "src/**"
  - "messages/**"
  - "content/**"
---

# i18n, RTL and mixed-direction (bidi) text

## i18n (next-intl)
- **Locales:** routes are locale-prefixed (`/fa/...`) and `fa` is the default. Locales are listed in one place (`src/i18n/routing.ts`). Adding a language means adding it to that list and adding a messages file, with no other code changes.
- **Direction:** derive it from the locale with one helper (e.g. `getDirection(locale)`). Never hard-code `rtl`.
- **Message keys:**
  - group them by feature (`topicLibrary.title`) and name them in English camelCase
  - write plurals and variants in ICU syntax
  - never build sentences by concatenating strings
  - `fa.json` is the reference file
- **Type-safe messages** (next-intl type augmentation), so a missing key fails the type check.
- **Nothing hard-coded:** every user-facing string comes from messages, including `aria-label`, `alt`, `title`, metadata and error text.

## Mixed Danish and Persian text
- **Danish blocks** always render through one component (e.g. `<DanishText>`) that sets `lang="da" dir="ltr"`.
- **Danish inside a Persian sentence** goes in `<bdi lang="da">`.
- **Persian content fields** get `lang="fa"`.
- **Never** rely on the browser guessing the direction of mixed text.

## Layout
- **Use logical properties only:** `ms-* me-* ps-* pe-* start-* end-* text-start text-end border-s rounded-s ...`.
- **No `ml/mr/pl/pr/left/right/text-left/text-right`.** The only exception is a deliberately physical case, with a comment explaining why.
- **Mirror directional icons in RTL:** back/next arrows, chevrons, step progress.
- **Don't mirror:** play/pause, media scrubbers and audio progress bars, clocks, checkmarks, or logos.

## Numbers, dates and durations
- **Always format** with next-intl formatters or `Intl` for the active locale. Never format by hand.
- **The digit style (Persian ۰–۹ or Latin 0–9) is still undecided.** Implement it in a single formatting config so the decision is a one-line change.

## Persian orthography (UI copy and content)
- **ZWNJ (U+200C)** where it belongs: `می‌شود`, `سؤال‌ها`, `کتاب‌ها`.
- **Persian `ی` (U+06CC) and `ک` (U+06A9)**, never Arabic `ي` (U+064A) or `ك` (U+0643).
- **No Arabic presentation-form characters** (U+FB50–U+FDFF, U+FE70–U+FEFF). These came out of the PDF extraction.
- **Persian punctuation:** `،` `؛` `؟` and «guillemets».
- **Consistent formal address** (`شما`). Use standard Persian that both Iranian and Afghan (Dari) readers understand, without regional slang.

## Fonts
- **Persian interface:** Vazirmatn.
- **Danish text:** a Latin typeface with good æ ø å glyphs, selected with `:lang(da)`.
- Load both with `next/font`.

## Verifying
- **Viewports:** check every new screen in RTL at 375 px and 1280 px.
- **E2E tests:** assert `dir="rtl"` on `<html>` and `dir="ltr"` with `lang="da"` on Danish blocks.
