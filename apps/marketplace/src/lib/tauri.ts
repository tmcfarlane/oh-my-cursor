// Tauri integration. In a plain browser these detect false and the app uses the web bridge
// (vite proxy → localhost:8787). In the Tauri desktop build, the same bridge runs as a bundled
// node-free sidecar and the native folder picker becomes available.

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Base origin for engine API calls. Web: "" (vite proxies /api). Tauri: the sidecar bridge. */
export const API_BASE = isTauri() ? "http://127.0.0.1:8787" : "";

/** Native folder picker (Tauri only). Returns null in the browser so callers fall back to text. */
export async function pickFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  const picked = await invoke<string | null>("pick_folder");
  return picked ?? null;
}
