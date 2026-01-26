import { createClient } from "@insforge/sdk";

import { getInsforgeAnonKey, getInsforgeBaseUrl } from "./config";
import { createTimeoutFetch } from "./http-timeout";

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

export function createInsforgeClient({
  baseUrl,
  accessToken,
}: {
  baseUrl?: string;
  accessToken?: string;
} = {}) {
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getInsforgeAnonKey();
  return createClient({
    baseUrl,
    anonKey: anonKey || undefined,
    edgeFunctionToken: accessToken || undefined,
    storage: createMemoryStorage(),
    fetch: createTimeoutFetch(globalThis.fetch),
  });
}

export function createInsforgeAuthClient() {
  const baseUrl = getInsforgeBaseUrl();
  if (!baseUrl) throw new Error("Missing baseUrl");
  const anonKey = getInsforgeAnonKey();
  return createClient({
    baseUrl,
    anonKey: anonKey || undefined,
  });
}
