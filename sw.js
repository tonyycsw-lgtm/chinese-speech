/* 詩詞朗讀 Service Worker：讓 Android 瀏覽器可「安裝應用」，頁面導航網路優先（改版即時生效），音檔不緩存 */
const CACHE = 'speech-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // 音檔與其他資源走網路，不干預（避免快取膨脹與舊檔問題）
  if (event.request.mode !== 'navigate') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match('./index_P4.html'))
      )
  );
});
