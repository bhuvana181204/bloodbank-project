// frontend/src/components/NotificationPanel.jsx
// Issue 2 Fix: notifications auto-disappear when fulfilled via socket events
import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { io } from "socket.io-client";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"
    );

    // ── New incoming notifications ────────────────────────────────────
    socketRef.current.on("pending-donation", (data) => {
      const msg = `📥 New donation: ${data.donationRequest?.bloodGroup} blood from donor`;
      addNotification({ message: msg, type: "DONATION", _id: Date.now() });
    });

    socketRef.current.on("emergency-alert", (data) => {
      const msg = `🚨 EMERGENCY: ${data.bloodGroup} blood needed — ${data.units} units`;
      // Store the alertId so we can remove it when fulfilled
      addNotification({
        message: msg,
        type: "EMERGENCY_ALERT",
        _id: data._id || Date.now(),
        alertId: data._id,
      });
    });

    socketRef.current.on("donation-completed", (data) => {
      const msg = `✅ Donation confirmed — ${data.inventoryItem?.bloodGroup} blood added to inventory`;
      addNotification({ message: msg, type: "DONATION_COMPLETED", _id: Date.now() });
    });

    // ── Auto-dismiss: remove emergency alert notification when fulfilled ──
    // Fires when: donor accepts and threshold reached, or hospital marks fulfilled
    socketRef.current.on("alert-fulfilled", (data) => {
      // data.alertId — remove any notification referencing this alert
      setNotifications((prev) =>
        prev.filter((n) => n.alertId !== data.alertId && n._id !== data.alertId)
      );
      // Also re-fetch from DB to sync (removes DB-stored emergency alerts too)
      fetchNotifications();
    });

    // Also fires from donor-accepted-alert when units reach threshold
    socketRef.current.on("donor-accepted-alert", (data) => {
      if (data.fulfilled) {
        setNotifications((prev) =>
          prev.filter((n) => n.alertId !== data.alertId && n._id !== data.alertId)
        );
        fetchNotifications();
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const addNotification = (notif) => {
    setNotifications((prev) => {
      // Prevent duplicate if same alertId already exists
      if (notif.alertId && prev.some((n) => n.alertId === notif.alertId)) return prev;
      return [notif, ...prev];
    });
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      // Only show unread, non-fulfilled notifications
      const unread = res.data.filter((n) => !n.isRead);
      setNotifications(unread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // Dismiss a single notification
  const dismissOne = async (notif) => {
    // Optimistically remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    // Mark as read in DB if it has a real MongoDB _id (not a Date.now() temp id)
    if (notif._id && typeof notif._id === "string" && notif._id.length === 24) {
      try {
        await API.put(`/notifications/${notif._id}/read`);
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
  };

  // Dismiss all
  const dismissAll = async () => {
    setNotifications([]);
    try {
      await API.put("/notifications/read-all");
    } catch (err) {
      console.error("Failed to dismiss all notifications", err);
    }
  };

  const typeBg = (type) => {
    switch (type) {
      case "EMERGENCY_ALERT":    return "bg-red-50 border-red-300";
      case "LOW_STOCK":          return "bg-yellow-50 border-yellow-300";
      case "SECURITY_ALERT":     return "bg-purple-50 border-purple-300";
      case "DONATION_COMPLETED": return "bg-green-50 border-green-300";
      default:                   return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="border rounded p-4">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <h3 className="text-lg font-semibold">🔔 Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={dismissAll}
            style={{ fontSize:"0.75rem", padding:"3px 10px", background:"#6B7280", color:"#fff", border:"none", borderRadius:6, cursor:"pointer" }}
          >
            ✓ Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.map((n, i) => (
            <div
              key={n._id || i}
              className={`border rounded p-2 text-sm ${typeBg(n.type)}`}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}
            >
              <span style={{ flex:1 }}>{n.message || `Notification: ${n.type}`}</span>
              <button
                onClick={() => dismissOne(n)}
                title="Dismiss"
                style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:"1rem", lineHeight:1, padding:0, flexShrink:0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
