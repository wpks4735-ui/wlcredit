/* WL Credit V25 — existing customer multi-loan activation */
(()=>{
'use strict';
const S=()=>window.state||window.__wlState||{};
const db=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const norm=v=>String(v??'').trim().toLowerCase();
const T=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
const appById=id=>(S().applications||[]).find(a=>String(a.id)===String(id));
const dateOnly=v=>String(v||'').slice(0,10)||null;
const num=(...vals)=>{for(const v of vals){const n=Number(v);if(Number.isFinite(n))return n}return 0};

async function fetchApp(id){
  const cached=appById(id); if(cached)return cached;
  const r=await db().from('loan_applications').select('*').eq('id',id).maybeSingle();
  if(r.error)throw r.error;
  return r.data;
}
async function fetchCustomer(a){
  const cid=a?.customer_id||a?.existing_customer_id;
  if(!cid)return null;
  const r=await db().from('customers').select('*').eq('id',cid).maybeSingle();
  if(r.error)throw r.error;
  return r.data;
}
async function existingCustomer(a){
  if(!a)return false;
  if(norm(a.application_type)==='existing_customer_new_loan'||norm(a.application_source)==='existing_customer'||a.existing_customer_id)return true;
  const c=await fetchCustomer(a);
  const code=String(c?.customer_code||c?.username||'').toUpperCase();
  return !!(c&&(c.auth_user_id||c.user_id||c.portal_user_id||/^WL\d+/.test(code)));
}
async function loanExists(id){
  if(!id)return null;
  const r=await db().from('loans').select('*').eq('id',id).maybeSingle();
  return r.error?null:r.data;
}
async function findCreatedLoan(customerId,beforeIds,result){
  const direct=result?.data?.loan_uuid||result?.data?.loan_db_id||result?.data?.loan_id_uuid||result?.data?.id;
  if(direct){const found=await loanExists(direct);if(found)return found}
  const q=await db().from('loans').select('*').eq('customer_id',customerId).order('created_at',{ascending:false}).limit(20);
  if(q.error)throw q.error;
  return (q.data||[]).find(l=>!beforeIds.has(String(l.id)))||(q.data||[])[0]||null;
}
async function safeApplicationUpdate(id,payload){
  let r=await db().from('loan_applications').update(payload).eq('id',id);
  if(!r.error)return r;
  // Backward compatible fallback when a newly added column has not been deployed yet.
  const fallback={...payload};delete fallback.created_loan_id;
  r=await db().from('loan_applications').update(fallback).eq('id',id);
  if(r.error)throw r.error;
  return r;
}
async function activateExistingCustomerLoan(id){
  const c=db(); if(!c?.from||!c?.rpc)throw new Error('Supabase client unavailable');
  const a=await fetchApp(id);
  if(!a)throw new Error(T('找不到申请','Application not found','Permohonan tidak ditemui'));
  if(!await existingCustomer(a))throw new Error(T('这不是旧客户新增贷款','This is not an existing-customer loan application','Ini bukan permohonan pinjaman pelanggan sedia ada'));

  // Idempotency: never create a second loan for the same application.
  const existingId=a.created_loan_id||a.loan_id;
  const existing=await loanExists(existingId);
  if(existing){
    if(norm(existing.status)!=='active')await c.from('loans').update({status:'active',updated_at:new Date().toISOString()}).eq('id',existing.id);
    await safeApplicationUpdate(id,{status:'approved',created_loan_id:existing.id,application_type:'existing_customer_new_loan',updated_at:new Date().toISOString()});
    return existing;
  }

  // Prefer the database transaction RPC when deployed.
  const dedicated=await c.rpc('wl_activate_existing_customer_loan',{p_application_id:id});
  if(!dedicated.error){
    const refreshed=await fetchApp(id);
    const made=await loanExists(refreshed?.created_loan_id||refreshed?.loan_id||dedicated.data?.loan_id||dedicated.data?.id);
    if(made)return made;
  }

  // Reliable compatibility path: use the project's established loan-creation RPC.
  const customerId=a.customer_id||a.existing_customer_id;
  if(!customerId)throw new Error(T('申请没有关联原客户','The application is not linked to the existing customer','Permohonan tidak dipautkan kepada pelanggan sedia ada'));
  const before=await c.from('loans').select('id').eq('customer_id',customerId);
  if(before.error)throw before.error;
  const beforeIds=new Set((before.data||[]).map(x=>String(x.id)));
  const principal=num(a.approved_principal,a.requested_amount,a.principal,a.loan_amount);
  const interest=num(a.approved_interest,a.interest);
  const settlement=num(a.approved_settlement_amount,a.settlement_amount,principal+interest);
  const due=dateOnly(a.approved_due_date||a.first_due_at||a.due_date)||dateOnly(new Date(Date.now()+30*86400000).toISOString());
  const disb=dateOnly(a.finance_disbursed_at||a.disbursed_at||new Date().toISOString());
  const create=await c.rpc('staff_create_loan_auto',{
    p_customer_id:customerId,
    p_principal:principal,
    p_interest:interest,
    p_settlement_amount:settlement,
    p_disbursement_date:disb,
    p_due_date:due,
    p_notes:a.approval_notes||a.notes||`Existing customer application ${a.application_code||id}`
  });
  if(create.error)throw create.error;
  const loan=await findCreatedLoan(customerId,beforeIds,create);
  if(!loan)throw new Error(T('贷款建立失败，申请没有被完成','Loan creation failed; the application was not completed','Penciptaan pinjaman gagal; permohonan tidak diselesaikan'));

  const loanPatch={status:'active',updated_at:new Date().toISOString()};
  await c.from('loans').update(loanPatch).eq('id',loan.id);
  await safeApplicationUpdate(id,{status:'approved',created_loan_id:loan.id,loan_id:loan.id,application_type:'existing_customer_new_loan',updated_at:new Date().toISOString()});

  // Apply repayment cycle after the loan exists. Failure here must not create a duplicate loan.
  const cycleType=a.repayment_cycle_type;
  const cycleValue=Number(a.repayment_cycle_value||1);
  const dueAt=a.first_due_at||a.approved_due_date;
  if(cycleType&&dueAt){
    const cycle=await c.rpc('wl_set_loan_repayment_cycle',{p_loan_id:loan.id,p_cycle_type:cycleType,p_cycle_value:cycleValue,p_due_at:new Date(dueAt).toISOString(),p_reason:'Existing customer new loan activated'});
    if(cycle.error)console.warn('Repayment cycle update failed:',cycle.error);
  }
  return loan;
}

async function handle(id,button){
  if(button)button.disabled=true;
  try{
    const loan=await activateExistingCustomerLoan(id);
    window.closeModal?.();
    window.toast?.(T('新贷款已建立并启用，原客户账号保持不变','New loan created and activated. The existing customer account remains unchanged.','Pinjaman baharu dicipta dan diaktifkan. Akaun pelanggan sedia ada kekal.'));
    await window.loadAll?.();
    window.renderPendingFinance?.();
    if(loan?.customer_id&&typeof window.openCustomerProfile==='function')setTimeout(()=>window.openCustomerProfile(loan.customer_id),150);
  }catch(err){
    console.error('V25 loan activation failed',err);
    window.toast?.(err?.message||String(err),true);
  }finally{if(button)button.disabled=false}
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-v247-existing-loan],[data-v25-existing-loan]');
  if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  handle(b.dataset.v247ExistingLoan||b.dataset.v25ExistingLoan,b);
},true);

// Patch dynamic modal actions. Approved legacy applications without a created loan remain repairable.
async function patch(root=document){
  const buttons=[...root.querySelectorAll('[data-v36-final-approve],[data-v247-existing-loan]')];
  for(const b of buttons){
    const id=b.dataset.v36FinalApprove||b.dataset.v247ExistingLoan;
    let a;try{a=await fetchApp(id)}catch(_){continue}
    if(!await existingCustomer(a))continue;
    const linked=await loanExists(a.created_loan_id||a.loan_id);
    if(linked&&['active','paid','completed'].includes(norm(linked.status))){b.remove();continue}
    b.removeAttribute('data-v36-final-approve');b.removeAttribute('data-v247-existing-loan');
    b.dataset.v25ExistingLoan=id;
    b.textContent=T('确认并建立新贷款','Confirm & Create New Loan','Sahkan & Cipta Pinjaman Baharu');
    b.className='btn btn-primary';
  }
}
const observer=new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes.length))patch(document).catch(()=>{})});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>patch(document),300);
window.addEventListener('swk-language-applied',()=>patch(document));
window.wlV25ActivateExistingCustomerLoan=activateExistingCustomerLoan;
})();
