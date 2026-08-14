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
  kpis.innerHTML=[
    ['Đối tác mục tiêu',mt.length,`${mtNPP.length} NPP · ${mtKH.length} khách hàng · ${ORGS.length-mt.length} tình báo`],
    ['Độ phủ KH ≥1 / ≥2',`${pct(phu1,mtKH.length)} / ${pct(phu2,mtKH.length)}`,`${phu1} · ${phu2} / ${mtKH.length} tài khoản KH`],
    ['Có người phụ trách',pct(coChu,mt.length),`${coChu}/${mt.length} — danh mục CEO duyệt`],
    ['Dự án ưu tiên cao',uuCao,`trên ${DEALS.length} dự án · TVTK nối ${pct(dealTVTK,DEALS.length)}`]
  ].map(([h,v,m])=>`<div class="kpi"><h3>${h}</h3><div class="v">${v}</div><div class="m">${m}</div></div>`).join('');

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

  const byQG={};
  for(const o of mt){byQG[o.quoc_gia]=byQG[o.quoc_gia]||{n:0,p:0};byQG[o.quoc_gia].n++;
    if(o.trang_thai_phu>=1)byQG[o.quoc_gia].p++}
  qgChart.innerHTML='<table><tr><th>Thị trường</th><th class="num">Tài khoản</th><th class="num">Phủ ≥1</th><th class="num">Dự án</th></tr>'+
    Object.entries(byQG).sort((a,b)=>b[1].n-a[1].n).map(([q,v])=>
    `<tr><td>${isoName[q]||q}</td><td class="num">${v.n}</td><td class="num">${pct(v.p,v.n)}</td>
     <td class="num">${DEALS.filter(d=>d.quoc_gia===q).length}</td></tr>`).join('')+'</table>';

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

  // Hàng chờ phê duyệt
  const oids=new Set(ORGS.map(o=>o.id)),didz=new Set(DEALS.map(d=>d.id));
  const aq=(window.APRQ||[]).filter(a=>(a.doi_tuong==='support'||oids.has(a.doi_tuong_id)||didz.has(a.doi_tuong_id))&&coQuyenDuyet(a.cap_duyet));
  aprQueue.innerHTML=aq.length?'<table><tr><th>Chờ</th><th>Loại</th><th>Đối tượng</th><th>Đề xuất</th><th>Người đề xuất</th><th>Cấp</th><th></th></tr>'+
    aq.slice(0,15).map(a=>`<tr>
    <td><span class="pill ${a.so_ngay_cho>14?'p3':'p1'}"${a.so_ngay_cho>14?' style="background:var(--bad-bg);color:var(--bad)"':''}>${a.so_ngay_cho} ngày${a.so_ngay_cho>14?' ⚠':''}</span></td>
    <td>${APR_LOAI[a.loai]||a.loai}</td><td><b>${esc(a.ten_doi_tuong||'—')}</b></td>
    <td class="muted" style="max-width:240px">${esc(a.noi_dung)}</td>
    <td>${esc(a.nguoi_de_xuat)}</td><td>${a.cap_duyet.toUpperCase()}</td>
    <td><button class="btn" style="padding:4px 8px" onclick="openThread('${a.doi_tuong}','${a.doi_tuong_id}','${esc(a.ten_doi_tuong||'')}')">Mở</button></td></tr>`).join('')+'</table>'
    :'<div class="muted">Không có đề xuất nào chờ duyệt. ✓</div>';
}
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'—';

