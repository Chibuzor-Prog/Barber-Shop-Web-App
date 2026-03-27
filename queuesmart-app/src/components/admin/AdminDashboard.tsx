// src/admin/AdminDashboard.tsx
// ── CHANGED: queue from backend-polled QueueContext (updates every 3 s + storage events).
//    Services from useServices hook (cached, reactive). No localStorage interval,
//    no TicketUser type, no queueUsers local state, no mockServices import.

import React, { useMemo } from "react";
import { useQueue } from "../../context/QueueContext";
import { useServices } from "../../hooks/useServices";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";

const AVG_SERVICE_TIME = 10;

const AdminDashboard: React.FC = () => {
  // ── CHANGED: queue from backend-polled context (no localStorage interval)
  const { queue } = useQueue();
  // ── CHANGED: services from backend via shared hook
  const { services } = useServices();

  // ── CHANGED: totals derived from live backend data
  const totals = useMemo(() => {
    const waiting = queue.filter((q) => q.status !== "served").length;
    return {
      waiting,
      activeServices: services.length,
      avgWait: waiting * AVG_SERVICE_TIME,
    };
  }, [queue, services]);

  return (
    <AdminPageLayout title="Admin Dashboard">
      {/* Top stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Customers Waiting"    value={totals.waiting}              sub="Across all services"    />
        <StatCard label="Services"             value={totals.activeServices}        sub="Active services"        />
        <StatCard label="Estimated Total Wait" value={`${totals.avgWait} mins`}    sub="Using avg service time" />
      </div>

      {/* Services table */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Service Overview</h2>
          <p className="text-sm text-gray-500">Avg service time: {AVG_SERVICE_TIME} min</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <span>Service</span>
            <span className="text-center">In Queue</span>
            <span className="text-right">Est. Waiting Time</span>
          </div>

          <div className="divide-y divide-gray-100 bg-white">
            {/* ── CHANGED: rows from backend services + backend queue counts */}
            {services.map((service) => {
              const waitingInService = queue.filter(
                (q) => q.serviceId === service.id && q.status !== "served"
              );
              const totalInQueue     = waitingInService.length;
              // ── CHANGED: use actual service.duration from backend
              const totalWaitingTime = totalInQueue * service.duration;

              return (
                <div
                  key={service.id}
                  className="grid grid-cols-3 items-center px-4 py-4 transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">Service ID: {service.id}</p>
                  </div>

                  <div className="text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {totalInQueue}
                    </span>
                  </div>

                  <p className="text-right text-sm text-gray-600">{totalWaitingTime} mins</p>
                </div>
              );
            })}

            {services.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">No services available.</div>
            )}
          </div>
        </div>
      </SectionCard>
    </AdminPageLayout>
  );
};

export default AdminDashboard;