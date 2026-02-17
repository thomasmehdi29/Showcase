const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 8000;
const geocodeCache = new Map();

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function buildAddressQuery(location = {}) {
  return [location.address, location.city, location.state, location.postalCode, location.country ?? "USA"]
    .filter(hasValue)
    .map((part) => String(part).trim())
    .join(", ");
}

export async function geocodeLocation(location = {}) {
  const query = buildAddressQuery(location);
  if (!query) {
    return null;
  }

  const normalizedKey = query.toLowerCase();
  if (geocodeCache.has(normalizedKey)) {
    return geocodeCache.get(normalizedKey);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Showcase-Local-App/0.1",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      geocodeCache.set(normalizedKey, null);
      return null;
    }

    const payload = await response.json();
    const first = Array.isArray(payload) ? payload[0] : null;
    const latitude = Number.parseFloat(first?.lat);
    const longitude = Number.parseFloat(first?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      geocodeCache.set(normalizedKey, null);
      return null;
    }

    const result = { latitude, longitude };
    geocodeCache.set(normalizedKey, result);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
