// The Table Pad model: plain text cells in a rectangular grid. One module owns the shape,
// so every step that builds a grid (paste, restore) gets the same guarantee.

export type Grid = string[][];

export const emptyGrid = (): Grid => [[""]];

// Rows arrive ragged from a paste or a stored value; pad each one to the widest, since an
// empty cell is "" and the grid is always a rectangle.
export function normalize(rows: Grid): Grid {
  const width = rows.reduce((widest, row) => Math.max(widest, row.length), 0);
  return rows.map((row) =>
    row.length === width ? row : [...row, ...Array<string>(width - row.length).fill("")],
  );
}

// Only the edited row is rebuilt, so untouched rows keep their identity for the renderer.
export function setCell(grid: Grid, row: number, col: number, value: string): Grid {
  return grid.map((cells, r) => {
    if (r !== row) return cells;
    const next = [...cells];
    next[col] = value;
    return next;
  });
}

export function isGrid(value: unknown): value is Grid {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
  );
}
