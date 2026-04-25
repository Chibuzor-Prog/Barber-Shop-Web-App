
// MongoDB backend runs on port 5001.

const ENV_URL = (import.meta as any).env?.VITE_API_URL;

// ── Change this to switch backends ───────────────────────────────────────────

const BASE_URL =
  ENV_URL ||
  'http://localhost:5001';  // ← 5001 = MongoDB   

// ─────────────────────────────────────────────────────────────────────────────

export default BASE_URL;
