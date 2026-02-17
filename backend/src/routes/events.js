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

function parseBooleanOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return null;
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

function toEventResponse(row) {
  return {
    id: row.id,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    title: row.title,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    category: row.category,
    discussionEnabled: row.discussionEnabled === undefined ? true : Boolean(row.discussionEnabled),
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

function toCommentResponse(row) {
  return {
    id: row.id,
    eventId: row.eventId,
    authorName: row.authorName,
    message: row.message,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getEventById(db, id) {
  const row = await db.get(
    `
      SELECT
        e.*,
        v.name AS vendorName,
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
      INNER JOIN vendors v ON v.id = e.vendorId
      LEFT JOIN locations l ON l.eventId = e.id
      WHERE e.id = ?
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

  return toEventResponse(row);
}

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { vendorId, category, fromDate } = req.query;

    const where = [];
    const params = [];

    if (vendorId) {
      where.push("e.vendorId = ?");
      params.push(vendorId);
    }

    if (category) {
      where.push("LOWER(e.category) = LOWER(?)");
      params.push(category);
    }

    if (fromDate) {
      where.push("e.startDate >= ?");
      params.push(fromDate);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await db.all(
      `
        SELECT
          e.*,
          v.name AS vendorName,
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
        INNER JOIN vendors v ON v.id = e.vendorId
        LEFT JOIN locations l ON l.eventId = e.id
        ${whereClause}
        ORDER BY e.startDate ASC
      `,
      params,
    );

    res.json(rows.map(toEventResponse));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const eventId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID." });
    }

    const event = await getEventById(db, eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const db = await getDb();
    const eventId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID." });
    }

    const event = await db.get("SELECT id FROM events WHERE id = ?", eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    const rows = await db.all(
      `
        SELECT id, eventId, authorName, message, createdAt, updatedAt
        FROM event_comments
        WHERE eventId = ?
        ORDER BY createdAt DESC
      `,
      eventId,
    );

    return res.json(rows.map(toCommentResponse));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    const db = await getDb();
    const eventId = Number.parseInt(req.params.id, 10);
    const { authorName, message } = req.body;

    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID." });
    }

    if (!authorName || !message) {
      return res.status(400).json({ error: "authorName and message are required." });
    }

    const event = await db.get("SELECT id, discussionEnabled FROM events WHERE id = ?", eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (Number(event.discussionEnabled) !== 1) {
      return res.status(403).json({ error: "Discussion is disabled for this event." });
    }

    const result = await db.run(
      `
        INSERT INTO event_comments (eventId, authorName, message)
        VALUES (?, ?, ?)
      `,
      [eventId, authorName, message],
    );

    const row = await db.get(
      `
        SELECT id, eventId, authorName, message, createdAt, updatedAt
        FROM event_comments
        WHERE id = ?
      `,
      result.lastID,
    );

    return res.status(201).json(toCommentResponse(row));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { vendorId, title, description, startDate, endDate, category, discussionEnabled, location } = req.body;

    if (!vendorId || !title || !startDate || !endDate || !category) {
      return res.status(400).json({ error: "vendorId, title, startDate, endDate, and category are required." });
    }

    const discussionEnabledValue = discussionEnabled === undefined ? true : parseBooleanOrNull(discussionEnabled);
    if (discussionEnabledValue === null) {
      return res.status(400).json({ error: "discussionEnabled must be a boolean when provided." });
    }

    const vendor = await db.get("SELECT id FROM vendors WHERE id = ?", vendorId);
    if (!vendor) {
      return res.status(400).json({ error: "vendorId does not exist." });
    }

    await db.exec("BEGIN TRANSACTION;");

    const eventResult = await db.run(
      `
        INSERT INTO events (vendorId, title, description, startDate, endDate, category, discussionEnabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [vendorId, title, description ?? null, startDate, endDate, category, discussionEnabledValue ? 1 : 0],
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
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
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
          eventResult.lastID,
        ],
      );
    }

    await db.exec("COMMIT;");

    const event = await getEventById(db, eventResult.lastID);
    return res.status(201).json(event);
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
    const eventId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID." });
    }

    const existing = await getEventById(db, eventId);

    if (!existing) {
      return res.status(404).json({ error: "Event not found." });
    }

    const { vendorId, title, description, startDate, endDate, category, discussionEnabled, location } = req.body;

    let discussionEnabledValue = null;
    if (discussionEnabled !== undefined) {
      const parsedDiscussion = parseBooleanOrNull(discussionEnabled);
      if (parsedDiscussion === null) {
        return res.status(400).json({ error: "discussionEnabled must be a boolean when provided." });
      }
      discussionEnabledValue = parsedDiscussion ? 1 : 0;
    }

    if (vendorId) {
      const vendor = await db.get("SELECT id FROM vendors WHERE id = ?", vendorId);
      if (!vendor) {
        return res.status(400).json({ error: "vendorId does not exist." });
      }
    }

    await db.exec("BEGIN TRANSACTION;");

    await db.run(
      `
        UPDATE events
        SET
          vendorId = COALESCE(?, vendorId),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          startDate = COALESCE(?, startDate),
          endDate = COALESCE(?, endDate),
          category = COALESCE(?, category),
          discussionEnabled = COALESCE(?, discussionEnabled),
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        vendorId ?? null,
        title ?? null,
        description ?? null,
        startDate ?? null,
        endDate ?? null,
        category ?? null,
        discussionEnabledValue,
        eventId,
      ],
    );

    if (location && hasLocationData(location)) {
      const { latitude, longitude, error: coordinateError } = await resolveLocationCoordinates(location, existing.location);

      if (coordinateError) {
        await db.exec("ROLLBACK;");
        return res.status(400).json({ error: coordinateError });
      }

      const existingLocation = await db.get("SELECT id FROM locations WHERE eventId = ?", eventId);

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
            WHERE eventId = ?
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
            eventId,
          ],
        );
      } else {
        await db.run(
          `
            INSERT INTO locations (name, address, city, state, postalCode, country, latitude, longitude, category, vendorId, eventId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
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
            eventId,
          ],
        );
      }
    }

    await db.exec("COMMIT;");

    const event = await getEventById(db, eventId);
    return res.json(event);
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
    const eventId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID." });
    }

    const result = await db.run("DELETE FROM events WHERE id = ?", eventId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
