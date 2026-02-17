import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true }); // prevent back navigation
  };

  if (!user) return null; // Hide navbar if not logged in

  const isAdmin = user.role === "admin";

  return (
    <nav className="bg-blue-300 text-white p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-xl">
        Barber Shop
      </Link>

      <div className="space-x-4 flex items-center">
        {isAdmin ? (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
            <Link to="/admin/services">Services</Link>
            <Link to="/admin/queue">Queue Management</Link>
            <Link to="/admin/analytics">Dashboard Analytics</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/join-queue">Join Queue</Link>
            <Link to="/queue-status">Queue Status</Link>
            <Link to="/history">History</Link>
          </>
        )}

        {/* Logout Button Added */}
        <button
          onClick={handleLogout}
          className="ml-4 bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
