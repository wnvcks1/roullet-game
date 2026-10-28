const V='roulette-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const same=new URL(r.url).origin===location.origin;
  if(same){
    // 같은 출처 파일은 네트워크 우선: 새 버전이 즉시 반영되고, 오프라인일 때만 캐시 사용
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r);
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res;}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit;}
    return (await net)||Response.error();
  }));
});
