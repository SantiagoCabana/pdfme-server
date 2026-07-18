const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL ?? '';
const GET_CACHE_TTL_MS = 1_500;
const pendingGetRequests = new Map<string, Promise<unknown>>();
const resolvedGetRequests = new Map<string, { expiresAt: number; value: unknown }>();

function getRequestMethod(init?: RequestInit) {
  return (init?.method ?? 'GET').toUpperCase();
}

function shouldDedupeRequest(init?: RequestInit) {
  return getRequestMethod(init) === 'GET' && !init?.body;
}

function getRequestKey(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  return JSON.stringify({
    path,
    accept: headers.get('Accept') ?? '',
  });
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const dedupe = shouldDedupeRequest(init);
  const requestKey = dedupe ? getRequestKey(path, init) : '';

  if (!dedupe) {
    resolvedGetRequests.clear();
  }

  if (dedupe) {
    const cachedRequest = resolvedGetRequests.get(requestKey);
    if (cachedRequest && cachedRequest.expiresAt > Date.now()) return cachedRequest.value as T;

    const pendingRequest = pendingGetRequests.get(requestKey);
    if (pendingRequest) return pendingRequest as Promise<T>;
  }

  const request = fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(payload?.message ?? `API error ${response.status}`);
    }

    return response.json() as Promise<T>;
  });

  if (dedupe) {
    pendingGetRequests.set(requestKey, request);
    request
      .then((value) => {
        resolvedGetRequests.set(requestKey, {
          expiresAt: Date.now() + GET_CACHE_TTL_MS,
          value,
        });
      })
      .finally(() => pendingGetRequests.delete(requestKey));
  }

  return request;
}
