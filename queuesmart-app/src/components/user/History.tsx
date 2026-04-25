

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { historyApi } from "../../api/api";
import UserPageLayout from "./ui/UserPageLayout";
import SectionCard from "../admin/ui/SectionCard";
import StatCard from "../admin/ui/StatCard";

type HistoryEntry = {
  id: number;
  userId: number | string;
  userName: string;
  serviceId: number;
  serviceName: string;
  outcome: "Served" | "Cancelled";
  date: string;
};

const SYNC_KEY = "qs_sync";

const History: React.FC = () => {
  const { user } = useAuth();
  // ── CHANGED: history state loaded from backend
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── CHANGED: fetch wrapped in useCallback so it can be called from both
  //    the useEffect mount and the storage event listener
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await historyApi.getForUser(user.id);
      setHistory(data);
    } catch {
      setHistory([]);
    }
  }, [user]);

  // ── CHANGED: initial fetch on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── CHANGED: listen for storage events from other pages — when a user
  //    joins/leaves/is-served on any page, this page refreshes instantly
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) fetchHistory();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [fetchHistory]);

  // ── CHANGED: also poll every 5 s for same-tab navigation scenarios
  useEffect(() => {
    const id = setInterval(fetchHistory, 5000);
    return () => clearInterval(id);
  }, [fetchHistory]);

  // ── CHANGED: stats derived from live backend history
  const stats = useMemo(() => {
    const served    = history.filter((h) => h.outcome === "Served").length;
    const cancelled = history.filter((h) => h.outcome === "Cancelled").length;
    return { total: history.length, served, cancelled };
  }, [history]);

  return (
    <UserPageLayout title="History">
      <div className="p-6 space-y-6">
        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Total Visits" value={stats.total}     sub="All history records"  />
          <StatCard label="Served"       value={stats.served}    sub="Completed services"   />
          <StatCard label="Cancelled"    value={stats.cancelled} sub="Missed or cancelled"  />
        </div>

        {/* History Table */}
        <SectionCard>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Service History</h2>
            <p className="text-sm text-gray-500">Your past queue activity</p>
          </div>

          <div className="mt-4 border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span>Date</span>
              <span>Service</span>
              <span className="text-right">Outcome</span>
            </div>

            <div className="divide-y bg-white">
              {/* ── CHANGED: rows from backend history, using serviceName field */}
              {history.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-3 items-center px-4 py-4 hover:bg-gray-50"
                >
                  <p className="text-sm text-gray-600">{h.date}</p>
                  <p className="font-medium text-gray-900">{h.serviceName}</p>
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
                <div className="px-4 py-6 text-sm text-gray-500">No history available.</div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </UserPageLayout>
  );
};

export default History;