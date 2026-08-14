/* ==========================================================================
   CRM — NSCA / Starduct   ·   v29 MOBILE: MÀN HÌNH CHÍNH 3 Ô LỚN + SONG NGỮ
   · Mở app trên điện thoại → MÀN HÌNH CHÍNH với 3 Ô LỚN theo vai trò.
     Bấm ô nào → nội dung mở toàn màn hình → thao tác xong bấm ← Đóng quay về.
   · 100% song ngữ VI/EN — nút chuyển ngôn ngữ ngay trên đầu màn hình,
     từ điển riêng phủ kín mọi chữ trong bản mobile.
   · Nhân viên/NPP: Việc hôm nay · Ghi kết quả · Yêu cầu hỗ trợ (theo phân công)
   · Lãnh đạo:      Hôm nay toàn hệ thống · Phê duyệt · Yêu cầu đang mở
   · Link chia sẻ ?m=1 ép bản mobile trên mọi thiết bị.
   ========================================================================== */

let MB_ON=false, MB_TAB='home';

/* ===== TỪ ĐIỂN SONG NGỮ MOBILE (VI → EN) ===== */
const MB_EN={
'Trang chính':'Home','Đóng':'Close','Việc hôm nay':'Today’s Tasks','Ghi kết quả':'Log Results',
'KQ hôm nay':'Today’s Results','Yêu cầu hỗ trợ':'Support Request','Hỗ trợ':'Support',
'Hôm nay':'Today','Phê duyệt':'Approvals','Yêu cầu':'Requests',
'Đề xuất':'Proposals','Gửi đề xuất mới':'New proposal','Đề xuất của tôi':'My proposals',
'gửi & theo dõi đề xuất':'submit & track proposals','Gửi đề xuất':'Submit proposal',
'Chờ duyệt':'Pending','Đã duyệt':'Approved','Bị từ chối':'Rejected',
'Cấp duyệt: Manager':'Approver: Manager','Cấp duyệt: CEO':'Approver: CEO',
'Đề xuất gì, căn cứ gì…':'What is proposed, on what basis…','Chưa có đề xuất nào.':'No proposals yet.',
'Chọn dự án':'Select a project','Chọn khách hàng/đối tác':'Select a customer/partner',
'Gắn vào dự án / khách hàng':'Attach to project / customer','Dự án liên quan':'Related project',
'Chọn trong danh sách để gắn đúng dự án':'Pick from the list so it attaches to the right project',
'Khách hàng-Đối tác':'Customers-Partners',
'Gửi yêu cầu':'Send request','Tác nghiệp của tôi':'My actions',
'Chấp nhận':'Accept','Đã xong':'Done','Trả lời':'Reply','Phản hồi & trao đổi':'Feedback & discussion',
'Gửi trả lời':'Send reply','Chưa có phản hồi nào.':'No feedback yet.','Nội dung… *':'Message… *',
'Ý kiến / phản hồi (bác thì bắt buộc)':'Comment / feedback (required if rejecting)',
'Dự án theo kế hoạch hôm nay':'Today\u2019s planned projects','(quá hạn)':'(overdue)','(hôm nay)':'(today)','(7 ngày tới)':'(next 7 days)',
'Chưa có hành động nào được kế hoạch đẩy cho hôm nay — danh sách hiện các việc 7 ngày tới.':'No actions scheduled for today \u2014 showing the next 7 days.',
'Bản đầy đủ':'Full version','Đăng nhập':'Sign in','Đăng xuất':'Sign out',
'Đăng nhập để thấy công việc của bạn.':'Sign in to see your work.',
'dự án quá hạn / đến hạn':'projects overdue / due','ghi nhanh kết quả tiếp xúc':'quick-log your touchpoints',
'gửi & theo dõi yêu cầu':'send & track requests',
'tiếp xúc toàn hệ thống hôm nay':'touchpoints across the system today',
'đề xuất chờ bạn duyệt':'proposals awaiting your decision','yêu cầu hỗ trợ đang mở':'open support requests',
'QUÁ HẠN':'OVERDUE','HÔM NAY':'TODAY','7 NGÀY TỚI':'NEXT 7 DAYS','ĐỨNG YÊN >21 NGÀY':'STALLED >21 DAYS',
'(chưa có việc tiếp theo)':'(no next action set)','Ghi KQ':'Log',
'Không có việc đến hạn — mở ô Ghi kết quả để ghi tiếp xúc.':'Nothing due — open Log Results to record a touchpoint.',
'Bạn phụ trách':'You are in charge of','dự án đang mở. Bấm vào dự án để mở Workspace đầy đủ.':'open projects. Tap a project to open its full Workspace.',
'Ghi kết quả làm việc':'Log your work results','Dự án (trong danh sách bạn phụ trách)':'Project (from your assigned list)',
'Hoặc / và Khách hàng-Đối tác':'And / or Customer-Partner','Gõ vài chữ để chọn…':'Type a few letters to pick…',
'Hình thức':'Type of contact','Gặp CẤP RA QUYẾT ĐỊNH':'Met a DECISION MAKER','Kết quả / nội dung':'Result / notes',
'VD: đã trình mẫu VAV, TVTK đồng ý đưa vào spec…':'E.g.: presented VAV sample, consultant agreed to spec it in…',
'Việc tiếp theo':'Next action','VD: gửi báo giá trước thứ 6':'E.g.: send quotation by Friday',
'Hạn việc tiếp theo':'Next action deadline','Ảnh hiện trạng / minh chứng (tuỳ chọn)':'Site photo / evidence (optional)',
'LƯU KẾT QUẢ':'SAVE RESULT','Đã ghi hôm nay':'Logged today',
'Chưa có — kết quả bạn lưu sẽ hiện ở đây và trên desktop của quản lý.':'None yet — saved results appear here and on your manager’s desktop.',
'Chọn ít nhất Dự án hoặc Khách hàng trong danh sách':'Pick at least a Project or a Customer from the list',
'Chưa ghi kết quả/nội dung':'Result / notes is empty','Đang lưu…':'Saving…','Đang gửi…':'Sending…','Đang tải…':'Loading…',
'Đã lưu & đồng bộ vào ':'Saved & synced to ','Gửi yêu cầu hỗ trợ':'Send a support request',
'Dự án liên quan (tuỳ chọn)':'Related project (optional)','Gửi tới bộ phận':'Send to department',
'Loại yêu cầu':'Request type','Nội dung cần hỗ trợ':'What do you need',
'VD: cần bản vẽ submittal VAV cho dự án X trước thứ 5…':'E.g.: need VAV submittal drawings for project X by Thursday…',
'Mức ưu tiên':'Priority','GỬI YÊU CẦU':'SEND REQUEST','Yêu cầu của tôi':'My requests',
'Chưa ghi nội dung':'Content is empty','Đã gửi — hậu phương sẽ thấy ngay trên desktop':'Sent — back office will see it on desktop immediately',
'Chưa gửi yêu cầu nào.':'No requests sent yet.','hạn':'due','chưa ai nhận':'unassigned',
'tiếp xúc hôm nay':'touchpoints today','gặp cấp QĐ':'decision makers met','chờ phê duyệt':'awaiting approval',
'hỗ trợ đang mở':'open requests','Hôm nay ai tiếp xúc với ai':'Who met whom today','cấp QĐ':'decision maker',
'Chưa có tiếp xúc nào được ghi hôm nay.':'No touchpoints logged today yet.',
'Báo cáo, doanh thu, KPI chi tiết — xem trên máy tính. Bản mobile lãnh đạo chỉ gói gọn: hôm nay ai làm gì, có gì chờ bạn duyệt.':'Reports, revenue and KPIs live on desktop. Mobile keeps it tight: who did what today, and what awaits your approval.',
'Đang tải hàng chờ…':'Loading queue…','Chờ phê duyệt':'Awaiting approval','chờ':'waiting','ngày':'days',
'Ý kiến (bác thì bắt buộc)':'Comment (required to reject)','Duyệt':'Approve','Từ chối':'Reject',
'Hàng chờ trống — không có gì cần bạn duyệt.':'Queue is empty — nothing needs your approval.',
'chờ cấp':'awaiting','duyệt':'approval','Từ chối bắt buộc ghi lý do — quy tắc L4':'Rejection requires a reason — rule L4',
'Yêu cầu đang mở':'Open requests','Không có yêu cầu nào đang mở.':'No open requests.',
'Phân xử chi tiết / gán người xử lý — làm trên desktop, tab Hỗ trợ.':'Detailed triage / assignment — on desktop, Support tab.',
'Thoát':'Sign out','Chào':'Hello','Email':'Email','Mật khẩu':'Password','ĐĂNG NHẬP':'SIGN IN',
'Đang đăng nhập…':'Signing in…','Sai email hoặc mật khẩu':'Wrong email or password',
'Dùng tài khoản nội bộ (user name)?':'Use internal account (user name)?',
'Dùng đăng nhập email':'Use email sign-in','User name':'User name',
'Hệ thống quản trị quan hệ khách hàng':'Customer Relationship Management',
'Đang khởi động…':'Starting up…'
};
const T=s=>(typeof LANG!=='undefined'&&LANG==='en')?(MB_EN[s]||s):s;

/* ===== kích hoạt & link chia sẻ ===== */
function mbEp(){const p=new URLSearchParams(location.search);
  return p.has('m')||p.has('mobile')||location.hash==='#mobile'}
function mbLa(){
  if(mbEp())return true;
  return window.matchMedia('(max-width:767px)').matches&&localStorage.getItem('crm_mb_off')!=='1'}
const MB_LINK=()=>location.origin+location.pathname.replace(/index\.html$/,'')+'?m=1';

/* ===== v35.9: KẾ HOẠCH NGÀY — mobile chỉ thao tác trên hành động CRM đẩy ra hôm nay,
   không mở toàn bộ danh mục. Nguồn: next_action/next_action_han (đổ từ kế hoạch tháng/quý đã duyệt). */
function mbKeHoachNgay(){
  const today=new Date().toISOString().slice(0,10);
  const in7=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  const mine=mbDealsCuaToi().filter(d=>d.stage!=='dong'&&d.next_action&&d.next_action_han);
  const homNay=mine.filter(d=>d.next_action_han<=today);
  if(homNay.length)return{rows:homNay.sort((a,b)=>(a.next_action_han||'').localeCompare(b.next_action_han||'')),fallback:false};
  return{rows:mine.filter(d=>d.next_action_han<=in7).slice(0,30),fallback:true};
}
function mbKHNgayOpts(){
  const today=new Date().toISOString().slice(0,10);
  const {rows}=mbKeHoachNgay();
  return rows.map(d=>{const tag=d.next_action_han<today?T('(quá hạn)'):(d.next_action_han===today?T('(hôm nay)'):T('(7 ngày tới)'));
    return `<option value="${esc(d.ten)}">${esc(d.ten)} ${tag}</option>`}).join('');
}
function mbKHNgayOrgs(){
  const {rows}=mbKeHoachNgay();
  const ten=new Set();rows.forEach(d=>{if(d.cdt_text)ten.add(d.cdt_text);if(d.npp_chi_dinh)ten.add(d.npp_chi_dinh)});
  const lien=ORGS.filter(o=>ten.has(o.ten));
  const goc=lien.length?lien:mbOrgsCuaToi().slice(0,30);
  return goc.map(o=>`<option value="${esc(o.ten)}">${esc(o.ten)}</option>`).join('');
}

/* ===== phạm vi CỦA TÔI ===== */
function mbDealsCuaToi(){
  let rows=typeof phamViNPP==='function'?phamViNPP(DEALS):DEALS;
  if(ME&&ME.ho_ten){
    const mine=rows.filter(d=>[d.owner,d.nguoi_phu_trach].includes(ME.ho_ten));
    if(mine.length)return mine;
    if(ME.vai_tro==='staff'||ME.vai_tro==='npp_staff')return mine;
  }
  return rows;
}
function mbOrgsCuaToi(){
  if(ME&&ME.ho_ten){
    const mine=ORGS.filter(o=>o.nguoi_phu_trach===ME.ho_ten);
    if(mine.length)return mine;
  }
  return ORGS.filter(o=>o.loai_ban_ghi==='muc_tieu');
}
const mbQL=()=>!!ME&&typeof laNguoiDuyet==='function'&&(laNguoiDuyet()||laNguoiTiepNhan()); // v35.9: chi tang 1+2 co giao dien lanh dao

/* ===== dựng shell ===== */
let MB_CHO=true, MB_LOGIN_NB=false; // splash chờ tự-kết-nối · chế độ đăng nhập nội bộ
window.addEventListener('load',()=>{
  if(!mbLa())return;
  MB_ON=true;document.body.classList.add('mb-mode');
  const sh=document.createElement('div');sh.id='mbApp';
  sh.innerHTML=`
    <div class="mb-head">
      <div class="mb-head-r1">
        <b>Starduct CRM</b>
        <div class="mb-head-acts">
          <button id="mbLang" onclick="mbDoiNgonNgu()">EN</button>
          <button onclick="if(mbEp()){location.href=location.pathname}else{localStorage.setItem('crm_mb_off','1');location.reload()}" title="${T('Bản đầy đủ')}">🖥</button>
        </div>
      </div>
      <div class="mb-head-r2" id="mbUserRow" style="display:none">
        <span id="mbWho"></span>
        <button id="mbOut" onclick="typeof logout==='function'?logout():location.reload()">⏻ ${T('Thoát')}</button>
      </div>
    </div>
    <div id="mbBody"></div>
    <datalist id="mbDealList"></datalist><datalist id="mbOrgList"></datalist>`;
  document.body.appendChild(sh);
  // DẸP các hộp thoại đăng nhập desktop trên mobile — màn đăng nhập riêng lo hết
  try{dlgCfg.showModal=()=>{if(MB_ON)mbRender()}}catch(e){}
  try{dlgLogin.showModal=()=>{if(MB_ON)mbRender()}}catch(e){}
  setTimeout(()=>{MB_CHO=false;if(MB_ON&&!ME)mbRender()},2500); // hết chờ tự kết nối → hiện form
  mbRender();
});
window.addEventListener('load',()=>{
  if(window.matchMedia('(max-width:767px)').matches&&localStorage.getItem('crm_mb_off')==='1'&&!mbEp()){
    const b=document.createElement('button');b.id='mbBack';b.textContent='📱';
    b.title='Bản thu gọn';b.onclick=()=>{localStorage.removeItem('crm_mb_off');location.reload()};
    document.body.appendChild(b);
  }
});
function mbDoiNgonNgu(){
  const lg=LANG==='vi'?'en':'vi';
  if(typeof setLang==='function'){try{setLang(lg)}catch(e){LANG=lg;localStorage.setItem('crm_lang',lg)}}
  else{LANG=lg;localStorage.setItem('crm_lang',lg)}
  mbRender();
}
let MB_SYNC=0;
function mbChon(tab){MB_TAB=tab;mbRender();window.scrollTo(0,0);
  if(tab==='home'&&typeof loadAll==='function'&&sb&&Date.now()-MB_SYNC>60000){MB_SYNC=Date.now();loadAll().catch(()=>{})}}
document.addEventListener('visibilitychange',()=>{ // mở lại app sau khi rời màn hình → tự làm mới
  if(!document.hidden&&MB_ON&&typeof loadAll==='function'&&sb&&Date.now()-MB_SYNC>60000){MB_SYNC=Date.now();loadAll().catch(()=>{})}});

/* ===== render ===== */
if(typeof renderAll==='function'){
  const _renderAll_mb=renderAll;
  renderAll=function(){ _renderAll_mb(); if(MB_ON)mbRender(); };
}
function mbRender(){
  if(!MB_ON)return;
  const el=document.getElementById('mbBody');if(!el)return;
  const who=document.getElementById('mbWho'),row=document.getElementById('mbUserRow');
  if(row)row.style.display=ME?'':'none';
  if(who&&ME)who.textContent='👤 '+ME.ho_ten+(ME.chuc_danh?' · '+ME.chuc_danh:'');
  const lb=document.getElementById('mbLang');
  if(lb)lb.textContent=LANG==='vi'?'EN':'VI';
  if(!ME){mbVeLogin(el);return}
  mbDealList.innerHTML=mbDealsCuaToi().filter(d=>d.stage!=='dong').map(d=>`<option value="${esc(d.ten)}">`).join('');
  mbOrgList.innerHTML=mbOrgsCuaToi().map(o=>`<option value="${esc(o.ten)}">`).join('');
  if(MB_TAB==='home'){mbVeHome(el);return}
  const ql=mbQL();
  // thanh trên cùng của view con: ← Đóng + tiêu đề
  const TT={viec:ql?'✅ '+T('Hôm nay'):'✅ '+T('Việc hôm nay'),
            kq:ql?'🛡 '+T('Phê duyệt'):'📝 '+T('Ghi kết quả'),
            ht:ql?'🆘 '+T('Yêu cầu'):'🆘 '+T('Yêu cầu hỗ trợ'),
            dx:'📨 '+T('Đề xuất'),ghikq:'📝 '+T('Ghi kết quả'),guiht:'🆘 '+T('Yêu cầu hỗ trợ')};
  el.innerHTML=`<div class="mb-viewbar">
    <button onclick="mbChon('home')">← ${T('Đóng')}</button><b>${TT[MB_TAB]||''}</b></div>
    <div id="mbView"></div>`;
  const v=document.getElementById('mbView');
  if(ql){
    if(MB_TAB==='viec')mbQLHomNay(v);
    else if(MB_TAB==='kq')mbQLPheDuyet(v);
    else if(MB_TAB==='ghikq')mbVeKQ(v);
    else if(MB_TAB==='dx')mbVeDX(v);
    else if(MB_TAB==='guiht')mbVeHT(v);
    else mbQLYeuCau(v);
  }else{
    if(MB_TAB==='viec')mbVeViec(v);
    else if(MB_TAB==='kq')mbVeKQ(v);
    else if(MB_TAB==='dx')mbVeDX(v);
    else mbVeHT(v);
  }
}
/* ===== MÀN ĐĂNG NHẬP MOBILE (một màn duy nhất, không hộp thoại chồng) ===== */
function mbVeLogin(el){
  if(MB_CHO){ // đang chờ tự kết nối phiên cũ
    el.innerHTML=`<div class="mb-login"><div class="mb-logo">SD</div>
      <h2>Starduct CRM</h2><div class="mb-sub" style="text-align:center">${T('Đang khởi động…')}</div>
      <div class="mb-spin"></div></div>`;return}
  el.innerHTML=`<div class="mb-login">
    <div class="mb-logo">SD</div>
    <h2>Starduct CRM</h2>
    <div class="mb-sub" style="text-align:center;margin-bottom:18px">${T('Hệ thống quản trị quan hệ khách hàng')}</div>
    ${MB_LOGIN_NB?`
      <label>${T('User name')}</label>
      <input id="mbLgU" autocomplete="username" placeholder="user name">
      <label>${T('Mật khẩu')}</label>
      <input id="mbLgP" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')mbDangNhap()">
    `:`
      <label>${T('Email')}</label>
      <input id="mbLgU" type="email" autocomplete="email" placeholder="ten@nsca.vn" inputmode="email">
      <label>${T('Mật khẩu')}</label>
      <input id="mbLgP" type="password" autocomplete="current-password" onkeydown="if(event.key==='Enter')mbDangNhap()">
    `}
    <button class="mb-btn" onclick="mbDangNhap()">${T('ĐĂNG NHẬP')}</button>
    <div class="mb-sub" id="mbLgMsg" style="text-align:center;min-height:18px"></div>
    <a href="javascript:void(0)" class="mb-lgswitch" onclick="MB_LOGIN_NB=!MB_LOGIN_NB;mbRender()">
      ${MB_LOGIN_NB?T('Dùng đăng nhập email'):T('Dùng tài khoản nội bộ (user name)?')}</a>
  </div>`;
}
async function mbDangNhap(){
  const u=mbLgU.value.trim(),p=mbLgP.value;
  const msg=document.getElementById('mbLgMsg');
  if(!u||!p){msg.textContent='⚠ '+T('Sai email hoặc mật khẩu');return}
  msg.textContent=T('Đang đăng nhập…');
  try{
    if(MB_LOGIN_NB){
      lgU.value=u;lgP.value=p;
      await doLogin();
      if(!ME)msg.textContent='❌ '+(lgMsg.textContent||T('Sai email hoặc mật khẩu'));
    }else{
      cfgEmail.value=u;cfgPass.value=p;
      await connect();
      if(!ME)msg.textContent='❌ '+((cfgMsg.textContent||'').replace(/^.*?:/,'')||T('Sai email hoặc mật khẩu'));
    }
  }catch(e){msg.textContent='❌ '+e.message}
  if(ME)mbRender();
}

/* ===== MÀN HÌNH CHÍNH: 3 Ô LỚN ===== */
function mbVeHome(el){
  const today=new Date().toISOString().slice(0,10);
  const ql=mbQL();
  let o1,o2,o3;
  if(ql){
    const tps=ALL_TPS.filter(x=>x.ngay===today).length;
    const apr=(window.APRQ||[]).length;
    const mo=ALL_HTS.filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly').length;
    o1={ic:'✅',tt:T('Hôm nay'),sub:tps+' '+T('tiếp xúc toàn hệ thống hôm nay'),n:tps,mau:'#0f4c81'};
    o2={ic:'🛡',tt:T('Phê duyệt'),sub:apr+' '+T('đề xuất chờ bạn duyệt'),n:apr,mau:'#d97706'};
    o3={ic:'🆘',tt:T('Yêu cầu'),sub:mo+' '+T('yêu cầu hỗ trợ đang mở'),n:mo,mau:'#dc2626'};
  }else{
    const mine=mbDealsCuaToi().filter(d=>d.stage!=='dong');
    const due=mine.filter(d=>d.next_action&&d.next_action_han&&d.next_action_han<=today).length;
    const myReq=ALL_HTS.filter(h=>h.nguoi_yeu_cau===ME.ho_ten&&(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly')).length;
    o1={ic:'✅',tt:T('Việc hôm nay'),sub:due+' '+T('dự án quá hạn / đến hạn'),n:due,mau:due?'#dc2626':'#16a34a'};
    o2={ic:'📨',tt:T('Đề xuất'),sub:T('gửi & theo dõi đề xuất'),n:'',mau:'#0f4c81'};
    o3={ic:'🆘',tt:T('Yêu cầu hỗ trợ'),sub:T('gửi & theo dõi yêu cầu'),n:myReq,mau:'#d97706'};
  }
  const O=(o,k)=>`<button class="mb-tile" style="border-left:8px solid ${o.mau}" onclick="mbChon('${k}')">
    <span class="mb-tile-ic">${o.ic}</span>
    <span class="mb-tile-tx"><b>${o.tt}</b><small>${o.sub}</small></span>
    ${o.n!==''&&o.n>0?`<span class="mb-tile-n" style="background:${o.mau}">${o.n}</span>`:''}
  </button>`;
  const ngay=new Date().toLocaleDateString(LANG==='en'?'en-GB':'vi-VN',
    {weekday:'long',day:'numeric',month:'numeric',year:'numeric'});
  el.innerHTML=`<div class="mb-greet">
      <b>${T('Chào')} ${esc((ME.ho_ten||'').split(' ').pop())} 👋</b>
      <span>${ngay.charAt(0).toUpperCase()+ngay.slice(1)}</span>
    </div>
    <div class="mb-home">${O(o1,'viec')}${O(o2,ql?'kq':'dx')}${O(o3,'ht')}</div>
    ${ql?`<div class="mb-sub" style="margin:12px 4px 6px"><b>${T('Tác nghiệp của tôi')}</b></div>
    <div style="display:flex;gap:8px">
      <button class="mb-mini" style="flex:1;padding:12px 4px" onclick="mbChon('ghikq')">📝 ${T('Ghi kết quả')}</button>
      <button class="mb-mini" style="flex:1;padding:12px 4px" onclick="mbChon('dx')">📨 ${T('Đề xuất')}</button>
      <button class="mb-mini" style="flex:1;padding:12px 4px" onclick="mbChon('guiht')">🆘 ${T('Gửi yêu cầu')}</button>
    </div>`:''}`;
}

/* ===== NHÂN VIÊN · VIỆC HÔM NAY ===== */
function mbVeViec(el){
  const today=new Date().toISOString().slice(0,10);
  const in7=new Date(Date.now()+7*864e5).toISOString().slice(0,10);
  const mine=mbDealsCuaToi().filter(d=>d.stage!=='dong');
  const qua=mine.filter(d=>d.next_action&&d.next_action_han&&d.next_action_han<today);
  const nay=mine.filter(d=>d.next_action&&d.next_action_han===today);
  const toi7=mine.filter(d=>d.next_action&&d.next_action_han>today&&d.next_action_han<=in7);
  const dung=typeof laDungYen==='function'?mine.filter(laDungYen):[];
  const item=(d,mau)=>`<div class="mb-item" style="border-left:4px solid ${mau}">
    <div onclick="openWorkspace&&openWorkspace('${d.id}')">
      <b>${esc(d.ten)}</b>
      <div class="mb-sub">${esc(d.next_action||T('(chưa có việc tiếp theo)'))}${d.next_action_han?' · <b>'+d.next_action_han+'</b>':''}</div>
      <div class="mb-sub">${esc(d.npp_chi_dinh||d.cdt_text||'')}</div>
    </div>
    <button class="mb-mini" onclick="mbGhiKQ('${esc(d.ten)}')">📝 ${T('Ghi KQ')}</button>
  </div>`;
  const sec=(tt,arr,mau)=>arr.length?`<div class="mb-card"><h3>${tt} (${arr.length})</h3>${arr.slice(0,20).map(d=>item(d,mau)).join('')}</div>`:'';
  el.innerHTML=
    `<button class="btn pri" style="width:100%;padding:12px;margin-bottom:10px;border-radius:12px" onclick="mbChon('kq')">📝 ${T('Ghi kết quả')}</button>`+
    sec('🔴 '+T('QUÁ HẠN'),qua,'#dc2626')+
    sec('🟡 '+T('HÔM NAY'),nay,'#d97706')+
    sec('🟢 '+T('7 NGÀY TỚI'),toi7,'#16a34a')+
    sec('🛑 '+T('ĐỨNG YÊN >21 NGÀY'),dung,'#94a3b8')+
    ((qua.length+nay.length+toi7.length+dung.length)?'':`<div class="mb-card"><div class="notice">🎉 ${T('Không có việc đến hạn — mở ô Ghi kết quả để ghi tiếp xúc.')}</div></div>`)+
    `<div class="mb-card"><div class="mb-sub">${T('Bạn phụ trách')} <b>${mine.length}</b> ${T('dự án đang mở. Bấm vào dự án để mở Workspace đầy đủ.')}</div></div>`;
}
function mbGhiKQ(tenDeal){mbChon('kq');setTimeout(()=>{const i=document.getElementById('mbDeal');if(i){i.value=tenDeal;i.scrollIntoView()}},80)}

/* ===== NHÂN VIÊN · GHI KẾT QUẢ ===== */
function mbVeKQ(el){
  const today=new Date().toISOString().slice(0,10);
  const cuaToi=ALL_TPS.filter(x=>x.nguoi_thuc_hien===ME.ho_ten&&x.ngay===today);
  const loaiOpts=document.getElementById('txLoai')?.innerHTML||'<option value="gap_truc_tiep">Gặp trực tiếp</option>';
  el.innerHTML=`<div class="mb-card">
    <h3>📝 ${T('Ghi kết quả làm việc')}</h3>
    ${mbKeHoachNgay().fallback?`<div class="mb-sub" style="margin-bottom:6px">${T('Chưa có hành động nào được kế hoạch đẩy cho hôm nay — danh sách hiện các việc 7 ngày tới.')}</div>`:''}
    <label>${T('Dự án theo kế hoạch hôm nay')} *</label>
    <select id="mbDeal"><option value="">— ${T('Chọn dự án')} —</option>${mbKHNgayOpts()}</select>
    <label>${T('Hoặc / và Khách hàng-Đối tác')}</label>
    <select id="mbOrg"><option value="">— ${T('Chọn khách hàng/đối tác')} —</option>${mbKHNgayOrgs()}</select>
    <label>${T('Hình thức')}</label>
    <select id="mbLoai">${loaiOpts}</select>
    <label class="mb-check"><input type="checkbox" id="mbQD"> ${T('Gặp CẤP RA QUYẾT ĐỊNH')}</label>
    <label>${T('Kết quả / nội dung')} *</label>
    <textarea id="mbND" placeholder="${T('VD: đã trình mẫu VAV, TVTK đồng ý đưa vào spec…')}"></textarea>
    <label>${T('Việc tiếp theo')}</label>
    <input id="mbBTT" placeholder="${T('VD: gửi báo giá trước thứ 6')}">
    <label>${T('Hạn việc tiếp theo')}</label>
    <input id="mbHanBTT" type="date">
    <label>${T('Ảnh hiện trạng / minh chứng (tuỳ chọn)')}</label>
    <input id="mbFile" type="file" accept="image/*,.pdf" capture="environment">
    <button class="mb-btn" onclick="mbLuuKQ()">💾 ${T('LƯU KẾT QUẢ')}</button>
    <div class="mb-sub" id="mbKQMsg"></div>
  </div>
  <div class="mb-card"><h3>${T('Đã ghi hôm nay')} (${cuaToi.length})</h3>
    ${cuaToi.length?cuaToi.map(x=>{const o=ORGS.find(z=>z.id===x.org_id);const d=x.deal_id?DEALS.find(z=>z.id===x.deal_id):null;
      return `<div class="mb-item"><div><b>${esc(d?.ten||o?.ten||'—')}</b>
      <div class="mb-sub">${esc((x.noi_dung||'').slice(0,90))}</div></div></div>`}).join('')
    :'<div class="mb-sub">'+T('Chưa có — kết quả bạn lưu sẽ hiện ở đây và trên desktop của quản lý.')+'</div>'}
  </div>`;
}
async function mbLuuKQ(){
  const msg=document.getElementById('mbKQMsg');
  const deal=DEALS.find(d=>d.ten===mbDeal.value.trim());
  let org=ORGS.find(o=>o.ten===mbOrg.value.trim());
  if(!deal&&!org){msg.textContent='⚠ '+T('Chọn ít nhất Dự án hoặc Khách hàng trong danh sách');return}
  if(!mbND.value.trim()){msg.textContent='⚠ '+T('Chưa ghi kết quả/nội dung');return}
  if(!org&&deal&&deal.cdt_text)org=ORGS.find(o=>o.ten===deal.cdt_text)||null;
  msg.textContent=T('Đang lưu…');
  const rec={ngay:new Date().toISOString().slice(0,10),loai:mbLoai.value,
    nguoi_thuc_hien:ME.ho_ten,la_cap_ra_quyet_dinh:mbQD.checked,
    noi_dung:mbND.value.trim(),buoc_tiep_theo:mbBTT.value.trim()||null,
    han_buoc_tiep_theo:mbHanBTT.value||null,org_id:org?.id||null};
  let r=deal?await sb.from('crm_touchpoints').insert({...rec,deal_id:deal.id}):{error:{message:'x'}};
  if(!deal)r=await sb.from('crm_touchpoints').insert(rec);
  else if(r.error&&/deal_id/.test(r.error.message))r=await sb.from('crm_touchpoints').insert(rec);
  if(r.error){msg.textContent='❌ '+r.error.message;return}
  if(deal){
    const patch={lan_cap_nhat_cuoi:new Date().toISOString(),nguoi_cap_nhat:ME.ho_ten};
    if(mbBTT.value.trim()){patch.next_action=mbBTT.value.trim();patch.next_action_han=mbHanBTT.value||null}
    await sb.from('crm_deals').update(patch).eq('id',deal.id);
    const f=mbFile.files[0];
    if(f){const path=`deals/${deal.id}/${Date.now()}_${f.name.replace(/[^\w.\-]+/g,'_')}`;
      const up=await sb.storage.from('minh-chung').upload(path,f,{upsert:true});
      if(!up.error){const url=sb.storage.from('minh-chung').getPublicUrl(path).data.publicUrl;
        await sb.from('crm_deals').update({file_minh_chung_url:url}).eq('id',deal.id)}}
  }
  msg.textContent='✓ '+T('Đã lưu & đồng bộ vào ')+esc(deal?.ten||org?.ten||'');
  mbND.value='';mbBTT.value='';mbHanBTT.value='';mbFile.value='';
  await loadAll();
}

/* ===== NHÂN VIÊN · HỖ TRỢ ===== */
function mbVeHT(el){
  const bpOpts=document.getElementById('htBP')?.innerHTML||'';
  const loaiOpts=document.getElementById('htLoai')?.innerHTML||'<option value="khac">Khác</option>';
  const utOpts=document.getElementById('htUT')?.innerHTML||'<option value="binh_thuong">Bình thường</option>';
  const cuaToi=ALL_HTS.filter(h=>h.nguoi_yeu_cau===ME.ho_ten).slice(0,15);
  const today=new Date().toISOString().slice(0,10);
  el.innerHTML=`<div class="mb-card">
    <h3>🆘 ${T('Gửi yêu cầu hỗ trợ')}</h3>
    <label>${T('Dự án theo kế hoạch hôm nay')} *</label>
    <select id="mbHtDeal"><option value="">— ${T('Chọn dự án')} —</option>${mbKHNgayOpts()}</select>
    <label>${T('Gửi tới bộ phận')}</label><select id="mbHtBP">${bpOpts}</select>
    <label>${T('Loại yêu cầu')}</label><select id="mbHtLoai">${loaiOpts}</select>
    <label>${T('Nội dung cần hỗ trợ')} *</label>
    <textarea id="mbHtND" placeholder="${T('VD: cần bản vẽ submittal VAV cho dự án X trước thứ 5…')}"></textarea>
    <label>${T('Mức ưu tiên')}</label><select id="mbHtUT">${utOpts}</select>
    <button class="mb-btn" onclick="mbGuiHT()">📨 ${T('GỬI YÊU CẦU')}</button>
    <div class="mb-sub" id="mbHtMsg"></div>
  </div>
  <div class="mb-card"><h3>${T('Yêu cầu của tôi')} (${cuaToi.length})</h3>
    ${cuaToi.length?cuaToi.map(h=>{const d=DEALS.find(z=>z.id===h.deal_id);
      const late=(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly')&&h.han&&h.han<today;
      const tt=h.trang_thai==='da_xong'?'✅':h.trang_thai==='tu_choi'?'❌':late?'⚠️':'⏳';
      return `<div class="mb-item"><button class="mb-mini" style="float:right" onclick="mbMoThr('support','${h.id}','ht')">💬 ${T('Trả lời')}</button><div><b>${tt} ${esc((h.noi_dung||'').slice(0,60))}</b>
      <div class="mb-sub">${esc(d?.ten||'')} · ${T('hạn')} ${h.han||'—'} · ${h.nguoi_xu_ly?esc(h.nguoi_xu_ly):T('chưa ai nhận')}</div></div></div>`}).join('')
    :'<div class="mb-sub">'+T('Chưa gửi yêu cầu nào.')+'</div>'}
  </div>`;
}
async function mbGuiHT(){
  const msg=document.getElementById('mbHtMsg');
  if(!mbHtND.value.trim()){msg.textContent='⚠ '+T('Chưa ghi nội dung');return}
  const deal=DEALS.find(d=>d.ten===mbHtDeal.value.trim());
  if(!deal){msg.textContent='⚠ '+T('Chọn trong danh sách để gắn đúng dự án');return}
  msg.textContent=T('Đang gửi…');
  const r=await sb.from('crm_support_requests').insert({deal_id:deal?.id||null,
    nguoi_yeu_cau:ME.ho_ten,bo_phan_nhan:mbHtBP.value,loai:mbHtLoai.value,
    noi_dung:mbHtND.value.trim(),muc_uu_tien:mbHtUT.value,
    han:new Date(Date.now()+2*864e5).toISOString().slice(0,10)});
  if(r.error){msg.textContent='❌ '+r.error.message;return}
  msg.textContent='✓ '+T('Đã gửi — hậu phương sẽ thấy ngay trên desktop');
  mbHtND.value='';await loadAll();
}

/* ===== LÃNH ĐẠO · HÔM NAY TOÀN HỆ THỐNG ===== */
function mbQLHomNay(el){
  const today=new Date().toISOString().slice(0,10);
  const tps=ALL_TPS.filter(x=>x.ngay===today);
  const qd=tps.filter(x=>x.la_cap_ra_quyet_dinh);
  const htMo=ALL_HTS.filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly');
  const KPI=(v,l,mau)=>`<div class="mb-kpi" style="border-top:3px solid ${mau}"><b>${v}</b><span>${l}</span></div>`;
  el.innerHTML=`<div class="mb-kpis">
      ${KPI(tps.length,T('tiếp xúc hôm nay'),'#0f4c81')}
      ${KPI(qd.length,T('gặp cấp QĐ'),'#16a34a')}
      ${KPI((window.APRQ||[]).length,T('chờ phê duyệt'),'#d97706')}
      ${KPI(htMo.length,T('hỗ trợ đang mở'),'#dc2626')}
    </div>
    <div class="mb-card"><h3>🤝 ${T('Hôm nay ai tiếp xúc với ai')}</h3>
    ${tps.length?tps.map(x=>{const o=ORGS.find(z=>z.id===x.org_id);const d=x.deal_id?DEALS.find(z=>z.id===x.deal_id):null;
      return `<div class="mb-item"><div>
        <b>${esc(x.nguoi_thuc_hien||'?')}</b> → ${esc(d?.ten||o?.ten||'—')}
        ${x.la_cap_ra_quyet_dinh?' <span class="pill p3">'+T('cấp QĐ')+'</span>':''}
        <div class="mb-sub">${esc((x.noi_dung||'').slice(0,90))}</div>
      </div></div>`}).join('')
    :'<div class="mb-sub">'+T('Chưa có tiếp xúc nào được ghi hôm nay.')+'</div>'}
    </div>
    <div class="mb-card"><div class="mb-sub">${T('Báo cáo, doanh thu, KPI chi tiết — xem trên máy tính. Bản mobile lãnh đạo chỉ gói gọn: hôm nay ai làm gì, có gì chờ bạn duyệt.')}</div></div>`;
}

/* ===== LÃNH ĐẠO · PHÊ DUYỆT ===== */
async function mbQLPheDuyet(el){
  el.innerHTML='<div class="mb-card"><div class="mb-sub">'+T('Đang tải hàng chờ…')+'</div></div>';
  const r=await sb.from('crm_approvals').select('*').order('created_at',{ascending:false}).limit(50);
  if(r.error){el.innerHTML='<div class="mb-card"><div class="notice warn">'+esc(r.error.message)+'</div></div>';return}
  const cho=(r.data||[]).filter(a=>a.trang_thai!=='da_duyet'&&a.trang_thai!=='tu_choi');
  window.__MB_APR=cho;
  el.innerHTML=`<div class="mb-card"><h3>🛡 ${T('Chờ phê duyệt')} (${cho.length})</h3>
  ${cho.length?cho.map((a,i)=>{const wait=Math.round((Date.now()-new Date(a.created_at))/864e5);
    const co=typeof coQuyenDuyet==='function'&&coQuyenDuyet(a.cap_duyet);
    return `<div class="mb-item" style="flex-direction:column;align-items:stretch">
      <div><b>${(typeof APR_LOAI!=='undefined'&&APR_LOAI[a.loai])||a.loai}</b>
        <span class="pill ${wait>14?'p3':'p1'}">${T('chờ')} ${wait} ${T('ngày')}</span>
        <span class="tag">${(a.cap_duyet||'').toUpperCase()}</span>
        <div class="mb-sub"><b>${esc(a.nguoi_de_xuat||'')}</b>: ${esc((a.noi_dung||'').slice(0,140))}</div>
      </div>
      ${co?`<input id="mbYk_${i}" placeholder="${T('Ý kiến (bác thì bắt buộc)')}" style="margin-top:8px">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="mb-mini" style="flex:1;color:#16a34a;border-color:#16a34a" onclick="mbDuyet(${i},'da_duyet')">✔ ${T('Duyệt')}</button>
        <button class="mb-mini" style="flex:1;color:#dc2626;border-color:#dc2626" onclick="mbDuyet(${i},'tu_choi')">✘ ${T('Từ chối')}</button>
      </div>`:`<div class="mb-sub">${T('chờ cấp')} ${(a.cap_duyet||'').toUpperCase()} ${T('duyệt')}</div>`}
    </div>`}).join('')
  :'<div class="mb-sub">🎉 '+T('Hàng chờ trống — không có gì cần bạn duyệt.')+'</div>'}
  </div>`;
}
async function mbDuyet(i,tt){
  const a=(window.__MB_APR||[])[i];if(!a)return;
  const yk=(document.getElementById('mbYk_'+i)?.value||'').trim();
  if(tt==='tu_choi'&&!yk){alert(T('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  const r=await sb.from('crm_approvals').update({trang_thai:tt,nguoi_duyet:ME.ho_ten,
    y_kien_duyet:yk||null,decided_at:new Date().toISOString()}).eq('id',a.id);
  if(r.error){alert(r.error.message);return}
  if(a.doi_tuong==='plan')
    await sb.from('crm_plans').update({trang_thai:tt==='da_duyet'?'da_duyet':'tu_choi'}).eq('id',a.doi_tuong_id);
  if(typeof loadAprQueue==='function')await loadAprQueue();
  mbRender();
}

/* ===== LÃNH ĐẠO · YÊU CẦU MỞ ===== */
function mbQLYeuCau(el){
  const today=new Date().toISOString().slice(0,10);
  const mo=ALL_HTS.filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly');
  const agg={};
  for(const h of mo){const k=h.bo_phan_nhan||'khac';agg[k]=agg[k]||{n:0,qh:0};agg[k].n++;if(h.han&&h.han<today)agg[k].qh++}
  el.innerHTML=`<div class="mb-kpis">
    ${Object.entries(agg).map(([k,v])=>`<div class="mb-kpi" style="border-top:3px solid ${v.qh?'#dc2626':'#0f4c81'}">
      <b>${v.n}</b><span>${(typeof BP!=='undefined'&&BP[k])||k}${v.qh?' · ⚠'+v.qh:''}</span></div>`).join('')||''}
  </div>
  <div class="mb-card"><h3>🆘 ${T('Yêu cầu đang mở')} (${mo.length})</h3>
  ${(window.__MB_HTQ=mo)&&''}
  ${mo.length?mo.slice(0,25).map((h,i)=>{const d=DEALS.find(z=>z.id===h.deal_id);
    const late=h.han&&h.han<today;
    const xuly=laNguoiTiepNhan();
    return `<div class="mb-item" style="flex-direction:column;align-items:stretch"><div>
      <b>${late?'⚠️ ':''}${esc((h.noi_dung||'').slice(0,80))}</b>
      <div class="mb-sub">${esc(h.nguoi_yeu_cau||'')} → ${(typeof BP!=='undefined'&&BP[h.bo_phan_nhan])||h.bo_phan_nhan}
      ${d?' · '+esc(d.ten):''} · ${T('hạn')} ${h.han||'—'}${h.nguoi_xu_ly?' · 👤 '+esc(h.nguoi_xu_ly):''}</div>
    </div>
    ${xuly?`<input id="mbHtYk_${i}" placeholder="${T('Ý kiến / phản hồi (bác thì bắt buộc)')}" style="margin-top:8px">
    <div style="display:flex;gap:6px;margin-top:8px">
      <button class="mb-mini" style="flex:1;color:#0f4c81;border-color:#0f4c81" onclick="mbXuLyHT(${i},'dang_xu_ly')">✔ ${T('Chấp nhận')}</button>
      <button class="mb-mini" style="flex:1;color:#16a34a;border-color:#16a34a" onclick="mbXuLyHT(${i},'da_xong')">✅ ${T('Đã xong')}</button>
      <button class="mb-mini" style="flex:1;color:#dc2626;border-color:#dc2626" onclick="mbXuLyHT(${i},'tu_choi')">✘ ${T('Từ chối')}</button>
      <button class="mb-mini" onclick="mbMoThr('support','${h.id}','ht')">💬</button>
    </div>`:''}
    </div>`}).join('')
  :'<div class="mb-sub">'+T('Không có yêu cầu nào đang mở.')+'</div>'}
  </div>
  <div class="mb-card"><div class="mb-sub">${T('Phân xử chi tiết / gán người xử lý — làm trên desktop, tab Hỗ trợ.')}</div></div>`;
}

/* ===== NÚT 📱 TRÊN DESKTOP: chia sẻ link mobile ===== */
window.addEventListener('load',()=>{
  if(mbLa())return;
  const conn=document.querySelector('header .conn');
  if(!conn||document.getElementById('mbShareBtn'))return;
  const b=document.createElement('button');
  b.className='btn';b.id='mbShareBtn';b.textContent='📱 Mobile';
  b.title=t('Mở bản mobile / lấy link gửi cho nhân sự');
  b.onclick=mbShareDlg;
  conn.insertBefore(b,conn.firstChild);
});
function mbShareDlg(){
  let dlg=document.getElementById('dlgMbShare');
  if(!dlg){
    dlg=document.createElement('dialog');dlg.id='dlgMbShare';dlg.style.maxWidth='460px';
    dlg.innerHTML=`<div class="dhead">📱 ${t('Bản mobile — tác nghiệp hiện trường')}
      <button class="btn" onclick="dlgMbShare.close()">✕</button></div>
    <div class="dbody">
      <div class="notice">${t('Gửi link này cho nhân sự / NPP qua Zalo, email… Mở trên điện thoại (hoặc bất kỳ đâu) sẽ ra thẳng bản mobile. Trên điện thoại nên bấm "Thêm vào màn hình chính" để dùng như app.')}</div>
      <input id="mbLinkBox" readonly value="${MB_LINK()}" style="width:100%;font-size:13px" onclick="this.select()">
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn pri" style="flex:1" onclick="mbCopyLink()">📋 ${t('Sao chép link')}</button>
        <button class="btn" style="flex:1" onclick="window.open(MB_LINK(),'mbPreview','width=400,height=860')">👁 ${t('Mở xem thử')}</button>
      </div>
      <div class="muted" id="mbCopyMsg" style="margin-top:8px"></div>
    </div>`;
    document.body.appendChild(dlg);
  }
  dlg.showModal();
}
async function mbCopyLink(){
  try{await navigator.clipboard.writeText(MB_LINK());
    document.getElementById('mbCopyMsg').textContent='✓ '+t('Đã sao chép — dán vào Zalo/email để gửi');}
  catch(e){document.getElementById('mbLinkBox').select();document.execCommand('copy');
    document.getElementById('mbCopyMsg').textContent='✓ '+t('Đã chọn sẵn — nhấn Ctrl+C để sao chép');}
}


/* ===== NHÂN VIÊN · ĐỀ XUẤT (v35.8) — gửi đề xuất lên cấp duyệt & theo dõi ===== */
async function mbVeDX(el){
  el.innerHTML='<div class="mb-card">'+T('Đang tải…')+'</div>';
  let rows=[];
  try{const r=await sb.from('crm_approvals').select('*').eq('nguoi_de_xuat',ME.ho_ten)
    .order('created_at',{ascending:false}).limit(20);rows=r.data||[]}catch(e){}
  const TTA={cho_duyet:['⏳ '+T('Chờ duyệt'),'#d97706'],da_duyet:['✅ '+T('Đã duyệt'),'#16a34a'],tu_choi:['✗ '+T('Bị từ chối'),'#dc2626']};
  el.innerHTML=`
  <div class="mb-card"><h3>📨 ${T('Gửi đề xuất mới')}</h3>
    <label>${T('Gắn vào dự án / khách hàng')} *</label>
    <select id="dxGan" style="width:100%;margin-bottom:8px"><option value="">— ${T('Chọn dự án')} —</option>
      <optgroup label="🎯 ${T('Dự án theo kế hoạch hôm nay')}">${mbKeHoachNgay().rows.map(x=>`<option value="deal:${x.id}">${esc(x.ten)}</option>`).join('')}</optgroup>
      <optgroup label="👥 ${T('Khách hàng-Đối tác')}">${(()=>{const ten=new Set();mbKeHoachNgay().rows.forEach(x=>{if(x.cdt_text)ten.add(x.cdt_text);if(x.npp_chi_dinh)ten.add(x.npp_chi_dinh)});const l=ORGS.filter(o=>ten.has(o.ten));return(l.length?l:mbOrgsCuaToi().slice(0,30)).map(o=>`<option value="org:${o.id}">${esc(o.ten)}</option>`).join('')})()}</optgroup></select>
    <select id="dxCap" style="width:100%;margin-bottom:8px">
      <option value="manager">${T('Cấp duyệt: Manager')}</option>
      <option value="ceo">${T('Cấp duyệt: CEO')}</option></select>
    <textarea id="dxND" style="width:100%;min-height:70px" placeholder="${T('Đề xuất gì, căn cứ gì…')} *"></textarea>
    <button class="btn pri" style="width:100%;padding:12px;margin-top:8px;border-radius:12px" onclick="mbGuiDX()">${T('Gửi đề xuất')}</button>
    <div class="mb-sub" id="dxMsg"></div></div>
  <div class="mb-card"><h3>${T('Đề xuất của tôi')}</h3>
    ${rows.map(a=>{const s=TTA[a.trang_thai]||[a.trang_thai||'—','#64748b'];
      const neo=a.doi_tuong==='deal'?(ALL_DEALS.find(x=>x.id===a.doi_tuong_id)?.ten):(a.doi_tuong==='org'?(ALL_ORGS.find(x=>x.id===a.doi_tuong_id)?.ten):null);
      const thr=(a.doi_tuong==='deal'||a.doi_tuong==='org')?`<button class="mb-mini" style="float:right" onclick="mbMoThr('${a.doi_tuong}','${a.doi_tuong_id}','dx')">💬 ${T('Trả lời')}</button>`:'';
      return `<div style="padding:8px 0;border-bottom:1px solid #eef2f7">${thr}
        <div style="font-size:13px">${neo?'<b>'+esc(neo)+'</b> · ':''}${esc(a.noi_dung||'')}</div>
        <div class="mb-sub"><b style="color:${s[1]}">${s[0]}</b> · ${(a.created_at||'').slice(0,10)}${a.y_kien_duyet?' · 💬 '+esc(a.y_kien_duyet):''}</div>
      </div>`}).join('')||'<div class="mb-sub">'+T('Chưa có đề xuất nào.')+'</div>'}
  </div>`;
}
async function mbGuiDX(){
  const nd=document.getElementById('dxND').value.trim(),m=document.getElementById('dxMsg');
  const gan=document.getElementById('dxGan').value;
  if(!gan){m.textContent='⚠ '+T('Chọn trong danh sách để gắn đúng dự án');return}
  if(!nd){m.textContent='⚠ '+T('Đề xuất gì, căn cứ gì…');return}
  m.textContent=T('Đang gửi…');
  const [dt,did]=gan.split(':');
  const han=new Date(Date.now()+14*864e5).toISOString().slice(0,10);
  const r=await sb.from('crm_approvals').insert({doi_tuong:dt,doi_tuong_id:did,loai:'khac',
    cap_duyet:document.getElementById('dxCap').value,nguoi_de_xuat:ME.ho_ten,noi_dung:nd,han});
  if(r.error){m.textContent=r.error.message;return}
  mbVeDX(document.getElementById('mbView'));
}


/* ===== v35.9 · TRAO ĐỔI 2 CHIỀU (crm_comments) + XỬ LÝ YÊU CẦU ===== */
async function mbMoThr(dt,id,back,ten){
  window.__MB_THR={dt,id,back,ten:ten||''};
  const el=document.getElementById('mbView');if(!el)return;
  el.innerHTML='<div class="mb-card">'+T('Đang tải…')+'</div>';
  const r=await sb.from('crm_comments').select('*').eq('doi_tuong',dt).eq('doi_tuong_id',id).order('created_at');
  const cmts=r.data||[];
  el.innerHTML=`<div class="mb-card"><h3>💬 ${T('Phản hồi & trao đổi')}</h3>
    ${cmts.map(c=>`<div style="padding:7px 0;border-bottom:1px solid #eef2f7">
      <b style="font-size:12.5px;color:${c.nguoi_viet===ME.ho_ten?'#0f4c81':'#111'}">${esc(c.nguoi_viet||'')}</b>
      <span class="mb-sub"> · ${(c.created_at||'').slice(0,10)}</span>
      <div style="font-size:13px">${esc(c.noi_dung||'')}</div></div>`).join('')
    ||'<div class="mb-sub">'+T('Chưa có phản hồi nào.')+'</div>'}
    <textarea id="thrND" style="width:100%;min-height:56px;margin-top:8px" placeholder="${T('Nội dung… *')}"></textarea>
    <button class="btn pri" style="width:100%;padding:11px;margin-top:8px;border-radius:12px" onclick="mbGuiThr()">📨 ${T('Gửi trả lời')}</button>
    <button class="mb-mini" style="width:100%;margin-top:8px" onclick="mbChon('${back}')">← ${T('Đóng')}</button>
  </div>`;
}
async function mbGuiThr(){
  const nd=document.getElementById('thrND').value.trim();if(!nd)return;
  const t=window.__MB_THR;
  const r=await sb.from('crm_comments').insert({doi_tuong:t.dt,doi_tuong_id:t.id,nguoi_viet:ME.ho_ten,noi_dung:nd});
  if(r.error){alert(r.error.message);return}
  mbMoThr(t.dt,t.id,t.back,t.ten);
}
async function mbXuLyHT(i,tt){
  const h=(window.__MB_HTQ||[])[i];if(!h)return;
  const yk=(document.getElementById('mbHtYk_'+i)?.value||'').trim();
  if(tt==='tu_choi'&&!yk){alert(T('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  const patch={trang_thai:tt};if(tt==='dang_xu_ly')patch.nguoi_xu_ly=ME.ho_ten;
  const r=await sb.from('crm_support_requests').update(patch).eq('id',h.id);
  if(r.error){alert(r.error.message);return}
  if(yk)await sb.from('crm_comments').insert({doi_tuong:'support',doi_tuong_id:h.id,nguoi_viet:ME.ho_ten,noi_dung:yk});
  if(typeof loadAll==='function')await loadAll();
  mbRender();
}
