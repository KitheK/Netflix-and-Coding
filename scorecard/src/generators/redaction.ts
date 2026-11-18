const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "aws-key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "generic-secret", re: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
  { name: "private-key", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: "env-assignment", re: /(?:^|\n)[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|KEY)=([^\s\n]+)/g },
  { name: "email", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
];

export type RedactionHit = { name: string; sample: string };

/** Scan text for secrets / PII. Never auto-publish — caller must ask author. */
export function scanForSecrets(text: string, extraNames: string[] = []): RedactionHit[] {
  const hits: RedactionHit[] = [];
  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      hits.push({ name, sample: m[0].slice(0, 48) });
    }
  }
  for (const n of extraNames) {
    if (n && text.includes(n)) hits.push({ name: "b9-name", sample: n });
  }
  return hits;
}

export function redactEnvValues(text: string): string {
  return text.replace(/^([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|KEY))=.*$/gm, "$1=<redacted>");
}
