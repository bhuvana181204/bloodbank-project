import { useEffect, useState } from "react";
import api from "../../services/api";
import user from "../../assets/user.png";
import hospital from "../../assets/hospital.png";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // "users" | "hospitals"

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, hospitalsRes] = await Promise.all([
        api.get("/users"),
        api.get("/admin/all-hospitals"),
      ]);
      setUsers(usersRes.data);
      setHospitals(hospitalsRes.data);
    } catch (err) {
      console.error("Failed to fetch users/hospitals", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete user");
    }
  };

  const deleteHospital = async (id) => {
    if (!window.confirm("Are you sure you want to remove this hospital?"))
      return;
    try {
      await api.delete(`/admin/reject-hospital/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Hospital delete failed", err);
      alert("Failed to remove hospital");
    }
  };

  const roleColors = {
    donor: "bg-green-100 text-green-700",
    bloodbank: "bg-blue-100 text-blue-700",
    admin: "bg-purple-100 text-purple-700",
    hospital: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="card p-4 mt-6">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
            activeTab === "users"
              ? "bg-blue-600 text-white shadow"
              : "bg-white border text-gray-600 hover:bg-gray-100"
          }`}
        >
          <img src={user} alt="users" className="w-4 h-4" />
          Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("hospitals")}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
            activeTab === "hospitals"
              ? "bg-blue-600 text-white shadow"
              : "bg-white border text-gray-600 hover:bg-gray-100"
          }`}
        >
          <img src={hospital} alt="hospitals" className="w-4 h-4" />
          Hospitals ({hospitals.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : activeTab === "users" ? (
        users.length === 0 ? (
          <p className="text-gray-500 text-sm">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">#</th>
                  <th className="border px-3 py-2 text-left">Name</th>
                  <th className="border px-3 py-2 text-left">Email</th>
                  <th className="border px-3 py-2 text-left">Role</th>
                  <th className="border px-3 py-2 text-left">Joined</th>
                  <th className="border px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user._id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border px-3 py-1 text-gray-400">{i + 1}</td>
                    <td className="border px-3 py-1 font-medium">
                      {user.name}
                    </td>
                    <td className="border px-3 py-1 text-gray-600">
                      {user.email}
                    </td>
                    <td className="border px-3 py-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${roleColors[user.role] || "bg-gray-100 text-gray-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="border px-3 py-1 text-gray-400 text-xs">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="border px-3 py-1">
                      <button
                        className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600"
                        onClick={() => deleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : hospitals.length === 0 ? (
        <p className="text-gray-500 text-sm">No hospitals found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border text-sm">
            <thead>
              <tr className="bg-orange-50">
                <th className="border px-3 py-2 text-left">#</th>
                <th className="border px-3 py-2 text-left">Hospital Name</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">License No.</th>
                <th className="border px-3 py-2 text-left">Contact</th>
                <th className="border px-3 py-2 text-left">Status</th>
                <th className="border px-3 py-2 text-left">Registered</th>
                <th className="border px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, i) => (
                <tr
                  key={h._id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border px-3 py-1 text-gray-400">{i + 1}</td>
                  <td className="border px-3 py-1 font-medium">
                    {h.hospitalName}
                  </td>
                  <td className="border px-3 py-1 text-gray-600">{h.email}</td>
                  <td className="border px-3 py-1 text-gray-600">
                    {h.licenseNumber}
                  </td>
                  <td className="border px-3 py-1 text-gray-600">
                    {h.contact}
                  </td>
                  <td className="border px-3 py-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${h.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {h.isApproved ? " Approved" : " Pending"}
                    </span>
                  </td>
                  <td className="border px-3 py-1 text-gray-400 text-xs">
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="border px-3 py-1">
                    <button
                      className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600"
                      onClick={() => deleteHospital(h._id)}
                    >
                      Remove
                    </button>
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
