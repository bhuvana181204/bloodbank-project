// frontend/src/pages/Events.jsx
// Blood Drive Events — shows upcoming and past donation camps
import { useEffect, useState } from "react";
import API from "../services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    API.get("/blood-drive-events")
      .then((res) => setEvents(res.data || []))
      .catch(() => setError("Could not load events. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      : "—";

  const isUpcoming = (d) => d && new Date(d) >= new Date();
  const upcoming = events.filter((e) => isUpcoming(e.date));
  const past     = events.filter((e) => !isUpcoming(e.date));

  return (
    <div className="panel">
      {loading && (
        <div className="text-center py-10 text-gray-400 text-sm">Loading events…</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-14">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 font-semibold text-lg mb-2">
            No blood drive events scheduled yet
          </p>
          <p className="text-gray-400 text-sm">
            Check back soon — the admin will post upcoming blood donation camps here.
          </p>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-green-700 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
            Upcoming Events ({upcoming.length})
          </h3>
          <div className="space-y-3">
            {upcoming.map((ev) => (
              <div key={ev._id}
                className="border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base mb-1">{ev.title}</h4>
                    <p className="text-sm text-green-700 font-medium">📅 {fmt(ev.date)}</p>
                    <p className="text-sm text-gray-600 mt-0.5">📍 {ev.location}</p>
                    {ev.description && (
                      <p className="text-sm text-gray-500 mt-2">{ev.description}</p>
                    )}
                    {ev.organizer && (
                      <p className="text-xs text-gray-400 mt-1">Organised by: {ev.organizer}</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    UPCOMING
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && past.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
            Past Events ({past.length})
          </h3>
          <div className="space-y-3">
            {past.map((ev) => (
              <div key={ev._id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">{ev.title}</h4>
                    <p className="text-sm text-gray-500">📅 {fmt(ev.date)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">📍 {ev.location}</p>
                    {ev.description && (
                      <p className="text-sm text-gray-400 mt-2">{ev.description}</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    COMPLETED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
