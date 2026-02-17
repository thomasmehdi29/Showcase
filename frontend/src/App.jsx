import { Navigate, Route, Routes } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import VendorsPage from "./pages/VendorsPage";
import EventsPage from "./pages/EventsPage";
import VendorRegistrationPage from "./pages/VendorRegistrationPage";
import VendorDetailPage from "./pages/VendorDetailPage";
import CreateShowcasePage from "./pages/CreateShowcasePage";
import EventDetailPage from "./pages/EventDetailPage";
import CommunityBoardPage from "./pages/CommunityBoardPage";
import { api } from "./lib/api";

function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-16 text-center md:px-8">
      <p className="text-xs uppercase tracking-[0.2em] text-ink/70">404</p>
      <h2 className="font-display text-5xl text-ink">Page not found</h2>
      <p className="mt-2 text-sm text-ink/70">This route does not exist in Showcase.</p>
    </main>
  );
}

export default function App() {
  const [vendors, setVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [vendorsData, eventsData] = await Promise.all([api.getVendors(), api.getEvents()]);
      setVendors(vendorsData);
      setEvents(eventsData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={<HomePage vendors={vendors} events={events} loading={loading} error={error} refresh={loadData} />}
        />
        <Route path="/vendors" element={<VendorsPage vendors={vendors} loading={loading} />} />
        <Route path="/vendors/new" element={<VendorRegistrationPage />} />
        <Route path="/vendors/:vendorId" element={<VendorDetailPage />} />
        <Route path="/events" element={<EventsPage events={events} loading={loading} />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/community" element={<CommunityBoardPage />} />
        <Route path="/showcases/new" element={<CreateShowcasePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
