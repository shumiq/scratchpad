// Small markdown subset for the notepad preview: headings, lists, bold, inline code,
// fenced code and links. Everything from the source — including raw HTML — is escaped,
// and link targets are limited to http, https and mailto.

const esc = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const SAFE_HREF = /^(https?:|mailto:)/i;
const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d{1,9}[.)])\s+/;

// shortcut: a line with many unmatched [ or ** re-scans its tail, so inline parsing is
// O(n^2) on that shape; upgrade to a state machine if such a paste ever shows up.
function inline(source: string): string {
  let html = "";
  let plain = "";
  let i = 0;
  const flush = () => {
    html += esc(plain);
    plain = "";
  };

  while (i < source.length) {
    const char = source[i];
    if (char === "`") {
      const end = source.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        html += `<code>${esc(source.slice(i + 1, end))}</code>`;
        i = end + 1;
        continue;
      }
    } else if (char === "*" && source[i + 1] === "*") {
      const end = source.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        html += `<strong>${inline(source.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    } else if (char === "[") {
      const label = source.indexOf("]", i + 1);
      const opening = label === -1 || source[label + 1] !== "(" ? -1 : label + 1;
      const closing = opening === -1 ? -1 : source.indexOf(")", opening + 1);
      if (closing !== -1) {
        const href = source.slice(opening + 1, closing).trim();
        flush();
        html += SAFE_HREF.test(href)
          ? `<a href="${esc(href)}" target="_blank" rel="noreferrer noopener">${inline(source.slice(i + 1, label))}</a>`
          : esc(source.slice(i, closing + 1)); // unsafe scheme: show the markdown as text
        i = closing + 1;
        continue;
      }
    }
    plain += char;
    i += 1;
  }
  flush();
  return html;
}

export function renderMarkdown(source: string): string {
  const lines = source.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const marker = fence[1];
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith(marker)) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence, or past the end
      html += `<pre><code>${esc(code.join("\n"))}</code></pre>`;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2].trim())}</h${level}>`;
      i += 1;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(LIST_ITEM, "").trim())}</li>`);
        i += 1;
      }
      const tag = /^\s*\d/.test(line) ? "ol" : "ul";
      html += `<${tag}>${items.join("")}</${tag}>`;
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !LIST_ITEM.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    html += `<p>${inline(paragraph.join("\n"))}</p>`;
  }

  return html;
}
