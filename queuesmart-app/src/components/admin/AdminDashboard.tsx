import React, { useEffect, useMemo, useState } from "react";
import { services } from "../../data/mockServices";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";

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
      else setQueueUsers({});
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    const allUsers = Object.values(queueUsers).flat();
    const waiting = allUsers.filter((u) => !u.served).length;
    const served = allUsers.filter((u) => u.served).length;

    return {
      waiting,
      served,
      activeServices: services.length,
      avgWait: waiting * AVG_SERVICE_TIME,
    };
  }, [queueUsers]);

  return (
    <AdminPageLayout title="Admin Dashboard">
      {/* Top stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Customers Waiting" value={totals.waiting} sub="Across all services" />
        <StatCard label="Services" value={totals.activeServices} sub="Active services" />
        <StatCard label="Estimated Total Wait" value={`${totals.avgWait} mins`} sub="Using avg service time" />
      </div>

      {/* Services table */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Service Overview</h2>
          <p className="text-sm text-gray-500">
            Avg service time: {AVG_SERVICE_TIME} min
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <span>Service</span>
            <span className="text-center">In Queue</span>
            <span className="text-right">Est. Waiting Time</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 bg-white">
            {services.map((service) => {
              const users = queueUsers[service.id] || [];
              const waitingUsers = users.filter((u) => !u.served);

              const totalInQueue = waitingUsers.length;
              const totalWaitingTime = totalInQueue * AVG_SERVICE_TIME;

              return (
                <div
                  key={service.id}
                  className="grid grid-cols-3 items-center px-4 py-4 transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Service ID: {service.id}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {totalInQueue}
                    </span>
                  </div>

                  <p className="text-right text-sm text-gray-600">
                    {totalWaitingTime} mins
                  </p>
                </div>
              );
            })}

            {services.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">
                No services available.
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </AdminPageLayout>
  );
};

export default AdminDashboard;