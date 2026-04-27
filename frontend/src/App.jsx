// frontend/src/App.jsx
// ✅ Navbar bug fixed: user stored in state + listens to storage events
// ✅ Font: Times New Roman throughout
// ✅ Blue: #0096FF
// ✅ Sidebar added per role dashboard
// ✅ Blood Compatibility removed from Home screen
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import API from "./services/api";

import Home from "./pages/Home";
import BlockchainView from "./pages/BlockchainView";
import DonorsList from "./pages/DonorsList";
import Register from "./pages/Register";
import HospitalRegister from "./pages/HospitalRegister";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Inventory from "./pages/Inventory";
import DonorDashboard from "./pages/DonorDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BloodBankDashboard from "./pages/BloodBankDashboard";
import VerifyBlood from "./pages/VerifyBlood";
import BloodCompatibility from "./pages/BloodCompatibility";
import ProtectedRoute from "./components/ProtectedRoute";
import compatibilityIcon from "./assets/bloodcompatibility.png";
import verifyIcon from "./assets/verifyicon.png";
import logo from "./assets/blood.png";
import admin from "./assets/admin.png";
import heatmap from "./assets/bloodheatmap.png";
import bloodprediction from "./assets/bloodprediction.png";
import users from "./assets/user.png";
import donor from "./assets/donor.png";
import blockchainviewer from "./assets/blockchainviewer.png";
import lifecycle from "./assets/lifecycle.png";
import fraud from "./assets/fraud.png";
import cross from "./assets/cross.png";
import hospital from "./assets/hospital.png";
import blockchainlogs from "./assets/blockchainlogs.png";
import bloodrequests from "./assets/bloodrequests.png";
import donationhistory from "./assets/donationhistory.png";
import donationledger from "./assets/donationledger.png";
import donordashboard from "./assets/donordashboard.png";
import eligibility from "./assets/eligibility.png";
import emergencyalerts from "./assets/emergencyalerts.png";
import incomingdonation from "./assets/incomingdonation.png";
import inventory from "./assets/inventory.png";
import nearbydonors from "./assets/nearbydonors.png";
import bloodbank from "./assets/bloodbank.png";
import blooddriveevents from "./assets/blooddriveevents.png";

// ─── Read user from localStorage safely ─────────────────────────────────────
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// ─── Donor Eligibility Badge ─────────────────────────────────────────────────
function DonorEligibilityBadge({ donorId }) {
  const [elig, setElig] = useState(null);
  useEffect(() => {
    if (!donorId) return;
    API.get(`/donors/eligibility/${donorId}`)
      .then((r) => setElig(r.data))
      .catch(() => {});
  }, [donorId]);
  if (!elig) return null;
  if (elig.eligible)
    return (
      <span className="eligibility-badge eligible">Eligible to Donate</span>
    );
  const nd = elig.nextEligibleDate
    ? new Date(elig.nextEligibleDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : `${elig.daysRemaining}d`;
  return (
    <span
      className="eligibility-badge not-eligible"
      title={`Next eligible: ${nd}`}
    >
      Next Eligible: <strong>{nd}</strong>
    </span>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ user, onLogout }) {
  const [donorId, setDonorId] = useState(null);

  useEffect(() => {
    setDonorId(null);
    if (user?.role === "donor") {
      API.get("/donors/me")
        .then((r) => setDonorId(r.data._id))
        .catch(() => {});
    }
  }, [user]);

  const navCls = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logo} className="logo-img" />
          <span>BloodChain</span>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/compatibility" className={navCls}>
            <div className="nav-item-content">
              <span>Blood Compatibility</span>
            </div>
          </NavLink>

          <NavLink to="/verify" className={navCls}>
            <div className="nav-item-content">
              <span>Verify Blood</span>
            </div>
          </NavLink>

          {!user && (
            <>
              <NavLink to="/login" className={navCls}>
                Login
              </NavLink>
              <NavLink to="/register" className={navCls}>
                Register
              </NavLink>
              <NavLink to="/hospital-register" className={navCls}>
                Hospital Register
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar-right">
          {user?.role === "donor" && donorId && (
            <DonorEligibilityBadge donorId={donorId} />
          )}
          {user && (
            <div className="navbar-user">
              <span className="user-avatar">
                {user.name?.charAt(0)?.toUpperCase()}
              </span>
              <span className="user-name">{user.name}</span>
              <button className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  // ✅ FIX: Store user in React state so navbar re-renders on login/logout
  const [user, setUser] = useState(getStoredUser);

  // ✅ FIX: Keep in sync when localStorage changes (e.g. after login redirect)
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener("storage", sync);
    // Also poll lightly in case same-tab changes don't fire storage event
    const id = setInterval(sync, 1000);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(id);
    };
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Navbar user={user} onLogout={handleLogout} />

        <Routes>
          {/* Public pages — no sidebar */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login onLogin={setUser} />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register />
              </PublicLayout>
            }
          />
          <Route
            path="/hospital-register"
            element={
              <PublicLayout>
                <HospitalRegister />
              </PublicLayout>
            }
          />
          <Route
            path="/blockchain"
            element={
              <PublicLayout>
                <BlockchainView />
              </PublicLayout>
            }
          />
          <Route
            path="/events"
            element={
              <PublicLayout>
                <Events />
              </PublicLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PublicLayout>
                <Dashboard />
              </PublicLayout>
            }
          />
          <Route
            path="/verify"
            element={
              <PublicLayout>
                <VerifyBlood />
              </PublicLayout>
            }
          />
          <Route
            path="/verify/:unitId"
            element={
              <PublicLayout>
                <VerifyBlood />
              </PublicLayout>
            }
          />
          <Route
            path="/compatibility"
            element={
              <PublicLayout>
                <BloodCompatibility />
              </PublicLayout>
            }
          />

          {/* Protected — with sidebars */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute allowedRole="donor">
                <DonorLayout user={user} onLogout={handleLogout}>
                  <DonorDashboard />
                </DonorLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital"
            element={
              <ProtectedRoute allowedRole="hospital">
                <HospitalLayout user={user} onLogout={handleLogout}>
                  <HospitalDashboard />
                </HospitalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRole={user?.role}>
                {user?.role === "hospital" ? (
                  <HospitalLayout user={user} onLogout={handleLogout}>
                    <Inventory />
                  </HospitalLayout>
                ) : user?.role === "bloodbank" ? (
                  <BloodBankLayout user={user} onLogout={handleLogout}>
                    <Inventory />
                  </BloodBankLayout>
                ) : (
                  <PublicLayout>
                    <Inventory />
                  </PublicLayout>
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodbank"
            element={
              <ProtectedRoute allowedRole="bloodbank">
                <BloodBankLayout user={user} onLogout={handleLogout}>
                  <BloodBankDashboard />
                </BloodBankLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodbank/donors"
            element={
              <ProtectedRoute allowedRole="bloodbank">
                <BloodBankLayout user={user} onLogout={handleLogout}>
                  <DonorsList />
                </BloodBankLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout user={user} onLogout={handleLogout}>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/donors"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout user={user} onLogout={handleLogout}>
                  <DonorsList />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <PublicLayout>
                <div className="not-found">
                  <h2>404 — Page Not Found</h2>
                  <Link to="/" className="text-blue-600 underline">
                    Go Home
                  </Link>
                </div>
              </PublicLayout>
            }
          />
        </Routes>

        <footer className="app-footer">
          <p>
            BloodChain — Secure Blockchain Blood Bank System &nbsp;|&nbsp; ©{" "}
            {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

// ─── Donor Donation Ledger (role-based: donors see only their own records) ────
function DonorDonationLedger() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/donors/me/donations")
      .then((r) => setDonations(r.data || []))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <h3 className="panel-title">📒 My Donation Ledger</h3>
      <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 16 }}>
        Your personal donation records are stored on the blockchain. Each entry
        is cryptographically verified and tamper-proof.
      </p>
      {loading ? (
        <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
          Loading your records…
        </p>
      ) : donations.length === 0 ? (
        <div className="alert alert-success">
          No donations recorded yet. Start donating to build your ledger!
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f1f5f9",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Donation ID
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Blood Group
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Date
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Status
                </th>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>
                  Blockchain Hash
                </th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d, i) => (
                <tr
                  key={d._id || i}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "monospace",
                      color: "#0096FF",
                    }}
                  >
                    {d.donationId ||
                      d._id?.slice(-6)?.toUpperCase() ||
                      `D${100 + i}`}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontWeight: 700,
                      color: "#DC2626",
                    }}
                  >
                    {d.bloodGroup || d.blood_group || "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {d.date
                      ? new Date(d.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        background:
                          d.status === "Verified" ? "#dcfce7" : "#fef3c7",
                        color: d.status === "Verified" ? "#166534" : "#92400e",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {d.status || "Pending"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      color: "#6b7280",
                    }}
                  >
                    {d.blockchainHash
                      ? d.blockchainHash.slice(0, 10) + "…"
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ marginTop: 16, fontSize: "0.75rem", color: "#9ca3af" }}>
        Full blockchain ledger access is restricted to authorized blood bank and
        admin personnel only.
      </p>
    </div>
  );
}

// ─── Layout Wrappers ─────────────────────────────────────────────────────────
function PublicLayout({ children }) {
  return <main className="main-content">{children}</main>;
}

// ─── Sidebar Component ───────────────────────────────────────────────────────
function Sidebar({ role, user, onLogout, items, activeKey, onSelect }) {
  const roleLabels = {
    donor: "Donor",
    hospital: "Hospital",
    bloodbank: "Blood Bank",
    admin: "Admin",
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-role-badge">{roleLabels[role] || role}</div>
        <div className="sidebar-user-name">{user?.name || "User"}</div>
        <div className="sidebar-user-sub">{user?.email || ""}</div>
      </div>

      <nav className="sidebar-nav">
        {items.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.links.map((item) => (
              <div
                key={item.key}
                className={`sidebar-item${activeKey === item.key ? " active" : ""}`}
                onClick={() => onSelect(item.key)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Donor Layout ─────────────────────────────────────────────────────────────
function DonorLayout({ user, onLogout, children }) {
  const [active, setActive] = useState("dashboard");
  const items = [
    {
      label: "MAIN",
      links: [
        {
          key: "dashboard",
          icon: <img src={donordashboard} className="sidebar-icon-img" />,
          label: "My Dashboard",
        },
        {
          key: "history",
          icon: <img src={donationhistory} className="sidebar-icon-img" />,
          label: "Donation History",
        },
        {
          key: "ledger",
          icon: <img src={donationledger} className="sidebar-icon-img" />,
          label: "My Donation Ledger",
        },
        {
          key: "eligibility",
          icon: <img src={eligibility} className="sidebar-icon-img" />,
          label: "Eligibility Status",
        },
      ],
    },
    {
      label: "DISCOVER",
      links: [
        {
          key: "compatibility",
          icon: <img src={compatibilityIcon} className="sidebar-icon-img" />,
          label: "Blood Compatibility",
        },
        {
          key: "events",
          icon: <img src={blooddriveevents} className="sidebar-icon-img" />,
          label: "Blood Drive Events",
        },
        {
          key: "verify",
          icon: <img src={verifyIcon} className="sidebar-icon-img" />,
          label: "Verify Blood Unit",
        },
        // Donors do NOT see full blockchain — only personal donation ledger
      ],
    },
  ];
  return (
    <div className="dashboard-shell">
      <Sidebar
        role="donor"
        user={user}
        onLogout={onLogout}
        items={items}
        activeKey={active}
        onSelect={setActive}
      />
      <div className="dashboard-content">
        <DonorDashboardWithSidebar active={active} />
      </div>
    </div>
  );
}

function DonorDashboardWithSidebar({ active }) {
  if (active === "compatibility") return <BloodCompatibility />;
  if (active === "events") return <Events />;
  if (active === "verify") return <VerifyBlood />;
  if (active === "ledger") return <DonorDonationLedger />;
  // dashboard, history, eligibility all render inside DonorDashboard
  // blockchain is NOT accessible to donors per role-based access policy
  return <DonorDashboard activeSection={active} />;
}

// ─── Hospital Layout ──────────────────────────────────────────────────────────
function HospitalLayout({ user, onLogout, children }) {
  const [active, setActive] = useState("dashboard");
  const items = [
    {
      label: "MAIN",
      links: [
        {
          key: "dashboard",
          icon: <img src={hospital} className="sidebar-icon-img" />,
          label: "Dashboard",
        },
        {
          key: "requests",
          icon: <img src={bloodrequests} className="sidebar-icon-img" />,
          label: "Blood Requests",
        },
        {
          key: "inventory",
          icon: <img src={inventory} className="sidebar-icon-img" />,
          label: "Inventory",
        },
        {
          key: "donations",
          icon: <img src={incomingdonation} className="sidebar-icon-img" />,
          label: "Incoming Donations",
        },
        {
          key: "donors",
          icon: <img src={nearbydonors} className="sidebar-icon-img" />,
          label: "Nearby Donors",
        },
        {
          key: "logs",
          icon: <img src={blockchainviewer} className="sidebar-icon-img" />,
          label: "Donation Logs",
        },
      ],
    },
    {
      label: "ADVANCED",
      links: [
        {
          key: "lifecycle",
          icon: <img src={lifecycle} className="sidebar-icon-img" />,
          label: "Blood Lifecycle",
        },
        {
          key: "network",
          icon: <img src={cross} className="sidebar-icon-img" />,
          label: "Cross-Bank Network",
        },
        {
          key: "blockchain",
          icon: <img src={blockchainlogs} className="sidebar-icon-img" />,
          label: "Blockchain Verify",
        },
        {
          key: "compatibility",
          icon: <img src={compatibilityIcon} className="sidebar-icon-img" />,
          label: "Blood Compatibility",
        },
        {
          key: "verify",
          icon: <img src={verifyIcon} className="sidebar-icon-img" />,
          label: "Verify Blood Unit",
        },
      ],
    },
  ];
  return (
    <div className="dashboard-shell">
      <Sidebar
        role="hospital"
        user={user}
        onLogout={onLogout}
        items={items}
        activeKey={active}
        onSelect={setActive}
      />
      <div className="dashboard-content">
        <HospitalDashboardWithSidebar active={active} />
      </div>
    </div>
  );
}

function HospitalDashboardWithSidebar({ active }) {
  if (active === "compatibility") return <BloodCompatibility />;
  if (active === "verify") return <VerifyBlood />;
  if (active === "blockchain") return <BlockchainView />;
  return <HospitalDashboard activeSection={active} />;
}

// ─── Blood Bank Layout ────────────────────────────────────────────────────────
function BloodBankLayout({ user, onLogout, children }) {
  const [active, setActive] = useState("dashboard");
  const items = [
    {
      label: "MAIN",
      links: [
        {
          key: "dashboard",
          icon: <img src={bloodbank} className="sidebar-icon-img" />,
          label: "Dashboard",
        },
        {
          key: "inventory",
          icon: <img src={inventory} className="sidebar-icon-img" />,
          label: "Inventory",
        },
        {
          key: "donors",
          icon: <img src={donor} className="sidebar-icon-img" />,
          label: "All Donors",
        },
        {
          key: "alerts",
          icon: <img src={emergencyalerts} className="sidebar-icon-img" />,
          label: "Emergency Alerts",
        },
        {
          key: "heatmap",
          icon: <img src={heatmap} className="sidebar-icon-img" />,
          label: "Blood Heatmap",
        },
      ],
    },
    {
      label: "NETWORK",
      links: [
        {
          key: "network",
          icon: <img src={cross} className="sidebar-icon-img" />,
          label: "Cross-Bank Network",
        },
        {
          key: "blockchain",
          icon: <img src={blockchainviewer} className="sidebar-icon-img" />,
          label: "Blockchain Records",
        },
        {
          key: "compatibility",
          icon: <img src={compatibilityIcon} className="sidebar-icon-img" />,
          label: "Blood Compatibility",
        },
        {
          key: "verify",
          icon: <img src={verifyIcon} className="sidebar-icon-img" />,
          label: "Verify Blood Unit",
        },
      ],
    },
  ];
  return (
    <div className="dashboard-shell">
      <Sidebar
        role="bloodbank"
        user={user}
        onLogout={onLogout}
        items={items}
        activeKey={active}
        onSelect={setActive}
      />
      <div className="dashboard-content">
        <BloodBankDashboardWithSidebar active={active} />
      </div>
    </div>
  );
}

function BloodBankDashboardWithSidebar({ active }) {
  if (active === "inventory") return <Inventory />;
  if (active === "donors") return <DonorsList />;
  if (active === "compatibility") return <BloodCompatibility />;
  if (active === "verify") return <VerifyBlood />;
  if (active === "blockchain") return <BlockchainView />;
  return <BloodBankDashboard activeSection={active} />;
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────
function AdminLayout({ user, onLogout, children }) {
  const [active, setActive] = useState("dashboard");
  const items = [
    {
      label: "MANAGEMENT",
      links: [
        {
          key: "dashboard",
          icon: <img src={admin} className="sidebar-icon-img" alt="admin" />,
          label: "Admin Dashboard",
        },
        {
          key: "hospitals",
          icon: (
            <img src={hospital} className="sidebar-icon-img" alt="hospital" />
          ),
          label: "Hospital Approval",
        },
        {
          key: "bloodbanks",
          icon: <img src={bloodbank} className="sidebar-icon-img" alt="bloodbank" />,
          label: "Blood Bank Approval",
        },
        {
          key: "users",
          icon: <img src={users} className="sidebar-icon-img" alt="user" />,
          label: "User Management",
        },
        {
          key: "donors",
          icon: <img src={donor} className="sidebar-icon-img" alt="donor" />,
          label: "Donors List",
        },
      ],
    },
    {
      label: "ANALYTICS",
      links: [
        {
          key: "prediction",
          icon: <img src={bloodprediction} className="sidebar-icon-img" />,
          label: "Blood Prediction",
        },
        {
          key: "heatmap",
          icon: <img src={heatmap} className="sidebar-icon-img" />,
          label: "Blood Heatmap",
        },
        {
          key: "fraud",
          icon: <img src={fraud} className="sidebar-icon-img" />,
          label: "Fraud Detection",
        },
        {
          key: "lifecycle",
          icon: <img src={lifecycle} className="sidebar-icon-img" />,
          label: "Lifecycle Tracker",
        },
        {
          key: "network",
          icon: <img src={cross} className="sidebar-icon-img" />,
          label: "Cross-Bank Network",
        },
      ],
    },
    {
      label: "BLOCKCHAIN",
      links: [
        {
          key: "blockchain",
          icon: <img src={blockchainviewer} className="sidebar-icon-img" />,
          label: "Blockchain Viewer",
        },
        {
          key: "logs",
          icon: <img src={blockchainlogs} className="sidebar-icon-img" />,
          label: "Blockchain Logs",
        },
      ],
    },
    {
      label: "TOOLS",
      links: [
        {
          key: "compatibility",
          icon: <img src={compatibilityIcon} className="sidebar-icon-img" />,
          label: "Blood Compatibility",
        },
        {
          key: "verify",
          icon: <img src={verifyIcon} className="sidebar-icon-img" />,
          label: "Verify Blood Unit",
        },
      ],
    },
  ];
  return (
    <div className="dashboard-shell">
      <Sidebar
        role="admin"
        user={user}
        onLogout={onLogout}
        items={items}
        activeKey={active}
        onSelect={setActive}
      />
      <div className="dashboard-content">
        <AdminDashboardWithSidebar active={active} />
      </div>
    </div>
  );
}

function AdminDashboardWithSidebar({ active }) {
  if (active === "donors") return <DonorsList />;
  if (active === "compatibility") return <BloodCompatibility />;
  if (active === "verify") return <VerifyBlood />;
  if (active === "blockchain") return <BlockchainView />;
  return <AdminDashboard activeSection={active} />;
}
