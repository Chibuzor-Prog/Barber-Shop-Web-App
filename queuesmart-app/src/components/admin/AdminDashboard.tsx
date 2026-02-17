import React, { useEffect, useState } from "react";
import Navbar from "../common/Navbar";
import { services } from "../../data/mockServices";

type TicketUser = {
  id: number;
  name: string;
  ticketNumber: number;
  served: boolean;
};

// Average service time per customer (minutes)
const AVG_SERVICE_TIME = 10;

const AdminDashboard: React.FC = () => {
  const [queueUsers, setQueueUsers] = useState<Record<number, TicketUser[]>>(
    () => {
      const stored = localStorage.getItem("queueUsers");
      return stored ? JSON.parse(stored) : {};
    }
  );

  // Sync whenever localStorage changes (from QueueManagement)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("queueUsers");
      if (stored) setQueueUsers(JSON.parse(stored));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Navbar isAdmin />
      <div className="p-8">
        <h2 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
          Admin Dashboard
        </h2>

        {/* Table Header */}
        <div className="grid grid-cols-3 font-semibold text-lg border-b pb-3 mb-4 text-gray-700 dark:text-gray-200">
          <span>Services</span>
          <span className="text-center">Total in Queue</span>
          <span className="text-right">Total Waiting Time</span>
        </div>

        {/* Services Rows */}
        <div className="space-y-4">
          {services.map((service) => {
            const users = queueUsers[service.id] || [];
            const waitingUsers = users.filter((u) => !u.served);

            const totalInQueue = waitingUsers.length;
            const totalWaitingTime = totalInQueue * AVG_SERVICE_TIME;

            return (
              <div
                key={service.id}
                className="grid grid-cols-3 items-center bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 hover:shadow-lg transition"
              >
                <span className="font-medium text-gray-800 dark:text-white">
                  {service.name}
                </span>

                <span className="text-center font-bold text-blue-600 text-lg">
                  {totalInQueue}
                </span>

                <span className="text-right text-gray-600 dark:text-gray-300">
                  {totalWaitingTime} mins
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
