/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Dự án · Tiếp xúc · Sự kiện
   Nguồn: index.html v20 dòng 2636–2750 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Dự án' + 'Tiếp xúc' + 'Sự kiện'
   ========================================================================== */
/* ================= DỰ ÁN ================= */
for(const el of [fdaQ,fdaQG,fdaUT,fdaSt,fdaTVTK,fdaTP,fdaHM,fdaNPP]) el.oninput=renderDA;
function renderDA(){
  const q=fdaQ.value.toLowerCase(),tp=fdaTP.value.toLowerCase(),hm=fdaHM.value.toLowerCase();
  // nạp danh sách NPP cho bộ lọc (một lần mỗi render, giữ lựa chọn)
  const npps=ORGS.filter(NPP_KYHD);
  if(fdaNPP.options.length-1!==npps.length){const cur=fdaNPP.value;
    fdaNPP.innerHTML='<option value="">'+t('— NPP —')+'</option>'+npps.map(n=>`<option value="${n.id}">${esc((n.ma_code?n.ma_code+' · ':'')+n.ten)}</option>`).join('');
    fdaNPP.value=cur}
  let rows=DEALS.filter(d=>
    (!q||d.ten.toLowerCase().includes(q)||(d.cdt_text||'').toLowerCase().includes(q)||
      (d.tvtk_text||'').toLowerCase().includes(q)||(d.thau_text||'').toLowerCase().includes(q))&&
    (!fdaQG.value||d.quoc_gia===fdaQG.value)&&
    (!tp||(d.dia_diem||'').toLowerCase().includes(tp))&&
    (!hm||(d.hang_muc||'').toLowerCase().includes(hm))&&
    (!fdaNPP.value||d.npp_dang_ky_id===fdaNPP.value)&&
    (!fdaUT.value||(d.uu_tien||'').startsWith(fdaUT.value))&&
    (!fdaSt.value||d.stage===fdaSt.value)&&
    (!fdaTVTK.checked||(!d.tvtk_id&&!d.tvtk_text)));
  const npByid=Object.fromEntries(ORGS.filter(o=>o.phan_loai==='npp').map(n=>[n.id,n.ten]));
  const today=new Date().toISOString().slice(0,10);
  daList.innerHTML=`<div class="muted" style="margin-bottom:6px">${rows.length} dự án · tổng giá trị ước ${fmtB(rows.reduce((s,d)=>s+(+d.gia_tri_uoc||0),0))}</div>`+
  '<table><tr><th>Dự án</th><th>TT</th><th>Stage</th><th>TVTK</th><th>NPP / Owner</th><th>Việc tiếp theo</th><th class="num">Giá trị</th></tr>'+
  rows.slice(0,300).map(d=>{
    const naLate=d.next_action&&d.next_action_han&&d.next_action_han<today;
    return `<tr class="row" onclick="openDeal('${d.id}')">
    <td style="max-width:240px"><b>${esc(d.ten)}</b><div class="muted">${esc(d.cdt_text||'')}</div></td>
    <td>${isoName[d.quoc_gia]||d.quoc_gia}</td>
    <td><span class="pill ${d.stage==='po'?'p4':d.stage==='spec_in'?'p3':d.stage==='dong'?'p0':'p1'}">${STG[d.stage]||d.stage}</span></td>
    <td>${d.tvtk_text?esc(d.tvtk_text):'<span class="pill p3">thiếu</span>'}</td>
    <td>${esc(npByid[d.npp_dang_ky_id]||d.npp_chi_dinh||d.owner||'')||'<span class="muted">—</span>'}${d.hien_trang_da?`<div><span class="tag">${esc(d.hien_trang_da)}</span></div>`:''}</td>
    <td style="max-width:180px">${d.next_action?`${esc(d.next_action)}${d.next_action_han?` <span class="pill ${naLate?'p3':'p1'}"${naLate?' style="background:var(--bad-bg);color:var(--bad)"':''}>${d.next_action_han}</span>`:''}`:'<span class="muted">—</span>'}</td>
    <td class="num">${d.gia_tri_uoc?fmtB(+d.gia_tri_uoc):''}</td></tr>`}).join('')+'</table>'+
  (rows.length>300?'<div class="muted" style="margin-top:6px">Hiển thị 300 đầu.</div>':'');
}
function openDeal(id){
  const d=id?DEALS.find(x=>x.id===id):{quoc_gia:MOD==='nd'?'VN':'',stage:'tiep_can'};
  dealTitle.textContent=id?d.ten:'Thêm dự án';
  dealBody.innerHTML=`
    <div class="frow"><label>Tên *</label><input id="dTen" value="${esc(d.ten||'')}"></div>
    <div class="frow"><label>Thị trường</label><input id="dQG" value="${esc(d.quoc_gia||'')}"></div>
    <div class="frow"><label>CĐT</label><input id="dCDT" value="${esc(d.cdt_text||'')}"></div>
    <div class="frow"><label>TVTK ⭐</label><input id="dTVTK" value="${esc(d.tvtk_text||'')}" placeholder="nơi quyết định spec-in"></div>
    <div class="frow"><label>Tổng thầu/MEP</label><input id="dThau" value="${esc(d.thau_text||'')}"></div>
    <div class="frow"><label>Hạng mục</label><input id="dHM" value="${esc(d.hang_muc||'')}"></div>
    <div class="frow"><label>Stage</label><select id="dSt">${['tiep_can','spec_in','chao_gia','dam_phan','po','dong']
      .map(s=>`<option value="${s}"${d.stage===s?' selected':''}>${s}</option>`).join('')}</select></div>
    <div class="frow"><label>Số bộ VAV ước</label><input id="dVAV" type="number" value="${d.so_bo_vav_uoc||''}"></div>
    <div class="frow"><label>Ngày chốt dự kiến</label><input id="dChot" type="date" value="${d.ngay_chot_du_kien||''}"></div>
    <div class="frow"><label>Owner</label><input id="dOwner" value="${esc(d.owner||'')}"></div>
    <div class="frow"><label>Mốc spec-in</label><input id="dMoc" value="${esc(d.moc_spec_in||'')}"></div>
    <div class="frow"><label>Việc tiếp theo</label><input id="dNA" value="${esc(d.next_action||'')}" placeholder="VD: gửi mẫu VAV cho TVTK trước khi chốt spec"></div>
    <div class="frow"><label>Hạn việc đó</label><input id="dNAH" type="date" value="${d.next_action_han||''}"></div>
    <div style="margin-top:12px;display:flex;gap:8px"><button class="btn pri" onclick="saveDeal('${id||''}')">Lưu</button>
    ${id?`<button class="btn" onclick="dlgDeal.close();openThread('deal','${id}','${esc(d.ten)}')">💬 Thảo luận & phê duyệt</button>`:''}</div>`;
  dlgDeal.showModal();applyLang();
}
async function saveDeal(id){
  const rec={ten:dTen.value.trim(),quoc_gia:dQG.value.trim().toUpperCase(),cdt_text:dCDT.value.trim()||null,
    tvtk_text:dTVTK.value.trim()||null,thau_text:dThau.value.trim()||null,hang_muc:dHM.value.trim()||null,
    stage:dSt.value,so_bo_vav_uoc:dVAV.value?+dVAV.value:null,ngay_chot_du_kien:dChot.value||null,
    owner:dOwner.value.trim()||null,moc_spec_in:dMoc.value.trim()||null,
    next_action:dNA.value.trim()||null,next_action_han:dNAH.value||null,
    lan_cap_nhat_cuoi:new Date().toISOString()};
  if(!rec.ten)return;
  const r=id?await sb.from('crm_deals').update(rec).eq('id',id):await sb.from('crm_deals').insert(rec);
  if(r.error){alert(r.error.message);return}
  dlgDeal.close();await loadAll();
}

/* ================= TIẾP XÚC ================= */
txNgay.value=new Date().toISOString().slice(0,10);
async function saveTx(){
  const org=ORGS.find(o=>o.ten===txOrg.value.trim());
  if(!org){txMsg.textContent='⚠ Chọn đúng tên đối tác trong danh sách';return}
  if(!txAi.value.trim()){txMsg.textContent='⚠ Thiếu người thực hiện';return}
  const rec={org_id:org.id,ngay:txNgay.value,loai:txLoai.value,nguoi_thuc_hien:txAi.value.trim(),
    nguoi_gap:txGap.value.trim()||null,la_cap_ra_quyet_dinh:txQD.checked,
    noi_dung:txND.value.trim()||null,buoc_tiep_theo:txBTT.value.trim()||null,
    han_buoc_tiep_theo:txHan.value||null,
    nang_phu_tu:txNang.value?org.trang_thai_phu:null,nang_phu_den:txNang.value?+txNang.value:null};
  // Luật mức 2: đòi cấp ra quyết định
  if(txNang.value&&+txNang.value>=2&&!txQD.checked){
    txMsg.textContent='⚠ Nâng lên mức ≥2 đòi hỏi tiếp xúc với CẤP RA QUYẾT ĐỊNH';return}
  if(txNang.value&&!txBTT.value.trim()){
    txMsg.textContent='⚠ Nâng trạng thái phải kèm bước tiếp theo có hạn';return}
  const r=await sb.from('crm_touchpoints').insert(rec);
  if(r.error){txMsg.textContent=r.error.message;return}
  txMsg.textContent='✓ Đã lưu';
  txND.value='';txBTT.value='';txHan.value='';txNang.value='';
  await loadAll();
}
function renderTX(){
  const TPSV=laStaffXem()?TPS.filter(x=>x.nguoi_thuc_hien===ME.ho_ten):TPS; // v35.8: cua ai nguoi nay thay
  txList.innerHTML=TPSV.length?'<table><tr><th>Ngày</th><th>Đối tác</th><th>Loại</th><th>Ai</th><th>Nội dung</th><th>Nâng phủ</th></tr>'+
  TPSV.slice(0,50).map(t=>{const o=ORGS.find(x=>x.id===t.org_id);
  return `<tr><td>${t.ngay}</td><td><b>${esc(o?.ten||'—')}</b></td><td>${t.loai}</td>
  <td>${esc(t.nguoi_thuc_hien)}</td><td class="muted" style="max-width:280px">${esc(t.noi_dung||'')}</td>
  <td>${t.nang_phu_den!=null?`<span class="pill p${t.nang_phu_den}">→ ${t.nang_phu_den}</span>`:''}</td></tr>`}).join('')+'</table>'
  :'<div class="muted">Chưa có tiếp xúc nào.</div>';
}

/* ================= SỰ KIỆN ================= */
function renderSK(){
  skList.innerHTML=EVENTS.length?'<table><tr><th>Thị trường</th><th>Sự kiện</th><th>Thời gian</th><th>Địa điểm</th><th>Trạng thái</th></tr>'+
  EVENTS.map(e=>`<tr><td>${esc(e.quoc_gia||'')}</td><td><b>${esc(e.ten)}</b></td>
  <td>${esc(e.thoi_gian||'')}</td><td class="muted">${esc(e.dia_diem||'')}</td>
  <td style="white-space:nowrap"><select onchange="updEvent('${e.id}',this.value)">
    ${['chua_quyet','se_tham_du','da_tham_du','bo_qua'].map(s=>
    `<option value="${s}"${e.trang_thai===s?' selected':''}>${SKT[s]}</option>`).join('')}
  </select> <button class="btn" style="padding:4px 8px" title="Thảo luận & duyệt ngân sách"
    onclick="openThread('event','${e.id}','${esc(e.ten)}')">💬</button></td></tr>`).join('')+'</table>'
  :'<div class="muted">Chưa có sự kiện — nạp từ tab Nhập dữ liệu.</div>';
}
async function updEvent(id,v){await sb.from('crm_events').update({trang_thai:v}).eq('id',id)}

