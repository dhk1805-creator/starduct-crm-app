/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Đối tác
   Nguồn: index.html v20 dòng 2454–2635 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Đối tác' + tải/nhập file phân công + hộp thoại đối tác & người liên hệ
   ========================================================================== */
/* ================= ĐỐI TÁC ================= */
for(const el of [fdtQ,fdtPL,fdtQG,fdtTP,fdtPhu,fdtLBG,fdtChu,fdtQH]) el.oninput=renderDT;
function renderDT(){
  const q=fdtQ.value.toLowerCase();
  let rows=ORGS.filter(o=>
    (!q||o.ten.toLowerCase().includes(q)||(o.ghi_chu||'').toLowerCase().includes(q)||(o.mo_ta||'').toLowerCase().includes(q))&&
    (!fdtPL.value||o.phan_loai===fdtPL.value)&&
    (!fdtQG.value||o.quoc_gia===fdtQG.value)&&
    (!fdtTP.value||(o.thanh_pho||'').trim()===fdtTP.value)&&
    (fdtPhu.value===''||o.trang_thai_phu===+fdtPhu.value)&&
    (!fdtLBG.value||o.loai_ban_ghi===fdtLBG.value)&&
    (!fdtChu.value||(fdtChu.value==='co')===!!o.nguoi_phu_trach)&&
    (!fdtQH.value||(fdtQH.value==='chua'?!o.quan_he:o.quan_he===fdtQH.value)));
  dtList.innerHTML=`<div class="muted" style="margin-bottom:6px">${rows.length} bản ghi</div>`+
  '<table><tr><th>Tên</th><th>Loại</th><th>TT</th><th>Trạng thái phủ</th><th>Người phụ trách</th><th>Tiếp xúc cuối</th></tr>'+
  rows.slice(0,300).map(o=>`<tr class="row" onclick="openOrg('${o.id}')">
    <td><b>${esc(o.ten)}</b>${o.loai_ban_ghi==='tinh_bao'?' <span class="tag tb">tình báo</span>':''}</td>
    <td>${PL[o.phan_loai]||o.phan_loai}</td><td>${isoName[o.quoc_gia]||o.quoc_gia}</td>
    <td>${nhanPhu(o)}</td>
    <td>${esc(o.nguoi_phu_trach||'')||'<span class="muted">— chưa gán</span>'}</td>
    <td>${o.lan_tiep_xuc_cuoi||'<span class="muted">—</span>'}</td></tr>`).join('')+'</table>'+
  (rows.length>300?'<div class="muted" style="margin-top:6px">Hiển thị 300 đầu — thu hẹp bộ lọc để xem thêm.</div>':'');
}

/* ===== PHÂN CÔNG ĐỐI TÁC: tải file / nhập file ===== */
const PC_COLS=['ID — KHÔNG SỬA','Tên đối tác','Khối','Quốc gia','Tỉnh/Thành','Vai trò dự án','Nhóm quan hệ','Loại bản ghi','Ưu tiên','VÙNG','KÊNH THƯƠNG MẠI','NGƯỜI PHỤ TRÁCH','ĐỘ PHỦ 0–5'];
function taiFilePhanCong(){
  const uu=o=>o.khu_vuc==='noi_dia'?1:(o.phan_loai==='npp'?2:3);
  const rows=[...ALL_ORGS].sort((a,b)=>uu(a)-uu(b)||(a.ten||'').localeCompare(b.ten||'','vi'))
    .map(o=>[o.id,o.ten||'',o.khu_vuc||'',o.quoc_gia||'',o.thanh_pho||'',o.phan_loai||'',
      o.quan_he||'',o.loai_ban_ghi||'',uu(o),o.vung||'',o.kenh_thuong_mai||'',
      o.nguoi_phu_trach||'',o.trang_thai_phu??'']);
  const ws=XLSX.utils.aoa_to_sheet([PC_COLS,...rows]);
  ws['!cols']=[{wch:28},{wch:46},{wch:9},{wch:9},{wch:20},{wch:12},{wch:14},{wch:12},{wch:8},{wch:14},{wch:18},{wch:24},{wch:12}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Phan cong');
  const hd=XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN PHÂN CÔNG ĐỐI TÁC'],[''],
    ['4 cột cần điền','VÙNG · KÊNH THƯƠNG MẠI · NGƯỜI PHỤ TRÁCH · ĐỘ PHỦ 0–5 (các cột khác chỉ để tra cứu)'],
    ['ID','KHÔNG sửa/xoá — là khoá nối với hệ thống'],
    ['Ưu tiên','1 = nội địa điền trước · 2 = NPP · 3 = quốc tế điền dần'],
    ['VÙNG','mien_bac · mien_trung · mien_nam · dong_nam_a · dong_bac_a · trung_dong · chau_dai_duong · bac_my · chau_au · khac'],
    ['KÊNH','npp · agent · oem_odm · truc_tiep'],
    ['NGƯỜI PHỤ TRÁCH','Gõ đúng họ tên trong tab Nhân sự, vd: Đỗ Đình Đức'],
    ['ĐỘ PHỦ','Số 0–5 (0 chưa tiếp cận → 5 khách thường xuyên)'],
    ['Ô để trống','Giữ nguyên giá trị cũ, không bị xoá'],[''],
    ['Nhập lại','Tab Đối tác → ⬆ Nhập phân công → chọn file này']]);
  hd['!cols']=[{wch:20},{wch:100}];
  XLSX.utils.book_append_sheet(wb,hd,'Huong dan');
  XLSX.writeFile(wb,'phan-cong-doi-tac-'+new Date().toISOString().slice(0,10)+'.xlsx');
}
async function nhapPhanCong(inp){
  const f=inp.files[0];if(!f)return;
  try{
    const wb=XLSX.read(await f.arrayBuffer());
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''});
    const tenNS=(window.NHANSU||[]).map(n=>n.ho_ten);
    let ok=0,loi=[];
    for(const r of rows.slice(1)){
      const id=(r[0]||'').toString().trim();
      if(!/^[0-9a-f-]{36}$/i.test(id))continue;
      const patch={};
      const vung=(r[9]||'').toString().trim().toLowerCase();
      if(vung){if(VUNGDM[vung])patch.vung=vung;else{loi.push('vùng "'+vung+'"');continue}}
      const kenh=(r[10]||'').toString().trim().toLowerCase();
      if(kenh){if(KENHDM[kenh])patch.kenh_thuong_mai=kenh;else{loi.push('kênh "'+kenh+'"');continue}}
      const nguoi=(r[11]||'').toString().trim();
      if(nguoi){const kh=tenNS.find(t=>t.toLowerCase()===nguoi.toLowerCase());
        if(kh)patch.nguoi_phu_trach=kh;else{loi.push('người "'+nguoi+'"');continue}}
      const phu=(r[12]||'').toString().trim();
      if(phu!==''){const n=+phu;if(n>=0&&n<=5)patch.trang_thai_phu=n;else{loi.push('độ phủ "'+phu+'"');continue}}
      if(!Object.keys(patch).length)continue;
      const u=await sb.from('crm_org').update(patch).eq('id',id);
      if(u.error)loi.push(u.error.message);else ok++;
    }
    alert('✔ Cập nhật '+ok+' đối tác'+(loi.length?'\n⚠ '+loi.length+' dòng lỗi (bỏ qua): '+[...new Set(loi)].slice(0,5).join(' · '):''));
  }catch(e){alert('Lỗi đọc file: '+e.message)}
  inp.value='';await loadAll();
}
/* ===== PHÂN CÔNG DỰ ÁN ===== */
const PCDA_COLS=['ID — KHÔNG SỬA','Tên dự án','Khối','Quốc gia','Stage','Ưu tiên','Hạng mục SP','OWNER','PHÂN KHÚC','VÙNG','TỈNH/THÀNH'];
function taiFilePhanCongDA(){
  const rows=[...ALL_DEALS].sort((a,b)=>(a.khu_vuc||'').localeCompare(b.khu_vuc||'')||(a.ten||'').localeCompare(b.ten||'','vi'))
    .map(d=>[d.id,d.ten||'',d.khu_vuc||'',d.quoc_gia||'',d.stage||'',d.uu_tien||'',
      (d.hang_muc||'').toString(),d.owner||'',d.phan_khuc||'',d.vung||'',d.thanh_pho||'']);
  const ws=XLSX.utils.aoa_to_sheet([PCDA_COLS,...rows]);
  ws['!cols']=[{wch:28},{wch:44},{wch:9},{wch:9},{wch:10},{wch:8},{wch:24},{wch:24},{wch:14},{wch:14},{wch:18}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Phan cong DA');
  const hd=XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN PHÂN CÔNG DỰ ÁN'],[''],
    ['4 cột cần điền','OWNER · PHÂN KHÚC · VÙNG · TỈNH/THÀNH (cột khác chỉ tra cứu — ID không sửa)'],
    ['OWNER','Họ tên đúng như tab Nhân sự, vd: Đỗ Đình Đức'],
    ['PHÂN KHÚC','chung_cu · khach_san · benh_vien · truong_hoc · ttmt · van_phong · nha_may · san_bay · metro · khac'],
    ['VÙNG','mien_bac · mien_trung · mien_nam · dong_nam_a · dong_bac_a · trung_dong · chau_dai_duong · bac_my · chau_au · khac'],
    ['Ô trống','Giữ nguyên giá trị cũ'],
    ['Nhập lại','Tab Dự án → ⬆ Nhập phân công DA']]);
  hd['!cols']=[{wch:16},{wch:100}];
  XLSX.utils.book_append_sheet(wb,hd,'Huong dan');
  XLSX.writeFile(wb,'phan-cong-du-an-'+new Date().toISOString().slice(0,10)+'.xlsx');
}
async function nhapPhanCongDA(inp){
  const f=inp.files[0];if(!f)return;
  const PK=['chung_cu','khach_san','benh_vien','truong_hoc','ttmt','van_phong','nha_may','san_bay','metro','khac'];
  const VG=['mien_bac','mien_trung','mien_nam','dong_nam_a','dong_bac_a','trung_dong','chau_dai_duong','bac_my','chau_au','khac'];
  try{
    const wb=XLSX.read(await f.arrayBuffer());
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''});
    const tenNS=(window.NHANSU||[]).map(n=>n.ho_ten);
    let ok=0,loi=[];
    for(const r of rows.slice(1)){
      const id=(r[0]||'').toString().trim();
      if(!/^[0-9a-f-]{36}$/i.test(id))continue;
      const patch={};
      const ow=(r[7]||'').toString().trim();
      if(ow){const kh=tenNS.find(t=>t.toLowerCase()===ow.toLowerCase());
        if(kh)patch.owner=kh;else{loi.push('owner "'+ow+'"');continue}}
      const pk=(r[8]||'').toString().trim().toLowerCase();
      if(pk){if(PK.includes(pk))patch.phan_khuc=pk;else{loi.push('phân khúc "'+pk+'"');continue}}
      const vg=(r[9]||'').toString().trim().toLowerCase();
      if(vg){if(VG.includes(vg))patch.vung=vg;else{loi.push('vùng "'+vg+'"');continue}}
      const tp=(r[10]||'').toString().trim();
      if(tp)patch.thanh_pho=tp;
      if(!Object.keys(patch).length)continue;
      const u=await sb.from('crm_deals').update(patch).eq('id',id);
      if(u.error)loi.push(u.error.message);else ok++;
    }
    alert('✔ Cập nhật '+ok+' dự án'+(loi.length?'\n⚠ '+loi.length+' dòng lỗi: '+[...new Set(loi)].slice(0,5).join(' · '):''));
  }catch(e){alert('Lỗi đọc file: '+e.message)}
  inp.value='';await loadAll();
}
const VUNGDM={mien_bac:'Miền Bắc',mien_trung:'Miền Trung',mien_nam:'Miền Nam',
  dong_nam_a:'Đông Nam Á',dong_bac_a:'Đông Bắc Á',trung_dong:'Trung Đông',
  chau_dai_duong:'Châu Đại Dương',bac_my:'Bắc Mỹ',chau_au:'Châu Âu',khac:'Khác'};
const KENHDM={npp:'NPP (phân phối)',agent:'Agent / Broker',oem_odm:'OEM / ODM',truc_tiep:'Trực tiếp'};
async function openOrg(id){
  const o=id?ORGS.find(x=>x.id===id):{phan_loai:'cdt',quoc_gia:MOD==='nd'?'VN':'',trang_thai_phu:0,loai_ban_ghi:'muc_tieu'};
  orgTitle.textContent=id?o.ten:'Thêm đối tác';
  let contacts=[];
  if(id&&sb){const r=await sb.from('crm_contacts').select('*').eq('org_id',id);contacts=r.data||[]}
  orgBody.innerHTML=`
    <div class="frow"><label>Tên *</label><input id="oTen" value="${esc(o.ten||'')}"></div>
    <div class="frow"><label>Phân loại</label><select id="oPL">${Object.entries(PL).map(([k,v])=>
      `<option value="${k}"${o.phan_loai===k?' selected':''}>${v}</option>`).join('')}</select></div>
    <div class="frow"><label>Thị trường</label><input id="oQG" value="${esc(o.quoc_gia||'')}" placeholder="mã ISO: VN, HK, KR…"></div>
    <div class="frow" id="rowPheu" style="${o.phan_loai==='npp'?'':'display:none'}"><label>Phễu NPP</label><select id="oPheu">
      <option value="">— Chưa xếp —</option>${Object.entries(PHEU_NPP).map(([k,v])=>
      `<option value="${k}"${o.pheu_npp===k?' selected':''}>${v[0]}</option>`).join('')}</select></div>
    <div class="frow"><label>Trạng thái phủ</label><select id="oPhu">${PHU.map((p,i)=>
      `<option value="${i}"${o.trang_thai_phu===i?' selected':''}>${p}</option>`).join('')}</select></div>
    <div class="frow"><label>Nhóm quan hệ</label><select id="oQH">
      <option value="">— Chưa phân loại —</option>${Object.entries(QH).map(([k,v])=>
      `<option value="${k}"${o.quan_he===k?' selected':''}>${v}</option>`).join('')}</select></div>
    <div class="frow"><label>Người phụ trách</label><input id="oChu" list="nsList" placeholder="chọn từ danh sách nhân sự" value="${esc(o.nguoi_phu_trach||'')}"></div>
    <div class="frow"><label>Vùng</label><select id="oVung"><option value="">— Chưa xếp —</option>${Object.entries(VUNGDM).map(([k,v])=>`<option value="${k}"${o.vung===k?' selected':''}>${v}</option>`).join('')}</select></div>
    <div class="frow"><label>Kênh thương mại</label><select id="oKenh"><option value="">— Chưa xếp —</option>${Object.entries(KENHDM).map(([k,v])=>`<option value="${k}"${o.kenh_thuong_mai===k?' selected':''}>${v}</option>`).join('')}</select></div>
    <div class="frow"><label>Đối thủ đang chiếm</label><input id="oDT" value="${esc(o.doi_thu_dang_chiem||'')}"></div>
    <div class="frow"><label>Ghi chú</label><textarea id="oGC">${esc(o.ghi_chu||'')}</textarea></div>
    ${id?`<h3 style="font-size:13px;margin:14px 0 8px">Người liên hệ (${contacts.length})</h3>
    ${contacts.map(c=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
      <b>${esc(c.ho_ten)}</b> ${c.la_nguoi_ra_quyet_dinh?'<span class="tag" style="background:var(--ok-bg);color:var(--ok)">ra quyết định</span>':''}
      <div class="muted">${esc(c.chuc_danh||'')} · ${esc(c.email||'')} · ${esc(c.dien_thoai||'')}</div></div>`).join('')||'<div class="muted">Chưa có — đây là lớp dữ liệu cần bổ sung nhất (13,6%)</div>'}
    <div style="margin-top:10px"><input id="cTen" placeholder="Họ tên" style="width:32%">
      <input id="cCD" placeholder="Chức danh" style="width:28%">
      <input id="cEm" placeholder="Email" style="width:24%">
      <button class="btn" onclick="addContact('${id}')">+ Thêm</button></div>`:''}
    <div style="margin-top:14px;display:flex;gap:8px"><button class="btn pri" onclick="saveOrg('${id||''}')">Lưu</button>
    ${id?`<button class="btn" onclick="dlgOrg.close();openThread('org','${id}','${esc(o.ten)}')">💬 Thảo luận & phê duyệt</button>`:''}</div>`;
  dlgOrg.showModal();applyLang();
  oPL.onchange=()=>{document.getElementById('rowPheu').style.display=oPL.value==='npp'?'':'none'};
}
async function saveOrg(id){
  const rec={ten:oTen.value.trim(),phan_loai:oPL.value,quoc_gia:oQG.value.trim().toUpperCase(),
    trang_thai_phu:+oPhu.value,quan_he:oQH.value||null,
    pheu_npp:(oPL.value==='npp'?(oPheu.value||null):null),nguoi_phu_trach:oChu.value.trim()||null,
    vung:oVung.value||null,kenh_thuong_mai:oKenh.value||null,
    doi_thu_dang_chiem:oDT.value.trim()||null,ghi_chu:oGC.value.trim()||null,updated_at:new Date().toISOString()};
  if(!rec.ten)return;
  const r=id?await sb.from('crm_org').update(rec).eq('id',id):await sb.from('crm_org').insert(rec);
  if(r.error){alert(r.error.message);return}
  dlgOrg.close();await loadAll();
}
async function addContact(orgId){
  if(!cTen.value.trim())return;
  await sb.from('crm_contacts').insert({org_id:orgId,ho_ten:cTen.value.trim(),
    chuc_danh:cCD.value.trim()||null,email:cEm.value.trim()||null,nguon:'nhap_tay'});
  openOrg(orgId);
}

