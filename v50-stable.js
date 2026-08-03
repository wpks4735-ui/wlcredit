(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const getLang=()=>window.SWK_LANG?.current||localStorage.getItem('wl_lang')||'zh';
  const tt=(zh,en,ms)=>getLang()==='zh'?zh:getLang()==='ms'?ms:en;
  const money=n=>`MYR ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const monthOf=v=>String(v||'').slice(0,7);
  const first=(x,keys)=>{for(const k of keys){if(x&&x[k]!=null&&x[k]!=='')return x[k]}return null};
  const amount=(x,keys)=>{for(const k of keys){const n=Number(x?.[k]);if(Number.isFinite(n)&&n!==0)return n}return 0};
  const status=x=>String(x?.payment_status||x?.status||'').toLowerCase();
  const state=()=>window.state||window.__wlState||{};
  function selectedMonth(){
    const input=$('#plMonth');
    if(input?.value)return input.value;
    const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    const m=d.toISOString().slice(0,7);if(input)input.value=m;return m;
  }
  function person(x){return x?.employees?.full_name||x?.employee_name||x?.full_name||'-'}
  function renderProfitLoss(){
    const root=$('#profitLossPreview')||$('#profitLossSummary');
    if(!root)return;
    const s=state(), month=selectedMonth(), rows=[];
    let collections=0,disbursements=0,payroll=0,expenses=0,advances=0;
    (s.repayments||[]).forEach(x=>{const d=first(x,['payment_date','received_at','created_at']);if(monthOf(d)!==month)return;const n=amount(x,['amount','total_amount','received_amount']);collections+=n;rows.push({d,t:tt('收款','Collection','Kutipan'),desc:`${x?.loans?.loan_id||x?.loan_id||'-'} · ${x?.loans?.customers?.full_name||x?.customer_name||'-'}`,inc:n,out:0,op:x?.staff_profiles?.full_name||x?.created_by_name||'-'})});
    (s.loans||[]).forEach(x=>{const d=first(x,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']);if(monthOf(d)!==month)return;const n=amount(x,['principal','principal_amount','loan_amount','approved_principal']);disbursements+=n;rows.push({d,t:tt('放款','Disbursement','Pengeluaran'),desc:`${x?.loan_id||'-'} · ${x?.customers?.full_name||x?.customer_name||'-'}`,inc:0,out:n,op:x?.finance_disbursed_by_name||x?.disbursed_by_name||'-'})});
    (s.payroll||[]).forEach(x=>{if(!['paid','completed'].includes(status(x)))return;const d=first(x,['payment_date','paid_at','payroll_month','created_at']);if(monthOf(d)!==month)return;const n=amount(x,['net_salary','amount','gross_salary','basic_salary']);payroll+=n;rows.push({d,t:tt('工资','Payroll','Gaji'),desc:person(x),inc:0,out:n,op:x?.paid_by_name||'-'})});
    (s.expenses||[]).forEach(x=>{const d=first(x,['expense_date','payment_date','created_at']);if(monthOf(d)!==month)return;const n=amount(x,['amount','expense_amount']);expenses+=n;rows.push({d,t:tt('公司开销','Company Expense','Perbelanjaan Syarikat'),desc:x?.description||x?.category||'-',inc:0,out:n,op:x?.created_by_name||'-'})});
    (s.salaryAdvances||[]).forEach(x=>{if(['rejected','cancelled','deducted','settled','completed','paid'].includes(status(x)))return;const d=first(x,['advance_date','approved_at','created_at']);if(monthOf(d)!==month)return;const n=amount(x,['approved_amount','amount']);advances+=n;rows.push({d,t:tt('未扣回预支工资','Outstanding Salary Advance','Pendahuluan Belum Ditolak'),desc:person(x),inc:0,out:n,op:x?.approved_by_name||'-'})});
    rows.sort((a,b)=>String(b.d||'').localeCompare(String(a.d||'')));
    const net=collections-disbursements-payroll-expenses-advances;
    root.innerHTML=`<div class="stats report-stats v50-pl-grid">
      <div class="stat"><span>${tt('总收款','Total Collections','Jumlah Kutipan')}</span><strong>${money(collections)}</strong></div>
      <div class="stat"><span>${tt('总放款','Total Disbursements','Jumlah Pengeluaran')}</span><strong>${money(disbursements)}</strong></div>
      <div class="stat"><span>${tt('已发工资','Payroll Paid','Gaji Dibayar')}</span><strong>${money(payroll)}</strong></div>
      <div class="stat"><span>${tt('公司开销','Company Expenses','Perbelanjaan Syarikat')}</span><strong>${money(expenses)}</strong></div>
      <div class="stat"><span>${tt('未扣回预支工资','Outstanding Salary Advances','Pendahuluan Belum Ditolak')}</span><strong>${money(advances)}</strong></div>
      <div class="stat"><span>${tt('公司盈亏','Company Profit / Loss','Untung / Rugi Syarikat')}</span><strong class="${net<0?'danger-text':'success-text'}">${money(net)}</strong></div>
    </div><p class="muted">${tt('公式：总收款－总放款－已发工资－公司开销－未扣回预支工资','Formula: collections − disbursements − payroll − expenses − outstanding salary advances','Formula: kutipan − pengeluaran − gaji − perbelanjaan − pendahuluan belum ditolak')}</p>
    <div class="section-head"><h3>${tt('收支明细','Income and Expense Details','Butiran Pendapatan dan Perbelanjaan')}</h3></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>${tt('日期','Date','Tarikh')}</th><th>${tt('类型','Type','Jenis')}</th><th>${tt('说明','Description','Penerangan')}</th><th>${tt('收入','Income','Pendapatan')}</th><th>${tt('支出','Expense','Perbelanjaan')}</th><th>${tt('操作人','Operator','Pengendali')}</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(String(r.d||'').slice(0,10)||'-')}</td><td>${esc(r.t)}</td><td>${esc(r.desc)}</td><td>${r.inc?money(r.inc):'-'}</td><td>${r.out?money(r.out):'-'}</td><td>${esc(r.op)}</td></tr>`).join(''):`<tr><td colspan="6" class="muted">${tt('本月没有收支记录','No income or expense records for this month','Tiada rekod pendapatan atau perbelanjaan bulan ini')}</td></tr>`}</tbody></table></div>`;
  }
  window.renderProfitLoss=renderProfitLoss;
  document.addEventListener('click',e=>{if(e.target.closest('[data-company-tab="profitLossPanel"],[data-company-tab="profit"]'))setTimeout(renderProfitLoss,0)});
  document.addEventListener('change',e=>{if(e.target?.id==='plMonth')renderProfitLoss()});
  document.addEventListener('wl:data-loaded',()=>setTimeout(renderProfitLoss,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if($('#profitLossPanel')?.classList.contains('active')||$('[data-company-panel="profit"]:not(.hidden)'))renderProfitLoss()},400));
})();
