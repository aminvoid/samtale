import type { ReactNode } from "react";

export const richTags = {
  da: (chunks: ReactNode) => (
    <bdi lang="da" dir="ltr">
      {chunks}
    </bdi>
  ),
  ltr: (chunks: ReactNode) => <bdi dir="ltr">{chunks}</bdi>,
};
