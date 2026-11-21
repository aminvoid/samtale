import { Atkinson_Hyperlegible_Next, Vazirmatn } from "next/font/google";
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

/** Class names that define the font CSS variables; put them on <html>. */
export const fontVariables = cn(persianFont.variable, danishFont.variable);
