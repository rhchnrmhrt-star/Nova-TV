(()=>{
  'use strict';
  const API=window.NovaAPI;
  const root=document.getElementById('adminApp');
  if(!API||!root)return;
  const states=new Map();
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const validUrl=value=>{try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)}catch{return false}};
  const daysLeft=value=>{if(!value)return null;const d=new Date(`${value}T23:59:59`);return Number.isNaN(d.getTime())?null:Math.ceil((d-Date.now())/86400000)};

  function getDiagnostics(){
    const channels=API.getChannels();
    const codes=API.getActivationCodes();
    const urlCounts=channels.reduce((m,c)=>{const u=String(c.url||'').trim();if(u)m.set(u,(m.get(u)||0)+1);return m},new Map());
    return {
      channels,codes,
      invalid:channels.filter(c=>!validUrl(c.url)),
      duplicate:channels.filter(c=>c.url&&urlCounts.get(String(c.url).trim())>1),
      noLogo:channels.filter(c=>!c.logoUrl),
      disabled:channels.filter(c=>c.enabled===false),
      expired:codes.filter(c=>{const d=daysLeft(c.expiresAt);return d!==null&&d<0}),
      nearExpiry:codes.filter(c=>{const d=daysLeft(c.expiresAt);return d!==null&&d>=0&&d<=7})
    };
  }

  async function probe(channel){
    const id=String(channel.id);
    if(!validUrl(channel.url)){states.set(id,{state:'bad',text:'رابط غير صالح'});return}
    states.set(id,{state:'wait',text:'جارٍ الاختبار'});renderDiagnostics();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),7000);
    try{
      await fetch(channel.url,{method:'GET',mode:'no-cors',cache:'no-store',signal:controller.signal});
      states.set(id,{state:'good',text:'تم الوصول'});
    }catch(error){
      states.set(id,{state:'bad',text:error?.name==='AbortError'?'انتهت المهلة':'تعذر الوصول'});
    }finally{clearTimeout(timer);renderDiagnostics()}
  }

  async function testAllStreams(){
    const channels=API.getChannels().filter(c=>c.enabled!==false);
    for(let i=0;i<channels.length;i+=4){await Promise.all(channels.slice(i,i+4).map(probe))}
  }

  function exportDiagnostics(){
    const d=getDiagnostics();
    const rows=[['type','name','value'],
      ...d.invalid.map(c=>['invalid_url',c.name,c.url||'']),
      ...d.duplicate.map(c=>['duplicate_url',c.name,c.url||'']),
      ...d.noLogo.map(c=>['missing_logo',c.name,'']),
      ...d.disabled.map(c=>['disabled_channel',c.name,c.url||'']),
      ...d.expired.map(c=>['expired_code',c.code,c.expiresAt||'']),
      ...d.nearExpiry.map(c=>['near_expiry_code',c.code,c.expiresAt||''])];
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='nova-tv-diagnostics.csv';a.click();URL.revokeObjectURL(a.href);
  }

  function issue(title,items,renderItem){return `<section class="issue-group"><h3>${esc(title)} <span class="muted">(${items.length})</span></h3><div class="diagnostic-list">${items.length?items.map(renderItem).join(''):'<div class="diagnostic-empty">لا توجد مشاكل في هذا القسم</div>'}</div></section>`}
  function renderDiagnostics(){
    const host=document.getElementById('novaDiagnostics');if(!host)return;
    const d=getDiagnostics();
    host.innerHTML=`<section class="admin-card"><div class="table-toolbar"><div><h2>فحص النظام</h2><div class="muted">فحص الروابط والبيانات قبل الإطلاق</div></div></div>
      <div class="diagnostics-grid">
        <div class="diagnostic-stat"><span>روابط غير صالحة</span><strong>${d.invalid.length}</strong></div>
        <div class="diagnostic-stat"><span>روابط مكررة</span><strong>${d.duplicate.length}</strong></div>
        <div class="diagnostic-stat"><span>بدون شعار</span><strong>${d.noLogo.length}</strong></div>
        <div class="diagnostic-stat"><span>أكواد منتهية</span><strong>${d.expired.length}</strong></div>
      </div>
      <div class="diagnostic-actions"><button class="action-btn primary" onclick="testAllStreams()">اختبار القنوات المفعلة</button><button class="action-btn" onclick="renderDiagnostics()">تحديث التقرير</button><button class="action-btn" onclick="exportDiagnostics()">تصدير CSV</button></div>
      ${issue('حالة القنوات',d.channels,c=>{const s=states.get(String(c.id))||{state:validUrl(c.url)?'warn':'bad',text:validUrl(c.url)?'لم يُختبر':'رابط غير صالح'};return `<div class="diagnostic-row"><div><strong>${esc(c.name)}</strong><div class="muted">${esc(c.category||'بدون تصنيف')}</div></div><div class="diagnostic-url">${esc(c.url||'لا يوجد رابط')}</div><div><span class="health-badge ${s.state}">${esc(s.text)}</span> <button class="action-btn" onclick='probe(${JSON.stringify(c)})'>اختبار</button></div></div>`})}
      ${issue('الأكواد المنتهية أو القريبة', [...d.expired,...d.nearExpiry], c=>`<div class="diagnostic-row"><div><strong>${esc(c.code)}</strong></div><div>${esc(c.expiresAt||'-')}</div><span class="health-badge ${daysLeft(c.expiresAt)<0?'bad':'warn'}">${daysLeft(c.expiresAt)<0?'منتهي':'ينتهي قريبًا'}</span></div>`)}
    </section>`;
  }

  function openDiagnostics(){
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
    document.getElementById('diagnosticsTab')?.classList.add('active');
    const shell=document.querySelector('.admin-shell');
    const footer=document.querySelector('.admin-footer');
    let host=document.getElementById('novaDiagnostics');
    if(!host){host=document.createElement('div');host.id='novaDiagnostics';shell?.insertBefore(host,footer||null)}
    [...shell.children].forEach(el=>{if(el.id==='novaDiagnostics'||el.classList.contains('admin-top')||el.classList.contains('admin-hero')||el.classList.contains('admin-stats-grid')||el.classList.contains('admin-tabs')||el.classList.contains('admin-footer'))return;if(el!==host)el.style.display='none'});
    host.style.display='block';renderDiagnostics();
  }

  function restoreNormal(){
    const shell=document.querySelector('.admin-shell');
    [...shell?.children||[]].forEach(el=>{if(el.id!=='novaDiagnostics')el.style.display=''});
    const host=document.getElementById('novaDiagnostics');if(host)host.style.display='none';
  }

  function enhanceTabs(){
    const tabs=document.querySelector('.admin-tabs');if(!tabs||document.getElementById('diagnosticsTab'))return;
    tabs.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',restoreNormal));
    const btn=document.createElement('button');btn.id='diagnosticsTab';btn.textContent='فحص النظام';btn.onclick=openDiagnostics;tabs.appendChild(btn);
  }
  function updateVersion(){document.querySelectorAll('.admin-brand small').forEach(el=>el.textContent='ADMIN 1.6');document.querySelectorAll('.admin-footer').forEach(el=>el.textContent='Nova TV Admin 1.6 · Diagnostics Ready')}
  let queued=false;function enhance(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceTabs();updateVersion()})}
  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  Object.assign(window,{openDiagnostics,renderDiagnostics,testAllStreams,exportDiagnostics,probe});enhance();
})();