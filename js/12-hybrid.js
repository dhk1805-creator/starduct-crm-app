/* ==========================================================================
   CRM — NSCA / Starduct   ·   v22 HYBRID WEB-APP (PRD crm.starduct.online)
   Module MỚI — bổ sung, KHÔNG sửa file cũ (chỉ ghi đè hàm theo cơ chế nạp sau):
   1. PWA: đăng ký service worker + shortcut #hash
   2. Luồng phê duyệt dự án 5 trạng thái + minh chứng (Supabase Storage)
   3. Popup lý do Thua/Hủy (loss_reason) khi đóng dự án
   4. Cảnh báo dự án đứng yên > 21 ngày (đỏ trong bảng + card Tổng quan)
   5. Deal Workspace: Tổng quan · Tiếp xúc · Báo giá · Hỗ trợ · Minh chứng
   6. Chống dẫm chân: khóa độc quyền NPP sau phê duyệt (soft client + trigger DB)
   7. Phân quyền NPP Lead / NPP Staff (lọc phạm vi nhìn thấy phía client)
   8. Thanh tác nghiệp mobile hiện trường (3 nút)
   Yêu cầu DB: chạy supabase-migration-v22.sql trước. Thiếu cột → tự ẩn tính năng.
   ========================================================================== */

/* ================= 0. TIỆN ÍCH & FEATURE DETECT ================= */
const PD_TT={cho_tiep_nhan:['Chờ tiếp nhận','p1'],da_tiep_nhan:['Đã tiếp nhận','p2'],
  duoc_chi_dinh:['Được chỉ định','p3'],phe_duyet:['✓ Phê duyệt — khóa độc quyền','p4'],
  khong_phe_duyet:['✗ Không phê duyệt','p0']};
const LOSS_LYDO=['Giá không cạnh tranh','Thua về spec / kỹ thuật','Chậm tiến độ phản hồi',
  'CĐT đổi thiết kế / dừng dự án','Chọn đối thủ (quan hệ)','NPP không theo tiếp','Khác'];
function hybCo(col){return ALL_DEALS.length?Object.prototype.hasOwnProperty.call(ALL_DEALS[0],col):true}
const nhanPD=d=>{const s=d.trang_thai_phe_duyet;if(!s||!PD_TT[s])return'';
  return `<span class="pill ${PD_TT[s][1]}" title="${t('Trạng thái phê duyệt')}">${PD_TT[s][0].split(' — ')[0]}</span>`};
function laQuanLy(){return ME&&(ME.vai_tro==='ceo'||ME.vai_tro==='manager'||ME.quyen_admin==='admin'||ME.quyen_admin==='super_admin')}
function soNgayDung(d){
  let last=d.lan_cap_nhat_cuoi?new Date(d.lan_cap_nhat_cuoi):null;
  for(const tp of ALL_TPS)if(tp.deal_id===d.id){const x=new Date(tp.ngay);if(!last||x>last)last=x}
  if(!last)return null;
  return Math.floor((Date.now()-last.getTime())/864e5);
}
const laDungYen=d=>{if(d.stage==='dong'||d.stage==='po')return false;const n=soNgayDung(d);return n!=null&&n>21};

/* ================= 1. PWA ================= */
if('serviceWorker' in navigator&&location.protocol==='https:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW:',e)));
}
window.addEventListener('load',()=>{
  const h=location.hash;
  const go=t=>{const b=document.querySelector(`nav button[data-t="${t}"]`);if(b)b.click()};
  if(h==='#tiep-xuc-nhanh')go('tx');
  else if(h==='#ho-tro')go('ht');
  else if(h==='#viec-hom-nay')go('tq');
});

/* ================= 2+3+6. GHI ĐÈ openDeal / saveDeal ================= */
const _openDeal_v20=openDeal;
openDeal=function(id){
  _openDeal_v20(id);
  if(!hybCo('trang_thai_phe_duyet'))return; // chưa chạy migration → giữ nguyên UI cũ
  const d=id?DEALS.find(x=>x.id===id):{};if(id&&!d)return;
  const khoa=d.trang_thai_phe_duyet==='phe_duyet'&&!laQuanLy();
  const ex=document.createElement('div');
  ex.id='hybDealExtra';
  ex.innerHTML=`
  <div style="border-top:1px dashed var(--border);margin:12px 0 8px;padding-top:10px">
    <b style="font-size:13px">🛡 ${t('Phê duyệt & minh chứng')}</b>
    ${khoa?`<div class="notice warn" style="margin-top:6px">🔒 ${t('Dự án đã được')} <b>${esc(d.npp_chi_dinh||d.owner||'NPP')}</b> ${t('đăng ký và phê duyệt bảo vệ — thay đổi NPP cần Quản lý/CEO nhượng quyền')}.</div>`:''}
    <div class="frow"><label>${t('Trạng thái phê duyệt')}</label>
      <select id="dPD" ${laQuanLy()?'':'disabled title="Chỉ Quản lý/CEO thay đổi"'}>
        ${Object.entries(PD_TT).map(([k,v])=>`<option value="${k}"${(d.trang_thai_phe_duyet||'cho_tiep_nhan')===k?' selected':''}>${v[0]}</option>`).join('')}
      </select></div>
    <div class="frow" id="rowLyDoTC" style="display:${d.trang_thai_phe_duyet==='khong_phe_duyet'?'':'none'}">
      <label>${t('Lý do từ chối')} *</label><input id="dLyDoTC" value="${esc(d.ly_do_tu_choi||'')}"></div>
    <div class="frow"><label>${t('NPP được chỉ định')}</label><input id="dNPPCD" value="${esc(d.npp_chi_dinh||'')}" ${khoa?'disabled':''} placeholder="NTK, Galaxy, VNMEP, NPP quốc tế…"></div>
    <div class="frow"><label>${t('KH đã báo giá')}</label><input id="dKHBG" value="${esc(d.kh_da_bg||'')}"></div>
    <div class="frow"><label>${t('Nhà thầu của NPP')}</label><input id="dNTNPP" value="${esc(d.nt_cua_npp||'')}"></div>
    <div class="frow"><label>Spec-in status</label><input id="dSIS" value="${esc(d.spec_in_status||'')}" placeholder="Đang xử lý · Van-Cửa · ALL…"></div>
    <div class="frow"><label>${t('Hiện trạng DA')}</label><input id="dHTDA" value="${esc(d.hien_trang_da||'')}" placeholder="Thiết kế · Đấu thầu · Thi công MEP…"></div>
    <div class="frow"><label>${t('Người phụ trách')}</label><input id="dNguoiPT" value="${esc(d.nguoi_phu_trach||'')}" list="nsList"></div>
    <div class="frow"><label>${t('Minh chứng')}</label>
      <div style="flex:1">
        ${d.file_minh_chung_url?`<a href="${esc(d.file_minh_chung_url)}" target="_blank" style="font-size:12px">📎 ${t('Xem minh chứng hiện tại')}</a><br>`:`<span class="muted" style="font-size:12px">${t('Chưa có — tải ảnh hiện trạng / file Spec-in để được phê duyệt')}</span><br>`}
        <input type="file" id="dMC" accept="image/*,.pdf,.dwg,.xlsx,.docx" style="margin-top:4px">
        <div class="muted" id="dMCmsg" style="font-size:11px"></div>
      </div></div>
  </div>`;
  const saveRow=dealBody.querySelector('div[style*="margin-top:12px"]');
  dealBody.insertBefore(ex,saveRow);
  if(id){const wsB=document.createElement('button');wsB.className='btn';wsB.textContent='🗂 Workspace';
    wsB.onclick=()=>{dlgDeal.close();openWorkspace(id)};saveRow.appendChild(wsB)}
  const pd=document.getElementById('dPD');
  if(pd)pd.onchange=()=>{document.getElementById('rowLyDoTC').style.display=pd.value==='khong_phe_duyet'?'':'none'};
  applyLang();
};

const _saveDeal_v20=saveDeal;
saveDeal=async function(id){
  if(!hybCo('trang_thai_phe_duyet'))return _saveDeal_v20(id);
  const d=id?DEALS.find(x=>x.id===id):{};
  // --- Popup lý do Thua/Hủy khi chuyển sang Đóng ---
  if(dSt.value==='dong'&&(d.stage||'')!=='dong'&&!(d.loss_reason)){
    const lr=await hoiLossReason();if(!lr)return; window.__lossReason=lr;
  }
  // --- upload minh chứng nếu có chọn file ---
  let mcUrl=null;
  const f=document.getElementById('dMC')?.files?.[0];
  if(f){
    const msg=document.getElementById('dMCmsg');msg.textContent=t('Đang tải minh chứng…');
    const path=`deals/${id||'moi'}/${Date.now()}_${f.name.replace(/[^\w.\-]+/g,'_')}`;
    const up=await sb.storage.from('minh-chung').upload(path,f,{upsert:true});
    if(up.error){msg.textContent='❌ '+up.error.message;return}
    mcUrl=sb.storage.from('minh-chung').getPublicUrl(path).data.publicUrl;
    msg.textContent='✓ '+t('Đã tải lên');
  }
  // --- gom giá trị mở rộng, chèn vào bản ghi bằng cách bọc sb.from ---
  const extra={
    trang_thai_phe_duyet:document.getElementById('dPD')?.value||undefined,
    ly_do_tu_choi:nv(document.getElementById('dLyDoTC')?.value)||null,
    npp_chi_dinh:nv(document.getElementById('dNPPCD')?.value)||null,
    kh_da_bg:nv(document.getElementById('dKHBG')?.value)||null,
    nt_cua_npp:nv(document.getElementById('dNTNPP')?.value)||null,
    spec_in_status:nv(document.getElementById('dSIS')?.value)||null,
    hien_trang_da:nv(document.getElementById('dHTDA')?.value)||null,
    nguoi_phu_trach:nv(document.getElementById('dNguoiPT')?.value)||null,
    nguoi_cap_nhat:ME?.ho_ten||null,
    loss_reason:window.__lossReason||d.loss_reason||null};
  if(extra.trang_thai_phe_duyet==='khong_phe_duyet'&&!extra.ly_do_tu_choi){
    alert(t('Không phê duyệt bắt buộc ghi lý do — quy tắc L4'));return}
  if(mcUrl)extra.file_minh_chung_url=mcUrl;
  if(extra.trang_thai_phe_duyet==='phe_duyet'&&(d.trang_thai_phe_duyet!=='phe_duyet')){
    extra.ngay_phe_duyet=new Date().toISOString();extra.nguoi_phe_duyet=ME?.ho_ten||null;
    if(!d.file_minh_chung_url&&!mcUrl){
      alert(t('Chưa có minh chứng (ảnh hiện trạng / file Spec-in) — không thể phê duyệt khóa độc quyền.'));return}
  }
  // bọc tạm sb.from để trộn extra vào update/insert của hàm gốc
  const origFrom=sb.from.bind(sb);
  sb.from=(tb)=>{const o=origFrom(tb);
    if(tb==='crm_deals'){const oi=o.insert.bind(o),ou=o.update.bind(o);
      o.insert=r=>oi({...r,...clean(extra)});o.update=r=>ou({...r,...clean(extra)});}
    return o};
  const clean=x=>Object.fromEntries(Object.entries(x).filter(([,v])=>v!==undefined));
  try{await _saveDeal_v20(id)}
  finally{sb.from=origFrom;window.__lossReason=null}
};
function hoiLossReason(){
  return new Promise(res=>{
    lossBody.innerHTML=`<div class="notice warn">${t('Chuyển dự án sang Thua/Hủy — bắt buộc chọn nguyên nhân (Loss Reason) để phân tích cải thiện.')}</div>
    <select id="lossSel" style="width:100%;margin-top:8px">${LOSS_LYDO.map(l=>`<option>${l}</option>`).join('')}</select>
    <textarea id="lossGhiChu" placeholder="${t('Ghi chú thêm (tuỳ chọn)')}" style="width:100%;min-height:50px;margin-top:8px"></textarea>
    <div style="margin-top:10px;display:flex;gap:8px">
      <button class="btn pri" id="lossOK">${t('Xác nhận đóng dự án')}</button>
      <button class="btn" id="lossHuy">${t('Quay lại')}</button></div>`;
    dlgLoss.showModal();
    document.getElementById('lossOK').onclick=()=>{const v=lossSel.value+(lossGhiChu.value.trim()?' — '+lossGhiChu.value.trim():'');dlgLoss.close();res(v)};
    document.getElementById('lossHuy').onclick=()=>{dlgLoss.close();res(null)};
  });
}

/* ================= 4+7. GHI ĐÈ renderDA: đứng yên · chip phê duyệt · lọc mới · phạm vi NPP ================= */
function phamViNPP(rows){
  if(!ME||!ME.vai_tro)return rows;
  if(ME.vai_tro==='npp_staff')
    return rows.filter(d=>[d.owner,d.nguoi_phu_trach].includes(ME.ho_ten));
  if(ME.vai_tro==='npp_lead'&&ME.npp_org_id)
    return rows.filter(d=>d.npp_dang_ky_id===ME.npp_org_id||[d.owner,d.nguoi_phu_trach].includes(ME.ho_ten));
  return rows;
}
renderDA=function(){
  const q=fdaQ.value.toLowerCase(),tp=fdaTP.value.toLowerCase(),hm=fdaHM.value.toLowerCase();
  const npps=ORGS.filter(o=>o.phan_loai==='npp');
  if(fdaNPP.options.length-1!==npps.length){const cur=fdaNPP.value;
    fdaNPP.innerHTML='<option value="">— NPP —</option>'+npps.map(n=>`<option value="${n.id}">${esc(n.ten)}</option>`).join('');
    fdaNPP.value=cur}
  // nạp bộ lọc người phụ trách (nhân sự + owner distinct)
  const owners=[...new Set(DEALS.flatMap(d=>[d.owner,d.nguoi_phu_trach]).filter(Boolean))].sort();
  if(fdaNguoi.options.length-1!==owners.length){const cur=fdaNguoi.value;
    fdaNguoi.innerHTML='<option value="">— '+t('Người phụ trách')+' —</option>'+owners.map(o=>`<option>${esc(o)}</option>`).join('');
    fdaNguoi.value=cur}
  let rows=DEALS.filter(d=>
    (!q||d.ten.toLowerCase().includes(q)||(d.cdt_text||'').toLowerCase().includes(q)||
      (d.tvtk_text||'').toLowerCase().includes(q)||(d.thau_text||'').toLowerCase().includes(q))&&
    (!fdaQG.value||d.quoc_gia===fdaQG.value)&&
    (!tp||(d.dia_diem||'').toLowerCase().includes(tp))&&
    (!hm||(d.hang_muc||'').toLowerCase().includes(hm))&&
    (!fdaNPP.value||d.npp_dang_ky_id===fdaNPP.value)&&
    (!fdaUT.value||(d.uu_tien||'').startsWith(fdaUT.value))&&
    (!fdaSt.value||d.stage===fdaSt.value)&&
    (!fdaPD.value||(d.trang_thai_phe_duyet||'cho_tiep_nhan')===fdaPD.value)&&
    (!fdaNguoi.value||[d.owner,d.nguoi_phu_trach].includes(fdaNguoi.value))&&
    (!fdaDY.checked||laDungYen(d))&&
    (!fdaTVTK.checked||(!d.tvtk_id&&!d.tvtk_text)));
  rows=phamViNPP(rows);
  const npByid=Object.fromEntries(ORGS.filter(o=>o.phan_loai==='npp').map(n=>[n.id,n.ten]));
  const today=new Date().toISOString().slice(0,10);
  daList.innerHTML=`<div class="muted" style="margin-bottom:6px">${rows.length} ${t('dự án · tổng giá trị ước')} ${fmtB(rows.reduce((s,d)=>s+(+d.gia_tri_uoc||0),0))}</div>`+
  '<table><tr><th>'+t('Dự án')+'</th><th>TT</th><th>Stage</th><th>TVTK</th><th>NPP / Owner</th><th>'+t('Việc tiếp theo')+'</th><th class="num">'+t('Giá trị')+'</th></tr>'+
  rows.slice(0,300).map(d=>{
    const naLate=d.next_action&&d.next_action_han&&d.next_action_han<today;
    const dy=laDungYen(d),nDY=dy?soNgayDung(d):0;
    return `<tr class="row" onclick="openDeal('${d.id}')"${dy?' style="background:var(--bad-bg)"':''}>
    <td style="max-width:240px"><b>${esc(d.ten)}</b>${dy?` <span class="pill" style="background:var(--bad-bg);color:var(--bad)" title="${t('Không tương tác mới')}">⚠ ${nDY}${t(' ngày đứng yên')}</span>`:''}<div class="muted">${esc(d.cdt_text||'')}</div></td>
    <td>${isoName[d.quoc_gia]||d.quoc_gia}</td>
    <td><span class="pill ${d.stage==='po'?'p4':d.stage==='spec_in'?'p3':d.stage==='dong'?'p0':'p1'}">${STG[d.stage]||d.stage}</span>${nhanPD(d)?'<div style="margin-top:2px">'+nhanPD(d)+'</div>':''}</td>
    <td>${d.tvtk_text?esc(d.tvtk_text):'<span class="pill p3">'+t('thiếu')+'</span>'}</td>
    <td>${esc(npByid[d.npp_dang_ky_id]||d.npp_chi_dinh||d.owner||'')||'<span class="muted">—</span>'}${d.hien_trang_da?`<div><span class="tag">${esc(d.hien_trang_da)}</span></div>`:''}</td>
    <td style="max-width:180px">${d.next_action?`${esc(d.next_action)}${d.next_action_han?` <span class="pill ${naLate?'p3':'p1'}"${naLate?' style="background:var(--bad-bg);color:var(--bad)"':''}>${d.next_action_han}</span>`:''}`:'<span class="muted">—</span>'}</td>
    <td class="num">${d.gia_tri_uoc?fmtB(+d.gia_tri_uoc):''}</td></tr>`}).join('')+'</table>'+
  (rows.length>300?'<div class="muted" style="margin-top:6px">'+t('Hiển thị 300 đầu.')+'</div>':'');
};
// rebind các bộ lọc đã trỏ tới renderDA cũ + bộ lọc mới
window.addEventListener('load',()=>{
  for(const el of [fdaQ,fdaQG,fdaUT,fdaSt,fdaTVTK,fdaTP,fdaHM,fdaNPP,fdaPD,fdaNguoi,fdaDY])
    if(el)el.oninput=renderDA;
});

/* ================= 4b. CARD "DỰ ÁN ĐỨNG YÊN" TRÊN TỔNG QUAN ================= */
const _renderTQ_v20=typeof renderTQ==='function'?renderTQ:null;
if(_renderTQ_v20)renderTQ=function(){
  _renderTQ_v20();
  let card=document.getElementById('cardDungYen');
  if(!card){card=document.createElement('div');card.className='card';card.id='cardDungYen';
    document.getElementById('tab-tq').appendChild(card)}
  const dy=DEALS.filter(laDungYen).sort((a,b)=>soNgayDung(b)-soNgayDung(a));
  card.innerHTML=`<h2>🛑 ${t('Dự án đứng yên > 21 ngày')} (${dy.length})</h2>`+
    (dy.length?'<table><tr><th>'+t('Dự án')+'</th><th>Stage</th><th>NPP/Owner</th><th class="num">'+t('Số ngày')+'</th></tr>'+
    dy.slice(0,10).map(d=>`<tr class="row" onclick="openDeal('${d.id}')">
      <td><b>${esc(d.ten)}</b></td><td>${STG[d.stage]||d.stage}</td>
      <td>${esc(d.npp_chi_dinh||d.owner||'—')}</td>
      <td class="num" style="color:var(--bad);font-weight:700">${soNgayDung(d)}</td></tr>`).join('')+'</table>'+
      (dy.length>10?`<div class="muted" style="margin-top:6px">${t('Xem đủ trong tab Dự án — tích lọc "đứng yên".')}</div>`:'')
    :'<div class="muted">'+t('Không có dự án nào đứng yên — pipeline đang được chăm sóc tốt.')+'</div>');
};

/* ================= 5. DEAL WORKSPACE (Project-Centric) ================= */
let WS={id:null,tab:'tq'};
async function openWorkspace(id){
  const d=DEALS.find(x=>x.id===id);if(!d)return;
  WS={id,tab:'tq'};
  wsTitle.textContent='🗂 '+d.ten;
  wsBody.innerHTML='<div class="muted">'+t('Đang tải workspace…')+'</div>';
  dlgWs.showModal();
  // dữ liệu song song: báo giá (khớp deal_id hoặc tên ~), hỗ trợ, tiếp xúc, minh chứng
  const [q1,q2,mc]=await Promise.all([
    sb.from('crm_quotations').select('*').eq('deal_id',id).order('ngay_update',{ascending:false}),
    sb.from('crm_quotations').select('*').ilike('ten_da','%'+(d.ten||'').slice(0,25)+'%').limit(20),
    sb.storage.from('minh-chung').list('deals/'+id,{limit:50}).catch(()=>({data:[]}))
  ]);
  const seen=new Set();const quots=[...(q1.data||[]),...(q2.data||[])].filter(x=>!seen.has(x.stt)&&seen.add(x.stt));
  const tps=ALL_TPS.filter(tp=>tp.deal_id===id);
  const hts=ALL_HTS.filter(h=>h.deal_id===id);
  const files=(mc.data||[]).filter(f=>f.name&&!f.name.startsWith('.'));
  renderWs(d,quots,tps,hts,files);
}
function renderWs(d,quots,tps,hts,files){
  const today=new Date().toISOString().slice(0,10);
  const TAB=(k,l,n)=>`<button class="btn${WS.tab===k?' pri':''}" onclick="WS.tab='${k}';window.__wsRe()" style="padding:6px 10px">${l}${n?` <span class="tag">${n}</span>`:''}</button>`;
  window.__wsRe=()=>renderWs(d,quots,tps,hts,files);
  const F=(l,v)=>v?`<div style="margin:3px 0"><span class="muted" style="display:inline-block;min-width:160px">${l}</span> ${esc(v)}</div>`:'';
  let body='';
  if(WS.tab==='tq'){
    body=(d.trang_thai_phe_duyet?'<div style="margin-bottom:8px">'+nhanPD(d)+(d.trang_thai_phe_duyet==='khong_phe_duyet'&&d.ly_do_tu_choi?' <span class="muted">'+esc(d.ly_do_tu_choi)+'</span>':'')+'</div>':'')+
      F(t('Chủ đầu tư'),d.cdt_text)+F('TVTK ⭐',d.tvtk_text)+F(t('Tổng thầu/MEP'),d.thau_text)+
      F(t('NPP được chỉ định'),d.npp_chi_dinh)+F(t('Nhà thầu của NPP'),d.nt_cua_npp)+
      F(t('KH đã báo giá'),d.kh_da_bg)+F('Spec-in',d.spec_in_status||d.moc_spec_in)+
      F(t('Hiện trạng'),d.hien_trang_da)+F('Stage',STG[d.stage]||d.stage)+
      F(t('Người phụ trách'),d.nguoi_phu_trach||d.owner)+
      F(t('Giá trị ước'),d.gia_tri_uoc?fmtB(+d.gia_tri_uoc):null)+
      F(t('Việc tiếp theo'),d.next_action?d.next_action+(d.next_action_han?' — hạn '+d.next_action_han:''):null)+
      (d.loss_reason?F('Loss reason',d.loss_reason):'')+
      `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" onclick="dlgWs.close();openDeal('${d.id}')">✏️ ${t('Sửa dự án')}</button>
        <button class="btn" onclick="dlgWs.close();openThread('deal','${d.id}','${esc(d.ten)}')">💬 ${t('Thảo luận & phê duyệt')}</button>
      </div>`;
  }else if(WS.tab==='tx'){
    body=(tps.length?tps.map(x=>`<div style="padding:7px 0;border-bottom:1px solid var(--border)">
        <span class="tag">${x.ngay}</span> <b>${esc(x.nguoi_thuc_hien||'')}</b> · ${x.loai||''}
        ${x.la_cap_ra_quyet_dinh?'<span class="pill p3">'+t('cấp ra quyết định')+'</span>':''}
        <div style="font-size:13px;margin-top:2px">${esc(x.noi_dung||'')}</div>
        ${x.buoc_tiep_theo?`<div class="muted" style="font-size:12px">→ ${esc(x.buoc_tiep_theo)}${x.han_buoc_tiep_theo?' — '+x.han_buoc_tiep_theo:''}</div>`:''}</div>`).join('')
      :'<div class="muted">'+t('Chưa có tiếp xúc gắn với dự án này. Ghi tiếp xúc mới ở tab Tiếp xúc và chọn dự án.')+'</div>')+
      `<div style="margin-top:10px"><button class="btn pri" onclick="dlgWs.close();document.querySelector('nav button[data-t=tx]').click();if(window.txDeal)txDeal.value='${esc(d.ten)}'">➕ ${t('Ghi tiếp xúc cho dự án này')}</button></div>`;
  }else if(WS.tab==='bg'){
    const tong=quots.reduce((s,x)=>s+(+x.gia_tri_bao_gia||0),0);
    body=(quots.length?`<div class="muted" style="margin-bottom:6px">${quots.length} ${t('báo giá · tổng')} ${fmtB(tong)}</div>`+
      '<table><tr><th>'+t('Ngày')+'</th><th>'+t('Khách')+'</th><th>TT</th><th class="num">'+t('Giá trị')+'</th><th class="num">VAV/CAV</th><th class="num">'+t('Van EI')+'</th><th class="num">'+t('Cửa gió')+'</th><th></th></tr>'+
      quots.map(x=>`<tr><td>${x.ngay_update||''}</td><td style="max-width:180px">${esc(x.ten_khach||x.ten_da||'')}</td>
        <td>${esc(x.trang_thai||'')}</td><td class="num"><b>${x.gia_tri_bao_gia?fmtB(+x.gia_tri_bao_gia):''}</b></td>
        <td class="num">${x.vav_cav?fmtB(+x.vav_cav):''}</td><td class="num">${x.van_gio_ei?fmtB(+x.van_gio_ei):''}</td>
        <td class="num">${x.cua_gio?fmtB(+x.cua_gio):''}</td>
        <td>${x.link_bg?`<a href="${esc(x.link_bg)}" target="_blank">🔗</a>`:''}</td></tr>`).join('')+'</table>'
      :'<div class="muted">'+t('Chưa có báo giá nối với dự án này (nạp LIST BG ở tab Dự án nền, hệ thống tự khớp tên ≥75%).')+'</div>');
  }else if(WS.tab==='ht'){
    body=(hts.length?'<table><tr><th>'+t('Ngày')+'</th><th>'+t('Bộ phận')+'</th><th>'+t('Nội dung')+'</th><th>'+t('Hạn')+'</th><th>TT</th></tr>'+
      hts.map(h=>{const late=(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly')&&h.han&&h.han<today;
        return `<tr><td>${(h.created_at||'').slice(0,10)}</td><td><b>${BP[h.bo_phan_nhan]||h.bo_phan_nhan}</b></td>
        <td style="max-width:260px">${esc(h.noi_dung||'')}</td>
        <td>${late?`<span class="pill" style="background:var(--bad-bg);color:var(--bad)">${h.han} ⚠</span>`:h.han||''}</td>
        <td>${HTT[h.trang_thai]||h.trang_thai}</td></tr>`}).join('')+'</table>'
      :'<div class="muted">'+t('Chưa có yêu cầu hỗ trợ nào cho dự án này.')+'</div>')+
      `<div style="margin-top:10px"><button class="btn pri" onclick="dlgWs.close();document.querySelector('nav button[data-t=ht]').click();if(window.htDeal)htDeal.value='${esc(d.ten)}'">🆘 ${t('Tạo yêu cầu hỗ trợ')}</button></div>`;
  }else if(WS.tab==='mc'){
    const base=sb.storage.from('minh-chung').getPublicUrl('deals/'+d.id).data.publicUrl;
    body=(d.file_minh_chung_url?`<div style="margin-bottom:8px"><a href="${esc(d.file_minh_chung_url)}" target="_blank">📎 ${t('Minh chứng phê duyệt chính')}</a></div>`:'')+
      (files.length?files.map(f=>`<div style="padding:5px 0;border-bottom:1px solid var(--border)">
        <a href="${base}/${encodeURIComponent(f.name)}" target="_blank">📄 ${esc(f.name)}</a>
        <span class="muted" style="font-size:11px"> · ${(f.created_at||'').slice(0,10)}</span></div>`).join('')
      :'<div class="muted">'+t('Kho minh chứng trống — tải lên trong hộp thoại Sửa dự án.')+'</div>');
  }
  wsBody.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
    ${TAB('tq','📋 '+t('Tổng quan'))}${TAB('tx','🤝 '+t('Tiếp xúc'),tps.length)}${TAB('bg','💰 '+t('Báo giá'),quots.length)}
    ${TAB('ht','🆘 '+t('Hỗ trợ'),hts.length)}${TAB('mc','🖼 '+t('Minh chứng'),files.length+(d.file_minh_chung_url?1:0))}</div>${body}`;
  applyLang();
}

/* ================= 5b. TIẾP XÚC GẮN DỰ ÁN (deal_id trên crm_touchpoints) ================= */
const _saveTx_v20=saveTx;
saveTx=async function(){
  const dName=window.txDeal?txDeal.value.trim():'';
  const deal=dName?DEALS.find(x=>x.ten===dName):null;
  if(!deal)return _saveTx_v20();
  const origFrom=sb.from.bind(sb);
  sb.from=(tb)=>{const o=origFrom(tb);
    if(tb==='crm_touchpoints'){const oi=o.insert.bind(o);
      o.insert=async r=>{let res=await oi({...r,deal_id:deal.id});
        if(res.error&&/deal_id/.test(res.error.message))res=await oi(r); // chưa migration → bỏ cột
        return res}}
    return o};
  try{await _saveTx_v20()}finally{sb.from=origFrom}
};

/* ================= 8. THANH TÁC NGHIỆP MOBILE ================= */
function mbGo(tab,focusId){
  const b=document.querySelector(`nav button[data-t="${tab}"]`);if(b)b.click();
  window.scrollTo({top:0,behavior:'smooth'});
  if(focusId){const el=document.getElementById(focusId);if(el)setTimeout(()=>el.focus(),250)}
}
function mbViecHomNay(){
  mbGo('tq');
  const el=document.getElementById('dueList');
  if(el)setTimeout(()=>el.closest('.card').scrollIntoView({behavior:'smooth'}),200);
}
