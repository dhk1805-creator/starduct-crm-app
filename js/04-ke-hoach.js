/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Kế hoạch kỳ
   Nguồn: index.html v20 dòng 1394–1937 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Kế hoạch' — mẫu kỳ, mục tiêu ưu tiên, nhịp tháng, dự trù kinh phí, trình/duyệt
   ========================================================================== */

/* ================= KẾ HOẠCH ================= */
let PLANS=[];
async function loadPlans(){
  const r=await sb.from('crm_plans').select('*').order('created_at',{ascending:false});
  PLANS=r.data||[];renderKH();
}
const KHT={nhap:['Nháp','p0'],cho_duyet:['Chờ CEO duyệt','p3'],da_duyet:['Đã duyệt','p4'],
  tu_choi:['Từ chối','p0'],dang_trien_khai:['Đang triển khai','p4'],hoan_thanh:['Hoàn thành','p5']};
function renderKH(){
  if(!window.khList)return;
  const rows=PLANS.filter(p=>(p.khu_vuc==='noi_dia')===(MOD==='nd'));
  khList.innerHTML=rows.length?'<table><tr><th>Kế hoạch</th><th>Người lập</th><th>Kỳ</th><th>Trạng thái</th><th></th></tr>'+
  rows.map(p=>{const [lbl,cls]=KHT[p.trang_thai]||[p.trang_thai,'p0'];
  return `<tr><td><b>${esc(p.ten)}</b><div class="muted">${esc(p.muc_tieu||'')}</div></td>
  <td>${esc(p.nguoi_lap)}</td><td>${p.ky_tu} → ${p.ky_den}</td>
  <td><span class="pill ${cls}">${lbl}</span></td>
  <td><button class="btn" style="padding:4px 8px" onclick="openKH('${p.id}')">Mở</button></td></tr>`}).join('')+'</table>'
  :'<div class="muted">Chưa có kế hoạch nào trong module này.</div>';
}
async function taoKH(){
  if(!khTen.value.trim()||!khTu.value||!khDen.value){alert(t('Thiếu tên hoặc kỳ kế hoạch'));return}
  const r=await sb.from('crm_plans').insert({ten:khTen.value.trim(),
    nguoi_lap:ME?.ho_ten||'?',khu_vuc:MOD==='nd'?'noi_dia':'quoc_te',
    ky_tu:khTu.value,ky_den:khDen.value,muc_tieu:khMT.value.trim()||null,
    ky_loai:khKy.value||null,chi_tieu_vav:+khCTVAV.value||null,
    chi_tieu_doanh_thu:+khCTDT.value||null,chi_tieu_npp_moi:+khCTNPP.value||null,
    trong_tam:khTT.value.trim()||null}).select();
  if(r.error){alert(r.error.message);return}
  khTen.value='';khMT.value='';await loadPlans();openKH(r.data[0].id);
}
async function openKH(id){
  const p=PLANS.find(x=>x.id===id);if(!p)return;
  const items=(await sb.from('crm_plan_items').select('*').eq('plan_id',id).order('created_at')).data||[];
  const objs=(await sb.from('crm_plan_objectives').select('*').eq('plan_id',id).order('created_at')).data||[];
  const [lbl,cls]=KHT[p.trang_thai]||[p.trang_thai,'p0'];
  const editable=p.trang_thai==='nhap'||p.trang_thai==='tu_choi';
  khTitle.textContent='📋 '+p.ten;
  khBody.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <span class="pill ${cls}">${lbl}</span>
      <span class="muted">${esc(p.nguoi_lap)} · ${p.ky_tu} → ${p.ky_den}</span></div>
    ${p.muc_tieu?`<div class="notice" style="margin-bottom:10px">${esc(p.muc_tieu)}</div>`:''}
    ${(p.ky_loai||p.chi_tieu_vav||p.chi_tieu_doanh_thu||p.chi_tieu_npp_moi)?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      ${p.ky_loai?`<span class="tag">Kỳ: ${{tuan:'Tuần',thang:'Tháng',quy:'Quý',nua_nam:'Nửa năm',nam:'Năm'}[p.ky_loai]||p.ky_loai}</span>`:''}
      ${p.chi_tieu_vav?`<span class="tag">🎯 ${p.chi_tieu_vav} bộ VAV</span>`:''}
      ${p.chi_tieu_doanh_thu?`<span class="tag">💰 ${(+p.chi_tieu_doanh_thu).toLocaleString('vi')} đ</span>`:''}
      ${p.chi_tieu_npp_moi?`<span class="tag">🤝 ${p.chi_tieu_npp_moi} NPP/OEM mới</span>`:''}</div>`:''}
    ${(()=>{const sv=items.reduce((a,i)=>a+(+i.so_bo_vav||0),0),sg=items.reduce((a,i)=>a+(+i.gia_tri_du_kien||0),0);
      return (sv||sg)?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      ${sv?`<span class="tag" style="background:var(--ok-bg);color:var(--ok)">Σ kế hoạch ${sv} bộ VAV${p.chi_tieu_vav?' / chỉ tiêu '+p.chi_tieu_vav+(sv>=p.chi_tieu_vav?' ✔':' ('+Math.round(sv*100/p.chi_tieu_vav)+'%)'):''}</span>`:''}
      ${sg?`<span class="tag" style="background:var(--ok-bg);color:var(--ok)">Σ dự bán ${sg.toLocaleString('vi')} đ</span>`:''}</div>`:''})()}
    ${p.trong_tam?`<div class="muted" style="margin-bottom:10px">⭐ ${esc(p.trong_tam)}</div>`:''}
    ${(p.du_tru_kinh_phi||[]).length?`<details style="margin-bottom:10px"><summary style="cursor:pointer;font-size:13px"><b>🧳 Dự trù kinh phí công tác — Σ ${(p.du_tru_kinh_phi||[]).reduce((a,x)=>a+(+x.t||0),0).toLocaleString('vi')} đ</b> <span class="muted">(CFO duyệt riêng)</span></summary>
      <table style="margin-top:6px"><tr><th>Khoản</th><th class="num">Số tiền</th><th>Ghi chú</th></tr>
      ${(p.du_tru_kinh_phi||[]).map(x=>`<tr><td>${KP_LOAI[x.k]||x.k}</td><td class="num">${(+x.t).toLocaleString('vi')}</td><td class="muted">${esc(x.g||'')}</td></tr>`).join('')}</table></details>`:''}
    ${objs.length?`<h3 style="font-size:13px;margin:0 0 6px">🎯 Mục tiêu ưu tiên (${objs.length})</h3>
    ${['chinh','phu','khac'].map(u=>{const g=objs.filter(o=>o.uu_tien===u);if(!g.length)return'';
      return `<div style="border:1px solid var(--border);border-radius:8px;padding:6px 10px;margin-bottom:6px">
      <b style="font-size:12px">${{chinh:'🥇 CHÍNH',phu:'🥈 PHỤ',khac:'🥉 KHÁC'}[u]}</b>
      ${g.map(o=>{const ct=o.chi_tiet||{},kq=o.ket_qua_chi_tiet||{};
        const keys=Object.keys(ct).filter(k=>typeof ct[k]==='number');
        const pcs=keys.map(k=>Math.min(1,(+kq[k]||0)/ct[k]));
        const pc=pcs.length?Math.round(pcs.reduce((a,b)=>a+b,0)*100/pcs.length):null;
        return `<div style="padding:6px 0;border-top:1px solid var(--border)">
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span style="flex:1;min-width:200px">${esc(o.dien_giai)}
            <span class="muted">· ${OBJ_LOAI[o.loai]||''}${ct.ht?' · '+{tham_gia:'tham gia',tham_quan:'tham quan',tham_du:'tham dự'}[ct.ht]:''}${o.vung_quoc_gia?' · '+esc(o.vung_quoc_gia):''}${o.han?' · hạn '+o.han:''}</span></span>
          ${pc!==null?`<span class="tag" style="${pc>=100?'background:var(--ok-bg);color:var(--ok)':''}">${pc}%</span>`:''}
        </div>
        ${pc!==null?`<div style="height:5px;background:var(--border);border-radius:3px;margin:4px 0">
          <div style="height:5px;width:${pc}%;background:${pc>=100?'var(--ok)':'var(--b400)'};border-radius:3px"></div></div>`:''}
        <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap;align-items:center">
          ${keys.map(k=>`<label style="font-size:12px;display:flex;align-items:center;gap:4px;margin:0">
            <span class="muted">${OBJ_QTY_LBL[k]||(o.loai==='khac'&&ct.dv?ct.dv:k)}:</span>
            <input id="okq-${o.id}-${k}" type="number" min="0" value="${kq[k]??''}" placeholder="0" style="width:70px"><span class="muted">/${(+ct[k]).toLocaleString('vi')}</span></label>`).join('')}
          <input id="okt-${o.id}" placeholder="Diễn giải kết quả…" value="${esc(o.ket_qua||'')}" style="flex:1;min-width:150px">
          <button class="btn" onclick="capNhatObj('${o.id}','${p.id}')">Lưu</button>
        </div></div>`}).join('')}</div>`}).join('')}`:''}
    <h3 style="font-size:13px;margin:0 0 6px">Hạng mục kế hoạch (${items.length})</h3>
    <table><tr><th>Dự án / Đối tác</th><th>Hành động</th><th>Chỉ tiêu</th><th>Hạn</th><th>TT</th></tr>
    ${items.map(i=>{const d=ALL_DEALS.find(x=>x.id===i.deal_id),o=ALL_ORGS.find(x=>x.id===i.org_id);
    return `<tr><td><b>${esc(d?.ten||o?.ten||'—')}</b></td><td>${esc(i.hanh_dong)}${i.muc_tieu?`<div class="muted" style="font-size:12px">🎯 ${esc(i.muc_tieu)}</div>`:''}${i.hang_hoa||i.so_bo_vav||i.gia_tri_du_kien||i.kenh_doanh_thu?`<div class="muted" style="font-size:12px">📦 ${esc(i.hang_hoa||'')}${i.so_bo_vav?' · '+i.so_bo_vav+' bộ':''}${i.gia_tri_du_kien?' · '+(+i.gia_tri_du_kien).toLocaleString('vi')+' đ':''}${i.kenh_doanh_thu?' · từ '+(i.kenh_doanh_thu==='truc_tiep'?'trực tiếp':i.kenh_doanh_thu.toUpperCase()):''}</div>`:''}${i.bo_phan_ho_tro?`<span class="tag">cần ${i.bo_phan_ho_tro.toUpperCase()}</span>`:''}</td>
    <td class="muted">${esc(i.chi_tieu||'')}</td><td>${i.han||''}</td>
    <td><span class="tag">${i.trang_thai}</span></td></tr>`}).join('')||'<tr><td colspan="5" class="muted">Chưa có hạng mục.</td></tr>'}
    </table>
    ${nhipHTML(p,items)}
    ${(()=>{const nl=(window.NHANSU||[]).find(n=>n.ho_ten===p.nguoi_lap);
      const capCan=(nl&&(nl.vai_tro==='staff'||nl.vai_tro==='bo'))?'manager':'ceo';
      return p.trang_thai==='cho_duyet'&&coQuyenDuyet(capCan)&&p.nguoi_lap!==ME?.ho_ten})()?`
    <div style="background:var(--warn-bg);border:1px solid var(--warn);border-radius:8px;padding:10px;margin:10px 0">
      <b>Kế hoạch đang chờ duyệt</b>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <input id="khYK" placeholder="Ý kiến duyệt / lý do từ chối (bắt buộc khi từ chối — L4)" style="flex:1;min-width:220px">
        <button class="btn" style="color:var(--ok)" onclick="duyetKH('${p.id}','da_duyet')">✅ Duyệt</button>
        <button class="btn" style="color:var(--bad)" onclick="duyetKH('${p.id}','tu_choi')">❌ Từ chối</button>
      </div></div>`:''}
    ${editable?`<div class="grid g4" style="gap:8px;margin-top:10px">
      <input id="kiDeal" list="dealList" placeholder="Dự án (từ CSDL)…">
      <input id="kiHD" placeholder="Hành động *">
      <input id="kiCT" placeholder="Chỉ tiêu — vd: spec-in, PO 500 bộ">
      <input id="kiHan" type="date"></div>
    <div class="grid g4" style="gap:8px;margin-top:8px">
      <input id="kiMT" placeholder="Mục tiêu cột mốc — vd: gặp CĐT bảo vệ thông số" style="grid-column:span 2">
      <select id="kiBP"><option value="">— Cần hỗ trợ từ —</option><option value="rd">R&D (bản vẽ/submittal)</option>
        <option value="bo">BO (báo giá phi tiêu chuẩn)</option><option value="tckt">TCKT (công nợ/hợp đồng)</option>
        <option value="qlsx">QLSX (tiến độ/mẫu)</option></select></div>
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="themKI('${id}')">+ Thêm hạng mục</button>
      <button class="btn" onclick="taiTemplateKH()">⬇ Tải template Excel</button>
      <button class="btn" onclick="document.getElementById('kiFile').click()">⬆ Nhập từ Excel</button>
      <input type="file" id="kiFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="nhapKIExcel('${id}',this)">
      ${items.length?`<button class="btn pri" onclick="trinhKH('${id}')">📤 Trình CEO phê duyệt</button>`:''}
    </div>`:''}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn" onclick="dlgKH.close();openThread('plan','${id}','${esc(p.ten)}')">💬 Thảo luận & phê duyệt</button>
      ${items.length?`<button class="btn" onclick="xuatKH('${id}')">⬇ Xuất Excel</button>`:''}
    </div>`;
  dlgKH.showModal();applyLang();
}
async function themKI(planId){
  const d=ALL_DEALS.find(x=>x.ten===kiDeal.value.trim());
  if(!kiHD.value.trim()){alert(t('Thiếu hành động'));return}
  await sb.from('crm_plan_items').insert({plan_id:planId,deal_id:d?.id||null,
    hanh_dong:kiHD.value.trim(),chi_tieu:kiCT.value.trim()||null,han:kiHan.value||null,
    muc_tieu:kiMT.value.trim()||null,bo_phan_ho_tro:kiBP.value||null});
  openKH(planId);
}
/* ===== MẪU KẾ HOẠCH KỲ: tải trước - điền - nộp ===== */
const MAU_COLS=['CHỌN (x)','Loại','Tên tài khoản / dự án','Quốc gia','Phân loại','Trạng thái hiện tại','HÀNH ĐỘNG TRONG KỲ *','CHỈ TIÊU','MỤC TIÊU CỘT MỐC','HẠN (YYYY-MM-DD)','CẦN HỖ TRỢ (rd/bo/tckt/qlsx)'];
function kyMacDinh(loai){
  const d=new Date();let tu,den;
  if(loai==='quy'){const q=Math.floor(d.getMonth()/3)+1;const nq=q===4?1:q+1;const y=q===4?d.getFullYear()+1:d.getFullYear();
    tu=new Date(y,(nq-1)*3,1);den=new Date(y,nq*3,0)}
  else if(loai==='nua_nam'){const h2=d.getMonth()<6;tu=new Date(d.getFullYear()+(h2?0:1),h2?6:0,1);den=new Date(d.getFullYear()+(h2?0:1),h2?12:6,0)}
  else{tu=new Date(d.getFullYear()+1,0,1);den=new Date(d.getFullYear()+1,12,0)}
  const f=x=>x.toISOString().slice(0,10);return[f(tu),f(den)];
}
function taiMauKH(){
  const loai=mauKy.value,ten={quy:'Quý',nua_nam:'Nửa năm',nam:'Năm'}[loai];
  const [tu,den]=kyMacDinh(loai);
  const me=ME?.ho_ten||'';
  const info=XLSX.utils.aoa_to_sheet([
    ['THÔNG TIN KỲ KẾ HOẠCH','(sửa trực tiếp cột B)'],
    ['Tên kế hoạch','KH '+ten+' '+(ME?.khu_vuc==='quoc_te'?'quốc tế':'nội địa')+' — '+me],
    ['Loại kỳ (KHÔNG SỬA)',loai],
    ['Từ ngày',tu],['Đến ngày',den],
    ['Chỉ tiêu số bộ VAV',''],['Doanh thu mục tiêu (VND)',''],['Số NPP / OEM mới',''],
    ['Mục tiêu tổng quát',''],
    ['Trọng tâm chiến lược','vd: đẩy SVAV-S (AHRI 880) phân khúc bệnh viện; Simple Box Only mở thị trường giá nhạy']]);
  info['!cols']=[{wch:26},{wch:70}];
  const myOrgs=ALL_ORGS.filter(o=>o.nguoi_phu_trach===me&&o.loai_ban_ghi==='muc_tieu');
  const myDeals=ALL_DEALS.filter(d=>d.owner===me||(!d.owner&&myOrgs.some(o=>o.id===d.cdt_id||o.id===d.npp_dang_ky_id)));
  const rows=[
    ...myDeals.map(d=>['','du_an',d.ten||'',d.quoc_gia||'','',d.stage||'','','','','','']),
    ...myOrgs.map(o=>['','tai_khoan',o.ten||'',o.quoc_gia||'',o.phan_loai||'','phủ '+(o.trang_thai_phu??0),'','','','','']),
  ];
  for(let i=0;i<15;i++)rows.push(['','moi','','','','','','','','','']);
  const ws=XLSX.utils.aoa_to_sheet([MAU_COLS,...rows]);
  ws['!cols']=[{wch:9},{wch:10},{wch:42},{wch:9},{wch:10},{wch:16},{wch:40},{wch:18},{wch:30},{wch:18},{wch:24}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,info,'Thong tin ky');
  XLSX.utils.book_append_sheet(wb,ws,'Hang muc');
  const hd=XLSX.utils.aoa_to_sheet([
    ['CÁCH DÙNG MẪU KẾ HOẠCH '+ten.toUpperCase()],[''],
    ['1','Sheet "Thong tin ky": điền chỉ tiêu + trọng tâm (cột B). Không sửa dòng Loại kỳ.'],
    ['2','Sheet "Hang muc": hệ thống đã kéo sẵn '+myDeals.length+' dự án + '+myOrgs.length+' tài khoản bạn phụ trách.'],
    ['3','Đánh x vào cột CHỌN cho mục đưa vào kế hoạch · điền HÀNH ĐỘNG cụ thể (cấm "bám sát/đẩy mạnh") + HẠN.'],
    ['4','Dòng "moi": thêm tài khoản/dự án chưa có trong CSDL — gõ tên vào cột Tên.'],
    ['5','Nộp lại: tab Kế hoạch → ⬆ Nộp kế hoạch đã điền. Hệ thống tự tạo kế hoạch + toàn bộ hạng mục.'],
    ['6','Sau khi CEO duyệt: mở kế hoạch sẽ có NHỊP THÁNG (tự chia theo hạn) để nhập kết quả từng kỳ.']]);
  hd['!cols']=[{wch:4},{wch:100}];
  XLSX.utils.book_append_sheet(wb,hd,'Huong dan');
  XLSX.writeFile(wb,'mau-ke-hoach-'+loai+'-'+tu+'.xlsx');
}
async function nopKHFile(inp){
  const f=inp.files[0];if(!f)return;
  try{
    const wb=XLSX.read(await f.arrayBuffer());
    const info=XLSX.utils.sheet_to_json(wb.Sheets['Thong tin ky'],{header:1,raw:false,defval:''});
    const get=k=>{const r=info.find(x=>(x[0]||'').toString().startsWith(k));return r?(r[1]||'').toString().trim():''};
    const loai=get('Loại kỳ')||'quy';
    const plan={ten:get('Tên kế hoạch')||('KH '+loai),nguoi_lap:ME?.ho_ten||'?',
      khu_vuc:MOD==='nd'?'noi_dia':'quoc_te',ky_loai:loai,
      ky_tu:get('Từ ngày')||null,ky_den:get('Đến ngày')||null,
      chi_tieu_vav:+get('Chỉ tiêu số bộ VAV')||null,chi_tieu_doanh_thu:+get('Doanh thu mục tiêu')||null,
      chi_tieu_npp_moi:+get('Số NPP')||null,muc_tieu:get('Mục tiêu tổng quát')||null,trong_tam:get('Trọng tâm')||null};
    if(!plan.ky_tu||!plan.ky_den){alert('Thiếu Từ ngày / Đến ngày trong sheet Thong tin ky');inp.value='';return}
    const r=await sb.from('crm_plans').insert(plan).select();
    if(r.error){alert(r.error.message);inp.value='';return}
    const planId=r.data[0].id;
    const rows=XLSX.utils.sheet_to_json(wb.Sheets['Hang muc']||wb.Sheets[wb.SheetNames[1]],{header:1,raw:false,defval:''});
    let ok=0;
    for(const row of rows.slice(1)){
      if((row[0]||'').toString().trim().toLowerCase()!=='x')continue;
      const ten=(row[2]||'').toString().trim(),hdg=(row[6]||'').toString().trim();
      if(!hdg)continue;
      const d=ALL_DEALS.find(x=>x.ten===ten),o=d?null:ALL_ORGS.find(x=>x.ten===ten);
      const bp=(row[10]||'').toString().trim().toLowerCase();
      let han=(row[9]||'').toString().trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(han))han=null;
      const ins=await sb.from('crm_plan_items').insert({plan_id:planId,deal_id:d?.id||null,org_id:o?.id||null,
        hanh_dong:hdg+(!d&&!o&&ten?' — '+ten:''),chi_tieu:(row[7]||'').toString().trim()||null,
        muc_tieu:(row[8]||'').toString().trim()||null,han:han,
        bo_phan_ho_tro:['rd','bo','tckt','qlsx'].includes(bp)?bp:null});
      if(!ins.error)ok++;
    }
    alert('✔ Đã tạo kế hoạch "'+plan.ten+'" với '+ok+' hạng mục.\nMở kế hoạch để kiểm tra rồi bấm Trình CEO phê duyệt.');
    await loadPlans();openKH(planId);
  }catch(e){alert('Lỗi đọc file: '+e.message)}
  inp.value='';
}
/* ===== NHỊP THÁNG + KẾT QUẢ ===== */
const KIST={cho:'Chờ',dang_lam:'Đang làm',xong:'Xong',huy:'Hủy'};
function nhipHTML(p,items){
  if(!['quy','nua_nam','nam'].includes(p.ky_loai||'')||!items.length)return'';
  const homNay=new Date().toISOString().slice(0,10);
  const xong=items.filter(i=>i.trang_thai==='xong').length;
  const tre=items.filter(i=>i.trang_thai!=='xong'&&i.trang_thai!=='huy'&&i.han&&i.han<homNay).length;
  const pc=Math.round(xong*100/items.length);
  const gr={};
  for(const i of items){const k=i.han?i.han.slice(0,7):'zz';(gr[k]=gr[k]||[]).push(i)}
  return `<h3 style="font-size:13px;margin:14px 0 6px">📅 Nhịp hành động theo tháng <span class="muted">(tự chia theo hạn — nhập kết quả tại đây)</span></h3>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
    <span class="tag" style="background:var(--ok-bg);color:var(--ok)">✔ ${xong}/${items.length} xong · ${pc}%</span>
    ${tre?`<span class="tag" style="background:var(--bad-bg);color:var(--bad)">⏰ ${tre} quá hạn</span>`:''}</div>`+
  Object.keys(gr).sort().map(k=>{
    const cs=gr[k],cxong=cs.filter(i=>i.trang_thai==='xong').length;
    return `<div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:8px">
    <b>${k==='zz'?'— Chưa đặt hạn':'Tháng '+k.slice(5,7)+'/'+k.slice(0,4)}</b>
    <span class="muted" style="font-size:12px">· ${cxong}/${cs.length} xong</span>
    ${cs.map(i=>{const d=ALL_DEALS.find(x=>x.id===i.deal_id),o=ALL_ORGS.find(x=>x.id===i.org_id);
      const qh=i.trang_thai!=='xong'&&i.trang_thai!=='huy'&&i.han&&i.han<homNay;
      return `<div style="display:flex;gap:6px;align-items:center;padding:6px 0;border-top:1px solid var(--border);flex-wrap:wrap">
      <span style="flex:1;min-width:200px${qh?';color:var(--bad)':''}">${esc(d?.ten||o?.ten||'')}${(d||o)?' · ':''}${esc(i.hanh_dong)}
        ${i.han?`<span class="muted">(hạn ${i.han}${qh?' ⏰':''})</span>`:''}</span>
      <select id="st-${i.id}" style="width:105px">${Object.entries(KIST).map(([v,l])=>
        `<option value="${v}"${i.trang_thai===v?' selected':''}>${l}</option>`).join('')}</select>
      <input id="kq-${i.id}" placeholder="Kết quả thực tế…" value="${esc(i.ket_qua||'')}" style="width:220px">
      <button class="btn" onclick="capNhatKQ('${i.id}','${p.id}')">Lưu</button></div>`}).join('')}
    </div>`}).join('');
}
async function capNhatObj(objId,planId){
  const kqct={};
  document.querySelectorAll('[id^="okq-'+objId+'-"]').forEach(el=>{
    const k=el.id.split('-').pop();if(el.value!=='')kqct[k]=+el.value});
  const kq=document.getElementById('okt-'+objId).value.trim();
  const r=await sb.from('crm_plan_objectives').update({
    ket_qua_chi_tiet:Object.keys(kqct).length?kqct:null,ket_qua:kq||null}).eq('id',objId);
  if(r.error){alert(r.error.message);return}
  openKH(planId);
}
async function capNhatKQ(itemId,planId){
  const st=document.getElementById('st-'+itemId).value;
  const kq=document.getElementById('kq-'+itemId).value.trim();
  const r=await sb.from('crm_plan_items').update({trang_thai:st,ket_qua:kq||null,
    ngay_hoan_thanh:st==='xong'?new Date().toISOString().slice(0,10):null}).eq('id',itemId);
  if(r.error){alert(r.error.message);return}
  openKH(planId);
}
/* ===== FORM LẬP KẾ HOẠCH TRÊN WEB — kéo CSDL, tick chọn, điền, lưu ===== */
let MAU_ROWS=[],MAU_NEW=0;
function moMauKH(){
  const loai=mauKy.value,tenKy={quy:'Quý',nua_nam:'Nửa năm',nam:'Năm'}[loai];
  const [tu,den]=kyMacDinh(loai);
  const me=ME?.ho_ten||'';
  const myOrgs=ALL_ORGS.filter(o=>o.nguoi_phu_trach===me&&o.loai_ban_ghi==='muc_tieu');
  const myDeals=ALL_DEALS.filter(d=>d.owner===me||(!d.owner&&myOrgs.some(o=>o.id===d.cdt_id||o.id===d.npp_dang_ky_id)));
  MAU_ROWS=[...myDeals.map(d=>({k:'deal',id:d.id,ten:d.ten,qg:d.quoc_gia,tt:d.stage||'',
              na:d.next_action||'',ha:d.hang_muc||'',vav:d.so_bo_vav_uoc,gt:d.gia_tri_uoc,kenh:'',mtg:''})),
            ...myOrgs.map(o=>{const p=o.trang_thai_phu??0;return{k:'org',id:o.id,ten:o.ten,qg:o.quoc_gia,
              tt:'phủ '+p,na:'',ha:'',vav:null,gt:null,kenh:o.kenh_thuong_mai||'',
              mtg:p<5?('Nâng phủ '+p+'→'+(p+1)+(p<2?' (cần cấp ra quyết định)':'')):'Giữ quan hệ khách thường xuyên'}})];
  MAU_NEW=0;
  mauTitle.textContent='📝 Kế hoạch '+tenKy+' — '+me;
  mauBody.innerHTML=`
    <div class="grid g4" style="gap:8px">
      <input id="mTen" value="KH ${tenKy} ${MOD==='nd'?'nội địa':'quốc tế'} — ${esc(me)}" style="grid-column:span 2">
      <input id="mTu" type="date" value="${tu}"><input id="mDen" type="date" value="${den}">
    </div>
    <div class="grid g4" style="gap:8px;margin-top:8px">
      <input id="mVAV" type="number" min="0" placeholder="Chỉ tiêu số bộ VAV">
      <input id="mDT" type="number" min="0" placeholder="Doanh thu mục tiêu (VND)">
      <input id="mNPP" type="number" min="0" placeholder="Số NPP / OEM mới">
    </div>
    <textarea id="mMT" placeholder="Mục tiêu tổng quát…" style="width:100%;min-height:36px;margin-top:8px"></textarea>
    <textarea id="mTT" placeholder="Trọng tâm chiến lược của kỳ…" style="width:100%;min-height:32px;margin-top:6px"></textarea>
    <h3 style="font-size:13px;margin:12px 0 6px">Mục tiêu ưu tiên của kỳ <span class="muted">— là gì · bao nhiêu · ở đâu · khi nào</span></h3>
    <div id="mObjs">
      ${['chinh','phu','khac'].map(u=>`<div style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <b>${{chinh:'🥇 Mục tiêu CHÍNH',phu:'🥈 Mục tiêu PHỤ',khac:'🥉 Mục tiêu KHÁC'}[u]}</b>
          <button class="btn" style="margin-left:auto;padding:2px 8px" onclick="themObj('${u}')">+ Thêm</button>
        </div>
        <div id="objList-${u}"></div>
      </div>`).join('')}
    </div>
    <details style="margin:10px 0"><summary style="cursor:pointer;font-weight:600;font-size:13px">🧳 Dự trù kinh phí công tác (nếu kỳ này có đi công tác trong/ngoài nước)</summary>
      <div id="kpList" style="margin-top:6px"></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        <button class="btn" onclick="themKP()">+ Thêm khoản</button>
        <b id="kpTong" style="margin-left:auto"></b>
      </div>
    </details>
    <div style="display:flex;gap:8px;align-items:center;margin:12px 0 6px">
      <h3 style="font-size:13px;margin:0">Tick chọn từ ${MAU_ROWS.length} dự án/tài khoản bạn phụ trách</h3>
      <input id="mLoc" placeholder="Lọc tên…" oninput="locMau()" style="margin-left:auto;width:200px">
    </div>
    ${MAU_ROWS.length?'':'<div class="notice" style="margin-bottom:8px">Chưa có tài khoản/dự án nào được phân công cho bạn — dùng "+ Thêm dòng mới" hoặc chờ Trưởng PKD phân công.</div>'}
    <div id="mDS" style="max-height:330px;overflow:auto;border:1px solid var(--border);border-radius:8px">
      ${MAU_ROWS.map((r,i)=>`
      <div class="mrow" data-ten="${esc((r.ten||'').toLowerCase())}" style="border-bottom:1px solid var(--border);padding:6px 8px">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer;margin:0">
          <input type="checkbox" id="mc-${i}" onchange="document.getElementById('mx-${i}').style.display=this.checked?'':'none'">
          <b style="flex:1">${esc(r.ten||'')}</b>
          <span class="muted" style="font-size:12px">${r.k==='deal'?'dự án':'tài khoản'} · ${esc(r.qg||'')} · ${esc(r.tt)}</span>
        </label>
        <div id="mx-${i}" style="display:none;margin:6px 0 2px 26px" class="grid g4">
          <input id="mh-${i}" placeholder="Hành động trong kỳ *" value="${esc(r.na)}" style="grid-column:span 2">
          <input id="mmt-${i}" placeholder="Mục tiêu / target quan hệ cần xây" value="${esc(r.mtg)}" style="grid-column:span 2">
          <input id="mhh-${i}" placeholder="Hàng hóa dự kiến — vd: VAV, Van EI, Cửa gió" value="${esc(r.ha)}" style="grid-column:span 2">
          <input id="mvav-${i}" type="number" min="0" placeholder="Số bộ VAV" value="${r.vav??''}">
          <input id="mgt-${i}" type="number" min="0" placeholder="Giá trị dự bán (VND)" value="${r.gt??''}">
          <select id="mkdt-${i}"><option value="">— Doanh thu đến từ —</option>
            ${['npp','agent','oem_odm','truc_tiep'].map(k=>`<option value="${k}"${r.kenh===k?' selected':''}>${KENHDM[k]}</option>`).join('')}</select>
          <input id="mct-${i}" placeholder="Chỉ tiêu khác — vd: spec-in">
          <input id="mhan-${i}" type="date">
          <select id="mbp-${i}"><option value="">— Cần hỗ trợ —</option><option value="rd">R&D</option>
            <option value="bo">BO</option><option value="tckt">TCKT</option><option value="qlsx">QLSX</option></select>
        </div>
      </div>`).join('')}
      <div id="mMoi"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn" onclick="themDongMau()">+ Thêm dòng mới (chưa có trong CSDL)</button>
      <button class="btn pri" onclick="luuMauKH('${loai}')" style="margin-left:auto">💾 Tạo kế hoạch</button>
    </div>`;
  dlgMau.showModal();themObj('chinh');applyLang();
}
let OBJ_SEQ=0;
const OBJ_LOAI={ban_hang:'Bán hàng',tiep_can_thi_truong:'Tiếp cận thị trường mới',su_kien:'Sự kiện / triển lãm',quan_he:'Xây quan hệ',khac:'Khác'};
const OBJ_DV={bo_vav:'bộ VAV',vnd:'VND doanh thu',cdt:'CĐT',tvtk:'TVTK',tong_thau:'Tổng thầu',ky_su:'Kỹ sư',npp:'NPP',oem:'OEM/ODM',su_kien:'sự kiện',khac:'khác'};
// Bo cau hoi dinh luong theo loai muc tieu — moi loai hoi dung cau cua no
const OBJ_QTY={
  ban_hang:[['vnd','Doanh thu (VND)'],['bo_vav','Số bộ VAV'],['oem','Đơn OEM/ODM']],
  tiep_can_thi_truong:[['cdt','CĐT mới'],['tvtk','TVTK mới'],['tong_thau','Tổng thầu mới'],['ky_su','Kỹ sư spec'],['npp','NPP/Agent mới']],
  quan_he:[['phu2','TK nâng phủ ≥2'],['gap_qd','Cuộc gặp cấp ra quyết định'],['spec_in','Dự án spec-in']],
  su_kien:[['su_kien','Số sự kiện'],['lead','Lead mục tiêu']],
  khac:[['so','Bao nhiêu']]
};
const OBJ_QTY_LBL=Object.fromEntries([].concat(...Object.values(OBJ_QTY)));
function qtyHTML(i,loai){
  return OBJ_QTY[loai].map(([k,l])=>
    `<input id="oq-${i}-${k}" type="number" min="0" placeholder="${l}">`).join('')
    +(loai==='su_kien'?`<select id="oq-${i}-ht"><option value="">— Hình thức —</option>
      <option value="tham_gia">Tham gia (trưng bày/diễn giả)</option>
      <option value="tham_quan">Tham quan (khảo sát)</option>
      <option value="tham_du">Tham dự (hội thảo/hiệp hội)</option></select>`:'')
    +(loai==='khac'?`<input id="oq-${i}-dv" placeholder="Đơn vị là gì?">`:'');
}
function doiLoaiObj(i){
  document.getElementById('objQty-'+i).innerHTML=qtyHTML(i,document.getElementById('ol-'+i).value);
  applyLang();
}
function themObj(u){
  const i='o'+(OBJ_SEQ++);
  const div=document.createElement('div');
  div.className='objrow';div.dataset.uu=u;div.dataset.idx=i;
  div.style.cssText='margin-top:6px;padding-top:6px;border-top:1px dashed var(--border)';
  div.innerHTML=`<div class="grid g4" style="gap:6px">
    <select id="ol-${i}" onchange="doiLoaiObj('${i}')">${Object.entries(OBJ_LOAI).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
    <input id="od-${i}" placeholder="Diễn giải mục tiêu — càng rõ càng tốt *" style="grid-column:span 3">
    <div id="objQty-${i}" class="grid g4" style="grid-column:span 4;gap:6px">${qtyHTML(i,'ban_hang')}</div>
    <input id="ov-${i}" placeholder="Vùng / quốc gia — vd: KR, Đông Nam Á" style="grid-column:span 2">
    <input id="oh-${i}" type="date" title="Khi nào" style="grid-column:span 2">
  </div>`;
  document.getElementById('objList-'+u).appendChild(div);applyLang();
}
let KP_SEQ=0;
const KP_LOAI={ve_may_bay:'Vé máy bay',tau_xe:'Tàu / xe',khach_san:'Khách sạn',an_uong:'Ăn uống',tiep_khach:'Tiếp khách',khac:'Khác'};
function themKP(){
  const i='k'+(KP_SEQ++);
  const div=document.createElement('div');div.className='kprow';div.dataset.idx=i;
  div.style.cssText='display:flex;gap:6px;margin-top:4px;flex-wrap:wrap';
  div.innerHTML=`<select id="kpl-${i}">${Object.entries(KP_LOAI).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
    <input id="kpt-${i}" type="number" min="0" placeholder="Số tiền (VND)" style="width:140px" oninput="tinhKP()">
    <input id="kpg-${i}" placeholder="Ghi chú — vd: HN–Seoul khứ hồi ×2 người" style="flex:1;min-width:180px">`;
  document.getElementById('kpList').appendChild(div);applyLang();
}
function tinhKP(){
  let t=0;document.querySelectorAll('.kprow input[type=number]').forEach(el=>t+=+el.value||0);
  document.getElementById('kpTong').textContent=t?('Σ '+t.toLocaleString('vi')+' đ'):'';
}
function locMau(){
  const q=mLoc.value.trim().toLowerCase();
  document.querySelectorAll('#mDS .mrow').forEach(r=>{r.style.display=!q||r.dataset.ten.includes(q)?'':'none'});
}
function themDongMau(){
  const i='n'+(MAU_NEW++);
  const div=document.createElement('div');
  div.style.cssText='border-bottom:1px solid var(--border);padding:8px;background:var(--warn-bg)';
  div.innerHTML=`<div class="grid g4" style="gap:6px">
    <input id="mten-${i}" placeholder="Tên tài khoản/dự án mới *" style="grid-column:span 2">
    <input id="mh-${i}" placeholder="Hành động trong kỳ *" style="grid-column:span 2">
    <input id="mmt-${i}" placeholder="Mục tiêu / target quan hệ" style="grid-column:span 2">
    <input id="mhh-${i}" placeholder="Hàng hóa dự kiến" style="grid-column:span 2">
    <input id="mvav-${i}" type="number" min="0" placeholder="Số bộ VAV">
    <input id="mgt-${i}" type="number" min="0" placeholder="Giá trị dự bán (VND)">
    <select id="mkdt-${i}"><option value="">— Doanh thu đến từ —</option><option value="npp">NPP</option>
      <option value="agent">Agent/Broker</option><option value="oem_odm">OEM/ODM</option><option value="truc_tiep">Trực tiếp</option></select>
    <input id="mct-${i}" placeholder="Chỉ tiêu khác"><input id="mhan-${i}" type="date">
    <select id="mbp-${i}"><option value="">— Cần hỗ trợ —</option><option value="rd">R&D</option>
      <option value="bo">BO</option><option value="tckt">TCKT</option><option value="qlsx">QLSX</option></select>
  </div>`;
  document.getElementById('mMoi').appendChild(div);applyLang();
}
async function luuMauKH(loai){
  const v=id=>document.getElementById(id)?.value?.trim()||'';
  if(!v('mTen')||!v('mTu')||!v('mDen')){alert('Thiếu tên hoặc kỳ');return}
  const kpArr=[];
  document.querySelectorAll('#kpList .kprow').forEach(row=>{const i=row.dataset.idx;
    const t=+v('kpt-'+i);if(t)kpArr.push({k:v('kpl-'+i),t:t,g:v('kpg-'+i)||''})});
  const plan={ten:v('mTen'),nguoi_lap:ME?.ho_ten||'?',khu_vuc:MOD==='nd'?'noi_dia':'quoc_te',
    ky_loai:loai,ky_tu:v('mTu'),ky_den:v('mDen'),
    chi_tieu_vav:+v('mVAV')||null,chi_tieu_doanh_thu:+v('mDT')||null,chi_tieu_npp_moi:+v('mNPP')||null,
    du_tru_kinh_phi:kpArr.length?kpArr:null,
    muc_tieu:v('mMT')||null,trong_tam:v('mTT')||null};
  const r=await sb.from('crm_plans').insert(plan).select();
  if(r.error){alert(r.error.message);return}
  const planId=r.data[0].id;let ok=0,thieu=0,okObj=0;
  for(const row of document.querySelectorAll('#mObjs .objrow')){
    const i=row.dataset.idx,dg=v('od-'+i);
    if(!dg)continue;
    const loai=v('ol-'+i)||'khac';
    const ct={};
    for(const [k] of (OBJ_QTY[loai]||[])){const x=+v('oq-'+i+'-'+k);if(x)ct[k]=x}
    if(loai==='su_kien'&&v('oq-'+i+'-ht'))ct.ht=v('oq-'+i+'-ht');
    if(loai==='khac'&&v('oq-'+i+'-dv'))ct.dv=v('oq-'+i+'-dv');
    const ins=await sb.from('crm_plan_objectives').insert({plan_id:planId,uu_tien:row.dataset.uu,
      loai:loai,dien_giai:dg,chi_tiet:Object.keys(ct).length?ct:null,
      vung_quoc_gia:v('ov-'+i)||null,han:v('oh-'+i)||null});
    if(!ins.error)okObj++;
  }
  for(let i=0;i<MAU_ROWS.length;i++){
    if(!document.getElementById('mc-'+i)?.checked)continue;
    const hd=v('mh-'+i);if(!hd){thieu++;continue}
    const row=MAU_ROWS[i];
    const ins=await sb.from('crm_plan_items').insert({plan_id:planId,
      deal_id:row.k==='deal'?row.id:null,org_id:row.k==='org'?row.id:null,
      hanh_dong:hd,chi_tieu:v('mct-'+i)||null,muc_tieu:v('mmt-'+i)||null,
      hang_hoa:v('mhh-'+i)||null,so_bo_vav:+v('mvav-'+i)||null,
      gia_tri_du_kien:+v('mgt-'+i)||null,kenh_doanh_thu:v('mkdt-'+i)||null,
      han:v('mhan-'+i)||null,bo_phan_ho_tro:v('mbp-'+i)||null});
    if(!ins.error)ok++;
  }
  for(let j=0;j<MAU_NEW;j++){
    const i='n'+j,ten=v('mten-'+i),hd=v('mh-'+i);
    if(!hd)continue;
    const ins=await sb.from('crm_plan_items').insert({plan_id:planId,
      hanh_dong:hd+(ten?' — '+ten:''),chi_tieu:v('mct-'+i)||null,muc_tieu:v('mmt-'+i)||null,
      hang_hoa:v('mhh-'+i)||null,so_bo_vav:+v('mvav-'+i)||null,
      gia_tri_du_kien:+v('mgt-'+i)||null,kenh_doanh_thu:v('mkdt-'+i)||null,
      han:v('mhan-'+i)||null,bo_phan_ho_tro:v('mbp-'+i)||null});
    if(!ins.error)ok++;
  }
  dlgMau.close();
  alert('✔ Đã tạo kế hoạch: '+okObj+' mục tiêu + '+ok+' hạng mục hành động'+(thieu?' · '+thieu+' mục đã tick nhưng thiếu hành động (bỏ qua)':''));
  await loadPlans();openKH(planId);
}
const KH_COLS=['Dự án / Đối tác','Hành động *','Chỉ tiêu','Mục tiêu cột mốc','Hạn (YYYY-MM-DD)','Cần hỗ trợ từ (rd/bo/tckt/qlsx)'];
function taiTemplateKH(){
  const vd=[['VD: Bệnh viện ABC Hà Nội','Gặp CĐT bảo vệ thông số VAV','Spec-in','CĐT đồng ý đưa SVAV-S vào spec','2026-09-15','rd'],
            ['VD: Aathaworld Sdn Bhd','Gửi hồ sơ AHRI 880 + báo giá Simple Box Only','Báo giá 200 bộ','NPP xác nhận nhận chào giá','2026-09-01','bo']];
  const ws=XLSX.utils.aoa_to_sheet([KH_COLS,...vd]);
  ws['!cols']=[{wch:34},{wch:38},{wch:20},{wch:32},{wch:16},{wch:26}];
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Ke hoach');
  const hd=XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN ĐIỀN TEMPLATE KẾ HOẠCH'],[''],
    ['Hành động *','Bắt buộc. Hành động cụ thể — không viết "bám sát", "đẩy mạnh"'],
    ['Dự án / Đối tác','Gõ đúng tên như trong CRM để hệ thống tự nối; sai tên vẫn nhập được nhưng không nối'],
    ['Hạn','Định dạng YYYY-MM-DD, vd 2026-09-15'],
    ['Cần hỗ trợ từ','Chỉ nhận: rd, bo, tckt, qlsx — để trống nếu tự làm'],
    ['Hai dòng VD','Xoá trước khi nhập thật'],[''],
    ['Nhập lại file này','Mở kế hoạch trong app → ⬆ Nhập từ Excel']]);
  hd['!cols']=[{wch:22},{wch:80}];
  XLSX.utils.book_append_sheet(wb,hd,'Huong dan');
  XLSX.writeFile(wb,'template-ke-hoach.xlsx');
}
function xuatKH(planId){
  const p=PLANS.find(x=>x.id===planId);if(!p)return;
  sb.from('crm_plan_items').select('*').eq('plan_id',planId).order('created_at').then(r=>{
    const rows=(r.data||[]).map(i=>{const d=ALL_DEALS.find(x=>x.id===i.deal_id),o=ALL_ORGS.find(x=>x.id===i.org_id);
      return [d?.ten||o?.ten||'',i.hanh_dong||'',i.chi_tieu||'',i.muc_tieu||'',i.han||'',i.bo_phan_ho_tro||'']});
    const ws=XLSX.utils.aoa_to_sheet([KH_COLS,...rows]);
    ws['!cols']=[{wch:34},{wch:38},{wch:20},{wch:32},{wch:16},{wch:26}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Ke hoach');
    XLSX.writeFile(wb,('ke-hoach-'+(p.ten||'x')).replace(/[^\w\-àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ ]/gi,'').trim().replace(/\s+/g,'-')+'.xlsx');
  });
}
async function nhapKIExcel(planId,inp){
  const f=inp.files[0];if(!f)return;
  try{
    const wb=XLSX.read(await f.arrayBuffer());
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''});
    let ok=0,bo=0;
    for(const r of rows.slice(1)){
      const ten=(r[0]||'').toString().trim(),hd=(r[1]||'').toString().trim();
      if(!hd||hd.startsWith('VD:')||ten.startsWith('VD:')){if(hd)bo++;continue}
      const d=ALL_DEALS.find(x=>x.ten===ten),o=!ALL_DEALS.find(x=>x.ten===ten)?ALL_ORGS.find(x=>x.ten===ten):null;
      const bp=(r[5]||'').toString().trim().toLowerCase();
      let han=(r[4]||'').toString().trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(han))han=null;
      const ins=await sb.from('crm_plan_items').insert({plan_id:planId,deal_id:d?.id||null,org_id:o?.id||null,
        hanh_dong:hd,chi_tieu:(r[2]||'').toString().trim()||null,muc_tieu:(r[3]||'').toString().trim()||null,
        han:han,bo_phan_ho_tro:['rd','bo','tckt','qlsx'].includes(bp)?bp:null});
      if(!ins.error)ok++;
    }
    alert('Đã nhập '+ok+' hạng mục'+(bo?' · bỏ qua '+bo+' dòng VD':''));
  }catch(e){alert('Lỗi đọc file: '+e.message)}
  inp.value='';openKH(planId);
}
async function duyetKH(planId,tt){
  const yk=document.getElementById('khYK').value.trim();
  if(tt==='tu_choi'&&!yk){alert(t('Từ chối bắt buộc ghi lý do — quy tắc L4'));return}
  await sb.from('crm_plans').update({trang_thai:tt}).eq('id',planId);
  await sb.from('crm_approvals').update({trang_thai:tt,nguoi_duyet:ME?.ho_ten||'?',
    y_kien_duyet:yk||null,decided_at:new Date().toISOString()})
    .eq('doi_tuong','plan').eq('doi_tuong_id',planId).eq('trang_thai','cho_duyet');
  await loadPlans();await loadAprQueue();openKH(planId);
}
async function trinhKH(planId){
  const p=PLANS.find(x=>x.id===planId);
  await sb.from('crm_plans').update({trang_thai:'cho_duyet'}).eq('id',planId);
  const cap=(ME?.vai_tro==='staff'||ME?.vai_tro==='bo')?'manager':'ceo';
  const han14=new Date(Date.now()+14*864e5).toISOString().slice(0,10);
  await sb.from('crm_approvals').insert({doi_tuong:'plan',doi_tuong_id:planId,
    loai:'duyet_ke_hoach',cap_duyet:cap,nguoi_de_xuat:ME?.ho_ten||p.nguoi_lap,
    noi_dung:t('Trình duyệt kế hoạch: ')+p.ten+' ('+p.ky_tu+' → '+p.ky_den+')',han:han14});
  const kp=(p.du_tru_kinh_phi||[]).reduce((a,x)=>a+(+x.t||0),0);
  if(kp>0)await sb.from('crm_approvals').insert({doi_tuong:'plan',doi_tuong_id:planId,
    loai:'ngan_sach_su_kien',cap_duyet:'cfo',nguoi_de_xuat:ME?.ho_ten||p.nguoi_lap,
    noi_dung:t('Dự trù kinh phí công tác: ')+kp.toLocaleString('vi')+' đ — '+p.ten,han:han14});
  await loadPlans();await loadAll();dlgKH.close();
}

