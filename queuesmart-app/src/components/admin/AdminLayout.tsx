import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const linkBase =
  "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition";
const linkInactive = "text-gray-600 hover:bg-gray-100";
const linkActive = "bg-blue-50 text-blue-700";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();          // clear auth state
    navigate("/"); // redirect to login page
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-lg font-bold text-gray-900">QueueSmart</div>
          <div className="text-xs text-gray-500">Admin</div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/queue"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Queue
          </NavLink>

          <NavLink
            to="/admin/services"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Services
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            Analytics
          </NavLink>
        </nav>

        {/* Logout button pinned to bottom */}
        <div className="mt-auto pt-6 border-t">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}