(()=>{
  const upgrade=()=>{
    document.querySelectorAll('.brand small').forEach(el=>el.textContent='NOVA 1.0 RC');
    document.querySelectorAll('footer').forEach(el=>el.textContent='Nova TV · 1.0 Release Candidate · تجربة تلفزيون محسّنة');
    const nav=document.querySelector('.topbar .nav');
    if(nav&&!nav.querySelector('.rc-clock')){
      const clock=document.createElement('span');clock.className='rc-clock';nav.appendChild(clock);
      const tick=()=>clock.textContent=new Intl.DateTimeFormat('ar-SA',{hour:'2-digit',minute:'2-digit'}).format(new Date());tick();setInterval(tick,30000);
    }
  };
  new MutationObserver(upgrade).observe(document.getElementById('app'),{childList:true,subtree:true});
  upgrade();
})();
