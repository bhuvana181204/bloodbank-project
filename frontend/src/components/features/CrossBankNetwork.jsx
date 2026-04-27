// frontend/src/components/features/CrossBankNetwork.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";
import emergencyIcon from "../../assets/emergencyalerts.png";
import cross from "../../assets/cross.png";
import inventoryIcon from "../../assets/inventory.png";

export default function CrossBankNetwork() {
  const [networkData, setNetworkData] = useState([]);
  const [findResult, setFindResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [findLoading, setFindLoading] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const [findForm, setFindForm] = useState({ bloodGroup: "O-", units: "3" });
  const [broadcastForm, setBroadcastForm] = useState({
    bloodGroup: "O-",
    units: "3",
    hospitalName: "",
    location: "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    setLoading(true);
    try {
      const res = await api.get("/network/inventory");
      setNetworkData(res.data.network || []);
    } catch (err) {
      console.error("Network load error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFind = async () => {
    setFindLoading(true);
    setFindResult(null);
    try {
      const res = await api.get(
        `/network/find?bloodGroup=${findForm.bloodGroup}&units=${findForm.units}`,
      );
      setFindResult(res.data);
    } catch (err) {
      console.error("Find error", err);
    } finally {
      setFindLoading(false);
    }
  };

  const handleBroadcast = async () => {
    setBroadcastLoading(true);
    setBroadcastMsg("");
    try {
      await api.post("/network/emergency-broadcast", broadcastForm);
      setBroadcastMsg(" Emergency broadcast sent to all blood banks!");
    } catch (err) {
      setBroadcastMsg(" Broadcast failed. Try again.");
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-5 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <img src={cross} className="w-6 h-6" />
          Cross-Blood-Bank Network
        </h3>
        <p className="text-sm text-gray-500">
          Live inventory shared across all blood banks — find blood anywhere
        </p>
      </div>

      {/* Network Inventory */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <img src={inventoryIcon} className="w-5 h-5" />
          Live Network Inventory
        </h4>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading network...</p>
        ) : networkData.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No inventory data across the network.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 text-blue-800 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Bank / Hospital</th>
                  <th className="px-3 py-2 text-left">Blood Group</th>
                  <th className="px-3 py-2 text-left">Available Units</th>
                </tr>
              </thead>
              <tbody>
                {networkData.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2 font-medium">{item.bankName}</td>
                    <td className="px-3 py-2">
                      <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-xs">
                        {item.bloodGroup}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`font-bold ${
                          item.totalUnits < 5
                            ? "text-red-600"
                            : item.totalUnits < 20
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {item.totalUnits} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Find Blood Across Network */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3">
          Find Blood Across Network
        </h4>
        <div className="flex gap-3 flex-wrap mb-3">
          <select
            value={findForm.bloodGroup}
            onChange={(e) =>
              setFindForm({ ...findForm, bloodGroup: e.target.value })
            }
            className="border rounded px-3 py-1.5 text-sm"
          >
            {bloodGroups.map((bg) => (
              <option key={bg}>{bg}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Units needed"
            value={findForm.units}
            onChange={(e) =>
              setFindForm({ ...findForm, units: e.target.value })
            }
            className="border rounded px-3 py-1.5 text-sm w-32"
          />
          <button
            onClick={handleFind}
            disabled={findLoading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {findLoading ? "Searching..." : "Find Blood"}
          </button>
        </div>

        {findResult && (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500">
              Searched {findResult.totalBanksChecked} blood banks for{" "}
              <strong>{findResult.requested.bloodGroup}</strong> ×{" "}
              {findResult.requested.units} units
            </p>

            {findResult.fullyAvailable.length > 0 && (
              <div>
                <p className="font-semibold text-green-700 mb-1">
                  Can Fully Fulfill ({findResult.fullyAvailable.length} banks):
                </p>
                {findResult.fullyAvailable.map((b, i) => (
                  <div
                    key={i}
                    className="bg-green-50 border border-green-200 rounded p-2 mb-1 flex justify-between"
                  >
                    <span>{b.bankName}</span>
                    <span className="text-green-700 font-bold">
                      {b.availableUnits} units available
                    </span>
                  </div>
                ))}
              </div>
            )}

            {findResult.partiallyAvailable.length > 0 && (
              <div>
                <p className="font-semibold text-yellow-700 mb-1">
                  Partial Stock ({findResult.partiallyAvailable.length} banks):
                </p>
                {findResult.partiallyAvailable.map((b, i) => (
                  <div
                    key={i}
                    className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-1 flex justify-between"
                  >
                    <span>{b.bankName}</span>
                    <span className="text-yellow-700 font-bold">
                      {b.availableUnits} units only
                    </span>
                  </div>
                ))}
              </div>
            )}

            {findResult.fullyAvailable.length === 0 &&
              findResult.partiallyAvailable.length === 0 && (
                <p className="text-red-600 font-semibold">
                  No stock found across the entire network for{" "}
                  {findResult.requested.bloodGroup}
                </p>
              )}
          </div>
        )}
      </div>

      {/* Emergency Broadcast */}
      <div className="bg-red-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <img src={emergencyIcon} className="w-5 h-5" />
          Emergency Broadcast to All Banks
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={broadcastForm.bloodGroup}
            onChange={(e) =>
              setBroadcastForm({ ...broadcastForm, bloodGroup: e.target.value })
            }
            className="border rounded px-3 py-1.5 text-sm"
          >
            {bloodGroups.map((bg) => (
              <option key={bg}>{bg}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Units needed"
            value={broadcastForm.units}
            onChange={(e) =>
              setBroadcastForm({ ...broadcastForm, units: e.target.value })
            }
            className="border rounded px-3 py-1.5 text-sm"
          />
          <input
            placeholder="Your Hospital Name"
            value={broadcastForm.hospitalName}
            onChange={(e) =>
              setBroadcastForm({
                ...broadcastForm,
                hospitalName: e.target.value,
              })
            }
            className="border rounded px-3 py-1.5 text-sm"
          />
          <input
            placeholder="Location / City"
            value={broadcastForm.location}
            onChange={(e) =>
              setBroadcastForm({ ...broadcastForm, location: e.target.value })
            }
            className="border rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={handleBroadcast}
          disabled={broadcastLoading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold disabled:opacity-50"
        >
          {broadcastLoading ? "Sending..." : " Send Emergency Broadcast"}
        </button>
        {broadcastMsg && (
          <p className="mt-2 text-sm font-semibold text-green-700">
            {broadcastMsg}
          </p>
        )}
      </div>
    </div>
  );
}
