import type { LocalDate } from "./schema";

export type ReviewClock = () => Date;
export type ReviewDay = 3 | 7 | 14;
export const REVIEW_SCHEDULE: {
  readonly reviewDays: readonly ReviewDay[];
  readonly dayOne: "first-study-day";
} = { reviewDays: [3, 7, 14], dayOne: "first-study-day" };

export interface ReviewSchedule {
  topicId: string;
  firstStudyDate: LocalDate;
  completedDays: ReviewDay[];
  nextReview: { day: ReviewDay; dueDate: LocalDate } | null;
}

export interface DueReview {
  topicId: string;
  day: ReviewDay;
  dueDate: LocalDate;
}

export function localDateOf(date: Date): LocalDate {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(date: LocalDate, days: number): LocalDate {
  // UTC is used only for date arithmetic on saved local calendar dates.
  const calendar = new Date(`${date}T00:00:00.000Z`);
  calendar.setUTCDate(calendar.getUTCDate() + days);
  return calendar.toISOString().split("T", 1)[0] ?? date;
}

export function scheduleTopic(
  topicId: string,
  firstStudyDate: LocalDate,
  practiceDates: readonly LocalDate[],
): ReviewSchedule {
  const lastPractice = practiceDates.reduce(
    (latest, date) => (date > latest ? date : latest),
    firstStudyDate,
  );
  const completedDays: ReviewDay[] = [];
  for (const day of REVIEW_SCHEDULE.reviewDays) {
    const dueDate = addCalendarDays(firstStudyDate, day - 1);
    if (dueDate > lastPractice) {
      return { topicId, firstStudyDate, completedDays, nextReview: { day, dueDate } };
    }
    completedDays.push(day);
  }
  return { topicId, firstStudyDate, completedDays, nextReview: null };
}

export function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function dueReviews(schedules: readonly ReviewSchedule[], clock: ReviewClock): DueReview[] {
  const today = localDateOf(clock());
  return schedules
    .flatMap(({ topicId, nextReview }) =>
      nextReview && nextReview.dueDate <= today ? [{ topicId, ...nextReview }] : [],
    )
    .sort(
      (left, right) => compareText(left.dueDate, right.dueDate) || compareText(left.topicId, right.topicId),
    );
}
