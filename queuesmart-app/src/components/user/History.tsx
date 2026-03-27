import React, { useMemo } from "react";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

const History: React.FC = () => {
  const history = [
    { date: "2026-02-10", service: "Haircut & Beard", outcome: "Served" },
    { date: "2026-02-09", service: "Shampoo", outcome: "Cancelled" },
  ];

  // 📊 Stats
  const stats = useMemo(() => {
    const served = history.filter((h) => h.outcome === "Served").length;
    const cancelled = history.filter((h) => h.outcome === "Cancelled").length;

    return {
      total: history.length,
      served,
      cancelled,
    };
  }, [history]);

  return (
    <UserPageLayout title="History">
      <div className="p-6 space-y-6">
        {/* 🔹 Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            label="Total Visits"
            value={stats.total}
            sub="All history records"
          />
          <StatCard
            label="Served"
            value={stats.served}
            sub="Completed services"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            sub="Missed or cancelled"
          />
        </div>

        {/* 🔹 History Table */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Service History
            </h2>
            <p className="text-sm text-gray-500">
              Your past queue activity
            </p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Date</span>
              <span>Service</span>
              <span className="text-right">Outcome</span>
            </div>

            {/* Rows */}
            <div className="divide-y bg-white">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 items-center px-4 py-4 hover:bg-gray-50"
                >
                  <p className="text-sm text-gray-600">{h.date}</p>

                  <p className="font-medium text-gray-900">
                    {h.service}
                  </p>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        h.outcome === "Served"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {h.outcome}
                    </span>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No history available.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default History;