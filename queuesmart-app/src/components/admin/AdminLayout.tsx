import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const linkBase =
  "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition";
const linkInactive = "text-gray-600 hover:bg-gray-100";
const linkActive = "bg-blue-50 text-blue-700";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-6">
        <div className="mb-8">
          <div className="text-lg font-bold text-gray-900">QueueSmart</div>
          <div className="text-xs text-gray-500">Admin</div>
        </div>

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
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
