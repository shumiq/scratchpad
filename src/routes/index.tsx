import { Index, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { renderMarkdown } from "~/lib/markdown";
import { NOTEPAD_KEY, load, save } from "~/lib/storage";

const SAVE_ERRORS = {
  quota: "Not saved: browser storage is full.",
  unavailable: "Not saved: browser storage is unavailable.",
  invalid: "Not saved: this note couldn't be stored.",
} as const;

export default function Notepad() {
  const [text, setText] = createSignal("");
  const [preview, setPreview] = createSignal("");
  const [saveError, setSaveError] = createSignal<keyof typeof SAVE_ERRORS | null>(null);
  const lines = createMemo(() => text().split("\n"));
  let area!: HTMLTextAreaElement;
  let mirror!: HTMLDivElement;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;
  let touched = false;
  let saved: string | undefined;

  const syncScroll = () => {
    mirror.style.transform = `translate(${-area.scrollLeft}px, ${-area.scrollTop}px)`;
  };

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    const value = text();
    if (value === saved) return;
    const result = save(NOTEPAD_KEY, value);
    if (result.ok) {
      saved = value;
      setSaveError(null);
    } else {
      setSaveError(result.reason);
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, 300);
  };

  // Throttle, not debounce: the first keystroke of a burst schedules one render, so the
  // preview keeps up while typing and never runs on every keystroke.
  const schedulePreview = () => {
    if (previewTimer !== undefined) return;
    previewTimer = setTimeout(() => {
      previewTimer = undefined;
      setPreview(renderMarkdown(text()));
    }, 150);
  };

  const flushWhenHidden = () => {
    if (document.visibilityState === "hidden") flush();
  };

  onMount(() => {
    const stored = load(NOTEPAD_KEY, "", (value): value is string => typeof value === "string");
    saved = stored.value;
    // An uncontrolled textarea keeps text typed before hydration; never overwrite it.
    if (!touched && area.value === "") {
      setText(stored.value);
      area.value = stored.value;
    } else {
      setText(area.value);
      touched = true;
    }
    setPreview(renderMarkdown(text()));

    // Reserve the textarea's scrollbar inside the mirror so both wrap at the same width.
    mirror.style.right = `${area.offsetWidth - area.clientWidth}px`;
    syncScroll();
    area.focus();

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flushWhenHidden);
  });

  onCleanup(() => {
    window.removeEventListener("pagehide", flush);
    document.removeEventListener("visibilitychange", flushWhenHidden);
    clearTimeout(previewTimer);
    flush();
  });

  return (
    <main class="flex h-full flex-col overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
      <Show when={saveError()}>
        {(reason) => (
          <p
            role="alert"
            class="shrink-0 border-b border-coral bg-cream px-3 py-2 text-caption font-medium text-coral-dark"
          >
            {SAVE_ERRORS[reason()]}
          </p>
        )}
      </Show>
      <div class="grid min-h-0 flex-1 grid-rows-2 overflow-hidden lg:grid-cols-2 lg:grid-rows-1">
        <div class="relative min-h-0 overflow-hidden">
          <div
            class="pointer-events-none absolute inset-y-0 left-0 box-border w-16 border-r border-primary/40 bg-primary-bg"
            aria-hidden="true"
          />
          <div
            ref={(el) => (mirror = el)}
            class="pointer-events-none absolute inset-y-0 left-0 right-0 box-border select-none whitespace-pre-wrap break-words py-3 pr-3 pl-16 text-transparent"
            aria-hidden="true"
          >
            <Index each={lines()}>
              {(line, i) => (
                <div class="relative min-h-5">
                  <span class="absolute top-0 right-full pr-3 text-primary-dark">{i + 1}</span>
                  {line()}
                </div>
              )}
            </Index>
          </div>
          <textarea
            ref={(el) => (area = el)}
            aria-label="Note"
            wrap="soft"
            spellcheck={false}
            autocomplete="off"
            class="absolute inset-0 box-border h-full w-full resize-none overflow-y-scroll border-0 bg-transparent py-3 pr-3 pl-16 font-mono text-body leading-5 whitespace-pre-wrap break-words text-primary-dark outline-none"
            onInput={(event) => {
              touched = true;
              setText(event.currentTarget.value);
              schedule();
              schedulePreview();
            }}
            onScroll={syncScroll}
          />
        </div>
        <section
          aria-label="Markdown preview"
          tabindex="0"
          class="min-h-0 overflow-auto border-primary/40 border-t bg-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary lg:border-t-0 lg:border-l"
        >
          <div class="markdown p-4" innerHTML={preview()} />
        </section>
      </div>
    </main>
  );
}
