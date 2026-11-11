import { vi } from "vitest";

type Handler = (url: URL, init: RequestInit) => { status?: number; body?: unknown };

/** Route fetch calls to small handlers keyed by "METHOD /path". */
export function mockFetch(routes: Record<string, Handler>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init = {}) => {
    const url = new URL(String(input), "http://localhost");
    const key = `${init.method ?? "GET"} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) {
      throw new Error(`Unexpected request: ${key}`);
    }
    const { status = 200, body } = handler(url, init);
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}
