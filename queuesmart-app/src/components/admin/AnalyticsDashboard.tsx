import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Navbar from "../common/Navbar";
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
const generateUsers = (count: number) =>
  Array.from({ length: count }).map((_, i) => ({
    id: Date.now() + Math.random() * 10000 + i,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    ticketNumber: Math.floor(Math.random() * 1000) + 1,
    served: false,
  }));

const AnalyticsDashboard: React.FC = () => {
  // Initialize users per service
  const [queueUsers, setQueueUsers] = useState<Record<number, TicketUser[]>>(() => {
    const storedUsers = JSON.parse(localStorage.getItem("queueUsers") || "null");
    if (storedUsers) return storedUsers;
    return Object.fromEntries(
      Object.entries(MOCK_QUEUE_LENGTHS).map(([id, count]) => [
        Number(id),
        generateUsers(Number(count))
      ])
    );
  });

  // Persist to localStorage so it syncs with QueueManagement
  useEffect(() => {
    localStorage.setItem("queueUsers", JSON.stringify(queueUsers));
  }, [queueUsers]);

  // Compute analytics data
  const data = services.map(service => {
    const users = queueUsers[service.id] || [];
    return {
      service: service.name,
      waiting: users.filter(u => !u.served).length,
      served: users.filter(u => u.served).length,
    };
  });

  return (
    <div>
      <Navbar isAdmin />
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Queue Analytics
        </h2>

        {/* Live bar chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="waiting" stackId="a" fill="#facc15" />
              <Bar dataKey="served" stackId="a" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Optional live summary per service */}
        <div className="mt-6 space-y-2">
          {services.map(service => {
            const users = queueUsers[service.id] || [];
            return (
              <div key={service.id} className="flex justify-between items-center border p-2 rounded">
                <span className="font-semibold">{service.name}</span>
                <span className="text-gray-700">
                  {users.filter(u => !u.served).length} waiting, {users.filter(u => u.served).length} served
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
