import React, { createContext, useContext, useState, useEffect } from "react";
import { Service } from "../data/mockServices";
import { User } from "../data/mockUsers";

export type QueueItem = {
  id: number;
  user: User;
  service: Service;
  status: "waiting" | "almost ready" | "served";
  ticketNumber: number;
};

type QueueContextType = {
  queue: QueueItem[];
  ticketCounter: number;
  notifications: string[];
  joinQueue: (user: User, service: Service) => void;
  serveNext: (serviceId: number) => void;
  removeFromQueue: (id: number) => void;
  cancelQueue: (id: number) => void;
  resetTickets: () => void;
  addNotification: (message: string) => void;
  removeNotification: (index: number) => void;
};

const QueueContext = createContext<QueueContextType | null>(null);

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) throw new Error(
    "QueueContext missing, useQueue must be used within a QueueProvider"
  );
  return context;
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load queue from LocalStorage
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem("queue");
    return saved ? JSON.parse(saved) : [];
  });

  const [ticketCounter, setTicketCounter] = useState(() => {
    const savedCounter = localStorage.getItem("ticketCounter");
    return savedCounter ? Number(savedCounter) : 1;
  });

  const [notifications, setNotifications] = useState<string[]>([]);

  // Helper to update queue + persist
  const saveQueue = (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    localStorage.setItem("queue", JSON.stringify(newQueue));
  };

  // Helper to update ticketCounter + persist
  const saveTicketCounter = (newCounter: number) => {
    setTicketCounter(newCounter);
    localStorage.setItem("ticketCounter", newCounter.toString());
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const joinQueue = (user: User, service: Service) => {
    const newItem: QueueItem = {
      id: Date.now(),
      user,
      service,
      status: "waiting",
      ticketNumber: ticketCounter,
    };
    saveQueue([...queue, newItem]);
    saveTicketCounter(ticketCounter + 1);
    addNotification(`${user.name} joined ${service.name}`);
  };

  const cancelQueue = (id: number) => {
  setQueue((prevQueue: QueueItem[]) => {
    const updated: QueueItem[] = prevQueue.filter(
      (item) => item.id !== id
    );

    localStorage.setItem("queue", JSON.stringify(updated));
    return updated;
  });

  addNotification("Service cancelled");
};

  const serveNext = (serviceId: number) => {
    const index = queue.findIndex(
      q => q.service.id === serviceId && q.status === "waiting"
    );
    if (index === -1) return;

    const updatedQueue = [...queue];
    updatedQueue[index].status = "served";
    saveQueue(updatedQueue);
    addNotification(`Ticket #${updatedQueue[index].ticketNumber} served`);
  };

  const removeFromQueue = (id: number) => {
    const updatedQueue = queue.filter(q => q.id !== id);
    saveQueue(updatedQueue);
    addNotification("User removed from queue");
  };

  const resetTickets = () => {
    saveTicketCounter(1);
    addNotification("Daily ticket counter reset");
  };

  // Simulate queue progress every 15 seconds with functional update
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue((prevQueue: QueueItem[]) => {
        const updated: QueueItem[] = prevQueue.map(item => {
          if (item.status === "waiting") return { ...item, status: "almost ready" };
          if (item.status === "almost ready") return { ...item, status: "served" };
          return item;
        });
        localStorage.setItem("queue", JSON.stringify(updated));
        return updated;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []); // no dependencies needed with functional update

  return (
    <QueueContext.Provider
      value={{
        queue,
        ticketCounter,
        notifications,
        joinQueue,
        cancelQueue,
        serveNext,
        removeFromQueue,
        resetTickets,
        addNotification,
        removeNotification
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};
