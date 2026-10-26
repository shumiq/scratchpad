import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center text-primary-dark">
      <h1 class="text-display font-headline tracking-headline uppercase">Not Found</h1>
      <p class="text-caption">That page isn't here. Head back to the notepad.</p>
      <A
        href="/"
        class="inline-flex min-h-11 items-center rounded-round bg-primary-dark px-6 text-body font-bold text-cream shadow-teal-glow transition duration-200 ease-bounce hover:shadow-accent-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark active:scale-95"
      >
        Home
      </A>
    </main>
  );
}
