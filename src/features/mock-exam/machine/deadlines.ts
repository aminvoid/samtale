import { examConfig } from "@/lib/exam/config";
import type { Countdown, State, Stopwatch } from "./types";

export const ms = (seconds: number): number => seconds * 1000;

export function elapsed(clock: Stopwatch | null, at: number): number {
  return clock ? clock.elapsedMs + (clock.since === null ? 0 : Math.max(0, at - clock.since)) : 0;
}

export function countdown(remainingMs: number, at: number | null): Countdown {
  return { remainingMs, deadline: at === null ? null : at + remainingMs };
}

export function remaining(timer: Countdown, at: number): number {
  return timer.deadline === null ? timer.remainingMs : Math.max(0, timer.deadline - at);
}

export function freeze(timer: Countdown | null, at: number): Countdown | null {
  return timer && countdown(remaining(timer, at), null);
}

export function thaw(timer: Countdown | null, at: number): Countdown | null {
  return timer && countdown(remaining(timer, at), at);
}

type DeadlineKind =
  "cutoff" | "handover" | "minute" | "limit" | "ceiling" | "grace" | "cap" | "gap" | "load" | "look";
interface Deadline {
  kind: DeadlineKind;
  at: number;
}

export function nextDue(state: State): Deadline | null {
  const context = state.context;
  const candidates: Deadline[] = [];
  function add(kind: DeadlineKind, at: number | null | undefined) {
    if (at !== null && at !== undefined) candidates.push({ kind, at });
  }
  const clock = context.examClock;
  if (clock && clock.since !== null && context.policy.examLimitMs !== null) {
    const zero = clock.since - clock.elapsedMs;
    // At a tie, exam rules are evaluated before a new clip can start.
    if (!context.part1CutoffReached) add("cutoff", zero + ms(examConfig.part1CutoffSeconds));
    if (!context.part1HandoverReached && !context.u2Asked)
      add("handover", zero + ms(examConfig.part1HandoverSeconds));
    if (!context.minuteNoticePassed)
      add("minute", zero + context.policy.examLimitMs - ms(examConfig.oneMinuteNoticeSeconds));
    if (!context.limitReached) add("limit", zero + context.policy.examLimitMs);
    if (!context.graceCeilingReached) add("ceiling", zero + ms(examConfig.graceCeilingSeconds));
  }
  add("grace", context.grace?.deadline);
  add("cap", context.recordingCap?.deadline);
  add("load", context.load?.deadline);
  add("look", context.look?.deadline);
  if ("audio" in state && state.audio.playback.phase === "gap")
    add("gap", state.audio.playback.timer.deadline);
  return candidates.reduce<Deadline | null>(
    (first, candidate) => (first === null || candidate.at < first.at ? candidate : first),
    null,
  );
}

export function nextDeadline(state: State): number | null {
  return nextDue(state)?.at ?? null;
}
