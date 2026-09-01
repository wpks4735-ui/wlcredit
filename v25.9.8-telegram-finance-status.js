/* WL Credit V25.9.8 — reliable Telegram finance-status notifications for /admin */
(()=>{
 'use strict';
 let currentApplicationId=null;
 const notify=async id=>{
  if(!id||!window.sb?.functions)return;
  const n=await window.sb.functions.invoke('telegram-bot',{body:{action:'finance_status_updated',application_id:id}});
  if(n.error||n.data?.error||n.data?.skipped){
   console.warn('Telegram finance status notification failed or skipped',n.error||n.data);
   window.toast?.('状态已更新，但 Telegram 工作群通知未发送',true);
  }
 };
 const notifyLoan=async id=>{
  if(!id||!window.sb?.functions)return;
  const n=await window.sb.functions.invoke('telegram-bot',{body:{action:'staff_loan_submitted',application_id:id}});
  if(n.error||n.data?.error||n.data?.skipped){console.warn('Telegram loan notification failed or skipped',n.error||n.data);window.toast?.('贷款已提交，但 Telegram 工作群通知未发送',true)}
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-v36-finance-disburse],[data-v233-finance-reject],[data-v36-submit-finance]');
  if(b)currentApplicationId=b.dataset.v36FinanceDisburse||b.dataset.v233FinanceReject||b.dataset.v36SubmitFinance||currentApplicationId;
 },true);
 document.addEventListener('submit',e=>{
  if(e.target?.id==='v36SubmitFinanceForm'){
   const id=currentApplicationId;
   setTimeout(async()=>{if(!id)return;const q=await window.sb.from('loan_applications').select('status').eq('id',id).maybeSingle();if(!q.error&&['pending_disbursement','finance_disbursed','approved'].includes(String(q.data?.status||'')))await notifyLoan(id)},900);
   return;
  }
  if(e.target?.id!=='v258FinanceForm')return;
  const id=currentApplicationId;
  setTimeout(async()=>{
   if(!id)return;
   const q=await window.sb.from('loan_applications').select('status,finance_disbursed_at').eq('id',id).maybeSingle();
   if(!q.error&&q.data?.finance_disbursed_at)await notify(id);
  },1200);
 },true);
 function wrapRpc(){
  if(!window.sb?.rpc||window.sb.rpc.__v2598)return false;
  const original=window.sb.rpc.bind(window.sb);
  const wrapped=async function(fn,args,opts){
   const result=await original(fn,args,opts);
   if(fn==='wl_submit_existing_customer_loan'&&!result.error&&result.data?.ok!==false){
    let id=result.data?.application_id||result.data?.id;
    if(!id&&args?.p_customer_id){const q=await window.sb.from('loan_applications').select('id').or(`customer_id.eq.${args.p_customer_id},existing_customer_id.eq.${args.p_customer_id}`).order('created_at',{ascending:false}).limit(1).maybeSingle();id=q.data?.id}
    if(id)await notifyLoan(id);
   }
   if(fn==='wl_reject_loan_workflow_v233'&&args?.p_stage==='finance_disbursement'&&!result.error&&result.data?.ok!==false){
    await notify(args.p_application_id);
   }
   return result;
  };
  wrapped.__v2598=true;window.sb.rpc=wrapped;return true;
 }
 if(!wrapRpc()){const timer=setInterval(()=>{if(wrapRpc())clearInterval(timer)},200)}
})();
