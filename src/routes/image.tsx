import { Show, createSignal, onMount } from "solid-js";

export default function ImagePad() {
  const [dims, setDims] = createSignal<{ w: number; h: number } | null>(null);
  const [hint, setHint] = createSignal<string | null>("Paste an image to start");
  let canvas!: HTMLCanvasElement;
  let workArea!: HTMLDivElement;

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
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, bmp.width, bmp.height);
        ctx?.drawImage(bmp, 0, 0);
        bmp.close?.();
        setDims({ w: bmp.width, h: bmp.height });
      } else {
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("decode failed"));
          img.src = url;
        });
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
      }
    } catch {
      setHint("Paste an image to start");
    }
  };

  onMount(() => {
    workArea.focus();
  });

  return (
    <main class="flex h-full flex-col overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
      <header class="shrink-0 border-b-2 border-dashed border-primary px-3 py-2 flex items-center justify-between">
        <h1 class="text-h3 font-headline tracking-headline uppercase">Image Pad</h1>
        <Show when={dims()}>
          {(d) => (
            <span class="text-caption text-primary-dark/70">
              {d().w} × {d().h}
            </span>
          )}
        </Show>
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
        class="min-h-0 flex-1 overflow-auto p-4 outline-none focus-visible:outline-2 focus-visible:outline-primary"
      >
        <canvas ref={(el) => (canvas = el)} class="max-w-full" />
      </div>
    </main>
  );
}
