import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadCache } from '../src/lib/read-cache.mjs';
test('公开数据缓存合并并发、隔离返回对象、到期重读，失败可重试',async()=>{
  let time=0,calls=0;const cache=createReadCache({ttl:30,now:()=>time});
  const load=async()=>{calls++;return {items:[1]};};
  const [a,b]=await Promise.all([cache.read('data',load),cache.read('data',load)]);assert.equal(calls,1);a.items.push(2);assert.deepEqual(b.items,[1]);
  await cache.read('data',load);assert.equal(calls,1);time=31;await cache.read('data',load);assert.equal(calls,2);
  await assert.rejects(cache.read('error',async()=>{throw new Error('failed')}));assert.equal(await cache.read('error',async()=>1),1);
});
test('写入失效后，之前的慢请求不能重新填充旧缓存',async()=>{
  const cache=createReadCache();let finish;const old=cache.read('data',()=>new Promise(resolve=>{finish=resolve}));await Promise.resolve();cache.clear();
  assert.equal(await cache.read('data',async()=>'new'),'new');finish('old');await old;
  assert.equal(await cache.read('data',async()=>'unexpected'),'new');
});
