// src/pages/Home.jsx — Professional landing page
import { Link } from "react-router-dom";
import blockchainIcon from "../assets/blockchainrecord.png";
import verifyIcon from "../assets/verifybloodunit.png";
import hospitalIcon from "../assets/hospitalintegration.png";
import fraudIcon from "../assets/frauddectection.png";

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#DC2626 0%,#b91c1c 100%)",
          color: "#fff",
          borderRadius: 16,
          padding: "44px 36px",
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: 10,
            fontFamily: "'Times New Roman',Times,serif",
          }}
        >
          BloodChain - Blockchain Blood Bank
        </h1>
        <p
          style={{
            fontSize: "1rem",
            opacity: 0.92,
            maxWidth: 560,
            marginBottom: 26,
            lineHeight: 1.7,
          }}
        >
          A secure, transparent platform for managing blood donations,
          inventory, and hospital requests - powered by blockchain technology.
        </p>
        <Link to="/login">
          <button
            style={{
              background: "#fff",
              color: "#dc2626",
              fontWeight: 700,
              padding: "11px 26px",
              borderRadius: 8,
              border: "none",
              fontSize: "0.95rem",
            }}
          >
            Get Started 
          </button>
        </Link>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {[
          {
            icon: blockchainIcon,
            title: "Blockchain Records",
            desc: "Tamper-proof donor data stored in a blockchain",
          },
          {
            icon: verifyIcon,
            title: "Verify Blood Units",
            desc: "Verify authenticity of blood units in seconds",
          },
          {
            icon: hospitalIcon,
            title: "Hospital Integration",
            desc: "Hospitals can request blood and track inventory",
          },
          {
            icon: fraudIcon,
            title: "Fraud Detection",
            desc: "AI-powered detection of fraudulent donation patterns",
          },
        ].map((f) => (
          <div
            className="card"
            key={f.title}
            style={{ borderTop: "3px solid #DC2626" }}
          >
            <img
              src={f.icon}
              alt={f.title}
              style={{ width: 40, height: 40, marginBottom: 10 }}
            />
            <h3
              style={{
                fontWeight: 700,
                marginBottom: 6,
                fontSize: "0.98rem",
                fontFamily: "'Times New Roman',Times,serif",
              }}
            >
              {f.title}
            </h3>
            <p
              style={{ color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.6 }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
