import { Index, createMemo, createSignal, onMount } from "solid-js";

export default function Notepad() {
  const [text, setText] = createSignal("");
  const lines = createMemo(() => text().split("\n"));
  let area!: HTMLTextAreaElement;
  let mirror!: HTMLDivElement;

  const syncScroll = () => {
    mirror.style.transform = `translate(${-area.scrollLeft}px, ${-area.scrollTop}px)`;
  };

  onMount(() => {
    // Reserve the textarea's scrollbar inside the mirror so both wrap at the same width.
    mirror.style.right = `${area.offsetWidth - area.clientWidth}px`;
    syncScroll();
    area.focus();
  });

  return (
    <main class="relative h-full overflow-hidden bg-cream font-mono text-body leading-5 text-primary-dark">
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
        onInput={(event) => setText(event.currentTarget.value)}
        onScroll={syncScroll}
      />
    </main>
  );
}
