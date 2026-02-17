import { getDb } from "./db.js";

async function createSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      imageUrl TEXT,
      instagramUrl TEXT,
      facebookUrl TEXT,
      tiktokUrl TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendorId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      category TEXT NOT NULL,
      discussionEnabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postalCode TEXT,
      country TEXT NOT NULL DEFAULT 'USA',
      latitude REAL,
      longitude REAL,
      category TEXT,
      vendorId INTEGER UNIQUE,
      eventId INTEGER UNIQUE,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE,
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      authorName TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      authorName TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_event_comments_event_id_created_at
    ON event_comments (eventId, createdAt DESC);

    CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
    ON community_posts (createdAt DESC);
  `);
}

async function addColumnIfMissing(db, tableName, columnName, definitionSql) {
  const columns = await db.all(`PRAGMA table_info(${tableName});`);
  if (!columns || columns.length === 0) {
    return false;
  }

  const exists = columns.some((column) => column.name === columnName);
  if (exists) {
    return false;
  }

  await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql};`);
  return true;
}

async function migrateLocationsCoordinatesNullable(db) {
  const columns = await db.all("PRAGMA table_info(locations);");
  if (!columns || columns.length === 0) {
    return false;
  }

  const latitudeColumn = columns.find((column) => column.name === "latitude");
  const longitudeColumn = columns.find((column) => column.name === "longitude");
  const needsMigration = Number(latitudeColumn?.notnull ?? 0) === 1 || Number(longitudeColumn?.notnull ?? 0) === 1;

  if (!needsMigration) {
    return false;
  }

  await db.exec("BEGIN TRANSACTION;");

  try {
    await db.exec(`
      ALTER TABLE locations RENAME TO locations_legacy;

      CREATE TABLE locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postalCode TEXT,
        country TEXT NOT NULL DEFAULT 'USA',
        latitude REAL,
        longitude REAL,
        category TEXT,
        vendorId INTEGER UNIQUE,
        eventId INTEGER UNIQUE,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE,
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
      );

      INSERT INTO locations (
        id,
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
        createdAt,
        updatedAt
      )
      SELECT
        id,
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
        createdAt,
        updatedAt
      FROM locations_legacy;

      DROP TABLE locations_legacy;
    `);

    await db.exec("COMMIT;");
    return true;
  } catch (error) {
    await db.exec("ROLLBACK;");
    throw error;
  }
}

async function migrateVendorSocialColumns(db) {
  const migrations = await Promise.all([
    addColumnIfMissing(db, "vendors", "instagramUrl", "TEXT"),
    addColumnIfMissing(db, "vendors", "facebookUrl", "TEXT"),
    addColumnIfMissing(db, "vendors", "tiktokUrl", "TEXT"),
  ]);

  return migrations.some(Boolean);
}

async function migrateEventDiscussionColumn(db) {
  return addColumnIfMissing(db, "events", "discussionEnabled", "INTEGER NOT NULL DEFAULT 1");
}

async function seedData(db) {
  const existing = await db.get("SELECT COUNT(*) AS count FROM vendors;");
  if (existing.count > 0) {
    return { seeded: false, message: "Database already has data." };
  }

  const vendors = [
    {
      name: "Green Fork Farm",
      category: "Farm",
      description: "Seasonal produce and pasture-raised eggs from a family farm.",
      email: "hello@greenforkfarm.com",
      phone: "(503) 555-0101",
      website: "https://greenforkfarm.example",
      imageUrl: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8",
      location: {
        name: "Green Fork Main Stall",
        address: "110 Alder St",
        city: "Portland",
        state: "OR",
        postalCode: "97205",
        latitude: 45.5231,
        longitude: -122.6765,
      },
    },
    {
      name: "Clay & Ember Studio",
      category: "Artisan",
      description: "Hand-thrown ceramics and small-batch home goods.",
      email: "studio@clayember.com",
      phone: "(503) 555-0102",
      website: "https://clayember.example",
      imageUrl: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b",
      location: {
        name: "Clay & Ember Workshop",
        address: "340 Belmont Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97214",
        latitude: 45.5166,
        longitude: -122.6262,
      },
    },
    {
      name: "Drift Coffee Cart",
      category: "Food",
      description: "Mobile espresso and seasonal pastry pop-up cart.",
      email: "brew@driftcoffeecart.com",
      phone: "(503) 555-0103",
      website: "https://driftcoffee.example",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
      location: {
        name: "Drift Coffee Garage",
        address: "500 N Mississippi Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97227",
        latitude: 45.5585,
        longitude: -122.6756,
      },
    },
    {
      name: "North Loop Vintage",
      category: "Vintage",
      description: "Curated vintage clothing and repurposed accessories.",
      email: "contact@northloopvintage.com",
      phone: "(503) 555-0104",
      website: "https://northloopvintage.example",
      imageUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04",
      location: {
        name: "North Loop Showroom",
        address: "215 NW 11th Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97209",
        latitude: 45.5244,
        longitude: -122.682,
      },
    },
  ];

  const eventTemplates = [
    {
      vendorName: "Green Fork Farm",
      title: "Saturday Harvest Pop-Up",
      description: "Fresh produce bundles, microgreens, and tastings.",
      startDate: "2026-02-14T09:00:00.000Z",
      endDate: "2026-02-14T14:00:00.000Z",
      category: "Market",
      location: {
        name: "Downtown Market Square",
        address: "250 SW Broadway",
        city: "Portland",
        state: "OR",
        postalCode: "97205",
        latitude: 45.5204,
        longitude: -122.6792,
      },
    },
    {
      vendorName: "Clay & Ember Studio",
      title: "Pottery Wheel Intro Night",
      description: "Try the wheel in a 90-minute beginner session.",
      startDate: "2026-02-19T01:00:00.000Z",
      endDate: "2026-02-19T03:00:00.000Z",
      category: "Workshop",
      location: {
        name: "Clay & Ember Studio",
        address: "340 Belmont Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97214",
        latitude: 45.5168,
        longitude: -122.6264,
      },
    },
    {
      vendorName: "Drift Coffee Cart",
      title: "Riverside Coffee Morning",
      description: "Special single-origin brews by the river.",
      startDate: "2026-02-16T15:00:00.000Z",
      endDate: "2026-02-16T19:00:00.000Z",
      category: "Pop-Up",
      location: {
        name: "Eastbank Esplanade",
        address: "SE Water Ave & Salmon St",
        city: "Portland",
        state: "OR",
        postalCode: "97214",
        latitude: 45.5123,
        longitude: -122.6663,
      },
    },
    {
      vendorName: "North Loop Vintage",
      title: "Streetwear Swap Meet",
      description: "Vintage finds, swaps, and local DJ set.",
      startDate: "2026-02-22T20:00:00.000Z",
      endDate: "2026-02-22T23:30:00.000Z",
      category: "Community",
      location: {
        name: "North Loop Courtyard",
        address: "220 NW 11th Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97209",
        latitude: 45.524,
        longitude: -122.6828,
      },
    },
    {
      vendorName: "Green Fork Farm",
      title: "Farm-to-Table Demo",
      description: "Live cooking demo featuring winter vegetables.",
      startDate: "2026-02-28T22:00:00.000Z",
      endDate: "2026-02-29T00:00:00.000Z",
      category: "Food",
      location: {
        name: "Pearl Culinary Hall",
        address: "760 NW 9th Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97209",
        latitude: 45.5288,
        longitude: -122.6807,
      },
    },
  ];

  await db.exec("BEGIN TRANSACTION;");

  try {
    const vendorStmt = await db.prepare(`
      INSERT INTO vendors (name, category, description, email, phone, website, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    const locationStmt = await db.prepare(`
      INSERT INTO locations (name, address, city, state, postalCode, latitude, longitude, category, vendorId, eventId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const eventStmt = await db.prepare(`
      INSERT INTO events (vendorId, title, description, startDate, endDate, category)
      VALUES (?, ?, ?, ?, ?, ?);
    `);

    const vendorIdsByName = new Map();

    for (const vendor of vendors) {
      const vendorResult = await vendorStmt.run(
        vendor.name,
        vendor.category,
        vendor.description,
        vendor.email,
        vendor.phone,
        vendor.website,
        vendor.imageUrl,
      );

      const vendorId = vendorResult.lastID;
      vendorIdsByName.set(vendor.name, vendorId);

      await locationStmt.run(
        vendor.location.name,
        vendor.location.address,
        vendor.location.city,
        vendor.location.state,
        vendor.location.postalCode,
        vendor.location.latitude,
        vendor.location.longitude,
        vendor.category,
        vendorId,
        null,
      );
    }

    for (const event of eventTemplates) {
      const vendorId = vendorIdsByName.get(event.vendorName);
      const eventResult = await eventStmt.run(
        vendorId,
        event.title,
        event.description,
        event.startDate,
        event.endDate,
        event.category,
      );

      await locationStmt.run(
        event.location.name,
        event.location.address,
        event.location.city,
        event.location.state,
        event.location.postalCode,
        event.location.latitude,
        event.location.longitude,
        event.category,
        null,
        eventResult.lastID,
      );
    }

    await vendorStmt.finalize();
    await locationStmt.finalize();
    await eventStmt.finalize();
    await db.exec("COMMIT;");

    return { seeded: true, message: "Seed data inserted." };
  } catch (error) {
    await db.exec("ROLLBACK;");
    throw error;
  }
}

export async function initializeDatabase() {
  const db = await getDb();
  await createSchema(db);
  const migrationNotes = [];

  if (await migrateLocationsCoordinatesNullable(db)) {
    migrationNotes.push("Location coordinates are now optional.");
  }

  if (await migrateVendorSocialColumns(db)) {
    migrationNotes.push("Vendor social links are enabled.");
  }

  if (await migrateEventDiscussionColumn(db)) {
    migrationNotes.push("Event discussions are enabled.");
  }

  const seedResult = await seedData(db);

  if (migrationNotes.length > 0) {
    return {
      ...seedResult,
      message: `${seedResult.message} ${migrationNotes.join(" ")}`,
    };
  }

  return seedResult;
}
