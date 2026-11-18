import type { ManualChapter, ManualFile } from "./schemas";

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function chapterWordCount(chapter: ManualChapter): number {
  let n = countWords(chapter.standfirst ?? "");
  for (const block of chapter.blocks) {
    if (block.type === "p" || block.type === "h2") n += countWords(block.text);
  }
  return n;
}

export function manualTotalWords(manual: ManualFile): number {
  return manual.chapters.reduce((sum, ch) => sum + chapterWordCount(ch), 0);
}