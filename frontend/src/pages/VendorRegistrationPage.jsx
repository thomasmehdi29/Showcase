import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { vendorCategories } from "../lib/categories";

const initialState = {
  name: "",
  category: "Farm",
  description: "",
  email: "",
  phone: "",
  website: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  imageUrl: "",
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

export default function VendorRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

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
        name: form.name,
        category: form.category,
        description: form.description,
        email: form.email,
        phone: form.phone,
        website: form.website,
        instagramUrl: form.instagramUrl,
        facebookUrl: form.facebookUrl,
        tiktokUrl: form.tiktokUrl,
        imageUrl: form.imageUrl,
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

      const created = await api.createVendor(payload);
      navigate(`/vendors/${created.id}`);
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
        <h2 className="font-display text-3xl text-ink">Register your vendor profile</h2>
        <p className="mt-2 text-sm text-ink/70">
          Add your details and a primary location so community members can discover you on the map.
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm text-ink">
            Vendor name *
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              required
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Category *
            <select
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {vendorCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm text-ink">
            Description
            <textarea
              className="min-h-24 rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Email
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Phone
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Website
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="https://"
              value={form.website}
              onChange={(event) => updateField("website", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Image URL
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="https://images..."
              value={form.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Instagram URL
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="https://instagram.com/..."
              value={form.instagramUrl}
              onChange={(event) => updateField("instagramUrl", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            Facebook URL
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="https://facebook.com/..."
              value={form.facebookUrl}
              onChange={(event) => updateField("facebookUrl", event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-ink">
            TikTok URL
            <input
              className="rounded-xl border border-ink/20 px-3 py-2 outline-none ring-moss focus:ring-2"
              placeholder="https://tiktok.com/@..."
              value={form.tiktokUrl}
              onChange={(event) => updateField("tiktokUrl", event.target.value)}
            />
          </label>

          <p className="md:col-span-2 mt-2 text-xs uppercase tracking-[0.18em] text-ink/65">Primary location</p>

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

          <div className="md:col-span-2 mt-3 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create vendor"}
            </button>
            <Link className="rounded-full border border-ink/20 bg-canvas px-5 py-2 text-sm font-semibold text-ink" to="/vendors">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
