// src/components/admin/HospitalApproval.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import hospital from "../../assets/hospital.png";

const HospitalApproval = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    try {
      const res = await API.get("/admin/pending-hospitals");
      setHospitals(res.data);
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const approve = async (id) => {
    try {
      await API.put(`/admin/approve-hospital/${id}`);
      alert(" Hospital approved!");
      fetchHospitals(); // refresh list
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  const reject = async (id, name) => {
    if (!window.confirm(`Reject "${name}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/admin/reject-hospital/${id}`);
      alert("Hospital rejected and removed.");
      fetchHospitals();
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  if (loading)
    return (
      <p className="text-sm text-gray-500">Loading pending hospitals...</p>
    );

  return (
    <div className="card p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <img src={hospital} alt="hospital" style={{ width: "22px" }} />
        Pending Hospital Approvals
      </h3>

      {hospitals.length === 0 ? (
        <p className="text-gray-500 text-sm">No hospitals pending approval.</p>
      ) : (
        <div className="space-y-3">
          {hospitals.map((h) => (
            <div key={h._id} className="border p-3 rounded bg-yellow-50">
              <div className="mb-2">
                {/* ✅ FIXED: h.hospitalName instead of h.name */}
                <p className="font-semibold">{h.hospitalName}</p>
                <p className="text-sm text-gray-600"> {h.email}</p>
                <p className="text-sm text-gray-600"> {h.address}</p>
                <p className="text-sm text-gray-600"> {h.contact}</p>
                <p className="text-sm text-gray-600">
                  License: {h.licenseNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  onClick={() => approve(h._id)}
                >
                  Approve
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  onClick={() => reject(h._id, h.hospitalName)}
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

export default HospitalApproval;
