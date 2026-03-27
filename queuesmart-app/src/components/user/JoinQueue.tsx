// src/user/JoinQueue.tsx
// ── CHANGED: services and queue from backend. joinQueue / cancelQueue call
//    backend via QueueContext which also broadcasts localStorage sync so all
//    other open pages (Dashboard, QueueStatus, AdminDashboard…) update instantly.
//    mockUsers and mockServices imports removed entirely.

import React, { useState, useMemo } from "react";
import { useQueue, QueueItem } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import { useServices } from "../../hooks/useServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const AVG_SERVICE_TIME = 10;

const JoinQueue: React.FC = () => {
  const { queue, joinQueue, cancelQueue } = useQueue();
  // ── CHANGED: authenticated user from context, not hardcoded mockUser
  const { user } = useAuth();
  // ── CHANGED: services from backend via shared hook
  const { services } = useServices();

  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [error, setError] = useState("");

  // ── CHANGED: filter queue by authenticated user's id
  const userQueue = useMemo(
    () => queue.filter((item) => String(item.userId) === String(user?.id)),
    [queue, user]
  );

  const totalQueues = userQueue.length;

  // ── CHANGED: use estimatedWaitMinutes from backend when available
  const totalWait = userQueue.reduce((acc, item, index) => {
    return acc + (item.estimatedWaitMinutes ?? (index + 1) * AVG_SERVICE_TIME);
  }, 0);

  const handleJoin = async () => {
    if (!selectedService) {
      setError("Select a service");
      return;
    }
    try {
      // ── CHANGED: joinQueue is async and calls backend; it also broadcasts
      //    localStorage sync so Dashboard / QueueStatus update immediately
      await joinQueue(selectedService);
      setSelectedService(null);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to join queue");
    }
  };

  return (
    <UserPageLayout title="Join Queue">
      <div className="p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* ── CHANGED: values from live backend-derived state */}
          <StatCard label="Queues Joined"  value={totalQueues}           sub="Your active queues"  />
          <StatCard label="Estimated Wait" value={`${totalWait} mins`}   sub="Across all queues"   />
          {/* ── CHANGED: services.length from backend */}
          <StatCard label="Services"       value={services.length}       sub="Available services"  />
        </div>

        {/* Join Queue Section */}
        <SectionCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Join a Service Queue</h2>

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
              {/* ── CHANGED: options sourced from backend */}
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

          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </SectionCard>

        {/* Your Queue Table */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Queues</h2>
            <p className="text-sm text-gray-500">Avg service time: {AVG_SERVICE_TIME} min</p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Ticket</span>
              <span className="text-right">Est. Wait</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y bg-white">
              {/* ── CHANGED: rows from backend-polled queue */}
              {userQueue.map((item: QueueItem, index: number) => {
                const waitTime = item.estimatedWaitMinutes ?? (index + 1) * AVG_SERVICE_TIME;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 items-center px-4 py-4 hover:bg-gray-50"
                  >
                    <div>
                      {/* ── CHANGED: item.serviceName (backend field) not item.service.name */}
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-xs text-gray-500">Service ID: {item.serviceId}</p>
                    </div>

                    <div className="text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        #{item.ticketNumber}
                      </span>
                    </div>

                    <p className="text-right text-sm text-gray-600">{waitTime} mins</p>

                    <div className="text-right">
                      {/* ── CHANGED: cancelQueue passes item.id (backend entry id), triggers broadcast */}
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