import React, { useState } from "react";
import { services } from "../../data/mockServices";
import { users } from "../../data/mockUsers";
import Navbar from "../common/Navbar";
import { useQueue, QueueItem } from "../../context/QueueContext";

const JoinQueue: React.FC = () => {
  const { queue, joinQueue, cancelQueue } = useQueue();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [error, setError] = useState("");

  const mockUser = users[0]; // simulate logged-in user

  // Only show this user's queue items
  const userQueue = queue.filter(
    (item) => item.user.email === mockUser.email
  );

  const handleJoin = () => {
    if (!selectedService) {
      setError("Select a service");
      return;
    }

    const service = services.find((s) => s.id === selectedService);
    if (!service) return;

    joinQueue(mockUser, service);
    setSelectedService(null);
    setError("");
  };

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl mb-4 font-bold">Join Queue</h2>

        {/* Selector + Join Button */}
        <div className="flex items-center space-x-2 mb-2">
          <select
            className="border p-2 flex-1"
            value={selectedService || ""}
            onChange={(e) => {
              setSelectedService(Number(e.target.value));
              setError("");
            }}
          >
            <option value="">Select a Service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleJoin}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Join
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 mb-3">{error}</p>}

        {/* Display Joined Services */}
        {userQueue.length > 0 && (
          <div className="space-y-2">
            {userQueue.map((item: QueueItem) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-blue-100 p-2 rounded"
              >
                <span className="text-blue-700">
                  Joined queue for {item.service.name} (Ticket #{item.ticketNumber})
                </span>

                <button
                  onClick={() => cancelQueue(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinQueue;
