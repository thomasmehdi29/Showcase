import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CategorySidebar from "../components/CategorySidebar";
import ShowcaseMap from "../components/ShowcaseMap";
import VendorCard from "../components/VendorCard";
import EventCard from "../components/EventCard";
import MarketplacePlaceholder from "../components/MarketplacePlaceholder";
import { eventCategories, sortCategories, vendorCategories } from "../lib/categories";

export default function HomePage({ vendors, events, loading, error, refresh }) {
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    return sortCategories([
      ...vendorCategories,
      ...eventCategories,
      ...vendors.map((vendor) => vendor.category),
      ...events.map((event) => event.category),
    ]);
  }, [vendors, events]);

  const categoryCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      const vendorCount = vendors.filter((vendor) => vendor.category === category).length;
      const eventCount = events.filter((event) => event.category === category).length;
      acc[category] = vendorCount + eventCount;
      return acc;
    }, {});
  }, [categories, vendors, events]);

  const filteredVendors = useMemo(() => {
    if (!selectedCategory) {
      return vendors;
    }
    return vendors.filter((vendor) => vendor.category === selectedCategory);
  }, [selectedCategory, vendors]);

  const filteredEvents = useMemo(() => {
    if (!selectedCategory) {
      return events;
    }
    return events.filter((event) => event.category === selectedCategory);
  }, [selectedCategory, events]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-white via-canvas to-moss/15 p-7 shadow-soft">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-ember/25 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-ocean/25 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.24em] text-ink/70">Map-First Community Marketplace</p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
          Discover local vendors, artisans, farms, and pop-ups around you.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink/75">
          Showcase helps communities find nearby makers and events, while giving vendors a place to launch and manage local showcases.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-canvas" to="/vendors/new">
            Register as a vendor
          </Link>
          <Link className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-semibold text-ink" to="/showcases/new">
            Create a showcase event
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load data: {error}
          <button className="ml-3 font-semibold underline" onClick={refresh} type="button">
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CategorySidebar
          categories={categories}
          counts={categoryCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          title="Discover Categories"
          subtitle="Filter vendors and events together"
        />

        <div className="flex min-w-0 flex-col gap-8">
          {selectedCategory && (
            <div className="rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink/80">
              Showing results for <span className="font-semibold text-ink">{selectedCategory}</span>
              <button className="ml-3 font-semibold text-moss hover:text-ink" onClick={() => setSelectedCategory("")} type="button">
                Clear filter
              </button>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/60">Vendors</p>
              <p className="font-display text-4xl text-ink">{filteredVendors.length}</p>
              <p className="text-sm text-ink/65">Registered local businesses</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/60">Events</p>
              <p className="font-display text-4xl text-ink">{filteredEvents.length}</p>
              <p className="text-sm text-ink/65">Upcoming showcases and pop-ups</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-ink/60">Community</p>
              <p className="font-display text-4xl text-ink">Live</p>
              <p className="text-sm text-ink/65">Explore and connect in your city</p>
            </article>
          </section>

          <ShowcaseMap vendors={filteredVendors} events={filteredEvents} height="520px" />

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-ink/70">Featured</p>
                <h3 className="font-display text-3xl text-ink">Vendors Nearby</h3>
              </div>
              <Link className="text-sm font-semibold text-moss" to="/vendors">
                Browse all vendors
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-52 animate-pulse rounded-2xl bg-white shadow-soft" />
                  ))
                : filteredVendors.slice(0, 3).map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
            </div>
            {!loading && filteredVendors.length === 0 && (
              <p className="mt-3 text-sm text-ink/70">No vendors found for this category.</p>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-ink/70">Upcoming</p>
                <h3 className="font-display text-3xl text-ink">Event Highlights</h3>
              </div>
              <Link className="text-sm font-semibold text-moss" to="/events">
                Browse all events
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-52 animate-pulse rounded-2xl bg-white shadow-soft" />
                  ))
                : filteredEvents.slice(0, 3).map((event) => <EventCard key={event.id} event={event} />)}
            </div>
            {!loading && filteredEvents.length === 0 && (
              <p className="mt-3 text-sm text-ink/70">No events found for this category.</p>
            )}
          </section>
        </div>
      </section>

      <MarketplacePlaceholder />
    </main>
  );
}
