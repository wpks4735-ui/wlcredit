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
