// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    // Not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role.toLowerCase() !== allowedRole.toLowerCase()) {
    // Wrong role → redirect to their own dashboard
    const rolePaths = {
      donor: "/donor",
      hospital: "/hospital",
      bloodbank: "/bloodbank",
      admin: "/admin",
    };
    const redirect = rolePaths[user.role.toLowerCase()] || "/login";
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default ProtectedRoute;
