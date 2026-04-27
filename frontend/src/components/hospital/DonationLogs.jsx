import React, { useEffect, useState } from "react";
import API from "../../services/api";

const DonationLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    API.get("/blockchain/events").then((res) => setLogs(res.data));
  }, []);

  return (
    <div>
      

      {logs.map((log) => (
        <p key={log._id}>{log.details}</p>
      ))}
    </div>
  );
};

export default DonationLogs;
