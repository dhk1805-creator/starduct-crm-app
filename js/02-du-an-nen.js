/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Dự án nền & nạp file DA·BCI·Báo giá
   Nguồn: index.html v20 dòng 1175–1338 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Dự án nền' + nạp file CẬP NHẬT DA THEO NPP / BCI / LIST BG
   ========================================================================== */
/* ================= DỰ ÁN NỀN (danh mục thị trường) ================= */
let DN_INIT=false,DN_PAGE=0;const DN_SIZE=50;
async function initDN(){
  if(!sb)return;DN_INIT=true;
  const [npp,tinh,ht]=await Promise.all([
    sb.from('crm_du_an_nen').select('npp_chi_dinh').not('npp_chi_dinh','is',null),
    sb.from('crm_du_an_nen').select('tinh').not('tinh','is',null),
    sb.from('crm_du_an_nen').select('hien_trang').not('hien_trang','is',null)]);
  const uniq=(r,k)=>[...new Set((r.data||[]).map(x=>(x[k]||'').trim()).filter(Boolean))].sort();
  fdnNPP.innerHTML='<option value="">— NPP chỉ định —</option>'+uniq(npp,'npp_chi_dinh').map(x=>`<option>${esc(x)}</option>`).join('');
  fdnTinh.innerHTML='<option value="">— Tỉnh —</option>'+uniq(tinh,'tinh').map(x=>`<option>${esc(x)}</option>`).join('');
  fdnHT.innerHTML='<option value="">— Hiện trạng —</option>'+uniq(ht,'hien_trang').map(x=>`<option>${esc(x)}</option>`).join('');
  loadDN();
}
async function loadDN(){
  if(!sb)return;
  let q=sb.from('crm_du_an_nen').select('*',{count:'exact'});
  const s=fdnQ.value.trim();
  if(s)q=q.or(`ma_du_an.ilike.%${s}%,ten_du_an.ilike.%${s}%,cdt.ilike.%${s}%`);
  if(fdnNPP.value)q=q.eq('npp_chi_dinh',fdnNPP.value);
  if(fdnTinh.value)q=q.eq('tinh',fdnTinh.value);
  if(fdnHT.value)q=q.eq('hien_trang',fdnHT.value);
  const r=await q.order('ma_du_an').range(DN_PAGE*DN_SIZE,DN_PAGE*DN_SIZE+DN_SIZE-1);
  if(r.error){dnList.innerHTML='<div class="notice warn">'+esc(r.error.message)+'</div>';return}
  window.DN_ROWS=r.data||[];
  const tong=r.count||0,maxP=Math.max(1,Math.ceil(tong/DN_SIZE));
  if(DN_PAGE>=maxP)DN_PAGE=maxP-1;
  dnCount.textContent=t('Tổng ')+tong+t(' dự án khớp bộ lọc');
  dnPage.textContent=t('Trang ')+(DN_PAGE+1)+' / '+maxP;
  dnList.innerHTML='<table><tr><th>Mã</th><th>Tên dự án</th><th>CĐT</th><th>Tỉnh</th><th>NPP chỉ định</th><th>Hiện trạng</th><th>Spec-in</th></tr>'+
    DN_ROWS.map((d,i)=>`<tr class="row" onclick="openDN(${i})">
      <td><b>${esc(d.ma_du_an)}</b></td><td>${esc(d.ten_du_an||'—')}</td>
      <td class="muted">${esc((d.cdt||'').slice(0,40))}</td><td>${esc(d.tinh||'—')}</td>
      <td>${d.npp_chi_dinh?'<span class="tag">'+esc(d.npp_chi_dinh)+'</span>':'—'}</td>
      <td>${esc(d.hien_trang||'—')}</td><td>${esc(d.spec_in||'—')}</td></tr>`).join('')+'</table>';
  applyLang();
}
async function openDN(i){
  const d=DN_ROWS[i];if(!d)return;
  dnTitle.textContent=d.ma_du_an+' — '+(d.ten_du_an||'');
  const F=(l,v)=>v?`<div style="margin:3px 0"><span class="muted" style="display:inline-block;min-width:150px">${l}</span> ${esc(v)}</div>`:'';
  dnBody.innerHTML=
    F(t('Chủ đầu tư'),d.cdt)+F(t('Tỉnh'),(d.tinh||'')+(d.quan_huyen?' · '+d.quan_huyen:''))+
    F(t('NPP được chỉ định'),d.npp_chi_dinh)+F(t('Ngày cập nhật NPP'),d.ngay_cap_nhat_npp)+
    F(t('KH đã báo giá'),d.kh_da_bao_gia)+F(t('Nhà thầu của NPP'),d.nha_thau_cua_npp)+
    F('Spec-in',d.spec_in)+F(t('Hiện trạng'),d.hien_trang)+F(t('NSCA cung cấp'),d.nsca_cung_cap)+
    F(t('Ghi chú'),d.ghi_chu)+F(t('Người cập nhật'),(d.nguoi_cap_nhat||'')+(d.ngay_cap_nhat?' · '+d.ngay_cap_nhat:''))+
    '<div id="dnExtra" class="muted" style="margin-top:10px;font-size:12px">…</div>';
  dlgDN.showModal();applyLang();
  const [log,bci]=await Promise.all([
    sb.from('crm_du_an_cap_nhat').select('*').eq('ma_du_an',d.ma_du_an).order('thang'),
    sb.from('crm_bci').select('giai_doan,chi_phi_du_toan,tvtk,tong_thau,ngay_cap_nhat').eq('ma_du_an',d.ma_du_an).limit(1)]);
  let ex='';
  if((bci.data||[]).length){const b=bci.data[0];
    ex+='<h3 style="font-size:13px;margin:8px 0 4px">'+t('Thông tin BCI')+'</h3>'+
      F('TVTK',b.tvtk)+F(t('Tổng thầu'),b.tong_thau)+F(t('Chi phí dự toán'),b.chi_phi_du_toan)+F(t('Giai đoạn'),(b.giai_doan||'').slice(0,200));}
  if((log.data||[]).length){
    ex+='<h3 style="font-size:13px;margin:8px 0 4px">'+t('Nhật ký cập nhật')+'</h3>'+
      log.data.map(x=>`<div style="margin:2px 0"><span class="tag">T${esc(x.thang||'?')}</span> ${esc(x.npp||'')} · ${esc(x.hien_trang||'')} ${x.ghi_chu?'— '+esc(x.ghi_chu.slice(0,160)):''} <span class="muted">(${esc(x.nguoi_cap_nhat||'?')})</span></div>`).join('');}
  document.getElementById('dnExtra').innerHTML=ex||t('Chưa có dữ liệu BCI / nhật ký cho mã này.');
  applyLang();
}

/* ============ UPLOAD FILE CẬP NHẬT DA & BÁO GIÁ ============ */
function daL(s){daLog.textContent+='\n'+s;daLog.scrollTop=daLog.scrollHeight}
function daNum(v){if(v==null||v==='')return null;const n=+String(v).replace(/[,\s]/g,'');return isFinite(n)?n:null}
function daDate(v){
  if(v==null||v==='')return null;
  if(v instanceof Date)return v.toISOString().slice(0,10);
  if(typeof v==='number')return new Date(Math.round((v-25569)*864e5)).toISOString().slice(0,10);
  const m=String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if(m)return (m[3].length===2?'20'+m[3]:m[3])+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  return null;
}
async function daUpsert(table,rows,conflict,label){
  let ok=0;
  for(let i=0;i<rows.length;i+=200){
    const r=await sb.from(table).upsert(rows.slice(i,i+200),{onConflict:conflict});
    if(r.error){daL('❌ '+label+': '+r.error.message);return false}
    ok=Math.min(i+200,rows.length);daL('  '+label+': '+ok+'/'+rows.length);
  }
  return true;
}
async function runImportDA(){
  if(!sb){alert(t('Kết nối Supabase trước'));return}
  const f=daFile.files[0];if(!f){alert(t('Chọn file .xlsx'));return}
  daLog.textContent=t('Đang đọc file…');
  const wb=XLSX.read(await f.arrayBuffer(),{cellDates:true});
  const S=(x)=>x==null?null:(String(x).trim()||null);
  let nhanDien=0;
  // ---- sheet DỰ ÁN → crm_du_an_nen ----
  if(wb.Sheets['DỰ ÁN']){
    nhanDien++;
    const raw=XLSX.utils.sheet_to_json(wb.Sheets['DỰ ÁN'],{header:1,defval:null});
    const seen=new Map();
    for(const r of raw){
      const ma=S(r[0]);if(!ma||!/^D\d/.test(ma))continue;
      const ten=S(r[1])||'';
      if(!ten&&!r.slice(2,16).some(x=>x!=null&&String(x).trim()!==''))continue;
      seen.set(ma+'|'+ten,{ma_du_an:ma,ten_du_an:ten,cdt:S(r[2]),tinh:S(r[3]),quan_huyen:S(r[4]),
        ma_tinh:S(r[5]),npp_chi_dinh:S(r[6]),ngay_cap_nhat_npp:S(r[7]),kh_da_bao_gia:S(r[8]),
        nha_thau_cua_npp:S(r[9]),spec_in:S(r[10]),hien_trang:S(r[11]),nsca_cung_cap:S(r[12]),
        ghi_chu:S(r[13]),ngay_cap_nhat:S(r[14]),nguoi_cap_nhat:S(r[15])});
    }
    daL(t('Sheet DỰ ÁN: ')+seen.size+t(' dòng hợp lệ'));
    if(!await daUpsert('crm_du_an_nen',[...seen.values()],'ma_du_an,ten_du_an','crm_du_an_nen'))return;
  }
  // ---- sheet THÔNG TIN BCI → crm_bci ----
  if(wb.Sheets['THÔNG TIN BCI']){
    nhanDien++;
    const raw=XLSX.utils.sheet_to_json(wb.Sheets['THÔNG TIN BCI'],{header:1,defval:null});
    const seen=new Map();
    for(const r of raw){
      const ten=S(r[2]);if(!ten||ten==='TÊN DỰ ÁN')continue;
      const ma=S(r[1])||'';
      seen.set(ma+'|'+ten,{stt:S(r[0]),ma_du_an:ma,ten_du_an:ten,dia_diem:S(r[3]),quy_mo:S(r[4]),
        chi_phi_du_toan:S(r[5]),cdt:S(r[6]),tvtk:S(r[7]),tong_thau:S(r[8]),thau_phu:S(r[9]),
        giai_doan:S(r[10]),npp_tiep_can:S(r[11]),ngay_cap_nhat:S(r[12]),thang_cap_nhat:S(r[13])});
    }
    daL('Sheet BCI: '+seen.size+t(' dòng hợp lệ'));
    if(!await daUpsert('crm_bci',[...seen.values()],'ma_du_an,ten_du_an','crm_bci'))return;
  }
  // ---- sheet Bảng tổng hợp 3 → crm_du_an_cap_nhat ----
  if(wb.Sheets['Bảng tổng hợp 3']){
    nhanDien++;
    const raw=XLSX.utils.sheet_to_json(wb.Sheets['Bảng tổng hợp 3'],{header:1,defval:null});
    const seen=new Map();let cur='';
    for(const r of raw){
      const th=S(r[0]);
      if(th&&!/Total/i.test(th))cur=(th.startsWith('#')?'khac':th);
      const ma=S(r[1]);if(!ma||!/^D\d/.test(ma))continue;
      let gc=S(r[4]);if(gc==='(blank)')gc=null;
      seen.set(cur+'|'+ma,{thang:cur||'',ma_du_an:ma,npp:S(r[2]),hien_trang:S(r[3]),ghi_chu:gc,nguoi_cap_nhat:S(r[5])});
    }
    daL(t('Sheet tổng hợp: ')+seen.size+t(' dòng hợp lệ'));
    if(!await daUpsert('crm_du_an_cap_nhat',[...seen.values()],'thang,ma_du_an','crm_du_an_cap_nhat'))return;
  }
  // ---- sheet LIST BG → crm_quotations ----
  if(wb.Sheets['LIST BG']){
    nhanDien++;
    const raw=XLSX.utils.sheet_to_json(wb.Sheets['LIST BG'],{header:1,defval:null});
    const rows=[];
    for(const r of raw){
      const stt=daNum(r[0]);if(stt==null||!S(r[1]))continue;
      const qg=S(r[10]);
      rows.push({stt:stt,ten_sheet_bg:S(r[1]),link_bg:S(r[2]),ngay_update:daDate(r[3]),
        thang:daNum(r[4]),nam:daNum(r[5]),trang_thai:S(r[6]),ma_da:S(r[7]),ten_da:S(r[8]),
        ten_khach:S(r[9]),quoc_gia:qg,kh_cua_santiago:S(r[11]),so_danh_muc:daNum(r[12]),
        gia_tri_bao_gia:daNum(r[13]),cua_gio:daNum(r[14]),van_gio_ei:daNum(r[15]),
        van_gio_co_khi:daNum(r[16]),vav_cav:daNum(r[17]),tam_nan:daNum(r[18]),
        thang_mang_cap:daNum(r[19]),hang_hoa_khac:daNum(r[20]),
        khu_vuc:(qg&&!/^viet\s*nam$/i.test(qg))?'quoc_te':'noi_dia'});
    }
    daL('Sheet LIST BG: '+rows.length+t(' dòng hợp lệ'));
    if(!await daUpsert('crm_quotations',rows,'stt','crm_quotations'))return;
  }
  if(!nhanDien){daL(t('⚠ Không nhận diện được sheet nào (cần: DỰ ÁN / THÔNG TIN BCI / Bảng tổng hợp 3 / LIST BG)'));return}
  // dong bo hien trang tu so goc sang cac deal dang theo (khop chac >=75%)
  const db=await sb.rpc('crm_dong_bo_nen_sang_deals');
  if(db.error)daL('⚠ '+t('Đồng bộ nền→deal lỗi: ')+db.error.message);
  else daL(t('↔ Đã đồng bộ hiện trạng sang ')+(db.data||0)+t(' dự án đang theo dõi'));
  daL(t('✓ Hoàn tất. Mở tab Dự án nền để tra cứu dữ liệu mới.'));
  DN_INIT=false;loadAll&&loadAll();
}
