export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ');
}

export function buildTextForModel(subject: string, message: string): string {
  const s = collapseWhitespace(subject.trim());
  const m = collapseWhitespace(message.trim());
  return `Subject: ${s}\n\nMessage: ${m}`;
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function truncateToMaxWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return `${words.slice(0, maxWords).join(' ')}...`;
}
