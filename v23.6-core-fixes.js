(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const S=()=>window.__wlState||window.state||{};
const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
const lang=()=>window.SWK_LANG?.current||localStorage.getItem('swk_lang')||localStorage.getItem('wl_lang')||'zh';
const T=(z,e,m)=>lang()==='zh'?z:lang()==='ms'?m:e;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>`MYR ${Number(v||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function myDateKey(v){
 if(!v)return '';
 const raw=String(v).trim();
 const m=raw.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
 if(m)return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
 const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
 const ps=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const g=k=>ps.find(x=>x.type===k)?.value||'';return `${g('year')}-${g('month')}-${g('day')}`;
}
function todayMY(){return myDateKey(new Date())}
function loanDue(l){return l.due_date||l.next_due_date||l.current_due_date||l.expected_payment_at||l.expected_payment_date||l.approved_due_date||''}
function running(l){return !['paid','completed','settled','cancelled','rejected'].includes(norm(l.status));}
function role(){return norm(S().staff?.role||window.AppSession?.staff?.role)}
function customer(l){return (S().customers||[]).find(c=>String(c.id)===String(l.customer_id))||l.customers||{}}
function loanCode(l){return window.wlShortLoanId?window.wlShortLoanId(l.loan_id||l.loan_code||l.id):String(l.loan_id||l.loan_code||'-')}
function username(c){return window.wlCanonicalCustomerUsername?window.wlCanonicalCustomerUsername(c):String(c.username||c.customer_code||'-')}
function goto(id){if(typeof window.switchSection==='function')window.switchSection(id);else document.querySelector(`[data-section="${id}"]`)?.click()}

function bindHeaderActions(){
 if(document.documentElement.dataset.v236HeaderBound)return;document.documentElement.dataset.v236HeaderBound='1';
 document.addEventListener('click',e=>{
  const item=e.target.closest('.v51-status-item');if(!item)return;
  e.preventDefault();e.stopImmediatePropagation();
  const target=item.dataset.v51Target,r=role();
  if(target==='payment')goto(r==='customer_service'?'staffPaymentAllocation':'paymentSubmissions');
  else if(target==='disbursement')goto('pendingFinance');
  else if(target==='review')goto('loanReview');
  else if(target==='salary'){goto('companyManagement');setTimeout(()=>document.querySelector('[data-company-tab="advancesPanel"]')?.click(),120)}
 },true);
}
function patchProfile(){
 const st=S().staff||{};const live=(S().staffList||[]).find(x=>String(x.user_id||x.id)===String(st.user_id||st.id));
 const candidates=[live?.full_name,st.full_name,st.display_name,live?.username,st.username].map(v=>String(v||'').trim()).filter(Boolean);
 const name=candidates.find(v=>!['admin','finance','customer_service','super_admin'].includes(v.toLowerCase()))||candidates[0]||'';
 const n=$('.v51-profile-name'),a=$('.v51-profile');if(n)n.textContent=name;if(a)a.textContent=name?name[0].toUpperCase():'…';
}
function ensureToday(){
 const nav=$('#adminSidebar nav');if(!nav)return null;
 let btn=$('#navTodayWork');if(!btn){btn=document.createElement('button');btn.id='navTodayWork';btn.dataset.section='todayWork';btn.className='nav-single';btn.innerHTML=`<span>${T('今日工作','Today Work','Kerja Hari Ini')}</span><span id="navTodayWorkBadge" class="nav-count hidden">0</span>`;nav.insertBefore(btn,nav.firstElementChild)}
 let sec=$('#todayWork');if(!sec){sec=document.createElement('section');sec.id='todayWork';sec.className='section';$('main.main > header.topbar')?.insertAdjacentElement('afterend',sec)}
 return sec;
}
function table(title,headers,rows,empty){return `<section class="v236-work-block"><h3>${title}</h3><div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="muted">${empty}</td></tr>`}</tbody></table></div></section>`}
function renderToday(){
 const sec=ensureToday();if(!sec)return;
 const s=S(),r=role(),today=todayMY(),loans=(s.loans||[]).filter(running),apps=s.applications||[],subs=s.submissions||[],adv=s.salaryAdvances||[];
 const due=loans.filter(l=>myDateKey(loanDue(l))===today);
 const overdue=loans.filter(l=>Number(l.overdue_charge||l.overdue_amount||0)>0 || (myDateKey(loanDue(l))&&myDateKey(loanDue(l))<today));
 const disb=apps.filter(a=>['pending_disbursement','waiting_finance','awaiting_finance','pending_finance'].includes(norm(a.status)));
 const receipts=subs.filter(x=>{
  const fs=norm(x.finance_status),st=norm(x.status);
  const terminal=['rejected','cancelled','failed','completed','approved','received','finance_confirmed','awaiting_staff','staff_processing'];
  if(terminal.includes(fs)||terminal.includes(st))return false;
  const pending=['pending','submitted','pending_finance','awaiting_finance','waiting_finance_receive','finance_pending'];
  return pending.includes(fs)||pending.includes(st);
 });
 const advances=adv.filter(x=>['requested','pending','submitted'].includes(norm(x.status)));
 let html=`<div class="card v236-today-card"><h2>${T('今日工作','Today Work','Kerja Hari Ini')}</h2>`;let count=0;
 if(r==='finance'){
  count=disb.length+receipts.length+advances.length;
  html+=table(T('待放款','Pending Disbursement','Menunggu Pengeluaran'),[T('申请编号','Application','Permohonan'),T('客户','Customer','Pelanggan'),T('金额','Amount','Jumlah'),T('操作','Action','Tindakan')],disb.map(a=>`<tr><td>${esc(a.application_code||a.loan_id||'-')}</td><td>${esc(a.full_name||a.customers?.full_name||'-')}</td><td>${money(a.approved_principal||a.requested_amount)}</td><td><button class="btn btn-secondary" data-v236-goto="pendingFinance">${T('处理','Process','Proses')}</button></td></tr>`).join(''), '');
  html+=table(T('待收款','Pending Receipts','Menunggu Penerimaan'),[T('客户','Customer','Pelanggan'),T('贷款编号','Loan ID','ID Pinjaman'),T('金额','Amount','Jumlah'),T('操作','Action','Tindakan')],receipts.map(x=>{const l=(s.loans||[]).find(v=>String(v.id)===String(x.loan_id))||x.loans||{},c=customer(l);return `<tr><td>${esc(username(c))} · ${esc(c.full_name||'-')}</td><td>${esc(loanCode(l))}</td><td>${money(x.amount)}</td><td><button class="btn btn-secondary" data-v236-goto="financeReceipts">${T('处理','Process','Proses')}</button></td></tr>`}).join(''), '');
  html+=table(T('预支工资','Salary Advances','Pendahuluan Gaji'),[T('员工','Employee','Pekerja'),T('金额','Amount','Jumlah'),T('原因','Reason','Sebab'),T('操作','Action','Tindakan')],advances.map(x=>`<tr><td>${esc(x.employees?.full_name||x.employee_name||'-')}</td><td>${money(x.amount)}</td><td>${esc(x.reason||'-')}</td><td><button class="btn btn-secondary" data-v236-goto="companyManagement" data-v236-tab="advancesPanel">${T('处理','Process','Proses')}</button></td></tr>`).join(''), '');
 } else {
  count=due.length+overdue.length;
  html+=table(T('今日到期','Due Today','Matang Hari Ini'),[T('贷款编号','Loan ID','ID Pinjaman'),T('客户','Customer','Pelanggan'),T('本期利息','Interest','Faedah'),T('逾期应收','Overdue','Tertunggak'),T('到期日','Due Date','Tarikh Matang'),T('操作','Action','Tindakan')],due.map(l=>{const c=customer(l);return `<tr><td>${esc(loanCode(l))}</td><td>${esc(username(c))} · ${esc(c.full_name||'-')}</td><td>${money(l.interest||l.current_due_amount)}</td><td>${money(l.overdue_charge||l.overdue_amount)}</td><td>${esc(myDateKey(loanDue(l)))}</td><td><button class="btn btn-secondary" data-v236-loan="${esc(l.id)}">${T('查看','View','Lihat')}</button></td></tr>`}).join(''),T('今天没有到期贷款','No loans due today','Tiada pinjaman matang hari ini'));
  html+=table(T('逾期贷款','Overdue Loans','Pinjaman Tertunggak'),[T('贷款编号','Loan ID','ID Pinjaman'),T('客户','Customer','Pelanggan'),T('逾期金额','Overdue Amount','Jumlah Tertunggak'),T('操作','Action','Tindakan')],overdue.map(l=>{const c=customer(l);return `<tr><td>${esc(loanCode(l))}</td><td>${esc(username(c))} · ${esc(c.full_name||'-')}</td><td>${money(l.overdue_charge||l.overdue_amount)}</td><td><button class="btn btn-secondary" data-v236-loan="${esc(l.id)}">${T('查看','View','Lihat')}</button> <button class="btn btn-danger" data-v23-overdue="${esc(l.id)}">${T('设置逾期','Set Overdue','Tetapkan Tertunggak')}</button></td></tr>`}).join(''),T('目前没有逾期贷款','No overdue loans','Tiada pinjaman tertunggak'));
 }
 sec.innerHTML=html+'</div>';
 const b=$('#navTodayWorkBadge');if(b){b.textContent=count;b.classList.toggle('hidden',count===0)}
}
function bindWorkActions(){
 if(document.documentElement.dataset.v236WorkBound)return;document.documentElement.dataset.v236WorkBound='1';
 document.addEventListener('click',e=>{
  const g=e.target.closest('[data-v236-goto]');if(g){e.preventDefault();goto(g.dataset.v236Goto);if(g.dataset.v236Tab)setTimeout(()=>document.querySelector(`[data-company-tab="${g.dataset.v236Tab}"]`)?.click(),120)}
  const l=e.target.closest('[data-v236-loan]');if(l){e.preventDefault();window.openLoan?.(l.dataset.v236Loan)}
 },true);
}
function sync(){patchProfile();renderToday()}
bindHeaderActions();bindWorkActions();
document.addEventListener('wl:data-loaded',()=>setTimeout(sync,0));
window.addEventListener('swk-language-applied',()=>setTimeout(sync,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,80));else setTimeout(sync,80);
[250,600,1200,2500,5000].forEach(ms=>setTimeout(sync,ms));
})();
