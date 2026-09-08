
(() => {
  'use strict';

  const MAP = {
    zh: {
      'Finance':'财务','Customer Service':'客服','Super Admin':'超级管理员','Staff':'员工','Admin':'管理员',
      'Dashboard':'总览','Customers':'客户','Customer':'客户','Loans':'贷款','Loan':'贷款','Payments':'付款','Payment':'付款',
      'Loan Management':'贷款管理','Loans & Payments':'贷款与付款','Company Management':'公司管理','Reports & Records':'报表与记录','System Management':'系统管理',
      'Settings':'设置','Search':'搜索','Sound On':'声音开启','Sound Off':'声音关闭','Language':'语言','Logout':'退出登录','Login':'登录',
      'Staff Login':'员工登录','Client Login':'会员登录','Username':'用户名','Password':'密码','Member Portal':'会员前台',
      'Pending Payments':'待确认收款','Pending Disbursement':'待财务出款','Review':'审核','Salary':'工资','Payroll':'工资管理',
      'Payment':'付款','Disbursement':'放款','Approval':'审核','Work':'工作','Today':'今天','Yesterday':'昨天','This Week':'本周','Last Week':'上周','This Month':'本月','Last Month':'上月',
      'Apply':'查询','Date From':'开始日期','Date To':'结束日期','From':'从','To':'至',
      'Company Customers':'公司客户数量','Active Loans':'进行中的贷款','Period Due':'期间应收','Period Collected':'期间已收','Total Disbursed':'共放款','Total Collected':'已收总额','Profit / Loss':'盈亏',
      'Customer Performance Report':'客服业绩报表','Customer Service Profit Report':'客服盈亏报表','Company Bank Transaction History':'公司银行收付款历史',
      'Loan Applications':'贷款申请','Loan Application':'贷款申请','Loan Review':'贷款审核','Pending Finance':'待财务出款','Payment Requests':'付款申请','Payment History':'付款历史','Waiting Staff Posting':'待客服入账',
      'New Application':'新申请','Under Review':'审核中','Approved':'已通过','Rejected':'已拒绝','Pending':'待处理','Completed':'已完成','Active':'启用','Inactive':'停用',
      'Application ID':'申请编号','Date':'日期','Applicant':'申请人','Phone':'电话','Requested Amount':'申请金额','Status':'状态','Actions':'操作',
      'View':'查看','Edit':'编辑','Delete':'删除','Save':'保存','Cancel':'取消','Close':'关闭','Confirm':'确认','Approve':'批准','Reject':'拒绝','Continue Review':'继续审核',
      'Add Customer':'新增客户','Add Loan':'新增贷款','Add Staff':'新增员工','Create Staff':'建立员工账号','Staff Account':'员工账号','Role':'职位','Permissions':'权限',
      'Full Name':'姓名','IC':'身份证','ID Number':'身份证号码','Address':'地址','Company':'公司','Salary':'工资','Salary Day':'出粮日','Emergency Contact':'紧急联系人',
      'Bank':'银行','Bank Name':'银行名称','Account Name':'户口姓名','Account Number':'户口号码','Bank Statement':'银行流水','Receipt':'收据','Reference No.':'银行参考号','Notes':'备注',
      'Principal':'本金','Interest':'利息','Overdue':'逾期','Settlement':'清账','Settlement Amount':'清账金额','Due Date':'到期日期','Next Due Date':'下一期到期日',
      'Actual Amount Received':'实际到账金额','Received Time':'到账时间','Actual Receiving Bank':'实际收款银行','Confirm Received':'确认已收到','Not Received / Reject':'未收到／拒绝',
      'Start Posting':'开始入账','Confirm Posting':'确认入账','Principal Amount':'本金金额','Interest Amount':'利息金额','Overdue Amount':'逾期金额','Total Classified':'分类总额','Settle This Loan':'本次完成清账',
      'Company Bank Accounts':'公司银行账户','Bank Collection / Disbursement History':'银行收付款历史','All Banks':'全部银行','Collection':'收款','Disbursement':'放款','Operator':'操作人',
      'Employees':'员工','Employee':'员工','Employee Information':'员工资料','My HR':'我的人事','Attendance':'员工出勤','Salary Advance':'预支工资','Salary Advances':'预支工资','Pay Salary':'发工资','Salary History':'工资历史',
      'Company Expenses':'公司开销','Other Income':'其他收入','Profit Report':'盈亏报表','Staff Management':'员工管理','Account & Permissions':'账号与权限',
      'Contact Methods':'联系方式','Defaults':'默认设置','Announcement':'公告','Telegram Bot':'Telegram 机器人','Danger Zone':'危险操作','Production Reset':'正式系统重置',
      'Automatic Assignment':'自动分配','Default Collection Bank':'默认收款银行','Default WhatsApp Contact':'默认 WhatsApp 联系方式','Default Telegram Contact':'默认 Telegram 联系方式',
      'Enable Telegram':'启用 Telegram','Save Telegram Settings':'保存 Telegram 设置','Test Daily Report Group':'测试日报群组','Test Notification Group':'测试通知群组','Send Today’s Report Now':'立即发送今日日报',
      'No records':'暂无记录','No data':'暂无数据','Loading...':'加载中…','No permission':'没有权限','Access denied':'权限不足','Internal staff use only':'仅限内部员工使用',
      'Waiting Finance Confirmation':'等待财务确认','Finance Confirmed':'财务已确认','Waiting Staff Posting':'等待客服入账','Finance Disbursed':'财务已出款','Waiting Finance Disbursement':'等待财务出款',
      'My Loans':'我的贷款','Pay Now':'立即付款','Submit Payment':'提交付款','My Payment Submissions':'我的付款记录','Payment Date':'付款日期','Amount':'金额','Upload Receipt':'上传收据',
      'Pending Finance Confirmation':'待财务确认','Finance Confirmed, Waiting Staff Posting':'财务已确认，待客服入账',
      'English':'English','Simplified Chinese':'简体中文','Malay':'Bahasa Melayu'
    },
    ms: {
      'Finance':'Kewangan','Customer Service':'Khidmat Pelanggan','Super Admin':'Pentadbir Super','Staff':'Kakitangan','Admin':'Pentadbir',
      'Dashboard':'Ringkasan','Customers':'Pelanggan','Customer':'Pelanggan','Loans':'Pinjaman','Loan':'Pinjaman','Payments':'Bayaran','Payment':'Bayaran',
      'Loan Management':'Pengurusan Pinjaman','Loans & Payments':'Pinjaman & Bayaran','Company Management':'Pengurusan Syarikat','Reports & Records':'Laporan & Rekod','System Management':'Pengurusan Sistem',
      'Settings':'Tetapan','Search':'Cari','Sound On':'Bunyi Dihidupkan','Sound Off':'Bunyi Dimatikan','Language':'Bahasa','Logout':'Log Keluar','Login':'Log Masuk',
      'Staff Login':'Log Masuk Kakitangan','Client Login':'Log Masuk Ahli','Username':'Nama Pengguna','Password':'Kata Laluan','Member Portal':'Portal Ahli',
      'Pending Payments':'Bayaran Menunggu Pengesahan','Pending Disbursement':'Menunggu Pengeluaran','Review':'Semakan','Salary':'Gaji','Payroll':'Pengurusan Gaji',
      'Disbursement':'Pengeluaran','Approval':'Semakan','Work':'Kerja','Today':'Hari Ini','Yesterday':'Semalam','This Week':'Minggu Ini','Last Week':'Minggu Lepas','This Month':'Bulan Ini','Last Month':'Bulan Lepas',
      'Apply':'Cari','Date From':'Tarikh Mula','Date To':'Tarikh Tamat','From':'Dari','To':'Hingga',
      'Company Customers':'Jumlah Pelanggan Syarikat','Active Loans':'Pinjaman Aktif','Period Due':'Jumlah Perlu Diterima','Period Collected':'Jumlah Diterima','Total Disbursed':'Jumlah Dikeluarkan','Total Collected':'Jumlah Kutipan','Profit / Loss':'Untung / Rugi',
      'Customer Performance Report':'Laporan Prestasi Khidmat Pelanggan','Customer Service Profit Report':'Laporan Untung Rugi Khidmat Pelanggan','Company Bank Transaction History':'Sejarah Transaksi Bank Syarikat',
      'Loan Applications':'Permohonan Pinjaman','Loan Application':'Permohonan Pinjaman','Loan Review':'Semakan Pinjaman','Pending Finance':'Menunggu Pengeluaran Kewangan','Payment Requests':'Permohonan Bayaran','Payment History':'Sejarah Bayaran','Waiting Staff Posting':'Menunggu Catatan Kakitangan',
      'New Application':'Permohonan Baharu','Under Review':'Dalam Semakan','Approved':'Diluluskan','Rejected':'Ditolak','Pending':'Menunggu','Completed':'Selesai','Active':'Aktif','Inactive':'Tidak Aktif',
      'Application ID':'ID Permohonan','Date':'Tarikh','Applicant':'Pemohon','Phone':'Telefon','Requested Amount':'Jumlah Dipohon','Status':'Status','Actions':'Tindakan',
      'View':'Lihat','Edit':'Sunting','Delete':'Padam','Save':'Simpan','Cancel':'Batal','Close':'Tutup','Confirm':'Sahkan','Approve':'Luluskan','Reject':'Tolak','Continue Review':'Teruskan Semakan',
      'Add Customer':'Tambah Pelanggan','Add Loan':'Tambah Pinjaman','Add Staff':'Tambah Kakitangan','Create Staff':'Cipta Akaun Kakitangan','Staff Account':'Akaun Kakitangan','Role':'Jawatan','Permissions':'Kebenaran',
      'Full Name':'Nama Penuh','IC':'Kad Pengenalan','ID Number':'Nombor Kad Pengenalan','Address':'Alamat','Company':'Syarikat','Salary':'Gaji','Salary Day':'Tarikh Gaji','Emergency Contact':'Hubungan Kecemasan',
      'Bank':'Bank','Bank Name':'Nama Bank','Account Name':'Nama Akaun','Account Number':'Nombor Akaun','Bank Statement':'Penyata Bank','Receipt':'Resit','Reference No.':'Nombor Rujukan Bank','Notes':'Catatan',
      'Principal':'Pokok','Interest':'Faedah','Overdue':'Tertunggak','Settlement':'Penyelesaian','Settlement Amount':'Jumlah Penyelesaian','Due Date':'Tarikh Tamat','Next Due Date':'Tarikh Tamat Seterusnya',
      'Actual Amount Received':'Jumlah Sebenar Diterima','Received Time':'Masa Diterima','Actual Receiving Bank':'Bank Penerima Sebenar','Confirm Received':'Sahkan Diterima','Not Received / Reject':'Tidak Diterima / Tolak',
      'Start Posting':'Mula Catatan','Confirm Posting':'Sahkan Catatan','Principal Amount':'Jumlah Pokok','Interest Amount':'Jumlah Faedah','Overdue Amount':'Jumlah Tertunggak','Total Classified':'Jumlah Klasifikasi','Settle This Loan':'Selesaikan Pinjaman Ini',
      'Company Bank Accounts':'Akaun Bank Syarikat','Bank Collection / Disbursement History':'Sejarah Kutipan / Pengeluaran Bank','All Banks':'Semua Bank','Collection':'Kutipan','Operator':'Pengendali',
      'Employees':'Kakitangan','Employee':'Kakitangan','Employee Information':'Maklumat Kakitangan','My HR':'Sumber Manusia','Attendance':'Kehadiran','Salary Advance':'Pendahuluan Gaji','Salary Advances':'Pendahuluan Gaji','Pay Salary':'Bayar Gaji','Salary History':'Sejarah Gaji',
      'Company Expenses':'Perbelanjaan Syarikat','Other Income':'Pendapatan Lain','Profit Report':'Laporan Untung Rugi','Staff Management':'Pengurusan Kakitangan','Account & Permissions':'Akaun & Kebenaran',
      'Contact Methods':'Kaedah Hubungan','Defaults':'Tetapan Lalai','Announcement':'Pengumuman','Telegram Bot':'Bot Telegram','Danger Zone':'Operasi Berbahaya','Production Reset':'Tetapan Semula Sistem Produksi',
      'Automatic Assignment':'Agihan Automatik','Default Collection Bank':'Bank Kutipan Lalai','Default WhatsApp Contact':'Hubungan WhatsApp Lalai','Default Telegram Contact':'Hubungan Telegram Lalai',
      'Enable Telegram':'Aktifkan Telegram','Save Telegram Settings':'Simpan Tetapan Telegram','Test Daily Report Group':'Uji Kumpulan Laporan Harian','Test Notification Group':'Uji Kumpulan Notifikasi','Send Today’s Report Now':'Hantar Laporan Hari Ini Sekarang',
      'No records':'Tiada rekod','No data':'Tiada data','Loading...':'Memuatkan…','No permission':'Tiada kebenaran','Access denied':'Akses ditolak','Internal staff use only':'Untuk kegunaan kakitangan dalaman sahaja',
      'Waiting Finance Confirmation':'Menunggu Pengesahan Kewangan','Finance Confirmed':'Kewangan Telah Sahkan','Waiting Staff Posting':'Menunggu Catatan Kakitangan','Finance Disbursed':'Kewangan Telah Membayar','Waiting Finance Disbursement':'Menunggu Pembayaran Kewangan',
      'My Loans':'Pinjaman Saya','Pay Now':'Bayar Sekarang','Submit Payment':'Hantar Bayaran','My Payment Submissions':'Rekod Bayaran Saya','Payment Date':'Tarikh Bayaran','Amount':'Jumlah','Upload Receipt':'Muat Naik Resit',
      'Pending Finance Confirmation':'Menunggu Pengesahan Kewangan','Finance Confirmed, Waiting Staff Posting':'Kewangan Telah Sahkan, Menunggu Catatan Kakitangan',
      'English':'English','Simplified Chinese':'简体中文','Malay':'Bahasa Melayu'
    }
  };

  const PLACEHOLDER = {
    zh: {
      'Search loan ID / customer / IC / phone / payment ID':'搜索贷款编号／客户／IC／电话／付款编号',
      'Search Loan ID / Customer / IC / Phone / Payment ID':'搜索用户名／贷款编号／客户／IC／电话／付款编号',
      'example: john':'例如：john','Enter username':'输入用户名','Enter password':'输入密码'
    },
    ms: {
      'Search loan ID / customer / IC / phone / payment ID':'Cari ID pinjaman / pelanggan / IC / telefon / ID bayaran',
      'Search Loan ID / Customer / IC / Phone / Payment ID':'Cari nama pengguna / ID pinjaman / pelanggan / IC / telefon / ID bayaran',
      'example: john':'contoh: john','Enter username':'Masukkan nama pengguna','Enter password':'Masukkan kata laluan'
    }
  };

  const exact = (text, lang) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return null;
    return MAP[lang]?.[clean] || null;
  };

  let running = false;
  function translate(root = document) {
    const lang = window.SWK_LANG?.current || localStorage.getItem('swk_lang') || 'en';
    if (lang === 'en' || !MAP[lang] || running) return;
    running = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const p = node.parentElement;
          if (!p || ['SCRIPT','STYLE','TEXTAREA','OPTION'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          if (p.closest('[contenteditable="true"]')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const raw = node.nodeValue;
        const lead = raw.match(/^\s*/)?.[0] || '';
        const trail = raw.match(/\s*$/)?.[0] || '';
        const translated = exact(raw, lang);
        if (translated) node.nodeValue = lead + translated + trail;
      });

      root.querySelectorAll?.('input[placeholder],textarea[placeholder]').forEach(el => {
        const value = el.getAttribute('placeholder') || '';
        const translated = PLACEHOLDER[lang]?.[value] || exact(value, lang);
        if (translated) el.setAttribute('placeholder', translated);
      });
      root.querySelectorAll?.('[title]').forEach(el => {
        const value = el.getAttribute('title') || '';
        const translated = exact(value, lang);
        if (translated) el.setAttribute('title', translated);
      });
      root.querySelectorAll?.('option').forEach(el => {
        const translated = exact(el.textContent, lang);
        if (translated) el.textContent = translated;
      });
    } finally {
      running = false;
    }
  }

  let timer;
  const schedule = root => {
    clearTimeout(timer);
    timer = setTimeout(() => translate(root || document), 40);
  };

  document.addEventListener('DOMContentLoaded', () => {
    translate(document);
    const observer = new MutationObserver(mutations => {
      if (running) return;
      const target = mutations.find(m => m.addedNodes?.length || m.type === 'characterData')?.target;
      schedule(target?.nodeType === 1 ? target : document);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  window.addEventListener('swk-language-applied', () => schedule(document));
  window.WL_TRANSLATE_UI = translate;
})();

;

