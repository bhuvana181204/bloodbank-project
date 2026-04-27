// frontend/src/components/hospital/NearbyDonors.jsx
import { useState } from "react";
import API from "../../services/api";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// All 38 Tamil Nadu Districts + Taluks
const TN_DISTRICTS = {
  "Ariyalur":        ["Ariyalur","Jayankondam","Sendurai","Udayarpalayam"],
  "Chengalpattu":    ["Chengalpattu","Cheyyur","Maduranthakam","Tambaram","Tirukalukundram","Uthiramerur"],
  "Chennai":         ["Ambattur","Egmore-Nungambakkam","Mylapore-Triplicane","Perambur-Purasawalkam","Sholinganallur","Tambaram","Tondiarpet"],
  "Coimbatore":      ["Annur","Coimbatore North","Coimbatore South","Mettupalayam","Pollachi","Sulur","Valparai"],
  "Cuddalore":       ["Chidambaram","Cuddalore","Kattumannarkoil","Kurinjipadi","Panruti","Vriddhachalam"],
  "Dharmapuri":      ["Dharmapuri","Harur","Nallampalli","Palacode","Pennagaram"],
  "Dindigul":        ["Dindigul","Kodaikanal","Natham","Nilakkottai","Oddanchatram","Palani","Vedasandur"],
  "Erode":           ["Bhavani","Erode","Gobichettipalayam","Modakurichi","Nambiyur","Perundurai","Sathyamangalam"],
  "Kallakurichi":    ["Chinnasalem","Kallakurichi","Kalvarayan Hills","Sankarapuram","Tirukoilur"],
  "Kancheepuram":    ["Kancheepuram","Sriperumbudur","Uthiramerur","Walajabad"],
  "Kanyakumari":     ["Agasteeswaram","Kalkulam","Thovalai","Vilavancode"],
  "Karur":           ["Aravakurichi","Karur","Krishnarayapuram","Kulithalai","Manmangalam"],
  "Krishnagiri":     ["Bargur","Denkanikottai","Hosur","Krishnagiri","Pochampalli","Uthangarai"],
  "Madurai":         ["Madurai North","Madurai South","Melur","Peraiyur","Thirumangalam","Usilampatti","Vadipatti"],
  "Mayiladuthurai":  ["Kuthalam","Mayiladuthurai","Sirkali","Tharangambadi"],
  "Nagapattinam":    ["Kilvelur","Nagapattinam","Thalainayar","Vedaranyam"],
  "Namakkal":        ["Kolli Hills","Kumarapalayam","Mohanur","Namakkal","Paramathi-Velur","Rasipuram","Tiruchengode"],
  "Nilgiris":        ["Coonoor","Gudalur","Kotagiri","Ooty (Udhagamandalam)","Pandalur"],
  "Perambalur":      ["Alathur","Kunnam","Perambalur","Veppanthattai"],
  "Pudukkottai":     ["Aranthangi","Avudaiyarkoil","Gandarvakottai","Iluppur","Karambakudi","Kulathur","Pudukkottai","Tiruvarankulam"],
  "Ramanathapuram":  ["Kadaladi","Kamuthi","Mudukulathur","Paramakudi","Rajasingamangalam","Ramanathapuram","Rameswaram","Tiruvadanai"],
  "Ranipet":         ["Arakkonam","Arcot","Nemili","Ranipet","Sholinghur","Wallajah"],
  "Salem":           ["Attur","Edappadi","Mettur","Omalur","Salem","Sangagiri","Yercaud"],
  "Sivaganga":       ["Devakottai","Ilayangudi","Karaikudi","Manamadurai","Sivaganga","Tiruppattur"],
  "Tenkasi":         ["Alangulam","Kadayanallur","Sankarankovil","Shencottai","Tenkasi"],
  "Thanjavur":       ["Kumbakonam","Orathanadu","Papanasam","Pattukkottai","Peravurani","Thanjavur","Thiruvaiyaru"],
  "Theni":           ["Andipatti","Bodinayakanur","Periyakulam","Theni","Uthamapalayam"],
  "Thoothukudi":     ["Ettayapuram","Kovilpatti","Ottapidaram","Sathankulam","Thoothukudi","Tiruchendur","Vilathikulam"],
  "Tiruchirappalli": ["Lalgudi","Manachanallur","Manapparai","Musiri","Srirangam","Thiruverumbur","Tiruchirappalli"],
  "Tirunelveli":     ["Ambasamudram","Cheranmahadevi","Manur","Nanguneri","Palayamkottai","Tirunelveli"],
  "Tirupattur":      ["Ambur","Natrampalli","Tirupattur","Vaniyambadi"],
  "Tiruppur":        ["Avinashi","Dharapuram","Gudimangalam","Kangeyam","Madathukulam","Palladam","Tiruppur","Udumalaipettai"],
  "Tiruvannamalai":  ["Arani","Cheyyar","Chetpet","Kilpennathur","Polur","Tiruvannamalai","Vandavasi","Vembakkam"],
  "Tiruvarur":       ["Kodavasal","Mannargudi","Needamangalam","Papanasam","Thiruvarur","Valangaiman"],
  "Vellore":         ["Anaicut","Gudiyatham","Katpadi","Pernambut","Vellore"],
  "Villupuram":      ["Gingee","Marakanam","Thirukoilur","Tindivanam","Ulundurpet","Vanur","Villupuram"],
  "Virudhunagar":    ["Aruppukkottai","Rajapalayam","Sivakasi","Srivilliputhur","Tiruchuli","Vembakottai","Virudhunagar","Watrap"],
};

export default function NearbyDonors() {
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [searchMode, setSearchMode] = useState("district");
  const [district, setDistrict]     = useState("");
  const [taluk, setTaluk]           = useState("");
  const [freeText, setFreeText]     = useState("");
  const [geoLat, setGeoLat]         = useState(null);
  const [geoLng, setGeoLng]         = useState(null);
  const [radius, setRadius]         = useState(5000);
  const [geoStatus, setGeoStatus]   = useState("");
  const [geoDetected, setGeoDetected] = useState(false);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const taluks = district ? (TN_DISTRICTS[district] || []) : [];

  // FIX 3 + FIX 5: Improved GPS detection with specific error messages
  const detectGPS = () => {
    if (!navigator.geolocation) {
      setGeoStatus("⚠️ GPS not supported in this browser. Please use District/Taluk search.");
      return;
    }
    setGeoStatus("📡 Detecting your location…");
    setGeoDetected(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoDetected(true);
        setGeoStatus(
          `✅ Location detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      (err) => {
        setGeoDetected(false);
        if (err.code === 1) {
          setGeoStatus(
            "⚠️ Location permission denied. Please click the 🔒 lock icon in your browser address bar → allow Location → try again."
          );
        } else if (err.code === 2) {
          setGeoStatus(
            "⚠️ Your device could not determine location. Try on a phone with GPS, or use District/Taluk search."
          );
        } else {
          setGeoStatus(
            "⚠️ Location request timed out. Try again or use District/Taluk search."
          );
        }
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

  const search = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const params = new URLSearchParams({ bloodGroup });
      if (searchMode === "district" && district) {
        params.append("district", district);
        if (taluk) params.append("taluk", taluk);
      } else if (searchMode === "gps") {
        if (!geoDetected || !geoLat || !geoLng) {
          setError("Please click 'Detect My GPS Location' first to detect your location.");
          setLoading(false);
          return;
        }
        params.append("lat", geoLat);
        params.append("lng", geoLng);
        params.append("radius", radius);
      } else if (searchMode === "text" && freeText.trim()) {
        params.append("location", freeText.trim());
      }
      const res = await API.get(`/donors/nearby?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded p-4 bg-blue-50">
      <p className="text-sm text-gray-500 mb-3">
        Search donors compatible with the requested blood group.
      </p>

      {/* Blood Group */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Blood Group Needed
        </label>
        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="border border-gray-300 bg-white p-2 rounded w-full max-w-xs text-gray-800"
        >
          {BLOOD_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* FIX 3: Search Mode Tabs — clearly styled buttons */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          Search By
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            ["district", "🗺️ District / Taluk"],
            ["gps",      "📍 GPS Nearby"],
            ["text",     "🔍 Text Search"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => { setSearchMode(mode); setResult(null); setError(""); }}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                searchMode === mode
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* District/Taluk mode — FIX 3: clearly visible selects */}
      {searchMode === "district" && (
        <div className="mb-4 space-y-3 bg-white border border-blue-200 rounded p-3">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              District
            </label>
            <select
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setTaluk(""); }}
              className="border border-gray-400 bg-white p-2 rounded w-full max-w-xs text-gray-800 font-medium"
            >
              <option value="">-- Select District --</option>
              {Object.keys(TN_DISTRICTS).sort().map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">
              Taluk <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={taluk}
              onChange={(e) => setTaluk(e.target.value)}
              disabled={!district}
              className="border border-gray-400 bg-white p-2 rounded w-full max-w-xs text-gray-800 font-medium disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">-- All Taluks --</option>
              {taluks.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {!district && (
              <p className="text-xs text-gray-400 mt-1">Select a district first to filter by taluk</p>
            )}
          </div>
        </div>
      )}

      {/* GPS mode */}
      {searchMode === "gps" && (
        <div className="mb-4 bg-white border border-blue-200 rounded p-3 space-y-3">
          <div className="flex gap-3 items-center flex-wrap">
            <button
              onClick={detectGPS}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              📍 Detect My GPS Location
            </button>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Radius:</label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="border border-gray-300 bg-white p-1.5 rounded text-sm text-gray-800"
              >
                <option value={2000}>2 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
                <option value={50000}>50 km</option>
              </select>
            </div>
          </div>
          {geoStatus && (
            <p className={`text-xs font-medium ${geoDetected ? "text-green-700" : "text-orange-700"}`}>
              {geoStatus}
            </p>
          )}
          {!geoDetected && (
            <p className="text-xs text-gray-500">
              💡 Note: GPS search only finds donors who enabled location sharing when they registered.
              If no results are found, try District/Taluk search.
            </p>
          )}
        </div>
      )}

      {/* Text search mode */}
      {searchMode === "text" && (
        <div className="mb-4 bg-white border border-blue-200 rounded p-3">
          <label className="block text-sm font-semibold mb-1 text-gray-700">
            Area / City / Location
          </label>
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="e.g. Chennai, Villupuram, Thirukoilur"
            className="border border-gray-400 bg-white p-2 rounded w-full max-w-sm text-gray-800"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <p className="text-xs text-gray-400 mt-1">
            Partial match — typing "Villupuram" also finds donors in Thirukoilur, Villupuram
          </p>
        </div>
      )}

      <button
        onClick={search}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "🔍 Searching…" : "🔍 Search Donors"}
      </button>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <p className="font-semibold text-sm mb-2">
            {result.count} compatible donor{result.count !== 1 ? "s" : ""} found
            {result.compatibleGroups?.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                (compatible groups: {result.compatibleGroups.join(", ")})
              </span>
            )}
          </p>

          {result.count === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              No available donors found.{" "}
              {searchMode === "gps"
                ? "GPS search only finds donors who shared their location. Try District/Taluk search for broader results."
                : "Try selecting a different district or use Text Search."}
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {result.donors.map((donor, i) => (
                <div
                  key={donor._id || i}
                  className="border rounded p-3 bg-white flex justify-between items-center"
                >
                  <div>
                    <span className="font-semibold text-gray-800">{donor.name}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold">
                      {donor.bloodGroup}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      📍 {[donor.taluk, donor.district || donor.location].filter(Boolean).join(", ")}
                    </p>
                    {donor.lastDonationDate && (
                      <p className="text-xs text-gray-400">
                        Last donated: {new Date(donor.lastDonationDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                    ✅ Available
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
