import type { ReactNode } from "react";

const TOKEN = /(\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

export function RichText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let index = 0;

  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) {
      nodes.push(text.slice(last, start));
    }
    const token = match[0];
    if (token.startsWith("*")) {
      nodes.push(<em key={index}>{token.slice(1, -1)}</em>);
    } else {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      nodes.push(
        <a key={index} href={href}>
          {label}
        </a>,
      );
    }
    index += 1;
    last = start + token.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return <>{nodes}</>;
}