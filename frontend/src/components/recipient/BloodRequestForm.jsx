// src/components/recipient/BloodRequestForm.jsx
import React, { useState } from "react";
import API from "../../services/api";

const BloodRequestForm = () => {
  const [form, setForm] = useState({
    bloodGroup: "",
    units: 1,
    priority: "NORMAL",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/requests", {
        bloodGroup: form.bloodGroup,
        units: parseInt(form.units),
        priority: form.priority,
      });

      setMessage(` Request submitted! Status: ${res.data.status}`);
      setForm({ bloodGroup: "", units: 1, priority: "NORMAL" });
    } catch (err) {
      setMessage("❌ " + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3">🩸 Request Blood</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Blood Group</label>
          <select
            className="border p-2 w-full rounded"
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            required
          >
            <option value="">Select Blood Group</option>
            {bloodGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Units Needed</label>
          <input
            type="number"
            min="1"
            className="border p-2 w-full rounded"
            value={form.units}
            onChange={(e) => setForm({ ...form, units: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            className="border p-2 w-full rounded"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="NORMAL">Normal</option>
            <option value="EMERGENCY">🚨 Emergency</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default BloodRequestForm;
