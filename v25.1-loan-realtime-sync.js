(function(){
'use strict';
const VERSION='25.1.0';
let refreshTimer=null;
let fallbackTimer=null;
let running=false;

function getState(){return window.__wlState||window.state||null}
function getSb(){return window.sb||window.supabaseClient||null}
function visibleCustomerIds(st){return new Set((st?.customers||[]).map(c=>String(c.id)))}
function canSeeAll(st){
 const role=String(st?.staff?.role||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
 return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(role);
}
function sortLoans(rows){return [...rows].sort((a,b)=>{
 const at=Date.parse(a?.created_at||0)||0,bt=Date.parse(b?.created_at||0)||0;
 if(bt!==at)return bt-at;
 return String(b?.loan_id||b?.id||'').localeCompare(String(a?.loan_id||a?.id||''));
})}
function activeSection(id){return document.getElementById(id)?.classList.contains('active')}
function safeCall(name){try{if(typeof window[name]==='function')window[name]()}catch(e){console.error(`[WL ${VERSION}] ${name} failed`,e)}}
function notifyModules(){
 try{document.dispatchEvent(new CustomEvent('wl:loans-realtime',{detail:{updatedAt:Date.now()}}))}catch(_){document.dispatchEvent(new Event('wl:loans-realtime'))}
 // Existing dashboard/today-work modules already listen to this event and use the shared state.
 try{document.dispatchEvent(new CustomEvent('wl:data-loaded',{detail:{source:'loans-realtime',loadedAt:Date.now()}}))}catch(_){document.dispatchEvent(new Event('wl:data-loaded'))}
}
function renderAffected(){
 // These are partial render functions; do not call renderAll() and do not reload the page.
 safeCall('renderLoans');
 safeCall('renderStats');
 safeCall('renderCustomers');
 safeCall('renderTodayWorkV233');
 // Customer profile/detail modals and dashboard add-ons can opt in to this event.
 notifyModules();
}
async function refreshLoans(reason){
 if(running)return;
 const sb=getSb(),st=getState();
 if(!sb||!st)return;
 running=true;
 try{
  const q=await sb.from('loans').select('*,customers(full_name,customer_code,phone,assigned_bank_id)').order('created_at',{ascending:false});
  if(q.error)throw q.error;
  let rows=q.data||[];
  if(!canSeeAll(st)){
   const ids=visibleCustomerIds(st);
   rows=rows.filter(l=>ids.has(String(l.customer_id)));
  }
  st.loans=sortLoans(rows);
  window.__wlState=st;
  window.state=st;
  renderAffected();
  console.debug(`[WL ${VERSION}] loans synchronized`,reason||'manual',rows.length);
 }catch(e){
  console.error(`[WL ${VERSION}] loan synchronization failed`,e);
 }finally{running=false}
}
function queueRefresh(reason){
 clearTimeout(refreshTimer);
 refreshTimer=setTimeout(()=>refreshLoans(reason),120);
}
function setupRealtime(){
 const sb=getSb();
 if(!sb)return false;
 if(window.__wlLoanRealtimeChannel){
  try{sb.removeChannel(window.__wlLoanRealtimeChannel)}catch(_){ }
  window.__wlLoanRealtimeChannel=null;
 }
 const channel=sb.channel(`wl-loans-realtime-v251-${Math.random().toString(36).slice(2)}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'loans'},payload=>{
    queueRefresh(`realtime:${payload?.eventType||'change'}`);
  })
  .subscribe(status=>{
    if(status==='SUBSCRIBED')console.info(`[WL ${VERSION}] loans realtime connected`);
    if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))console.warn(`[WL ${VERSION}] loans realtime status`,status);
  });
 window.__wlLoanRealtimeChannel=channel;
 return true;
}
function start(){
 if(window.__wlLoanRealtimeStarted)return;
 window.__wlLoanRealtimeStarted=true;
 setupRealtime();
 // Fallback only refreshes the loans collection; it never reloads or redraws the whole page.
 fallbackTimer=setInterval(()=>refreshLoans('fallback'),30000);
 window.__wlLoanRealtimeFallback=fallbackTimer;
 // Initial reconciliation after the main application has loaded its role/customer scope.
 setTimeout(()=>refreshLoans('initial'),800);
}

document.addEventListener('wl:data-loaded',()=>{
 if(!window.__wlLoanRealtimeStarted)start();
},{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,1200),{once:true});
else setTimeout(start,1200);

window.wlRefreshLoansNow=()=>refreshLoans('manual');
})();
