// BlockchainVerification.jsx
import { useState } from "react";
import api from "../../services/api";

export default function BlockchainVerification() {
  const [unitId, setUnitId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  const verifyUnit = async () => {
    if (!unitId.trim()) return;
    setLoading(true);
    setResult(null);
    setEvents([]);
    try {
      const [verifyRes, eventsRes] = await Promise.all([
        api.get(`/verify/${unitId.trim()}`),
        api.get(`/blockchain/events?action=BLOOD_UNIT_ADDED`),
      ]);
      setResult(verifyRes.data);
      // Filter events for this unit
      const unitEvents = (eventsRes.data || []).filter(
        (e) => e.details && e.details.includes(unitId.trim())
      );
      setEvents(unitEvents);
    } catch (err) {
      setResult({
        verified: false,
        message: err.response?.data?.message || "Unit not found",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-5">
      
      <p className="text-xs text-gray-400 mb-4">
        Verify any blood unit against the blockchain — confirms authenticity
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter Blood Unit ID..."
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verifyUnit()}
          className="border rounded px-3 py-1.5 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={verifyUnit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>

      {result && (
        <div
          className={`p-4 rounded border ${
            result.verified
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          {result.verified ? (
            <div className="space-y-1 text-sm">
              <p className="font-bold text-green-700 text-base">
                 Blood Unit Verified on Blockchain
              </p>
              <p>
                <strong>Blood Group:</strong> {result.bloodGroup}
              </p>
              <p>
                <strong>Donor Verified:</strong> ✔
              </p>
              {result.blockchainHash && (
                <p className="font-mono text-xs text-gray-500 break-all">
                  Hash: {result.blockchainHash?.substring(0, 40)}...
                </p>
              )}
            </div>
          ) : (
            <p className="text-red-700 font-semibold text-sm">
              ❌ {result.message || "Verification failed"}
            </p>
          )}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 font-semibold mb-1">
            ⛓ Blockchain Record:
          </p>
          {events.map((e) => (
            <div
              key={e._id}
              className="text-xs bg-blue-50 border border-blue-100 rounded p-2 mb-1"
            >
              <span className="text-blue-700 font-mono">{e.action}</span>
              <span className="text-gray-400 ml-2">
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
