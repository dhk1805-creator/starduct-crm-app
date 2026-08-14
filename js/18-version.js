/* ==========================================================================
   CRM — NSCA / Starduct   ·   v35: Số hiệu phiên bản + nút cập nhật
   Đặt ở chân màn hình (mobile: đáy #mbApp · desktop: cuối trang).
   Nhấn nút = nạp lại Service Worker + xoá sạch cache + tải lại trang.
   KHÔNG đụng localStorage → giữ nguyên phiên đăng nhập Supabase.

   ⚠️ MỖI LẦN PHÁT HÀNH sửa số ở 4 nơi cho khớp:
      1) SD_VER  (file này)
      2) CACHE   (sw.js)
      3) version (version.json ở gốc repo)
      4) APP_VER (js/00-i18n.js — dòng log console)
   ========================================================================== */
(function(){
'use strict';

const SD_VER   = '35.5';
const SD_BUILD = '14/08/2026';

/* ---------- ngôn ngữ: bám theo biến LANG của 00-i18n.js ---------- */
function lg(){
  try{ if(typeof LANG==='string') return LANG; }catch(e){}
  return localStorage.getItem('crm_lang')||'vi';
}
const D={
  vi:{ver:'Phiên bản',btn:'Cập nhật bản mới nhất',checking:'Đang kiểm tra bản mới…',
      working:'Đang cập nhật…',latest:'Đang dùng bản mới nhất',
      hasNew:'Có bản mới',offline:'Chưa kiểm tra được — sẽ thử lại',
      hint:'Không cần gỡ ứng dụng, nhấn nút là cập nhật'},
  en:{ver:'Version',btn:'Update to latest version',checking:'Checking for updates…',
      working:'Updating…',latest:'You are on the latest version',
      hasNew:'New version available',offline:'Check failed — will retry',
      hint:'No need to reinstall, just tap to update'}
};
const V=k=>(D[lg()]||D.vi)[k];

/* ---------- CSS ---------- */
const CSS=`
#sdVer{border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;
  padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));
  font-size:12.5px;line-height:1.4}
#sdVer .sd-v-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#sdVer .sd-v-id{flex:1;min-width:150px;color:#475569}
#sdVer .sd-v-id b{color:#0f172a;font-weight:800}
#sdVer .sd-v-msg{display:block;margin-top:6px;font-size:12px;color:#94a3b8}
#sdVer .sd-v-msg.new{color:#b45309;font-weight:700}
#sdVer button{flex:0 0 auto;border:0;border-radius:10px;padding:11px 16px;min-height:42px;
  background:var(--b400,#0f4c81);color:#fff;font-size:14px;font-weight:700;
  font-family:inherit;cursor:pointer}
#sdVer button:disabled{background:#cbd5e1;color:#64748b;cursor:default}
#sdVer button:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}
#sdVer.new button{background:#d97706}
.mb-mode #sdVer{background:#fff}
.mb-mode #sdVer button{width:100%;flex:1 1 100%;padding:14px;font-size:15px;border-radius:12px}
`;

/* ---------- dựng ---------- */
function build(){
  if(document.getElementById('sdVer'))return;
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);

  const f=document.createElement('footer');f.id='sdVer';
  f.innerHTML='<div class="sd-v-top">'
    +'<div class="sd-v-id"></div>'
    +'<button type="button" id="sdVerBtn"></button></div>'
    +'<span class="sd-v-msg" id="sdVerMsg"></span>';

  // mobile: đáy #mbApp (flex column, #mbBody flex:1 → tự đẩy xuống chân màn hình)
  const app=document.getElementById('mbApp');
  if(app) app.appendChild(f); else document.body.appendChild(f);

  document.getElementById('sdVerBtn').addEventListener('click',capNhat);
  paint(); check();
}

function paint(){
  const f=document.getElementById('sdVer');if(!f)return;
  f.querySelector('.sd-v-id').innerHTML='<b>Starduct CRM</b> · '+V('ver')+' v'+SD_VER+' · '+SD_BUILD;
  const b=document.getElementById('sdVerBtn');
  if(b&&!b.disabled)b.textContent='⟳ '+V('btn');
}
function msg(s,isNew){
  const m=document.getElementById('sdVerMsg'),f=document.getElementById('sdVer');
  if(m){m.textContent=s;m.classList.toggle('new',!!isNew)}
  if(f)f.classList.toggle('new',!!isNew);
}

/* ---------- so sánh phiên bản ---------- */
function moiHon(a,b){
  const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);
  for(let i=0;i<Math.max(x.length,y.length);i++){
    const m=x[i]||0,n=y[i]||0;if(m!==n)return m>n;
  }
  return false;
}

/* ---------- kiểm tra bản mới ---------- */
async function check(){
  msg(V('checking'));
  const url=location.pathname.replace(/[^/]*$/,'')+'version.json?t='+Date.now();
  try{
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok)throw 0;
    const d=await r.json();
    if(d.version&&moiHon(d.version,SD_VER))
      msg(V('hasNew')+': v'+d.version+(d.note?' — '+d.note:''),true);
    else msg(V('latest')+' · '+V('hint'));
  }catch(e){ msg(V('offline')); }
}

/* ---------- cập nhật ---------- */
async function capNhat(){
  const b=document.getElementById('sdVerBtn');
  if(b){b.disabled=true;b.textContent='⟳ '+V('working')}
  msg(V('working'));
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs){
        try{await r.update()}catch(e){}
        if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'});
      }
    }
    if(window.caches){
      const ks=await caches.keys();
      await Promise.all(ks.map(k=>caches.delete(k)));
    }
  }catch(e){ console.warn('[v] update',e); }
  const u=new URL(location.href);
  u.searchParams.set('v',Date.now());        // phá cache CDN GitHub Pages
  setTimeout(()=>location.replace(u.toString()),400);
}

/* ---------- gắn vào vòng đời app ---------- */
// chạy sau listener 'load' của 16-mobile.js nên #mbApp đã tồn tại
window.addEventListener('load',build);

// đổi VI/EN trên mobile → vẽ lại chữ trong footer
window.addEventListener('load',()=>{
  if(typeof mbRender==='function'){
    const _o=mbRender;
    mbRender=function(){ _o.apply(this,arguments); paint(); };
  }
});

document.addEventListener('visibilitychange',()=>{ if(!document.hidden)check(); });

window.SD_VERSION={version:SD_VER,build:SD_BUILD,update:capNhat,check:check};
console.log('CRM version bar v'+SD_VER);
})();

try{if(typeof APP_VER!=='undefined'){var _e=document.getElementById('verTag');if(_e)_e.textContent=APP_VER;}}catch(e){}
