(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const S=()=>window.__wlState||window.state||{};
const db=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const lang=()=>window.SWK_LANG?.current||'zh';
const L=(z,e,m)=>lang()==='zh'?z:lang()==='ms'?m:e;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T=(m,b=false)=>window.toast?.(m,b);
const close=()=>window.closeModal?.();
const modal=html=>window.modal?.(html);
const role=()=>String(S().staff?.role||'');
const isFinance=()=>['finance','super_admin'].includes(role());
const fmt=n=>`MYR ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const shortLoan=v=>window.canonicalLoanId?window.canonicalLoanId(v):String(v||'-');

async function rejectRpc(fn,args,success){
 const r=await db().rpc(fn,args);
 if(r.error||r.data?.ok===false)return T(r.error?.message||r.data?.error||L('拒绝失败','Reject failed','Penolakan gagal'),true);
 close();T(success);await window.loadAll?.();
 window.renderAll?.();window.renderPendingFinance?.();window.renderLoanReview?.();renderTodayWork();
}

function reasonDialog({title,help,confirm,onSubmit}){
 modal(`<h2>${E(title)}</h2>${help?`<p class="muted">${E(help)}</p>`:''}<form id="v233RejectForm"><div class="field"><label>${L('拒绝原因','Rejection reason','Sebab penolakan')}</label><textarea name="reason" rows="4" required minlength="3"></textarea></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-danger">${E(confirm||L('确认拒绝','Confirm Reject','Sahkan Tolak'))}</button><button type="button" class="btn btn-secondary" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div></form>`);
 $('#v233RejectForm').onsubmit=e=>{e.preventDefault();const reason=String(new FormData(e.target).get('reason')||'').trim();if(reason.length<3)return T(L('请填写拒绝原因','Enter a rejection reason','Masukkan sebab penolakan'),true);onSubmit(reason)};
}

window.rejectApplication=function(id){
 const a=(S().applications||[]).find(x=>String(x.id)===String(id));
 const stage=a?.status==='pending'?'loan_application':'loan_review';
 reasonDialog({title:stage==='loan_application'?L('拒绝贷款申请','Reject Loan Application','Tolak Permohonan Pinjaman'):L('拒绝贷款','Reject Loan','Tolak Pinjaman'),onSubmit:r=>rejectRpc('wl_reject_loan_workflow_v233',{p_application_id:id,p_stage:stage,p_reason:r},L('申请已拒绝','Application rejected','Permohonan ditolak'))});
};
window.v233RejectFinanceDisbursement=id=>reasonDialog({title:L('拒绝出款','Reject Disbursement','Tolak Pengeluaran'),help:L('案件会退回所属客服修改，之后可重新提交财务。','The case returns to the assigned staff for correction and resubmission.','Kes dikembalikan kepada staf untuk pembetulan.'),onSubmit:r=>rejectRpc('wl_reject_loan_workflow_v233',{p_application_id:id,p_stage:'finance_disbursement',p_reason:r},L('已退回客服修改','Returned to staff for correction','Dikembalikan kepada staf'))});
window.v233RejectPayment=(id,stage='finance_receipt')=>reasonDialog({title:stage==='staff_posting'?L('拒绝入账','Reject Posting','Tolak Rekod'):L('未收到／拒绝付款','Payment Not Received / Reject','Bayaran Tidak Diterima / Tolak'),help:stage==='staff_posting'?L('付款会退回财务重新核对。','The payment returns to finance for rechecking.','Bayaran dikembalikan kepada kewangan.'):L('客户可以修正后重新提交付款。','The customer may correct and resubmit the payment.','Pelanggan boleh membetulkan dan menghantar semula.'),onSubmit:r=>rejectRpc('wl_reject_payment_workflow_v233',{p_submission_id:id,p_stage:stage,p_reason:r},L('付款已拒绝','Payment rejected','Bayaran ditolak'))});
window.v233RejectSalaryAdvance=id=>reasonDialog({title:L('拒绝预支工资','Reject Salary Advance','Tolak Pendahuluan Gaji'),onSubmit:r=>rejectRpc('wl_reject_salary_advance_v233',{p_advance_id:id,p_reason:r},L('预支申请已拒绝','Salary advance rejected','Permohonan pendahuluan ditolak'))});
window.v37RejectReceipt=id=>window.v233RejectPayment(id,'finance_receipt');

function patchApplicationRows(){
 const rows=$('#applicationRows');if(!rows)return;
 [...rows.querySelectorAll('tr')].forEach(tr=>{
  const code=tr.querySelector('td')?.textContent?.trim();const a=(S().applications||[]).find(x=>String(x.application_code||x.id)===code);if(!a||a.status!=='pending')return;
  const cell=tr.lastElementChild;if(!cell||cell.querySelector('[data-v233-app-reject]'))return;
  cell.insertAdjacentHTML('beforeend',` <button class="btn btn-danger" data-v233-app-reject="${E(a.id)}">${L('拒绝','Reject','Tolak')}</button>`);
 });
}
function patchFinanceRows(){
 const rows=$('#v33DisbursementRows');if(!rows)return;
 [...rows.querySelectorAll('tr')].forEach(tr=>{
  const code=tr.querySelector('td')?.textContent?.trim();const a=(S().applications||[]).find(x=>String(x.application_code||x.id)===code);if(!a||a.status!=='pending_disbursement')return;
  const cell=tr.lastElementChild;if(!cell||cell.querySelector('[data-v233-finance-reject]'))return;
  cell.insertAdjacentHTML('beforeend',` <button class="btn btn-danger" data-v233-finance-reject="${E(a.id)}">${L('拒绝出款','Reject','Tolak')}</button>`);
 });
}
function patchPendingFinanceRows(){
 const rows=$('#pendingFinanceRows');if(!rows)return;
 [...rows.querySelectorAll('tr')].forEach(tr=>{
  const code=tr.querySelector('td')?.textContent?.trim();const a=(S().applications||[]).find(x=>String(x.application_code||x.id)===code);if(!a||a.status!=='pending_disbursement'||!isFinance())return;
  const cell=tr.lastElementChild;if(!cell||cell.querySelector('[data-v233-finance-reject]'))return;
  cell.insertAdjacentHTML('beforeend',` <button class="btn btn-danger" data-v233-finance-reject="${E(a.id)}">${L('拒绝出款','Reject','Tolak')}</button>`);
 });
}
function patchAdvanceRows(){
 const rows=$('#advanceRows');if(!rows)return;
 [...rows.querySelectorAll('tr')].forEach((tr,i)=>{const x=(S().salaryAdvances||[])[i];if(!x||!['requested','pending'].includes(String(x.status||'').toLowerCase()))return;const cell=tr.lastElementChild;if(!cell||cell.querySelector('[data-v233-advance-reject]'))return;cell.insertAdjacentHTML('beforeend',` <button class="btn btn-danger" data-v233-advance-reject="${E(x.id)}">${L('拒绝','Reject','Tolak')}</button>`)});
}
function patchAllocationModal(){
 const form=$('#v372AllocationForm');if(!form||form.querySelector('[data-v233-posting-reject]'))return;
 const id=$('[data-v372-allocate][data-v233-active]')?.dataset.v372Allocate||window.__v233AllocationId;
 const submit=form.querySelector('button[type="submit"],button.btn-primary');if(!submit||!id)return;
 submit.insertAdjacentHTML('afterend',` <button type="button" class="btn btn-danger" data-v233-posting-reject="${E(id)}">${L('拒绝入账','Reject Posting','Tolak Rekod')}</button>`);
}
const oldAllocation=window.v372OpenAllocation;
if(typeof oldAllocation==='function')window.v372OpenAllocation=async function(id){window.__v233AllocationId=id;const r=await oldAllocation.apply(this,arguments);setTimeout(patchAllocationModal,30);return r};

function ensureTodayWork(){
 const nav=$('#nav'),dashboard=$('[data-section="dashboard"]',nav);if(!nav||!dashboard)return;
 let btn=$('#navTodayWork');if(!btn){btn=document.createElement('button');btn.id='navTodayWork';btn.dataset.section='todayWork';btn.innerHTML=`<span>${L('今日工作','Today Work','Kerja Hari Ini')}</span><span id="navTodayWorkBadge" class="nav-count hidden">0</span>`;nav.insertBefore(btn,dashboard)}
 let sec=$('#todayWork');if(!sec){sec=document.createElement('section');sec.id='todayWork';sec.className='section';document.querySelector('main.main')?.appendChild(sec)}
}
function rowAction(section,label){return `<button class="btn btn-secondary" data-section-jump="${section}">${E(label)}</button>`}
function renderTodayWork(){
 ensureTodayWork();const sec=$('#todayWork');if(!sec)return;
 const apps=S().applications||[],subs=S().submissions||[],adv=S().salaryAdvances||[],loans=S().loans||[],customers=S().customers||[];
 const finance=role()==='finance',superA=role()==='super_admin';
 const dateKey=value=>{
  if(!value)return '';
  const raw=String(value).trim();
  const match=raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if(match)return `${match[1]}-${String(match[2]).padStart(2,'0')}-${String(match[3]).padStart(2,'0')}`;
  const parsed=new Date(value);
  if(Number.isNaN(parsed.getTime()))return '';
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(parsed);
  const part=type=>parts.find(x=>x.type===type)?.value||'';
  return `${part('year')}-${part('month')}-${part('day')}`;
 };
 const today=(()=>{
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=type=>parts.find(x=>x.type===type)?.value||'';
  return `${part('year')}-${part('month')}-${part('day')}`;
 })();
 const isRunning=l=>['active','in_progress','ongoing'].includes(String(l.status||'').toLowerCase());
 const customerFor=l=>customers.find(c=>String(c.id)===String(l.customer_id))||{};
 const due=loans.filter(l=>isRunning(l)&&dateKey(l.due_date)===today);
 const overdue=loans.filter(l=>isRunning(l)&&(Number(l.overdue_charge||0)>0||(dateKey(l.due_date)&&dateKey(l.due_date)<today)));
 const disb=apps.filter(a=>a.status==='pending_disbursement');
 const receipts=subs.filter(x=>['pending','submitted','pending_finance','awaiting_finance','waiting_finance_receive'].includes(String(x.finance_status||x.status||'').toLowerCase()));
 const advances=adv.filter(x=>['requested','pending'].includes(String(x.status||'').toLowerCase()));
 const parts=[];
 if(finance||superA){
  parts.push(`<div><h3>${L('待放款','Pending Disbursement','Menunggu Pengeluaran')}</h3><div class="table-wrap"><table class="table"><tbody>${disb.map(a=>`<tr><td>${E(a.application_code||'-')}</td><td>${E(a.full_name||'-')}</td><td>${fmt(a.approved_principal)}</td><td><button class="btn btn-secondary" data-v258-today-disburse="${E(a.id)}">${L('处理','Process','Proses')}</button></td></tr>`).join('')}</tbody></table></div></div>`);
  parts.push(`<div><h3>${L('待收款','Pending Receipts','Menunggu Penerimaan')}</h3><div class="table-wrap"><table class="table"><tbody>${receipts.map(x=>`<tr><td>${E(x.customers?.full_name||'-')}</td><td>${E(shortLoan(x.loans?.loan_id))}</td><td>${fmt(x.amount)}</td><td>${rowAction('financeReceipts',L('处理','Process','Proses'))}</td></tr>`).join('')}</tbody></table></div></div>`);
  parts.push(`<div><h3>${L('预支工资','Salary Advances','Pendahuluan Gaji')}</h3><div class="table-wrap"><table class="table"><tbody>${advances.map(x=>`<tr><td>${E(x.employees?.full_name||'-')}</td><td>${fmt(x.amount)}</td><td>${E(x.reason||'-')}</td><td><button class="btn btn-danger" data-v233-advance-reject="${E(x.id)}">${L('拒绝','Reject','Tolak')}</button></td></tr>`).join('')}</tbody></table></div></div>`);
 }
 if(!finance||superA){
  parts.push(`<div><h3>${L('今日到期','Due Today','Matang Hari Ini')}</h3><div class="table-wrap"><table class="table"><tbody>${due.map(l=>{const c=customerFor(l);return `<tr><td>${E(shortLoan(l.loan_id))}</td><td>${E(c.full_name||'-')}</td><td>${fmt(l.interest||l.current_due_amount)}</td><td>${rowAction('loans',L('查看','View','Lihat'))}</td></tr>`}).join('')}</tbody></table></div></div>`);
  parts.push(`<div><h3>${L('逾期贷款','Overdue Loans','Pinjaman Tertunggak')}</h3><div class="table-wrap"><table class="table"><tbody>${overdue.map(l=>{const c=customerFor(l);return `<tr><td>${E(shortLoan(l.loan_id))}</td><td>${E(c.full_name||'-')}</td><td>${fmt(l.overdue_charge||0)}</td><td>${rowAction('loans',L('查看','View','Lihat'))}</td></tr>`}).join('')}</tbody></table></div></div>`);
 }
 sec.innerHTML=`<div class="card"><h2>${L('今日工作','Today Work','Kerja Hari Ini')}</h2>${parts.join('')}</div>`;
 const count=(finance||superA?disb.length+receipts.length+advances.length:0)+(!finance||superA?due.length+overdue.length:0),b=$('#navTodayWorkBadge');if(b){b.textContent=count;b.classList.toggle('hidden',!count)}
}


window.renderTodayWorkV233=renderTodayWork;
document.addEventListener('wl:data-loaded',()=>setTimeout(()=>{renderTodayWork();patchProfileName()},0));

function patchProfileName(){
 const st=S().staff||{};const live=(S().staffList||[]).find(x=>String(x.user_id||x.id)===String(st.user_id||st.id));const name=live?.full_name||st.full_name||st.display_name||st.username||'admin';
 const n=$('.v51-profile-name');if(n)n.textContent=name;
 const a=$('.v51-profile');if(a)a.textContent=String(name).slice(0,1).toUpperCase();
}

document.addEventListener('click',e=>{
 const a=e.target.closest('[data-v233-app-reject]');if(a){e.preventDefault();window.rejectApplication(a.dataset.v233AppReject);return}
 const f=e.target.closest('[data-v233-finance-reject]');if(f){e.preventDefault();window.v233RejectFinanceDisbursement(f.dataset.v233FinanceReject);return}
 const p=e.target.closest('[data-v233-posting-reject]');if(p){e.preventDefault();window.v233RejectPayment(p.dataset.v233PostingReject,'staff_posting');return}
 const s=e.target.closest('[data-v233-advance-reject]');if(s){e.preventDefault();window.v233RejectSalaryAdvance(s.dataset.v233AdvanceReject);return}
 const j=e.target.closest('[data-section-jump]');if(j){e.preventDefault();window.switchSection?.(j.dataset.sectionJump);return}
},true);

const oldRenderAll=window.renderAll;
window.renderAll=function(){const r=oldRenderAll?.apply(this,arguments);setTimeout(()=>{patchApplicationRows();patchFinanceRows();patchPendingFinanceRows();patchAdvanceRows();renderTodayWork();patchProfileName()},20);return r};
const oldSwitch=window.switchSection;
window.switchSection=function(id){const r=oldSwitch?.apply(this,arguments);if(id==='todayWork')setTimeout(renderTodayWork,20);return r};
setInterval(()=>{patchApplicationRows();patchFinanceRows();patchPendingFinanceRows();patchAdvanceRows();patchProfileName()},2500);

document.addEventListener('click',e=>{
 const b=e.target.closest('[data-v258-today-disburse]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const id=b.dataset.v258TodayDisburse;
 if(typeof window.v258OpenFinanceDisbursement==='function')window.v258OpenFinanceDisbursement(id);
 else { const nav=document.querySelector('[data-section="financeDisbursements"]'); nav?.click(); setTimeout(()=>document.querySelector(`[data-v36-finance-disburse="${CSS.escape(id)}"]`)?.click(),100); }
},true);

window.addEventListener('swk-language-applied',()=>setTimeout(()=>{renderTodayWork();patchApplicationRows();patchFinanceRows();patchPendingFinanceRows();patchAdvanceRows();patchProfileName()},30));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{ensureTodayWork();renderTodayWork();patchProfileName()},0));else setTimeout(()=>{ensureTodayWork();renderTodayWork();patchProfileName()},0);
})();
