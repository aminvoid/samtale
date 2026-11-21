export const themesPath = "/topics";
export const termsPath = "/topics/terms";
export const similarPath = "/topics/similar";
export const searchPath = "/topics/search";

export function topicHref(topicId: string, section?: string | null) {
  const path = `${themesPath}/${topicId}`;
  return section ? `${path}#${section}` : path;
}
