// The only module that touches localStorage. Keys are versioned here: evolve data by
// adding or renaming keys, never by deleting stored ones.

export const NOTEPAD_KEY = "scratchpad:v1:notepad";
export const TABLE_KEY = "scratchpad:v1:table";
export const IMAGE_KEY = "scratchpad:v1:image";

type SaveResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" | "invalid" };

function getStorage(): Storage | undefined {
  if (typeof window === "undefined") return;
  try {
    return window.localStorage;
  } catch {
    return; // access can throw when storage is blocked
  }
}

function serialize(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return; // circular structures and BigInt cannot be stored
  }
}

function isQuotaError(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  const code = (error as { code?: unknown } | null)?.code;
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  );
}

export function load<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): { value: T; corrupt: boolean } {
  const store = getStorage();
  if (!store) return { value: fallback, corrupt: false };

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return { value: fallback, corrupt: false };
  }
  if (raw === null) return { value: fallback, corrupt: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: fallback, corrupt: true };
  }

  if (validate && !validate(parsed)) return { value: fallback, corrupt: true };
  return { value: parsed as T, corrupt: false };
}

export function save(key: string, value: unknown): SaveResult {
  const store = getStorage();
  if (!store) return { ok: false, reason: "unavailable" };

  const data = serialize(value);
  if (data === undefined) return { ok: false, reason: "invalid" };

  try {
    store.setItem(key, data);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: isQuotaError(error) ? "quota" : "unavailable" };
  }
}

export function encodedSize(value: unknown): number {
  const data = serialize(value);
  return data === undefined ? Infinity : new TextEncoder().encode(data).length;
}
