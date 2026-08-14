/* ==========================================================================
   CRM — NSCA / Starduct   ·   v28 GIAO DIỆN MOBILE TÁC NGHIỆP RIÊNG
   Trên điện thoại (≤767px) KHÔNG dùng giao diện desktop thu nhỏ nữa —
   thay bằng shell riêng 3 tab lớn, gắn với KẾ HOẠCH CỦA TỪNG NHÂN SỰ:
   · ✅ VIỆC HÔM NAY : dự án TÔI phụ trách — quá hạn / hôm nay / sắp tới / đứng yên
   · 📝 KQ HÔM NAY   : ghi kết quả làm việc — CHỌN dự án/khách trong danh sách
     được phân công → lưu tiếp xúc + cập nhật việc-tiếp-theo + minh chứng
     → desktop thấy ngay trong đúng dự án/khách đó
   · 🆘 HỖ TRỢ       : gửi yêu cầu về hậu phương + theo dõi trạng thái của tôi
   Nút 🖥 chuyển về bản đầy đủ khi cần (ghi nhớ lựa chọn).
   ========================================================================== */

let MB_ON=false, MB_TAB='viec';

function mbLa(){return window.matchMedia('(max-width:767px)').matches&&localStorage.getItem('crm_mb_off')!=='1'}

/* ===== phạm vi "CỦA TÔI" — theo phân công ===== */
function mbDealsCuaToi(){
  let rows=typeof phamViNPP==='function'?phamViNPP(DEALS):DEALS;
  if(ME&&ME.ho_ten){
    const mine=rows.filter(d=>[d.owner,d.nguoi_phu_trach].includes(ME.ho_ten));
    if(mine.length)return mine;
    if(ME.vai_tro==='staff'||ME.vai_tro==='npp_staff')return mine; // staff: đúng phạm vi, kể cả rỗng
  }
  return rows; // quản lý / chưa phân công → nhìn toàn cảnh
}
function mbOrgsCuaToi(){
  if(ME&&ME.ho_ten){
    const mine=ORGS.filter(o=>o.nguoi_phu_trach===ME.ho_ten);
    if(mine.length)return mine;
  }
  return ORGS.filter(o=>o.loai_ban_ghi==='muc_tieu');
}

/* ===== dựng shell ===== */
window.addEventListener('load',()=>{
  if(!mbLa())return;
  MB_ON=true;document.body.classList.add('mb-mode');
  const sh=document.createElement('div');sh.id='mbApp';
  sh.innerHTML=`
    <div class="mb-head">
      <b>Starduct CRM</b>
      <span id="mbWho" class="muted" style="font-size:12px"></span>
      <a href="javascript:void(0)" onclick="localStorage.setItem('crm_mb_off','1');location.reload()" title="${t('Bản đầy đủ')}">🖥</a>
    </div>
    <div id="mbBody"></div>
    <div class="mb-tabs">
      <button id="mbT_viec" onclick="mbChon('viec')">✅<span>${t('Việc hôm nay')}</span></button>
      <button id="mbT_kq"  onclick="mbChon('kq')">📝<span>${t('KQ hôm nay')}</span></button>
      <button id="mbT_ht"  onclick="mbChon('ht')">🆘<span>${t('Hỗ trợ')}</span></button>
    </div>
    <datalist id="mbDealList"></datalist><datalist id="mbOrgList"></datalist>`;
  document.body.appendChild(sh);
  mbChon('viec');
});
// nút quay lại bản thu gọn khi đang ở bản đầy đủ trên màn hình hẹp
window.addEventListener('load',()=>{
  if(window.matchMedia('(max-width:767px)').matches&&localStorage.getItem('crm_mb_off')==='1'){
    const b=document.createElement('button');b.id='mbBack';b.textContent='📱';
    b.title='Bản thu gọn';b.onclick=()=>{localStorage.removeItem('crm_mb_off');location.reload()};
    document.body.appendChild(b);
  }
});

function mbChon(tab){MB_TAB=tab;
  for(const k of ['viec','kq','ht']){const b=document.getElementById('mbT_'+k);if(b)b.classList.toggle('act',k===tab)}
  mbRender();
}

/* ===== render sau mỗi lần dữ liệu thay đổi ===== */
if(typeof renderAll==='function'){
  const _renderAll_mb=renderAll;
  renderAll=function(){ _renderAll_mb(); if(MB_ON)mbRender(); };
}
function mbRender(){
  if(!MB_ON)return;
  const el=document.getElementById('mbBody');if(!el)return;
  const who=document.getElementById('mbWho');
  if(who)who.textContent=ME?('👤 '+ME.ho_ten):'';
  if(!ME){el.innerHTML=`<div class="mb-card"><div class="notice">${t('Đăng nhập để thấy công việc của bạn.')}</div>
    <button class="mb-btn" onclick="dlgCfg.showModal()">${t('Đăng nhập')}</button></div>`;return}
  const ql=typeof laQuanLy==='function'&&laQuanLy()&&ME.vai_tro!=='npp_lead';
  mbNhanTab(ql);
  if(ql){ // LÃNH ĐẠO: giám sát + phê duyệt, chi tiết xem trên desktop
    if(MB_TAB==='viec')mbQLHomNay(el);
    else if(MB_TAB==='kq')mbQLPheDuyet(el);
    else mbQLYeuCau(el);
    return;
  }
  // NHÂN VIÊN / NPP: tác nghiệp hiện trường
  mbDealList.innerHTML=mbDealsCuaToi().filter(d=>d.stage!=='dong').map(d=>`<option value="${esc(d.ten)}">`).join('');
  mbOrgList.innerHTML=mbOrgsCuaToi().map(o=>`<option value="${esc(o.ten)}">`).join('');
  if(MB_TAB==='viec')mbVeViec(el);
  else if(MB_TAB==='kq')mbVeKQ(el);
  else mbVeHT(el);
}
function mbNhanTab(ql){
  const set=(k,ic,tx,n)=>{const b=document.getElementById('mbT_'+k);
    if(b)b.innerHTML=ic+'<span>'+tx+(n?' ('+n+')':'')+'</span>'};
  if(ql){set('viec','✅',t('Hôm nay'));set('kq','🛡',t('Phê duyệt'),(window.APRQ||[]).length);set('ht','🆘',t('Yêu cầu'))}
  else{set('viec','✅',t('Việc hôm nay'));set('kq','📝',t('KQ hôm nay'));set('ht','🆘',t('Hỗ trợ'))}
}

/* ===== BẢN LÃNH ĐẠO · TAB 1: HÔM NAY TOÀN HỆ THỐNG ===== */
function mbQLHomNay(el){
  const today=new Date().toISOString().slice(0,10);
  const tps=ALL_TPS.filter(x=>x.ngay===today);
  const qd=tps.filter(x=>x.la_cap_ra_quyet_dinh);
  const htMo=ALL_HTS.filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly');
  const KPI=(v,l,mau)=>`<div class="mb-kpi" style="border-top:3px solid ${mau}"><b>${v}</b><span>${l}</span></div>`;
  el.innerHTML=`<div class="mb-kpis">
      ${KPI(tps.length,t('tiếp xúc hôm nay'),'#0f4c81')}
      ${KPI(qd.length,t('gặp cấp QĐ'),'#16a34a')}
      ${KPI((window.APRQ||[]).length,t('chờ phê duyệt'),'#d97706')}
      ${KPI(htMo.length,t('hỗ trợ đang mở'),'#dc2626')}
    </div>
    <div class="mb-card"><h3>🤝 ${t('Hôm nay ai tiếp xúc với ai')}</h3>
    ${tps.length?tps.map(x=>{const o=ORGS.find(z=>z.id===x.org_id);const d=x.deal_id?DEALS.find(z=>z.id===x.deal_id):null;
      return `<div class="mb-item"><div>
        <b>${esc(x.nguoi_thuc_hien||'?')}</b> → ${esc(d?.ten||o?.ten||'—')}
        ${x.la_cap_ra_quyet_dinh?' <span class="pill p3">'+t('cấp QĐ')+'</span>':''}
        <div class="mb-sub">${esc((x.noi_dung||'').slice(0,90))}</div>
        ${x.buoc_tiep_theo?`<div class="mb-sub">→ ${esc(x.buoc_tiep_theo)}${x.han_buoc_tiep_theo?' · '+x.han_buoc_tiep_theo:''}</div>`:''}
      </div></div>`}).join('')
    :'<div class="mb-sub">'+t('Chưa có tiếp xúc nào được ghi hôm nay.')+'</div>'}
    </div>
    <div class="mb-card"><div class="mb-sub">${t('Báo cáo, doanh thu, KPI chi tiết — xem trên máy tính. Bản mobile lãnh đạo chỉ gói gọn: hôm nay ai làm gì, có gì chờ bạn duyệt.')}</div></div>`;
}

/* ===== BẢN LÃNH ĐẠO · TAB 2: PHÊ DUYỆT NHANH ===== */
async function mbQLPheDuyet(el){
  el.innerHTML='<div class="mb-card"><div class="mb-sub">'+t('Đang tải hàng chờ…')+'</div></div>';
  const r=await sb.from('crm_approvals').select('*').order('created_at',{ascending:false}).limit(50);
  if(r.error){el.innerHTML='<div class="mb-card"><div class="notice warn">'+esc(r.error.message)+'</div></div>';return}
  const cho=(r.data||[]).filter(a=>a.trang_thai!=='da_duyet'&&a.trang_thai!=='tu_choi');
  window.__MB_APR=cho;
  el.innerHTML=`<div class="mb-card"><h3>🛡 ${t('Chờ phê duyệt')} (${cho.length})</h3>
  ${cho.length?cho.map((a,i)=>{const wait=Math.round((Date.now()-new Date(a.created_at))/864e5);
    const co=typeof coQuyenDuyet==='function'&&coQuyenDuyet(a.cap_duyet);
    return `<div class="mb-item" style="flex-direction:column;align-items:stretch">
      <div><b>${(typeof APR_LOAI!=='undefined'&&APR_LOAI[a.loai])||a.loai}</b>
        <span class="pill ${wait>14?'p3':'p1'}">${t('chờ')} ${wait} ${t('ngày')}</span>
        <span class="tag">${(a.cap_duyet||'').toUpperCase()}</span>
        <div class="mb-sub"><b>${esc(a.nguoi_de_xuat||'')}</b>: ${esc((a.noi_dung||'').slice(0,140))}</div>
      </div>
      ${co?`<input id="mbYk_${i}" placeholder="${t('Ý kiến (bác thì bắt buộc)')}" style="margin-top:8px">
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="mb-mini" style="flex:1;color:#16a34a;border-color:#16a34a" onclick="mbDuyet(${i},'da_duyet')">✔ ${t('Duyệt')}</button>
        <button class="mb-mini" style="flex:1;color:#dc2626;border-color:#dc2626" onclick="mbDuyet(${i},'tu_choi')">✘ ${t('Từ chối')}</button>
      </div>`:`<div class="mb-sub">${t('chờ cấp')} ${(a.cap_duyet||'').toUpperCase()} ${t('duyệt')}</div>`}
    </div>`}).join('')
  :'<div class="mb-sub">🎉 '+t('Hàng chờ trống — không có gì cần bạn duyệt.')+'</div>'}
  </div>`;
}
async function mbDuyet(i,tt){
  const a=(window.__MB_APR||[])[i];if(!a)return;
  const yk=(document.getElementById('mbYk_'+i)?.value||'').trim();
  if(tt==='tu_choi'&&!yk){alert(t('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  const r=await sb.from('crm_approvals').update({trang_thai:tt,nguoi_duyet:ME.ho_ten,
    y_kien_duyet:yk||null,decided_at:new Date().toISOString()}).eq('id',a.id);
  if(r.error){alert(r.error.message);return}
  if(a.doi_tuong==='plan')
    await sb.from('crm_plans').update({trang_thai:tt==='da_duyet'?'da_duyet':'tu_choi'}).eq('id',a.doi_tuong_id);
  if(typeof loadAprQueue==='function')await loadAprQueue();
  mbRender();
}

/* ===== BẢN LÃNH ĐẠO · TAB 3: YÊU CẦU HỖ TRỢ TOÀN HỆ THỐNG ===== */
function mbQLYeuCau(el){
  const today=new Date().toISOString().slice(0,10);
  const mo=ALL_HTS.filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly');
  const agg={};
  for(const h of mo){const k=h.bo_phan_nhan||'khac';agg[k]=agg[k]||{n:0,qh:0};agg[k].n++;if(h.han&&h.han<today)agg[k].qh++}
  el.innerHTML=`<div class="mb-kpis">
    ${Object.entries(agg).map(([k,v])=>`<div class="mb-kpi" style="border-top:3px solid ${v.qh?'#dc2626':'#0f4c81'}">
      <b>${v.n}</b><span>${(typeof BP!=='undefined'&&BP[k])||k}${v.qh?' · ⚠'+v.qh:''}</span></div>`).join('')||''}
  </div>
  <div class="mb-card"><h3>🆘 ${t('Yêu cầu đang mở')} (${mo.length})</h3>
  ${mo.length?mo.slice(0,25).map(h=>{const d=DEALS.find(z=>z.id===h.deal_id);
    const late=h.han&&h.han<today;
    return `<div class="mb-item"><div>
      <b>${late?'⚠️ ':''}${esc((h.noi_dung||'').slice(0,80))}</b>
      <div class="mb-sub">${esc(h.nguoi_yeu_cau||'')} → ${(typeof BP!=='undefined'&&BP[h.bo_phan_nhan])||h.bo_phan_nhan}
      ${d?' · '+esc(d.ten):''} · ${t('hạn')} ${h.han||'—'}</div>
    </div></div>`}).join('')
  :'<div class="mb-sub">'+t('Không có yêu cầu nào đang mở.')+'</div>'}
  </div>
  <div class="mb-card"><div class="mb-sub">${t('Phân xử chi tiết / gán người xử lý — làm trên desktop, tab Hỗ trợ.')}</div></div>`;
}

/* ===== TAB 1: VIỆC HÔM NAY ===== */
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
      <div class="mb-sub">${esc(d.next_action||t('(chưa có việc tiếp theo)'))}${d.next_action_han?' · <b>'+d.next_action_han+'</b>':''}</div>
      <div class="mb-sub">${esc(d.npp_chi_dinh||d.cdt_text||'')}</div>
    </div>
    <button class="mb-mini" onclick="mbGhiKQ('${esc(d.ten)}')">📝 ${t('Ghi KQ')}</button>
  </div>`;
  const sec=(tt,arr,mau)=>arr.length?`<div class="mb-card"><h3>${tt} (${arr.length})</h3>${arr.slice(0,20).map(d=>item(d,mau)).join('')}</div>`:'';
  el.innerHTML=
    sec('🔴 '+t('QUÁ HẠN'),qua,'var(--bad,#dc2626)')+
    sec('🟡 '+t('HÔM NAY'),nay,'#d97706')+
    sec('🟢 '+t('7 NGÀY TỚI'),toi7,'#16a34a')+
    sec('🛑 '+t('ĐỨNG YÊN >21 NGÀY'),dung,'#94a3b8')+
    ((qua.length+nay.length+toi7.length+dung.length)?'':`<div class="mb-card"><div class="notice">🎉 ${t('Không có việc đến hạn — mở tab KQ hôm nay để ghi kết quả tiếp xúc.')}</div></div>`)+
    `<div class="mb-card"><div class="mb-sub">${t('Bạn phụ trách')} <b>${mine.length}</b> ${t('dự án đang mở. Bấm vào dự án để mở Workspace đầy đủ.')}</div></div>`;
}
function mbGhiKQ(tenDeal){mbChon('kq');setTimeout(()=>{const i=document.getElementById('mbDeal');if(i){i.value=tenDeal;i.scrollIntoView()}},80)}

/* ===== TAB 2: KQ HÔM NAY (ghi kết quả — đồng bộ vào đúng dự án/khách) ===== */
function mbVeKQ(el){
  const today=new Date().toISOString().slice(0,10);
  const cuaToi=ALL_TPS.filter(x=>x.nguoi_thuc_hien===ME.ho_ten&&x.ngay===today);
  const loaiOpts=document.getElementById('txLoai')?.innerHTML||'<option value="gap_truc_tiep">Gặp trực tiếp</option>';
  el.innerHTML=`<div class="mb-card">
    <h3>📝 ${t('Ghi kết quả làm việc')}</h3>
    <label>${t('Dự án (trong danh sách bạn phụ trách)')}</label>
    <input id="mbDeal" list="mbDealList" placeholder="${t('Gõ vài chữ để chọn…')}">
    <label>${t('Hoặc / và Khách hàng-Đối tác')}</label>
    <input id="mbOrg" list="mbOrgList" placeholder="${t('Gõ vài chữ để chọn…')}">
    <label>${t('Hình thức')}</label>
    <select id="mbLoai">${loaiOpts}</select>
    <label class="mb-check"><input type="checkbox" id="mbQD"> ${t('Gặp CẤP RA QUYẾT ĐỊNH')}</label>
    <label>${t('Kết quả / nội dung')} *</label>
    <textarea id="mbND" placeholder="${t('VD: đã trình mẫu VAV, TVTK đồng ý đưa vào spec…')}"></textarea>
    <label>${t('Việc tiếp theo')}</label>
    <input id="mbBTT" placeholder="${t('VD: gửi báo giá trước thứ 6')}">
    <label>${t('Hạn việc tiếp theo')}</label>
    <input id="mbHanBTT" type="date">
    <label>${t('Ảnh hiện trạng / minh chứng (tuỳ chọn)')}</label>
    <input id="mbFile" type="file" accept="image/*,.pdf" capture="environment">
    <button class="mb-btn" onclick="mbLuuKQ()">💾 ${t('LƯU KẾT QUẢ')}</button>
    <div class="mb-sub" id="mbKQMsg"></div>
  </div>
  <div class="mb-card"><h3>${t('Đã ghi hôm nay')} (${cuaToi.length})</h3>
    ${cuaToi.length?cuaToi.map(x=>{const o=ORGS.find(z=>z.id===x.org_id);const d=x.deal_id?DEALS.find(z=>z.id===x.deal_id):null;
      return `<div class="mb-item"><div><b>${esc(d?.ten||o?.ten||'—')}</b>
      <div class="mb-sub">${esc((x.noi_dung||'').slice(0,90))}</div></div></div>`}).join('')
    :'<div class="mb-sub">'+t('Chưa có — kết quả bạn lưu sẽ hiện ở đây và trên desktop của quản lý.')+'</div>'}
  </div>`;
}
async function mbLuuKQ(){
  const msg=document.getElementById('mbKQMsg');
  const deal=DEALS.find(d=>d.ten===mbDeal.value.trim());
  let org=ORGS.find(o=>o.ten===mbOrg.value.trim());
  if(!deal&&!org){msg.textContent='⚠ '+t('Chọn ít nhất Dự án hoặc Khách hàng trong danh sách');return}
  if(!mbND.value.trim()){msg.textContent='⚠ '+t('Chưa ghi kết quả/nội dung');return}
  if(!org&&deal&&deal.cdt_text)org=ORGS.find(o=>o.ten===deal.cdt_text)||null;
  msg.textContent=t('Đang lưu…');
  const rec={ngay:new Date().toISOString().slice(0,10),loai:mbLoai.value,
    nguoi_thuc_hien:ME.ho_ten,la_cap_ra_quyet_dinh:mbQD.checked,
    noi_dung:mbND.value.trim(),buoc_tiep_theo:mbBTT.value.trim()||null,
    han_buoc_tiep_theo:mbHanBTT.value||null,org_id:org?.id||null};
  let r=deal?await sb.from('crm_touchpoints').insert({...rec,deal_id:deal.id}):{error:{message:'x'}};
  if(!deal)r=await sb.from('crm_touchpoints').insert(rec);
  else if(r.error&&/deal_id/.test(r.error.message))r=await sb.from('crm_touchpoints').insert(rec);
  if(r.error){msg.textContent='❌ '+r.error.message;return}
  // đồng bộ vào dự án: việc tiếp theo + mốc tương tác cuối
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
  msg.textContent='✓ '+t('Đã lưu & đồng bộ vào ')+esc(deal?.ten||org?.ten||'');
  mbND.value='';mbBTT.value='';mbHanBTT.value='';mbFile.value='';
  await loadAll();
}

/* ===== TAB 3: HỖ TRỢ ===== */
function mbVeHT(el){
  const bpOpts=document.getElementById('htBP')?.innerHTML||'';
  const loaiOpts=document.getElementById('htLoai')?.innerHTML||'<option value="khac">Khác</option>';
  const utOpts=document.getElementById('htUT')?.innerHTML||'<option value="binh_thuong">Bình thường</option>';
  const cuaToi=ALL_HTS.filter(h=>h.nguoi_yeu_cau===ME.ho_ten).slice(0,15);
  const today=new Date().toISOString().slice(0,10);
  el.innerHTML=`<div class="mb-card">
    <h3>🆘 ${t('Gửi yêu cầu hỗ trợ')}</h3>
    <label>${t('Dự án liên quan (tuỳ chọn)')}</label>
    <input id="mbHtDeal" list="mbDealList" placeholder="${t('Gõ vài chữ để chọn…')}">
    <label>${t('Gửi tới bộ phận')}</label><select id="mbHtBP">${bpOpts}</select>
    <label>${t('Loại yêu cầu')}</label><select id="mbHtLoai">${loaiOpts}</select>
    <label>${t('Nội dung cần hỗ trợ')} *</label>
    <textarea id="mbHtND" placeholder="${t('VD: cần bản vẽ submittal VAV cho dự án X trước thứ 5…')}"></textarea>
    <label>${t('Mức ưu tiên')}</label><select id="mbHtUT">${utOpts}</select>
    <button class="mb-btn" onclick="mbGuiHT()">📨 ${t('GỬI YÊU CẦU')}</button>
    <div class="mb-sub" id="mbHtMsg"></div>
  </div>
  <div class="mb-card"><h3>${t('Yêu cầu của tôi')} (${cuaToi.length})</h3>
    ${cuaToi.length?cuaToi.map(h=>{const d=DEALS.find(z=>z.id===h.deal_id);
      const late=(h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly')&&h.han&&h.han<today;
      const tt=h.trang_thai==='da_xong'?'✅':h.trang_thai==='tu_choi'?'❌':late?'⚠️':'⏳';
      return `<div class="mb-item"><div><b>${tt} ${esc((h.noi_dung||'').slice(0,60))}</b>
      <div class="mb-sub">${esc(d?.ten||'')} · ${t('hạn')} ${h.han||'—'} · ${h.nguoi_xu_ly?esc(h.nguoi_xu_ly):t('chưa ai nhận')}</div></div></div>`}).join('')
    :'<div class="mb-sub">'+t('Chưa gửi yêu cầu nào.')+'</div>'}
  </div>`;
}
async function mbGuiHT(){
  const msg=document.getElementById('mbHtMsg');
  if(!mbHtND.value.trim()){msg.textContent='⚠ '+t('Chưa ghi nội dung');return}
  const deal=DEALS.find(d=>d.ten===mbHtDeal.value.trim());
  msg.textContent=t('Đang gửi…');
  const r=await sb.from('crm_support_requests').insert({deal_id:deal?.id||null,
    nguoi_yeu_cau:ME.ho_ten,bo_phan_nhan:mbHtBP.value,loai:mbHtLoai.value,
    noi_dung:mbHtND.value.trim(),muc_uu_tien:mbHtUT.value,
    han:new Date(Date.now()+2*864e5).toISOString().slice(0,10)});
  if(r.error){msg.textContent='❌ '+r.error.message;return}
  msg.textContent='✓ '+t('Đã gửi — hậu phương sẽ thấy ngay trên desktop');
  mbHtND.value='';await loadAll();
}
