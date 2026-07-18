(()=>{
  'use strict';
  const API=window.NovaAPI;
  const root=document.getElementById('adminApp');
  if(!API||!root)return;

  const pad=n=>String(n).padStart(2,'0');
  const isoDate=(date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const randomCode=()=>{
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const block=()=>Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    return `NOVA-${block()}-${block()}`;
  };
  const daysLeft=value=>{
    if(!value)return null;
    const end=new Date(`${value}T23:59:59`);
    if(Number.isNaN(end.getTime()))return null;
    return Math.ceil((end-Date.now())/86400000);
  };

  function generateActivationCode(){
    const input=document.querySelector('input[name="code"]');
    if(!input)return;
    input.value=randomCode();
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
  }

  function setExpiry(days){
    const input=document.querySelector('input[name="expiresAt"]');
    if(!input)return;
    const date=new Date();
    date.setDate(date.getDate()+Number(days||30));
    input.value=isoDate(date);
  }

  function duplicateChannel(id){
    const source=API.getChannels().find(c=>String(c.id)===String(id));
    if(!source)return;
    const maxOrder=Math.max(0,...API.getChannels().map(c=>Number(c.sortOrder||0)));
    API.upsertChannel({
      ...source,
      id:Date.now(),
      name:`${source.name} - نسخة`,
      shortName:source.shortName?`${source.shortName} 2`:'',
      sortOrder:maxOrder+1,
      featured:false,
      enabled:false
    });
    window.render?.();
  }

  function enhanceCodeForm(){
    const code=document.querySelector('input[name="code"]');
    if(!code||code.dataset.toolsReady)return;
    code.dataset.toolsReady='1';
    const field=code.closest('.field');
    if(field){
      const button=document.createElement('button');
      button.type='button';
      button.className='inline-tool';
      button.textContent='إنشاء كود عشوائي';
      button.onclick=generateActivationCode;
      field.appendChild(button);
    }
    const expiry=document.querySelector('input[name="expiresAt"]');
    if(expiry&&!expiry.value)setExpiry(30);
    const expiryField=expiry?.closest('.field');
    if(expiryField&&!expiryField.querySelector('.expiry-presets')){
      const presets=document.createElement('div');
      presets.className='expiry-presets';
      presets.innerHTML='<button type="button" onclick="setExpiry(30)">30 يومًا</button><button type="button" onclick="setExpiry(90)">3 أشهر</button><button type="button" onclick="setExpiry(365)">سنة</button>';
      expiryField.appendChild(presets);
    }
  }

  function enhanceCodesTable(){
    const heading=[...document.querySelectorAll('th')].find(th=>th.textContent.trim()==='الانتهاء');
    const table=heading?.closest('table');
    if(!table||table.dataset.expiryReady)return;
    table.dataset.expiryReady='1';
    [...table.tBodies[0]?.rows||[]].forEach(row=>{
      const cell=row.cells[1];
      if(!cell)return;
      const value=cell.textContent.trim();
      const left=daysLeft(value);
      if(left===null)return;
      const badge=document.createElement('small');
      badge.className=`expiry-state ${left<0?'expired':left<=7?'soon':'valid'}`;
      badge.textContent=left<0?'منتهي':left===0?'ينتهي اليوم':left<=7?`متبقي ${left} أيام`:`متبقي ${left} يومًا`;
      cell.appendChild(badge);
    });
  }

  function enhanceChannelRows(){
    document.querySelectorAll('.admin-table tbody tr').forEach(row=>{
      const edit=[...row.querySelectorAll('button')].find(b=>b.textContent.trim()==='تعديل');
      if(!edit||row.dataset.duplicateReady)return;
      const match=edit.getAttribute('onclick')?.match(/editChannel\(['"](.+?)['"]\)/);
      if(!match)return;
      row.dataset.duplicateReady='1';
      const button=document.createElement('button');
      button.textContent='نسخ';
      button.onclick=()=>duplicateChannel(match[1]);
      edit.parentElement?.insertBefore(button,edit.nextSibling);
    });
  }

  function updateVersion(){
    document.querySelectorAll('.admin-brand small').forEach(el=>el.textContent='ADMIN 1.2');
    document.querySelectorAll('.admin-footer').forEach(el=>el.textContent='Nova TV Admin 1.2 · Cloud Ready');
  }

  let scheduled=false;
  function enhance(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      updateVersion();
      enhanceCodeForm();
      enhanceCodesTable();
      enhanceChannelRows();
    });
  }

  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  Object.assign(window,{generateActivationCode,setExpiry,duplicateChannel});
  enhance();
})();