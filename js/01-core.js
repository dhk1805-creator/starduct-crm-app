/* ==========================================================================
   CRM — NSCA / Starduct   ·   Lõi: state · hằng số · kết nối · nạp dữ liệu
   Nguồn: index.html v20 dòng 1057–1174 (cắt nguyên khối, KHÔNG sửa logic)
   State toàn cục, khối/ngôn ngữ, hằng số dùng chung, kết nối Supabase, tự đăng nhập, loadAll, điều hướng tab
   ========================================================================== */

/* ================= TRẠNG THÁI ================= */
let sb=null, ALL_ORGS=[], ALL_DEALS=[], ALL_EVENTS=[], ALL_TPS=[], ALL_HTS=[], ALL_REVS=[];
let ORGS=[], DEALS=[], EVENTS=[], TPS=[], HTS=[], REVS=[];
let MOD=localStorage.getItem('crm_mod')||'nd';
function setMod(m){MOD=m;localStorage.setItem('crm_mod',m);
  const lg=m==='qt'?'en':'vi';
  if(LANG!==lg){LANG=lg;localStorage.setItem('crm_lang',lg);}
  applyMod();try{renderAll()}catch(e){applyLang()}}
function applyMod(){
  const nd=MOD==='nd';
  ORGS=ALL_ORGS.filter(o=>(o.quoc_gia==='VN')===nd);
  DEALS=ALL_DEALS.filter(d=>(d.quoc_gia==='VN')===nd);
  EVENTS=ALL_EVENTS.filter(e=>{const q=(e.quoc_gia||'').toLowerCase();
    const isVN=q.includes('việt')||q==='vn'||q.includes('vietnam');return isVN===nd});
  const ids=new Set(ORGS.map(o=>o.id));
  TPS=ALL_TPS.filter(t=>!t.org_id||ids.has(t.org_id));
  const dids=new Set(DEALS.map(d=>d.id));
  HTS=ALL_HTS.filter(h=>(!h.deal_id&&!h.org_id)||dids.has(h.deal_id)||ids.has(h.org_id));
  REVS=ALL_REVS.filter(r=>(r.quoc_gia==='VN')===nd);
  fillFilters();renderAll();
}
const PHU=['0 · Chưa tiếp cận','1 · Đã tiếp cận','2 · Quan hệ làm việc','3 · Spec-in','4 · Đã bán','5 · Khách thường xuyên'];
// NPP/Agent/Broker (Nhóm 1 - trung gian) đo bằng phễu NPP, KHÔNG dùng thang phủ khách hàng
const PHEU_NPP={chua_tiep_can:['Chưa tiếp cận','p0'],dang_ket_noi:['Đang kết nối','p1'],
  dang_gui_mau:['Đang gửi mẫu','p1'],dang_dam_phan:['Đang đàm phán','p3'],
  da_ky_mou:['Đã ký MOU','p3'],da_ky_hd:['Đã ký HĐ — đang phân phối','p4']};
// v35.5: bo loc/gan NPP o trang Quoc te CHI hien NPP da ky HD (pheu 'da_ky_hd').
// Tab Doi tac van giu ca pheu tiem nang. Noi dia giu nguyen (NPP trong nuoc deu da ky).
const NPP_KYHD=o=>o.phan_loai==='npp'&&(MOD==='nd'||o.pheu_npp==='da_ky_hd');
const nhanPhu=o=>(o.phan_loai==='npp'&&o.pheu_npp&&PHEU_NPP[o.pheu_npp])
  ?`<span class="pill ${PHEU_NPP[o.pheu_npp][1]}">🤝 ${PHEU_NPP[o.pheu_npp][0]}</span>`
  :`<span class="pill p${o.trang_thai_phu}">${PHU[o.trang_thai_phu]}</span>`;
const PL={cdt:'CĐT',tvtk:'TVTK',thau:'Tổng thầu-MEP',npp:'NPP',khac:'Khác'};
const QH={npp_hien_huu:'🌾 NPP hiện hữu (chăm sóc)',npp_moi:'🌱 NPP mới (phát triển)',
  kh_truc_tiep:'🛒 Khách hàng trực tiếp',kh_tiem_nang:'🎯 Khách hàng tiềm năng',
  doi_tac_chien_luoc:'🤝 Đối tác chiến lược (OEM/ODM)',doi_tac_phan_phoi:'🔗 Đối tác phân phối (Broker/Agent)'};
const ISO={'hong kong':'HK','macau':'MO','taiwan':'TW','south korea':'KR','hàn quốc':'KR',
'japan':'JP','nhật bản':'JP','uae':'AE','uae (dubai)':'AE','vietnam':'VN','việt nam':'VN',
'malaysia':'MY','indonesia':'ID','singapore':'SG','philippines':'PH','campuchia':'KH',
'cambodia':'KH','thailand':'TH','thái lan':'TH','úc':'AU','australia':'AU'};
const isoName={HK:'Hong Kong',MO:'Macau',TW:'Taiwan',KR:'Hàn Quốc',JP:'Nhật Bản',AE:'UAE',
VN:'Việt Nam',MY:'Malaysia',ID:'Indonesia',SG:'Singapore',PH:'Philippines',KH:'Campuchia',TH:'Thái Lan',AU:'Úc'};
const esc=s=>(s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toISO=q=>{if(!q)return'??';const k=q.toString().trim().toLowerCase();return ISO[k]||q.toString().trim().slice(0,2).toUpperCase()};

/* ================= KẾT NỐI ================= */
async function connect(){
  const url=cfgUrl.value.trim(),key=cfgKey.value.trim();
  if(!url||!key){cfgMsg.textContent='Thiếu URL hoặc key';return}
  sb=supabase.createClient(url,key);
  if(cfgEmail.value){
    const{error}=await sb.auth.signInWithPassword({email:cfgEmail.value,password:cfgPass.value});
    if(error){cfgMsg.textContent='Đăng nhập lỗi: '+error.message;return}
  }
  localStorage.setItem('crm_cfg',JSON.stringify({url,key,email:cfgEmail.value}));
  dot.classList.add('on');connTxt.textContent='Đã kết nối';dlgCfg.close();
  await loadAll();
}
/* === NSCA: nhúng sẵn kết nối + tự đăng nhập lại === */
const CFG_MAC_DINH={
  url:'https://zjedibydzkojgarrfbvg.supabase.co',
  key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZWRpYnlkemtvamdhcnJmYnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Mzg3NDgsImV4cCI6MjA5MjMxNDc0OH0.fmdl7OziijI64NmgPafoxWCQZ3LGniZ8jXb7DJFPeb4'
};
(async function(){
  let cfg={};
  try{ cfg=JSON.parse(localStorage.getItem('crm_cfg')||'{}') }catch(e){ cfg={} }
  const url=cfg.url||CFG_MAC_DINH.url, key=cfg.key||CFG_MAC_DINH.key;
  cfgUrl.value=url; cfgKey.value=key; cfgEmail.value=cfg.email||'';
  try{
    const cli=supabase.createClient(url,key);
    const {data:{session}}=await cli.auth.getSession();
    if(!session){dlgCfg.showModal();applyLang();return}
    sb=cli;
    dot.classList.add('on'); connTxt.textContent='Đã kết nối';
    if(dlgCfg.open) dlgCfg.close();
    await loadAll();
  }catch(e){ console.warn('Tự kết nối lại thất bại:',e) }
})();

/* === NSCA: nhận diện người dùng theo email đã đăng nhập === */
async function autoMe(){
  if(ME) return;
  const {data:{user}}=await sb.auth.getUser();
  const em=((user&&user.email)||'').trim().toLowerCase();
  if(!em) return;
  const r=(window.NHANSU||[]).find(n=>(n.email||'').trim().toLowerCase()===em);
  if(!r) return;
  ME={ho_ten:r.ho_ten,chuc_danh:r.chuc_danh,vai_tro:r.vai_tro,khu_vuc:r.khu_vuc,
      bo_phan:r.bo_phan,mo_ta_cong_viec:r.mo_ta_cong_viec,kpi_chinh:r.kpi_chinh,
      chi_tieu_ky:r.chi_tieu_ky,quyen_admin:r.quyen_admin,phai_doi_mk:false,user_name:r.user_name};
  localStorage.setItem('crm_me',JSON.stringify(ME));
  if(r.ngon_ngu&&r.ngon_ngu!==LANG){LANG=r.ngon_ngu;localStorage.setItem('crm_lang',LANG)}
  if(r.khu_vuc==='quoc_te'&&MOD!=='qt'){MOD='qt';localStorage.setItem('crm_mod','qt');modSel.value='qt';applyMod()}
}
async function loadAll(){
  const [o,d,e,t,h,q,rv]=await Promise.all([
    sb.from('crm_org').select('*').order('ten').limit(3000),
    sb.from('crm_deals').select('*').order('uu_tien').limit(2000),
    sb.from('crm_events').select('*'),
    sb.from('crm_touchpoints').select('*').order('ngay',{ascending:false}).limit(300),
    sb.from('crm_support_requests').select('*').order('created_at',{ascending:false}).limit(300),
    sb.from('v_crm_approvals_cho').select('*').order('so_ngay_cho',{ascending:false}),
    sb.from('v_crm_doanh_thu').select('*').limit(5000)
  ]);
  ALL_ORGS=o.data||[];ALL_DEALS=d.data||[];ALL_EVENTS=e.data||[];ALL_TPS=t.data||[];ALL_HTS=h.data||[];
  window.APRQ=q.data||[];ALL_REVS=rv.data||[];
  const ns=await sb.from('crm_user_roles').select('*').order('ho_ten');
  window.NHANSU=ns.data||[];
  nsList.innerHTML=NHANSU.map(n=>`<option value="${esc(n.ho_ten)}">${esc(n.chuc_danh)}</option>`).join('');
  modSel.value=MOD;applyMod();
  await autoMe();showMe();if(!ME)dlgLogin.showModal();
  loadPlans();
}

/* ================= NAV ================= */
nav.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('act',x===b));
  document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!=='tab-'+b.dataset.t);
  if(b.dataset.t==='dn'&&!DN_INIT)initDN()};


/* --- 2 hàm tiện ích chuyển lên đây từ cuối file gốc (dòng 2849–2852) để nạp trước mọi module dùng chúng --- */
const nv=x=>{const s=(x||'').toString().trim();return !s||s.toLowerCase().includes('chưa xác minh')?null:s.slice(0,200)};
const fmtB=n=>{const en=LANG==='en',loc=en?'en-US':'vi-VN';
  return n>=1e9?(n/1e9).toLocaleString(loc,{maximumFractionDigits:2})+(en?' bn':' tỷ'):
  n>=1e6?(n/1e6).toLocaleString(loc,{maximumFractionDigits:0})+(en?' m':' tr'):n.toLocaleString(loc)};
