const CACHE='reach-student-planner-v18';
const CORE=['./','./index.html','./release-patch.js','./wellbeing-release.js','./manifest.webmanifest','./assets/favicon.svg'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  ]));
});

async function navigationResponse(request){
  try{
    const fresh=await fetch(request);
    const cache=await caches.open(CACHE);
    cache.put('./index.html',fresh.clone());
    return fresh;
  }catch{
    return (await caches.match('./index.html')) || Response.error();
  }
}

async function assetResponse(request){
  const cached=await caches.match(request);
  const network=fetch(request).then(async response=>{
    if(response && (response.ok || response.type==='opaque')){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone());
    }
    return response;
  }).catch(()=>null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(navigationResponse(event.request));
    return;
  }
  event.respondWith(assetResponse(event.request));
});
