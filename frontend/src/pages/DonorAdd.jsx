// src/pages/DonorAdd.jsx
import { useState } from "react";
import api from "../services/api";

export default function DonorAdd() {
  const [f, setF] = useState({
    name: "",
    bloodGroup: "",
    contact: "",
    location: "",
  });

  const handleChange = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/donors", f);
      alert("Donor added: " + (res.data.name || "OK"));
      setF({ name: "", bloodGroup: "", contact: "", location: "" });
    } catch (err) {
      console.error(err);
      alert("Error: " + (err?.response?.data?.err || err.message));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl mb-4">Add Donor</h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            name="name"
            value={f.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full p-2 border"
          />

          <input
            name="bloodGroup"
            value={f.bloodGroup}
            onChange={handleChange}
            placeholder="Blood Group (e.g. A+)"
            className="w-full p-2 border"
          />

          <input
            name="contact"
            value={f.contact}
            onChange={handleChange}
            placeholder="Contact"
            className="w-full p-2 border"
          />

          <input
            name="location"
            value={f.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full p-2 border"
          />

          <button type="submit" className="px-4 py-2 bg-green-600 text-white">
            Add Donor
          </button>
        </form>
      </div>
    </div>
  );
}
