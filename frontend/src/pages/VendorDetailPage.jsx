import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ShowcaseMap from "../components/ShowcaseMap";
import EventCard from "../components/EventCard";
import { api } from "../lib/api";
import { colorForCategory } from "../lib/categories";

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVendor() {
      setLoading(true);
      setError("");

      try {
        const data = await api.getVendorById(vendorId);
        if (active) {
          setVendor(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVendor();

    return () => {
      active = false;
    };
  }, [vendorId]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <div className="h-64 animate-pulse rounded-3xl bg-white shadow-soft" />
      </main>
    );
  }

  if (error || !vendor) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Vendor not found"}</div>
      </main>
    );
  }

  const categoryColor = colorForCategory(vendor.category);
  const socialLinks = [
    { label: "Instagram", href: vendor.instagramUrl },
    { label: "Facebook", href: vendor.facebookUrl },
    { label: "TikTok", href: vendor.tiktokUrl },
  ].filter((link) => Boolean(link.href));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
        {vendor.imageUrl ? (
          <img alt={vendor.name} className="h-56 w-full object-cover" src={vendor.imageUrl} />
        ) : (
          <div className="h-56 w-full bg-gradient-to-br from-moss/30 via-ocean/30 to-ember/25" />
        )}
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl text-ink">{vendor.name}</h2>
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: categoryColor }}>
              {vendor.category}
            </span>
          </div>
          <p className="max-w-3xl text-sm text-ink/75">{vendor.description}</p>
          <div className="mt-4 grid gap-2 text-sm text-ink/70 md:grid-cols-2">
            <p>
              <span className="font-semibold text-ink">Email:</span> {vendor.email || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-ink">Phone:</span> {vendor.phone || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-ink">Website:</span>{" "}
              {vendor.website ? (
                <a className="text-ocean underline" href={vendor.website} rel="noreferrer" target="_blank">
                  {vendor.website}
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p>
              <span className="font-semibold text-ink">Primary location:</span>{" "}
              {vendor.location
                ? `${vendor.location.address ?? ""}, ${vendor.location.city ?? ""}, ${vendor.location.state ?? ""}`
                : "N/A"}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Social Links</p>
            {socialLinks.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    className="rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink hover:border-ink/50"
                    href={social.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink/65">No social links yet.</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Link className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-canvas" to="/showcases/new">
              Create showcase
            </Link>
            <Link className="rounded-full border border-ink/20 bg-canvas px-5 py-2 text-sm font-semibold text-ink" to="/vendors">
              Back to vendors
            </Link>
          </div>
        </div>
      </section>

      <ShowcaseMap vendors={[vendor]} events={vendor.events ?? []} height="420px" />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-3xl text-ink">Upcoming Showcases</h3>
          <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink">{vendor.events?.length ?? 0} events</span>
        </div>
        {vendor.events && vendor.events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {vendor.events.map((event) => (
              <EventCard key={event.id} event={{ ...event, vendorName: vendor.name }} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-6 text-sm text-ink/70">
            No events yet. Create the first showcase from the vendor workflow.
          </div>
        )}
      </section>
    </main>
  );
}
