import React, { useEffect, useState } from "react";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import BASE_URL from "../../api/config";

// --- REQUIRED ADDITION: PDF Export Libraries ---
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// -----------------------------------------------

// Helper to fetch data with the admin token
const fetchWithAuth = async (url: string, token: string) => {
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// --- CSV Helper Function ---
// Safely wraps data in quotes so commas inside text don't break the CSV columns
const escapeCsvValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
};
// ----------------------------

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const [usersHistory, setUsersHistory] = useState<any[]>([]);
  const [serviceActivity, setServiceActivity] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get JWT token from localStorage (from login response)
  const token = localStorage.getItem("authToken");

  // --- BUG FIX & SMART FEATURE LOGIC ---
  // Safely ensure data is an array before doing math so the page never crashes
  const safeServiceActivity = Array.isArray(serviceActivity) ? serviceActivity : [];
  const safeUsersHistory = Array.isArray(usersHistory) ? usersHistory : [];

  // Calculate the AI prediction based on live queue volume
  const totalInQueue = safeServiceActivity.reduce((acc, s) => acc + (s?.queueEntries?.length || 0), 0);
  const avgWait = queueStats?.avgWaitTime || 0;
  const predictedWait = totalInQueue * avgWait;
  // ---------------------------------------

  // Generates a highly organized, multi-table CSV file
  const handleExportCsv = () => {
    let csvContent = "";

    // Helper to add a row of data
    const addRow = (rowArray: any[]) => {
      csvContent += rowArray.map(escapeCsvValue).join(",") + "\n";
    };

    // 1. EXECUTIVE SUMMARY SECTION
    addRow(["--- EXECUTIVE SUMMARY & SMART INSIGHTS ---"]);
    addRow(["Metric", "Value", "Notes"]);
    addRow(["Predicted Next Wait Time", `${predictedWait.toFixed(1)} mins`, `Based on ${totalInQueue} current entries`]);
    addRow(["Total Users Served", queueStats?.usersServed ?? 0, "All-time completed services"]);
    addRow(["Average Wait Time", `${queueStats?.avgWaitTime?.toFixed(1) ?? 0} mins`, "Historical average"]);
    addRow([]); // Blank row for spacing
    addRow([]); 

    // 2. USER PARTICIPATION SECTION
    addRow(["--- USER PARTICIPATION ---"]);
    addRow(["Customer Name", "Total Visits", "Email Address"]);
    safeUsersHistory.forEach((u) => {
      addRow([u.user?.fullName || "N/A", u.history?.length || 0, u.user?.email || "No email"]);
    });
    addRow([]); // Blank row for spacing
    addRow([]);

    // 3. SERVICE ACTIVITY SECTION
    addRow(["--- SERVICE ACTIVITY ---"]);
    addRow(["Service Name", "Currently Waiting", "Description"]);
    safeServiceActivity.forEach((s) => {
      addRow([s.service?.name || "N/A", s.queueEntries?.length || 0, s.service?.description || "No description"]);
    });

    // Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.setAttribute("download", `QueueSmart_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generates the branded, multi-table PDF file
  const handleExportPdf = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleString();

    // Blue Branded Header
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, 40, 'F'); 
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("QueueSmart - Administrator Report", 14, 25);
    doc.setFontSize(11);
    doc.text(`Generated on: ${dateStr}`, 14, 33);

    // Executive Summary Table
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("Executive Summary & Smart Insights", 14, 50);
    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value", "Status"]],
      body: [
        ["Predicted Wait (Smart)", `${predictedWait.toFixed(1)} mins`, predictedWait > 30 ? "Busy" : "Optimal"],
        ["Total Users Served", queueStats?.usersServed ?? 0, "N/A"],
        ["Average Wait Time", `${queueStats?.avgWaitTime?.toFixed(1) ?? 0} mins`, "N/A"],
      ],
    });

    // User Participation Table
    let finalY = (doc as any).lastAutoTable.finalY || 50; 
    doc.text("User Queue Participation", 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [["Name", "Email", "Total Visits"]],
      body: safeUsersHistory.map((u) => [
        u.user?.fullName || "N/A",
        u.user?.email || "N/A",
        u.history?.length || 0
      ]),
    });

    // Service Activity Table
    finalY = (doc as any).lastAutoTable.finalY || 50;
    doc.text("Service Details & Activity", 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [["Service", "Description", "Active Entries"]],
      body: safeServiceActivity.map((s) => [
        s.service?.name || "N/A",
        s.service?.description || "N/A",
        s.queueEntries?.length || 0
      ]),
    });

    const fileDate = new Date().toISOString().split('T')[0];
    doc.save(`QueueSmart_Admin_Report_${fileDate}.pdf`);
  };

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
      {error && <div className="text-red-600 font-bold">{error}</div>}
      {!loading && !error && (
        <>
          {/* Export Buttons */}
          <div className="mb-4 flex justify-end gap-4">
            <button
              onClick={handleExportCsv}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Export PDF
            </button>
          </div>

          {/* AI Predictor Card */}
          <SectionCard>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-blue-700">✨ Smart Prediction</h2>
                    <p className="text-sm text-gray-500">Predicted wait for the next customer joining the queue.</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-gray-900">{predictedWait.toFixed(1)}m</span>
                </div>
            </div>
          </SectionCard>

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
                  {safeUsersHistory.map((u, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{u.user?.fullName || "N/A"}</td>
                      <td className="px-2 py-1">{u.user?.email || "N/A"}</td>
                      <td className="px-2 py-1">{u.history?.length || 0}</td>
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
                  {safeServiceActivity.map((s, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{s.service?.name || "N/A"}</td>
                      <td className="px-2 py-1">{s.service?.description || "N/A"}</td>
                      <td className="px-2 py-1">{s.queueEntries?.length || 0}</td>
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