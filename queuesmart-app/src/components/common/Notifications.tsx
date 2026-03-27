import { useQueue } from "../../context/QueueContext";
 
const Notifications: React.FC = () => {
  // ── CHANGED: `notifications` is BackendNotification[], `dismissNotification` calls backend
  const { notifications, dismissNotification } = useQueue();
 
  return (
    <div className="fixed top-4 right-4 w-72 z-50">
      {notifications.map((note) => (
        <div
          key={note.id}
          className="bg-blue-500 text-white p-3 mb-2 rounded shadow flex justify-between items-center"
        >
          <span>{note.message}</span>
 
          {/* ── CHANGED: pass note.id (backend id) instead of array index */}
          <button
            onClick={() => dismissNotification(note.id)}
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