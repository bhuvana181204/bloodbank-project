import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BloodBankBlockchain() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Only show inventory-related blockchain events
      const [addedRes, transfusedRes, approvedRes] = await Promise.all([
        api.get("/blockchain/events?action=BLOOD_UNIT_ADDED"),
        api.get("/blockchain/events?action=TRANSFUSION_COMPLETED"),
        api.get("/blockchain/events?action=REQUEST_APPROVED"),
      ]);
      const combined = [
        ...(addedRes.data || []),
        ...(transfusedRes.data || []),
        ...(approvedRes.data || []),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEvents(combined);
    } catch (err) {
      console.error("BloodBank blockchain load error", err);
    } finally {
      setLoading(false);
    }
  };

  const iconFor = (action) => {
    if (action === "BLOOD_UNIT_ADDED") return "🩸";
    if (action === "TRANSFUSION") return "💉";
    if (action === "REPAIR_BLOCKCHAIN") return "🔧";
    return "⛓";
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          
          <p className="text-xs text-gray-400">
            Blockchain entries related to blood unit storage and transfusion
          </p>
        </div>
        <button
          onClick={loadEvents}
          className="text-xs border rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading records...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No inventory blockchain records yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.map((e) => (
            <div
              key={e._id}
              className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs"
            >
              <span className="text-base">{iconFor(e.action)}</span>
              <div className="flex-1">
                <span className="font-semibold text-blue-800">{e.action}</span>
                <p className="text-gray-600 mt-0.5">{e.details}</p>
              </div>
              <span className="text-gray-400 whitespace-nowrap">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
