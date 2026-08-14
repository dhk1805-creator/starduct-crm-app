/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Doanh thu & KPI kỳ
   Nguồn: index.html v20 dòng 1994–2181 (cắt nguyên khối, KHÔNG sửa logic)
   Hằng số ngành hàng/stage/kênh + Tab 'Doanh thu' + Tab 'KPI kỳ'
   ========================================================================== */
const NGANH={CG:'Cửa gió',EI:'Van EI',VCK:'Van cơ khí',VAV_CAV:'VAV/CAV',TAM_NAN:'Tấm nan',
  TMC:'TMC',SWAY:'Sway',ERV:'ERV',KHAC:'Khác'};
const STG={tiep_can:'Tiếp cận',spec_in:'Spec-in',chao_gia:'Chào giá',dam_phan:'Đàm phán',po:'PO',dong:'Đóng'};
const HTL={bao_gia:'Báo giá',ban_ve:'Bản vẽ',gia_san_pham_moi:'Giá SP mới/phi tiêu chuẩn',
  tien_do_sx:'Tiến độ SX',fat:'FAT/thử nghiệm',cong_no:'Công nợ',claim:'Claim',khac:'Khác'};
const SKT={chua_quyet:'Chưa quyết',se_tham_du:'Sẽ tham dự',da_tham_du:'Đã tham dự',bo_qua:'Bỏ qua'};
const KENH={npp:'NPP',agent_broker:'Agent/Broker',truc_tiep:'Trực tiếp',oem:'OEM'};
for(const el of ['frvNam','frvXem','frvKenh']) document.getElementById(el).onchange=renderRV;
function renderRV(){
  // bộ chọn năm + người phụ trách
  const years=[...new Set(REVS.map(r=>r.thang.slice(0,4)))].sort().reverse();
  if(!years.length)years.push(new Date().getFullYear()+'');
  if(frvNam.options.length!==years.length){const c=frvNam.value;
    frvNam.innerHTML=years.map(y=>`<option>${y}</option>`).join('');frvNam.value=years.includes(c)?c:years[0]}
  const owners=[...new Set(ORGS.map(o=>o.nguoi_phu_trach).filter(Boolean))].sort();
  if(frvXem.options.length-1!==owners.length){const c=frvXem.value;
    frvXem.innerHTML='<option value="all">👑 Toàn cảnh (Manager/CEO)</option>'+
      owners.map(o=>`<option value="${esc(o)}">👤 ${esc(o)}</option>`).join('');frvXem.value=c||'all'}
  // lọc
  let rows=REVS.filter(r=>r.thang.startsWith(frvNam.value)&&
    (!frvKenh.value||r.kenh===frvKenh.value)&&
    (frvXem.value==='all'||r.nguoi_phu_trach===frvXem.value));
  const tong=rows.reduce((s,r)=>s+ +r.so_tien,0);
  const thisM=new Date().toISOString().slice(0,7);
  const tongThang=rows.filter(r=>r.thang.slice(0,7)===thisM).reduce((s,r)=>s+ +r.so_tien,0);
  const vav=rows.filter(r=>r.ma_nganh==='VAV_CAV').reduce((s,r)=>s+(+r.so_bo_vav||0),0);
  rvKpis.innerHTML=[
    ['Luỹ kế '+frvNam.value,fmtB(tong),rows.length+' dòng ghi nhận'],
    ['Tháng hiện tại',fmtB(tongThang),thisM],
    ['Số bộ VAV',vav.toLocaleString('vi-VN'),'thước đo thị phần APAC'],
    ['Đối tác có doanh thu',new Set(rows.map(r=>r.ten_doi_tac)).size,
      frvXem.value==='all'?'toàn module':'của '+frvXem.value]
  ].map(([h,v,m])=>`<div class="kpi"><h3>${h}</h3><div class="v">${v}</div><div class="m">${m}</div></div>`).join('');
  // theo đối tác
  const byOrg={};
  for(const r of rows){const k=r.ten_doi_tac||'(không rõ)';
    const g=byOrg[k]=byOrg[k]||{t:0,qh:r.quan_he,ch:r.nguoi_phu_trach};g.t+=+r.so_tien}
  rvOrg.innerHTML=Object.keys(byOrg).length?'<table><tr><th>Đối tác</th><th>Nhóm</th><th>Phụ trách</th><th class="num">Doanh thu</th><th class="num">%</th></tr>'+
    Object.entries(byOrg).sort((a,b)=>b[1].t-a[1].t).map(([k,g])=>
    `<tr><td><b>${esc(k)}</b></td><td class="muted">${(QH[g.qh]||'—').replace(/^[^ ]+ /,'')}</td>
    <td class="muted">${esc(g.ch||'—')}</td><td class="num">${fmtB(g.t)}</td>
    <td class="num">${tong?Math.round(g.t/tong*100)+'%':''}</td></tr>`).join('')+'</table>'
    :'<div class="muted">Chưa có dữ liệu — nhập ở form dưới.</div>';
  // theo thị trường / vùng
  const byQG={};
  for(const r of rows){const k=r.quoc_gia==='VN'?('VN · '+(r.vung||'chưa rõ vùng')):(isoName[r.quoc_gia]||r.quoc_gia);
    byQG[k]=(byQG[k]||0)+ +r.so_tien}
  rvQG.innerHTML=Object.keys(byQG).length?'<table><tr><th>Thị trường / vùng</th><th class="num">Doanh thu</th><th class="num">%</th></tr>'+
    Object.entries(byQG).sort((a,b)=>b[1]-a[1]).map(([k,v])=>
    `<tr><td><b>${esc(k)}</b></td><td class="num">${fmtB(v)}</td>
    <td class="num">${tong?Math.round(v/tong*100)+'%':''}</td></tr>`).join('')+'</table>'
    :'<div class="muted">Chưa có dữ liệu.</div>';
  // tháng × ngành
  const months=[...Array(12)].map((_,i)=>frvNam.value+'-'+String(i+1).padStart(2,'0'));
  const mat={};for(const r of rows){const m=r.thang.slice(0,7);
    (mat[r.ma_nganh]=mat[r.ma_nganh]||{})[m]=((mat[r.ma_nganh]||{})[m]||0)+ +r.so_tien}
  rvThang.innerHTML='<table><tr><th>Ngành hàng</th>'+months.map(m=>`<th class="num">${m.slice(5)}</th>`).join('')+'<th class="num">Năm</th></tr>'+
    Object.entries(mat).map(([n,ms])=>{const s=Object.values(ms).reduce((a,b)=>a+b,0);
    return `<tr><td><b>${NGANH[n]||n}</b></td>${months.map(m=>`<td class="num">${ms[m]?fmtB(ms[m]):''}</td>`).join('')}
    <td class="num"><b>${fmtB(s)}</b></td></tr>`}).join('')+
    `<tr style="background:#fafbfc"><td><b>TỔNG</b></td>${months.map(m=>{
      const s=rows.filter(r=>r.thang.slice(0,7)===m).reduce((a,r)=>a+ +r.so_tien,0);
      return `<td class="num"><b>${s?fmtB(s):''}</b></td>`}).join('')}
    <td class="num"><b>${fmtB(tong)}</b></td></tr></table>`;
  orgListAll.innerHTML=ORGS.map(o=>`<option value="${esc(o.ten)}">`).join('');
}
async function saveRev(){
  const org=ORGS.find(o=>o.ten===rvO.value.trim());
  if(!rvT.value||!org||!rvS.value){rvMsg.textContent='⚠ Thiếu tháng, đối tác hoặc số tiền';return}
  if(rvN.value==='VAV_CAV'&&(!rvB.value||+rvB.value<=0)){
    rvMsg.textContent='⚠ Doanh thu VAV/CAV bắt buộc nhập SỐ BỘ — thước đo thị phần APAC';return}
  const r=await sb.from('crm_revenue').upsert({thang:rvT.value+'-01',org_id:org.id,
    quoc_gia:org.quoc_gia,vung:rvV.value||null,ma_nganh:rvN.value,kenh:rvK.value,
    so_tien:+rvS.value,so_bo_vav:rvB.value?+rvB.value:null,created_by:rvAi.value.trim()||null},
    {onConflict:'thang,org_id,ma_nganh,kenh'});
  if(r.error){rvMsg.textContent=r.error.message;return}
  rvMsg.textContent='✓ Đã lưu';rvS.value='';rvB.value='';await loadAll();
}

/* ================= KPI KỲ ================= */
function setKy(){
  const d=new Date(),y=d.getFullYear(),m=d.getMonth();
  const iso=x=>x.toISOString().slice(0,10);
  const map={
    tuan:()=>{const t=new Date(d);t.setDate(d.getDate()-((d.getDay()+6)%7));return[iso(t),iso(d)]},
    thang:()=>[`${y}-${String(m+1).padStart(2,'0')}-01`,iso(d)],
    quy:()=>[`${y}-${String(Math.floor(m/3)*3+1).padStart(2,'0')}-01`,iso(d)],
    '6thang':()=>[m<6?`${y}-01-01`:`${y}-07-01`,iso(d)],
    nam:()=>[`${y}-01-01`,iso(d)]};
  const [tu,den]=map[kpiKy.value]();kpiTu.value=tu;kpiDen.value=den;renderKPI();
}
(function(){const d=new Date();kpiTu.value=d.toISOString().slice(0,8)+'01';
  kpiDen.value=d.toISOString().slice(0,10)})();

async function lapBaoCao(){
  if(!sb)return;
  const r=await sb.rpc('crm_lap_bao_cao_ky',{p_ky:kpiKy.value,p_tu:kpiTu.value,p_den:kpiDen.value});
  bcMsg.textContent=r.error?('❌ '+r.error.message):
    `✓ Đã lưu snapshot báo cáo ${kpiKy.value} ${kpiTu.value} → ${kpiDen.value} cho từng nhân sự + dòng tổng`;
}
function nhanXet(n,p){
  const nx=[];
  if(p.tx===0)nx.push('chưa ghi nhận hoạt động nào trong kỳ');
  else{
    if(p.nangPhu>0)nx.push(`nâng được ${p.nangPhu} quan hệ${p.specIn?` (${p.specIn} đạt spec-in)`:''} — hiệu quả thật`);
    else nx.push(`${p.tx} tiếp xúc nhưng chưa nâng được quan hệ nào — cần xem chất lượng tiếp cận`);
    if(p.txQD===0)nx.push('chưa chạm cấp ra quyết định');
    if(p.tx&&p.txCoBuoc/p.tx<0.5)nx.push('quá nửa tiếp xúc không có bước tiếp theo');
  }
  if(p.dt>0)nx.push(`doanh thu ${fmtB(p.dt)} từ đối tác phụ trách`);
  if(p.caseXong>0)nx.push(`giải quyết ${p.caseXong} case`);
  if(p.naQuaHan>0)nx.push(`⚠ ${p.naQuaHan} việc tiếp theo đang quá hạn`);
  return nx.join(' · ');
}
function renderKPI(){
  const tu=kpiTu.value,den=kpiDen.value;if(!tu||!den)return;
  const inKy=x=>x&&x>=tu&&x<=den;
  const P={};const get=n=>{if(!n)return null;return P[n]=P[n]||{tx:0,txQD:0,nangPhu:0,specIn:0,
    dt:0,caseTao:0,caseXong:0,naQuaHan:0,txCoBuoc:0}};
  // Tiếp xúc — số action, chất lượng, hiệu quả
  for(const t of TPS){if(!inKy(t.ngay))continue;const p=get(t.nguoi_thuc_hien);if(!p)continue;
    p.tx++;if(t.la_cap_ra_quyet_dinh)p.txQD++;
    if(t.nang_phu_den!=null&&t.nang_phu_den>(t.nang_phu_tu??-1)){p.nangPhu++;if(t.nang_phu_den===3)p.specIn++}
    if(t.buoc_tiep_theo)p.txCoBuoc++}
  // Doanh thu trong kỳ — quy theo người phụ trách đối tác
  for(const r of REVS){if(!(r.thang>=tu.slice(0,8)+'01'&&r.thang<=den))continue;
    const p=get(r.nguoi_phu_trach);if(p)p.dt+=+r.so_tien}
  // Case hỗ trợ
  const today=new Date().toISOString().slice(0,10);
  for(const h of HTS){const cd=(h.created_at||'').slice(0,10);
    const p=get(h.nguoi_yeu_cau);if(p&&inKy(cd))p.caseTao++;
    if(p&&h.trang_thai==='da_xong'&&inKy((h.resolved_at||'').slice(0,10)))p.caseXong++}
  // Next action quá hạn (đang treo) theo owner dự án
  for(const d of DEALS){if(d.next_action&&d.next_action_han&&d.next_action_han<today){
    const p=get(d.owner);if(p)p.naQuaHan++}}
  const names=Object.keys(P);
  if(!names.length){kpiBody.innerHTML='<div class="muted">Chưa có hoạt động nào trong kỳ. Dữ liệu KPI sinh ra tự động khi đội ngũ ghi tiếp xúc, cập nhật dự án, nhập doanh thu và xử lý case — không ai phải nộp báo cáo riêng.</div>';}
  else{
    // điểm tương đối: chuẩn hoá từng cột về 0-100 theo max của kỳ
    const mx=k=>Math.max(...names.map(n=>P[n][k]))||1;
    const mTx=mx('tx'),mNang=mx('nangPhu'),mDt=mx('dt'),mCase=mx('caseXong');
    kpiBody.innerHTML=`<table><tr><th>Nhân sự</th>
      <th class="num" title="Số tiếp xúc trong kỳ">Action</th>
      <th class="num" title="Tiếp xúc cấp ra quyết định">Cấp QĐ</th>
      <th class="num" title="% tiếp xúc có bước tiếp theo">Có bước tiếp</th>
      <th class="num" title="Số lần nâng trạng thái phủ — hiệu quả thật">Nâng phủ</th>
      <th class="num" title="Trong đó đạt spec-in">Spec-in</th>
      <th class="num" title="Doanh thu các đối tác mình phụ trách">Doanh thu kỳ</th>
      <th class="num" title="Case gửi / case được giải quyết">Case tạo/xong</th>
      <th class="num" title="Việc tiếp theo đang quá hạn">NA quá hạn</th>
      <th class="num" title="Điểm tương đối trong kỳ — action 25% · nâng phủ 35% · doanh thu 30% · case 10%. THAM KHẢO, không thay bảng KPI chính thức">Điểm TK</th></tr>`+
    names.map(n=>{const p=P[n];
      const diem=Math.round(25*p.tx/mTx+35*p.nangPhu/mNang+30*p.dt/mDt+10*p.caseXong/mCase);
      return `<tr><td><b>${esc(n)}</b></td>
      <td class="num">${p.tx}</td><td class="num">${p.txQD}</td>
      <td class="num">${p.tx?Math.round(p.txCoBuoc/p.tx*100)+'%':'—'}</td>
      <td class="num"><b>${p.nangPhu}</b></td><td class="num">${p.specIn}</td>
      <td class="num">${p.dt?fmtB(p.dt):'—'}</td>
      <td class="num">${p.caseTao}/${p.caseXong}</td>
      <td class="num"${p.naQuaHan?' style="color:var(--bad);font-weight:700"':''}>${p.naQuaHan||''}</td>
      <td class="num"><span class="pill ${diem>=70?'p4':diem>=40?'p2':'p1'}">${diem}</span></td></tr>`}).join('')+'</table>'+
    `<div class="muted" style="margin-top:8px">Điểm tham khảo = action 25% · nâng phủ 35% · doanh thu 30% · case 10%, chuẩn hoá theo giá trị cao nhất trong kỳ.
     <b>Không thay thế bảng KPI chính thức</b> (mẫu số là chỉ tiêu được giao) — đây là thước nhịp làm việc để Manager điều phối hằng tuần.</div>`;
  }
  // Nhận xét tự động theo nhân sự — nội dung cho báo cáo kỳ
  if(names.length&&window.kpiNX){
    kpiNX.innerHTML=names.map(n=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)">
      <b>${esc(n)}</b><div class="muted" style="margin-top:2px">${esc(nhanXet(n,P[n]))}</div></div>`).join('')+
      `<div class="muted" style="margin-top:8px">Nhận xét sinh tự động theo luật, làm nền cho phần
       phân tích của Manager/BO trong báo cáo kỳ — người đánh giá bổ sung ý kiến định tính khi lập báo cáo chính thức.</div>`;
  } else if(window.kpiNX){kpiNX.innerHTML='<div class="muted">Chưa có dữ liệu trong kỳ.</div>'}

  // Tốc độ phản hồi case theo bộ phận trong kỳ
  const agg={};
  for(const h of HTS){const cd=(h.created_at||'').slice(0,10);if(!inKy(cd))continue;
    const g=agg[h.bo_phan_nhan]=agg[h.bo_phan_nhan]||{n:0,xong:0,tongNgay:0,quaHan:0};
    g.n++;
    if(h.trang_thai==='da_xong'&&h.resolved_at){g.xong++;
      g.tongNgay+=(new Date(h.resolved_at)-new Date(h.created_at))/864e5}
    else if(h.han&&h.han<today)g.quaHan++}
  kpiCase.innerHTML=Object.keys(agg).length?'<table><tr><th>Bộ phận</th><th class="num">Nhận trong kỳ</th><th class="num">Đã xong</th><th class="num">TG phản hồi TB (ngày)</th><th class="num">Đang quá hạn</th></tr>'+
    Object.entries(agg).map(([k,g])=>`<tr><td><b>${BP[k]||k}</b></td>
    <td class="num">${g.n}</td><td class="num">${g.xong}</td>
    <td class="num">${g.xong?(g.tongNgay/g.xong).toFixed(1):'—'}</td>
    <td class="num"${g.quaHan?' style="color:var(--bad);font-weight:700"':''}>${g.quaHan||''}</td></tr>`).join('')+'</table>'
    :'<div class="muted">Chưa có case nào trong kỳ.</div>';
}

