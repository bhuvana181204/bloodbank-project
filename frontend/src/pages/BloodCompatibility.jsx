// frontend/src/pages/BloodCompatibility.jsx
// ✅ NEW: Blood Compatibility Chart — visible to ALL roles (public)

export default function BloodCompatibility() {
  const compatibility = {
    "O-":  ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "O+":  ["A+", "B+", "AB+", "O+"],
    "A-":  ["A+", "A-", "AB+", "AB-"],
    "A+":  ["A+", "AB+"],
    "B-":  ["B+", "B-", "AB+", "AB-"],
    "B+":  ["B+", "AB+"],
    "AB-": ["AB+", "AB-"],
    "AB+": ["AB+"],
  };

  const recipients = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const donors     = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

  const isCompatible = (donor, recipient) =>
    compatibility[donor]?.includes(recipient);

  return (
    <div className="p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div className="card mb-6" style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px" }}>
        <span style={{ fontSize: "2rem" }}>🧬</span>
        <div>
          <h1 className="font-bold" style={{ fontSize: "1.5rem", color: "#1f2937" }}>Blood Compatibility Chart</h1>
          <p style={{ color: "#6b7280", fontSize: "0.83rem", marginTop: 2 }}>
            Green cells indicate compatible donor → recipient combinations.
          </p>
        </div>
      </div>

      {/* Matrix — dark themed like the reference image */}
      <div style={{ background: "#0f172a", borderRadius: 14, padding: "24px 20px", marginBottom: 24, overflowX: "auto" }}>
        <p style={{ color: "#475569", fontSize: "0.68rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Donor → Recipient Compatibility Matrix
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ background: "#1e293b", color: "#64748b", fontSize: "0.72rem", padding: "10px 14px", textAlign: "left", border: "1px solid #334155", fontWeight: 700 }}>
                Donor ↓
              </th>
              {recipients.map((r) => (
                <th key={r} style={{ background: "#1e293b", color: "#94a3b8", fontSize: "0.8rem", padding: "10px 10px", textAlign: "center", border: "1px solid #334155", fontWeight: 700, minWidth: 50 }}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => (
              <tr key={donor}>
                <td style={{ background: "#1e293b", color: "#cbd5e1", fontWeight: 700, fontSize: "0.82rem", padding: "10px 14px", border: "1px solid #334155", textAlign: "center" }}>
                  {donor}
                </td>
                {recipients.map((recipient) => {
                  const ok = isCompatible(donor, recipient);
                  return (
                    <td
                      key={recipient}
                      style={{
                        background: ok ? "rgba(16,185,129,0.18)" : "#0f172a",
                        textAlign: "center",
                        padding: "10px 6px",
                        border: "1px solid #1e293b",
                        transition: "background 0.1s",
                      }}
                    >
                      {ok ? (
                        <span style={{ color: "#34d399", fontWeight: 700, fontSize: "1rem" }}>✓</span>
                      ) : (
                        <span style={{ color: "#334155", fontSize: "0.7rem" }}>·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom note */}
        <div style={{ marginTop: 18, background: "#172554", border: "1px solid #1d4ed8", borderRadius: 8, padding: "12px 16px", color: "#bfdbfe", fontSize: "0.83rem" }}>
          <strong>O−</strong> is the universal donor (can give to all). &nbsp;
          <strong>AB+</strong> is the universal recipient (can receive from all).
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 16 }}>
        {[
          { icon: "🌍", title: "Universal Donor", type: "O−", desc: "Can donate to all 8 blood types", color: "#dc2626", bg: "#fee2e2" },
          { icon: "🏥", title: "Universal Recipient", type: "AB+", desc: "Can receive from all 8 blood types", color: "#2563eb", bg: "#dbeafe" },
          { icon: "⏱️", title: "Donation Interval", type: "90 days", desc: "Minimum wait between donations", color: "#d97706", bg: "#fef3c7" },
        ].map((c) => (
          <div className="card" key={c.title} style={{ borderLeft: `4px solid ${c.color}`, textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{c.icon}</div>
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#374151", marginBottom: 6 }}>{c.title}</h3>
            <span style={{ display: "inline-block", background: c.bg, color: c.color, fontWeight: 700, padding: "4px 14px", borderRadius: 20, fontSize: "1rem" }}>
              {c.type}
            </span>
            <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: 8 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
