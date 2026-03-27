// src/context/QueueContext.tsx
//
// Real-time strategy (two-layer):
//   1. Backend polling  – every 3 s fetches /queue and /notifications/user/:id
//   2. localStorage broadcast – after every mutating action, a "qs_sync" key is
//      written with a timestamp. A "storage" event listener on OTHER tabs/pages
//      picks this up immediately and re-fetches, giving near-instant cross-page
//      reactivity without a WebSocket.
//
// ── CHANGED lines are annotated inline.

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
  id: number;
  userId: number | string;
  name: string;
  serviceId: number;
  serviceName: string;
  status: "waiting" | "almost ready" | "served";
  ticketNumber: number;
  joinedAt: string;
  estimatedWaitMinutes?: number;
};

export type BackendNotification = {
  id: number;
  userId: number | string;
  message: string;
  createdAt: string;
};

type QueueContextType = {
  queue: QueueItem[];
  notifications: BackendNotification[];
  refreshQueue: () => Promise<void>;
  joinQueue: (serviceId: number) => Promise<void>;
  cancelQueue: (entryId: number) => Promise<void>;
  serveNext: (serviceId: number) => Promise<void>;
  removeFromQueue: (entryId: number) => Promise<void>;
  resetQueue: () => Promise<void>;
  dismissNotification: (notifId: number) => Promise<void>;
  estimateWaitTime: (entryId: number) => number;
};

// ── Context ───────────────────────────────────────────────────────────────────

const QueueContext = createContext<QueueContextType | null>(null);

export const useQueue = () => {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error("QueueContext missing – wrap with QueueProvider");
  return ctx;
};

// ── localStorage broadcast helper ─────────────────────────────────────────────
// Writing a unique timestamp to "qs_sync" fires the "storage" event in ALL
// OTHER tabs/pages sharing the same origin, triggering an immediate refresh.
// ── CHANGED: added broadcast mechanism
const SYNC_KEY = "qs_sync";
function broadcastSync() {
  localStorage.setItem(SYNC_KEY, Date.now().toString());
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  // ── CHANGED: queue and notifications come exclusively from backend
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    // ── CHANGED: seed initial state from localStorage cache so UI is not blank
    //    on first render before the first fetch completes
    try {
      const cached = localStorage.getItem("qs_queue_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<BackendNotification[]>([]);

  // Track whether a fetch is in flight to avoid stacking parallel calls
  const fetchingRef = useRef(false);

  // ── CHANGED: fetch full queue from backend, cache in localStorage for instant
  //    re-render when another page reads the cache on mount
  const refreshQueue = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await queueApi.getAll();
      setQueue(data);
      // ── CHANGED: write to localStorage cache so other pages can bootstrap fast
      localStorage.setItem("qs_queue_cache", JSON.stringify(data));
    } catch {
      // backend may not be running; keep existing state
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ── CHANGED: fetch notifications from backend for the logged-in user
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getForUser(user.id);
      setNotifications(data);
    } catch {
      // silently fail
    }
  }, [user]);

  // ── CHANGED: combined refresh called after every mutation and by the poll
  const refresh = useCallback(async () => {
    await Promise.all([refreshQueue(), refreshNotifications()]);
  }, [refreshQueue, refreshNotifications]);

  // ── CHANGED: 3-second polling loop — keeps every open page in sync even
  //    without the localStorage event (e.g. same-tab navigation)
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── CHANGED: listen for localStorage "storage" events triggered by OTHER
  //    tabs/pages that call broadcastSync() after a mutation. This provides
  //    near-instant cross-page reactivity without waiting for the next poll tick.
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) {
        refresh();
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [refresh]);

  // ── CHANGED: joinQueue is async, calls backend, then broadcasts sync signal
  const joinQueue = async (serviceId: number) => {
    if (!user) throw new Error("Must be logged in to join a queue");
    await queueApi.join(user.id, user.name, serviceId);
    await refresh();
    broadcastSync(); // ── CHANGED: notify other pages immediately
  };

  // ── CHANGED: cancelQueue calls backend, then broadcasts
  const cancelQueue = async (entryId: number) => {
    await queueApi.leaveByEntry(entryId);
    await refresh();
    broadcastSync();
  };

  // ── CHANGED: serveNext calls backend, then broadcasts
  const serveNext = async (serviceId: number) => {
    await queueApi.serveNext(serviceId);
    await refresh();
    broadcastSync();
  };

  // ── CHANGED: removeFromQueue calls backend, then broadcasts
  const removeFromQueue = async (entryId: number) => {
    await queueApi.remove(entryId);
    await refresh();
    broadcastSync();
  };

  // ── CHANGED: resetQueue calls backend, then broadcasts
  const resetQueue = async () => {
    await queueApi.reset();
    await refresh();
    broadcastSync();
  };

  // ── CHANGED: dismiss calls backend DELETE, removes locally, then broadcasts
  const dismissNotification = async (notifId: number) => {
    await notificationsApi.dismiss(notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    broadcastSync();
  };

  // Derive wait time from the stored estimatedWaitMinutes on each queue entry
  const estimateWaitTime = (entryId: number): number => {
    const entry = queue.find((q) => q.id === entryId);
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
        estimateWaitTime,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};