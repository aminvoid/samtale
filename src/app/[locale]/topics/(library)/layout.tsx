import type { ReactNode } from "react";
import { LibraryHeader } from "@/features/topic-library/library-header";

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LibraryHeader />
      {children}
    </>
  );
}
