import { Show, createSignal, onMount, onCleanup } from "solid-js";

type Op =
  | "rotate:90"
  | "rotate:-90"
  | "flip:h"
  | "flip:v"
  | `crop:${number},${number},${number},${number}`;

const HISTORY_LIMIT = 10; // max undo steps kept in memory

export default function ImagePad() {
  const [dims, setDims] = createSignal<{ w: number; h: number } | null>(null);
  const [hint, setHint] = createSignal<string | null>("Paste an image to start");
  const [ops, setOps] = createSignal<Op[]>([]);
  const [cursor, setCursor] = createSignal(0);
  const [crop, setCrop] = createSignal<{ x: number; y: number; w: number; h: number } | null>(null);
  const [capped, setCapped] = createSignal(false);
  let canvas!: HTMLCanvasElement;
  let workArea!: HTMLDivElement;
  let original: CanvasImageSource | null = null;
  let origW = 0;
  let origH = 0;

  const render = () => {
    if (!original) return;
    const applied = ops().slice(0, cursor());
    // compute final size
    let w = origW;
    let h = origH;
    for (const op of applied) {
      if (op === "rotate:90" || op === "rotate:-90") {
        [w, h] = [h, w];
      } else if (op.startsWith("crop:")) {
        const parts = op.slice(5).split(",").map(Number);
        w = parts[2];
        h = parts[3];
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // apply transforms in op order
    let cw = origW;
    let ch = origH;
    for (const op of applied) {
      if (op === "rotate:90") {
        ctx.transform(0, 1, -1, 0, ch, 0);
        [cw, ch] = [ch, cw];
      } else if (op === "rotate:-90") {
        ctx.transform(0, -1, 1, 0, 0, cw);
        [cw, ch] = [ch, cw];
      } else if (op === "flip:h") {
        ctx.transform(-1, 0, 0, 1, cw, 0);
      } else if (op === "flip:v") {
        ctx.transform(1, 0, 0, -1, 0, ch);
      } else if (op.startsWith("crop:")) {
        const parts = op.slice(5).split(",").map(Number);
        const cx = parts[0];
        const cy = parts[1];
        ctx.transform(1, 0, 0, 1, -cx, -cy);
        [cw, ch] = [parts[2], parts[3]];
      }
    }
    ctx.drawImage(original, 0, 0);
    setDims({ w, h });
  };

  const pushOp = (op: Op) => {
    let trimmed = ops().slice(0, cursor()).concat(op);
    let newCursor = trimmed.length;
    let dropped = false;
    if (trimmed.length > HISTORY_LIMIT) {
      trimmed = trimmed.slice(trimmed.length - HISTORY_LIMIT);
      newCursor = trimmed.length;
      dropped = true;
    }
    setOps(trimmed);
    setCursor(newCursor);
    if (dropped) setCapped(true);
    render();
  };

  const undo = () => {
    const min = capped() ? 1 : 0;
    setCursor((c) => Math.max(min, c - 1));
    setCrop(null);
    render();
  };
  const redo = () => {
    setCursor((c) => Math.min(ops().length, c + 1));
    setCrop(null);
    render();
  };

  const paste = async (event: ClipboardEvent) => {
    const data = event.clipboardData;
    const item = data ? Array.from(data.items).find((i) => i.type.startsWith("image/")) : undefined;
    if (!item) {
      setHint("Paste an image to start");
      return;
    }
    event.preventDefault();
    const file = item.getAsFile();
    if (!file) {
      setHint("Paste an image to start");
      return;
    }
    setHint(null);
    try {
      if (typeof createImageBitmap === "function") {
        const bmp = await createImageBitmap(file);
        original = bmp;
      } else {
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("decode failed"));
          img.src = url;
        });
        original = img;
        URL.revokeObjectURL(url);
      }
      origW = (original as { width: number }).width;
      origH = (original as { height: number }).height;
      // history is memory only; reload starts clean
      setOps([]);
      setCursor(0);
      setCapped(false);
      setCrop(null);
      render();
    } catch {
      setHint("Paste an image to start");
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
  };

  let dragStart: { x: number; y: number } | null = null;
  let dragMode: "create" | "move" | null = null;
  let startRect: { x: number; y: number; w: number; h: number } | null = null;

  const toImg = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - r.left) * sx));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - r.top) * sy));
    return { x, y };
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!dims()) return;
    const p = toImg(e);
    const r = crop();
    // resize handle hit (corners)
    if (r) {
      const handles = [
        { name: "nw", x: r.x, y: r.y },
        { name: "n", x: r.x + r.w / 2, y: r.y },
        { name: "ne", x: r.x + r.w, y: r.y },
        { name: "w", x: r.x, y: r.y + r.h / 2 },
        { name: "e", x: r.x + r.w, y: r.y + r.h / 2 },
        { name: "sw", x: r.x, y: r.y + r.h },
        { name: "s", x: r.x + r.w / 2, y: r.y + r.h },
        { name: "se", x: r.x + r.w, y: r.y + r.h },
      ];
      const tol = 8 * (canvas.width / canvas.getBoundingClientRect().width);
      for (const h of handles) {
        if (Math.abs(p.x - h.x) <= tol && Math.abs(p.y - h.y) <= tol) {
          dragMode = "resize:" + h.name;
          dragStart = p;
          startRect = { ...r };
          (e.target as Element).setPointerCapture?.(e.pointerId);
          return;
        }
      }
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        dragMode = "move";
        dragStart = p;
        startRect = { ...r };
        (e.target as Element).setPointerCapture?.(e.pointerId);
        return;
      }
    }
    dragMode = "create";
    dragStart = p;
    setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragMode || !dragStart) return;
    const p = toImg(e);
    const W = canvas.width;
    const H = canvas.height;
    if (dragMode === "create") {
      const x = Math.min(dragStart.x, p.x);
      const y = Math.min(dragStart.y, p.y);
      const w = Math.abs(p.x - dragStart.x);
      const h = Math.abs(p.y - dragStart.y);
      setCrop({ x, y, w, h });
    } else if (dragMode === "move" && startRect) {
      const dx = p.x - dragStart.x;
      const dy = p.y - dragStart.y;
      let x = startRect.x + dx;
      let y = startRect.y + dy;
      x = Math.max(0, Math.min(W - startRect.w, x));
      y = Math.max(0, Math.min(H - startRect.h, y));
      setCrop({ x, y, w: startRect.w, h: startRect.h });
    } else if (dragMode.startsWith("resize:") && startRect) {
      const name = dragMode.split(":")[1];
      let { x, y, w, h } = startRect;
      if (name.includes("e")) {
        w = Math.max(1, Math.min(W - x, p.x - x));
      }
      if (name.includes("w")) {
        const nx = Math.max(0, Math.min(x + w - 1, p.x));
        w = x + w - nx;
        x = nx;
      }
      if (name.includes("s")) {
        h = Math.max(1, Math.min(H - y, p.y - y));
      }
      if (name.includes("n")) {
        const ny = Math.max(0, Math.min(y + h - 1, p.y));
        h = y + h - ny;
        y = ny;
      }
      setCrop({ x, y, w, h });
    }
  };

  const onPointerUp = () => {
    dragMode = null;
    dragStart = null;
    startRect = null;
  };

  const confirmCrop = () => {
    const r = crop();
    if (!r || r.w <= 0 || r.h <= 0) return;
    pushOp(
      `crop:${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}` as Op,
    );
    setCrop(null);
  };
  const cancelCrop = () => setCrop(null);

  onMount(() => {
    workArea.focus();
  });

  onCleanup(() => {});

  return (
    <main class="flex h-full flex-col overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
      <header class="shrink-0 border-b-2 border-dashed border-primary px-3 py-2 flex items-center justify-between gap-2">
        <h1 class="text-h3 font-headline tracking-headline uppercase">Image Pad</h1>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={() => pushOp("rotate:-90")}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Rotate L
          </button>
          <button
            type="button"
            onClick={() => pushOp("rotate:90")}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Rotate R
          </button>
          <button
            type="button"
            onClick={() => pushOp("flip:h")}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Flip H
          </button>
          <button
            type="button"
            onClick={() => pushOp("flip:v")}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Flip V
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={cursor() <= (capped() ? 1 : 0)}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={cursor() >= ops().length}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Redo
          </button>
          <Show when={dims()}>
            {(d) => (
              <span class="text-caption text-primary-dark/70">
                {d().w} × {d().h}
              </span>
            )}
          </Show>
        </div>
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
      <div
        ref={(el) => (workArea = el)}
        tabindex={0}
        onPaste={(e) => void paste(e)}
        onKeyDown={onKeyDown}
        class="min-h-0 flex-1 overflow-auto p-4 outline-none focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div class="relative inline-block">
          <canvas
            ref={(el) => (canvas = el)}
            class="max-w-full touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          <Show when={crop()}>
            {(r) => (
              <div
                class="pointer-events-none absolute border-2 border-coral"
                style={{
                  left: `${(r().x / (dims()?.w ?? 1)) * 100}%`,
                  top: `${(r().y / (dims()?.h ?? 1)) * 100}%`,
                  width: `${(r().w / (dims()?.w ?? 1)) * 100}%`,
                  height: `${(r().h / (dims()?.h ?? 1)) * 100}%`,
                }}
              />
            )}
          </Show>
        </div>
      </div>
      <Show when={crop()}>
        {(r) => (
          <div class="shrink-0 flex items-center gap-2 border-t border-primary/30 px-3 py-2">
            <label class="text-caption">X</label>
            <input
              type="number"
              value={Math.round(r().x)}
              onInput={(e) => setCrop({ ...r(), x: Number(e.currentTarget.value) })}
              class="w-16 rounded border px-1"
            />
            <label class="text-caption">Y</label>
            <input
              type="number"
              value={Math.round(r().y)}
              onInput={(e) => setCrop({ ...r(), y: Number(e.currentTarget.value) })}
              class="w-16 rounded border px-1"
            />
            <label class="text-caption">W</label>
            <input
              type="number"
              value={Math.round(r().w)}
              onInput={(e) => setCrop({ ...r(), w: Number(e.currentTarget.value) })}
              class="w-16 rounded border px-1"
            />
            <label class="text-caption">H</label>
            <input
              type="number"
              value={Math.round(r().h)}
              onInput={(e) => setCrop({ ...r(), h: Number(e.currentTarget.value) })}
              class="w-16 rounded border px-1"
            />
            <button
              type="button"
              onClick={confirmCrop}
              class="rounded-full border border-primary/40 px-3 py-1 text-caption"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={cancelCrop}
              class="rounded-full border border-primary/40 px-3 py-1 text-caption"
            >
              Cancel
            </button>
          </div>
        )}
      </Show>
    </main>
  );
}
