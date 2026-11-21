/**
 * audio:voices: lists the voices that speak a locale in the resource's region (free request).
 *
 *   npm run audio:voices                 native da-DK voices
 *   npm run audio:voices -- --locale fa-IR
 *   npm run audio:voices -- --secondary  also multilingual voices that list the locale as secondary
 */
import { parseArgs } from "node:util";
import { parseSpeechEnv } from "./env.ts";
import { fetchVoices } from "./lib/azure.ts";

const { values } = parseArgs({
  options: { locale: { type: "string", default: "da-DK" }, secondary: { type: "boolean", default: false } },
});
const locale = values.locale;
const env = parseSpeechEnv(process.env);
const voices = await fetchVoices(env);
const native = voices.filter((v) => v.Locale === locale);
const secondary = voices.filter((v) => v.Locale !== locale && v.SecondaryLocaleList?.includes(locale));

process.stdout.write(
  `${String(voices.length)} voices in ${env.region}; ${String(native.length)} native ${locale}; ${String(secondary.length)} more list ${locale} as secondary\n\n`,
);
process.stdout.write("ShortName | Gender | VoiceType | Status | Model | Styles | WPM\n");
for (const v of values.secondary ? [...native, ...secondary] : native) {
  const model = v.VoiceTag?.ModelSeries?.join("+") ?? "";
  process.stdout.write(
    `${v.ShortName} | ${v.Gender} | ${v.VoiceType} | ${v.Status ?? ""} | ${model} | ${(v.StyleList ?? []).join(",") || "-"} | ${v.WordsPerMinute ?? "-"}\n`,
  );
}
process.stdout.write("\nWord boundaries aren't listed by the API; test with `npm run audio:samples`.\n");
