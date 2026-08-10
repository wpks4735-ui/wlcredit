/* WL Credit V25.8.3 — UI single-render stability guard */
(()=>{'use strict';
const clean=()=>{
  const nav=document.querySelector('#nav')||document.querySelector('#adminSidebar nav'); if(!nav)return;
  // Remove the legacy My Work entry permanently; keep #navTodayWork only.
  nav.querySelectorAll('#navMyWork,[data-section="myWork"]').forEach(x=>x.remove());
  const todays=[...nav.querySelectorAll('#navTodayWork,[data-section="todayWork"]')];
  todays.slice(1).forEach(x=>x.remove());
};
let queued=false; const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('wl:data-loaded',schedule);window.addEventListener('swk-language-applied',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
})();
