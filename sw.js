/* 詩詞朗讀 Service Worker
 * 1) 頁面導航：網路優先（改版即時生效），離線時回退到緩存頁面
 * 2) 音檔／其他資源：快取優先（首次請求後即緩存），App 進場預載全部音檔 → 可離線使用
 */
const PAGE_CACHE = 'page-v1';
const ASSET_CACHE = 'asset-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== PAGE_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // 頁面導航：網路優先，離線回退緩存頁面
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((hit) => hit || caches.match('./index_P4.html'))
        )
    );
    return;
  }

  // 音檔與其他同源資源：快取優先（命中即用，離線可播；未命中才走網路並寫入快取）
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(ASSET_CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
