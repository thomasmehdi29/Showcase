const STORAGE_KEY = "showcase:demo-db:v1";
export const SHOWCASE_DATA_CHANGED_EVENT = "showcase:data-changed";

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
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

function parseNumberOrNull(value) {
  if (!hasValue(value)) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasLocationInput(location) {
  if (!location) {
    return false;
  }

  return ["name", "address", "city", "state", "postalCode", "country", "latitude", "longitude"].some((field) =>
    hasValue(location[field]),
  );
}

function hashString(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deriveCoordinates(location) {
  const latitude = parseNumberOrNull(location.latitude);
  const longitude = parseNumberOrNull(location.longitude);

  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const addressKey = [location.address, location.city, location.state, location.postalCode].filter(hasValue).join("|");
  if (!addressKey) {
    return { latitude: null, longitude: null };
  }

  const seed = hashString(addressKey);
  const latOffset = (seed % 6000) / 100000 - 0.03;
  const lngOffset = ((Math.floor(seed / 17) % 8000) / 100000) - 0.04;

  return {
    latitude: Number((40.7128 + latOffset).toFixed(6)),
    longitude: Number((-74.006 + lngOffset).toFixed(6)),
  };
}

function formatDateOffset(daysFromNow, hour) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromNow, hour, 0, 0, 0);
  return date.toISOString();
}

function createSeedDatabase() {
  const createdAt = new Date().toISOString();

  const vendors = [
    { id: 1, name: "Hudson Harvest Co-op", category: "Farm", description: "Seasonal produce from regional farms.", email: "hello@hudsonharvest.coop", phone: "(212) 555-0101", website: "https://hudsonharvest.coop", instagramUrl: "https://instagram.com/hudsonharvestcoop", facebookUrl: "https://facebook.com/hudsonharvestcoop", tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 2, name: "Brooklyn Clay Lab", category: "Artisan", description: "Handmade ceramics and studio drops.", email: "studio@brooklynclaylab.com", phone: "(718) 555-0102", website: "https://brooklynclaylab.com", instagramUrl: "https://instagram.com/brooklynclaylab", facebookUrl: null, tiktokUrl: "https://tiktok.com/@brooklynclaylab", imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 3, name: "Queens Vintage Vault", category: "Vintage", description: "Curated vintage clothing and accessories.", email: "curator@queensvintagevault.com", phone: "(347) 555-0103", website: "https://queensvintagevault.com", instagramUrl: "https://instagram.com/queensvintagevault", facebookUrl: "https://facebook.com/queensvintagevault", tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 4, name: "Harlem Community Kitchen", category: "Food", description: "Neighborhood dinners and chef pop-ups.", email: "events@harlemcommunitykitchen.org", phone: "(646) 555-0104", website: "https://harlemcommunitykitchen.org", instagramUrl: "https://instagram.com/harlemcommunitykitchen", facebookUrl: null, tiktokUrl: "https://tiktok.com/@harlemcommunitykitchen", imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 5, name: "Lower East Side Thrift House", category: "Thrift", description: "Affordable second-hand apparel and swaps.", email: "team@lesthrifthouse.org", phone: "(212) 555-0105", website: "https://lesthrifthouse.org", instagramUrl: "https://instagram.com/lesthrifthouse", facebookUrl: "https://facebook.com/lesthrifthouse", tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 6, name: "Uptown Mutual Aid Hub", category: "Volunteer", description: "Volunteer supply distribution and drives.", email: "coordination@uptownmutualaid.org", phone: "(917) 555-0106", website: "https://uptownmutualaid.org", instagramUrl: "https://instagram.com/uptownmutualaidhub", facebookUrl: "https://facebook.com/uptownmutualaidhub", tiktokUrl: "https://tiktok.com/@uptownmutualaidhub", imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 7, name: "Williamsburg Night Market Co.", category: "Market", description: "Independent makers and food stalls.", email: "hello@wbnightmarket.co", phone: "(718) 555-0107", website: "https://wbnightmarket.co", instagramUrl: "https://instagram.com/wbnightmarket", facebookUrl: null, tiktokUrl: "https://tiktok.com/@wbnightmarket", imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 8, name: "Astoria Makers Guild", category: "Artisan", description: "Textile, jewelry, and print artists collective.", email: "info@astoriamakersguild.com", phone: "(347) 555-0108", website: "https://astoriamakersguild.com", instagramUrl: "https://instagram.com/astoriamakersguild", facebookUrl: null, tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 9, name: "SoHo Pop-Up Pantry", category: "Food", description: "Rotating chef counters and pastry drops.", email: "team@sohopopuppantry.com", phone: "(212) 555-0109", website: "https://sohopopuppantry.com", instagramUrl: "https://instagram.com/sohopopuppantry", facebookUrl: "https://facebook.com/sohopopuppantry", tiktokUrl: "https://tiktok.com/@sohopopuppantry", imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 10, name: "Bronx Fresh Box", category: "Farm", description: "Urban farm stand and produce drops.", email: "orders@bronxfreshbox.com", phone: "(917) 555-0110", website: "https://bronxfreshbox.com", instagramUrl: "https://instagram.com/bronxfreshbox", facebookUrl: null, tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 11, name: "Chinatown Repair Workshop", category: "Community", description: "Fix-it space for clothing and home goods.", email: "hello@chinatownrepair.org", phone: "(646) 555-0111", website: "https://chinatownrepair.org", instagramUrl: "https://instagram.com/chinatownrepair", facebookUrl: "https://facebook.com/chinatownrepair", tiktokUrl: null, imageUrl: null, createdAt, updatedAt: createdAt },
    { id: 12, name: "St. George Community Market", category: "Market", description: "Staten Island waterfront weekend market.", email: "team@stgeorgemarket.com", phone: "(929) 555-0112", website: "https://stgeorgemarket.com", instagramUrl: "https://instagram.com/stgeorgemarket", facebookUrl: null, tiktokUrl: "https://tiktok.com/@stgeorgemarket", imageUrl: null, createdAt, updatedAt: createdAt },
  ];

  const locations = [
    { id: 1, name: "Chelsea Pickup Hub", address: "450 W 15th St", city: "New York", state: "NY", postalCode: "10011", country: "USA", latitude: 40.7422, longitude: -74.0077, category: "Farm", vendorId: 1, eventId: null, createdAt, updatedAt: createdAt },
    { id: 2, name: "Brooklyn Clay Studio", address: "199 Grand St", city: "Brooklyn", state: "NY", postalCode: "11211", country: "USA", latitude: 40.7179, longitude: -73.9591, category: "Artisan", vendorId: 2, eventId: null, createdAt, updatedAt: createdAt },
    { id: 3, name: "Queens Vintage Shop", address: "33-18 Ditmars Blvd", city: "Astoria", state: "NY", postalCode: "11105", country: "USA", latitude: 40.7746, longitude: -73.9128, category: "Vintage", vendorId: 3, eventId: null, createdAt, updatedAt: createdAt },
    { id: 4, name: "Harlem Kitchen", address: "246 W 116th St", city: "New York", state: "NY", postalCode: "10026", country: "USA", latitude: 40.8022, longitude: -73.9552, category: "Food", vendorId: 4, eventId: null, createdAt, updatedAt: createdAt },
    { id: 5, name: "LES Thrift House", address: "88 Orchard St", city: "New York", state: "NY", postalCode: "10002", country: "USA", latitude: 40.7196, longitude: -73.9883, category: "Thrift", vendorId: 5, eventId: null, createdAt, updatedAt: createdAt },
    { id: 6, name: "Uptown Aid Center", address: "530 W 145th St", city: "New York", state: "NY", postalCode: "10031", country: "USA", latitude: 40.8245, longitude: -73.9483, category: "Volunteer", vendorId: 6, eventId: null, createdAt, updatedAt: createdAt },
    { id: 7, name: "Williamsburg Market Lot", address: "70 N 7th St", city: "Brooklyn", state: "NY", postalCode: "11249", country: "USA", latitude: 40.7194, longitude: -73.9611, category: "Market", vendorId: 7, eventId: null, createdAt, updatedAt: createdAt },
    { id: 8, name: "Astoria Makers Hall", address: "31-10 35th Ave", city: "Astoria", state: "NY", postalCode: "11106", country: "USA", latitude: 40.7598, longitude: -73.9295, category: "Artisan", vendorId: 8, eventId: null, createdAt, updatedAt: createdAt },
    { id: 9, name: "SoHo Pantry Counter", address: "145 Prince St", city: "New York", state: "NY", postalCode: "10012", country: "USA", latitude: 40.7245, longitude: -73.9999, category: "Food", vendorId: 9, eventId: null, createdAt, updatedAt: createdAt },
    { id: 10, name: "Bronx Fresh Stand", address: "670 E 161st St", city: "Bronx", state: "NY", postalCode: "10456", country: "USA", latitude: 40.8256, longitude: -73.9114, category: "Farm", vendorId: 10, eventId: null, createdAt, updatedAt: createdAt },
    { id: 11, name: "Chinatown Repair Garage", address: "82 Mott St", city: "New York", state: "NY", postalCode: "10013", country: "USA", latitude: 40.7172, longitude: -73.9974, category: "Community", vendorId: 11, eventId: null, createdAt, updatedAt: createdAt },
    { id: 12, name: "St. George Market Pier", address: "1 Bay St", city: "Staten Island", state: "NY", postalCode: "10301", country: "USA", latitude: 40.6444, longitude: -74.0727, category: "Market", vendorId: 12, eventId: null, createdAt, updatedAt: createdAt },
  ];

  const events = [
    { id: 1, vendorId: 1, title: "Chelsea Produce Morning", description: "Fresh produce bundles and neighborhood pickup.", startDate: formatDateOffset(2, 10), endDate: formatDateOffset(2, 14), category: "Market", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 2, vendorId: 2, title: "Beginner Wheel Throwing", description: "Hands-on pottery session.", startDate: formatDateOffset(4, 18), endDate: formatDateOffset(4, 20), category: "Workshop", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 3, vendorId: 3, title: "Vintage Rack Pop-Up", description: "One-day curated vintage drops.", startDate: formatDateOffset(3, 13), endDate: formatDateOffset(3, 17), category: "Pop-Up", discussionEnabled: false, createdAt, updatedAt: createdAt },
    { id: 4, vendorId: 4, title: "Harlem Family Dinner", description: "Community dinner with local chefs.", startDate: formatDateOffset(5, 19), endDate: formatDateOffset(5, 22), category: "Food", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 5, vendorId: 5, title: "Thrift Donation Swap", description: "Bring one, take one neighborhood swap.", startDate: formatDateOffset(6, 12), endDate: formatDateOffset(6, 16), category: "Thrift", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 6, vendorId: 6, title: "Winter Supply Drive", description: "Volunteer sorting and distribution.", startDate: formatDateOffset(7, 11), endDate: formatDateOffset(7, 15), category: "Volunteer", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 7, vendorId: 7, title: "Williamsburg Night Market", description: "Makers, food, and live sets.", startDate: formatDateOffset(8, 18), endDate: formatDateOffset(8, 23), category: "Market", discussionEnabled: true, createdAt, updatedAt: createdAt },
    { id: 8, vendorId: 11, title: "Repair Cafe Saturday", description: "Fix-it stations for home goods.", startDate: formatDateOffset(9, 11), endDate: formatDateOffset(9, 15), category: "Community", discussionEnabled: true, createdAt, updatedAt: createdAt },
  ];

  const eventLocations = [
    { id: 101, name: "Chelsea Green Plaza", address: "401 W 14th St", city: "New York", state: "NY", postalCode: "10014", country: "USA", latitude: 40.7401, longitude: -74.0085, category: "Market", vendorId: null, eventId: 1, createdAt, updatedAt: createdAt },
    { id: 102, name: "Clay Lab Annex", address: "215 Berry St", city: "Brooklyn", state: "NY", postalCode: "11249", country: "USA", latitude: 40.7198, longitude: -73.9579, category: "Workshop", vendorId: null, eventId: 2, createdAt, updatedAt: createdAt },
    { id: 103, name: "Ditmars Sidewalk Market", address: "36-10 Ditmars Blvd", city: "Astoria", state: "NY", postalCode: "11105", country: "USA", latitude: 40.7753, longitude: -73.9121, category: "Pop-Up", vendorId: null, eventId: 3, createdAt, updatedAt: createdAt },
    { id: 104, name: "Harlem Commons", address: "210 W 118th St", city: "New York", state: "NY", postalCode: "10026", country: "USA", latitude: 40.804, longitude: -73.9519, category: "Food", vendorId: null, eventId: 4, createdAt, updatedAt: createdAt },
    { id: 105, name: "Essex Courtyard", address: "115 Essex St", city: "New York", state: "NY", postalCode: "10002", country: "USA", latitude: 40.7197, longitude: -73.9876, category: "Thrift", vendorId: null, eventId: 5, createdAt, updatedAt: createdAt },
    { id: 106, name: "Hamilton Heights Center", address: "505 W 145th St", city: "New York", state: "NY", postalCode: "10031", country: "USA", latitude: 40.8241, longitude: -73.949, category: "Volunteer", vendorId: null, eventId: 6, createdAt, updatedAt: createdAt },
    { id: 107, name: "Wythe Waterfront Lot", address: "84 Wythe Ave", city: "Brooklyn", state: "NY", postalCode: "11249", country: "USA", latitude: 40.7208, longitude: -73.9622, category: "Market", vendorId: null, eventId: 7, createdAt, updatedAt: createdAt },
    { id: 108, name: "Canal Workshop House", address: "93 Canal St", city: "New York", state: "NY", postalCode: "10002", country: "USA", latitude: 40.7161, longitude: -73.9944, category: "Community", vendorId: null, eventId: 8, createdAt, updatedAt: createdAt },
  ];

  return {
    meta: {
      seededAt: createdAt,
      version: 1,
    },
    nextIds: {
      vendor: 13,
      event: 9,
      location: 109,
      communityPost: 1,
      eventComment: 1,
    },
    vendors,
    events,
    locations: [...locations, ...eventLocations],
    communityPosts: [],
    eventComments: [],
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function maxNumericId(rows) {
  return rows.reduce((max, row) => {
    const id = Number.parseInt(row?.id, 10);
    if (Number.isFinite(id) && id > max) {
      return id;
    }
    return max;
  }, 0);
}

function ensurePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function normalizeDatabase(database) {
  const now = new Date().toISOString();
  const vendors = ensureArray(database?.vendors);
  const events = ensureArray(database?.events);
  const locations = ensureArray(database?.locations);
  const communityPosts = ensureArray(database?.communityPosts);
  const eventComments = ensureArray(database?.eventComments);
  const nextIds = typeof database?.nextIds === "object" && database.nextIds !== null ? database.nextIds : {};

  return {
    meta: {
      seededAt: database?.meta?.seededAt ?? now,
      version: 1,
    },
    nextIds: {
      vendor: ensurePositiveInteger(nextIds.vendor, maxNumericId(vendors) + 1),
      event: ensurePositiveInteger(nextIds.event, maxNumericId(events) + 1),
      location: ensurePositiveInteger(nextIds.location, maxNumericId(locations) + 1),
      communityPost: ensurePositiveInteger(nextIds.communityPost, maxNumericId(communityPosts) + 1),
      eventComment: ensurePositiveInteger(nextIds.eventComment, maxNumericId(eventComments) + 1),
    },
    vendors,
    events,
    locations,
    communityPosts,
    eventComments,
  };
}

function dispatchDataChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SHOWCASE_DATA_CHANGED_EVENT));
}

function getDatabase() {
  if (typeof window === "undefined") {
    return createSeedDatabase();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedDatabase();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("invalid persisted payload");
    }

    const normalized = normalizeDatabase(parsed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const reseeded = createSeedDatabase();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reseeded));
    return reseeded;
  }
}

function setDatabase(nextDatabase, emitChange = true) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDatabase));
    if (emitChange) {
      dispatchDataChanged();
    }
  }
}

function nextId(database, key) {
  const value = database.nextIds[key];
  database.nextIds[key] = value + 1;
  return value;
}

function locationToResponse(location) {
  if (!location) {
    return null;
  }

  return {
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    category: location.category,
  };
}

function vendorToResponse(database, vendor) {
  const location = database.locations.find((entry) => entry.vendorId === vendor.id) ?? null;

  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    description: vendor.description,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website,
    imageUrl: vendor.imageUrl ?? null,
    instagramUrl: vendor.instagramUrl ?? null,
    facebookUrl: vendor.facebookUrl ?? null,
    tiktokUrl: vendor.tiktokUrl ?? null,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
    location: locationToResponse(location),
  };
}

function eventToResponse(database, event) {
  const location = database.locations.find((entry) => entry.eventId === event.id) ?? null;
  const vendor = database.vendors.find((entry) => entry.id === event.vendorId);

  return {
    id: event.id,
    vendorId: event.vendorId,
    vendorName: vendor?.name ?? "Unknown vendor",
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    category: event.category,
    discussionEnabled: Boolean(event.discussionEnabled),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    location: locationToResponse(location),
  };
}

function communityPostToResponse(post) {
  return {
    id: post.id,
    authorName: post.authorName,
    title: post.title,
    message: post.message,
    category: post.category,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

function eventCommentToResponse(comment) {
  return {
    id: comment.id,
    eventId: comment.eventId,
    authorName: comment.authorName,
    message: comment.message,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

function upsertLocation(database, { location, category, vendorId = null, eventId = null, existingLocation = null }) {
  if (!location || !hasLocationInput(location)) {
    return existingLocation ?? null;
  }

  const merged = {
    name: hasValue(location.name) ? location.name : existingLocation?.name ?? null,
    address: hasValue(location.address) ? location.address : existingLocation?.address ?? null,
    city: hasValue(location.city) ? location.city : existingLocation?.city ?? null,
    state: hasValue(location.state) ? location.state : existingLocation?.state ?? null,
    postalCode: hasValue(location.postalCode) ? location.postalCode : existingLocation?.postalCode ?? null,
    country: hasValue(location.country) ? location.country : existingLocation?.country ?? "USA",
    category: category ?? existingLocation?.category ?? null,
  };

  const coordinates = deriveCoordinates({
    ...merged,
    latitude: location.latitude !== undefined ? location.latitude : existingLocation?.latitude ?? null,
    longitude: location.longitude !== undefined ? location.longitude : existingLocation?.longitude ?? null,
  });

  const now = new Date().toISOString();

  if (existingLocation) {
    existingLocation.name = merged.name;
    existingLocation.address = merged.address;
    existingLocation.city = merged.city;
    existingLocation.state = merged.state;
    existingLocation.postalCode = merged.postalCode;
    existingLocation.country = merged.country;
    existingLocation.category = merged.category;
    existingLocation.latitude = coordinates.latitude;
    existingLocation.longitude = coordinates.longitude;
    existingLocation.updatedAt = now;
    return existingLocation;
  }

  const locationEntry = {
    id: nextId(database, "location"),
    name: merged.name,
    address: merged.address,
    city: merged.city,
    state: merged.state,
    postalCode: merged.postalCode,
    country: merged.country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    category: merged.category,
    vendorId,
    eventId,
    createdAt: now,
    updatedAt: now,
  };

  database.locations.push(locationEntry);
  return locationEntry;
}

export async function getVendors() {
  const database = getDatabase();
  const rows = database.vendors
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((vendor) => vendorToResponse(database, vendor));

  return deepClone(rows);
}

export async function getVendorById(id) {
  const database = getDatabase();
  const vendorId = Number.parseInt(id, 10);
  const vendor = database.vendors.find((entry) => entry.id === vendorId);

  if (!vendor) {
    throw new Error("Vendor not found.");
  }

  const events = database.events
    .filter((event) => event.vendorId === vendorId)
    .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))
    .map((event) => eventToResponse(database, event));

  return deepClone({
    ...vendorToResponse(database, vendor),
    events,
  });
}

export async function createVendor(payload) {
  if (!payload?.name || !payload?.category) {
    throw new Error("name and category are required.");
  }

  const database = getDatabase();
  const now = new Date().toISOString();
  const vendor = {
    id: nextId(database, "vendor"),
    name: payload.name,
    category: payload.category,
    description: payload.description ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    website: normalizeUrlOrNull(payload.website),
    imageUrl: normalizeUrlOrNull(payload.imageUrl),
    instagramUrl: normalizeUrlOrNull(payload.instagramUrl),
    facebookUrl: normalizeUrlOrNull(payload.facebookUrl),
    tiktokUrl: normalizeUrlOrNull(payload.tiktokUrl),
    createdAt: now,
    updatedAt: now,
  };

  database.vendors.push(vendor);

  if (payload.location && hasLocationInput(payload.location)) {
    upsertLocation(database, {
      location: payload.location,
      category: payload.category,
      vendorId: vendor.id,
      eventId: null,
      existingLocation: null,
    });
  }

  setDatabase(database, true);
  return deepClone(vendorToResponse(database, vendor));
}

export async function getEvents() {
  const database = getDatabase();
  const rows = database.events
    .slice()
    .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))
    .map((event) => eventToResponse(database, event));

  return deepClone(rows);
}

export async function getEventById(id) {
  const database = getDatabase();
  const eventId = Number.parseInt(id, 10);
  const event = database.events.find((entry) => entry.id === eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  return deepClone(eventToResponse(database, event));
}

export async function createEvent(payload) {
  if (!payload?.vendorId || !payload?.title || !payload?.startDate || !payload?.endDate || !payload?.category) {
    throw new Error("vendorId, title, startDate, endDate, and category are required.");
  }

  const database = getDatabase();
  const vendorId = Number.parseInt(payload.vendorId, 10);
  const vendor = database.vendors.find((entry) => entry.id === vendorId);

  if (!vendor) {
    throw new Error("vendorId does not exist.");
  }

  const now = new Date().toISOString();
  const event = {
    id: nextId(database, "event"),
    vendorId,
    title: payload.title,
    description: payload.description ?? null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    category: payload.category,
    discussionEnabled: payload.discussionEnabled === undefined ? true : Boolean(payload.discussionEnabled),
    createdAt: now,
    updatedAt: now,
  };

  database.events.push(event);

  if (payload.location && hasLocationInput(payload.location)) {
    upsertLocation(database, {
      location: payload.location,
      category: payload.category,
      vendorId: null,
      eventId: event.id,
      existingLocation: null,
    });
  }

  setDatabase(database, true);
  return deepClone(eventToResponse(database, event));
}

export async function updateEvent(id, payload) {
  const database = getDatabase();
  const eventId = Number.parseInt(id, 10);
  const event = database.events.find((entry) => entry.id === eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (payload.vendorId !== undefined) {
    const vendorId = Number.parseInt(payload.vendorId, 10);
    const vendor = database.vendors.find((entry) => entry.id === vendorId);
    if (!vendor) {
      throw new Error("vendorId does not exist.");
    }
    event.vendorId = vendorId;
  }

  if (payload.title !== undefined && hasValue(payload.title)) {
    event.title = payload.title;
  }
  if (payload.description !== undefined) {
    event.description = payload.description;
  }
  if (payload.startDate !== undefined && hasValue(payload.startDate)) {
    event.startDate = payload.startDate;
  }
  if (payload.endDate !== undefined && hasValue(payload.endDate)) {
    event.endDate = payload.endDate;
  }
  if (payload.category !== undefined && hasValue(payload.category)) {
    event.category = payload.category;
  }
  if (payload.discussionEnabled !== undefined) {
    event.discussionEnabled = Boolean(payload.discussionEnabled);
  }

  const existingLocation = database.locations.find((entry) => entry.eventId === eventId) ?? null;
  if (payload.location !== undefined) {
    upsertLocation(database, {
      location: payload.location,
      category: event.category,
      vendorId: null,
      eventId,
      existingLocation,
    });
  }

  event.updatedAt = new Date().toISOString();
  setDatabase(database, true);
  return deepClone(eventToResponse(database, event));
}

export async function getEventComments(id) {
  const database = getDatabase();
  const eventId = Number.parseInt(id, 10);
  const event = database.events.find((entry) => entry.id === eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  const rows = database.eventComments
    .filter((comment) => comment.eventId === eventId)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((comment) => eventCommentToResponse(comment));

  return deepClone(rows);
}

export async function createEventComment(id, payload) {
  const database = getDatabase();
  const eventId = Number.parseInt(id, 10);
  const event = database.events.find((entry) => entry.id === eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  if (!event.discussionEnabled) {
    throw new Error("Discussion is disabled for this event.");
  }

  if (!payload?.authorName || !payload?.message) {
    throw new Error("authorName and message are required.");
  }

  const now = new Date().toISOString();
  const comment = {
    id: nextId(database, "eventComment"),
    eventId,
    authorName: payload.authorName,
    message: payload.message,
    createdAt: now,
    updatedAt: now,
  };

  database.eventComments.push(comment);
  setDatabase(database, true);
  return deepClone(eventCommentToResponse(comment));
}

export async function getLocations() {
  const database = getDatabase();
  return deepClone(database.locations.map((location) => ({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    category: location.category,
    vendorId: location.vendorId,
    eventId: location.eventId,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  })));
}

export async function getCommunityPosts() {
  const database = getDatabase();
  const rows = database.communityPosts
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map((post) => communityPostToResponse(post));

  return deepClone(rows);
}

export async function createCommunityPost(payload) {
  if (!payload?.authorName || !payload?.title || !payload?.message) {
    throw new Error("authorName, title, and message are required.");
  }

  const database = getDatabase();
  const now = new Date().toISOString();
  const post = {
    id: nextId(database, "communityPost"),
    authorName: payload.authorName,
    title: payload.title,
    message: payload.message,
    category: payload.category ?? null,
    createdAt: now,
    updatedAt: now,
  };

  database.communityPosts.push(post);
  setDatabase(database, true);
  return deepClone(communityPostToResponse(post));
}

export async function deleteCommunityPost(id) {
  const database = getDatabase();
  const postId = Number.parseInt(id, 10);
  const index = database.communityPosts.findIndex((entry) => entry.id === postId);

  if (index < 0) {
    throw new Error("Community post not found.");
  }

  database.communityPosts.splice(index, 1);
  setDatabase(database, true);
  return null;
}

export async function health() {
  return {
    status: "ok",
    service: "showcase-frontend-demo",
  };
}
