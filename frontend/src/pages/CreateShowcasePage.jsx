import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { eventCategories } from "../lib/categories";

const initialState = {
  vendorId: "",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  category: "Market",
  discussionEnabled: true,
  locationName: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: "",
  longitude: "",
};

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function hasLocationInput(form) {
  return [
    form.locationName,
    form.address,
    form.city,
    form.state,
    form.postalCode,
    form.latitude,
    form.longitude,
  ].some(hasValue);
}

export default function CreateShowcasePage() {
  const [form, setForm] = useState(initialState);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      try {
        const data = await api.getVendors();
        if (!active) {
          return;
        }
        setVendors(data);
        setForm((prev) => ({ ...prev, vendorId: data[0] ? String(data[0].id) : "" }));
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoadingVendors(false);
        }
      }
    }

    loadVendors();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess(null);

    if (!form.vendorId) {
      setError("At least one vendor must exist before creating a showcase.");
      return;
    }

    const hasLatitude = hasValue(form.latitude);
    const hasLongitude = hasValue(form.longitude);

    if (hasLatitude !== hasLongitude) {
      setError("Please provide both latitude and longitude, or leave both blank.");
      return;
    }

    const parsedLatitude = hasLatitude ? Number.parseFloat(form.latitude) : null;
    const parsedLongitude = hasLongitude ? Number.parseFloat(form.longitude) : null;

    if ((hasLatitude && Number.isNaN(parsedLatitude)) || (hasLongitude && Number.isNaN(parsedLongitude))) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vendorId: Number.parseInt(form.vendorId, 10),
        title: form.title,
        description: form.description,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        category: form.category,
        discussionEnabled: form.discussionEnabled,
      };

      if (hasLocationInput(form)) {
        payload.location = {
          name: form.locationName,
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          latitude: parsedLatitude,
          longitude: parsedLongitude,
        };
      }

      const created = await api.createEvent(payload);
      setSuccess(created);
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        discussionEnabled: true,
        locationName: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        latitude: "",
        longitude: "",
      }));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-ink/70">Vendor Workflow</p>
        <h2 className="font-display text-3xl text-ink">Create a showcase event</h2>
        <p className="mt-2 text-sm text-ink/70">Publish a market, workshop, pop-up, or community gathering for map discovery.</p>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {success && (
          <p className="mt-4 rounded-xl bg-moss/10 px-3 py-2 text-sm text-moss">
            Event created: <Link className="font-semibold underline" to={`/events/${success.id}`}>{success.title}</Link>
          </p>
        )}

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-ink">
            Vendor *
            <select
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              disabled={loadingVendors || vendors.length === 0}
              required
              value={form.vendorId}
              onChange={(event) => updateField("vendorId", event.target.value)}
            >
              {vendors.length === 0 ? (
                <option value="">No vendors available</option>
              ) : (
                vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Category *
            <select
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {eventCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-ink">
            Event title *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-ink">
            Description
            <textarea
              className="min-h-24 rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <label className="md:col-span-2 inline-flex items-center gap-2 rounded-xl border border-ink/15 bg-canvas px-3 py-2 text-sm text-ink">
            <input
              checked={Boolean(form.discussionEnabled)}
              className="h-4 w-4 accent-moss"
              type="checkbox"
              onChange={(event) => updateField("discussionEnabled", event.target.checked)}
            />
            Allow discussion on this event page
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Start date/time *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              type="datetime-local"
              value={form.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            End date/time *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => updateField("endDate", event.target.value)}
            />
          </label>

          <p className="md:col-span-2 mt-2 text-xs uppercase tracking-[0.18em] text-ink/65">Event location</p>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Location name
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.locationName}
              onChange={(event) => updateField("locationName", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Address
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            City
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            State
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.state}
              onChange={(event) => updateField("state", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Postal code
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.postalCode}
              onChange={(event) => updateField("postalCode", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Latitude (optional)
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(event) => updateField("latitude", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Longitude (optional)
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(event) => updateField("longitude", event.target.value)}
            />
          </label>

          <div className="md:col-span-2 mt-3 flex gap-3">
            <button
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || loadingVendors || vendors.length === 0}
              type="submit"
            >
              {submitting ? "Creating..." : "Create event"}
            </button>
            <Link className="rounded-full border border-ink/20 bg-canvas px-5 py-2 text-sm font-semibold text-ink" to="/events">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
