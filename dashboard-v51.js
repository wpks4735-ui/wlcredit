(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const S=()=>window.state||window.__wlState||{};
  const lang=()=>window.SWK_LANG?.current||localStorage.getItem('wl_lang')||'zh';
  const t=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
  const num=v=>Number(v||0)||0;
  const money=v=>`MYR ${num(v).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const role=()=>String(S().staff?.role||'').toLowerCase().replace(/-/g,'_');
  const uid=()=>String(S().staff?.user_id||S().staff?.id||'');
  const dateValue=(x,keys)=>{for(const k of keys){if(x?.[k])return new Date(x[k])}return null};
  const amount=(x,keys)=>{for(const k of keys){const n=Number(x?.[k]);if(Number.isFinite(n))return n}return 0};
  const lower=v=>String(v||'').toLowerCase();
  const isActiveLoan=l=>['active','ongoing','disbursed','finance_disbursed'].includes(lower(l?.status)) && !['paid','completed','settled','cancelled'].includes(lower(l?.status));
  const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
  const endOfDay=d=>{const x=new Date(d);x.setHours(23,59,59,999);return x};
  const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
  function presetRange(key){
    const now=new Date(), dow=(now.getDay()+6)%7;
    let a=startOfDay(now),b=endOfDay(now);
    if(key==='yesterday'){a.setDate(a.getDate()-1);b=endOfDay(a)}
    if(key==='thisWeek'){a.setDate(a.getDate()-dow)}
    if(key==='lastWeek'){a.setDate(a.getDate()-dow-7);b=endOfDay(new Date(a.getFullYear(),a.getMonth(),a.getDate()+6))}
    if(key==='thisMonth'){a=new Date(now.getFullYear(),now.getMonth(),1);b=endOfDay(new Date(now.getFullYear(),now.getMonth()+1,0))}
    if(key==='lastMonth'){a=new Date(now.getFullYear(),now.getMonth()-1,1);b=endOfDay(new Date(now.getFullYear(),now.getMonth(),0))}
    return [a,b];
  }
  function inRange(d,a,b){return d && d>=a && d<=b}
  function customerOwner(c){return String(c?.owner_staff_id||c?.assigned_staff_id||c?.staff_id||'')}
  function loanCustomerId(l){return String(l?.customer_id||l?.customers?.id||'')}
  function staffName(st){return st?.full_name||st?.username||st?.auth_email||'-'}
  function ownerForLoan(l,customers){
    const direct=l?.owner_staff_id||l?.assigned_staff_id||l?.staff_id;
    if(direct)return String(direct);
    const c=customers.find(x=>String(x.id)===loanCustomerId(l));
    return customerOwner(c);
  }
  function initStructure(){
    const dash=$('#dashboard'); if(!dash||$('#v51Dashboard'))return;
    const legacy=document.createElement('div');legacy.id='v51LegacyDashboard';legacy.hidden=true;
    while(dash.firstChild)legacy.appendChild(dash.firstChild);
    dash.appendChild(legacy);
    dash.insertAdjacentHTML('afterbegin',`<div id="v51Dashboard">
      <div class="v51-page-head"><div><span class="v51-eyebrow">WL CREDIT</span><h2>${t('统计资讯','Statistics','Maklumat Statistik')}</h2><p>${t('公司营运与客服业绩概览','Company operations and staff performance overview','Gambaran operasi syarikat dan prestasi staf')}</p></div></div>
      <section class="v51-panel">
        <div class="v51-panel-head"><div><h3>${t('统计资讯','Statistics','Maklumat Statistik')}</h3><small>${t('此日期只影响本区统计','This date range only affects these statistics','Julat tarikh ini hanya mempengaruhi statistik ini')}</small></div></div>
        <div class="v51-filter" id="v51StatsFilter">
          <div class="v51-presets">${presetButtons('stats')}</div>
          <div class="v51-custom"><input id="v51StatsFrom" type="date"><span>—</span><input id="v51StatsTo" type="date"><button class="btn btn-primary" id="v51StatsApply">${t('查询','Search','Cari')}</button></div>
        </div>
        <div class="v51-kpi-grid" id="v51Kpis"></div>
      </section>
      <section class="v51-panel">
        <div class="v51-panel-head v51-report-head"><div><h3>${t('客服业绩报告','Customer Service Performance Report','Laporan Prestasi Khidmat Pelanggan')}</h3><small>${t('独立日期查询；不影响上方统计','Independent date range; does not affect statistics above','Julat tarikh berasingan; tidak menjejaskan statistik di atas')}</small></div><div class="v51-downloads"><button class="btn btn-secondary" id="v51ExportExcel">Excel</button><button class="btn btn-secondary" id="v51ExportCsv">CSV</button></div></div>
        <div class="v51-filter" id="v51StaffFilter">
          <div class="v51-presets">${presetButtons('staff')}</div>
          <div class="v51-custom"><input id="v51StaffFrom" type="date"><span>—</span><input id="v51StaffTo" type="date"><button class="btn btn-primary" id="v51StaffApply">${t('查询','Search','Cari')}</button></div>
        </div>
        <div class="table-wrap"><table class="table v51-table"><thead><tr><th>${t('客服','Customer Service','Khidmat Pelanggan')}</th><th>${t('客户数量','Customers','Pelanggan')}</th><th>${t('进行中贷款','Active Loans','Pinjaman Aktif')}</th><th>${t('共放款','Total Disbursed','Jumlah Dikeluarkan')}</th><th>${t('共收款','Total Collected','Jumlah Dikutip')}</th><th>${t('回收率','Recovery Rate','Kadar Kutipan')}</th><th>${t('盈亏','Profit / Loss','Untung / Rugi')}</th></tr></thead><tbody id="v51StaffRows"></tbody></table></div>
      </section>
    </div>`);
    initTopStatus();
    bind();
    const [a,b]=presetRange('thisMonth');setRange('stats',a,b);setRange('staff',a,b);
    renderAll();
  }
  function presetButtons(scope){return [['today','今天','Today','Hari Ini'],['yesterday','昨天','Yesterday','Semalam'],['thisWeek','本周','This Week','Minggu Ini'],['lastWeek','上周','Last Week','Minggu Lepas'],['thisMonth','本月','This Month','Bulan Ini'],['lastMonth','上月','Last Month','Bulan Lepas']].map(x=>`<button class="v51-preset" data-v51-scope="${scope}" data-v51-range="${x[0]}">${t(x[1],x[2],x[3])}</button>`).join('')}
  function initTopStatus(){
    const top=$('.topbar');if(!top||$('#v51StatusBar'))return;
    top.classList.add('v51-topbar');
    const old=top.querySelector('.top-actions');if(old)old.classList.add('v51-old-actions');
    top.insertAdjacentHTML('beforeend',`<div id="v51StatusBar" class="v51-statusbar">
      <button class="v51-status-item" data-v51-target="payment"><span class="v51-bell">🔔</span><span>${t('付款','Payment','Bayaran')}</span><b id="v51PaymentCount">0</b></button>
      <button class="v51-status-item" data-v51-target="disbursement"><span class="v51-bell">🔔</span><span>${t('出款','Disbursement','Pengeluaran')}</span><b id="v51DisbursementCount">0</b></button>
      <button class="v51-status-item" data-v51-target="review"><span class="v51-bell">🔔</span><span>${t('审核','Review','Semakan')}</span><b id="v51ReviewCount">0</b></button>
      <button class="v51-status-item" data-v51-target="salary"><span class="v51-bell">🔔</span><span>${t('工资','Salary','Gaji')}</span><b id="v51SalaryCount">0</b></button>
      <div class="v51-language"><button id="v51Globe" title="Language">🌐</button><select id="v51Lang"><option value="zh">简体中文</option><option value="en">English</option><option value="ms">Bahasa Melayu</option></select></div>
    </div>`);
    $('#v51Lang').value=lang();
  }
  function setRange(scope,a,b){$(`#v51${cap(scope)}From`).value=iso(a);$(`#v51${cap(scope)}To`).value=iso(b)}
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  function getRange(scope){const a=$(`#v51${cap(scope)}From`)?.value,b=$(`#v51${cap(scope)}To`)?.value;return [startOfDay(a||new Date()),endOfDay(b||new Date())]}
  function bind(){
    document.addEventListener('click',e=>{
      const p=e.target.closest('.v51-preset');if(p){const [a,b]=presetRange(p.dataset.v51Range);setRange(p.dataset.v51Scope,a,b);if(p.dataset.v51Scope==='stats')renderStats();else renderStaff();return}
      const s=e.target.closest('.v51-status-item');if(s){navigateStatus(s.dataset.v51Target);return}
    });
    $('#v51StatsApply').onclick=renderStats;$('#v51StaffApply').onclick=renderStaff;
    $('#v51ExportCsv').onclick=()=>exportReport('csv');$('#v51ExportExcel').onclick=()=>exportReport('xls');
    $('#v51Globe').onclick=()=>$('#v51Lang').focus();
    $('#v51Lang').onchange=e=>{const old=$('.lang-select');if(old){old.value=e.target.value;old.dispatchEvent(new Event('change',{bubbles:true}))}else{localStorage.setItem('wl_lang',e.target.value);location.reload()}};
    document.addEventListener('wl:data-loaded',renderAll);
    setInterval(()=>{if($('#dashboard')?.classList.contains('active'))renderAll()},10000);
  }
  function navigateStatus(type){
    const r=role();let section='dashboard';
    if(type==='payment')section=r==='finance'?'finance':'staffPaymentAllocation';
    if(type==='disbursement')section=r==='finance'?'finance':'pendingFinance';
    if(type==='review')section='loanApplications';
    if(type==='salary')section='companyManagement';
    const btn=$(`[data-section="${section}"]`);if(btn)btn.click();
    if(type==='salary')setTimeout(()=>{$('[data-company-tab="advancesPanel"]')?.click()},100);
  }
  function renderCounts(){
    const s=S(),r=role(),me=uid(),apps=s.applications||[],subs=s.submissions||[],loans=s.loans||[],advs=s.salaryAdvances||[],pay=s.payroll||[];
    const payment=r==='finance'?subs.filter(x=>['pending','submitted','pending_finance','awaiting_finance','waiting_finance_receive'].includes(lower(x.status))||['pending_finance','awaiting_finance'].includes(lower(x.finance_status))).length:subs.filter(x=>(['finance_confirmed','awaiting_staff','pending_allocation','customer_service_processing'].includes(lower(x.status))||['finance_confirmed','awaiting_staff'].includes(lower(x.finance_status)))&&(r==='super_admin'||String(x.assigned_staff_id||x.owner_staff_id||'')===me)).length;
    const disb=r==='finance'?apps.filter(x=>['pending_disbursement','waiting_finance','awaiting_finance'].includes(lower(x.status))).length:apps.filter(x=>['pending_disbursement','finance_disbursed','finance_paid'].includes(lower(x.status))&&(r==='super_admin'||String(x.owner_staff_id||x.assigned_staff_id||'')===me)).length;
    const review=apps.filter(x=>['pending','new','submitted'].includes(lower(x.status))||(lower(x.status)==='under_review'&&(r==='super_admin'||String(x.owner_staff_id||x.assigned_staff_id||'')===me))).length;
    const salary=advs.filter(x=>['requested','pending'].includes(lower(x.status))).length+pay.filter(x=>['pending','unpaid','draft'].includes(lower(x.payment_status||x.status))).length;
    [['v51PaymentCount',payment],['v51DisbursementCount',disb],['v51ReviewCount',review],['v51SalaryCount',salary]].forEach(([id,v])=>{const e=$('#'+id);if(e)e.textContent=v});
  }
  function renderStats(){
    const [a,b]=getRange('stats'),s=S(),customers=s.customers||[],loans=s.loans||[],reps=s.repayments||[],expenses=s.expenses||[],payroll=s.payroll||[],advs=s.salaryAdvances||[];
    const customerTotal=customers.length, active=loans.filter(isActiveLoan).length;
    const newCustomers=customers.filter(x=>inRange(dateValue(x,['created_at','approved_at']),a,b)).length;
    const newLoans=loans.filter(x=>inRange(dateValue(x,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']),a,b)).length;
    const filteredLoans=loans.filter(x=>inRange(dateValue(x,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']),a,b));
    const disb=filteredLoans.reduce((n,x)=>n+amount(x,['principal','principal_amount','loan_amount','approved_principal']),0);
    const filteredReps=reps.filter(x=>inRange(dateValue(x,['payment_date','finance_received_at','created_at']),a,b));
    const principal=filteredReps.reduce((n,x)=>n+amount(x,['principal_amount']),0),interest=filteredReps.reduce((n,x)=>n+amount(x,['interest_amount','interest']),0),overdue=filteredReps.reduce((n,x)=>n+amount(x,['overdue_amount']),0);
    const collected=filteredReps.reduce((n,x)=>n+(amount(x,['amount','total_amount'])||amount(x,['principal_amount'])+amount(x,['interest_amount'])+amount(x,['overdue_amount'])),0);
    const wages=payroll.filter(x=>['paid','completed'].includes(lower(x.payment_status||x.status))&&inRange(dateValue(x,['payment_date','paid_at','created_at']),a,b)).reduce((n,x)=>n+amount(x,['net_salary','amount']),0);
    const exp=expenses.filter(x=>inRange(dateValue(x,['expense_date','payment_date','created_at']),a,b)).reduce((n,x)=>n+amount(x,['amount','expense_amount']),0);
    const advances=advs.filter(x=>!['rejected','cancelled','deducted','settled','completed','paid'].includes(lower(x.status))&&inRange(dateValue(x,['advance_date','approved_at','created_at']),a,b)).reduce((n,x)=>n+amount(x,['approved_amount','amount']),0);
    const profit=collected-disb-wages-exp-advances;
    const cards=[
      [t('客户数量','Customers','Pelanggan'),customerTotal,'👥'],[t('进行中的贷款','Active Loans','Pinjaman Aktif'),active,'📄'],[t('新增客户','New Customers','Pelanggan Baharu'),newCustomers,'➕'],[t('新增贷款','New Loans','Pinjaman Baharu'),newLoans,'🧾'],[t('出入款总计','Total In / Out','Jumlah Masuk / Keluar'),`${money(collected)} / ${money(disb)}`,'⇄'],
      [t('共放款','Total Disbursed','Jumlah Dikeluarkan'),money(disb),'💸'],[t('共收款','Total Collected','Jumlah Dikutip'),money(collected),'💰'],[t('利息收入','Interest Collected','Faedah Dikutip'),money(interest),'％'],[t('逾期收入','Overdue Collected','Tunggakan Dikutip'),money(overdue),'⚠'],[t('公司盈亏','Company Profit / Loss','Untung / Rugi Syarikat'),money(profit),profit<0?'↓':'↑']
    ];
    $('#v51Kpis').innerHTML=cards.map((c,i)=>`<article class="v51-kpi ${i===9?(profit<0?'loss':'gain'):''}"><div class="v51-kpi-icon">${c[2]}</div><div><span>${c[0]}</span><strong>${c[1]}</strong></div></article>`).join('');
  }
  let lastRows=[];
  function renderStaff(){
    const [a,b]=getRange('staff'),s=S(),customers=s.customers||[],loans=s.loans||[],reps=s.repayments||[],staff=(s.staffList||[]).filter(x=>['customer_service','super_admin'].includes(lower(x.role)));
    const visible=role()==='customer_service'?staff.filter(x=>String(x.user_id||x.id)===uid()):staff.filter(x=>lower(x.role)==='customer_service');
    lastRows=visible.map(st=>{
      const sid=String(st.user_id||st.id),cust=customers.filter(c=>customerOwner(c)===sid),custIds=new Set(cust.map(c=>String(c.id)));
      const ownedLoans=loans.filter(l=>ownerForLoan(l,customers)===sid||custIds.has(loanCustomerId(l)));
      const active=ownedLoans.filter(isActiveLoan).length;
      const loanIds=new Set(ownedLoans.map(l=>String(l.id)));
      const disb=ownedLoans.filter(l=>inRange(dateValue(l,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']),a,b)).reduce((n,l)=>n+amount(l,['principal','principal_amount','loan_amount','approved_principal']),0);
      const rr=reps.filter(r=>loanIds.has(String(r.loan_id||r.loans?.id))&&inRange(dateValue(r,['payment_date','finance_received_at','created_at']),a,b));
      const collected=rr.reduce((n,x)=>n+amount(x,['principal_amount'])+amount(x,['interest_amount','interest'])+amount(x,['overdue_amount']),0);
      const recovery=disb>0?collected/disb*100:0,profit=collected-disb;
      return {name:staffName(st),customers:cust.length,active,disb,collected,recovery,profit};
    });
    const total=lastRows.reduce((o,r)=>({name:t('总计','Total','Jumlah'),customers:o.customers+r.customers,active:o.active+r.active,disb:o.disb+r.disb,collected:o.collected+r.collected,recovery:0,profit:o.profit+r.profit}),{customers:0,active:0,disb:0,collected:0,profit:0});
    total.recovery=total.disb?total.collected/total.disb*100:0;
    const rows=lastRows.length?[...lastRows,total]:[];
    $('#v51StaffRows').innerHTML=rows.length?rows.map((r,i)=>`<tr class="${i===rows.length-1?'v51-total-row':''}"><td>${esc(r.name)}</td><td>${r.customers}</td><td>${r.active}</td><td>${money(r.disb)}</td><td>${money(r.collected)}</td><td>${r.recovery.toFixed(2)}%</td><td class="${r.profit<0?'danger-text':'success-text'}">${money(r.profit)}</td></tr>`).join(''):`<tr><td colspan="7" class="muted">${t('没有客服资料','No staff data','Tiada data staf')}</td></tr>`;
  }
  function exportReport(type){
    if(!lastRows.length)return;
    const headers=[t('客服','Customer Service','Khidmat Pelanggan'),t('客户数量','Customers','Pelanggan'),t('进行中贷款','Active Loans','Pinjaman Aktif'),t('共放款','Total Disbursed','Jumlah Dikeluarkan'),t('共收款','Total Collected','Jumlah Dikutip'),t('回收率','Recovery Rate','Kadar Kutipan'),t('盈亏','Profit / Loss','Untung / Rugi')];
    const data=lastRows.map(r=>[r.name,r.customers,r.active,r.disb,r.collected,r.recovery.toFixed(2)+'%',r.profit]);
    let blob,name;
    if(type==='csv'){const csv='\ufeff'+[headers,...data].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');blob=new Blob([csv],{type:'text/csv;charset=utf-8'});name='wl-credit-staff-performance.csv'}
    else{const html=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${data.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'});name='wl-credit-staff-performance.xls'}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function renderAll(){if(!$('#v51Dashboard'))return;renderCounts();renderStats();renderStaff()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initStructure,100));else setTimeout(initStructure,100);
})();
