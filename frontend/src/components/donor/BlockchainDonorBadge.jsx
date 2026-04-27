import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BlockchainDonorBadge({ donorId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (donorId) loadDonorEvents();
  }, [donorId]);

  const loadDonorEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/blockchain/events");
      // Filter only events related to this donor
      const donorEvents = (res.data || []).filter(
        (e) =>
          e.details &&
          (e.details.includes(donorId) ||
            e.action === "DONOR_PROFILE_COMPLETED" ||
            e.action === "DONATION_CONFIRMED")
      );
      setEvents(donorEvents.slice(0, 5));
    } catch (err) {
      console.error("Donor blockchain events error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-semibold text-green-800 mb-2">
        Your Blockchain Record
      </h4>

      {/* Verification badge */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded border border-green-200">
        <span className="text-2xl"></span>
        <div>
          <p className="font-bold text-green-700 text-sm">
            Verified on Blockchain
          </p>
          <p className="text-xs text-gray-500">
            Your donation history is securely recorded and tamper-proof
          </p>
        </div>
      </div>

      {/* Recent events */}
      {loading ? (
        <p className="text-gray-400 text-xs">Loading records...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-xs">
          No blockchain records yet. Your first donation will be recorded here.
        </p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 font-semibold">Recent Events:</p>
          {events.map((e) => (
            <div
              key={e._id}
              className="flex justify-between items-center text-xs bg-white border border-green-100 rounded p-1.5"
            >
              <span className="text-green-700 font-medium">{e.action.replace(/_/g, " ")}</span>
              <span className="text-gray-400">
                {new Date(e.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
