/** Snap a value to the nearest grid line */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Find the next available position on a grid that doesn't overlap existing widgets */
export function findNextAvailablePosition(
  occupiedRects: Array<{ x: number; y: number; width: number; height: number }>,
  widgetWidth: number,
  widgetHeight: number,
  gridSize: number,
  maxColumns = 10,
): { x: number; y: number } {
  const maxX = maxColumns * gridSize;

  for (let y = 0; ; y += gridSize) {
    for (let x = 0; x + widgetWidth <= maxX; x += gridSize) {
      const candidate = { x, y, width: widgetWidth, height: widgetHeight };
      const hasOverlap = occupiedRects.some(
        (r) =>
          candidate.x < r.x + r.width &&
          candidate.x + candidate.width > r.x &&
          candidate.y < r.y + r.height &&
          candidate.y + candidate.height > r.y,
      );
      if (!hasOverlap) {
        return { x, y };
      }
    }
  }
}

/** Get all widget bounding rects from a tab */
export function getOccupiedRects(
  containers: Array<{ x: number; y: number; width: number; height: number }>,
  layouts: Array<{ x: number; y: number; width: number; height: number }>,
): Array<{ x: number; y: number; width: number; height: number }> {
  return [...containers, ...layouts];
}
