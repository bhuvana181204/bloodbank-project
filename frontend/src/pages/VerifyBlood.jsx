// frontend/src/pages/VerifyBlood.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import verify from "../assets/verify.png";

export default function VerifyBlood() {
  const { unitId: paramId } = useParams(); // from /verify/:unitId (QR scan)
  const [unitId, setUnitId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let id = paramId || "";
    if (!id) {
      const params = new URLSearchParams(window.location.search);
      id = params.get("unitId") || "";
    }
    if (id) {
      setUnitId(id);
      doVerify(id);
    }
  }, [paramId]);

  const doVerify = async (id) => {
    const searchId = (id || unitId).trim();
    if (!searchId) return;
    setLoading(true);
    setSearched(true);
    setData(null);
    try {
      const res = await API.get(`/verify/${encodeURIComponent(searchId)}`);
      setData(res.data);
    } catch (err) {
      setData({
        verified: false,
        message: err?.response?.data?.message || "Blood unit not found",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <img src={verify} alt="search" className="w-6 h-6" />
        Verify Blood Unit
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Scan a blood unit QR code or enter the Unit ID to verify its
        authenticity on the blockchain.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter blood unit ID from QR code…"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="border p-2 flex-1 rounded"
          onKeyDown={(e) => e.key === "Enter" && doVerify()}
        />
        <button
          onClick={() => doVerify()}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "…" : "Verify"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
          Verifying on blockchain…
        </div>
      )}

      {searched && !loading && data && (
        <div
          className={`border rounded p-4 ${data.verified ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
        >
          {data.verified ? (
            <>
              <p className="text-green-700 font-bold text-lg mb-3">
                {" "}
                Verified on Blockchain
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Blood Group:</strong>{" "}
                  <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                    {data.bloodGroup}
                  </span>
                </p>
                <p>
                  <strong>Unit ID:</strong>{" "}
                  <span className="font-mono text-xs text-gray-600">
                    {data.unitId}
                  </span>
                </p>
                <p>
                  <strong>Collection Date:</strong>{" "}
                  {data.collectionDate
                    ? new Date(data.collectionDate).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "long", year: "numeric" },
                      )
                    : "—"}
                </p>
                <p>
                  <strong>Expiry Date:</strong>{" "}
                  <span
                    className={
                      data.expiryDate && new Date(data.expiryDate) < new Date()
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {data.expiryDate
                      ? new Date(data.expiryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                    {data.expiryDate && new Date(data.expiryDate) < new Date()
                      ? "  ⚠ Expired"
                      : ""}
                  </span>
                </p>
                {data.donorId && (
                  <p>
                    <strong>Donor ID:</strong> {data.donorId}
                  </p>
                )}
                {data.hospitalName && (
                  <p>
                    <strong>Blood Bank / Hospital:</strong> {data.hospitalName}
                  </p>
                )}
                {data.status && (
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        data.status === "available"
                          ? "bg-green-100 text-green-700"
                          : data.status === "issued"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {data.status}
                    </span>
                  </p>
                )}
                {data.blockchainHash && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {" "}
                      Blockchain Hash
                    </p>
                    <p className="font-mono text-xs text-gray-500 break-all">
                      {data.blockchainHash}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-red-700 font-bold text-lg mb-1">
                {" "}
                Verification Failed
              </p>
              <p className="text-red-600 text-sm">{data.message}</p>
              <p className="text-gray-500 text-xs mt-2">
                This blood unit could not be found on the blockchain. It may be
                fake or the ID may be incorrect.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!searched && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <p className="font-semibold mb-1"> How to use:</p>
          <ol className="list-decimal ml-4 space-y-1 text-xs">
            <li>Scan the QR code on the blood bag using your phone camera</li>
            <li>The page opens automatically with the blood unit details</li>
            <li>Or type the Unit ID manually and click Verify</li>
          </ol>
        </div>
      )}
    </div>
  );
}
