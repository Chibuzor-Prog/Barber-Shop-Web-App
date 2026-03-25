import React, { useState, useEffect } from "react";
import AdminPageLayout from "./ui/AdminPageLayout";

// Helper to load services from localStorage
function getServicesFromStorage() {
  const data = localStorage.getItem("services");
  return data ? JSON.parse(data) : [];
}



const QueueManagement: React.FC = () => {

  // Services state (from localStorage)
  const [services, setServices] = useState<any[]>(getServicesFromStorage());

  // Listen for changes to services in localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(getServicesFromStorage());
    }, 500);
    return () => clearInterval(interval);
  }, []);


  // Read the real user queue from localStorage
  function getUserQueue() {
    const data = localStorage.getItem("queue");
    return data ? JSON.parse(data) : [];
  }

  const [queue, setQueue] = useState<any[]>(getUserQueue());

  // Poll for queue changes
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(getUserQueue());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminPageLayout title="Queue Management">
      <div className="space-y-8">
        {services.map((service: any) => {
          // Group queue items by service
          const users = queue.filter((item: any) => item.service.id === service.id);
          const inQueue = users.length;

          return (
            <React.Fragment key={service.id}>
              <div
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* Service Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Manage tickets for this service
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {inQueue} in queue
                  </span>
                </div>

                {/* User list */}
                <div className="mt-5">
                  {users.length > 0 ? (
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
                          {users.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {user.user?.name || user.name}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-gray-700">
                                #{user.ticketNumber}
                              </td>

                              <td className="px-4 py-3">
                                {user.status === "served" || user.served ? (
                                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                    Served
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                    Waiting
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  {user.status !== "served" && (
                                    <button
                                      // onClick={() => handleServeNext(service.id, user.id)}
                                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                      disabled
                                    >
                                      Serve Next
                                    </button>
                                  )}

                                  <button
                                    // onClick={() => handleRemove(service.id, user.id)}
                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                    disabled
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
                    <div className="text-gray-500">No users in queue.</div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AdminPageLayout>
  );

};

export default QueueManagement;