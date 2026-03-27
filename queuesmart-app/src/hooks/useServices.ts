// src/hooks/useServices.ts
// ── Fetches services from the backend and caches them in localStorage.
// ── Any page that calls this hook will also react to "storage" events
//    triggered by ServiceManagement when a new service is created, so
//    dropdowns and counts stay up-to-date across all open pages instantly.

import { useState, useEffect, useCallback } from "react";
import { servicesApi } from "../api/api";

export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  priority: "low" | "medium" | "high";
};

const CACHE_KEY = "qs_services_cache";
const SYNC_KEY  = "qs_sync";

export function useServices() {
  const [services, setServices] = useState<Service[]>(() => {
    // ── Bootstrap from localStorage cache for instant render
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const fetchServices = useCallback(async () => {
    try {
      const data = await servicesApi.getAll();
      setServices(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // keep existing state if backend unreachable
    }
  }, []);

  // Initial fetch + poll every 5 s (services change less often than queue)
  useEffect(() => {
    fetchServices();
    const id = setInterval(fetchServices, 5000);
    return () => clearInterval(id);
  }, [fetchServices]);

  // React to storage events from other pages (e.g. ServiceManagement saves)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) fetchServices();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [fetchServices]);

  return { services, fetchServices };
}