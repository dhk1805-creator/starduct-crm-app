/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Tổng quan
   Nguồn: index.html v20 dòng 2334–2453 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Tổng quan' — lớp thị trường nền, KPI card, phễu NPP, win/loss
   ========================================================================== */
/* ================= TỔNG QUAN ================= */
async function renderNen(){
  const el=document.getElementById('nenChart');if(!el||!sb)return;
  try{
    if(MOD==='nd'){
      const [npp,bci,cn,tl,gy]=await Promise.all([
        sb.from('crm_v_nen_theo_npp').select('*'),
        sb.from('crm_bci').select('id',{count:'exact',head:true}),
        sb.from('crm_du_an_cap_nhat').select('id',{count:'exact',head:true}),
        sb.from('crm_v_ty_le_npp').select('*'),
        sb.from('crm_v_goi_y_khop_nen').select('deal_id',{count:'exact',head:true})]);
      const rows=(npp.data||[]).sort((a,b)=>b.n-a.n);
      const tong=rows.reduce((s,r)=>s+r.n,0);
      const tlr=(tl.data||[]).filter(r=>r.ket_thuc>0&&r.npp!=='(chưa chỉ định)'&&!/Xác nhận/i.test(r.npp)).sort((a,b)=>b.win-a.win);
      el.classList.remove('muted');
      el.innerHTML=`<div class="muted" style="font-size:12px;margin-bottom:8px">${t('Tổng ')}<b>${tong.toLocaleString('vi')}</b>${t(' dự án trong danh mục nền')} · BCI: <b>${bci.count||0}</b> · ${t('nhật ký cập nhật')}: <b>${cn.count||0}</b> — ${t('tra cứu chi tiết ở tab')} <b>${t('Dự án nền')}</b>${gy.count?` · <span class="pill p3">${gy.count}${t(' cặp deal↔nền chờ xác nhận khớp')}</span>`:''}</div>`+
        '<table><tr><th>'+t('NPP chỉ định')+'</th><th class="num">'+t('Số dự án')+'</th><th style="width:45%"></th></tr>'+
        rows.slice(0,8).map(r=>`<tr><td>${esc(r.npp)}</td><td class="num"><b>${r.n.toLocaleString('vi')}</b></td>
          <td><div class="bar"><i style="width:${Math.round(r.n/rows[0].n*100)}%"></i></div></td></tr>`).join('')+'</table>'+
        (tlr.length?`<div class="muted" style="font-size:12px;margin:12px 0 6px"><b>🎯 ${t('Kết quả dự án đã kết thúc theo NPP (từ sổ gốc)')}</b></div>`+
        '<table><tr><th>NPP</th><th class="num">'+t('Kết thúc')+'</th><th class="num">Win</th><th class="num">'+t('Trượt')+'</th><th class="num">'+t('Thiếu kết quả')+'</th><th class="num">'+t('Tỷ lệ win')+'</th></tr>'+
        tlr.map(r=>{const co=r.win+r.thua;
          return `<tr><td><b>${esc(r.npp)}</b></td><td class="num">${r.ket_thuc}</td>
          <td class="num" style="color:var(--ok,#0a7)">${r.win}</td><td class="num" style="color:var(--bad,#c33)">${r.thua}</td>
          <td class="num muted">${r.ket_thuc_thieu_kq}</td>
          <td class="num"><b>${co?Math.round(r.win/co*100)+'%':'—'}</b></td></tr>`}).join('')+'</table>'+
        `<div class="notice warn" style="margin-top:8px">${t('⚠ Dự án KẾT THÚC nhưng thiếu "NSCA cung cấp?" sẽ không tính được win/thua — chị Cúc bổ sung cột này khi cập nhật file.')}</div>`:'');
    }else{
      const [bg,orgQT]=await Promise.all([
        sb.from('crm_v_bg_theo_quoc_gia').select('*'),
        sb.from('crm_org').select('id',{count:'exact',head:true}).eq('khu_vuc','quoc_te').eq('loai_ban_ghi','muc_tieu')]);
      const rows=(bg.data||[]).sort((a,b)=>(b.tong||0)-(a.tong||0));
      const tongN=rows.reduce((s,r)=>s+r.n,0),tongV=rows.reduce((s,r)=>s+(+r.tong||0),0);
      el.classList.remove('muted');
      el.innerHTML=`<div class="muted" style="font-size:12px;margin-bottom:8px">${t('Báo giá XK 2026: ')}<b>${tongN}</b>${t(' báo giá')} · ${t('tổng giá trị ')}<b>${fmtB(tongV)}</b> · ${t('đối tác quốc tế: ')}<b>${orgQT.count||0}</b></div>`+
        '<table><tr><th>'+t('Quốc gia')+'</th><th class="num">'+t('Số BG')+'</th><th class="num">'+t('Giá trị')+'</th><th class="num">VAV/CAV</th><th class="num">Van EI</th></tr>'+
        rows.map(r=>`<tr><td><b>${esc(r.quoc_gia)}</b></td><td class="num">${r.n}</td>
          <td class="num">${fmtB(+r.tong||0)}</td><td class="num">${fmtB(+r.vav_cav||0)}</td><td class="num">${fmtB(+r.van_gio_ei||0)}</td></tr>`).join('')+'</table>';
    }
    applyLang();
  }catch(e){el.textContent='⚠ '+e.message}
}

function renderTQ(){
  renderNen();
  const mt=ORGS.filter(o=>o.loai_ban_ghi==='muc_tieu');
  const mtKH=mt.filter(o=>o.phan_loai!=='npp');   // khách hàng (Nhóm 2/3) — đo thang phủ
  const mtNPP=mt.filter(o=>o.phan_loai==='npp');  // NPP/Agent/Broker (Nhóm 1) — đo phễu NPP
  const phu1=mtKH.filter(o=>o.trang_thai_phu>=1).length;
  const phu2=mtKH.filter(o=>o.trang_thai_phu>=2).length;
  const coChu=mt.filter(o=>o.nguoi_phu_trach).length;
  const nContacts=ORGS.reduce((s,o)=>s+(o._nc||0),0);
  const dealTVTK=DEALS.filter(d=>d.tvtk_id||d.tvtk_text).length;
  const uuCao=DEALS.filter(d=>(d.uu_tien||'').startsWith('1')).length;
  // ===== V36: bo KPI day du theo yeu cau CEO 15/08 =====
  const orgTC=ORGS.filter(o=>o.trang_thai_phu>=1||(o.phan_loai==='npp'&&o.pheu_npp&&o.pheu_npp!=='chua_tiep_can')).length;
  const dealCoTX=new Set(TPS.filter(x=>x.deal_id).map(x=>x.deal_id));
  const daTX=DEALS.filter(d=>dealCoTX.has(d.id)||d.stage!=='tiep_can').length;
  const daCD=DEALS.filter(d=>d.owner||d.nguoi_phu_trach||d.npp_dang_ky_id||d.npp_chi_dinh).length;
  const tongGT=DEALS.reduce((s,d)=>s+(+d.gia_tri_uoc||0),0);
  const gtKT=DEALS.filter(d=>d.stage!=='dong'&&(d.owner||d.nguoi_phu_trach||d.npp_dang_ky_id||d.npp_chi_dinh))
    .reduce((s,d)=>s+(+d.gia_tri_uoc||0),0);
  const thang=DEALS.filter(d=>d.stage==='po'||(d.stage==='dong'&&!d.loss_reason)).length;
  const thua=DEALS.filter(d=>d.stage==='dong'&&d.loss_reason).length;
  kpis.innerHTML=[
    ['Tổng đối tác',ORGS.length,`${orgTC} đã tiếp cận · ${ORGS.length-orgTC} chưa tiếp cận (${pct(orgTC,ORGS.length)})`],
    ['Độ phủ KH ≥1 / ≥2',`${pct(phu1,mtKH.length)} / ${pct(phu2,mtKH.length)}`,`${phu1} · ${phu2} / ${mtKH.length} tài khoản KH`],
    ['Tổng dự án',DEALS.length,`${daTX} đã tiếp cận · ${DEALS.length-daTX} chưa tiếp cận (${pct(daTX,DEALS.length)})`],
    ['Đã chỉ định / phân công',pct(daCD,DEALS.length),`${daCD} đã chỉ định · ${DEALS.length-daCD} chưa chỉ định`],
    ['Giá trị khai thác',fmtB(gtKT),`tỉ lệ khai thác ${pct(gtKT,tongGT)} trên tổng ${fmtB(tongGT)}`],
    ['Tỷ lệ win',`${pct(thang,thang+thua)}`,`${thang} Thắng · ${thua} Thua/Hủy — trên dự án đã đóng sổ`],
    ['Có người phụ trách',pct(coChu,mt.length),`${coChu}/${mt.length} — danh mục CEO duyệt`],
    ['Dự án ưu tiên cao',uuCao,`trên ${DEALS.length} dự án · TVTK nối ${pct(dealTVTK,DEALS.length)}`]
  ].map(([h,v,m])=>`<div class="kpi"><h3>${h}</h3><div class="v">${v}</div><div class="m">${m}</div></div>`).join('');
  renderNppKhaiThac();
  renderKhaiThac();

  phuChart.innerHTML=[0,1,2,3,4,5].map(i=>{
    const n=mtKH.filter(o=>o.trang_thai_phu===i).length;
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
      <span class="pill p${i}" style="width:170px">${PHU[i]}</span>
      <div class="bar" style="flex:1"><i style="width:${mtKH.length?n/mtKH.length*100:0}%"></i></div>
      <b style="width:44px;text-align:right">${n}</b></div>`}).join('')+
    `<div class="muted" style="font-size:12px;margin:10px 0 6px"><b>🤝 Phễu NPP/Agent (Nhóm 1 — không tính vào thang phủ khách hàng)</b></div>`+
    Object.entries(PHEU_NPP).map(([k,[nhan,cls]])=>{
      const n=mtNPP.filter(o=>o.pheu_npp===k).length;if(!n&&k!=='da_ky_hd')return '';
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
      <span class="pill ${cls}" style="width:170px">${nhan}</span>
      <div class="bar" style="flex:1"><i style="width:${mtNPP.length?n/mtNPP.length*100:0}%"></i></div>
      <b style="width:44px;text-align:right">${n}</b></div>`}).join('');

  // V36: tinh tren TOAN BO danh muc (khong chi 'muc tieu'); ND chia theo VUNG, QT theo quoc gia
  const ndMode=MOD==='nd';
  const keyOf=x=>ndMode?(x.vung||'Chưa xếp'):(x.quoc_gia||'—');
  const daTiepCan=o=>o.trang_thai_phu>=1||(o.phan_loai==='npp'&&o.pheu_npp&&o.pheu_npp!=='chua_tiep_can');
  const byQG={};
  for(const o of ORGS){const k=keyOf(o);byQG[k]=byQG[k]||{n:0,p:0,da:0,gt:0};byQG[k].n++;
    if(daTiepCan(o))byQG[k].p++}
  for(const x of DEALS){const k=keyOf(x);byQG[k]=byQG[k]||{n:0,p:0,da:0,gt:0};
    byQG[k].da++;byQG[k].gt+=(+x.gia_tri_uoc||0)}
  qgChart.innerHTML='<table><tr><th>'+(ndMode?t('Vùng'):t('Thị trường'))+'</th><th class="num">'+t('Tài khoản')+'</th><th class="num">'+t('đã tiếp cận')+'</th><th class="num">'+t('Phủ ≥1')+'</th><th class="num">'+t('Dự án')+'</th><th class="num">'+t('Giá trị ước')+'</th></tr>'+
    Object.entries(byQG).sort((a,b)=>b[1].n-a[1].n).map(([q,v])=>
    `<tr><td>${ndMode?esc((typeof VUNGDM!=='undefined'&&VUNGDM[q])||q):(isoName[q]||q)}</td><td class="num">${v.n}</td><td class="num">${v.p}</td><td class="num">${pct(v.p,v.n)}</td>
     <td class="num">${v.da}</td><td class="num">${v.gt?fmtB(v.gt):'—'}</td></tr>`).join('')+'</table>'+
    '<div class="muted" style="font-size:11.5px;margin-top:6px">'+t('Tính trên toàn bộ danh mục của trang này')+' — '+ORGS.length+' '+t('tài khoản')+' · '+DEALS.length+' '+t('dự án')+'</div>';

  // Kết quả theo nhóm quan hệ × quốc gia
  const tp30=new Set(TPS.filter(t=>t.ngay>=new Date(Date.now()-30*864e5).toISOString().slice(0,10)).map(t=>t.org_id));
  const qhAgg={};
  for(const o of mt){const k=o.quan_he||'chua_phan_loai';
    const g=qhAgg[k]=qhAgg[k]||{n:0,qh2:0,tx:0,qgs:{}};
    g.n++;if(o.trang_thai_phu>=2)g.qh2++;if(tp30.has(o.id))g.tx++;
    g.qgs[o.quoc_gia]=(g.qgs[o.quoc_gia]||0)+1}
  qhChart.innerHTML='<table><tr><th>Nhóm quan hệ</th><th class="num">Tài khoản</th><th class="num">Quan hệ thực (≥2)</th><th class="num">Tiếp xúc 30 ngày</th><th>Theo quốc gia</th></tr>'+
    Object.entries(qhAgg).sort((a,b)=>b[1].n-a[1].n).map(([k,g])=>
    `<tr><td><b>${QH[k]||'⬜ Chưa phân loại'}</b></td><td class="num">${g.n}</td>
     <td class="num">${g.qh2}</td><td class="num">${g.tx}</td>
     <td class="muted">${Object.entries(g.qgs).sort((a,b)=>b[1]-a[1]).slice(0,6)
       .map(([q,n])=>`${isoName[q]||q}: ${n}`).join(' · ')}</td></tr>`).join('')+'</table>'+
    (qhAgg['chua_phan_loai']?`<div class="notice warn" style="margin-top:10px">⚠ ${qhAgg['chua_phan_loai'].n} tài khoản chưa phân nhóm quan hệ — mở từng tài khoản để gán, hoặc lọc "Chưa phân loại" ở tab Đối tác.</div>`:'');

  const today=new Date().toISOString().slice(0,10);
  const due=TPS.filter(t=>t.han_buoc_tiep_theo&&t.buoc_tiep_theo).sort((a,b)=>a.han_buoc_tiep_theo<b.han_buoc_tiep_theo?-1:1).slice(0,10);
  dueList.innerHTML=due.length?'<table><tr><th>Hạn</th><th>Đối tác</th><th>Bước tiếp theo</th><th>Ai</th></tr>'+
    due.map(t=>{const org=ORGS.find(o=>o.id===t.org_id);const late=t.han_buoc_tiep_theo<today;
    return `<tr><td><span class="pill ${late?'p3':'p1'}" style="${late?'background:var(--bad-bg);color:var(--bad)':''}">${t.han_buoc_tiep_theo}</span></td>
    <td>${esc(org?.ten||'—')}</td><td>${esc(t.buoc_tiep_theo)}</td><td>${esc(t.nguoi_thuc_hien)}</td></tr>`}).join('')+'</table>'
    :'<div class="muted">Chưa có bước tiếp theo nào được ghi. Mọi tiếp xúc nên kết thúc bằng một bước tiếp theo có hạn.</div>';

  // Hàng chờ phê duyệt — v35.9: đọc thẳng crm_approvals (đồng nhất mobile), duyệt ngay tại dashboard
  renderAprQueue();
}
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';

/* ===== v35.9: HÀNG CHỜ PHÊ DUYỆT — nguồn thẳng crm_approvals, thao tác tại chỗ ===== */
async function renderAprQueue(){
  if(!sb||!aprQueue)return;
  const r=await sb.from('crm_approvals').select('*').order('created_at',{ascending:true}).limit(100);
  if(r.error){aprQueue.innerHTML='<div class="notice warn">'+esc(r.error.message)+'</div>';return}
  const rows=(r.data||[]).filter(a=>a.trang_thai!=='da_duyet'&&a.trang_thai!=='tu_choi');
  window.__APRQ2=rows;
  const tenDT=a=>{
    if(a.doi_tuong==='deal')return ALL_DEALS.find(x=>x.id===a.doi_tuong_id)?.ten||'(dự án)';
    if(a.doi_tuong==='org')return ALL_ORGS.find(x=>x.id===a.doi_tuong_id)?.ten||'(đối tác)';
    if(a.doi_tuong==='plan')return (window.PLANS||[]).find(x=>x.id===a.doi_tuong_id)?.ten||'(kế hoạch)';
    if(a.doi_tuong==='support')return t('Yêu cầu hỗ trợ');
    return '—'};
  aprQueue.innerHTML=rows.length?'<table><tr><th>'+t('Chờ')+'</th><th>'+t('Loại')+'</th><th>'+t('Đối tượng')+'</th><th>'+t('Đề xuất')+'</th><th>'+t('Người đề xuất')+'</th><th>'+t('Cấp')+'</th><th style="min-width:280px"></th></tr>'+
    rows.slice(0,20).map((a,i)=>{
      const cho=Math.max(0,Math.round((Date.now()-new Date(a.created_at))/864e5));
      const co=coQuyenDuyet(a.cap_duyet);
      const moDuoc=['deal','org','plan','support'].includes(a.doi_tuong)&&a.doi_tuong_id;
      return `<tr>
      <td><span class="pill ${cho>14?'p3':'p1'}"${cho>14?' style="background:var(--bad-bg);color:var(--bad)"':''}>${cho} ${t('ngày')}</span></td>
      <td>${(typeof APR_LOAI!=='undefined'&&APR_LOAI[a.loai])||a.loai}</td>
      <td><b>${esc(tenDT(a))}</b></td>
      <td class="muted" style="max-width:240px">${esc(a.noi_dung||'')}</td>
      <td>${esc(a.nguoi_de_xuat||'')}</td><td>${(a.cap_duyet||'').toUpperCase()}</td>
      <td>${co?`<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <input id="aq_yk_${i}" placeholder="${t('Ý kiến (bác thì bắt buộc)')}" style="width:150px">
        <button class="btn" style="color:var(--ok,#0a7)" onclick="duyetNhanh(${i},'da_duyet')">✔ ${t('Duyệt')}</button>
        <button class="btn" style="color:var(--bad,#c33)" onclick="duyetNhanh(${i},'tu_choi')">✘ ${t('Từ chối')}</button>
        ${moDuoc?`<button class="btn" style="padding:4px 8px" onclick="openThread('${a.doi_tuong}','${a.doi_tuong_id}','${esc(tenDT(a))}')">💬</button>`:''}
      </div>`:`<span class="muted">${t('chờ cấp')} ${(a.cap_duyet||'').toUpperCase()}</span>`}</td></tr>`}).join('')+'</table>'
    :'<div class="muted">'+t('Không có đề xuất nào chờ duyệt. ✓')+'</div>';
  capNhatChuong(rows.length);
}
/* v35.9: chuông thông báo cho CEO/Manager trên header — "Có N đề xuất chưa phê duyệt" */
function capNhatChuong(nApr){
  let bell=document.getElementById('aprBell');
  const coQuyen=(typeof laNguoiDuyet==='function'&&laNguoiDuyet())||(typeof laNguoiTiepNhan==='function'&&laNguoiTiepNhan());
  const nHt=(window.ALL_HTS||[]).filter(h=>h.trang_thai==='mo'||h.trang_thai==='dang_xu_ly').length;
  if(!coQuyen||(!nApr&&!nHt)){if(bell)bell.style.display='none';return}
  if(!bell){
    bell=document.createElement('button');bell.id='aprBell';bell.className='btn';
    bell.style.cssText='font-weight:700;color:#d97706;border-color:#d97706';
    bell.onclick=()=>{const b=document.querySelector('nav button[data-t="tq"]');if(b)b.click();
      setTimeout(()=>{try{aprQueue.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}},150)};
    const conn=document.querySelector('header .conn');
    if(conn)conn.insertBefore(bell,conn.firstChild);else document.querySelector('header')?.appendChild(bell);
  }
  bell.style.display='';
  const phan=[];
  if(nApr)phan.push(nApr+' '+t('đề xuất chưa phê duyệt'));
  if(nHt&&typeof laNguoiTiepNhan==='function'&&laNguoiTiepNhan())phan.push(nHt+' '+t('yêu cầu đang mở'));
  bell.textContent='🔔 '+phan.join(' · ');
}
async function duyetNhanh(i,tt){
  const a=(window.__APRQ2||[])[i];if(!a)return;
  const yk=(document.getElementById('aq_yk_'+i)?.value||'').trim();
  if(tt==='tu_choi'&&!yk){alert(t('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  const r=await sb.from('crm_approvals').update({trang_thai:tt,nguoi_duyet:ME?.ho_ten||null,
    y_kien_duyet:yk||null,decided_at:new Date().toISOString()}).eq('id',a.id);
  if(r.error){alert(r.error.message);return}
  if(a.doi_tuong==='plan')
    await sb.from('crm_plans').update({trang_thai:tt==='da_duyet'?'da_duyet':'tu_choi'}).eq('id',a.doi_tuong_id);
  renderAprQueue();
}



/* ===== V36: NPP ĐÃ KÝ HĐ — số dự án đang theo, kết quả, tỉ lệ thành công, giá trị khai thác ===== */
function renderNppKhaiThac(){
  const el=document.getElementById('nppChart');if(!el)return;
  const npps=ORGS.filter(NPP_KYHD);
  if(!npps.length){el.innerHTML='<div class="muted">'+t('Chưa có NPP ký HĐ')+'</div>';return}
  el.classList.remove('muted');
  const rows=npps.map(o=>{
    const cua=DEALS.filter(d=>d.npp_dang_ky_id===o.id||(d.npp_chi_dinh&&d.npp_chi_dinh===o.ten));
    const dang=cua.filter(d=>d.stage!=='dong');
    const thangN=cua.filter(d=>d.stage==='po'||(d.stage==='dong'&&!d.loss_reason)).length;
    const thuaN=cua.filter(d=>d.stage==='dong'&&d.loss_reason).length;
    const gt=dang.reduce((s,d)=>s+(+d.gia_tri_uoc||0),0);
    return {ten:o.ten,qg:o.quoc_gia||'',dang:dang.length,gt,thang:thangN,thua:thuaN};
  }).sort((a,b)=>b.dang-a.dang||b.gt-a.gt);
  el.innerHTML='<table><tr><th>NPP</th><th>'+t('Thị trường')+'</th><th class="num">'+t('Đang theo')+'</th><th class="num">'+t('Giá trị ước')+'</th><th class="num">'+t('Thắng')+'</th><th class="num">'+t('Thua/Hủy')+'</th><th class="num">'+t('Tỷ lệ win')+'</th></tr>'+
    rows.map(r=>{const co=r.thang+r.thua;
      return `<tr><td><b>${esc(r.ten)}</b></td><td>${esc(r.qg)}</td>
      <td class="num"><b>${r.dang}</b></td><td class="num">${r.gt?fmtB(r.gt):'—'}</td>
      <td class="num" style="color:var(--ok,#0a7)">${r.thang}</td>
      <td class="num" style="color:var(--bad,#c33)">${r.thua}</td>
      <td class="num">${co?pct(r.thang,co):'<span class="muted">'+t('chưa đủ dữ liệu')+'</span>'}</td></tr>`}).join('')+'</table>'+
    '<div class="muted" style="font-size:11.5px;margin-top:6px">'+t('Đang theo')+' = '+t('dự án')+' stage ≠ '+t('Đóng')+' · '+t('Thắng')+' = PO/'+t('Đóng')+' '+t('không kèm')+' loss reason</div>';
}

/* ===== V36: TÌNH HÌNH KHAI THÁC CSDL — tài nguyên đang có vs hệ thống đã khai thác, theo từng đối tượng ===== */
async function renderKhaiThac(){
  const el=document.getElementById('ktChart');if(!el||!sb)return;
  if(typeof laStaffXem==='function'&&laStaffXem()){el.innerHTML='<div class="muted">'+t('Dành cho lãnh đạo')+'</div>';return}
  const qt=MOD==='qt';
  // kỳ xem: CEO/Manager chọn lịch — mặc định từ đầu năm đến hôm nay
  const tu=window.KT_TU||new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10);
  const den=window.KT_DEN||new Date().toISOString().slice(0,10);
  // tài nguyên cần truy vấn: kho nền + báo giá (lọc đúng khu vực)
  const kv=q=>qt?q.eq('khu_vuc','quoc_te'):q.or('khu_vuc.is.null,khu_vuc.neq.quoc_te');
  const [nen,bg]=await Promise.all([
    kv(sb.from('crm_du_an_nen').select('id',{count:'exact',head:true})),
    kv(sb.from('crm_quotations').select('gia_tri_bao_gia,trang_thai,ngay_update')).limit(3000)
  ]);
  const tongNen=nen.count||0;
  const bgRows=bg.data||[];
  const bgN=bgRows.length, bgGT=bgRows.reduce((s,r)=>s+(+r.gia_tri_bao_gia||0),0);
  const ycsx=bgRows.filter(r=>/YCSX/i.test(r.trang_thai||''));
  const ycsxGT=ycsx.reduce((s,r)=>s+(+r.gia_tri_bao_gia||0),0);
  // chỉ số từ bộ nhớ (đã lọc theo trang)
  const mtKH=ORGS.filter(o=>o.loai_ban_ghi==='muc_tieu'&&o.phan_loai!=='npp');
  const orgTC=ORGS.filter(o=>o.trang_thai_phu>=1||(o.phan_loai==='npp'&&o.pheu_npp&&o.pheu_npp!=='chua_tiep_can')).length;
  const phu2=mtKH.filter(o=>o.trang_thai_phu>=2).length;
  const nppAll=ORGS.filter(o=>o.phan_loai==='npp').length;
  const nppKy=ORGS.filter(NPP_KYHD).length;
  const bamSat=DEALS.filter(x=>x.ma_du_an_nen).length;
  const dealCoTX=new Set(TPS.filter(x=>x.deal_id).map(x=>x.deal_id));
  const daTX=DEALS.filter(x=>dealCoTX.has(x.id)||x.stage!=='tiep_can');
  const daCD=DEALS.filter(x=>x.owner||x.nguoi_phu_trach||x.npp_dang_ky_id||x.npp_chi_dinh);
  const gtCD=daCD.reduce((s,x)=>s+(+x.gia_tri_uoc||0),0);
  const gtTX=daTX.reduce((s,x)=>s+(+x.gia_tri_uoc||0),0);
  const thang=DEALS.filter(x=>x.stage==='po'||(x.stage==='dong'&&!x.loss_reason)).length;
  const thua=DEALS.filter(x=>x.stage==='dong'&&x.loss_reason).length;
  const dtTong=REVS.reduce((s,r)=>s+(+r.so_tien||0),0);
  // ===== chỉ số theo KỲ (khoảng thời gian chọn) =====
  const bgKy=bgRows.filter(r=>{const n=(r.ngay_update||'').slice(0,10);return n&&n>=tu&&n<=den});
  const bgKyGT=bgKy.reduce((s,r)=>s+(+r.gia_tri_bao_gia||0),0);
  const ycsxKy=bgKy.filter(r=>/YCSX/i.test(r.trang_thai||''));
  const dtKy=REVS.filter(r=>{const m=(r.thang||'').slice(0,7);return m&&m>=tu.slice(0,7)&&m<=den.slice(0,7)})
    .reduce((s,r)=>s+(+r.so_tien||0),0);
  const H=(dt,tong,kt,gia)=>`<tr><td>${dt}</td><td class="num">${tong.toLocaleString('vi')}</td>
    <td class="num"><b>${kt.toLocaleString('vi')}</b></td><td class="num">${pct(kt,tong)}</td>
    <td class="num">${gia!=null?fmtB(gia):'—'}</td></tr>`;
  el.classList.remove('muted');
  const kyHtml=`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
    <b style="font-size:12.5px">${t('Kỳ:')}</b>
    <input type="date" id="ktTu" value="${tu}"><span class="muted">→</span><input type="date" id="ktDen" value="${den}">
    <button class="btn" onclick="window.KT_TU=document.getElementById('ktTu').value;window.KT_DEN=document.getElementById('ktDen').value;renderKhaiThac()">${t('Tính')}</button>
  </div>
  <div class="grid g3" style="margin-bottom:12px">
    <div class="kpi"><h3>${t('Báo giá phát hành (kỳ)')}</h3><div class="v">${fmtB(bgKyGT)}</div><div class="m">${bgKy.length} ${t('báo giá')} · ${ycsxKy.length} YCSX</div></div>
    <div class="kpi"><h3>${t('Doanh thu kỳ')}</h3><div class="v">${fmtB(dtKy)}</div><div class="m">${tu} → ${den}</div></div>
    <div class="kpi"><h3>${t('Tỉ lệ chuyển đổi')}</h3><div class="v">${pct(dtKy,bgKyGT)}</div><div class="m">${t('Doanh thu')} / ${t('giá trị chào')} ${t('trong kỳ')}</div></div>
  </div>`;
  el.innerHTML=kyHtml+'<table><tr><th>'+t('Đối tượng')+'</th><th class="num">'+t('Tổng CSDL')+'</th><th class="num">'+t('Đã khai thác')+'</th><th class="num">'+t('Tỉ lệ')+'</th><th class="num">'+t('Giá trị')+' (VND)</th></tr>'+
    H(t('Kho dự án nền → đưa vào bám sát'),tongNen,bamSat,null)+
    H(t('Dự án theo dõi → đã tiếp cận'),DEALS.length,daTX.length,gtTX)+
    H(t('Dự án theo dõi → đã chỉ định'),DEALS.length,daCD.length,gtCD)+
    H(t('Dự án đóng sổ → thắng'),thang+thua,thang,null)+
    H(t('Đối tác → đã tiếp cận'),ORGS.length,orgTC,null)+
    H(t('Đối tác → quan hệ thực (≥2)'),mtKH.length,phu2,null)+
    H(t('NPP phễu → đã ký HĐ'),nppAll,nppKy,null)+
    H(t('Báo giá → chốt YCSX'),bgN,ycsx.length,ycsxGT)+
    `<tr><td>${t('Doanh thu ghi nhận')}</td><td class="num">${REVS.length.toLocaleString('vi')} ${t('dòng ghi nhận')}</td><td class="num">—</td><td class="num">—</td><td class="num"><b>${fmtB(dtTong)}</b></td></tr>`+
    '</table>'+
    `<div class="muted" style="font-size:11.5px;margin-top:6px">${t('giá trị chào')}: <b>${fmtB(bgGT)}</b> · ${t('Giá trị khai thác')} (${t('đã chỉ định')}, ${t('chưa đóng')}): <b>${fmtB(daCD.filter(x=>x.stage!=='dong').reduce((s,x)=>s+(+x.gia_tri_uoc||0),0))}</b></div>`;
}