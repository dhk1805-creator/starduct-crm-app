/* ==========================================================================
   CRM — NSCA / Starduct   ·   v26 QUẢN LÝ TÀI KHOẢN NPP (cha/con)
   Card "👥 Tài khoản NPP" trong tab Nhân sự:
   · Admin NSCA / CEO / Manager: tạo ACCOUNT CHA (NPP Lead) cho từng NPP,
     tạo account con, khóa / cấp lại mật khẩu mọi tài khoản NPP.
   · NPP Lead: tự tạo tối đa 5 account con (npp_staff) trong NPP của mình,
     khóa / cấp lại mật khẩu nhân viên mình.
   Mọi thao tác đều yêu cầu nhập lại MẬT KHẨU CỦA CHÍNH BẠN (xác thực RPC).
   Yêu cầu DB: chạy supabase-migration-v26-npp-accounts.sql.
   ========================================================================== */

let NPPTK_PASS='';

/* ===== Nút 🔑 Đổi mật khẩu chủ động trên header (v26.3) ===== */
window.addEventListener('load',()=>{
  const lo=document.getElementById('logoutBtn');
  if(!lo||document.getElementById('doiMKBtn'))return;
  const b=document.createElement('button');
  b.className='btn';b.id='doiMKBtn';b.title=t('Đổi mật khẩu nội bộ');b.textContent='🔑';
  b.onclick=()=>{
    // tự chữa phiên cũ thiếu user_name: tra lại theo họ tên trong danh bạ nhân sự
    if(ME&&!ME.user_name){
      const r=(window.NHANSU||[]).find(n=>n.ho_ten===ME.ho_ten&&n.user_name);
      if(r){ME.user_name=r.user_name;localStorage.setItem('crm_me',JSON.stringify(ME))}
    }
    if(!ME||!ME.user_name){alert(t('Phiên đăng nhập thiếu user name — bấm Đăng xuất rồi đăng nhập lại bằng user name + mật khẩu.'));return}
    mkMsg.textContent='';dlgDoiMK.showModal();
  };
  lo.parentNode.insertBefore(b,lo);
  // hiện/ẩn cùng nút Đăng xuất
  new MutationObserver(()=>{b.style.display=lo.style.display}).observe(lo,{attributes:true,attributeFilter:['style']});
  b.style.display=lo.style.display;
});

window.addEventListener('load',()=>{
  const sec=document.getElementById('tab-ns');
  if(!sec||document.getElementById('cardNppTk'))return;
  const card=document.createElement('div');card.className='card';card.id='cardNppTk';
  card.innerHTML=`<h2>👥 ${t('Tài khoản NPP (account cha / con)')}</h2>
    <div class="notice">${t('Account cha (NPP Lead) do NSCA cấp — thấy toàn bộ dự án của NPP mình, tự mở tối đa 5 account con cho nhân viên. Account con chỉ thấy dự án được giao. Mọi thao tác cần nhập lại mật khẩu của bạn để xác thực.')}</div>
    <div class="grid g3" style="gap:8px">
      <input id="tkUserGoi" placeholder="${t('User name CỦA BẠN *')}">
      <input id="tkMKGoi" type="password" placeholder="${t('Mật khẩu CỦA BẠN (xác thực) *')}">
      <button class="btn pri" onclick="nppTkTai()">📋 ${t('Tải danh sách tài khoản')}</button>
    </div>
    <div class="muted" id="tkMsg" style="margin-top:6px"></div>
    <div id="tkList" style="margin-top:10px"></div>
    <div id="tkFormBox" style="display:none;border:1px dashed var(--border);border-radius:8px;padding:12px;margin-top:12px">
      <b style="font-size:13px">➕ ${t('Tạo tài khoản mới')}</b>
      <div class="grid g3" style="gap:8px;margin-top:8px">
        <select id="tkVaiTro" onchange="nppTkVaiTro()">
          <option value="npp_staff">${t('Account con — Nhân viên NPP')}</option>
          <option value="npp_lead">${t('Account cha — NPP Lead')}</option>
        </select>
        <select id="tkNPP"><option value="">— ${t('Chọn NPP')} —</option></select>
        <input id="tkHoTen" placeholder="${t('Họ tên *')}">
        <input id="tkUser" placeholder="user name * (không dấu, viết liền)">
        <input id="tkMKTam" placeholder="${t('Mật khẩu tạm * (≥6 ký tự)')}">
        <input id="tkChucDanh" placeholder="${t('Chức danh (tuỳ chọn)')}">
      </div>
      <div style="margin-top:8px"><button class="btn pri" onclick="nppTkTao()">${t('Tạo tài khoản')}</button>
        <span class="muted" id="tkTaoMsg"></span></div>
    </div>`;
  sec.appendChild(card);
  applyLang&&applyLang();
});

function nppTkQuyen(){
  if(!ME)return null;
  if(ME.quyen_admin==='admin'||ME.quyen_admin==='super_admin'||ME.vai_tro==='ceo'||ME.vai_tro==='manager')return 'admin';
  if(ME.vai_tro==='npp_lead')return 'lead';
  return null;
}
function nppTkVaiTro(){
  // Lead không được chọn NPP khác / tạo lead
  if(nppTkQuyen()==='lead'){tkVaiTro.value='npp_staff';tkNPP.style.display='none'}
}
let NPPTK_USER='';
async function nppTkTai(){
  const q=nppTkQuyen();
  if(!q){tkMsg.textContent='⚠ '+t('Chỉ Admin/CEO/Manager hoặc NPP Lead dùng được khu vực này');return}
  if(!tkUserGoi.value&&ME.user_name)tkUserGoi.value=ME.user_name;
  NPPTK_USER=tkUserGoi.value.trim().toLowerCase();
  NPPTK_PASS=tkMKGoi.value;
  if(!NPPTK_USER){tkMsg.textContent='⚠ '+t('Tài khoản của bạn chưa có user name nội bộ — nhờ admin đặt user_name + mật khẩu trong tab Nhân sự (hoặc SQL) rồi thử lại');return}
  if(!NPPTK_PASS){tkMsg.textContent='⚠ '+t('Nhập mật khẩu của bạn');return}
  tkMsg.textContent=t('Đang tải…');
  // xác thực tường minh trước để báo lỗi rõ ràng (crm_ds trả rỗng không phân biệt được sai MK)
  const auth=await sb.rpc('crm_login',{p_user:NPPTK_USER,p_pass:NPPTK_PASS});
  if(auth.error||!auth.data||!auth.data.length){
    tkMsg.textContent='❌ '+t('Sai user name hoặc mật khẩu NỘI BỘ (khác mật khẩu email). Nếu bạn chỉ đăng nhập bằng email, cần đặt user_name + mật khẩu nội bộ cho tài khoản của mình trước.');return}
  const r=await sb.rpc('crm_ds_tai_khoan_npp',{p_user_goi:NPPTK_USER,p_pass_goi:NPPTK_PASS});
  if(r.error){tkMsg.textContent='❌ '+r.error.message+' — '+t('cần chạy migration v26');return}
  const rows=r.data||[];
  tkMsg.textContent='✓ '+t('Đã xác thực');
  // form + danh sách NPP cho admin
  tkFormBox.style.display='';
  if(q==='admin'){
    const npps=ORGS.filter(NPP_KYHD);
    tkNPP.innerHTML='<option value="">— '+t('Chọn NPP')+' —</option>'+
      npps.map(o=>`<option value="${o.id}">${esc((o.ma_code?o.ma_code+' · ':'')+o.ten)}${o.quoc_gia&&o.quoc_gia!=='VN'?' ('+o.quoc_gia+')':''}</option>`).join('');
    tkNPP.style.display='';
  } else nppTkVaiTro();
  tkList.innerHTML=rows.length?'<table><tr><th>NPP</th><th>'+t('Họ tên')+'</th><th>User</th><th>'+t('Vai trò')+'</th><th>'+t('Đăng nhập cuối')+'</th><th></th></tr>'+
    rows.map(u=>`<tr>
      <td><b>${esc(u.npp_ten||'—')}</b></td><td>${esc(u.ho_ten)}</td>
      <td><code>${esc(u.user_name)}</code></td>
      <td>${u.vai_tro==='npp_lead'?'<span class="pill p4">👑 Lead</span>':'<span class="pill p1">Staff</span>'}${u.phai_doi_mk?' <span class="tag" title="'+t('Chưa đăng nhập lần đầu / vừa cấp lại MK')+'">MK tạm</span>':''}</td>
      <td class="muted">${u.lan_dang_nhap_cuoi?String(u.lan_dang_nhap_cuoi).slice(0,16).replace('T',' '):'—'}</td>
      <td style="white-space:nowrap">
        <button class="btn" style="padding:3px 8px" title="${t('Cấp mật khẩu tạm mới')}" onclick="nppTkMK('${esc(u.user_name)}',false)">🔑</button>
        <button class="btn" style="padding:3px 8px;color:var(--bad)" title="${t('Khóa tài khoản')}" onclick="nppTkMK('${esc(u.user_name)}',true)">🔒</button>
      </td></tr>`).join('')+'</table>'
    :'<div class="muted">'+t('Chưa có tài khoản NPP nào — tạo account cha (Lead) đầu tiên bên dưới.')+'</div>';
  applyLang&&applyLang();
}
async function nppTkTao(){
  if(!NPPTK_PASS){tkTaoMsg.textContent='⚠ '+t('Bấm Tải danh sách trước để xác thực');return}
  const q=nppTkQuyen();
  const args={p_user_goi:NPPTK_USER,p_pass_goi:NPPTK_PASS,
    p_ho_ten:tkHoTen.value.trim(),p_user_name:tkUser.value.trim(),
    p_mat_khau_tam:tkMKTam.value,p_vai_tro:tkVaiTro.value,
    p_chuc_danh:tkChucDanh.value.trim()||null,
    p_npp_org_id:(q==='admin'?(tkNPP.value||null):null)};
  tkTaoMsg.textContent=t('Đang tạo…');
  const r=await sb.rpc('crm_tao_tai_khoan_npp',args);
  tkTaoMsg.textContent=r.error?('❌ '+r.error.message):r.data;
  if(!r.error&&String(r.data).startsWith('✓')){tkHoTen.value='';tkUser.value='';tkMKTam.value='';nppTkTai()}
}
async function nppTkMK(user,khoa){
  let mk=null;
  if(khoa){if(!confirm(t('KHÓA tài khoản')+' '+user+'? '+t('(mở lại bằng cách cấp mật khẩu tạm mới)')))return}
  else{mk=prompt(t('Mật khẩu tạm mới cho')+' '+user+' (≥6 ký tự):');if(!mk)return}
  const r=await sb.rpc('crm_cap_mk_npp',{p_user_goi:NPPTK_USER,p_pass_goi:NPPTK_PASS,
    p_user_dich:user,p_mat_khau_moi:mk});
  alert(r.error?('❌ '+r.error.message):r.data);
  nppTkTai();
}
