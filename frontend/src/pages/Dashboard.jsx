// src/pages/Dashboard.jsx

import { useNavigate } from "react-router-dom";
import DonorDashboard from "./DonorDashboard";
import HospitalDashboard from "./HospitalDashboard";
import BloodBankDashboard from "./BloodBankDashboard";
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // ✅ Logout Function
  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // =========================
  // Donor Dashboard
  // =========================
  if (role === "Donor") {
    return (
      <>
        <DonorDashboard />
        <button onClick={logout} className="btn bg-red-500 m-4">
          Logout
        </button>
      </>
    );
  }

  // =========================
  // Hospital Dashboard
  // =========================
  if (role === "Hospital") {
    return (
      <>
        <HospitalDashboard />
        <button onClick={logout} className="btn bg-red-500 m-4">
          Logout
        </button>
      </>
    );
  }

  // =========================
  // Blood Bank Dashboard
  // =========================
  if (role === "BloodBank") {
    return (
      <>
        <BloodBankDashboard />
        <button onClick={logout} className="btn bg-red-500 m-4">
          Logout
        </button>
      </>
    );
  }

  // =========================
  // Admin Dashboard
  // =========================
  if (role === "Admin") {
    return (
      <>
        <AdminDashboard />
        <button onClick={logout} className="btn bg-red-500 m-4">
          Logout
        </button>
      </>
    );
  }

  // =========================
  // Default (Not Logged In)
  // =========================
  return (
    <div className="card p-6">
      <h2>Please login first</h2>
      <button onClick={() => navigate("/login")} className="btn mt-3">
        Go to Login
      </button>
    </div>
  );
}
