

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { queueApi, notificationsApi } from "../api/api";
import { useAuth } from "./AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QueueItem = {
  id:                   string;  // MongoDB ObjectId string
  userId:               string;
  name:                 string;
  serviceId:            string;
  serviceName:          string;
  status:               "waiting" | "almost ready" | "served" | "cancelled";
  ticketNumber:         number;
  joinedAt:             string;
  estimatedWaitMinutes: number;
};

export type BackendNotification = {
  id:          string;
  userId:      string;
  message:     string;
  type:        string;
  status:      "sent" | "viewed";
  serviceName: string;
  createdAt:   string;
};

type QueueContextType = {
  queue:               QueueItem[];
  notifications:       BackendNotification[];
  refreshQueue:        () => Promise<void>;
  joinQueue:           (serviceId: string) => Promise<void>;
  cancelQueue:         (entryId: string)  => Promise<void>;
  serveNext:           (serviceId: string) => Promise<void>;
  removeFromQueue:     (entryId: string)  => Promise<void>;
  resetQueue:          () => Promise<void>;
  dismissNotification: (notifId: string) => Promise<void>;
  markNotifViewed:     (notifId: string) => Promise<void>;
  estimateWaitTime:    (entryId: string) => number;
};

const QueueContext = createContext<QueueContextType | null>(null);

export const useQueue = () => {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("QueueContext missing – wrap with QueueProvider");
  return ctx;
};

// ── localStorage broadcast ────────────────────────────────────────────────────
const SYNC_KEY = "qs_sync";
function broadcastSync() {
  localStorage.setItem(SYNC_KEY, Date.now().toString());
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const cached = localStorage.getItem("qs_queue_cache");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const fetchingRef = useRef(false);

  // ── Fetch queue from backend ──────────────────────────────────────────────
  const refreshQueue = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await queueApi.getAll();
      setQueue(data);
      localStorage.setItem("qs_queue_cache", JSON.stringify(data));
    } catch {
      // keep existing state if backend unreachable
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── Fetch notifications from backend ──────────────────────────────────────
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getForUser(user.id);
      setNotifications(data);
    } catch { /* silently fail */ }
  }, [user]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshQueue(), refreshNotifications()]);
  }, [refreshQueue, refreshNotifications]);

  // ── Poll every 3 s ────────────────────────────────────────────────────────
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── React to localStorage sync events from other tabs/pages ──────────────
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  // ── Queue mutations ───────────────────────────────────────────────────────
  const joinQueue = async (serviceId: string) => {
    if (!user) throw new Error("Must be logged in");
    await queueApi.join(user.id, user.name, serviceId);
    await refresh();
    broadcastSync();
  };

  const cancelQueue = async (entryId: string) => {
    await queueApi.leaveByEntry(entryId);
    await refresh();
    broadcastSync();
  };

  const serveNext = async (serviceId: string) => {
    await queueApi.serveNext(serviceId);
    await refresh();
    broadcastSync();
  };

  const removeFromQueue = async (entryId: string) => {
    await queueApi.remove(entryId);
    await refresh();
    broadcastSync();
  };

  const resetQueue = async () => {
    await queueApi.reset();
    await refresh();
    broadcastSync();
  };

  // ── Notification mutations ────────────────────────────────────────────────
  const dismissNotification = async (notifId: string) => {
    await notificationsApi.dismiss(notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    broadcastSync();
  };

  const markNotifViewed = async (notifId: string) => {
    await notificationsApi.markViewed(notifId);
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, status: "viewed" as const } : n)
    );
  };

  const estimateWaitTime = (entryId: string): number => {
    const entry = queue.find(q => q.id === entryId);
    return entry?.estimatedWaitMinutes ?? 0;
  };

  return (
    <QueueContext.Provider
      value={{
        queue,
        notifications,
        refreshQueue,
        joinQueue,
        cancelQueue,
        serveNext,
        removeFromQueue,
        resetQueue,
        dismissNotification,
        markNotifViewed,
        estimateWaitTime,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};
