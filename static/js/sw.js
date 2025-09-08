// service worker

const CACHE_NAME = 'offline-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll([
                '/',
                '/static/css/app.css',
                '/static/js/app.js',
                '/static/js/offline.js',
                '/static/images/offline.png'
            ])
        })
    )
})

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    if(url.pathname.startsWith('/api/')){
        event.respondWith(
            fetch(request)
                .then(response =>{
                    if (response.ok){
                        const responseClone = response.clone()
                        caches.open(API_CACHE).then(cache => {
                            cache.put(request, responseClone);
                        })
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        )
    }else{
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request);
            })
        )
    }
    
})

self.addEventListener('syncc', event => {
    if(event.tag === 'background-sync'){
        event.waitUntil(syncData)
    }
})


async function syncData(){
    // pending operations from IndexeDB
    const db = await openDB();
    const pendingOps = await getAllPendingOperations(db)

    if (pendingOps > 0){
        try {
            const response = await fetch('api/tasks/sync', {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    data:pendingOps,
                    last_sync: localStorage.getItem('last_sync')
                })
            })

            if (response.ok){
                const data = await response.json();
                await processSyncResponse(db, data)
                localStorage.setItem('last_sync', data.sync_timestamp);
            }
        } catch(error){
            console.error('Sync failed', error);
        }
    }
}