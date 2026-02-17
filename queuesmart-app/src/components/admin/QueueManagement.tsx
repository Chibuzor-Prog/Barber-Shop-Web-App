import React, { useState, useEffect } from "react";
import Navbar from "../common/Navbar";
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
    storedUsers || Object.fromEntries(
      Object.entries(storedQueueLengths || { 1: 3, 2: 1, 3: 0, 4: 2 }).map(([id, count]) => [
        Number(id),
        generateUsers(Number(count))
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
      )
    }));
    setQueueLengths(prev => ({
      ...prev,
      [serviceId]: Math.max(0, prev[serviceId] - 1)
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
          [serviceId]: Math.max(0, prevLengths[serviceId] - 1)
        }));
      }

      return {
        ...prev,
        [serviceId]: newUsers
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
    <div>
      <Navbar isAdmin />
      <div className="p-6">
        <h1 className="text-5xl font-extrabold mb-10">Queue Management</h1>

        {services.map(service => (
          <div key={service.id} className="mb-10">
            {/* Service Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold">{service.name}</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                {queueLengths[service.id]} in queue
              </span>
            </div>

            {/* User list */}
            {queueUsers[service.id] && queueUsers[service.id].length > 0 ? (
              <div className="space-y-2">
                {queueUsers[service.id].map(user => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center border p-3 rounded shadow hover:shadow-lg transition"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">Ticket #{user.ticketNumber}</p>
                      {user.served && <p className="text-green-600 font-semibold">Served</p>}
                    </div>

                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      {!user.served && (
                        <button
                          onClick={() => handleServeNext(service.id, user.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                        >
                          Serve Next
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(service.id, user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tickets</p>
            )}
          </div>
        ))}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="mt-4 bg-yellow-500 text-white px-5 py-2 rounded hover:bg-yellow-600 transition"
        >
          Reset Daily Counter
        </button>
      </div>
    </div>
  );
};

export default QueueManagement;
