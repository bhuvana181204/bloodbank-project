// src/components/recipient/RequestStatus.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";

const RequestStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/requests/my")
      .then((res) => setRequests(res.data))
      .catch((err) => console.error("Error fetching requests:", err))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 font-semibold";
      case "REJECTED":
        return "text-red-600 font-semibold";
      case "PENDING":
        return "text-yellow-600 font-semibold";
      case "FULFILLED":
        return "text-blue-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  if (loading)
    return <p className="text-sm text-gray-500">Loading your requests...</p>;

  return (
    <div className="card p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3">📋 My Blood Requests</h3>

      {requests.length === 0 ? (
        <p className="text-gray-500 text-sm">No requests submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r._id} className="border p-3 rounded bg-gray-50">
              <div className="flex justify-between">
                <span className="font-medium">{r.bloodGroup}</span>
                <span className={statusColor(r.status)}>{r.status}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Units: {r.requestedUnits || r.quantity} | Priority: {r.priority}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
