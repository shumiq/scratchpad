import { Show, createSignal, onMount, onCleanup } from "solid-js";

type Op = "rotate:90" | "rotate:-90" | "flip:h" | "flip:v";

const HISTORY_LIMIT = 10; // max undo steps kept in memory

export default function ImagePad() {
  const [dims, setDims] = createSignal<{ w: number; h: number } | null>(null);
  const [hint, setHint] = createSignal<string | null>("Paste an image to start");
  const [ops, setOps] = createSignal<Op[]>([]);
  const [cursor, setCursor] = createSignal(0);
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
    render();
  };

  const redo = () => {
    setCursor((c) => Math.min(ops().length, c + 1));
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
        <canvas ref={(el) => (canvas = el)} class="max-w-full" />
      </div>
    </main>
  );
}
