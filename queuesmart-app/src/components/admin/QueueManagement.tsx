import React, { useState, useEffect } from "react";
import AdminPageLayout from "./ui/AdminPageLayout";
import { services } from "../../data/mockServices";

type QueueLengths = Record<number, number>;

type TicketUser = {
  id: number;
  name: string;
  ticketNumber: number;
  served: boolean;
};

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

const QueueManagement: React.FC = () => {
  // Load from localStorage if exists
  const storedQueueLengths = JSON.parse(localStorage.getItem("queueLengths") || "null");
  const storedUsers = JSON.parse(localStorage.getItem("queueUsers") || "null");

  const [queueLengths, setQueueLengths] = useState<QueueLengths>(
    storedQueueLengths || { 1: 3, 2: 1, 3: 0, 4: 2 }
  );

  const [queueUsers, setQueueUsers] = useState<Record<number, TicketUser[]>>(
    storedUsers ||
      Object.fromEntries(
        Object.entries(storedQueueLengths || { 1: 3, 2: 1, 3: 0, 4: 2 }).map(([id, count]) => [
          Number(id),
          generateUsers(Number(count)),
        ])
      )
  );

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("queueLengths", JSON.stringify(queueLengths));
    localStorage.setItem("queueUsers", JSON.stringify(queueUsers));
  }, [queueLengths, queueUsers]);

  // Serve Next: mark served and decrease count
  const handleServeNext = (serviceId: number, userId: number) => {
    setQueueUsers(prev => ({
      ...prev,
      [serviceId]: prev[serviceId].map(u =>
        u.id === userId ? { ...u, served: true } : u
      ),
    }));
    setQueueLengths(prev => ({
      ...prev,
      [serviceId]: Math.max(0, prev[serviceId] - 1),
    }));
  };

  // Remove: decrease count only if user not served
  const handleRemove = (serviceId: number, userId: number) => {
    setQueueUsers(prev => {
      const userToRemove = prev[serviceId].find(u => u.id === userId);
      const newUsers = prev[serviceId].filter(u => u.id !== userId);

      if (!userToRemove) return prev;

      if (!userToRemove.served) {
        setQueueLengths(prevLengths => ({
          ...prevLengths,
          [serviceId]: Math.max(0, prevLengths[serviceId] - 1),
        }));
      }

      return {
        ...prev,
        [serviceId]: newUsers,
      };
    });
  };

  // Reset all queues
  const handleReset = () => {
    const resetLengths: QueueLengths = {};
    const resetUsers: Record<number, TicketUser[]> = {};
    services.forEach(s => {
      resetLengths[s.id] = 0;
      resetUsers[s.id] = [];
    });
    setQueueLengths(resetLengths);
    setQueueUsers(resetUsers);
  };

  return (
    <AdminPageLayout
      title="Queue Management"
      actions={
        <button
          onClick={handleReset}
          className="inline-flex items-center rounded-xl bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
        >
          Reset Daily Counter
        </button>
      }
    >
      <div className="space-y-6">
        {services.map(service => {
          const users = queueUsers[service.id] ?? [];
          const inQueue = queueLengths[service.id] ?? 0;

          return (
            <div
              key={service.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* Service Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage tickets for this service
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {inQueue} in queue
                </span>
              </div>

              {/* User list */}
              <div className="mt-5">
                {users.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Ticket</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {user.name}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-gray-700">
                              #{user.ticketNumber}
                            </td>

                            <td className="px-4 py-3">
                              {user.served ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                  Served
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                  Waiting
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {!user.served && (
                                  <button
                                    onClick={() => handleServeNext(service.id, user.id)}
                                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                  >
                                    Serve Next
                                  </button>
                                )}

                                <button
                                  onClick={() => handleRemove(service.id, user.id)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    No tickets for this service.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminPageLayout>
  );
};

export default QueueManagement;