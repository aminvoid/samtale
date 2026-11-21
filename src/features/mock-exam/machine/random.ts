import type { MockTopic, SituationKey, TopicSource } from "./types";

export function mulberry32(state: number) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let bits = Math.imul(next ^ (next >>> 15), next | 1);
  bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61);
  return { state: next, value: ((bits ^ (bits >>> 14)) >>> 0) / 0x100000000 };
}

export function chooseSituation(state: number): { state: number; key: SituationKey } {
  const draw = mulberry32(state);
  return { state: draw.state, key: draw.value < 0.5 ? "A" : "B" };
}

export function drawCards(
  topics: readonly MockTopic[],
  source: TopicSource,
  state: number,
): { state: number; cards: readonly MockTopic[] } {
  let pool = [...new Map(topics.map((topic) => [topic.id, topic])).values()];
  if (source.type === "drawFromTheme") {
    pool = pool.filter((topic) => topic.themeId === source.themeId);
  } else {
    const terms = new Map<string, Map<MockTopic["letter"], MockTopic>>();
    for (const topic of pool) {
      const term = terms.get(topic.termId) ?? new Map<MockTopic["letter"], MockTopic>();
      term.set(topic.letter, topic);
      terms.set(topic.termId, term);
    }
    const complete = [...terms.values()].filter((term) => term.size === 3);
    if (complete.length > 0) {
      const draw = mulberry32(state);
      state = draw.state;
      const term = complete[Math.floor(draw.value * complete.length)];
      if (term) pool = [...term.values()];
    }
  }

  const cards: MockTopic[] = [];
  while (pool.length > 0 && cards.length < 3) {
    const draw = mulberry32(state);
    state = draw.state;
    const [selected] = pool.splice(Math.floor(draw.value * pool.length), 1);
    if (selected) cards.push(selected);
  }
  return { state, cards };
}
