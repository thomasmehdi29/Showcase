import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";
import { colorForCategory } from "../lib/categories";
import "leaflet/dist/leaflet.css";

function parseCoordinate(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getCoordinates(location) {
  if (!location) {
    return null;
  }

  const latitude = parseCoordinate(location.latitude);
  const longitude = parseCoordinate(location.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return [latitude, longitude];
}

function calculateCenter(vendors, events) {
  const points = [
    ...vendors.map((vendor) => getCoordinates(vendor.location)).filter(Boolean),
    ...events.map((event) => getCoordinates(event.location)).filter(Boolean),
  ];

  if (points.length === 0) {
    return [45.5231, -122.6765];
  }

  const [latSum, lngSum] = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0],
  );

  return [latSum / points.length, lngSum / points.length];
}

export default function ShowcaseMap({ vendors = [], events = [], height = "500px" }) {
  const center = calculateCenter(vendors, events);

  return (
    <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="border-b border-ink/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink/70">
          <span className="font-semibold text-ink">Map Discovery</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-moss" /> Vendors
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-ember" /> Events
          </span>
          <span className="text-xs">Categories are color-coded per marker.</span>
        </div>
      </div>
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {vendors
          .filter((vendor) => getCoordinates(vendor.location))
          .map((vendor) => {
            const color = colorForCategory(vendor.category);
            const coordinates = getCoordinates(vendor.location);
            if (!coordinates) {
              return null;
            }
            return (
              <CircleMarker
                key={`vendor-${vendor.id}`}
                center={coordinates}
                radius={9}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-xs">{vendor.category}</p>
                    <p className="text-xs">
                      {vendor.location.city}, {vendor.location.state}
                    </p>
                    <Link className="text-sm font-semibold text-moss" to={`/vendors/${vendor.id}`}>
                      View vendor
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {events
          .filter((event) => getCoordinates(event.location))
          .map((event) => {
            const color = colorForCategory(event.category);
            const coordinates = getCoordinates(event.location);
            if (!coordinates) {
              return null;
            }
            return (
              <CircleMarker
                key={`event-${event.id}`}
                center={coordinates}
                radius={7}
                pathOptions={{ color: "#111827", fillColor: color, fillOpacity: 0.95, weight: 2 }}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs">{event.vendorName}</p>
                    <p className="text-xs">{event.category}</p>
                    <p className="text-xs">
                      {event.location.city}, {event.location.state}
                    </p>
                    <Link className="text-sm font-semibold text-moss" to={`/vendors/${event.vendorId}`}>
                      View host
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </section>
  );
}
