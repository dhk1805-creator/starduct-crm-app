/* ==========================================================================
   CRM — NSCA / Starduct   ·   v27 ĐĂNG NHẬP HỢP NHẤT (một tài khoản duy nhất)
   · Mọi user (NSCA + NPP) đăng nhập MỘT lần bằng email + mật khẩu (Supabase
     Auth). Quyền hạn tra theo email trong crm_user_roles (RPC crm_ho_so_cua_toi).
   · Lần đầu đăng nhập bằng mật khẩu tạm → bắt tự đặt mật khẩu mới
     (sb.auth.updateUser) → hết cảnh 2 hộp thoại, 2 mật khẩu.
   · Card "Tài khoản & phân quyền": tạo hồ sơ + cấp đăng nhập email ngay trong
     app, KHÔNG cần nhập lại mật khẩu — server xác minh người gọi qua phiên.
   · Email không có hồ sơ → từ chối (đăng xuất). Hồ sơ bị khóa → từ chối.
   Yêu cầu DB: chạy supabase-migration-v27-auth.sql + tắt "Confirm email".
   ========================================================================== */

/* ============ 1. SAU KHI KẾT NỐI: nhận diện bằng hồ sơ email ============ */
const _autoMe_v20=autoMe;
autoMe=async function(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){return _autoMe_v20()} // chưa đăng nhập email → giữ luồng cũ
  const r=await sb.rpc('crm_ho_so_cua_toi');
  if(r.error){console.warn('crm_ho_so_cua_toi:',r.error.message);return _autoMe_v20()} // chưa migration v27
  const h=(r.data||[])[0];
  if(!h){ // email hợp lệ nhưng KHÔNG có hồ sơ → không được vào
    alert('⛔ Email '+(session.user?.email||'')+' chưa được cấp quyền trong CRM.\nLiên hệ admin NSCA để được tạo hồ sơ.');
    await sb.auth.signOut();location.reload();return;
  }
  if(h.khoa){
    alert('🔒 Tài khoản của bạn đang bị khóa — liên hệ admin NSCA.');
    await sb.auth.signOut();location.reload();return;
  }
  ME={ho_ten:h.ho_ten,chuc_danh:h.chuc_danh,vai_tro:h.vai_tro,khu_vuc:h.khu_vuc,
      bo_phan:h.bo_phan,quyen_admin:h.quyen_admin,phai_doi_mk:false,
      user_name:h.user_name,npp_org_id:h.npp_org_id};
  localStorage.setItem('crm_me',JSON.stringify(ME));
  if(h.ngon_ngu&&h.ngon_ngu!==LANG){LANG=h.ngon_ngu;localStorage.setItem('crm_lang',LANG)}
  if(h.khu_vuc==='quoc_te'&&MOD!=='qt'){MOD='qt';localStorage.setItem('crm_mod','qt');modSel.value='qt';applyMod()}
  if(h.phai_doi_mk)setTimeout(batDoiMKLanDau,400); // mật khẩu tạm → bắt đổi
};

/* ============ 2. BẮT ĐỔI MẬT KHẨU LẦN ĐẦU (đổi thẳng mật khẩu email) ============ */
function batDoiMKLanDau(){
  let dlg=document.getElementById('dlgMKMoi');
  if(!dlg){
    dlg=document.createElement('dialog');dlg.id='dlgMKMoi';dlg.style.maxWidth='420px';
    dlg.innerHTML=`<div class="dhead">🔐 ${t('Đặt mật khẩu mới (bắt buộc lần đầu)')}</div>
    <div class="dbody">
      <div class="notice warn">${t('Bạn đang dùng mật khẩu tạm. Hãy đặt mật khẩu riêng — từ nay chỉ dùng MỘT mật khẩu này cho mọi thứ.')}</div>
      <div class="frow"><label>${t('Mật khẩu mới')}</label><input id="mkm1" type="password" placeholder="${t('tối thiểu 8 ký tự')}"></div>
      <div class="frow"><label>${t('Nhập lại')}</label><input id="mkm2" type="password"></div>
      <button class="btn pri" onclick="luuMKLanDau()">${t('Lưu mật khẩu mới')}</button>
      <span class="muted" id="mkmMsg"></span>
    </div>`;
    document.body.appendChild(dlg);
  }
  applyLang&&applyLang();dlg.showModal();
}
async function luuMKLanDau(){
  const a=mkm1.value,b=mkm2.value;
  if(a.length<8){mkmMsg.textContent='⚠ '+t('Tối thiểu 8 ký tự');return}
  if(a!==b){mkmMsg.textContent='⚠ '+t('Hai ô không khớp');return}
  mkmMsg.textContent=t('Đang lưu…');
  const r=await sb.auth.updateUser({password:a});
  if(r.error){mkmMsg.textContent='❌ '+r.error.message;return}
  await sb.rpc('crm_doi_mk_xong');
  mkmMsg.textContent='✓ '+t('Xong — từ nay đăng nhập bằng mật khẩu mới');
  setTimeout(()=>document.getElementById('dlgMKMoi').close(),900);
}

/* ============ 3. HỘP ĐĂNG NHẬP: email là chính, nội bộ cũ là phụ ============ */
window.addEventListener('load',async()=>{
  // thêm liên kết fallback trong hộp email
  const body=dlgCfg.querySelector('.dbody');
  if(body&&!document.getElementById('lnkNoiBo')){
    const p=document.createElement('div');p.style.marginTop='10px';
    p.innerHTML=`<a id="lnkNoiBo" href="javascript:void(0)" class="muted" style="font-size:12px"
      onclick="dlgCfg.close();dlgLogin.showModal()">${t('Tài khoản nội bộ cũ (user name)? Đăng nhập tại đây')}</a>`;
    body.appendChild(p);
  }
  // nếu đã có phiên email → không bật hộp đăng nhập nội bộ nữa
  try{
    const {data:{session}}=await sb?.auth.getSession()||{data:{}};
    if(session&&dlgLogin.open)dlgLogin.close();
  }catch(e){}
});
// chặn dlgLogin tự bật khi đã có phiên email (loadAll gọi if(!ME)dlgLogin.showModal())
const _showModal_login=dlgLogin.showModal.bind(dlgLogin);
dlgLogin.showModal=function(){
  try{
    sb.auth.getSession().then(({data:{session}})=>{
      if(!session)_showModal_login();
      // có phiên mà không có ME → autoMe v27 đã xử lý (từ chối/đăng xuất)
    }).catch(()=>_showModal_login());
  }catch(e){_showModal_login()}
};

/* ============ 4. CARD TÀI KHOẢN & PHÂN QUYỀN (thay card v26 khi có phiên email) ============ */
// chờ tới khi sb sẵn sàng VÀ có phiên email (kể cả đăng nhập muộn) rồi mới thay card
window.addEventListener('load',()=>{
  let tries=0;
  const iv=setInterval(async()=>{
    if(++tries>240){clearInterval(iv);return} // theo dõi tối đa ~6 phút
    if(typeof sb==='undefined'||!sb)return; // sb là let toàn cục, KHÔNG nằm trên window
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(!session)return;
      const card=document.getElementById('cardNppTk');
      if(!card)return;
      if(card.dataset.v27)return void clearInterval(iv);
      clearInterval(iv);nangCapCardTK();
    }catch(e){}
  },1500);
});
async function nangCapCardTK(){
  try{
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return; // chưa dùng đăng nhập hợp nhất → giữ card v26
    const card=document.getElementById('cardNppTk');if(!card)return;
    card.dataset.v27='1';
    card.innerHTML=`<h2>👥 ${t('Tài khoản & phân quyền (đăng nhập hợp nhất)')}</h2>
      <div class="notice">${t('Mỗi người một email + một mật khẩu duy nhất. Tạo hồ sơ tại đây → hệ thống cấp đăng nhập email với mật khẩu tạm → người dùng đăng nhập lần đầu sẽ bị bắt tự đổi. Không cần nhập lại mật khẩu của bạn — hệ thống xác minh qua phiên đăng nhập.')}</div>
      <button class="btn pri" onclick="tk2Tai()">📋 ${t('Tải danh sách người dùng')}</button>
      <span class="muted" id="tk2Msg"></span>
      <div id="tk2List" style="margin-top:10px"></div>
      <div id="tk2Form" style="display:none;border:1px dashed var(--border);border-radius:8px;padding:12px;margin-top:12px">
        <b style="font-size:13px">➕ ${t('Tạo người dùng mới')}</b>
        <div class="grid g3" style="gap:8px;margin-top:8px">
          <input id="t2Email" placeholder="Email đăng nhập * (vd: hoa@galaxytech.vn)">
          <input id="t2HoTen" placeholder="${t('Họ tên *')}">
          <input id="t2MKTam" placeholder="${t('Mật khẩu tạm * (≥8 ký tự)')}">
          <select id="t2VaiTro" onchange="t2NPP.style.display=['npp_lead','npp_staff'].includes(this.value)?'':'none'">
            <option value="npp_lead">${t('NPP Lead (account cha)')}</option>
            <option value="npp_staff">${t('NPP Staff (account con)')}</option>
            <option value="staff">${t('Nhân sự NSCA — staff')}</option>
            <option value="manager">${t('Nhân sự NSCA — manager')}</option>
          </select>
          <select id="t2NPP"><option value="">— ${t('Chọn NPP')} —</option></select>
          <input id="t2ChucDanh" placeholder="${t('Chức danh (tuỳ chọn)')}">
        </div>
        <div style="margin-top:8px"><button class="btn pri" onclick="tk2Tao()">${t('Tạo & cấp đăng nhập')}</button>
          <span class="muted" id="tk2TaoMsg"></span></div>
      </div>`;
    applyLang&&applyLang();
  }catch(e){}
}
async function tk2Tai(){
  tk2Msg.textContent=t('Đang tải…');
  const r=await sb.rpc('crm_ds_ho_so');
  if(r.error){tk2Msg.textContent='❌ '+r.error.message+' — '+t('cần chạy migration v27');return}
  const rows=r.data||[];
  tk2Msg.textContent='';
  tk2Form.style.display='';
  const npps=ORGS.filter(o=>o.phan_loai==='npp');
  if(t2NPP.options.length<=1)
    t2NPP.innerHTML='<option value="">— '+t('Chọn NPP')+' —</option>'+
      npps.map(o=>`<option value="${o.id}">${esc(o.ten)}${o.quoc_gia&&o.quoc_gia!=='VN'?' ('+o.quoc_gia+')':''}</option>`).join('');
  if(ME?.vai_tro==='npp_lead'){t2VaiTro.innerHTML=`<option value="npp_staff">${t('NPP Staff (account con)')}</option>`;t2NPP.style.display='none'}
  tk2List.innerHTML=rows.length?'<table><tr><th>Email</th><th>'+t('Họ tên')+'</th><th>'+t('Vai trò')+'</th><th>NPP</th><th>'+t('Đăng nhập cuối')+'</th><th></th></tr>'+
    rows.map(u=>`<tr${u.khoa?' style="opacity:.5"':''}>
      <td><code>${esc(u.email||'—')}</code>${u.email?'':' <span class="tag" style="background:var(--warn-bg)">'+t('chưa có email')+'</span>'}</td>
      <td>${esc(u.ho_ten)}</td>
      <td>${u.vai_tro==='npp_lead'?'<span class="pill p4">👑 NPP Lead</span>':u.vai_tro==='npp_staff'?'<span class="pill p1">NPP Staff</span>':esc(u.vai_tro||'')}${u.phai_doi_mk?' <span class="tag">MK tạm</span>':''}${u.khoa?' <span class="tag">🔒 khóa</span>':''}</td>
      <td>${esc(u.npp_ten||'')}</td>
      <td class="muted">${u.lan_dang_nhap_cuoi?String(u.lan_dang_nhap_cuoi).slice(0,16).replace('T',' '):'—'}</td>
      <td style="white-space:nowrap">
        ${u.email?`<button class="btn" style="padding:3px 8px" title="${t('Cấp lại đăng nhập email với mật khẩu tạm mới')}" onclick="tk2CapEmail('${esc(u.email)}')">✉</button>
        <button class="btn" style="padding:3px 8px;${u.khoa?'':'color:var(--bad)'}" title="${u.khoa?t('Mở khóa'):t('Khóa')}" onclick="tk2Khoa('${esc(u.email)}',${u.khoa?'false':'true'})">${u.khoa?'🔓':'🔒'}</button>`:''}
      </td></tr>`).join('')+'</table>'
    :'<div class="muted">'+t('Chưa có người dùng nào trong phạm vi của bạn.')+'</div>';
  applyLang&&applyLang();
}
/* Cấp Auth user bằng client phụ (không đụng phiên đang đăng nhập) */
async function tk2SignUp(email,pass){
  const cfg=JSON.parse(localStorage.getItem('crm_cfg')||'{}');
  const cli=supabase.createClient(cfg.url||CFG_MAC_DINH.url,cfg.key||CFG_MAC_DINH.key,
    {auth:{persistSession:false,autoRefreshToken:false}});
  return cli.auth.signUp({email,password:pass});
}
async function tk2Tao(){
  const em=t2Email.value.trim().toLowerCase(),ht=t2HoTen.value.trim(),mk=t2MKTam.value;
  if(!em||!ht){tk2TaoMsg.textContent='⚠ '+t('Thiếu email hoặc họ tên');return}
  if(mk.length<8){tk2TaoMsg.textContent='⚠ '+t('Mật khẩu tạm tối thiểu 8 ký tự (chuẩn Supabase)');return}
  tk2TaoMsg.textContent=t('Đang tạo hồ sơ…');
  const r=await sb.rpc('crm_tao_ho_so',{p_email:em,p_ho_ten:ht,p_vai_tro:t2VaiTro.value,
    p_chuc_danh:t2ChucDanh.value.trim()||null,
    p_npp_org_id:['npp_lead','npp_staff'].includes(t2VaiTro.value)?(t2NPP.value||null):null});
  if(r.error){tk2TaoMsg.textContent='❌ '+r.error.message;return}
  if(!String(r.data).startsWith('✓')){tk2TaoMsg.textContent=r.data;return}
  tk2TaoMsg.textContent=t('Hồ sơ OK — đang cấp đăng nhập email…');
  const s=await tk2SignUp(em,mk);
  if(s.error){
    tk2TaoMsg.textContent='⚠ '+t('Hồ sơ đã tạo nhưng cấp đăng nhập lỗi: ')+s.error.message+
      ' — '+t('kiểm tra Authentication: bật Email, tắt Confirm email, cho phép Sign up');return}
  tk2TaoMsg.textContent='✓ '+t('Xong! Gửi cho người dùng: email ')+em+t(' · mật khẩu tạm (bắt đổi lần đầu)');
  t2Email.value='';t2HoTen.value='';t2MKTam.value='';
  tk2Tai();
}
async function tk2CapEmail(email){
  const mk=prompt(t('Mật khẩu tạm mới cho')+' '+email+' (≥8 ký tự):');
  if(!mk)return;
  if(mk.length<8){alert(t('Tối thiểu 8 ký tự'));return}
  const s=await tk2SignUp(email,mk);
  if(s.error){alert('❌ '+s.error.message+'\n'+t('(Nếu báo "already registered": người này đã có đăng nhập — muốn đặt lại mật khẩu hộ thì dùng Dashboard → Authentication → Users → Reset password.)'));return}
  alert('✓ '+t('Đã cấp đăng nhập email cho ')+email);
}
async function tk2Khoa(email,khoa){
  if(khoa&&!confirm(t('Khóa')+' '+email+'?'))return;
  const r=await sb.rpc('crm_khoa_ho_so',{p_email:email,p_khoa:khoa});
  alert(r.error?('❌ '+r.error.message):r.data);
  tk2Tai();
}
