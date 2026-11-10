// 只用于公开题库读取，禁止放入模型配置、密钥或生成请求。
export function createReadCache({ ttl = 30000, limit = 100, now = Date.now } = {}) {
  const entries = new Map();
  let epoch = 0;
  return {
    clear() { epoch++; entries.clear(); },
    async read(key, loader) {
      const hit = entries.get(key);
      if (hit && (hit.pending || hit.expires > now())) return structuredClone(await hit.value);
      if (hit) entries.delete(key);
      if (entries.size >= limit) entries.delete(entries.keys().next().value);
      const started = epoch;
      const entry = { pending: true, expires: 0, value: null };
      entry.value = Promise.resolve().then(loader);
      entries.set(key, entry);
      try {
        const result = await entry.value;
        if (epoch === started && entries.get(key) === entry) { entry.pending = false; entry.expires = now() + ttl; }
        return structuredClone(result);
      } catch (error) { if (entries.get(key) === entry) entries.delete(key); throw error; }
    },
  };
}
