/* ==========================================================================
   CRM — NSCA / Starduct   ·   Bộ lọc · render tổng · đăng nhập cá nhân
   Nguồn: index.html v20 dòng 1339–1393 (cắt nguyên khối, KHÔNG sửa logic)
   fillFilters, renderAll, đăng nhập cá nhân, đổi mật khẩu
   ========================================================================== */

function fillFilters(){
  const qgs=[...new Set([...ORGS.map(o=>o.quoc_gia),...DEALS.map(d=>d.quoc_gia)])].sort();
  for(const sel of [fdtQG,fdaQG]){
    const cur=sel.value;
    sel.innerHTML='<option value="">— Thị trường —</option>'+
      qgs.map(q=>`<option value="${q}">${isoName[q]||q}</option>`).join('');
    sel.value=cur;
  }
  const tps=[...new Set(ORGS.map(o=>(o.thanh_pho||'').trim()).filter(Boolean))].sort();
  const curTP=fdtTP.value;
  fdtTP.innerHTML='<option value="">— Thành phố —</option>'+tps.map(t=>`<option>${esc(t)}</option>`).join('');
  fdtTP.value=curTP;
  orgList.innerHTML=ORGS.filter(o=>o.loai_ban_ghi==='muc_tieu')
    .map(o=>`<option value="${esc(o.ten)}">`).join('');
  dealList.innerHTML=DEALS.map(d=>`<option value="${esc(d.ten)}">`).join('');
}

function renderAll(){renderTQ();renderDT();renderDA();renderTX();renderHT();renderSK();renderRV();renderKPI();renderNS();applyLang()}

/* ================= LOGIN CÁ NHÂN ================= */
let ME=JSON.parse(localStorage.getItem('crm_me')||'null');
function showMe(){
  if(ME){whoami.style.display='';
    const adm=ME.quyen_admin==='super_admin'?' · ⭐ Super Admin':ME.quyen_admin==='admin'?' · 🔧 Admin':'';
    whoami.textContent='👤 '+ME.ho_ten+' · '+ME.chuc_danh+adm;
    logoutBtn.style.display='';
    // điền sẵn tên vào các ô người thực hiện
    for(const id of ['txAi','htAi','rvAi','cmtAi','aprAi'])
      {const el=document.getElementById(id);if(el&&!el.value)el.value=ME.ho_ten}
  } else {whoami.style.display='none';logoutBtn.style.display='none'}
}
async function doLogin(){
  const r=await sb.rpc('crm_login',{p_user:lgU.value,p_pass:lgP.value});
  if(r.error||!r.data||!r.data.length){lgMsg.textContent='❌ Sai user name hoặc mật khẩu';return}
  ME=r.data[0];ME.user_name=lgU.value.trim().toLowerCase();
  localStorage.setItem('crm_me',JSON.stringify(ME));
  dlgLogin.close();showMe();
  // môi trường làm việc theo ngôn ngữ cá nhân (Santiago = EN)
  const hs=(window.NHANSU||[]).find(n=>n.ho_ten===ME.ho_ten);
  if(hs?.ngon_ngu&&hs.ngon_ngu!==LANG){LANG=hs.ngon_ngu;localStorage.setItem('crm_lang',LANG)}
  if(ME.khu_vuc==='quoc_te'&&MOD!=='qt'){MOD='qt';localStorage.setItem('crm_mod','qt');modSel.value='qt';applyMod()}
  if(ME.phai_doi_mk){dlgDoiMK.showModal()}
  // staff mặc định xem dashboard cá nhân
  if(ME.vai_tro==='staff'){frvXem.value=ME.ho_ten;renderRV()}
  renderAll();
}
async function logout(){ME=null;localStorage.removeItem('crm_me');try{await sb.auth.signOut()}catch(e){}location.reload()}
async function doDoiMK(){
  const r=await sb.rpc('crm_doi_mat_khau',{p_user:ME.user_name,p_cu:mkCu.value,p_moi:mkMoi.value});
  if(r.error){mkMsg.textContent='❌ '+r.error.message;return}
  if(!r.data){mkMsg.textContent='❌ Mật khẩu cũ không đúng';return}
  mkMsg.textContent='✓ Đã đổi';ME.phai_doi_mk=false;
  localStorage.setItem('crm_me',JSON.stringify(ME));setTimeout(()=>dlgDoiMK.close(),600);
}
