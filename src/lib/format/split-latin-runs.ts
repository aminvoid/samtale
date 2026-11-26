const latinRun = /([\p{Script=Latin}\d]+(?:(?:[-+’']| +)[\p{Script=Latin}\d]+)*)/gu;
const hasLatin = /\p{Script=Latin}/u;

export function splitLatinRuns(text: string) {
  return text
    .split(latinRun)
    .filter(Boolean)
    .map((run) => ({ text: run, isLatin: hasLatin.test(run) }));
}
