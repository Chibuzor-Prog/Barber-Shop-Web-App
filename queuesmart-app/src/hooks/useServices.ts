

import { useState, useEffect, useCallback } from "react";
import { servicesApi } from "../api/api";

export type Service = {
  id:               string;
  name:             string;
  description:      string;
  expectedDuration: number;    // renamed from duration
  priorityLevel:    "low" | "medium" | "high";  // renamed from priority
};

const CACHE_KEY = "qs_services_cache";
const SYNC_KEY  = "qs_sync";

export function useServices() {
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const fetchServices = useCallback(async () => {
    try {
      const data = await servicesApi.getAll();
      setServices(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch { /* keep existing */ }
  }, []);

  // Initial fetch + 5-second poll
  useEffect(() => {
    fetchServices();
    const id = setInterval(fetchServices, 5000);
    return () => clearInterval(id);
  }, [fetchServices]);

  // React to sync events (e.g. ServiceManagement adds/deletes a service)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === SYNC_KEY) fetchServices();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [fetchServices]);

  return { services, fetchServices };
}
