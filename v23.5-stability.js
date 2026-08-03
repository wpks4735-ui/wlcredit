(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const state=()=>window.__wlState||window.state||{};
const dayStart=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const dayEnd=d=>{const x=new Date(d);x.setHours(23,59,59,999);return x};
const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
function range(key){const now=new Date(),dow=(now.getDay()+6)%7;let a=dayStart(now),b=dayEnd(now);if(key==='yesterday'){a.setDate(a.getDate()-1);b=dayEnd(a)}else if(key==='thisWeek'){a.setDate(a.getDate()-dow)}else if(key==='lastWeek'){a.setDate(a.getDate()-dow-7);b=dayEnd(new Date(a.getFullYear(),a.getMonth(),a.getDate()+6))}else if(key==='thisMonth'){a=new Date(now.getFullYear(),now.getMonth(),1);b=dayEnd(new Date(now.getFullYear(),now.getMonth()+1,0))}else if(key==='lastMonth'){a=new Date(now.getFullYear(),now.getMonth()-1,1);b=dayEnd(new Date(now.getFullYear(),now.getMonth(),0))}return[a,b]}
function updateProfile(){const st=state().staff||{};const live=(state().staffList||[]).find(x=>String(x.user_id||x.id)===String(st.user_id||st.id));const name=live?.full_name||st.full_name||st.display_name||st.username||'admin';const n=$('.v51-profile-name'),a=$('.v51-profile');if(n)n.textContent=name;if(a)a.textContent=String(name).trim().slice(0,1).toUpperCase()||'A'}
function refreshToday(){window.renderTodayWorkV233?.()}
function bindV51Dates(){
 $$('.v51-preset').forEach(btn=>{if(btn.dataset.v235Bound)return;btn.dataset.v235Bound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const [a,b]=range(btn.dataset.v51Range);const scope=btn.dataset.v51Scope==='staff'?'Staff':'Stats';const f=$(`#v51${scope}From`),t=$(`#v51${scope}To`);if(f)f.value=iso(a);if(t)t.value=iso(b);$$(`.v51-preset[data-v51-scope="${btn.dataset.v51Scope}"]`).forEach(x=>x.classList.toggle('active',x===btn));if(scope==='Stats')window.renderV51Stats?.();else window.renderV51Staff?.()},true)});
 const sa=$('#v51StatsApply');if(sa&&!sa.dataset.v235Bound){sa.dataset.v235Bound='1';sa.addEventListener('click',e=>{e.preventDefault();window.renderV51Stats?.()},true)}
 const pa=$('#v51StaffApply');if(pa&&!pa.dataset.v235Bound){pa.dataset.v235Bound='1';pa.addEventListener('click',e=>{e.preventDefault();window.renderV51Staff?.()},true)}
}
function sync(){updateProfile();refreshToday();bindV51Dates()}
document.addEventListener('wl:data-loaded',()=>setTimeout(sync,0));
window.addEventListener('swk-language-applied',()=>setTimeout(sync,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,50));else setTimeout(sync,50);
// bounded startup retries cover slow auth/profile/data fetch without requiring a user click.
[250,600,1200,2200,4000].forEach(ms=>setTimeout(sync,ms));
})();
