/* ==========================================================================
   CRM — NSCA / Starduct   ·   Tab Nhập dữ liệu
   Nguồn: index.html v20 dòng 2751–2848 (cắt nguyên khối, KHÔNG sửa logic)
   Tab 'Nhập dữ liệu' — nạp CSDL đối tác / pipeline / sự kiện từ Excel
   ========================================================================== */
/* ================= IMPORT ================= */
const L=m=>{impLog.textContent+=('\n'+m);impLog.scrollTop=impLog.scrollHeight};
async function runImport(){
  if(!sb){alert('Kết nối Supabase trước');return}
  const f=impFile.files[0];if(!f){alert('Chọn file .xlsx');return}
  impLog.textContent='Đang đọc file…';
  const wb=XLSX.read(await f.arrayBuffer());
  const shDT=wb.SheetNames.find(n=>n.includes('Đối tác')||n.includes('CSDL'));
  const shDA=wb.SheetNames.find(n=>n.includes('Pipeline')||n.includes('Dự án'));
  const shSK=wb.SheetNames.find(n=>n.includes('Sự kiện'));
  // ---- Đối tác ----
  if(shDT){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[shDT]);
    L(`Đối tác: ${rows.length} dòng`);
    const seen=new Map(); const orgs=[]; const contacts=[];
    rows.forEach((r,i)=>{
      const ten=(r['Tên công ty']||'').toString().trim(); if(!ten)return;
      const qg=toISO(r['Quốc gia']);
      const key=ten.toLowerCase()+'|'+qg;
      const plRaw=(r['Phân loại']||'').toString().toLowerCase();
      const pl=plRaw.includes('cđt')?'cdt':plRaw.includes('tvtk')?'tvtk':
               plRaw.includes('thầu')?'thau':plRaw.includes('phân phối')?'npp':'khac';
      const tt=(r['Trạng thái quan hệ']||'').toString().toLowerCase();
      const tinhBao=tt.includes('không áp dụng');
      let pheu=null,phu=0;
      if(pl==='npp'){pheu=tt.includes('đã ký')&&!tt.includes('mou')?'da_ky_hd':
        tt.includes('mou')?'da_ky_mou':tt.includes('pipeline')||tt.includes('đàm phán')?'dang_dam_phan':
        tt.includes('đã biết')?'dang_ket_noi':'chua_tiep_can'}
      if(tt.includes('đã ký'))phu=4; else if(tt.includes('đã biết')||tt.includes('pipeline'))phu=1;
      if(seen.has(key)){ // trùng — chỉ giữ dòng đầu, gộp contact
      } else {
        seen.set(key,orgs.length);
        const qh=tinhBao?null:
          pl==='npp'?(pheu==='da_ky_hd'?'npp_hien_huu':'npp_moi'):'kh_tiem_nang';
        orgs.push({ten,phan_loai:pl,quoc_gia:qg,thanh_pho:(r['Thành phố']||'').toString()||null,
          mo_ta:(r['Mô tả / Quy mô']||'').toString().slice(0,400)||null,
          loai_ban_ghi:tinhBao?'tinh_bao':'muc_tieu',trang_thai_phu:phu,pheu_npp:pheu,quan_he:qh,
          nguon:'kh_qt_v22',dong_goc:i+2,ghi_chu:tinhBao?tt.slice(0,200):null});
      }
      const nguoi=(r['Người phụ trách']||'').toString().trim();
      if(nguoi)contacts.push({_key:key,ho_ten:nguoi,chuc_danh:(r['Chức danh']||'').toString()||null,
        email:(r['Email']||'').toString()||null,linkedin:(r['LinkedIn']||'').toString()||null,
        dien_thoai:(r['Điện thoại']||'').toString()||null,la_nguoi_ra_quyet_dinh:true,nguon:'kh_qt_v22'});
    });
    L(`→ ${orgs.length} công ty duy nhất (gộp ${rows.length-orgs.length} trùng) · ${contacts.length} người liên hệ`);
    const idByKey=new Map();
    for(let i=0;i<orgs.length;i+=100){
      const chunk=orgs.slice(i,i+100);
      const r=await sb.from('crm_org').insert(chunk).select('id,ten,quoc_gia');
      if(r.error){L('❌ '+r.error.message);return}
      r.data.forEach(o=>idByKey.set(o.ten.toLowerCase()+'|'+o.quoc_gia,o.id));
      L(`  đối tác: ${Math.min(i+100,orgs.length)}/${orgs.length}`);
    }
    const cRows=contacts.map(c=>({org_id:idByKey.get(c._key),ho_ten:c.ho_ten,chuc_danh:c.chuc_danh,
      email:c.email,linkedin:c.linkedin,dien_thoai:c.dien_thoai,
      la_nguoi_ra_quyet_dinh:c.la_nguoi_ra_quyet_dinh,nguon:c.nguon})).filter(c=>c.org_id);
    for(let i=0;i<cRows.length;i+=100){
      const r=await sb.from('crm_contacts').insert(cRows.slice(i,i+100));
      if(r.error){L('❌ contacts: '+r.error.message);return}
    }
    L(`✓ Nạp xong đối tác + người liên hệ`);
  }
  // ---- Dự án ----
  if(shDA){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[shDA]);
    L(`Dự án: ${rows.length} dòng`);
    const deals=rows.map((r,i)=>{
      const ten=(r['Tên dự án']||'').toString().trim();if(!ten)return null;
      const ut=(r['Giai đoạn ưu tiên (tính toán)']||r['Giai đoạn ưu tiên']||'').toString();
      return {ten,quoc_gia:toISO(r['Quốc gia']),dia_diem:(r['Địa điểm']||'').toString()||null,
        cdt_text:nv(r['Chủ đầu tư']),tvtk_text:nv(r['Tư vấn thiết kế']),
        thau_text:nv(r['Tổng thầu / Nhà thầu MEP']),
        hang_muc:(r['Hạng mục Starduct nhắm tới']||'').toString().slice(0,200)||null,
        giai_doan:(r['Giai đoạn']||'').toString().slice(0,200)||null,
        moc_spec_in:(r['Mốc Spec-in']||'').toString().slice(0,300)||null,
        uu_tien:ut.slice(0,60)||null,nguon:'kh_qt_v22',dong_goc:i+2}}).filter(Boolean);
    for(let i=0;i<deals.length;i+=100){
      const r=await sb.from('crm_deals').insert(deals.slice(i,i+100));
      if(r.error){L('❌ '+r.error.message);return}
      L(`  dự án: ${Math.min(i+100,deals.length)}/${deals.length}`);
    }
    L('✓ Nạp xong dự án');
  }
  // ---- Sự kiện ----
  if(shSK){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[shSK]);
    const evs=rows.map(r=>({quoc_gia:(r['Quốc gia/Khu vực']||'').toString()||null,
      ten:(r['Tên sự kiện hoặc hiệp hội']||'').toString(),loai:(r['Loại']||'').toString()||null,
      thoi_gian:(r['Thời gian']||'').toString()||null,dia_diem:(r['Địa điểm']||'').toString()||null,
      website:(r['Website']||'').toString()||null,ghi_chu:(r['Ghi chú']||'').toString().slice(0,300)||null}))
      .filter(e=>e.ten);
    const r=await sb.from('crm_events').insert(evs);
    if(r.error){L('❌ '+r.error.message);return}
    L(`✓ Nạp ${evs.length} sự kiện`);
  }
  L('HOÀN TẤT. Chuyển sang tab Tổng quan.');
  await loadAll();
}
