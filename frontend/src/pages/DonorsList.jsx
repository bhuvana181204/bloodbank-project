// src/pages/DonorsList.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function DonorsList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/donors")
      .then((r) => setList(r.data || []))
      .catch((e) => {
        console.error(e);
        alert("Error fetching donors");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.bloodGroup || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-red-700">🩸 Donors List</h2>
      <p className="text-gray-500 mb-4">
        Total: <strong>{list.length}</strong> registered donors
      </p>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, blood group or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading donors…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-600">No donors found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-red-50 text-red-800 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 border-b">#</th>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Blood Group</th>
                <th className="px-4 py-3 border-b">Age</th>
                <th className="px-4 py-3 border-b">Location</th>
                <th className="px-4 py-3 border-b">Contact</th>
                <th className="px-4 py-3 border-b">Availability</th>
                <th className="px-4 py-3 border-b">Last Donation</th>
                <th className="px-4 py-3 border-b">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d._id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 border-b text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 border-b font-semibold text-gray-800">
                    {d.name || "—"}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span className="inline-block bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-xs">
                      {d.bloodGroup || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b text-center text-gray-600">
                    {d.age || "—"}
                  </td>
                  <td className="px-4 py-3 border-b text-gray-600">
                    {d.location || "—"}
                  </td>
                  <td className="px-4 py-3 border-b text-gray-600">
                    {d.contact || "—"}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        d.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {d.isAvailable ? "✅ Available" : "❌ Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b text-gray-600">
                    {d.lastDonationDate
                      ? new Date(d.lastDonationDate).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 border-b text-gray-400 text-xs">
                    {d.createdAt
                      ? new Date(d.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
