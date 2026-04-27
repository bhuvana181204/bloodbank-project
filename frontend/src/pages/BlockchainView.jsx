// src/pages/BlockchainView.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function BlockchainView() {
  const [chain, setChain] = useState([]);
  const [isValid, setIsValid] = useState(null);
  const [repairMsg, setRepairMsg] = useState("");

  useEffect(() => {
    async function fetchChain() {
      try {
        const res = await api.get("/donors/chain");
        setChain(res.data);
      } catch (err) {
        console.error("Error fetching blockchain:", err);
      }
    }
    fetchChain();
  }, []);

  const validateChain = async () => {
    try {
      const res = await api.get("/blockchain/validate");
      setIsValid(res.data.valid);
    } catch (err) {
      console.error("Validation error:", err);
    }
  };

  const repairChain = async () => {
    try {
      const res = await api.get("/donors/repair");
      setRepairMsg(res.data.message);

      // Refresh blockchain
      const updated = await api.get("/donors/chain");
      setChain(updated.data);

      // Re-validate
      validateChain();
    } catch (err) {
      console.error("Repair error:", err);
    }
  };

  return (
    <div className="container">
      <h1 className="text-3xl mb-4">🩸 Donor Blockchain</h1>

      <button onClick={validateChain}>Validate Blockchain</button>

      {isValid !== null && (
        <p
          style={{
            fontWeight: "bold",
            marginTop: "10px",
            color: isValid ? "green" : "red",
          }}
        >
          {isValid ? " Blockchain is valid" : " Blockchain is tampered"}
        </p>
      )}

      <br />

      <button onClick={repairChain}>Repair Blockchain</button>

      {repairMsg && <p style={{ color: "#0077cc" }}>{repairMsg}</p>}

      <br />

      {chain.length === 0 ? (
        <p>Loading blockchain data...</p>
      ) : (
        chain.map((block, index) => (
          <div key={index} className="card">
            <h2>Block #{block.index}</h2>
            <p>
              <b>Timestamp:</b> {block.timestamp}
            </p>
            <p>
              <b>Data:</b> {JSON.stringify(block.data)}
            </p>
            <p>
              <b>Hash:</b> {block.hash}
            </p>
            <p>
              <b>Previous Hash:</b> {block.previousHash}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
