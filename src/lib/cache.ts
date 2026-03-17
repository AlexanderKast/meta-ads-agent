import type { AdResponse } from "./types";

interface CacheEntry {
  response: AdResponse;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

function hashInputs(inputs: Record<string, unknown>): string {
  const str = JSON.stringify(inputs, Object.keys(inputs).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function getCached(inputs: Record<string, unknown>): AdResponse | null {
  const key = hashInputs(inputs);
  const entry = cache.get(key);

  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

export function setCache(inputs: Record<string, unknown>, response: AdResponse): void {
  const key = hashInputs(inputs);
  cache.set(key, { response, createdAt: Date.now() });
}

// Cleanup expired entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.createdAt > TTL) cache.delete(key);
    }
  }, 60 * 60 * 1000); // every hour
}
