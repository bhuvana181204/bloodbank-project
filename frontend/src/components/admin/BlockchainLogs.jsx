import { useEffect, useState } from "react";
import api from "../../services/api";
import blockchainlogs from "/src/assets/blockchainlogs.png";

export default function BlockchainLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/blockchain/events");
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to load blockchain logs", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      

      {loading ? (
        <p>Loading blockchain logs...</p>
      ) : logs.length === 0 ? (
        <p>No blockchain events found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Action</th>
                <th className="border px-2 py-1">Details</th>
                <th className="border px-2 py-1">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="border px-2 py-1">{log.action}</td>
                  <td className="border px-2 py-1">{log.details}</td>
                  <td className="border px-2 py-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
