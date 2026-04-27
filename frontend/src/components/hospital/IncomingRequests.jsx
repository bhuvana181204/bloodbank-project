// src/components/hospital/IncomingRequests.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import incomingIcon from "../../assets/incomingdonation.png";

const IncomingRequests = ({ socket, updateFlag }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchRequests = async () => {
    try {
      const hospitalId = user?._id;
      if (!hospitalId) return;

      const res = await API.get(`/hospitals/pending-donations/${hospitalId}`);
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [updateFlag]);

  useEffect(() => {
    if (!socket) return;
    socket.on("pending-donation", () => fetchRequests());
    return () => socket.off("pending-donation");
  }, [socket]);

  const handleConfirm = async (id) => {
    try {
      await API.post(`/hospitals/confirm-donation/${id}`);
      alert(" Donation confirmed and added to inventory!");
      fetchRequests();
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection (optional):");
    try {
      await API.post(`/hospitals/reject-donation/${id}`, { reason });
      alert("Donation rejected.");
      fetchRequests();
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  if (loading)
    return (
      <p className="text-sm text-gray-500">Loading incoming donations...</p>
    );

  return (
    <div className="card p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <img src={incomingIcon} className="w-5 h-5" alt="Incoming" />
        Incoming Donation Requests
      </h3>

      {requests.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending donation requests.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req._id}
              className="border p-3 rounded bg-yellow-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  Donor: {req.donorId?.name || req.donorId}
                </p>
                <p className="text-sm text-gray-600">
                  Blood Group: {req.bloodGroup}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(req.requestDate).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  onClick={() => handleConfirm(req._id)}
                >
                  Confirm
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  onClick={() => handleReject(req._id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncomingRequests;
