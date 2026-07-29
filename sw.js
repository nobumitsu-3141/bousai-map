const CACHE = 'bousai-map-v4';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // 同一オリジンに他アプリのPWAが同居するため、削除は自分のprefixに限定する
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('bousai-map-') && k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' || e.request.url.replace(/[?#].*$/, '').endsWith('/index.html');
  if (isPage) {
    // ページ本体はネットワーク優先: リロードすれば常に最新が出る。取得成功時はオフライン用にキャッシュも更新
    e.respondWith(
      fetch(e.request).then(r => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      }).catch(() =>
        caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))
      )
    );
  } else {
    // アイコン等の静的アセットはキャッシュ優先
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
  }
});
