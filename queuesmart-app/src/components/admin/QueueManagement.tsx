

import React from "react";
import AdminPageLayout from "./ui/AdminPageLayout";
import { useQueue } from "../../context/QueueContext";
import { useServices } from "../../hooks/useServices";

/** Format an ISO timestamp string as HH:MM in local time. */
function formatTime(isoString: string | undefined): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "—";
  }
}

const QueueManagement: React.FC = () => {
  const { queue, serveNext, removeFromQueue, resetQueue } = useQueue();
  const { services } = useServices();

  const handleServeNext = async (serviceId: string) => {
    try { await serveNext(serviceId); }
    catch (e: any) { alert(e.message || "Could not serve next"); }
  };

  const handleRemove = async (entryId: string) => {
    try { await removeFromQueue(entryId); }
    catch (e: any) { alert(e.message || "Could not remove user"); }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all queues? This will cancel all waiting entries.")) return;
    try { await resetQueue(); }
    catch (e: any) { alert(e.message || "Could not reset queue"); }
  };

  return (
    <AdminPageLayout
      title="Queue Management"
      actions={
        <button
          onClick={handleReset}
          className="inline-flex items-center rounded-xl bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
        >
          Reset Daily Counter
        </button>
      }
    >
      <div className="space-y-6">
        {services.map(service => {
          const serviceEntries = queue.filter(
            q => q.serviceId === service.id && q.status !== "cancelled"
          );
          const inQueue = serviceEntries.filter(q => q.status !== "served").length;

          return (
            <div
              key={service.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* Service header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{service.name}</h2>
                  <p className="text-sm text-gray-500">
                    Expected duration: {service.expectedDuration} min per customer
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {inQueue} in queue
                </span>
              </div>

              {/* Entry table */}
              <div className="mt-5">
                {serviceEntries.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Ticket</th>
                          {/* Status */}
                          <th className="px-4 py-3 font-medium">Status</th>
                          {/* Checked In — NEW column */}
                          <th className="px-4 py-3 font-medium">Checked In</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {serviceEntries.map(entry => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition">
                            {/* Customer name */}
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{entry.name}</div>
                            </td>

                            {/* Ticket number */}
                            <td className="px-4 py-3 text-gray-700 font-medium">
                              #{entry.ticketNumber}
                            </td>

                            {/* Status badge */}
                            <td className="px-4 py-3">
                              {entry.status === "served" ? (
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                  Served
                                </span>
                              ) : entry.status === "almost ready" ? (
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  Almost Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                  Waiting
                                </span>
                              )}
                            </td>

                            {/* Checked In — time the user joined the queue */}
                            <td className="px-4 py-3 text-gray-600 text-sm">
                              {formatTime(entry.joinedAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {entry.status !== "served" && (
                                  <button
                                    onClick={() => handleServeNext(service.id)}
                                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                  >
                                    Serve Next
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemove(entry.id)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    No tickets for this service.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No services configured. Add services in the Services page.
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default QueueManagement;
