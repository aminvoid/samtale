import type { ReactNode } from "react";

type Step = { key: string; number: string; body: ReactNode };

export function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol role="list">
      {steps.map(({ key, number, body }) => (
        <li key={key} className="group flex items-stretch gap-3 pbe-4 last:pbe-0">
          <div aria-hidden="true" className="relative flex shrink-0 justify-center self-stretch inline-7">
            <span className="z-10 grid place-items-center rounded-full bg-accent-subtle text-label text-accent block-7 inline-7">
              {number}
            </span>
            <span className="absolute inset-bs-7 inset-be-0 -mbe-4 bg-border inline-0.5 group-last:hidden" />
          </div>
          <div className="min-inline-0">{body}</div>
        </li>
      ))}
    </ol>
  );
}
