const products = [
  { name: "Seasonal Produce Box", vendor: "Green Fork Farm", price: "$28" },
  { name: "Stoneware Mug", vendor: "Clay & Ember Studio", price: "$32" },
  { name: "Cold Brew Growler", vendor: "Drift Coffee Cart", price: "$16" },
  { name: "Vintage Denim Jacket", vendor: "North Loop Vintage", price: "$64" },
];

export default function MarketplacePlaceholder() {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-ink/60">Marketplace</p>
          <h2 className="font-display text-2xl text-ink">Community Picks</h2>
        </div>
        <span className="rounded-full bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">Placeholder Catalog</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <article key={product.name} className="rounded-2xl border border-ink/10 bg-canvas p-4">
            <div className="mb-3 h-24 rounded-xl bg-gradient-to-br from-moss/20 via-ocean/20 to-ember/20" />
            <h3 className="font-semibold text-ink">{product.name}</h3>
            <p className="text-sm text-ink/70">{product.vendor}</p>
            <p className="mt-2 font-display text-xl text-ink">{product.price}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
