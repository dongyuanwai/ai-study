import { createReadCache } from "./read-cache.mjs";
const cache = createReadCache();
export const clearDataCache = () => cache.clear();
export async function fetchAllData<T>(resource: string, query = '', signal?: AbortSignal): Promise<T[]> {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const data = await cache.read(`${resource}?${query}`, async () => {
  const rows: T[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const response: Response = await fetch(`/api/data/${resource}/?limit=500&offset=${offset}&${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('数据加载失败');
    const result: { data: T[]; nextOffset: number | null } = await response.json();
    rows.push(...result.data);
    offset = result.nextOffset;
  }
  return rows;
  });
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  return data;
}
