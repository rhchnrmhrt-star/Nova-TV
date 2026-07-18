(()=>{
  'use strict';

  let clockTimer=null;
  let scheduled=false;

  const upgrade=()=>{
    scheduled=false;

    document.querySelectorAll('.brand small').forEach(el=>{
      if(el.textContent!=='NOVA 1.0 RC') el.textContent='NOVA 1.0 RC';
    });

    document.querySelectorAll('footer').forEach(el=>{
      const text='Nova TV · 1.0 Release Candidate · تجربة تلفزيون محسّنة';
      if(el.textContent!==text) el.textContent=text;
    });

    const nav=document.querySelector('.topbar .nav');
    if(nav&&!nav.querySelector('.rc-clock')){
      const clock=document.createElement('span');
      clock.className='rc-clock';
      nav.appendChild(clock);

      const tick=()=>{
        const value=new Intl.DateTimeFormat('ar-SA',{hour:'2-digit',minute:'2-digit'}).format(new Date());
        if(clock.textContent!==value) clock.textContent=value;
      };

      tick();
      if(clockTimer) clearInterval(clockTimer);
      clockTimer=setInterval(tick,30000);
    }
  };

  const observer=new MutationObserver(()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(upgrade);
  });

  const root=document.getElementById('app');
  if(root) observer.observe(root,{childList:true});
  upgrade();
})();
