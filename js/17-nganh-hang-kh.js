/* ==========================================================================
   CRM — NSCA / Starduct   ·   v33 KẾ HOẠCH THEO NGÀNH HÀNG CHỦ LỰC
   Bổ sung vào form Lập kế hoạch (dlgMau của 04-ke-hoach.js):
   · Ma trận ngành hàng chiến lược Starduct chào bán / Spec-in:
     SỐ LƯỢNG dự kiến + DOANH THU dự kiến trong kỳ + ghi chú chiến lược
   · Tổng doanh thu tự cộng → 1 nút điền vào "Doanh thu mục tiêu"
   · ⬇ Tải template Excel về lập → ⬆ Nạp lại, tự điền vào ma trận
   · Lưu vào crm_plans.nganh_hang (JSONB — chạy supabase-migration-v33.sql)
   · Xem lại trong hộp thoại kế hoạch (openKH)
   ========================================================================== */

/* Danh mục hàng hóa chủ lực — khớp cột báo giá & chiến lược sản phẩm */
const NH_DM=[
  ['vav_cav','VAV / CAV Box (AHRI 880) — sản phẩm lõi'],
  ['van_gio_ei','Van ngăn cháy EI (cầu chì / động cơ)'],
  ['van_e120','Van ngăn cháy E120 (cầu chì / động cơ)'],
  ['van_gio_co_khi','Van gió cơ khí (tay gạt / động cơ)'],
  ['cua_gio','Cửa gió'],
  ['ong_gio','Ống gió (EI & thường)'],
  ['ong_gio_mem','Ống gió mềm (bảo ôn / không bảo ôn)'],
  ['thang_mang_cap','Thang máng cáp (TMC)'],
  ['canvas','Canvas'],
  ['unistar','Unistar + giá đỡ'],
  ['tu_pccc','Tủ PCCC'],
  ['tam_nan','Sọt trứng / tấm nan (XK)'],
  ['khac','Hàng hóa & dịch vụ khác'],
];

/* ===== 1. CHÈN MA TRẬN VÀO FORM LẬP KẾ HOẠCH ===== */
const _moMauKH_v20=typeof moMauKH==='function'?moMauKH:null;
if(_moMauKH_v20)moMauKH=function(){
  _moMauKH_v20();
  const mTT=document.getElementById('mTT');if(!mTT)return;
  const sec=document.createElement('div');sec.id='nhSec';
  sec.innerHTML=`
  <h3 style="font-size:13px;margin:12px 0 6px">📦 ${t('Kế hoạch theo NGÀNH HÀNG chủ lực')}
    <span class="muted">— ${t('chào bán / spec-in gì · bao nhiêu · doanh thu bao nhiêu')}</span>
    <span style="float:right;display:flex;gap:6px">
      <button class="btn" style="padding:2px 8px" onclick="nhTaiTemplate()">⬇ ${t('Template Excel')}</button>
      <button class="btn" style="padding:2px 8px" onclick="document.getElementById('nhFile').click()">⬆ ${t('Nạp từ Excel')}</button>
      <input type="file" id="nhFile" accept=".xlsx,.xls" style="display:none" onchange="nhNapExcel(this)">
    </span></h3>
  <div style="border:1px solid var(--border);border-radius:8px;overflow:auto;max-height:320px">
  <table style="margin:0"><tr><th style="min-width:210px">${t('Ngành hàng')}</th>
    <th style="width:90px">${t('SL dự kiến')}</th><th style="width:140px">${t('Doanh thu dự kiến (VND)')}</th>
    <th>${t('Chiến lược / Spec-in / thị trường nhắm tới')}</th></tr>
  ${NH_DM.map(([k,ten])=>`<tr>
    <td style="font-size:12.5px">${ten}</td>
    <td><input id="nhSL_${k}" type="number" min="0" style="width:80px" oninput="nhTinhTong()"></td>
    <td><input id="nhDT_${k}" type="number" min="0" style="width:130px" oninput="nhTinhTong()"></td>
    <td><input id="nhGC_${k}" style="width:100%" placeholder="${t('VD: spec-in 3 dự án DC miền Bắc qua NTK…')}"></td>
  </tr>`).join('')}
  </table></div>
  <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
    <b id="nhTong" style="font-size:13px">${t('Tổng doanh thu ngành hàng')}: 0</b>
    <button class="btn" style="padding:2px 8px" onclick="mDT.value=window.__nhTong||'';">↧ ${t('Điền vào Doanh thu mục tiêu')}</button>
  </div>`;
  mTT.insertAdjacentElement('afterend',sec);
  applyLang&&applyLang();
};
function nhTinhTong(){
  let sum=0;
  for(const [k] of NH_DM)sum+=+(document.getElementById('nhDT_'+k)?.value||0);
  window.__nhTong=sum;
  const el=document.getElementById('nhTong');
  if(el)el.textContent=t('Tổng doanh thu ngành hàng')+': '+(sum?fmtB(sum):'0');
}
function nhGom(){
  const arr=[];
  for(const [k,ten] of NH_DM){
    const sl=+(document.getElementById('nhSL_'+k)?.value||0);
    const dt=+(document.getElementById('nhDT_'+k)?.value||0);
    const gc=(document.getElementById('nhGC_'+k)?.value||'').trim();
    if(sl||dt||gc)arr.push({k,ten,sl:sl||null,dt:dt||null,gc:gc||null});
  }
  return arr.length?arr:null;
}

/* ===== 2. LƯU VÀO crm_plans.nganh_hang (bọc luuMauKH) ===== */
const _luuMauKH_v20=typeof luuMauKH==='function'?luuMauKH:null;
if(_luuMauKH_v20)luuMauKH=async function(loai){
  const nh=nhGom();
  const origFrom=sb.from.bind(sb);
  sb.from=(tb)=>{const o=origFrom(tb);
    if(tb==='crm_plans'&&nh){const oi=o.insert.bind(o);
      o.insert=async r=>{let res=await oi({...r,nganh_hang:nh});
        if(res.error&&/nganh_hang/.test(res.error.message))res=await oi(r); // chưa migration → bỏ cột
        return res}}
    return o};
  try{await _luuMauKH_v20(loai)}finally{sb.from=origFrom}
};

/* ===== 3. XEM LẠI NGÀNH HÀNG TRONG HỘP THOẠI KẾ HOẠCH ===== */
const _openKH_v20=typeof openKH==='function'?openKH:null;
if(_openKH_v20)openKH=async function(id){
  await _openKH_v20(id);
  try{
    const r=await sb.from('crm_plans').select('nganh_hang').eq('id',id).single();
    const nh=r.data?.nganh_hang;
    if(!nh||!nh.length)return;
    const body=dlgKH.querySelector('.dbody');if(!body||document.getElementById('nhXem'))return;
    const tong=nh.reduce((s,x)=>s+(+x.dt||0),0);
    const box=document.createElement('div');box.id='nhXem';
    box.innerHTML=`<h3 style="font-size:13px;margin:14px 0 6px">📦 ${t('Kế hoạch ngành hàng')}
      <span class="muted">— ${t('tổng')} ${fmtB(tong)}</span></h3>
    <table><tr><th>${t('Ngành hàng')}</th><th class="num">SL</th><th class="num">${t('Doanh thu')}</th><th>${t('Chiến lược')}</th></tr>
    ${nh.map(x=>`<tr><td style="font-size:12.5px">${esc(x.ten)}</td>
      <td class="num">${x.sl??''}</td><td class="num"><b>${x.dt?fmtB(+x.dt):''}</b></td>
      <td class="muted" style="font-size:12px">${esc(x.gc||'')}</td></tr>`).join('')}</table>`;
    body.appendChild(box);
  }catch(e){}
};

/* ===== 4. TEMPLATE EXCEL: TẢI VỀ LẬP → NẠP LÊN ===== */
function nhTaiTemplate(){
  const rows=[[ 'NGÀNH HÀNG','SỐ LƯỢNG DỰ KIẾN','DOANH THU DỰ KIẾN (VND)','CHIẾN LƯỢC / SPEC-IN / THỊ TRƯỜNG NHẮM TỚI' ],
    ...NH_DM.map(([k,ten])=>[ten,null,null,null])];
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:44},{wch:16},{wch:22},{wch:52}];
  const hd=XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN LẬP KẾ HOẠCH NGÀNH HÀNG'],[''],
    ['1','Điền SỐ LƯỢNG và DOANH THU dự kiến trong kỳ cho từng ngành hàng chủ lực'],
    ['2','Cột CHIẾN LƯỢC: ghi rõ spec-in ở đâu, qua NPP nào, thị trường nào, mốc thời gian'],
    ['3','KHÔNG sửa tên ngành hàng ở cột A — hệ thống khớp theo tên'],
    ['4','Xong: vào tab Kế hoạch → Lập kế hoạch → ⬆ Nạp từ Excel → chọn file này'],
    ['5','Các ô để trống sẽ bỏ qua — chỉ cần điền ngành hàng có kế hoạch']]);
  hd['!cols']=[{wch:4},{wch:90}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'NGANH HANG');
  XLSX.utils.book_append_sheet(wb,hd,'HUONG DAN');
  XLSX.writeFile(wb,'ke-hoach-nganh-hang-'+new Date().toISOString().slice(0,10)+'.xlsx');
}
async function nhNapExcel(inp){
  const f=inp.files[0];if(!f)return;
  try{
    const wb=XLSX.read(await f.arrayBuffer());
    const ws=wb.Sheets['NGANH HANG']||wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
    let ok=0;
    for(const r of rows.slice(1)){
      const ten=(r[0]||'').toString().trim();if(!ten)continue;
      const nh=NH_DM.find(([k,l])=>l.toLowerCase()===ten.toLowerCase()
        ||l.toLowerCase().startsWith(ten.toLowerCase().slice(0,18)));
      if(!nh)continue;
      const k=nh[0];
      const num=v=>{if(v==null||v==='')return'';const n=+String(v).replace(/[,\s]/g,'');return isFinite(n)&&n?n:''};
      const sl=document.getElementById('nhSL_'+k),dt=document.getElementById('nhDT_'+k),gc=document.getElementById('nhGC_'+k);
      if(sl)sl.value=num(r[1]);if(dt)dt.value=num(r[2]);if(gc)gc.value=(r[3]||'').toString().trim();
      ok++;
    }
    nhTinhTong();
    alert('✓ '+t('Đã nạp')+' '+ok+' '+t('ngành hàng từ file — kiểm tra lại rồi bấm Tạo kế hoạch'));
  }catch(e){alert('❌ '+e.message)}
  inp.value='';
}
