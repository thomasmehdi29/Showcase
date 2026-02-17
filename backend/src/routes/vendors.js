import { Router } from "express";
import { getDb } from "../db.js";
import { geocodeLocation } from "../lib/geocoding.js";

const router = Router();

function parseFloatOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeUrlOrNull(value) {
  if (!hasValue(value)) {
    return null;
  }

  const normalized = String(value).trim();
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  return `https://${normalized}`;
}

function fallbackVendorImageUrl(name, category) {
  const seed = encodeURIComponent(`${category ?? "vendor"}-${name ?? "profile"}`.toLowerCase());
  return `https://picsum.photos/seed/showcase-${seed}/960/640`;
}

function hasLocationData(location) {
  if (!location) {
    return false;
  }

  return ["name", "address", "city", "state", "postalCode", "country", "latitude", "longitude"].some((field) =>
    hasValue(location[field]),
  );
}

function hasAddressData(location) {
  if (!location) {
    return false;
  }

  return ["address", "city", "state", "postalCode", "country"].some((field) => hasValue(location[field]));
}

async function resolveLocationCoordinates(location, fallbackLocation = null) {
  const hasLatitudeInput = hasValue(location?.latitude);
  const hasLongitudeInput = hasValue(location?.longitude);

  let latitude =
    location?.latitude !== undefined ? parseFloatOrNull(location.latitude) : parseFloatOrNull(fallbackLocation?.latitude);
  let longitude =
    location?.longitude !== undefined ? parseFloatOrNull(location.longitude) : parseFloatOrNull(fallbackLocation?.longitude);

  if ((hasLatitudeInput && latitude === null) || (hasLongitudeInput && longitude === null)) {
    return { error: "location latitude and longitude must be valid numbers." };
  }

  if ((latitude === null) !== (longitude === null)) {
    return { error: "location latitude and longitude must both be provided together." };
  }

  if (latitude === null && longitude === null) {
    const geocodeInput = {
      address: location?.address ?? fallbackLocation?.address ?? null,
      city: location?.city ?? fallbackLocation?.city ?? null,
      state: location?.state ?? fallbackLocation?.state ?? null,
      postalCode: location?.postalCode ?? fallbackLocation?.postalCode ?? null,
      country: location?.country ?? fallbackLocation?.country ?? "USA",
    };

    if (hasAddressData(geocodeInput)) {
      const geocoded = await geocodeLocation(geocodeInput);
      if (geocoded) {
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
    }
  }

  return { latitude, longitude };
}

function toVendorResponse(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    email: row.email,
    phone: row.phone,
    website: row.website,
    imageUrl: row.imageUrl ?? fallbackVendorImageUrl(row.name, row.category),
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    tiktokUrl: row.tiktokUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    location: row.locationId
      ? {
          id: row.locationId,
          name: row.locationName,
          address: row.locationAddress,
          city: row.locationCity,
          state: row.locationState,
          postalCode: row.locationPostalCode,
          country: row.locationCountry,
          latitude: row.locationLatitude,
          longitude: row.locationLongitude,
          category: row.locationCategory,
        }
      : null,
  };
}

async function getVendorById(db, id) {
  const row = await db.get(
    `
      SELECT
        v.*,
        l.id AS locationId,
        l.name AS locationName,
        l.address AS locationAddress,
        l.city AS locationCity,
        l.state AS locationState,
        l.postalCode AS locationPostalCode,
        l.country AS locationCountry,
        l.latitude AS locationLatitude,
        l.longitude AS locationLongitude,
        l.category AS locationCategory
      FROM vendors v
      LEFT JOIN locations l ON l.vendorId = v.id
      WHERE v.id = ?
    `,
    id,
  );

  if (!row) {
    return null;
  }

  if (row.locationId && (row.locationLatitude === null || row.locationLongitude === null)) {
    const geocoded = await geocodeLocation({
      address: row.locationAddress,
      city: row.locationCity,
      state: row.locationState,
      postalCode: row.locationPostalCode,
      country: row.locationCountry,
    });

    if (geocoded) {
      await db.run(
        `
          UPDATE locations
          SET latitude = ?, longitude = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [geocoded.latitude, geocoded.longitude, row.locationId],
      );

      row.locationLatitude = geocoded.latitude;
      row.locationLongitude = geocoded.longitude;
    }
  }

  return toVendorResponse(row);
}

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { category, search } = req.query;

    const where = [];
    const params = [];

    if (category) {
      where.push("LOWER(v.category) = LOWER(?)");
      params.push(category);
    }

    if (search) {
      where.push("(LOWER(v.name) LIKE LOWER(?) OR LOWER(v.description) LIKE LOWER(?))");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await db.all(
      `
        SELECT
          v.*,
          l.id AS locationId,
          l.name AS locationName,
          l.address AS locationAddress,
          l.city AS locationCity,
          l.state AS locationState,
          l.postalCode AS locationPostalCode,
          l.country AS locationCountry,
          l.latitude AS locationLatitude,
          l.longitude AS locationLongitude,
          l.category AS locationCategory
        FROM vendors v
        LEFT JOIN locations l ON l.vendorId = v.id
        ${whereClause}
        ORDER BY v.createdAt DESC
      `,
      params,
    );

    res.json(rows.map(toVendorResponse));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const vendorId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID." });
    }

    const vendor = await getVendorById(db, vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found." });
    }

    const events = await db.all(
      `
        SELECT
          e.*,
          l.id AS locationId,
          l.name AS locationName,
          l.address AS locationAddress,
          l.city AS locationCity,
          l.state AS locationState,
          l.postalCode AS locationPostalCode,
          l.country AS locationCountry,
          l.latitude AS locationLatitude,
          l.longitude AS locationLongitude,
          l.category AS locationCategory
        FROM events e
        LEFT JOIN locations l ON l.eventId = e.id
        WHERE e.vendorId = ?
        ORDER BY e.startDate ASC
      `,
      vendorId,
    );

    res.json({
      ...vendor,
      events: events.map((event) => ({
        id: event.id,
        vendorId: event.vendorId,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        category: event.category,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        location: event.locationId
          ? {
              id: event.locationId,
              name: event.locationName,
              address: event.locationAddress,
              city: event.locationCity,
              state: event.locationState,
              postalCode: event.locationPostalCode,
              country: event.locationCountry,
              latitude: event.locationLatitude,
              longitude: event.locationLongitude,
              category: event.locationCategory,
            }
          : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, category, description, email, phone, website, imageUrl, instagramUrl, facebookUrl, tiktokUrl, location } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "name and category are required." });
    }

    await db.exec("BEGIN TRANSACTION;");

    const vendorResult = await db.run(
      `
        INSERT INTO vendors (name, category, description, email, phone, website, imageUrl, instagramUrl, facebookUrl, tiktokUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        category,
        description ?? null,
        email ?? null,
        phone ?? null,
        website ?? null,
        imageUrl ?? null,
        normalizeUrlOrNull(instagramUrl),
        normalizeUrlOrNull(facebookUrl),
        normalizeUrlOrNull(tiktokUrl),
      ],
    );

    if (location && hasLocationData(location)) {
      const { latitude, longitude, error: coordinateError } = await resolveLocationCoordinates(location);

      if (coordinateError) {
        await db.exec("ROLLBACK;");
        return res.status(400).json({ error: coordinateError });
      }

      await db.run(
        `
          INSERT INTO locations (name, address, city, state, postalCode, country, latitude, longitude, category, vendorId, eventId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `,
        [
          location.name ?? null,
          location.address ?? null,
          location.city ?? null,
          location.state ?? null,
          location.postalCode ?? null,
          location.country ?? "USA",
          latitude,
          longitude,
          category,
          vendorResult.lastID,
        ],
      );
    }

    await db.exec("COMMIT;");

    const vendor = await getVendorById(db, vendorResult.lastID);
    return res.status(201).json(vendor);
  } catch (error) {
    try {
      const db = await getDb();
      await db.exec("ROLLBACK;");
    } catch {
      // no-op
    }
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const vendorId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID." });
    }

    const existing = await getVendorById(db, vendorId);
    if (!existing) {
      return res.status(404).json({ error: "Vendor not found." });
    }

    const {
      name,
      category,
      description,
      email,
      phone,
      website,
      imageUrl,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      location,
    } = req.body;

    await db.exec("BEGIN TRANSACTION;");

    await db.run(
      `
        UPDATE vendors
        SET
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          website = COALESCE(?, website),
          imageUrl = COALESCE(?, imageUrl),
          instagramUrl = COALESCE(?, instagramUrl),
          facebookUrl = COALESCE(?, facebookUrl),
          tiktokUrl = COALESCE(?, tiktokUrl),
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        name ?? null,
        category ?? null,
        description ?? null,
        email ?? null,
        phone ?? null,
        website ?? null,
        imageUrl ?? null,
        instagramUrl !== undefined ? normalizeUrlOrNull(instagramUrl) : null,
        facebookUrl !== undefined ? normalizeUrlOrNull(facebookUrl) : null,
        tiktokUrl !== undefined ? normalizeUrlOrNull(tiktokUrl) : null,
        vendorId,
      ],
    );

    if (location && hasLocationData(location)) {
      const { latitude, longitude, error: coordinateError } = await resolveLocationCoordinates(location, existing.location);

      if (coordinateError) {
        await db.exec("ROLLBACK;");
        return res.status(400).json({ error: coordinateError });
      }

      const existingLocation = await db.get("SELECT id FROM locations WHERE vendorId = ?", vendorId);

      if (existingLocation) {
        await db.run(
          `
            UPDATE locations
            SET
              name = COALESCE(?, name),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              state = COALESCE(?, state),
              postalCode = COALESCE(?, postalCode),
              country = COALESCE(?, country),
              latitude = ?,
              longitude = ?,
              category = COALESCE(?, category),
              updatedAt = CURRENT_TIMESTAMP
            WHERE vendorId = ?
          `,
          [
            location.name ?? null,
            location.address ?? null,
            location.city ?? null,
            location.state ?? null,
            location.postalCode ?? null,
            location.country ?? null,
            latitude,
            longitude,
            category ?? null,
            vendorId,
          ],
        );
      } else {
        await db.run(
          `
            INSERT INTO locations (name, address, city, state, postalCode, country, latitude, longitude, category, vendorId, eventId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
          `,
          [
            location.name ?? null,
            location.address ?? null,
            location.city ?? null,
            location.state ?? null,
            location.postalCode ?? null,
            location.country ?? "USA",
            latitude,
            longitude,
            category ?? existing.category,
            vendorId,
          ],
        );
      }
    }

    await db.exec("COMMIT;");

    const vendor = await getVendorById(db, vendorId);
    return res.json(vendor);
  } catch (error) {
    try {
      const db = await getDb();
      await db.exec("ROLLBACK;");
    } catch {
      // no-op
    }
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const vendorId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID." });
    }

    const result = await db.run("DELETE FROM vendors WHERE id = ?", vendorId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Vendor not found." });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
