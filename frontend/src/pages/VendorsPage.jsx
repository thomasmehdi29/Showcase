import { useMemo, useState } from "react";
import CategorySidebar from "../components/CategorySidebar";
import VendorCard from "../components/VendorCard";
import { sortCategories, vendorCategories } from "../lib/categories";

export default function VendorsPage({ vendors, loading }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(
    () => sortCategories([...vendorCategories, ...vendors.map((vendor) => vendor.category)]),
    [vendors],
  );

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = vendors.filter((vendor) => vendor.category === category).length;
      return acc;
    }, {});
  }, [categories, vendors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesCategory = !selectedCategory || vendor.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }
      if (!q) {
        return true;
      }

      return (
        vendor.name.toLowerCase().includes(q) ||
        vendor.category.toLowerCase().includes(q) ||
        (vendor.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory, vendors]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Browse Vendors</p>
        <h2 className="font-display text-3xl text-ink">Local businesses and artisans</h2>
        <p className="mt-2 text-sm text-ink/70">Search by keyword and narrow results by category.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar
          categories={categories}
          counts={categoryCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          title="Vendor Categories"
          subtitle="Filter local businesses"
        />

        <div className="min-w-0">
          <input
            className="w-full rounded-xl border border-ink/20 px-4 py-3 text-sm text-ink outline-none ring-moss transition focus:ring-2"
            placeholder="Search by name, category, or keyword"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-2xl bg-white shadow-soft" />
                ))
              : filtered.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
          </section>

          {!loading && filtered.length === 0 && (
            <p className="mt-3 text-sm text-ink/70">No vendors match your current search and category filter.</p>
          )}
        </div>
      </section>
    </main>
  );
}
