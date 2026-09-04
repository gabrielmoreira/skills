export interface FetchOptions {
  timeoutMs: number;
}

// No local cap below the platform budget: the caller passes whatever it likes
// and nothing here refuses a value larger than the enclosing runtime allows.
export async function getJson<T>(url: string, options: FetchOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("upstream returned " + String(response.status));
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
