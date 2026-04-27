// frontend/src/components/features/FraudDetection.jsx
import { useState } from "react";
import api from "../../services/api";
import frauddetection from "../../assets/frauddetection.png";

export default function FraudDetection() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState(null);
  const [ackMessages, setAckMessages] = useState({});

  const runScan = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.get("/fraud/scan");
      setResult(res.data);
    } catch (err) {
      console.error("Fraud scan error", err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledge = async (alert, idx) => {
    setAcknowledging(idx);
    try {
      await api.post("/fraud/acknowledge", {
        alertType: alert.type,
        message: alert.message,
      });
      setAckMessages((prev) => ({ ...prev, [idx]: "Logged to blockchain" }));
    } catch (err) {
      setAckMessages((prev) => ({ ...prev, [idx]: " Failed to acknowledge" }));
    } finally {
      setAcknowledging(null);
    }
  };

  const severityStyle = {
    HIGH: {
      bg: "bg-red-50",
      border: "border-red-400",
      badge: "bg-red-600 text-white",
    },
    MEDIUM: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      badge: "bg-orange-500 text-white",
    },
    LOW: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      badge: "bg-yellow-500 text-white",
    },
  };

  return (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <img
              src={frauddetection}
              className="w-6 h-6"
              alt="Fraud Detection"
            />
            Fraud Detection System
          </h3>
          <p className="text-sm text-gray-500">
            Detects suspicious activity: duplicate donors, unusual requests,
            expired stock
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? " Scanning..." : " Run Fraud Scan"}
        </button>
      </div>

      {!result && !loading && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">🛡</p>
          <p className="text-sm">
            Click "Run Fraud Scan" to detect suspicious activity
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">
            Scanning database for suspicious patterns...
          </p>
        </div>
      )}

      {result && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {result.highCount}
              </p>
              <p className="text-xs text-red-500">High Severity</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {result.mediumCount}
              </p>
              <p className="text-xs text-orange-500">Medium Severity</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {result.lowCount}
              </p>
              <p className="text-xs text-yellow-500">Low Severity</p>
            </div>
          </div>

          {result.alerts.length === 0 ? (
            <div className="text-center py-6 text-green-600">
              <p className="text-3xl mb-2"></p>
              <p className="font-semibold">No suspicious activity detected!</p>
              <p className="text-sm text-gray-400">System is clean.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-semibold">
                {result.totalAlerts} alert(s) detected:
              </p>
              {result.alerts.map((alert, idx) => {
                const style =
                  severityStyle[alert.severity] || severityStyle["LOW"];
                return (
                  <div
                    key={idx}
                    className={`border rounded p-4 ${style.bg} ${style.border}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${style.badge}`}
                          >
                            {style.icon} {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {alert.message}
                        </p>
                        {alert.count && (
                          <p className="text-xs text-gray-500 mt-1">
                            Count: {alert.count}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1">
                        <button
                          onClick={() => acknowledge(alert, idx)}
                          disabled={acknowledging === idx || !!ackMessages[idx]}
                          className="text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-900 disabled:opacity-50"
                        >
                          {acknowledging === idx ? "Logging..." : "Acknowledge"}
                        </button>
                        {ackMessages[idx] && (
                          <span className="text-xs text-green-600">
                            {ackMessages[idx]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Scanned at: {new Date(result.scannedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
