// src/admin/ServiceManagement.tsx
//
// Features:
//  • Form heading shows "Add Service" or "Edit Service" based on mode
//  • "Add" button submits a new service to the backend (POST /services)
//  • In edit mode: "Update" saves changes (PUT /services/:id),
//    "Cancel" clears the form and returns to Add mode
//  • Services table below the form (wrapped in SectionCard) shows all services
//    from the backend.  Each row has Edit and Delete action buttons.
//  • Edit button populates form with the selected service's data.
//  • Delete button calls DELETE /services/:id, removes from table and
//    propagates the change to all pages via localStorage broadcast.
//  • After every mutation, broadcasts "qs_sync" so useServices() hook in every
//    other open page refreshes instantly.

import { useState, useEffect, useCallback } from "react";
import { servicesApi } from "../../api/api";
import AdminPageLayout from "./ui/AdminPageLayout";
import SectionCard from "./ui/SectionCard";

type Priority = "low" | "medium" | "high";

type Service = {
  _id: string;
  serviceId: string;
  name: string;
  description: string;
  expectedDuration: number;
  priorityLevel: number;
};

// Mirrors QueueContext's broadcastSync — notifies other open pages immediately
const SYNC_KEY = "qs_sync";
function broadcastSync() {
  localStorage.setItem(SYNC_KEY, Date.now().toString());
}

const ServiceManagement: React.FC = () => {
  // ── form state ─────────────────────────────────────────────────────────────
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  // ── edit state ─────────────────────────────────────────────────────────────
  // null = Add mode; Service object = Edit mode
  const [editingService, setEditingService] = useState<Service | null>(null);

  // ── table state ────────────────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);

  // ── fetch services from backend ────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    try {
      const data = await servicesApi.getAll();
      setServices(data);
    } catch {
      // silently keep existing list
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const clearForm = () => {
    setName(""); setDesc(""); setDuration(""); setPriority("medium");
    setError(""); setSuccess(""); setEditingService(null);
  };

  const populateForm = (svc: Service) => {
    setEditingService(svc);
    setName(svc.name);
    setDesc(svc.description);
    setDuration(svc.expectedDuration);
    setPriority(svc.priorityLevel === 1 ? "high" : svc.priorityLevel === 2 ? "medium" : "low");
    setError(""); setSuccess("");
  };

  // ── validate ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!name.trim() || name.length > 100) { setError("Name required (max 100 chars)"); return false; }
    if (!desc.trim())                       { setError("Description required");          return false; }
    if (!duration || Number(duration) <= 0) { setError("Duration must be greater than 0"); return false; }
    return true;
  };

  // ── ADD (create) ───────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const result = await servicesApi.create({
        name: name.trim(),
        description: desc.trim(),
        duration: Number(duration),
        priority,
      });
      setSuccess(`Service "${result.service.name}" added (ID: ${result.service.serviceId})`);
      clearForm();
      await fetchServices();
      broadcastSync();
    } catch (err: any) {
      setError(err.message || "Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  // ── UPDATE (edit) ──────────────────────────────────────────────────────────
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !validate()) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const result = await servicesApi.update(editingService._id, {
        name: name.trim(),
        description: desc.trim(),
        duration: Number(duration),
        priority,
      });
      setSuccess(`Service "${result.service.name}" updated`);
      clearForm();
      await fetchServices();
      broadcastSync();
    } catch (err: any) {
      setError(err.message || "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this service?")) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      await servicesApi.delete(id);
      // If we were editing the deleted service, reset form
      if (editingService?.id === id) clearForm();
      await fetchServices();
      broadcastSync();
      setSuccess("Service deleted");
    } catch (err: any) {
      setError(err.message || "Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  // ── priority badge colour ──────────────────────────────────────────────────
  const priorityClass = (p: string) => {
    if (p === "high")   return "bg-red-50 text-red-700";
    if (p === "low")    return "bg-gray-50 text-gray-600";
    return "bg-yellow-50 text-yellow-700"; // medium
  };

  return (
    <div>
    <AdminPageLayout title="Service Management">
      <div className="max-w-2xl space-y-6">

        {/* ── Error / Success banners ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ── Form card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          {/* Dynamic heading */}
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {editingService ? "Edit Service" : "Add Service"}
          </h3>

          <form onSubmit={editingService ? handleUpdate : handleAdd} className="space-y-4">

            {/* name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Service Name</label>
              <input
                type="text"
                maxLength={100}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            {/* duration */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={duration}
                onChange={e => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            {/* priority */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Buttons — Add mode: single "Add" button.  Edit mode: "Update" + "Cancel". */}
            <div className="flex gap-3 pt-1">
              {editingService ? (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? "Updating…" : "Update"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={clearForm}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-green-600 px-5 py-2 font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? "Adding…" : "Add"}
                </button>
              )}
            </div>
          </form>
        </div>
            
      </div>
    </AdminPageLayout>
    <AdminPageLayout title="">
      <div className="max-w-7xl space-y-6">

        {/* ── Services table ── */}
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Services</h3>
            <p className="text-sm text-gray-500">{services.length} total</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            {/* Header */}
            <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <span className="col-span-3">Name</span>
              <span className="col-span-4">Description</span>
              <span className="col-span-2 text-center">Duration</span>
              <span className="col-span-1 text-center">Priority</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100 bg-white">
              {services.map((svc) => (
                <div
                  key={svc._id}
                  className={`grid grid-cols-12 items-center px-4 py-3 transition hover:bg-gray-50 ${
                    editingService?._id === svc._id ? "bg-blue-50" : ""
                  }`}
                >
                  {/* Name */}
                  <div className="col-span-3 min-w-0">
                    <p className="truncate font-medium text-gray-900">{svc.name}</p>
                    <p className="text-xs text-gray-400">ID: {svc._id}</p>
                  </div>

                  {/* Description */}
                  <p className="col-span-4 truncate text-sm text-gray-600 pr-2">
                    {svc.description}
                  </p>

                  {/* Duration */}
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {svc.expectedDuration} min
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize ${priorityClass(svc.priority)}`}>
                      {svc.priority}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => populateForm(svc)}
                      disabled={loading}
                      className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-semibold text-white transition hover:bg-yellow-500 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(svc._id)}
                      disabled={loading}
                      className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {services.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No services yet. Add one above.
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </AdminPageLayout>
    </div>
  );
};

export default ServiceManagement;