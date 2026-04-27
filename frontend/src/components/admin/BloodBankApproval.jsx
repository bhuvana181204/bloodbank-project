// frontend/src/components/admin/BloodBankApproval.jsx
// Works exactly like HospitalApproval — but for Blood Banks
import { useEffect, useState } from "react";
import API from "../../services/api";

export default function BloodBankApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchPending = () => {
    setLoading(true);
    API.get("/admin/bloodbanks/pending")
      .then((r) => setPending(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id, name) => {
    setActionId(id);
    try {
      await API.put(`/admin/bloodbanks/${id}/approve`);
      alert(`✅ Blood Bank "${name}" has been approved. They can now login.`);
      fetchPending();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to approve");
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id, name) => {
    if (!window.confirm(`Reject and permanently delete "${name}"'s registration?`)) return;
    setActionId(id);
    try {
      await API.delete(`/admin/bloodbanks/${id}/reject`);
      alert(`🗑️ Blood Bank "${name}" registration rejected.`);
      fetchPending();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to reject");
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 py-2">Loading pending registrations…</p>;

  if (pending.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <div className="text-3xl mb-2">🩸</div>
        No pending Blood Bank registrations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((bb) => (
        <div key={bb._id}
          className="border border-orange-200 rounded-lg p-4 bg-orange-50 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-bold text-gray-800">{bb.name}</p>
            <p className="text-sm text-gray-500">{bb.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Registered: {new Date(bb.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approve(bb._id, bb.name)}
              disabled={actionId === bb._id}
              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {actionId === bb._id ? "…" : "✅ Approve"}
            </button>
            <button
              onClick={() => reject(bb._id, bb.name)}
              disabled={actionId === bb._id}
              className="bg-red-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {actionId === bb._id ? "…" : "🗑️ Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
