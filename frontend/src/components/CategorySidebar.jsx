import { colorForCategory } from "../lib/categories";

function buttonClasses(active) {
  return [
    "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition",
    active
      ? "border-ink bg-ink text-canvas shadow-soft"
      : "border-ink/15 bg-white text-ink hover:border-ink/40 hover:bg-canvas",
  ].join(" ");
}

export default function CategorySidebar({
  categories = [],
  counts = {},
  selectedCategory = "",
  onSelectCategory,
  title = "Category Filters",
  subtitle = "Focus map and list results",
}) {
  const totalCount = categories.reduce((sum, category) => sum + (counts[category] ?? 0), 0);

  return (
    <aside className="rounded-3xl border border-ink/10 bg-white p-4 shadow-soft lg:sticky lg:top-24 lg:h-fit">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/65">{title}</p>
      <p className="mt-1 text-sm text-ink/70">{subtitle}</p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        <button className={buttonClasses(!selectedCategory)} onClick={() => onSelectCategory("")} type="button">
          <span>All categories</span>
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-inherit">{totalCount}</span>
        </button>

        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button key={category} className={buttonClasses(active)} onClick={() => onSelectCategory(category)} type="button">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorForCategory(category) }} />
                <span>{category}</span>
              </span>
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-inherit">{counts[category] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
