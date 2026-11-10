// 验证真实 Next.js 服务的响应，不依赖静态导出的 out 目录。
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
const target = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-study-rendered-'));
const port = await new Promise(resolve => { const probe = net.createServer(); probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)); }); });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
let logs = ''; server.stdout.on('data', chunk => { logs += chunk; }); server.stderr.on('data', chunk => { logs += chunk; });
const base = `http://127.0.0.1:${port}`;
const captured = new Map();
async function save(urlPath, filename) {
  if (captured.has(urlPath)) return captured.get(urlPath);
  const job = (async () => {
    const response = await fetch(base + urlPath);
    if (!response.ok && response.status !== 404) throw new Error(`${urlPath}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = path.join(target, filename || (urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath));
    await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, bytes);
    return bytes.toString('utf8');
  })();
  captured.set(urlPath, job); return job;
}
const locations = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
try {
  for (let i = 0; ; i++) {
    try { await fetch(base + '/robots.txt'); break; } catch { if (i > 100 || server.exitCode !== null) throw new Error(logs || 'Next.js 启动失败'); await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  const index = await save('/sitemap.xml');
  const pages = [];
  for (const child of locations(index)) pages.push(...locations(await save(child.pathname)));
  let position = 0;
  const assets = new Set();
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (position < pages.length) {
      const page = pages[position++]; const html = await save(page.pathname);
      for (const match of html.matchAll(/<(?:img|link|meta)\b[^>]*>/g)) {
        const tag = match[0];
        let value;
        if (tag.startsWith('<img')) value = /\bsrc="([^"]+)"/.exec(tag)?.[1];
        else if (/rel="(?:icon|apple-touch-icon)"/.test(tag)) value = /\bhref="([^"]+)"/.exec(tag)?.[1];
        else if (/property="og:image"/.test(tag)) value = /\bcontent="([^"]+)"/.exec(tag)?.[1];
        if (value) { const url = new URL(value, page); if (url.origin === page.origin) assets.add(url.pathname); }
      }
    }
  }));
  await Promise.all([...assets].map(asset => save(asset)));
  await save('/robots.txt'); await save('/__verification_missing__/', '404.html');
  const selected = process.argv[2] ? [process.argv[2]] : ['seo', 'analytics'];
  for (const check of selected) {
    if (!['seo', 'analytics'].includes(check)) throw new Error('无效检查名称');
    const result = spawnSync(process.execPath, [`scripts/check-${check}.mjs`], { stdio: 'inherit', env: { ...process.env, CHECK_OUTPUT_DIR: target } });
    if (result.status !== 0) throw new Error(`${check} 检查未通过`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
  server.kill('SIGTERM');
  await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
  await fs.rm(target, { recursive: true, force: true });
}
