(function(){
  'use strict';

  function applyHotfix(){
    try{
      if(typeof window.stopHeroTimer==='function') window.stopHeroTimer();
      window.startHeroTimer=function(){
        if(typeof window.stopHeroTimer==='function') window.stopHeroTimer();
      };

      const version=document.querySelector('.brand small');
      if(version) version.textContent='NOVA 1.0 RC · STABLE';
    }catch(error){
      console.warn('Nova stability hotfix:',error);
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',applyHotfix,{once:true});
  }else{
    applyHotfix();
  }

  window.addEventListener('pageshow',applyHotfix);
})();
