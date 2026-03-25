import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";

// Helper to load services from localStorage
function getServicesFromStorage() {
  const data = localStorage.getItem("services");
  return data ? JSON.parse(data) : [];
}

// Helper to load queue from localStorage
function getQueueFromStorage() {
  const data = localStorage.getItem("queue");
  return data ? JSON.parse(data) : [];
}

type QueueLengths = Record<number, number>;

type TicketUser = {
  id: number;
  name: string;
  ticketNumber: number;
  served: boolean;
};

// Mock initial queue lengths
const MOCK_QUEUE_LENGTHS: QueueLengths = { 1: 3, 2: 1, 3: 0, 4: 2 };

const NAMES = [
  "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hannah",
  "Ian", "Jack", "Kara", "Liam", "Mia", "Nora", "Oscar", "Paula",
];

// Helper: generate random users for a service
const generateUsers = (count: number): TicketUser[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: Date.now() + Math.random() * 10000 + i,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    ticketNumber: Math.floor(Math.random() * 1000) + 1,
    served: false,
  }));


const AnalyticsDashboard: React.FC = () => {
  const [services, setServices] = useState<any[]>(getServicesFromStorage());
  const [queue, setQueue] = useState<any[]>(getQueueFromStorage());

  // Listen for changes to services and queue in localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(getServicesFromStorage());
      setQueue(getQueueFromStorage());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Compute analytics data
  const data = services.map((service: any) => {
    const users = queue.filter((q: any) => q.service.id === service.id);
    return {
      service: service.name,
      waiting: users.filter((u: any) => u.status !== "served").length,
      served: users.filter((u: any) => u.status === "served").length,
    };
  });

  return (
    <AdminPageLayout title="Analytics">
      {/* Chart */}
      <SectionCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Queue Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Waiting vs served customers per service (live from localStorage).
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
              <Bar dataKey="served" stackId="a" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Summary list */}
      <SectionCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Live Summary</h3>
          <p className="mt-1 text-sm text-gray-500">
            Quick breakdown by service.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {services.map((service: any) => {
            const users = queue.filter((q: any) => q.service.id === service.id);
            const waiting = users.filter((u: any) => u.status !== "served").length;
            const served = users.filter((u: any) => u.status === "served").length;

            return (
              <div
                key={service.id}
                className="flex items-center justify-between py-3"
              >
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
