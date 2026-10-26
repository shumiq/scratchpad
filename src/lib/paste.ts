// Building a grid from what the clipboard offers: when `text/html` holds a `<table>`,
// its rows and cells are parsed; otherwise plain text is tried as TSV, then a
// markdown table (a `|---|` delimiter row), then CSV. Every grid goes through normalize, so the
// rectangle guarantee is the same as any other step that builds a grid.

import { type Grid, normalize } from "~/lib/table";

const HINT = "Not a table: paste one copied from Excel, Sheets or a web page.";

export type Parsed =
  | { kind: "grid"; grid: Grid } // multi-cell: replaces the pad's contents
  | { kind: "cell"; value: string } // one cell: stays in the focused cell
  | { kind: "hint"; message: string }; // nothing tabular: shows instead of an error

export function parsePaste(html: string | undefined, plain: string | undefined): Parsed {
  if (html) {
    const fromHtml = parseHtmlTable(html);
    // A 1x1 table is one cell (Excel/Sheets copy a single cell this way): it stays in
    // the focused cell rather than wiping the pad's existing contents.
    if (fromHtml && fromHtml.length === 1 && fromHtml[0].length === 1)
      return { kind: "cell", value: fromHtml[0][0] };
    if (fromHtml) return { kind: "grid", grid: fromHtml };
  }
  if (plain === undefined) return { kind: "hint", message: HINT };
  return parsePlain(plain);
}

// Tables from web pages: DOMParser handles the messy HTML. Merged cells (`colspan`/`rowspan`)
// repeat their value into the slots they cover, `<br>` and block boundaries become a single
// space, and trailing empty rows/columns are dropped. Returns undefined when the table is
// layout, not data — the caller falls back to the plain-text flavours of the same paste.
function parseHtmlTable(html: string): Grid | undefined {
  if (import.meta.env.SSR) return; // DOMParser is a browser API; the paste path never runs on the server
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  const role = (table?.getAttribute("role") ?? "").toLowerCase();
  if (!table || role === "presentation" || role === "none") return;
  const slots: (string | undefined)[][] = []; // value per covered [row][column]; unset = open
  const trs = [...table.querySelectorAll("tr")].filter((tr) => tr.closest("table") === table); // a nested table's rows belong to it; filtered before enumerating so row indices stay dense
  for (const [r, tr] of trs.entries()) {
    slots[r] ??= [];
    for (const cell of tr.children) {
      if (cell.tagName !== "TD" && cell.tagName !== "TH") continue;
      const value = cellText(cell);
      // Place at the first open slot, then repeat into everything the spans cover.
      // A full row (covered by rowspans) extends past its end.
      const open = slots[r].findIndex((slot) => slot === undefined); // finds holes too (indexOf skips them)
      const col = open === -1 ? slots[r].length : open;
      const wide = Number(cell.getAttribute("colspan") ?? 1) || 1;
      const deep = Number(cell.getAttribute("rowspan") ?? 1) || 1;
      for (let down = 0; down < deep; down++) {
        slots[r + down] ??= [];
        for (let right = 0; right < wide; right++) slots[r + down][col + right] = value;
      }
    }
  }
  const width = slots.reduce((widest, row) => Math.max(widest, row.length), 0);
  const grid = slots.map((row) => Array.from({ length: width }, (_, c) => row[c] ?? ""));
  while (grid.length && grid[grid.length - 1].every((slot) => slot === "")) grid.pop();
  while (grid[0] && grid.every((row) => row[grid[0].length - 1] === ""))
    for (const row of grid) row.pop();
  if (!grid.some((row) => row.some((slot) => slot !== ""))) return; // no data cells: not data
  return grid;
}

// A cell's text: nested markup reduces to its text, a `<br>` or block boundary becomes a
// single space (so a cell never gains a newline), and whitespace runs collapse.
const BLOCK =
  /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|UL)$/;

function cellText(cell: Element): string {
  return textOf(cell).replace(/\s+/g, " ").trim();
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as Element;
  if (element.tagName === "BR") return " ";
  if (element.tagName === "SCRIPT" || element.tagName === "STYLE") return "";
  const text = [...element.childNodes].map(textOf).join("");
  return BLOCK.test(element.tagName) ? ` ${text} ` : text;
}

// Plain text: a tab between cells and a newline between rows is the spreadsheet shape;
// then a markdown table; then CSV. A paste with none of those yields one cell, which
// stays in the focused cell rather than replacing the pad.
function parsePlain(text: string): Parsed {
  if (text.includes("\t")) return { kind: "grid", grid: normalize(parseTSV(text)) };
  const markdown = parseMarkdown(text);
  if (markdown) return { kind: "grid", grid: markdown };
  const csv = parseCSV(text);
  if (csv) return { kind: "grid", grid: csv };
  return { kind: "cell", value: text };
}

// A tab between cells, newline between rows (what Excel and Sheets copy as plain text).
// The trailing newline the clipboard adds would become an empty last row otherwise.
function parseTSV(text: string): Grid {
  return text
    .replace(/\r?\n$/, "")
    .split(/\r?\n/)
    .map((line) => line.split("\t"));
}

// A markdown table: rows between `|` with a delimiter row (e.g. `|---|`) separating the
// header from the body; the delimiter row is dropped, so the grid has the source shape.
function parseMarkdown(text: string): Grid | undefined {
  const lines = text.replace(/\r?\n$/, "").split(/\r?\n/);
  const delimiterIndex = lines.findIndex(isDelimiterRow);
  if (delimiterIndex < 1) return; // no delimiter row, or nothing above it
  const rows = [...lines.slice(0, delimiterIndex), ...lines.slice(delimiterIndex + 1)]
    .filter((line) => line.includes("|"))
    .map(splitMarkdownRow);
  if (rows.length === 0) return;
  return normalize(rows);
}

// `|---|` or `| :---: |` — a row of dashes between `|`s, with optional colons.
function isDelimiterRow(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
}

// Cells between `|`, trimmed; the row's own leading/trailing `|` is not a cell edge.
function splitMarkdownRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

// A comma between cells; a cell that starts with `"` holds commas and doubled quotes
// literally until its closing `"` (the CSV shape). Returns undefined when the text
// parses to one cell — no comma, so it is not CSV.
function parseCSV(text: string): Grid | undefined {
  text = text.replace(/\r?\n$/, ""); // the file's trailing newline would add a spurious row
  const rows: Grid = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false; // inside a quoted cell
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'; // doubled quote: one literal quote
          i += 2;
        } else {
          quoted = false;
          i += 1;
        }
      } else {
        cell += char;
        i += 1;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
      i += 1;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
      i += 1;
    } else if (char === "\r" && text[i + 1] === "\n") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      i += 2;
    } else if (char === "\n" || char === "\r") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      i += 1;
    } else {
      cell += char;
      i += 1;
    }
  }
  row.push(cell);
  rows.push(row);
  if (!rows.some((cells) => cells.length > 1)) return; // no comma: not CSV
  return normalize(rows);
}
