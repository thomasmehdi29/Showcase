import { Link } from "react-router-dom";
import { colorForCategory } from "../lib/categories";

function formatDate(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventCard({ event }) {
  const badgeColor = colorForCategory(event.category);

  return (
    <article className="animate-rise rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink">{event.title}</h3>
          <p className="text-sm text-ink/70">Hosted by {event.vendorName}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: badgeColor }}>
          {event.category}
        </span>
      </div>
      <p className="mb-3 text-sm text-ink/80">{event.description}</p>
      <div className="space-y-1 text-sm text-ink/70">
        <p>
          <span className="font-semibold text-ink">Starts:</span> {formatDate(event.startDate)}
        </p>
        <p>
          <span className="font-semibold text-ink">Ends:</span> {formatDate(event.endDate)}
        </p>
        <p>
          <span className="font-semibold text-ink">Where:</span>{" "}
          {event.location
            ? `${event.location.name ?? ""}, ${event.location.city ?? ""} ${event.location.state ?? ""}`
            : "Location TBD"}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link className="font-semibold text-moss hover:text-ink" to={`/events/${event.id}`}>
          View event
        </Link>
        <Link className="font-semibold text-ocean hover:text-ink" to={`/vendors/${event.vendorId}`}>
          View vendor
        </Link>
      </div>
    </article>
  );
}
