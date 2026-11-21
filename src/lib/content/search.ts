/** Shared by the published search index and client queries (US-008). */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/(?=\p{Script_Extensions=Arabic})\p{Mark}/gu, "")
    .replace(/[\s\u200c]+/g, " ")
    .trim();
}
