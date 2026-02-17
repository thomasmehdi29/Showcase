import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Discover" },
  { to: "/vendors", label: "Vendors" },
  { to: "/events", label: "Events" },
  { to: "/community", label: "Community Board" },
  { to: "/vendors/new", label: "Register Vendor" },
  { to: "/showcases/new", label: "Create Showcase" },
];

function linkClass({ isActive }) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive ? "bg-ink text-canvas" : "text-ink hover:bg-white/70",
  ].join(" ");
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/70">Showcase</p>
          <h1 className="font-display text-2xl text-ink">Local Discovery Marketplace</h1>
        </div>
        <nav className="hidden gap-2 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:hidden">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
