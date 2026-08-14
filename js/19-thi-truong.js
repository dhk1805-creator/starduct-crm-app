/* ==========================================================================
   CRM — NSCA / Starduct   ·   v35.4: Tab THỊ TRƯỜNG (danh mục + tình báo)
   Nguồn dữ liệu: bảng crm_thi_truong (migration v37) — 16 thị trường:
   12 có hồ sơ tình báo (TL;DR + báo cáo đầy đủ EN) + 4 chỉ có NPP đã ký HĐ.
   NPP đã ký HĐ = nhà phân phối đang bán hàng, nhận gán KH/DA tại thị trường đó.
   ========================================================================== */
let MK_INIT=false,MK_ROWS=[];

async function initMK(){
  MK_INIT=true;
  const box=document.getElementById('mkList');
  if(!window.sb){box.innerHTML='<div class="muted">'+t('Kết nối & đăng nhập để xem dữ liệu thị trường.')+'</div>';MK_INIT=false;return}
  box.innerHTML='<div class="muted">'+t('Đang tải…')+'</div>';
  const r=await sb.from('crm_thi_truong').select('ma,ten,dac_diem,npp_ky_hd,ma_npp,ghi_chu_tham_khao,cap_nhat').order('ten');
  if(r.error){box.innerHTML='<div class="muted">'+esc(r.error.message)+' — '+t('cần chạy migration v37')+'</div>';MK_INIT=false;return}
  MK_ROWS=r.data||[];
  renderMK();
}

function renderMK(){
  const box=document.getElementById('mkList');if(!box)return;
  if(!MK_ROWS.length){box.innerHTML='<div class="muted">'+t('Chưa có dữ liệu.')+'</div>';return}
  // v35.4: QT riêng — ND riêng. Trang Quốc tế KHÔNG hiện VN; trang Nội địa chỉ hiện VN (quê nhà).
  const qt=MOD==='qt';
  const rows=MK_ROWS.filter(m=>(m.ma!=='VN')===qt)
    .sort((a,b)=>((b.dac_diem?1:0)-(a.dac_diem?1:0))||a.ten.localeCompare(b.ten));
  if(!rows.length){box.innerHTML='<div class="muted">'+t('Chưa có dữ liệu.')+'</div>';return}
  box.innerHTML=`<table><thead><tr>
    <th style="width:130px">${t('Thị trường')}</th>
    <th style="width:210px">${t('NPP đã ký HĐ')}</th>
    <th>${t('Đặc điểm thị trường')}</th>
    <th style="width:110px"></th></tr></thead><tbody>`+
  rows.map((m,i)=>`<tr>
    <td><b>${esc(m.ten)}</b>${m.ma==='VN'?' <span class="muted" style="font-size:11px">('+t('quê nhà')+')</span>':''}<div class="muted" style="font-size:11px">${esc(m.ma)}${m.ma_npp?' · '+esc(m.ma_npp):''}</div></td>
    <td>${m.npp_ky_hd?esc(m.npp_ky_hd):'<span class="muted">'+t('Chưa có NPP ký HĐ')+'</span>'}${m.ghi_chu_tham_khao?'<div class="muted" style="font-size:11px;margin-top:3px">'+t('Tham khảo:')+' '+esc(m.ghi_chu_tham_khao)+'</div>':''}</td>
    <td style="font-size:12.5px">${m.dac_diem?esc(m.dac_diem.length>420?m.dac_diem.slice(0,420)+'…':m.dac_diem):'<span class="muted">'+t('Chưa có báo cáo — bổ sung sau')+'</span>'}</td>
    <td>${m.dac_diem?`<button class="btn" onclick="openMK(${i})">📋 ${t('Xem hồ sơ')}</button>`:''}</td>
  </tr>`).join('')+'</tbody></table>';
  window.__mkSorted=rows;
}

async function openMK(i){
  const m=(window.__mkSorted||[])[i];if(!m)return;
  document.getElementById('mkTitle').textContent='📋 '+m.ten+' — '+t('Hồ sơ tình báo');
  const body=document.getElementById('mkBody');
  body.innerHTML='<div class="muted">'+t('Đang tải…')+'</div>';
  dlgMk.showModal();
  const r=await sb.from('crm_thi_truong').select('bao_cao,dac_diem,npp_ky_hd,ghi_chu_tham_khao,cap_nhat').eq('ma',m.ma).single();
  const d=r.data||{};
  body.innerHTML=(d.npp_ky_hd?`<div class="notice" style="margin-bottom:8px"><b>${t('NPP đã ký HĐ')}:</b> ${esc(d.npp_ky_hd)}</div>`:'')+(d.ghi_chu_tham_khao?`<div class="muted" style="margin-bottom:8px;font-size:12px">${t('Tham khảo:')} ${esc(d.ghi_chu_tham_khao)}</div>`:'')+
    `<pre style="white-space:pre-wrap;font-family:inherit;font-size:12.5px;line-height:1.5;max-height:64vh;overflow:auto;margin:0">${esc(d.bao_cao||d.dac_diem||'')}</pre>`+
    `<div class="muted" style="font-size:11px;margin-top:6px">${t('Nguồn')}: Market Intelligence 14/08/2026</div>`;
}

// đổi module Nội địa/Quốc tế → vẽ lại danh mục thị trường
modSel.addEventListener('change',()=>{if(MK_INIT)renderMK()});

// gắn lazy-init vào nav (addEventListener — không đè handler của 01-core)
nav.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(b&&b.dataset.t==='mk'&&!MK_INIT)initMK();
});
