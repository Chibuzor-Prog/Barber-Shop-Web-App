import React, { useState } from "react";
// Helper to load services from localStorage
function getServicesFromStorage() {
  const data = localStorage.getItem("services");
  return data ? JSON.parse(data) : [];
}
import Navbar from "../common/Navbar";

const Dashboard: React.FC = () => {
  const [queueCount] = useState(2); // mock queue
  const [notifications] = useState(["Your haircut is almost ready!"]);
  const [services, setServices] = useState<any[]>(getServicesFromStorage());

  // Listen for changes to services in localStorage
  React.useEffect(() => {
    const interval = setInterval(() => {
      setServices(getServicesFromStorage());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl mb-4 font-bold">User Dashboard</h2>
        <p>Current Queue Status: {queueCount}</p>
        <p>Active Services: {services.map(s => s.name).join(", ")}</p>
        <div className="mt-2">
          Notifications:
          <ul className="list-disc ml-4">
            {notifications.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
