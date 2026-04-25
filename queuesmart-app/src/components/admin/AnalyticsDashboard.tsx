

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import { useQueue } from "../../context/QueueContext";
import { useServices } from "../../hooks/useServices";

const AnalyticsDashboard: React.FC = () => {
  // ── CHANGED: queue from backend-polled context (reactive, no localStorage)
  const { queue } = useQueue();
  // ── CHANGED: services from backend via shared hook
  const { services } = useServices();

  // ── CHANGED: chart data derived entirely from live backend data
  const data = services.map((service) => {
    const inService = queue.filter((q) => q.serviceId === service.id);
    return {
      service: service.name,
      waiting: inService.filter((q) => q.status !== "served").length,
      served:  inService.filter((q) => q.status === "served").length,
    };
  });

  return (
    <AdminPageLayout title="Analytics">
      {/* Chart */}
      <SectionCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Queue Analytics</h2>
          {/* ── CHANGED: subtitle reflects backend as source, not localStorage */}
          <p className="mt-1 text-sm text-gray-500">
            Waiting vs served customers per service (live from backend).
          </p>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="service" tickMargin={8} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="waiting" stackId="a" fill="#facc15" />
              <Bar dataKey="served"  stackId="a" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Summary list */}
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Summary</h3>
          <p className="mt-1 text-sm text-gray-500">Quick breakdown by service.</p>
        </div>

        <div className="divide-y divide-gray-100">
          {/* ── CHANGED: rows from live backend data */}
          {services.map((service) => {
            const inService = queue.filter((q) => q.serviceId === service.id);
            const waiting = inService.filter((q) => q.status !== "served").length;
            const served  = inService.filter((q) => q.status === "served").length;

            return (
              <div key={service.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-gray-900">{service.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-yellow-800">
                    {waiting} waiting
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-green-800">
                    {served} served
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </AdminPageLayout>
  );
};

export default AnalyticsDashboard;