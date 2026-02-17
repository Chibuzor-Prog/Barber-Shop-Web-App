import { useState } from "react";
import Navbar from "../common/Navbar";

type Priority = "low" | "medium" | "high";

const ServiceManagement: React.FC = () => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [duration, setDuration] = useState<number>();
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || name.length > 100) return setError("Name required (max 100 chars)");
    if (!desc) return setError("Description required");
    if (!duration) return setError("Duration required");

    setError("");
    alert("Service saved (mock)");
  };

  return (
    <div>
      <Navbar isAdmin />
      <div className="p-6 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Service Management</h2>

        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleSave}>
          <input
            type="text"
            placeholder="Service Name"
            maxLength={100}
            className="w-full border p-2 mb-2"
            onChange={e => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full border p-2 mb-2"
            onChange={e => setDesc(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            className="w-full border p-2 mb-2"
            onChange={e => setDuration(Number(e.target.value))}
            required
          />
          <select
            className="w-full border p-2 mb-4"
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button className="bg-green-500 text-white px-4 py-2 rounded">
            Save Service
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceManagement;