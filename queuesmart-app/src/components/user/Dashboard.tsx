// src/user/Dashboard.tsx
// ── CHANGED: data from backend via QueueContext (polled + storage-event reactive)
//    and useServices hook. No localStorage manual syncing, no mockServices, no
//    hardcoded CURRENT_USER_ID.

import React, { useMemo } from "react";
import { useQueue } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import { useServices } from "../../hooks/useServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const Dashboard: React.FC = () => {
  // ── CHANGED: queue from backend-polled context (updates every 3 s + on events)
  const { queue } = useQueue();
  // ── CHANGED: authenticated user instead of hardcoded CURRENT_USER_ID
  const { user } = useAuth();
  // ── CHANGED: services from backend via shared hook (cached + reactive)
  const { services } = useServices();

  // ── CHANGED: all stats derived from live backend data
  const userData = useMemo(() => {
    if (!user) return { totalQueues: 0, totalWaitTime: 0, activeServices: [] as any[] };

    let totalQueues  = 0;
    let totalWaitTime = 0;
    const activeServices: {
      serviceId: number;
      serviceName: string;
      position: number;
      waitingTime: number;
    }[] = [];

    services.forEach((service) => {
      // ── CHANGED: filter from backend queue, not localStorage queueUsers
      const waitingInService = queue.filter(
        (q) => q.serviceId === service.id && q.status !== "served"
      );

      const index = waitingInService.findIndex(
        (q) => String(q.userId) === String(user.id)
      );

      if (index !== -1) {
        const position    = index + 1;
        // ── CHANGED: use service.duration from backend (not hardcoded AVG)
        const waitingTime = position * service.duration;

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

    return { totalQueues, totalWaitTime, activeServices };
  }, [queue, user, services]);

  return (
    <UserPageLayout title="User Dashboard">
      <div className="p-6 space-y-6">

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* ── CHANGED: values from live backend-derived userData */}
          <StatCard label="Queues Joined"      value={userData.totalQueues}            sub="Active queues"    />
          <StatCard label="Estimated Wait"     value={`${userData.totalWaitTime} mins`} sub="Across your queues" />
          {/* ── CHANGED: services.length from backend */}
          <StatCard label="Services Available" value={services.length}                  sub="All services"    />
        </div>

        {/* Service Breakdown */}
        <SectionCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Queue Status</h2>
            <p className="text-sm text-gray-500">Based on service duration</p>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Position</span>
              <span className="text-right">Est. Wait</span>
            </div>

            <div className="divide-y divide-gray-100 bg-white">
              {/* ── CHANGED: rows from backend-derived activeServices */}
              {userData.activeServices.map((service) => (
                <div
                  key={service.serviceId}
                  className="grid grid-cols-3 items-center px-4 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{service.serviceName}</p>
                    <p className="text-xs text-gray-500">Service ID: {service.serviceId}</p>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                      #{service.position}
                    </span>
                  </div>

                  <p className="text-right text-sm text-gray-600">{service.waitingTime} mins</p>
                </div>
              ))}

              {userData.activeServices.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">You are not in any queues.</div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default Dashboard;