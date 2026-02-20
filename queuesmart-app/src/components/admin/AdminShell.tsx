import { Outlet } from "react-router-dom";
import AdminLayout from "./AdminLayout";

export default function AdminShell() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </div>
  );
}
