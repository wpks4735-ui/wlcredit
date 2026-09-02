/* WL Credit V25.9.8 — reliable Telegram finance-status notifications for /admin */
(()=>{
 'use strict';
 const duplicateDueStyle=document.createElement('style');duplicateDueStyle.textContent='#v415ExistingLoanForm .field:has([name="v24_due_at"]){display:none!important}';document.head.appendChild(duplicateDueStyle);
 let currentApplicationId=null;
 let loanPricingDraft=null;
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
  if(e.target?.id==='v415ExistingLoanForm'){
   const f=e.target;if(f.elements.due?.value&&f.elements.v24_due_at)f.elements.v24_due_at.value=`${f.elements.due.value}T23:59`;loanPricingDraft={interest_rate:Number(f.elements.interest_rate?.value||0),processing_fee:Number(f.elements.processing_fee?.value||0),net_disbursement_amount:Number(f.elements.principal?.value||0)};
  }
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
    if(id&&loanPricingDraft){await window.sb.from('loan_applications').update(loanPricingDraft).eq('id',id)}
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
 function enhancePricingForm(){
  const f=document.querySelector('#v415ExistingLoanForm');if(!f||f.dataset.v25911)return;f.dataset.v25911='1';
  const principal=f.elements.principal,interest=f.elements.interest,settlement=f.elements.settlement;if(!principal||!interest||!settlement)return;
  const principalField=principal.closest('.field'),interestField=interest.closest('.field');
  principalField?.querySelector('label')&&(principalField.querySelector('label').textContent='客户到手金额');
  interestField?.querySelector('label')&&(interestField.querySelector('label').textContent='利息金额');
  interestField?.insertAdjacentHTML('beforebegin','<div class="field"><label>利息率 (%)</label><input name="interest_rate" type="number" min="0" max="100" step="0.01" required></div>');
  settlement.closest('.field')?.insertAdjacentHTML('afterend','<div class="field"><label>手续费</label><input name="processing_fee" type="number" min="0" step="0.01" value="0" required></div>');
  principal.readOnly=false;principal.placeholder='自动计算，也可以手动修改';
  const rate=f.elements.interest_rate,fee=f.elements.processing_fee;
  let manualNet=false;const calculate=source=>{const total=Number(settlement.value||0),r=Number(rate.value||0),charge=Number(fee.value||0);if(source!=='interest')interest.value=(total*r/100).toFixed(2);if(!manualNet)principal.value=Math.max(total-Number(interest.value||0)-charge,0).toFixed(2)};
  [settlement,rate,fee].forEach(x=>x.addEventListener('input',()=>{manualNet=false;calculate('formula')}));interest.addEventListener('input',()=>{manualNet=false;calculate('interest')});principal.addEventListener('input',()=>{manualNet=true});
  const submit=f.querySelector('button[type="submit"],button:not([type])');submit?.addEventListener('click',e=>{if(Number(principal.value)<=0){e.preventDefault();e.stopImmediatePropagation();window.toast?.('客户到手金额必须大于 0',true)}},true);
 }
 function removeDuplicateDue(){
  const f=document.querySelector('#v415ExistingLoanForm'),cycle=f?.querySelector('.v24-cycle-box'),input=cycle?.querySelector('[name="v24_due_at"]');if(!f||!cycle||!input||input.dataset.v25912)return;
  input.dataset.v25912='1';const field=input.closest('.field');if(field)field.hidden=true;
  [...cycle.querySelectorAll('p.muted')].forEach(p=>{if(/到账时间|current due|masa matang/i.test(p.textContent||''))p.hidden=true});
  const sync=()=>{if(f.elements.due?.value)input.value=`${f.elements.due.value}T23:59`};f.elements.due?.addEventListener('change',sync);sync();
 }
 const pricingObserver=new MutationObserver(()=>{enhancePricingForm();removeDuplicateDue()});pricingObserver.observe(document.documentElement,{childList:true,subtree:true});enhancePricingForm();removeDuplicateDue();
 setInterval(()=>{document.querySelectorAll('#v415ExistingLoanForm [name="v24_due_at"]').forEach(input=>{const field=input.closest('.field');if(field)field.style.setProperty('display','none','important')});removeDuplicateDue()},300);

 const actionNames={customers:'客户资料',loans:'贷款资料',loan_applications:'贷款申请',repayments:'还款记录',payment_submissions:'付款申请',customer_tag_assignments:'客户标签',disbursement_receipts:'出款收据',receiving_banks:'收款银行',company_bank_accounts:'公司银行',staff_bank_allocations:'银行分配',contact_channels:'联系方式'};
 const fieldNames={status:'状态',full_name:'客户姓名',phone:'电话号码',id_number:'身份证号码',address:'地址',principal:'客户到手金额',approved_principal:'客户到手金额',interest:'利息金额',approved_interest:'利息金额',interest_rate:'利息率',processing_fee:'手续费',settlement_amount:'清账金额',approved_settlement_amount:'清账金额',due_date:'到期日期',approved_due_date:'到期日期',owner_staff_id:'所属客服',assigned_staff_id:'所属客服',assigned_bank_id:'分配银行',bank_account:'银行账号',account_number:'银行账号',bank_name:'银行名称',finance_proof_path:'出款收据',finance_disbursed_at:'出款时间',finance_reference:'出款参考号',rejection_reason:'拒绝原因',rejected_at:'拒绝时间',tag_id:'客户标签',is_active:'启用状态',notes:'备注',internal_notes:'内部备注'};
 const statusNames={pending:'等待处理',under_review:'审核中',pending_disbursement:'等待财务出款',finance_disbursed:'财务已出款',approved:'已批准',rejected:'已拒绝',active:'进行中',paid:'已清账',completed:'已完成',cancelled:'已取消',true:'启用',false:'停用'};
 const sameBlank=(a,b)=>(a==null||a==='')&&(b==null||b==='');
 const showValue=(v,key)=>{if(v==null||v==='')return '空白';if(statusNames[String(v)]!=null)return statusNames[String(v)];if(/(_at|_date)$/.test(key)&&!Number.isNaN(new Date(v).getTime()))return new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Kuala_Lumpur'});if(typeof v==='object')return JSON.stringify(v);return String(v)};
 function humanizeAudit(){
  const heads=document.querySelectorAll('#auditLogs thead th');['时间','员工','操作','修改内容'].forEach((x,i)=>{if(heads[i])heads[i].textContent=x});
  const st=window.state||{},from=document.querySelector('#auditFrom')?.value||'',to=document.querySelector('#auditTo')?.value||'',query=String(document.querySelector('#auditSearch')?.value||'').trim().toLowerCase();const visible=(st.audit||[]).filter(x=>{const day=String(x.created_at||'').slice(0,10);if(from&&day<from)return false;if(to&&day>to)return false;if(!query)return true;return JSON.stringify(x).toLowerCase().includes(query)});
  document.querySelectorAll('#auditRows tr').forEach((tr,index)=>{if(tr.dataset.v25914)return;const cells=tr.children;if(cells.length<4)return;let parsed;try{parsed=JSON.parse(cells[3].textContent||'')}catch(_){return}const record=visible[index],staff=(st.staffList||[]).find(x=>String(x.user_id||x.id)===String(record?.staff_user_id||''));if(cells[1]&&staff)cells[1].textContent=staff.full_name||staff.username||cells[1].textContent;const changes=parsed?.changed_fields||parsed||{},raw=cells[2].textContent.trim(),m=raw.match(/^(insert|update|delete)_(.+)$/),verb=m?.[1]==='insert'?'新增':m?.[1]==='delete'?'删除':'修改',entity=actionNames[m?.[2]]||m?.[2]||raw;cells[2].textContent=`${verb}${entity}`;const lines=[];Object.entries(changes).forEach(([key,pair])=>{if(['updated_at','last_seen_at'].includes(key))return;const old=pair&&typeof pair==='object'&&'old'in pair?pair.old:null,newValue=pair&&typeof pair==='object'&&'new'in pair?pair.new:pair;if(sameBlank(old,newValue))return;lines.push(`<div><strong>${fieldNames[key]||key.replaceAll('_',' ')}：</strong>${showValue(old,key)} → ${showValue(newValue,key)}</div>`)});cells[3].innerHTML=lines.join('')||'<span class="muted">系统同步资料（没有实际内容变化）</span>';tr.dataset.v25914='1';
  });
 }
 const auditObserver=new MutationObserver(humanizeAudit);const watchAudit=()=>{const rows=document.querySelector('#auditRows');if(rows&&!rows.dataset.v25914Watch){rows.dataset.v25914Watch='1';auditObserver.observe(rows,{childList:true,subtree:true});humanizeAudit()}};setInterval(watchAudit,500);watchAudit();
})();
