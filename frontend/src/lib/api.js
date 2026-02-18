import {
  SHOWCASE_DATA_CHANGED_EVENT,
  createCommunityPost,
  createEvent,
  createEventComment,
  createVendor,
  deleteCommunityPost,
  getCommunityPosts,
  getEventById,
  getEventComments,
  getEvents,
  getLocations,
  getVendorById,
  getVendors,
  health,
  updateEvent,
} from "./localDataStore";

export const api = {
  getVendors,
  getVendorById,
  createVendor,
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  getEventComments,
  createEventComment,
  getLocations,
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  health,
};

export { SHOWCASE_DATA_CHANGED_EVENT };
