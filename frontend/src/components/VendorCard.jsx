import { Link } from "react-router-dom";
import { colorForCategory } from "../lib/categories";

export default function VendorCard({ vendor }) {
  const badgeColor = colorForCategory(vendor.category);

  return (
    <article className="animate-rise overflow-hidden rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
      {vendor.imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-ink/10">
          <img
            alt={`${vendor.name} profile`}
            className="h-40 w-full object-cover transition duration-500 hover:scale-[1.03]"
            loading="lazy"
            src={vendor.imageUrl}
          />
        </div>
      ) : (
        <div className="mb-4 h-40 rounded-xl bg-gradient-to-br from-moss/30 via-ocean/25 to-ember/25" />
      )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink">{vendor.name}</h3>
          <p className="text-sm text-ink/70">{vendor.description}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: badgeColor }}>
          {vendor.category}
        </span>
      </div>
      <p className="text-sm text-ink/70">
        {vendor.location
          ? `${vendor.location.address ?? ""} ${vendor.location.city ?? ""} ${vendor.location.state ?? ""}`.trim()
          : "No location listed"}
      </p>
      <div className="mt-4 flex items-center justify-between text-sm">
        {vendor.email ? (
          <a className="text-ocean hover:underline" href={`mailto:${vendor.email}`}>
            {vendor.email}
          </a>
        ) : (
          <span className="text-ink/60">No email</span>
        )}
        <Link className="font-semibold text-moss hover:text-ink" to={`/vendors/${vendor.id}`}>
          View profile
        </Link>
      </div>
    </article>
  );
}
