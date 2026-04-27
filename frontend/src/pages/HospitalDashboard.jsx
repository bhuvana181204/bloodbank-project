// frontend/src/pages/HospitalDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import API from "../services/api";

import InventoryManagement from "../components/hospital/InventoryManagement";
import NearbyDonors from "../components/hospital/NearbyDonors";
import IncomingRequests from "../components/hospital/IncomingRequests";
import DonationLogs from "../components/hospital/DonationLogs";
import NotificationPanel from "../components/NotificationPanel";
import LifecycleTracker from "../components/features/LifecycleTracker";
import CrossBankNetwork from "../components/features/CrossBankNetwork";
import BlockchainVerification from "../components/hospital/BlockchainVerification";
import hospitalIcon from "../assets/hospital.png";
import requestIcon from "../assets/bloodrequests.png";
import inventoryIcon from "../assets/inventory.png";
import donationIcon from "../assets/incomingdonation.png";
import donorsIcon from "../assets/nearbydonors.png";
import logsIcon from "../assets/blockchainviewer.png";
import lifecycleIcon from "../assets/lifecycle.png";
import networkIcon from "../assets/cross.png";
import blockchainIcon from "../assets/blockchainlogs.png";
import alertIcon from "../assets/emergencyalerts.png";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HospitalDashboard({ activeSection = "dashboard" }) {
  const [updateFlag, setUpdateFlag] = useState(false);
  const socketRef = useRef(null);

  const [requestForm, setRequestForm] = useState({
    bloodGroup: "A+",
    requestedUnits: 1,
    priority: "NORMAL",
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const [myRequests, setMyRequests] = useState([]);

  const [emergForm, setEmergForm] = useState({ bloodGroup: "O+", units: 1 });
  const [emergLoading, setEmergLoading] = useState(false);
  const [emergMsg, setEmergMsg] = useState("");

  const [myAlerts, setMyAlerts] = useState({ active: [], fulfilled: [] });
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showFulfilled, setShowFulfilled] = useState(false);

  useEffect(() => {
    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:5000",
    );

    const user = JSON.parse(localStorage.getItem("user"));
    if (user?._id) {
      socketRef.current.emit("join-room", user._id);
    }

    socketRef.current.on("pending-donation", () => {
      setUpdateFlag((prev) => !prev);
    });

    fetchMyRequests();
    fetchMyAlerts();

    socketRef.current.on("donor-accepted-alert", () => {
      fetchMyAlerts();
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await API.get("/requests");
      setMyRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    }
  };

  const fetchMyAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await API.get("/emergency-alerts/my-alerts");
      setMyAlerts({
        active: res.data.active || [],
        fulfilled: res.data.fulfilled || [],
      });
    } catch (_) {
    } finally {
      setAlertsLoading(false);
    }
  };

  const fulfillAlert = async (alertId) => {
    try {
      await API.put(`/emergency-alerts/${alertId}/fulfill`);
      fetchMyAlerts();
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestMessage("");
    try {
      const res = await API.post("/requests/create", requestForm);
      setRequestMessage(
        ` Request submitted! Status: ${res.data.request?.status || "PENDING"}`,
      );
      fetchMyRequests();
    } catch (err) {
      setRequestMessage("❌ " + (err?.response?.data?.message || err.message));
    } finally {
      setRequestLoading(false);
    }
  };

  const submitEmergencyAlert = async (e) => {
    e.preventDefault();
    setEmergLoading(true);
    setEmergMsg("");
    try {
      await API.post("/emergency-alerts", emergForm);
      setEmergMsg(" Emergency alert sent! Matching donors will be notified.");
      fetchMyAlerts();
    } catch (err) {
      setEmergMsg("❌ " + (err?.response?.data?.message || err.message));
    } finally {
      setEmergLoading(false);
    }
  };

  const markTransfusion = async (requestId) => {
    if (!window.confirm("Mark this request as transfusion complete?")) return;
    try {
      const res = await API.post(`/requests/transfusion/${requestId}`);
      alert(res.data.message);
      fetchMyRequests();
    } catch (err) {
      alert("Error: " + (err?.response?.data?.error || err.message));
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 font-semibold";
      case "REJECTED":
        return "text-red-600 font-semibold";
      case "PENDING":
        return "text-yellow-600 font-semibold";
      case "FULFILLED":
        return "text-blue-600 font-semibold";
      default:
        return "";
    }
  };

  const sectionTitles = {
    dashboard: (
      <span className="flex items-center gap-2">
        <img src={hospitalIcon} className="w-6 h-6" />
        Hospital Dashboard
      </span>
    ),
    requests: (
      <span className="flex items-center gap-2">
        <img src={requestIcon} className="w-5 h-5" />
        Blood Requests
      </span>
    ),
    inventory: (
      <span className="flex items-center gap-2">
        <img src={inventoryIcon} className="w-5 h-5" />
        Inventory Management
      </span>
    ),
    donations: (
      <span className="flex items-center gap-2">
        <img src={donationIcon} className="w-5 h-5" />
        Incoming Donations
      </span>
    ),
    donors: (
      <span className="flex items-center gap-2">
        <img src={donorsIcon} className="w-5 h-5" />
        Nearby Donors
      </span>
    ),
    logs: (
      <span className="flex items-center gap-2">
        <img src={logsIcon} className="w-5 h-5" />
        Donation Logs
      </span>
    ),
    lifecycle: (
      <span className="flex items-center gap-2">
        <img src={lifecycleIcon} className="w-5 h-5" />
        Blood Lifecycle Tracker
      </span>
    ),
    network: (
      <span className="flex items-center gap-2">
        <img src={networkIcon} className="w-5 h-5" />
        Cross-Bank Network
      </span>
    ),
    blockchain: (
      <span className="flex items-center gap-2">
        <img src={blockchainIcon} className="w-5 h-5" />
        Blockchain Verification
      </span>
    ),
  };

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2
          className="panel-title"
          style={{ fontSize: "1.4rem", borderBottom: "none", marginBottom: 0 }}
        >
          {sectionTitles[activeSection] || "🏥 Hospital Dashboard"}
        </h2>
      </div>

      <div
        style={{
          display:
            activeSection === "dashboard" || activeSection === "requests"
              ? "block"
              : "none",
        }}
      >
        <NotificationPanel />
        {/* Blood Request Form */}
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={requestIcon} className="w-5 h-5" />
            Create Blood Request
          </h3>
          <form
            onSubmit={submitRequest}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            <div>
              <label>Blood Group</label>
              <select
                value={requestForm.bloodGroup}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, bloodGroup: e.target.value })
                }
                style={{ width: "auto", marginBottom: 0 }}
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Units Needed</label>
              <input
                type="number"
                min="1"
                value={requestForm.requestedUnits}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    requestedUnits: parseInt(e.target.value),
                  })
                }
                style={{ width: 80, marginBottom: 0 }}
                required
              />
            </div>
            <div>
              <label>Priority</label>
              <select
                value={requestForm.priority}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, priority: e.target.value })
                }
                style={{ width: "auto", marginBottom: 0 }}
              >
                <option value="NORMAL">Normal</option>
                <option value="EMERGENCY">🚨 Emergency</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={requestLoading}
              className="btn-red"
              style={{ marginBottom: 0 }}
            >
              {requestLoading ? "Submitting…" : "Submit Request"}
            </button>
          </form>
          {requestMessage && (
            <p
              style={{
                marginTop: 10,
                fontSize: "0.88rem",
                color: requestMessage.startsWith("✅") ? "#059669" : "#dc2626",
              }}
            >
              {requestMessage}
            </p>
          )}
        </div>

        {/* My Blood Requests */}
        <div className="panel">
          <h3 className="panel-title">📋 My Blood Requests</h3>
          {myRequests.length === 0 ? (
            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
              No requests yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "#dc2626" }}>
                      {req.bloodGroup}
                    </span>
                    <span
                      style={{
                        color: "#6b7280",
                        marginLeft: 8,
                        fontSize: "0.85rem",
                      }}
                    >
                      × {req.requestedUnits} units
                    </span>
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color:
                          req.status === "APPROVED"
                            ? "#059669"
                            : req.status === "REJECTED"
                              ? "#dc2626"
                              : req.status === "FULFILLED"
                                ? "#0096FF"
                                : "#d97706",
                      }}
                    >
                      {req.status}
                    </span>
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "0.75rem",
                        marginLeft: 8,
                      }}
                    >
                      {req.priority}
                    </span>
                  </div>
                  {req.status === "APPROVED" && (
                    <button
                      onClick={() => markTransfusion(req._id)}
                      style={{
                        background: "#7c3aed",
                        fontSize: "0.8rem",
                        padding: "6px 14px",
                      }}
                    >
                      💉 Mark Transfusion
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(activeSection === "dashboard" || activeSection === "donors") && (
        <>
          {/* ── Emergency Alert Panel ── */}
          <div
            className="border-2 border-red-400 rounded p-4 bg-red-50"
            style={{ marginBottom: 16 }}
          >
            <h3 className="text-lg font-semibold mb-1 text-red-700 flex items-center gap-2">
              <img src={alertIcon} className="w-5 h-5" />
              Send Emergency Blood Alert
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Saves alert to database. Online donors notified instantly; offline
              donors see it on next login.
            </p>
            <form
              onSubmit={submitEmergencyAlert}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                alignItems: "flex-end",
                marginBottom: 12,
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Blood Group
                </label>
                <select
                  value={emergForm.bloodGroup}
                  onChange={(e) =>
                    setEmergForm({ ...emergForm, bloodGroup: e.target.value })
                  }
                  className="border p-2 rounded"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Units Needed
                </label>
                <input
                  type="number"
                  min="1"
                  value={emergForm.units}
                  onChange={(e) =>
                    setEmergForm({
                      ...emergForm,
                      units: parseInt(e.target.value),
                    })
                  }
                  className="border p-2 rounded w-20"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={emergLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {emergLoading ? "Sending…" : "🚨 Send Alert"}
              </button>
            </form>
            {emergMsg && (
              <p
                className={`mb-3 text-sm font-semibold ${emergMsg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}
              >
                {emergMsg}
              </p>
            )}

            {/* ── Active Emergencies ── */}
            {alertsLoading ? (
              <p className="text-xs text-gray-400">Loading alerts…</p>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <p className="text-sm font-bold text-red-700 mb-1">
                    Active Emergencies ({myAlerts.active.length})
                  </p>
                  {myAlerts.active.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">
                      No active emergency alerts.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {myAlerts.active.map((a) => (
                        <div
                          key={a._id}
                          className="bg-white border border-red-200 rounded p-2 flex justify-between items-center flex-wrap gap-2"
                        >
                          <div>
                            <span className="font-bold text-red-700 mr-2">
                              {a.bloodGroup}
                            </span>
                            <span className="text-sm">
                              {a.unitsReceived || 0}/{a.units} units received
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(a.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                            }}
                          >
                            {/* Progress bar */}
                            <div
                              style={{
                                width: 80,
                                height: 6,
                                background: "#fecaca",
                                borderRadius: 4,
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(((a.unitsReceived || 0) / a.units) * 100, 100)}%`,
                                  height: "100%",
                                  background: "#16a34a",
                                  borderRadius: 4,
                                  transition: "width 0.3s",
                                }}
                              />
                            </div>
                            <button
                              onClick={() => fulfillAlert(a._id)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 border border-green-300"
                            >
                              ✓ Mark Fulfilled
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Fulfilled Emergencies ── */}
                <div>
                  <button
                    onClick={() => setShowFulfilled((f) => !f)}
                    className="text-xs text-gray-500 underline"
                  >
                    {showFulfilled ? "▲ Hide" : "▼ Show"} Completed Emergencies
                    ({myAlerts.fulfilled.length})
                  </button>
                  {showFulfilled && myAlerts.fulfilled.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {myAlerts.fulfilled.map((a) => (
                        <div
                          key={a._id}
                          className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 flex justify-between"
                        >
                          <span>
                            ✅ {a.bloodGroup} — {a.units} units — {a.hospital}
                          </span>
                          <span className="text-gray-400">
                            {new Date(
                              a.fulfilledAt || a.createdAt,
                            ).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showFulfilled && myAlerts.fulfilled.length === 0 && (
                    <p className="text-xs text-gray-400 italic mt-1">
                      No completed emergencies yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="panel">
            <h3 className="panel-title flex items-center gap-2">
              <img src={donorsIcon} alt="donors" width="24" />
              Nearby Donors
            </h3>
            <NearbyDonors />
          </div>
        </>
      )}
      {(activeSection === "dashboard" || activeSection === "inventory") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={inventoryIcon} alt="inventory" width="24" />
            Inventory
          </h3>
          <InventoryManagement />
        </div>
      )}
      {(activeSection === "dashboard" || activeSection === "donations") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={donationIcon} alt="donations" width="24" />
            Incoming Donations
          </h3>
          <IncomingRequests
            socket={socketRef.current}
            updateFlag={updateFlag}
          />
        </div>
      )}
      {(activeSection === "dashboard" || activeSection === "logs") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={logsIcon} alt="logs" width="24" />
            Donation Logs
          </h3>
          <DonationLogs />
        </div>
      )}
      {(activeSection === "dashboard" || activeSection === "lifecycle") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={lifecycleIcon} alt="lifecycle" width="24" />
            Blood Lifecycle
          </h3>
          <LifecycleTracker />
        </div>
      )}
      {(activeSection === "dashboard" || activeSection === "network") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={networkIcon} alt="network" width="24" />
            Cross-Bank Network
          </h3>
          <CrossBankNetwork />
        </div>
      )}
      {(activeSection === "dashboard" || activeSection === "blockchain") && (
        <div className="panel">
          <h3 className="panel-title flex items-center gap-2">
            <img src={blockchainIcon} alt="blockchain" width="24" />
            Blockchain Verification
          </h3>
          <BlockchainVerification />
        </div>
      )}
    </div>
  );
}
