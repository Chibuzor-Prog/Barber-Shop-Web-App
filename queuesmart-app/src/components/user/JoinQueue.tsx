import React, { useState, useMemo } from "react";
import { services } from "../../data/mockServices";
import { users } from "../../data/mockUsers";
import { useQueue, QueueItem } from "../../context/QueueContext";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const AVG_SERVICE_TIME = 10;

const JoinQueue: React.FC = () => {
  const { queue, joinQueue, cancelQueue } = useQueue();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [error, setError] = useState("");

  const mockUser = users[0];

  // User-specific queue
  const userQueue = useMemo(
    () =>
      queue.filter((item) => item.user.email === mockUser.email),
    [queue]
  );

  // Stats
  const totalQueues = userQueue.length;

  const totalWait = userQueue.reduce((acc, item, index) => {
    return acc + (index + 1) * AVG_SERVICE_TIME;
  }, 0);

  const handleJoin = () => {
    if (!selectedService) {
      setError("Select a service");
      return;
    }

    const service = services.find((s) => s.id === selectedService);
    if (!service) return;

    joinQueue(mockUser, service);
    setSelectedService(null);
    setError("");
  };

  return (
    <UserPageLayout title="Join Queue">
      <div className="p-6 space-y-6">
        {/* 🔹 Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Queues Joined"
            value={totalQueues}
            sub="Your active queues"
          />
          <StatCard
            label="Estimated Wait"
            value={`${totalWait} mins`}
            sub="Across all queues"
          />
          <StatCard
            label="Services"
            value={services.length}
            sub="Available services"
          />
        </div>

        {/* 🔹 Join Queue Section */}
        <SectionCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Join a Service Queue
          </h2>

          <div className="flex items-center gap-3">
            <select
              className="border p-2 flex-1 rounded-md"
              value={selectedService || ""}
              onChange={(e) => {
                setSelectedService(Number(e.target.value));
                setError("");
              }}
            >
              <option value="">Select a Service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleJoin}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Join
            </button>
          </div>

          {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
          )}
        </SectionCard>

        {/* 🔹 Your Queue Table */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Queues
            </h2>
            <p className="text-sm text-gray-500">
              Avg service time: {AVG_SERVICE_TIME} min
            </p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Ticket</span>
              <span className="text-right">Est. Wait</span>
              <span className="text-right">Action</span>
            </div>

            {/* Rows */}
            <div className="divide-y bg-white">
              {userQueue.map((item: QueueItem, index: number) => {
                const waitTime = (index + 1) * AVG_SERVICE_TIME;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 items-center px-4 py-4 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Service ID: {item.service.id}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        #{item.ticketNumber}
                      </span>
                    </div>

                    <p className="text-right text-sm text-gray-600">
                      {waitTime} mins
                    </p>

                    <div className="text-right">
                      <button
                        onClick={() => cancelQueue(item.id)}
                        className="text-red-600 text-sm font-medium hover:underline"
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                );
              })}

              {userQueue.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">
                  You have not joined any queues.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default JoinQueue;