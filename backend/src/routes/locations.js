import { Router } from "express";
import { getDb } from "../db.js";

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

function toLocationResponse(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    vendorId: row.vendorId,
    eventId: row.eventId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { vendorId, eventId, category } = req.query;

    const where = [];
    const params = [];

    if (vendorId) {
      where.push("vendorId = ?");
      params.push(vendorId);
    }

    if (eventId) {
      where.push("eventId = ?");
      params.push(eventId);
    }

    if (category) {
      where.push("LOWER(category) = LOWER(?)");
      params.push(category);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await db.all(
      `SELECT * FROM locations ${whereClause} ORDER BY createdAt DESC`,
      params,
    );

    res.json(rows.map(toLocationResponse));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const locationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID." });
    }

    const row = await db.get("SELECT * FROM locations WHERE id = ?", locationId);

    if (!row) {
      return res.status(404).json({ error: "Location not found." });
    }

    res.json(toLocationResponse(row));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      category,
      vendorId,
      eventId,
    } = req.body;

    const lat = parseFloatOrNull(latitude);
    const lng = parseFloatOrNull(longitude);

    if ((hasValue(latitude) && lat === null) || (hasValue(longitude) && lng === null)) {
      return res.status(400).json({ error: "latitude and longitude must be valid numbers when provided." });
    }

    if ((lat === null) !== (lng === null)) {
      return res.status(400).json({ error: "latitude and longitude must both be provided together." });
    }

    if (vendorId && eventId) {
      return res.status(400).json({ error: "A location can only belong to either vendorId or eventId." });
    }

    if (vendorId) {
      const vendor = await db.get("SELECT id FROM vendors WHERE id = ?", vendorId);
      if (!vendor) {
        return res.status(400).json({ error: "vendorId does not exist." });
      }
    }

    if (eventId) {
      const event = await db.get("SELECT id FROM events WHERE id = ?", eventId);
      if (!event) {
        return res.status(400).json({ error: "eventId does not exist." });
      }
    }

    const result = await db.run(
      `
        INSERT INTO locations (name, address, city, state, postalCode, country, latitude, longitude, category, vendorId, eventId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name ?? null,
        address ?? null,
        city ?? null,
        state ?? null,
        postalCode ?? null,
        country ?? "USA",
        lat,
        lng,
        category ?? null,
        vendorId ?? null,
        eventId ?? null,
      ],
    );

    const row = await db.get("SELECT * FROM locations WHERE id = ?", result.lastID);
    res.status(201).json(toLocationResponse(row));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const locationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID." });
    }

    const existing = await db.get("SELECT * FROM locations WHERE id = ?", locationId);
    if (!existing) {
      return res.status(404).json({ error: "Location not found." });
    }

    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      category,
      vendorId,
      eventId,
    } = req.body;

    const lat = latitude !== undefined ? parseFloatOrNull(latitude) : existing.latitude;
    const lng = longitude !== undefined ? parseFloatOrNull(longitude) : existing.longitude;

    if ((hasValue(latitude) && lat === null) || (hasValue(longitude) && lng === null)) {
      return res.status(400).json({ error: "latitude and longitude must be valid numbers when provided." });
    }

    if ((lat === null) !== (lng === null)) {
      return res.status(400).json({ error: "latitude and longitude must both be provided together." });
    }

    const updatedVendorId = vendorId !== undefined ? vendorId : existing.vendorId;
    const updatedEventId = eventId !== undefined ? eventId : existing.eventId;

    if (updatedVendorId && updatedEventId) {
      return res.status(400).json({ error: "A location can only belong to either vendorId or eventId." });
    }

    if (updatedVendorId) {
      const vendor = await db.get("SELECT id FROM vendors WHERE id = ?", updatedVendorId);
      if (!vendor) {
        return res.status(400).json({ error: "vendorId does not exist." });
      }
    }

    if (updatedEventId) {
      const event = await db.get("SELECT id FROM events WHERE id = ?", updatedEventId);
      if (!event) {
        return res.status(400).json({ error: "eventId does not exist." });
      }
    }

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
          vendorId = ?,
          eventId = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        name ?? null,
        address ?? null,
        city ?? null,
        state ?? null,
        postalCode ?? null,
        country ?? null,
        lat,
        lng,
        category ?? null,
        updatedVendorId ?? null,
        updatedEventId ?? null,
        locationId,
      ],
    );

    const row = await db.get("SELECT * FROM locations WHERE id = ?", locationId);
    res.json(toLocationResponse(row));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const locationId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(locationId)) {
      return res.status(400).json({ error: "Invalid location ID." });
    }

    const result = await db.run("DELETE FROM locations WHERE id = ?", locationId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Location not found." });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
