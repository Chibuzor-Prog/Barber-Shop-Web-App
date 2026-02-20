import { useState } from "react";
import AdminPageLayout from "./ui/AdminPageLayout";

type Priority = "low" | "medium" | "high";

const ServiceManagement: React.FC = () => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.length > 100)
      return setError("Name required (max 100 chars)");

    if (!desc.trim())
      return setError("Description required");

    if (!duration || duration <= 0)
      return setError("Duration must be greater than 0");

    setError("");
    alert("Service saved (mock)");
  };

  return (
    <AdminPageLayout title="Service Management">

      <div className="max-w-lg">

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Service Name
            </label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          {/* duration */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={duration}
              onChange={e =>
                setDuration(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>

          {/* priority */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Priority
            </label>
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

          {/* submit */}
          <button
            className="w-full rounded-xl bg-green-600 py-2 font-medium text-white transition hover:bg-green-700"
          >
            Save Service
          </button>
        </form>
      </div>
    </AdminPageLayout>
  );
};

export default ServiceManagement;
