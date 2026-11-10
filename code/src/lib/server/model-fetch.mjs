import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';

const privateV4 = new net.BlockList();
for (const [ip, bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['192.88.99.0',24],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]]) privateV4.addSubnet(ip,bits);
const publicV6 = new net.BlockList(); publicV6.addSubnet('2000::',3,'ipv6');
const excludedV6 = new net.BlockList();
for (const [ip,bits] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20]]) excludedV6.addSubnet(ip,bits,'ipv6');
export function isPublicAddress(address) {
  const family = net.isIP(address);
  return family === 4 ? !privateV4.check(address) : family === 6 && publicV6.check(address,'ipv6') && !excludedV6.check(address,'ipv6');
}
export function validateModelURL(value) {
  const url = new URL(value);
  const hostname = url.hostname.replace(/^\[|\]$/g,'');
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (net.isIP(hostname) && !isPublicAddress(hostname))) throw new Error('模型接口必须是公网 HTTPS 地址。');
  return url;
}
// 在实际连接时解析并检查目标 IP，禁止重定向；DNS 变化不能绕过检查。
export function publicModelFetch(input, init = {}) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = validateModelURL(String(input)); } catch (error) { reject(error); return; }
    const request = https.request(url, {
      method: init.method || 'POST', headers: Object.fromEntries(new Headers(init.headers)), signal: init.signal,
      agent: false,
      lookup: (host, options, callback) => {
        dns.lookup(host, { all: true }, (error, addresses) => {
          if (error) return callback(error);
          if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) return callback(new Error('模型接口不能指向内网地址。'));
          if (options.all) callback(null, addresses);
          else callback(null, addresses[0].address, addresses[0].family);
        });
      },
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400) { response.resume(); reject(new Error('模型接口不支持重定向。')); return; }
      const chunks = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > 2 * 1024 * 1024) { response.destroy(new Error('模型响应过大。')); return; } chunks.push(chunk); });
      response.on('error', reject);
      response.on('end', () => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        resolve(new Response([204,205,304].includes(response.statusCode) ? null : Buffer.concat(chunks), { status: response.statusCode, headers }));
      });
    });
    request.on('error', reject);
    request.setTimeout(90000, () => request.destroy(new Error('模型调用超时。')));
    if (init.body) request.write(init.body);
    request.end();
  });
}
