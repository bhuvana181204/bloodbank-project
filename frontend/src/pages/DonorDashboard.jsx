// frontend/src/pages/DonorDashboard.jsx
import { useEffect, useState } from "react";
import API from "../services/api";
import RegisterDonation from "../components/donor/RegisterDonation";
import BlockchainDonorBadge from "../components/donor/BlockchainDonorBadge";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const TN_DISTRICTS = {
  "Ariyalur":["Ariyalur","Jayankondam","Sendurai","Udayarpalayam"],
  "Chengalpattu":["Chengalpattu","Cheyyur","Maduranthakam","Tambaram","Tirukalukundram","Uthiramerur"],
  "Chennai":["Ambattur","Egmore-Nungambakkam","Mylapore-Triplicane","Perambur-Purasawalkam","Sholinganallur","Tambaram","Tondiarpet"],
  "Coimbatore":["Annur","Coimbatore North","Coimbatore South","Mettupalayam","Pollachi","Sulur","Valparai"],
  "Cuddalore":["Chidambaram","Cuddalore","Kattumannarkoil","Kurinjipadi","Panruti","Vriddhachalam"],
  "Dharmapuri":["Dharmapuri","Harur","Nallampalli","Palacode","Pennagaram"],
  "Dindigul":["Dindigul","Kodaikanal","Natham","Nilakkottai","Oddanchatram","Palani","Vedasandur"],
  "Erode":["Bhavani","Erode","Gobichettipalayam","Modakurichi","Nambiyur","Perundurai","Sathyamangalam"],
  "Kallakurichi":["Chinnasalem","Kallakurichi","Kalvarayan Hills","Sankarapuram","Tirukoilur"],
  "Kancheepuram":["Kancheepuram","Sriperumbudur","Uthiramerur","Walajabad"],
  "Kanyakumari":["Agasteeswaram","Kalkulam","Thovalai","Vilavancode"],
  "Karur":["Aravakurichi","Karur","Krishnarayapuram","Kulithalai","Manmangalam"],
  "Krishnagiri":["Bargur","Denkanikottai","Hosur","Krishnagiri","Pochampalli","Uthangarai"],
  "Madurai":["Madurai North","Madurai South","Melur","Peraiyur","Thirumangalam","Usilampatti","Vadipatti"],
  "Mayiladuthurai":["Kuthalam","Mayiladuthurai","Sirkali","Tharangambadi"],
  "Nagapattinam":["Kilvelur","Nagapattinam","Thalainayar","Vedaranyam"],
  "Namakkal":["Kolli Hills","Kumarapalayam","Mohanur","Namakkal","Paramathi-Velur","Rasipuram","Tiruchengode"],
  "Nilgiris":["Coonoor","Gudalur","Kotagiri","Ooty (Udhagamandalam)","Pandalur"],
  "Perambalur":["Alathur","Kunnam","Perambalur","Veppanthattai"],
  "Pudukkottai":["Aranthangi","Avudaiyarkoil","Gandarvakottai","Iluppur","Karambakudi","Kulathur","Pudukkottai","Tiruvarankulam"],
  "Ramanathapuram":["Kadaladi","Kamuthi","Mudukulathur","Paramakudi","Rajasingamangalam","Ramanathapuram","Rameswaram","Tiruvadanai"],
  "Ranipet":["Arakkonam","Arcot","Nemili","Ranipet","Sholinghur","Wallajah"],
  "Salem":["Attur","Edappadi","Mettur","Omalur","Salem","Sangagiri","Yercaud"],
  "Sivaganga":["Devakottai","Ilayangudi","Karaikudi","Manamadurai","Sivaganga","Tiruppattur"],
  "Tenkasi":["Alangulam","Kadayanallur","Sankarankovil","Shencottai","Tenkasi"],
  "Thanjavur":["Kumbakonam","Orathanadu","Papanasam","Pattukkottai","Peravurani","Thanjavur","Thiruvaiyaru"],
  "Theni":["Andipatti","Bodinayakanur","Periyakulam","Theni","Uthamapalayam"],
  "Thoothukudi":["Ettayapuram","Kovilpatti","Ottapidaram","Sathankulam","Thoothukudi","Tiruchendur","Vilathikulam"],
  "Tiruchirappalli":["Lalgudi","Manachanallur","Manapparai","Musiri","Srirangam","Thiruverumbur","Tiruchirappalli"],
  "Tirunelveli":["Ambasamudram","Cheranmahadevi","Manur","Nanguneri","Palayamkottai","Tirunelveli"],
  "Tirupattur":["Ambur","Natrampalli","Tirupattur","Vaniyambadi"],
  "Tiruppur":["Avinashi","Dharapuram","Gudimangalam","Kangeyam","Madathukulam","Palladam","Tiruppur","Udumalaipettai"],
  "Tiruvannamalai":["Arani","Cheyyar","Chetpet","Kilpennathur","Polur","Tiruvannamalai","Vandavasi","Vembakkam"],
  "Tiruvarur":["Kodavasal","Mannargudi","Needamangalam","Papanasam","Thiruvarur","Valangaiman"],
  "Vellore":["Anaicut","Gudiyatham","Katpadi","Pernambut","Vellore"],
  "Villupuram":["Gingee","Marakanam","Thirukoilur","Tindivanam","Ulundurpet","Vanur","Villupuram"],
  "Virudhunagar":["Aruppukkottai","Rajapalayam","Sivakasi","Srivilliputhur","Tiruchuli","Vembakottai","Virudhunagar","Watrap"],
};

// ── Missed Emergency Alerts ───────────────────────────────────────────────────
function MissedAlerts({ bloodGroup }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState({});

  useEffect(() => {
    if (!bloodGroup) return;
    API.get("/emergency-alerts/missed")
      .then((r) => setAlerts(r.data.alerts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bloodGroup]);

  const accept = async (alertId) => {
    setAccepting((a) => ({ ...a, [alertId]: true }));
    try {
      await API.post(`/emergency-alerts/${alertId}/accept`);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      alert("✅ Accepted! Please go to the hospital to donate blood.");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept");
    } finally {
      setAccepting((a) => ({ ...a, [alertId]: false }));
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <div className="mb-4 border-2 border-red-400 rounded p-4 bg-red-50">
      <h3 className="text-base font-bold text-red-700 mb-2">
        🚨 Missed Emergency Alerts ({alerts.length})
      </h3>
      <p className="text-xs text-red-500 mb-3">
        These emergency requests were raised while you were offline. Your blood group matches.
      </p>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div key={a._id} className="bg-white border border-red-200 rounded p-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <span className="font-bold text-red-700 mr-2">{a.bloodGroup}</span>
              <span className="text-sm text-gray-700">{a.units} units needed at <strong>{a.hospital}</strong></span>
              {a.location && <span className="text-xs text-gray-500 ml-2">📍 {a.location}</span>}
              <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => accept(a._id)}
              disabled={accepting[a._id]}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {accepting[a._id] ? "..." : "Accept & Go"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main DonorDashboard ───────────────────────────────────────────────────────
export default function DonorDashboard({ activeSection = "dashboard" }) {
  const [profile, setProfile]               = useState(null);
  const [history, setHistory]               = useState([]);
  const [eligibility, setEligibility]       = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Profile form state
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [contact, setContact]       = useState("");
  const [age, setAge]               = useState("");
  const [bloodBankId, setBloodBankId] = useState("");
  const [bloodBanks, setBloodBanks] = useState([]);
  const [district, setDistrict]     = useState("");
  const [taluk, setTaluk]           = useState("");
  const [geoLat, setGeoLat]         = useState(null);
  const [geoLng, setGeoLng]         = useState(null);
  const [geoStatus, setGeoStatus]   = useState("");

  useEffect(() => {
    fetchProfile();
    fetchHistory();
    fetchBloodBanks();
  }, []);

  useEffect(() => { setTaluk(""); }, [district]);

  const fetchBloodBanks = async () => {
    try {
      const res = await API.get("/users/bloodbanks");
      setBloodBanks(res.data || []);
    } catch (_) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/donors/me");
      setProfile(res.data);
      setShowProfileForm(false);
      const eligRes = await API.get(`/donors/eligibility/${res.data._id}`);
      setEligibility(eligRes.data);
    } catch (err) {
      if (err.response?.status === 404) setShowProfileForm(true);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get("/donors/my-history");
      setHistory(res.data);
    } catch (_) {}
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("⚠️ Geolocation not supported by your browser.");
      return;
    }
    setGeoStatus("📡 Detecting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoStatus(`✅ Location detected (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus("⚠️ Location permission denied. Allow location in browser settings, or skip GPS (your district/taluk will still be used for nearby search).");
        } else {
          setGeoStatus("⚠️ Could not detect location. You can still save your profile without it.");
        }
      }
    );
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!district) { alert("Please select a district."); return; }
    if (!taluk)    { alert("Please select a taluk."); return; }
    try {
      const locationStr = `${taluk}, ${district}`;
      await API.post("/donors/complete-profile", {
        bloodGroup, location: locationStr, district, taluk,
        contact, age: age ? parseInt(age) : null,
        bloodBankId: bloodBankId || null,
        latitude: geoLat, longitude: geoLng,
      });
      fetchProfile();
    } catch (err) {
      alert(err?.response?.data?.error || "Error completing profile");
    }
  };

  const toggleAvailability = async () => {
    setAvailabilityLoading(true);
    try {
      const res = await API.put("/donors/availability");
      alert(res.data.message);
      setProfile((prev) => ({ ...prev, isAvailable: res.data.isAvailable }));
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to update availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const taluks = district ? (TN_DISTRICTS[district] || []) : [];

  // ── FIX 4: DONATION HISTORY section — own content ──────────────────────────
  if (activeSection === "history") {
    return (
      <div className="panel">
        <h2 className="panel-title">🩸 Donation History</h2>
        {!profile ? (
          <p className="text-gray-500 text-sm">Loading profile…</p>
        ) : history.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🩸</div>
            <p className="text-gray-600 font-medium mb-1">No donations recorded yet.</p>
            <p className="text-xs text-gray-400">
              Your confirmed donations will appear here after the blood bank logs them.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((d, i) => (
              <div key={d._id || i} className="border rounded p-3 bg-gray-50 flex items-center gap-3 text-sm">
                <span className="inline-block bg-red-100 text-red-700 font-bold px-3 py-1 rounded text-sm min-w-[44px] text-center">
                  {d.bloodGroup}
                </span>
                <span className="text-gray-700 font-medium">
                  {d.donationDate
                    ? new Date(d.donationDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "Date not recorded"}
                </span>
                <span className="ml-auto px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-semibold">
                  {d.status || "Recorded"}
                </span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-3">
              Total: {history.length} donation{history.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── FIX 4: ELIGIBILITY STATUS section — own content ────────────────────────
  if (activeSection === "eligibility") {
    return (
      <div className="panel">
        <h2 className="panel-title">🩺 Eligibility Status</h2>
        {!eligibility ? (
          <p className="text-gray-500 text-sm">Loading eligibility information…</p>
        ) : eligibility.eligible ? (
          <div className="text-center py-8 bg-green-50 border border-green-300 rounded p-6">
            <div className="text-6xl mb-3">✅</div>
            <p className="text-green-700 font-bold text-2xl mb-2">
              You are eligible to donate!
            </p>
            <p className="text-green-600 text-sm mb-4">
              You can donate blood today. Visit your nearest blood bank.
            </p>
            {eligibility.daysSinceLast != null && (
              <p className="text-xs text-gray-500">
                {eligibility.daysSinceLast} days since your last donation
              </p>
            )}
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-300 rounded p-5">
            <p className="text-orange-700 font-bold text-xl mb-2">
              ⏳ Not eligible yet — {eligibility.daysRemaining} days remaining
            </p>
            {eligibility.nextEligibleDate && (
              <p className="text-orange-600 text-sm mb-5">
                📅 <strong>Next eligible date: </strong>
                {new Date(eligibility.nextEligibleDate).toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            )}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{eligibility.daysSinceLast ?? 0} days completed</span>
                <span>90 days required</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-5">
                <div
                  className="bg-orange-400 h-5 rounded-full transition-all flex items-center justify-center"
                  style={{ width: `${Math.min(eligibility.progressPercent ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 font-medium text-center">
                {eligibility.progressPercent ?? 0}% of 90-day wait completed
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── OVERVIEW (dashboard) — default section ─────────────────────────────────
  return (
    <div>
      {/* Missed alerts — only on overview */}
      {profile && <MissedAlerts bloodGroup={profile.bloodGroup} />}

      {/* Profile Setup Form */}
      {showProfileForm && (
        <div className="mb-6 border rounded p-4 bg-yellow-50">
          <h3 className="text-lg font-semibold mb-3">Complete Your Donor Profile</h3>
          <form onSubmit={handleCompleteProfile} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Blood Group</label>
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                className="border p-2 w-full rounded" required>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">District <span className="text-red-500">*</span></label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)}
                className="border p-2 w-full rounded" required>
                <option value="">-- Select District --</option>
                {Object.keys(TN_DISTRICTS).sort().map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Taluk <span className="text-red-500">*</span></label>
              <select value={taluk} onChange={(e) => setTaluk(e.target.value)}
                className="border p-2 w-full rounded" required disabled={!district}>
                <option value="">-- Select Taluk --</option>
                {taluks.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {!district && <p className="text-xs text-gray-400 mt-1">Select a district first</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">📍 Precise Location (optional — for GPS nearby search)</label>
              <button type="button" onClick={detectLocation}
                className="border px-3 py-1.5 rounded text-sm bg-blue-50 hover:bg-blue-100 text-blue-700">
                Detect My Location (GPS)
              </button>
              {geoStatus && <p className="text-xs mt-1 text-gray-600">{geoStatus}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number</label>
              <input type="text" className="border p-2 w-full rounded"
                value={contact} onChange={(e) => setContact(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <input type="number" className="border p-2 w-full rounded"
                placeholder="e.g. 25" value={age} onChange={(e) => setAge(e.target.value)}
                min={18} max={65} required />
              <p className="text-xs text-gray-400 mt-1">Must be 18–65 years old</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Bank (Optional)</label>
              <select value={bloodBankId} onChange={(e) => setBloodBankId(e.target.value)}
                className="border p-2 w-full rounded">
                <option value="">-- Select your blood bank --</option>
                {bloodBanks.map((bb) => (
                  <option key={bb._id} value={bb._id}>{bb.name}</option>
                ))}
              </select>
            </div>
            <button type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Save Profile
            </button>
          </form>
        </div>
      )}

      {/* Profile Display */}
      {profile && (
        <>
          <div className="mb-4 border rounded p-4 bg-gray-50">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Blood Group:</strong>{" "}
              <span className="inline-block bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-sm">
                {profile.bloodGroup}
              </span>
            </p>
            {(profile.district || profile.taluk) ? (
              <p><strong>Location:</strong> {profile.taluk ? `${profile.taluk}, ` : ""}{profile.district}</p>
            ) : (
              <p><strong>Location:</strong> {profile.location}</p>
            )}
            {profile.age && <p><strong>Age:</strong> {profile.age} years</p>}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-medium">Availability:</span>
              <span className={`px-2 py-1 rounded text-sm font-semibold ${
                profile.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {profile.isAvailable ? "✅ Available" : "❌ Unavailable"}
              </span>
              <button onClick={toggleAvailability} disabled={availabilityLoading}
                className="text-sm border px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50">
                {availabilityLoading ? "..." : profile.isAvailable ? "Mark Unavailable" : "Mark Available"}
              </button>
            </div>
          </div>

          {/* Eligibility summary on overview */}
          {eligibility && (
            <div className={`mb-4 border rounded p-4 ${
              eligibility.eligible ? "bg-green-50 border-green-300" : "bg-orange-50 border-orange-300"
            }`}>
              <h4 className="font-semibold mb-2">🩺 Donation Eligibility</h4>
              {eligibility.eligible ? (
                <span className="text-green-700 font-semibold text-lg">✅ You are eligible to donate!</span>
              ) : (
                <div>
                  <p className="text-orange-700 font-semibold mb-1">
                    ⏳ Not eligible yet — {eligibility.daysRemaining} days remaining
                  </p>
                  {eligibility.nextEligibleDate && (
                    <p className="text-orange-600 text-sm mb-2">
                      📅 <strong>Next eligible date: </strong>
                      {new Date(eligibility.nextEligibleDate).toLocaleDateString("en-IN", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  )}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{eligibility.daysSinceLast ?? 0} days completed</span>
                      <span>90 days required</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-orange-400 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(eligibility.progressPercent ?? 0, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {eligibility.progressPercent ?? 0}% of 90-day wait completed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {eligibility?.eligible && <RegisterDonation fetchHistory={fetchHistory} />}

          <div className="mt-4">
            <BlockchainDonorBadge donorId={profile._id} />
          </div>
        </>
      )}
    </div>
  );
}
