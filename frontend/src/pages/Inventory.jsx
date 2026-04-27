// frontend/src/pages/Inventory.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import inventoryIcon from "../assets/inventory.png";

export default function Inventory() {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory");
      // BUG FIX: backend now returns { summary, units }
      // Use summary for the grouped view (A+|2 not A+|1, A+|1)
      if (res.data && res.data.summary !== undefined) {
        setSummary(res.data.summary);
      } else {
        // Fallback: group client-side if old backend
        const raw = Array.isArray(res.data) ? res.data : [];
        const map = {};
        for (const item of raw) {
          const g = item.bloodGroup;
          if (!map[g]) map[g] = { bloodGroup: g, availableUnits: 0 };
          map[g].availableUnits += item.availableUnits;
        }
        setSummary(Object.values(map));
      }
    } catch (err) {
      alert("Failed to load inventory");
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl mb-4 flex items-center gap-2">
        <img src={inventoryIcon} alt="Inventory" className="w-8 h-8" />
        Blood Inventory
      </h2>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Blood Group</th>
            <th className="p-2 border">Available Units</th>
          </tr>
        </thead>

        <tbody>
          {summary.map((item) => (
            <tr key={item.bloodGroup}>
              <td className="p-2 border">{item.bloodGroup}</td>
              <td className="p-2 border">{item.availableUnits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
