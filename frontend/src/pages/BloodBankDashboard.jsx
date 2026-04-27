// frontend/src/pages/BloodBankDashboard.jsx
// ✅ FIX #ERROR3: Removed blocking Promise.all — now loads sections independently
// ✅ FIX #ERROR4: inventory returns { summary, units } — fixed to handle this structure
import { useEffect, useState, useRef } from "react";

import { io } from "socket.io-client";
import API from "../services/api";
import BloodHeatmap from "../components/features/BloodHeatmap";
import CrossBankNetwork from "../components/features/CrossBankNetwork";
import BloodBankBlockchain from "../components/features/BloodBankBlockchain";

export default function BloodBankDashboard({ activeSection = "dashboard" }) {
  const [donors, setDonors] = useState([]);
  const [bloodSummary, setBloodSummary] = useState({});
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [donorsLoading, setDonorsLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [donorsError, setDonorsError] = useState(null);
  const [inventoryError, setInventoryError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ FIX #ERROR3: Load sections independently — one failure won't block others
    fetchDonors();
    fetchInventory();
    fetchEmergencyAlerts();

    // Socket connection for real-time emergency alerts
    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
    );

    socketRef.current.on("emergency-alert", (data) => {
      setEmergencyAlerts((prev) => [data, ...prev]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchDonors = async () => {
    setDonorsLoading(true);
    setDonorsError(null);
    try {
      const res = await API.get("/donors");
      setDonors(res.data || []);
    } catch (err) {
      console.error("Donors fetch error:", err);
      setDonorsError("Could not load donors. Please refresh.");
    } finally {
      setDonorsLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      // ✅ FIX #ERROR4: inventory returns { summary, units } — extract summary
      const res = await API.get("/inventory");
      const data = res.data;

      // Handle both old array response and new { summary, units } response
      let summaryArr = [];
      if (Array.isArray(data)) {
        summaryArr = data;
      } else if (data && Array.isArray(data.summary)) {
        summaryArr = data.summary;
      } else if (data && Array.isArray(data.units)) {
        summaryArr = data.units;
      }

      // Build bloodGroup → total units map
      const map = {};
      summaryArr.forEach((item) => {
        if (item.bloodGroup) {
          map[item.bloodGroup] = (map[item.bloodGroup] || 0) + (item.availableUnits || 0);
        }
      });
      setBloodSummary(map);
    } catch (err) {
      console.error("Inventory fetch error:", err);
      setInventoryError("Could not load inventory. Please refresh.");
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchEmergencyAlerts = async () => {
    try {
      // Use persistent emergency-alerts endpoint — only returns ACTIVE alerts
      // so fulfilled emergencies no longer show up on the dashboard
      const res = await API.get("/emergency-alerts/active");
      setEmergencyAlerts(res.data.alerts || []);
    } catch (err) {
      // Fallback to old notifications endpoint if new one unavailable
      try {
        const notifRes = await API.get("/notifications");
        const existing = (notifRes.data || []).filter(n => n.type === "EMERGENCY_ALERT");
        setEmergencyAlerts(existing);
      } catch (_) {
        console.log("Emergency alerts load skipped");
      }
    }
  };

  const sectionTitles = {
    dashboard: "🏦 Blood Bank Dashboard", inventory: "📦 Inventory", donors: "🩸 Donors",
    alerts: "🚨 Emergency Alerts", heatmap: "🗺️ Blood Heatmap", network: "🌐 Cross-Bank Network", blockchain: "🔗 Blockchain Records",
  };

  return (
    <div>
      <div className="panel" style={{ marginBottom:16 }}>
        <h2 style={{ fontSize:"1.4rem", fontWeight:700, fontFamily:"'Times New Roman',Times,serif" }}>
          {sectionTitles[activeSection] || "🏦 Blood Bank Dashboard"}
        </h2>
      </div>

      {/* Emergency Alerts */}
      {(activeSection === "dashboard" || activeSection === "alerts") && emergencyAlerts.length > 0 && (
        <div className="panel" style={{ borderLeft:"4px solid #dc2626" }}>
          <h3 className="panel-title">🚨 Emergency Alerts</h3>
          <div className="space-y-2">
            {emergencyAlerts.slice(0, 5).map((a, i) => (
              <div key={i} style={{ background:"#fff5f5", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:"0.88rem", color:"#991b1b" }}>
                {a.message || `Emergency: ${a.bloodGroup} blood needed — ${a.units} units`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blood Stock */}
      {(activeSection === "dashboard" || activeSection === "inventory") && (
        <div className="panel">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3 className="panel-title" style={{ marginBottom:0, borderBottom:"none" }}>🩸 Blood Stock Overview</h3>
            <button onClick={fetchInventory} className="btn-gray" style={{ fontSize:"0.78rem", padding:"5px 12px" }}>🔄 Refresh</button>
          </div>
          {inventoryLoading ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, color:"#9ca3af", padding:"16px 0" }}>
              <div className="animate-spin" style={{ width:16, height:16, borderRadius:"50%", borderBottom:"2px solid #0096FF" }}></div>
              Loading inventory…
            </div>
          ) : inventoryError ? (
            <div className="alert alert-error">{inventoryError} <button onClick={fetchInventory} style={{ background:"none", color:"#0096FF", padding:0, textDecoration:"underline", boxShadow:"none" }}>Retry</button></div>
          ) : Object.keys(bloodSummary).length === 0 ? (
            <p style={{ color:"#9ca3af", fontStyle:"italic" }}>No inventory data.</p>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px,1fr))", gap:12 }}>
              {Object.entries(bloodSummary).map(([group, units]) => (
                <div key={group} style={{ background: units < 5 ? "#fff5f5" : "#f0fdf4", border:`1px solid ${units < 5 ? "#fca5a5" : "#86efac"}`, borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:"1.2rem", fontWeight:700, color:"#dc2626" }}>{group}</div>
                  <div style={{ fontSize:"1.8rem", fontWeight:700, marginTop:4 }}>{units}</div>
                  <div style={{ fontSize:"0.7rem", color:"#9ca3af" }}>units</div>
                  {units < 5 && <div style={{ fontSize:"0.7rem", color:"#dc2626", marginTop:4 }}>⚠ Low</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Donors */}
      {(activeSection === "dashboard" || activeSection === "donors") && (
        <div className="panel">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 className="panel-title" style={{ marginBottom:0, borderBottom:"none" }}>👥 Donors ({donorsLoading ? "…" : donors.length})</h3>
            <button onClick={fetchDonors} className="btn-gray" style={{ fontSize:"0.78rem", padding:"5px 12px" }}>🔄 Refresh</button>
          </div>
          {donorsLoading ? (
            <div style={{ display:"flex", alignItems:"center", gap:8, color:"#9ca3af", padding:"16px 0" }}>
              <div className="animate-spin" style={{ width:16, height:16, borderRadius:"50%", borderBottom:"2px solid #0096FF" }}></div>
              Loading donors…
            </div>
          ) : donorsError ? (
            <div className="alert alert-error">{donorsError}</div>
          ) : donors.length === 0 ? (
            <p style={{ color:"#9ca3af", fontStyle:"italic" }}>No donors registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead><tr>
                  <th>Name</th><th>Blood Group</th><th>Age</th><th>Available</th><th>Last Donated</th>
                </tr></thead>
                <tbody>
                  {donors.slice(0,10).map(d => (
                    <tr key={d._id}>
                      <td>{d.name}</td>
                      <td><span style={{ background:"#fee2e2", color:"#dc2626", fontWeight:700, padding:"2px 8px", borderRadius:4, fontSize:"0.8rem" }}>{d.bloodGroup}</span></td>
                      <td style={{ color:"#6b7280" }}>{d.age || "—"}</td>
                      <td>{d.isAvailable ? "✅" : "❌"}</td>
                      <td style={{ color:"#9ca3af", fontSize:"0.8rem" }}>{d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {donors.length > 10 && <p style={{ fontSize:"0.78rem", color:"#9ca3af", marginTop:6 }}>Showing 10 of {donors.length}.</p>}
            </div>
          )}
        </div>
      )}

      {(activeSection === "dashboard" || activeSection === "heatmap") && (
        <div className="panel"><h3 className="panel-title">🗺️ Blood Heatmap</h3><BloodHeatmap /></div>
      )}
      {(activeSection === "dashboard" || activeSection === "network") && (
        <div className="panel"><h3 className="panel-title">🌐 Cross-Bank Network</h3><CrossBankNetwork /></div>
      )}
      {(activeSection === "dashboard" || activeSection === "blockchain") && (
        <div className="panel"><h3 className="panel-title">🔗 Blockchain Records</h3><BloodBankBlockchain /></div>
      )}
    </div>
  );
}
