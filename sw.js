/* sw.js — change-pay-hr (GitHub Pages) */

const VERSION = "v2.0.0-2026-01-07"; // 你之後每次改版，改這行版本字串即可
const CACHE_NAME = `change-pay-hr-${VERSION}`;

// GitHub Pages 子路徑：/change-pay-hr/
// 下面都用相對路徑（./）最穩
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 安裝：預先快取核心檔案
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// 啟用：清掉舊 cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("change-pay-hr-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch：同源資源採 cache-first；導航頁面用 network-first（避免更新卡住）
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只處理同源（你自己的 GitHub Pages）
  if (url.origin !== self.location.origin) return;

  // 導航請求（打開/刷新頁面）→ 優先抓新版本，失敗才用快取
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (err) {
          const cached = await caches.match("./index.html");
          return cached || caches.match("./");
        }
      })()
    );
    return;
  }

  // 其他靜態檔案：cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        // 只快取 GET 且 200 的回應
        if (req.method === "GET" && fresh && fresh.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        // 沒網路且沒快取就放掉（交給瀏覽器處理）
        return cached;
      }
    })()
  );
});
