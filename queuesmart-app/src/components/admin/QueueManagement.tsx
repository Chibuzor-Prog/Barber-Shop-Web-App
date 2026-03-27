// src/admin/QueueManagement.tsx
// ── CHANGED: all data from backend-polled QueueContext + useServices hook.
//    serveNext / removeFromQueue / resetQueue call backend through context
//    which also broadcasts localStorage sync signal so all other pages update.
//    Removed localStorage, generateUsers, NAMES, storedQueueLengths, mockServices.

import React from "react";
import AdminPageLayout from "./ui/AdminPageLayout";
import { useQueue } from "../../context/QueueContext";
import { useServices } from "../../hooks/useServices";

const QueueManagement: React.FC = () => {
  // ── CHANGED: queue / actions from backend-polled context
  const { queue, serveNext, removeFromQueue, resetQueue } = useQueue();
  // ── CHANGED: services from backend via shared hook
  const { services } = useServices();

  // ── CHANGED: serve-next calls backend via context then broadcasts sync
  const handleServeNext = async (serviceId: number) => {
    try {
      await serveNext(serviceId);
    } catch (e: any) {
      alert(e.message || "Could not serve next");
    }
  };

  // ── CHANGED: remove calls backend via context then broadcasts sync
  const handleRemove = async (entryId: number) => {
    try {
      await removeFromQueue(entryId);
    } catch (e: any) {
      alert(e.message || "Could not remove user");
    }
  };

  // ── CHANGED: reset calls backend via context then broadcasts sync
  const handleReset = async () => {
    try {
      await resetQueue();
    } catch (e: any) {
      alert(e.message || "Could not reset queue");
    }
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
        {/* ── CHANGED: iterate backend services, filter backend queue per service */}
        {services.map((service) => {
          const serviceEntries = queue.filter((q) => q.serviceId === service.id);
          const inQueue        = serviceEntries.filter((q) => q.status !== "served").length;

          return (
            <div
              key={service.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* Service Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{service.name}</h2>
                  <p className="text-sm text-gray-500">Manage tickets for this service</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {inQueue} in queue
                </span>
              </div>

              {/* User list */}
              <div className="mt-5">
                {serviceEntries.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Customer</th>
                          <th className="px-4 py-3 font-medium">Ticket</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {/* ── CHANGED: rows from backend queue entries */}
                        {serviceEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              {/* ── CHANGED: entry.name from backend */}
                              <div className="font-medium text-gray-900">{entry.name}</div>
                            </td>

                            <td className="px-4 py-3 text-gray-700">#{entry.ticketNumber}</td>

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

                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {/* ── CHANGED: serve-next calls backend, no local state update */}
                                {entry.status !== "served" && (
                                  <button
                                    onClick={() => handleServeNext(service.id)}
                                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                  >
                                    Serve Next
                                  </button>
                                )}

                                {/* ── CHANGED: remove calls backend via handleRemove */}
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
      </div>
    </AdminPageLayout>
  );
};

export default QueueManagement;