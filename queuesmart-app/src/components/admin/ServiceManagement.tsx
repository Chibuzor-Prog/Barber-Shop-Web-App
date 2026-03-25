
import React, { useEffect, useState } from "react";

// Service type definition
type Priority = "high" | "medium" | "low";
type Service = {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  priority: Priority;
};

const LOCAL_STORAGE_KEY = "services";

// Helper functions for localStorage CRUD
function getServicesFromStorage(): Service[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveServicesToStorage(services: Service[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(services));
}

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Omit<Service, "id">>({
    name: "",
    description: "",
    duration: 0,
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch services from localStorage
  const fetchServices = () => {
    setLoading(true);
    setError(null);
    try {
      const data = getServicesFromStorage();
      setServices(data);
    } catch (err: any) {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Save (create or update) service
  const handleSave = () => {
    setLoading(true);
    setError(null);
    try {
      let updatedServices: Service[] = [];
      if (editingService) {
        // Update
        updatedServices = services.map((s) =>
          s.id === editingService.id ? editingService : s
        );
      } else {
        // Create
        const newId = services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
        updatedServices = [
          ...services,
          { ...newService, id: newId, duration: Number(newService.duration) },
        ];
      }
      saveServicesToStorage(updatedServices);
      setEditingService(null);
      setNewService({ name: "", description: "", duration: 0, priority: "medium" });
      setServices(updatedServices);
    } catch (err: any) {
      setError("Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  // Delete service
  const handleDelete = (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const updatedServices = services.filter((s) => s.id !== id);
      saveServicesToStorage(updatedServices);
      setServices(updatedServices);
    } catch (err: any) {
      setError("Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  // Start editing a service
  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  // Handle input changes for new/editing service
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    field: keyof Omit<Service, "id">
  ) => {
    let value: any = e.target.value;
    if (field === "duration") value = Number(value);
    if (editingService) {
      setEditingService({ ...editingService, [field]: value });
    } else {
      setNewService({ ...newService, [field]: value });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Service Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {editingService ? "Edit Service" : "Add New Service"}
        </h3>
        <div className="bg-white shadow rounded-lg p-6 max-w-md flex flex-col gap-4 border border-gray-200">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700" htmlFor="service-name">Service Name</label>
            <input
              id="service-name"
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="text"
              placeholder="Enter service name"
              value={editingService ? editingService.name : newService.name}
              onChange={(e) => handleInputChange(e, "name")}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700" htmlFor="service-description">Description</label>
            <textarea
              id="service-description"
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="Enter service description"
              value={editingService ? editingService.description : newService.description}
              onChange={(e) => handleInputChange(e, "description")}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700" htmlFor="service-duration">Duration (minutes)</label>
            <input
              id="service-duration"
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="number"
              placeholder="Enter duration in minutes"
              value={editingService ? editingService.duration : newService.duration}
              onChange={(e) => handleInputChange(e, "duration")}
              min={1}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700" htmlFor="service-priority">Priority</label>
            <select
              id="service-priority"
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editingService ? editingService.priority : newService.priority}
              onChange={(e) => handleInputChange(e, "priority")}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
              onClick={handleSave}
              disabled={loading}
            >
              {editingService ? "Update" : "Add"}
            </button>
            {editingService && (
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 font-semibold"
                onClick={() => setEditingService(null)}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">Services</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Duration (min)</th>
              <th className="border px-4 py-2">Priority</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td className="border px-4 py-2">{service.name}</td>
                <td className="border px-4 py-2">{service.description}</td>
                <td className="border px-4 py-2">{service.duration}</td>
                <td className="border px-4 py-2 capitalize">{service.priority}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    onClick={() => handleEdit(service)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    onClick={() => handleDelete(service.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ServiceManagement;
