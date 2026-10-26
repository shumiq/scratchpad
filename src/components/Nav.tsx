import { useLocation } from "@solidjs/router";

const links = [
  { href: "/", label: "Notepad" },
  { href: "/table", label: "Table Pad" },
  { href: "/image", label: "Image Pad" },
];

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";
  return (
    <nav class="bg-sky-800">
      <ul class="container flex items-center p-3 text-gray-200">
        {links.map((link) => (
          <li class={`border-b-2 ${active(link.href)} mx-1.5 sm:mx-6`}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
