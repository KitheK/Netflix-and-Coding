import { PIXEL_GLYPHS } from "../lib/pixelGlyphs";

export type PixelWordmarkProps = {
  text: string;
  /** Pixel cell size in SVG units (Libretto uses 3 in the sidebar, 8 in the hero). */
  cell?: number;
  className?: string;
};

export function PixelWordmark({ text, cell = 8, className = "wordmark" }: PixelWordmarkProps) {
  const letters = text.toUpperCase().split("");
  const advance = 6 * cell;
  const width = Math.max(cell, letters.length * advance - cell);
  const height = 7 * cell;
  const rects: { key: string; x: number; y: number }[] = [];

  letters.forEach((letter, letterIndex) => {
    const rows = PIXEL_GLYPHS[letter] ?? PIXEL_GLYPHS["?"];
    if (!rows) return;
    rows.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === "1") {
          rects.push({ key: `${letterIndex}-${x}-${y}`, x: letterIndex * advance + x * cell, y: y * cell });
        }
      });
    });
  });

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={text}
      shapeRendering="crispEdges"
    >
      {rects.map((rect) => (
        <rect key={rect.key} x={rect.x} y={rect.y} width={cell - 1} height={cell - 1} fill="currentColor" />
      ))}
    </svg>
  );
}