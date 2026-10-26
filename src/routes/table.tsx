import { Index, createSignal } from "solid-js";
import { type Grid, emptyGrid, setCell } from "~/lib/table";

// Arrow keys move between cells; the value is the [row, column] step.
const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export default function TablePad() {
  const [grid, setGrid] = createSignal<Grid>(emptyGrid());
  let table!: HTMLTableElement;

  // Cells are found through the table's own indices, so no ref is kept per cell.
  const cellOf = (target: EventTarget | null) => {
    const cell = target instanceof Element ? target.closest("td") : null;
    const row = cell?.parentElement as HTMLTableRowElement | null | undefined;
    if (!cell || !row) return;
    return { row: row.rowIndex, col: (cell as HTMLTableCellElement).cellIndex };
  };

  const focusCell = (row: number, col: number) => {
    const cell = table.rows[row]?.cells[col]?.firstElementChild;
    if (cell instanceof HTMLElement) cell.focus();
  };

  const commit = (event: Event) => {
    const at = cellOf(event.target);
    if (!at) return;
    setGrid(setCell(grid(), at.row, at.col, (event.target as HTMLTextAreaElement).value));
  };

  const moveFocus = (event: KeyboardEvent) => {
    const at = cellOf(event.target);
    if (!at) return;
    const rows = grid();
    const height = rows.length;
    const width = rows[0].length;

    if (event.key === "Tab") {
      // Row-major and wrapping at both ends, so tabbing never leaves the grid.
      const count = height * width;
      const index = (at.row * width + at.col + (event.shiftKey ? count - 1 : 1)) % count;
      event.preventDefault();
      focusCell(Math.floor(index / width), index % width);
      return;
    }

    // Modified arrows keep their native meaning (caret movement inside the cell).
    const modified = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
    const step = modified ? undefined : MOVES[event.key];
    if (!step) return;
    const row = at.row + step[0];
    const col = at.col + step[1];
    // Arrows stop at the edges of the grid instead of wrapping.
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    event.preventDefault();
    focusCell(row, col);
  };

  return (
    <main class="flex h-full flex-col overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
      <header class="shrink-0 border-b-2 border-dashed border-primary px-3 py-2">
        <h1 class="text-h3 font-headline tracking-headline uppercase">Table Pad</h1>
      </header>
      {/* The pane scrolls on both axes; long cells wrap at max-w-64 instead of widening it. */}
      <div class="min-h-0 flex-1 overflow-auto">
        <table
          ref={(el) => (table = el)}
          aria-label="Table Pad grid"
          onInput={commit}
          onKeyDown={moveFocus}
          class="w-max border-collapse border-t border-l border-primary/40"
        >
          <tbody>
            <Index each={grid()}>
              {(row) => (
                <tr>
                  <Index each={row()}>
                    {(cell) => (
                      <td class="border-r border-b border-primary/40 align-top">
                        <textarea
                          rows={1}
                          spellcheck={false}
                          autocomplete="off"
                          ref={(el) => (el.value = cell())}
                          class="block field-sizing-content min-h-11 max-w-64 min-w-24 resize-none overflow-hidden border-0 bg-transparent px-2 py-2 text-body leading-5 text-primary-dark outline-none focus:bg-primary-bg"
                        />
                      </td>
                    )}
                  </Index>
                </tr>
              )}
            </Index>
          </tbody>
        </table>
      </div>
    </main>
  );
}
