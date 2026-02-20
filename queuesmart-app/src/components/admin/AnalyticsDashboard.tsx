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
import { services } from "../../data/mockServices";

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
  // Initialize users per service
  const [queueUsers, setQueueUsers] = useState<Record<number, TicketUser[]>>(() => {
    const raw = localStorage.getItem("queueUsers");
    const storedUsers = raw ? JSON.parse(raw) : null;

    if (storedUsers) return storedUsers;

    return Object.fromEntries(
      Object.entries(MOCK_QUEUE_LENGTHS).map(([id, count]) => [
        Number(id),
        generateUsers(Number(count)),
      ])
    ) as Record<number, TicketUser[]>;
  });

  // Persist to localStorage so it syncs with QueueManagement
  useEffect(() => {
    localStorage.setItem("queueUsers", JSON.stringify(queueUsers));
  }, [queueUsers]);

  // Compute analytics data
  const data = services.map((service) => {
    const users = queueUsers[service.id] || [];
    return {
      service: service.name,
      waiting: users.filter((u) => !u.served).length,
      served: users.filter((u) => u.served).length,
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
          {services.map((service) => {
            const users = queueUsers[service.id] || [];
            const waiting = users.filter((u) => !u.served).length;
            const served = users.filter((u) => u.served).length;

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
