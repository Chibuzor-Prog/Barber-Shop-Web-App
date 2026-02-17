import { useQueue } from "../../context/QueueContext";

const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useQueue();

  return (
    <div className="fixed top-4 right-4 w-72 z-50">
      {notifications.map((note, i) => (
        <div
          key={i}
          className="bg-blue-500 text-white p-3 mb-2 rounded shadow flex justify-between items-center"
        >
          <span>{note}</span>

          <button
            onClick={() => removeNotification(i)}
            className="ml-3 text-white font-bold hover:text-gray-200"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;