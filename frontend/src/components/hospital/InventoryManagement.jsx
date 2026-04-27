// frontend/src/components/hospital/InventoryManagement.jsx
import React, { useEffect, useState } from "react";
import API from "../../services/api";
import inventory from "../../assets/inventory.png";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const InventoryManagement = () => {
  // summary = grouped rows (bloodGroup → total units)
  // units   = individual blood unit documents (for the detail/QR table)
  const [summary, setSummary] = useState([]);
  const [units, setUnits] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    bloodGroup: "A+",
    donorId: "",
    expiryDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastQR, setLastQR] = useState(null);
  const [qrModal, setQrModal] = useState(null); // { unitId, qrCode } for modal

  const fetchInventory = () => {
    API.get("/inventory")
      .then((res) => {
        // BUG FIX: backend now returns { summary, units }
        // summary is grouped (A+|2 instead of A+|1, A+|1)
        // units is the individual documents for the detail view
        if (res.data && res.data.summary !== undefined) {
          setSummary(res.data.summary);
          setUnits(res.data.units);
        } else {
          // Fallback: if old backend returns a plain array, group client-side
          const raw = Array.isArray(res.data) ? res.data : [];
          const map = {};
          for (const item of raw) {
            const g = item.bloodGroup;
            if (!map[g])
              map[g] = {
                bloodGroup: g,
                availableUnits: 0,
                expiryDate: item.expiryDate,
              };
            map[g].availableUnits += item.availableUnits;
            if (item.expiryDate && item.expiryDate < map[g].expiryDate) {
              map[g].expiryDate = item.expiryDate;
            }
          }
          setSummary(Object.values(map));
          setUnits(raw);
        }
      })
      .catch((err) => console.error("Inventory fetch error:", err));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/inventory/add", form);
      setMessage(` Blood unit added! ID: ${res.data.unitId}`);
      setLastQR(res.data.qrCode);
      setForm({ bloodGroup: "A+", donorId: "", expiryDate: "" });
      fetchInventory();
    } catch (err) {
      setMessage("❌ " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center mb-3">
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          {showAddForm ? "Cancel" : "+ Add Blood Unit"}
        </button>
      </div>

      {/* Add Blood Unit Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddUnit}
          className="mb-4 border rounded p-3 bg-green-50 space-y-2"
        >
          <h4 className="font-medium text-sm">
            Add Individual Blood Unit (QR enabled)
          </h4>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Blood Group
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm({ ...form, bloodGroup: e.target.value })
                }
                className="border p-1 rounded text-sm"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Donor ID (optional)
              </label>
              <input
                type="text"
                value={form.donorId}
                onChange={(e) => setForm({ ...form, donorId: e.target.value })}
                placeholder="Donor ID"
                className="border p-1 rounded text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={form.expiryDate}
                required
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className="border p-1 rounded text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Unit & Generate QR"}
          </button>
          {message && (
            <p
              className={`text-sm ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}
          {lastQR && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">
                QR Code for verification:
              </p>
              <img
                src={lastQR}
                alt="Blood Unit QR"
                className="w-32 h-32 border"
              />
            </div>
          )}
        </form>
      )}

      {summary.length === 0 ? (
        <p className="text-gray-500 text-sm">No inventory items found.</p>
      ) : (
        <>
          <table className="w-full text-sm border mb-3">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Blood Group</th>
                <th className="border px-2 py-1">Total Units</th>
                <th className="border px-2 py-1">Earliest Expiry</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item) => (
                <tr
                  key={item.bloodGroup}
                  className={item.availableUnits < 5 ? "bg-red-50" : ""}
                >
                  <td className="border px-2 py-1 text-center font-semibold">
                    {item.bloodGroup}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {item.availableUnits}
                    {item.availableUnits < 5 && (
                      <span className="text-red-600 text-xs ml-1">⚠ Low</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {item.expiryDate
                      ? new Date(item.expiryDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Toggle individual units detail view */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 underline mb-2"
          >
            {showDetails
              ? "▲ Hide individual units"
              : "▼ Show individual units (QR / expiry detail)"}
          </button>

          {showDetails && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1">Blood Group</th>
                    <th className="border px-2 py-1">Units</th>
                    <th className="border px-2 py-1">Expiry</th>
                    <th className="border px-2 py-1">Unit ID</th>
                    <th className="border px-2 py-1">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((item) => (
                    <tr
                      key={item._id}
                      className={
                        item.availableUnits < item.threshold ? "bg-red-50" : ""
                      }
                    >
                      <td className="border px-2 py-1 text-center">
                        {item.bloodGroup}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.availableUnits}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.expiryDate
                          ? new Date(item.expiryDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="border px-2 py-1 text-xs text-gray-500">
                        {item.unitId || "—"}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {item.qrCode ? (
                          <button
                            onClick={() =>
                              setQrModal({
                                unitId: item.unitId,
                                qrCode: item.qrCode,
                              })
                            }
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                          >
                            View QR
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* QR Modal */}
      {qrModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setQrModal(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 24,
              maxWidth: 340,
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
              🔍 Blood Unit QR Code
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginBottom: 12,
                wordBreak: "break-all",
              }}
            >
              ID: {qrModal.unitId}
            </p>
            <img
              src={qrModal.qrCode}
              alt="QR Code"
              style={{
                width: 200,
                height: 200,
                margin: "0 auto",
                display: "block",
                border: "1px solid #e5e7eb",
              }}
            />
            <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 8 }}>
              Scan this QR to verify the blood unit on any device
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <a
                href={qrModal.qrCode}
                download={`QR_${qrModal.unitId}.png`}
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "6px 16px",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  textDecoration: "none",
                }}
              >
                ⬇ Download
              </a>
              <button
                onClick={() => setQrModal(null)}
                style={{
                  background: "#e5e7eb",
                  color: "#374151",
                  padding: "6px 16px",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
