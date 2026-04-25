
//  "Est. Wait" (table col) = sum over user's services of
//    (people who joined BEFORE the user in that service) × service.expectedDuration
//    — same Total Estimated Wait formula, shown per-service context
//
//  "Avg service time" stat → "Number on Queue"
//    = number of users who checked in before the current user + 1 (the user themselves)
//    i.e. across all user's services, count entries that joined earlier

import React, { useMemo } from "react";
import { useQueue, QueueItem } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import { useServices, Service } from "../../hooks/useServices";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

/** Format ISO timestamp as HH:MM */
function fmt(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return "—"; }
}

const QueueStatus: React.FC = () => {
  const { queue, cancelQueue } = useQueue();
  const { user }     = useAuth();
  const { services } = useServices();

  // User's active (non-cancelled) entries
  const userQueue = useMemo(
    () => queue.filter(item => item.userId === user?.id && item.status !== "cancelled"),
    [queue, user]
  );

  // serviceId → Service lookup
  const serviceMap = useMemo(() => {
    const m: Record<string, Service> = {};
    services.forEach(s => { m[s.id] = s; });
    return m;
  }, [services]);

  // Per-entry: Total Estimated Wait for that entry
  // = (people who joined BEFORE the user in that service) × service.expectedDuration
  function getEstWait(item: QueueItem): number {
    const svc = serviceMap[item.serviceId];
    if (!svc) return 0;
    const myJoinTime = new Date(item.joinedAt).getTime();
    const peopleAhead = queue.filter(
      q =>
        q.serviceId === item.serviceId &&
        q.status !== "cancelled" &&
        new Date(q.joinedAt).getTime() < myJoinTime
    ).length;
    return peopleAhead * svc.expectedDuration;
  }

  const stats = useMemo(() => {
    const active = userQueue.filter(q => q.status !== "served").length;
    const served = userQueue.filter(q => q.status === "served").length;

    // Total Estimated Wait across all user's services
    const totalEstWait = userQueue.reduce((sum, item) => sum + getEstWait(item), 0);

    // Number on Queue:
    // For each of the user's services, count entries that joined before them.
    // Sum those up and add 1 (the user themselves) per service.
    let numberOnQueue = 0;
    userQueue.forEach(myEntry => {
      const myJoinTime = new Date(myEntry.joinedAt).getTime();
      const aheadCount = queue.filter(
        q =>
          q.serviceId === myEntry.serviceId &&
          q.status !== "cancelled" &&
          new Date(q.joinedAt).getTime() < myJoinTime
      ).length;
      // aheadCount people before user + 1 (user themselves)
      numberOnQueue += aheadCount + 1;
    });

    return { total: userQueue.length, active, served, totalEstWait, numberOnQueue };
  }, [userQueue, queue, serviceMap]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "waiting":      return "bg-yellow-50 text-yellow-700";
      case "almost ready": return "bg-blue-50 text-blue-700";
      case "served":       return "bg-green-50 text-green-700";
      default:             return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <UserPageLayout title="Queue Status">
      <div className="p-6 space-y-6">

        {/* ── Top Stats ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard
            label="Total Queues"
            value={stats.total}
            sub="All joined queues"
          />
          <StatCard
            label="Active"
            value={stats.active}
            sub="Currently waiting"
          />
          <StatCard
            label="Served"
            value={stats.served}
            sub="Completed today"
          />
          {/* "Avg service time" → "Number on Queue" */}
          <StatCard
            label="Number on Queue"
            value={stats.numberOnQueue}
            sub="Users ahead + you, per service"
          />
        </div>

        {/* ── Queue Table ────────────────────────────────────────────────── */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Live Queue Status</h2>
            <p className="text-sm text-gray-500">
              Total Est. Wait: {stats.totalEstWait} min
            </p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            {/* 5 columns: Service | Ticket | Status | Est. Wait | Action */}
            <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Service</span>
              <span className="text-center">Ticket</span>
              <span className="text-center">Status</span>
              {/* Est. Wait — people ahead × service duration */}
              <span className="text-right">Est. Wait</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y bg-white">
              {userQueue.map((item: QueueItem) => {
                const estWait = getEstWait(item);

                return (
                  <div key={item.id} className="grid grid-cols-5 items-center px-4 py-4 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-xs text-gray-400">
                        In: {fmt(item.joinedAt)}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        #{item.ticketNumber}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Est. Wait = people ahead × service.expectedDuration */}
                    <p className="text-right text-sm text-gray-700 font-medium">
                      {estWait} min
                    </p>

                    <div className="text-right">
                      {item.status !== "served" && (
                        <button
                          onClick={() => cancelQueue(item.id)}
                          className="text-red-600 text-sm font-medium hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {userQueue.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No active queues.</div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default QueueStatus;
