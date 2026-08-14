/* ==========================================================================
   CRM — NSCA / Starduct   ·   v23 HỢP NHẤT DỰ ÁN ↔ DỰ ÁN NỀN
   Một tab "Dự án" duy nhất — 3 chế độ xem, một nguồn CSDL:
   · 🎯 Đang theo dõi : pipeline crm_deals (có phê duyệt, stage, giá trị)
   · 🗺 Nền — chưa theo dõi : danh mục crm_du_an_nen ĐÃ TRỪ những dự án
       đã nối vào pipeline (khử trùng lặp hiển thị) + nút 📌 Mở theo dõi
   · 🧹 Trùng lặp : cặp bản ghi nền nghi trùng (tình báo ↔ có sẵn) → Gộp
   Yêu cầu DB: chạy supabase-migration-v23.sql. Thiếu → tự ẩn chế độ mới.
   ========================================================================== */

let DA_MODE='theo', NEN_PAGE=0, NEN_ROWS=[], TRUNG_ROWS=null;
const NEN_SIZE=50;
const hybCoNen=()=>ALL_DEALS.length?Object.prototype.hasOwnProperty.call(ALL_DEALS[0],'ma_du_an_nen'):true;

/* ============ ẨN TAB DỰ ÁN NỀN CŨ + GẮN THANH CHẾ ĐỘ ============ */
window.addEventListener('load',()=>{
  const bDN=document.querySelector('nav button[data-t="dn"]');
  if(bDN)bDN.style.display='none'; // gộp vào tab Dự án
  const card=document.querySelector('#tab-da .card');
  if(card&&!document.getElementById('daModes')){
    const m=document.createElement('div');m.id='daModes';
    m.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center';
    card.insertBefore(m,card.firstChild);
    vebDaModes();
  }
});
function vebDaModes(){
  const m=document.getElementById('daModes');if(!m)return;
  const B=(k,l)=>`<button class="btn${DA_MODE===k?' pri':''}" onclick="datDaMode('${k}')" style="padding:6px 12px">${l}</button>`;
  m.innerHTML=B('theo','🎯 '+t('Đang theo dõi')+` <span class="tag">${DEALS.length}</span>`)+
    B('nen','🗺 '+t('Nền — chưa theo dõi'))+
    (laQuanLy()?B('trung','🧹 '+t('Trùng lặp nền')+(TRUNG_ROWS?` <span class="tag">${TRUNG_ROWS.length}</span>`:'')):'')+
    `<span class="muted" style="font-size:11px;margin-left:auto">${t('Một nguồn CSDL: nền = tra cứu & tình báo · theo dõi = pipeline có phê duyệt')}</span>`;
}
function datDaMode(k){
  DA_MODE=k;NEN_PAGE=0;vebDaModes();
  // chỉ hiện bộ lọc phù hợp từng chế độ
  const chiTheo=[fdaUT,fdaSt,fdaPD,fdaNguoi,fdaDY?.parentElement,fdaTVTK?.parentElement,fdaQG];
  for(const el of chiTheo)if(el)el.style.display=(k==='theo')?'':'none';
  if(k==='theo')renderDA();
  else if(k==='nen')loadNenHopNhat();
  else loadTrungLap();
}

/* ============ GHI ĐÈ renderDA (điều phối theo chế độ) ============ */
const _renderDA_v22=renderDA;
renderDA=function(){
  vebDaModes();
  if(DA_MODE==='nen'){loadNenHopNhat();return}
  if(DA_MODE==='trung'){veTrungLap();return}
  _renderDA_v22();
  // gắn nhãn mã nền vào dòng dự án đã nối (nguồn CSDL rõ ràng)
  if(hybCoNen()){
    const daNoi=DEALS.filter(d=>d.ma_du_an_nen).length;
    const info=daList.querySelector('.muted');
    if(info)info.innerHTML+=` · 🗺 ${daNoi}/${DEALS.length} ${t('đã nối CSDL nền')}`;
  }
};

/* ============ CHẾ ĐỘ NỀN — CHƯA THEO DÕI ============ */
async function loadNenHopNhat(){
  if(!sb)return;
  const daNoi=new Set(DEALS.map(d=>d.ma_du_an_nen).filter(Boolean));
  let q=sb.from('crm_du_an_nen').select('*',{count:'exact'});
  const s=fdaQ.value.trim();
  if(s)q=q.or(`ma_du_an.ilike.%${s}%,ten_du_an.ilike.%${s}%,cdt.ilike.%${s}%`);
  if(fdaTP.value.trim())q=q.ilike('tinh','%'+fdaTP.value.trim()+'%');
  if(fdaHM.value.trim())q=q.ilike('nsca_cung_cap','%'+fdaHM.value.trim()+'%');
  if(fdaNPP.value){const npp=ORGS.find(o=>o.id===fdaNPP.value);
    if(npp)q=q.ilike('npp_chi_dinh','%'+npp.ten.slice(0,15)+'%')}
  const r=await q.order('ma_du_an').range(NEN_PAGE*NEN_SIZE,NEN_PAGE*NEN_SIZE+NEN_SIZE-1);
  if(r.error){daList.innerHTML='<div class="notice warn">'+esc(r.error.message)+'</div>';return}
  NEN_ROWS=(r.data||[]).filter(x=>!daNoi.has(x.ma_du_an)); // KHỬ TRÙNG: đã theo dõi thì không lặp lại ở nền
  window.DN_ROWS=NEN_ROWS; // để openDN dùng lại hộp thoại chi tiết cũ
  const tong=r.count||0,maxP=Math.max(1,Math.ceil(tong/NEN_SIZE));
  daList.innerHTML=`<div class="muted" style="margin-bottom:6px">${t('Danh mục nền')}: ${tong} ${t('bản ghi khớp lọc')} · ${t('trang')} ${NEN_PAGE+1}/${maxP} · ${t('ẩn')} ${(r.data||[]).length-NEN_ROWS.length} ${t('dòng đã theo dõi (khử trùng lặp)')}</div>`+
  '<table><tr><th>'+t('Mã')+'</th><th>'+t('Tên dự án')+'</th><th>CĐT</th><th>'+t('Tỉnh')+'</th><th>'+t('NPP chỉ định')+'</th><th>'+t('Hiện trạng')+'</th><th>Spec-in</th><th></th></tr>'+
  NEN_ROWS.map((d,i)=>`<tr class="row">
    <td onclick="openDN(${i})"><b>${esc(d.ma_du_an)}</b></td>
    <td onclick="openDN(${i})">${esc(d.ten_du_an||'—')}</td>
    <td onclick="openDN(${i})" class="muted">${esc((d.cdt||'').slice(0,36))}</td>
    <td onclick="openDN(${i})">${esc(d.tinh||'—')}</td>
    <td onclick="openDN(${i})">${d.npp_chi_dinh?'<span class="tag">'+esc(d.npp_chi_dinh)+'</span>':'—'}</td>
    <td onclick="openDN(${i})">${esc(d.hien_trang||'—')}</td>
    <td onclick="openDN(${i})">${esc(d.spec_in||'—')}</td>
    <td><button class="btn" style="padding:3px 8px;white-space:nowrap" title="${t('Chuyển vào pipeline theo dõi — giữ liên kết CSDL nền')}"
      onclick="moTheoDoi(${i})">📌 ${t('Theo dõi')}</button></td></tr>`).join('')+'</table>'+
  `<div style="display:flex;gap:8px;align-items:center;margin-top:10px">
    <button class="btn" onclick="if(NEN_PAGE>0){NEN_PAGE--;loadNenHopNhat()}">← ${t('Trước')}</button>
    <span class="muted" style="font-size:12px">${t('trang')} ${NEN_PAGE+1}/${maxP}</span>
    <button class="btn" onclick="if(NEN_PAGE<${maxP-1}){NEN_PAGE++;loadNenHopNhat()}">${t('Sau')} →</button>
  </div>`;
  applyLang();
}

/* Mở theo dõi: tạo deal từ bản ghi nền, nối ma_du_an_nen — không nhập tay lại */
async function moTheoDoi(i){
  const d=NEN_ROWS[i];if(!d)return;
  if(!confirm(t('Mở theo dõi pipeline cho:')+' '+d.ten_du_an+' ('+d.ma_du_an+')?'))return;
  const rec={ten:d.ten_du_an,quoc_gia:'VN',cdt_text:d.cdt||null,dia_diem:[d.tinh,d.quan_huyen].filter(Boolean).join(' · ')||null,
    stage:'tiep_can',npp_chi_dinh:d.npp_chi_dinh||null,hien_trang_da:d.hien_trang||null,
    spec_in_status:d.spec_in||null,kh_da_bg:d.kh_da_bao_gia||null,nt_cua_npp:d.nha_thau_cua_npp||null,
    ma_du_an_nen:d.ma_du_an,nguoi_cap_nhat:ME?.ho_ten||null,owner:ME?.ho_ten||null,
    lan_cap_nhat_cuoi:new Date().toISOString()};
  let r=await sb.from('crm_deals').insert(rec).select().single();
  if(r.error){ // DB chưa migration đủ cột → thử bản tối thiểu
    const {ten,quoc_gia,cdt_text,dia_diem,stage,owner,lan_cap_nhat_cuoi}=rec;
    r=await sb.from('crm_deals').insert({ten,quoc_gia,cdt_text,dia_diem,stage,owner,lan_cap_nhat_cuoi}).select().single();
    if(r.error){alert(r.error.message);return}
  }
  await loadAll();
  DA_MODE='theo';vebDaModes();renderDA();
  if(r.data?.id)openWorkspace(r.data.id);
}

/* ============ CHẾ ĐỘ TRÙNG LẶP (Quản lý/CEO) ============ */
async function loadTrungLap(){
  daList.innerHTML='<div class="muted">'+t('Đang quét cặp bản ghi nền nghi trùng (tên giống ≥85%, cùng tỉnh)…')+'</div>';
  const r=await sb.rpc('crm_tim_nen_trung_lap');
  if(r.error){daList.innerHTML='<div class="notice warn">'+esc(r.error.message)+' — '+t('cần chạy supabase-migration-v23.sql')+'</div>';return}
  TRUNG_ROWS=r.data||[];vebDaModes();veTrungLap();
}
function veTrungLap(){
  const rows=TRUNG_ROWS||[];
  daList.innerHTML=`<div class="notice">${t('Cặp nghi trùng giữa dữ liệu tình báo thu thập và dữ liệu có sẵn. GỘP sẽ: chuyển nhật ký + BCI + liên kết pipeline về bản GIỮ, điền bù trường trống, xóa bản BỎ. Không hoàn tác được — soi kỹ trước khi gộp.')}</div>`+
  (rows.length?'<table><tr><th>'+t('Giống')+'</th><th>'+t('GIỮ (mã cũ hơn)')+'</th><th>'+t('BỎ (gộp vào)')+'</th><th>'+t('Tỉnh')+'</th><th>NPP</th><th></th></tr>'+
  rows.map((p,i)=>`<tr>
    <td><span class="pill ${p.do_giong>=0.95?'p4':'p3'}">${Math.round(p.do_giong*100)}%</span></td>
    <td><b>${esc(p.ma_giu)}</b><div class="muted" style="max-width:260px">${esc(p.ten_giu)}</div></td>
    <td><b>${esc(p.ma_bo)}</b><div class="muted" style="max-width:260px">${esc(p.ten_bo)}</div></td>
    <td>${esc(p.tinh||'—')}</td>
    <td class="muted" style="font-size:11px">${esc(p.npp_giu||'—')}${p.npp_bo&&p.npp_bo!==p.npp_giu?' / '+esc(p.npp_bo):''}</td>
    <td><button class="btn" style="padding:3px 8px;color:var(--bad)" onclick="gopNen(${i})">🧹 ${t('Gộp')}</button></td></tr>`).join('')+'</table>'
  :'<div class="muted">'+t('Không phát hiện cặp trùng lặp nào ≥85% — danh mục nền đang sạch.')+'</div>');
  applyLang();
}
async function gopNen(i){
  const p=TRUNG_ROWS[i];if(!p)return;
  if(!laQuanLy()){alert(t('Chỉ Quản lý/CEO được gộp bản ghi.'));return}
  if(!confirm(t('GỘP')+' '+p.ma_bo+' → '+p.ma_giu+'?\n\n'+t('GIỮ')+': '+p.ten_giu+'\n'+t('BỎ')+': '+p.ten_bo+'\n\n'+t('Thao tác không hoàn tác được.')))return;
  const r=await sb.rpc('crm_gop_nen',{p_ma_giu:p.ma_giu,p_ma_bo:p.ma_bo});
  if(r.error){alert(r.error.message);return}
  alert(r.data||'OK');
  await loadTrungLap();
}

/* ============ WORKSPACE: tab Tổng quan hiện luôn CSDL NỀN đã nối ============ */
const _renderWs_v22=renderWs;
renderWs=function(d,quots,tps,hts,files){
  _renderWs_v22(d,quots,tps,hts,files);
  if(WS.tab!=='tq'||!d.ma_du_an_nen)return;
  const box=document.createElement('div');
  box.id='wsNenBox';box.className='notice';box.style.marginTop='12px';
  box.innerHTML=`<b>🗺 ${t('CSDL nền')}: ${esc(d.ma_du_an_nen)}</b> <span class="muted">${t('— đang tải BCI & nhật ký…')}</span>`;
  wsBody.appendChild(box);
  Promise.all([
    sb.from('crm_du_an_nen').select('*').eq('ma_du_an',d.ma_du_an_nen).limit(1),
    sb.from('crm_bci').select('giai_doan,chi_phi_du_toan,tvtk,tong_thau').eq('ma_du_an',d.ma_du_an_nen).limit(1),
    sb.from('crm_du_an_cap_nhat').select('*').eq('ma_du_an',d.ma_du_an_nen).order('thang').limit(12)
  ]).then(([nen,bci,log])=>{
    const n=(nen.data||[])[0],b=(bci.data||[])[0],lg=log.data||[];
    const F=(l,v)=>v?`<div style="margin:2px 0"><span class="muted" style="display:inline-block;min-width:140px">${l}</span> ${esc(v)}</div>`:'';
    box.innerHTML=`<b>🗺 ${t('CSDL nền')}: ${esc(d.ma_du_an_nen)}</b>`+
      (n?F(t('NPP chỉ định (nền)'),n.npp_chi_dinh)+F(t('Hiện trạng (nền)'),n.hien_trang)+F('Spec-in ('+t('nền')+')',n.spec_in)+F(t('KH đã báo giá'),n.kh_da_bao_gia):'')+
      (b?F('TVTK (BCI)',b.tvtk)+F(t('Tổng thầu (BCI)'),b.tong_thau)+F(t('Dự toán (BCI)'),b.chi_phi_du_toan):'')+
      (lg.length?`<div style="margin-top:6px"><span class="muted">${t('Nhật ký cập nhật')}:</span> `+
        lg.map(x=>`<span class="tag" title="${esc(x.hien_trang||'')}">T${esc(x.thang||'?')}·${esc((x.npp||'').slice(0,12))}</span>`).join(' ')+'</div>':'');
  });
};
