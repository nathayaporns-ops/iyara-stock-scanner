const CACHE='stock-count-scanner-v2';
const CORE=[
  './',
  './index.html',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const url of CORE){
      try{await cache.add(url);}catch(_){/* best effort */}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  event.respondWith((async()=>{
    const cached=await caches.match(req,{ignoreSearch:true});
    if(cached) return cached;

    try{
      const res=await fetch(req);
      try{
        const cache=await caches.open(CACHE);
        await cache.put(req,res.clone());
      }catch(_){ }
      return res;
    }catch(_){
      if(req.mode==='navigate'){
        const shell=await caches.match('./index.html',{ignoreSearch:true});
        if(shell) return shell;
      }
      throw _;
    }
  })());
});
