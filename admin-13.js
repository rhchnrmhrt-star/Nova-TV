(()=>{
  'use strict';
  const API=window.NovaAPI;
  const root=document.getElementById('adminApp');
  if(!API||!root)return;

  function moveChannel(id,direction){
    const list=API.getChannels().slice().sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
    const index=list.findIndex(c=>String(c.id)===String(id));
    const target=index+Number(direction);
    if(index<0||target<0||target>=list.length)return;
    const a=list[index],b=list[target];
    const orderA=Number(a.sortOrder||index+1),orderB=Number(b.sortOrder||target+1);
    API.upsertChannel({...a,sortOrder:orderB});
    API.upsertChannel({...b,sortOrder:orderA});
    window.render?.();
  }

  function previewChannel(id){
    const c=API.getChannels().find(x=>String(x.id)===String(id));
    if(!c)return;
    document.getElementById('channelPreviewModal')?.remove();
    const modal=document.createElement('div');
    modal.id='channelPreviewModal';
    modal.className='channel-preview-modal';
    modal.innerHTML=`<div class="channel-preview-card" role="dialog" aria-modal="true" aria-label="معاينة ${escapeHtml(c.name)}">
      <button class="preview-close" aria-label="إغلاق" onclick="closeChannelPreview()">×</button>
      <div class="preview-visual" style="--accent:${escapeHtml(c.accent||'#168cff')};${c.backgroundUrl?`background-image:linear-gradient(120deg,rgba(3,8,18,.88),rgba(3,8,18,.35)),url('${escapeHtml(c.backgroundUrl)}')`:''}">
        ${c.logoUrl?`<img src="${escapeHtml(c.logoUrl)}" alt="${escapeHtml(c.name)}">`:`<div class="preview-fallback">${escapeHtml(c.shortName||c.name.slice(0,8))}</div>`}
      </div>
      <div class="preview-content">
        <span class="preview-live">● مباشر</span>
        <h2>${escapeHtml(c.name)}</h2>
        <p>${escapeHtml(c.description||'لا يوجد وصف للقناة.')}</p>
        <div class="preview-meta"><span>${escapeHtml(c.category||'عام')}</span><span>ترتيب ${Number(c.sortOrder||0)}</span><span>${c.enabled?'مفعلة':'موقفة'}</span></div>
        <div class="preview-actions">
          <button class="action-btn primary" onclick="editChannel('${escapeHtml(c.id)}');closeChannelPreview()">تعديل القناة</button>
          <a class="action-btn" href="${escapeHtml(c.url||'#')}" target="_blank" rel="noopener">اختبار رابط البث</a>
        </div>
      </div>
    </div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)closeChannelPreview();});
    document.body.appendChild(modal);
    setTimeout(()=>modal.classList.add('show'),10);
  }

  function closeChannelPreview(){
    const modal=document.getElementById('channelPreviewModal');
    if(!modal)return;
    modal.classList.remove('show');
    setTimeout(()=>modal.remove(),160);
  }

  function escapeHtml(v=''){
    return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function enhanceRows(){
    const tables=[...document.querySelectorAll('.admin-table')];
    const channelTable=tables.find(t=>[...t.querySelectorAll('th')].some(th=>th.textContent.trim()==='القناة'));
    if(!channelTable)return;
    [...channelTable.tBodies[0]?.rows||[]].forEach(row=>{
      const edit=[...row.querySelectorAll('button')].find(b=>b.textContent.trim()==='تعديل');
      if(!edit||row.dataset.admin13Ready)return;
      const match=edit.getAttribute('onclick')?.match(/editChannel\(['"](.+?)['"]\)/);
      if(!match)return;
      const id=match[1];
      row.dataset.admin13Ready='1';
      const actions=edit.parentElement;
      const preview=document.createElement('button');preview.textContent='معاينة';preview.onclick=()=>previewChannel(id);
      const up=document.createElement('button');up.textContent='↑';up.title='تحريك للأعلى';up.onclick=()=>moveChannel(id,-1);
      const down=document.createElement('button');down.textContent='↓';down.title='تحريك للأسفل';down.onclick=()=>moveChannel(id,1);
      actions?.insertBefore(preview,actions.firstChild);
      actions?.append(up,down);
    });
  }

  function updateVersion(){
    document.querySelectorAll('.admin-brand small').forEach(el=>el.textContent='ADMIN 1.3');
    document.querySelectorAll('.admin-footer').forEach(el=>el.textContent='Nova TV Admin 1.3 · Preview & Ordering');
  }

  let queued=false;
  function enhance(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;updateVersion();enhanceRows();});
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeChannelPreview();});
  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  Object.assign(window,{moveChannel,previewChannel,closeChannelPreview});
  enhance();
})();