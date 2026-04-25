// queuesmart-app/src/api/config.ts
//
// Central configuration for the backend URL.
// Change BASE_URL here to switch between the MongoDB and PostgreSQL backends.
//
// MongoDB backend runs on port 5001.
// PostgreSQL backend runs on port 5002.
// The API surface (routes, request/response shapes) is identical for both.
//
// You can also set VITE_API_URL in a .env file:
//   VITE_API_URL=http://127.0.0.1:5001
//   (Vite exposes env vars prefixed with VITE_ via import.meta.env)

const ENV_URL = (import.meta as any).env?.VITE_API_URL;

// ── Change this to switch backends ───────────────────────────────────────────

const BASE_URL =
  ENV_URL ||
  'http://localhost:5001';  // ← 5001 = MongoDB   |   5002 = PostgreSQL

// ─────────────────────────────────────────────────────────────────────────────

export default BASE_URL;
