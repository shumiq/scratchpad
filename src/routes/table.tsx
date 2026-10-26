import { Index, Show, createSignal, onMount, onCleanup } from "solid-js";
import { parsePaste } from "~/lib/paste";
import { type Grid, emptyGrid, setCell } from "~/lib/table";

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

type Cell = { row: number; col: number };
type Range = { r1: number; c1: number; r2: number; c2: number };

const colLabel = (n: number) => {
  let s = "";
  let i = n + 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
};

const inRange = (r: number, c: number, sel: Range | null) =>
  !!sel && r >= sel.r1 && r <= sel.r2 && c >= sel.c1 && c <= sel.c2;

const rangeText = (sel: Range | null) => {
  if (!sel) return "";
  const a = `${colLabel(sel.c1)}${sel.r1 + 1}`;
  const b = `${colLabel(sel.c2)}${sel.r2 + 1}`;
  return a === b ? a : `${a}:${b}`;
};

export default function TablePad() {
  const [grid, setGrid] = createSignal<Grid>(emptyGrid());
  const [hint, setHint] = createSignal<string | null>(null);
  const [sel, setSel] = createSignal<Range | null>(null);
  let table!: HTMLTableElement;
  let pane!: HTMLDivElement;
  let dragging = false;
  let anchor: Cell | null = null;

  const cellOf = (target: EventTarget | null): Cell | null => {
    const cell = target instanceof Element ? target.closest("td") : null;
    const row = cell?.parentElement as HTMLTableRowElement | null | undefined;
    if (!cell || !row) return null;
    return { row: row.rowIndex - 1, col: (cell as HTMLTableCellElement).cellIndex - 1 };
  };

  // header row is row 0 of table, so data row index = rowIndex - 1, col index = cellIndex - 1

  const focusCell = (row: number, col: number) => {
    const cell = table.rows[row + 1]?.cells[col + 1]?.firstElementChild;
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

    if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "A")) {
      event.preventDefault();
      setSel({ r1: 0, c1: 0, r2: height - 1, c2: width - 1 });
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setSel(null);
      return;
    }

    if (event.key === "Tab") {
      const count = height * width;
      const index = (at.row * width + at.col + (event.shiftKey ? count - 1 : 1)) % count;
      event.preventDefault();
      focusCell(Math.floor(index / width), index % width);
      return;
    }

    const modified = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
    const step = modified ? undefined : MOVES[event.key];
    if (!step) return;
    const row = at.row + step[0];
    const col = at.col + step[1];
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    event.preventDefault();
    focusCell(row, col);
  };

  const handlePaste = (event: ClipboardEvent) => {
    const data = event.clipboardData;
    if (!data) return;
    event.preventDefault();
    setHint(null);
    let html: string | undefined;
    let plain: string | undefined;
    try {
      html = data.getData("text/html") || undefined;
    } catch {
      html = undefined;
    }
    try {
      plain = data.getData("text/plain") || undefined;
    } catch {
      plain = undefined;
    }
    const parsed = parsePaste(html, plain);
    if (parsed.kind === "grid") {
      setGrid(parsed.grid);
    } else if (parsed.kind === "cell") {
      const at = cellOf(document.activeElement) ?? { row: 0, col: 0 };
      setGrid(setCell(grid(), at.row, at.col, parsed.value));
    } else {
      setHint(parsed.message);
    }
  };

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const cellFromPoint = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y);
    return cellOf(el);
  };

  const startDrag = (c: Cell) => {
    anchor = c;
    setSel({ r1: c.row, c1: c.col, r2: c.row, c2: c.col });
    dragging = true;
  };

  onMount(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !anchor) return;
      // auto-scroll
      const rect = pane.getBoundingClientRect();
      const margin = 24;
      let dx = 0,
        dy = 0;
      if (e.clientX < rect.left + margin) dx = -12;
      else if (e.clientX > rect.right - margin) dx = 12;
      if (e.clientY < rect.top + margin) dy = -12;
      else if (e.clientY > rect.bottom - margin) dy = 12;
      if (dx || dy) pane.scrollBy({ left: dx, top: dy });

      const c = cellFromPoint(e.clientX, e.clientY);
      if (!c) return;
      const rows = grid();
      const r = clamp(c.row, 0, rows.length - 1);
      const col = clamp(c.col, 0, rows[0].length - 1);
      setSel({
        r1: Math.min(anchor.row, r),
        c1: Math.min(anchor.col, col),
        r2: Math.max(anchor.row, r),
        c2: Math.max(anchor.col, col),
      });
    };
    const onUp = () => {
      dragging = false;
      anchor = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    onCleanup(() => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    });

    const onClickOutside = (e: MouseEvent) => {
      if (table.contains(e.target as Node)) return;
      setSel(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", onClickOutside));
  });

  const selectRow = (r: number) => {
    const g = grid();
    setSel({ r1: r, c1: 0, r2: r, c2: g[0].length - 1 });
  };
  const selectCol = (c: number) => {
    const g = grid();
    setSel({ r1: 0, c1: c, r2: g.length - 1, c2: c });
  };
  const selectAll = () => {
    const g = grid();
    setSel({ r1: 0, c1: 0, r2: g.length - 1, c2: g[0].length - 1 });
  };

  return (
    <main class="flex h-full flex-col overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
      <header class="shrink-0 border-b-2 border-dashed border-primary px-3 py-2 flex items-center justify-between">
        <h1 class="text-h3 font-headline tracking-headline uppercase">Table Pad</h1>
        <span class="text-caption text-primary-dark/70">{rangeText(sel())}</span>
      </header>
      <Show when={hint()}>
        {(message) => (
          <p
            role="alert"
            class="shrink-0 border-b border-coral bg-cream px-3 py-2 text-caption font-medium text-coral-dark"
          >
            {message()}
          </p>
        )}
      </Show>
      <div ref={(el) => (pane = el)} class="min-h-0 flex-1 overflow-auto">
        <table
          ref={(el) => (table = el)}
          aria-label="Table Pad grid"
          onInput={commit}
          onKeyDown={moveFocus}
          onPaste={handlePaste}
          class="w-max border-collapse border-t border-l border-primary/40"
        >
          <thead>
            <tr>
              <th
                class="sticky top-0 left-0 z-20 bg-primary-bg border-r border-b border-primary/40 px-2 py-2 cursor-pointer select-none"
                onClick={selectAll}
              >
                ⌄
              </th>
              <Index each={grid()[0]}>
                {(_, i) => (
                  <th
                    class="sticky top-0 z-10 bg-primary-bg border-r border-b border-primary/40 px-2 py-2 cursor-pointer select-none"
                    onClick={() => selectCol(i)}
                  >
                    {colLabel(i)}
                  </th>
                )}
              </Index>
            </tr>
          </thead>
          <tbody>
            <Index each={grid()}>
              {(row, ri) => (
                <tr>
                  <th
                    class="sticky left-0 z-10 bg-primary-bg border-r border-b border-primary/40 px-2 py-2 cursor-pointer select-none"
                    onClick={() => selectRow(ri)}
                  >
                    {ri + 1}
                  </th>
                  <Index each={row()}>
                    {(cell, ci) => (
                      <td
                        class={`border-r border-b border-primary/40 align-top ${inRange(ri, ci, sel()) ? "bg-primary/20" : ""}`}
                        onMouseDown={() => startDrag({ row: ri, col: ci })}
                      >
                        <textarea
                          rows={1}
                          spellcheck={false}
                          autocomplete="off"
                          value={cell()}
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
