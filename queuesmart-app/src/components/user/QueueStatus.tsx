
import Navbar from "../common/Navbar";
import { useQueue, QueueItem } from "../../context/QueueContext";
import { useAuth } from "../../context/AuthContext";

const QueueStatus: React.FC = () => {
  const { queue, cancelQueue } = useQueue();
  const { user } = useAuth();

  // Only show current logged-in user's queue
  const userQueue = queue.filter(
    (item: QueueItem) => item.user.email === user?.email
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "text-yellow-600";
      case "almost ready":
        return "text-blue-600";
      case "served":
        return "text-green-600";
      default:
        return "";
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Live Queue Status</h2>

        {userQueue.length === 0 ? (
          <p className="text-gray-500">No active queues</p>
        ) : (
          userQueue.map((item: QueueItem) => (
            <div
              key={item.id}
              className="border p-4 mb-3 rounded flex justify-between items-center"
            >
              <div>
                <p><strong>Ticket:</strong> #{item.ticketNumber}</p>
                <p>Service: {item.service.name}</p>
                <p>
                  Status:{" "}
                  <span className={getStatusColor(item.status)}>
                    {item.status}
                  </span>
                </p>
              </div>

              {/* Allow cancel if not served */}
              {item.status !== "served" && (
                <button
                  onClick={() => cancelQueue(item.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueueStatus;
