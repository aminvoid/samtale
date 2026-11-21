import type { ComponentProps } from "react";
import type { Link } from "@/i18n/navigation";
import type { SearchDocument, Theme, TopicSummary } from "@/lib/content/repository";

export const theme: Pick<Theme, "id" | "subthemes"> = {
  id: "arbejde",
  subthemes: [
    { id: "jobs", title: { da: "Job", fa: "شغل" } },
    { id: "pension", title: { da: "Pension", fa: "بازنشستگی" } },
    { id: "work-time", title: { da: "Arbejdstid", fa: "ساعت کار" } },
  ],
};

export const currentTopic: TopicSummary = {
  id: "2024-maj-b",
  termId: "2024-maj",
  term: { year: 2024, session: "maj" },
  letter: "B",
  themeId: theme.id,
  subthemeId: "jobs",
  title: { da: "Arbejde på et hospital", fa: "کار در بیمارستان" },
  formatEraId: "from-2023",
};

export const olderTopic: TopicSummary = {
  id: "2022-nov-a",
  termId: "2022-nov",
  term: { year: 2022, session: "nov" },
  letter: "A",
  themeId: theme.id,
  subthemeId: "pension",
  title: { da: "Pension", fa: "بازنشستگی" },
  formatEraId: "pre-2023",
};

export const searchIndex: SearchDocument[] = [
  {
    topicId: currentTopic.id,
    fields: [
      {
        kind: "topic-title",
        section: null,
        text: { da: "arbejde på et hospital", fa: "کار در بیمارستان" },
      },
      {
        kind: "question",
        section: "sitB",
        text: { da: "sundhedssektoren", fa: "کار نیمه وقت" },
      },
    ],
  },
  {
    topicId: olderTopic.id,
    fields: [{ kind: "topic-title", section: null, text: { da: "pension", fa: "بازنشستگی" } }],
  },
];

// The real locale Link expects the Next.js router, which is not present in component tests.
export function MockLocaleLink({ children, href, ...props }: ComponentProps<typeof Link>) {
  const path = typeof href === "string" ? href : (href.pathname ?? "");
  const params = new URLSearchParams();
  if (typeof href === "object" && href.query && typeof href.query === "object") {
    for (const [key, value] of Object.entries(href.query)) {
      if (typeof value === "string") params.set(key, value);
    }
  }
  return (
    <a
      className={props.className}
      aria-current={props["aria-current"]}
      href={`/fa${path}${params.size ? "?" + params.toString() : ""}`}
    >
      {children}
    </a>
  );
}
