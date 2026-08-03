(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const state=()=>window.__wlState||window.state||{};
const client=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const lang=()=>window.SWK_LANG?.current||localStorage.getItem('swk_lang')||'zh';
const T=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notify=(m,b=false)=>window.toast?.(m,b);
const close=()=>window.closeModal?.();
const showModal=html=>window.modal?.(html);
const normalizedRole=()=>String(state().staff?.role||window.AppSession?.staff?.role||'').trim().toLowerCase().replace(/[\s-]+/g,'_');

/* Today Work is content only. Keep the single global header above it. */
function normalizeTodayWorkShell(){
  const main=$('main.main');
  const header=main?.querySelector(':scope > header.topbar');
  if(!main||!header)return;

  const todaySections=$$('section#todayWork');
  const primary=todaySections.shift();
  todaySections.forEach(x=>x.remove());
  if(primary && primary.previousElementSibling!==header){
    header.insertAdjacentElement('afterend',primary);
  }

  // V33/V50 legacy work page duplicates Finance work on first load.
  $('#navMyWork')?.remove();
  $('#myWork')?.remove();

  // A page-specific topbar must never be allowed inside Today Work.
  primary?.querySelectorAll('header.topbar,.topbar').forEach(x=>x.remove());
}

let shellQueued=false;
function queueShellNormalize(){
  if(shellQueued)return;
  shellQueued=true;
  requestAnimationFrame(()=>{
    shellQueued=false;
    normalizeTodayWorkShell();
  });
}

/* Correct Finance Today Work routes. */
function gotoSection(id){
  if(typeof window.switchSection==='function') window.switchSection(id);
  else document.querySelector(`[data-section="${id}"]`)?.click();
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-v236-goto]');
  if(!btn)return;
  const role=normalizedRole();
  let target=btn.dataset.v236Goto;
  // Finance pending receipt must open Finance > Pending Receipt Confirmation.
  if(role==='finance' && target==='paymentSubmissions') target='financeReceipts';
  if(role==='super_admin' && target==='paymentSubmissions') target='financeReceipts';
  if(target!==btn.dataset.v236Goto){
    e.preventDefault();
    e.stopImmediatePropagation();
    gotoSection(target);
  }
},true);

/* One rejection dialog only, and no old staff RPC/permission check. */
async function rejectPaymentDirect(id,reason,stage='finance_receipt'){
  const sb=client();
  if(!sb)throw new Error(T('数据库尚未连接','Database is not connected','Pangkalan data belum disambungkan'));
  const clean=String(reason||'').trim();
  if(clean.length<3)throw new Error(T('请填写拒绝原因','Enter a rejection reason','Masukkan sebab penolakan'));

  const current=(state().submissions||[]).find(x=>String(x.id)===String(id));
  const previous=String(current?.status||'pending');
  const next=stage==='staff_posting'?'pending_finance':'rejected';
  const financeStatus=stage==='staff_posting'?'pending_finance':'rejected';
  let uid=null;
  try{uid=(await sb.auth.getUser()).data?.user?.id||null}catch(_){ }

  const payload={
    status:next,
    finance_status:financeStatus,
    rejection_stage:stage,
    rejected_from_status:previous,
    rejection_reason:clean,
    rejected_by:uid,
    rejected_at:new Date().toISOString(),
    updated_at:new Date().toISOString()
  };
  let result=await sb.from('payment_submissions').update(payload).eq('id',id);
  // Older schemas may not yet contain all audit columns.
  if(result.error){
    result=await sb.from('payment_submissions').update({
      status:next,
      finance_status:financeStatus,
      rejection_reason:clean,
      updated_at:new Date().toISOString()
    }).eq('id',id);
  }
  if(result.error)throw result.error;

  // Best-effort audit log; rejection itself must not fail if the log table is absent.
  try{
    await sb.from('workflow_rejection_logs').insert({
      entity_type:'payment_submission',entity_id:id,stage,
      previous_status:previous,next_status:next,reason:clean,rejected_by:uid
    });
  }catch(_){ }

  close();
  notify(T('付款已拒绝','Payment rejected','Bayaran ditolak'));
  await window.loadAll?.();
  await window.loadFinance?.();
  window.renderAll?.();
  window.renderAllFinance?.();
  queueShellNormalize();
}

function openRejectPayment(id,stage='finance_receipt'){
  showModal(`<h2>${stage==='staff_posting'?T('拒绝入账','Reject Posting','Tolak Rekod'):T('未收到／拒绝付款','Payment Not Received / Reject','Bayaran Tidak Diterima / Tolak')}</h2>
  <form id="v237RejectPaymentForm">
    <div class="field"><label>${T('拒绝原因','Rejection reason','Sebab penolakan')}</label>
    <textarea name="reason" rows="4" required minlength="3" placeholder="${T('例如：银行未收到、金额不符或收据无效','Example: not received, wrong amount or invalid receipt','Contoh: tidak diterima, jumlah salah atau resit tidak sah')}"></textarea></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-danger">${T('确认拒绝','Confirm Reject','Sahkan Tolak')}</button>
      <button type="button" class="btn btn-secondary" data-v237-cancel>${T('取消','Cancel','Batal')}</button>
    </div>
  </form>`);
  $('[data-v237-cancel]')?.addEventListener('click',close,{once:true});
  const form=$('#v237RejectPaymentForm');
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=form.querySelector('button[type="submit"],button.btn-danger');
    const reason=String(new FormData(form).get('reason')||'').trim();
    if(submit)submit.disabled=true;
    try{await rejectPaymentDirect(id,reason,stage)}
    catch(err){notify(err?.message||String(err),true);if(submit)submit.disabled=false}
  });
}

// Override every legacy entry point so no prompt() and no old "Staff access required" RPC is used.
window.v37RejectReceipt=(id)=>openRejectPayment(id,'finance_receipt');
window.v233RejectPayment=(id,stage='finance_receipt')=>openRejectPayment(id,stage);
window.rejectSubmission=(id,reason)=>{
  if(typeof reason==='string'&&reason.trim())return rejectPaymentDirect(id,reason,'finance_receipt');
  openRejectPayment(id,'finance_receipt');
};

/* Keep normalization after all known render triggers. */
document.addEventListener('wl:data-loaded',queueShellNormalize);
window.addEventListener('swk-language-applied',queueShellNormalize);
document.addEventListener('click',e=>{
  if(e.target.closest('[data-section="todayWork"],#navTodayWork'))setTimeout(queueShellNormalize,0);
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  queueShellNormalize();setTimeout(queueShellNormalize,150);setTimeout(queueShellNormalize,800);
});else{
  queueShellNormalize();setTimeout(queueShellNormalize,150);setTimeout(queueShellNormalize,800);
}

const observer=new MutationObserver(muts=>{
  if(muts.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&(n.id==='todayWork'||n.querySelector?.('#todayWork,header.topbar')))))queueShellNormalize();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
