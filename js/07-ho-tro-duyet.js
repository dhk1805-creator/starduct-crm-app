/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Hỗ trợ & Phê duyệt
   Nguồn: index.html v20 dòng 2182–2333 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Hỗ trợ' liên phòng ban + luồng thảo luận & phê duyệt phân cấp
   ========================================================================== */
/* ================= HỖ TRỢ LIÊN PHÒNG BAN ================= */
const BP={rd:'R&D',qlsx:'Sản xuất',bo:'BO',tckt:'TCKT',kcs:'KCS',khac:'Khác'};
const HTT={mo:'Mở',dang_xu_ly:'Đang xử lý',da_xong:'Đã xong',tu_choi:'Từ chối'};
async function saveHT(){
  if(!htAi.value.trim()||!htND.value.trim()){htMsg.textContent='⚠ Thiếu người yêu cầu hoặc nội dung';return}
  const deal=DEALS.find(d=>d.ten===htDeal.value.trim());
  const han=htHan.value||new Date(Date.now()+2*864e5).toISOString().slice(0,10);
  const r=await sb.from('crm_support_requests').insert({deal_id:deal?.id||null,
    nguoi_yeu_cau:htAi.value.trim(),bo_phan_nhan:htBP.value,loai:htLoai.value,
    noi_dung:htND.value.trim(),muc_uu_tien:htUT.value,han});
  if(r.error){htMsg.textContent=r.error.message;return}
  const bpHead={rd:'Phạm Hoài Nam',qlsx:'Nguyễn Văn Ngọc',kcs:'Nguyễn Văn Ngọc',
    tckt:'Nguyễn Tiến Duẩn',bo:'Nguyễn Thị Thanh Tâm',khac:'Đào Nguyên Ngọc'}[htBP.value]||'';
  htMsg.textContent='✓ Đã gửi — hạn '+han+(bpHead?' → tự chuyển tới '+bpHead:'');
  htND.value='';await loadAll();
}
function renderHT(){
  const today=new Date().toISOString().slice(0,10);
  // Điểm nghẽn
  const agg={};
  for(const h of HTS){const b=agg[h.bo_phan_nhan]=agg[h.bo_phan_nhan]||{mo:0,qh:0,xong:0};
    if(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly'){b.mo++;if(h.han&&h.han<today)b.qh++}
    if(h.trang_thai==='da_xong')b.xong++}
  htBottleneck.innerHTML=Object.entries(BP).filter(([k])=>agg[k]).map(([k,v])=>{
    const a=agg[k];return `<div class="kpi"><h3>${v}</h3>
    <div class="v" style="${a.qh?'color:var(--bad)':''}">${a.mo}</div>
    <div class="m">${a.qh?`⚠ ${a.qh} quá hạn · `:''}${a.xong} đã xong</div></div>`}).join('')
    ||'<div class="muted">Chưa có yêu cầu nào.</div>';
  // Danh sách
  let rows=HTS.filter(h=>(!fhtBP.value||h.bo_phan_nhan===fhtBP.value)&&(!fhtTT.value||h.trang_thai===fhtTT.value));
  htList.innerHTML=rows.length?'<table><tr><th>Ngày</th><th>Dự án</th><th>Bộ phận</th><th>Người xử lý</th><th>Loại</th><th>Nội dung</th><th>Hạn</th><th>Trạng thái</th></tr>'+
  rows.slice(0,100).map(h=>{const d=DEALS.find(x=>x.id===h.deal_id);
    const late=(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly')&&h.han&&h.han<today;
    return `<tr><td>${(h.created_at||'').slice(0,10)}</td><td>${esc(d?.ten||'—')}</td>
    <td><b>${BP[h.bo_phan_nhan]}</b></td>
    <td>${h.nguoi_xu_ly?esc(h.nguoi_xu_ly):'<span class="muted">—</span>'}</td>
    <td>${HTL[h.loai]||h.loai}</td>
    <td class="muted" style="max-width:260px">${esc(h.noi_dung)}</td>
    <td>${late?`<span class="pill" style="background:var(--bad-bg);color:var(--bad)">${h.han} ⚠</span>`:h.han||''}</td>
    <td style="white-space:nowrap"><select onchange="updHT('${h.id}',this.value)">${Object.entries(HTT).map(([k,v])=>
      `<option value="${k}"${h.trang_thai===k?' selected':''}>${v}</option>`).join('')}</select>
      <button class="btn" style="padding:4px 8px" title="Thảo luận"
        onclick="openThread('support','${h.id}','Yêu cầu: ${esc((h.noi_dung||'').slice(0,40))}')">💬</button></td></tr>`}).join('')+'</table>'
  :'<div class="muted">Không có yêu cầu khớp bộ lọc.</div>';
}
async function updHT(id,v){await sb.from('crm_support_requests').update({trang_thai:v}).eq('id',id);await loadAll()}

/* ================= THẢO LUẬN & PHÊ DUYỆT ================= */
const APR_LOAI={nang_trang_thai_phu:'Nâng trạng thái phủ',chuyen_stage:'Chuyển stage',
  dong_du_an:'Đóng dự án',gan_nguoi_phu_trach:'Gán người phụ trách',
  duyet_danh_muc_chinh_thuc:'Duyệt vào danh mục chính thức',ngan_sach_su_kien:'Ngân sách sự kiện',
  de_xuat_chinh_sach:'Đề xuất chính sách',duyet_ke_hoach:'Duyệt kế hoạch',khac:'Khác'};
let THR={dt:null,id:null,ten:null};
async function openThread(dt,id,ten){
  THR={dt,id,ten};thrTitle.textContent='💬 '+ten;
  const [c,a]=await Promise.all([
    sb.from('crm_comments').select('*').eq('doi_tuong',dt).eq('doi_tuong_id',id).order('created_at'),
    sb.from('crm_approvals').select('*').eq('doi_tuong',dt).eq('doi_tuong_id',id).order('created_at',{ascending:false})
  ]);
  const cmts=c.data||[],aprs=a.data||[];
  const today=new Date().toISOString().slice(0,10);
  thrBody.innerHTML=`
  <h3 style="font-size:13px;margin:0 0 8px">Đề xuất & phê duyệt (${aprs.length})</h3>
  ${aprs.map(a=>{
    const wait=Math.round((Date.now()-new Date(a.created_at))/864e5);
    const badge=a.trang_thai==='da_duyet'?'<span class="pill p4">✓ Đã duyệt</span>':
      a.trang_thai==='tu_choi'?'<span class="pill" style="background:var(--bad-bg);color:var(--bad)">✗ Từ chối</span>':
      `<span class="pill p3">Chờ ${wait} ngày${wait>14?' ⚠':''}</span>`;
    return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <b>${APR_LOAI[a.loai]||a.loai}</b>${badge}</div>
      <div style="font-size:13px;margin:4px 0">${esc(a.noi_dung)}</div>
      <div class="muted">${esc(a.nguoi_de_xuat)} · ${(a.created_at||'').slice(0,10)} · cấp duyệt: ${a.cap_duyet.toUpperCase()}
        ${a.can_cu?` · <a href="${esc(a.can_cu)}" target="_blank">căn cứ</a>`:''}</div>
      ${a.y_kien_duyet?`<div class="muted" style="margin-top:4px">↳ <b>${esc(a.nguoi_duyet||'')}</b>: ${esc(a.y_kien_duyet)}</div>`:''}
      ${a.trang_thai==='cho_duyet'?`<div style="margin-top:8px;display:flex;gap:6px">
        <input id="ykd_${a.id}" placeholder="Ý kiến (bác thì bắt buộc)" style="flex:1;font-size:12px">
        ${coQuyenDuyet(a.cap_duyet)?`<button class="btn" style="color:var(--ok)" onclick="decideApr('${a.id}','da_duyet')">Duyệt</button>
        <button class="btn" style="color:var(--bad)" onclick="decideApr('${a.id}','tu_choi')">Từ chối</button>`:`<span class="muted" style="font-size:12px">chờ cấp ${a.cap_duyet.toUpperCase()} duyệt</span>`}</div>`:''}
    </div>`}).join('')||'<div class="muted" style="margin-bottom:8px">Chưa có đề xuất nào.</div>'}
  <div style="border:1px dashed var(--border);border-radius:8px;padding:10px 12px;margin-bottom:16px">
    <div class="grid g3" style="gap:8px">
      <select id="aprLoai">${Object.entries(APR_LOAI).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      <select id="aprCap"><option value="manager">Cấp duyệt: Manager</option><option value="ceo">Cấp duyệt: CEO</option><option value="cfo">Cấp duyệt: CFO (tài chính)</option></select>
      <input id="aprAi" placeholder="Người đề xuất *">
    </div>
    <textarea id="aprND" placeholder="Đề xuất gì, căn cứ gì… *" style="width:100%;min-height:44px;margin-top:8px"></textarea>
    <input id="aprCC" placeholder="Link căn cứ / bằng chứng (tuỳ chọn)" style="width:100%;margin-top:6px">
    <div style="margin-top:8px"><button class="btn pri" onclick="saveApr()">Gửi đề xuất</button>
      <span class="muted" id="aprMsg"></span></div>
  </div>
  <h3 style="font-size:13px;margin:0 0 8px">Thảo luận (${cmts.length})</h3>
  <div style="max-height:240px;overflow:auto;margin-bottom:10px">
  ${cmts.map(c=>`<div style="padding:7px 0;border-bottom:1px solid var(--border)">
    <b style="font-size:13px">${esc(c.nguoi_viet)}</b>
    <span class="muted">· ${(c.created_at||'').slice(0,16).replace('T',' ')}</span>
    ${c.nguoi_nhan?`<span class="tag">→ ${esc(c.nguoi_nhan)}</span>`:''}
    ${c.han_phan_hoi?`<span class="pill ${c.han_phan_hoi<today?'p3':'p1'}"${c.han_phan_hoi<today?' style="background:var(--bad-bg);color:var(--bad)"':''}>hạn ${c.han_phan_hoi}</span>`:''}
    <div style="font-size:13px;margin-top:2px">${esc(c.noi_dung)}</div></div>`).join('')
    ||'<div class="muted">Chưa có thảo luận.</div>'}
  </div>
  <div class="grid g3" style="gap:8px">
    <input id="cmtAi" placeholder="Người viết *">
    <input id="cmtNhan" placeholder="Gửi tới ai (tuỳ chọn)">
    <input id="cmtHan" type="date" title="Hạn phản hồi">
  </div>
  <textarea id="cmtND" placeholder="Nội dung… *" style="width:100%;min-height:44px;margin-top:8px"></textarea>
  <div style="margin-top:8px"><button class="btn pri" onclick="saveCmt()">Gửi</button>
    <span class="muted" id="cmtMsg"></span></div>`;
  dlgThread.showModal();applyLang();
}
async function saveCmt(){
  if(!cmtAi.value.trim()||!cmtND.value.trim()){cmtMsg.textContent='⚠ Thiếu người viết hoặc nội dung';return}
  const r=await sb.from('crm_comments').insert({doi_tuong:THR.dt,doi_tuong_id:THR.id,
    nguoi_viet:cmtAi.value.trim(),noi_dung:cmtND.value.trim(),
    nguoi_nhan:cmtNhan.value.trim()||null,han_phan_hoi:cmtHan.value||null});
  if(r.error){cmtMsg.textContent=r.error.message;return}
  openThread(THR.dt,THR.id,THR.ten);
}
async function saveApr(){
  if(!aprAi.value.trim()||!aprND.value.trim()){aprMsg.textContent='⚠ Thiếu người đề xuất hoặc nội dung';return}
  const han=new Date(Date.now()+14*864e5).toISOString().slice(0,10);
  const r=await sb.from('crm_approvals').insert({doi_tuong:THR.dt,doi_tuong_id:THR.id,
    loai:aprLoai.value,cap_duyet:aprCap.value,nguoi_de_xuat:aprAi.value.trim(),
    noi_dung:aprND.value.trim(),can_cu:aprCC.value.trim()||null,han});
  if(r.error){aprMsg.textContent=r.error.message;return}
  openThread(THR.dt,THR.id,THR.ten);
}
// Ai duyet cap nao: ceo -> CEO/super_admin · manager -> Truong PKD/admin tro len · cfo -> CFO/TCKT + CEO
function coQuyenDuyet(cap){
  if(!ME)return false;
  if(ME.vai_tro==='ceo'||ME.quyen_admin==='super_admin')return true;
  if(cap==='manager')return ME.vai_tro==='manager'||ME.quyen_admin==='admin';
  if(cap==='cfo')return ME.bo_phan==='tckt';
  return false;
}
async function decideApr(id,tt){
  const yk=document.getElementById('ykd_'+id).value.trim();
  if(tt==='tu_choi'&&!yk){alert(t('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  const nguoi=ME?.ho_ten||prompt(t('Tên người duyệt:'));if(!nguoi)return;
  await sb.from('crm_approvals').update({trang_thai:tt,nguoi_duyet:nguoi,y_kien_duyet:yk||null,decided_at:new Date().toISOString()}).eq('id',id);
  if(THR.dt==='plan'){
    await sb.from('crm_plans').update({trang_thai:tt==='da_duyet'?'da_duyet':'tu_choi'}).eq('id',THR.id);
    await loadPlans();
  }
  openThread(THR.dt,THR.id,THR.ten);loadAprQueue();
}
async function loadAprQueue(){
  const r=await sb.from('v_crm_approvals_cho').select('*').order('so_ngay_cho',{ascending:false});
  window.APRQ=r.data||[];
}

