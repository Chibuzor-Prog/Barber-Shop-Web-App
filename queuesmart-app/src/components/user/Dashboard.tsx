import React, { useEffect, useMemo, useState } from "react";
import { services } from "../../data/mockServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

type TicketUser = {
  id: number;
  name: string;
  ticketNumber: number;
  served: boolean;
};

// Simulated logged-in user (replace with auth later)
const CURRENT_USER_ID = 1;

// Average service time (minutes)
const AVG_SERVICE_TIME = 10;

const Dashboard: React.FC = () => {
  const [queueUsers, setQueueUsers] = useState<Record<number, TicketUser[]>>(
    {}
  );

  // Sync with localStorage (same as admin)
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("queueUsers");
      if (stored) setQueueUsers(JSON.parse(stored));
      else setQueueUsers({});
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Find user's tickets across all services
  const userData = useMemo(() => {
    let totalQueues = 0;
    let totalWaitTime = 0;
    let activeServices: {
      serviceId: number;
      serviceName: string;
      position: number;
      waitingTime: number;
    }[] = [];

    services.forEach((service) => {
      const users = queueUsers[service.id] || [];

      const waitingUsers = users.filter((u) => !u.served);

      const index = waitingUsers.findIndex(
        (u) => u.id === CURRENT_USER_ID
      );

      if (index !== -1) {
        const position = index + 1;
        const waitingTime = position * AVG_SERVICE_TIME;

        totalQueues++;
        totalWaitTime += waitingTime;

        activeServices.push({
          serviceId: service.id,
          serviceName: service.name,
          position,
          waitingTime,
        });
      }
    });

    return {
      totalQueues,
      totalWaitTime,
      activeServices,
    };
  }, [queueUsers]);

  return (
    <UserPageLayout title="User Dashboard">
      <div className="p-6 space-y-6">

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Queues Joined"
            value={userData.totalQueues}
            sub="Active queues"
          />
          <StatCard
            label="Estimated Wait"
            value={`${userData.totalWaitTime} mins`}
            sub="Across your queues"
          />
          <StatCard
            label="Services Available"
            value={services.length}
            sub="All services"
          />
        </div>

        {/* Service Breakdown */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Queue Status
            </h2>
            <p className="text-sm text-gray-500">
              Avg service time: {AVG_SERVICE_TIME} min
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Position</span>
              <span className="text-right">Est. Wait</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 bg-white">
              {userData.activeServices.map((service) => (
                <div
                  key={service.serviceId}
                  className="grid grid-cols-3 items-center px-4 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {service.serviceName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Service ID: {service.serviceId}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                      #{service.position}
                    </span>
                  </div>

                  <p className="text-right text-sm text-gray-600">
                    {service.waitingTime} mins
                  </p>
                </div>
              ))}

              {userData.activeServices.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">
                  You are not in any queues.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default Dashboard;