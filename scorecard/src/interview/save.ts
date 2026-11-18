export async function saveContentFile(file: string, data: unknown): Promise<void> {
  const res = await fetch("/__scorecard/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file, data }),
  });
  if (!res.ok) throw new Error(await res.text());
}