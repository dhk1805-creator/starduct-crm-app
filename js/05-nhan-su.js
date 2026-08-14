/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Nhân sự
   Nguồn: index.html v20 dòng 1938–1993 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Nhân sự' — hồ sơ, vai trò, reset mật khẩu
   ========================================================================== */
/* ================= NHÂN SỰ & MÔ TẢ CÔNG VIỆC ================= */
function renderNS(){
  if(!window.NHANSU||!nsBody)return;
  // v35.4: QT rieng - ND rieng. Trang Quoc te chi hien nhan su khu_vuc='quoc_te';
  // trang Noi dia hien phan con lai. CEO/Manager (lanh dao) hien o ca hai.
  const NS_MOD=NHANSU.filter(n=>(n.vai_tro==='ceo'||n.quyen_phe_duyet===true||n.quyen_tiep_nhan===true)||((n.khu_vuc==='quoc_te')===(MOD==='qt'))); // v35.9: lanh dao = theo co quyen
  nsBody.innerHTML='<table><tr><th>Họ tên</th><th>Chức danh</th><th>Vai trò</th><th>Khu vực</th><th>User</th><th>Email</th><th></th></tr>'+
  NS_MOD.map(n=>`<tr class="row" onclick="openNS('${n.id}')">
    <td><b>${esc(n.ho_ten)}</b></td><td>${esc(n.chuc_danh)}</td>
    <td><span class="tag">${n.vai_tro}</span></td><td>${n.khu_vuc||'—'}</td>
    <td class="muted">${n.user_name||'—'}</td>
    <td>${n.email?esc(n.email):'<span class="pill p3">trống — admin bổ sung</span>'}</td>
    <td><button class="btn" style="padding:4px 8px">Hồ sơ</button></td></tr>`).join('')+'</table>';
}
function openNS(id){
  const n=NHANSU.find(x=>x.id===id);if(!n)return;
  const isAdmin=ME&&(ME.quyen_admin==='admin'||ME.quyen_admin==='super_admin');
  const isSuper=ME&&ME.quyen_admin==='super_admin';
  const ro=isAdmin?'':' readonly disabled';
  nsTitle.textContent='👤 '+n.ho_ten+' — '+n.chuc_danh+
    (n.quyen_admin?(n.quyen_admin==='super_admin'?' · ⭐':' · 🔧'):'');
  nsDlgBody.innerHTML=`
    ${!isAdmin?'<div class="notice">Chế độ xem — chỉ Admin/Super Admin sửa được hồ sơ.</div>':''}`+`
    <h3 style="font-size:13px;margin:0 0 6px">Mô tả công việc trong module (viết từ tài liệu đã đối soát)</h3>
    <textarea id="nsMT" style="width:100%;min-height:180px;font-size:13px"${ro}>${esc(n.mo_ta_cong_viec||'')}</textarea>
    <h3 style="font-size:13px;margin:12px 0 6px">KPI chính</h3>
    <textarea id="nsKPI" style="width:100%;min-height:44px;font-size:13px"${ro}>${esc(n.kpi_chinh||'')}</textarea>
    <div class="grid g2" style="margin-top:12px">
      <div><label class="muted">Chỉ tiêu kỳ (trống — chờ DL-02)</label>
        <input id="nsCT" value="${esc(n.chi_tieu_ky||'')}" style="width:100%"${ro}></div>
      <div><label class="muted">Email (trống — admin bổ sung)</label>
        <input id="nsEm" value="${esc(n.email||'')}" style="width:100%"${ro}></div>
    </div>
    <div style="margin-top:8px"><label class="muted">Ghi chú admin</label>
      <textarea id="nsAd" style="width:100%;min-height:40px"${ro}>${esc(n.admin_bo_sung||'')}</textarea></div>
    <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
      ${isAdmin?`<button class="btn pri" onclick="saveNS('${id}')">Lưu</button>`:''}
      ${isSuper?`<button class="btn" onclick="resetMK('${esc(n.user_name||'')}')">🔑 Reset mật khẩu về mặc định</button>`:''}
      <span class="muted" id="nsMsg"></span></div>`;
  dlgNS.showModal();applyLang();
}
async function resetMK(targetUser){
  if(!targetUser){alert(t('Người này chưa có user name'));return}
  const pass=prompt(t('Xác nhận mật khẩu Super Admin của bạn:'));if(!pass)return;
  const r=await sb.rpc('crm_reset_mat_khau',{p_admin_user:ME.user_name,p_admin_pass:pass,p_target_user:targetUser});
  document.getElementById('nsMsg').textContent=r.error?('❌ '+r.error.message):
    (r.data?'✓ Đã reset về mật khẩu mặc định — buộc đổi khi đăng nhập':'❌ Không tìm thấy user');
}
async function saveNS(id){
  const r=await sb.from('crm_user_roles').update({
    mo_ta_cong_viec:nsMT.value,kpi_chinh:nsKPI.value,
    chi_tieu_ky:nsCT.value.trim()||null,email:nsEm.value.trim()||null,
    admin_bo_sung:nsAd.value.trim()||null}).eq('id',id);
  document.getElementById('nsMsg').textContent=r.error?('❌ '+r.error.message):'✓ Đã lưu';
  if(!r.error){const ns=await sb.from('crm_user_roles').select('*').order('ho_ten');
    window.NHANSU=ns.data||[];renderNS()}
}

/* ================= DOANH THU ================= */
