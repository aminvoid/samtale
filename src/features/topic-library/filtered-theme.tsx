"use client";

import { useSearchParams } from "next/navigation";
import { ThemeResults, type ThemeResultsProps } from "./theme-results";

export function FilteredTheme(props: ThemeResultsProps) {
  const params = useSearchParams();
  return <ThemeResults {...props} selectedSubtheme={params.get("sub")} />;
}
