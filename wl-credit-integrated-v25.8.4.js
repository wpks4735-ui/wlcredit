
/* ===== v50-stable.js ===== */
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

/* ===== dashboard-v51.js ===== */
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
    $('#v41RoleOverview')?.remove();$('#v39RoleOverview')?.remove();
    dash.insertAdjacentHTML('afterbegin',`<div id="v51Dashboard">
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
    initSidebarToggle();
    bind();
    const [a,b]=presetRange('thisMonth');setRange('stats',a,b);setRange('staff',a,b);
    renderAll();
    // The dashboard structure can be ready before loadAll() finishes. Perform a short,
    // bounded startup sync so the first real dataset is painted automatically even
    // when the data-loaded event occurred just before this module attached its listener.
    startInitialDataSync();
  }
  function presetButtons(scope){return [['today','今天','Today','Hari Ini'],['yesterday','昨天','Yesterday','Semalam'],['thisWeek','本周','This Week','Minggu Ini'],['lastWeek','上周','Last Week','Minggu Lepas'],['thisMonth','本月','This Month','Bulan Ini'],['lastMonth','上月','Last Month','Bulan Lepas']].map(x=>`<button class="v51-preset" data-v51-scope="${scope}" data-v51-range="${x[0]}">${t(x[1],x[2],x[3])}</button>`).join('')}
  function initTopStatus(){
    const top=$('.topbar');if(!top||$('#v51StatusBar'))return;
    top.classList.add('v51-topbar');
    const old=top.querySelector('.top-actions');if(old)old.classList.add('v51-old-actions');
    top.insertAdjacentHTML('beforeend',`<div id="v51StatusBar" class="v51-statusbar">
      <div class="v51-status-cluster">
        <button class="v51-status-item" data-v51-target="payment"><span class="v51-status-icon">⇩</span><span>${t('收款','Collection','Kutipan')}</span><b id="v51PaymentCount">0</b><span class="v51-mini-bell">🔔</span></button>
        <button class="v51-status-item" data-v51-target="disbursement"><span class="v51-status-icon">⇧</span><span>${t('出款','Disbursement','Pengeluaran')}</span><b id="v51DisbursementCount">0</b><span class="v51-mini-bell">🔔</span></button>
        <button class="v51-status-item" data-v51-target="review"><span class="v51-status-icon">✓</span><span>${t('审核','Review','Semakan')}</span><b id="v51ReviewCount">0</b><span class="v51-mini-bell">🔔</span></button>
        <button class="v51-status-item" data-v51-target="salary"><span class="v51-status-icon">▣</span><span>${t('工资','Salary','Gaji')}</span><b id="v51SalaryCount">0</b><span class="v51-mini-bell">🔔</span></button>
      </div>
      <div class="v51-header-tools">
        <div class="v51-tool-menu-wrap v51-language"><button id="v51Globe" title="Language" type="button">🌐</button><div id="v51LanguageMenu" class="v51-popover v51-language-menu hidden"><button type="button" data-v51-lang="zh"><span class="v51-lang-check"></span>简体中文</button><button type="button" data-v51-lang="en"><span class="v51-lang-check"></span>English</button><button type="button" data-v51-lang="ms"><span class="v51-lang-check"></span>Bahasa Melayu</button></div></div>
        <div class="v51-tool-menu-wrap">
          <button id="v51Sound" class="v51-round-tool" type="button" title="Sound">🔊</button>
          <div id="v51SoundMenu" class="v51-popover hidden">
            <button type="button" data-v51-sound="on">🔊 <span>${t('有声音','Sound On','Bunyi Aktif')}</span></button>
            <button type="button" data-v51-sound="off">🔇 <span>${t('无声音','Sound Off','Tiada Bunyi')}</span></button>
          </div>
        </div>
        <div class="v51-tool-menu-wrap">
          <button id="v51ProfileBtn" class="v51-profile-btn" type="button"><span class="v51-profile">${esc((S().staff?.full_name||S().staff?.username||'A').slice(0,1).toUpperCase())}</span><span class="v51-profile-name">${esc(S().staff?.full_name||S().staff?.username||'admin')}</span><span>⌄</span></button>
          <div id="v51ProfileMenu" class="v51-popover v51-profile-menu hidden">
            <button type="button" id="v51ChangePassword">🔐 <span>${t('修改密码','Change Password','Tukar Kata Laluan')}</span></button>
            <button type="button" id="v51Logout" class="danger">↪ <span>${t('退出登录','Logout','Log Keluar')}</span></button>
          </div>
        </div>
      </div>
    </div>`);
    updateLanguageMenu();
  }
  function initSidebarToggle(){
    const app=document.getElementById('adminApp');
    const top=document.querySelector('.topbar');
    const btn=document.getElementById('mobileMenuBtn');
    const sidebar=document.getElementById('adminSidebar');
    const overlay=document.getElementById('sidebarOverlay');
    if(!app||!top||!btn||!sidebar||btn.dataset.v20Ready)return;
    btn.dataset.v20Ready='1';
    btn.type='button';
    btn.textContent='☰';
    top.insertBefore(btn,top.firstChild);
    const mobile=()=>window.matchMedia('(max-width:900px)').matches;
    const closeMobile=()=>{
      sidebar.classList.remove('open');
      overlay?.classList.remove('show');
      document.body.classList.remove('sidebar-open');
      btn.setAttribute('aria-expanded','false');
    };
    const applyDesktop=collapsed=>{
      closeMobile();
      document.body.classList.toggle('sidebar-collapsed',collapsed);
      btn.setAttribute('aria-expanded',String(!collapsed));
      localStorage.setItem('wl_sidebar_collapsed',collapsed?'1':'0');
    };
    const sync=()=>{
      if(mobile()){
        document.body.classList.remove('sidebar-collapsed');
        closeMobile();
      }else applyDesktop(localStorage.getItem('wl_sidebar_collapsed')==='1');
    };
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      if(mobile()){
        const open=!sidebar.classList.contains('open');
        sidebar.classList.toggle('open',open);
        overlay?.classList.toggle('show',open);
        document.body.classList.toggle('sidebar-open',open);
        btn.setAttribute('aria-expanded',String(open));
      }else applyDesktop(!document.body.classList.contains('sidebar-collapsed'));
    },true);
    overlay?.addEventListener('click',closeMobile);
    document.addEventListener('click',e=>{if(mobile()&&e.target.closest('#adminSidebar [data-section]'))closeMobile()});
    window.addEventListener('resize',sync);
    sync();
  }
  function setRange(scope,a,b){$(`#v51${cap(scope)}From`).value=iso(a);$(`#v51${cap(scope)}To`).value=iso(b)}
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  function getRange(scope){const a=$(`#v51${cap(scope)}From`)?.value,b=$(`#v51${cap(scope)}To`)?.value;return [startOfDay(a||new Date()),endOfDay(b||new Date())]}
  function bind(){
    document.addEventListener('click',e=>{
      if(!e.target.closest('.v51-language'))$('#v51LanguageMenu')?.classList.add('hidden');
      const p=e.target.closest('.v51-preset');if(p){const [a,b]=presetRange(p.dataset.v51Range);setRange(p.dataset.v51Scope,a,b);if(p.dataset.v51Scope==='stats')renderStats();else renderStaff();return}
      const s=e.target.closest('.v51-status-item');if(s){navigateStatus(s.dataset.v51Target);return}
    });
    $('#v51StatsApply').onclick=renderStats;$('#v51StaffApply').onclick=renderStaff;
    $('#v51ExportCsv').onclick=()=>exportReport('csv');$('#v51ExportExcel').onclick=()=>exportReport('xls');
    const languageMenu=$('#v51LanguageMenu');
    const updateLanguageMenu=window.updateLanguageMenu=()=>{$$('[data-v51-lang]',languageMenu).forEach(btn=>{btn.classList.toggle('active',btn.dataset.v51Lang===lang());const check=btn.querySelector('.v51-lang-check');if(check)check.textContent=btn.dataset.v51Lang===lang()?'✓':''})};
    $('#v51Globe').onclick=e=>{e.stopPropagation();languageMenu.classList.toggle('hidden');$('#v51SoundMenu')?.classList.add('hidden');$('#v51ProfileMenu')?.classList.add('hidden');updateLanguageMenu()};
    $$('[data-v51-lang]',languageMenu).forEach(btn=>btn.onclick=()=>{const value=btn.dataset.v51Lang;localStorage.setItem('wl_lang',value);const legacy=document.querySelector('.lang-select');if(legacy){legacy.value=value;legacy.dispatchEvent(new Event('change',{bubbles:true}))}else location.reload();languageMenu.classList.add('hidden')});
    const soundOn=()=>localStorage.getItem('wl_notification_sound')!=='0'&&localStorage.getItem('wl_notification_sound')!=='off';
    const refreshSoundIcon=()=>{$('#v51Sound').textContent=soundOn()?'🔊':'🔇'};
    refreshSoundIcon();
    $('#v51Sound').onclick=e=>{e.stopPropagation();$('#v51ProfileMenu')?.classList.add('hidden');$('#v51SoundMenu')?.classList.toggle('hidden')};
    $$('[data-v51-sound]').forEach(btn=>btn.onclick=async e=>{e.stopPropagation();const desired=btn.dataset.v51Sound==='on';const current=soundOn();if(desired!==current){const old=$('#enableSoundBtn');if(old)old.click();else{localStorage.setItem('wl_notification_sound',desired?'1':'0');if(S())S().soundEnabled=desired}}refreshSoundIcon();$('#v51SoundMenu')?.classList.add('hidden')});
    $('#v51ProfileBtn').onclick=e=>{e.stopPropagation();$('#v51SoundMenu')?.classList.add('hidden');$('#v51ProfileMenu')?.classList.toggle('hidden')};
    $('#v51ChangePassword').onclick=()=>{$('#v51ProfileMenu')?.classList.add('hidden');openPasswordChange()};
    $('#v51Logout').onclick=()=>{$('#staffLogout')?.click()};
    document.addEventListener('click',()=>{$('#v51SoundMenu')?.classList.add('hidden');$('#v51ProfileMenu')?.classList.add('hidden')});
    $('#v51Lang').onchange=e=>{const old=$('.lang-select');if(old){old.value=e.target.value;old.dispatchEvent(new Event('change',{bubbles:true}))}else{localStorage.setItem('wl_lang',e.target.value);location.reload()}};
    document.addEventListener('wl:data-loaded',renderAll);
    setInterval(()=>{if($('#dashboard')?.classList.contains('active'))renderAll()},10000);
  }

  function openPasswordChange(){
    const title=t('修改密码','Change Password','Tukar Kata Laluan');
    const currentLabel=t('当前密码','Current Password','Kata Laluan Semasa');
    const newLabel=t('新密码','New Password','Kata Laluan Baharu');
    const confirmLabel=t('确认新密码','Confirm New Password','Sahkan Kata Laluan Baharu');
    const saveLabel=t('保存新密码','Save New Password','Simpan Kata Laluan Baharu');
    if(typeof window.modal!=='function')return;
    window.modal(`<h2>${title}</h2><form id="v51PasswordForm"><div class="field"><label>${currentLabel}</label><input name="current" type="password" autocomplete="current-password" required minlength="8"></div><div class="field"><label>${newLabel}</label><input name="next" type="password" autocomplete="new-password" required minlength="8"></div><div class="field"><label>${confirmLabel}</label><input name="confirm" type="password" autocomplete="new-password" required minlength="8"></div><button class="btn btn-primary" type="submit">${saveLabel}</button></form>`);
    $('#v51PasswordForm').onsubmit=async e=>{
      e.preventDefault();
      const fd=new FormData(e.currentTarget),current=String(fd.get('current')||''),next=String(fd.get('next')||''),confirm=String(fd.get('confirm')||'');
      if(next!==confirm)return window.toast?.(t('两次输入的新密码不一致','New passwords do not match','Kata laluan baharu tidak sepadan'),true);
      if(next===current)return window.toast?.(t('新密码不能与当前密码相同','New password must differ from the current password','Kata laluan baharu mesti berbeza'),true);
      try{
        const {data:{user}}=await window.sb.auth.getUser();
        if(!user?.email)throw new Error(t('无法取得登录账号','Unable to retrieve login account','Tidak dapat mendapatkan akaun log masuk'));
        const verify=await window.sb.auth.signInWithPassword({email:user.email,password:current});
        if(verify.error)throw new Error(t('当前密码不正确','Current password is incorrect','Kata laluan semasa tidak betul'));
        const updated=await window.sb.auth.updateUser({password:next});
        if(updated.error)throw updated.error;
        document.querySelector('#modal')?.classList.remove('show');
        window.toast?.(t('密码修改成功','Password changed successfully','Kata laluan berjaya ditukar'));
      }catch(err){window.toast?.(err?.message||String(err),true)}
    };
  }

  function navigateStatus(type){
    const r=role();
    const candidates={
      payment:r==='finance'?['paymentSubmissions']:['staffPaymentAllocation','paymentSubmissions'],
      disbursement:['pendingFinance'],
      review:['loanReview','loanApplications'],
      salary:r==='finance'||r==='super_admin'?['companyManagement']:['myHr']
    }[type]||['dashboard'];
    const section=candidates.find(id=>document.getElementById(id));
    if(!section)return;
    const btn=$(`#nav button[data-section="${section}"]`);
    if(btn){btn.click()}else{
      $$('#nav button[data-section],.section').forEach(x=>x.classList.remove('active'));
      document.getElementById(section)?.classList.add('active');
      localStorage.setItem('wl_active_section',section);
    }
    if(type==='payment'&&r==='finance'){
      setTimeout(()=>{state.filter='pending';renderSubmissions?.()},80);
    }
    if(type==='salary'&&section==='companyManagement')setTimeout(()=>{$('[data-company-tab="advancesPanel"]')?.click()},100);
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
      [t('客户数量','Customers','Pelanggan'),customerTotal,'👥'],[t('进行中的贷款','Active Loans','Pinjaman Aktif'),active,'📄'],[t('新增客户','New Customers','Pelanggan Baharu'),newCustomers,'➕'],[t('新增贷款','New Loans','Pinjaman Baharu'),newLoans,'🧾'],[t('出入款总计','Net In / Out','Jumlah Bersih Masuk / Keluar'),money(collected-disb),'⇄'],
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
  let initialSyncTimer=null;
  function dataSignature(){
    const s=S();
    return [
      s.staff?.user_id||s.staff?.id||'',
      (s.customers||[]).length,
      (s.loans||[]).length,
      (s.repayments||[]).length,
      (s.applications||[]).length,
      (s.submissions||[]).length,
      (s.staffList||[]).length,
      (s.payroll||[]).length,
      (s.salaryAdvances||[]).length
    ].join('|');
  }
  function startInitialDataSync(){
    if(initialSyncTimer)clearInterval(initialSyncTimer);
    let attempts=0,last=dataSignature(),stableAfterData=0;
    initialSyncTimer=setInterval(()=>{
      attempts+=1;
      const current=dataSignature();
      const hasStaff=Boolean(S().staff);
      if(current!==last||hasStaff){
        renderAll();
        stableAfterData=current===last?stableAfterData+1:0;
        last=current;
      }
      // Stop after data has remained stable briefly, or after 12 seconds maximum.
      if((hasStaff&&stableAfterData>=3)||attempts>=48){
        clearInterval(initialSyncTimer);
        initialSyncTimer=null;
      }
    },250);
  }
  document.addEventListener('wl:data-loaded',()=>{renderAll();startInitialDataSync()});
  window.addEventListener('pageshow',()=>{renderAll();startInitialDataSync()});
  window.renderV51Stats=renderStats;window.renderV51Staff=renderStaff;window.renderV51All=renderAll;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initStructure,100));else setTimeout(initStructure,100);
})();

/* ===== V21.1 compact one-row header interaction hardening ===== */
(function(){
  'use strict';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const lang=()=>window.SWK_LANG?.current||localStorage.getItem('wl_lang')||'zh';
  const tr=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
  const closeMenus=()=>{
    q('#v51LanguageMenu')?.classList.add('hidden');
    q('#v51SoundMenu')?.classList.add('hidden');
    q('#v51ProfileMenu')?.classList.add('hidden');
  };
  function setSound(on){
    localStorage.setItem('wl_notification_sound',on?'1':'0');
    if(window.state)window.state.soundEnabled=on;
    const legacy=q('#enableSoundBtn');
    if(legacy){
      const legacyOn=window.state?.soundEnabled===true;
      if(legacyOn!==on) legacy.click();
    }
    const btn=q('#v51Sound'); if(btn)btn.textContent=on?'🔊':'🔇';
  }
  function soundOn(){return localStorage.getItem('wl_notification_sound')==='1'}
  function updateLanguageChecks(){
    qa('[data-v51-lang]').forEach(btn=>{
      const active=btn.dataset.v51Lang===lang();
      btn.classList.toggle('active',active);
      const check=btn.querySelector('.v51-lang-check');if(check)check.textContent=active?'✓':'';
    });
  }
  function toggleSidebar(){
    const mobile=matchMedia('(max-width:900px)').matches;
    const sidebar=q('#adminSidebar'), overlay=q('#sidebarOverlay'), btn=q('#mobileMenuBtn');
    if(!sidebar)return;
    if(mobile){
      const open=!sidebar.classList.contains('open');
      sidebar.classList.toggle('open',open);overlay?.classList.toggle('show',open);
      document.body.classList.toggle('sidebar-open',open);btn?.setAttribute('aria-expanded',String(open));
    }else{
      const collapsed=!document.body.classList.contains('sidebar-collapsed');
      document.body.classList.toggle('sidebar-collapsed',collapsed);
      localStorage.setItem('wl_sidebar_collapsed',collapsed?'1':'0');
      btn?.setAttribute('aria-expanded',String(!collapsed));
    }
  }
  async function openPassword(){
    if(typeof window.modal!=='function')return;
    window.modal(`<h2>${tr('修改密码','Change Password','Tukar Kata Laluan')}</h2><form id="v211PasswordForm"><div class="field"><label>${tr('当前密码','Current Password','Kata Laluan Semasa')}</label><input name="current" type="password" required minlength="8"></div><div class="field"><label>${tr('新密码','New Password','Kata Laluan Baharu')}</label><input name="next" type="password" required minlength="8"></div><div class="field"><label>${tr('确认新密码','Confirm New Password','Sahkan Kata Laluan Baharu')}</label><input name="confirm" type="password" required minlength="8"></div><button class="btn btn-primary">${tr('确认修改','Update Password','Kemas Kini Kata Laluan')}</button></form>`);
    const form=q('#v211PasswordForm');if(!form)return;
    form.onsubmit=async e=>{
      e.preventDefault();const f=new FormData(form),current=String(f.get('current')||''),next=String(f.get('next')||''),confirm=String(f.get('confirm')||'');
      if(next!==confirm)return window.toast?.(tr('两次新密码不一致','New passwords do not match','Kata laluan baharu tidak sepadan'),true);
      try{
        const userRes=await window.sb.auth.getUser();const email=userRes?.data?.user?.email;
        if(!email)throw new Error(tr('无法取得登录账号','Unable to retrieve login account','Tidak dapat mendapatkan akaun log masuk'));
        const verify=await window.sb.auth.signInWithPassword({email,password:current});if(verify.error)throw new Error(tr('当前密码不正确','Current password is incorrect','Kata laluan semasa tidak betul'));
        const up=await window.sb.auth.updateUser({password:next});if(up.error)throw up.error;
        q('#modal')?.classList.remove('show');window.toast?.(tr('密码修改成功','Password updated','Kata laluan dikemas kini'));
      }catch(err){window.toast?.(err?.message||String(err),true)}
    };
  }
  function compactHeader(){
    q('#pageTitle')?.parentElement?.classList.add('v211-hide-header-title');
    const status=q('#v51StatusBar');if(status)status.classList.add('v211-compact-status');
    const btn=q('#mobileMenuBtn');if(btn){btn.textContent='☰';btn.title=tr('收合选单','Toggle menu','Tukar menu')}
    const sound=q('#v51Sound');if(sound)sound.textContent=soundOn()?'🔊':'🔇';
    updateLanguageChecks();
  }
  document.addEventListener('click',e=>{
    const target=e.target;
    if(target.closest('#mobileMenuBtn')){e.preventDefault();e.stopImmediatePropagation();toggleSidebar();return}
    if(target.closest('#v51Globe')){e.preventDefault();e.stopImmediatePropagation();const m=q('#v51LanguageMenu');const show=m?.classList.contains('hidden');closeMenus();if(show)m?.classList.remove('hidden');updateLanguageChecks();return}
    const lb=target.closest('[data-v51-lang]');if(lb){e.preventDefault();e.stopImmediatePropagation();const value=lb.dataset.v51Lang;localStorage.setItem('wl_lang',value);const legacy=q('.lang-select');if(legacy){legacy.value=value;legacy.dispatchEvent(new Event('change',{bubbles:true}))}else location.reload();closeMenus();return}
    if(target.closest('#v51Sound')){e.preventDefault();e.stopImmediatePropagation();const m=q('#v51SoundMenu');const show=m?.classList.contains('hidden');closeMenus();if(show)m?.classList.remove('hidden');return}
    const sb=target.closest('[data-v51-sound]');if(sb){e.preventDefault();e.stopImmediatePropagation();setSound(sb.dataset.v51Sound==='on');closeMenus();return}
    if(target.closest('#v51ProfileBtn')){e.preventDefault();e.stopImmediatePropagation();const m=q('#v51ProfileMenu');const show=m?.classList.contains('hidden');closeMenus();if(show)m?.classList.remove('hidden');return}
    if(target.closest('#v51ChangePassword')){e.preventDefault();e.stopImmediatePropagation();closeMenus();openPassword();return}
    if(target.closest('#v51Logout')){e.preventDefault();e.stopImmediatePropagation();closeMenus();q('#staffLogout')?.click();return}
    if(!target.closest('.v51-tool-menu-wrap'))closeMenus();
  },true);
  window.addEventListener('resize',()=>{if(innerWidth>900){q('#adminSidebar')?.classList.remove('open');q('#sidebarOverlay')?.classList.remove('show');document.body.classList.remove('sidebar-open')}});
  const boot=()=>{compactHeader();setTimeout(compactHeader,300);setTimeout(compactHeader,1200)};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
  window.addEventListener('wl:data-loaded',boot);window.addEventListener('swk-language-applied',boot);
})();

/* ===== language-v22.js ===== */
/* WL Credit V22 — single language authority loaded last */
(function(){
  'use strict';
  const SUPPORTED=['zh','en','ms'];
  const legacy=localStorage.getItem('wl_lang');
  if(!localStorage.getItem('swk_lang') && SUPPORTED.includes(legacy)) localStorage.setItem('swk_lang',legacy);
  const getLang=()=>SUPPORTED.includes(localStorage.getItem('swk_lang'))?localStorage.getItem('swk_lang'):'zh';

  const D={
    statistics:['统计资讯','Statistics','Statistik'],
    dateHelp:['此日期只影响本区统计','This date range only affects these statistics','Julat tarikh ini hanya mempengaruhi statistik ini'],
    today:['今天','Today','Hari Ini'], yesterday:['昨天','Yesterday','Semalam'], thisWeek:['本周','This Week','Minggu Ini'], lastWeek:['上周','Last Week','Minggu Lepas'], thisMonth:['本月','This Month','Bulan Ini'], lastMonth:['上月','Last Month','Bulan Lepas'], search:['查询','Search','Cari'],
    overview:['统计资讯','Statistics','Statistik'], loanManagement:['贷款管理','Loan Management','Pengurusan Pinjaman'], finance:['财务','Finance','Kewangan'], companyManagement:['公司管理','Company Management','Pengurusan Syarikat'], reportsRecords:['报表与记录','Reports & Records','Laporan & Rekod'], systemManagement:['系统管理','System Management','Pengurusan Sistem'], settings:['设置','Settings','Tetapan'],
    customers:['客户','Customers','Pelanggan'], loanApplications:['贷款申请','Loan Applications','Permohonan Pinjaman'], loanReview:['贷款审核','Loan Review','Semakan Pinjaman'], pendingFinance:['待财务出款','Pending Disbursement','Menunggu Pengeluaran Kewangan'], loans:['贷款','Loans','Pinjaman'], paymentRequests:['付款申请','Payment Requests','Permohonan Bayaran'], paymentHistory:['付款历史','Payment History','Sejarah Bayaran'],
    pendingDisbursement:['待放款','Pending Disbursement','Menunggu Pengeluaran'], pendingReceipts:['待确认收款','Pending Receipts','Menunggu Pengesahan Kutipan'], companyBanks:['公司银行账户','Company Bank Accounts','Akaun Bank Syarikat'],
    collection:['收款','Collection','Kutipan'], disbursement:['出款','Disbursement','Pengeluaran'], review:['审核','Review','Semakan'], salary:['工资','Salary','Gaji'],
    customerCount:['客户数量','Customers','Pelanggan'], activeLoans:['进行中的贷款','Active Loans','Pinjaman Aktif'], newCustomers:['新增客户','New Customers','Pelanggan Baharu'], newLoans:['新增贷款','New Loans','Pinjaman Baharu'], netInOut:['出入款总计','Net In / Out','Jumlah Bersih Masuk / Keluar'],
    totalDisbursed:['共放款','Total Disbursed','Jumlah Dikeluarkan'], totalCollected:['共收款','Total Collected','Jumlah Dikutip'], interestCollected:['利息收入','Interest Collected','Faedah Dikutip'], overdueCollected:['逾期收入','Overdue Collected','Tertunggak Dikutip'], companyProfit:['公司盈亏','Company Profit / Loss','Untung / Rugi Syarikat'],
    staffReport:['客服业绩报告','Customer Service Performance Report','Laporan Prestasi Khidmat Pelanggan'], independentDate:['独立日期查询；不影响上方统计','Independent date range; does not affect statistics above','Julat tarikh berasingan; tidak menjejaskan statistik di atas'],
    customerService:['客服','Customer Service','Khidmat Pelanggan'], recoveryRate:['回收率','Recovery Rate','Kadar Kutipan'], profitLoss:['盈亏','Profit / Loss','Untung / Rugi'],
    excel:['下载 Excel','Download Excel','Muat Turun Excel'], csv:['下载 CSV','Download CSV','Muat Turun CSV'],
    chinese:['简体中文','简体中文','简体中文'], english:['English','English','English'], malay:['Bahasa Melayu','Bahasa Melayu','Bahasa Melayu'],
    soundOn:['有声音','Sound On','Bunyi Dihidupkan'], soundOff:['无声音','Muted','Senyap'], changePassword:['修改密码','Change Password','Tukar Kata Laluan'], logout:['退出登录','Logout','Log Keluar'],
    username:['账号','Username','Nama pengguna'], name:['姓名','Name','Nama'], phone:['电话','Phone','Telefon'], ic:['IC／证件号码','IC / ID Number','IC / Nombor ID'], activeLoanCount:['进行中贷款','Active Loans','Pinjaman Aktif'], status:['状态','Status','Status'], actions:['操作','Actions','Tindakan'], enabled:['启用','Active','Aktif'], disabled:['停用','Inactive','Tidak Aktif'], view:['查看','View','Lihat'], edit:['编辑','Edit','Edit'], changePwd:['修改密码','Change Password','Tukar Kata Laluan']
  };
  const idx={zh:0,en:1,ms:2};
  const reverse=new Map();
  Object.entries(D).forEach(([k,v])=>v.forEach(x=>reverse.set(String(x).trim(),k)));
  function txt(k){return D[k]?.[idx[getLang()]]||k}
  function translateNode(node){
    if(!node || node.nodeType!==3) return;
    const raw=node.nodeValue, t=raw.trim(); if(!t) return;
    const key=reverse.get(t); if(!key) return;
    node.nodeValue=raw.replace(t,txt(key));
  }
  function apply(root=document){
    const lang=getLang();
    if(window.SWK_LANG){window.SWK_LANG.current=lang;localStorage.setItem('swk_lang',lang)}
    document.documentElement.lang=lang==='zh'?'zh-Hans':lang;
    try{window.SWK_LANG?.apply?.(root)}catch(e){console.warn('V22 base language apply',e)}
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(translateNode);
    document.querySelectorAll('[data-v51-lang]').forEach(btn=>{const active=btn.dataset.v51Lang===lang;btn.classList.toggle('active',active);const c=btn.querySelector('.v51-lang-check');if(c)c.textContent=active?'✓':''});
    document.querySelectorAll('.lang-select').forEach(s=>s.value=lang);
  }
  let applying=false;
  function setLang(lang){
    if(!SUPPORTED.includes(lang))lang='zh';
    localStorage.setItem('swk_lang',lang);localStorage.setItem('wl_lang',lang);
    if(window.SWK_LANG)window.SWK_LANG.current=lang;
    applying=true;apply();setTimeout(()=>{apply();applying=false;window.dispatchEvent(new CustomEvent('swk-language-applied',{detail:{language:lang}}))},30);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-v51-lang]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();setLang(b.dataset.v51Lang);document.querySelector('#v51LanguageMenu')?.classList.add('hidden');
  },true);
  document.addEventListener('change',e=>{if(e.target.matches?.('.lang-select'))setLang(e.target.value)},true);
  const mo=new MutationObserver(ms=>{if(applying)return;let needed=false;for(const m of ms){if(m.type==='childList'||m.type==='characterData'){needed=true;break}}if(needed){clearTimeout(window.__v22lang);window.__v22lang=setTimeout(()=>{applying=true;apply();applying=false},20)}});
  const boot=()=>{apply();/* V23.1: disabled continuous DOM observer to prevent sidebar/search flicker. */setTimeout(apply,300);setTimeout(apply,1200)};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
  window.V22_LANGUAGE={set:setLang,apply,current:getLang};
})();

/* ===== v23-enterprise.js ===== */
/* WL Credit V23 Enterprise final integration
 * - Canonical customer username: WL001...
 * - Clickable active-loan count
 * - Manual overdue charge setting with customer portal live display
 * - Final trilingual labels for customer/loan management
 */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const lang=()=>window.SWK_LANG?.current||localStorage.getItem('swk_lang')||'zh';
  const T=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
  const E=v=>window.esc?window.esc(v):String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const M=v=>window.money?window.money(Number(v||0)):`MYR ${Number(v||0).toFixed(2)}`;
  const D=v=>window.date?window.date(v):(v?new Date(v).toLocaleDateString():'-');
  const modal=html=>window.modal?.(html);
  const toast=(m,e=false)=>window.toast?.(m,e);

  function canonicalUsername(c){
    const raw=String(c?.username||c?.customer_code||'').trim().toUpperCase();
    if(/^WL\d+$/.test(raw)) return `WL${String(Number(raw.match(/\d+/)?.[0]||0)).padStart(3,'0')}`;
    const legacy=raw.match(/(?:SWKC|L|C)?0*(\d+)$/);
    return legacy?`WL${String(Number(legacy[1])).padStart(3,'0')}`:'-';
  }
  window.v23CustomerUsername=canonicalUsername;

  function loanCode(l){
    const raw=String(l?.loan_id||'').toUpperCase();
    const n=raw.match(/(\d+)$/)?.[1];
    return n?`L${String(Number(n)).padStart(5,'0')}`:(raw||'-');
  }
  function activeLoansFor(customerId){
    return (window.state?.loans||[]).filter(l=>String(l.customer_id)===String(customerId)&&String(l.status).toLowerCase()==='active');
  }

  window.v23OpenActiveLoans=function(customerId){
    const c=(window.state?.customers||[]).find(x=>String(x.id)===String(customerId));
    const loans=activeLoansFor(customerId);
    modal(`<div class="section-head"><div><h2>${T('进行中的贷款','Active Loans','Pinjaman Aktif')}</h2><p class="muted">${E(canonicalUsername(c))} · ${E(c?.full_name||'-')}</p></div><button class="btn btn-secondary" onclick="closeModal()">${T('关闭','Close','Tutup')}</button></div>
      <div class="v23-active-loan-list">${loans.map(l=>`<article class="v23-active-loan-card">
        <div class="v23-loan-card-head"><strong>${E(loanCode(l))}</strong><span class="badge ${Number(l.overdue_charge||0)>0?'danger':'ok'}">${Number(l.overdue_charge||0)>0?T('逾期','Overdue','Tertunggak'):T('进行中','Active','Aktif')}</span></div>
        <div class="v23-loan-grid"><span>${T('本金','Principal','Prinsipal')}<b>${M(l.principal)}</b></span><span>${T('利息','Interest','Faedah')}<b>${M(l.interest)}</b></span><span>${T('逾期应收','Overdue Due','Caj Tertunggak')}<b>${M(l.overdue_charge)}</b></span><span>${T('到期日','Due Date','Tarikh Matang')}<b>${D(l.due_date)}</b></span></div>
        <div class="actions"><button class="btn btn-primary" onclick="closeModal();openLoan('${E(l.id)}')">${T('查看贷款','View Loan','Lihat Pinjaman')}</button><button class="btn btn-danger" data-v23-overdue="${E(l.id)}">${T('设置逾期','Set Overdue','Tetapkan Tertunggak')}</button></div>
      </article>`).join('')||`<div class="empty-state">${T('没有进行中的贷款','No active loans','Tiada pinjaman aktif')}</div>`}</div>`);
  };

  window.v23OpenOverdue=function(loanId){
    const l=(window.state?.loans||[]).find(x=>String(x.id)===String(loanId));
    if(!l)return toast(T('找不到贷款','Loan not found','Pinjaman tidak ditemui'),true);
    const c=(window.state?.customers||[]).find(x=>String(x.id)===String(l.customer_id));
    modal(`<div class="section-head"><div><h2>${T('设置逾期金额','Set Overdue Charge','Tetapkan Caj Tertunggak')}</h2><p class="muted">${E(loanCode(l))} · ${E(canonicalUsername(c))} · ${E(c?.full_name||'-')}</p></div><button class="btn btn-secondary" onclick="closeModal()">${T('关闭','Close','Tutup')}</button></div>
      <form id="v23OverdueForm"><div class="card overdue-charge"><div class="kv"><span>${T('目前逾期应收','Current Overdue Due','Caj Tertunggak Semasa')}</span><strong>${M(l.overdue_charge)}</strong></div></div>
      <div class="field"><label>${T('新的逾期金额（MYR）','New overdue amount (MYR)','Jumlah tertunggak baharu (MYR)')}</label><input name="amount" type="number" min="0" step="0.01" value="${Number(l.overdue_charge||0).toFixed(2)}" required></div>
      <div class="field"><label>${T('逾期原因／备注','Overdue reason / note','Sebab / catatan tertunggak')}</label><textarea name="note" rows="3">${E(l.overdue_note||'')}</textarea></div>
      <p class="muted">${T('保存后，客户前台会立即显示需要额外偿还的逾期金额。输入 0 可清除逾期。','After saving, the customer portal will immediately show the extra overdue amount. Enter 0 to clear it.','Selepas disimpan, portal pelanggan akan memaparkan caj tertunggak. Masukkan 0 untuk mengosongkannya.')}</p>
      <div class="actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">${T('取消','Cancel','Batal')}</button><button class="btn btn-danger">${T('保存逾期','Save Overdue','Simpan Tertunggak')}</button></div></form>`);
    const form=$('#v23OverdueForm');
    form.onsubmit=async e=>{
      e.preventDefault(); const btn=e.submitter; btn.disabled=true;
      const f=new FormData(form),amount=Number(f.get('amount')||0),note=String(f.get('note')||'').trim()||null;
      try{
        const r=await window.sb.rpc('wl_set_loan_overdue_charge',{p_loan_id:loanId,p_amount:amount,p_note:note});
        if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Failed');
        l.overdue_charge=amount;l.overdue_note=note;l.updated_at=new Date().toISOString();
        window.closeModal?.(); toast(amount>0?T('逾期金额已设置，客户前台会立即更新','Overdue charge saved; customer portal will update immediately','Caj tertunggak disimpan; portal pelanggan akan dikemas kini'):T('逾期金额已清除','Overdue charge cleared','Caj tertunggak dikosongkan'));
        await window.loadAll?.();
      }catch(err){btn.disabled=false;toast(err.message||String(err),true)}
    };
  };

  function renderCustomersV23(){
    const body=$('#customerRows');if(!body||!window.state)return;
    const q=String($('#customerSearch')?.value||'').trim().toLowerCase();
    let rows=(state.customers||[]).filter(c=>[canonicalUsername(c),c.full_name,c.phone,c.id_number].join(' ').toLowerCase().includes(q));
    if(typeof window.isSuperAdmin==='function'&&window.isSuperAdmin()&&state.customerOwnerFilter&&state.customerOwnerFilter!=='all'){
      rows=rows.filter(c=>state.customerOwnerFilter==='unassigned'?!c.owner_staff_id:String(c.owner_staff_id)===String(state.customerOwnerFilter));
    }
    body.innerHTML=rows.map(c=>{
      const n=activeLoansFor(c.id).length,enabled=c.is_active!==false;
      const transferAllowed=typeof window.canTransferCustomer==='function' ? window.canTransferCustomer() : ['finance','super_admin','superadmin'].includes(String(window.state?.staff?.role||'').toLowerCase().replace(/[\s-]+/g,'_'));
      const transferButton=transferAllowed?`<button class="btn btn-secondary" onclick="v17TransferCustomer('${E(c.id)}')">${T('转移客服','Transfer Staff','Pindah Staf')}</button>`:'';
      return `<tr><td><button class="v23-link-button mono" onclick="openCustomerProfile('${E(c.id)}')">${E(canonicalUsername(c))}</button></td><td><button class="v23-link-button" onclick="openCustomerProfile('${E(c.id)}')">${E(c.full_name||'-')}</button></td><td>${E(c.phone||'-')}</td><td>${E(c.id_number||'-')}</td><td><button class="v23-loan-count ${n?'has-loans':''}" ${n?`data-v23-active-loans="${E(c.id)}"`:'disabled'}>${n}</button></td><td><span class="badge ${enabled?'ok':'danger'}">${enabled?T('启用','Enabled','Aktif'):T('停用','Disabled','Dinyahaktifkan')}</span></td><td class="actions"><button class="btn btn-secondary" onclick="openCustomerProfile('${E(c.id)}')">${T('查看','View','Lihat')}</button><button class="btn btn-secondary" onclick="openCustomer('${E(c.id)}')">${T('编辑','Edit','Sunting')}</button><button class="btn btn-secondary" onclick="changePin('${E(c.id)}')">${T('修改密码','Change Password','Tukar Kata Laluan')}</button>${transferButton}</td></tr>`;
    }).join('')||`<tr><td colspan="7" class="muted">${T('没有记录','No records','Tiada rekod')}</td></tr>`;
  }

  function renderLoansV23(){
    const body=$('#loanRows');if(!body||!window.state)return;
    const head=body.closest('table')?.querySelector('thead tr');
    if(head&&!head.querySelector('[data-v23-overdue-col]')){
      const th=document.createElement('th');th.dataset.v23OverdueCol='1';th.textContent=T('逾期金额','Overdue','Tertunggak');
      head.insertBefore(th,head.children[8]||null);
    }
    body.innerHTML=(state.loans||[]).map(l=>{const c=(state.customers||[]).find(x=>String(x.id)===String(l.customer_id));const bank=c?.receiving_bank?.bank_name||'-';const contacts=[c?.telegram_contact?.label,c?.whatsapp_contact?.label].filter(Boolean).join(' + ')||'-';const od=Number(l.overdue_charge||0);return `<tr><td class="mono">${E(loanCode(l))}</td><td><button class="v23-link-button" onclick="openCustomerProfile('${E(l.customer_id)}')">${E(canonicalUsername(c))} · ${E(c?.full_name||l.customers?.full_name||'-')}</button></td><td>${M(l.principal)}</td><td>${M(l.interest)}</td><td>${M(l.settlement_amount)}</td><td>${E(bank)}</td><td>${E(contacts)}</td><td>${D(l.due_date)}</td><td><button class="v23-overdue-amount ${od>0?'has-overdue':''}" data-v23-overdue="${E(l.id)}">${M(od)}</button></td><td><span class="badge ${l.status==='paid'?'ok':od>0?'danger':'warn'}">${l.status==='paid'?T('已完成','Completed','Selesai'):od>0?T('逾期','Overdue','Tertunggak'):T('进行中','Active','Aktif')}</span></td><td class="actions"><button class="btn btn-secondary" onclick="openLoan('${E(l.id)}')">${T('编辑','Edit','Sunting')}</button><button class="btn btn-danger" data-v23-overdue="${E(l.id)}">${T('设置逾期','Set Overdue','Tetapkan Tertunggak')}</button></td></tr>`}).join('');
  }

  function applyLabels(){
    const labels={
      '#customers .section-head input':T('搜索账号／姓名／电话／IC','Search username / name / phone / IC','Cari akaun / nama / telefon / IC'),
      '[data-section="dashboard"]':T('统计资讯','Statistics','Statistik'),
      '[data-section="customers"]':T('客户','Customers','Pelanggan'),
      '[data-section="loans"]':T('贷款','Loans','Pinjaman')
    };
    Object.entries(labels).forEach(([sel,text])=>{const el=$(sel);if(!el)return;if(el.tagName==='INPUT')el.placeholder=text;else el.textContent=text});
  }

  const oldRenderCustomers=window.renderCustomers;
  window.renderCustomers=function(){try{oldRenderCustomers?.apply(this,arguments)}catch(_){}renderCustomersV23()};
  const oldRenderLoans=window.renderLoans;
  window.renderLoans=function(){try{oldRenderLoans?.apply(this,arguments)}catch(_){}renderLoansV23()};

  let searchTimer=null;
  document.addEventListener('input',e=>{if(e.target?.id==='customerSearch'){clearTimeout(searchTimer);searchTimer=setTimeout(renderCustomersV23,120)}});
  document.addEventListener('click',e=>{
    const loanBtn=e.target.closest?.('[data-v23-active-loans]');
    if(loanBtn){e.preventDefault();e.stopPropagation();window.v23OpenActiveLoans(loanBtn.dataset.v23ActiveLoans);return}
    const overdueBtn=e.target.closest?.('[data-v23-overdue]');
    if(overdueBtn){e.preventDefault();e.stopPropagation();window.v23OpenOverdue(overdueBtn.dataset.v23Overdue);return}
  });
  document.addEventListener('change',e=>{if(e.target?.matches('.lang-select'))setTimeout(()=>{renderCustomersV23();renderLoansV23();applyLabels()},120)});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{renderCustomersV23();renderLoansV23();applyLabels()},1000));

  // Add the same transfer action inside the customer detail modal. The list renderer above
  // is the primary entry point; this secondary entry keeps the action available after opening a customer.
  const previousOpenCustomerProfile=window.openCustomerProfile;
  if(typeof previousOpenCustomerProfile==='function'){
    window.openCustomerProfile=function(customerId){
      const result=previousOpenCustomerProfile.apply(this,arguments);
      setTimeout(()=>{
        const allowed=typeof window.canTransferCustomer==='function' ? window.canTransferCustomer() : ['finance','super_admin','superadmin'].includes(String(window.state?.staff?.role||'').toLowerCase().replace(/[\s-]+/g,'_'));
        if(!allowed||typeof window.v17TransferCustomer!=='function')return;
        const host=document.querySelector('#modalBody');
        if(!host||host.querySelector('[data-v24-transfer-customer]'))return;
        const bar=document.createElement('div');
        bar.className='actions';
        bar.style.marginTop='16px';
        bar.dataset.v24TransferCustomer='1';
        bar.innerHTML=`<button class="btn btn-secondary" type="button">${T('转移客服','Transfer Staff','Pindah Staf')}</button>`;
        bar.querySelector('button').onclick=()=>window.v17TransferCustomer(customerId);
        host.appendChild(bar);
      },80);
      return result;
    };
  }
})();

/* ===== v23.3-workflow-rejections.js ===== */
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
function patchFinanceRows(){ /* V25.8.4: reject belongs only inside Process Disbursement detail */ }
function patchPendingFinanceRows(){ /* V25.8.4: reject belongs only inside Process Disbursement detail */ }
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

/* ===== v23.5-stability.js ===== */
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

/* ===== v23.6-core-fixes.js ===== */
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
  html+=table(T('待放款','Pending Disbursement','Menunggu Pengeluaran'),[T('申请编号','Application','Permohonan'),T('客户','Customer','Pelanggan'),T('金额','Amount','Jumlah'),T('操作','Action','Tindakan')],disb.map(a=>`<tr><td>${esc(a.application_code||a.loan_id||'-')}</td><td>${esc(a.full_name||a.customers?.full_name||'-')}</td><td>${money(a.approved_principal||a.requested_amount)}</td><td><button class="btn btn-secondary" data-v258-today-disburse="${esc(a.id)}">${T('处理','Process','Proses')}</button></td></tr>`).join(''), '');
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

/* ===== v24-repayment-cycle.js ===== */
/* WL Credit V24 - repayment cycle, automatic next due date and overdue management */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s);
 const esc=s=>window.esc?window.esc(s):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const T=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
 const toast=(m,e)=>window.toast?.(m,e);
 const money=n=>window.money?window.money(n):`MYR ${Number(n||0).toFixed(2)}`;
 let currentLoanId=null,currentApplicationId=null,currentSubmissionId=null;
 const drafts=new Map();
 function state(){return window.state||{} }
 function localInput(iso){if(!iso)return '';const d=new Date(iso);if(Number.isNaN(d.getTime()))return String(iso).slice(0,16);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
 function dueOf(l){return l?.collection_due_at||l?.due_at||l?.expected_payment_at||(l?.due_date?`${String(l.due_date).slice(0,10)}T23:59:59`:null)}
 function addMonthsSafe(date,count){const d=new Date(date);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+count);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d}
 function calculateNext(due,type,value){const d=new Date(due);if(Number.isNaN(d.getTime()))return null;return type==='monthly'?addMonthsSafe(d,Number(value||1)):new Date(d.getTime()+Number(value||1)*86400000)}
 function cycleFields(values={}){const type=values.type||'monthly',value=Number(values.value||1),due=localInput(values.due||new Date(Date.now()+30*86400000));return `<div class="v24-cycle-box"><h3>${T('还款周期','Repayment Cycle','Kitaran Bayaran')}</h3><div class="grid2"><div class="field"><label>${T('还款方式','Cycle Type','Jenis Kitaran')}</label><select name="v24_cycle_type"><option value="monthly" ${type==='monthly'?'selected':''}>${T('月账','Monthly','Bulanan')}</option><option value="daily" ${type==='daily'?'selected':''}>${T('天账','Day Cycle','Kitaran Hari')}</option></select></div><div class="field"><label data-v24-cycle-label>${type==='monthly'?T('每几个月','Every N Months','Setiap N Bulan'):T('每几天','Every N Days','Setiap N Hari')}</label><input name="v24_cycle_value" type="number" min="1" max="3650" value="${value}" required></div><div class="field"><label>${T('首次／目前到账时间','First / Current Due Time','Masa Matang Pertama / Semasa')}</label><input name="v24_due_at" type="datetime-local" value="${due}" required></div></div><p class="muted">${T('客服确认入账后，系统会从目前到账时间自动计算下一期。','After staff posts a payment, the next due date is calculated from the current due date.','Selepas staf merekod bayaran, tarikh seterusnya dikira daripada tarikh semasa.')}</p></div>`}
 function bindCycleBox(form){if(!form||form.dataset.v24Bound)return;form.dataset.v24Bound='1';const type=form.elements.v24_cycle_type,label=form.querySelector('[data-v24-cycle-label]');type?.addEventListener('change',()=>{if(label)label.textContent=type.value==='monthly'?T('每几个月','Every N Months','Setiap N Bulan'):T('每几天','Every N Days','Setiap N Hari')})}
 async function saveCycle(loanId,form,reason){if(!loanId||!form)return;const type=form.elements.v24_cycle_type?.value,value=Number(form.elements.v24_cycle_value?.value||1),raw=form.elements.v24_due_at?.value;if(!type||!raw)return;const r=await window.sb.rpc('wl_set_loan_repayment_cycle',{p_loan_id:loanId,p_cycle_type:type,p_cycle_value:value,p_due_at:new Date(raw).toISOString(),p_reason:reason||'Repayment schedule configured'});if(r.error||r.data?.ok===false)toast(r.error?.message||r.data?.error||'Unable to save repayment cycle',true)}
 function latestLoan(customerId){return [...(state().loans||[])].filter(x=>String(x.customer_id)===String(customerId)).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0]}

 // Track IDs before existing handlers open their modals.
 document.addEventListener('click',e=>{
   const f=e.target.closest?.('[data-v36-submit-finance]');if(f)currentApplicationId=f.dataset.v36SubmitFinance;
   const a=e.target.closest?.('[data-v372-allocate]');if(a)currentSubmissionId=a.dataset.v372Allocate;
 },true);
 const oldOpenLoan=window.openLoan;
 if(oldOpenLoan)window.openLoan=function(id,customerId){currentLoanId=id||null;const r=oldOpenLoan.apply(this,arguments);setTimeout(()=>injectForms(),0);return r};
 const oldApprove=window.approveApplication;
 if(oldApprove)window.approveApplication=function(id){currentApplicationId=id;const r=oldApprove.apply(this,arguments);setTimeout(()=>injectForms(),0);return r};

 function injectForm(form,values){if(!form||form.querySelector('.v24-cycle-box'))return;const notes=form.querySelector('.field textarea')?.closest('.field')||form.querySelector('button')?.parentElement;const box=document.createElement('div');box.innerHTML=cycleFields(values);const node=box.firstElementChild;(notes||form.lastElementChild)?.before(node);bindCycleBox(form)}
 function injectForms(){
   const loanForm=$('#loanForm');if(loanForm&&!loanForm.querySelector('.v24-cycle-box')){const l=(state().loans||[]).find(x=>String(x.id)===String(currentLoanId));injectForm(loanForm,{type:l?.repayment_cycle_type,value:l?.repayment_cycle_value,due:dueOf(l)});loanForm.addEventListener('submit',()=>setTimeout(async()=>{await window.loadAll?.();const loan=currentLoanId?(state().loans||[]).find(x=>String(x.id)===String(currentLoanId)):latestLoan(loanForm.elements.customer?.value);await saveCycle(loan?.id,loanForm,currentLoanId?'Loan schedule edited':'Loan created')},900),{once:true})}
   const existing=$('#v415ExistingLoanForm');if(existing&&!existing.querySelector('.v24-cycle-box')){injectForm(existing,{type:'monthly',value:1,due:existing.elements.due?.value?`${existing.elements.due.value}T23:59`:null});existing.addEventListener('submit',()=>{drafts.set('existing',{type:existing.elements.v24_cycle_type.value,value:Number(existing.elements.v24_cycle_value.value),due:new Date(existing.elements.v24_due_at.value).toISOString()})},{once:true})}
   const finance=$('#v36SubmitFinanceForm');if(finance&&!finance.querySelector('.v24-cycle-box')){const app=(state().applications||[]).find(x=>String(x.id)===String(currentApplicationId));injectForm(finance,{type:app?.repayment_cycle_type||'monthly',value:app?.repayment_cycle_value||1,due:app?.first_due_at||(finance.elements.due?.value?`${finance.elements.due.value}T23:59`:null)});finance.addEventListener('submit',async()=>{const payload={repayment_cycle_type:finance.elements.v24_cycle_type.value,repayment_cycle_value:Number(finance.elements.v24_cycle_value.value),first_due_at:new Date(finance.elements.v24_due_at.value).toISOString()};if(currentApplicationId)await window.sb.from('loan_applications').update(payload).eq('id',currentApplicationId)},{once:true})}
   const approval=$('#approveApplicationForm');if(approval&&!approval.querySelector('.v24-cycle-box')){injectForm(approval,{type:'monthly',value:1,due:approval.elements.due?.value?`${approval.elements.due.value}T23:59`:null});approval.addEventListener('submit',()=>drafts.set('approval',{appId:currentApplicationId,type:approval.elements.v24_cycle_type.value,value:Number(approval.elements.v24_cycle_value.value),due:new Date(approval.elements.v24_due_at.value).toISOString()}),{once:true})}
   const alloc=$('#v372AllocationForm');if(alloc&&!alloc.dataset.v24Auto){alloc.dataset.v24Auto='1';const sub=(state().submissions||[]).find(x=>String(x.id)===String(currentSubmissionId));const loan=(state().loans||[]).find(x=>String(x.id)===String(sub?.loan_id));if(loan&&alloc.elements.next_due){const next=calculateNext(dueOf(loan),loan.repayment_cycle_type||'monthly',loan.repayment_cycle_value||1);if(next)alloc.elements.next_due.value=localInput(next);alloc.elements.next_due.readOnly=true;const p=document.createElement('p');p.className='muted v24-auto-next';p.textContent=T(`系统自动计算：${loan.repayment_cycle_type==='daily'?`每 ${loan.repayment_cycle_value||1} 天`:`每 ${loan.repayment_cycle_value||1} 个月`}`,`Automatically calculated: every ${loan.repayment_cycle_value||1} ${loan.repayment_cycle_type==='daily'?'days':'months'}`,`Dikira automatik: setiap ${loan.repayment_cycle_value||1} ${loan.repayment_cycle_type==='daily'?'hari':'bulan'}`);alloc.elements.next_due.closest('.field')?.appendChild(p)}}
 }
 const observer=new MutationObserver(()=>injectForms());observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',injectForms);setInterval(injectForms,1200);

 // Wrap RPC to persist repayment schedules after old account/loan creation procedures finish.
 function wrapRpc(){if(!window.sb?.rpc||window.sb.rpc.__v24)return;const original=window.sb.rpc.bind(window.sb);const wrapped=async function(fn,args,opts){const result=await original(fn,args,opts);try{
   if(!result.error&&result.data?.ok!==false&&fn==='staff_approve_loan_application'){
     await window.loadAll?.();const app=(state().applications||[]).find(x=>String(x.id)===String(args?.p_application_id));const draft=drafts.get('approval');const loanId=result.data?.loan_uuid||result.data?.loan_db_id||result.data?.loan_id_uuid;let loan=loanId?(state().loans||[]).find(x=>String(x.id)===String(loanId)):latestLoan(result.data?.customer_id);const type=app?.repayment_cycle_type||draft?.type||'monthly',value=app?.repayment_cycle_value||draft?.value||1,due=app?.first_due_at||draft?.due||(args?.p_due_date?`${args.p_due_date}T23:59:59+08:00`:null);if(loan&&due)await original('wl_set_loan_repayment_cycle',{p_loan_id:loan.id,p_cycle_type:type,p_cycle_value:Number(value),p_due_at:new Date(due).toISOString(),p_reason:'First loan schedule'});
   }
   if(!result.error&&result.data?.ok!==false&&fn==='wl_submit_existing_customer_loan'){
     const d=drafts.get('existing');if(d){const appId=result.data?.application_id||result.data?.id;if(appId)await window.sb.from('loan_applications').update({repayment_cycle_type:d.type,repayment_cycle_value:d.value,first_due_at:d.due}).eq('id',appId)}
   }
  }catch(err){console.warn('[V24 schedule persistence]',err)}return result};wrapped.__v24=true;window.sb.rpc=wrapped}
 const rpcTimer=setInterval(()=>{if(window.sb?.rpc){clearInterval(rpcTimer);wrapRpc()}},200);

 // Loan schedule / overdue management actions.
 async function changeDue(loanId){const l=(state().loans||[]).find(x=>String(x.id)===String(loanId));if(!l)return;window.modal?.(`<h2>${T('修改到账时间','Change Due Time','Ubah Masa Matang')}</h2><form id="v24ChangeDue"><div class="field"><label>${T('目前到账时间','Current Due Time','Masa Matang Semasa')}</label><input value="${esc(localInput(dueOf(l)))}" disabled></div><div class="field"><label>${T('新的到账时间','New Due Time','Masa Matang Baharu')}</label><input name="due" type="datetime-local" required></div><div class="field"><label>${T('修改原因','Reason','Sebab')}</label><textarea name="reason" required></textarea></div><button class="btn btn-primary">${T('确认修改','Confirm Change','Sahkan')}</button></form>`);const f=$('#v24ChangeDue');f.onsubmit=async e=>{e.preventDefault();const n=new Date(f.elements.due.value);if(n<=new Date())return toast(T('新日期不能早于当前时间','New date cannot be in the past','Tarikh baharu tidak boleh lepas'),true);const r=await window.sb.rpc('wl_change_loan_due_at',{p_loan_id:loanId,p_new_due_at:n.toISOString(),p_reason:f.elements.reason.value});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error,true);window.closeModal?.();toast(T('到账时间已修改','Due time updated','Masa matang dikemas kini'));await window.loadAll?.()}}
 async function overdueHistory(loanId){const r=await window.sb.from('loan_overdue_events').select('*').eq('loan_id',loanId).order('created_at',{ascending:false});if(r.error)return toast(r.error.message,true);window.modal?.(`<h2>${T('逾期历史','Overdue History','Sejarah Tertunggak')}</h2><div class="table-wrap"><table class="table"><thead><tr><th>${T('时间','Time','Masa')}</th><th>${T('金额','Amount','Jumlah')}</th><th>${T('状态','Status','Status')}</th><th>${T('来源','Source','Sumber')}</th><th>${T('操作','Action','Tindakan')}</th></tr></thead><tbody>${(r.data||[]).map(x=>`<tr><td>${esc(new Date(x.created_at).toLocaleString())}</td><td>${money(x.amount)}</td><td>${esc(x.status)}</td><td>${esc(x.source)}</td><td>${x.status==='active'?`<button class="btn btn-danger" data-v24-cancel-overdue="${esc(x.id)}">${T('取消逾期','Cancel','Batal')}</button>`:''}</td></tr>`).join('')||`<tr><td colspan="5">-</td></tr>`}</tbody></table></div>`)}
 async function cancelOverdue(id){window.modal?.(`<h2>${T('取消逾期','Cancel Overdue Fee','Batalkan Caj Tertunggak')}</h2><form id="v24CancelOverdue"><div class="field"><label>${T('取消原因','Cancellation Reason','Sebab Pembatalan')}</label><textarea name="reason" required></textarea></div><button class="btn btn-danger">${T('确认取消','Confirm Cancellation','Sahkan Pembatalan')}</button></form>`);const f=$('#v24CancelOverdue');f.onsubmit=async e=>{e.preventDefault();const r=await window.sb.rpc('wl_cancel_overdue_event',{p_event_id:id,p_reason:f.elements.reason.value});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error,true);window.closeModal?.();toast(T('逾期已取消','Overdue fee cancelled','Caj tertunggak dibatalkan'));await window.loadAll?.()}}
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-v24-change-due]');if(b){e.preventDefault();changeDue(b.dataset.v24ChangeDue)}const h=e.target.closest?.('[data-v24-overdue-history]');if(h){e.preventDefault();overdueHistory(h.dataset.v24OverdueHistory)}const c=e.target.closest?.('[data-v24-cancel-overdue]');if(c){e.preventDefault();cancelOverdue(c.dataset.v24CancelOverdue)}},true);
 function addLoanActions(){document.querySelectorAll('#loanRows tr').forEach(tr=>{if(tr.dataset.v24Actions)return;const code=tr.cells?.[0]?.textContent?.trim();const l=(state().loans||[]).find(x=>String(window.canonicalLoanId?window.canonicalLoanId(x.loan_id):x.loan_id)===code);const td=tr.cells?.[tr.cells.length-1];if(!l||!td)return;tr.dataset.v24Actions='1';td.insertAdjacentHTML('beforeend',` <button class="btn btn-secondary" data-v24-change-due="${esc(l.id)}">${T('修改到账时间','Change Due','Ubah Tarikh')}</button> <button class="btn btn-secondary" data-v24-overdue-history="${esc(l.id)}">${T('逾期历史','Overdue History','Sejarah Tertunggak')}</button>`)});}
 setInterval(addLoanActions,1500);
})();

/* ===== v24.6-existing-customer-realtime-flow.js ===== */
/* WL Credit V24.6 — immediate finance queue + existing-customer loan flow */
(()=>{
  'use strict';
  const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
  const esc=v=>window.esc?window.esc(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const appState=()=>window.state||{};
  const role=()=>norm(appState().staff?.role).replaceAll('-','_').replaceAll(' ','_');
  const isFinance=()=>['finance','super_admin','superadmin'].includes(role());
  const isExisting=a=>norm(a?.application_type)==='existing_customer_new_loan'||!!a?.existing_customer_id||!!a?.customer_id&&norm(a?.application_source)==='existing_customer';
  const money=v=>`MYR ${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  let financeChannel=null;
  let pollTimer=null;
  let knownPending=new Set();
  let syncing=false;

  async function syncFinanceQueue({notify=false}={}){
    if(syncing||!isFinance()||!window.sb?.from)return;
    syncing=true;
    try{
      const r=await window.sb.from('loan_applications').select('*').order('submitted_to_finance_at',{ascending:false});
      if(r.error)throw r.error;
      const list=r.data||[];
      const pending=list.filter(a=>norm(a.status)==='pending_disbursement');
      const next=new Set(pending.map(a=>String(a.id)));
      const added=pending.filter(a=>!knownPending.has(String(a.id)));
      appState().applications=list;
      if(notify&&knownPending.size&&added.length){
        window.toast?.(L(`收到 ${added.length} 笔新的待放款申请`,`Received ${added.length} new disbursement request(s)`,`Menerima ${added.length} permohonan pengeluaran baharu`));
        try{window.playNotificationSound?.()}catch(_){ }
      }
      knownPending=next;
      window.renderFinanceApplications?.();
      window.renderPendingFinance?.();
      try{await window.refreshNotificationData?.()}catch(_){ }
      const badge=document.querySelector('#navPendingFinanceBadge');
      if(badge){badge.textContent=String(pending.length);badge.classList.toggle('hidden',pending.length===0)}
    }catch(e){console.warn('V24.6 finance queue sync failed',e)}
    finally{syncing=false}
  }

  function startFinanceLive(){
    if(!window.sb?.channel||!appState().staff)return;
    if(financeChannel){try{window.sb.removeChannel(financeChannel)}catch(_){ }financeChannel=null}
    try{
      financeChannel=window.sb.channel(`v246-finance-disbursement-${appState().staff.user_id}-${Date.now()}`)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'loan_applications'},()=>setTimeout(()=>syncFinanceQueue({notify:true}),80))
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'loan_applications'},()=>setTimeout(()=>syncFinanceQueue({notify:true}),80))
        .subscribe(status=>{if(status==='SUBSCRIBED')syncFinanceQueue()});
    }catch(e){console.warn('V24.6 realtime subscribe failed',e)}
    clearInterval(pollTimer);
    // Fast fallback in case Postgres Realtime publication or browser connectivity is delayed.
    pollTimer=setInterval(()=>syncFinanceQueue({notify:true}),60000);
  }

  function waitForAuth(){
    const t=setInterval(()=>{
      if(appState().staff&&window.sb){clearInterval(t);startFinanceLive()}
    },300);
    setTimeout(()=>clearInterval(t),30000);
  }

  // Existing customers already have WL login accounts. Never ask staff to create another account.
  function patchPendingFinance(){
    const rows=document.querySelector('#pendingFinanceRows');
    if(!rows)return;
    rows.querySelectorAll('[data-v36-final-approve]').forEach(btn=>{
      const id=btn.dataset.v36FinalApprove;
      const a=(appState().applications||[]).find(x=>String(x.id)===String(id));
      if(!isExisting(a))return;
      btn.removeAttribute('data-v36-final-approve');
      btn.dataset.v246ExistingDone=id;
      btn.textContent=L('查看出款资料','View disbursement details','Lihat butiran pengeluaran');
      btn.className='btn btn-secondary';
    });
    rows.querySelectorAll('tr').forEach(tr=>{
      const btn=tr.querySelector('[data-v246-existing-done]');
      if(!btn)return;
      const status=tr.querySelector('.badge');
      if(status)status.textContent=L('财务已出款，贷款已启用','Finance disbursed — loan active','Kewangan telah bayar — pinjaman aktif');
    });
  }

  const originalRender=window.renderPendingFinance;
  if(typeof originalRender==='function'){
    window.renderPendingFinance=function(){
      const out=originalRender.apply(this,arguments);
      queueMicrotask(patchPendingFinance);
      return out;
    };
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-v246-existing-done]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const id=b.dataset.v246ExistingDone;
    if(typeof window.v36OpenReview==='function')window.v36OpenReview(id);
  },true);

  // Override the existing-customer finance form: proof remains mandatory, and successful transfer activates the new loan without account creation.
  const previousOpen=window.openFinanceDisbursement;
  window.openFinanceDisbursement=async function(id){
    const a=(appState().applications||[]).find(x=>String(x.id)===String(id));
    if(!isExisting(a))return previousOpen?.(id);
    const banks=(await window.sb.from('company_bank_accounts').select('*').eq('is_enabled',true).eq('can_disburse',true)).data||[];
    if(!banks.length)return window.toast?.(L('没有可用的出款银行','No disbursement bank available','Tiada bank pengeluaran'),true);
    window.modal?.(`<h2>${L('现有客户新贷款出款','Existing Customer Loan Disbursement','Pengeluaran Pinjaman Pelanggan Sedia Ada')}</h2>
      <p><strong>${esc(a?.full_name||a?.customer_name||'-')}</strong> · ${money(a?.approved_principal||a?.requested_amount)}</p>
      <div class="card" style="margin-bottom:14px"><strong>${L('该客户已有登录账号；出款后直接启用新贷款，不会建立新账号。','This customer already has a login account. The new loan is activated after disbursement; no new account is created.','Pelanggan ini sudah mempunyai akaun log masuk. Pinjaman baharu diaktifkan selepas pengeluaran tanpa akaun baharu.')}</strong></div>
      <form id="v246ExistingFinanceForm">
       <div class="field"><label>${L('公司出款银行','Company Bank','Bank Syarikat')}</label><select name="bank" required>${banks.map(x=>`<option value="${esc(x.id)}">${esc(x.bank_name)} · ${esc(x.account_number)}</option>`).join('')}</select></div>
       <div class="grid2"><div class="field"><label>${L('出款时间','Transfer Time','Masa Pindahan')}</label><input name="at" type="datetime-local" required></div><div class="field"><label>${L('参考号','Reference','Rujukan')}</label><input name="ref"></div></div>
       <div class="field"><label>${L('出款截图','Disbursement Screenshot','Tangkapan Skrin Pengeluaran')}</label><input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required></div>
       <div class="field"><label>${L('备注','Notes','Catatan')}</label><textarea name="note"></textarea></div>
       <button class="btn btn-primary">${L('确认已出款并启用新贷款','Confirm Disbursement & Activate New Loan','Sahkan Pengeluaran & Aktifkan Pinjaman Baharu')}</button>
      </form>`);
    const f=document.querySelector('#v246ExistingFinanceForm');
    f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
    f.onsubmit=async ev=>{
      ev.preventDefault();const btn=ev.submitter||f.querySelector('button');btn.disabled=true;
      try{
        const d=new FormData(f),proof=d.get('proof');
        if(!(proof instanceof File)||!proof.size)throw new Error(L('请上传出款截图','Please upload the disbursement screenshot','Sila muat naik tangkapan skrin pengeluaran'));
        const safe=String(proof.name||'proof').replace(/[^a-zA-Z0-9._-]+/g,'-');
        const proofPath=`${id}/${Date.now()}-${safe}`;
        const up=await window.sb.storage.from('disbursement-proofs').upload(proofPath,proof,{cacheControl:'3600',upsert:false,contentType:proof.type||undefined});
        if(up.error)throw up.error;
        const at=new Date(d.get('at')).toISOString();
        const r=await window.sb.rpc('wl_finance_disburse_existing_customer_loan',{p_application_id:id,p_bank_account_id:d.get('bank'),p_reference:d.get('ref')||null,p_disbursed_at:at,p_note:d.get('note')||null});
        if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Disbursement failed');
        // Preserve proof and make the application clearly identifiable as an existing-customer loan.
        const u=await window.sb.from('loan_applications').update({
          application_type:'existing_customer_new_loan',
          finance_proof_path:proofPath,
          finance_proof_name:proof.name||safe,
          finance_disbursed_at:at,
          finance_reference:d.get('ref')||null,
          finance_note:d.get('note')||null,
          status:'finance_disbursed'
        }).eq('id',id);
        if(u.error)console.warn('V24.6 proof metadata update failed',u.error);
        window.closeModal?.();
        window.toast?.(L('已出款，新贷款已启用；不会建立新账号','Disbursed. The new loan is active; no new account was created.','Telah dibayar. Pinjaman baharu aktif; tiada akaun baharu dicipta.'));
        await window.loadAll?.();await syncFinanceQueue();
      }catch(err){window.toast?.(err.message||String(err),true);btn.disabled=false}
    };
  };

  window.addEventListener('swk-language-applied',()=>setTimeout(patchPendingFinance,0));
  document.addEventListener('DOMContentLoaded',waitForAuth);
  if(document.readyState!=='loading')waitForAuth();
  setInterval(patchPendingFinance,1000);
})();

/* ===== v24.7-finance-list-proof-existing-fix.js ===== */
/* WL Credit V24.7 — stable finance list, inline proof preview, existing-customer activation flow */
(()=>{
'use strict';
const S=()=>window.state||window.__wlState||{};
const db=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const norm=v=>String(v??'').trim().toLowerCase();
const L=(z,e,m)=>window.SWK_LANG?.current==='zh'?z:window.SWK_LANG?.current==='ms'?m:e;
const esc=v=>window.esc?window.esc(v??''):String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const appById=id=>(S().applications||[]).find(a=>String(a.id)===String(id));
const sortApps=list=>[...(list||[])].sort((a,b)=>{
  const ta=new Date(a.submitted_to_finance_at||a.created_at||0).getTime();
  const tb=new Date(b.submitted_to_finance_at||b.created_at||0).getTime();
  if(tb!==ta)return tb-ta;
  return String(b.application_code||b.id||'').localeCompare(String(a.application_code||a.id||''),undefined,{numeric:true});
});

async function customerProfile(a){
  const c=db(); if(!c?.from||!a)return null;
  const cid=a.customer_id||a.existing_customer_id;
  if(!cid)return null;
  const r=await c.from('customers').select('*').eq('id',cid).maybeSingle();
  return r.error?null:r.data;
}
async function isExistingCustomer(a){
  if(!a)return false;
  if(norm(a.application_type)==='existing_customer_new_loan'||norm(a.application_source)==='existing_customer'||a.existing_customer_id)return true;
  const c=await customerProfile(a);
  if(!c)return false;
  const code=String(c.customer_code||c.username||'').toUpperCase();
  return !!(c.auth_user_id||c.user_id||c.portal_user_id||/^WL\d+/.test(code));
}

// Keep all finance lists in one deterministic order.
function normalizeStateOrder(){
  if(Array.isArray(S().applications))S().applications=sortApps(S().applications);
}
const oldRenderPF=window.renderPendingFinance;
if(typeof oldRenderPF==='function'){
  window.renderPendingFinance=function(){normalizeStateOrder();return oldRenderPF.apply(this,arguments)};
}

// Replace account-creation action for existing customers, including old records.
async function patchExistingButtons(root=document){
  const buttons=[...root.querySelectorAll('[data-v36-final-approve]')];
  for(const btn of buttons){
    const id=btn.dataset.v36FinalApprove;
    const a=appById(id) || (await db()?.from('loan_applications').select('*').eq('id',id).maybeSingle())?.data;
    if(!await isExistingCustomer(a))continue;
    btn.removeAttribute('data-v36-final-approve');
    btn.dataset.v247ExistingLoan=id;
    btn.textContent=L('确认并启用新贷款','Confirm & Activate New Loan','Sahkan & Aktifkan Pinjaman Baharu');
    btn.className='btn btn-primary';
  }
}

async function proofUrl(a){
  if(!a?.finance_proof_path)return null;
  const r=await db().storage.from('disbursement-proofs').createSignedUrl(a.finance_proof_path,900);
  return r.error?null:r.data?.signedUrl;
}

async function patchReviewModal(id){
  const body=document.querySelector('#modalBody'); if(!body)return;
  const a=appById(id) || (await db()?.from('loan_applications').select('*').eq('id',id).maybeSingle())?.data;
  if(!a)return;

  const existing=await isExistingCustomer(a);
  const createBtn=body.querySelector('[data-v36-final-approve]');
  if(createBtn&&existing){
    createBtn.removeAttribute('data-v36-final-approve');
    createBtn.dataset.v247ExistingLoan=id;
    createBtn.textContent=L('确认并启用新贷款','Confirm & Activate New Loan','Sahkan & Aktifkan Pinjaman Baharu');
  }

  // If the loan is already active, never show any create-account action.
  if(['approved','active','loan_active','completed'].includes(norm(a.status))){
    body.querySelectorAll('[data-v36-final-approve],[data-v247-existing-loan]').forEach(x=>x.remove());
  }

  if(a.finance_proof_path){
    const url=await proofUrl(a);
    if(url){
      const old=body.querySelector('[data-v36-proof]');
      const holder=old?.closest('.detail-row')||old?.parentElement;
      const isPdf=/\.pdf($|\?)/i.test(a.finance_proof_name||a.finance_proof_path||'');
      const html=isPdf
        ? `<button class="btn btn-secondary" data-v247-open-proof="${esc(id)}">${L('打开出款文件','Open proof file','Buka fail bukti')}</button>`
        : `<div class="v247-proof-wrap"><img src="${esc(url)}" data-v247-open-proof="${esc(id)}" alt="${L('出款截图','Disbursement proof','Bukti pengeluaran')}" style="display:block;max-width:360px;width:100%;max-height:360px;object-fit:contain;border:1px solid #d9e2ef;border-radius:12px;cursor:pointer;background:#fff"><div class="tabs" style="margin-top:10px"><button class="btn btn-secondary" data-v247-copy-proof="${esc(id)}">${L('复制图片','Copy image','Salin imej')}</button><button class="btn btn-secondary" data-v247-download-proof="${esc(id)}">${L('下载','Download','Muat turun')}</button></div></div>`;
      if(holder)holder.innerHTML=`<span>${L('出款截图','Disbursement proof','Bukti pengeluaran')}</span><div>${html}</div>`;
    }
  }
}

const oldOpenReview=window.v36OpenReview;
if(typeof oldOpenReview==='function'){
  window.v36OpenReview=async function(id){
    const out=await oldOpenReview.apply(this,arguments);
    await patchReviewModal(id);
    return out;
  };
  window.openApplicationReview=window.v36OpenReview;
}

async function activateExistingLoan(id){
  const c=db();
  const a=appById(id)||(await c.from('loan_applications').select('*').eq('id',id).maybeSingle()).data;
  if(!a)return window.toast?.(L('找不到申请','Application not found','Permohonan tidak ditemui'),true);
  if(!await isExistingCustomer(a))return;
  try{
    // Prefer an existing dedicated RPC if available.
    let r=await c.rpc('wl_activate_existing_customer_loan',{p_application_id:id});
    if(r.error){
      // Fallback: mark the already-created loan/application active without creating any customer account.
      const loanId=a.loan_id||a.created_loan_id;
      if(loanId){
        const lr=await c.from('loans').update({status:'active',updated_at:new Date().toISOString()}).eq('id',loanId);
        if(lr.error)throw lr.error;
      }
      const ur=await c.from('loan_applications').update({status:'approved',application_type:'existing_customer_new_loan',updated_at:new Date().toISOString()}).eq('id',id);
      if(ur.error)throw ur.error;
    }
    window.closeModal?.();
    window.toast?.(L('新贷款已启用，原客户账号保持不变','New loan activated. Existing customer account remains unchanged.','Pinjaman baharu diaktifkan. Akaun pelanggan sedia ada tidak berubah.'));
    await window.loadAll?.();
    normalizeStateOrder();
    window.renderPendingFinance?.();
  }catch(err){window.toast?.(err.message||String(err),true)}
}

async function getProofData(id){
  const a=appById(id)||(await db().from('loan_applications').select('*').eq('id',id).maybeSingle()).data;
  if(!a?.finance_proof_path)throw new Error(L('找不到出款截图','Disbursement proof not found','Bukti pengeluaran tidak ditemui'));
  const url=await proofUrl(a);if(!url)throw new Error(L('无法打开出款截图','Unable to open proof','Tidak dapat membuka bukti'));
  return {a,url};
}

document.addEventListener('click',async e=>{
  const activate=e.target.closest('[data-v247-existing-loan]');
  if(activate){e.preventDefault();e.stopImmediatePropagation();await activateExistingLoan(activate.dataset.v247ExistingLoan);return}
  const open=e.target.closest('[data-v247-open-proof]');
  if(open){e.preventDefault();const {url}=await getProofData(open.dataset.v247OpenProof);window.open(url,'_blank','noopener');return}
  const dl=e.target.closest('[data-v247-download-proof]');
  if(dl){e.preventDefault();const {a,url}=await getProofData(dl.dataset.v247DownloadProof);const x=document.createElement('a');x.href=url;x.download=a.finance_proof_name||'disbursement-proof';document.body.appendChild(x);x.click();x.remove();return}
  const cp=e.target.closest('[data-v247-copy-proof]');
  if(cp){e.preventDefault();try{const {url}=await getProofData(cp.dataset.v247CopyProof);const blob=await fetch(url).then(r=>r.blob());if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error('unsupported');await navigator.clipboard.write([new ClipboardItem({[blob.type]:blob})]);window.toast?.(L('图片已复制，可直接贴到 WhatsApp 或 Telegram','Image copied. Paste it into WhatsApp or Telegram.','Imej disalin. Tampal ke WhatsApp atau Telegram.'))}catch(_){window.toast?.(L('浏览器不支持直接复制图片，请使用下载','Your browser cannot copy the image directly. Please download it.','Pelayar tidak menyokong salin imej. Sila muat turun.'),true)}return}
},true);

// Observe dynamic table/modal renders without rebuilding the page.
const observer=new MutationObserver(muts=>{
  if(muts.some(m=>m.addedNodes.length)){
    normalizeStateOrder();
    patchExistingButtons(document).catch(()=>{});
  }
});
observer.observe(document.documentElement,{childList:true,subtree:true});

window.addEventListener('swk-language-applied',()=>patchExistingButtons(document));
setTimeout(()=>{normalizeStateOrder();patchExistingButtons(document)},500);
})();

/* ===== v25-multi-loan-activation.js ===== */
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

/* ===== v25.2-customer-intake-documents.js ===== */
/* WL Credit V25.2 — complete customer intake fields and document upload */
(()=>{
'use strict';
const $=s=>document.querySelector(s), st=()=>window.state||window.__wlState||{};
const E=v=>window.esc?window.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
const fileTypes=[
 ['ic_front',L('IC 正面','IC Front','IC Depan')],['ic_back',L('IC 背面','IC Back','IC Belakang')],
 ['holding_ic',L('手持 IC 自拍','Holding IC','Pegang IC')],['selfie',L('个人自拍','Selfie','Swafoto')],
 ['payslip',L('工资单','Payslip','Slip Gaji')],['bank_statement','Bank Statement'],['epf','EPF Statement'],['customer_video',L('客户影片','Customer Video','Video Pelanggan')]
];
async function uploadDoc(customerId,category,file){
 if(!file)return;
 const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'');
 const path=`${customerId}/${Date.now()}-${category}-${crypto.randomUUID()}.${ext}`;
 const up=await window.sb.storage.from('customer-documents').upload(path,file,{contentType:file.type,upsert:false});
 if(up.error)throw up.error;
 const row={customer_id:customerId,category,file_name:file.name,storage_path:path,bucket_name:'customer-documents',mime_type:file.type,file_size:file.size,uploaded_by:st().staff?.user_id};
 const ins=await window.sb.from('customer_documents').insert(row);
 if(ins.error){await window.sb.storage.from('customer-documents').remove([path]);throw ins.error}
}
window.openCustomer=function(id){
 if(window.requirePerm&&!window.requirePerm(id?'customers_edit':'customers_create'))return;
 const c=(st().customers||[]).find(x=>String(x.id)===String(id))||{};
 const assignments={banks:window.assignmentOptions?.(st().banks,c.assigned_bank_id,st().settings?.default_bank_id)||'',wa:window.assignmentOptions?.((st().contacts||[]).filter(x=>x.channel_type==='whatsapp'),c.assigned_whatsapp_id,st().settings?.default_whatsapp_id)||'',tg:window.assignmentOptions?.((st().contacts||[]).filter(x=>x.channel_type==='telegram'),c.assigned_telegram_id,st().settings?.default_telegram_id)||''};
 const docFields=fileTypes.map(([k,label])=>`<div class="field"><label>${E(label)}</label><input name="doc_${k}" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/quicktime,video/webm"></div>`).join('');
 window.modal(`<h2>${id?L('编辑客户','Edit Customer','Edit Pelanggan'):L('新增客户','Add Customer','Tambah Pelanggan')}</h2><form id="customerFormV252">
 <h3>${L('基本资料','Personal Information','Maklumat Peribadi')}</h3><div class="grid2"><div class="field"><label>${L('姓名','Full Name','Nama Penuh')}</label><input name="name" required value="${E(c.full_name||'')}"></div>${id?'':`<div class="field"><label>${L('临时密码','Temporary Password','Kata Laluan Sementara')}</label><input name="pin" minlength="4" required></div>`}<div class="field"><label>${L('电话','Phone','Telefon')}</label><input name="phone" value="${E(c.phone||'')}"></div><div class="field"><label>IC</label><input name="idn" value="${E(c.id_number||'')}"></div><div class="field"><label>${L('地址','Address','Alamat')}</label><input name="address" value="${E(c.address||'')}"></div></div>
 <h3>${L('工作与公司资料','Employment & Company','Pekerjaan & Syarikat')}</h3><div class="grid2"><div class="field"><label>${L('职位','Occupation','Pekerjaan')}</label><input name="occupation" value="${E(c.occupation||'')}"></div><div class="field"><label>${L('公司名称','Employer','Majikan')}</label><input name="employer" value="${E(c.employer||'')}"></div><div class="field"><label>${L('每月工资','Monthly Salary','Gaji Bulanan')}</label><input name="monthly_salary" type="number" min="0" step="0.01" value="${E(c.monthly_salary||'')}"></div><div class="field"><label>${L('发薪周期','Salary Frequency','Kekerapan Gaji')}</label><select name="salary_frequency"><option value="weekly" ${c.salary_frequency==='weekly'?'selected':''}>${L('每星期','Weekly','Mingguan')}</option><option value="biweekly" ${c.salary_frequency==='biweekly'?'selected':''}>${L('每两星期','Every 2 Weeks','Setiap 2 Minggu')}</option><option value="monthly" ${(!c.salary_frequency||c.salary_frequency==='monthly')?'selected':''}>${L('每月','Monthly','Bulanan')}</option></select></div><div class="field"><label>${L('公司联系电话','Company Contact','Telefon Syarikat')}</label><input name="employer_phone" value="${E(c.employer_phone||'')}"></div><div class="field"><label>${L('负责人姓名','Person in Charge','Nama Pegawai')}</label><input name="employer_pic_name" value="${E(c.employer_pic_name||'')}"></div><div class="field"><label>${L('负责人电话','PIC Contact','Telefon Pegawai')}</label><input name="employer_pic_phone" value="${E(c.employer_pic_phone||'')}"></div></div>
 <h3>${L('个人银行资料','Personal Bank Information','Maklumat Bank Peribadi')}</h3><div class="grid2"><div class="field"><label>${L('银行名称','Bank Name','Nama Bank')}</label><input name="bank_name" value="${E(c.bank_name||'')}"></div><div class="field"><label>${L('户名','Account Name','Nama Akaun')}</label><input name="bank_account_name" value="${E(c.bank_account_name||'')}"></div><div class="field"><label>${L('银行账号','Account Number','Nombor Akaun')}</label><input name="bank_account_number" value="${E(c.bank_account_number||'')}"></div></div>
 <h3>${L('紧急联系人','Emergency Contacts','Hubungan Kecemasan')}</h3><div class="grid2"><div class="field"><label>${L('联系人1姓名','Contact 1 Name','Nama Hubungan 1')}</label><input name="emergency_name" value="${E(c.emergency_name||'')}"></div><div class="field"><label>${L('关系','Relationship','Hubungan')}</label><input name="emergency_relation" value="${E(c.emergency_relation||'')}"></div><div class="field"><label>${L('电话','Phone','Telefon')}</label><input name="emergency_phone" value="${E(c.emergency_phone||'')}"></div><div class="field"><label>${L('联系人2姓名','Contact 2 Name','Nama Hubungan 2')}</label><input name="emergency_name_2" value="${E(c.emergency_name_2||'')}"></div><div class="field"><label>${L('关系','Relationship','Hubungan')}</label><input name="emergency_relation_2" value="${E(c.emergency_relation_2||'')}"></div><div class="field"><label>${L('电话','Phone','Telefon')}</label><input name="emergency_phone_2" value="${E(c.emergency_phone_2||'')}"></div></div>
 <h3>${L('客户文件','Customer Documents','Dokumen Pelanggan')}</h3><div class="grid2">${docFields}</div>
 <h3>${L('系统分配','System Assignment','Penetapan Sistem')}</h3><div class="grid2"><div class="field"><label>${L('公司收款账户','Company Receiving Bank','Bank Kutipan Syarikat')}</label><select name="bank_id">${assignments.banks}</select></div><div class="field"><label>WhatsApp</label><select name="whatsapp_id">${assignments.wa}</select></div><div class="field"><label>Telegram</label><select name="telegram_id">${assignments.tg}</select></div></div><div class="field"><label>${L('内部备注','Internal Notes','Catatan Dalaman')}</label><textarea name="notes">${E(c.internal_notes||'')}</textarea></div><label><input type="checkbox" name="active" ${c.is_active!==false?'checked':''}> Active</label><p><button class="btn btn-primary">${L('保存','Save','Simpan')}</button> <button type="button" class="btn btn-secondary" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></p></form>`);
 const form=$('#customerFormV252');form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),data={full_name:f.get('name'),phone:f.get('phone'),id_number:f.get('idn'),address:f.get('address'),occupation:f.get('occupation')||null,employer:f.get('employer')||null,monthly_salary:Number(f.get('monthly_salary')||0)||null,salary_frequency:f.get('salary_frequency')||null,employer_phone:f.get('employer_phone')||null,employer_pic_name:f.get('employer_pic_name')||null,employer_pic_phone:f.get('employer_pic_phone')||null,bank_name:f.get('bank_name')||null,bank_account_name:f.get('bank_account_name')||null,bank_account_number:f.get('bank_account_number')||null,emergency_name:f.get('emergency_name')||null,emergency_relation:f.get('emergency_relation')||null,emergency_phone:f.get('emergency_phone')||null,emergency_name_2:f.get('emergency_name_2')||null,emergency_relation_2:f.get('emergency_relation_2')||null,emergency_phone_2:f.get('emergency_phone_2')||null,internal_notes:f.get('notes'),is_active:f.get('active')==='on',assigned_bank_id:f.get('bank_id')||null,assigned_whatsapp_id:f.get('whatsapp_id')||null,assigned_telegram_id:f.get('telegram_id')||null,updated_at:new Date().toISOString()};
 let customerId=id,x;if(id){x=await window.sb.from('customers').update(data).eq('id',id)}else{x=await window.sb.rpc('staff_create_customer_auto',{p_name:f.get('name'),p_pin:f.get('pin'),p_phone:f.get('phone'),p_id_number:f.get('idn'),p_address:f.get('address'),p_work_salary:[f.get('occupation'),f.get('employer'),f.get('monthly_salary')].filter(Boolean).join(' | '),p_emergency:[f.get('emergency_name'),f.get('emergency_relation'),f.get('emergency_phone')].filter(Boolean).join(' | '),p_internal_notes:f.get('notes')});customerId=x.data?.id;if(!x.error&&customerId)x=await window.sb.from('customers').update(data).eq('id',customerId)}
 if(x.error)return window.toast(x.error.message,true);
 try{for(const [k] of fileTypes){const file=f.get('doc_'+k);if(file&&file.size)await uploadDoc(customerId,k,file)}}catch(err){return window.toast(err.message||String(err),true)}
 window.closeModal();window.toast(L('已保存','Saved','Disimpan'));await window.loadAll?.();if(customerId)window.openCustomerProfile?.(customerId);
 };
};

const oldReview=window.openApplicationReview;
if(typeof oldReview==='function')window.openApplicationReview=function(id){const r=oldReview.apply(this,arguments);setTimeout(()=>{const a=(st().applications||[]).find(x=>String(x.id)===String(id));const grid=$('#modalBody .application-detail-grid');if(a&&grid&&!$('#v252EmployerCard'))grid.insertAdjacentHTML('beforeend',`<div id="v252EmployerCard" class="card"><h3>${L('公司联络资料','Company Contact Details','Butiran Hubungan Syarikat')}</h3><div class="kv"><span>${L('公司电话','Company Phone','Telefon Syarikat')}</span><strong>${E(a.employer_phone||'-')}</strong></div><div class="kv"><span>${L('负责人姓名','Person in Charge','Nama Pegawai')}</span><strong>${E(a.employer_pic_name||'-')}</strong></div><div class="kv"><span>${L('负责人电话','PIC Contact','Telefon Pegawai')}</span><strong>${E(a.employer_pic_phone||'-')}</strong></div></div>`);},20);return r};
})();

/* ===== v25.4-bank-loan-staff-filters.js ===== */
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

/* ===== v25.5-bank-overdue-ui-fix.js ===== */
/* WL Credit V25.5 - bank schema compatibility notice + restore overdue action */
(() => {
  'use strict';
  const T=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=()=>window.state||{};
  const canonical=l=>String(window.canonicalLoanId?window.canonicalLoanId(l?.loan_id):l?.loan_id||'').trim();

  function canSetOverdue(){
    const role=String(state().staff?.role||'').toLowerCase().replace(/[\s-]+/g,'_');
    return ['customer_service','finance','super_admin','superadmin'].includes(role) ||
      (typeof window.has==='function' && (window.has('loans_edit')||window.has('payments_approve')));
  }

  function enhanceLoanRows(){
    const body=document.querySelector('#loanRows');
    if(!body||!canSetOverdue()) return;
    const loans=state().loans||[];
    body.querySelectorAll('tr').forEach(row=>{
      const first=row.cells?.[0];
      const action=row.cells?.[row.cells.length-1];
      if(!first||!action) return;
      const shown=String(first.textContent||'').replace(/\s+/g,'').toUpperCase();
      const loan=loans.find(l=>canonical(l).replace(/\s+/g,'').toUpperCase()===shown || String(l.loan_id||'').replace(/\s+/g,'').toUpperCase()===shown);
      if(!loan) return;
      if(!action.querySelector('[data-v23-overdue],.v255-set-overdue')){
        const button=document.createElement('button');
        button.type='button';
        button.className='btn btn-danger v255-set-overdue';
        button.dataset.v23Overdue=String(loan.id);
        button.textContent=T('设置逾期','Set Overdue','Tetapkan Tertunggak');
        action.appendChild(button);
      }
    });
  }

  // Existing v23-enterprise handler opens the correct modal. Keep a direct fallback
  // in case another renderer stops that delegated listener.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.v255-set-overdue');
    if(!b) return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof window.v23OpenOverdue==='function') window.v23OpenOverdue(b.dataset.v23Overdue);
    else if(typeof window.setOverdueCharge==='function') window.setOverdueCharge(b.dataset.v23Overdue);
  },true);

  const observer=new MutationObserver(()=>enhanceLoanRows());
  function boot(){
    const body=document.querySelector('#loanRows');
    if(body) observer.observe(body,{childList:true,subtree:true});
    enhanceLoanRows();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));
  window.addEventListener('swk-language-applied',()=>setTimeout(enhanceLoanRows,50));
  setInterval(enhanceLoanRows,1500);
})();

/* ===== v25.8-finance-disbursement-review.js ===== */
/* WL Credit V25.8 — Finance full disbursement review */
(()=>{
'use strict';
const S=()=>window.state||window.__wlState||{};
const db=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const lang=()=>window.SWK_LANG?.current||'en';
const L=(z,e,m)=>lang()==='zh'?z:lang()==='ms'?m:e;
const E=v=>window.esc?window.esc(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M=v=>window.money?window.money(Number(v||0)):`MYR ${Number(v||0).toFixed(2)}`;
const R=(k,v)=>`<div class="detail-row"><span>${E(k)}</span><strong>${E(v||'-')}</strong></div>`;
const field=(label,name,value,type='text',extra='')=>`<div class="field"><label>${E(label)}</label><input name="${name}" type="${type}" value="${E(value??'')}" ${extra}></div>`;
async function getApp(id){return (S().applications||[]).find(x=>String(x.id)===String(id))||(await db().from('loan_applications').select('*').eq('id',id).maybeSingle()).data}
async function getCustomer(a){const id=a?.customer_id||a?.existing_customer_id;if(!id)return null;return (await db().from('customers').select('*').eq('id',id).maybeSingle()).data}
async function getDocs(a,c){
 const out=[]; if(c?.id){const r=await db().from('customer_documents').select('*').eq('customer_id',c.id);if(!r.error)out.push(...(r.data||[]));}
 const paths=a?.document_paths||{};Object.entries(paths).forEach(([category,path])=>path&&out.push({category,storage_path:path,bucket_name:'loan-applications',file_name:String(path).split('/').pop()}));return out;
}
function ec(c,n,key){return c?.[`emergency_contact_${n}_${key}`]||c?.[`emergency_${n}_${key}`]||c?.[`emergency${n}_${key}`]||'-'}
async function docHtml(d,i){
 const bucket=d.bucket_name||'customer-documents',path=d.storage_path||d.path;if(!path)return '';
 const r=await db().storage.from(bucket).createSignedUrl(path,900);const url=r.error?'':r.data?.signedUrl;
 const label=d.category||d.document_type||d.file_name||`Document ${i+1}`;
 const isVideo=String(d.mime_type||'').startsWith('video/')||/\.(mp4|mov|webm)(\?|$)/i.test(String(path));
 const view=url?(isVideo?`<video controls preload="metadata" style="width:100%;max-height:360px;border-radius:10px" src="${E(url)}"></video><div style="margin-top:8px"><a class="btn btn-secondary" href="${E(url)}" target="_blank" rel="noopener">${L('打开影片','Open video','Buka video')}</a></div>`:`<a class="btn btn-secondary" href="${E(url)}" target="_blank" rel="noopener">${L('查看文件','View file','Lihat fail')}</a>`):`<span class="muted">${L('无法读取','Unavailable','Tidak tersedia')}</span>`;
 return `<div class="card" style="padding:12px"><strong>${E(label)}</strong><div style="margin-top:8px">${view}</div></div>`;
}
async function openReview(id){
 // V25.8.3: render immediately so Finance never waits on a blank/old page while async data loads.
 window.modal?.(`<div class="card" style="min-height:220px;display:flex;align-items:center;justify-content:center;text-align:center"><div><h2>${L('处理出款','Process Disbursement','Proses Pengeluaran')}</h2><p class="muted">${L('正在载入客户资料…','Loading customer details…','Memuatkan butiran pelanggan…')}</p><div style="margin-top:18px"><button class="btn btn-primary" disabled>${L('确认出款','Confirm Disbursement','Sahkan Pengeluaran')}</button> <button class="btn btn-danger" disabled>${L('拒绝出款','Reject Disbursement','Tolak Pengeluaran')}</button></div></div></div>`);
 const a=await getApp(id);if(!a){window.closeModal?.();return window.toast?.(L('找不到申请','Application not found','Permohonan tidak ditemui'),true);}
 const c=await getCustomer(a),docs=await getDocs(a,c),banks=(await db().from('company_bank_accounts').select('*').eq('is_enabled',true).eq('can_disburse',true)).data||[];
 const dh=(await Promise.all(docs.map(docHtml))).join('')||`<p class="muted">${L('没有文件','No documents','Tiada dokumen')}</p>`;
 const p=Number(a.approved_principal||a.requested_amount||0),interest=Number(a.approved_interest||0),settle=Number(a.approved_settlement_amount||p+interest);
 const due=String(a.approved_due_date||'').slice(0,10);
 window.modal?.(`<div class="profile-head"><div><h2>${L('处理出款','Process Disbursement','Proses Pengeluaran')}</h2><p class="muted">${E(a.application_code||a.id)} · ${E(a.full_name||c?.full_name||'-')}</p></div></div>
 <div class="application-detail-grid">
  <div class="card"><h3>${L('客户资料','Customer Details','Butiran Pelanggan')}</h3>${R(L('姓名','Name','Nama'),a.full_name||c?.full_name)}${R('IC',a.id_number||c?.id_number)}${R(L('电话','Phone','Telefon'),a.phone||c?.phone)}${R(L('地址','Address','Alamat'),a.address||c?.address)}</div>
  <div class="card"><h3>${L('工作与公司','Employment & Company','Pekerjaan & Syarikat')}</h3>${R(L('职业','Occupation','Pekerjaan'),a.occupation||c?.occupation)}${R(L('公司','Employer','Majikan'),a.employer||c?.employer)}${R(L('月薪','Monthly Salary','Gaji Bulanan'),a.monthly_salary||c?.monthly_salary||c?.salary)}${R(L('公司电话','Company Phone','Telefon Syarikat'),a.employer_phone||a.company_phone||c?.employer_phone||c?.company_phone)}${R(L('负责人','Person in Charge','Pegawai Bertanggungjawab'),a.employer_contact_name||a.company_contact_name||c?.employer_contact_name||c?.company_contact_name)}${R(L('负责人电话','PIC Phone','Telefon PIC'),a.employer_contact_phone||a.company_contact_phone||c?.employer_contact_phone||c?.company_contact_phone)}</div>
  <div class="card"><h3>${L('客户银行','Customer Bank','Bank Pelanggan')}</h3>${R(L('银行','Bank','Bank'),a.bank_name||a.customer_bank_name||c?.bank_name)}${R(L('户名','Account Name','Nama Akaun'),a.bank_account_name||a.account_name||c?.bank_account_name||c?.account_name)}${R(L('账号','Account Number','Nombor Akaun'),a.bank_account_number||a.account_number||c?.bank_account_number||c?.account_number)}</div>
  <div class="card"><h3>${L('紧急联系人','Emergency Contacts','Hubungan Kecemasan')}</h3>${R(L('联系人 1','Contact 1','Hubungan 1'),`${ec(c,1,'name')} · ${ec(c,1,'relationship')||ec(c,1,'relation')} · ${ec(c,1,'phone')}`)}${R(L('联系人 2','Contact 2','Hubungan 2'),`${ec(c,2,'name')} · ${ec(c,2,'relationship')||ec(c,2,'relation')} · ${ec(c,2,'phone')}`)}</div>
 </div>
 <div class="card" style="margin-top:16px"><h3>${L('客服提交备注','Staff Submission Note','Catatan Staf')}</h3><div style="white-space:pre-wrap;line-height:1.7">${E(a.approval_notes||a.notes||a.application_notes||a.staff_notes||'-')}</div></div>
 <div class="card" style="margin-top:16px"><h3>${L('客户文件','Customer Documents','Dokumen Pelanggan')}</h3><div class="resource-grid">${dh}</div></div>
 <form id="v258FinanceForm" class="card" style="margin-top:16px"><h3>${L('最终贷款与出款资料','Final Loan & Disbursement','Pinjaman & Pengeluaran Akhir')}</h3>
 <div class="grid2">${field(L('本金 / 实际放款金额','Principal / Actual Disbursement','Prinsipal / Pengeluaran Sebenar'),'principal',p,'number','step="0.01" min="0.01" required')}${field(L('利息','Interest','Faedah'),'interest',interest,'number','step="0.01" min="0" required')}${field(L('清账金额','Settlement Amount','Jumlah Penyelesaian'),'settlement',settle,'number','step="0.01" min="0.01" required')}${field(L('到期日期','Due Date','Tarikh Tamat'),'due',due,'date','required')}</div>
 <div class="grid2"><div class="field"><label>${L('公司出款银行','Company Disbursement Bank','Bank Pengeluaran Syarikat')}</label><select name="bank" required>${banks.map(b=>`<option value="${E(b.id)}">${E(b.bank_name)} · ${E(b.account_number)}</option>`).join('')}</select></div>${field(L('出款时间','Transfer Time','Masa Pindahan'),'at','','datetime-local','required')}</div>
 <div class="grid2">${field(L('参考号','Reference','Rujukan'),'ref','')}<div class="field"><label>${L('出款截图','Disbursement Screenshot','Tangkapan Skrin Pengeluaran')}</label><input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required></div></div>
 <div class="field"><label>${L('财务出款备注','Finance Disbursement Note','Catatan Pengeluaran Kewangan')}</label><textarea name="note">${E(a.finance_note||'')}</textarea></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">${L('确认出款','Confirm Disbursement','Sahkan Pengeluaran')}</button><button class="btn btn-danger" type="button" id="v258Reject">${L('拒绝出款','Reject Disbursement','Tolak Pengeluaran')}</button><button class="btn btn-secondary" type="button" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div></form>`);
 const f=document.querySelector('#v258FinanceForm');f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 document.querySelector('#v258Reject').onclick=()=>{
  if(typeof window.v233RejectFinanceDisbursement==='function'){window.closeModal?.();return window.v233RejectFinanceDisbursement(id)}
  window.modal?.(`<h2>${L('拒绝出款','Reject Disbursement','Tolak Pengeluaran')}</h2><form id="v258RejectForm"><div class="field"><label>${L('拒绝原因','Rejection reason','Sebab penolakan')}</label><textarea name="reason" rows="4" required minlength="3"></textarea></div><div style="display:flex;gap:10px"><button class="btn btn-danger">${L('确认拒绝','Confirm Reject','Sahkan Tolak')}</button><button type="button" class="btn btn-secondary" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div></form>`);
  document.querySelector('#v258RejectForm').onsubmit=async ev=>{ev.preventDefault();const reason=String(new FormData(ev.target).get('reason')||'').trim();if(reason.length<3)return window.toast?.(L('请填写拒绝原因','Enter a rejection reason','Masukkan sebab penolakan'),true);const r=await db().rpc('wl_reject_loan_workflow_v233',{p_application_id:id,p_stage:'finance_disbursement',p_reason:reason});if(r.error||r.data?.ok===false)return window.toast?.(r.error?.message||r.data?.error||L('拒绝失败','Reject failed','Penolakan gagal'),true);window.closeModal?.();window.toast?.(L('已退回客服修改','Returned to staff for correction','Dikembalikan kepada staf'));await window.loadAll?.();};
 };
 f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),proof=fd.get('proof');if(!(proof instanceof File)||!proof.size)return window.toast?.(L('请上传出款截图','Please upload proof','Sila muat naik bukti'),true);
  const principal=Number(fd.get('principal')),iv=Number(fd.get('interest')),settlement=Number(fd.get('settlement')),at=new Date(fd.get('at')).toISOString();
  const safe=String(proof.name||'proof').replace(/[^a-zA-Z0-9._-]+/g,'-'),path=`${id}/${Date.now()}-${safe}`;
  const up=await db().storage.from('disbursement-proofs').upload(path,proof,{cacheControl:'3600',upsert:false,contentType:proof.type||undefined});if(up.error)return window.toast?.(up.error.message,true);
  const payload={approved_principal:principal,approved_interest:iv,approved_settlement_amount:settlement,approved_due_date:fd.get('due'),status:'finance_disbursed',finance_bank_account_id:fd.get('bank'),finance_reference:fd.get('ref')||null,finance_note:fd.get('note')||null,finance_disbursed_at:at,finance_disbursed_by:S().staff?.user_id,finance_proof_path:path,finance_proof_name:proof.name||safe};
  const u=await db().from('loan_applications').update(payload).eq('id',id).eq('status','pending_disbursement').select('id').maybeSingle();if(u.error||!u.data){await db().storage.from('disbursement-proofs').remove([path]);return window.toast?.(u.error?.message||L('出款更新失败','Update failed','Kemas kini gagal'),true)}
  const tx=await db().from('finance_transactions').insert({bank_account_id:fd.get('bank'),transaction_type:'outflow',source_type:'application_disbursement',source_id:id,amount:principal,transaction_at:at,reference_no:fd.get('ref')||null,note:fd.get('note')||null,created_by:S().staff?.user_id});if(tx.error)window.toast?.(tx.error.message,true);
  try{await db().from('audit_logs').insert({staff_user_id:S().staff?.user_id,action:'finance_disbursement_finalized',details:`${a.application_code||id}: principal ${a.approved_principal||a.requested_amount||0} -> ${principal}; interest ${a.approved_interest||0} -> ${iv}; settlement ${a.approved_settlement_amount||0} -> ${settlement}`})}catch(_){ }
  window.closeModal?.();window.toast?.(L('财务已完成出款，截图已回传客服','Disbursement completed and proof sent to staff','Pengeluaran selesai dan bukti dihantar kepada staf'));await window.loadAll?.();await window.renderFinanceApplications?.();
 };
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v36-finance-disburse]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();openReview(b.dataset.v36FinanceDisburse).catch(err=>window.toast?.(err.message||String(err),true));},true);
window.v258OpenFinanceDisbursement=openReview;
})();

/* ===== v25.8.3-ui-stability.js ===== */
/* WL Credit V25.8.3 — UI single-render stability guard */
(()=>{'use strict';
const clean=()=>{
  const nav=document.querySelector('#nav')||document.querySelector('#adminSidebar nav'); if(!nav)return;
  // Remove the legacy My Work entry permanently; keep #navTodayWork only.
  nav.querySelectorAll('#navMyWork,[data-section="myWork"]').forEach(x=>x.remove());
  const todays=[...nav.querySelectorAll('#navTodayWork,[data-section="todayWork"]')];
  todays.slice(1).forEach(x=>x.remove());
};
let queued=false; const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('wl:data-loaded',schedule);window.addEventListener('swk-language-applied',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean);else clean();
})();
/* V25.8.4 final guards: one Today Work; no reject button in finance pending lists */
(()=>{'use strict';
 const normalize=()=>{
   const all=[...document.querySelectorAll('#navTodayWork,#navMyWork,[data-section="todayWork"],[data-section="myWork"]')];
   let keeper=all.find(x=>x.id==='navTodayWork')||all.find(x=>x.dataset?.section==='todayWork')||all[0];
   all.forEach(x=>{if(x!==keeper)x.remove()});
   document.querySelectorAll('#v33DisbursementRows [data-v233-finance-reject],#pendingFinanceRows [data-v233-finance-reject]').forEach(x=>x.remove());
 };
 let raf=0; const queue=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(normalize)};
 new MutationObserver(queue).observe(document.body||document.documentElement,{subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',normalize); setTimeout(normalize,0); setTimeout(normalize,500);
})();
