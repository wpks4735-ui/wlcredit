const cfg=window.SWK_CONFIG||{},$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
// Expose the single Supabase client for separately loaded workflow modules.
window.sb=sb;
window.__wlSupabase=sb;
const tr=(k,v)=>SWK_LANG.t(k,v);

async function invokeStaffAdmin(payload){
 const {data:{session},error:sessionError}=await sb.auth.getSession();
 if(sessionError)throw sessionError;
 if(!session?.access_token){
  await sb.auth.signOut();
  throw new Error(SWK_LANG.current==='zh'?'登录已失效，请重新登录。':SWK_LANG.current==='ms'?'Sesi log masuk telah tamat. Sila log masuk semula.':'Your login session has expired. Please sign in again.');
 }
 const result=await sb.functions.invoke('staff-admin',{
  body:payload,
  headers:{Authorization:`Bearer ${session.access_token}`}
 });
 if(result?.error){
  let detail='';
  try{detail=await result.error.context?.json?.();}catch(_e){}
  const message=detail?.error||detail?.message||result.error.message||'Edge Function request failed';
  return {data:detail||null,error:new Error(message)};
 }
 return result;
}

const V10_TEXT={
 en:{loanApplications:'Loan Applications',reports:'Reports',systemSettings:'System Settings',auditLog:'Audit Log',reportsCenter:'Reports Center',from:'From',to:'To',today:'Today',thisMonth:'This Month',downloadExcel:'Download Excel',downloadPdf:'Download PDF',collectionBanks:'Collection Banks',contactMethods:'Contact Methods',defaults:'Defaults',announcement:'Announcement',automaticAssignment:'Automatic Assignment',defaultCollectionBank:'Default Collection Bank',defaultWhatsappContact:'Default WhatsApp Contact',defaultTelegramContact:'Default Telegram Contact',autoAssignNewCustomers:'Automatically assign defaults to new customers',saveDefaults:'Save Defaults',defaultsHelp:"Defaults are stored on the customer. Additional loans for the same customer continue using that customer's assigned bank and contacts.",unassigned:'Unassigned',addBankFirst:'Add a collection bank first',addWhatsappFirst:'Add a WhatsApp contact first',addTelegramFirst:'Add a Telegram contact first',loans:'Loans',disbursed:'Disbursed',interest:'Interest',collected:'Collected',overdue:'Overdue',loanDetails:'Loan Details',customer:'Customer',principal:'Principal',dueDate:'Due Date',status:'Status',noRecords:'No records',settlement:'Settlement',disbursementDate:'Disbursement Date',paymentDate:'Payment Date',collector:'Collector',report:'Report',summary:'Summary',dangerZone:'Danger Zone',productionReset:'Production Reset',dangerWarning:'Only the Super Admin can permanently delete business records. System settings, staff accounts, collection banks and contact methods will be kept.',resetConfirm:'Type RESET WL CREDIT to continue',resetFinal:'This action cannot be undone. Permanently delete all business records?',resetDone:'Production data has been reset.',superAdmin:'Super Admin'},
 zh:{loanApplications:'贷款申请',reports:'报表中心',systemSettings:'系统设置',auditLog:'操作记录',reportsCenter:'报表中心',from:'开始日期',to:'结束日期',today:'今天',thisMonth:'本月',downloadExcel:'下载 Excel',downloadPdf:'下载 PDF',collectionBanks:'收款银行',contactMethods:'联系方式',defaults:'默认设置',announcement:'公告',automaticAssignment:'自动分配',defaultCollectionBank:'默认收款银行',defaultWhatsappContact:'默认 WhatsApp 联系方式',defaultTelegramContact:'默认 Telegram 联系方式',autoAssignNewCustomers:'自动分配默认资料给新客户',saveDefaults:'保存默认设置',defaultsHelp:'默认资料会保存到客户层级。同一客户后续新增贷款时，会继续使用该客户已分配的收款银行和联系方式。',unassigned:'未分配',addBankFirst:'请先在“收款银行”添加资料',addWhatsappFirst:'请先在“联系方式”添加 WhatsApp',addTelegramFirst:'请先在“联系方式”添加 Telegram',loans:'贷款笔数',disbursed:'放款金额',interest:'利息',collected:'收款金额',overdue:'逾期',loanDetails:'贷款明细',customer:'客户',principal:'本金',dueDate:'到期日期',status:'状态',noRecords:'没有记录',settlement:'应还金额',disbursementDate:'放款日期',paymentDate:'付款日期',collector:'收款人',report:'报表',summary:'摘要',dangerZone:'危险区域',productionReset:'正式数据重置',dangerWarning:'只有最高管理员可以永久删除业务记录。系统设置、员工账号、收款银行和联系方式会保留。',resetConfirm:'请输入 RESET WL CREDIT 继续',resetFinal:'此操作无法撤销。确定永久删除所有业务记录吗？',resetDone:'正式业务数据已清空。',superAdmin:'最高管理员'},
 ms:{loanApplications:'Permohonan Pinjaman',reports:'Pusat Laporan',systemSettings:'Tetapan Sistem',auditLog:'Log Aktiviti',reportsCenter:'Pusat Laporan',from:'Tarikh Mula',to:'Tarikh Akhir',today:'Hari Ini',thisMonth:'Bulan Ini',downloadExcel:'Muat Turun Excel',downloadPdf:'Muat Turun PDF',collectionBanks:'Bank Kutipan',contactMethods:'Kaedah Hubungan',defaults:'Tetapan Lalai',announcement:'Pengumuman',automaticAssignment:'Pengagihan Automatik',defaultCollectionBank:'Bank Kutipan Lalai',defaultWhatsappContact:'Hubungan WhatsApp Lalai',defaultTelegramContact:'Hubungan Telegram Lalai',autoAssignNewCustomers:'Agihkan tetapan lalai secara automatik kepada pelanggan baharu',saveDefaults:'Simpan Tetapan Lalai',defaultsHelp:'Tetapan lalai disimpan pada pelanggan. Pinjaman tambahan untuk pelanggan yang sama akan terus menggunakan bank dan hubungan yang telah ditetapkan.',unassigned:'Belum ditetapkan',addBankFirst:'Tambah bank kutipan terlebih dahulu',addWhatsappFirst:'Tambah hubungan WhatsApp terlebih dahulu',addTelegramFirst:'Tambah hubungan Telegram terlebih dahulu',loans:'Pinjaman',disbursed:'Jumlah Dikeluarkan',interest:'Faedah',collected:'Jumlah Dikutip',overdue:'Tertunggak',loanDetails:'Butiran Pinjaman',customer:'Pelanggan',principal:'Pokok',dueDate:'Tarikh Matang',status:'Status',noRecords:'Tiada rekod',settlement:'Jumlah Penyelesaian',disbursementDate:'Tarikh Pengeluaran',paymentDate:'Tarikh Bayaran',collector:'Penerima Bayaran',report:'Laporan',summary:'Ringkasan',dangerZone:'Zon Bahaya',productionReset:'Tetapan Semula Produksi',dangerWarning:'Hanya Super Admin boleh memadam rekod perniagaan secara kekal. Tetapan sistem, akaun staf, bank kutipan dan kaedah hubungan akan dikekalkan.',resetConfirm:'Taip RESET WL CREDIT untuk meneruskan',resetFinal:'Tindakan ini tidak boleh dibatalkan. Padam semua rekod perniagaan secara kekal?',resetDone:'Data produksi telah ditetapkan semula.',superAdmin:'Super Admin'}
};
function v10t(k){return (V10_TEXT[SWK_LANG.current]||V10_TEXT.en)[k]||V10_TEXT.en[k]||k}

// Build customer-level assignment dropdowns for receiving banks and contact channels.
function assignmentOptions(items=[],currentValue=null,defaultValue=null,emptyKey=null){
 const list=Array.isArray(items)?items.filter(Boolean):[];
 const selectedValue=currentValue||defaultValue||'';
 const unassignedLabel=v10t('unassigned');
 if(!list.length){
  const message=emptyKey?v10t(emptyKey):unassignedLabel;
  return `<option value="">${esc(message)}</option>`;
 }
 const options=list.map(item=>{
  const id=String(item.id??'');
  const label=item.bank_name
   ? `${item.bank_name}${item.account_number?` · ${item.account_number}`:''}${item.account_name?` · ${item.account_name}`:''}`
   : `${item.label||item.channel_type||''}${item.contact_value?` · ${item.contact_value}`:''}`;
  return `<option value="${esc(id)}" ${String(selectedValue)===id?'selected':''}>${esc(label)}</option>`;
 }).join('');
 return `<option value="" ${selectedValue?'':'selected'}>${esc(unassignedLabel)}</option>${options}`;
}

const V12_NAV_TEXT={
 en:{loanManagement:'Loan Management',companyManagement:'Company Management',reportsManagement:'Reports & Records',systemManagement:'System Management'},
 zh:{loanManagement:'贷款管理',companyManagement:'公司管理',reportsManagement:'报表与记录',systemManagement:'系统管理'},
 ms:{loanManagement:'Pengurusan Pinjaman',companyManagement:'Pengurusan Syarikat',reportsManagement:'Laporan & Rekod',systemManagement:'Pengurusan Sistem'}
};
function applyV12NavLabels(){const m=V12_NAV_TEXT[SWK_LANG.current]||V12_NAV_TEXT.en;document.querySelectorAll('[data-nav-label]').forEach(el=>el.textContent=m[el.dataset.navLabel]||el.dataset.navLabel)}
function openParentNavGroup(button){document.querySelectorAll('.nav-group').forEach(g=>g.classList.remove('open'));const group=button?.closest('.nav-group');if(group)group.classList.add('open')}

const V11_TEXT={
 en:{companyManagement:'Company Management',employees:'Employees',payroll:'Payroll',expenses:'Expenses',income:'Income',attendance:'Attendance',salaryAdvances:'Salary Advances',profitLoss:'Profit & Loss',addEmployee:'+ Add Employee',addPayroll:'+ Add Payroll',addExpense:'+ Add Expense',addIncome:'+ Add Income',addAttendance:'+ Add Attendance',addAdvance:'+ Add Advance',employeeId:'Employee ID',name:'Name',position:'Position',department:'Department',phone:'Phone',basicSalary:'Basic Salary',status:'Status',actions:'Actions',month:'Month',employee:'Employee',basic:'Basic',additions:'Additions',deductions:'Deductions',netSalary:'Net Salary',companyExpenses:'Company Expenses',otherIncome:'Other Income',date:'Date',category:'Category',description:'Description',amount:'Amount',paymentMethod:'Payment Method',clockIn:'Clock In',clockOut:'Clock Out',notes:'Notes',reason:'Reason',deductionMonth:'Deduction Month',view:'View',edit:'Edit',add:'Add',save:'Save',noRecords:'No records',fullName:'Full Name',icPassport:'IC / Passport',joinDate:'Join Date',bankName:'Bank Name',bankAccount:'Bank Account',addressNotes:'Address / Notes',active:'Active',inactive:'Inactive',terminated:'Terminated',allowance:'Allowance',commission:'Commission',bonus:'Bonus',overtime:'Overtime',salaryAdvanceDeduction:'Salary Advance Deduction',paymentStatus:'Payment Status',paymentDate:'Payment Date',pending:'Pending',paid:'Paid',expense:'Expense',present:'Present',late:'Late',leave:'Leave',absent:'Absent',off:'Off',deducted:'Deducted',cancelled:'Cancelled',salaryAdvance:'Salary Advance',loanCollections:'Loan Collections',payrollPaid:'Payroll Paid',otherExpenses:'Other Expenses',netProfitLoss:'Net Profit / Loss',paySalary:'Pay Salary',payrollDate:'Payroll Date',outstandingAdvance:'Outstanding Salary Advance',calculatedSalary:'Salary to Pay',advanceAutoDeduct:'Automatically deducted from outstanding advances',myHr:'My HR',myProfile:'My Employee Profile',saveMyProfile:'Save My Profile',requestAdvance:'Request Salary Advance',myAdvanceRequests:'My Advance Requests',requested:'Requested',approved:'Approved',rejected:'Rejected',approve:'Approve',reject:'Reject',advanceRequestNotice:'New salary advance request',staffLogin:'Staff Login',username:'Username',loginPassword:'Login Password',confirmPassword:'Confirm Password',staffRole:'Staff Role',notLinked:'Not linked',advanceIncluded:'Approved or unlinked deducted advances will be included',saved:'Saved successfully'},
 zh:{companyManagement:'公司管理',employees:'员工资料',payroll:'工资管理',expenses:'公司开销',income:'其他收入',attendance:'员工出勤',salaryAdvances:'预支工资',profitLoss:'损益报表',addEmployee:'+ 新增员工',addPayroll:'+ 新增工资',addExpense:'+ 新增开销',addIncome:'+ 新增收入',addAttendance:'+ 新增出勤',addAdvance:'+ 新增预支',employeeId:'员工编号',name:'姓名',position:'职位',department:'部门',phone:'电话号码',basicSalary:'基本工资',status:'状态',actions:'操作',month:'月份',employee:'员工',basic:'基本工资',additions:'增加项目',deductions:'扣款',netSalary:'实发工资',companyExpenses:'公司开销',otherIncome:'其他收入',date:'日期',category:'类别',description:'说明',amount:'金额',paymentMethod:'付款方式',clockIn:'上班时间',clockOut:'下班时间',notes:'备注',reason:'原因',deductionMonth:'扣除月份',view:'查看',edit:'编辑',add:'新增',save:'保存',noRecords:'没有记录',fullName:'姓名',icPassport:'IC / 护照',joinDate:'入职日期',bankName:'银行名称',bankAccount:'银行户口',addressNotes:'地址 / 备注',active:'在职',inactive:'停用',terminated:'离职',allowance:'津贴',commission:'佣金',bonus:'奖金',overtime:'加班费',salaryAdvanceDeduction:'预支工资扣除',paymentStatus:'发薪状态',paymentDate:'发薪日期',pending:'待处理',paid:'已支付',expense:'开销',present:'出勤',late:'迟到',leave:'请假',absent:'缺勤',off:'休息',deducted:'已扣除',cancelled:'已取消',salaryAdvance:'预支工资',loanCollections:'贷款收款',payrollPaid:'已付工资',otherExpenses:'其他开销',netProfitLoss:'净利润 / 亏损',paySalary:'付工资',payrollDate:'工资日期',outstandingAdvance:'未扣除预支工资',calculatedSalary:'应付工资',advanceAutoDeduct:'将自动从未扣除的预支工资中扣除',myHr:'我的人事',myProfile:'我的员工资料',saveMyProfile:'保存我的资料',requestAdvance:'申请预支工资',myAdvanceRequests:'我的预支申请',requested:'待审批',approved:'已批准',rejected:'已拒绝',approve:'批准',reject:'拒绝',advanceRequestNotice:'新的预支工资申请',staffLogin:'员工登录账号',username:'员工账号',loginPassword:'登录密码',confirmPassword:'确认密码',staffRole:'员工角色',notLinked:'未绑定',advanceIncluded:'已批准或尚未关联工资单的“已扣除”预支都会自动计入',saved:'保存成功'},
 ms:{companyManagement:'Pengurusan Syarikat',employees:'Pekerja',payroll:'Gaji',expenses:'Perbelanjaan',income:'Pendapatan',attendance:'Kehadiran',salaryAdvances:'Pendahuluan Gaji',profitLoss:'Untung & Rugi',addEmployee:'+ Tambah Pekerja',addPayroll:'+ Tambah Gaji',addExpense:'+ Tambah Perbelanjaan',addIncome:'+ Tambah Pendapatan',addAttendance:'+ Tambah Kehadiran',addAdvance:'+ Tambah Pendahuluan',employeeId:'ID Pekerja',name:'Nama',position:'Jawatan',department:'Jabatan',phone:'Telefon',basicSalary:'Gaji Asas',status:'Status',actions:'Tindakan',month:'Bulan',employee:'Pekerja',basic:'Asas',additions:'Tambahan',deductions:'Potongan',netSalary:'Gaji Bersih',companyExpenses:'Perbelanjaan Syarikat',otherIncome:'Pendapatan Lain',date:'Tarikh',category:'Kategori',description:'Keterangan',amount:'Jumlah',paymentMethod:'Kaedah Bayaran',clockIn:'Masa Masuk',clockOut:'Masa Keluar',notes:'Catatan',reason:'Sebab',deductionMonth:'Bulan Potongan',view:'Lihat',edit:'Edit',add:'Tambah',save:'Simpan',noRecords:'Tiada rekod',fullName:'Nama Penuh',icPassport:'IC / Pasport',joinDate:'Tarikh Mula',bankName:'Nama Bank',bankAccount:'Akaun Bank',addressNotes:'Alamat / Catatan',active:'Aktif',inactive:'Tidak Aktif',terminated:'Berhenti',allowance:'Elaun',commission:'Komisen',bonus:'Bonus',overtime:'Kerja Lebih Masa',salaryAdvanceDeduction:'Potongan Pendahuluan Gaji',paymentStatus:'Status Bayaran',paymentDate:'Tarikh Bayaran',pending:'Belum Selesai',paid:'Dibayar',expense:'Perbelanjaan',present:'Hadir',late:'Lewat',leave:'Cuti',absent:'Tidak Hadir',off:'Rehat',deducted:'Dipotong',cancelled:'Dibatalkan',salaryAdvance:'Pendahuluan Gaji',loanCollections:'Kutipan Pinjaman',payrollPaid:'Gaji Dibayar',otherExpenses:'Perbelanjaan Lain',netProfitLoss:'Untung / Rugi Bersih',paySalary:'Bayar Gaji',payrollDate:'Tarikh Gaji',outstandingAdvance:'Pendahuluan Gaji Belum Dipotong',calculatedSalary:'Gaji Perlu Dibayar',advanceAutoDeduct:'Akan ditolak secara automatik daripada pendahuluan tertunggak',myHr:'HR Saya',myProfile:'Profil Pekerja Saya',saveMyProfile:'Simpan Profil Saya',requestAdvance:'Mohon Pendahuluan Gaji',myAdvanceRequests:'Permohonan Pendahuluan Saya',requested:'Menunggu Kelulusan',approved:'Diluluskan',rejected:'Ditolak',approve:'Luluskan',reject:'Tolak',advanceRequestNotice:'Permohonan pendahuluan gaji baharu',staffLogin:'Akaun Log Masuk Staf',username:'Nama Pengguna',loginPassword:'Kata Laluan',confirmPassword:'Sahkan Kata Laluan',staffRole:'Peranan Staf',notLinked:'Belum dipautkan',advanceIncluded:'Pendahuluan diluluskan atau dipotong tanpa rekod gaji akan dimasukkan',saved:'Berjaya disimpan'}
};
Object.assign(V11_TEXT.en,{todayAttendance:'Today Attendance',notCheckedIn:'Not checked in',checkedIn:'Checked in',completed:'Completed',checkIn:'Check In',checkOut:'Check Out',checkInTime:'Check-in time',checkOutTime:'Check-out time',attendanceProfileRequired:'Complete your employee profile before clocking in.',alreadyCheckedIn:'You have already checked in today.',alreadyCheckedOut:'You have already checked out today.',checkInSuccess:'Checked in successfully.',checkOutSuccess:'Checked out successfully.'});
Object.assign(V11_TEXT.zh,{todayAttendance:'今日打卡',notCheckedIn:'尚未上班打卡',checkedIn:'已上班打卡',completed:'今日打卡已完成',checkIn:'上班打卡',checkOut:'下班打卡',checkInTime:'上班时间',checkOutTime:'下班时间',attendanceProfileRequired:'请先完成员工资料，才能打卡。',alreadyCheckedIn:'你今天已经完成上班打卡。',alreadyCheckedOut:'你今天已经完成下班打卡。',checkInSuccess:'上班打卡成功。',checkOutSuccess:'下班打卡成功。'});
Object.assign(V11_TEXT.ms,{todayAttendance:'Kehadiran Hari Ini',notCheckedIn:'Belum daftar masuk',checkedIn:'Sudah daftar masuk',completed:'Kehadiran hari ini selesai',checkIn:'Daftar Masuk',checkOut:'Daftar Keluar',checkInTime:'Masa masuk',checkOutTime:'Masa keluar',attendanceProfileRequired:'Lengkapkan profil pekerja sebelum merekod kehadiran.',alreadyCheckedIn:'Anda sudah daftar masuk hari ini.',alreadyCheckedOut:'Anda sudah daftar keluar hari ini.',checkInSuccess:'Daftar masuk berjaya.',checkOutSuccess:'Daftar keluar berjaya.'});
function v11t(k){return (V11_TEXT[SWK_LANG.current]||V11_TEXT.en)[k]||V11_TEXT.en[k]||k}
function applyV11Labels(){applyV12NavLabels();document.querySelectorAll('[data-v11]').forEach(el=>{el.textContent=v11t(el.dataset.v11)});const active=document.querySelector('#nav button.active');if(active&&document.querySelector('#pageTitle'))document.querySelector('#pageTitle').textContent=active.textContent.replace('🔒','').trim();}
function companyStatus(v){return v11t(v)||v}
function applyV10Labels(){document.querySelectorAll('[data-v10]').forEach(el=>{el.textContent=v10t(el.dataset.v10)});}
const state={staff:null,applications:[],applicationFilter:'pending',customers:[],loans:[],repayments:[],banks:[],contacts:[],staffList:[],submissions:[],documents:[],audit:[],settings:null,filter:'all',notificationsReady:false,knownPendingIds:new Set(),knownApplicationIds:new Set(),knownAdvanceRequestIds:new Set(),employees:[],payroll:[],expenses:[],companyIncome:[],attendance:[],salaryAdvances:[],paymentChannel:null,applicationChannel:null,advanceChannel:null,notificationPoll:null,audioContext:null,soundEnabled:localStorage.getItem('wl_notification_sound')==='1',dateFrom:null,dateTo:null,datePreset:'today'};
// Shared live state for separately loaded workflow modules (loan review, finance, dashboard).
window.state=state;
window.__wlState=state;
const PERMS={applications_view:'perm_applications_view',applications_claim:'perm_applications_claim',applications_approve:'perm_applications_approve',applications_reject:'perm_applications_reject',customers_view:'perm_customers_view',customers_create:'perm_customers_create',customers_edit:'perm_customers_edit',customers_files_view:'perm_customers_files_view',customers_files_upload:'perm_customers_files_upload',customers_files_delete:'perm_customers_files_delete',loans_view:'perm_loans_view',loans_create:'perm_loans_create',loans_edit:'perm_loans_edit',banks_manage:'perm_banks_manage',banks_assign:'perm_banks_assign',contacts_manage:'perm_contacts_manage',contacts_assign:'perm_contacts_assign',payments_view:'perm_payments_view',payments_approve_partial:'perm_payments_approve_partial',payments_approve_renew:'perm_payments_approve_renew',payments_approve_settle:'perm_payments_approve_settle',payments_reject:'perm_payments_reject',reports_view:'perm_reports_view',staff_manage:'perm_staff_manage',settings_manage:'perm_settings_manage',company_view:'perm_company_view',company_manage:'perm_company_manage',payroll_view:'perm_payroll_view',payroll_manage:'perm_payroll_manage'};
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function money(v){return new Intl.NumberFormat(SWK_LANG.current==='ms'?'ms-MY':SWK_LANG.current==='zh'?'zh-MY':'en-MY',{style:'currency',currency:'MYR'}).format(Number(v||0))}
function datetime(v){if(!v)return '-';return new Intl.DateTimeFormat(SWK_LANG.current==='ms'?'ms-MY':SWK_LANG.current==='zh'?'zh-MY':'en-MY',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}
function date(v){return v?new Intl.DateTimeFormat(SWK_LANG.current==='ms'?'ms-MY':SWK_LANG.current==='zh'?'zh-MY':'en-MY').format(new Date(v+(String(v).length===10?'T00:00:00':''))):'-'}
function isoToday(){return new Date().toISOString().slice(0,10)}
function addDays(v,n){const d=new Date(v+'T00:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function localISO(d){const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)}
function getRange(name){const now=new Date(),day=now.getDay()||7,start=new Date(now),end=new Date(now);if(name==='today'){}else if(name==='yesterday'){start.setDate(start.getDate()-1);end.setDate(end.getDate()-1)}else if(name==='thisWeek'){start.setDate(start.getDate()-day+1)}else if(name==='lastWeek'){start.setDate(start.getDate()-day-6);end.setDate(end.getDate()-day)}else if(name==='thisMonth'){start.setDate(1)}else if(name==='lastMonth'){start.setMonth(start.getMonth()-1,1);end.setDate(0)}return [localISO(start),localISO(end)]}
function inRange(v){if(!v)return false;const x=String(v).slice(0,10);return (!state.dateFrom||x>=state.dateFrom)&&(!state.dateTo||x<=state.dateTo)}
function setDateRange(from,to,preset='custom'){state.dateFrom=from;state.dateTo=to;state.datePreset=preset;const f=$('#dateFrom'),t=$('#dateTo'),label=$('#activeDateLabel');if(f)f.value=from;if(t)t.value=to;if(label)label.textContent=`${from} ${SWK_LANG.current==='zh'?'至':SWK_LANG.current==='ms'?'hingga':'to'} ${to}`;$$('.date-preset').forEach(b=>b.classList.toggle('active',b.dataset.range===preset));renderStats();renderBankCollectionTotals();renderReports()}
function auditEntity(a){return a.entity_type||a.table_name||a.entity||'-'}
function auditDetail(a){const v=a.details||a.metadata||a.new_values||a.changes||a.description||'';return typeof v==='string'?v:JSON.stringify(v)}

function toast(msg,error=false){const e=$('#toast');e.textContent=msg;e.className='toast show'+(error?' error':'');setTimeout(()=>e.className='toast',3000)}
function modal(html){$('#modalBody').innerHTML=html;$('#modal').classList.add('show')}
window.closeModal=()=>$('#modal').classList.remove('show');
function normalizedRole(v){return String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_')}
function isSuperAdmin(){return ['super_admin','superadmin'].includes(normalizedRole(state.staff?.role))}
function isAdminLevel(){return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(normalizedRole(state.staff?.role))}
function canSeeAllCustomers(){return isSuperAdmin()||normalizedRole(state.staff?.role)==='finance'}
function isMine(row){return String(row?.owner_staff_id||row?.claimed_by||'')===String(state.staff?.user_id||'')}
function contactOwnerId(row){return String(row?.owner_staff_id||'')}
function canManageContact(row){return isSuperAdmin()||contactOwnerId(row)===String(state.staff?.user_id||'')}
function contactOwnerLabel(row){const owner=state.staffList.find(x=>String(x.user_id)===contactOwnerId(row));return owner?(owner.staff_code?`${owner.staff_code} · ${owner.full_name||owner.username||''}`:(owner.full_name||owner.username||'-')):(SWK_LANG.current==='zh'?'未分配':SWK_LANG.current==='ms'?'Belum ditetapkan':'Unassigned')}
function contactsForOwner(type,ownerId){return state.contacts.filter(x=>x.channel_type===type&&(!ownerId||String(x.owner_staff_id||'')===String(ownerId)))}
function applicationVisible(a){return isSuperAdmin()||String(a.status||'pending')==='pending'||isMine(a)}
function has(p){return isSuperAdmin()||state.staff?.role==='admin'||state.staff?.permissions?.[p]===true}
function requirePerm(p){if(has(p))return true;toast(tr('noAccess'),true);return false}
function lock(el,p){if(!el)return;const ok=has(p);el.classList.remove('locked');el.classList.toggle('no-permission',!ok);el.disabled=!ok;el.title=ok?'':tr('noAccess')}
function loanStatus(l){return l.status==='paid'?tr('settled'):l.status==='cancelled'?tr('cancelled'):(l.due_date<isoToday()?tr('overdue'):tr('inProgress'))}
async function loadAll(){
 const qs=await Promise.all([
  sb.from('loan_applications').select('*').order('created_at',{ascending:false}),
  sb.from('customers').select('*,receiving_bank:receiving_banks!customers_assigned_bank_id_fkey(bank_name,account_name,account_number),whatsapp_contact:contact_channels!customers_assigned_whatsapp_id_fkey(label,channel_type,contact_value),telegram_contact:contact_channels!customers_assigned_telegram_id_fkey(label,channel_type,contact_value)').order('created_at',{ascending:false}),
  sb.from('loans').select('*,customers(full_name,customer_code,phone,assigned_bank_id)').order('created_at',{ascending:false}),
  sb.from('repayments').select('*,loans(loan_id,customer_id,customers(full_name)),staff_profiles(full_name)').order('payment_date',{ascending:false}),
  sb.from('receiving_banks').select('*').order('created_at',{ascending:false}),
  sb.from('contact_channels').select('*').order('created_at',{ascending:false}),
  sb.from('staff_profiles').select('*').order('created_at'),
  sb.from('payment_submissions').select('*,customers(full_name,customer_code),loans(loan_id,settlement_amount,current_due_amount,current_paid_amount)').order('created_at',{ascending:false}),
  sb.from('customer_documents').select('*').order('created_at',{ascending:false}),
  sb.from('audit_logs').select('*,staff_profiles(full_name)').order('created_at',{ascending:false}).limit(500),
  sb.from('employees').select('*').order('created_at',{ascending:false}),
  sb.from('payroll_records').select('*,employees(full_name,employee_code)').order('payroll_month',{ascending:false}),
  sb.from('company_expenses').select('*').order('expense_date',{ascending:false}),
  sb.from('company_income').select('*').order('income_date',{ascending:false}),
  sb.from('attendance_records').select('*,employees(full_name,employee_code)').order('attendance_date',{ascending:false}),
  sb.from('salary_advances').select('*,employees(full_name,employee_code)').order('advance_date',{ascending:false}),
  sb.from('app_settings').select('*').eq('id',1).maybeSingle(),
  sb.from('telegram_settings').select('*').eq('id',1).maybeSingle()
 ]);
 const loadNames=['loan_applications','customers','loans','repayments','receiving_banks','contact_channels','staff_profiles','payment_submissions','customer_documents','audit_logs','employees','payroll_records','company_expenses','company_income','attendance_records','salary_advances','app_settings','telegram_settings'];
 const loadErrors=[];
 qs.forEach((q,i)=>{if(q?.error){console.error('WL Credit load failed:',loadNames[i],q.error);loadErrors.push(`${loadNames[i]}: ${q.error.message||q.error.code||'load failed'}`)}});
 [state.applications,state.customers,state.loans,state.repayments,state.banks,state.contacts,state.staffList,state.submissions,state.documents,state.audit,state.employees,state.payroll,state.expenses,state.companyIncome,state.attendance,state.salaryAdvances]=qs.slice(0,16).map(x=>x?.error?[]:(x?.data||[]));state.settings=qs[16]?.error?null:qs[16]?.data;state.telegramSettings=qs[17]?.error?null:(qs[17]?.data||null);state.loadErrors=loadErrors;
 if(!canSeeAllCustomers()){
  state.applications=state.applications.filter(applicationVisible);
  state.customers=state.customers.filter(isMine);
  const customerIds=new Set(state.customers.map(x=>String(x.id)));
  state.loans=state.loans.filter(x=>customerIds.has(String(x.customer_id)));
  const loanIds=new Set(state.loans.map(x=>String(x.id)));
  state.repayments=state.repayments.filter(x=>loanIds.has(String(x.loan_id)));
  state.submissions=state.submissions.filter(x=>customerIds.has(String(x.customer_id))||loanIds.has(String(x.loan_id)));
  state.documents=state.documents.filter(x=>customerIds.has(String(x.customer_id)));
  state.contacts=state.contacts.filter(x=>String(x.owner_staff_id||'')===String(state.staff?.user_id||''));
 }
 rememberPendingAndNotify();
 renderAll();
 // Notify separately loaded dashboard modules only after the fresh data has been assigned.
 // This prevents the statistics page from staying at its initial zero placeholders
 // until the user clicks somewhere on the page.
 try{
  document.dispatchEvent(new CustomEvent('wl:data-loaded',{detail:{loadedAt:Date.now()}}));
 }catch(_){
  document.dispatchEvent(new Event('wl:data-loaded'));
 }
 if(loadErrors.length){
  const msg=(SWK_LANG.current==='zh'?'部分资料读取失败：':SWK_LANG.current==='ms'?'Sebahagian data gagal dimuatkan: ':'Some data could not be loaded: ')+loadErrors.slice(0,3).join(' | ');
  toast(msg,true);
 }
 const saved=localStorage.getItem('wl_active_section');if(saved){const btn=$(`#nav button[data-section="${saved}"]`);const sec=$('#'+saved);if(btn&&sec){$$('.nav button[data-section],.section').forEach(x=>x.classList.remove('active'));btn.classList.add('active');sec.classList.add('active');openParentNavGroup(btn);if($('#pageTitle'))$('#pageTitle').textContent=btn.textContent.replace('🔒','').trim()}}
}

function canReceiveAdvanceNotifications(){return isAdminLevel()}
function requestedSalaryAdvances(){return canReceiveAdvanceNotifications()?state.salaryAdvances.filter(x=>String(x.status||'').trim().toLowerCase()==='requested'):[]}
function pendingLoanApplications(){return state.applications.filter(x=>String(x.status||'pending').toLowerCase()==='pending')}
function pendingPaymentSubmissions(){return state.submissions.filter(x=>String(x.status||'pending').toLowerCase()==='pending')}
function renderNotifications(){
 const loans=pendingLoanApplications().length,payments=pendingPaymentSubmissions().length,advances=requestedSalaryAdvances().length;
 const count=loans+payments+advances,bell=$('#notificationBell'),badge=$('#notificationBadge');
 if(badge)badge.textContent=count>99?'99+':count;
 if(bell){bell.classList.toggle('hidden',count===0);bell.setAttribute('aria-label',notificationCenterText('title'))}
 const navBadge=$('#navPaymentBadge');if(navBadge){navBadge.textContent=payments>99?'99+':payments;navBadge.classList.toggle('hidden',payments===0)}
}
function notificationCenterText(k){const m={
 en:{title:'Notification Center',loans:'New Loan Applications',payments:'Payments Pending Review',advances:'Salary Advance Requests',open:'Open',none:'No pending notifications'},
 zh:{title:'通知中心',loans:'新的贷款申请',payments:'待审核付款',advances:'预支工资申请',open:'查看',none:'暂无待处理通知'},
 ms:{title:'Pusat Notifikasi',loans:'Permohonan Pinjaman Baharu',payments:'Bayaran Menunggu Semakan',advances:'Permohonan Pendahuluan Gaji',open:'Buka',none:'Tiada notifikasi tertunggak'}
 };return (m[SWK_LANG.current]||m.en)[k]}
function openNotificationCenter(){
 const loans=pendingLoanApplications().length,payments=pendingPaymentSubmissions().length,advances=requestedSalaryAdvances().length;
 const rows=[];
 if(loans)rows.push(`<button class="notification-row" onclick="openLoanApplicationNotifications()"><span>📄 ${notificationCenterText('loans')}</span><strong>${loans}</strong></button>`);
 if(payments)rows.push(`<button class="notification-row" onclick="closeModal();openPendingPayments()"><span>💳 ${notificationCenterText('payments')}</span><strong>${payments}</strong></button>`);
 if(advances)rows.push(`<button class="notification-row" onclick="closeModal();openSalaryAdvanceNotifications()"><span>💰 ${notificationCenterText('advances')}</span><strong>${advances}</strong></button>`);
 modal(`<h2>${notificationCenterText('title')}</h2><div class="notification-list">${rows.join('')||`<p class="muted">${notificationCenterText('none')}</p>`}</div>`)
}
function openLoanApplicationNotifications(){
 closeModal();state.applicationFilter='pending';$$('.application-filter').forEach(b=>b.classList.toggle('active',b.dataset.status==='pending'));
 $$('.nav button[data-section],.section').forEach(x=>x.classList.remove('active'));
 const nav=$('#nav button[data-section="loanApplications"]');if(nav){nav.classList.add('active');openParentNavGroup(nav)}
 const section=$('#loanApplications');if(section)section.classList.add('active');$('#pageTitle').textContent=v10t('loanApplications');renderApplications();
}
function openSalaryAdvanceNotifications(){
 if(!canReceiveAdvanceNotifications())return;
 $$('.nav button[data-section],.section').forEach(x=>x.classList.remove('active'));
 const nav=$('#nav button[data-section="companyManagement"]');if(nav){nav.classList.add('active');openParentNavGroup(nav)}
 const section=$('#companyManagement');if(section)section.classList.add('active');
 $('#pageTitle').textContent=v11t('companyManagement');const tab=$('.company-tab[data-company-tab="advancesPanel"]');if(tab)tab.click();
}
function openPendingPayments(){
 state.filter='pending';
 $$('.payment-filter').forEach(b=>b.classList.toggle('active',b.dataset.status==='pending'));
 $$('.nav button[data-section],.section').forEach(x=>x.classList.remove('active'));
 const nav=$('#nav button[data-section="paymentSubmissions"]');if(nav){nav.classList.add('active');openParentNavGroup(nav)}
 const section=$('#paymentSubmissions');if(section)section.classList.add('active');
 $('#pageTitle').textContent=tr('paymentSubmissions');renderSubmissions();
}
function notificationText(type,item){
 const lang=SWK_LANG.current||'en';
 if(type==='advance')return {title:v11t('advanceRequestNotice'),body:`${item?.employees?.full_name||'-'} · ${money(item?.amount||0)}`};
 if(type==='application'){
  const title={en:'New Loan Application',zh:'新的贷款申请',ms:'Permohonan Pinjaman Baharu'}[lang];
  return {title,body:[item?.full_name||item?.applicant_name||'',item?.phone||''].filter(Boolean).join(' · ')};
 }
 const title={en:'New Payment Submission',zh:'新的付款申请',ms:'Penyerahan Bayaran Baharu'}[lang];
 return {title,body:[item?.customers?.full_name||'',item?.loans?.loan_id||'',item?.amount!=null?money(item.amount):''].filter(Boolean).join(' · ')};
}
function playNotificationSound(){
 if(!state.soundEnabled)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  const ctx=state.audioContext||(state.audioContext=new C());
  if(ctx.state==='suspended')ctx.resume();
  const now=ctx.currentTime;
  [0,0.18].forEach((delay,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=i?880:660;gain.gain.setValueAtTime(0.0001,now+delay);gain.gain.exponentialRampToValueAtTime(0.25,now+delay+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.22);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+delay);osc.stop(now+delay+0.24)});
 }catch(e){console.warn('Notification sound failed',e)}
}
function showDesktopNotification(type,item){
 const msg=notificationText(type,item);
 toast(`${msg.title}${msg.body?' · '+msg.body:''}`);
 playNotificationSound();
 if('Notification' in window&&Notification.permission==='granted'&&document.hidden){
  const n=new Notification(msg.title,{body:msg.body,icon:'assets/logo.svg',tag:`wl-${type}-${item?.id||Date.now()}`});
  n.onclick=()=>{window.focus();openSalaryAdvanceNotifications();n.close()};
 }
 const old=document.title;let flashes=0;const timer=setInterval(()=>{document.title=flashes%2?old:`🔔 ${msg.title}`;if(++flashes>=8){clearInterval(timer);document.title=old}},700);
}
function rememberPendingAndNotify(){
 const applications=new Set(pendingLoanApplications().map(x=>String(x.id)));
 const payments=new Set(pendingPaymentSubmissions().map(x=>String(x.id)));
 const advances=new Set(requestedSalaryAdvances().map(x=>String(x.id)));
 if(state.notificationsReady){
  [...applications].filter(id=>!state.knownApplicationIds.has(id)).forEach(id=>showDesktopNotification('application',state.applications.find(v=>String(v.id)===id)));
  [...payments].filter(id=>!state.knownPendingIds.has(id)).forEach(id=>showDesktopNotification('payment',state.submissions.find(v=>String(v.id)===id)));
  [...advances].filter(id=>!state.knownAdvanceRequestIds.has(id)).forEach(id=>showDesktopNotification('advance',state.salaryAdvances.find(v=>String(v.id)===id)));
 }
 state.knownApplicationIds=applications;
 state.knownPendingIds=payments;
 state.knownAdvanceRequestIds=advances;
}
function updateSoundButton(){
 const b=$('#enableSoundBtn');if(!b)return;const lang=SWK_LANG.current||'en';
 b.textContent=state.soundEnabled?({en:'🔔 Sound On',zh:'🔔 提示音已开启',ms:'🔔 Bunyi Aktif'}[lang]):({en:'🔕 Enable Sound',zh:'🔕 开启提示音',ms:'🔕 Aktifkan Bunyi'}[lang]);
 b.classList.toggle('btn-primary',state.soundEnabled);b.classList.toggle('btn-secondary',!state.soundEnabled);
}
async function toggleNotificationSound(){
 state.soundEnabled=!state.soundEnabled;localStorage.setItem('wl_notification_sound',state.soundEnabled?'1':'0');
 if(state.soundEnabled){
  try{const C=window.AudioContext||window.webkitAudioContext;if(C){state.audioContext=state.audioContext||new C();await state.audioContext.resume();playNotificationSound()}}catch(e){}
  if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();
 }
 updateSoundButton();
}
async function refreshNotificationData(options={}){
 const [appsQ,paymentsQ,advancesQ]=await Promise.all([
  sb.from('loan_applications').select('*').order('created_at',{ascending:false}),
  sb.from('payment_submissions').select('*,customers(full_name,customer_code),loans(loan_id,settlement_amount,current_due_amount,current_paid_amount)').order('created_at',{ascending:false}),
  canReceiveAdvanceNotifications()?sb.from('salary_advances').select('*,employees(full_name,employee_code)').order('advance_date',{ascending:false}):Promise.resolve({data:[],error:null})
 ]);
 if(!appsQ.error){state.applications=appsQ.data||[];if(!isSuperAdmin())state.applications=state.applications.filter(applicationVisible)}
 if(!paymentsQ.error){state.submissions=paymentsQ.data||[];if(!canSeeAllCustomers()){const customerIds=new Set(state.customers.map(x=>String(x.id))),loanIds=new Set(state.loans.map(x=>String(x.id)));state.submissions=state.submissions.filter(x=>customerIds.has(String(x.customer_id))||loanIds.has(String(x.loan_id)))}}
 if(!advancesQ.error)state.salaryAdvances=advancesQ.data||[];
 rememberPendingAndNotify();
 renderNotifications();
 const active=document.activeElement;
 const typing=active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName);
 const modalOpen=$('#modal')?.classList.contains('show');
 if(!typing&&!modalOpen){
  if($('#loanApplications')?.classList.contains('active'))renderApplications();
  if($('#paymentSubmissions')?.classList.contains('active'))renderSubmissions();
  if($('#companyManagement')?.classList.contains('active'))renderCompanyManagement();
 }
 if(options.sound)playNotificationSound();
}
function setupPaymentNotifications(){
 if(state.paymentChannel)return;
 const refresh=async payload=>{try{await refreshNotificationData({sound:payload?.eventType==='INSERT'})}catch(e){console.error('Realtime notification refresh failed',e)}};
 state.paymentChannel=sb.channel('wl-payment-notifications').on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},refresh).subscribe();
 state.applicationChannel=sb.channel('wl-loan-application-notifications').on('postgres_changes',{event:'*',schema:'public',table:'loan_applications'},refresh).subscribe();
 if(canReceiveAdvanceNotifications())state.advanceChannel=sb.channel('wl-salary-advance-notifications').on('postgres_changes',{event:'*',schema:'public',table:'salary_advances'},refresh).subscribe();
 // Lightweight fallback only. Never reload or rerender the whole dashboard while staff are typing.
 // Realtime only: no polling timer, so forms and inputs are never interrupted.
 state.notificationPoll=null;
}
function applyV7Labels(){const l=SWK_LANG.current||'en',m={en:{audit:'Audit Log',today:'Today',yesterday:'Yesterday',thisWeek:'This Week',lastWeek:'Last Week',thisMonth:'This Month',lastMonth:'Last Month',apply:'Apply',to:'to',search:'Search Loan ID / Customer / IC / Phone / Payment ID',auditSearch:'Search staff, action or ID'},zh:{audit:'操作记录',today:'今天',yesterday:'昨天',thisWeek:'本周',lastWeek:'上周',thisMonth:'本月',lastMonth:'上个月',apply:'查询',to:'至',search:'搜索贷款编号 / 客户 / IC / 电话 / 付款编号',auditSearch:'搜索员工、操作或编号'},ms:{audit:'Log Aktiviti',today:'Hari Ini',yesterday:'Semalam',thisWeek:'Minggu Ini',lastWeek:'Minggu Lepas',thisMonth:'Bulan Ini',lastMonth:'Bulan Lepas',apply:'Cari',to:'hingga',search:'Cari ID Pinjaman / Pelanggan / IC / Telefon / ID Bayaran',auditSearch:'Cari staf, tindakan atau ID'}}[l]||{};const nav=$('#nav button[data-section="auditLogs"]');if(nav)nav.textContent=m.audit;const keys=['today','yesterday','thisWeek','lastWeek','thisMonth','lastMonth'];$$('.date-preset').forEach((b,i)=>b.textContent=m[keys[i]]);if($('#applyDateRange'))$('#applyDateRange').textContent=m.apply;if($('#auditApply'))$('#auditApply').textContent=m.apply;if($('#dateRangeSeparator'))$('#dateRangeSeparator').textContent=m.to;if($('#globalSearch'))$('#globalSearch').placeholder=m.search;if($('#auditSearch'))$('#auditSearch').placeholder=m.auditSearch}

// V28 stability recovery: keep optional sections isolated so one missing renderer
// can never stop the whole admin dashboard from initializing.
function renderStaff(){
 const root=$('#staffRows');
 if(!root)return;
 const rows=state.staffList||[];
 root.innerHTML=rows.map(s=>{
  const role=s.role==='super_admin'?v10t('superAdmin'):(s.role||'-');
  const permissionCount=['admin','super_admin'].includes(String(s.role||''))?'ALL':Object.values(s.permissions||{}).filter(Boolean).length;
  return `<tr><td>${esc(s.full_name||s.username||'-')}</td><td class="mono">${esc(s.username||s.auth_email||s.user_id||'-')}</td><td>${esc(role)}</td><td>${permissionCount}</td><td><span class="badge ${s.is_active!==false?'ok':'danger'}">${s.is_active!==false?'Active':'Inactive'}</span></td><td class="actions"><button class="btn btn-secondary" onclick="openStaff('${esc(s.user_id)}')">${esc(v11t('edit'))}</button></td></tr>`;
 }).join('')||`<tr><td colspan="6" class="muted">${esc(v10t('noRecords'))}</td></tr>`;
}

function renderSettings(){
 if($('#setAnnouncement'))$('#setAnnouncement').value=state.settings?.announcement||'';
 if($('#defaultBankSelect'))$('#defaultBankSelect').innerHTML=assignmentOptions(state.banks,state.settings?.default_bank_id,null);
 if($('#defaultWhatsappSelect'))$('#defaultWhatsappSelect').innerHTML=assignmentOptions((state.contacts||[]).filter(x=>x.channel_type==='whatsapp'),state.settings?.default_whatsapp_id,null);
 if($('#defaultTelegramSelect'))$('#defaultTelegramSelect').innerHTML=assignmentOptions((state.contacts||[]).filter(x=>x.channel_type==='telegram'),state.settings?.default_telegram_id,null);
 if($('#autoAssignEnabled'))$('#autoAssignEnabled').checked=state.settings?.auto_assign_enabled!==false;
 const tg=state.telegramSettings||{};
 if($('#telegramBotToken'))$('#telegramBotToken').value=tg.bot_token||'';
 if($('#dailyReportTime'))$('#dailyReportTime').value=String(tg.daily_report_time||'21:05').slice(0,5);
 if($('#dailyReportChatId'))$('#dailyReportChatId').value=tg.daily_report_chat_id||'';
 if($('#notificationChatId'))$('#notificationChatId').value=tg.notification_chat_id||'';
 if($('#telegramEnabled'))$('#telegramEnabled').checked=tg.is_enabled===true;
}

function renderAuditLogs(){
 const root=$('#auditRows');
 if(!root)return;
 if(!isSuperAdmin()){root.innerHTML='';return;}
 const from=$('#auditFrom')?.value||addDays(isoToday(),-179);
 const to=$('#auditTo')?.value||isoToday();
 const query=String($('#auditSearch')?.value||'').trim().toLowerCase();
 const actionText=row=>row.action||row.event_type||row.action_type||row.operation||'-';
 const detailsText=row=>{
  const raw=row.details??row.description??row.metadata??row.payload??row.entity_id??'';
  if(typeof raw==='string')return raw;
  try{return JSON.stringify(raw)}catch(_){return String(raw||'')}
 };
 const rows=(state.audit||[]).filter(row=>{
  const day=String(row.created_at||row.timestamp||'').slice(0,10);
  if(day&&(day<from||day>to))return false;
  if(!query)return true;
  const staff=row.staff_profiles?.full_name||row.staff_name||row.user_name||row.actor_name||row.user_id||'';
  return [staff,actionText(row),detailsText(row),row.entity_id,row.id].join(' ').toLowerCase().includes(query);
 });
 root.innerHTML=rows.map(row=>{
  const staff=row.staff_profiles?.full_name||row.staff_name||row.user_name||row.actor_name||row.user_id||'-';
  const created=row.created_at||row.timestamp;
  return `<tr><td>${created?esc(new Date(created).toLocaleString('en-MY',{timeZone:'Asia/Kuala_Lumpur'})):'-'}</td><td>${esc(staff)}</td><td>${esc(actionText(row))}</td><td>${esc(detailsText(row))}</td></tr>`;
 }).join('')||`<tr><td colspan="4" class="muted">${esc(v10t('noRecords'))}</td></tr>`;
}

function renderAll(){applyV7Labels();applyV10Labels();applyV11Labels();updateSoundButton();renderApplications();renderStats();renderBankCollectionTotals();renderCustomers();renderLoans();renderRepayments();renderSubmissions();renderBanks();renderContacts();renderStaff();renderReports();renderReportPreview();renderAuditLogs();renderSettings();renderCompanyManagement();renderMyHr();renderNotifications();applyPermissions();applyRoleVisibility()}
function renderStats(){const active=state.loans.filter(x=>x.status==='active'),due=active.filter(x=>inRange(x.due_date)).reduce((sum,x)=>sum+Math.max(Number(x.current_due_amount||x.interest)-Number(x.current_paid_amount||0),0),0),col=state.repayments.filter(x=>inRange(x.payment_date)).reduce((sum,x)=>sum+Number(x.amount||0),0);$('#statLoans').textContent=active.length;$('#statDue').textContent=money(due);$('#statCollected').textContent=money(col);$('#statCustomers').textContent=state.customers.length}
function renderBankCollectionTotals(){
 const host=$('#dashboardBankTotals');if(!host)return;
 const totals=new Map(state.banks.map(b=>[String(b.id),0]));
 for(const r of state.repayments){
  if(!inRange(r.payment_date))continue;
  const customerId=r.loans?.customer_id;
  const customer=state.customers.find(c=>String(c.id)===String(customerId));
  const bankId=customer?.assigned_bank_id;
  if(bankId!=null)totals.set(String(bankId),(totals.get(String(bankId))||0)+Number(r.amount||0));
 }
 host.innerHTML=state.banks.map(b=>`<div class="bank-total-card"><div><strong>${esc(b.bank_name)}</strong><small>${esc(b.account_number||'')}</small></div><div><span>${tr('amountReceived')}</span><strong>${money(totals.get(String(b.id))||0)}</strong></div></div>`).join('')||`<div class="card muted">${tr('noReceivingBanks')}</div>`;
}

function pendingApplications(){return state.applications.filter(x=>x.status==='pending')}
function renderApplications(){
 const host=$('#applicationRows');if(!host)return;if(!has('applications_view')){host.innerHTML=`<tr><td colspan="7" class="muted">${esc(tr('noAccess'))}</td></tr>`;return;}
 const visible=state.applications.filter(applicationVisible);
 const rows=state.applicationFilter==='all'?visible:visible.filter(x=>x.status===state.applicationFilter);
 const statusLabel=x=>x==='under_review'?(SWK_LANG.current==='zh'?'审核中':SWK_LANG.current==='ms'?'Dalam Semakan':'Under Review'):x;
 host.innerHTML=rows.map(a=>`<tr><td><strong>${esc(a.application_code)}</strong></td><td>${datetime(a.created_at)}</td><td>${esc(a.full_name)}<br><small>${esc(a.id_number)}</small></td><td>${esc(a.phone)}</td><td>${money(a.requested_amount)}</td><td><span class="badge ${a.status==='approved'?'ok':a.status==='rejected'?'danger':'warn'}">${esc(statusLabel(a.status))}</span>${a.claimed_by_name?`<br><small>${esc(a.claimed_by_name)}</small>`:''}</td><td>${a.status==='pending'&&has('applications_claim')?`<button class="btn btn-primary" onclick="claimApplication('${a.id}')">${SWK_LANG.current==='zh'?'接收审核':SWK_LANG.current==='ms'?'Ambil Kes':'Claim & Review'}</button>`:`<button class="btn btn-secondary" onclick="openApplicationReview('${a.id}')">View</button>`}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">No applications</td></tr>';
}
window.claimApplication=async id=>{if(!requirePerm('applications_claim'))return;const x=await sb.rpc('staff_claim_loan_application',{p_application_id:id});if(x.error||!x.data?.ok){toast(x.error?.message||x.data?.error||'This application has already been claimed by another staff member.',true);await loadAll();return}toast(SWK_LANG.current==='zh'?'案件已归属给您':SWK_LANG.current==='ms'?'Kes telah diberikan kepada anda':'Application assigned to you');await loadAll();openApplicationReview(id)};
window.viewApplicationDocument=async(id,key)=>{const a=state.applications.find(x=>x.id===id),path=a?.document_paths?.[key];if(!path)return toast('Document not found',true);try{const u=await signedUrl('loan-applications',path);window.open(u,'_blank')}catch(e){toast(e.message,true)}};
window.openApplicationReview=id=>{if(!requirePerm('applications_view'))return;const a=state.applications.find(x=>x.id===id);if(!a)return;
 const docs=Object.entries(a.document_paths||{}).filter(([,v])=>v).map(([k])=>`<button class="btn btn-secondary" onclick="viewApplicationDocument('${a.id}','${k}')">${esc(k.replaceAll('_',' '))}</button>`).join('')||'<span class="muted">No documents</span>';
 modal(`<div class="profile-head"><div><h2>${esc(a.application_code)} · ${esc(a.full_name)}</h2><p class="muted">Submitted ${datetime(a.created_at)}</p></div><span class="badge ${a.status==='approved'?'ok':a.status==='rejected'?'danger':'warn'}">${esc(a.status)}</span></div><div class="application-detail-grid"><div class="card"><div class="kv"><span>IC</span><strong>${esc(a.id_number)}</strong></div><div class="kv"><span>Phone</span><strong>${esc(a.phone)}</strong></div><div class="kv"><span>Address</span><strong>${esc(a.address||'-')}</strong></div></div><div class="card"><div class="kv"><span>Occupation</span><strong>${esc(a.occupation||'-')}</strong></div><div class="kv"><span>Employer</span><strong>${esc(a.employer||'-')}</strong></div><div class="kv"><span>Monthly Salary</span><strong>${a.monthly_salary!=null?money(a.monthly_salary):'-'}</strong></div><div class="kv"><span>${SWK_LANG.current==='zh'?'发薪周期':SWK_LANG.current==='ms'?'Kekerapan Gaji':'Salary Frequency'}</span><strong>${esc(a.salary_frequency||a.salary_date||'-')}</strong></div></div><div class="card"><div class="kv"><span>Emergency Contact</span><strong>${esc(a.emergency_name||'-')}</strong></div><div class="kv"><span>Relationship</span><strong>${esc(a.emergency_relation||'-')}</strong></div><div class="kv"><span>Emergency Phone</span><strong>${esc(a.emergency_phone||'-')}</strong></div></div><div class="card"><div class="kv"><span>Emergency Contact 2</span><strong>${esc(a.emergency_name_2||'-')}</strong></div><div class="kv"><span>Relationship</span><strong>${esc(a.emergency_relation_2||'-')}</strong></div><div class="kv"><span>Emergency Phone</span><strong>${esc(a.emergency_phone_2||'-')}</strong></div></div><div class="card"><div class="kv"><span>Requested Amount</span><strong>${money(a.requested_amount)}</strong></div><div class="kv"><span>Purpose</span><strong>${esc(a.purpose||'-')}</strong></div></div></div><h3>Documents</h3><div class="document-actions">${docs}</div>${a.status==='under_review'&&(isSuperAdmin()||isMine(a))&&(has('applications_approve')||has('applications_reject'))?`<div class="tabs">${has('applications_approve')?`<button class="btn btn-primary" onclick="approveApplication('${a.id}')">${SWK_LANG.current==='zh'?'批准贷款':SWK_LANG.current==='ms'?'Luluskan Pinjaman':'Approve Loan'}</button>`:''}${has('applications_reject')?`<button class="btn btn-danger" onclick="rejectApplication('${a.id}')">${SWK_LANG.current==='zh'?'拒绝贷款':SWK_LANG.current==='ms'?'Tolak Pinjaman':'Reject Loan'}</button>`:''}</div>`:''}${a.status==='rejected'&&a.rejection_reason?`<p><strong>Rejection reason:</strong> ${esc(a.rejection_reason)}</p>`:''}${a.status==='approved'?`<p><strong>Customer ID:</strong> ${esc(state.customers.find(c=>c.id===a.customer_id)?.customer_code||'-')}<br><strong>Loan ID:</strong> ${esc(state.loans.find(l=>l.id===a.loan_id)?.loan_id||'-')}</p>`:''}`)
};
window.approveApplication=id=>{if(!requirePerm('applications_approve'))return;const a=state.applications.find(x=>x.id===id),principal=Number(a.requested_amount||0),interest=Math.round(principal*.01*100)/100;modal(`<h2>Approve ${esc(a.application_code)}</h2><p class="muted">This creates the customer account and first loan.</p><form id="approveApplicationForm"><div class="grid2"><div class="field"><label>Temporary Password</label><input name="pin" minlength="4" required value="WL${Math.floor(100000+Math.random()*900000)}"></div><div class="field"><label>Principal (MYR)</label><input name="principal" type="number" min="0.01" step="0.01" required value="${principal}"></div><div class="field"><label>Interest (MYR)</label><input name="interest" type="number" min="0" step="0.01" required value="${interest}"></div><div class="field"><label>Settlement Amount (MYR)</label><input name="settlement" type="number" min="0.01" step="0.01" required value="${principal+interest}"></div><div class="field"><label>Disbursement Date</label><input name="disb" type="date" required value="${isoToday()}"></div><div class="field"><label>Due Date</label><input name="due" type="date" required value="${addDays(isoToday(),30)}"></div></div><div class="grid2"><div class="field"><label>Collection Bank</label><select name="bank_id">${assignmentOptions(state.banks,null,state.settings?.default_bank_id)}</select></div><div class="field"><label>WhatsApp Contact</label><select name="whatsapp_id">${assignmentOptions(contactsForOwner('whatsapp',a.owner_staff_id||state.staff?.user_id),null,state.settings?.default_whatsapp_id)}</select></div><div class="field"><label>Telegram Contact</label><select name="telegram_id">${assignmentOptions(contactsForOwner('telegram',a.owner_staff_id||state.staff?.user_id),null,state.settings?.default_telegram_id)}</select></div></div><div class="field"><label>Notes</label><textarea name="notes">Application ${esc(a.application_code)}</textarea></div><button class="btn btn-primary">Approve & Create Account</button></form>`);$('#approveApplicationForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),x=await sb.rpc('staff_approve_loan_application',{p_application_id:id,p_temp_pin:f.get('pin'),p_principal:Number(f.get('principal')),p_interest:Number(f.get('interest')),p_settlement_amount:Number(f.get('settlement')),p_disbursement_date:f.get('disb'),p_due_date:f.get('due'),p_notes:f.get('notes')});if(x.error||!x.data?.ok)return toast(x.error?.message||'Approval failed',true);const d=x.data,assign=await sb.from('customers').update({assigned_bank_id:f.get('bank_id')||null,assigned_whatsapp_id:f.get('whatsapp_id')||null,assigned_telegram_id:f.get('telegram_id')||null}).eq('id',d.customer_id);if(assign.error)return toast(assign.error.message,true);const msg=`您好，您的贷款申请已通过。\n\n登录网址：\n${location.origin}/\n\nUsername：${d.customer_code}\nPassword：${d.temporary_password}\n\n请首次登录后修改密码。\n\nWL Credit`;modal(`<h2>Application Approved</h2><div class="application-login-box"><p><strong>Customer ID / Username:</strong> ${esc(d.customer_code)}</p><p><strong>Temporary Password:</strong> ${esc(d.temporary_password)}</p><p><strong>Loan ID:</strong> ${esc(d.loan_id)}</p><button id="copyApplicationLogin" class="btn btn-primary">Copy WhatsApp Login Message</button></div>`);$('#copyApplicationLogin').onclick=async()=>{await navigator.clipboard.writeText(msg);toast('Login information copied')};await loadAll()}}
window.rejectApplication=id=>{if(!requirePerm('applications_reject'))return;modal(`<h2>Reject Application</h2><form id="rejectApplicationForm"><div class="field"><label>Reason (optional)</label><textarea name="reason"></textarea></div><button class="btn btn-danger">Confirm Reject</button></form>`);$('#rejectApplicationForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),x=await sb.rpc('staff_reject_loan_application',{p_application_id:id,p_reason:f.get('reason')});if(x.error)return toast(x.error.message,true);closeModal();toast('Application rejected');loadAll()}}


function customerSummaryText(k){
 const dict={
  en:{title:'Customer Profile',newLoan:'+ New Loan',edit:'Edit Customer',contact:'Customer Details',bank:'Company Receiving Account',service:'Customer Service',loans:'Loans',active:'Active',completed:'Completed',borrowed:'Total Borrowed',repaid:'Total Repaid',outstanding:'Outstanding',noLoans:'No loan records',open:'Open'},
  zh:{title:'客户详情',newLoan:'+ 新贷款',edit:'编辑客户',contact:'客户资料',bank:'公司收款账户',service:'客服联系方式',loans:'贷款记录',active:'进行中',completed:'已完成',borrowed:'总借款',repaid:'已还款',outstanding:'尚欠',noLoans:'没有贷款记录',open:'查看'},
  ms:{title:'Profil Pelanggan',newLoan:'+ Pinjaman Baharu',edit:'Edit Pelanggan',contact:'Butiran Pelanggan',bank:'Akaun Kutipan Syarikat',service:'Khidmat Pelanggan',loans:'Rekod Pinjaman',active:'Aktif',completed:'Selesai',borrowed:'Jumlah Dipinjam',repaid:'Jumlah Dibayar',outstanding:'Baki Tertunggak',noLoans:'Tiada rekod pinjaman',open:'Buka'}
 };return (dict[SWK_LANG.current]||dict.en)[k]||k;
}
window.openCustomerProfile=id=>{
 const c=state.customers.find(x=>String(x.id)===String(id));if(!c)return toast(tr('noRecords'),true);
 const loans=state.loans.filter(l=>String(l.customer_id)===String(c.id));
 const loanIds=new Set(loans.map(l=>String(l.id)));
 const repayments=state.repayments.filter(r=>loanIds.has(String(r.loan_id)));
 const borrowed=loans.reduce((n,l)=>n+Number(l.principal||0),0);
 const repaid=repayments.reduce((n,r)=>n+Number(r.amount||0),0);
 const outstanding=loans.filter(l=>l.status!=='paid').reduce((n,l)=>n+Math.max(Number(l.remaining_amount??l.settlement_amount??0),0),0);
 const bank=c.receiving_bank||state.banks.find(b=>String(b.id)===String(c.assigned_bank_id));
 const wa=c.whatsapp_contact||state.contacts.find(v=>String(v.id)===String(c.assigned_whatsapp_id));
 const tg=c.telegram_contact||state.contacts.find(v=>String(v.id)===String(c.assigned_telegram_id));
 const rows=loans.map(l=>`<tr><td class="mono">${esc(l.loan_id)}</td><td>${money(l.principal)}</td><td>${money(l.interest)}</td><td>${money(l.settlement_amount)}</td><td>${date(l.due_date)}</td><td><span class="badge ${l.status==='paid'?'ok':(l.due_date&&l.due_date<isoToday()?'danger':'warn')}">${esc(loanStatus(l))}</span></td><td><button class="btn btn-secondary" onclick="closeModal();openLoan('${l.id}')">${esc(customerSummaryText('open'))}</button></td></tr>`).join('');
 modal(`<div class="profile-head"><div><h2>${esc(c.customer_code)} · ${esc(c.full_name)}</h2><p class="muted">${esc(customerSummaryText('title'))}</p></div><div class="actions"><button class="btn btn-primary" onclick="closeModal();openLoan(null,'${c.id}')">${esc(customerSummaryText('newLoan'))}</button><button class="btn btn-secondary" onclick="closeModal();openCustomer('${c.id}')">${esc(customerSummaryText('edit'))}</button></div></div>
 <div class="stats report-stats"><div class="stat"><span>${esc(customerSummaryText('borrowed'))}</span><strong>${money(borrowed)}</strong></div><div class="stat"><span>${esc(customerSummaryText('repaid'))}</span><strong>${money(repaid)}</strong></div><div class="stat"><span>${esc(customerSummaryText('outstanding'))}</span><strong>${money(outstanding)}</strong></div><div class="stat"><span>${esc(customerSummaryText('active'))}</span><strong>${loans.filter(l=>l.status==='active').length}</strong></div><div class="stat"><span>${esc(customerSummaryText('completed'))}</span><strong>${loans.filter(l=>l.status==='paid').length}</strong></div></div>
 <div class="application-detail-grid"><div class="card"><h3>${esc(customerSummaryText('contact'))}</h3><div class="kv"><span>IC</span><strong>${esc(c.id_number||'-')}</strong></div><div class="kv"><span>${esc(tr('phone'))}</span><strong>${esc(c.phone||'-')}</strong></div><div class="kv"><span>${esc(tr('address'))}</span><strong>${esc(c.address||'-')}</strong></div><div class="kv"><span>${esc(tr('workSalary'))}</span><strong>${esc(c.work_salary||'-')}</strong></div><div class="kv"><span>${esc(tr('emergencyContact'))}</span><strong>${esc(c.emergency_contact||'-')}</strong></div></div>
 <div class="card"><h3>${esc(customerSummaryText('bank'))}</h3>${bank?`<div class="kv"><span>${esc(bank.bank_name||'-')}</span><strong>${esc(bank.account_number||'-')}</strong></div><div class="kv"><span>${esc(tr('accountName')||'Account Name')}</span><strong>${esc(bank.account_name||'-')}</strong></div>`:`<p class="muted">${esc(tr('unassigned'))}</p>`}<h3>${esc(customerSummaryText('service'))}</h3><div class="kv"><span>WhatsApp</span><strong>${esc(wa?.label||wa?.contact_value||tr('unassigned'))}</strong></div><div class="kv"><span>Telegram</span><strong>${esc(tg?.label||tg?.contact_value||tr('unassigned'))}</strong></div></div></div>
 <h3>${esc(customerSummaryText('loans'))}</h3><div class="table-wrap"><table class="table"><thead><tr><th>Loan ID</th><th>${esc(v10t('principal'))}</th><th>${esc(v10t('interest'))}</th><th>${esc(v10t('settlement'))}</th><th>${esc(v10t('dueDate'))}</th><th>${esc(v10t('status'))}</th><th>${esc(tr('actions'))}</th></tr></thead><tbody>${rows||`<tr><td colspan="7">${esc(customerSummaryText('noLoans'))}</td></tr>`}</tbody></table></div>`);
};
function renderGlobalSearch(){
 const input=$('#globalSearch'),box=$('#globalSearchResults');if(!input||!box)return;
 const q=String(input.value||'').trim().toLowerCase();if(q.length<2){box.classList.add('hidden');box.innerHTML='';return}
 const customerMatches=state.customers.filter(c=>[c.customer_code,c.full_name,c.id_number,c.phone].join(' ').toLowerCase().includes(q)).slice(0,6);
 const loanMatches=state.loans.filter(l=>[l.loan_id,l.customers?.full_name].join(' ').toLowerCase().includes(q)).slice(0,6);
 const paymentMatches=state.submissions.filter(x=>[x.id,x.loans?.loan_id,x.customers?.full_name].join(' ').toLowerCase().includes(q)).slice(0,4);
 const items=[...customerMatches.map(c=>`<button type="button" onclick="document.querySelector('#globalSearchResults').classList.add('hidden');openCustomerProfile('${c.id}')"><strong>${esc(c.customer_code)} · ${esc(c.full_name)}</strong><small>${esc(c.id_number||'')} · ${esc(c.phone||'')}</small></button>`),...loanMatches.map(l=>`<button type="button" onclick="document.querySelector('#globalSearchResults').classList.add('hidden');openCustomerProfile('${l.customer_id}')"><strong>${esc(l.loan_id)} · ${esc(l.customers?.full_name||'')}</strong><small>${money(l.principal)} · ${esc(loanStatus(l))}</small></button>`),...paymentMatches.map(x=>`<button type="button" onclick="document.querySelector('#globalSearchResults').classList.add('hidden');openPendingPayments()"><strong>${esc(x.loans?.loan_id||x.id)}</strong><small>${money(x.amount)} · ${esc(x.status)}</small></button>`)].slice(0,12);
 box.innerHTML=items.join('')||`<div class="global-search-empty">${esc(v10t('noRecords'))}</div>`;box.classList.remove('hidden');
}

function renderCustomers(){const q=($('#customerSearch').value||'').toLowerCase();$('#customerRows').innerHTML=state.customers.filter(c=>[c.customer_code,c.full_name,c.phone,c.id_number].join(' ').toLowerCase().includes(q)).map(c=>{const ls=state.loans.filter(l=>l.customer_id===c.id),a=ls.filter(l=>l.status==='active').length,h=ls.filter(l=>l.status==='paid').length;return `<tr><td><span class="click-link" onclick="openCustomerProfile('${c.id}')">${esc(c.customer_code)}</span></td><td><span class="click-link" onclick="openCustomerProfile('${c.id}')">${esc(c.full_name)}</span></td><td>${esc(c.phone)}</td><td>${esc(c.id_number)}</td><td>${a}</td><td>${h}</td><td><span class="badge ${c.is_active?'ok':'danger'}">${c.is_active?'Active':'Inactive'}</span></td><td class="actions"><button class="btn btn-secondary" onclick="openCustomer('${c.id}')">${esc(v11t('edit'))}</button><button class="btn btn-secondary" onclick="changePin('${c.id}')">Password</button></td></tr>`}).join('')}
function renderLoans(){
 $('#loanRows').innerHTML=state.loans.map(l=>{const c=state.customers.find(x=>x.id===l.customer_id),contacts=[c?.telegram_contact?.label,c?.whatsapp_contact?.label].filter(Boolean).join(' + ');return `<tr><td>${esc(l.loan_id)}</td><td><span class="click-link" onclick="openCustomerProfile('${l.customer_id}')">${esc(l.customers?.full_name)}</span></td><td>${money(l.principal)}</td><td>${money(l.interest)}</td><td>${money(l.settlement_amount)}</td><td>${esc(c?.receiving_bank?.bank_name||tr('unassigned'))}</td><td>${esc(contacts||tr('unassigned'))}</td><td>${date(l.due_date)}</td><td><span class="badge ${l.status==='paid'?'ok':l.due_date<isoToday()?'danger':'warn'}">${loanStatus(l)}</span></td><td><button class="btn btn-secondary" onclick="openLoan('${l.id}')">${esc(v11t('edit'))}</button></td></tr>`}).join('')
}
function renderRepayments(){$('#repaymentRows').innerHTML=state.repayments.map(r=>`<tr><td>${date(r.payment_date)}</td><td>${esc(r.loans?.loan_id)}</td><td>${esc(r.loans?.customers?.full_name)}</td><td>${money(r.amount)}</td><td>${esc(r.staff_profiles?.full_name||'-')}</td><td>${esc(r.notes)}</td></tr>`).join('')}
async function signedUrl(bucket,path){const {data,error}=await sb.storage.from(bucket).createSignedUrl(path,300);if(error)throw error;return data.signedUrl}
window.viewReceipt=async id=>{const x=state.submissions.find(v=>v.id===id);try{const u=await signedUrl('payment-receipts',x.receipt_path);window.open(u,'_blank')}catch(e){toast(e.message,true)}};
function renderSubmissions(){const rows=state.filter==='all'?state.submissions:state.submissions.filter(x=>x.status===state.filter);$('#submissionRows').innerHTML=rows.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.customers?.full_name)}</td><td>${esc(x.loans?.loan_id)}</td><td>${money(x.amount)}</td><td><button class="btn btn-secondary" onclick="viewReceipt('${x.id}')">View</button></td><td><span class="badge ${x.status==='approved'?'ok':x.status==='rejected'?'danger':'warn'}">${x.status}</span></td><td>${x.status==='pending'?`<button class="btn btn-primary" onclick="approveSubmission('${x.id}')">Approve</button> <button class="btn btn-danger" onclick="rejectSubmission('${x.id}')">Reject</button>`:''}</td></tr>`).join('')}
function renderBanks(){$('#bankCards').innerHTML=state.banks.map(b=>{const n=state.customers.filter(c=>c.assigned_bank_id===b.id).length,enabled=b.is_enabled!==false,status=enabled?telegramText('Enabled','已启用','Diaktifkan'):telegramText('Disabled','已停用','Dinyahaktifkan'),toggle=enabled?telegramText('Disable','停用','Nyahaktif'):telegramText('Enable','启用','Aktifkan'),del=telegramText('Delete','删除','Padam');return `<div class="card resource-card"><div class="section-head"><h3>${esc(b.bank_name)}</h3><span class="badge ${enabled?'ok':'danger'}">${status}</span></div><p>${esc(b.account_name)}<br><strong>${esc(b.account_number)}</strong></p><div class="resource-count">${n}</div><p class="muted">${tr('assignedCustomers')}</p><button class="btn btn-secondary" onclick="openBank('${b.id}')">${tr('edit')}</button> <button class="btn btn-secondary" onclick="manageCustomerBank('${b.id}')">${tr('manageAssignment')}</button> <button class="btn btn-secondary" onclick="toggleReceivingBank('${b.id}',${!enabled})">${toggle}</button> <button class="btn btn-danger" onclick="deleteReceivingBank('${b.id}')">${del}</button></div>`}).join('')}
function renderContacts(){
 const rows=state.contacts.filter(c=>isSuperAdmin()||canManageContact(c));
 $('#contactCards').innerHTML=rows.map(c=>{
  const field=c.channel_type==='telegram'?'assigned_telegram_id':c.channel_type==='whatsapp'?'assigned_whatsapp_id':null;
  const n=field?state.customers.filter(x=>x[field]===c.id).length:0;
  const owner=isSuperAdmin()?`<p class="muted"><strong>${esc(contactOwnerLabel(c))}</strong></p>`:'';
  const buttons=canManageContact(c)?`<button class="btn btn-secondary" onclick="openContact('${c.id}')">${esc(v11t('edit'))}</button> <button class="btn btn-secondary" onclick="manageCustomerContact('${c.id}')">${tr('manageAssignment')}</button> <button class="btn btn-danger" onclick="deleteContact('${c.id}')">${tr('delete')}</button>`:'';
  return `<div class="card resource-card"><h3>${esc(c.label)}</h3>${owner}<p>${esc(c.channel_type)}<br><strong>${esc(c.contact_value)}</strong></p><div class="resource-count">${n}</div><p class="muted">${tr('assignedCustomers')}</p>${buttons}</div>`
 }).join('')||`<div class="card"><p>${SWK_LANG.current==='zh'?'暂无联系方式':SWK_LANG.current==='ms'?'Tiada kaedah hubungan':'No contact methods'}</p></div>`
}
function applyPermissions(){
 // Navigation is always visible and clickable. Permissions only restrict action buttons.
 lock($('#addCustomerBtn'),'customers_create');lock($('#addLoanBtn'),'loans_create');lock($('#addBankBtn'),'banks_manage');lock($('#addContactBtn'),'contacts_manage');lock($('#addStaffBtn'),'staff_manage');lock($('#saveSettingsBtn'),'settings_manage');
 $$('#nav button').forEach(b=>{b.classList.remove('locked','no-permission');b.disabled=false;b.removeAttribute('title')});$$('#nav .nav-lock').forEach(x=>x.remove())
}
window.openCustomer=id=>{if(!requirePerm(id?'customers_edit':'customers_create'))return;const c=state.customers.find(x=>x.id===id)||{};modal(`<h2>${tr(id?'editCustomer':'addCustomer')}</h2><form id="customerForm"><div class="grid2"><div class="field"><label>${tr('fullName')}</label><input name="name" required value="${esc(c.full_name)}"></div>${id?'':`<div class="field"><label>${tr('temporaryPassword')}</label><input name="pin" minlength="4" required></div>`}<div class="field"><label>${tr('phone')}</label><input name="phone" value="${esc(c.phone)}"></div><div class="field"><label>IC</label><input name="idn" value="${esc(c.id_number)}"></div><div class="field"><label>${tr('address')}</label><input name="address" value="${esc(c.address)}"></div><div class="field"><label>${tr('workSalary')}</label><input name="work" value="${esc(c.work_salary)}"></div><div class="field"><label>${tr('emergencyContact')}</label><input name="emergency" value="${esc(c.emergency_contact)}"></div><div class="field"><label>${tr('receivingBank')}</label><select name="bank_id">${assignmentOptions(state.banks,c.assigned_bank_id,state.settings?.default_bank_id)}</select></div><div class="field"><label>WhatsApp</label><select name="whatsapp_id">${assignmentOptions(state.contacts.filter(x=>x.channel_type==='whatsapp'),c.assigned_whatsapp_id,state.settings?.default_whatsapp_id)}</select></div><div class="field"><label>Telegram</label><select name="telegram_id">${assignmentOptions(state.contacts.filter(x=>x.channel_type==='telegram'),c.assigned_telegram_id,state.settings?.default_telegram_id)}</select></div></div><div class="field"><label>${tr('internalNotes')}</label><textarea name="notes">${esc(c.internal_notes)}</textarea></div><label><input type="checkbox" name="active" ${c.is_active!==false?'checked':''}> Active</label><p><button class="btn btn-primary">Save</button> <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button></p></form>`);$('#customerForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);let x;const assignments={assigned_bank_id:f.get('bank_id')||null,assigned_whatsapp_id:f.get('whatsapp_id')||null,assigned_telegram_id:f.get('telegram_id')||null};if(id)x=await sb.from('customers').update({full_name:f.get('name'),phone:f.get('phone'),id_number:f.get('idn'),address:f.get('address'),work_salary:f.get('work'),emergency_contact:f.get('emergency'),internal_notes:f.get('notes'),is_active:f.get('active')==='on',...assignments,updated_at:new Date().toISOString()}).eq('id',id);else{ x=await sb.rpc('staff_create_customer_auto',{p_name:f.get('name'),p_pin:f.get('pin'),p_phone:f.get('phone'),p_id_number:f.get('idn'),p_address:f.get('address'),p_work_salary:f.get('work'),p_emergency:f.get('emergency'),p_internal_notes:f.get('notes')});if(!x.error&&x.data?.id){const a=await sb.from('customers').update(assignments).eq('id',x.data.id);if(a.error)x=a}}if(x.error)return toast(x.error.message,true);closeModal();toast(tr('saved'));loadAll()}}
window.changePin=id=>{if(!requirePerm('customers_edit'))return;modal(`<h2>${tr('resetCustomerPassword')}</h2><form id="pinForm"><div class="field"><label>${tr('newTemporaryPassword')}</label><input name="pin" minlength="4" required></div><label><input name="force" type="checkbox" checked> ${tr('requireNextLoginChange')}</label><p><button class="btn btn-primary">Save</button></p></form>`);$('#pinForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),x=await sb.rpc('staff_change_customer_pin',{p_customer_id:id,p_new_pin:f.get('pin'),p_force_change:f.get('force')==='on'});if(x.error)return toast(x.error.message,true);closeModal();toast(tr('saved'))}};
window.openLoan=(id,customerId)=>{if(!requirePerm(id?'loans_edit':'loans_create'))return;const l=state.loans.find(x=>x.id===id)||{};const selectedCustomerId=l.customer_id||customerId||'';modal(`<h2>${tr(id?'editLoan':'addLoan')}</h2><form id="loanForm"><div class="grid2"><div class="field"><label>${tr('customer')}</label><select name="customer" required>${state.customers.filter(c=>c.is_active).map(c=>`<option value="${c.id}" ${String(selectedCustomerId)===String(c.id)?'selected':''}>${esc(c.customer_code)} — ${esc(c.full_name)}</option>`).join('')}</select></div><div class="field"><label>${tr('principalDisbursed')}</label><input name="principal" type="number" step=".01" required value="${l.principal??''}"></div><div class="field"><label>${tr('interestPerPeriod')}</label><input name="interest" type="number" step=".01" required value="${l.interest??''}"></div><div class="field"><label>${tr('settlementIndependent')}</label><input name="settlement" type="number" step=".01" required value="${l.settlement_amount??''}"></div><div class="field"><label>${tr('disbursementDate')}</label><input name="disb" type="date" required value="${l.disbursement_date||isoToday()}"></div><div class="field"><label>${tr('dueDate')}</label><input name="due" type="date" required value="${l.due_date||''}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'预计到账时间':SWK_LANG.current==='ms'?'Masa Bayaran Dijangka':'Expected Payment Time'}</label><input name="expected_at" type="datetime-local" value="${l.expected_payment_at?String(l.expected_payment_at).slice(0,16):''}"></div></div><div class="field"><label>${tr('notes')}</label><textarea name="notes">${esc(l.notes)}</textarea></div><button class="btn btn-primary">${tr('save')}</button></form>`);$('#loanForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),p=Number(f.get('principal')),i=Number(f.get('interest')),s=Number(f.get('settlement'));let x;if(id)x=await sb.from('loans').update({customer_id:f.get('customer'),principal:p,interest:i,settlement_amount:s,remaining_amount:l.status==='paid'?0:s,disbursement_date:f.get('disb'),due_date:f.get('due'),expected_payment_at:f.get('expected_at')?new Date(f.get('expected_at')).toISOString():null,notes:f.get('notes'),updated_at:new Date().toISOString()}).eq('id',id);else x=await sb.rpc('staff_create_loan_auto',{p_customer_id:f.get('customer'),p_principal:p,p_interest:i,p_settlement_amount:s,p_disbursement_date:f.get('disb'),p_due_date:f.get('due'),p_notes:f.get('notes')});if(x.error)return toast(x.error.message,true);closeModal();toast(tr('saved'));loadAll()}}

window.manageCustomerContact=id=>{if(!requirePerm('contacts_assign'))return;const contact=state.contacts.find(x=>x.id===id);if(!contact||!canManageContact(contact))return toast(tr('noAccess'),true);const field=contact.channel_type==='telegram'?'assigned_telegram_id':contact.channel_type==='whatsapp'?'assigned_whatsapp_id':null;if(!field)return toast(SWK_LANG.current==='zh'?'只有 WhatsApp 和 Telegram 可以分配给客户。':SWK_LANG.current==='ms'?'Hanya WhatsApp dan Telegram boleh ditugaskan kepada pelanggan.':'Only WhatsApp and Telegram can be assigned to customers.',true);const customers=isSuperAdmin()?state.customers:state.customers.filter(isMine);modal(`<h2>${tr('manageAssignment')} · ${esc(contact.label)}</h2><form id="customerContactForm"><div class="checkbox-list">${customers.map(c=>`<label class="checkbox-row"><input type="checkbox" value="${c.id}" ${c[field]===id?'checked':''}><span>${esc(c.customer_code)} — ${esc(c.full_name)}</span></label>`).join('')}</div><p><button class="btn btn-primary">${tr('save')}</button></p></form>`);$('#customerContactForm').onsubmit=async e=>{e.preventDefault();const selected=$$('#customerContactForm input:checked').map(x=>x.value),x=await sb.rpc('staff_assign_customers_contact',{p_customer_ids:selected,p_contact_id:id});if(x.error)return toast(x.error.message,true);closeModal();toast(tr('assignedCount',{count:x.data}));loadAll()}}

window.openBank=id=>{
 if(!requirePerm('banks_manage'))return;
 const b=state.banks.find(x=>String(x.id)===String(id))||{};
 modal(`<h2>${tr(id?'editBank':'addBank')}</h2><form id="bankForm"><div class="grid2"><div class="field"><label>${tr('bankName')}</label><input name="bank_name" required value="${esc(b.bank_name||'')}"></div><div class="field"><label>${tr('accountName')}</label><input name="account_name" required value="${esc(b.account_name||'')}"></div><div class="field"><label>${tr('accountNumber')}</label><input name="account_number" required value="${esc(b.account_number||'')}"></div></div><label><input name="enabled" type="checkbox" ${b.is_enabled!==false?'checked':''}> ${SWK_LANG.current==='zh'?'启用':SWK_LANG.current==='ms'?'Aktif':'Enabled'}</label><p><button class="btn btn-primary">${tr('save')}</button> <button type="button" class="btn btn-secondary" onclick="closeModal()">${tr('cancel')}</button></p></form>`);
 $('#bankForm').onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target),payload={bank_name:String(f.get('bank_name')||'').trim(),account_name:String(f.get('account_name')||'').trim(),account_number:String(f.get('account_number')||'').trim(),is_enabled:f.get('enabled')==='on',updated_at:new Date().toISOString()};
  const r=id?await sb.from('receiving_banks').update(payload).eq('id',id):await sb.from('receiving_banks').insert(payload);
  if(r.error)return toast(r.error.message,true);
  closeModal();toast(tr('saved'));await loadAll();
 };
};

window.openContact=id=>{if(!requirePerm('contacts_manage'))return;const c=state.contacts.find(x=>x.id===id)||{};if(id&&!canManageContact(c))return toast(tr('noAccess'),true);const currentOwner=c.owner_staff_id||state.staff?.user_id||'';const ownerField=isSuperAdmin()?`<div class="field"><label>${SWK_LANG.current==='zh'?'所属客服':SWK_LANG.current==='ms'?'Pemilik Khidmat Pelanggan':'Contact Owner'}</label><select name="owner" required>${state.staffList.filter(x=>x.is_active!==false&&x.role!=='customer').map(x=>`<option value="${x.user_id}" ${String(currentOwner)===String(x.user_id)?'selected':''}>${esc(x.staff_code?`${x.staff_code} · ${x.full_name||x.username||''}`:(x.full_name||x.username||x.user_id))}</option>`).join('')}</select></div>`:`<input type="hidden" name="owner" value="${esc(state.staff?.user_id||'')}">`;modal(`<h2>${tr(id?'editContactMethod':'addContactMethod')}</h2><form id="contactForm">${ownerField}<div class="field"><label>${tr('displayName')}</label><input name="label" required value="${esc(c.label)}"></div><div class="field"><label>${tr('type')}</label><select name="type">${['whatsapp','telegram','phone','other'].map(x=>`<option ${c.channel_type===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>${tr('contactValue')}</label><input name="value" required value="${esc(c.contact_value)}"></div><label><input name="enabled" type="checkbox" ${c.is_enabled!==false?'checked':''}> ${SWK_LANG.current==='zh'?'启用':SWK_LANG.current==='ms'?'Aktif':'Enabled'}</label><p><button class="btn btn-primary">${tr('save')}</button></p></form>`);$('#contactForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),p={label:f.get('label'),channel_type:f.get('type'),contact_value:f.get('value'),owner_staff_id:f.get('owner'),is_enabled:f.get('enabled')==='on',updated_at:new Date().toISOString()},x=id?await sb.from('contact_channels').update(p).eq('id',id):await sb.from('contact_channels').insert(p);if(x.error)return toast(x.error.message,true);closeModal();toast(tr('saved'));loadAll()}}

window.deleteContact=id=>{if(!requirePerm('contacts_manage'))return;const c=state.contacts.find(x=>x.id===id);if(!c||!canManageContact(c))return toast(tr('noAccess'),true);const field=c.channel_type==='telegram'?'assigned_telegram_id':c.channel_type==='whatsapp'?'assigned_whatsapp_id':null;const assigned=field?state.customers.filter(x=>x[field]===id):[];if(!assigned.length){modal(`<h2>${SWK_LANG.current==='zh'?'删除联系方式':SWK_LANG.current==='ms'?'Padam Kaedah Hubungan':'Delete Contact'}</h2><p>${SWK_LANG.current==='zh'?'确定删除此联系方式吗？此操作无法撤销。':SWK_LANG.current==='ms'?'Padam kaedah hubungan ini? Tindakan ini tidak boleh dibatalkan.':'Delete this contact method? This action cannot be undone.'}</p><p><button class="btn btn-secondary" onclick="closeModal()">${tr('cancel')}</button> <button id="confirmDeleteContact" class="btn btn-danger">${tr('delete')}</button></p>`);$('#confirmDeleteContact').onclick=()=>transferDeleteContact(id,null);return}const replacements=state.contacts.filter(x=>x.id!==id&&x.channel_type===c.channel_type&&(isSuperAdmin()||canManageContact(x)));if(!replacements.length)return toast(SWK_LANG.current==='zh'?'请先新增另一个相同类型的联系方式，才能转移客户并删除。':SWK_LANG.current==='ms'?'Tambah satu lagi kaedah hubungan jenis yang sama sebelum memindahkan pelanggan dan memadam.':'Add another contact of the same type before transferring customers and deleting.',true);modal(`<h2>${SWK_LANG.current==='zh'?'转移客户并删除':SWK_LANG.current==='ms'?'Pindah Pelanggan & Padam':'Transfer Customers & Delete'}</h2><p>${SWK_LANG.current==='zh'?`此联系方式已分配给 ${assigned.length} 位客户。请选择新的联系方式。`:SWK_LANG.current==='ms'?`Kaedah ini digunakan oleh ${assigned.length} pelanggan. Pilih kaedah baharu.`:`This contact is assigned to ${assigned.length} customers. Select a replacement contact.`}</p><div class="field"><label>${SWK_LANG.current==='zh'?'新的联系方式':SWK_LANG.current==='ms'?'Kaedah Hubungan Baharu':'Replacement Contact'}</label><select id="replacementContact">${replacements.map(x=>`<option value="${x.id}">${esc(x.label)} · ${esc(x.contact_value)}${isSuperAdmin()?` · ${esc(contactOwnerLabel(x))}`:''}</option>`).join('')}</select></div><p><button class="btn btn-secondary" onclick="closeModal()">${tr('cancel')}</button> <button id="confirmTransferDeleteContact" class="btn btn-danger">${SWK_LANG.current==='zh'?'转移并删除':SWK_LANG.current==='ms'?'Pindah & Padam':'Transfer & Delete'}</button></p>`);$('#confirmTransferDeleteContact').onclick=()=>transferDeleteContact(id,$('#replacementContact').value)}

async function transferDeleteContact(id,replacementId){const x=await sb.rpc('staff_transfer_delete_contact',{p_contact_id:id,p_replacement_id:replacementId||null});if(x.error)return toast(x.error.message,true);closeModal();toast(SWK_LANG.current==='zh'?'联系方式已删除。':SWK_LANG.current==='ms'?'Kaedah hubungan telah dipadam.':'Contact method deleted.');await loadAll()}
function renderDefaultSettings(){if(!$('#defaultBankSelect'))return;$('#defaultBankSelect').innerHTML=assignmentOptions(state.banks,null,state.settings?.default_bank_id,'addBankFirst');$('#defaultWhatsappSelect').innerHTML=assignmentOptions(state.contacts.filter(x=>x.channel_type==='whatsapp'),null,state.settings?.default_whatsapp_id,'addWhatsappFirst');$('#defaultTelegramSelect').innerHTML=assignmentOptions(state.contacts.filter(x=>x.channel_type==='telegram'),null,state.settings?.default_telegram_id,'addTelegramFirst');$('#autoAssignEnabled').checked=state.settings?.auto_assign_enabled!==false}
function reportData(){const from=$('#reportFrom')?.value||state.dateFrom,to=$('#reportTo')?.value||state.dateTo,inside=v=>{const d=String(v||'').slice(0,10);return (!from||d>=from)&&(!to||d<=to)};const loans=state.loans.filter(x=>inside(x.disbursement_date||x.created_at)),payments=state.repayments.filter(x=>inside(x.payment_date||x.created_at)),overdue=state.loans.filter(x=>x.status!=='paid'&&x.status!=='cancelled'&&x.due_date<isoToday()),applications=state.applications.filter(x=>inside(x.created_at));return{from,to,loans,payments,overdue,applications,principal:loans.reduce((s,x)=>s+Number(x.principal||0),0),interest:loans.reduce((s,x)=>s+Number(x.interest||0),0),collected:payments.reduce((s,x)=>s+Number(x.amount||0),0)}}
function renderReports(){
 const ls=state.loans.filter(x=>inRange(x.disbursement_date||x.created_at));
 const rs=state.repayments.filter(x=>inRange(x.payment_date||x.created_at));
 const set=(selector,value)=>{const el=$(selector);if(el)el.textContent=value};
 set('#reportPrincipal',money(state.loans.reduce((sum,x)=>sum+Number(x.principal||0),0)));
 set('#reportInterest',money(ls.reduce((sum,x)=>sum+Number(x.interest||0),0)));
 set('#reportCollected',money(rs.reduce((sum,x)=>sum+Number(x.amount||0),0)));
 set('#reportSettled',String(state.loans.filter(x=>x.status==='paid'&&inRange(x.updated_at||x.created_at)).length));
}
function renderReportPreview(){if(!$('#reportPreview'))return;const r=reportData();$('#reportPreview').innerHTML=`<div class="stats report-stats"><div class="stat"><span>${esc(v10t('loans'))}</span><strong>${r.loans.length}</strong></div><div class="stat"><span>${esc(v10t('disbursed'))}</span><strong>${money(r.principal)}</strong></div><div class="stat"><span>${esc(v10t('interest'))}</span><strong>${money(r.interest)}</strong></div><div class="stat"><span>${esc(v10t('collected'))}</span><strong>${money(r.collected)}</strong></div><div class="stat"><span>${esc(v10t('overdue'))}</span><strong>${r.overdue.length}</strong></div></div><h3>${esc(v10t('loanDetails'))}</h3><div class="table-wrap"><table class="table"><thead><tr><th>Loan ID</th><th>${esc(v10t('customer'))}</th><th>${esc(v10t('principal'))}</th><th>${esc(v10t('interest'))}</th><th>${esc(v10t('dueDate'))}</th><th>${esc(v10t('status'))}</th></tr></thead><tbody>${r.loans.map(x=>`<tr><td>${esc(x.loan_id)}</td><td>${esc(x.customers?.full_name||'-')}</td><td>${money(x.principal)}</td><td>${money(x.interest)}</td><td>${date(x.due_date)}</td><td>${esc(loanStatus(x))}</td></tr>`).join('')||`<tr><td colspan="6">${esc(v10t('noRecords'))}</td></tr>`}</tbody></table></div>`}
function downloadReportExcel(){const r=reportData(),rows=[['WL CREDIT '+v10t('report')],[v10t('from'),r.from],[v10t('to'),r.to],[],[v10t('summary')],[v10t('loans'),r.loans.length],[v10t('disbursed'),r.principal],[v10t('interest'),r.interest],[v10t('collected'),r.collected],[v10t('overdue'),r.overdue.length],[],['Loan ID',v10t('customer'),v10t('principal'),v10t('interest'),v10t('settlement'),v10t('disbursementDate'),v10t('dueDate'),v10t('status')],...r.loans.map(x=>[x.loan_id,x.customers?.full_name||'',x.principal,x.interest,x.settlement_amount,x.disbursement_date,x.due_date,loanStatus(x)]),[],[v10t('paymentDate'),'Loan ID',v10t('customer'),v10t('amount')||'Amount',v10t('collector')],...r.payments.map(x=>[x.payment_date,x.loans?.loan_id||'',x.loans?.customers?.full_name||'',x.amount,x.staff_profiles?.full_name||''])];const html='<table>'+rows.map(row=>'<tr>'+row.map(v=>`<td>${esc(v??'')}</td>`).join('')+'</tr>').join('')+'</table>';const blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`WL-Credit-Report-${r.from||'all'}-${r.to||'all'}.xls`;a.click();URL.revokeObjectURL(a.href)}
function downloadReportPdf(){const r=reportData(),w=window.open('','_blank');w.document.write(`<html><head><title>WL Credit Report</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:7px;text-align:left}.summary{display:flex;gap:20px;flex-wrap:wrap}.summary div{border:1px solid #ddd;padding:12px;min-width:130px}</style></head><body><h1>WL CREDIT</h1><h2>${esc(v10t('report'))} ${esc(r.from)} ${esc(v10t('to'))} ${esc(r.to)}</h2><div class="summary"><div>${esc(v10t('loans'))}<br><b>${r.loans.length}</b></div><div>${esc(v10t('disbursed'))}<br><b>${money(r.principal)}</b></div><div>${esc(v10t('interest'))}<br><b>${money(r.interest)}</b></div><div>${esc(v10t('collected'))}<br><b>${money(r.collected)}</b></div><div>${esc(v10t('overdue'))}<br><b>${r.overdue.length}</b></div></div><h3>${esc(v10t('loanDetails'))}</h3><table><tr><th>Loan ID</th><th>${esc(v10t('customer'))}</th><th>${esc(v10t('principal'))}</th><th>${esc(v10t('interest'))}</th><th>${esc(v10t('dueDate'))}</th><th>${esc(v10t('status'))}</th></tr>${r.loans.map(x=>`<tr><td>${esc(x.loan_id)}</td><td>${esc(x.customers?.full_name||'-')}</td><td>${money(x.principal)}</td><td>${money(x.interest)}</td><td>${date(x.due_date)}</td><td>${esc(loanStatus(x))}</td></tr>`).join('')}</table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}


function employeeOptions(selected=''){return state.employees.filter(x=>x.employment_status!=='terminated').map(x=>`<option value="${x.id}" ${String(selected)===String(x.id)?'selected':''}>${esc(x.employee_code)} · ${esc(x.full_name)}</option>`).join('')}
function renderProfitLoss(){
 const root=$('#profitLossPreview');
 if(!root)return;
 const month=$('#plMonth')?.value||isoToday().slice(0,7);
 if($('#plMonth')&&!$('#plMonth').value)$('#plMonth').value=month;
 const monthKey=v=>String(v||'').slice(0,7);
 const inMonth=v=>monthKey(v)===month;
 const num=(x,keys)=>{for(const k of keys){const n=Number(x?.[k]);if(Number.isFinite(n)&&n!==0)return n}return 0};
 const firstDate=(x,keys)=>{for(const k of keys){if(x?.[k])return x[k]}return null};
 const statusOf=x=>String(x?.payment_status||x?.status||'').toLowerCase();
 const rows=[];
 let totalCollections=0,totalDisbursed=0,totalPayroll=0,totalExpenses=0,totalAdvances=0;

 (state.repayments||[]).forEach(x=>{
  const d=firstDate(x,['payment_date','received_at','created_at']);if(!inMonth(d))return;
  const n=num(x,['amount','total_amount','received_amount']);totalCollections+=n;
  rows.push({date:d,type:'collection',desc:`${x.loans?.loan_id||x.loan_id||'-'} · ${x.loans?.customers?.full_name||x.customer_name||'-'}`,income:n,expense:0,operator:x.staff_profiles?.full_name||x.created_by_name||'-'});
 });
 (state.loans||[]).forEach(x=>{
  const d=firstDate(x,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']);if(!inMonth(d))return;
  const n=num(x,['principal','principal_amount','loan_amount','approved_principal']);totalDisbursed+=n;
  rows.push({date:d,type:'disbursement',desc:`${x.loan_id||'-'} · ${x.customers?.full_name||x.customer_name||'-'}`,income:0,expense:n,operator:x.finance_disbursed_by_name||x.disbursed_by_name||'-'});
 });
 (state.payroll||[]).forEach(x=>{
  if(!['paid','completed'].includes(statusOf(x)))return;
  const d=firstDate(x,['payment_date','paid_at','payroll_month','created_at']);if(!inMonth(d))return;
  const n=num(x,['net_salary','amount','gross_salary','basic_salary']);totalPayroll+=n;
  rows.push({date:d,type:'payroll',desc:x.employees?.full_name||x.employee_name||'-',income:0,expense:n,operator:x.paid_by_name||'-'});
 });
 (state.expenses||[]).forEach(x=>{
  const d=firstDate(x,['expense_date','payment_date','created_at']);if(!inMonth(d))return;
  const n=num(x,['amount','expense_amount']);totalExpenses+=n;
  rows.push({date:d,type:'expense',desc:x.description||x.category||'-',income:0,expense:n,operator:x.created_by_name||'-'});
 });
 (state.salaryAdvances||[]).forEach(x=>{
  if(['rejected','cancelled','deducted','settled','completed','paid'].includes(statusOf(x)))return;
  const d=firstDate(x,['advance_date','approved_at','created_at']);if(!inMonth(d))return;
  const n=num(x,['approved_amount','amount']);totalAdvances+=n;
  rows.push({date:d,type:'advance',desc:x.employees?.full_name||x.employee_name||'-',income:0,expense:n,operator:x.approved_by_name||'-'});
 });
 const net=totalCollections-totalDisbursed-totalPayroll-totalExpenses-totalAdvances;
 const L={
  collection:SWK_LANG.current==='zh'?'收款':SWK_LANG.current==='ms'?'Kutipan':'Collection',
  disbursement:SWK_LANG.current==='zh'?'放款':SWK_LANG.current==='ms'?'Pengeluaran':'Disbursement',
  payroll:SWK_LANG.current==='zh'?'工资':SWK_LANG.current==='ms'?'Gaji':'Payroll',
  expense:SWK_LANG.current==='zh'?'公司开销':SWK_LANG.current==='ms'?'Perbelanjaan Syarikat':'Company Expense',
  advance:SWK_LANG.current==='zh'?'未扣回预支工资':SWK_LANG.current==='ms'?'Pendahuluan Belum Ditolak':'Outstanding Salary Advance'
 };
 rows.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
 const tr3=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
 root.innerHTML=`<div class="stats report-stats v43-pl-grid v432-pl-grid">
  <div class="stat"><span>${tr3('总收款','Total Collections','Jumlah Kutipan')}</span><strong>${money(totalCollections)}</strong></div>
  <div class="stat"><span>${tr3('总放款','Total Disbursements','Jumlah Pengeluaran')}</span><strong>${money(totalDisbursed)}</strong></div>
  <div class="stat"><span>${tr3('已发工资','Payroll Paid','Gaji Dibayar')}</span><strong>${money(totalPayroll)}</strong></div>
  <div class="stat"><span>${tr3('公司开销','Company Expenses','Perbelanjaan Syarikat')}</span><strong>${money(totalExpenses)}</strong></div>
  <div class="stat"><span>${tr3('未扣回预支工资','Outstanding Salary Advances','Pendahuluan Belum Ditolak')}</span><strong>${money(totalAdvances)}</strong></div>
  <div class="stat"><span>${tr3('公司盈亏','Company Profit / Loss','Untung / Rugi Syarikat')}</span><strong class="${net<0?'danger-text':'success-text'}">${money(net)}</strong></div>
 </div>
 <p class="muted">${tr3('公式：总收款－总放款－已发工资－公司开销－未扣回预支工资','Formula: collections − disbursements − payroll − expenses − outstanding salary advances','Formula: kutipan − pengeluaran − gaji − perbelanjaan − pendahuluan belum ditolak')}</p>
 <div class="section-head"><h3>${tr3('收支明细','Income and Expense Details','Butiran Pendapatan dan Perbelanjaan')}</h3></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>${tr3('日期','Date','Tarikh')}</th><th>${tr3('类型','Type','Jenis')}</th><th>${tr3('说明','Description','Penerangan')}</th><th>${tr3('收入','Income','Pendapatan')}</th><th>${tr3('支出','Expense','Perbelanjaan')}</th><th>${tr3('操作人','Operator','Pengendali')}</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${date(r.date)}</td><td>${esc(L[r.type]||r.type)}</td><td>${esc(r.desc)}</td><td>${r.income?money(r.income):'-'}</td><td>${r.expense?money(r.expense):'-'}</td><td>${esc(r.operator)}</td></tr>`).join(''):`<tr><td colspan="6">${tr3('本月没有收支记录','No income or expense records for this month','Tiada rekod pendapatan atau perbelanjaan bulan ini')}</td></tr>`}</tbody></table></div>`;
}

function renderCompanyManagement(){
 if(!isAdminLevel()){const root=$('#companyManagement');if(root)root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'客服请使用“我的人事”页面。公司管理开放给财务和超级管理员。':SWK_LANG.current==='ms'?'Staf khidmat pelanggan sila gunakan halaman HR Saya. Pengurusan Syarikat tersedia untuk Kewangan dan Super Admin.':'Customer service staff should use My HR. Company Management is available to Finance and Super Admin.'}</p></div>`;return}
 if(!$('#employeeRows'))return;
 const linkedUsers=new Set(state.employees.map(x=>x.staff_user_id).filter(Boolean));
 const employeeRows=state.employees.map(x=>{
  const profile=state.staffList.find(s=>s.user_id===x.staff_user_id);
  const permissionButton=profile?`<button class="btn btn-secondary" onclick="openStaff('${profile.user_id}')">${SWK_LANG.current==='zh'?'账号与权限':SWK_LANG.current==='ms'?'Akaun & Kebenaran':'Account & Permissions'}</button>`:'';
  return `<tr><td class="mono">${esc(x.employee_code)}</td><td>${esc(x.full_name)}</td><td>${esc(x.position||profile?.role||'-')}</td><td>${esc(x.department||'-')}</td><td>${esc(x.phone||'-')}</td><td>${money(x.basic_salary)}</td><td><span class="badge ${x.employment_status==='active'?'ok':'danger'}">${esc(companyStatus(x.employment_status))}</span></td><td><button class="btn btn-secondary" onclick="openEmployee('${x.id}')">${esc(v11t('edit'))}</button> ${permissionButton} ${x.employment_status==='active'?`<button class="btn btn-primary" onclick="openPayroll(null,'${x.id}')">${esc(v11t('paySalary'))}</button>`:''} ${['super_admin','admin'].includes(state.staff?.role)&&x.staff_user_id!==state.staff?.user_id?`<button class="btn btn-danger" onclick="deleteEmployeeAccount('${x.id}')">${SWK_LANG.current==='zh'?'删除账号':SWK_LANG.current==='ms'?'Padam Akaun':'Delete Account'}</button>`:''}</td></tr>`;
 });
 const accountOnlyRows=state.staffList.filter(s=>!linkedUsers.has(s.user_id)).map(s=>`<tr><td class="mono">-</td><td>${esc(s.full_name||s.username||'-')}</td><td>${esc(s.role==='super_admin'?v10t('superAdmin'):s.role)}</td><td>-</td><td>-</td><td>${money(0)}</td><td><span class="badge ${s.is_active?'ok':'danger'}">${s.is_active?esc(v11t('active')):esc(v11t('inactive'))}</span></td><td><button class="btn btn-secondary" onclick="openStaff('${s.user_id}')">${SWK_LANG.current==='zh'?'账号与权限':SWK_LANG.current==='ms'?'Akaun & Kebenaran':'Account & Permissions'}</button></td></tr>`);
 $('#employeeRows').innerHTML=[...employeeRows,...accountOnlyRows].join('')||`<tr><td colspan="8">${esc(v11t('noRecords'))}</td></tr>`;
 $('#payrollRows').innerHTML=state.payroll.map(x=>`<tr><td>${date(x.payroll_month)}</td><td>${esc(x.employees?.full_name||'-')}</td><td>${money(x.basic_salary)}</td><td>${money(Number(x.allowance||0)+Number(x.commission||0)+Number(x.bonus||0)+Number(x.overtime||0))}</td><td>${money(Number(x.deductions||0)+Number(x.salary_advance_deduction||0))}</td><td><strong>${money(x.net_salary)}</strong></td><td>${esc(companyStatus(x.payment_status))}</td><td><button class="btn btn-secondary" onclick="openPayroll('${x.id}')">${esc(v11t('edit'))}</button></td></tr>`).join('')||`<tr><td colspan="8">${esc(v11t('noRecords'))}</td></tr>`;
 $('#expenseRows').innerHTML=state.expenses.map(x=>`<tr><td>${date(x.expense_date)}</td><td>${esc(x.category)}</td><td>${esc(x.description||'-')}</td><td>${money(x.amount)}</td><td>${esc(x.payment_method||'-')}</td><td><button class="btn btn-secondary" onclick="openExpense('${x.id}')">${esc(v11t('edit'))}</button></td></tr>`).join('')||`<tr><td colspan="6">${esc(v11t('noRecords'))}</td></tr>`;
 $('#incomeRows').innerHTML=state.companyIncome.map(x=>`<tr><td>${date(x.income_date)}</td><td>${esc(x.category)}</td><td>${esc(x.description||'-')}</td><td>${money(x.amount)}</td><td><button class="btn btn-secondary" onclick="openCompanyIncome('${x.id}')">${esc(v11t('edit'))}</button></td></tr>`).join('')||`<tr><td colspan="5">${esc(v11t('noRecords'))}</td></tr>`;
 $('#attendanceRows').innerHTML=state.attendance.map(x=>`<tr><td>${date(x.attendance_date)}</td><td>${esc(x.employees?.full_name||'-')}</td><td>${esc(companyStatus(x.status))}</td><td>${esc(x.clock_in||'-')}</td><td>${esc(x.clock_out||'-')}</td><td>${esc(x.notes||'-')}</td><td><button class="btn btn-secondary" onclick="openAttendance('${x.id}')">${esc(v11t('edit'))}</button></td></tr>`).join('')||`<tr><td colspan="7">${esc(v11t('noRecords'))}</td></tr>`;
 $('#advanceRows').innerHTML=state.salaryAdvances.map(x=>`<tr><td>${date(x.advance_date)}</td><td>${esc(x.employees?.full_name||'-')}</td><td>${money(x.amount)}</td><td>${esc(x.reason||'-')}</td><td>${esc(x.deduction_month||'-')}</td><td>${esc(companyStatus(x.status))}</td><td><button class="btn btn-secondary" onclick="openSalaryAdvance('${x.id}')">${esc(v11t('edit'))}</button></td></tr>`).join('')||`<tr><td colspan="7">${esc(v11t('noRecords'))}</td></tr>`;
 if($('#plMonth')&&!$('#plMonth').value)$('#plMonth').value=isoToday().slice(0,7);renderProfitLoss();
}
function canApproveAdvances(){return isAdminLevel()}
function ownEmployee(){return state.employees.find(v=>v.staff_user_id===state.staff?.user_id)}
function companyGuard(payroll=false){if(isAdminLevel())return true;toast(tr('noAccess'),true);return false}
window.deleteEmployeeAccount=async id=>{
 const x=state.employees.find(v=>v.id===id);
 if(!x||!['super_admin','admin'].includes(state.staff?.role))return toast(tr('noAccess'),true);
 const label=x.full_name||x.employee_code||'employee';
 const message=SWK_LANG.current==='zh'?`确定永久删除 ${label} 的员工账号吗？删除后将无法登录。`:SWK_LANG.current==='ms'?`Padam akaun pekerja ${label} secara kekal? Selepas dipadam, pekerja tidak boleh log masuk.`:`Permanently delete ${label}'s employee account? They will no longer be able to sign in.`;
 if(!confirm(message))return;
 const payload={
  action:'delete_employee',
  employee_id:x.id,
  id:x.id,
  user_id:x.staff_user_id||null,
  employee_user_id:x.staff_user_id||null,
  target_user_id:x.staff_user_id||null
 };
 let {data,error}=await invokeStaffAdmin(payload);
 let msg=data?.error||error?.message||'';
 try{const d=await error?.context?.json?.();if(d?.error)msg=d.error}catch(_){ }
 // Compatibility fallback for legacy employees and older deployed Edge Functions.
 // The SQL RPC removes the employee record and dependent company records by employee ID.
 if(error||data?.error){
  const legacyMissingUser=/employee user id is required|user id is required/i.test(msg)||!x.staff_user_id;
  if(legacyMissingUser){
   const {data:rpcData,error:rpcError}=await sb.rpc('admin_delete_employee_record',{p_employee_id:x.id});
   if(rpcError||rpcData?.ok===false)return toast(rpcData?.error||rpcError?.message||msg||'Delete failed',true);
   data=rpcData;error=null;
  }else return toast(msg||'Delete failed',true);
 }
 toast(SWK_LANG.current==='zh'?'员工账号／资料已删除':SWK_LANG.current==='ms'?'Akaun / rekod pekerja dipadam':'Employee account / record deleted');
 await loadAll();
};
window.openEmployee=id=>{
 if(!companyGuard())return;
 const x=state.employees.find(v=>v.id===id)||{};
 const creating=!id;
 if(creating){
  if(!(isSuperAdmin()||normalizedRole(state.staff?.role)==='finance'))return toast(tr('noAccess'),true);
  modal(`<h2>${SWK_LANG.current==='zh'?'新增员工账号':SWK_LANG.current==='ms'?'Cipta Akaun Pekerja':'Create Employee Account'}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('username')}</label><input name="login_username" required minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" autocomplete="off" placeholder="example: john"></div><div class="field"><label>${v11t('staffRole')}</label><select name="login_role"><option value="customer_service">${SWK_LANG.current==='zh'?'客服':SWK_LANG.current==='ms'?'Khidmat Pelanggan':'Customer Service'}</option>${isSuperAdmin()?`<option value="finance">${SWK_LANG.current==='zh'?'财务':SWK_LANG.current==='ms'?'Kewangan':'Finance'}</option><option value="super_admin">Super Admin</option>`:``}</select></div><div class="field"><label>${v11t('loginPassword')}</label><input name="login_password" type="password" required minlength="8" autocomplete="new-password"></div><div class="field"><label>${v11t('confirmPassword')}</label><input name="login_confirm" type="password" required minlength="8" autocomplete="new-password"></div></div><p class="muted">${SWK_LANG.current==='zh'?'员工登录后可在“我的人事”自行填写姓名、IC、电话、银行资料和地址。':SWK_LANG.current==='ms'?'Pekerja boleh melengkapkan profil sendiri di “HR Saya” selepas log masuk.':'The employee can complete their own profile in “My HR” after signing in.'}</p><button class="btn btn-primary">${SWK_LANG.current==='zh'?'建立账号':SWK_LANG.current==='ms'?'Cipta Akaun':'Create Account'}</button></form>`);
  $('#companyForm').onsubmit=async e=>{
   e.preventDefault();
   const f=new FormData(e.target),pw=String(f.get('login_password')||''),confirm=String(f.get('login_confirm')||'');
   if(pw!==confirm)return toast(v11t('confirmPassword')+': mismatch',true);
   const role=String(f.get('login_role')||'customer_service');const payload={action:'create_employee',username:String(f.get('login_username')||'').trim(),password:pw,role,permissions:WL_ROLE_DEFAULT_PERMISSIONS[role]||{},is_active:true};
   const {data,error}=await invokeStaffAdmin(payload);
   if(error||data?.error){
    let message=data?.error||error?.message||'Request failed';
    try{const detail=await error?.context?.json?.();if(detail?.error)message=detail.error}catch(_){ }
    return toast(message,true);
   }
   const msg=`WL Credit Staff Login\n\nUsername: ${payload.username}\nPassword: ${pw}\n\nLogin: ${location.origin}/admin/`;
   modal(`<h2>${v11t('saved')}</h2><div class="application-login-box"><p><strong>${v11t('username')}:</strong> ${esc(payload.username)}</p><p><strong>${v11t('loginPassword')}:</strong> ${esc(pw)}</p><button id="copyEmployeeLogin" class="btn btn-primary">Copy Login</button></div>`);
   $('#copyEmployeeLogin').onclick=async()=>{await navigator.clipboard.writeText(msg);toast(v11t('saved'))};
   await loadAll();
  };
  return;
 }
 modal(`<h2>${v11t('edit')} ${v11t('employee')}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('fullName')}</label><input name="full_name" required value="${esc(x.full_name||'')}"></div><div class="field"><label>${v11t('icPassport')}</label><input name="id_number" value="${esc(x.id_number||'')}"></div><div class="field"><label>${v11t('phone')}</label><input name="phone" value="${esc(x.phone||'')}"></div><div class="field"><label>${v11t('position')}</label><input name="position" value="${esc(x.position||'')}"></div><div class="field"><label>${v11t('department')}</label><input name="department" value="${esc(x.department||'')}"></div><div class="field"><label>${v11t('joinDate')}</label><input name="join_date" type="date" value="${x.join_date||isoToday()}"></div><div class="field"><label>${v11t('basicSalary')} (MYR)</label><input name="basic_salary" type="number" min="0" step="0.01" value="${x.basic_salary||0}"></div><div class="field"><label>${v11t('status')}</label><select name="employment_status"><option value="active">${v11t('active')}</option><option value="inactive" ${x.employment_status==='inactive'?'selected':''}>${v11t('inactive')}</option><option value="terminated" ${x.employment_status==='terminated'?'selected':''}>${v11t('terminated')}</option></select></div><div class="field"><label>${v11t('bankName')}</label><input name="bank_name" value="${esc(x.bank_name||'')}"></div><div class="field"><label>${v11t('bankAccount')}</label><input name="bank_account" value="${esc(x.bank_account||'')}"></div></div><div class="field"><label>${v11t('addressNotes')}</label><textarea name="notes">${esc(x.notes||'')}</textarea></div><button class="btn btn-primary">${v11t('save')}</button></form>`);
 $('#companyForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const o={full_name:f.get('full_name'),id_number:f.get('id_number'),phone:f.get('phone'),position:f.get('position'),department:f.get('department'),join_date:f.get('join_date'),basic_salary:Number(f.get('basic_salary')||0),employment_status:f.get('employment_status'),bank_name:f.get('bank_name'),bank_account:f.get('bank_account'),notes:f.get('notes'),updated_by:state.staff.user_id};const r=await sb.from('employees').update(o).eq('id',id);if(r.error)return toast(r.error.message,true);toast(v11t('saved'));closeModal();loadAll()}
}
window.openPayroll=(id,employeeId)=>{if(!companyGuard(true))return;const x=state.payroll.find(v=>v.id===id)||{},selectedEmployee=x.employee_id||employeeId||state.employees.find(v=>v.employment_status==='active')?.id||'',employee=state.employees.find(v=>v.id===selectedEmployee),advanceTotal=state.salaryAdvances.filter(v=>v.employee_id===selectedEmployee&&(['pending','approved'].includes(v.status)||(v.status==='deducted'&&!v.payroll_record_id))).reduce((sum,v)=>sum+Number(v.amount||0),0),basic=id?Number(x.basic_salary||0):Number(employee?.basic_salary||0),advance=id?Number(x.salary_advance_deduction||0):advanceTotal;modal(`<h2>${id?v11t('edit'):v11t('paySalary')}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('employee')}</label><select name="employee_id" required>${employeeOptions(selectedEmployee)}</select></div><div class="field"><label>${v11t('payrollDate')}</label><input name="payroll_month" type="date" required value="${x.payroll_month||isoToday()}"></div><div class="field"><label>${v11t('basicSalary')}</label><input name="basic_salary" type="number" min="0" step="0.01" value="${basic}"></div><div class="field"><label>${v11t('allowance')}</label><input name="allowance" type="number" min="0" step="0.01" value="${x.allowance||0}"></div><div class="field"><label>${v11t('commission')}</label><input name="commission" type="number" min="0" step="0.01" value="${x.commission||0}"></div><div class="field"><label>${v11t('bonus')}</label><input name="bonus" type="number" min="0" step="0.01" value="${x.bonus||0}"></div><div class="field"><label>${v11t('overtime')}</label><input name="overtime" type="number" min="0" step="0.01" value="${x.overtime||0}"></div><div class="field"><label>${v11t('deductions')}</label><input name="deductions" type="number" min="0" step="0.01" value="${x.deductions||0}"></div><div class="field"><label>${v11t('outstandingAdvance')}</label><input name="salary_advance_deduction" type="number" min="0" step="0.01" value="${advance}" readonly><small>${v11t('advanceAutoDeduct')}</small></div><div class="field"><label>${v11t('paymentStatus')}</label><select name="payment_status"><option value="pending">${v11t('pending')}</option><option value="paid" ${!id||x.payment_status==='paid'?'selected':''}>${v11t('paid')}</option></select></div><div class="field"><label>${v11t('paymentDate')}</label><input name="payment_date" type="date" value="${x.payment_date||isoToday()}"></div></div><div class="stat" style="margin:14px 0"><span>${v11t('calculatedSalary')}</span><strong id="payrollNetPreview">${money(basic-advance)}</strong></div><button class="btn btn-primary">${v11t('paySalary')}</button></form>`);const form=$('#companyForm'),recalc=()=>{const val=n=>Number(form.elements[n]?.value||0),net=val('basic_salary')+val('allowance')+val('commission')+val('bonus')+val('overtime')-val('deductions')-val('salary_advance_deduction');$('#payrollNetPreview').textContent=money(net)};['basic_salary','allowance','commission','bonus','overtime','deductions'].forEach(n=>form.elements[n].addEventListener('input',recalc));form.elements.employee_id.addEventListener('change',()=>openPayroll(id,form.elements.employee_id.value));saveCompanyForm('payroll_records',id,true)}
window.openExpense=id=>openMoneyRecord('company_expenses',id,'expense');window.openCompanyIncome=id=>openMoneyRecord('company_income',id,'income');
function openMoneyRecord(table,id,labelKey){if(!companyGuard())return;const list=table==='company_expenses'?state.expenses:state.companyIncome,x=list.find(v=>v.id===id)||{},dkey=table==='company_expenses'?'expense_date':'income_date';modal(`<h2>${id?v11t('edit'):v11t('add')} ${v11t(labelKey)}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('date')}</label><input name="${dkey}" type="date" required value="${x[dkey]||isoToday()}"></div><div class="field"><label>${v11t('category')}</label><input name="category" required value="${esc(x.category||'')}"></div><div class="field"><label>${v11t('amount')} (MYR)</label><input name="amount" type="number" min="0.01" step="0.01" required value="${x.amount||''}"></div><div class="field"><label>${v11t('paymentMethod')}</label><input name="payment_method" value="${esc(x.payment_method||'')}"></div></div><div class="field"><label>${v11t('description')}</label><textarea name="description">${esc(x.description||'')}</textarea></div><button class="btn btn-primary">${v11t('save')}</button></form>`);saveCompanyForm(table,id)}
window.openAttendance=id=>{if(!companyGuard())return;const x=state.attendance.find(v=>v.id===id)||{};modal(`<h2>${v11t('attendance')}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('employee')}</label><select name="employee_id" required>${employeeOptions(x.employee_id)}</select></div><div class="field"><label>${v11t('date')}</label><input name="attendance_date" type="date" required value="${x.attendance_date||isoToday()}"></div><div class="field"><label>${v11t('status')}</label><select name="status">${['present','late','leave','absent','off'].map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${v11t(v)}</option>`).join('')}</select></div><div class="field"><label>${v11t('clockIn')}</label><input name="clock_in" type="time" value="${x.clock_in||''}"></div><div class="field"><label>${v11t('clockOut')}</label><input name="clock_out" type="time" value="${x.clock_out||''}"></div></div><div class="field"><label>${v11t('notes')}</label><textarea name="notes">${esc(x.notes||'')}</textarea></div><button class="btn btn-primary">${v11t('save')}</button></form>`);saveCompanyForm('attendance_records',id)}
window.openSalaryAdvance=id=>{if(!companyGuard(true))return;const x=state.salaryAdvances.find(v=>v.id===id)||{};const statuses=canApproveAdvances()?['requested','approved','rejected','deducted','cancelled']:['requested'];modal(`<h2>${v11t('salaryAdvance')}</h2><form id="companyForm"><div class="grid2"><div class="field"><label>${v11t('employee')}</label><select name="employee_id" required>${employeeOptions(x.employee_id)}</select></div><div class="field"><label>${v11t('date')}</label><input name="advance_date" type="date" required value="${x.advance_date||isoToday()}"></div><div class="field"><label>${v11t('amount')}</label><input name="amount" type="number" min="0.01" step="0.01" required value="${x.amount||''}"></div><div class="field"><label>${v11t('deductionMonth')}</label><input name="deduction_month" type="date" value="${x.deduction_month||''}"></div><div class="field"><label>${v11t('status')}</label><select name="status">${statuses.map(v=>`<option value="${v}" ${x.status===v?'selected':''}>${v11t(v)}</option>`).join('')}</select></div></div><div class="field"><label>${v11t('reason')}</label><textarea name="reason">${esc(x.reason||'')}</textarea></div><button class="btn btn-primary">${v11t('save')}</button></form>`);saveCompanyForm('salary_advances',id)}
function saveCompanyForm(table,id,payroll=false){$('#companyForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o=Object.fromEntries(f.entries());for(const k of ['basic_salary','allowance','commission','bonus','overtime','deductions','salary_advance_deduction','amount'])if(k in o)o[k]=Number(o[k]||0);for(const k of ['staff_user_id','deduction_month','payment_date'])if(k in o&&!o[k])o[k]=null;if(table==='payroll_records')o.net_salary=Number(o.basic_salary)+Number(o.allowance)+Number(o.commission)+Number(o.bonus)+Number(o.overtime)-Number(o.deductions)-Number(o.salary_advance_deduction);o.updated_by=state.staff.user_id;let r;if(table==='payroll_records'){r=id?await sb.from(table).update(o).eq('id',id).select().single():await sb.from(table).insert(o).select().single()}else{if(table==='salary_advances'&&o.status==='deducted'&&!o.deducted_at)o.deducted_at=new Date().toISOString();r=id?await sb.from(table).update(o).eq('id',id).select().single():await sb.from(table).insert(o).select().single()}if(r.error)return toast(r.error.message,true);if(table==='salary_advances'&&id&&r.data){const i=state.salaryAdvances.findIndex(v=>v.id===id);if(i>=0)state.salaryAdvances[i]={...state.salaryAdvances[i],...r.data}}if(table==='payroll_records'&&o.payment_status==='paid'&&Number(o.salary_advance_deduction)>0){const payrollId=r.data?.id||id;const advanceIds=state.salaryAdvances.filter(v=>v.employee_id===o.employee_id&&!v.payroll_record_id&&(['pending','approved','deducted'].includes(v.status))).map(v=>v.id);if(advanceIds.length){const ar=await sb.from('salary_advances').update({status:'deducted',deduction_month:o.payroll_month,payroll_record_id:payrollId,deducted_at:new Date().toISOString(),updated_by:state.staff.user_id}).in('id',advanceIds);if(ar.error)return toast(ar.error.message,true)}}toast(v11t('saved'));closeModal();await loadAll()}}

function renderMyHr(){
 const root=$('#myHrContent');if(!root)return;const emp=ownEmployee();
 const attendance=emp?state.attendance.filter(v=>v.employee_id===emp.id):[];
 const mine=emp?state.salaryAdvances.filter(v=>v.employee_id===emp.id):[];
 const today=localISO(new Date()),todayRecord=attendance.find(v=>v.attendance_date===today);
 const attendanceCard=!emp
  ?`<div class="card" style="margin-top:16px"><div class="section-head"><h2>${v11t('todayAttendance')}</h2></div><p class="muted">${v11t('attendanceProfileRequired')}</p></div>`
  :`<div class="card attendance-clock-card" style="margin-top:16px"><div class="section-head"><h2>${v11t('todayAttendance')}</h2><strong>${date(today)}</strong></div>
    <div class="stats"><div class="stat"><span>${v11t('status')}</span><strong>${todayRecord?.clock_out?v11t('completed'):todayRecord?.clock_in?v11t('checkedIn'):v11t('notCheckedIn')}</strong></div><div class="stat"><span>${v11t('checkInTime')}</span><strong>${esc(todayRecord?.clock_in||'-')}</strong></div><div class="stat"><span>${v11t('checkOutTime')}</span><strong>${esc(todayRecord?.clock_out||'-')}</strong></div></div>
    <div style="margin-top:16px">${!todayRecord?.clock_in?`<button class="btn btn-primary" onclick="clockIn()">✅ ${v11t('checkIn')}</button>`:!todayRecord?.clock_out?`<button class="btn btn-danger" onclick="clockOut()">⏹ ${v11t('checkOut')}</button>`:`<span class="badge approved">✓ ${v11t('completed')}</span>`}</div></div>`;
 root.innerHTML=`<div class="card"><div class="section-head"><h2>${v11t('myProfile')}</h2><button class="btn btn-primary" onclick="openMyEmployeeProfile()">${v11t(emp?'edit':'saveMyProfile')}</button></div>${emp?`<div class="stats"><div class="stat"><span>${v11t('employeeId')}</span><strong>${esc(emp.employee_code||'-')}</strong></div><div class="stat"><span>${v11t('name')}</span><strong>${esc(emp.full_name||'-')}</strong></div><div class="stat"><span>${v11t('position')}</span><strong>${esc(emp.position||'-')}</strong></div><div class="stat"><span>${v11t('department')}</span><strong>${esc(emp.department||'-')}</strong></div></div>`:`<p class="muted">${v11t('saveMyProfile')}</p>`}</div>
 ${attendanceCard}
 <div class="card" style="margin-top:16px"><div class="section-head"><h2>${v11t('attendance')}</h2></div><div class="table-wrap"><table class="table"><thead><tr><th>${v11t('date')}</th><th>${v11t('status')}</th><th>${v11t('clockIn')}</th><th>${v11t('clockOut')}</th></tr></thead><tbody>${attendance.map(v=>`<tr><td>${date(v.attendance_date)}</td><td>${esc(companyStatus(v.status))}</td><td>${esc(v.clock_in||'-')}</td><td>${esc(v.clock_out||'-')}</td></tr>`).join('')||`<tr><td colspan="4">${v11t('noRecords')}</td></tr>`}</tbody></table></div></div>
 <div class="card" style="margin-top:16px"><div class="section-head"><h2>${v11t('myAdvanceRequests')}</h2><button class="btn btn-primary" ${emp?'':'disabled'} onclick="openMyAdvanceRequest()">${v11t('requestAdvance')}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${v11t('date')}</th><th>${v11t('amount')}</th><th>${v11t('reason')}</th><th>${v11t('status')}</th></tr></thead><tbody>${mine.map(v=>`<tr><td>${date(v.advance_date)}</td><td>${money(v.amount)}</td><td>${esc(v.reason||'-')}</td><td>${esc(companyStatus(v.status))}</td></tr>`).join('')||`<tr><td colspan="4">${v11t('noRecords')}</td></tr>`}</tbody></table></div></div>`
}
window.clockIn=async()=>{const emp=ownEmployee();if(!emp)return toast(v11t('attendanceProfileRequired'),true);const button=event?.currentTarget;if(button)button.disabled=true;const r=await sb.rpc('staff_clock_in');if(r.error){if(button)button.disabled=false;return toast(r.error.message,true)}toast(v11t('checkInSuccess'));await loadAll()}
window.clockOut=async()=>{const emp=ownEmployee();if(!emp)return toast(v11t('attendanceProfileRequired'),true);const button=event?.currentTarget;if(button)button.disabled=true;const r=await sb.rpc('staff_clock_out');if(r.error){if(button)button.disabled=false;return toast(r.error.message,true)}toast(v11t('checkOutSuccess'));await loadAll()}

function applyRoleVisibility(){
 const admin=isAdminLevel(),superAdmin=isSuperAdmin(),companyBtn=$('#nav button[data-section="companyManagement"]'),companySection=$('#companyManagement'),auditBtn=$('#nav button[data-section="auditLogs"]'),auditSection=$('#auditLogs');
 if(companyBtn)companyBtn.classList.toggle('hidden',!admin);if(companySection&&!admin)companySection.classList.remove('active');
 if(auditBtn)auditBtn.classList.toggle('hidden',!superAdmin);if(auditSection&&!superAdmin)auditSection.classList.remove('active');
 if(!admin&&localStorage.getItem('wl_active_section')==='companyManagement')localStorage.setItem('wl_active_section','myHr');
 if(!superAdmin&&localStorage.getItem('wl_active_section')==='auditLogs')localStorage.setItem('wl_active_section','dashboard');
 document.body.dataset.staffRole=String(state.staff?.role||'');
}
window.openMyEmployeeProfile=()=>{const x=ownEmployee()||{};modal(`<h2>${v11t('myProfile')}</h2><form id="myEmployeeForm"><div class="grid2"><div class="field"><label>${v11t('fullName')}</label><input name="full_name" required value="${esc(x.full_name||state.staff.full_name||'')}"></div><div class="field"><label>${v11t('icPassport')}</label><input name="id_number" value="${esc(x.id_number||'')}"></div><div class="field"><label>${v11t('phone')}</label><input name="phone" value="${esc(x.phone||'')}"></div><div class="field"><label>${v11t('bankName')}</label><input name="bank_name" value="${esc(x.bank_name||'')}"></div><div class="field"><label>${v11t('bankAccount')}</label><input name="bank_account" value="${esc(x.bank_account||'')}"></div></div><div class="field"><label>${v11t('addressNotes')}</label><textarea name="address">${esc(x.address||'')}</textarea></div><button class="btn btn-primary">${v11t('saveMyProfile')}</button></form>`);$('#myEmployeeForm').onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));const r=await sb.rpc('save_my_employee_profile',{p_full_name:o.full_name,p_id_number:o.id_number||null,p_phone:o.phone||null,p_bank_name:o.bank_name||null,p_bank_account:o.bank_account||null,p_address:o.address||null});if(r.error)return toast(r.error.message,true);toast(v11t('saved'));closeModal();await loadAll()}}
window.openMyAdvanceRequest=()=>{const emp=ownEmployee();if(!emp)return toast(v11t('saveMyProfile'),true);modal(`<h2>${v11t('requestAdvance')}</h2><form id="myAdvanceForm"><div class="grid2"><div class="field"><label>${v11t('date')}</label><input name="advance_date" type="date" value="${isoToday()}" required></div><div class="field"><label>${v11t('amount')}</label><input name="amount" type="number" min="0.01" step="0.01" required></div></div><div class="field"><label>${v11t('reason')}</label><textarea name="reason" required></textarea></div><button class="btn btn-primary">${v11t('requestAdvance')}</button></form>`);$('#myAdvanceForm').onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));o.amount=Number(o.amount);o.employee_id=emp.id;o.status='requested';o.requested_by=state.staff.user_id;o.updated_by=state.staff.user_id;const r=await sb.from('salary_advances').insert(o);if(r.error)return toast(r.error.message,true);toast(v11t('saved'));closeModal();await loadAll()}}


function telegramText(en,zh,ms){return SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en}
function renderTelegramSettings(){
 const show=isSuperAdmin(),tab=$('#telegramTabBtn');if(tab)tab.classList.toggle('hidden',!show);if(!show)return;
 const x=state.telegramSettings||{};
 if($('#telegramBotToken'))$('#telegramBotToken').value=x.bot_token||'';
 if($('#dailyReportChatId'))$('#dailyReportChatId').value=x.daily_report_chat_id||'';
 if($('#notificationChatId'))$('#notificationChatId').value=x.notification_chat_id||'';
 if($('#dailyReportTime'))$('#dailyReportTime').value=(x.daily_report_time||'21:05').slice(0,5);
 if($('#telegramEnabled'))$('#telegramEnabled').checked=x.is_enabled===true;
 const labels={
 title:telegramText('Telegram Bot Settings','Telegram 机器人设置','Tetapan Bot Telegram'),
 help:telegramText('Daily report and instant loan/payment notifications are sent to separate groups.','每日报告和贷款／付款即时通知会发送到两个不同的群组。','Laporan harian dan notifikasi pinjaman/bayaran dihantar ke dua kumpulan berasingan.'),
 token:telegramText('Bot Token','机器人 Token','Token Bot'),time:telegramText('Daily Report Time (Malaysia)','每日报告时间（马来西亚）','Masa Laporan Harian (Malaysia)'),
 daily:telegramText('Daily Report Chat ID','每日报告群 Chat ID','ID Chat Laporan Harian'),notify:telegramText('Notification Chat ID','工作通知群 Chat ID','ID Chat Notifikasi'),enabled:telegramText('Enable Telegram','启用 Telegram','Aktifkan Telegram'),
 save:telegramText('Save Telegram Settings','保存 Telegram 设置','Simpan Tetapan Telegram'),testDaily:telegramText('Test Daily Report Group','测试每日报告群','Uji Kumpulan Laporan'),testNotify:telegramText('Test Notification Group','测试工作通知群','Uji Kumpulan Notifikasi'),sendNow:telegramText('Send Today’s Report Now','立即发送今日报告','Hantar Laporan Hari Ini Sekarang')};
 const map={telegramSettingsTitle:'title',telegramSettingsHelp:'help',telegramBotTokenLabel:'token',dailyReportTimeLabel:'time',dailyReportChatLabel:'daily',notificationChatLabel:'notify',telegramEnabledLabel:'enabled',saveTelegramSettingsBtn:'save',testDailyReportBtn:'testDaily',testNotificationBtn:'testNotify',sendDailyReportNowBtn:'sendNow'};for(const [id,k] of Object.entries(map)){const e=$('#'+id);if(e)e.textContent=labels[k]}
}
async function saveTelegramSettings(e){e.preventDefault();if(!isSuperAdmin())return toast(tr('noAccess'),true);const payload={id:1,bot_token:$('#telegramBotToken').value.trim(),daily_report_chat_id:$('#dailyReportChatId').value.trim(),notification_chat_id:$('#notificationChatId').value.trim(),daily_report_time:$('#dailyReportTime').value||'21:05',is_enabled:$('#telegramEnabled').checked,updated_by:state.staff.user_id,updated_at:new Date().toISOString()};const r=await sb.from('telegram_settings').upsert(payload).select().single();if(r.error)return toast(r.error.message,true);state.telegramSettings=r.data;toast(telegramText('Telegram settings saved','Telegram 设置已保存','Tetapan Telegram disimpan'))}
async function testTelegram(kind){if(!isSuperAdmin())return toast(tr('noAccess'),true);const {data,error}=await sb.functions.invoke('telegram-bot',{body:{action:kind==='daily'?'test_daily':'test_notification'}});if(error||data?.error){let msg=data?.error||error?.message||'Telegram test failed';try{const d=await error?.context?.json?.();if(d?.error)msg=d.error}catch(_){ }return toast(msg,true)}toast(telegramText('Test message sent','测试消息已发送','Mesej ujian dihantar'))}
async function sendDailyReportNow(){if(!isSuperAdmin())return toast(tr('noAccess'),true);if(!confirm(telegramText('Send today’s full report to the Telegram daily report group now?','确定现在发送今日完整报告到 Telegram 每日报告群吗？','Hantar laporan penuh hari ini ke kumpulan laporan Telegram sekarang?')))return;const btn=$('#sendDailyReportNowBtn'),old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent=telegramText('Sending...','发送中...','Menghantar...')}try{const {data,error}=await sb.functions.invoke('telegram-bot',{body:{action:'scheduled_daily_report',force:true}});if(error||data?.error){let msg=data?.error||error?.message||'Send failed';try{const d=await error?.context?.json?.();if(d?.error)msg=d.error}catch(_){ }return toast(msg,true)}toast(telegramText('Today’s report has been sent','今日报告已发送','Laporan hari ini telah dihantar'))}finally{if(btn){btn.disabled=false;btn.textContent=old||telegramText('Send Today’s Report Now','立即发送今日报告','Hantar Laporan Hari Ini Sekarang')}}}

async function productionReset(){
 if(!isSuperAdmin())return toast(tr('noAccess'),true);
 const typed=prompt(v10t('resetConfirm'));
 if(typed!=='RESET WL CREDIT')return;
 if(!confirm(v10t('resetFinal')))return;
 const {data,error}=await invokeStaffAdmin({action:'production_reset',confirmation:'RESET WL CREDIT'});
 if(error||data?.error){let msg=data?.error||error?.message||'Reset failed';try{const d=await error?.context?.json?.();if(d?.error)msg=d.error}catch(_){ }return toast(msg,true)}
 const x={error:null};
 if(x.error)return toast(x.error.message,true);
 toast(v10t('resetDone'));
 await loadAll();
}

async function handleStaffLogin(e){
 e.preventDefault();
 const btn=e.submitter||document.querySelector('#staffLogin button[type="submit"]')||document.querySelector('#staffLogin button');
 const oldText=btn?btn.textContent:'';
 try{
  if(btn){btn.disabled=true;btn.textContent=SWK_LANG.current==='zh'?'登录中...':SWK_LANG.current==='ms'?'Sedang log masuk...':'Signing in...'}
  const username=$('#staffUsername').value.trim();
  const password=$('#staffPassword').value;
  let email=username;
  if(!username.includes('@')){
   const {data,error}=await sb.functions.invoke('resolve-username',{body:{username}});
   if(error||data?.error)throw new Error(data?.error||error?.message||tr('invalidLogin'));
   email=data.email;
  }
  const x=await sb.auth.signInWithPassword({email,password});
  if(x.error)throw x.error;
  await enter();
 }catch(err){
  console.error('Staff login failed:',err);
  toast(err?.message||tr('invalidLogin'),true);
 }finally{
  if(btn){btn.disabled=false;btn.textContent=oldText||tr('login')}
 }
}

document.addEventListener('DOMContentLoaded',async()=>{
 const loginForm=$('#staffLogin');
 if(loginForm)loginForm.addEventListener('submit',handleStaffLogin);
 const on=(selector,event,handler)=>{const el=$(selector);if(el)el.addEventListener(event,handler);return el};
 const setHandler=(selector,prop,handler)=>{const el=$(selector);if(el)el[prop]=handler;return el};
 // Bind critical create buttons directly so they work even when inline handlers are cached or blocked.
 setHandler('#addCustomerBtn','onclick',()=>window.openCustomer());
 setHandler('#addBankBtn','onclick',()=>window.openBank());
 setHandler('#addStaffBtn','onclick',()=>window.openStaff());
 const addEmployeeButton=document.querySelector('[data-company-tab="employeesPanel"]')?.closest('section')?.querySelector('#employeesPanel .section-head .btn-primary')||document.querySelector('#employeesPanel .section-head .btn-primary');
 if(addEmployeeButton)addEmployeeButton.onclick=()=>window.openEmployee();
 try{
  SWK_LANG.init();
  applyV12NavLabels();
  $$('.company-tab').forEach(b=>b.onclick=()=>{
   $$('.company-tab').forEach(x=>x.className='btn btn-secondary company-tab');
   b.className='btn btn-primary company-tab';
   $$('.company-panel').forEach(x=>x.classList.remove('active'));
   const panel=$('#'+b.dataset.companyTab);if(panel)panel.classList.add('active');if(b.dataset.companyTab==='profitLossPanel')setTimeout(()=>window.renderProfitLoss?.(),0);
  });
  applyV10Labels();
  $$('.system-tab').forEach(b=>b.onclick=()=>{
   $$('.system-tab').forEach(x=>x.className='btn btn-secondary system-tab');
   b.className='btn btn-primary system-tab';
   $$('.system-panel').forEach(x=>x.classList.remove('active'));
   const panel=$('#'+b.dataset.tab);if(panel)panel.classList.add('active');
  });
  setHandler('#defaultAssignmentForm','onsubmit',async e=>{
   e.preventDefault();if(!requirePerm('settings_manage'))return;
   const payload={id:1,announcement:state.settings?.announcement||'',default_bank_id:$('#defaultBankSelect')?.value||null,default_whatsapp_id:$('#defaultWhatsappSelect')?.value||null,default_telegram_id:$('#defaultTelegramSelect')?.value||null,auto_assign_enabled:$('#autoAssignEnabled')?.checked===true,updated_by:state.staff.user_id,updated_at:new Date().toISOString()};
   const x=await sb.from('app_settings').upsert(payload);if(x.error)return toast(x.error.message,true);toast(tr('saved'));await loadAll();
  });
  const setReportRange=(a,b)=>{if($('#reportFrom'))$('#reportFrom').value=a;if($('#reportTo'))$('#reportTo').value=b;renderReportPreview()};
  setHandler('#reportToday','onclick',()=>setReportRange(isoToday(),isoToday()));
  setHandler('#reportMonth','onclick',()=>{const d=new Date(),a=new Date(d.getFullYear(),d.getMonth(),1),b=new Date(d.getFullYear(),d.getMonth()+1,0);setReportRange(localISO(a),localISO(b))});
  setHandler('#reportFrom','onchange',renderReportPreview);
  setHandler('#reportTo','onchange',renderReportPreview);
  setHandler('#downloadExcel','onclick',downloadReportExcel);
  setHandler('#downloadPdf','onclick',downloadReportPdf);
  window.addEventListener('swk-language-applied',()=>{updateSoundButton();if(state.staff)renderAll()});
  setHandler('#enableSoundBtn','onclick',toggleNotificationSound);
  setHandler('#productionResetBtn','onclick',productionReset);
  setHandler('#telegramSettingsForm','onsubmit',saveTelegramSettings);
  setHandler('#testDailyReportBtn','onclick',()=>testTelegram('daily'));
  setHandler('#testNotificationBtn','onclick',()=>testTelegram('notification'));
  setHandler('#sendDailyReportNowBtn','onclick',sendDailyReportNow);
  setHandler('#customerSearch','oninput',renderCustomers);
  const initial=getRange('today');setDateRange(initial[0],initial[1],'today');
  $$('.date-preset').forEach(b=>b.onclick=()=>{const r=getRange(b.dataset.range);setDateRange(r[0],r[1],b.dataset.range)});
  setHandler('#applyDateRange','onclick',()=>setDateRange($('#dateFrom')?.value,$('#dateTo')?.value,'custom'));
  if($('#auditFrom')&&!$('#auditFrom').value)$('#auditFrom').value=addDays(isoToday(),-179);
  if($('#auditTo')&&!$('#auditTo').value)$('#auditTo').value=isoToday();
  setHandler('#auditApply','onclick',renderAuditLogs);
  setHandler('#auditSearch','oninput',renderAuditLogs);
  setHandler('#globalSearch','oninput',renderGlobalSearch);
  document.addEventListener('click',e=>{if(!e.target.closest('.global-search-wrap'))$('#globalSearchResults')?.classList.add('hidden')});
  setHandler('#modal','onclick',e=>{if(e.target.id==='modal')closeModal()});
  setHandler('#notificationBell','onclick',openNotificationCenter);
  setHandler('#pendingPaymentCard','onclick',()=>{});
  setHandler('#nav','onclick',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.classList.contains('nav-group-toggle')){const group=b.closest('.nav-group'),wasOpen=group?.classList.contains('open');$$('.nav-group').forEach(g=>g.classList.remove('open'));if(group&&!wasOpen)group.classList.add('open');return}
   if(!b.dataset.section)return;
   $$('.nav button[data-section],.section').forEach(x=>x.classList.remove('active'));
   b.classList.add('active');openParentNavGroup(b);
   const section=$('#'+b.dataset.section);if(section)section.classList.add('active');
   if($('#pageTitle'))$('#pageTitle').textContent=b.textContent.replace('🔒','').trim();
   localStorage.setItem('wl_active_section',b.dataset.section);
   if(b.dataset.section==='auditLogs')renderAuditLogs();
  });
  $$('.application-filter').forEach(b=>b.onclick=()=>{$$('.application-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.applicationFilter=b.dataset.status;renderApplications()});
  setHandler('#staffLogout','onclick',async()=>{await sb.auth.signOut();location.reload()});
  setHandler('#refreshBtn','onclick',loadAll);
  $$('.payment-filter').forEach(b=>b.onclick=()=>{$$('.payment-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.status;renderSubmissions()});
  setHandler('#settingsForm','onsubmit',async e=>{e.preventDefault();if(!requirePerm('settings_manage'))return;const x=await sb.from('app_settings').upsert({id:1,announcement:$('#setAnnouncement')?.value||'',default_bank_id:state.settings?.default_bank_id||null,default_whatsapp_id:state.settings?.default_whatsapp_id||null,default_telegram_id:state.settings?.default_telegram_id||null,auto_assign_enabled:state.settings?.auto_assign_enabled!==false,updated_by:state.staff.user_id,updated_at:new Date().toISOString()});if(x.error)return toast(x.error.message,true);toast(tr('saved'))});
  const {data:{session}}=await sb.auth.getSession();if(session)await enter();
 }catch(err){
  console.error('Admin initialization failed:',err);
  toast((SWK_LANG.current==='zh'?'页面初始化失败：':SWK_LANG.current==='ms'?'Inisialisasi halaman gagal: ':'Page initialization failed: ')+(err?.message||err),true);
 }
});
async function enter(){const {data:{user}}=await sb.auth.getUser(),x=await sb.from('staff_profiles').select('*').eq('user_id',user.id).eq('is_active',true).maybeSingle();if(x.error||!x.data){await sb.auth.signOut();return toast('No active staff profile',true)}state.staff=x.data;const fallbackUsername=String(state.staff.username||state.staff.full_name||'staff').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,30)||'staff';await sb.from('staff_profiles').update({last_login_at:new Date().toISOString(),auth_email:user.email,username:state.staff.username||fallbackUsername}).eq('user_id',user.id);state.staff.auth_email=user.email;state.staff.username=state.staff.username||fallbackUsername;$('#staffIdentity').textContent=`${state.staff.full_name} · ${state.staff.role}`;$('#staffLoginView').classList.add('hidden');$('#adminApp').classList.remove('hidden');$('#adminApp').style.removeProperty('display');document.body.classList.add('staff-authenticated');SWK_LANG.apply();try{await loadAll();state.knownApplicationIds=new Set(pendingLoanApplications().map(x=>String(x.id)));state.knownPendingIds=new Set(pendingPaymentSubmissions().map(x=>String(x.id)));state.knownAdvanceRequestIds=new Set(requestedSalaryAdvances().map(x=>String(x.id)));state.notificationsReady=true;setupPaymentNotifications()}catch(e){toast(e.message,true)}}

/* ===== WL Credit V17: service ownership dashboard / transfer / staff bank ===== */
state.customerOwnerFilter = state.customerOwnerFilter || 'all';

function v17ServiceStaff(){
  return (state.staffList||[]).filter(s=>s.is_active!==false && ['customer_service','finance'].includes(String(s.role||'')));
}
function v17StaffLabel(userId){
  if(!userId)return SWK_LANG.current==='zh'?'未分配':SWK_LANG.current==='ms'?'Belum Ditugaskan':'Unassigned';
  const list=v17ServiceStaff();
  const i=list.findIndex(s=>String(s.user_id)===String(userId));
  const s=(state.staffList||[]).find(x=>String(x.user_id)===String(userId));
  if(s?.role==='super_admin')return v10t('superAdmin');
  const n=i>=0?i+1:'-';
  const prefix=SWK_LANG.current==='zh'?'客服':SWK_LANG.current==='ms'?'Khidmat Pelanggan ':'Customer Service ';
  return `${prefix}${n}`;
}
function v17StaffDisplay(s){
  return `${v17StaffLabel(s.user_id)}${s.full_name?` · ${s.full_name}`:''}`;
}
function v17OwnerFilters(){
  if(!isSuperAdmin())return '';
  const count=id=>id==='all'?state.customers.length:id==='unassigned'?state.customers.filter(c=>!c.owner_staff_id).length:state.customers.filter(c=>String(c.owner_staff_id)===String(id)).length;
  const allText=SWK_LANG.current==='zh'?'全部客户':SWK_LANG.current==='ms'?'Semua Pelanggan':'All Customers';
  const unText=SWK_LANG.current==='zh'?'未分配':SWK_LANG.current==='ms'?'Belum Ditugaskan':'Unassigned';
  const items=[['all',allText],...v17ServiceStaff().map(s=>[s.user_id,v17StaffLabel(s.user_id)]),['unassigned',unText]];
  return `<div class="owner-filter-tabs">${items.map(([id,label])=>`<button class="btn ${String(state.customerOwnerFilter)===String(id)?'btn-primary':'btn-secondary'}" onclick="v17SetOwnerFilter('${id}')">${esc(label)} <span class="filter-count">${count(id)}</span></button>`).join('')}</div>`;
}
window.v17SetOwnerFilter=id=>{state.customerOwnerFilter=id;renderCustomers()};

const v17OriginalRenderCustomers=renderCustomers;
renderCustomers=function(){
  const section=$('#customers');
  if(section){
    let host=$('#customerOwnerFilters');
    if(!host){host=document.createElement('div');host.id='customerOwnerFilters';host.className='customer-owner-filter-wrap';section.insertBefore(host,section.querySelector('.section-head'));}
    host.innerHTML=v17OwnerFilters();
  }
  const q=($('#customerSearch')?.value||'').toLowerCase();
  const filtered=(state.customers||[]).filter(c=>{
    const match=[c.customer_code,c.full_name,c.phone,c.id_number].join(' ').toLowerCase().includes(q);
    if(!match)return false;
    if(!isSuperAdmin()||state.customerOwnerFilter==='all')return true;
    if(state.customerOwnerFilter==='unassigned')return !c.owner_staff_id;
    return String(c.owner_staff_id)===String(state.customerOwnerFilter);
  });
  $('#customerRows').innerHTML=filtered.map(c=>{
    const ls=state.loans.filter(l=>l.customer_id===c.id),a=ls.filter(l=>l.status==='active').length,h=ls.filter(l=>l.status==='paid').length;
    const owner=v17StaffLabel(c.owner_staff_id);
    const transfer=isSuperAdmin()?`<button class="btn btn-secondary" onclick="v17TransferCustomer('${c.id}')">${SWK_LANG.current==='zh'?'转接客服':SWK_LANG.current==='ms'?'Pindah Staf':'Transfer'}</button>`:'';
    return `<tr><td><span class="click-link" onclick="openCustomerProfile('${c.id}')">${esc(c.customer_code)}</span></td><td><span class="click-link" onclick="openCustomerProfile('${c.id}')">${esc(c.full_name)}</span><small class="mobile-row-note">${esc(owner)}</small></td><td>${esc(c.phone)}</td><td>${esc(c.id_number)}</td><td>${a}</td><td>${h}</td><td><span class="badge ${c.is_active?'ok':'danger'}">${c.is_active?'Active':'Inactive'}</span></td><td class="actions"><span class="owner-chip">${esc(owner)}</span><button class="btn btn-secondary" onclick="openCustomer('${c.id}')">${esc(v11t('edit'))}</button>${transfer}<button class="btn btn-secondary" onclick="changePin('${c.id}')">Password</button></td></tr>`
  }).join('');
};

window.v17TransferCustomer=id=>{
  if(!isSuperAdmin())return toast(tr('noAccess'),true);
  const c=state.customers.find(x=>x.id===id);if(!c)return;
  const options=v17ServiceStaff().map(s=>`<option value="${s.user_id}" ${String(c.owner_staff_id)===String(s.user_id)?'selected':''}>${esc(v17StaffDisplay(s))}</option>`).join('');
  modal(`<h2>${SWK_LANG.current==='zh'?'转接客户':SWK_LANG.current==='ms'?'Pindah Pelanggan':'Transfer Customer'}</h2><p><strong>${esc(c.customer_code)} · ${esc(c.full_name)}</strong></p><form id="v17TransferForm"><div class="field"><label>${SWK_LANG.current==='zh'?'转接给':SWK_LANG.current==='ms'?'Pindah kepada':'Transfer to'}</label><select name="staff" required>${options}</select></div><p class="muted">${SWK_LANG.current==='zh'?'客户、贷款及后续收款责任会转给新的客服。':'Customer ownership and future collection responsibility will move to the selected staff.'}</p><button class="btn btn-primary">${SWK_LANG.current==='zh'?'确认转接':'Confirm Transfer'}</button></form>`);
  $('#v17TransferForm').onsubmit=async e=>{e.preventDefault();const staff=new FormData(e.target).get('staff');const {data,error}=await sb.rpc('super_admin_transfer_customer',{p_customer_id:id,p_target_staff_id:staff});if(error||data?.error)return toast(data?.error||error.message,true);closeModal();toast(SWK_LANG.current==='zh'?'转接成功':'Transferred successfully');await loadAll()};
};

window.v17AssignStaffBank=staffId=>{
  if(!isSuperAdmin())return toast(tr('noAccess'),true);
  const s=state.staffList.find(x=>String(x.user_id)===String(staffId));
  const options=`<option value="">${SWK_LANG.current==='zh'?'未分配':'Unassigned'}</option>`+(state.banks||[]).filter(b=>b.is_enabled!==false).map(b=>`<option value="${b.id}" ${String(s?.assigned_bank_id||'')===String(b.id)?'selected':''}>${esc(b.bank_name)} · ${esc(b.account_number)} · ${esc(b.account_name)}</option>`).join('');
  modal(`<h2>${SWK_LANG.current==='zh'?'分配收款账号':'Assign Receiving Bank'}</h2><p><strong>${esc(v17StaffDisplay(s||{}))}</strong></p><form id="v17BankForm"><div class="field"><label>${SWK_LANG.current==='zh'?'公司收款账号':'Company receiving bank'}</label><select name="bank">${options}</select></div><p class="muted">${SWK_LANG.current==='zh'?'保存后，该客服名下所有客户会立即使用这个公司收款账号。':'All customers owned by this staff member will immediately use this company receiving bank.'}</p><button class="btn btn-primary">${esc(v11t('save'))}</button></form>`);
  $('#v17BankForm').onsubmit=async e=>{e.preventDefault();const bank=new FormData(e.target).get('bank')||null;const {data,error}=await sb.rpc('super_admin_assign_staff_bank',{p_staff_id:staffId,p_bank_id:bank});if(error||data?.error)return toast(data?.error||error.message,true);closeModal();toast(tr('saved'));await loadAll()};
};

function v17RenderStaffDashboard(){
  let host=$('#serviceStaffDashboard');
  if(!host){host=document.createElement('div');host.id='serviceStaffDashboard';host.className='dashboard-bank-section';const dash=$('#dashboard');if(dash)dash.appendChild(host)}
  if(!host)return;
  if(!isSuperAdmin()){host.innerHTML='';return;}
  const today=isoToday();
  const cards=v17ServiceStaff().map(s=>{
    const customers=state.customers.filter(c=>String(c.owner_staff_id)===String(s.user_id));
    const ids=new Set(customers.map(c=>String(c.id)));
    const loans=state.loans.filter(l=>ids.has(String(l.customer_id)));
    const active=loans.filter(l=>l.status==='active');
    const due=active.filter(l=>String(l.due_date)===today);
    const dueAmount=due.reduce((sum,l)=>sum+Math.max(Number(l.current_due_amount||l.settlement_amount||l.interest||0)-Number(l.current_paid_amount||0),0),0);
    const overdue=active.filter(l=>l.due_date&&String(l.due_date)<today);
    const bank=state.banks.find(b=>String(b.id)===String(s.assigned_bank_id));
    return `<div class="service-staff-card"><div class="service-card-head"><div><h3>${esc(v17StaffLabel(s.user_id))}</h3><small>${esc(s.full_name||s.username||'')}</small></div><button class="btn btn-secondary" onclick="v17AssignStaffBank('${s.user_id}')">${SWK_LANG.current==='zh'?'分配收款账号':'Assign Bank'}</button></div><div class="service-metrics"><div><span>${SWK_LANG.current==='zh'?'进行中贷款':'Active Loans'}</span><strong>${active.length}</strong></div><div><span>${SWK_LANG.current==='zh'?'今天到账笔数':'Due Today'}</span><strong>${due.length}</strong></div><div><span>${SWK_LANG.current==='zh'?'今天到账金额':'Due Amount'}</span><strong>${money(dueAmount)}</strong></div><div><span>${SWK_LANG.current==='zh'?'逾期':'Overdue'}</span><strong class="danger-text">${overdue.length}</strong></div></div><div class="assigned-bank-line"><span>${SWK_LANG.current==='zh'?'收款账号':'Receiving Bank'}:</span><strong>${bank?`${esc(bank.bank_name)} · ${esc(bank.account_number)}`:(SWK_LANG.current==='zh'?'未分配':'Unassigned')}</strong></div></div>`;
  }).join('');
  host.innerHTML=`<h3>${SWK_LANG.current==='zh'?'客服营运总览':SWK_LANG.current==='ms'?'Ringkasan Operasi Khidmat Pelanggan':'Customer Service Operations'}</h3><div class="service-staff-grid">${cards||'<p class="muted">No customer service staff</p>'}</div>`;
}

const v17OriginalRenderStaff=renderStaff;
renderStaff=function(){
  if(!$('#staffRows'))return;
  $('#staffRows').innerHTML=(state.staffList||[]).map(s=>`<tr><td><strong>${esc(s.role==='super_admin'?v10t('superAdmin'):v17StaffLabel(s.user_id))}</strong><small class="mobile-row-note">${esc(s.full_name||'')}</small></td><td class="mono">${esc(s.username||'-')}</td><td>${esc(s.role==='super_admin'?v10t('superAdmin'):s.role)}</td><td>${['admin','super_admin'].includes(s.role)?'ALL':Object.values(s.permissions||{}).filter(Boolean).length}</td><td><span class="badge ${s.is_active?'ok':'danger'}">${s.is_active?'Active':'Inactive'}</span></td><td class="actions"><button class="btn btn-secondary" onclick="openStaff('${s.user_id}')">${esc(v11t('edit'))}</button>${isSuperAdmin()&&s.role!=='super_admin'?`<button class="btn btn-secondary" onclick="v17AssignStaffBank('${s.user_id}')">${SWK_LANG.current==='zh'?'收款账号':'Bank'}</button>`:''}</td></tr>`).join('');
};

const v17OriginalRenderAll=renderAll;
renderAll=function(){v17OriginalRenderAll();v17RenderStaffDashboard();};


// V26 mobile drawer navigation
(function initMobileDrawer(){
  const button=document.getElementById('mobileMenuBtn');
  const sidebar=document.getElementById('adminSidebar');
  const overlay=document.getElementById('sidebarOverlay');
  if(!button||!sidebar||!overlay)return;

  const isMobile=()=>window.matchMedia('(max-width: 900px)').matches;
  const setOpen=(open)=>{
    const shouldOpen=Boolean(open&&isMobile());
    sidebar.classList.toggle('open',shouldOpen);
    overlay.classList.toggle('show',shouldOpen);
    document.body.classList.toggle('mobile-menu-open',shouldOpen);
    button.setAttribute('aria-expanded',String(shouldOpen));
    button.textContent=shouldOpen?'×':'☰';
    button.setAttribute('aria-label',shouldOpen?'Close menu':'Open menu');
  };

  button.addEventListener('click',()=>setOpen(!sidebar.classList.contains('open')));
  overlay.addEventListener('click',()=>setOpen(false));
  sidebar.addEventListener('click',(event)=>{
    const target=event.target.closest('button[data-section]');
    if(target)setOpen(false);
  });
  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape')setOpen(false);
  });
  window.addEventListener('resize',()=>{
    if(!isMobile())setOpen(false);
  });
})();


// V29 admin inactivity protection: sign out after 5 minutes without interaction.
(function setupAdminIdleLogout(){
 const LIMIT=5*60*1000;let timer=null;
 const reset=()=>{clearTimeout(timer);if(!document.getElementById('adminApp')?.classList.contains('hidden'))timer=setTimeout(async()=>{try{await sb.auth.signOut()}finally{location.reload()}},LIMIT)};
 ['click','keydown','mousemove','touchstart','scroll'].forEach(evt=>document.addEventListener(evt,reset,{passive:true}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)reset()});
 reset();
})();



const WL_PERMISSION_LABELS={
 applications_view:['查看申请','View Applications','Lihat Permohonan'],applications_claim:['认领申请','Claim Applications','Ambil Permohonan'],applications_approve:['批准申请','Approve Applications','Lulus Permohonan'],applications_reject:['拒绝申请','Reject Applications','Tolak Permohonan'],
 customers_view:['查看客户','View Customers','Lihat Pelanggan'],customers_create:['新增客户','Create Customers','Tambah Pelanggan'],customers_edit:['编辑客户','Edit Customers','Kemas Kini Pelanggan'],customers_files_view:['查看客户文件','View Customer Files','Lihat Dokumen Pelanggan'],customers_files_upload:['上传客户文件','Upload Customer Files','Muat Naik Dokumen Pelanggan'],customers_files_delete:['删除客户文件','Delete Customer Files','Padam Dokumen Pelanggan'],
 loans_view:['查看贷款','View Loans','Lihat Pinjaman'],loans_create:['新增贷款','Create Loans','Tambah Pinjaman'],loans_edit:['编辑贷款','Edit Loans','Kemas Kini Pinjaman'],
 banks_manage:['管理公司银行','Manage Company Banks','Urus Bank Syarikat'],banks_assign:['分配公司银行','Assign Company Banks','Tetapkan Bank Syarikat'],contacts_manage:['管理联系方式','Manage Contacts','Urus Hubungan'],contacts_assign:['分配联系方式','Assign Contacts','Tetapkan Hubungan'],
 payments_view:['查看付款','View Payments','Lihat Bayaran'],payments_approve_partial:['入账部分付款','Post Partial Payment','Rekod Bayaran Sebahagian'],payments_approve_renew:['入账续期付款','Post Renewal Payment','Rekod Bayaran Pembaharuan'],payments_approve_settle:['入账清账付款','Post Settlement Payment','Rekod Bayaran Penyelesaian'],payments_reject:['拒绝付款','Reject Payments','Tolak Bayaran'],
 reports_view:['查看报表','View Reports','Lihat Laporan'],staff_manage:['管理员工','Manage Staff','Urus Kakitangan'],settings_manage:['管理系统设置','Manage System Settings','Urus Tetapan Sistem'],company_view:['查看公司管理','View Company Management','Lihat Pengurusan Syarikat'],company_manage:['管理公司','Manage Company','Urus Syarikat'],payroll_view:['查看薪资','View Payroll','Lihat Gaji'],payroll_manage:['管理薪资','Manage Payroll','Urus Gaji']
};
function wlPermissionLabel(key){const row=WL_PERMISSION_LABELS[key];if(!row)return key.replaceAll('_',' ');return row[SWK_LANG.current==='zh'?0:SWK_LANG.current==='ms'?2:1]}
function wlRoleLabel(role){return role==='customer_service'?(SWK_LANG.current==='zh'?'客服':SWK_LANG.current==='ms'?'Khidmat Pelanggan':'Customer Service'):role==='finance'?(SWK_LANG.current==='zh'?'财务':SWK_LANG.current==='ms'?'Kewangan':'Finance'):'Super Admin'}
const WL_ROLE_DEFAULT_PERMISSIONS={
 customer_service:{applications_view:true,applications_claim:true,applications_approve:true,applications_reject:true,customers_view:true,customers_create:true,customers_edit:true,customers_files_view:true,customers_files_upload:true,customers_files_delete:false,loans_view:true,loans_create:true,loans_edit:true,banks_manage:false,banks_assign:false,contacts_manage:false,contacts_assign:false,payments_view:true,payments_approve_partial:true,payments_approve_renew:true,payments_approve_settle:true,payments_reject:true,reports_view:true,staff_manage:false,settings_manage:false,company_view:false,company_manage:false,payroll_view:false,payroll_manage:false},
 finance:{applications_view:false,applications_claim:false,applications_approve:false,applications_reject:false,customers_view:true,customers_create:false,customers_edit:false,customers_files_view:true,customers_files_upload:false,customers_files_delete:false,loans_view:true,loans_create:false,loans_edit:false,banks_manage:true,banks_assign:false,contacts_manage:false,contacts_assign:false,payments_view:true,payments_approve_partial:false,payments_approve_renew:false,payments_approve_settle:false,payments_reject:false,reports_view:true,staff_manage:true,settings_manage:false,company_view:true,company_manage:true,payroll_view:true,payroll_manage:true}
};

/* ===== WL Credit V29.3 dashboard bank + staff permissions + instant review sync ===== */
window.openStaff=function(userId){
 if(!requirePerm('staff_manage'))return;
 const existing=(state.staffList||[]).find(s=>String(s.user_id)===String(userId))||{};
 const editing=Boolean(userId),permKeys=Object.keys(PERMS);
 const roles=['customer_service','finance'].concat(isSuperAdmin()?['super_admin']:[]);
 const currentRole=roles.includes(existing.role)?existing.role:'customer_service';
 const roleOptions=roles.map(r=>`<option value="${r}" ${currentRole===r?'selected':''}>${wlRoleLabel(r)}</option>`).join('');
 const checks=permKeys.map(k=>`<label class="permission-item"><input type="checkbox" name="perm_${k}" ${existing.permissions?.[k]?'checked':''}> <span>${esc(wlPermissionLabel(k))}</span></label>`).join('');
 const title=editing?(SWK_LANG.current==='zh'?'编辑员工账号与权限':SWK_LANG.current==='ms'?'Edit Akaun & Kebenaran':'Edit Staff Account & Permissions'):(SWK_LANG.current==='zh'?'新增员工账号':SWK_LANG.current==='ms'?'Tambah Akaun Kakitangan':'Add Staff Account');
 modal(`<h2>${title}</h2><form id="staffAccountForm"><div class="grid2"><div class="field"><label>${v11t('name')}</label><input name="full_name" required value="${esc(existing.full_name||'')}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'员工账号':SWK_LANG.current==='ms'?'Akaun Kakitangan':'Username'}</label><input name="username" pattern="[a-z0-9_]{3,30}" required value="${esc(existing.username||'')}"></div><div class="field"><label>${editing?(SWK_LANG.current==='zh'?'新密码（留空则不修改）':SWK_LANG.current==='ms'?'Kata Laluan Baharu (kosong untuk kekalkan)':'New Password (leave blank to keep)'):(SWK_LANG.current==='zh'?'登录密码':SWK_LANG.current==='ms'?'Kata Laluan':'Password')}</label><input name="password" type="password" ${editing?'':'required'} minlength="8"></div><div class="field"><label>${v11t('role')}</label><select name="role" id="wlStaffRoleSelect">${roleOptions}</select></div></div><label><input name="is_active" type="checkbox" ${existing.is_active!==false?'checked':''}> ${v11t('active')}</label><div class="section-head" style="margin-top:18px"><h3>${SWK_LANG.current==='zh'?'权限':SWK_LANG.current==='ms'?'Kebenaran':'Permissions'}</h3><button type="button" class="btn btn-secondary" id="wlApplyRoleTemplate">${SWK_LANG.current==='zh'?'套用职位默认权限':SWK_LANG.current==='ms'?'Guna Kebenaran Lalai':'Apply Role Defaults'}</button></div><div class="permission-grid">${checks}</div><p><button class="btn btn-primary">${v11t('save')}</button></p></form>`);
 const applyTemplate=()=>{const role=$('#wlStaffRoleSelect')?.value;if(role==='super_admin'){permKeys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el)el.checked=true});return}const tpl=WL_ROLE_DEFAULT_PERMISSIONS[role]||{};permKeys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el)el.checked=tpl[k]===true})};
 $('#wlApplyRoleTemplate').onclick=applyTemplate;
 if(!editing)applyTemplate();
 $('#staffAccountForm').onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target),permissions={};permKeys.forEach(k=>permissions[k]=f.get(`perm_${k}`)==='on');
  const payload={action:editing?'update_employee':'create_employee',user_id:userId||undefined,full_name:String(f.get('full_name')||'').trim(),username:String(f.get('username')||'').trim().toLowerCase(),password:String(f.get('password')||''),role:f.get('role'),permissions,is_active:f.get('is_active')==='on'};
  const x=await invokeStaffAdmin(payload),data=x?.data||x;if(x?.error||data?.ok===false)return toast(x?.error?.message||data?.error||(SWK_LANG.current==='zh'?'无法保存员工账号':'Unable to save staff account'),true);
  closeModal();toast(v11t('saved'));await loadAll();
 };
};

// Replace claim with immediate local state change before the network refresh reaches other admins.
window.claimApplication=async function(id){
 if(!requirePerm('applications_claim'))return;
 const row=(state.applications||[]).find(x=>String(x.id)===String(id));
 if(row){row.status='under_review';row.owner_staff_id=state.staff.user_id;row.claimed_at=new Date().toISOString();row.claimed_by_name=state.staff.full_name;renderApplications();renderNotifications();}
 const x=await sb.rpc('staff_claim_loan_application',{p_application_id:id});
 if(x.error||!x.data?.ok){toast(x.error?.message||x.data?.error||'This application has already been claimed by another staff member.',true);await loadAll();return}
 toast(SWK_LANG.current==='zh'?'已设为审核中':SWK_LANG.current==='ms'?'Ditanda Dalam Semakan':'Marked Under Review');
 await loadAll();if(typeof window.switchSection==='function')window.switchSection('loanReview');else openApplicationReview(id);
};


/* ===== WL Credit V30.1 bank allocation, arrival time and overdue sync ===== */
window.manageCustomerBank=function(id){
 if(!requirePerm('banks_manage'))return;
 const bank=state.banks.find(x=>String(x.id)===String(id)); if(!bank)return;
 const customers=isSuperAdmin()?state.customers:state.customers.filter(isMine);
 modal(`<h2>${SWK_LANG.current==='zh'?'管理银行分配':SWK_LANG.current==='ms'?'Urus Agihan Bank':'Manage Bank Assignment'} · ${esc(bank.bank_name)}</h2>
 <p class="muted">${SWK_LANG.current==='zh'?'勾选需要使用此公司收款账号的客户。取消勾选只会解除这个银行，不会删除客户资料。':SWK_LANG.current==='ms'?'Pilih pelanggan yang perlu menggunakan akaun kutipan ini.':'Select customers who should use this receiving account.'}</p>
 <form id="v301BankAssignmentForm"><div class="checkbox-list">${customers.map(c=>`<label class="checkbox-row"><input type="checkbox" value="${c.id}" ${String(c.assigned_bank_id)===String(id)?'checked':''}><span>${esc(c.customer_code)} — ${esc(c.full_name)}</span></label>`).join('')||`<p class="muted">${tr('noRecords')}</p>`}</div><p><button class="btn btn-primary">${tr('save')}</button></p></form>`);
 $('#v301BankAssignmentForm').onsubmit=async e=>{e.preventDefault();const selected=new Set($$('#v301BankAssignmentForm input:checked').map(x=>String(x.value)));const currently=customers.filter(c=>String(c.assigned_bank_id)===String(id));const toAssign=customers.filter(c=>selected.has(String(c.id))&&String(c.assigned_bank_id)!==String(id)).map(c=>c.id);const toClear=currently.filter(c=>!selected.has(String(c.id))).map(c=>c.id);let error=null;if(toAssign.length){const r=await sb.from('customers').update({assigned_bank_id:id,updated_at:new Date().toISOString()}).in('id',toAssign);error=r.error}if(!error&&toClear.length){const r=await sb.from('customers').update({assigned_bank_id:null,updated_at:new Date().toISOString()}).in('id',toClear);error=r.error}if(error)return toast(error.message,true);closeModal();toast(tr('saved'));await loadAll()};
};

window.v301AssignStaffBank=function(staffId){ return window.v17AssignStaffBank(staffId); };

renderBankCollectionTotals=function(){
 const host=$('#dashboardBankTotals');if(!host)return;
 const totals=new Map(state.banks.map(b=>[String(b.id),0]));
 for(const r of state.repayments){if(!inRange(r.payment_date))continue;const customer=state.customers.find(c=>String(c.id)===String(r.loans?.customer_id));if(customer?.assigned_bank_id!=null)totals.set(String(customer.assigned_bank_id),(totals.get(String(customer.assigned_bank_id))||0)+Number(r.amount||0));}
 const staff=isSuperAdmin()?v17ServiceStaff():[];
 host.innerHTML=state.banks.map(b=>`<div class="bank-total-card bank-management-card"><div class="bank-card-top"><div><small>${SWK_LANG.current==='zh'?'公司收款账号':SWK_LANG.current==='ms'?'Akaun Kutipan Syarikat':'Company Receiving Account'}</small><strong>${esc(b.bank_name)}</strong><span>${esc(b.account_name)} · ${esc(b.account_number)}</span></div><span class="badge ${b.is_enabled!==false?'ok':'danger'}">${b.is_enabled!==false?(SWK_LANG.current==='zh'?'使用中':'Active'):(SWK_LANG.current==='zh'?'已停用':'Disabled')}</span></div><div class="bank-amount-block"><span>${tr('amountReceived')}</span><strong>${money(totals.get(String(b.id))||0)}</strong></div><div class="bank-card-actions"><button class="btn btn-secondary" onclick="openBank('${b.id}')">${tr('edit')}</button><button class="btn btn-primary" onclick="manageCustomerBank('${b.id}')">${tr('manageAssignment')}</button></div>${staff.length?`<div class="bank-staff-assignment"><small>${SWK_LANG.current==='zh'?'客服收款账号分配':SWK_LANG.current==='ms'?'Agihan Akaun Staf':'Staff Account Assignment'}</small>${staff.map(st=>`<button class="staff-bank-chip ${String(st.assigned_bank_id)===String(b.id)?'selected':''}" onclick="v301AssignStaffBank('${st.user_id}')">${esc(v17StaffLabel(st.user_id))}${String(st.assigned_bank_id)===String(b.id)?' ✓':''}</button>`).join('')}</div>`:''}</div>`).join('')||`<div class="card muted">${tr('noReceivingBanks')}</div>`;
 const old=$('#bankCards');if(old)old.innerHTML='';
};

v17RenderStaffDashboard=function(){
 let host=$('#serviceStaffDashboard');if(!host){host=document.createElement('div');host.id='serviceStaffDashboard';host.className='dashboard-bank-section';$('#dashboard')?.appendChild(host)}if(!host)return;if(!isSuperAdmin()){host.innerHTML='';return}
 const today=isoToday();const cards=v17ServiceStaff().map(st=>{const ids=new Set(state.customers.filter(c=>String(c.owner_staff_id)===String(st.user_id)).map(c=>String(c.id)));const loans=state.loans.filter(l=>ids.has(String(l.customer_id))),active=loans.filter(l=>l.status==='active'),due=active.filter(l=>String(l.due_date)===today),overdue=active.filter(l=>l.due_date&&String(l.due_date)<today),dueAmount=due.reduce((a,l)=>a+Math.max(Number(l.current_due_amount||l.interest||0)+Number(l.overdue_charge||0)-Number(l.current_paid_amount||0),0),0);return `<div class="service-staff-card"><div class="service-card-head"><div><h3>${esc(v17StaffLabel(st.user_id))}</h3><small>${esc(st.full_name||st.username||'')}</small></div></div><div class="service-metrics"><div><span>${SWK_LANG.current==='zh'?'进行中贷款':'Active Loans'}</span><strong>${active.length}</strong></div><div><span>${SWK_LANG.current==='zh'?'今天到账笔数':'Due Today'}</span><strong>${due.length}</strong></div><div><span>${SWK_LANG.current==='zh'?'今天到账金额':'Due Amount'}</span><strong>${money(dueAmount)}</strong></div><div><span>${SWK_LANG.current==='zh'?'逾期':'Overdue'}</span><strong class="danger-text">${overdue.length}</strong></div></div></div>`}).join('');host.innerHTML=`<h3>${SWK_LANG.current==='zh'?'客服运营总览':SWK_LANG.current==='ms'?'Ringkasan Operasi Khidmat Pelanggan':'Customer Service Operations'}</h3><div class="service-staff-grid">${cards||`<p class="muted">${tr('noRecords')}</p>`}</div>`;
};

window.editExpectedPaymentTime=function(id){
 const l=state.loans.find(x=>String(x.id)===String(id));if(!l||!(isSuperAdmin()||isMine(l.customers||{})||has('loans_edit')))return toast(tr('noAccess'),true);
 modal(`<h2>${SWK_LANG.current==='zh'?'修改预计到账时间':SWK_LANG.current==='ms'?'Ubah Masa Bayaran Dijangka':'Edit Expected Payment Time'}</h2><form id="v301ExpectedForm"><div class="field"><label>${SWK_LANG.current==='zh'?'预计到账时间':SWK_LANG.current==='ms'?'Masa Bayaran Dijangka':'Expected Payment Time'}</label><input name="expected" type="datetime-local" required value="${l.expected_payment_at?String(l.expected_payment_at).slice(0,16):(l.due_date?l.due_date+'T12:00':'')}"></div><button class="btn btn-primary">${tr('save')}</button></form>`);
 $('#v301ExpectedForm').onsubmit=async e=>{e.preventDefault();const v=new FormData(e.target).get('expected');const r=await sb.from('loans').update({expected_payment_at:new Date(v).toISOString(),updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message,true);closeModal();toast(tr('saved'));await loadAll()};
};
window.setOverdueCharge=function(id){
 const l=state.loans.find(x=>String(x.id)===String(id));if(!l||!(isSuperAdmin()||has('loans_edit')))return toast(tr('noAccess'),true);
 modal(`<h2>${SWK_LANG.current==='zh'?'新增逾期应收':SWK_LANG.current==='ms'?'Tambah Caj Tertunggak':'Add Overdue Charge'}</h2><p><strong>${esc(l.loan_id)} · ${esc(l.customers?.full_name||'')}</strong></p><form id="v301OverdueForm"><div class="field"><label>${SWK_LANG.current==='zh'?'逾期应收金额 (MYR)':SWK_LANG.current==='ms'?'Jumlah Caj Tertunggak (MYR)':'Overdue Charge (MYR)'}</label><input name="amount" type="number" min="0" step="0.01" required value="${Number(l.overdue_charge||0)}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'说明':SWK_LANG.current==='ms'?'Catatan':'Note'}</label><textarea name="note">${esc(l.overdue_note||'')}</textarea></div><button class="btn btn-primary">${tr('save')}</button></form>`);
 $('#v301OverdueForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const r=await sb.from('loans').update({overdue_charge:Number(f.get('amount')||0),overdue_note:f.get('note')||null,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message,true);closeModal();toast(tr('saved'));await loadAll()};
};

const v301OldRenderLoans=renderLoans;
renderLoans=function(){v301OldRenderLoans();const rows=$$('#loanRows tr');rows.forEach(row=>{const code=row.querySelector('td')?.textContent?.trim();const l=state.loans.find(x=>String(x.loan_id)===String(code));if(!l)return;const action=row.querySelector('td:last-child');if(!action)return;action.insertAdjacentHTML('beforeend',` <button class="btn btn-secondary" onclick="editExpectedPaymentTime('${l.id}')">${SWK_LANG.current==='zh'?'到账时间':'Arrival Time'}</button>${l.status==='active'&&l.due_date&&String(l.due_date)<isoToday()?` <button class="btn btn-danger" onclick="setOverdueCharge('${l.id}')">${SWK_LANG.current==='zh'?'逾期应收':'Overdue Charge'}</button>`:''}`)});};

function v301TranslateStatic(){if(SWK_LANG.current!=='zh')return;const map={'Manage company receiving accounts and view collection totals together.':'在这里统一管理公司收款账号、客服分配及收款统计。','Today':'今天','Yesterday':'昨天','This Week':'本周','Last Week':'上周','This Month':'本月','Last Month':'上月','Apply':'查询','Loan ID':'贷款编号','Customer':'客户','Phone':'电话号码','Status':'状态','Actions':'操作','Active':'进行中','Inactive':'停用','View':'查看','Password':'密码','Edit':'编辑','Save':'保存','Cancel':'取消'};document.querySelectorAll('button,small,label,th,span,p,h2,h3').forEach(el=>{const t=el.textContent.trim();if(map[t]&&el.children.length===0)el.textContent=map[t]});}
const v301OldRenderAll=renderAll;renderAll=function(){v301OldRenderAll();v301TranslateStatic()};
window.addEventListener('swk-language-applied',()=>{v301TranslateStatic();renderAll()});

/* ===== WL Credit V30.3 payment notifications, staff-bank allocation and overdue controls ===== */
window.manageCustomerBank=function(bankId){
 if(!isSuperAdmin())return toast(tr('noAccess'),true);
 const bank=state.banks.find(x=>String(x.id)===String(bankId));if(!bank)return;
 const staff=v17ServiceStaff();
 const assigned=new Set((state.staffBankAssignments||[]).filter(x=>String(x.bank_id)===String(bankId)).map(x=>String(x.staff_user_id)));
 modal(`<h2>${SWK_LANG.current==='zh'?'分配客服到收款银行':SWK_LANG.current==='ms'?'Agihkan Staf ke Bank Kutipan':'Assign Staff to Receiving Bank'} · ${esc(bank.bank_name)}</h2>
 <p class="muted">${SWK_LANG.current==='zh'?'勾选使用此银行的客服。一个客服可分配多个银行；系统会把该客服旗下客户平均分配到所选银行。':'A staff member may use multiple banks. Their customers will be distributed evenly among the selected banks.'}</p>
 <form id="v302StaffBankForm"><div class="checkbox-list">${staff.map(s=>`<label class="checkbox-row"><input type="checkbox" value="${s.user_id}" ${assigned.has(String(s.user_id))?'checked':''}><span>${esc(v17StaffLabel(s.user_id))} · ${esc(s.username||'')}</span></label>`).join('')}</div><p><button class="btn btn-primary">${tr('save')}</button></p></form>`);
 $('#v302StaffBankForm').onsubmit=async e=>{e.preventDefault();const selected=$$('#v302StaffBankForm input:checked').map(x=>x.value);const r=await sb.rpc('wl_set_bank_staff_assignments',{p_bank_id:bankId,p_staff_ids:selected});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error||'Save failed',true);closeModal();toast(tr('saved'));await loadAll()};
};

const v302BaseLoadAll=loadAll;
loadAll=async function(){await v302BaseLoadAll();try{const q=await sb.from('staff_bank_assignments').select('*');state.staffBankAssignments=q.error?[]:(q.data||[])}catch(_){state.staffBankAssignments=[]}}

renderBankCollectionTotals=function(){
 const host=$('#dashboardBankTotals');if(!host)return;
 const totals=new Map(state.banks.map(b=>[String(b.id),0]));
 for(const r of state.repayments){if(!inRange(r.payment_date))continue;const customer=state.customers.find(c=>String(c.id)===String(r.loans?.customer_id));if(customer?.assigned_bank_id!=null)totals.set(String(customer.assigned_bank_id),(totals.get(String(customer.assigned_bank_id))||0)+Number(r.amount||0));}
 host.innerHTML=state.banks.map(b=>{const assignedStaff=(state.staffBankAssignments||[]).filter(x=>String(x.bank_id)===String(b.id)).map(x=>v17StaffLabel(x.staff_user_id));return `<div class="bank-total-card bank-management-card"><div class="bank-card-top"><div><small>${SWK_LANG.current==='zh'?'公司收款账号':'Company Receiving Account'}</small><strong>${esc(b.bank_name)}</strong><span>${esc(b.account_name)} · ${esc(b.account_number)}</span></div><span class="badge ${b.is_enabled!==false?'ok':'danger'}">${b.is_enabled!==false?(SWK_LANG.current==='zh'?'使用中':'Active'):(SWK_LANG.current==='zh'?'已停用':'Disabled')}</span></div><div class="bank-amount-block"><span>${tr('amountReceived')}</span><strong>${money(totals.get(String(b.id))||0)}</strong></div><div class="assigned-staff-line"><span>${SWK_LANG.current==='zh'?'已分配客服':'Assigned Staff'}:</span><strong>${assignedStaff.length?esc(assignedStaff.join('、')):(SWK_LANG.current==='zh'?'未分配':'Unassigned')}</strong></div><div class="bank-card-actions"><button class="btn btn-secondary" onclick="openBank('${b.id}')">${tr('edit')}</button><button class="btn btn-primary" onclick="manageCustomerBank('${b.id}')">${SWK_LANG.current==='zh'?'分配客服':'Assign Staff'}</button></div></div>`}).join('')||`<div class="card muted">${tr('noReceivingBanks')}</div>`;
};

renderSubmissions=function(){
 const rows=state.filter==='all'?state.submissions:state.submissions.filter(x=>x.status===state.filter);
 $('#submissionRows').innerHTML=rows.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.customers?.full_name)}</td><td>${esc(x.loans?.loan_id)}</td><td>${money(x.amount)}</td><td><button class="btn btn-secondary" onclick="viewReceipt('${x.id}')">${SWK_LANG.current==='zh'?'查看':'View'}</button></td><td><span class="badge ${x.status==='approved'?'ok':x.status==='rejected'?'danger':'warn'}">${SWK_LANG.current==='zh'?({pending:'待审核',approved:'已批准',rejected:'已拒绝'}[x.status]||x.status):x.status}</span></td><td>${x.status==='pending'?`<button class="btn btn-primary" onclick="approveSubmission('${x.id}')">${SWK_LANG.current==='zh'?'批准':'Approve'}</button> <button class="btn btn-danger" onclick="rejectSubmission('${x.id}')">${SWK_LANG.current==='zh'?'拒绝':'Reject'}</button>`:''}</td></tr>`).join('')||`<tr><td colspan="7" class="muted">${tr('noRecords')}</td></tr>`;
};
window.approveSubmission=async function(id){
 if(!requirePerm('payments_approve_partial'))return;
 const x=state.submissions.find(v=>String(v.id)===String(id));
 if(!x)return toast(SWK_LANG.current==='zh'?'找不到这笔付款申请':'Payment submission not found',true);
 if(!confirm(SWK_LANG.current==='zh'?`确认批准 ${money(x.amount)} 的付款？`:`Approve payment ${money(x.amount)}?`))return;
 const btn=document.querySelector(`button[onclick="approveSubmission('${id}')"]`);if(btn){btn.disabled=true;btn.textContent=SWK_LANG.current==='zh'?'处理中...':'Processing...'}
 try{
  const r=await sb.rpc('wl_review_payment_submission_v304',{p_submission_id:id,p_action:'approve',p_note:null});
  if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Approval failed');
  toast(SWK_LANG.current==='zh'?'付款已批准':'Payment approved');await refreshNotificationData();await loadAll();
 }catch(e){toast((SWK_LANG.current==='zh'?'批准失败：':'Approval failed: ')+(e?.message||e),true)}finally{if(btn){btn.disabled=false;btn.textContent=SWK_LANG.current==='zh'?'批准':'Approve'}}
};
window.rejectSubmission=async function(id){
 if(!requirePerm('payments_reject'))return;const note=prompt(SWK_LANG.current==='zh'?'请输入拒绝原因':'Rejection reason')||'';const r=await sb.rpc('wl_review_payment_submission_v304',{p_submission_id:id,p_action:'reject',p_note:note});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error||'Rejection failed',true);toast(SWK_LANG.current==='zh'?'付款已拒绝':'Payment rejected');await refreshNotificationData();await loadAll();
};

const v302OldSetupPaymentNotifications=setupPaymentNotifications;
setupPaymentNotifications=function(){
 for(const key of ['paymentChannel','applicationChannel']){if(state[key]){try{sb.removeChannel(state[key])}catch(_){ }state[key]=null}}
 const paymentRefresh=async payload=>{try{await refreshNotificationData();if(payload?.eventType==='INSERT')toast(SWK_LANG.current==='zh'?'收到新的付款申请':SWK_LANG.current==='ms'?'Penyerahan bayaran baharu diterima':'New payment submission received')}catch(e){console.error('Payment notification refresh failed',e)}};
 const applicationRefresh=async payload=>{try{await refreshNotificationData();if(payload?.eventType==='INSERT')toast(SWK_LANG.current==='zh'?'收到新的贷款申请':SWK_LANG.current==='ms'?'Permohonan pinjaman baharu diterima':'New loan application received')}catch(e){console.error('Application notification refresh failed',e)}};
 state.paymentChannel=sb.channel('wl-payment-notifications-v412-'+state.staff.user_id).on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},paymentRefresh).subscribe();
 state.applicationChannel=sb.channel('wl-loan-application-notifications-v412-'+state.staff.user_id).on('postgres_changes',{event:'*',schema:'public',table:'loan_applications'},applicationRefresh).subscribe();
 if(state.notificationPoll)clearInterval(state.notificationPoll);
 state.notificationPoll=setInterval(async()=>{try{await refreshNotificationData()}catch(e){console.warn('Notification fallback refresh failed',e)}},15000);
};

const v302OldRenderLoans=renderLoans;
renderLoans=function(){v302OldRenderLoans();$$('#loanRows tr').forEach(row=>{const code=row.querySelector('td')?.textContent?.trim(),l=state.loans.find(x=>String(x.loan_id)===String(code));if(!l)return;const action=row.querySelector('td:last-child');if(!action)return;if(!action.querySelector('.v302-overdue-btn'))action.insertAdjacentHTML('beforeend',` <button class="btn btn-danger v302-overdue-btn" onclick="setOverdueCharge('${l.id}')">${SWK_LANG.current==='zh'?'逾期应收':'Overdue Charge'}</button>`)});};

/* ===== WL Credit V30.5 workflow fixes ===== */
function v305IsSuperAdmin(){return ['super_admin','superadmin'].includes(normalizedRole(state.staff?.role))}

const v305OldApplyRoleVisibility=applyRoleVisibility;
applyRoleVisibility=function(){
  try{v305OldApplyRoleVisibility()}catch(e){console.error(e)}
  const allow=v305IsSuperAdmin()||['manager','admin','supervisor'].includes(normalizedRole(state.staff?.role));
  const btn=$('#nav button[data-section="companyManagement"]');
  const group=btn?.closest('.nav-group');
  if(btn)btn.classList.toggle('hidden',!allow);
  if(group&&allow)group.classList.remove('hidden');
};

const v305OldRenderCompanyManagement=renderCompanyManagement;
renderCompanyManagement=function(){
  if(v305IsSuperAdmin()){
    try{return v305OldRenderCompanyManagement()}catch(e){console.error('Company management render failed',e);const root=$('#companyManagement');if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;return}
  }
  return v305OldRenderCompanyManagement();
};

window.approveApplication=function(id){
  if(!requirePerm('applications_approve'))return;
  const a=state.applications.find(x=>x.id===id);if(!a)return;
  const principal=Number(a.requested_amount||0),interest=Math.round(principal*.01*100)/100;
  const serviceStaff=(state.staffList||[]).filter(s=>s.is_active!==false&&normalizedRole(s.role)==='customer_service');
  const staffOptions=`<option value="">${SWK_LANG.current==='zh'?'不转移／保留当前客服':SWK_LANG.current==='ms'?'Kekalkan staf semasa':'Keep current staff'}</option>`+serviceStaff.map(s=>`<option value="${esc(s.user_id)}">${esc(s.full_name||s.username||s.user_id)}</option>`).join('');
  modal(`<h2>${SWK_LANG.current==='zh'?'批准贷款申请':'Approve Application'} ${esc(a.application_code)}</h2><form id="approveApplicationForm"><div class="grid2"><div class="field"><label>${SWK_LANG.current==='zh'?'临时密码':'Temporary Password'}</label><input name="pin" minlength="4" required value="WL${Math.floor(100000+Math.random()*900000)}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'本金':'Principal'} (MYR)</label><input name="principal" type="number" min="0.01" step="0.01" required value="${principal}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'利息':'Interest'} (MYR)</label><input name="interest" type="number" min="0" step="0.01" required value="${interest}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'清账金额':'Settlement Amount'} (MYR)</label><input name="settlement" type="number" min="0.01" step="0.01" required value="${principal+interest}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'放款日期':'Disbursement Date'}</label><input name="disb" type="date" required value="${isoToday()}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'到期日期':'Due Date'}</label><input name="due" type="date" required value="${addDays(isoToday(),30)}"></div></div>${v305IsSuperAdmin()?`<div class="field"><label>${SWK_LANG.current==='zh'?'批准后转移给客服':'Transfer to customer service after approval'}</label><select name="target_staff">${staffOptions}</select></div>`:''}<div class="field"><label>${SWK_LANG.current==='zh'?'备注':'Notes'}</label><textarea name="notes">Application ${esc(a.application_code)}</textarea></div><button class="btn btn-primary">${SWK_LANG.current==='zh'?'批准并建立账户':'Approve & Create Account'}</button></form>`);
  $('#approveApplicationForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const x=await sb.rpc('staff_approve_loan_application',{p_application_id:id,p_temp_pin:f.get('pin'),p_principal:Number(f.get('principal')),p_interest:Number(f.get('interest')),p_settlement_amount:Number(f.get('settlement')),p_disbursement_date:f.get('disb'),p_due_date:f.get('due'),p_notes:f.get('notes')});if(x.error||!x.data?.ok)return toast(x.error?.message||x.data?.error||'Approval failed',true);const d=x.data,target=f.get('target_staff')||null;const update={};if(target)update.owner_staff_id=target;const ur=Object.keys(update).length?await sb.from('customers').update(update).eq('id',d.customer_id):{error:null};if(ur.error)return toast(ur.error.message,true);toast(SWK_LANG.current==='zh'?'贷款已批准':'Application approved');closeModal();await loadAll()};
};

window.approveSubmission=function(id){
  if(!requirePerm('payments_approve_partial'))return;
  const x=state.submissions.find(v=>String(v.id)===String(id));if(!x)return toast('Payment submission not found',true);
  const l=state.loans.find(v=>String(v.id)===String(x.loan_id))||{};
  const currentInterest=Number(l.interest||x.loans?.current_due_amount||0);
  const currentSettlement=Number(l.settlement_amount||x.loans?.settlement_amount||0);
  modal(`<h2>${SWK_LANG.current==='zh'?'批准付款':'Approve Payment'}</h2><p>${SWK_LANG.current==='zh'?'本次付款':'Payment'}: <strong>${money(x.amount)}</strong></p><form id="v305ApprovePaymentForm"><div class="grid2"><div class="field"><label>${SWK_LANG.current==='zh'?'下一期到账时间':'Next Payment Due Time'}</label><input type="datetime-local" name="next_due" required></div><div class="field"><label>${SWK_LANG.current==='zh'?'下一期利息':'Next Interest'} (MYR)</label><input type="number" name="interest" min="0" step="0.01" required value="${currentInterest}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'下一期清账金额':'Next Settlement Amount'} (MYR)</label><input type="number" name="settlement" min="0" step="0.01" required value="${currentSettlement}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'备注':'Note'}</label><input name="note"></div></div><button class="btn btn-primary">${SWK_LANG.current==='zh'?'确认通过':'Confirm Approval'}</button></form>`);
  const input=$('#v305ApprovePaymentForm [name="next_due"]');if(input){const d=new Date();d.setDate(d.getDate()+30);input.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
  $('#v305ApprovePaymentForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),btn=e.submitter;btn.disabled=true;try{const r=await sb.rpc('wl_review_payment_submission_v305',{p_submission_id:id,p_next_due_at:new Date(f.get('next_due')).toISOString(),p_next_interest:Number(f.get('interest')),p_next_settlement:Number(f.get('settlement')),p_note:f.get('note')||null});if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Approval failed');closeModal();toast(SWK_LANG.current==='zh'?'付款已批准，客户前台已更新':'Payment approved and customer portal updated');await refreshNotificationData();await loadAll()}catch(err){toast(err.message||String(err),true);btn.disabled=false}}
};

/* ===== WL Credit V30.6 compatibility hotfix ===== */
function v306EffectiveRole(){
 const uid=String(state.staff?.user_id||'');
 const live=(state.staffList||[]).find(s=>String(s.user_id||'')===uid);
 return normalizedRole(live?.role||state.staff?.role);
}
isSuperAdmin=function(){return ['super_admin','superadmin'].includes(v306EffectiveRole())};
isAdminLevel=function(){return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(v306EffectiveRole())};
has=function(p){return isSuperAdmin()||['admin','manager'].includes(v306EffectiveRole())||state.staff?.permissions?.[p]===true};

const v306OldLoadAll=loadAll;
loadAll=async function(){
 await v306OldLoadAll();
 const uid=String(state.staff?.user_id||'');
 const live=(state.staffList||[]).find(s=>String(s.user_id||'')===uid);
 if(live){state.staff={...state.staff,...live};const ident=$('#staffIdentity');if(ident)ident.textContent=`${state.staff.full_name||state.staff.username||''} · ${state.staff.role||''}`;}
};

const v306OldRenderCompanyManagement=renderCompanyManagement;
renderCompanyManagement=function(){
 const role=v306EffectiveRole();
 if(['super_admin','superadmin','finance','manager','admin','supervisor'].includes(role)){
   try{return v306OldRenderCompanyManagement()}catch(e){console.error(e);const root=$('#companyManagement');if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;}
 }
 const root=$('#companyManagement');if(root)root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'当前账号角色：'+esc(role||'-')+'。请执行 V30.6 SQL 修复 admin01 的 Super Admin 角色。':'Current role: '+esc(role||'-')+'. Run the V30.6 SQL role repair.'}</p></div>`;
};

window.approveSubmission=function(id){
 if(!requirePerm('payments_approve_partial'))return;
 const x=state.submissions.find(v=>String(v.id)===String(id));if(!x)return toast(SWK_LANG.current==='zh'?'找不到付款申请':'Payment submission not found',true);
 const l=state.loans.find(v=>String(v.id)===String(x.loan_id))||{};
 const overdue=Number(l.overdue_charge||0);
 const currentInterest=Number(l.interest||x.loans?.current_due_amount||0);
 const currentSettlement=Number(l.settlement_amount||x.loans?.settlement_amount||0);
 modal(`<h2>${SWK_LANG.current==='zh'?'批准付款':'Approve Payment'}</h2><p>${SWK_LANG.current==='zh'?'本次付款':'Payment'}: <strong>${money(x.amount)}</strong></p><form id="v306ApprovePaymentForm"><div class="grid2"><div class="field"><label>${SWK_LANG.current==='zh'?'下一期到账时间':'Next Payment Due Time'}</label><input type="datetime-local" name="next_due" required></div><div class="field"><label>${SWK_LANG.current==='zh'?'下一期利息':'Next Interest'} (MYR)</label><input type="number" name="interest" min="0" step="0.01" required value="${currentInterest}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'下一期清账金额':'Next Settlement Amount'} (MYR)</label><input type="number" name="settlement" min="0" step="0.01" required value="${currentSettlement}"></div><div class="field"><label>${SWK_LANG.current==='zh'?'备注':'Note'}</label><input name="note"></div></div>${overdue>0?`<div class="card overdue-review-box"><p><strong>${SWK_LANG.current==='zh'?'当前逾期应收':'Current overdue charge'}: ${money(overdue)}</strong></p><label class="check-row"><input type="checkbox" name="overdue_paid" value="1"> ${SWK_LANG.current==='zh'?'本次付款已包含逾期应收（勾选后清除逾期）':'This payment includes the overdue charge (clear overdue after approval)'}</label><p class="muted">${SWK_LANG.current==='zh'?'不勾选，逾期应收会继续显示在客户前台。':'Leave unchecked to keep the overdue charge visible to the customer.'}</p></div>`:''}<button class="btn btn-primary">${SWK_LANG.current==='zh'?'确认通过':'Confirm Approval'}</button></form>`);
 const input=$('#v306ApprovePaymentForm [name="next_due"]');if(input){const d=new Date();d.setDate(d.getDate()+30);input.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
 $('#v306ApprovePaymentForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),btn=e.submitter;btn.disabled=true;btn.textContent=SWK_LANG.current==='zh'?'处理中...':'Processing...';try{const r=await sb.rpc('wl_review_payment_submission_v306',{p_submission_id:id,p_next_due_at:new Date(f.get('next_due')).toISOString(),p_next_interest:Number(f.get('interest')),p_next_settlement:Number(f.get('settlement')),p_overdue_paid:f.get('overdue_paid')==='1',p_note:f.get('note')||null});if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Approval failed');closeModal();toast(SWK_LANG.current==='zh'?'付款已批准':'Payment approved');await refreshNotificationData();await loadAll()}catch(err){toast(err.message||String(err),true);btn.disabled=false;btn.textContent=SWK_LANG.current==='zh'?'确认通过':'Confirm Approval'}};
};

/* ===== WL Credit V30.7 company management role/render hotfix ===== */
function v307CompanyRole(){
  const uid=String(state.staff?.user_id||'');
  const username=String(state.staff?.username||'').trim().toLowerCase();
  const live=(state.staffList||[]).find(s=>String(s.user_id||'')===uid || (username && String(s.username||'').trim().toLowerCase()===username));
  return normalizedRole(live?.role || state.staff?.role || '');
}
function v307CanOpenCompany(){
  return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(v307CompanyRole());
}
isSuperAdmin=function(){return ['super_admin','superadmin'].includes(v307CompanyRole())};
isAdminLevel=function(){return v307CanOpenCompany()};

const v307BaseRenderCompany=renderCompanyManagement;
renderCompanyManagement=function(){
  const root=$('#companyManagement');
  if(!v307CanOpenCompany()){
    if(root) root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'当前账号角色：'+esc(v307CompanyRole()||'-')+'。公司管理开放给财务和超级管理员。':SWK_LANG.current==='ms'?'Peranan semasa: '+esc(v307CompanyRole()||'-')+'. Pengurusan Syarikat tersedia untuk Kewangan dan Super Admin.':'Current role: '+esc(v307CompanyRole()||'-')+'. Company Management is available to Finance and Super Admin.'}</p></div>`;
    return;
  }
  try{return v307BaseRenderCompany()}catch(e){
    console.error('Company management render failed',e);
    if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
  }
};

const v307BaseLoadAll=loadAll;
loadAll=async function(){
  await v307BaseLoadAll();
  const uid=String(state.staff?.user_id||'');
  const username=String(state.staff?.username||'').trim().toLowerCase();
  const live=(state.staffList||[]).find(s=>String(s.user_id||'')===uid || (username && String(s.username||'').trim().toLowerCase()===username));
  if(live) state.staff={...state.staff,...live};
  const ident=$('#staffIdentity');
  if(ident)ident.textContent=`${state.staff?.full_name||state.staff?.username||''} · ${state.staff?.role||''}`;
  renderCompanyManagement();
};

/* ===== WL Credit V30.8 final company/payment compatibility ===== */
function v308Role(){
  const direct=normalizedRole(state.staff?.role||'');
  if(direct)return direct;
  const text=String(document.querySelector('#staffIdentity')?.textContent||'');
  const fromText=normalizedRole((text.split('·')[1]||'').trim());
  return fromText;
}
isSuperAdmin=function(){return ['super_admin','superadmin'].includes(v308Role())};
isAdminLevel=function(){return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(v308Role())};
has=function(p){return isSuperAdmin()||['manager','admin'].includes(v308Role())||state.staff?.permissions?.[p]===true};

renderCompanyManagement=function(){
  const root=document.querySelector('#companyManagement');
  if(!isAdminLevel()){
    if(root)root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'当前账号角色：'+esc(v308Role()||'-')+'。公司管理开放给财务和超级管理员。':'Company Management is available to Finance and Super Admin.'}</p></div>`;
    return;
  }
  try{
    // Call the original complete renderer directly; do not pass through old role wrappers.
    return v306OldRenderCompanyManagement();
  }catch(e){
    console.error('V30.8 company render failed',e);
    if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
  }
};

window.approveSubmission=function(id){
  if(!requirePerm('payments_approve_partial'))return;
  const x=state.submissions.find(v=>String(v.id)===String(id));
  if(!x)return toast(SWK_LANG.current==='zh'?'找不到付款申请':'Payment submission not found',true);
  const l=state.loans.find(v=>String(v.id)===String(x.loan_id))||{};
  const overdue=Number(l.overdue_charge||0);
  const currentInterest=Number(l.interest||x.loans?.current_due_amount||0);
  const currentSettlement=Number(l.settlement_amount||x.loans?.settlement_amount||0);
  modal(`<h2>${SWK_LANG.current==='zh'?'批准付款':'Approve Payment'}</h2>
  <p>${SWK_LANG.current==='zh'?'本次付款':'Payment'}: <strong>${money(x.amount)}</strong></p>
  <form id="v308ApprovePaymentForm">
   <div class="grid2">
    <div class="field"><label>${SWK_LANG.current==='zh'?'下一期到账时间':'Next Payment Due Time'}</label><input type="datetime-local" name="next_due" required></div>
    <div class="field"><label>${SWK_LANG.current==='zh'?'下一期利息':'Next Interest'} (MYR)</label><input type="number" name="interest" min="0" step="0.01" required value="${currentInterest}"></div>
    <div class="field"><label>${SWK_LANG.current==='zh'?'下一期清账金额':'Next Settlement Amount'} (MYR)</label><input type="number" name="settlement" min="0" step="0.01" required value="${currentSettlement}"></div>
    <div class="field"><label>${SWK_LANG.current==='zh'?'备注':'Note'}</label><input name="note"></div>
   </div>
   <div class="card overdue-review-box">
    <p><strong>${SWK_LANG.current==='zh'?'当前逾期应收':'Current overdue charge'}: ${money(overdue)}</strong></p>
    <label class="check-row"><input type="checkbox" name="overdue_paid" value="1" ${overdue<=0?'disabled':''}> ${SWK_LANG.current==='zh'?'本次付款有偿还逾期应收':'This payment includes the overdue charge'}</label>
    <p class="muted">${overdue>0?(SWK_LANG.current==='zh'?'勾选后会清除逾期；不勾选则继续显示在客户前台。':'Check to clear overdue; leave unchecked to keep it visible.'):(SWK_LANG.current==='zh'?'目前没有逾期应收。':'There is currently no overdue charge.')}</p>
   </div>
   <button class="btn btn-primary">${SWK_LANG.current==='zh'?'确认通过':'Confirm Approval'}</button>
  </form>`);
  const input=document.querySelector('#v308ApprovePaymentForm [name="next_due"]');
  if(input){const d=new Date();d.setDate(d.getDate()+30);input.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
  document.querySelector('#v308ApprovePaymentForm').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.target),btn=e.submitter;btn.disabled=true;btn.textContent=SWK_LANG.current==='zh'?'处理中...':'Processing...';
    try{
      const r=await sb.rpc('wl_review_payment_submission_v308',{p_submission_id:id,p_next_due_at:new Date(f.get('next_due')).toISOString(),p_next_interest:Number(f.get('interest')),p_next_settlement:Number(f.get('settlement')),p_overdue_paid:f.get('overdue_paid')==='1',p_note:f.get('note')||null});
      if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Approval failed');
      closeModal();toast(SWK_LANG.current==='zh'?'付款已批准':'Payment approved');await refreshNotificationData();await loadAll();
    }catch(err){toast(err.message||String(err),true);btn.disabled=false;btn.textContent=SWK_LANG.current==='zh'?'确认通过':'Confirm Approval'}
  };
};

/* ===== WL Credit V30.9 definitive company management renderer ===== */
function v309CurrentRole(){
  const visible=String(document.querySelector('#staffIdentity')?.textContent||'').split('·').pop().trim();
  return normalizedRole(state.staff?.role || visible || '');
}
renderCompanyManagement=function(){
  const root=document.querySelector('#companyManagement');
  const role=v309CurrentRole();
  if(!['super_admin','superadmin','finance','manager','admin','supervisor'].includes(role)){
    if(root) root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'当前账号角色：'+esc(role||'-')+'。公司管理开放给财务和超级管理员。':'Company Management is available to Finance and Super Admin.'}</p></div>`;
    return;
  }
  // The base V11 renderer contains its own legacy role gate. Temporarily bypass only that gate.
  const previousIsAdminLevel=isAdminLevel;
  try{
    isAdminLevel=()=>true;
    return v305OldRenderCompanyManagement();
  }catch(e){
    console.error('V30.9 company management render failed',e);
    if(root) root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
  }finally{
    isAdminLevel=previousIsAdminLevel;
  }
};

/* ===== WL Credit V30.10 role/company definitive fix ===== */
function v310EffectiveRole(){
  const candidates=[
    state?.staff?.role,
    String(document.querySelector('#staffIdentity')?.textContent||'').split('·').pop(),
    document.body?.dataset?.staffRole
  ];
  for(const value of candidates){
    const role=normalizedRole(value);
    if(role)return role;
  }
  return '';
}
isSuperAdmin=function(){return ['super_admin','superadmin'].includes(v310EffectiveRole())};
isAdminLevel=function(){return ['super_admin','superadmin','finance','manager','admin','supervisor'].includes(v310EffectiveRole())};
has=function(p){return isSuperAdmin()||['admin','manager','finance'].includes(v310EffectiveRole())||state.staff?.permissions?.[p]===true};

renderCompanyManagement=function(){
  const root=document.querySelector('#companyManagement');
  const role=v310EffectiveRole();
  if(!['super_admin','superadmin','finance','manager','admin','supervisor'].includes(role)){
    if(root)root.innerHTML=`<div class="card"><p class="muted">${SWK_LANG.current==='zh'?'当前账号角色：'+esc(role||'-')+'。公司管理开放给财务和超级管理员。':'Company Management is available to Finance and Super Admin.'}</p></div>`;
    return;
  }
  try{
    // Call the original company renderer while the definitive role helpers above are active.
    return v305OldRenderCompanyManagement();
  }catch(e){
    console.error('V30.10 company management render failed',e);
    if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
  }
};

// Re-render company management whenever its navigation item is opened.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#nav button[data-section="companyManagement"]');
  if(btn)setTimeout(()=>renderCompanyManagement(),0);
});

/* ===== WL Credit V30.11 finance dashboard, company access and backup compatibility ===== */
function v311Text(zh,en,ms){return SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en}
function v311RoleFromPage(){
 const txt=String(document.body?.innerText||'').toLowerCase();
 if(txt.includes('super_admin')||txt.includes('super admin'))return 'super_admin';
 if(txt.includes('· manager')||txt.includes(' manager'))return 'manager';
 return normalizedRole(state.staff?.role||'');
}
function v311IsManagement(){return ['super_admin','superadmin','finance','manager'].includes(v311RoleFromPage())}

renderCompanyManagement=function(){
 const root=document.querySelector('#companyManagement');
 if(!v311IsManagement()){
   if(root)root.innerHTML=`<div class="card"><p class="muted">${v311Text('公司管理开放给财务和超级管理员。','Company Management is available to Finance and Super Admin.','Pengurusan Syarikat tersedia untuk Kewangan dan Super Admin.')}</p></div>`;
   return;
 }
 const oldRole=state.staff?.role, oldAdmin=isAdminLevel, oldSuper=isSuperAdmin;
 try{
   if(state.staff)state.staff.role=v311RoleFromPage()==='manager'?'manager':'super_admin';
   isAdminLevel=()=>true; isSuperAdmin=()=>v311RoleFromPage()==='super_admin';
   return v305OldRenderCompanyManagement();
 }catch(e){
   console.error('V30.11 company management failed',e);
   if(root)root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
 }finally{
   if(state.staff)state.staff.role=oldRole; isAdminLevel=oldAdmin; isSuperAdmin=oldSuper;
 }
};

function v311LoanOwner(loan){
 const c=state.customers.find(x=>String(x.id)===String(loan.customer_id));
 return String(c?.owner_staff_id||c?.claimed_by||'');
}
function v311DateInside(v){return inRange(v)}
function v311Metrics(owner){
 const loans=state.loans.filter(l=>(!owner||v311LoanOwner(l)===String(owner))&&v311DateInside(l.disbursement_date||l.created_at));
 const loanIds=new Set(state.loans.filter(l=>!owner||v311LoanOwner(l)===String(owner)).map(l=>String(l.id)));
 const reps=state.repayments.filter(r=>loanIds.has(String(r.loan_id))&&v311DateInside(r.payment_date||r.created_at));
 const disbursed=loans.reduce((s,l)=>s+Number(l.principal||0),0);
 const interest=reps.reduce((s,r)=>s+Number(r.interest_amount??r.interest_paid??0),0);
 const overdue=reps.reduce((s,r)=>s+Number(r.overdue_amount??r.overdue_paid_amount??0),0);
 const fallbackCollected=reps.reduce((s,r)=>s+Number(r.amount||0),0);
 const known=interest+overdue;
 const effectiveInterest=known>0?interest:fallbackCollected;
 return {disbursed,interest:effectiveInterest,overdue,profit:effectiveInterest+overdue-disbursed};
}
function v311RenderFinance(){
 if(!state?.staff && document.querySelector('#staffLoginView') && !document.querySelector('#staffLoginView')?.classList.contains('hidden')) return;
 const management=v311IsManagement();
 const own=management?'':String(state.staff?.user_id||'');
 const m=v311Metrics(own);
 document.querySelector('#reportPrincipal')&&(document.querySelector('#reportPrincipal').textContent=money(m.disbursed));
 document.querySelector('#reportInterest')&&(document.querySelector('#reportInterest').textContent=money(m.interest));
 document.querySelector('#v311OverdueCollected')&&(document.querySelector('#v311OverdueCollected').textContent=money(m.overdue));
 document.querySelector('#reportCollected')&&(document.querySelector('#reportCollected').textContent=money(m.profit));
 const rows=document.querySelector('#v311StaffProfitRows');if(!rows)return;
 const staff=management?(state.staffList||[]).filter(s=>normalizedRole(s.role)==='customer_service'):[state.staff];
 const safeStaff=(staff||[]).filter(Boolean);
 rows.innerHTML=safeStaff.map(s=>{
   const staffUserId=s?.user_id||s?.auth_user_id||s?.id||'';
   const x=v311Metrics(staffUserId);
   return `<tr><td>${esc(s?.full_name||s?.username||s?.staff_label||'-')}</td><td>${money(x.disbursed)}</td><td>${money(x.interest)}</td><td>${money(x.overdue)}</td><td class="${x.profit<0?'danger-text':''}">${money(x.profit)}</td></tr>`
 }).join('')||`<tr><td colspan="5">${v311Text('没有记录','No records','Tiada rekod')}</td></tr>`;
 const labels={zh:['放款总额','已收利息','已收逾期','盈亏','客服盈亏报表','根据上方日期范围计算；Super Admin 查看全部客服，客服只查看自己。'],en:['Total Disbursed','Interest Collected','Overdue Collected','Profit / Loss','Staff Profit / Loss','Calculated from the selected date range. Super Admin sees all staff; staff sees only their own.'],ms:['Jumlah Dikeluarkan','Faedah Diterima','Tertunggak Diterima','Untung / Rugi','Untung / Rugi Staf','Dikira mengikut julat tarikh. Super Admin melihat semua staf; staf melihat data sendiri.']}[SWK_LANG.current]||[];
 ['v311DisbursedLabel','v311InterestLabel','v311OverdueLabel','v311ProfitLabel','v311StaffProfitTitle','v311StaffProfitHelp'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=labels[i]||''});
}
const v311OldRenderStats=renderStats;
renderStats=function(){try{v311OldRenderStats()}catch(e){console.warn(e)}v311RenderFinance()};
document.addEventListener('click',e=>{if(e.target.closest?.('#nav button[data-section="companyManagement"]'))setTimeout(renderCompanyManagement,20)});
window.addEventListener('swk-language-applied',()=>setTimeout(v311RenderFinance,20));


/* ===== WL Credit V30.13 definitive company access + complete language sweep ===== */
function v3013EffectiveRole(){
  const direct=normalizedRole(state?.staff?.role||'');
  if(direct)return direct;
  const identity=String(document.querySelector('#staffIdentity')?.textContent||'').toLowerCase();
  if(identity.includes('super_admin')||identity.includes('super admin'))return 'super_admin';
  if(identity.includes('manager'))return 'manager';
  if(identity.includes('customer_service')||identity.includes('customer service'))return 'customer_service';
  return '';
}
function v3013ManagementAllowed(){return ['super_admin','superadmin','finance','manager'].includes(v3013EffectiveRole())}

renderCompanyManagement=function(){
  const root=document.querySelector('#companyManagement');
  if(!root)return;
  const role=v3013EffectiveRole();
  if(!role){
    root.innerHTML=`<div class="card"><p class="muted">${v311Text('正在读取账号权限…','Loading account permissions…','Memuatkan kebenaran akaun…')}</p></div>`;
    clearTimeout(window.__v3013CompanyRetry);
    window.__v3013CompanyRetry=setTimeout(()=>renderCompanyManagement(),350);
    return;
  }
  if(!v3013ManagementAllowed()){
    root.innerHTML=`<div class="card"><p class="muted">${v311Text('公司管理开放给财务和超级管理员。','Company Management is available to Finance and Super Admin.','Pengurusan Syarikat tersedia untuk Kewangan dan Super Admin.')}</p></div>`;
    return;
  }
  const oldRole=state.staff?.role, oldAdmin=isAdminLevel, oldSuper=isSuperAdmin;
  try{
    if(!state.staff)state.staff={user_id:'',role};
    else state.staff.role=role;
    isAdminLevel=()=>true;
    isSuperAdmin=()=>['super_admin','superadmin'].includes(role);
    return v305OldRenderCompanyManagement();
  }catch(e){
    console.error('V30.13 company management failed',e);
    root.innerHTML=`<div class="card"><p class="danger-text">${esc(e.message||String(e))}</p></div>`;
  }finally{
    if(state.staff)state.staff.role=oldRole||role;
    isAdminLevel=oldAdmin;
    isSuperAdmin=oldSuper;
  }
};

const v3013TextMap={
 zh:{
  'Username':'用户名','Loan Management':'贷款管理','Company Management':'公司管理','My HR':'我的人事',
  'Search Loan ID / Customer / IC / Phone / Payment ID':'搜索贷款编号／客户／IC／电话／付款编号',
  'Pending payments':'待审核付款','Enable Sound':'开启声音','Today':'今天','Yesterday':'昨天','This Week':'本周','Last Week':'上周','This Month':'本月','Last Month':'上月','to':'至','Apply':'查询',
  'Loan Applications':'贷款申请','Pending':'待审核','Under Review':'审核中','Approved':'已批准','Rejected':'已拒绝','All':'全部',
  'Application ID':'申请编号','Date':'日期','Applicant':'申请人','Phone':'电话','Requested Amount':'申请金额','Status':'状态','Actions':'操作',
  'Receiving Bank Collections':'收款银行统计','Contact Methods':'联系方式','Defaults':'默认设置','Announcement':'公告','Automatic Assignment':'自动分配',
  'Default Collection Bank':'默认收款银行','Default WhatsApp Contact':'默认 WhatsApp 联系方式','Default Telegram Contact':'默认 Telegram 联系方式',
  'Automatically assign defaults to new customers':'自动为新客户分配默认设置','Save Defaults':'保存默认设置',
  'Telegram Bot':'Telegram 机器人','Danger Zone':'危险操作区','Production Reset':'清空业务数据','Account & Permissions':'账号与权限',
  'Active':'启用','Inactive':'停用','Staff':'客服','Manager':'经理','Super Admin':'超级管理员','No records':'暂无记录',
  'Staff / Scope':'员工／范围','Backup ID':'备份编号','File':'文件','Created By':'创建人','Created At':'创建时间','Action':'操作',
  'Create Full Backup & Download':'建立完整备份并下载','Daily Full Backup':'每日完整备份','Today Backup Status':'今日备份状态'
 },
 ms:{
  'Username':'Nama pengguna','Loan Management':'Pengurusan Pinjaman','Company Management':'Pengurusan Syarikat','My HR':'HR Saya',
  'Search Loan ID / Customer / IC / Phone / Payment ID':'Cari ID Pinjaman / Pelanggan / IC / Telefon / ID Bayaran',
  'Pending payments':'Bayaran Menunggu','Enable Sound':'Aktifkan Bunyi','Today':'Hari Ini','Yesterday':'Semalam','This Week':'Minggu Ini','Last Week':'Minggu Lepas','This Month':'Bulan Ini','Last Month':'Bulan Lepas','to':'hingga','Apply':'Cari',
  'Loan Applications':'Permohonan Pinjaman','Pending':'Menunggu','Under Review':'Dalam Semakan','Approved':'Diluluskan','Rejected':'Ditolak','All':'Semua',
  'Application ID':'ID Permohonan','Date':'Tarikh','Applicant':'Pemohon','Phone':'Telefon','Requested Amount':'Jumlah Dipohon','Status':'Status','Actions':'Tindakan',
  'Receiving Bank Collections':'Statistik Bank Kutipan','Contact Methods':'Kaedah Hubungan','Defaults':'Tetapan Lalai','Announcement':'Pengumuman','Automatic Assignment':'Pengagihan Automatik',
  'Default Collection Bank':'Bank Kutipan Lalai','Default WhatsApp Contact':'Hubungan WhatsApp Lalai','Default Telegram Contact':'Hubungan Telegram Lalai',
  'Automatically assign defaults to new customers':'Agihkan tetapan lalai kepada pelanggan baharu secara automatik','Save Defaults':'Simpan Tetapan Lalai',
  'Telegram Bot':'Bot Telegram','Danger Zone':'Zon Bahaya','Production Reset':'Tetapan Semula Produksi','Account & Permissions':'Akaun & Kebenaran',
  'Active':'Aktif','Inactive':'Tidak Aktif','Staff':'Khidmat Pelanggan','Manager':'Pengurus','Super Admin':'Super Admin','No records':'Tiada rekod',
  'Staff / Scope':'Staf / Skop','Backup ID':'ID Sandaran','File':'Fail','Created By':'Dicipta Oleh','Created At':'Dicipta Pada','Action':'Tindakan',
  'Create Full Backup & Download':'Cipta Sandaran Penuh & Muat Turun','Daily Full Backup':'Sandaran Penuh Harian','Today Backup Status':'Status Sandaran Hari Ini'
 }
};
function v3013ApplyLanguageSweep(){
  const lang=SWK_LANG.current;
  if(lang==='en')return;
  const map=v3013TextMap[lang]||{};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(n=>{const raw=n.nodeValue,trim=raw.trim();if(map[trim])n.nodeValue=raw.replace(trim,map[trim])});
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{const x=el.getAttribute('placeholder');if(map[x])el.setAttribute('placeholder',map[x])});
  const loginUser=document.querySelector('label[for="staffUsername"]');if(loginUser)loginUser.textContent=map['Username']||'Username';
  const search=document.querySelector('#globalSearch');if(search)search.placeholder=map['Search Loan ID / Customer / IC / Phone / Payment ID']||search.placeholder;
}
const v3013OldApplyLanguage=window.applyLanguage;
if(typeof v3013OldApplyLanguage==='function')window.applyLanguage=function(...args){const r=v3013OldApplyLanguage.apply(this,args);setTimeout(v3013ApplyLanguageSweep,0);return r};
window.addEventListener('swk-language-applied',()=>setTimeout(v3013ApplyLanguageSweep,0));
document.addEventListener('click',e=>{if(e.target.closest?.('[data-section="companyManagement"]'))setTimeout(renderCompanyManagement,30)});
const v3013Identity=document.querySelector('#staffIdentity');
if(v3013Identity)new MutationObserver(()=>{if(document.querySelector('#companyManagement')?.classList.contains('active'))renderCompanyManagement()}).observe(v3013Identity,{childList:true,characterData:true,subtree:true});
setTimeout(v3013ApplyLanguageSweep,50);
