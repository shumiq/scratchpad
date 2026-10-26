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

// Simple tables only: rows of `<tr>`, cells of `<td>`/`<th>` with their text; merged
// cells, nested markup and layout tables are task 10's hardening.
function parseHtmlTable(html: string): Grid | undefined {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.querySelector("table");
  if (!table) return;
  const rows = [...table.querySelectorAll("tr")].map((tr) =>
    [...tr.querySelectorAll("td, th")].map((cell) => (cell.textContent ?? "").trim()),
  );
  if (rows.length === 0) return;
  return normalize(rows);
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
