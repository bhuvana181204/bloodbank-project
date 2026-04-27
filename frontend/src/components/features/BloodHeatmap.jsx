// frontend/src/components/features/BloodHeatmap.jsx
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BloodHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("city"); 

  useEffect(() => {
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    setLoading(true);
    try {
      const res = await api.get("/heatmap");
      setData(res.data);
    } catch (err) {
      console.error("Heatmap error", err);
    } finally {
      setLoading(false);
    }
  };

  const zoneLabel = {
    CRITICAL: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300",  },
    SHORTAGE: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
    LOW: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300"},
    MODERATE: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300"},
    STABLE: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300"},
    PENDING_ISSUE: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200"},
  };

  return (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          
          <p className="text-sm text-gray-500">
            Real-time blood shortage zones and stock density
          </p>
        </div>
        <button
          onClick={loadHeatmap}
          className="text-xs border rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs mb-4">
        {[
          { zone: "CRITICAL", label: "Critical (0 units)" },
          { zone: "SHORTAGE", label: "Shortage (<10)" },
          { zone: "LOW", label: "Low (<30)" },
          { zone: "MODERATE", label: "Moderate (<60)" },
          { zone: "STABLE", label: "Stable (60+)" },
        ].map(({ zone, label }) => (
          <span
            key={zone}
            className={`flex items-center gap-1 px-2 py-1 rounded border ${zoneLabel[zone]?.bg} ${zoneLabel[zone]?.text} ${zoneLabel[zone]?.border}`}
          >
            {zoneLabel[zone]?.dot} {label}
          </span>
        ))}
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {data.summary.criticalCount}
            </p>
            <p className="text-xs text-red-500">Critical / Shortage</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {data.summary.shortageCount}
            </p>
            <p className="text-xs text-yellow-500">Low Stock</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.summary.stableCount}
            </p>
            <p className="text-xs text-green-500">Stable</p>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("city")}
          className={`px-3 py-1 rounded text-sm ${
            view === "city"
              ? "bg-blue-600 text-white"
              : "border text-gray-600 hover:bg-gray-100"
          }`}
        >
          City View
        </button>
        <button
          onClick={() => setView("hospital")}
          className={`px-3 py-1 rounded text-sm ${
            view === "hospital"
              ? "bg-blue-600 text-white"
              : "border text-gray-600 hover:bg-gray-100"
          }`}
        >
          Hospital View
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading heatmap...</p>
      ) : !data ? (
        <p className="text-gray-400 text-sm">No data available.</p>
      ) : view === "city" ? (
        <div className="space-y-2">
          {(data.cityLevel || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No city data available. Add hospitals and inventory first.</p>
          ) : (
            (data.cityLevel || []).map((city, i) => {
              const style = zoneLabel[city.zone] || zoneLabel["STABLE"];
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded border ${style.bg} ${style.border}`}
                >
                  <div>
                    <span className={`font-semibold ${style.text}`}>
                      {style.dot} {city.city === "Unknown" ? "Location Unknown" : city.city}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {city.hospitals} hospital(s)
                    </span>
                    {city.criticalGroups.length > 0 && (
                      <span className="text-xs text-red-500 ml-2">
                        Critical: {city.criticalGroups.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${style.text}`}>
                      {city.totalUnits}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">units</span>
                    <div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                      >
                        {city.zone}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">Hospital</th>
                <th className="px-3 py-2 text-left">City</th>
                <th className="px-3 py-2 text-left">Total Units</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Critical Groups</th>
              </tr>
            </thead>
            <tbody>
              {(data.hospitalLevel || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                    No hospital data found.
                  </td>
                </tr>
              ) : (
                (data.hospitalLevel || []).map((h, i) => {
                  const style = zoneLabel[h.zone] || zoneLabel["STABLE"];
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium">{h.name}</td>
                      <td className="px-3 py-2 text-gray-500">{h.city === "Unknown" ? (h.district || h.name || "Unknown") : h.city}</td>
                      <td className="px-3 py-2 font-bold">{h.totalUnits}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}
                        >
                          {style.dot} {h.zone}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-red-500 text-xs">
                        {h.criticalGroups.join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
