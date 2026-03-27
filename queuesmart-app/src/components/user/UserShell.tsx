import { Outlet } from "react-router-dom";
import UserLayout from "./UserLayout";

export default function UserShell() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <UserLayout>
        <Outlet />
      </UserLayout>
    </div>
  );
}
