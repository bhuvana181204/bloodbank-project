// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (onLogin) onLogin(res.data.user);
      const role = res.data.user.role.toLowerCase();
      if (role === "donor") navigate("/donor");
      else if (role === "hospital") navigate("/hospital");
      else if (role === "admin") navigate("/admin");
      else if (role === "bloodbank") navigate("/bloodbank");
      else navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 160px)",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 420, padding: "38px 34px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ marginBottom: 8 }}>
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1f2937",
              fontFamily: "'Times New Roman',Times,serif",
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.88rem", marginTop: 4 }}>
            Sign in to your BloodChain account
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            onChange={handleChange}
            required
          />
          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Your password"
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-red"
            style={{
              width: "100%",
              padding: "11px",
              fontSize: "1rem",
              marginTop: 4,
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            textAlign: "center",
            fontSize: "0.88rem",
            color: "#6b7280",
          }}
        >
          <p>
            New user?{" "}
            <span
              style={{ color: "#0096FF", cursor: "pointer", fontWeight: 700 }}
              onClick={() => navigate("/register")}
            >
              Register here
            </span>
          </p>
          <p style={{ marginTop: 6 }}>
            Hospital?{" "}
            <span
              style={{ color: "#0096FF", cursor: "pointer", fontWeight: 700 }}
              onClick={() => navigate("/hospital-register")}
            >
              Register as Hospital
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
