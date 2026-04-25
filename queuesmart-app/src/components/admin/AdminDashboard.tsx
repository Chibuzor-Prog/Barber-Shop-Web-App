// Stat calculations per requirements:
//
//  Avg service time        = sum(Est. Waiting Time per service) / sum(In Queue per service)
//                          = sum(inQueue[i] * expectedDuration[i]) / sum(inQueue[i])
//
//  Estimated Total Wait    = Avg service time * sum(all In Queue)
//
//  Est. Waiting Time (row) = inQueue[i] * service.expectedDuration[i]

import React, { useMemo } from "react";
import { useQueue } from "../../context/QueueContext";
import { useServices } from "../../hooks/useServices";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";

const AdminDashboard: React.FC = () => {
  const { queue }    = useQueue();
  const { services } = useServices();

  // ── Per-service row data ───────────────────────────────────────────────────
  const serviceRows = useMemo(() => {
    return services.map(service => {
      const inQueue        = queue.filter(
        q => q.serviceId === service.id && q.status !== "served" && q.status !== "cancelled"
      ).length;
      // Est. Waiting Time = inQueue × expectedDuration
      const estWaitingTime = inQueue * service.expectedDuration;
      return { service, inQueue, estWaitingTime };
    });
  }, [queue, services]);

  // ── Top-level stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalInQueue        = serviceRows.reduce((s, r) => s + r.inQueue, 0);
    const totalEstWaitingTime = serviceRows.reduce((s, r) => s + r.estWaitingTime, 0);

    // Avg service time = sum(Est. Waiting Time) / sum(In Queue)
    // If no one is in queue, show 0 to avoid division by zero
    const avgServiceTime = totalInQueue > 0
      ? Math.round(totalEstWaitingTime / totalInQueue)
      : 0;

    // Estimated Total Wait = avgServiceTime × totalInQueue
    const estimatedTotalWait = avgServiceTime * totalInQueue;

    return { totalInQueue, avgServiceTime, estimatedTotalWait };
  }, [serviceRows]);

  return (
    <AdminPageLayout title="Admin Dashboard">

      {/* ── Top Stats ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Customers Waiting"
          value={stats.totalInQueue}
          sub="Across all services"
        />
        <StatCard
          label="Avg Service Time"
          value={`${stats.avgServiceTime} min`}
          sub="Weighted avg across queues"
        />
        <StatCard
          label="Estimated Total Wait"
          value={`${stats.estimatedTotalWait} min`}
          sub={`Avg service time × ${stats.totalInQueue} in queue`}
        />
      </div>

      {/* ── Service Overview Table ─────────────────────────────────────────── */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Service Overview</h2>
          <p className="text-sm text-gray-500">
            Avg service time: {stats.avgServiceTime} min
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
            {serviceRows.map(({ service, inQueue, estWaitingTime }) => (
              <div
                key={service.id}
                className="grid grid-cols-3 items-center px-4 py-4 transition hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-400">
                    {service.expectedDuration} min / person
                  </p>
                </div>

                <div className="text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                    {inQueue}
                  </span>
                </div>

                {/* Est. Waiting Time = inQueue × expectedDuration */}
                <p className="text-right text-sm text-gray-700 font-medium">
                  {estWaitingTime} min
                </p>
              </div>
            ))}

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
