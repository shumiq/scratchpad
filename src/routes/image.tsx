import { Show, createSignal, onMount, onCleanup } from "solid-js";
import { IMAGE_KEY, load, save, encodedSize } from "~/lib/storage";

type Op =
  | "rotate:90"
  | "rotate:-90"
  | "flip:h"
  | "flip:v"
  | `crop:${number},${number},${number},${number}`
  | `resize:${number},${number}`;

const HISTORY_LIMIT = 10; // max undo steps kept in memory
const IMAGE_LIMIT = 2 * 1024 * 1024; // 2 MB

type SaveState = "saved" | "oversized" | "corrupt" | null;

export default function ImagePad() {
  const [dims, setDims] = createSignal<{ w: number; h: number } | null>(null);
  const [hint, setHint] = createSignal<string | null>("Paste an image to start");
  const [ops, setOps] = createSignal<Op[]>([]);
  const [cursor, setCursor] = createSignal(0);
  const [crop, setCrop] = createSignal<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isCropMode, setIsCropMode] = createSignal(false);
  const [capped, setCapped] = createSignal(false);
  const [resizeW, setResizeW] = createSignal(0);
  const [resizeH, setResizeH] = createSignal(0);
  const [locked, setLocked] = createSignal(true);
  const [resizeWarn, setResizeWarn] = createSignal(false);
  const [copyMsg, setCopyMsg] = createSignal<string | null>(null);
  const [saveState, setSaveState] = createSignal<SaveState>(null);
  let canvas!: HTMLCanvasElement;
  let workArea!: HTMLDivElement;
  let original: CanvasImageSource | null = null;
  let origW = 0;
  let origH = 0;
  let sourceName = "";
  let savedDataUrl: string | null = null;

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
      } else if (op.startsWith("resize:")) {
        const parts = op.slice(7).split(",").map(Number);
        w = parts[0];
        h = parts[1];
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
        const m = ctx.getTransform();
        ctx.setTransform(new DOMMatrix().translate(-cx, -cy).multiply(m));
        [cw, ch] = [parts[2], parts[3]];
      } else if (op.startsWith("resize:")) {
        const parts = op.slice(7).split(",").map(Number);
        const nw = parts[0];
        const nh = parts[1];
        ctx.scale(nw / cw, nh / ch);
        [cw, ch] = [nw, nh];
      }
    }
    ctx.drawImage(original, 0, 0);
    setDims({ w, h });
    scheduleSave();
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

  const flush = () => {
    if (!original || !dims()) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl === savedDataUrl) return;
    const size = encodedSize(dataUrl);
    if (size > IMAGE_LIMIT) {
      setSaveState("oversized");
      return;
    }
    const result = save(IMAGE_KEY, dataUrl);
    if (result.ok) {
      savedDataUrl = dataUrl;
      setSaveState("saved");
    } else {
      setSaveState("corrupt");
    }
  };

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 300);
  };

  const flushWhenHidden = () => {
    if (document.visibilityState === "hidden") flush();
  };

  const undo = () => {
    const min = capped() ? 1 : 0;
    setCursor((c) => Math.max(min, c - 1));
    setCrop(null);
    render();
    const d = dims();
    if (d) {
      setResizeW(d.w);
      setResizeH(d.h);
    }
    setResizeWarn(false);
  };
  const redo = () => {
    setCursor((c) => Math.min(ops().length, c + 1));
    setCrop(null);
    render();
    const d = dims();
    if (d) {
      setResizeW(d.w);
      setResizeH(d.h);
    }
    setResizeWarn(false);
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
    sourceName = file.name || "";
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
      setResizeW(origW);
      setResizeH(origH);
      setResizeWarn(false);
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
    if (!dims() || !isCropMode()) return;
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

  const toggleCropMode = () => {
    if (isCropMode()) {
      setIsCropMode(false);
      setCrop(null);
    } else {
      setIsCropMode(true);
    }
  };
  const confirmCrop = () => {
    const r = crop();
    if (!r || r.w <= 0 || r.h <= 0) return;
    pushOp(
      `crop:${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}` as Op,
    );
    setCrop(null);
  };
  const cancelCrop = () => {
    setCrop(null);
    setIsCropMode(false);
  };

  const confirmResize = () => {
    const d = dims();
    if (!d) return;
    const w = Math.round(resizeW());
    const h = Math.round(resizeH());
    if (w <= 0 || h <= 0) return;
    const extreme = w > d.w * 2 || h > d.h * 2;
    if (extreme && !resizeWarn()) {
      setResizeWarn(true);
      return;
    }
    pushOp(`resize:${w},${h}` as Op);
    setResizeWarn(false);
  };

  const exportName = (ext: string) => {
    if (sourceName) {
      const base = sourceName.replace(/\.[^/.]+$/, "");
      return `${base}.${ext}`;
    }
    return `image-${Date.now()}.${ext}`;
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    if (!canvas || !dims()) return;
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, exportName("png"));
    }, "image/png");
  };

  const copyImage = () => {
    if (!canvas || !dims()) return;
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCopyMsg("Could not create image");
        return;
      }
      const canClipboard =
        typeof ClipboardItem !== "undefined" &&
        typeof navigator !== "undefined" &&
        !!navigator.clipboard &&
        window.isSecureContext;
      if (canClipboard) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopyMsg("Copied to clipboard");
          return;
        } catch {
          // fall through to download
        }
      }
      downloadBlob(blob, exportName("png"));
      setCopyMsg(
        canClipboard
          ? "Clipboard write failed; downloaded PNG instead."
          : "Clipboard unavailable (needs HTTPS); downloaded PNG instead.",
      );
    }, "image/png");
  };

  const exportJpg = () => {
    if (!canvas || !dims()) return;
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, off.width, off.height);
      ctx.drawImage(canvas, 0, 0);
    }
    off.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, exportName("jpg"));
      },
      "image/jpeg",
      0.9,
    );
  };

  onMount(() => {
    workArea.focus();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
    // registered inside onMount so it only runs on the client, never during SSR disposal
    onCleanup(() => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      clearTimeout(saveTimer);
      flush();
    });

    // Load stored image
    const stored = load(
      IMAGE_KEY,
      null,
      (value): value is string =>
        typeof value === "string" &&
        value.startsWith("data:image/") &&
        // refuse oversized stored values too: they can only come from outside the app
        value.length <= IMAGE_LIMIT,
    );
    if (stored.value) {
      const img = new Image();
      img.onload = () => {
        original = img;
        origW = img.width;
        origH = img.height;
        sourceName = "restored";
        setOps([]);
        setCursor(0);
        setCapped(false);
        setCrop(null);
        savedDataUrl = stored.value;
        render();
        setResizeW(origW);
        setResizeH(origH);
        setResizeWarn(false);
        setSaveState("saved");
      };
      img.onerror = () => {
        setHint("Stored image was invalid; started empty.");
        setSaveState("corrupt");
      };
      img.src = stored.value;
    } else if (stored.corrupt) {
      setHint("Stored image was invalid; started empty.");
      setSaveState("corrupt");
    }
  });

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
          <button
            type="button"
            onClick={toggleCropMode}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
            classList={{ "bg-primary-bg": isCropMode() }}
          >
            Crop
          </button>
          <button
            type="button"
            onClick={copyImage}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={exportPng}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Export PNG
          </button>
          <button
            type="button"
            onClick={exportJpg}
            disabled={!dims()}
            class="rounded-full border border-primary/40 px-3 py-1 text-caption font-medium text-primary-dark hover:bg-primary-bg disabled:opacity-40"
          >
            Export JPG
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
      <Show when={copyMsg()}>
        {(message) => (
          <p
            role="status"
            class="shrink-0 border-b border-primary/30 bg-cream px-3 py-2 text-caption font-medium text-primary-dark"
          >
            {message()}
          </p>
        )}
      </Show>
      <Show when={saveState()}>
        {(state) => (
          <p
            role="status"
            class="shrink-0 border-b px-3 py-2 text-caption font-medium"
            classList={{
              "bg-primary-bg border-primary/30 text-primary-dark": state() === "saved",
              "bg-coral/10 border-coral text-coral-dark": state() === "oversized",
              "bg-error/10 border-error text-error": state() === "corrupt",
            }}
          >
            {state() === "saved" && "Saved"}
            {state() === "oversized" && "Not saved — over 2 MB, lost when you leave or reload"}
            {state() === "corrupt" && "Not saved"}
          </p>
        )}
      </Show>
      <Show when={dims()}>
        {(d) => (
          <div class="shrink-0 flex flex-wrap items-center gap-2 border-b border-primary/30 px-3 py-2">
            <label class="text-caption">W</label>
            <input
              type="number"
              value={resizeW()}
              onInput={(e) => {
                const v = Number(e.currentTarget.value);
                setResizeW(v);
                if (locked()) {
                  const ratio = d().h / d().w;
                  setResizeH(Math.round(v * ratio));
                }
              }}
              class="w-20 rounded border px-1"
            />
            <label class="text-caption">H</label>
            <input
              type="number"
              value={resizeH()}
              onInput={(e) => {
                const v = Number(e.currentTarget.value);
                setResizeH(v);
                if (locked()) {
                  const ratio = d().w / d().h;
                  setResizeW(Math.round(v * ratio));
                }
              }}
              class="w-20 rounded border px-1"
            />
            <label class="text-caption flex items-center gap-1">
              <input
                type="checkbox"
                checked={locked()}
                onChange={(e) => setLocked(e.currentTarget.checked)}
              />
              lock
            </label>
            <button
              type="button"
              onClick={confirmResize}
              class="rounded-full border border-primary/40 px-3 py-1 text-caption"
            >
              {resizeWarn() ? "Proceed" : "Resize"}
            </button>
            <Show when={resizeWarn()}>
              <span class="text-caption text-coral-dark">
                Output over 2× source size; click Proceed to continue.
              </span>
            </Show>
          </div>
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
