// frontend/src/components/donor/DonationHistory.jsx
import React, { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import { io } from "socket.io-client";
import donation from "../../assets/donationhistory.png";

const DonationHistory = () => {
  const [history, setHistory] = useState([]);
  const socketRef = useRef(null);

  const fetchDonationHistory = async () => {
    try {
      const res = await API.get("/donors/my-history");
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching donation history:", err);
    }
  };

  useEffect(() => {
    fetchDonationHistory();

    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
    );

    socketRef.current.on("donation-completed", (data) => {
      console.log("Your donation was collected!", data);
      fetchDonationHistory();
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="border rounded p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <img src={donation} alt="Donation" className="w-5 h-5" />
        My Donation History
      </h3>

      {history.length === 0 ? (
        <p className="text-gray-500 text-sm">No donations yet.</p>
      ) : (
        <div className="space-y-2">
          {history.map((donation) => (
            <div
              key={donation._id}
              className="border rounded p-3 text-sm bg-white text-gray-800"
            >
              <p>
                <strong>Blood Group:</strong> {donation.bloodGroup}
              </p>
              <p>
                <strong>Hospital:</strong> {donation.hospitalId || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {donation.status || "completed"}
              </p>
              <p>
                <strong>Collection Date:</strong>{" "}
                {donation.collectionDate
                  ? new Date(donation.collectionDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationHistory;
