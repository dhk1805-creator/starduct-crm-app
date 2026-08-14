/* ==========================================================================
   Service Worker — CRM Starduct (PWA v35)
   Chiến lược: network-first cho mọi thứ (dữ liệu CRM luôn phải mới),
   fallback cache khi mất mạng để vỏ ứng dụng vẫn mở được ngoài hiện trường.
   KHÔNG cache request Supabase (dữ liệu động).
   ========================================================================== */
const CACHE = 'starduct-crm-v36.0';
const SHELL = [
  './index.html',
  './css/app.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/00-i18n.js', './js/01-core.js', './js/02-du-an-nen.js', './js/03-auth.js',
  './js/04-ke-hoach.js', './js/05-nhan-su.js', './js/06-doanh-thu-kpi.js',
  './js/07-ho-tro-duyet.js', './js/08-tong-quan.js', './js/09-doi-tac.js',
  './js/10-du-an-tiep-xuc.js', './js/11-import.js', './js/12-hybrid.js', './js/13-du-an-hop-nhat.js', './js/14-npp-taikhoan.js', './js/15-auth-hop-nhat.js', './js/16-mobile.js', './js/17-nganh-hang-kh.js', './js/19-thi-truong.js', './js/18-version.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Không đụng vào Supabase / CDN ngoài — để trình duyệt tự xử lý
  if (url.hostname.includes('supabase')) return;
  if (e.request.method !== 'GET') return;
  // v35: version.json không bao giờ cache — đây là nguồn báo "có bản mới"
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && (url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});

/* v35 — nút "Cập nhật bản mới nhất" gọi vào đây để SW mới lên ngay */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
