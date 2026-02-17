type ApiGetOptions = {
  origin?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const attempts: string[] = [];

  if (options.origin) {
    attempts.push(`${options.origin}${path}`);
  }

  const configuredBase = (process.env.PUBLIC_API_BASE_URL ?? "").trim();
  if (configuredBase) {
    attempts.push(`${configuredBase}${path}`);
  }

  let lastError: unknown = null;
  for (const url of attempts) {
    try {
      return await fetchJson<T>(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("API error");
}
