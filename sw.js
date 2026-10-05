/* 詩詞朗讀 Service Worker
 * 1) 音檔 (.mp3)：快取優先 —— App 進場預載全部音檔後可離線播放
 * 2) 頁面／清單／圖示等其餘資源：網路優先 —— 改版即時生效，離線時回退快取
 */
const PAGE_CACHE = 'page-v2';
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

  // 音檔：快取優先（離線可播；未命中才走網路並寫入快取）
  if (url.pathname.endsWith('.mp3')) {
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
    return;
  }

  // 頁面／清單／圖示等：網路優先（改版即時生效），離線回退快取
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
});
