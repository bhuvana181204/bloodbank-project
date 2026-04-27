// frontend/src/pages/HospitalRegister.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import hospitalIcon from "../assets/hospital.png";

// All 38 Tamil Nadu Districts (alphabetical)
const TN_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kancheepuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupattur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Villupuram",
  "Virudhunagar",
];

export default function HospitalRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hospitalName: "",
    email: "",
    password: "",
    licenseNumber: "",
    address: "",
    contact: "",
    storageCapacity: "",
    city: "",
    district: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // When district changes, also update city field
  const handleDistrict = (e) => {
    setForm({ ...form, district: e.target.value, city: e.target.value });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Not supported");
      return;
    }
    setGeoStatus("Detecting…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }));
        setGeoStatus(
          `📍 Detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
      },
      () =>
        setGeoStatus(
          "Could not detect location. Enter coordinates manually if needed.",
        ),
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/hospitals/register", form);
      alert(
        "Hospital registered! Your account will be activated after admin approval.",
      );
      navigate("/login");
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto card">
      <h2 className="text-2xl mb-4 font-bold flex items-center gap-2">
        <img src={hospitalIcon} alt="Hospital" className="w-7 h-7" />
        Hospital Registration
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Your account will require admin approval before you can log in.
      </p>

      <form onSubmit={submit} className="space-y-3">
        {[
          { name: "hospitalName", placeholder: "Hospital Name" },
          { name: "email", placeholder: "Hospital Email", type: "email" },
          {
            name: "password",
            placeholder: "Password (min 6 chars)",
            type: "password",
          },
          { name: "licenseNumber", placeholder: "License Number" },
          { name: "address", placeholder: "Full Address" },
          { name: "contact", placeholder: "Contact Number" },
          {
            name: "storageCapacity",
            placeholder: "Blood Storage Capacity (units)",
            type: "number",
          },
        ].map(({ name, placeholder, type = "text" }) => (
          <input
            key={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />
        ))}

        {/* District Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">
            District <span className="text-red-500">*</span>
          </label>
          <select
            name="district"
            value={form.district}
            onChange={handleDistrict}
            className="border p-2 w-full rounded"
            required
          >
            <option value="">-- Select District --</option>
            {TN_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Used for blood heatmap — shows your hospital's correct location on
            the map
          </p>
        </div>

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {" "}
            GPS Coordinates (for heatmap)
          </label>
          <button
            type="button"
            onClick={detectLocation}
            className="border px-3 py-1.5 rounded text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 mb-1"
          >
            Detect My Location
          </button>
          {geoStatus && (
            <p className="text-xs text-gray-500 mb-1">{geoStatus}</p>
          )}
          <div className="flex gap-2">
            <input
              name="latitude"
              placeholder="Latitude (e.g. 11.9401)"
              value={form.latitude}
              onChange={handleChange}
              className="border p-2 rounded flex-1 text-sm"
            />
            <input
              name="longitude"
              placeholder="Longitude (e.g. 79.4861)"
              value={form.longitude}
              onChange={handleChange}
              className="border p-2 rounded flex-1 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Enables the live blood heatmap to pin your exact location
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register Hospital"}
        </button>
      </form>

      <p className="mt-3 text-sm text-center">
        Already registered?{" "}
        <span
          className="text-blue-600 cursor-pointer underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </div>
  );
}
