// src/user/JoinQueue.tsx
// Stat changes per requirements:
//
//  Top stat "Estimated Wait"  → "Total Estimated Wait"
//    = sum over each of user's services of
//      (people who joined BEFORE user in that service) × service.expectedDuration
//
//  Table col "Est. Wait"      → "Service Duration"
//    = service.expectedDuration of each service
//
//  Footer "Avg service time"  → "My total service duration: X min"
//    = sum of expectedDuration for each service the user has joined

import React, { useState, useMemo } from "react";
import { useQueue, QueueItem } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import { useServices, Service } from "../../hooks/useServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const JoinQueue: React.FC = () => {
  const { queue, joinQueue, cancelQueue } = useQueue();
  const { user }    = useAuth();
  const { services } = useServices();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [error, setError] = useState("");

  // User's active (non-cancelled) queue entries
  const userQueue = useMemo(
    () => queue.filter(item => item.userId === user?.id && item.status !== "cancelled"),
    [queue, user]
  );

  // Build a lookup: serviceId → Service object
  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    services.forEach(s => { m[s.id] = s; });
    return m;
  }, [services]);

  // Total Estimated Wait = sum over user's services of
  //   (people who joined BEFORE the user in that service) × service.expectedDuration
  const totalEstimatedWait = useMemo(() => {
    if (!user) return 0;
    let total = 0;

    userQueue.forEach(myEntry => {
      const svc = serviceMap[myEntry.serviceId];
      if (!svc) return;

      const myJoinTime = new Date(myEntry.joinedAt).getTime();

      // Everyone in this service who joined before me (excluding cancelled)
      const peopleAhead = queue.filter(
        q =>
          q.serviceId === myEntry.serviceId &&
          q.status !== "cancelled" &&
          new Date(q.joinedAt).getTime() < myJoinTime
      ).length;

      total += peopleAhead * svc.expectedDuration;
    });

    return total;
  }, [userQueue, queue, serviceMap, user]);

  // My total service duration = sum of expectedDuration of each joined service
  const myTotalServiceDuration = useMemo(() => {
    return userQueue.reduce((sum, item) => {
      const svc = serviceMap[item.serviceId];
      return sum + (svc ? svc.expectedDuration : 0);
    }, 0);
  }, [userQueue, serviceMap]);

  const handleJoin = async () => {
    if (!selectedService) { setError("Select a service"); return; }
    try {
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

        {/* ── Top Stats ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Queues Joined"
            value={userQueue.length}
            sub="Your active queues"
          />
          {/* "Estimated Wait" → "Total Estimated Wait" */}
          <StatCard
            label="Total Estimated Wait"
            value={`${totalEstimatedWait} min`}
            sub="People ahead × service duration"
          />
          <StatCard
            label="Services"
            value={services.length}
            sub="Available services"
          />
        </div>

        {/* ── Join Queue Section ─────────────────────────────────────────── */}
        <SectionCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Join a Service Queue</h2>

          <div className="flex items-center gap-3">
            <select
              className="border border-gray-300 px-3 py-2 flex-1 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={selectedService || ""}
              onChange={e => { setSelectedService(e.target.value || null); setError(""); }}
            >
              <option value="">Select a Service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.expectedDuration} min)
                </option>
              ))}
            </select>

            <button
              onClick={handleJoin}
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Join
            </button>
          </div>

          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </SectionCard>

        {/* ── Your Queues Table ──────────────────────────────────────────── */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Queues</h2>
            {/* "Avg service time" → "My total service duration: X min" */}
            <p className="text-sm text-gray-500">
              My total service duration: {myTotalServiceDuration} min
            </p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            {/* Column headers — "Est. Wait" → "Service Duration" */}
            <div className="grid grid-cols-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Ticket</span>
              <span className="text-right">Service Duration</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y bg-white">
              {userQueue.map((item: QueueItem) => {
                const svc = serviceMap[item.serviceId];
                // Service Duration = expectedDuration of the service
                const serviceDuration = svc ? svc.expectedDuration : 0;

                return (
                  <div key={item.id} className="grid grid-cols-4 items-center px-4 py-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-xs text-gray-400 truncate" title={item.serviceId}>
                        ID: {item.serviceId.slice(-6)}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        #{item.ticketNumber}
                      </span>
                    </div>

                    {/* Service Duration (was Est. Wait) */}
                    <p className="text-right text-sm text-gray-700 font-medium">
                      {serviceDuration} min
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
