import React, { useMemo } from "react";
import { useQueue, QueueItem } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const AVG_SERVICE_TIME = 10;

const QueueStatus: React.FC = () => {
  const { queue, cancelQueue } = useQueue();
  const { user } = useAuth();

  // Filter current user's queue
  const userQueue = queue.filter(
    (item: QueueItem) => item.user.email === user?.email
  );

  // 📊 Stats
  const stats = useMemo(() => {
    const active = userQueue.filter((q) => q.status !== "served").length;
    const served = userQueue.filter((q) => q.status === "served").length;

    const totalWait = userQueue.reduce((acc, _, index) => {
      return acc + (index + 1) * AVG_SERVICE_TIME;
    }, 0);

    return {
      total: userQueue.length,
      active,
      served,
      totalWait,
    };
  }, [userQueue]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-50 text-yellow-700";
      case "almost ready":
        return "bg-blue-50 text-blue-700";
      case "served":
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <UserPageLayout title="Queue Status">
      <div className="p-6 space-y-6">
        {/* 🔹 Top Stats */}
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
            sub="Completed"
          />
          <StatCard
            label="Est. Wait"
            value={`${stats.totalWait} mins`}
            sub="Total wait time"
          />
        </div>

        {/* 🔹 Queue Table */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Live Queue Status
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
              <span className="text-center">Status</span>
              <span className="text-right">Action</span>
            </div>

            {/* Rows */}
            <div className="divide-y bg-white">
              {userQueue.map((item: QueueItem) => (
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

                  <div className="text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

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
              ))}

              {userQueue.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No active queues.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default QueueStatus;