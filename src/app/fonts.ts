import { Atkinson_Hyperlegible_Next, Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils/cn";

// Shared by the root layout, global-not-found and global-error, which each render their own <html>.
const persianFont = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazirmatn",
});
// Danish face chosen in docs/design/tokens.md (ADR-0004 §6): latin subset covers æ ø å.
const danishFont = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-danish-face",
});
// Plain-zero digits for Danish text (Atkinson's default and tabular zeros are both slashed).
// Geist Latin, OFL-1.1 (licence in ./fonts/OFL-Geist.txt); copied from Next.js 16.4.6's bundled
// devtools font so the build doesn't depend on a private path inside node_modules.
const danishDigits = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0030-0039" }],
  variable: "--font-danish-digits",
});

/** Class names that define the font CSS variables; put them on <html>. */
export const fontVariables = cn(persianFont.variable, danishFont.variable, danishDigits.variable);
