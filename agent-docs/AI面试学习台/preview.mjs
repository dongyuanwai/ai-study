// Development-only preview: serves just the generated page, never a directory.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pagePath = fileURLToPath(new URL('./index.html', import.meta.url));
const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow:'GET, HEAD'}); response.end(); return;
  }
  if (!['/', '/index.html'].includes(new URL(request.url, 'http://localhost').pathname)) {
    response.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); response.end('Not found'); return;
  }
  response.writeHead(200, {
    'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
  response.end(request.method === 'HEAD' ? '' : readFileSync(pagePath));
});
server.on('error', error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
server.listen(8765, '127.0.0.1', () => process.stdout.write('Local: http://127.0.0.1:8765\n'));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
