import { useLocation } from "@solidjs/router";

const links = [
  { href: "/", label: "Notepad" },
  { href: "/table", label: "Table Pad" },
  { href: "/image", label: "Image Pad" },
];

export default function Nav() {
  const location = useLocation();
  const active = (path: string) => path === location.pathname;
  return (
    <nav class="h-14 shrink-0 bg-primary-dark">
      <ul class="container flex h-full items-center gap-1 px-3 sm:gap-6">
        {links.map((link) => (
          <li class="flex h-full items-center">
            <a
              href={link.href}
              aria-current={active(link.href) ? "page" : undefined}
              class={`flex min-h-11 items-center rounded-sm border-b-[3px] px-2.5 text-body font-medium transition-colors duration-200 ease-bounce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                active(link.href)
                  ? "border-gold text-cream"
                  : "border-transparent text-cream hover:text-primary-light"
              }`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
