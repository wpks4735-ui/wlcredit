/* WL Credit V25.4 - customer-count bank allocation UI refresh + loan staff filters */
(()=>{
'use strict';
const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
const st=()=>window.state||window.__wlState||{};
const role=()=>norm(st().staff?.role);
const isAllViewer=()=>['super_admin','superadmin','finance'].includes(role());
const isCS=()=>role()==='customer_service';
const esc2=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money2=v=>typeof window.money==='function'?window.money(v):`MYR ${Number(v||0).toFixed(2)}`;
const date2=v=>typeof window.date==='function'?window.date(v):String(v||'-');
const code2=v=>typeof window.canonicalLoanId==='function'?window.canonicalLoanId(v):String(v||'-');
const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
let selectedStaff='all';

function csStaff(){
 return (st().staffList||[]).filter(x=>x.is_active!==false&&norm(x.role)==='customer_service')
   .sort((a,b)=>String(a.full_name||a.username||'').localeCompare(String(b.full_name||b.username||''),undefined,{numeric:true,sensitivity:'base'}));
}
function staffName(id){
 const x=(st().staffList||[]).find(s=>String(s.user_id)===String(id));
 return x?.full_name||x?.username||x?.staff_code||L('未分配','Unassigned','Belum ditetapkan');
}
function ownerForLoan(loan){
 const c=(st().customers||[]).find(x=>String(x.id)===String(loan.customer_id));
 return String(c?.owner_staff_id||c?.assigned_staff_id||c?.claimed_by||loan.owner_staff_id||loan.assigned_staff_id||'');
}
function loanRows(){
 const rows=st().loans||[];
 if(isCS()){
   const uid=String(st().staff?.user_id||'');
   return rows.filter(l=>ownerForLoan(l)===uid);
 }
 if(isAllViewer()&&selectedStaff!=='all')return rows.filter(l=>ownerForLoan(l)===selectedStaff);
 return rows;
}
function ensureHeader(){
 const table=document.querySelector('#loans table');
 const tr=table?.querySelector('thead tr');
 if(!tr||tr.querySelector('[data-v254-staff-col]'))return;
 const th=document.createElement('th');th.dataset.v254StaffCol='1';th.textContent=L('客服','Staff','Staf');
 tr.insertBefore(th,tr.children[2]||null);
}
function renderFilter(){
 const section=document.querySelector('#loans');
 if(!section)return;
 let bar=section.querySelector('#v254LoanStaffFilters');
 if(!bar){
   bar=document.createElement('div');bar.id='v254LoanStaffFilters';bar.className='customer-owner-tabs';
   const wrap=section.querySelector('.table-wrap');section.insertBefore(bar,wrap);
 }
 if(!isAllViewer()){
   bar.innerHTML=`<button class="btn btn-primary" type="button">${esc2(st().staff?.full_name||st().staff?.username||L('我的贷款','My Loans','Pinjaman Saya'))} <strong>${loanRows().length}</strong></button>`;
   return;
 }
 const all=(st().loans||[]).length;
 const buttons=[`<button type="button" class="btn ${selectedStaff==='all'?'btn-primary':'btn-secondary'}" data-v254-loan-staff="all">${L('全部贷款','All Loans','Semua Pinjaman')} <strong>${all}</strong></button>`];
 csStaff().forEach(s=>{
   const id=String(s.user_id),count=(st().loans||[]).filter(l=>ownerForLoan(l)===id).length;
   buttons.push(`<button type="button" class="btn ${selectedStaff===id?'btn-primary':'btn-secondary'}" data-v254-loan-staff="${esc2(id)}">${esc2(s.full_name||s.username||s.staff_code||'-')} <strong>${count}</strong></button>`);
 });
 const unassigned=(st().loans||[]).filter(l=>!ownerForLoan(l)).length;
 if(unassigned)buttons.push(`<button type="button" class="btn ${selectedStaff==='unassigned'?'btn-primary':'btn-secondary'}" data-v254-loan-staff="unassigned">${L('未分配','Unassigned','Belum ditetapkan')} <strong>${unassigned}</strong></button>`);
 bar.innerHTML=buttons.join('');
}
function renderLoansV254(){
 const tbody=document.querySelector('#loanRows');if(!tbody)return;
 ensureHeader();renderFilter();
 let rows=loanRows();
 if(selectedStaff==='unassigned')rows=(st().loans||[]).filter(l=>!ownerForLoan(l));
 tbody.innerHTML=rows.map(l=>{
   const c=(st().customers||[]).find(x=>String(x.id)===String(l.customer_id));
   const contacts=[c?.telegram_contact?.label,c?.whatsapp_contact?.label].filter(Boolean).join(' + ');
   const overdue=String(l.status||'')==='paid'?false:(l.due_date&&String(l.due_date)<(typeof window.isoToday==='function'?window.isoToday():new Date().toISOString().slice(0,10)));
   const badge=String(l.status||'')==='paid'?'ok':overdue?'danger':'warn';
   const status=typeof window.loanStatus==='function'?window.loanStatus(l):(overdue?L('逾期','Overdue','Tertunggak'):L('进行中','In Progress','Sedang Berjalan'));
   return `<tr>
    <td>${esc2(code2(l.loan_id))}</td>
    <td><span class="click-link" onclick="openCustomerProfile('${esc2(l.customer_id)}')">${esc2(c?.full_name||l.customers?.full_name||'-')}</span></td>
    <td>${esc2(staffName(ownerForLoan(l)))}</td>
    <td>${money2(l.principal)}</td><td>${money2(l.interest)}</td><td>${money2(l.settlement_amount)}</td>
    <td>${esc2(c?.receiving_bank?.bank_name||L('未分配','Unassigned','Belum ditetapkan'))}</td>
    <td>${esc2(contacts||L('未分配','Unassigned','Belum ditetapkan'))}</td>
    <td>${date2(l.due_date)}</td>
    <td><span class="badge ${badge}">${esc2(status)}</span></td>
    <td><button class="btn btn-secondary" onclick="openLoan('${esc2(l.id)}')">${L('编辑','Edit','Edit')}</button></td>
   </tr>`;
 }).join('')||`<tr><td colspan="11" class="muted">${L('没有贷款资料','No loan records','Tiada rekod pinjaman')}</td></tr>`;
}

document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-v254-loan-staff]');if(!b)return;
 selectedStaff=b.dataset.v254LoanStaff;renderLoansV254();
});

// Install after all older render wrappers have loaded.
function install(){
 window.renderLoans=renderLoansV254;
 renderLoansV254();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,800));
else setTimeout(install,800);
document.addEventListener('wl:data-loaded',()=>setTimeout(renderLoansV254,50));
window.addEventListener('swk-language-applied',()=>setTimeout(renderLoansV254,30));

// After bank rebalance, refresh all data and show the actual customer count returned by SQL.
const originalRpc=window.sb?.rpc?.bind(window.sb);
// No monkey-patching Supabase itself; the existing form already calls loadAll().
})();
