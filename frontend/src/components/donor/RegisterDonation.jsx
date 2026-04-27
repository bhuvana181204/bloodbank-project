// frontend/src/components/donor/RegisterDonation.jsx
import React, { useState, useEffect } from "react";
import API from "../../services/api";
import blood from "../../assets/blood.png";

export default function RegisterDonation({ fetchHistory }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    API.get("/hospitals/approved")
      .then((res) => setHospitals(res.data))
      .catch((err) => {
        console.error("Failed to load hospitals:", err);
        setHospitals([]);
      });
  }, []);

  const handleDonate = async () => {
    if (!selectedHospital) {
      setMessage("❌ Please select a hospital first.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await API.post("/donors/donate", { hospitalId: selectedHospital });
      setMessage("Donation registered! The hospital will confirm it.");
      setSelectedHospital("");
      fetchHistory();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message;
      setMessage("❌ " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <img src={blood} className="w-5 h-5" alt="donation" />
        Register Blood Donation
      </h3>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">
          Select Hospital
        </label>
        <select
          className="border p-2 w-full rounded"
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
        >
          <option value="">-- Choose a Hospital --</option>
          {hospitals.length === 0 && (
            <option disabled>No approved hospitals found</option>
          )}
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>
              {h.hospitalName} — {h.address}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleDonate}
        disabled={loading}
        className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register Donation"}
      </button>

      {message && (
        <p
          className={`mt-2 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
