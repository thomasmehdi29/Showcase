import { useMemo, useState } from "react";
import CategorySidebar from "../components/CategorySidebar";
import EventCard from "../components/EventCard";
import ShowcaseMap from "../components/ShowcaseMap";
import { eventCategories, sortCategories } from "../lib/categories";

export default function EventsPage({ events, loading }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(
    () => sortCategories([...eventCategories, ...events.map((event) => event.category)]),
    [events],
  );

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = events.filter((event) => event.category === category).length;
      return acc;
    }, {});
  }, [categories, events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesCategory = !selectedCategory || event.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }
      if (!q) {
        return true;
      }

      return (
        event.title.toLowerCase().includes(q) ||
        (event.description ?? "").toLowerCase().includes(q) ||
        (event.vendorName ?? "").toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q)
      );
    });
  }, [events, query, selectedCategory]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Browse Events</p>
        <h2 className="font-display text-3xl text-ink">Showcases, markets, workshops, and pop-ups</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Explore what is happening around the city and click through to see event details and vendor hosts.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar
          categories={categories}
          counts={categoryCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          title="Event Categories"
          subtitle="Filter showcases and pop-ups"
        />

        <div className="min-w-0">
          <input
            className="w-full rounded-xl border border-ink/20 px-4 py-3 text-sm text-ink outline-none ring-moss transition focus:ring-2"
            placeholder="Search by event, host, category, or keyword"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="mt-4">
            <ShowcaseMap vendors={[]} events={filteredEvents} height="420px" />
          </div>

          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-2xl bg-white shadow-soft" />
                ))
              : filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </section>

          {!loading && filteredEvents.length === 0 && (
            <p className="mt-3 text-sm text-ink/70">No events match your current search and category filter.</p>
          )}
        </div>
      </section>
    </main>
  );
}
