(()=>{
  'use strict';
  const API=window.NovaAPI;
  const root=document.getElementById('adminApp');
  if(!API||!root)return;
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const dayDiff=value=>{if(!value)return null;const d=new Date(`${value}T23:59:59`);return Number.isNaN(d.getTime())?null:Math.ceil((d-Date.now())/86400000)};
  const percent=(value,total)=>total?Math.round((value/total)*100):0;

  function getAnalytics(){
    const channels=API.getChannels();
    const codes=API.getActivationCodes();
    const activeChannels=channels.filter(c=>c.enabled!==false);
    const featured=channels.filter(c=>c.featured===true);
    const categories=[...channels.reduce((m,c)=>{const key=String(c.category||'عام').trim()||'عام';m.set(key,(m.get(key)||0)+1);return m},new Map())]
      .map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
    const activeCodes=codes.filter(c=>c.enabled!==false&&(dayDiff(c.expiresAt)===null||dayDiff(c.expiresAt)>=0));
    const expiredCodes=codes.filter(c=>dayDiff(c.expiresAt)!==null&&dayDiff(c.expiresAt)<0);
    const nearExpiry=codes.filter(c=>{const d=dayDiff(c.expiresAt);return d!==null&&d>=0&&d<=7});
    const devices=codes.reduce((sum,c)=>sum+(Array.isArray(c.devices)?c.devices.length:0),0);
    const deviceCapacity=codes.reduce((sum,c)=>sum+Math.max(1,Number(c.maxDevices||1)),0);
    const logoCoverage=percent(channels.filter(c=>c.logoUrl).length,channels.length);
    const dataHealth=Math.round((percent(activeChannels.length,channels.length)+logoCoverage+percent(codes.filter(c=>c.enabled!==false).length,codes.length))/3)||0;
    return {channels,codes,activeChannels,featured,categories,activeCodes,expiredCodes,nearExpiry,devices,deviceCapacity,logoCoverage,dataHealth};
  }

  function renderBars(items,total){
    if(!items.length)return '<div class="analytics-note">لا توجد بيانات تصنيفات بعد.</div>';
    return items.map(item=>`<div class="bar-row"><span>${esc(item.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${percent(item.count,total)}%"></div></div><strong>${item.count}</strong></div>`).join('');
  }

  function renderAnalytics(){
    const host=document.getElementById('novaAnalytics');if(!host)return;
    const d=getAnalytics();
    const deviceUse=percent(d.devices,d.deviceCapacity);
    host.innerHTML=`<section class="admin-card">
      <div class="analytics-toolbar"><div><h2>التحليلات</h2><div class="muted">ملخص تشغيلي مباشر من بيانات Nova TV الحالية</div></div><div class="analytics-actions"><button class="action-btn" onclick="renderAnalytics()">تحديث</button><button class="action-btn primary" onclick="exportAnalytics()">تصدير التقرير</button></div></div>
      <div class="analytics-grid">
        <div class="analytics-card"><span>القنوات المفعلة</span><strong>${d.activeChannels.length}</strong><small>${percent(d.activeChannels.length,d.channels.length)}% من ${d.channels.length} قناة</small></div>
        <div class="analytics-card"><span>أكواد الاشتراك النشطة</span><strong>${d.activeCodes.length}</strong><small>${d.expiredCodes.length} منتهية</small></div>
        <div class="analytics-card"><span>الأجهزة المرتبطة</span><strong>${d.devices}</strong><small>${deviceUse}% من السعة المتاحة</small></div>
        <div class="analytics-card"><span>صحة البيانات</span><strong>${d.dataHealth}%</strong><small>تفعيل + شعارات + أكواد</small></div>
      </div>
      <div class="analytics-panels">
        <div class="analytics-panel"><h3>توزيع القنوات حسب التصنيف</h3>${renderBars(d.categories,d.channels.length)}</div>
        <div class="analytics-panel"><h3>مؤشرات سريعة</h3><div class="analytics-list">
          <div class="analytics-list-item"><span>قنوات مميزة</span><strong>${d.featured.length}</strong></div>
          <div class="analytics-list-item"><span>قنوات بدون شعار</span><strong>${d.channels.filter(c=>!c.logoUrl).length}</strong></div>
          <div class="analytics-list-item"><span>أكواد تنتهي خلال 7 أيام</span><strong>${d.nearExpiry.length}</strong></div>
          <div class="analytics-list-item"><span>تغطية الشعارات</span><strong>${d.logoCoverage}%</strong></div>
        </div><div class="analytics-health"><span>استخدام الأجهزة</span><div class="bar-track"><div class="bar-fill" style="width:${deviceUse}%"></div></div><strong>${deviceUse}%</strong></div></div>
      </div>
      <p class="analytics-note">هذه الأرقام مستخرجة من التخزين المحلي الحالي. عند اكتمال الربط السحابي ستعرض اللوحة بيانات جميع المستخدمين والأجهزة لحظيًا.</p>
    </section>`;
  }

  function exportAnalytics(){
    const d=getAnalytics();
    const report={generatedAt:new Date().toISOString(),version:'Admin 1.7',summary:{channels:d.channels.length,activeChannels:d.activeChannels.length,featuredChannels:d.featured.length,codes:d.codes.length,activeCodes:d.activeCodes.length,expiredCodes:d.expiredCodes.length,nearExpiryCodes:d.nearExpiry.length,devices:d.devices,deviceCapacity:d.deviceCapacity,logoCoverage:d.logoCoverage,dataHealth:d.dataHealth},categories:d.categories};
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download=`nova-tv-analytics-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
  }

  function hideCustomViews(){
    document.querySelectorAll('#novaDiagnostics,#novaAnalytics').forEach(el=>el.style.display='none');
  }
  function restoreNormal(){
    const shell=document.querySelector('.admin-shell');
    [...shell?.children||[]].forEach(el=>{if(!['novaDiagnostics','novaAnalytics'].includes(el.id))el.style.display=''});
    hideCustomViews();
  }
  function openAnalytics(){
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
    document.getElementById('analyticsTab')?.classList.add('active');
    const shell=document.querySelector('.admin-shell');const footer=document.querySelector('.admin-footer');
    let host=document.getElementById('novaAnalytics');if(!host){host=document.createElement('div');host.id='novaAnalytics';shell?.insertBefore(host,footer||null)}
    [...shell?.children||[]].forEach(el=>{if(el.id==='novaAnalytics'||el.classList.contains('admin-top')||el.classList.contains('admin-hero')||el.classList.contains('admin-stats-grid')||el.classList.contains('admin-tabs')||el.classList.contains('admin-footer'))return;el.style.display='none'});
    document.getElementById('novaDiagnostics')?.style.setProperty('display','none');host.style.display='block';renderAnalytics();
  }
  function enhanceTabs(){
    const tabs=document.querySelector('.admin-tabs');if(!tabs||document.getElementById('analyticsTab'))return;
    tabs.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{if(btn.id!=='analyticsTab')restoreNormal()}));
    const btn=document.createElement('button');btn.id='analyticsTab';btn.textContent='التحليلات';btn.onclick=openAnalytics;tabs.appendChild(btn);
  }
  function updateVersion(){document.querySelectorAll('.admin-brand small').forEach(el=>el.textContent='ADMIN 1.7');document.querySelectorAll('.admin-footer').forEach(el=>el.textContent='Nova TV Admin 1.7 · Analytics Ready')}
  let queued=false;function enhance(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceTabs();updateVersion()})}
  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});Object.assign(window,{openAnalytics,renderAnalytics,exportAnalytics});enhance();
})();