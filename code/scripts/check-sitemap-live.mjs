import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const runFile = promisify(execFile);
assert.ok(process.env.CHECK_SITE_URL, '请显式设置 CHECK_SITE_URL 为要检查的新网站根地址');
const base = new URL(process.env.CHECK_SITE_URL);
async function get(url) {
  // curl honors HTTPS_PROXY / ALL_PROXY on Node versions where fetch does not.
  // Deliberately omit --location: redirects must fail the sitemap check.
  const directory = await mkdtemp(path.join(tmpdir(), 'sitemap-check-'));
  let response;
  try {
    const headersFile = path.join(directory, 'headers');
    const bodyFile = path.join(directory, 'body');
    let result;
    try {
      result = await runFile('curl', ['--silent', '--show-error', '--connect-timeout', '15', '--max-time', '30', '--retry', '2', '--retry-delay', '1', '--retry-max-time', '65', '--dump-header', headersFile, '--output', bodyFile, '--write-out', '%{http_code}', String(url)], {timeout:100000,maxBuffer:1024*1024});
    } catch (error) {
      throw new Error(`Network request failed for ${url} (curl ${error.code || 'timeout'}). No sitemap validation was completed for this URL. Check connectivity and HTTPS_PROXY / ALL_PROXY; ensure the local proxy is running. curl must be installed.`, {cause:undefined});
    }
    // A proxy may prepend a CONNECT response; only inspect the final headers.
    const blocks = (await readFile(headersFile,'utf8')).trim().split(/\r?\n\r?\n/);
    const headers = new Headers();
    for (const line of blocks.at(-1).split(/\r?\n/).slice(1)) {
      const colon = line.indexOf(':');
      if (colon > 0) headers.append(line.slice(0,colon),line.slice(colon+1).trim());
    }
    const body = await readFile(bodyFile,'utf8');
    response = {status:Number(result.stdout.trim()),headers,text:async()=>body};
  } finally {
    await rm(directory,{recursive:true,force:true});
  }
  assert.equal(response.status,200,`${url}: expected 200, got ${response.status}`);
  assert.ok(!/noindex|nofollow/i.test(response.headers.get('x-robots-tag') || ''),`${url}: blocked by X-Robots-Tag`);
  return response;
}
async function main() {
const locs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1].replace(/&amp;/g,'&'));
const index = await (await get(new URL('/sitemap.xml',base))).text();
assert.ok(index.includes('<sitemapindex'), 'Expected deployed sitemap index');
const children = locs(index);
assert.equal(children.length,2,'Expected two language sitemaps');
let count=0;
for(const child of children){
  assert.equal(new URL(child).origin,base.origin);
  const response = await get(child);
  assert.match(response.headers.get('content-type') || '',/xml/i);
  const xml=await response.text();
  for(const location of locs(xml)){
    assert.equal(new URL(location).origin,base.origin);
    const response=await get(location);
    const html=await response.text();
    const links=[...html.matchAll(/<link\b[^>]*>/g)].map(m=>m[0]);
    const attr=(tag,name)=>new RegExp(`${name}="([^"]*)"`,'i').exec(tag)?.[1];
    const canonical=links.find(tag=>attr(tag,'rel')==='canonical');
    assert.equal(attr(canonical || '', 'href'),location,`${location}: canonical mismatch`);
    const robots=[...html.matchAll(/<meta\b[^>]*>/g)].map(m=>m[0]).filter(tag=>/^(robots|googlebot)$/i.test(attr(tag,'name') || ''));
    assert.ok(robots.length,`${location}: missing robots`);
    for(const tag of robots){const value=attr(tag,'content') || '';assert.ok(!/noindex|nofollow/i.test(value),`${location}: ${value}`);assert.match(value,/(?:^|,\s*)index(?:,|$)/);assert.match(value,/(?:^|,\s*)follow(?:,|$)/);}
    count++;
    if (count % 10 === 0) console.log(`Checked ${count} page URLs…`);
  }
}
assert.ok(count>0,'Empty production sitemap');
console.log(`Live sitemap passed: ${count} URLs, HTTP 200 without redirects, self-canonical, index/follow.`);

}
main().catch(error => { console.error(`Sitemap check failed: ${error.message}`); process.exitCode = 1; });
