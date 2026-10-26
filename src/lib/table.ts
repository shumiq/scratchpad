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

// Exactly one empty row at the bottom and one empty column on the right. When an edit
// leaves several empty rows/columns at the edge, keep the last one so the edited row or
// column (now empty) is the one removed and the caret's row/column stays in place.
export function ensureTrailingEmpty(grid: Grid): Grid {
  let rows = grid;

  let emptyRows = 0;
  for (let r = rows.length - 1; r >= 0 && rows[r].every((cell) => cell === ""); r--) emptyRows++;
  if (emptyRows === 0) {
    rows = [...rows, Array<string>(rows[0].length).fill("")];
  } else if (emptyRows > 1) {
    const start = rows.length - emptyRows;
    rows = [...rows.slice(0, start), rows[rows.length - 1]];
  }

  const width = rows[0].length;
  let emptyCols = 0;
  for (let c = width - 1; c >= 0 && rows.every((row) => row[c] === ""); c--) emptyCols++;
  if (emptyCols === 0) {
    rows = rows.map((row) => [...row, ""]);
  } else if (emptyCols > 1) {
    const start = width - emptyCols;
    rows = rows.map((row) => [...row.slice(0, start), row[width - 1]]);
  }

  return rows;
}

export function isGrid(value: unknown): value is Grid {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
  );
}

// Check if every cell in a row is empty string
export function isRowEmpty(grid: Grid, row: number): boolean {
  if (row < 0 || row >= grid.length) return true;
  return grid[row].every((cell) => cell === "");
}

// Check if every cell in a column is empty string
export function isColEmpty(grid: Grid, col: number): boolean {
  if (col < 0 || col >= grid[0].length) return true;
  return grid.every((row) => row[col] === "");
}

// Add an empty row at the bottom (width matches existing grid)
export function addEmptyRow(grid: Grid): Grid {
  return [...grid, Array<string>(grid[0].length).fill("")];
}

// Remove the last row; no-op if only 1 row
export function removeLastRow(grid: Grid): Grid {
  if (grid.length <= 1) return grid;
  return grid.slice(0, -1);
}

// Add an empty column at the right (height matches existing grid)
export function addEmptyCol(grid: Grid): Grid {
  return grid.map((row) => [...row, ""]);
}

// Remove the last column; no-op if only 1 column
export function removeLastCol(grid: Grid): Grid {
  if (grid[0].length <= 1) return grid;
  return grid.map((row) => row.slice(0, -1));
}
