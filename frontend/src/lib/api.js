const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getVendors: () => request("/vendors"),
  getVendorById: (id) => request(`/vendors/${id}`),
  createVendor: (payload) =>
    request("/vendors", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getEvents: () => request("/events"),
  getEventById: (id) => request(`/events/${id}`),
  createEvent: (payload) =>
    request("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEvent: (id, payload) =>
    request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getEventComments: (id) => request(`/events/${id}/comments`),
  createEventComment: (id, payload) =>
    request(`/events/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getLocations: () => request("/locations"),
  getCommunityPosts: () => request("/community-posts"),
  createCommunityPost: (payload) =>
    request("/community-posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteCommunityPost: (id) =>
    request(`/community-posts/${id}`, {
      method: "DELETE",
    }),
  health: () => request("/health"),
};

export { API_BASE_URL };
