import { useEffect, useState } from "react";
import API from "../../services/api";

function AuditDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/blockchain/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h2>Blockchain Audit Logs</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Action</th>
            <th>Details</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event._id}>
              <td>{event.action}</td>
              <td>{event.details}</td>
              <td>{new Date(event.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditDashboard;
