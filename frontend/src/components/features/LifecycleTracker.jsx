// frontend/src/components/features/LifecycleTracker.jsx
import { useState } from "react";
import api from "../../services/api";

export default function LifecycleTracker() {
  const [unitId, setUnitId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!unitId.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/lifecycle/${unitId.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Blood unit not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-5">
      <h3 className="text-xl font-bold mb-1 text-gray-800">
        Complete Blood Traceability
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Track the full lifecycle of any blood unit from donation to transfusion
      </p>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter Blood Unit ID (e.g. BB-O+-0001)"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm font-semibold"
        >
          {loading ? "Searching..." : "Track"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm mb-4">
          ❌ {error}
        </div>
      )}

      {result && (
        <div>
          {/* Unit Summary */}
          <div className="bg-gray-50 border rounded p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-400 text-xs">Unit ID</span>
              <p className="font-bold text-gray-800">{result.unitId}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Blood Group</span>
              <p className="font-bold text-red-600 text-lg">
                {result.bloodGroup}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Collection Date</span>
              <p className="font-semibold">
                {result.collectionDate
                  ? new Date(result.collectionDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Status</span>
              <p className="font-semibold text-green-700">
                {result.currentStatus}
              </p>
            </div>
          </div>

          {/* Lifecycle Steps */}
          <div className="relative">
            {result.lifecycle.map((step, idx) => (
              <div key={step.step} className="flex gap-4 mb-6 relative">
                {/* Connector line */}
                {idx < result.lifecycle.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 z-0" />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    step.status === "completed"
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-gray-100 border-2 border-gray-300"
                  }`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        step.status === "completed"
                          ? "text-green-700"
                          : "text-gray-400"
                      }`}
                    >
                      Step {step.step}: {step.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        step.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {step.status === "completed" ? " Done" : " Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(step.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Blockchain Events */}
          {result.blockchainEvents && result.blockchainEvents.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                ⛓ Blockchain Records
              </h4>
              <div className="space-y-1">
                {result.blockchainEvents.map((ev) => (
                  <div
                    key={ev._id}
                    className="text-xs bg-blue-50 border border-blue-100 rounded p-2 flex justify-between"
                  >
                    <span className="font-mono text-blue-700">{ev.action}</span>
                    <span className="text-gray-400">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
