(()=>{
  'use strict';
  const API=window.NovaAPI;
  const root=document.getElementById('adminApp');
  if(!API||!root)return;
  const LOG_KEY='novaAdminActivity';
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const logs=()=>{try{return JSON.parse(localStorage.getItem(LOG_KEY)||'[]')}catch{return[]}};
  const addLog=(action,detail='')=>{const list=[{id:Date.now(),action,detail,at:new Date().toISOString()},...logs()].slice(0,150);localStorage.setItem(LOG_KEY,JSON.stringify(list));};

  function fileToDataUrl(file,maxBytes=1200000){
    return new Promise((resolve,reject)=>{
      if(!file)return reject(new Error('NO_FILE'));
      if(!file.type.startsWith('image/'))return reject(new Error('NOT_IMAGE'));
      if(file.size>maxBytes)return reject(new Error('TOO_LARGE'));
      const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);
    });
  }
  async function uploadToField(inputName,fileInput){
    try{
      const url=await fileToDataUrl(fileInput.files?.[0]);
      const target=document.querySelector(`[name="${inputName}"]`);
      if(!target)return;
      target.value=url;target.dispatchEvent(new Event('input',{bubbles:true}));
      updateMediaPreview();
    }catch(err){alert(err.message==='TOO_LARGE'?'الصورة كبيرة جدًا. الحد الأقصى 1.2MB.':'تعذر قراءة الصورة. اختاري ملف صورة صالحًا.');}
    finally{fileInput.value='';}
  }
  function mediaTool(field,inputName,label){
    if(!field||field.querySelector(`[data-media-for="${inputName}"]`))return;
    const wrap=document.createElement('div');wrap.className='media-tools';wrap.dataset.mediaFor=inputName;
    wrap.innerHTML=`<label class="media-upload">${label}<input type="file" accept="image/*" hidden></label><button type="button" class="media-clear">مسح</button>`;
    const file=wrap.querySelector('input');file.onchange=()=>uploadToField(inputName,file);
    wrap.querySelector('.media-clear').onclick=()=>{const target=document.querySelector(`[name="${inputName}"]`);if(target){target.value='';updateMediaPreview();}};
    field.appendChild(wrap);
  }
  function updateMediaPreview(){
    const form=document.querySelector('.form-card form');if(!form)return;
    let preview=form.querySelector('.channel-live-preview');
    if(!preview){preview=document.createElement('div');preview.className='channel-live-preview';form.querySelector('.form-actions')?.before(preview);}
    const name=form.querySelector('[name="name"]')?.value||'اسم القناة';
    const shortName=form.querySelector('[name="shortName"]')?.value||name.slice(0,8);
    const logo=form.querySelector('[name="logoUrl"]')?.value||'';
    const bg=form.querySelector('[name="backgroundUrl"]')?.value||'';
    const accent=form.querySelector('[name="accent"]')?.value||'#168cff';
    preview.style.setProperty('--accent',accent);
    preview.style.backgroundImage=bg?`linear-gradient(90deg,rgba(3,8,18,.92),rgba(3,8,18,.35)),url("${bg.replace(/"/g,'%22')}")`:'';
    preview.innerHTML=`<div class="preview-logo">${logo?`<img src="${esc(logo)}" alt="">`:`<span>${esc(shortName)}</span>`}</div><div><small>معاينة البطاقة</small><strong>${esc(name)}</strong><span>ستظهر بهذا الشكل تقريبًا في التطبيق</span></div>`;
  }
  function enhanceMedia(){
    const logo=document.querySelector('[name="logoUrl"]'),bg=document.querySelector('[name="backgroundUrl"]');
    if(!logo||logo.dataset.mediaReady)return;
    logo.dataset.mediaReady='1';
    mediaTool(logo.closest('.field'),'logoUrl','رفع شعار');
    mediaTool(bg?.closest('.field'),'backgroundUrl','رفع خلفية');
    ['name','shortName','logoUrl','backgroundUrl','accent'].forEach(n=>document.querySelector(`[name="${n}"]`)?.addEventListener('input',updateMediaPreview));
    updateMediaPreview();
  }
  function activityPanel(){
    const list=logs();
    return `<section class="admin-card activity-card"><div class="table-toolbar"><div><h2>سجل النشاط</h2><div class="muted">آخر التغييرات المحفوظة على هذا الجهاز</div></div><button class="action-btn" onclick="clearActivityLog()">مسح السجل</button></div><div class="activity-list">${list.map(x=>`<article><span></span><div><strong>${esc(x.action)}</strong><small>${esc(x.detail||'')}</small></div><time>${new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(x.at))}</time></article>`).join('')||'<div class="empty-admin">لا يوجد نشاط مسجل بعد</div>'}</div></section>`;
  }
  function showActivity(){
    document.querySelectorAll('.admin-tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-activity-tab]')?.classList.add('active');
    const tabs=document.querySelector('.admin-tabs');
    let host=document.getElementById('activityHost');
    if(!host){host=document.createElement('div');host.id='activityHost';tabs?.insertAdjacentElement('afterend',host);}
    [...tabs.parentElement.children].forEach(el=>{if(el!==tabs&&el!==host&&el.tagName!=='FOOTER'&&el.classList?.contains('admin-grid'))el.style.display='none';});
    host.innerHTML=activityPanel();
  }
  function clearActivityLog(){if(confirm('مسح سجل النشاط؟')){localStorage.removeItem(LOG_KEY);showActivity();}}
  function enhanceActivityTab(){
    const tabs=document.querySelector('.admin-tabs');if(!tabs||tabs.querySelector('[data-activity-tab]'))return;
    const b=document.createElement('button');b.dataset.activityTab='1';b.textContent='سجل النشاط';b.onclick=showActivity;tabs.appendChild(b);
  }
  function patchApi(){
    if(API.__auditPatched)return;API.__auditPatched=true;
    const patch=(name,describe)=>{const original=API[name];if(typeof original!=='function')return;API[name]=function(...args){const out=original.apply(API,args);try{const d=describe(...args);addLog(d.action,d.detail)}catch{}return out;};};
    patch('upsertChannel',item=>({action:item?.id&&API.getChannels().some(c=>String(c.id)===String(item.id))?'تعديل قناة':'إضافة قناة',detail:item?.name||''}));
    patch('removeChannel',id=>({action:'حذف قناة',detail:String(id)}));
    patch('upsertActivationCode',item=>({action:'حفظ كود تفعيل',detail:item?.code||''}));
    patch('removeActivationCode',code=>({action:'حذف كود تفعيل',detail:String(code)}));
    patch('releaseDevice',(code,id)=>({action:'فصل جهاز',detail:`${id} · ${code}`}));
  }
  function updateVersion(){document.querySelectorAll('.admin-brand small').forEach(el=>el.textContent='ADMIN 1.5');document.querySelectorAll('.admin-footer').forEach(el=>el.textContent='Nova TV Admin 1.5 · Media & Activity');}
  let pending=false;
  function enhance(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;updateVersion();enhanceMedia();enhanceActivityTab();});}
  patchApi();
  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  Object.assign(window,{uploadToField,updateMediaPreview,showActivity,clearActivityLog});
  enhance();
})();