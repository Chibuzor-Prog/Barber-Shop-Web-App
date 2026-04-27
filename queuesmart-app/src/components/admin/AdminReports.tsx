import React, { useEffect, useState } from "react";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import BASE_URL from "../../api/config";

const fetchWithAuth = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [usersHistory, setUsersHistory] = useState<any[]>([]);
  const [serviceActivity, setServiceActivity] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get JWT token from localStorage (from login response)
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchWithAuth(`${BASE_URL}/reports/users-history`, token),
      fetchWithAuth(`${BASE_URL}/reports/service-activity`, token),
      fetchWithAuth(`${BASE_URL}/reports/queue-stats`, token),
    ])
      .then(([users, services, stats]) => {
        setUsersHistory(users);
        setServiceActivity(services);
        setQueueStats(stats);
      })
      .catch((err) => setError(err.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <AdminPageLayout title="Reports">
      {loading && <div>Loading reports...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <>
          {/* Queue Usage Statistics */}
          <SectionCard>
            <h2 className="text-lg font-semibold mb-2">Queue Usage Statistics</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Users Served" value={queueStats?.usersServed ?? 0} />
              <StatCard label="Avg Wait Time (min)" value={queueStats?.avgWaitTime?.toFixed(1) ?? 0} />
            </div>
          </SectionCard>

          {/* Users and Queue Participation History */}
          <SectionCard>
            <h2 className="text-lg font-semibold mb-2">User Queue Participation</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">Total Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {usersHistory.map((u, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{u.user.fullName}</td>
                      <td className="px-2 py-1">{u.user.email}</td>
                      <td className="px-2 py-1">{u.history.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Service Details and Queue Activity */}
          <SectionCard>
            <h2 className="text-lg font-semibold mb-2">Service Details & Queue Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Service</th>
                    <th className="px-2 py-1 text-left">Description</th>
                    <th className="px-2 py-1 text-left">Active Queue Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceActivity.map((s, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{s.service.name}</td>
                      <td className="px-2 py-1">{s.service.description}</td>
                      <td className="px-2 py-1">{s.queueEntries.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </AdminPageLayout>
  );
};

export default AdminReports;