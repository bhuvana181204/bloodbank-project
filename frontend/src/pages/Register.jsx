// frontend/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "donor" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    try {
      const res = await api.post("/auth/register", form);
      const data = res.data;
      if (data.pending) {
        // Blood Bank — show pending message, do NOT redirect to login
        setSuccessMsg(data.message);
      } else {
        // Donor — registered immediately, go to login
        alert(data.message || "Registered successfully! Please login.");
        navigate("/login");
      }
    } catch (err) {
      alert(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = {
    donor: {
      note: "✅ Donors can register and login immediately — no approval needed.",
      color: "text-green-700 bg-green-50 border-green-200",
    },
    bloodbank: {
      note: "⏳ Blood Bank accounts require admin approval before you can login. You will receive access once the admin approves your registration.",
      color: "text-orange-700 bg-orange-50 border-orange-200",
    },
  };

  const info = roleInfo[form.role];

  return (
    <div className="p-6 max-w-md mx-auto card">
      <h2 className="text-2xl mb-4 font-bold">Register</h2>

      {successMsg ? (
        <div className="bg-orange-50 border border-orange-300 rounded p-5 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-orange-800 font-semibold mb-2">Registration Submitted!</p>
          <p className="text-orange-700 text-sm mb-4">{successMsg}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 underline text-sm"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            name="name" placeholder="Full Name" value={form.name}
            onChange={handleChange}
            className="input border p-2 w-full rounded" required
          />
          <input
            name="email" type="email" placeholder="Email" value={form.email}
            onChange={handleChange}
            className="input border p-2 w-full rounded" required
          />
          <input
            name="password" type="password"
            placeholder="Password (min 6 characters)" value={form.password}
            onChange={handleChange}
            className="input border p-2 w-full rounded" required minLength={6}
          />

          <div>
            <label className="block text-sm font-medium mb-1">Register As</label>
            <select
              name="role" value={form.role} onChange={handleChange}
              className="input border p-2 w-full rounded"
            >
              <option value="donor">Donor</option>
              <option value="bloodbank">Blood Bank</option>
            </select>
          </div>

          {/* Role-specific info banner */}
          {info && (
            <div className={`text-sm border rounded p-3 ${info.color}`}>
              {info.note}
            </div>
          )}

          <p className="text-sm text-gray-500 italic">
            Are you a hospital?{" "}
            <span
              className="text-blue-600 cursor-pointer underline"
              onClick={() => navigate("/hospital-register")}
            >
              Register as Hospital
            </span>
          </p>

          <button
            className="bg-red-600 text-white px-4 py-2 rounded w-full hover:bg-red-700 disabled:opacity-50"
            type="submit" disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      )}

      <p className="mt-3 text-sm text-center">
        Already have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
}
