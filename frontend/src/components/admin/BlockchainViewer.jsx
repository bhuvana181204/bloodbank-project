// frontend/src/components/admin/BlockchainViewer.jsx
// UPGRADED: Now shows Merkle root, digital signature status,
// and PoA validator per block alongside original view.
import { useEffect, useState } from "react";
import API from "../../services/api";

function BlockchainViewer() {
  const [chain,      setChain]      = useState([]);
  const [audit,      setAudit]      = useState([]);
  const [validators, setValidators] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [expanded,   setExpanded]   = useState(null);
  const [activeTab,  setActiveTab]  = useState("chain");

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    setLoading(true);
    API.get("/donors/chain").then((r) => setChain(r.data || [])).catch(() => {}).finally(() => setLoading(false));
    API.get("/blockchain/audit").then((r) => setAudit(r.data?.report || [])).catch(() => {});
    API.get("/blockchain/validators").then((r) => setValidators(r.data?.validators || [])).catch(() => {});
  };

  const filteredChain = chain.filter((b) => {
    if (filter === "all") return true;
    return JSON.stringify(b.data || "").toLowerCase().includes(filter.toLowerCase());
  });

  const getBlockColor = (data) => {
    const s = JSON.stringify(data || "").toLowerCase();
    if (s.includes("genesis"))  return "border-gray-300 bg-gray-50";
    if (s.includes("donation") || s.includes("donated")) return "border-red-300 bg-red-50";
    if (s.includes("storage")  || s.includes("stored") || s.includes("blood_unit")) return "border-blue-300 bg-blue-50";
    if (s.includes("transfer") || s.includes("transfus") || s.includes("issued")) return "border-purple-300 bg-purple-50";
    if (s.includes("donor_profile") || s.includes("register")) return "border-green-300 bg-green-50";
    return "border-yellow-300 bg-yellow-50";
  };

  const getBlockIcon = (data) => {
    const s = JSON.stringify(data || "").toLowerCase();
    if (s.includes("genesis"))  return "🔷";
    if (s.includes("donation") || s.includes("donated")) return "🩸";
    if (s.includes("storage")  || s.includes("blood_unit")) return "🏦";
    if (s.includes("transfer") || s.includes("transfus")) return "🏥";
    if (s.includes("register") || s.includes("profile"))  return "👤";
    return "⛓";
  };

  const getAuditInfo = (index) => audit.find((a) => a.index === index);

  return (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          
          <p className="text-xs text-gray-400">
            Admin view — {chain.length} blocks | {validators.length} PoA validators
          </p>
        </div>
        <button onClick={loadAll} className="text-xs border rounded px-3 py-1 text-gray-500 hover:bg-gray-100">🔄 Refresh</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {[{ key:"chain", label:"🔗 Chain" }, { key:"audit", label:"🔍 Audit" }, { key:"validators", label:"🏛 Validators" }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeTab===t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Chain Tab ───────────────────────────────────────── */}
      {activeTab === "chain" && (
        <>
          <div className="flex gap-2 flex-wrap text-xs mb-3">
            {[["Genesis","bg-gray-100 text-gray-600"],["Donation","bg-red-100 text-red-600"],["Storage","bg-blue-100 text-blue-600"],["Transfer","bg-purple-100 text-purple-600"],["Registration","bg-green-100 text-green-600"]].map(([l,c]) => (
              <span key={l} className={`px-2 py-0.5 rounded ${c}`}>{l}</span>
            ))}
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-xs border rounded px-2 py-1 mb-3 text-gray-600">
            <option value="all">All Blocks</option>
            <option value="donor">Donor</option>
            <option value="blood_unit">Blood Unit</option>
            <option value="transfus">Transfusion</option>
            <option value="hospital">Hospital</option>
            <option value="emergency">Emergency</option>
          </select>
          {loading ? <p className="text-gray-400 text-sm text-center py-8">Loading…</p> : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredChain.map((block, idx) => {
                const ai = getAuditInfo(block.index);
                return (
                  <div key={block.index} onClick={() => setExpanded(expanded===idx?null:idx)}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${getBlockColor(block.data)} ${expanded===idx?"shadow-md":""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getBlockIcon(block.data)}</span>
                        <div>
                          <span className="font-bold text-sm text-gray-800">Block #{block.index}</span>
                          <span className="text-xs text-gray-500 ml-2">{block.timestamp ? new Date(block.timestamp).toLocaleString() : ""}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {block.merkleRoot && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded" title={block.merkleRoot}>🌲 Merkle</span>}
                        {block.signature  && <span className={`text-xs px-1.5 py-0.5 rounded ${ai?.signatureValid===false?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}`}>{ai?.signatureValid===false?"❌ Sig":"✅ Sig"}</span>}
                        {block.validator && block.validator!=="SYSTEM" && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">🏛 PoA</span>}
                        {ai && <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${ai.overallValid?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{ai.overallValid?"✓":"✗"}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1 truncate">🔑 {block.hash}</p>
                    {expanded === idx && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs">
                        <div>
                          <span className="font-semibold text-gray-600">Data:</span>
                          <pre className="mt-1 bg-white rounded p-2 text-xs overflow-auto max-h-32 border">{JSON.stringify(block.data, null, 2)}</pre>
                        </div>
                        {block.merkleRoot && (
                          <div><span className="font-semibold text-indigo-600">🌲 Merkle Root:</span><p className="font-mono text-gray-600 break-all">{block.merkleRoot}</p></div>
                        )}
                        {block.validator && (
                          <div><span className="font-semibold text-amber-600">🏛 PoA Validator:</span><p className="font-mono text-gray-600 break-all">{block.validator}</p></div>
                        )}
                        {block.signature && (
                          <div><span className="font-semibold text-green-600">✍ Digital Signature:</span><p className="font-mono text-gray-500 break-all">{block.signature.substring(0,80)}…</p></div>
                        )}
                        <div><span className="font-semibold text-gray-600">Prev Hash:</span><p className="font-mono text-gray-500 break-all">{block.previousHash}</p></div>
                        {block.transactions?.length > 0 && (
                          <div>
                            <span className="font-semibold text-gray-600">Transactions ({block.transactions.length}):</span>
                            <ul className="mt-1 space-y-1">{block.transactions.map((tx,ti) => <li key={ti} className="bg-white border rounded p-1 font-mono text-gray-600 break-all">{tx}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Audit Tab ───────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="overflow-x-auto">
          {audit.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">Click Refresh to load.</p> : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  {["Block","Validator","Hash ✓","PrevHash ✓","🌲 Merkle","✍ Sig","Status"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {audit.map((row) => (
                  <tr key={row.index} className={`border-b ${row.overallValid?"":"bg-red-50"}`}>
                    <td className="p-2 font-mono">#{row.index}</td>
                    <td className="p-2 text-gray-500 max-w-[80px] truncate" title={row.validator}>{row.validator}</td>
                    <td className="p-2 text-center">{row.hashValid     ?"✅":"❌"}</td>
                    <td className="p-2 text-center">{row.prevHashValid ?"✅":"❌"}</td>
                    <td className="p-2 text-center">{row.merkleValid   ?"✅":"❌"}</td>
                    <td className="p-2 text-center">{row.signatureValid?"✅":"—"}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.overallValid?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>
                        {row.overallValid?"VALID":"INVALID"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Validators Tab ──────────────────────────────────── */}
      {activeTab === "validators" && (
        <div className="space-y-2">
          {validators.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No validators.</p> : validators.map((v) => (
            <div key={v.id} className="border rounded-lg p-3 bg-amber-50">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-lg">🏛</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{(v.role||"system").toUpperCase()} Validator</p>
                    <p className="text-xs text-gray-500 font-mono">{v.id}</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">✓ Authorized</span>
              </div>
              {v.publicKey && <p className="text-xs font-mono text-gray-400 break-all mt-2">{v.publicKey}</p>}
              <p className="text-xs text-gray-400 mt-1">Since: {v.addedAt ? new Date(v.addedAt).toLocaleString() : "System"}</p>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-3 border-t pt-2">
            Proof of Authority: only Admin and BloodBank roles can add blocks. Hospitals join as validators upon approval.
          </p>
        </div>
      )}
    </div>
  );
}

export default BlockchainViewer;
