// Canonical customer login identity used by all extension modules.
function wlCustomerUsername(customer){return String(customer?.username||customer?.customer_code||'').trim().toUpperCase()}
/* WL Credit V50 LTS consolidated extensions. Generated from the deployed V43.2 script order. */

/* ===== v18-reports.js ===== */
(function(){
'use strict';
const T={
 en:{help:'Management reports, staff performance and Excel backups.',staff:'Staff Report',all:'All Staff',current:'Download Current Excel',full:'Download Full Backup',loans:'Loans',active:'Active Loans',completed:'Completed',disbursed:'Disbursed',collected:'Collected',expenses:'Expenses',payroll:'Payroll',income:'Other Income',profit:'Net Profit / Loss',overdue:'Overdue',customers:'Customers',downloaded:'Backup downloaded',company:'Company Total',unassigned:'Unassigned',gross:'Gross Cash Result',formula:'Net = collections + other income - disbursements - payroll - expenses',no:'No records'},
 zh:{help:'管理层报表、每位客服业绩及 Excel 备份。',staff:'客服报表',all:'全部客服',current:'下载当前 Excel',full:'下载完整备份',loans:'贷款笔数',active:'进行中贷款',completed:'已完成',disbursed:'放款金额',collected:'收款金额',expenses:'开销',payroll:'工资',income:'其他收入',profit:'净盈利／亏损',overdue:'逾期',customers:'客户数',downloaded:'备份已下载',company:'公司总计',unassigned:'未分配',gross:'现金毛结果',formula:'净盈利／亏损 = 收款 + 其他收入 - 放款 - 工资 - 开销',no:'没有记录'},
 ms:{help:'Laporan pengurusan, prestasi staf dan sandaran Excel.',staff:'Laporan Khidmat Pelanggan',all:'Semua Staf',current:'Muat Turun Excel Semasa',full:'Muat Turun Sandaran Penuh',loans:'Pinjaman',active:'Pinjaman Aktif',completed:'Selesai',disbursed:'Jumlah Dikeluarkan',collected:'Jumlah Dikutip',expenses:'Perbelanjaan',payroll:'Gaji',income:'Pendapatan Lain',profit:'Untung / Rugi Bersih',overdue:'Tertunggak',customers:'Pelanggan',downloaded:'Sandaran dimuat turun',company:'Jumlah Syarikat',unassigned:'Belum ditetapkan',gross:'Hasil Tunai Kasar',formula:'Bersih = kutipan + pendapatan lain - pengeluaran - gaji - perbelanjaan',no:'Tiada rekod'}
};
const tx=k=>(T[SWK_LANG.current]||T.en)[k]||k;
const n=v=>Number(v||0);
const d10=v=>String(v||'').slice(0,10);
const inDates=(v,from,to)=>{const d=d10(v);return !!d&&(!from||d>=from)&&(!to||d<=to)};
const staffName=s=>s?.full_name||s?.username||s?.staff_code||'-';
function reportStaff(){return (state.staffList||[]).filter(s=>['customer_service','collector','supervisor','manager'].includes(String(s.role||''))&&s.is_active!==false)}
function selectedStaffId(){const el=document.querySelector('#reportStaffFilter');return isSuperAdmin()?(el?.value||'all'):String(state.staff?.user_id||'')}
function ownerOfCustomer(c){return String(c?.owner_staff_id||c?.assigned_staff_id||'')}
function ownerOfLoan(l){const c=(state.customers||[]).find(x=>String(x.id)===String(l.customer_id));return ownerOfCustomer(c)}
function ownerOfRepayment(r){const l=(state.loans||[]).find(x=>String(x.id)===String(r.loan_id));return ownerOfLoan(l)}
function payrollOwner(p){const e=(state.employees||[]).find(x=>String(x.id)===String(p.employee_id));return String(e?.staff_user_id||'')}
function filterOwner(rows,getOwner,id){return id==='all'?rows:rows.filter(x=>getOwner(x)===id)}
function dataFor(from,to,id){
 const customers=filterOwner(state.customers||[],ownerOfCustomer,id);
 const loans=filterOwner((state.loans||[]).filter(x=>inDates(x.disbursement_date||x.created_at,from,to)),ownerOfLoan,id);
 const repayments=filterOwner((state.repayments||[]).filter(x=>inDates(x.payment_date||x.created_at,from,to)),ownerOfRepayment,id);
 const expenses=(state.expenses||[]).filter(x=>inDates(x.expense_date||x.created_at,from,to)&&(id==='all'||String(x.staff_user_id||'')===id));
 const income=(state.companyIncome||[]).filter(x=>inDates(x.income_date||x.created_at,from,to)&&(id==='all'||String(x.staff_user_id||'')===id));
 const payroll=(state.payroll||[]).filter(x=>inDates(x.payment_date||x.payroll_month||x.created_at,from,to)&&(id==='all'||payrollOwner(x)===id));
 const active=filterOwner((state.loans||[]).filter(x=>x.status==='active'),ownerOfLoan,id);
 const overdue=active.filter(x=>d10(x.due_date)<isoToday());
 const completed=filterOwner((state.loans||[]).filter(x=>x.status==='paid'&&inDates(x.updated_at||x.created_at,from,to)),ownerOfLoan,id);
 const disbursed=loans.reduce((s,x)=>s+n(x.principal),0),collected=repayments.reduce((s,x)=>s+n(x.amount),0),expenseTotal=expenses.reduce((s,x)=>s+n(x.amount),0),incomeTotal=income.reduce((s,x)=>s+n(x.amount),0),payrollTotal=payroll.reduce((s,x)=>s+n(x.net_salary),0);
 return {from,to,id,customers,loans,repayments,expenses,income,payroll,active,overdue,completed,disbursed,collected,expenseTotal,incomeTotal,payrollTotal,net:collected+incomeTotal-disbursed-payrollTotal-expenseTotal};
}
function staffRows(from,to){
 const rows=reportStaff().map(s=>({s,label:staffName(s),...dataFor(from,to,String(s.user_id))}));
 const un=dataFor(from,to,'');if(un.customers.length||un.loans.length)rows.push({s:null,label:tx('unassigned'),...un});return rows;
}
function setLabels(){
 const help=document.querySelector('#reportCenterHelp'),lab=document.querySelector('#reportStaffLabel'),cur=document.querySelector('#downloadExcel'),full=document.querySelector('#downloadFullBackup');
 if(help)help.textContent=tx('help');if(lab)lab.textContent=tx('staff');if(cur)cur.textContent=tx('current');if(full)full.textContent=tx('full');
}
function populate(){
 const sel=document.querySelector('#reportStaffFilter');if(!sel)return;const val=sel.value||'all';
 if(isSuperAdmin()){sel.disabled=false;sel.innerHTML=`<option value="all">${tx('all')}</option>`+reportStaff().map(s=>`<option value="${esc(s.user_id)}">${esc(staffName(s))}</option>`).join('')+`<option value="">${tx('unassigned')}</option>`;sel.value=[...sel.options].some(o=>o.value===val)?val:'all'}
 else{sel.innerHTML=`<option value="${esc(state.staff.user_id)}">${esc(staffName(state.staff))}</option>`;sel.disabled=true}
}
function renderV18(){
 const host=document.querySelector('#reportPreview');if(!host)return;setLabels();populate();
 const from=document.querySelector('#reportFrom')?.value||state.dateFrom,to=document.querySelector('#reportTo')?.value||state.dateTo,id=selectedStaffId(),r=dataFor(from,to,id);
 const cards=`<div class="management-report-grid"><div class="stat"><span>${tx('loans')}</span><strong>${r.loans.length}</strong></div><div class="stat"><span>${tx('disbursed')}</span><strong>${money(r.disbursed)}</strong></div><div class="stat"><span>${tx('collected')}</span><strong>${money(r.collected)}</strong></div><div class="stat ${r.net>=0?'profit':'loss'}"><span>${tx('profit')}</span><strong>${money(r.net)}</strong></div><div class="stat"><span>${tx('active')}</span><strong>${r.active.length}</strong></div><div class="stat"><span>${tx('overdue')}</span><strong>${r.overdue.length}</strong></div><div class="stat"><span>${tx('payroll')}</span><strong>${money(r.payrollTotal)}</strong></div><div class="stat"><span>${tx('expenses')}</span><strong>${money(r.expenseTotal)}</strong></div></div>`;
 let table='';if(isSuperAdmin()&&id==='all'){table=`<h3>${tx('staff')}</h3><div class="table-wrap"><table class="table staff-report-table"><thead><tr><th>${tx('staff')}</th><th>${tx('customers')}</th><th>${tx('loans')}</th><th>${tx('active')}</th><th>${tx('overdue')}</th><th>${tx('disbursed')}</th><th>${tx('collected')}</th><th>${tx('payroll')}</th><th>${tx('expenses')}</th><th>${tx('profit')}</th></tr></thead><tbody>${staffRows(from,to).map(x=>`<tr><td>${esc(x.label)}${x.s?`<small class="muted"><br>${esc(staffName(x.s))}</small>`:''}</td><td>${x.customers.length}</td><td>${x.loans.length}</td><td>${x.active.length}</td><td>${x.overdue.length}</td><td>${money(x.disbursed)}</td><td>${money(x.collected)}</td><td>${money(x.payrollTotal)}</td><td>${money(x.expenseTotal)}</td><td class="${x.net>=0?'profit-text':'loss-text'}">${money(x.net)}</td></tr>`).join('')||`<tr><td colspan="10">${tx('no')}</td></tr>`}</tbody></table></div>`}
 host.innerHTML=`<div class="report-note">${tx('formula')}</div>${cards}${table}`;
}
function xmlEsc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function cell(v){const num=typeof v==='number'&&Number.isFinite(v);return `<Cell><Data ss:Type="${num?'Number':'String'}">${xmlEsc(num?v:String(v??''))}</Data></Cell>`}
function sheet(name,rows){return `<Worksheet ss:Name="${xmlEsc(String(name).slice(0,31))}"><Table>${rows.map(r=>`<Row>${r.map(cell).join('')}</Row>`).join('')}</Table></Worksheet>`}
function workbook(sheets){return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.map(x=>sheet(x.name,x.rows)).join('')}</Workbook>`}
function rowsFor(r,label){
 const summary=[["WL CREDIT"],["Report",label],["From",r.from||''],["To",r.to||''],["Downloaded At",new Date().toLocaleString('en-MY')],[],[tx('customers'),r.customers.length],[tx('loans'),r.loans.length],[tx('active'),r.active.length],[tx('completed'),r.completed.length],[tx('overdue'),r.overdue.length],[tx('disbursed'),r.disbursed],[tx('collected'),r.collected],[tx('income'),r.incomeTotal],[tx('payroll'),r.payrollTotal],[tx('expenses'),r.expenseTotal],[tx('profit'),r.net]];
 return [
  {name:'Summary',rows:summary},
  {name:'Customers',rows:[["Customer ID","Name","IC","Phone","Owner"],...r.customers.map(x=>[x.customer_code||x.id,x.full_name,x.id_number,x.phone,x.owner_staff_id||''])]},
  {name:'Loans',rows:[["Loan ID","Customer","Principal","Interest","Settlement","Due Date","Status"],...r.loans.map(x=>[x.loan_id,x.customers?.full_name||'',n(x.principal),n(x.interest),n(x.settlement_amount),d10(x.due_date),x.status])]},
  {name:'Repayments',rows:[["Date","Loan ID","Customer","Amount","Collector","Notes"],...r.repayments.map(x=>[d10(x.payment_date),x.loans?.loan_id||'',x.loans?.customers?.full_name||'',n(x.amount),x.staff_profiles?.full_name||'',x.notes||''])]},
  {name:'Overdue',rows:[["Loan ID","Customer","Due Date","Principal","Current Due"],...r.overdue.map(x=>[x.loan_id,x.customers?.full_name||'',d10(x.due_date),n(x.principal),n(x.current_due_amount||x.interest)-n(x.current_paid_amount)])]},
  {name:'Expenses',rows:[["Date","Category","Description","Amount","Staff"],...r.expenses.map(x=>[d10(x.expense_date),x.category,x.description,n(x.amount),x.staff_user_id||''])]},
  {name:'Payroll',rows:[["Month","Employee","Basic","Additions","Deductions","Net Salary"],...r.payroll.map(x=>[d10(x.payroll_month),x.employees?.full_name||'',n(x.basic_salary),n(x.allowance)+n(x.commission)+n(x.bonus)+n(x.overtime),n(x.deductions)+n(x.salary_advance_deduction),n(x.net_salary)])]},
  {name:'Other Income',rows:[["Date","Category","Description","Amount"],...r.income.map(x=>[d10(x.income_date),x.category,x.description,n(x.amount)])]}
 ];
}
async function logBackup(scope,from,to){try{await sb.from('backup_downloads').insert({downloaded_by:state.staff.user_id,scope,report_from:from||null,report_to:to||null})}catch(e){console.warn(e)}}
function makeXlsBlob(sheets){return new Blob([workbook(sheets)],{type:'application/vnd.ms-excel;charset=utf-8'})}
function saveXls(filename,sheets){const blob=makeXlsBlob(sheets),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);return blob}
async function downloadCurrent(){const from=document.querySelector('#reportFrom')?.value||state.dateFrom,to=document.querySelector('#reportTo')?.value||state.dateTo,id=selectedStaffId(),r=dataFor(from,to,id),s=reportStaff().find(x=>String(x.user_id)===id),label=id==='all'?tx('company'):(id===''?tx('unassigned'):staffName(s||state.staff));let sheets=rowsFor(r,label);if(isSuperAdmin()&&id==='all')sheets.splice(1,0,{name:'Staff Summary',rows:[[tx('staff'),tx('customers'),tx('loans'),tx('active'),tx('overdue'),tx('disbursed'),tx('collected'),tx('payroll'),tx('expenses'),tx('profit')],...staffRows(from,to).map(x=>[x.label,x.customers.length,x.loans.length,x.active.length,x.overdue.length,x.disbursed,x.collected,x.payrollTotal,x.expenseTotal,x.net])]});saveXls(`WL-Credit-${String(label).replace(/[^\w\u4e00-\u9fff-]+/g,'-')}-${from||'all'}-${to||'all'}.xls`,sheets);await logBackup(id==='all'?'company':id,from,to);toast(tx('downloaded'))}
async function downloadFull(){const id=selectedStaffId(),r=dataFor(null,null,id),s=reportStaff().find(x=>String(x.user_id)===id),label=id==='all'?tx('company'):(id===''?tx('unassigned'):staffName(s||state.staff));let sheets=rowsFor(r,label);if(isSuperAdmin()&&id==='all')sheets.splice(1,0,{name:'Staff Summary',rows:[[tx('staff'),tx('customers'),tx('loans'),tx('active'),tx('overdue'),tx('disbursed'),tx('collected'),tx('payroll'),tx('expenses'),tx('profit')],...staffRows(null,null).map(x=>[x.label,x.customers.length,x.loans.length,x.active.length,x.overdue.length,x.disbursed,x.collected,x.payrollTotal,x.expenseTotal,x.net])]});saveXls(`WL-Credit-Full-Backup-${String(label).replace(/[^\w\u4e00-\u9fff-]+/g,'-')}-${isoToday()}.xls`,sheets);await logBackup(`full:${id==='all'?'company':id}`,null,null);toast(tx('downloaded'))}
const originalRenderAll=renderAll;renderAll=function(){originalRenderAll();renderV18()};
const originalApply=applyV10Labels;applyV10Labels=function(){originalApply();setLabels()};
window.addEventListener('DOMContentLoaded',()=>{const sel=document.querySelector('#reportStaffFilter'),cur=document.querySelector('#downloadExcel'),full=document.querySelector('#downloadFullBackup');if(sel)sel.addEventListener('change',renderV18);if(cur)cur.onclick=downloadCurrent;if(full)full.onclick=downloadFull;setLabels()});
window.renderReportPreview=renderV18;window.downloadReportExcel=downloadCurrent;
window.WL_V18_REPORTS={
 reportStaff,staffName,dataFor,staffRows,rowsFor,workbook,makeXlsBlob,
 build(scope,from,to,full){const id=scope||selectedStaffId(),r=dataFor(full?null:from,full?null:to,id),s=reportStaff().find(x=>String(x.user_id)===id),label=id==='all'?tx('company'):(id===''?tx('unassigned'):staffName(s||state.staff));let sheets=rowsFor(r,label);if(isSuperAdmin()&&id==='all')sheets.splice(1,0,{name:'Staff Summary',rows:[[tx('staff'),tx('customers'),tx('loans'),tx('active'),tx('overdue'),tx('disbursed'),tx('collected'),tx('payroll'),tx('expenses'),tx('profit')],...staffRows(full?null:from,full?null:to).map(x=>[x.label,x.customers.length,x.loans.length,x.active.length,x.overdue.length,x.disbursed,x.collected,x.payrollTotal,x.expenseTotal,x.net])]});return {id,label,sheets,blob:makeXlsBlob(sheets)}}
};
})();

;

/* ===== v18-backup.js ===== */
(function(){
'use strict';
const q=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const lang=()=>window.SWK_LANG?.current||'en';
const L={
 en:{title:'Complete Daily Backup',page:'Reports & Backup',helpSA:'Super Admin backup includes all company data, all staff, payroll, customers, loans, files and analysis.',helpStaff:'Your backup includes only your HR, salary, attendance, customers, loans, files and performance analysis.',refresh:'Refresh',create:'Create Full Backup & Download',download:'Download Again',none:'No backup records',working:'Creating ZIP backup…',saved:'Complete backup downloaded. Please upload it to the company email.',fail:'Unable to create backup',company:'Whole Company',staff:'My Data',today:'Today backup status'},
 zh:{title:'每日完整备份',page:'报表与备份',helpSA:'最高管理员备份包含公司全部资料、全部员工、工资、客户、贷款、文件和分析。',helpStaff:'客服备份只包含自己的人事、工资、出勤、负责的客户、贷款、文件和业绩分析。',refresh:'刷新',create:'建立完整备份并下载',download:'重新下载',none:'没有备份记录',working:'正在建立完整 ZIP 备份…',saved:'完整备份已下载，请上传到公司 Email 保存。',fail:'无法建立备份',company:'公司全部资料',staff:'我的完整资料',today:'今日备份状态'},
 ms:{title:'Sandaran Harian Lengkap',page:'Laporan & Sandaran',helpSA:'Sandaran Super Admin merangkumi semua data syarikat, staf, gaji, pelanggan, pinjaman, fail dan analisis.',helpStaff:'Sandaran anda hanya merangkumi HR, gaji, kehadiran, pelanggan, pinjaman, fail dan analisis prestasi anda.',refresh:'Muat Semula',create:'Cipta Sandaran Lengkap & Muat Turun',download:'Muat Turun Lagi',none:'Tiada rekod sandaran',working:'Mencipta sandaran ZIP…',saved:'Sandaran lengkap dimuat turun. Sila muat naik ke e-mel syarikat.',fail:'Gagal mencipta sandaran',company:'Seluruh Syarikat',staff:'Data Saya',today:'Status sandaran hari ini'}
};
const t=k=>(L[lang()]||L.en)[k]||k;
const isSA=()=>String(state?.staff?.role||'')==='super_admin';
const safe=v=>String(v||'').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'file';
const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const toCSV=rows=>{const list=rows||[];const keys=[...new Set(list.flatMap(r=>Object.keys(r||{})))];return '\uFEFF'+[keys.map(csvCell).join(','),...list.map(r=>keys.map(k=>csvCell(typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):r[k])).join(','))].join('\r\n')};
function triggerDownload(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function setLabels(){q('#reportsBackupTitle')&&(q('#reportsBackupTitle').textContent=t('page'));q('#navReportsBackup')&&(q('#navReportsBackup').textContent=t('page'));q('#backupCenterTitle')&&(q('#backupCenterTitle').textContent=t('title'));q('#backupCenterHelp')&&(q('#backupCenterHelp').textContent=isSA()?t('helpSA'):t('helpStaff'));q('#refreshBackups')&&(q('#refreshBackups').textContent=t('refresh'));q('#createDailyBackup')&&(q('#createDailyBackup').textContent=t('create'));q('#backupScopeNotice')&&(q('#backupScopeNotice').textContent=isSA()?`范围：${t('company')}`:`范围：${t('staff')} · ${state.staff?.full_name||state.staff?.username||''}`)}
function scoped(){
 const scope=isSA()?'all':String(state.staff.user_id);
 const customers=scope==='all'?[...state.customers]:state.customers.filter(x=>String(x.owner_staff_id||x.claimed_by||'')===scope);
 const customerIds=new Set(customers.map(x=>String(x.id))), loans=state.loans.filter(x=>customerIds.has(String(x.customer_id))), loanIds=new Set(loans.map(x=>String(x.id)));
 const employees=scope==='all'?[...state.employees]:state.employees.filter(x=>String(x.staff_user_id||'')===scope), employeeIds=new Set(employees.map(x=>String(x.id)));
 const payroll=scope==='all'?[...state.payroll]:state.payroll.filter(x=>employeeIds.has(String(x.employee_id)));
 const attendance=scope==='all'?[...state.attendance]:state.attendance.filter(x=>employeeIds.has(String(x.employee_id)));
 const advances=scope==='all'?[...state.salaryAdvances]:state.salaryAdvances.filter(x=>employeeIds.has(String(x.employee_id)));
 return {scope,customers,loans,repayments:state.repayments.filter(x=>loanIds.has(String(x.loan_id))),payment_submissions:state.submissions.filter(x=>customerIds.has(String(x.customer_id))||loanIds.has(String(x.loan_id))),customer_documents:state.documents.filter(x=>customerIds.has(String(x.customer_id))),loan_applications:scope==='all'?[...state.applications]:state.applications.filter(x=>String(x.owner_staff_id||x.claimed_by||'')===scope),receiving_banks:scope==='all'?[...state.banks]:state.banks.filter(x=>String(x.owner_staff_id||'')===scope),contact_channels:scope==='all'?[...state.contacts]:state.contacts.filter(x=>String(x.owner_staff_id||'')===scope),staff_profiles:scope==='all'?[...state.staffList]:state.staffList.filter(x=>String(x.user_id)===scope),audit_logs:scope==='all'?[...state.audit]:state.audit.filter(x=>String(x.staff_user_id||x.user_id||'')===scope),employees,payroll_records:payroll,attendance_records:attendance,salary_advances:advances,company_expenses:scope==='all'?[...state.expenses]:[],company_income:scope==='all'?[...state.companyIncome]:[]};
}
function analysis(data){const n=a=>a.reduce((s,x)=>s+Number(x||0),0);return {generated_at:new Date().toISOString(),scope:data.scope,customer_count:data.customers.length,loan_count:data.loans.length,total_principal:n(data.loans.map(x=>x.principal)),total_interest:n(data.loans.map(x=>x.interest)),total_collected:n(data.repayments.map(x=>x.amount)),active_loans:data.loans.filter(x=>!['paid','cancelled'].includes(x.status)).length,overdue_loans:data.loans.filter(x=>!['paid','cancelled'].includes(x.status)&&String(x.due_date||'')<isoToday()).length,total_salary:n(data.payroll_records.map(x=>x.net_salary)),commission:n(data.payroll_records.map(x=>x.commission)),attendance_records:data.attendance_records.length};}
async function addStorageFile(zip,bucket,path,target){if(!path)return false;const {data,error}=await sb.storage.from(bucket).download(path);if(error||!data){console.warn('Backup skipped file',bucket,path,error?.message);return false}zip.file(target,data);return true}
async function buildZip(backupId){if(typeof JSZip==='undefined')throw new Error('ZIP library did not load.');const data=scoped(),zip=new JSZip(),root=zip.folder('WL-Credit-Backup'),tables=root.folder('Data-CSV'),json=root.folder('Data-JSON'),files=root.folder('Customer-Files'),report=root.folder('Reports');const summary=analysis(data),manifest={backup_id:backupId,created_at:new Date().toISOString(),malaysia_date:isoToday(),created_by:state.staff.user_id,role:state.staff.role,scope:data.scope,format_version:'V23',tables:{},files:{downloaded:0,skipped:0}};for(const [name,rows] of Object.entries(data)){if(!Array.isArray(rows))continue;tables.file(`${safe(name)}.csv`,toCSV(rows));json.file(`${safe(name)}.json`,JSON.stringify(rows,null,2));manifest.tables[name]=rows.length}report.file('Analysis-Summary.csv',toCSV([summary]));report.file('Analysis-Summary.json',JSON.stringify(summary,null,2));json.file('app_settings.json',JSON.stringify(isSA()?(state.settings||{}):{},null,2));const customerMap=new Map(data.customers.map(c=>[String(c.id),c]));for(let i=0;i<data.customer_documents.length;i++){const d=data.customer_documents[i],c=customerMap.get(String(d.customer_id))||{},folder=`${safe(c.customer_code||c.id||d.customer_id)}-${safe(c.full_name||'Customer')}`;const ok=await addStorageFile(files,'customer-documents',d.storage_path,`${folder}/${safe(d.category||'document')}-${safe(d.file_name||String(i+1))}`);ok?manifest.files.downloaded++:manifest.files.skipped++;q('#createDailyBackup')&&(q('#createDailyBackup').textContent=`${t('working')} ${i+1}/${data.customer_documents.length}`)}const appFolder=root.folder('Loan-Application-Files');for(const a of data.loan_applications){for(const [kind,path] of Object.entries(a.document_paths||{})){if(!path)continue;const ext=String(path).split('.').pop()||'bin';const ok=await addStorageFile(appFolder,'loan-applications',path,`${safe(a.application_code||a.id)}/${safe(kind)}.${safe(ext)}`);ok?manifest.files.downloaded++:manifest.files.skipped++}}const receiptFolder=root.folder('Payment-Receipts');for(const p of data.payment_submissions){const path=p.receipt_path||p.receipt_storage_path;if(!path)continue;const ext=String(path).split('.').pop()||'bin';const ok=await addStorageFile(receiptFolder,'payment-receipts',path,`${safe(p.payment_id||p.id)}.${safe(ext)}`);ok?manifest.files.downloaded++:manifest.files.skipped++}root.file('MANIFEST.json',JSON.stringify(manifest,null,2));root.file('README.txt',`WL Credit V23 complete backup\r\nBackup ID: ${backupId}\r\nScope: ${isSA()?'Whole company':'Current staff only'}\r\nKeep this file private.`);return zip.generateAsync({type:'blob',mimeType:'application/zip',compression:'DEFLATE',compressionOptions:{level:6}})}
async function saveBackup(){const btn=q('#createDailyBackup');if(btn){btn.disabled=true;btn.textContent=t('working')}try{const now=new Date(),stamp=now.toISOString().replace(/[-:T]/g,'').slice(0,12),rand=Math.random().toString(16).slice(2,8).toUpperCase(),backupId=`WL-${stamp}-${rand}`,blob=await buildZip(backupId),owner=safe(state.staff.staff_label||state.staff.username||state.staff.full_name||state.staff.user_id).slice(0,30),scopeToken=isSA()?'Company':owner,file=`WL-Credit-${scopeToken}-${isoToday()}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.zip`,path=`${state.staff.user_id}/${isoToday()}/${Date.now()}-${file}`;const up=await sb.storage.from('report-backups').upload(path,blob,{contentType:'application/zip',upsert:false});if(up.error)throw up.error;const row={downloaded_by:state.staff.user_id,staff_user_id:isSA()?null:state.staff.user_id,scope:isSA()?'company':state.staff.user_id,backup_type:`full:${backupId}`,report_from:null,report_to:null,file_name:file,storage_path:path,file_size:blob.size,drive_status:'not_used'};const ins=await sb.from('backup_downloads').insert(row);if(ins.error){await sb.storage.from('report-backups').remove([path]);throw ins.error}triggerDownload(blob,file);toast(t('saved'));await loadBackups()}catch(e){toast(`${t('fail')}: ${e.message||e}`,true)}finally{if(btn){btn.disabled=false;btn.textContent=t('create')}}}
async function loadBackups(){setLabels();const tbody=q('#backupRows');if(!tbody)return;let query=sb.from('backup_downloads').select('id,downloaded_by,staff_user_id,scope,backup_type,file_name,storage_path,file_size,downloaded_at,staff_profiles!backup_downloads_downloaded_by_fkey(full_name,username)').order('downloaded_at',{ascending:false}).limit(300);const day=q('#backupDateFilter')?.value;if(day)query=query.gte('downloaded_at',day+'T00:00:00').lte('downloaded_at',day+'T23:59:59.999');if(!isSA())query=query.eq('downloaded_by',state.staff.user_id);const {data,error}=await query;if(error){tbody.innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`;return}const rows=data||[];tbody.innerHTML=rows.map(x=>{const bid=String(x.backup_type||'').split(':')[1]||'-';return `<tr><td>${esc(String(x.downloaded_at||'').slice(0,10))}</td><td>${esc(x.scope==='company'?t('company'):(x.staff_profiles?.full_name||x.staff_profiles?.username||t('staff')))}</td><td class="mono">${esc(bid)}</td><td>${esc(x.file_name)}</td><td>${esc(x.staff_profiles?.full_name||x.staff_profiles?.username||'-')}</td><td>${esc(new Date(x.downloaded_at).toLocaleString())}</td><td><button class="btn btn-secondary backup-download" data-path="${esc(x.storage_path)}" data-name="${esc(x.file_name)}">${t('download')}</button></td></tr>`}).join('')||`<tr><td colspan="7">${t('none')}</td></tr>`;q('#backupSummary')&&(q('#backupSummary').innerHTML=`<strong>${t('today')}:</strong> ${rows.filter(x=>String(x.downloaded_at).slice(0,10)===isoToday()).length}`);document.querySelectorAll('.backup-download').forEach(b=>b.onclick=()=>downloadStored(b.dataset.path,b.dataset.name))}
async function downloadStored(path,name){const {data,error}=await sb.storage.from('report-backups').download(path);if(error)return toast(error.message,true);triggerDownload(data,name||'WL-Credit-Backup.zip')}
window.addEventListener('DOMContentLoaded',()=>{q('#refreshBackups')?.addEventListener('click',loadBackups);q('#backupDateFilter')?.addEventListener('change',loadBackups);q('#createDailyBackup')?.addEventListener('click',saveBackup);document.addEventListener('click',e=>{if(e.target.closest('[data-section="reports"]'))setTimeout(loadBackups,50)});window.addEventListener('swk-language-applied',()=>{setLabels();loadBackups()});setLabels()});window.loadBackupCenter=loadBackups;
})();

;

/* ===== v29.4-polish.js ===== */
/* WL Credit V29.4 UI, roles, translations, short IDs and customer documents */
(() => {
  const lang = () => (window.SWK_LANG?.current || localStorage.getItem('swk_lang') || 'en');
  const tx = (en, zh, ms) => lang()==='zh' ? zh : lang()==='ms' ? ms : en;
  const shortCode = (value, prefix) => {
    const s=String(value||'').trim().toUpperCase();
    const digits=(s.match(/(\d+)$/)||[])[1];
    if(!digits)return s;
    if(prefix==='WL')return 'WL'+String(Number(digits)).padStart(3,'0');
    return 'L'+String(Number(digits)).padStart(5,'0');
  };
  window.wlShortCustomerId=v=>window.normalizeCustomerUsername?window.normalizeCustomerUsername(v):shortCode(v,'WL');
  window.wlShortLoanId=v=>window.canonicalLoanId?window.canonicalLoanId(v):shortCode(v,'L');

  function applyV294Language(){
    const map={
      '#pageTitle':['Dashboard','总览','Ringkasan'],
      '#enableSoundBtn':['🔔 Sound On','🔔 声音开启','🔔 Bunyi Aktif'],
      '#refreshBtn':['Refresh','刷新','Muat Semula'],
      '#staffLogout':['Logout','退出登录','Log Keluar'],
      '#applyDateRange':['Apply','查询','Terapkan'],
      '#dateRangeSeparator':['to','至','hingga'],
      '#telegramTabBtn':['Telegram Bot','Telegram 机器人','Bot Telegram'],
      '#dangerTabBtn':['Danger Zone','危险操作','Zon Bahaya']
    };
    Object.entries(map).forEach(([sel,v])=>{const el=document.querySelector(sel);if(el)el.textContent=v[lang()==='zh'?1:lang()==='ms'?2:0]});
    const p=document.querySelector('#globalSearch');if(p)p.placeholder=tx('Search Loan ID / Customer / IC / Phone / Payment ID','搜索贷款编号／客户／IC／电话／付款编号','Cari ID Pinjaman / Pelanggan / IC / Telefon / ID Bayaran');
    const presets={today:['Today','今天','Hari Ini'],yesterday:['Yesterday','昨天','Semalam'],thisWeek:['This Week','本周','Minggu Ini'],lastWeek:['Last Week','上周','Minggu Lepas'],thisMonth:['This Month','本月','Bulan Ini'],lastMonth:['Last Month','上月','Bulan Lepas']};
    document.querySelectorAll('.date-preset').forEach(b=>{const v=presets[b.dataset.range];if(v)b.textContent=v[lang()==='zh'?1:lang()==='ms'?2:0]});
    const subtitle=document.querySelector('.dashboard-bank-section .section-head small');if(subtitle)subtitle.textContent=tx('Manage company receiving accounts, assignments and collection totals in one place.','在这里统一管理公司收款账号、客户分配及收款统计。','Urus akaun kutipan syarikat, agihan pelanggan dan jumlah kutipan di satu tempat.');
  }

  function applyRestrictedVisibility(){
    const role=String(state?.staff?.role||'');
    const isCs=role==='customer_service';
    ['#telegramTabBtn','#dangerTabBtn'].forEach(sel=>{const el=document.querySelector(sel);if(el)el.classList.toggle('hidden',isCs || (sel==='#dangerTabBtn' && role!=='super_admin'))});
    if(isCs){document.querySelector('#telegramSettings')?.classList.remove('active');document.querySelector('#dangerSettings')?.classList.remove('active')}
  }

  const oldRenderBankTotals=window.renderBankCollectionTotals || (typeof renderBankCollectionTotals==='function'?renderBankCollectionTotals:null);
  window.renderBankCollectionTotals = renderBankCollectionTotals = function(){
    const host=document.querySelector('#dashboardBankTotals');if(!host)return;
    const totals=new Map((state.banks||[]).map(b=>[String(b.id),0]));
    for(const r of state.repayments||[]){
      if(typeof inRange==='function'&&!inRange(r.payment_date))continue;
      const customerId=r.loans?.customer_id||r.customer_id;
      const customer=(state.customers||[]).find(c=>String(c.id)===String(customerId));
      if(customer?.assigned_bank_id!=null)totals.set(String(customer.assigned_bank_id),(totals.get(String(customer.assigned_bank_id))||0)+Number(r.amount||0));
    }
    host.innerHTML=(state.banks||[]).map(b=>{
      const customers=(state.customers||[]).filter(c=>String(c.assigned_bank_id)===String(b.id));
      const active=customers.filter(c=>(state.loans||[]).some(l=>String(l.customer_id)===String(c.id)&&l.status==='active')).length;
      return `<article class="bank-overview-card"><div class="bank-overview-main"><div><span class="bank-label">${tx('Receiving account','公司收款账号','Akaun kutipan')}</span><h3>${esc(b.bank_name)}</h3><p>${esc(b.account_name||'-')} · <strong>${esc(b.account_number||'-')}</strong></p></div><span class="badge ${b.is_enabled===false?'danger':'ok'}">${b.is_enabled===false?tx('Disabled','已停用','Tidak aktif'):tx('Active','使用中','Aktif')}</span></div><div class="bank-metrics"><div><span>${tx('Collected','已收金额','Dikutip')}</span><strong>${money(totals.get(String(b.id))||0)}</strong></div><div><span>${tx('Assigned customers','已分配客户','Pelanggan diagih')}</span><strong>${customers.length}</strong></div><div><span>${tx('Active customers','活跃客户','Pelanggan aktif')}</span><strong>${active}</strong></div></div><div class="bank-actions"><button class="btn btn-secondary" onclick="openBank('${b.id}')">${tx('Edit account','编辑账号','Edit akaun')}</button><button class="btn btn-primary" onclick="manageCustomerBank('${b.id}')">${tx('Manage assignment','管理分配','Urus agihan')}</button></div></article>`;
    }).join('')||`<div class="empty-bank-state"><strong>${tx('No receiving accounts yet','还没有设置收款账号','Belum ada akaun kutipan')}</strong><p>${tx('Add a company receiving account to begin assigning customers.','请先新增公司收款账号，再分配给客户。','Tambah akaun kutipan syarikat sebelum mengagihkan pelanggan.')}</p></div>`;
    const legacy=document.querySelector('#bankCards');if(legacy)legacy.innerHTML='';
  };

  const originalOpenStaff=window.openStaff;
  window.openStaff=function(userId){
    if(!requirePerm('staff_manage'))return;
    const existing=(state.staffList||[]).find(s=>String(s.user_id)===String(userId))||{};
    const editing=Boolean(userId), permKeys=Object.keys(PERMS);
    const roles=['customer_service','manager'].concat(isSuperAdmin()?['super_admin']:[]);
    const roleName=r=>r==='customer_service'?tx('Customer Service','客服','Khidmat Pelanggan'):r==='manager'?tx('Manager','经理','Pengurus'):tx('Super Admin','超级管理员','Super Admin');
    const roleOptions=roles.map(r=>`<option value="${r}" ${existing.role===r?'selected':''}>${roleName(r)}</option>`).join('');
    const checks=permKeys.map(k=>`<label class="permission-item"><input type="checkbox" name="perm_${k}" ${existing.permissions?.[k]?'checked':''}> <span>${k.replaceAll('_',' ')}</span></label>`).join('');
    modal(`<h2>${editing?tx('Edit Staff Account & Permissions','编辑员工账号与权限','Edit Akaun & Kebenaran Staf'):tx('Add Staff Account','新增员工账号','Tambah Akaun Staf')}</h2><form id="staffAccountForm"><div class="grid2"><div class="field"><label>${v11t('name')}</label><input name="full_name" required value="${esc(existing.full_name||'')}"></div><div class="field"><label>${tx('Username','员工账号','Nama Pengguna')}</label><input name="username" pattern="[a-z0-9_]{3,30}" required value="${esc(existing.username||'')}"></div><div class="field"><label>${editing?tx('New password (leave blank to keep)','新密码（留空则不修改）','Kata laluan baharu (kosongkan untuk kekal)'):tx('Password','密码','Kata Laluan')}</label><input name="password" type="password" ${editing?'':'required'} minlength="8"></div><div class="field"><label>${tx('Role','职位','Jawatan')}</label><select name="role">${roleOptions}</select></div></div><label><input name="is_active" type="checkbox" ${existing.is_active!==false?'checked':''}> ${v11t('active')}</label><h3>${tx('Permissions','权限','Kebenaran')}</h3><div class="permission-grid">${checks}</div><p><button class="btn btn-primary">${v11t('save')}</button></p></form>`);
    document.querySelector('#staffAccountForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),permissions={};permKeys.forEach(k=>permissions[k]=f.get(`perm_${k}`)==='on');const payload={action:editing?'update_employee':'create_employee',user_id:userId||undefined,full_name:String(f.get('full_name')||'').trim(),username:String(f.get('username')||'').trim().toLowerCase(),password:String(f.get('password')||''),role:f.get('role'),permissions,is_active:f.get('is_active')==='on'};const x=await invokeStaffAdmin(payload),data=x?.data||x;if(x?.error||data?.ok===false)return toast(x?.error?.message||data?.error||'Unable to save staff account',true);closeModal();toast(v11t('saved'));await loadAll()};
  };

  const originalCustomerProfile=window.openCustomerProfile;
  window.openCustomerProfile=async function(id){
    originalCustomerProfile(id);
    const c=(state.customers||[]).find(x=>String(x.id)===String(id));if(!c)return;
    const app=(state.applications||[]).filter(a=>String(a.customer_id)===String(id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0];
    const docs=Object.entries(app?.document_paths||{}).filter(([,v])=>v);
    if(!docs.length)return;
    const host=document.querySelector('#modalBody');if(!host)return;
    const sec=document.createElement('section');sec.className='customer-documents-section';sec.innerHTML=`<h3>${tx('Application photos and documents','申请时提交的照片与文件','Foto dan dokumen permohonan')}</h3><div class="customer-document-grid">${docs.map(([k])=>`<div class="customer-document-item" data-doc-key="${esc(k)}"><div class="document-preview-placeholder">${tx('Loading…','载入中…','Memuatkan…')}</div><strong>${esc(k.replaceAll('_',' '))}</strong></div>`).join('')}</div>`;host.appendChild(sec);
    for(const [key,path] of docs){try{const url=await signedUrl('loan-applications',path);const item=sec.querySelector(`[data-doc-key="${CSS.escape(key)}"]`);if(!item)continue;const image=/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)||/image/i.test(key);item.querySelector('.document-preview-placeholder').outerHTML=image?`<a href="${esc(url)}" target="_blank"><img src="${esc(url)}" alt="${esc(key)}"></a>`:`<a class="document-file-link" href="${esc(url)}" target="_blank">${tx('Open document','打开文件','Buka dokumen')}</a>`}catch(e){const item=sec.querySelector(`[data-doc-key="${CSS.escape(key)}"] .document-preview-placeholder`);if(item)item.textContent=tx('Unable to load','无法载入','Tidak dapat dimuatkan')}}
  };

  const originalRenderCustomers=typeof renderCustomers==='function'?renderCustomers:null;
  if(originalRenderCustomers) renderCustomers=function(){originalRenderCustomers();document.querySelectorAll('#customerRows tr').forEach(tr=>{const cell=tr.cells?.[0];if(cell){const link=cell.querySelector('.click-link');if(link)link.textContent=shortCode(link.textContent,'C')}})};
  const originalRenderLoans=typeof renderLoans==='function'?renderLoans:null;
  if(originalRenderLoans) renderLoans=function(){originalRenderLoans();document.querySelectorAll('#loanRows tr').forEach(tr=>{const cell=tr.cells?.[0];if(cell)cell.textContent=shortCode(cell.textContent,'L')})};

  const originalRenderAll=typeof renderAll==='function'?renderAll:null;
  if(originalRenderAll) renderAll=function(){originalRenderAll();applyV294Language();applyRestrictedVisibility();renderBankCollectionTotals()};
  document.addEventListener('change',e=>{if(e.target.matches('.lang-select'))setTimeout(()=>{applyV294Language();applyRestrictedVisibility();renderBankCollectionTotals()},0)});
  window.addEventListener('load',()=>{applyV294Language();applyRestrictedVisibility()});
})();

;

/* ===== v29.5-customer-files.js ===== */
/* WL Credit V29.5 customer application files, two emergency contacts, staff uploads, no restricted flash */
(() => {
 const tx=(en,zh,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
 const imgExt=v=>/\.(jpe?g|png|webp)(\?|$)/i.test(String(v||''));
 const safeName=v=>String(v||'document').replace(/[^a-z0-9._-]+/gi,'-').slice(0,100);
 function enforceRestrictedFirstPaint(){
   const role=String(state?.staff?.role||''); const superAdmin=role==='super_admin';
   const tgBtn=$('#telegramTabBtn'),dangerBtn=$('#dangerTabBtn'),tgPanel=$('#telegramSettings'),dangerPanel=$('#dangerSettings');
   [tgBtn,dangerBtn,tgPanel,dangerPanel].forEach(el=>el?.classList.add('hidden'));
   if(superAdmin){tgBtn?.classList.remove('hidden');dangerBtn?.classList.remove('hidden');tgPanel?.classList.remove('hidden');dangerPanel?.classList.remove('hidden')}
 }
 const oldApplyRoleVisibility=window.applyRoleVisibility;
 if(typeof oldApplyRoleVisibility==='function') window.applyRoleVisibility=function(){oldApplyRoleVisibility();enforceRestrictedFirstPaint()};
 document.addEventListener('DOMContentLoaded',enforceRestrictedFirstPaint);

 async function docUrl(bucket,path){const r=await sb.storage.from(bucket||'customer-documents').createSignedUrl(path,600);if(r.error)throw r.error;return r.data.signedUrl}
 function applicationForCustomer(c){return (state.applications||[]).filter(a=>String(a.customer_id||'')===String(c.id)||(a.status==='approved'&&((a.id_number&&c.id_number&&String(a.id_number).toLowerCase()===String(c.id_number).toLowerCase())||(a.phone&&c.phone&&String(a.phone).replace(/\D/g,'')===String(c.phone).replace(/\D/g,''))))).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0]||null}
 function canUpload(c){return isSuperAdmin()||isMine(c)}
 function customerDocs(c,a){
   const saved=(state.documents||[]).filter(d=>String(d.customer_id)===String(c.id)).map(d=>({id:d.id,label:d.category||d.file_name||'Document',path:d.storage_path,bucket:d.bucket_name||'customer-documents',file_name:d.file_name||'',created_at:d.created_at,source:'customer'}));
   const app=Object.entries(a?.document_paths||{}).filter(([,path])=>path).map(([label,path])=>({id:'app-'+label,label:label.replaceAll('_',' '),path,bucket:'loan-applications',file_name:path.split('/').pop(),created_at:a.created_at,source:'application'}));
   const keys=new Set();return [...app,...saved].filter(d=>{const k=d.bucket+'|'+d.path;if(keys.has(k))return false;keys.add(k);return true})
 }
 async function hydrateDocuments(){
   const host=$('#wlCustomerDocuments');if(!host)return;
   for(const el of host.querySelectorAll('[data-bucket][data-path]')){try{const url=await docUrl(el.dataset.bucket,el.dataset.path);el.innerHTML=imgExt(el.dataset.path)?`<a href="${esc(url)}" target="_blank"><img src="${esc(url)}" alt="${esc(el.dataset.label)}"></a>`:`<a class="document-file-link" href="${esc(url)}" target="_blank">📄 ${tx('Open file','打开文件','Buka fail')}</a>`}catch(e){el.textContent=tx('Unable to load file','无法载入文件','Fail tidak dapat dimuatkan')}}
 }
 window.uploadCustomerDocument=async customerId=>{
   const c=state.customers.find(x=>String(x.id)===String(customerId));if(!c||!canUpload(c))return toast(tr('noAccess'),true);
   const input=$('#customerDocumentFile'),category=$('#customerDocumentCategory');const file=input?.files?.[0];if(!file)return toast(tx('Please choose a file','请选择文件','Sila pilih fail'),true);
   if(file.size>10*1024*1024)return toast(tx('Maximum file size is 10 MB','文件最大为 10 MB','Saiz maksimum ialah 10 MB'),true);
   const ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'');const path=`${customerId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
   const up=await sb.storage.from('customer-documents').upload(path,file,{contentType:file.type,upsert:false});if(up.error)return toast(up.error.message,true);
   const row={customer_id:customerId,category:String(category?.value||'other'),file_name:file.name,storage_path:path,bucket_name:'customer-documents',mime_type:file.type,file_size:file.size,uploaded_by:state.staff.user_id};
   const ins=await sb.from('customer_documents').insert(row);if(ins.error){await sb.storage.from('customer-documents').remove([path]);return toast(ins.error.message,true)}
   toast(tx('Document uploaded','文件已上传','Dokumen dimuat naik'));await loadAll();openCustomerProfile(customerId)
 };
 window.deleteCustomerDocument=async id=>{const d=state.documents.find(x=>String(x.id)===String(id)),c=state.customers.find(x=>String(x.id)===String(d?.customer_id));if(!d||!c||!canUpload(c))return toast(tr('noAccess'),true);if(!confirm(tx('Delete this uploaded document?','确定删除这个文件吗？','Padam dokumen ini?')))return;const del=await sb.from('customer_documents').delete().eq('id',id);if(del.error)return toast(del.error.message,true);if((d.bucket_name||'customer-documents')==='customer-documents')await sb.storage.from('customer-documents').remove([d.storage_path]);await loadAll();openCustomerProfile(c.id)};

 window.openCustomerProfile=id=>{
   const c=state.customers.find(x=>String(x.id)===String(id));if(!c)return toast(tr('noRecords'),true);
   const a=applicationForCustomer(c),docs=customerDocs(c,a),loans=state.loans.filter(l=>String(l.customer_id)===String(c.id)),loanIds=new Set(loans.map(l=>String(l.id))),repayments=state.repayments.filter(r=>loanIds.has(String(r.loan_id))),borrowed=loans.reduce((s,l)=>s+Number(l.principal||0),0),repaid=repayments.reduce((s,r)=>s+Number(r.amount||0),0),outstanding=loans.reduce((s,l)=>s+Number(l.remaining_amount||0),0),bank=state.banks.find(x=>String(x.id)===String(c.assigned_bank_id)),wa=state.contacts.find(x=>String(x.id)===String(c.assigned_whatsapp_id)),tg=state.contacts.find(x=>String(x.id)===String(c.assigned_telegram_id));
   const ec1={name:a?.emergency_name||'',relation:a?.emergency_relation||'',phone:a?.emergency_phone||''},ec2={name:a?.emergency_name_2||'',relation:a?.emergency_relation_2||'',phone:a?.emergency_phone_2||''};
   const rows=loans.map(l=>`<tr><td>${esc(window.wlShortLoanId?wlShortLoanId(l.loan_id):l.loan_id)}</td><td>${money(l.principal)}</td><td>${money(l.interest)}</td><td>${money(l.settlement_amount)}</td><td>${date(l.due_date)}</td><td>${esc(loanStatus(l))}</td><td><button class="btn btn-secondary" onclick="openLoan('${l.id}')">${esc(customerSummaryText('open'))}</button></td></tr>`).join('');
   const docCards=docs.map(d=>`<div class="customer-document-card"><div class="customer-document-preview" data-bucket="${esc(d.bucket)}" data-path="${esc(d.path)}" data-label="${esc(d.label)}"><span>${tx('Loading…','载入中…','Memuatkan…')}</span></div><div><strong>${esc(d.label)}</strong><small>${esc(d.file_name||'')} · ${date(d.created_at)}</small>${d.source==='customer'&&canUpload(c)?`<button class="btn btn-danger btn-small" onclick="deleteCustomerDocument('${d.id}')">${tx('Delete','删除','Padam')}</button>`:''}</div></div>`).join('')||`<p class="muted">${tx('No documents recorded','暂无文件记录','Tiada dokumen direkodkan')}</p>`;
   modal(`<div class="profile-head"><div><h2>${esc(c.customer_code)} · ${esc(c.full_name)}</h2><p class="muted">${esc(customerSummaryText('title'))}</p></div><div><button class="btn btn-primary" onclick="openLoan(null,'${c.id}')">${esc(customerSummaryText('newLoan'))}</button> <button class="btn btn-secondary" onclick="openCustomer('${c.id}')">${esc(customerSummaryText('edit'))}</button></div></div><div class="stats report-stats"><div class="stat"><span>${esc(customerSummaryText('borrowed'))}</span><strong>${money(borrowed)}</strong></div><div class="stat"><span>${esc(customerSummaryText('repaid'))}</span><strong>${money(repaid)}</strong></div><div class="stat"><span>${esc(customerSummaryText('outstanding'))}</span><strong>${money(outstanding)}</strong></div></div><div class="application-detail-grid"><div class="card"><h3>${tx('Customer details','客户资料','Butiran pelanggan')}</h3><div class="kv"><span>IC</span><strong>${esc(c.id_number||'-')}</strong></div><div class="kv"><span>${esc(tr('phone'))}</span><strong>${esc(c.phone||'-')}</strong></div><div class="kv"><span>${esc(tr('address'))}</span><strong>${esc(c.address||'-')}</strong></div><div class="kv"><span>${esc(tr('workSalary'))}</span><strong>${esc(c.work_salary||'-')}</strong></div></div><div class="card"><h3>${tx('Emergency contact 1','紧急联系人 1','Hubungan kecemasan 1')}</h3><div class="kv"><span>${tx('Name','姓名','Nama')}</span><strong>${esc(ec1.name||'-')}</strong></div><div class="kv"><span>${tx('Relationship','关系','Hubungan')}</span><strong>${esc(ec1.relation||'-')}</strong></div><div class="kv"><span>${tx('Phone','电话','Telefon')}</span><strong>${esc(ec1.phone||'-')}</strong></div><h3>${tx('Emergency contact 2','紧急联系人 2','Hubungan kecemasan 2')}</h3><div class="kv"><span>${tx('Name','姓名','Nama')}</span><strong>${esc(ec2.name||'-')}</strong></div><div class="kv"><span>${tx('Relationship','关系','Hubungan')}</span><strong>${esc(ec2.relation||'-')}</strong></div><div class="kv"><span>${tx('Phone','电话','Telefon')}</span><strong>${esc(ec2.phone||'-')}</strong></div></div><div class="card"><h3>${esc(customerSummaryText('bank'))}</h3>${bank?`<div class="kv"><span>${esc(bank.bank_name)}</span><strong>${esc(bank.account_number)}</strong></div>`:`<p class="muted">${esc(tr('unassigned'))}</p>`}<h3>${esc(customerSummaryText('service'))}</h3><div class="kv"><span>WhatsApp</span><strong>${esc(wa?.label||wa?.contact_value||tr('unassigned'))}</strong></div><div class="kv"><span>Telegram</span><strong>${esc(tg?.label||tg?.contact_value||tr('unassigned'))}</strong></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><h3>${tx('Customer documents','客户文件','Dokumen pelanggan')}</h3></div>${canUpload(c)?`<div class="customer-document-upload"><select id="customerDocumentCategory"><option value="additional">${tx('Additional document','补充资料','Dokumen tambahan')}</option><option value="ic">IC</option><option value="payslip">${tx('Payslip','工资单','Slip gaji')}</option><option value="bank_statement">${tx('Bank statement','银行流水','Penyata bank')}</option><option value="other">${tx('Other','其他','Lain-lain')}</option></select><input id="customerDocumentFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><button class="btn btn-primary" onclick="uploadCustomerDocument('${c.id}')">${tx('Upload','上传','Muat naik')}</button></div>`:''}<div id="wlCustomerDocuments" class="customer-document-grid">${docCards}</div></div><h3>${esc(customerSummaryText('loans'))}</h3><div class="table-wrap"><table class="table"><thead><tr><th>Loan ID</th><th>${esc(v10t('principal'))}</th><th>${esc(v10t('interest'))}</th><th>${esc(v10t('settlement'))}</th><th>${esc(v10t('dueDate'))}</th><th>${esc(v10t('status'))}</th><th>${esc(tr('actions'))}</th></tr></thead><tbody>${rows||`<tr><td colspan="7">${esc(customerSummaryText('noLoans'))}</td></tr>`}</tbody></table></div>`);hydrateDocuments()
 };
})();

;

/* ===== v32-core.js ===== */
/* WL Credit V32 Stable Core
 * Consolidates staff identity, company access, and safe finance rendering.
 * Uses the existing global lexical `state` as the only identity source.
 */
(() => {
  'use strict';

  const roleAliases = {
    superadmin: 'super_admin',
    'super admin': 'super_admin',
    super_admin: 'super_admin',
    manager: 'manager',
    admin: 'manager',
    supervisor: 'manager',
    customer_service: 'customer_service',
    'customer service': 'customer_service'
  };

  const normalizeRoleV32 = value => {
    const key = String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
    return roleAliases[key] || key;
  };

  const langText = (zh, en, ms) => {
    const lang = window.SWK_LANG?.current || 'en';
    return lang === 'zh' ? zh : lang === 'ms' ? ms : en;
  };

  function getStateV32() {
    try { return typeof state !== 'undefined' ? state : null; }
    catch (_) { return null; }
  }

  function getStaffV32() {
    const appState = getStateV32();
    const staff = appState?.staff || null;
    if (!staff) return null;
    return {
      ...staff,
      user_id: staff.user_id || staff.auth_user_id || staff.id || '',
      role: normalizeRoleV32(staff.role)
    };
  }

  function sessionV32() {
    const staff = getStaffV32();
    const role = normalizeRoleV32(staff?.role);
    const session = {
      staff,
      role,
      isSuperAdmin: role === 'super_admin',
      isManager: role === 'manager',
      canManageCompany: role === 'super_admin' || role === 'finance' || role === 'manager'
    };
    window.AppSession = session;
    if (document.body) document.body.dataset.staffRole = role || '';
    return session;
  }

  window.getAppSession = sessionV32;
  window.isSuperAdmin = () => sessionV32().isSuperAdmin;
  window.isAdminLevel = () => sessionV32().canManageCompany;
  window.has = permission => {
    const s = sessionV32();
    return s.canManageCompany || s.staff?.permissions?.[permission] === true;
  };

  const safe = value => window.esc ? window.esc(value ?? '') : String(value ?? '');
  const moneySafe = value => window.money ? window.money(value ?? 0) : `MYR ${Number(value || 0).toFixed(2)}`;
  const dateSafe = value => window.date ? window.date(value) : String(value || '-');
  const statusSafe = value => window.companyStatus ? window.companyStatus(value) : String(value || '-');
  const noRecords = columns => `<tr><td colspan="${columns}">${safe(langText('没有记录','No records','Tiada rekod'))}</td></tr>`;

  function renderCompanyManagementV32() {
    const root = document.querySelector('#companyManagement');
    if (!root) return;
    const appState = getStateV32();
    const session = sessionV32();

    if (!appState?.staff) {
      root.innerHTML = `<div class="card"><p class="muted">${safe(langText('正在读取账号权限…','Loading account permissions…','Memuatkan kebenaran akaun…'))}</p></div>`;
      return;
    }
    if (!session.canManageCompany) {
      root.innerHTML = `<div class="card"><p class="muted">${safe(langText('公司管理开放给财务和超级管理员。','Company Management is available to Finance and Super Admin.','Pengurusan Syarikat tersedia untuk Kewangan dan Super Admin.'))}</p></div>`;
      return;
    }

    // Restore the original section markup if an older patch replaced it with an access message.
    if (!root.querySelector('#employeeRows')) {
      root.innerHTML = `
        <div class="section-head"><div><h2>${safe(langText('公司管理','Company Management','Pengurusan Syarikat'))}</h2><p class="muted">${safe(langText('员工、人事、工资、开销、收入、出勤与预支工资。','Employees, HR, payroll, expenses, income, attendance and salary advances.','Pekerja, HR, gaji, perbelanjaan, pendapatan, kehadiran dan pendahuluan gaji.'))}</p></div></div>
        <div class="tabs" id="companyTabs">
          <button class="active" data-company-tab="employees">${safe(langText('员工资料','Employees','Pekerja'))}</button>
          <button data-company-tab="payroll">${safe(langText('工资管理','Payroll','Gaji'))}</button>
          <button data-company-tab="expenses">${safe(langText('公司开销','Expenses','Perbelanjaan'))}</button>
          <button data-company-tab="income">${safe(langText('其他收入','Income','Pendapatan'))}</button>
          <button data-company-tab="attendance">${safe(langText('员工出勤','Attendance','Kehadiran'))}</button>
          <button data-company-tab="advances">${safe(langText('预支工资','Salary Advances','Pendahuluan Gaji'))}</button>
          <button data-company-tab="profit">${safe(langText('盈亏报表','Profit & Loss','Untung & Rugi'))}</button>
        </div>
        <div data-company-panel="employees">
          <div class="section-head"><h3>${safe(langText('员工资料','Employees','Pekerja'))}</h3><button class="btn btn-primary" onclick="openEmployee()">${safe(langText('+ 新增员工','+ Add Employee','+ Tambah Pekerja'))}</button></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('员工编号','Employee ID','ID Pekerja'))}</th><th>${safe(langText('姓名','Name','Nama'))}</th><th>${safe(langText('职位','Position','Jawatan'))}</th><th>${safe(langText('部门','Department','Jabatan'))}</th><th>${safe(langText('电话','Phone','Telefon'))}</th><th>${safe(langText('基本工资','Basic Salary','Gaji Asas'))}</th><th>${safe(langText('状态','Status','Status'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="employeeRows"></tbody></table></div>
        </div>
        <div data-company-panel="payroll" class="hidden"><div class="section-head"><h3>${safe(langText('工资管理','Payroll','Gaji'))}</h3><button class="btn btn-primary" onclick="openPayroll()">${safe(langText('+ 新增工资','+ Add Payroll','+ Tambah Gaji'))}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('月份','Month','Bulan'))}</th><th>${safe(langText('员工','Employee','Pekerja'))}</th><th>${safe(langText('基本工资','Basic','Asas'))}</th><th>${safe(langText('增加项目','Additions','Tambahan'))}</th><th>${safe(langText('扣款','Deductions','Potongan'))}</th><th>${safe(langText('实发工资','Net Salary','Gaji Bersih'))}</th><th>${safe(langText('状态','Status','Status'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="payrollRows"></tbody></table></div></div>
        <div data-company-panel="expenses" class="hidden"><div class="section-head"><h3>${safe(langText('公司开销','Company Expenses','Perbelanjaan Syarikat'))}</h3><button class="btn btn-primary" onclick="openExpense()">${safe(langText('+ 新增开销','+ Add Expense','+ Tambah Perbelanjaan'))}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('日期','Date','Tarikh'))}</th><th>${safe(langText('类别','Category','Kategori'))}</th><th>${safe(langText('说明','Description','Penerangan'))}</th><th>${safe(langText('金额','Amount','Jumlah'))}</th><th>${safe(langText('付款方式','Payment Method','Kaedah Bayaran'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="expenseRows"></tbody></table></div></div>
        <div data-company-panel="income" class="hidden"><div class="section-head"><h3>${safe(langText('其他收入','Other Income','Pendapatan Lain'))}</h3><button class="btn btn-primary" onclick="openCompanyIncome()">${safe(langText('+ 新增收入','+ Add Income','+ Tambah Pendapatan'))}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('日期','Date','Tarikh'))}</th><th>${safe(langText('类别','Category','Kategori'))}</th><th>${safe(langText('说明','Description','Penerangan'))}</th><th>${safe(langText('金额','Amount','Jumlah'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="incomeRows"></tbody></table></div></div>
        <div data-company-panel="attendance" class="hidden"><div class="section-head"><h3>${safe(langText('员工出勤','Attendance','Kehadiran'))}</h3><button class="btn btn-primary" onclick="openAttendance()">${safe(langText('+ 新增出勤','+ Add Attendance','+ Tambah Kehadiran'))}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('日期','Date','Tarikh'))}</th><th>${safe(langText('员工','Employee','Pekerja'))}</th><th>${safe(langText('状态','Status','Status'))}</th><th>${safe(langText('上班时间','Clock In','Masuk'))}</th><th>${safe(langText('下班时间','Clock Out','Keluar'))}</th><th>${safe(langText('备注','Notes','Nota'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="attendanceRows"></tbody></table></div></div>
        <div data-company-panel="advances" class="hidden"><div class="section-head"><h3>${safe(langText('预支工资','Salary Advances','Pendahuluan Gaji'))}</h3><button class="btn btn-primary" onclick="openSalaryAdvance()">${safe(langText('+ 新增预支','+ Add Advance','+ Tambah Pendahuluan'))}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>${safe(langText('日期','Date','Tarikh'))}</th><th>${safe(langText('员工','Employee','Pekerja'))}</th><th>${safe(langText('金额','Amount','Jumlah'))}</th><th>${safe(langText('原因','Reason','Sebab'))}</th><th>${safe(langText('扣除月份','Deduction Month','Bulan Potongan'))}</th><th>${safe(langText('状态','Status','Status'))}</th><th>${safe(langText('操作','Actions','Tindakan'))}</th></tr></thead><tbody id="advanceRows"></tbody></table></div></div>
        <div data-company-panel="profit" class="hidden"><div class="section-head"><h3>${safe(langText('盈亏报表','Profit & Loss','Untung & Rugi'))}</h3></div><div class="field" style="max-width:220px"><label>${safe(langText('月份','Month','Bulan'))}</label><input id="plMonth" type="month"></div><div id="profitLossSummary"></div></div>`;

      root.querySelectorAll('[data-company-tab]').forEach(button => {
        button.addEventListener('click', () => {
          root.querySelectorAll('[data-company-tab]').forEach(x => x.classList.toggle('active', x === button));
          const key = button.dataset.companyTab;
          root.querySelectorAll('[data-company-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.companyPanel !== key));
        });
      });
      root.querySelector('#plMonth')?.addEventListener('change', () => window.renderProfitLoss?.());
    }

    const employees = Array.isArray(appState.employees) ? appState.employees.filter(Boolean) : [];
    const staffList = Array.isArray(appState.staffList) ? appState.staffList.filter(Boolean) : [];
    const linkedUsers = new Set(employees.map(x => x?.staff_user_id).filter(Boolean));

    const employeeRows = employees.map(x => {
      const profile = staffList.find(s => String(s?.user_id || '') === String(x?.staff_user_id || '')) || null;
      const permissionButton = profile ? `<button class="btn btn-secondary" onclick="openStaff('${safe(profile.user_id)}')">${safe(langText('账号与权限','Account & Permissions','Akaun & Kebenaran'))}</button>` : '';
      const deleteButton = session.isSuperAdmin && x?.staff_user_id !== session.staff?.user_id ? `<button class="btn btn-danger" onclick="deleteEmployeeAccount('${safe(x.id)}')">${safe(langText('删除账号','Delete Account','Padam Akaun'))}</button>` : '';
      return `<tr><td class="mono">${safe(x?.employee_code || '-')}</td><td>${safe(x?.full_name || '-')}</td><td>${safe(x?.position || profile?.role || '-')}</td><td>${safe(x?.department || '-')}</td><td>${safe(x?.phone || '-')}</td><td>${moneySafe(x?.basic_salary)}</td><td><span class="badge ${x?.employment_status === 'active' ? 'ok' : 'danger'}">${safe(statusSafe(x?.employment_status))}</span></td><td><button class="btn btn-secondary" onclick="openEmployee('${safe(x.id)}')">${safe(langText('编辑','Edit','Edit'))}</button> ${permissionButton} ${x?.employment_status === 'active' ? `<button class="btn btn-primary" onclick="openPayroll(null,'${safe(x.id)}')">${safe(langText('付工资','Pay Salary','Bayar Gaji'))}</button>` : ''} ${deleteButton}</td></tr>`;
    });

    const accountOnlyRows = staffList.filter(s => !linkedUsers.has(s?.user_id)).map(s => `<tr><td class="mono">-</td><td>${safe(s?.full_name || s?.username || '-')}</td><td>${safe(normalizeRoleV32(s?.role) === 'super_admin' ? langText('超级管理员','Super Admin','Super Admin') : s?.role || '-')}</td><td>-</td><td>-</td><td>${moneySafe(0)}</td><td><span class="badge ${s?.is_active !== false ? 'ok' : 'danger'}">${safe(s?.is_active !== false ? langText('启用','Active','Aktif') : langText('停用','Inactive','Tidak Aktif'))}</span></td><td><button class="btn btn-secondary" onclick="openStaff('${safe(s?.user_id)}')">${safe(langText('账号与权限','Account & Permissions','Akaun & Kebenaran'))}</button></td></tr>`);

    const setRows = (id, html, cols) => { const el = root.querySelector(`#${id}`); if (el) el.innerHTML = html || noRecords(cols); };
    setRows('employeeRows', [...employeeRows, ...accountOnlyRows].join(''), 8);
    setRows('payrollRows', (appState.payroll || []).filter(Boolean).map(x => `<tr><td>${dateSafe(x?.payroll_month)}</td><td>${safe(x?.employees?.full_name || '-')}</td><td>${moneySafe(x?.basic_salary)}</td><td>${moneySafe(Number(x?.allowance || 0)+Number(x?.commission || 0)+Number(x?.bonus || 0)+Number(x?.overtime || 0))}</td><td>${moneySafe(Number(x?.deductions || 0)+Number(x?.salary_advance_deduction || 0))}</td><td><strong>${moneySafe(x?.net_salary)}</strong></td><td>${safe(statusSafe(x?.payment_status))}</td><td><button class="btn btn-secondary" onclick="openPayroll('${safe(x?.id)}')">${safe(langText('编辑','Edit','Edit'))}</button></td></tr>`).join(''), 8);
    setRows('expenseRows', (appState.expenses || []).filter(Boolean).map(x => `<tr><td>${dateSafe(x?.expense_date)}</td><td>${safe(x?.category || '-')}</td><td>${safe(x?.description || '-')}</td><td>${moneySafe(x?.amount)}</td><td>${safe(x?.payment_method || '-')}</td><td><button class="btn btn-secondary" onclick="openExpense('${safe(x?.id)}')">${safe(langText('编辑','Edit','Edit'))}</button></td></tr>`).join(''), 6);
    setRows('incomeRows', (appState.companyIncome || []).filter(Boolean).map(x => `<tr><td>${dateSafe(x?.income_date)}</td><td>${safe(x?.category || '-')}</td><td>${safe(x?.description || '-')}</td><td>${moneySafe(x?.amount)}</td><td><button class="btn btn-secondary" onclick="openCompanyIncome('${safe(x?.id)}')">${safe(langText('编辑','Edit','Edit'))}</button></td></tr>`).join(''), 5);
    setRows('attendanceRows', (appState.attendance || []).filter(Boolean).map(x => `<tr><td>${dateSafe(x?.attendance_date)}</td><td>${safe(x?.employees?.full_name || '-')}</td><td>${safe(statusSafe(x?.status))}</td><td>${safe(x?.clock_in || '-')}</td><td>${safe(x?.clock_out || '-')}</td><td>${safe(x?.notes || '-')}</td><td><button class="btn btn-secondary" onclick="openAttendance('${safe(x?.id)}')">${safe(langText('编辑','Edit','Edit'))}</button></td></tr>`).join(''), 7);
    setRows('advanceRows', (appState.salaryAdvances || []).filter(Boolean).map(x => `<tr><td>${dateSafe(x?.advance_date)}</td><td>${safe(x?.employees?.full_name || '-')}</td><td>${moneySafe(x?.amount)}</td><td>${safe(x?.reason || '-')}</td><td>${safe(x?.deduction_month || '-')}</td><td>${safe(statusSafe(x?.status))}</td><td><button class="btn btn-secondary" onclick="openSalaryAdvance('${safe(x?.id)}')">${safe(langText('编辑','Edit','Edit'))}</button></td></tr>`).join(''), 7);

    const month = root.querySelector('#plMonth');
    if (month && !month.value) month.value = new Date().toISOString().slice(0,7);
    window.renderProfitLoss?.();
  }

  window.renderCompanyManagement = renderCompanyManagementV32;

  // Keep all legacy calls pointed at the same single renderer.
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-section="companyManagement"]')) {
      setTimeout(renderCompanyManagementV32, 0);
    }
  });

  window.addEventListener('swk-language-applied', () => {
    setTimeout(() => {
      sessionV32();
      if (document.querySelector('#companyManagement.active')) renderCompanyManagementV32();
    }, 0);
  });

  setTimeout(() => {
    sessionV32();
    if (document.querySelector('#companyManagement.active')) renderCompanyManagementV32();
  }, 300);
})();

;

/* ===== v32.1-batch-fixes.js ===== */
/* WL Credit V32.1 batch fixes: dashboard finance, company UI, role-safe rendering */
(()=>{
  'use strict';
  const q=s=>document.querySelector(s);
  const lang=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
  const role=()=>String(window.AppSession?.staff?.role||window.state?.staff?.role||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  const isManagement=()=>['super_admin','superadmin','finance','manager'].includes(role());

  function applyCompanyPresentation(){
    const root=q('#companyManagement');
    if(!root)return;
    const tabs=root.querySelector('#companyTabs');
    if(tabs){
      tabs.classList.add('company-module-nav');
      tabs.querySelectorAll('button').forEach((b,i)=>{
        b.classList.add('company-module-card');
        const icons=['👥','💳','🧾','💰','🕒','📥','📊'];
        if(!b.querySelector('.company-icon'))b.innerHTML=`<span class="company-icon">${icons[i]||'•'}</span><span>${b.textContent.trim()}</span>`;
      });
    }
    root.querySelectorAll('[data-company-panel]').forEach(p=>p.classList.add('company-module-panel'));
  }

  const oldCompany=window.renderCompanyManagement;
  window.renderCompanyManagement=function(){
    const out=oldCompany?.apply(this,arguments);
    setTimeout(applyCompanyPresentation,0);
    return out;
  };

  function hideRedundantCollected(){
    const card=q('#statCollected')?.closest('.stat');
    if(card)card.style.display=isManagement()?'none':'';
  }

  function renderFinanceLabels(){
    const map={
      v311DisbursedLabel:lang('放款总额','Total Disbursed','Jumlah Dikeluarkan'),
      v311InterestLabel:lang('已收利息','Interest Collected','Faedah Diterima'),
      v311OverdueLabel:lang('已收逾期','Overdue Collected','Tertunggak Diterima'),
      v311ProfitLabel:lang('盈亏','Profit / Loss','Untung / Rugi'),
      v311StaffProfitTitle:lang('客服盈亏报表','Staff Profit / Loss','Untung / Rugi Staf'),
      v311StaffProfitHelp:lang('全部数据均根据上方日期范围计算。','All figures follow the selected date range.','Semua angka mengikut julat tarikh dipilih.')
    };
    Object.entries(map).forEach(([id,text])=>{const el=q('#'+id);if(el)el.textContent=text});
    hideRedundantCollected();
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-section="companyManagement"]'))setTimeout(()=>window.renderCompanyManagement?.(),30);
  });
  window.addEventListener('swk-language-applied',()=>setTimeout(()=>{renderFinanceLabels();applyCompanyPresentation()},30));
  setTimeout(()=>{renderFinanceLabels();applyCompanyPresentation()},500);
})();


/* WL Credit V32.2 consolidated finance visibility, principal collection and permission i18n */
(()=>{
 'use strict';
 const q=s=>document.querySelector(s);
 const text=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
 const normalize=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
 const currentRole=()=>normalize(window.AppSession?.staff?.role||window.state?.staff?.role||'');
 const management=()=>['super_admin','superadmin','finance','manager'].includes(currentRole());
 const staffId=s=>String(s?.user_id||s?.auth_user_id||'');

 const permissionLabels={
  applications_view:['查看申请','View Applications','Lihat Permohonan'],applications_claim:['认领申请','Claim Applications','Ambil Permohonan'],applications_approve:['批准申请','Approve Applications','Lulus Permohonan'],applications_reject:['拒绝申请','Reject Applications','Tolak Permohonan'],
  customers_view:['查看客户','View Customers','Lihat Pelanggan'],customers_create:['新增客户','Create Customers','Tambah Pelanggan'],customers_edit:['编辑客户','Edit Customers','Kemas Kini Pelanggan'],customer_files_view:['查看客户文件','View Customer Files','Lihat Dokumen Pelanggan'],customer_files_upload:['上传客户文件','Upload Customer Files','Muat Naik Dokumen Pelanggan'],customer_files_delete:['删除客户文件','Delete Customer Files','Padam Dokumen Pelanggan'],
  loans_view:['查看贷款','View Loans','Lihat Pinjaman'],loans_create:['新增贷款','Create Loans','Tambah Pinjaman'],loans_edit:['编辑贷款','Edit Loans','Kemas Kini Pinjaman'],
  collection_accounts_manage:['管理收款账户','Manage Receiving Accounts','Urus Akaun Penerimaan'],collection_accounts_assign:['分配收款账户','Assign Receiving Accounts','Tetapkan Akaun Penerimaan'],contacts_manage:['管理联系方式','Manage Contact Methods','Urus Kaedah Hubungan'],contacts_assign:['分配联系方式','Assign Contact Methods','Tetapkan Kaedah Hubungan'],
  payments_view:['查看付款','View Payments','Lihat Bayaran'],payments_approve_partial:['批准部分付款','Approve Partial Payment','Lulus Bayaran Sebahagian'],payments_approve_renewal:['批准续期','Approve Renewal','Lulus Pembaharuan'],payments_approve_settlement:['批准清账','Approve Settlement','Lulus Penyelesaian'],payments_reject:['拒绝付款','Reject Payment','Tolak Bayaran'],
  reports_view:['查看报表','View Reports','Lihat Laporan'],staff_manage:['管理员工','Manage Staff','Urus Kakitangan'],company_view:['查看公司管理','View Company Management','Lihat Pengurusan Syarikat'],company_manage:['管理公司','Manage Company','Urus Syarikat'],payroll_view:['查看薪资','View Payroll','Lihat Gaji'],payroll_manage:['管理薪资','Manage Payroll','Urus Gaji'],system_settings:['系统设置','System Settings','Tetapan Sistem']
 };
 function permissionLabel(key){const a=permissionLabels[key];return a?text(...a):String(key).replaceAll('_',' ')}
 window.v322PermissionLabel=permissionLabel;

 // Replace staff account modal with only the three supported roles and translated permission labels.
 const originalOpenStaff=window.openStaff;
 window.openStaff=function(userId){
  if(typeof requirePerm==='function'&&!requirePerm('staff_manage'))return;
  const existing=(state.staffList||[]).find(s=>String(s.user_id)===String(userId))||{};
  const editing=Boolean(userId), permKeys=Object.keys(PERMS||{});
  const roles=['customer_service','manager'].concat(isSuperAdmin?.()?['super_admin']:[]);
  const roleNames={customer_service:text('客服','Customer Service','Khidmat Pelanggan'),manager:text('经理','Manager','Pengurus'),super_admin:text('超级管理员','Super Admin','Super Admin')};
  const roleOptions=roles.map(r=>`<option value="${r}" ${normalize(existing.role)===r?'selected':''}>${roleNames[r]}</option>`).join('');
  const checks=permKeys.map(k=>`<label class="permission-item"><input type="checkbox" name="perm_${k}" ${existing.permissions?.[k]?'checked':''}> <span>${esc(permissionLabel(k))}</span></label>`).join('');
  modal(`<h2>${editing?text('编辑员工账号与权限','Edit Staff Account & Permissions','Kemas Kini Akaun & Kebenaran'):text('新增员工账号','Add Staff Account','Tambah Akaun Kakitangan')}</h2><form id="staffAccountForm"><div class="grid2"><div class="field"><label>${text('姓名','Name','Nama')}</label><input name="full_name" required value="${esc(existing.full_name||'')}"></div><div class="field"><label>${text('用户名','Username','Nama Pengguna')}</label><input name="username" pattern="[a-z0-9_]{3,30}" required value="${esc(existing.username||'')}"></div><div class="field"><label>${editing?text('新密码（留空则不修改）','New password (leave blank to keep)','Kata laluan baru (kosongkan untuk kekal)'):text('密码','Password','Kata Laluan')}</label><input name="password" type="password" ${editing?'':'required'} minlength="8"></div><div class="field"><label>${text('职位','Role','Jawatan')}</label><select name="role">${roleOptions}</select></div></div><label><input name="is_active" type="checkbox" ${existing.is_active!==false?'checked':''}> ${text('启用','Active','Aktif')}</label><h3>${text('权限','Permissions','Kebenaran')}</h3><div class="permission-grid">${checks}</div><p><button class="btn btn-primary">${text('保存','Save','Simpan')}</button></p></form>`);
  q('#staffAccountForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),permissions={};permKeys.forEach(k=>permissions[k]=f.get(`perm_${k}`)==='on');const payload={action:editing?'update_employee':'create_employee',user_id:userId||undefined,full_name:String(f.get('full_name')||'').trim(),username:String(f.get('username')||'').trim().toLowerCase(),password:String(f.get('password')||''),role:f.get('role'),permissions,is_active:f.get('is_active')==='on'};const x=await invokeStaffAdmin(payload),data=x?.data||x;if(x?.error||data?.ok===false)return toast(x?.error?.message||data?.error||text('无法保存员工账号','Unable to save staff account','Tidak dapat menyimpan akaun'),true);closeModal();toast(text('已保存','Saved','Disimpan'));await loadAll();};
 };

 function loanOwner(loan){const c=(state.customers||[]).find(x=>String(x.id)===String(loan.customer_id));return String(c?.owner_staff_id||c?.claimed_by||'')}
 function metrics(owner){
  const allOwnedLoans=(state.loans||[]).filter(l=>!owner||loanOwner(l)===String(owner));
  const periodLoans=allOwnedLoans.filter(l=>inRange(l.disbursement_date||l.created_at));
  const ids=new Set(allOwnedLoans.map(l=>String(l.id)));
  const reps=(state.repayments||[]).filter(r=>ids.has(String(r.loan_id))&&inRange(r.payment_date||r.created_at));
  const disbursed=periodLoans.reduce((s,l)=>s+Number(l.principal||0),0);
  let principalCollected=0,interest=0,overdue=0;
  reps.forEach(r=>{
    const total=Number(r.amount||r.paid_amount||0);
    const i=Math.max(0,Number(r.interest_amount??r.interest_paid??0));
    const o=Math.max(0,Number(r.overdue_amount??r.overdue_paid_amount??0));
    const explicit=Number(r.principal_amount??r.principal_paid??NaN);
    interest+=i;overdue+=o;
    principalCollected+=Number.isFinite(explicit)?Math.max(0,explicit):Math.max(0,total-i-o);
  });
  const customerIds=new Set(allOwnedLoans.map(l=>String(l.customer_id)).filter(Boolean));
  return {customers:customerIds.size,disbursed,principalCollected,interest,overdue,profit:principalCollected+interest+overdue-disbursed};
 }
 window.v311Metrics=metrics;
 window.v311RenderFinance=function(){
  if(!state?.staff)return;
  const isMgr=management(), own=isMgr?'':staffId(state.staff), m=metrics(own);
  const set=(id,val)=>{const e=q('#'+id);if(e)e.textContent=val};
  set('reportPrincipal',money(m.disbursed));set('v321PrincipalCollected',money(m.principalCollected));set('reportInterest',money(m.interest));set('v311OverdueCollected',money(m.overdue));set('reportCollected',money(m.profit));
  const rows=q('#v311StaffProfitRows');
  if(rows){
   const source=isMgr?(state.staffList||[]).filter(s=>normalize(s?.role)==='customer_service'):[state.staff].filter(Boolean);
   rows.innerHTML=source.map(s=>{const x=metrics(staffId(s));return `<tr><td>${esc(s.full_name||s.username||'-')}</td><td>${x.customers}</td><td>${money(x.disbursed)}</td><td>${money(x.principalCollected)}</td><td>${money(x.interest)}</td><td>${money(x.overdue)}</td><td class="${x.profit<0?'danger-text':'success-text'}">${money(x.profit)}</td></tr>`}).join('')||`<tr><td colspan="7">${text('暂无记录','No records','Tiada rekod')}</td></tr>`;
  }
  const labels={v311DisbursedLabel:text('放款总额','Total Disbursed','Jumlah Dikeluarkan'),v321PrincipalCollectedLabel:text('已收本金','Principal Collected','Prinsipal Diterima'),v311InterestLabel:text('已收利息','Interest Collected','Faedah Diterima'),v311OverdueLabel:text('已收逾期','Overdue Collected','Tertunggak Diterima'),v311ProfitLabel:text('盈亏','Profit / Loss','Untung / Rugi'),v311StaffProfitTitle:text('客服盈亏报表','Staff Profit / Loss','Untung / Rugi Staf'),v311StaffProfitHelp:isMgr?text('根据日期范围显示全部客服。','Shows all staff for the selected date range.','Memaparkan semua staf mengikut julat tarikh.'):text('仅显示你自己的数据。','Only your own figures are shown.','Hanya data anda dipaparkan.'),v321StaffCol:text('客服','Staff','Staf'),v321CustomersCol:text('客户数','Customers','Pelanggan'),v321DisbursedCol:text('放款总额','Total Disbursed','Jumlah Dikeluarkan'),v321PrincipalCol:text('已收本金','Principal Collected','Prinsipal Diterima'),v321InterestCol:text('已收利息','Interest Collected','Faedah Diterima'),v321OverdueCol:text('已收逾期','Overdue Collected','Tertunggak Diterima'),v321ProfitCol:text('盈亏','Profit / Loss','Untung / Rugi')};
  Object.entries(labels).forEach(([id,v])=>set(id,v));
  const card=q('#statCollected')?.closest('.stat');if(card)card.style.display=isMgr?'none':'';
 };

 const oldStats=window.renderStats;
 window.renderStats=function(){try{oldStats?.apply(this,arguments)}catch(e){console.warn(e)}window.v311RenderFinance()};
 window.addEventListener('swk-language-applied',()=>setTimeout(window.v311RenderFinance,0));
 document.addEventListener('click',e=>{if(e.target.closest?.('.date-preset,#applyDateRange'))setTimeout(window.v311RenderFinance,80)});
 setTimeout(window.v311RenderFinance,600);
})();

;

/* ===== v32.3-workflow.js ===== */
/* WL Credit workflow, review queue and split-payment approval */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const escv=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
const role=()=>norm(window.AppSession?.staff?.role||window.state?.staff?.role||'');
const manager=()=>['super_admin','superadmin','finance','manager'].includes(role());
const uid=()=>String(window.AppSession?.staff?.user_id||window.state?.staff?.user_id||'');
const currentStaff=()=>window.AppSession?.staff||window.state?.staff||{};
const ownerId=row=>String(row?.owner_staff_id||row?.claimed_by||row?.assigned_staff_id||row?.review_staff_id||row?.staff_id||'');
const ownerLabel=row=>String(row?.claimed_by_name||row?.owner_staff_name||row?.assigned_staff_name||'').trim().toLowerCase();
const ownCustomer=c=>manager()||ownerId(c)===uid();
const ownApplication=a=>{
 if(manager())return true;
 if(ownerId(a)&&ownerId(a)===uid())return true;
 const st=currentStaff(),names=[st.full_name,st.username,st.auth_email].filter(Boolean).map(x=>String(x).trim().toLowerCase());
 return !!ownerLabel(a)&&names.includes(ownerLabel(a));
};
const reviewStatus=s=>['under_review','reviewing','in_review','claimed'].includes(norm(s));
const reviewApplications=()=>((window.state?.applications)||[]).filter(a=>reviewStatus(a.status)&&ownApplication(a));
const shortLoan=v=>{const s=String(v||'');const m=s.match(/(\d+)$/);return m?`L${String(Number(m[1])).padStart(5,'0')}`:s};
const today=()=>new Date().toISOString().slice(0,10);
const fmtMoney=n=>typeof money==='function'?money(Number(n||0)):`MYR ${Number(n||0).toFixed(2)}`;
const statusText=s=>({pending:L('待认领','Pending','Menunggu'),under_review:L('审核中','Under Review','Dalam Semakan'),approved:L('已批准','Approved','Diluluskan'),rejected:L('已拒绝','Rejected','Ditolak')}[s]||s||'-');

function switchSection(id){
 document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id===id));
 document.querySelectorAll('[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===id));
 const btn=document.querySelector(`[data-section="${id}"]`); if(btn&&window.innerWidth<900) document.body.classList.remove('sidebar-open');
 const title=$('#pageTitle'); if(title)title.textContent=btn?.querySelector('span')?.textContent||btn?.textContent.trim()||'WL Credit';
 if(id==='loanReview')renderLoanReview(); if(id==='pendingFinance')window.renderPendingFinance?.(); if(id==='myWork')renderMyWork(); if(id==='staffPerformance')renderStaffPerformance();
}
window.switchSection=switchSection;
function navButton(section,label,badgeId){const b=document.createElement('button');b.dataset.section=section;b.innerHTML=`<span>${label}</span>${badgeId?`<span id="${badgeId}" class="nav-count hidden">0</span>`:''}`;b.addEventListener('click',()=>switchSection(section));return b}
function injectNavigation(){
 const nav=$('#nav'); if(!nav)return;
 const dashboardBtn=nav.querySelector('[data-section="dashboard"]');
 if(!$('#navMyWork')&&dashboardBtn){const my=navButton('myWork',L('今日工作','Today Work','Kerja Hari Ini'),'navMyWorkBadge');my.id='navMyWork';nav.insertBefore(my,dashboardBtn)}
 const loanMenu=nav.querySelector('[data-nav-group="loan"] .nav-submenu');const appBtn=loanMenu?.querySelector('[data-section="loanApplications"]');
 if(loanMenu&&appBtn&&!loanMenu.querySelector('[data-section="loanReview"]')){const review=navButton('loanReview',L('贷款审核','Loan Review','Semakan Pinjaman'),'navLoanReviewBadge');appBtn.after(review)}
 const reportsMenu=nav.querySelector('[data-nav-group="reports"] .nav-submenu');if(reportsMenu&&!reportsMenu.querySelector('[data-section="staffPerformance"]')){const perf=navButton('staffPerformance',L('客服业绩报表','Staff Performance','Prestasi Staf'));reportsMenu.prepend(perf)}
}
function section(id,html){if($('#'+id))return;const s=document.createElement('section');s.id=id;s.className='section';s.innerHTML=html;document.querySelector('main.main')?.appendChild(s)}
function injectSections(){
 section('myWork',`<div class="card v231-today-work"><div class="section-head"><div><h2>${L('今日工作','Today Work','Kerja Hari Ini')}</h2><small class="muted">${L('只显示今日到期和当前逾期贷款','Shows only loans due today and currently overdue','Hanya pinjaman matang hari ini dan tertunggak')}</small></div></div><div class="today-work-grid"><div><h3>${L('今日到期','Due Today','Matang Hari Ini')}</h3><div class="table-wrap"><table class="table"><thead><tr><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('本期利息','Interest','Faedah')}</th><th>${L('逾期应收','Overdue','Tertunggak')}</th><th>${L('到期日','Due Date','Tarikh Matang')}</th><th>${L('操作','Action','Tindakan')}</th></tr></thead><tbody id="todayDueRows"></tbody></table></div></div><div><h3>${L('逾期贷款','Overdue Loans','Pinjaman Tertunggak')}</h3><div class="table-wrap"><table class="table"><thead><tr><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('逾期天数','Days Overdue','Hari Tertunggak')}</th><th>${L('逾期金额','Overdue Amount','Jumlah Tertunggak')}</th><th>${L('操作','Action','Tindakan')}</th></tr></thead><tbody id="todayOverdueRows"></tbody></table></div></div></div></div>`);
 section('loanReview',`<div class="section-head"><div><h2>${L('贷款审核','Loan Review','Semakan Pinjaman')}</h2><small class="muted">${L('客服只显示自己认领且尚未完成的申请；Super Admin 可查看全部。','Staff see their claimed unfinished applications; Super Admin sees all.','Staf melihat permohonan sendiri; Super Admin melihat semua.')}</small></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('申请编号','Application ID','ID Permohonan')}</th><th>${L('申请人','Applicant','Pemohon')}</th><th>${L('电话','Phone','Telefon')}</th><th>${L('申请金额','Requested','Jumlah')}</th><th>${L('负责人','Owner','Pegawai')}</th><th>${L('状态','Status','Status')}</th><th>${L('操作','Actions','Tindakan')}</th></tr></thead><tbody id="loanReviewRows"></tbody></table></div>`);
 section('staffPerformance',`<div class="section-head"><div><h2>${L('客服业绩报表','Staff Performance','Prestasi Staf')}</h2><small class="muted">${L('根据总览选择的日期范围计算。','Calculated using the dashboard date range.','Dikira mengikut julat tarikh dashboard.')}</small></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('客服','Staff','Staf')}</th><th>${L('新增客户','New Customers','Pelanggan Baharu')}</th><th>${L('批准贷款','Approved','Diluluskan')}</th><th>${L('放款总额','Disbursed','Dikeluarkan')}</th><th>${L('已收本金','Principal','Prinsipal')}</th><th>${L('已收利息','Interest','Faedah')}</th><th>${L('已收逾期','Overdue','Tertunggak')}</th><th>${L('已结清','Settled','Selesai')}</th><th>${L('盈亏','P/L','Untung/Rugi')}</th></tr></thead><tbody id="staffPerformanceRows"></tbody></table></div>`);
 const dash=$('#dashboard');if(dash&&!$('#workflowNoticeCenter')){const c=document.createElement('div');c.id='workflowNoticeCenter';c.className='card workflow-notice-center';c.innerHTML=`<div class="section-head"><h3>${L('通知中心','Notification Center','Pusat Notifikasi')}</h3></div><div id="workflowNoticeGrid" class="workflow-grid"></div>`;dash.insertBefore(c,dash.querySelector('.dashboard-bank-section'))}
 if(dash&&!$('#bankHistoryCard')){const c=document.createElement('div');c.id='bankHistoryCard';c.className='card';c.innerHTML=`<div class="section-head"><div><h3>${L('公司收款账号历史','Collection Account History','Sejarah Akaun Kutipan')}</h3><small class="muted">${L('跟随总览日期范围，可查看金额、付款客户、贷款编号及审核人。','Follows dashboard date range and shows customer, loan and reviewer.','Mengikut julat tarikh dan menunjukkan pelanggan, pinjaman dan penyemak.')}</small></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('日期','Date','Tarikh')}</th><th>${L('银行','Bank','Bank')}</th><th>${L('金额','Amount','Jumlah')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('审核人','Reviewed By','Disemak Oleh')}</th></tr></thead><tbody id="bankHistoryRows"></tbody></table></div>`;dash.appendChild(c)}
}
function ownerName(id){const s=(state.staffList||[]).find(x=>String(x.user_id)===String(id));return s?.full_name||s?.username||'-'}
function renderLoanReview(){
 const rows=$('#loanReviewRows');if(!rows||!window.state)return;
 const list=reviewApplications();
 window.__wlReviewApplications=list;
 rows.innerHTML=list.map(a=>`<tr><td class="mono">${escv(a.application_code||a.id)}</td><td>${escv(a.full_name||'-')}</td><td>${escv(a.phone||'-')}</td><td>${fmtMoney(a.requested_amount)}</td><td>${escv(ownerName(ownerId(a)))}</td><td><span class="badge warn">${statusText(a.status)}</span></td><td><button class="btn btn-primary" onclick="openApplication('${a.id}')">${L('继续审核','Continue Review','Teruskan Semakan')}</button>${manager()?` <button class="btn btn-secondary" onclick="v323TransferReview('${a.id}')">${L('转移客服','Transfer','Pindah')}</button>`:''}</td></tr>`).join('')||`<tr><td colspan="7">${L('暂无待审核申请','No applications under review','Tiada permohonan')}</td></tr>`;
}
window.v323TransferReview=id=>{
 const a=(state.applications||[]).find(x=>String(x.id)===String(id));if(!a)return;
 const staff=(state.staffList||[]).filter(x=>norm(x.role)==='customer_service'&&x.is_active!==false);
 modal(`<h2>${L('转移审核客服','Transfer Review','Pindah Semakan')}</h2><form id="v323TransferForm"><div class="field"><label>${L('客服','Staff','Staf')}</label><select name="staff" required>${staff.map(s=>`<option value="${s.user_id}">${escv(s.full_name||s.username)}</option>`).join('')}</select></div><button class="btn btn-primary">${L('确认转移','Confirm Transfer','Sahkan')}</button></form>`);
 $('#v323TransferForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),staffId=f.get('staff');const r=await sb.from('loan_applications').update({owner_staff_id:staffId,status:'under_review',claimed_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message,true);closeModal();toast(L('已转移','Transferred','Dipindahkan'));await loadAll();renderLoanReview()}
};
function workCard(label,value,section,kind=''){return `<button class="work-card ${kind}" data-open="${section}"><span>${label}</span><strong>${value}</strong></button>`}
function renderMyWork(){
 if(!window.state)return;
 const r=role();
 if(r!=='customer_service')return;
 const todayStr=today();
 const customerById=new Map((state.customers||[]).map(c=>[String(c.id),c]));
 const mine=(state.loans||[]).filter(l=>{
   if(norm(l.status)!=='active')return false;
   const c=customerById.get(String(l.customer_id));
   return manager()||ownCustomer(c||{});
 });
 const due=mine.filter(l=>String(l.due_date||'').slice(0,10)===todayStr);
 const overdue=mine.filter(l=>l.due_date&&String(l.due_date).slice(0,10)<todayStr);
 const code=l=>shortLoan(l.loan_id);
 const uname=c=>window.v23CustomerUsername?window.v23CustomerUsername(c):(c?.username||c?.customer_code||'-');
 const dueRows=$('#todayDueRows');
 const overdueRows=$('#todayOverdueRows');
 if(dueRows)dueRows.innerHTML=due.map(l=>{const c=customerById.get(String(l.customer_id));return `<tr><td class="mono">${escv(code(l))}</td><td>${escv(uname(c))} · ${escv(c?.full_name||'-')}</td><td>${fmtMoney(l.interest)}</td><td>${fmtMoney(l.overdue_charge)}</td><td>${escv(String(l.due_date||'-').slice(0,10))}</td><td><button class="btn btn-secondary" onclick="openLoan('${l.id}')">${L('查看','View','Lihat')}</button> <button class="btn btn-danger" data-v23-overdue="${l.id}">${L('设置逾期','Set Overdue','Tetapkan Tertunggak')}</button></td></tr>`}).join('')||`<tr><td colspan="6" class="muted">${L('今天没有到期贷款','No loans due today','Tiada pinjaman matang hari ini')}</td></tr>`;
 if(overdueRows)overdueRows.innerHTML=overdue.map(l=>{const c=customerById.get(String(l.customer_id));const days=Math.max(1,Math.floor((new Date(todayStr)-new Date(String(l.due_date).slice(0,10)))/86400000));return `<tr><td class="mono">${escv(code(l))}</td><td>${escv(uname(c))} · ${escv(c?.full_name||'-')}</td><td>${days}</td><td>${fmtMoney(l.overdue_charge)}</td><td><button class="btn btn-secondary" onclick="openLoan('${l.id}')">${L('查看','View','Lihat')}</button> <button class="btn btn-danger" data-v23-overdue="${l.id}">${L('设置逾期','Set Overdue','Tetapkan Tertunggak')}</button></td></tr>`}).join('')||`<tr><td colspan="5" class="muted">${L('目前没有逾期贷款','No overdue loans','Tiada pinjaman tertunggak')}</td></tr>`;
 const badge=$('#navMyWorkBadge');if(badge){badge.textContent=due.length+overdue.length;badge.classList.toggle('hidden',!(due.length+overdue.length))}
}
function renderNotices(){
 const root=$('#workflowNoticeGrid');if(!root||!window.state)return;const apps=(state.applications||[]),reviews=reviewApplications().length,pending=apps.filter(a=>norm(a.status)==='pending').length,pay=(state.submissions||[]).filter(x=>x.status==='pending').length,mine=apps.filter(ownApplication),pendingFinance=mine.filter(a=>norm(a.status)==='pending_disbursement').length,financeDone=mine.filter(a=>norm(a.status)==='finance_disbursed').length;
 root.innerHTML=workCard(L('新申请','New Applications','Permohonan Baharu'),pending,'loanApplications')+workCard(L('等待审核','Under Review','Dalam Semakan'),reviews,'loanReview')+workCard(L('待财务出款','Waiting for Finance','Menunggu Kewangan'),pendingFinance,'pendingFinance')+workCard(L('财务已出款待确认','Finance Disbursed — Confirm','Kewangan Telah Bayar — Sahkan'),financeDone,'pendingFinance')+workCard(L('等待付款','Pending Payments','Bayaran Menunggu'),pay,'paymentSubmissions');root.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>switchSection(b.dataset.open));
}
function renderBadges(){
 const apps=(state.applications||[]);const review=reviewApplications().length;const b=$('#navLoanReviewBadge');if(b){b.textContent=review;b.classList.toggle('hidden',!review)}const w=$('#navMyWorkBadge');if(w){let n;if(role()==='finance'){n=apps.filter(a=>norm(a.status)==='pending_disbursement').length+(state.submissions||[]).filter(x=>['pending','pending_finance','awaiting_finance'].includes(norm(x.finance_status||x.status))).length+(state.salaryAdvances||[]).filter(x=>['requested','pending'].includes(norm(x.status))).length}else n=review+apps.filter(a=>ownApplication(a)&&['pending_disbursement','finance_disbursed'].includes(norm(a.status))).length+(state.submissions||[]).filter(x=>x.status==='pending').length;w.textContent=n;w.classList.toggle('hidden',!n)}
}
function renderStaffPerformance(){
 const rows=$('#staffPerformanceRows');if(!rows||!window.state)return;const source=manager()?(state.staffList||[]).filter(s=>norm(s.role)==='customer_service'):[state.staff].filter(Boolean);
 rows.innerHTML=source.map(s=>{const sid=String(s.user_id||''),cs=(state.customers||[]).filter(c=>String(c.owner_staff_id||c.claimed_by||'')===sid),cids=new Set(cs.map(c=>String(c.id))),ls=(state.loans||[]).filter(l=>cids.has(String(l.customer_id))),periodLoans=ls.filter(l=>typeof inRange==='function'?inRange(l.disbursement_date||l.created_at):true),ids=new Set(ls.map(l=>String(l.id))),rs=(state.repayments||[]).filter(r=>ids.has(String(r.loan_id))&&(typeof inRange!=='function'||inRange(r.payment_date||r.created_at))),principal=rs.reduce((a,r)=>a+Number(r.principal_amount||0),0),interest=rs.reduce((a,r)=>a+Number(r.interest_amount||0),0),overdue=rs.reduce((a,r)=>a+Number(r.overdue_amount||0),0),disb=periodLoans.reduce((a,l)=>a+Number(l.principal||0),0),settled=ls.filter(l=>l.status==='paid'&&(typeof inRange!=='function'||inRange(l.updated_at||l.due_date))).length,approved=(state.applications||[]).filter(a=>String(a.claimed_by||a.owner_staff_id||'')===sid&&a.status==='approved'&&(typeof inRange!=='function'||inRange(a.reviewed_at||a.updated_at||a.created_at))).length,profit=principal+interest+overdue-disb;return `<tr><td>${escv(s.full_name||s.username||'-')}</td><td>${cs.length}</td><td>${approved}</td><td>${fmtMoney(disb)}</td><td>${fmtMoney(principal)}</td><td>${fmtMoney(interest)}</td><td>${fmtMoney(overdue)}</td><td>${settled}</td><td class="${profit<0?'danger-text':'success-text'}">${fmtMoney(profit)}</td></tr>`}).join('')||`<tr><td colspan="9">${L('暂无记录','No records','Tiada rekod')}</td></tr>`;
}
function renderBankHistory(){
 const rows=$('#bankHistoryRows');if(!rows||!window.state)return;const loanMap=new Map((state.loans||[]).map(l=>[String(l.id),l])),customerMap=new Map((state.customers||[]).map(c=>[String(c.id),c])),bankMap=new Map((state.banks||[]).map(b=>[String(b.id),b]));
 const list=(state.repayments||[]).filter(r=>typeof inRange!=='function'||inRange(r.payment_date||r.created_at)).sort((a,b)=>String(b.payment_date||b.created_at).localeCompare(String(a.payment_date||a.created_at)));
 rows.innerHTML=list.slice(0,200).map(r=>{const l=loanMap.get(String(r.loan_id)),c=customerMap.get(String(l?.customer_id)),bank=bankMap.get(String(c?.assigned_bank_id)),staff=ownerName(r.recorded_by||r.collected_by);return `<tr><td>${escv(new Date(r.payment_date||r.created_at).toLocaleString())}</td><td>${escv(bank?.bank_name||'-')}</td><td>${fmtMoney(r.amount)}</td><td>${escv(c?.full_name||'-')}</td><td>${shortLoan(l?.loan_id)}</td><td>${escv(staff)}</td></tr>`}).join('')||`<tr><td colspan="6">${L('暂无记录','No records','Tiada rekod')}</td></tr>`;
}
function updateAll(){try{renderLoanReview();renderMyWork();renderNotices();renderBadges();renderStaffPerformance();renderBankHistory()}catch(e){console.error('workflow render',e)}}

// Payment approval: show due summary and classify received amount into principal, interest and overdue.
window.approveSubmission=function(id){
 if(typeof requirePerm==='function'&&!requirePerm('payments_approve_partial'))return;
 const x=(state.submissions||[]).find(v=>String(v.id)===String(id));if(!x)return toast(L('找不到付款申请','Payment submission not found','Permohonan bayaran tidak ditemui'),true);
 const l=(state.loans||[]).find(v=>String(v.id)===String(x.loan_id))||{},submitted=Number(x.amount||0),interestDue=Math.max(0,Number(l.interest||l.current_due_amount||0)),settlementDue=Math.max(0,Number(l.settlement_amount||l.remaining_amount||0)),overdueDue=Math.max(0,Number(l.overdue_charge||0));
 let pi=0,ii=0,oi=0,settle=false;if(settlementDue>0&&Math.abs(submitted-settlementDue)<0.01){pi=submitted;settle=true}else{ii=Math.min(submitted,interestDue);oi=Math.min(Math.max(0,submitted-ii),overdueDue);pi=Math.max(0,submitted-ii-oi)}
 modal(`<h2>${L('通过付款','Approve Payment','Lulus Bayaran')}</h2><div class="payment-due-strip"><div><span>${L('贷款编号','Loan ID','ID Pinjaman')}</span><strong>${shortLoan(l.loan_id)}</strong></div><div><span>${L('本期利息','Interest Due','Faedah')}</span><strong>${fmtMoney(interestDue)}</strong></div><div><span>${L('清账金额','Settlement','Penyelesaian')}</span><strong>${fmtMoney(settlementDue)}</strong></div><div><span>${L('尚欠逾期','Overdue Due','Tertunggak')}</span><strong>${fmtMoney(overdueDue)}</strong></div><div><span>${L('客户提交','Submitted','Dihantar')}</span><strong>${fmtMoney(submitted)}</strong></div></div><form id="v323PaymentForm"><h3>${L('本次收款分类','Payment Allocation','Pecahan Bayaran')}</h3><div class="grid3"><div class="field"><label>${L('已收本金','Principal Received','Prinsipal Diterima')}</label><input name="principal" type="number" min="0" step="0.01" value="${pi.toFixed(2)}"></div><div class="field"><label>${L('已收利息','Interest Received','Faedah Diterima')}</label><input name="interest_received" type="number" min="0" step="0.01" value="${ii.toFixed(2)}"></div><div class="field"><label>${L('已收逾期','Overdue Received','Tertunggak Diterima')}</label><input name="overdue_received" type="number" min="0" step="0.01" value="${oi.toFixed(2)}"></div></div><div class="payment-allocation-summary"><div><span>${L('本次收款总额','Allocated Total','Jumlah Diagih')}</span><strong id="v323Allocated">${fmtMoney(submitted)}</strong></div><div><span>${L('客户提交金额','Submitted Amount','Jumlah Dihantar')}</span><strong>${fmtMoney(submitted)}</strong></div><div><span>${L('尚未分类','Unallocated','Belum Diagih')}</span><strong id="v323Unallocated">${fmtMoney(0)}</strong></div></div><label class="check-row"><input name="settle" type="checkbox" ${settle?'checked':''}> ${L('本次完成清账，贷款结清并移入历史','Complete settlement and close this loan','Selesaikan pinjaman ini')}</label><div id="v323NextFields" class="grid2"><div class="field"><label>${L('下一期到期时间','Next Due Time','Tarikh Seterusnya')}</label><input name="next_due" type="datetime-local"></div><div class="field"><label>${L('下一期利息','Next Interest','Faedah Seterusnya')}</label><input name="next_interest" type="number" min="0" step="0.01" value="${interestDue.toFixed(2)}"></div><div class="field"><label>${L('下一期清账金额','Next Settlement','Penyelesaian Seterusnya')}</label><input name="next_settlement" type="number" min="0" step="0.01" value="${settlementDue.toFixed(2)}"></div><div class="field"><label>${L('备注','Note','Catatan')}</label><input name="note"></div></div><button class="btn btn-primary">${L('确认通过','Confirm Approval','Sahkan')}</button></form>`);
 const form=$('#v323PaymentForm'),fields=['principal','interest_received','overdue_received'],allocated=$('#v323Allocated'),unallocated=$('#v323Unallocated'),next=$('#v323NextFields'),settleBox=form.elements.settle;
 const d=new Date();d.setDate(d.getDate()+30);form.elements.next_due.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const calc=()=>{const total=fields.reduce((a,k)=>a+Number(form.elements[k].value||0),0),diff=submitted-total;allocated.textContent=fmtMoney(total);unallocated.textContent=fmtMoney(diff);unallocated.className=Math.abs(diff)<0.01?'success-text':'danger-text';next.classList.toggle('hidden',settleBox.checked);['next_due','next_interest','next_settlement'].forEach(k=>form.elements[k].required=!settleBox.checked)};fields.forEach(k=>form.elements[k].addEventListener('input',calc));settleBox.addEventListener('change',calc);calc();
 form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),principal=Number(f.get('principal')||0),interest=Number(f.get('interest_received')||0),overdue=Number(f.get('overdue_received')||0),total=principal+interest+overdue;if(Math.abs(total-submitted)>=0.01)return toast(L(`分类金额必须等于客户提交金额 ${fmtMoney(submitted)}`,`Allocated amounts must equal ${fmtMoney(submitted)}`,`Jumlah pecahan mesti sama dengan ${fmtMoney(submitted)}`),true);if(overdue>overdueDue+0.01)return toast(L('已收逾期不能超过尚欠逾期','Overdue received cannot exceed overdue due','Tertunggak diterima melebihi baki'),true);const btn=e.submitter;btn.disabled=true;try{const r=await sb.rpc('wl_approve_payment_split_v323',{p_submission_id:id,p_principal_amount:principal,p_interest_amount:interest,p_overdue_amount:overdue,p_settle:f.get('settle')==='on',p_next_due_at:f.get('settle')==='on'?null:new Date(f.get('next_due')).toISOString(),p_next_interest:f.get('settle')==='on'?0:Number(f.get('next_interest')||0),p_next_settlement:f.get('settle')==='on'?0:Number(f.get('next_settlement')||0),p_note:f.get('note')||null});if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Approval failed');closeModal();toast(L('付款已通过并完成分类','Payment approved and allocated','Bayaran diluluskan'));await loadAll();updateAll()}catch(err){toast(err.message||String(err),true);btn.disabled=false}}
};

function boot(){injectNavigation();injectSections();updateAll();document.addEventListener('click',e=>{const b=e.target.closest?.('[data-section]');if(b&&['myWork','loanReview','staffPerformance'].includes(b.dataset.section))switchSection(b.dataset.section)});if(role()==='customer_service')setTimeout(()=>switchSection('myWork'),700)}
const oldRenderAll=window.renderAll;window.renderAll=function(){const r=oldRenderAll?.apply(this,arguments);setTimeout(updateAll,0);return r};
window.addEventListener('swk-language-applied',()=>setTimeout(()=>{injectNavigation();injectSections();updateAll();},30));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

;

/* ===== v33-finance-flow.js ===== */
/* WL Credit: three-role finance workflow (Super Admin / Customer Service / Finance) */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const R=()=>String(window.AppSession?.staff?.role||window.state?.staff?.role||'').toLowerCase().replace(/[\s-]+/g,'_');
const isSA=()=>['super_admin','superadmin'].includes(R());
const isFinance=()=>R()==='finance';
const isCS=()=>R()==='customer_service';
const canFinance=()=>isSA()||isFinance();
const money2=n=>typeof money==='function'?money(Number(n||0)):`MYR ${Number(n||0).toFixed(2)}`;
const shortLoan=v=>{const s=String(v||'');const m=s.match(/(\d+)$/);return m?`L${String(Number(m[1])).padStart(5,'0')}`:s};
let fstate={banks:[],transactions:[],loading:false};
function sec(id,html){let x=$('#'+id);if(!x){x=document.createElement('section');x.id=id;x.className='section';document.querySelector('main.main')?.appendChild(x)}x.innerHTML=html;return x}
function btn(section,label,badge=''){const x=document.createElement('button');x.dataset.section=section;x.innerHTML=`<span>${label}</span>${badge?`<span id="${badge}" class="nav-count hidden">0</span>`:''}`;return x}
function injectNav(){const nav=$('#nav');if(!nav||$('#v33FinanceGroup'))return;const g=document.createElement('div');g.id='v33FinanceGroup';g.className='nav-group';g.dataset.navGroup='finance';g.innerHTML=`<button type="button" class="nav-group-toggle"><span>${L('财务','Finance','Kewangan')}</span><span class="nav-chevron">⌄</span></button><div class="nav-submenu"></div>`;const sub=g.querySelector('.nav-submenu');sub.append(btn('financeDisbursements',L('待放款','Pending Disbursement','Menunggu Pengeluaran'),'v33DisbursementBadge'));sub.append(btn('financeReceipts',L('待确认收款','Pending Receipts','Penerimaan Belum Disahkan'),'v33ReceiptBadge'));sub.append(btn('companyBanks',L('公司银行账户','Company Bank Accounts','Akaun Bank Syarikat')));nav.querySelector('[data-nav-group="company"]')?.before(g);g.querySelector('.nav-group-toggle').onclick=()=>g.classList.toggle('open');g.querySelectorAll('[data-section]').forEach(x=>x.onclick=()=>{window.switchSection?.(x.dataset.section);loadFinance().then(renderAllFinance)});}

/* Finance navigation hardening: survives sidebar/i18n re-renders. */
function bindFinanceNavigation(){
 const g=$('#v33FinanceGroup');
 if(!g)return;
 const toggle=g.querySelector('.nav-group-toggle');
 if(toggle&&!toggle.dataset.v33Bound){
   toggle.dataset.v33Bound='1';
   toggle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();g.classList.toggle('open')});
 }
 g.querySelectorAll('[data-section]').forEach(x=>{
   if(x.dataset.v33Bound)return;
   x.dataset.v33Bound='1';
   x.addEventListener('click',async e=>{
     e.preventDefault();e.stopPropagation();
     g.classList.add('open');
     const id=x.dataset.section;
     window.switchSection?.(id);
     await loadFinance();
     renderAllFinance();
   });
 });
}
// Capture fallback in case another script replaces or swallows sidebar handlers.
document.addEventListener('click',e=>{
 const toggle=e.target.closest?.('#v33FinanceGroup .nav-group-toggle');
 if(toggle){
   e.preventDefault();e.stopImmediatePropagation();
   const g=$('#v33FinanceGroup');g?.classList.toggle('open');
   return;
 }
 const item=e.target.closest?.('#v33FinanceGroup [data-section]');
 if(item){
   e.preventDefault();e.stopImmediatePropagation();
   const g=$('#v33FinanceGroup');g?.classList.add('open');
   window.switchSection?.(item.dataset.section);
   loadFinance().then(renderAllFinance);
 }
},true);

function cleanupLegacyBankUi(){
  // Remove obsolete separate cash-flow navigation and page. All history now lives in Company Bank Accounts.
  $$('[data-section="cashFlow"], [data-section="bankCollections"], [data-section="receivingBanks"]').forEach(x=>x.remove());
  ['cashFlow','bankCollections','receivingBanks'].forEach(id=>{const x=$('#'+id);if(x)x.remove()});
}
function injectSections(){
 sec('financeDisbursements',`<div class="section-head"><div><h2>${L('待放款','Pending Disbursement','Menunggu Pengeluaran')}</h2><p class="muted">${L('贷款批准后由财务选择公司银行并完成转账。','Finance selects the company bank and completes the transfer after approval.','Kewangan memilih bank syarikat dan melengkapkan pindahan.')}</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('客户银行','Customer Bank','Bank Pelanggan')}</th><th>${L('放款金额','Amount','Jumlah')}</th><th>${L('状态','Status','Status')}</th><th>${L('操作','Actions','Tindakan')}</th></tr></thead><tbody id="v33DisbursementRows"></tbody></table></div>`);
 sec('financeReceipts',`<div class="section-head"><div><h2>${L('待确认收款','Pending Receipt Verification','Pengesahan Penerimaan')}</h2><p class="muted">${L('财务先核实银行实际到账，确认后交给所属客服分类入账。','Finance verifies the bank receipt before the assigned staff allocates it.','Kewangan mengesahkan penerimaan sebelum staf mengagihkannya.')}</p></div></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('提交时间','Submitted','Dihantar')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('提交金额','Submitted Amount','Jumlah')}</th><th>${L('付款到','Paid To','Dibayar Ke')}</th><th>${L('操作','Actions','Tindakan')}</th></tr></thead><tbody id="v33ReceiptRows"></tbody></table></div>`);
 sec('companyBanks',`<div class="section-head"><div><h2>${L('公司银行账户','Company Bank Accounts','Akaun Bank Syarikat')}</h2><p class="muted">${L('统一管理收款、放款、客服分配、统计与历史。','Manage receipts, disbursements, assignments, statistics and history in one place.','Urus penerimaan, pengeluaran, agihan, statistik dan sejarah di satu tempat.')}</p></div><button class="btn btn-primary" id="v33AddBank">+ ${L('新增银行账户','Add Bank Account','Tambah Akaun Bank')}</button></div><div class="date-filter-bar compact"><input id="v33BankFrom" type="date"><span>${L('至','to','hingga')}</span><input id="v33BankTo" type="date"><button id="v33BankApply" class="btn btn-secondary">${L('查询','Apply','Cari')}</button></div><div id="v33BankCards" class="resource-grid"></div><div id="v33BankHistoryPanel" class="card"><div class="section-head"><div><h3>${L('银行收付款历史','Bank Transaction History','Sejarah Transaksi Bank')}</h3><small id="v33BankHistoryTitle" class="muted">${L('全部银行','All Banks','Semua Bank')}</small></div></div><div id="v33BankHistoryTabs" class="bank-history-tabs"></div><div class="table-wrap"><table class="table"><thead><tr><th>${L('时间','Time','Masa')}</th><th>${L('银行','Bank','Bank')}</th><th>${L('类型','Type','Jenis')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('贷款编号','Loan ID','ID Pinjaman')}</th><th>${L('金额','Amount','Jumlah')}</th><th>${L('操作人','Operator','Pegawai')}</th></tr></thead><tbody id="v33BankHistoryRows"></tbody></table></div></div>`);

 $('#v33AddBank')?.addEventListener('click',()=>openBank());$('#v33BankApply')?.addEventListener('click',()=>{window.v33SelectedBankId='';renderBanks();renderBankHistory()});
}
async function loadFinance(){if(!canFinance()||fstate.loading)return;fstate.loading=true;try{const [b,t]=await Promise.all([sb.from('company_bank_accounts').select('*').order('bank_name'),sb.from('finance_transactions').select('*').order('transaction_at',{ascending:false}).limit(1000)]);if(b.error)throw b.error;if(t.error)throw t.error;fstate.banks=b.data||[];fstate.transactions=t.data||[]}catch(e){console.error(e);toast?.(e.message||String(e),true)}finally{fstate.loading=false}}
function customerForLoan(l){return (state.customers||[]).find(c=>String(c.id)===String(l.customer_id))||l.customers||{}}
function pendingLoans(){return (state.loans||[]).filter(l=>['approved','pending_disbursement','transfer_processing'].includes(String(l.finance_status||l.status||'')))}
function pendingReceipts(){return (state.submissions||[]).filter(x=>['pending','pending_finance','awaiting_finance'].includes(String(x.finance_status||x.status||'')))}
function renderDisbursements(){const h=$('#v33DisbursementRows');if(!h)return;const rows=pendingLoans();h.innerHTML=rows.map(l=>{const c=customerForLoan(l),s=String(l.finance_status||l.status||'pending_disbursement');return `<tr><td class="mono">${shortLoan(l.loan_id)}</td><td>${E(c.full_name||'-')}</td><td>${E(c.bank_name||'-')}<br><small>${E(c.bank_account||c.account_number||'-')}</small></td><td>${money2(l.principal)}</td><td><span class="badge warn">${E(s)}</span></td><td>${s==='transfer_processing'?`<button class="btn btn-primary" onclick="v33CompleteTransfer('${l.id}')">${L('完成转账','Complete Transfer','Selesai Pindahan')}</button>`:`<button class="btn btn-secondary" onclick="v33StartTransfer('${l.id}')">${L('开始转账','Start Transfer','Mula Pindahan')}</button>`}</td></tr>`}).join('')||`<tr><td colspan="6">${L('暂无待放款贷款','No pending disbursements','Tiada pengeluaran tertunggak')}</td></tr>`;badge('v33DisbursementBadge',rows.length)}
function renderReceipts(){const h=$('#v33ReceiptRows');if(!h)return;const rows=pendingReceipts();h.innerHTML=rows.map(x=>{const l=(state.loans||[]).find(a=>String(a.id)===String(x.loan_id))||x.loans||{},c=(state.customers||[]).find(a=>String(a.id)===String(l.customer_id))||x.customers||{};return `<tr><td>${new Date(x.created_at).toLocaleString()}</td><td>${E(c.full_name||'-')}</td><td>${shortLoan(l.loan_id)}</td><td>${money2(x.amount)}</td><td>${E(c.receiving_bank?.bank_name||x.payment_bank||'-')}</td><td><button class="btn btn-primary" onclick="v37ViewReceipt('${x.id}')">${L('查看','View','Lihat')}</button></td></tr>`}).join('')||`<tr><td colspan="6">${L('暂无待确认收款','No receipts to verify','Tiada penerimaan untuk disahkan')}</td></tr>`;badge('v33ReceiptBadge',rows.length)}
function badge(id,n){const b=$('#'+id);if(b){b.textContent=n;b.classList.toggle('hidden',!n)}}
function bankBalance(id){const b=fstate.banks.find(x=>String(x.id)===String(id));return Number(b?.opening_balance||0)+fstate.transactions.filter(x=>String(x.bank_account_id)===String(id)).reduce((a,x)=>a+(x.transaction_type==='inflow'?1:x.transaction_type==='outflow'?-1:1)*Number(x.amount||0),0)}
function legacyBankFor(b){return (state.banks||[]).find(x=>String(x.account_number||'').replace(/\s/g,'')===String(b.account_number||'').replace(/\s/g,'')||String(x.bank_name||'').toLowerCase()===String(b.bank_name||'').toLowerCase())||null}
async function ensureLegacyBankFor(companyBank){
 let legacy=legacyBankFor(companyBank);if(legacy)return legacy;
 const payload={bank_name:companyBank.bank_name,account_name:companyBank.account_name,account_number:companyBank.account_number,is_enabled:companyBank.is_enabled!==false,created_at:new Date().toISOString()};
 const r=await sb.from('receiving_banks').insert(payload).select('*').single();
 if(r.error)throw r.error;
 state.banks=[...(state.banks||[]),r.data];
 return r.data;
}
window.v33ManageBankAssignment=async id=>{
 try{const b=fstate.banks.find(x=>String(x.id)===String(id));if(!b)return;const legacy=await ensureLegacyBankFor(b);manageCustomerBank(legacy.id);}
 catch(e){toast?.(e.message||String(e),true)}
};
function bankTxFor(id){const f=$('#v33BankFrom')?.value,t=$('#v33BankTo')?.value;return fstate.transactions.filter(x=>String(x.bank_account_id)===String(id)&&(!f||String(x.transaction_at||'').slice(0,10)>=f)&&(!t||String(x.transaction_at||'').slice(0,10)<=t))}
function assignedStaffDetails(companyBank){
 const legacy=legacyBankFor(companyBank);
 if(!legacy)return [];
 const rows=(state.staffBankAssignments||[]).filter(x=>String(x.bank_id)===String(legacy.id));
 return rows.map(x=>{
  const staffId=String(x.staff_user_id||'');
  const customers=(state.customers||[]).filter(c=>String(c.assigned_bank_id)===String(legacy.id)&&String(c.owner_staff_id||'')===staffId);
  return {staffId,label:v17StaffLabel?.(staffId)||staffId,customers};
 });
}
window.v33ShowAssignedCustomers=(bankId,staffId)=>{
 const b=fstate.banks.find(x=>String(x.id)===String(bankId));
 const legacy=b?legacyBankFor(b):null;
 const staffLabel=v17StaffLabel?.(staffId)||staffId;
 const customers=legacy?(state.customers||[]).filter(c=>String(c.assigned_bank_id)===String(legacy.id)&&String(c.owner_staff_id||'')===String(staffId)):[];
 const rows=customers.map(c=>`<tr><td>${E(wlCustomerUsername(c)||c.customer_id||c.id||'-')}</td><td>${E(c.full_name||'-')}</td><td>${E(c.phone||c.mobile||'-')}</td></tr>`).join('')||`<tr><td colspan="3">${L('暂无客户','No customers','Tiada pelanggan')}</td></tr>`;
 modal(`<h2>${E(staffLabel)}（${customers.length}）</h2><p class="muted">${E(b?.bank_name||'')} · ${E(b?.account_number||'')}</p><div class="table-wrap"><table class="table"><thead><tr><th>${L('客户编号','Customer ID','ID Pelanggan')}</th><th>${L('客户','Customer','Pelanggan')}</th><th>${L('电话','Phone','Telefon')}</th></tr></thead><tbody>${rows}</tbody></table></div>`);
};
function renderBanks(){
 const h=$('#v33BankCards');if(!h)return;
 h.className='company-bank-table-wrap table-wrap';
 const rows=fstate.banks.map(b=>{
  const q=bankTxFor(b.id),received=q.filter(x=>x.transaction_type==='inflow').reduce((a,x)=>a+Number(x.amount||0),0),disbursed=q.filter(x=>x.transaction_type==='outflow').reduce((a,x)=>a+Number(x.amount||0),0),usage=b.can_receive&&b.can_disburse?L('收／放','Receive / Disburse','Terima / Keluar'):b.can_receive?L('收款','Receive','Terima'):L('放款','Disburse','Keluar');
  const staff=assignedStaffDetails(b);
  const staffHtml=staff.length?staff.map(x=>`<button type="button" class="assigned-staff-chip" onclick="v33ShowAssignedCustomers('${b.id}','${x.staffId}')">${E(x.label)}（${x.customers.length}）</button>`).join(''):L('未分配','Unassigned','Belum Ditugaskan');
  return `<tr><td><strong>${E(b.bank_name)}（${usage}）</strong><small>${E(b.account_name)} · ${E(b.account_number)}</small><span class="badge ${b.is_enabled?'ok':'danger'}">${b.is_enabled?L('启用','Active','Aktif'):L('停用','Disabled','Tidak Aktif')}</span></td><td><strong>${money2(bankBalance(b.id))}</strong></td><td><strong>${money2(received)}</strong></td><td><strong>${money2(disbursed)}</strong></td><td><div class="assigned-staff-list">${staffHtml}</div></td><td><div class="bank-row-actions"><button class="btn btn-secondary" onclick="v33EditBank('${b.id}')">${L('编辑','Edit','Edit')}</button>${b.can_receive?`<button type="button" class="btn btn-primary" data-bank-assignment-id="${b.id}">${L('分配','Assign','Agih')}</button>`:''}<button class="btn btn-secondary" onclick="v33ShowBankHistory('${b.id}')">${L('历史','History','Sejarah')}</button></div></td></tr>`;
 }).join('')||`<tr><td colspan="6">${L('暂无公司银行账户','No company bank accounts','Tiada akaun bank syarikat')}</td></tr>`;
 h.innerHTML=`<table class="table company-bank-table"><thead><tr><th>${L('银行账户','Bank Account','Akaun Bank')}</th><th>${L('余额','Balance','Baki')}</th><th>${L('已收','Received','Diterima')}</th><th>${L('已放','Disbursed','Dikeluarkan')}</th><th>${L('已分配客服','Assigned Staff','Staf Ditugaskan')}</th><th>${L('管理','Manage','Urus')}</th></tr></thead><tbody>${rows}</tbody></table>`;
 renderBankHistory();
}
function renderBankHistory(){
 const h=$('#v33BankHistoryRows'),tabs=$('#v33BankHistoryTabs');if(!h)return;
 const selected=String(window.v33SelectedBankId||''),f=$('#v33BankFrom')?.value,t=$('#v33BankTo')?.value;
 if(tabs){
  const allLabel=L('全部银行','All Banks','Semua Bank');
  tabs.innerHTML=`<button type="button" class="bank-history-tab ${!selected?'active':''}" onclick="v33SelectBankHistory('')">${allLabel}</button>`+fstate.banks.map(b=>`<button type="button" class="bank-history-tab ${String(b.id)===selected?'active':''}" onclick="v33SelectBankHistory('${b.id}')">${E(b.bank_name)}</button>`).join('');
 }
 let list=fstate.transactions.filter(x=>(!selected||String(x.bank_account_id)===selected)&&(!f||String(x.transaction_at||'').slice(0,10)>=f)&&(!t||String(x.transaction_at||'').slice(0,10)<=t));
 const title=$('#v33BankHistoryTitle');if(title){const b=fstate.banks.find(x=>String(x.id)===selected);title.textContent=b?`${b.bank_name} · ${b.account_number}`:L('全部银行','All Banks','Semua Bank')}
 h.innerHTML=list.map(x=>{const b=fstate.banks.find(z=>String(z.id)===String(x.bank_account_id)),l=(state.loans||[]).find(z=>String(z.id)===String(x.loan_id)),c=(state.customers||[]).find(z=>String(z.id)===String(x.customer_id)),st=(state.staffList||[]).find(z=>String(z.user_id)===String(x.created_by));return `<tr><td>${new Date(x.transaction_at).toLocaleString()}</td><td>${E(b?.bank_name||'-')}</td><td>${x.transaction_type==='inflow'?L('收款','Receipt','Penerimaan'):L('放款','Disbursement','Pengeluaran')}</td><td>${E(c?.full_name||'-')}</td><td>${shortLoan(l?.loan_id||'')}</td><td>${money2(x.amount)}</td><td>${E(st?.full_name||st?.username||'-')}</td></tr>`}).join('')||`<tr><td colspan="7">${L('暂无记录','No records','Tiada rekod')}</td></tr>`;
}
window.v33SelectBankHistory=id=>{window.v33SelectedBankId=String(id||'');renderBankHistory()};
window.v33ShowBankHistory=id=>{window.v33SelectedBankId=id;renderBankHistory();document.querySelector('#v33BankHistoryPanel')?.scrollIntoView({behavior:'smooth',block:'start'})};
function renderFlow(){const h=$('#v33FlowRows'),sum=$('#v33BankSummary');if(!h||!sum)return;const from=$('#v33FlowFrom')?.value,to=$('#v33FlowTo')?.value;let list=fstate.transactions.filter(x=>(!from||String(x.transaction_at).slice(0,10)>=from)&&(!to||String(x.transaction_at).slice(0,10)<=to));const bank=id=>fstate.banks.find(x=>String(x.id)===String(id));const staff=id=>(state.staffList||[]).find(x=>String(x.user_id)===String(id));h.innerHTML=list.map(x=>{const l=(state.loans||[]).find(a=>String(a.id)===String(x.loan_id)),s=staff(x.created_by);return `<tr><td>${new Date(x.transaction_at).toLocaleString()}</td><td>${E(bank(x.bank_account_id)?.bank_name||'-')}</td><td><span class="badge ${x.transaction_type==='inflow'?'ok':'danger'}">${x.transaction_type==='inflow'?L('收款','Inflow','Masuk'):L('放款','Outflow','Keluar')}</span></td><td>${shortLoan(l?.loan_id)}</td><td>${money2(x.amount)}</td><td>${E(s?.full_name||s?.username||'-')}</td><td>${E(x.note||x.reference_no||'-')}</td></tr>`}).join('')||`<tr><td colspan="7">${L('暂无记录','No records','Tiada rekod')}</td></tr>`;sum.innerHTML=fstate.banks.map(b=>{const q=list.filter(x=>String(x.bank_account_id)===String(b.id)),i=q.filter(x=>x.transaction_type==='inflow').reduce((a,x)=>a+Number(x.amount||0),0),o=q.filter(x=>x.transaction_type==='outflow').reduce((a,x)=>a+Number(x.amount||0),0);return `<div class="work-card"><span>${E(b.bank_name)}</span><small>${L('收款','Inflow','Masuk')} ${money2(i)} · ${L('放款','Outflow','Keluar')} ${money2(o)}</small><strong>${money2(i-o)}</strong></div>`}).join('')}
function renderAllFinance(){if(!canFinance())return;renderDisbursements();renderReceipts();renderBanks()}
function openBank(b={}){modal(`<h2>${b.id?L('编辑公司银行','Edit Company Bank','Edit Bank Syarikat'):L('新增公司银行','Add Company Bank','Tambah Bank Syarikat')}</h2><form id="v33BankForm"><div class="grid2"><div class="field"><label>${L('银行名称','Bank Name','Nama Bank')}</label><input name="bank_name" required value="${E(b.bank_name||'')}"></div><div class="field"><label>${L('户口姓名','Account Name','Nama Akaun')}</label><input name="account_name" required value="${E(b.account_name||'')}"></div><div class="field"><label>${L('户口号码','Account Number','Nombor Akaun')}</label><input name="account_number" required value="${E(b.account_number||'')}"></div><div class="field"><label>${L('期初余额','Opening Balance','Baki Awal')}</label><input name="opening_balance" type="number" step="0.01" value="${Number(b.opening_balance||0)}"></div></div><label class="check-row"><input name="can_receive" type="checkbox" ${b.can_receive!==false?'checked':''}> ${L('可收款','Can Receive','Boleh Terima')}</label><label class="check-row"><input name="can_disburse" type="checkbox" ${b.can_disburse!==false?'checked':''}> ${L('可放款','Can Disburse','Boleh Keluar')}</label><label class="check-row"><input name="is_enabled" type="checkbox" ${b.is_enabled!==false?'checked':''}> ${L('启用','Enabled','Aktif')}</label><p><button class="btn btn-primary">${L('保存','Save','Simpan')}</button></p></form>`);$('#v33BankForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),p={bank_name:f.get('bank_name'),account_name:f.get('account_name'),account_number:f.get('account_number'),opening_balance:Number(f.get('opening_balance')||0),can_receive:f.get('can_receive')==='on',can_disburse:f.get('can_disburse')==='on',is_enabled:f.get('is_enabled')==='on',updated_at:new Date().toISOString()};const q=b.id?sb.from('company_bank_accounts').update(p).eq('id',b.id):sb.from('company_bank_accounts').insert({...p,created_by:state.staff.user_id});const r=await q;if(r.error)return toast(r.error.message,true);closeModal();await loadFinance();renderAllFinance()}}
window.v33EditBank=id=>openBank(fstate.banks.find(x=>String(x.id)===String(id))||{});
window.v33StartTransfer=async id=>{const r=await sb.rpc('wl_finance_start_disbursement',{p_loan_id:id});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error,true);toast(L('已锁定为转账中','Marked as transfer processing','Ditanda sedang dipindah'));await loadAll();renderAllFinance()};
window.v33CompleteTransfer=id=>{const banks=fstate.banks.filter(b=>b.is_enabled&&b.can_disburse);modal(`<h2>${L('完成放款转账','Complete Disbursement','Selesaikan Pengeluaran')}</h2><form id="v33TransferForm"><div class="field"><label>${L('出款银行','Disbursement Bank','Bank Pengeluaran')}</label><select name="bank" required>${banks.map(b=>`<option value="${b.id}">${E(b.bank_name)} · ${E(b.account_number)}</option>`).join('')}</select></div><div class="field"><label>${L('转账时间','Transfer Time','Masa Pindahan')}</label><input name="at" type="datetime-local" required></div><div class="field"><label>${L('银行参考号','Reference','Rujukan')}</label><input name="ref"></div><button class="btn btn-primary">${L('确认已转账','Confirm Transferred','Sahkan Dipindah')}</button></form>`);const f=$('#v33TransferForm');f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f),r=await sb.rpc('wl_finance_complete_disbursement',{p_loan_id:id,p_bank_account_id:d.get('bank'),p_reference:d.get('ref')||null,p_transferred_at:new Date(d.get('at')).toISOString()});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error,true);closeModal();toast(L('放款已完成','Disbursement completed','Pengeluaran selesai'));await Promise.all([loadAll(),loadFinance()]);renderAllFinance()}};
async function v37ReceiptUrl(path){
 if(!path)return '';
 const r=await sb.storage.from('payment-receipts').createSignedUrl(path,60*20);
 if(r.error)throw r.error;
 return r.data?.signedUrl||'';
}
function v37ReceiptPreview(url,path){
 if(!url)return `<div class="card muted">${L('客户没有上传收据','No receipt uploaded','Tiada resit dimuat naik')}</div>`;
 const ext=String(path||'').split('.').pop().toLowerCase();
 if(ext==='pdf')return `<iframe src="${E(url)}" title="Receipt" style="width:100%;height:460px;border:1px solid #dbe3ef;border-radius:14px"></iframe>`;
 return `<a href="${E(url)}" target="_blank" rel="noopener"><img src="${E(url)}" alt="Receipt" style="display:block;max-width:100%;max-height:520px;margin:auto;border-radius:14px;border:1px solid #dbe3ef;object-fit:contain"></a>`;
}
window.v37ViewReceipt=async id=>{
 const x=(state.submissions||[]).find(a=>String(a.id)===String(id));
 if(!x)return toast(L('找不到付款申请','Payment submission not found','Permohonan bayaran tidak dijumpai'),true);
 const l=(state.loans||[]).find(a=>String(a.id)===String(x.loan_id))||x.loans||{};
 const c=(state.customers||[]).find(a=>String(a.id)===String(x.customer_id||l.customer_id))||x.customers||{};
 const assigned=c.receiving_bank||{};
 let banks=(fstate.banks||[]).filter(b=>b.is_enabled!==false);
 if(!banks.length){
  const br=await sb.from('company_bank_accounts').select('*').eq('is_enabled',true).order('bank_name');
  if(!br.error){banks=br.data||[];fstate.banks=banks}
 }
 const targetBankName=String(assigned.bank_name||x.payment_bank||'').trim().toLowerCase();
 const targetAccount=String(assigned.account_number||'').replace(/\s/g,'');
 let defaultBank=banks.find(b=>targetAccount&&String(b.account_number||'').replace(/\s/g,'')===targetAccount)||banks.find(b=>targetBankName&&String(b.bank_name||'').trim().toLowerCase()===targetBankName)||banks[0]||null;
 let receiptUrl='';
 try{receiptUrl=await v37ReceiptUrl(x.receipt_path||x.receipt_storage_path)}catch(e){console.warn(e)}
 const bankOptions=banks.map(b=>`<option value="${b.id}" ${defaultBank&&String(b.id)===String(defaultBank.id)?'selected':''}>${E(b.bank_name)} · ${E(b.account_name)} · ${E(b.account_number)}</option>`).join('');
 const defaultBankText=defaultBank?`${E(defaultBank.bank_name)} · ${E(defaultBank.account_name)} · ${E(defaultBank.account_number)}`:L('没有可用的公司银行，请先到公司银行账户新增或启用银行。','No active company bank is available. Add or enable one first.','Tiada bank syarikat aktif. Tambah atau aktifkan bank dahulu.');
 modal(`<div class="section-head"><div><h2>${L('核实客户付款','Verify Customer Payment','Sahkan Bayaran Pelanggan')}</h2><p class="muted">${L('先检查收据和银行实际到账，再确认收款。','Review the receipt and actual bank credit before confirming.','Semak resit dan kemasukan bank sebelum mengesahkan.')}</p></div><button type="button" class="btn btn-secondary" onclick="closeModal()">${L('关闭','Close','Tutup')}</button></div>
 <div class="grid2">
  <div class="card"><h3>${L('付款资料','Payment Details','Butiran Bayaran')}</h3>
   <div class="detail-list">
    <p><span>${L('客户','Customer','Pelanggan')}</span><strong>${E(c.full_name||'-')}</strong></p>
    <p><span>${L('贷款编号','Loan ID','ID Pinjaman')}</span><strong>${E(shortLoan(l.loan_id))}</strong></p>
    <p><span>${L('提交金额','Submitted Amount','Jumlah Dihantar')}</span><strong>${money2(x.amount)}</strong></p>
    <p><span>${L('客户填写付款时间','Customer Payment Time','Masa Bayaran Pelanggan')}</span><strong>${x.payment_date?new Date(x.payment_date).toLocaleString(): '-'}</strong></p>
    <p><span>${L('提交时间','Submitted At','Dihantar Pada')}</span><strong>${x.created_at?new Date(x.created_at).toLocaleString():'-'}</strong></p>
    <p><span>${L('备注','Notes','Catatan')}</span><strong>${E(x.notes||'-')}</strong></p>
   </div>
  </div>
  <div class="card"><h3>${L('客户付款到的公司银行','Company Bank Paid To','Bank Syarikat Dibayar')}</h3>
   <div class="detail-list">
    <p><span>${L('银行','Bank','Bank')}</span><strong>${E(assigned.bank_name||x.payment_bank||'-')}</strong></p>
    <p><span>${L('户口姓名','Account Name','Nama Akaun')}</span><strong>${E(assigned.account_name||'-')}</strong></p>
    <p><span>${L('户口号码','Account Number','Nombor Akaun')}</span><strong class="mono">${E(assigned.account_number||'-')}</strong></p>
   </div>
  </div>
 </div>
 <div class="card"><div class="section-head"><h3>${L('付款收据','Payment Receipt','Resit Bayaran')}</h3>${receiptUrl?`<a class="btn btn-secondary" href="${E(receiptUrl)}" target="_blank" rel="noopener">${L('在新窗口查看','Open Receipt','Buka Resit')}</a>`:''}</div>${v37ReceiptPreview(receiptUrl,x.receipt_path||x.receipt_storage_path)}</div>
 <form id="v37ReceiptForm" class="card"><h3>${L('财务确认资料','Finance Confirmation','Pengesahan Kewangan')}</h3>
  <div class="grid2">
   <div class="field"><label>${L('实际收款银行','Actual Receiving Bank','Bank Penerima Sebenar')}</label><div id="v374DefaultBank" class="card" style="padding:12px 14px;margin:0"><strong>${defaultBankText}</strong></div><button type="button" id="v374ChangeBank" class="btn btn-secondary" style="margin-top:8px" ${banks.length?'':'disabled'}>${L('更改收款银行','Change Receiving Bank','Tukar Bank Penerima')}</button><select id="v374BankSelect" name="bank" required style="display:none;margin-top:8px">${bankOptions}</select></div>
   <div class="field"><label>${L('实际到账金额','Confirmed Amount','Jumlah Disahkan')}</label><input name="amount" type="number" min="0.01" step="0.01" required value="${Number(x.amount||0).toFixed(2)}"></div>
   <div class="field"><label>${L('到账时间','Received At','Diterima Pada')}</label><input name="at" type="datetime-local" required></div>
   <div class="field"><label>${L('银行参考号','Reference No.','No. Rujukan')}</label><input name="reference" value="${E(x.reference_no||'')}"></div>
  </div>
  <div class="field"><label>${L('备注','Note','Catatan')}</label><textarea name="note" rows="3"></textarea></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary">${L('确认已收到','Confirm Received','Sahkan Diterima')}</button><button type="button" id="v37RejectReceipt" class="btn btn-danger">${L('未收到／拒绝','Not Received / Reject','Tidak Diterima / Tolak')}</button><button type="button" class="btn btn-secondary" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div>
 </form>`);
 const f=$('#v37ReceiptForm');
 const changeBank=$('#v374ChangeBank'),bankSelect=$('#v374BankSelect'),bankSummary=$('#v374DefaultBank');
 changeBank?.addEventListener('click',()=>{if(!bankSelect)return;const show=bankSelect.style.display==='none';bankSelect.style.display=show?'block':'none';if(bankSummary)bankSummary.style.display=show?'none':'block';changeBank.textContent=show?L('使用原收款银行','Use Original Bank','Guna Bank Asal'):L('更改收款银行','Change Receiving Bank','Tukar Bank Penerima')});
 bankSelect?.addEventListener('change',()=>{const b=banks.find(z=>String(z.id)===String(bankSelect.value));if(bankSummary&&b)bankSummary.innerHTML=`<strong>${E(b.bank_name)} · ${E(b.account_name)} · ${E(b.account_number)}</strong>`});
 f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f);const selectedBank=d.get('bank')||defaultBank?.id||'';if(!selectedBank)return toast(L('没有可用的实际收款银行','No receiving bank is available','Tiada bank penerima tersedia'),true);const r=await sb.rpc('wl_finance_confirm_receipt_v376',{p_submission_id:id,p_bank_account_id:selectedBank,p_confirmed_amount:Number(d.get('amount')),p_reference:d.get('reference')||null,p_note:d.get('note')||null,p_confirmed_at:new Date(d.get('at')).toISOString()});if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error,true);closeModal();toast(L('已确认到账，等待客服入账','Receipt confirmed; awaiting staff allocation','Penerimaan disahkan'));await Promise.all([loadAll(),loadFinance()]);renderAllFinance()};
 $('#v37RejectReceipt').onclick=()=>v37RejectReceipt(id);
};
window.v33ConfirmReceipt=window.v37ViewReceipt;
window.v37RejectReceipt=id=>{
 modal(`<h2>${L('未收到／拒绝付款','Payment Not Received / Reject','Bayaran Tidak Diterima / Tolak')}</h2><form id="v37RejectReceiptForm"><div class="field"><label>${L('原因','Reason','Sebab')}</label><textarea name="reason" rows="4" required placeholder="${L('例如：银行没有收到、金额不符或收据无效','Example: not received, wrong amount or invalid receipt','Contoh: tidak diterima, jumlah salah atau resit tidak sah')}"></textarea></div><div style="display:flex;gap:10px"><button class="btn btn-danger">${L('确认拒绝','Confirm Reject','Sahkan Tolak')}</button><button type="button" class="btn btn-secondary" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div></form>`);
 $('#v37RejectReceiptForm').onsubmit=async e=>{e.preventDefault();const reason=new FormData(e.target).get('reason');let r;if(typeof window.rejectSubmission==='function'){try{await window.rejectSubmission(id,reason);return}catch(_){}}
 r=await sb.from('payment_submissions').update({status:'rejected',finance_status:'rejected',rejection_reason:reason,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message,true);closeModal();toast(L('付款已拒绝','Payment rejected','Bayaran ditolak'));await loadAll();renderAllFinance()};
};
function patchRoles(){const wrap=name=>{const old=window[name];if(typeof old!=='function'||old.__v33)return;const fn=function(){const r=old.apply(this,arguments);setTimeout(()=>{$$('select[name="role"],select[name="login_role"]').forEach(s=>{const current=s.value;s.innerHTML=`<option value="customer_service">${L('客服','Customer Service','Khidmat Pelanggan')}</option><option value="finance">${L('财务','Finance','Kewangan')}</option>${isSA()?'<option value="super_admin">Super Admin</option>':''}`;if([...s.options].some(o=>o.value===current))s.value=current})},0);return r};fn.__v33=true;window[name]=fn};['openStaff','openCompanyCreateLogin'].forEach(wrap)}
function applyVisibility(){const f=$('#v33FinanceGroup');if(f)f.classList.toggle('hidden',!canFinance());if(isFinance()){$$('[data-nav-group="system"]').forEach(x=>x.classList.add('hidden'));$$('[data-nav-group="loan"] button[data-section="loanApplications"],[data-nav-group="loan"] button[data-section="loanReview"],[data-nav-group="loan"] button[data-section="repayments"]').forEach(x=>x.classList.add('hidden'));const active=document.querySelector('.section.active');if(!active||['systemSettings','loanApplications','loanReview','repayments'].includes(active.id))setTimeout(()=>window.switchSection?.('financeDisbursements'),150)} }
async function boot(){cleanupLegacyBankUi();injectNav();bindFinanceNavigation();injectSections();patchRoles();applyVisibility();if(canFinance()){await loadFinance();renderAllFinance();try{sb.channel('v33-finance-live').on('postgres_changes',{event:'*',schema:'public',table:'company_bank_accounts'},async()=>{await loadFinance();renderAllFinance()}).on('postgres_changes',{event:'*',schema:'public',table:'finance_transactions'},async()=>{await loadFinance();renderAllFinance()}).on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},()=>setTimeout(async()=>{await loadAll();renderAllFinance()},200)).on('postgres_changes',{event:'*',schema:'public',table:'loans'},()=>setTimeout(async()=>{await loadAll();renderAllFinance()},200)).subscribe()}catch(e){console.warn(e)}}}
window.addEventListener('swk-language-applied',()=>setTimeout(()=>{cleanupLegacyBankUi();injectNav();bindFinanceNavigation();injectSections();applyVisibility();renderAllFinance()},20));
const oldRender=window.renderAll;window.renderAll=function(){const r=oldRender?.apply(this,arguments);setTimeout(()=>{cleanupLegacyBankUi();injectSections();bindFinanceNavigation();patchRoles();applyVisibility();renderAllFinance()},0);return r};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
})();

;

/* ===== v33.3-dashboard.js ===== */
/* WL Credit dashboard consolidation: notification center, date metrics and staff P/L */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const lang=()=>window.SWK_LANG?.current||'en';
const T=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
const n=v=>Number(v||0);
const fmt=v=>typeof window.money==='function'?window.money(n(v)):`MYR ${n(v).toFixed(2)}`;
const role=()=>typeof window.normalizedRole==='function'?window.normalizedRole(window.state?.staff?.role||''):String(window.state?.staff?.role||'').toLowerCase();
const isSA=()=>['super_admin','superadmin'].includes(role());
const isFinance=()=>role()==='finance';
const isCS=()=>role()==='customer_service';
const inDate=v=>typeof window.inRange==='function'?window.inRange(v):true;
const ownerOfLoan=l=>{
  const c=(window.state?.customers||[]).find(x=>String(x.id)===String(l.customer_id));
  return String(c?.owner_staff_id||c?.claimed_by||l.owner_staff_id||l.assigned_staff_id||'');
};
const customerOwner=c=>String(c?.owner_staff_id||c?.claimed_by||c?.assigned_staff_id||'');
const repaymentSplit=r=>{
  let principal=n(r.principal_amount??r.principal_paid??r.principal_component);
  let interest=n(r.interest_amount??r.interest_paid??r.interest_component);
  let overdue=n(r.overdue_amount??r.overdue_paid_amount??r.overdue_component);
  const amount=n(r.amount);
  if(principal+interest+overdue===0 && amount>0) interest=amount;
  return {principal,interest,overdue,total:principal+interest+overdue,amount};
};
function ensureLayout(){
  const dash=$('#dashboard'); if(!dash)return;
  let notify=$('#v333NotificationCenter');
  if(!notify){
    notify=document.createElement('div');notify.id='v333NotificationCenter';notify.className='card v333-notification-center';
    const filter=dash.querySelector('.date-filter-bar');dash.insertBefore(notify,filter||dash.firstChild);
  }
  const oldStats=dash.querySelector('.stats.pro-stats');
  const oldReport=dash.querySelector('.stats.report-stats');
  if(oldStats)oldStats.classList.add('hidden');
  if(oldReport)oldReport.classList.add('hidden');
  let stats=$('#v333DashboardStats');
  if(!stats){
    stats=document.createElement('div');stats.id='v333DashboardStats';stats.className='stats report-stats v333-dashboard-stats';
    const card=$('#v311StaffProfitCard');dash.insertBefore(stats,card||dash.lastChild);
  }
  const bank=dash.querySelector('.dashboard-bank-section');if(bank)bank.classList.add('hidden');
  const table=$('#v311StaffProfitCard');
  if(table){
    const head=table.querySelector('thead tr');
    if(head)head.innerHTML=`<th id="v333StaffCol"></th><th id="v333CustomersCol"></th><th id="v333DisbursedCol"></th><th id="v333PrincipalCol"></th><th id="v333InterestCol"></th><th id="v333OverdueCol"></th><th id="v333ReceivedCol"></th><th id="v333ProfitCol"></th>`;
  }
}
function notificationItems(){
  const apps=window.state?.applications||[];
  const loans=window.state?.loans||[];
  const subs=window.state?.submissions||[];
  const uid=String(window.state?.staff?.user_id||'');
  const pendingApps=apps.filter(a=>String(a.status||'pending')==='pending').length;
  const reviews=apps.filter(a=>String(a.status)==='under_review'&&(isSA()||isFinance()||String(a.owner_staff_id||a.claimed_by||a.assigned_staff_id||'')===uid)).length;
  const disb=loans.filter(l=>['approved','pending_disbursement','transfer_processing'].includes(String(l.finance_status||l.status||''))).length;
  const receipts=subs.filter(x=>['pending','pending_finance','awaiting_finance'].includes(String(x.finance_status||x.status||''))).length;
  const allocation=subs.filter(x=>['finance_confirmed','awaiting_staff','pending_allocation'].includes(String(x.finance_status||x.status||''))&&(isSA()||String(x.owner_staff_id||x.assigned_staff_id||'')===uid)).length;
  return [
    {label:T('新贷款申请','New loan applications','Permohonan pinjaman baharu'),count:pendingApps,section:'loanApplications'},
    {label:T('审核中的贷款','Loans under review','Pinjaman dalam semakan'),count:reviews,section:'loanReview'},
    {label:T('待财务放款','Pending disbursement','Menunggu pengeluaran'),count:disb,section:'financeDisbursements'},
    {label:T('待财务确认收款','Pending receipt verification','Menunggu pengesahan penerimaan'),count:receipts,section:'financeReceipts'},
    {label:T('待客服入账','Pending staff allocation','Menunggu pengagihan staf'),count:allocation,section:'paymentSubmissions'}
  ];
}
function renderNotifications(){
  const h=$('#v333NotificationCenter');if(!h)return;
  const items=notificationItems();
  h.innerHTML=`<div class="section-head"><div><h3>${T('通知中心','Notification Center','Pusat Pemberitahuan')}</h3><small class="muted">${T('点击项目可直接进入对应页面。','Click an item to open the related page.','Klik item untuk membuka halaman berkaitan.')}</small></div></div><div class="work-grid">${items.map(x=>`<button type="button" class="work-card v333-notice" data-section="${x.section}"><span>${x.label}</span><strong>${x.count}</strong></button>`).join('')}</div>`;
  h.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>window.switchSection?.(b.dataset.section));
}
function metrics(owner=''){
  const customers=(window.state?.customers||[]).filter(c=>!owner||customerOwner(c)===String(owner));
  const customerIds=new Set(customers.map(c=>String(c.id)));
  const allLoans=(window.state?.loans||[]).filter(l=>!owner||customerIds.has(String(l.customer_id))||ownerOfLoan(l)===String(owner));
  const loanIds=new Set(allLoans.map(l=>String(l.id)));
  const activeLoans=allLoans.filter(l=>!['paid','settled','completed','rejected','cancelled'].includes(String(l.status||'').toLowerCase()));
  const periodLoans=allLoans.filter(l=>inDate(l.finance_disbursed_at||l.disbursed_at||l.disbursement_date||l.created_at));
  const reps=(window.state?.repayments||[]).filter(r=>loanIds.has(String(r.loan_id))&&inDate(r.payment_date||r.created_at));
  const due=allLoans.filter(l=>inDate(l.due_date)).reduce((s,l)=>s+Math.max(n(l.current_due_amount||l.interest)-n(l.current_paid_amount),0),0);
  const split=reps.reduce((a,r)=>{const x=repaymentSplit(r);a.principal+=x.principal;a.interest+=x.interest;a.overdue+=x.overdue;a.classified+=x.total;a.collected+=x.amount||x.total;return a},{principal:0,interest:0,overdue:0,classified:0,collected:0});
  const disbursed=periodLoans.reduce((s,l)=>s+n(l.principal??l.principal_amount??l.loan_amount??l.approved_principal??l.amount),0);
  const periodCustomers=customers.filter(c=>inDate(c.created_at||c.approved_at)).length;
  const received=split.principal+split.interest+split.overdue;
  return {companyCustomers:customers.length,periodCustomers,activeLoans:activeLoans.length,due,collected:split.collected,disbursed,principal:split.principal,interest:split.interest,overdue:split.overdue,received,profit:received-disbursed};
}
function renderStats(){
  const owner=isCS()?String(window.state?.staff?.user_id||''):'';
  const m=metrics(owner);
  const h=$('#v333DashboardStats');if(!h)return;
  const cards=[
    [T('公司客户数量','Company Customers','Jumlah Pelanggan Syarikat'),m.companyCustomers,false],
    [T('进行中的贷款','Active Loans','Pinjaman Aktif'),m.activeLoans,false],
    [T('期间应收','Period Due','Perlu Diterima'),m.due,true],
    [T('期间已收','Period Collected','Diterima Dalam Tempoh'),m.collected,true],
    [T('共放款','Total Disbursed','Jumlah Dikeluarkan'),m.disbursed,true],
    [T('已收总额（本金+利息+逾期）','Total Received (Principal + Interest + Overdue)','Jumlah Diterima (Pokok + Faedah + Tertunggak)'),m.received,true],
    [T('盈亏（已收-共放款）','Profit / Loss (Received - Disbursed)','Untung / Rugi (Diterima - Dikeluarkan)'),m.profit,true]
  ];
  h.innerHTML=cards.map(([label,val,currency],i)=>`<div class="stat"><span>${label}</span><strong class="${i===6&&val<0?'danger-text':i===6&&val>0?'success-text':''}">${currency?fmt(val):val}</strong></div>`).join('');
}
function renderStaffTable(){
  const body=$('#v311StaffProfitRows');if(!body)return;
  const list=(isSA()||isFinance())?(window.state?.staffList||[]).filter(s=>String(s.role)==='customer_service'):[window.state?.staff].filter(Boolean);
  body.innerHTML=list.map(s=>{const id=String(s.user_id||s.auth_user_id||s.id||'');const m=metrics(id);return `<tr><td>${String(s.full_name||s.username||'-')}</td><td>${m.periodCustomers}</td><td>${fmt(m.disbursed)}</td><td>${fmt(m.principal)}</td><td>${fmt(m.interest)}</td><td>${fmt(m.overdue)}</td><td>${fmt(m.received)}</td><td class="${m.profit<0?'danger-text':m.profit>0?'success-text':''}">${fmt(m.profit)}</td></tr>`}).join('')||`<tr><td colspan="8" class="muted">${T('暂无记录','No records','Tiada rekod')}</td></tr>`;
  const labels=[T('客服','Staff','Staf'),T('客户数','Customers','Pelanggan'),T('共放款','Disbursed','Dikeluarkan'),T('已收本金','Principal','Pokok'),T('已收利息','Interest','Faedah'),T('已收逾期','Overdue','Tertunggak'),T('已收总额','Total Received','Jumlah Diterima'),T('盈亏','Profit / Loss','Untung / Rugi')];
  ['v333StaffCol','v333CustomersCol','v333DisbursedCol','v333PrincipalCol','v333InterestCol','v333OverdueCol','v333ReceivedCol','v333ProfitCol'].forEach((id,i)=>{const e=$('#'+id);if(e)e.textContent=labels[i]});
  const title=$('#v311StaffProfitTitle');if(title)title.textContent=T('客服盈亏报表','Staff Profit / Loss Report','Laporan Untung / Rugi Staf');
  const help=$('#v311StaffProfitHelp');if(help)help.textContent=T('全部数据根据上方日期范围计算。客服只看自己，财务和 Super Admin 查看全部客服。','All figures follow the selected date range. Customer service sees only their own data; Finance and Super Admin see all staff.','Semua angka mengikut julat tarikh. Khidmat pelanggan hanya melihat data sendiri; Kewangan dan Super Admin melihat semua staf.');
}
function renderAll(){ensureLayout();renderNotifications();renderStats();renderStaffTable()}
const old=window.renderStats;
window.renderStats=function(){try{old?.apply(this,arguments)}catch(e){console.warn(e)}setTimeout(renderAll,0)};
window.addEventListener('swk-language-applied',()=>setTimeout(renderAll,20));
document.addEventListener('click',e=>{if(e.target.closest?.('.date-preset,#applyDateRange,#refreshBtn'))setTimeout(renderAll,100)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(renderAll,500));else setTimeout(renderAll,500);
})();

;

/* ===== v33.5-permissions.js ===== */
/* WL Credit: grouped three-role permissions, loaded last. */
(function(){
  const T=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
  const LABELS={
    applications_view:['查看申请','View applications','Lihat permohonan'],
    applications_claim:['认领申请','Claim applications','Ambil permohonan'],
    applications_approve:['批准贷款申请','Approve loan applications','Lulus permohonan pinjaman'],
    applications_reject:['拒绝贷款申请','Reject loan applications','Tolak permohonan pinjaman'],
    customers_view:['查看客户','View customers','Lihat pelanggan'],
    customers_create:['新增客户','Create customers','Tambah pelanggan'],
    customers_edit:['编辑客户资料','Edit customer details','Edit maklumat pelanggan'],
    customers_files_view:['查看客户文件','View customer files','Lihat dokumen pelanggan'],
    customers_files_upload:['上传客户文件','Upload customer files','Muat naik dokumen pelanggan'],
    customers_files_delete:['删除客户文件','Delete customer files','Padam dokumen pelanggan'],
    loans_view:['查看贷款','View loans','Lihat pinjaman'],
    loans_create:['新增贷款','Create loans','Tambah pinjaman'],
    loans_edit:['编辑贷款资料','Edit loan details','Edit maklumat pinjaman'],
    payments_view:['查看付款','View payments','Lihat bayaran'],
    payments_approve_partial:['入账部分付款','Post partial payments','Rekod bayaran sebahagian'],
    payments_approve_renew:['入账续期付款','Post renewal payments','Rekod bayaran pembaharuan'],
    payments_approve_settle:['入账清账付款','Post settlement payments','Rekod bayaran penyelesaian'],
    payments_reject:['拒绝付款','Reject payments','Tolak bayaran'],
    banks_manage:['管理公司银行账户','Manage company bank accounts','Urus akaun bank syarikat'],
    banks_assign:['分配收款银行','Assign receiving banks','Tetapkan bank penerimaan'],
    contacts_manage:['管理联系方式','Manage contact methods','Urus kaedah hubungan'],
    contacts_assign:['分配联系方式','Assign contact methods','Tetapkan kaedah hubungan'],
    reports_view:['查看报表','View reports','Lihat laporan'],
    staff_manage:['管理员工账号','Manage staff accounts','Urus akaun kakitangan'],
    payroll_view:['查看薪资与人事','View payroll and HR','Lihat gaji dan HR'],
    payroll_manage:['管理薪资与人事','Manage payroll and HR','Urus gaji dan HR'],
    company_view:['查看公司管理','View company management','Lihat pengurusan syarikat'],
    company_manage:['管理公司资料','Manage company details','Urus maklumat syarikat'],
    settings_manage:['管理系统设置','Manage system settings','Urus tetapan sistem']
  };
  const GROUPS=[
    {title:['贷款申请','Loan applications','Permohonan pinjaman'],keys:['applications_view','applications_claim','applications_approve','applications_reject']},
    {title:['客户管理','Customer management','Pengurusan pelanggan'],keys:['customers_view','customers_create','customers_edit','customers_files_view','customers_files_upload','customers_files_delete']},
    {title:['贷款管理','Loan management','Pengurusan pinjaman'],keys:['loans_view','loans_create','loans_edit']},
    {title:['付款入账','Payment posting','Rekod bayaran'],keys:['payments_view','payments_approve_partial','payments_approve_renew','payments_approve_settle','payments_reject']},
    {title:['公司银行与联络方式','Company banks and contacts','Bank syarikat dan hubungan'],keys:['banks_manage','banks_assign','contacts_manage','contacts_assign']},
    {title:['员工、薪资与人事','Staff, payroll and HR','Kakitangan, gaji dan HR'],keys:['staff_manage','payroll_view','payroll_manage']},
    {title:['报表与公司管理','Reports and company management','Laporan dan pengurusan syarikat'],keys:['reports_view','company_view','company_manage','settings_manage']}
  ];
  const DEFAULTS={
    customer_service:{applications_view:true,applications_claim:true,applications_approve:true,applications_reject:true,customers_view:true,customers_create:true,customers_edit:true,customers_files_view:true,customers_files_upload:true,customers_files_delete:false,loans_view:true,loans_create:true,loans_edit:true,payments_view:true,payments_approve_partial:true,payments_approve_renew:true,payments_approve_settle:true,payments_reject:true,banks_manage:false,banks_assign:false,contacts_manage:false,contacts_assign:false,reports_view:true,staff_manage:false,payroll_view:false,payroll_manage:false,company_view:false,company_manage:false,settings_manage:false},
    finance:{applications_view:false,applications_claim:false,applications_approve:false,applications_reject:false,customers_view:true,customers_create:false,customers_edit:false,customers_files_view:true,customers_files_upload:false,customers_files_delete:false,loans_view:true,loans_create:false,loans_edit:false,payments_view:true,payments_approve_partial:false,payments_approve_renew:false,payments_approve_settle:false,payments_reject:false,banks_manage:true,banks_assign:true,contacts_manage:false,contacts_assign:false,reports_view:true,staff_manage:true,payroll_view:true,payroll_manage:true,company_view:true,company_manage:true,settings_manage:false}
  };
  const label=k=>{const x=LABELS[k]; return x?x[SWK_LANG.current==='zh'?0:SWK_LANG.current==='ms'?2:1]:k.replaceAll('_',' ')};
  const roleLabel=r=>r==='customer_service'?T('客服','Customer service','Khidmat pelanggan'):r==='finance'?T('财务','Finance','Kewangan'):T('Super Admin','Super Admin','Super Admin');
  function roleSummary(role){
    if(role==='customer_service')return T('管理自己负责的客户、贷款、申请及付款入账；不能管理银行、员工、薪资或系统设置。','Manages assigned customers, loans, applications and payment posting; no bank, staff, payroll or system administration.','Mengurus pelanggan, pinjaman, permohonan dan rekod bayaran sendiri; tiada pengurusan bank, kakitangan, gaji atau sistem.');
    if(role==='finance')return T('可查看全部客户与贷款，并管理银行、放款、收款核实、员工账号、薪资及人事；不能修改客户或贷款条件，也不能批准贷款或管理系统设置。','Can view all customers and loans and manage banks, disbursements, payment verification, staff accounts, payroll and HR; cannot edit customer or loan terms, approve loans, or manage system settings.','Boleh melihat semua pelanggan dan pinjaman serta mengurus bank, pengeluaran, pengesahan bayaran, akaun kakitangan, gaji dan HR; tidak boleh mengubah syarat pelanggan/pinjaman, meluluskan pinjaman atau mengurus tetapan sistem.');
    return T('拥有全部权限。','Has all permissions.','Mempunyai semua kebenaran.');
  }
  window.openStaff=function(userId){
    if(!requirePerm('staff_manage'))return;
    const existing=(state.staffList||[]).find(s=>String(s.user_id)===String(userId))||{};
    const editing=Boolean(userId), keys=Object.keys(PERMS);
    const roles=['customer_service','finance'].concat(isSuperAdmin()?['super_admin']:[]);
    const currentRole=roles.includes(existing.role)?existing.role:'customer_service';
    const options=roles.map(r=>`<option value="${r}" ${currentRole===r?'selected':''}>${esc(roleLabel(r))}</option>`).join('');
    const grouped=GROUPS.map(g=>{
      const items=g.keys.filter(k=>keys.includes(k)).map(k=>`<label class="permission-item"><input type="checkbox" name="perm_${k}" ${existing.permissions?.[k]?'checked':''}><span>${esc(label(k))}</span></label>`).join('');
      return `<section class="permission-group"><h4>${esc(g.title[SWK_LANG.current==='zh'?0:SWK_LANG.current==='ms'?2:1])}</h4><div class="permission-grid">${items}</div></section>`;
    }).join('');
    const title=editing?T('编辑员工账号与权限','Edit staff account and permissions','Edit akaun dan kebenaran kakitangan'):T('新增员工账号','Add staff account','Tambah akaun kakitangan');
    modal(`<h2>${title}</h2><form id="staffAccountForm"><div class="grid2"><div class="field"><label>${v11t('name')}</label><input name="full_name" required value="${esc(existing.full_name||'')}"></div><div class="field"><label>${T('员工账号','Username','Nama pengguna')}</label><input name="username" pattern="[a-z0-9_]{3,30}" required value="${esc(existing.username||'')}"></div><div class="field"><label>${editing?T('新密码（留空则不修改）','New password (leave blank to keep)','Kata laluan baharu (kosong untuk kekalkan)'):T('登录密码','Password','Kata laluan')}</label><input name="password" type="password" ${editing?'':'required'} minlength="8"></div><div class="field"><label>${T('职位','Role','Jawatan')}</label><select name="role" id="wlStaffRoleSelect">${options}</select></div></div><label><input name="is_active" type="checkbox" ${existing.is_active!==false?'checked':''}> ${T('启用','Active','Aktif')}</label><div class="role-permission-summary" id="wlRolePermissionSummary"></div><div class="section-head permission-heading"><h3>${T('权限设置','Permission settings','Tetapan kebenaran')}</h3><button type="button" class="btn btn-secondary" id="wlApplyRoleTemplate">${T('套用职位预设权限','Apply role defaults','Guna kebenaran lalai jawatan')}</button></div>${grouped}<p><button class="btn btn-primary">${v11t('save')}</button></p></form>`);
    const applyTemplate=()=>{
      const role=$('#wlStaffRoleSelect')?.value;
      const summary=$('#wlRolePermissionSummary'); if(summary)summary.textContent=roleSummary(role);
      if(role==='super_admin'){keys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el){el.checked=true;el.disabled=true}});return;}
      keys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el)el.disabled=false});
      const tpl=DEFAULTS[role]||{}; keys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el)el.checked=tpl[k]===true});
    };
    const roleSelect=$('#wlStaffRoleSelect');
    $('#wlApplyRoleTemplate').onclick=applyTemplate;
    roleSelect.onchange=applyTemplate;
    if(!editing)applyTemplate(); else {const s=$('#wlRolePermissionSummary');if(s)s.textContent=roleSummary(currentRole);if(currentRole==='super_admin')keys.forEach(k=>{const el=$(`[name="perm_${k}"]`);if(el)el.disabled=true});}
    $('#staffAccountForm').onsubmit=async e=>{
      e.preventDefault(); const f=new FormData(e.target), permissions={};
      keys.forEach(k=>permissions[k]=f.get(`perm_${k}`)==='on');
      const role=f.get('role'); if(role==='super_admin')keys.forEach(k=>permissions[k]=true);
      const payload={action:editing?'update_employee':'create_employee',user_id:userId||undefined,full_name:String(f.get('full_name')||'').trim(),username:String(f.get('username')||'').trim().toLowerCase(),password:String(f.get('password')||''),role,permissions,is_active:f.get('is_active')==='on'};
      const x=await invokeStaffAdmin(payload), data=x?.data||x;
      if(x?.error||data?.ok===false)return toast(x?.error?.message||data?.error||T('无法保存员工账号','Unable to save staff account','Tidak dapat menyimpan akaun kakitangan'),true);
      closeModal();toast(v11t('saved'));await loadAll();
    };
  };
})();

;

/* ===== v33.6-bank-assignment-permission.js ===== */
/* WL Credit V33.6 - bank assignment permission hotfix */
(function(){
  const canAssignBanks=()=>typeof isSuperAdmin==='function'&&isSuperAdmin() || (typeof has==='function'&&has('banks_assign'));
  const lang=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;

  async function openBankAssignment(bankId){
    if(!canAssignBanks()){
      toast(lang('你没有分配公司银行的权限。','You do not have permission to assign company banks.','Anda tiada kebenaran untuk menetapkan bank syarikat.'),true);
      return;
    }
    const bank=(state.banks||[]).find(x=>String(x.id)===String(bankId));
    if(!bank)return;
    const staff=(typeof v17ServiceStaff==='function'?v17ServiceStaff():(state.staffList||[]).filter(x=>x.role==='customer_service'&&x.is_active!==false));
    const assigned=new Set((state.staffBankAssignments||[]).filter(x=>String(x.bank_id)===String(bankId)).map(x=>String(x.staff_user_id)));
    modal(`<h2>${lang('分配客服到收款银行','Assign staff to receiving bank','Tetapkan staf kepada bank penerimaan')} · ${esc(bank.bank_name)}</h2>
      <p class="muted">${lang('勾选使用此银行的客服。一个客服可以分配多个银行，系统会把该客服旗下客户平均分配到所选银行。','Select the staff who use this bank. One staff member may use multiple banks; their customers will be distributed evenly.','Pilih staf yang menggunakan bank ini. Seorang staf boleh menggunakan beberapa bank dan pelanggan akan diagihkan secara seimbang.')}</p>
      <form id="v336StaffBankForm"><div class="checkbox-list">${staff.map(s=>`<label class="checkbox-row"><input type="checkbox" value="${s.user_id}" ${assigned.has(String(s.user_id))?'checked':''}><span>${esc((typeof v17StaffLabel==='function'?v17StaffLabel(s.user_id):(s.full_name||s.username||'-')))} · ${esc(s.username||'')}</span></label>`).join('')||`<p class="muted">${lang('没有可分配的客服','No customer-service staff available','Tiada staf khidmat pelanggan tersedia')}</p>`}</div><p><button class="btn btn-primary">${lang('保存分配','Save assignment','Simpan agihan')}</button></p></form>`);
    const form=document.querySelector('#v336StaffBankForm');
    if(!form)return;
    form.onsubmit=async e=>{
      e.preventDefault();
      const selected=[...form.querySelectorAll('input:checked')].map(x=>x.value);
      const r=await sb.rpc('wl_set_bank_staff_assignments',{p_bank_id:bankId,p_staff_ids:selected});
      if(r.error||r.data?.ok===false){
        toast(r.error?.message||r.data?.error||lang('保存失败','Save failed','Simpan gagal'),true);
        return;
      }
      closeModal();toast(lang('分配已保存','Assignment saved','Agihan disimpan'));
      await loadAll();
    };
  }

  window.manageCustomerBank=openBankAssignment;
  window.v33ManageBankAssignment=async function(companyBankId){
    if(!canAssignBanks()){
      toast(lang('你没有分配公司银行的权限。','You do not have permission to assign company banks.','Anda tiada kebenaran untuk menetapkan bank syarikat.'),true);
      return;
    }
    try{
      const b=(window.fstate?.banks||[]).find(x=>String(x.id)===String(companyBankId));
      if(!b)return;
      const legacy=typeof ensureLegacyBankFor==='function'?await ensureLegacyBankFor(b):null;
      if(!legacy)throw new Error(lang('无法建立对应的收款银行记录','Unable to create the receiving-bank record','Tidak dapat mencipta rekod bank penerimaan'));
      await openBankAssignment(legacy.id);
    }catch(e){toast(e.message||String(e),true)}
  };

  const oldRenderBanks=window.renderBanks;
  if(typeof oldRenderBanks==='function'){
    window.renderBanks=function(){
      oldRenderBanks.apply(this,arguments);
      document.querySelectorAll('[onclick^="v33ManageBankAssignment"],[onclick^="manageCustomerBank"]').forEach(btn=>{
        if(!canAssignBanks())btn.remove();
      });
    };
  }
})();

;

/* ===== v33.7-bank-capacity-assignment.js ===== */
/* WL Credit - bank capacity, automatic fill and manual customer assignment */
(function(){
  const L=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
  const canAssign=()=>typeof isSuperAdmin==='function'&&isSuperAdmin() || (typeof has==='function'&&has('banks_assign'));
  const safe=s=>typeof esc==='function'?esc(s??''):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const staffLabel=s=>String(s.full_name||s.username||s.staff_code||s.user_id||'-');
  const isCustomerService=s=>{
    const role=String(s?.role||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
    return ['customer_service','customerservice','cs'].includes(role);
  };

  const baseLoad=window.loadAll;
  if(typeof baseLoad==='function'){
    window.loadAll=async function(){
      await baseLoad.apply(this,arguments);
      try{
        const [rules,assignments,history]=await Promise.all([
          sb.from('bank_distribution_rules').select('*'),
          sb.from('bank_customer_assignments').select('*'),
          sb.from('bank_assignment_history').select('*').order('changed_at',{ascending:false}).limit(500)
        ]);
        state.bankDistributionRules=rules.error?[]:(rules.data||[]);
        state.bankCustomerAssignments=assignments.error?[]:(assignments.data||[]);
        state.bankAssignmentHistory=history.error?[]:(history.data||[]);
      }catch(_){
        state.bankDistributionRules=[];state.bankCustomerAssignments=[];state.bankAssignmentHistory=[];
      }
    };
  }

  function assignedCounts(bankId){
    const rows=(state.bankCustomerAssignments||[]).filter(a=>String(a.bank_id)===String(bankId));
    const byStaff=new Map();
    rows.forEach(a=>{
      const c=(state.customers||[]).find(x=>String(x.id)===String(a.customer_id));
      const sid=String(c?.owner_staff_id||'');
      if(sid)byStaff.set(sid,(byStaff.get(sid)||0)+1);
    });
    return {total:rows.length,byStaff};
  }

  function customerOptions(q){
    const term=String(q||'').trim().toLowerCase();
    return (state.customers||[]).filter(c=>{
      if(!term)return true;
      return [wlCustomerUsername(c),c.full_name,c.phone,c.id_number].some(v=>String(v||'').toLowerCase().includes(term));
    }).slice(0,50);
  }

  async function openCapacityAssignment(bankId){
    if(!canAssign())return toast(L('你没有分配公司银行的权限。','You do not have permission to assign company banks.','Anda tiada kebenaran menetapkan bank syarikat.'),true);
    const bank=(state.banks||[]).find(x=>String(x.id)===String(bankId));
    if(!bank)return toast(L('找不到银行。','Bank not found.','Bank tidak ditemui.'),true);
    // Always read real active customer-service accounts from staff_profiles.
    // Do not use v17ServiceStaff here because older builds also included Finance and generated generic labels such as 客服1/客服2.
    const staff=(state.staffList||[])
      .filter(x=>x.is_active!==false && isCustomerService(x))
      .sort((a,b)=>staffLabel(a).localeCompare(staffLabel(b), undefined, {numeric:true,sensitivity:'base'}));
    const selected=new Set((state.staffBankAssignments||[]).filter(x=>String(x.bank_id)===String(bankId)).map(x=>String(x.staff_user_id)));
    const rule=(state.bankDistributionRules||[]).find(x=>String(x.bank_id)===String(bankId))||{};
    const counts=assignedCounts(bankId);
    const manual=(state.bankCustomerAssignments||[]).filter(a=>String(a.bank_id)===String(bankId)&&a.assignment_mode==='manual').length;

    modal(`<h2>${L('银行客户分配','Bank Customer Allocation','Agihan Pelanggan Bank')} · ${safe(bank.bank_name)}</h2>
      <div class="card" style="margin-bottom:14px">
        <div class="grid2">
          <div class="field"><label>${L('目标客户数量','Target customer capacity','Sasaran bilangan pelanggan')}</label><input id="v337Capacity" type="number" min="0" step="1" value="${Number(rule.target_capacity||0)}"></div>
          <div><small class="muted">${L('当前分配','Currently assigned','Sedang diagihkan')}</small><h3 style="margin:4px 0">${counts.total} / ${Number(rule.target_capacity||0)||'∞'}</h3><small class="muted">${L('其中手动锁定','Manual locked','Dikunci manual')}: ${manual}</small></div>
        </div>
        <label><input id="v337AutoFill" type="checkbox" ${rule.auto_fill!==false?'checked':''}> ${L('未满时，新客户自动补入直到达到目标数量','Automatically fill new customers until the target is reached','Isi pelanggan baharu secara automatik sehingga sasaran dicapai')}</label>
      </div>
      <form id="v337CapacityForm">
        <h3>${L('参与平均分配的客服','Staff included in fair allocation','Staf dalam agihan seimbang')}</h3>
        <div class="checkbox-list">${staff.map(s=>`<label class="checkbox-row"><input type="checkbox" value="${s.user_id}" ${selected.has(String(s.user_id))?'checked':''}><span>${safe(staffLabel(s))} (${counts.byStaff.get(String(s.user_id))||0})</span></label>`).join('')||`<p class="muted">${L('没有客服账号','No customer-service staff','Tiada staf khidmat pelanggan')}</p>`}</div>
        <p><button class="btn btn-primary">${L('保存并重新平均分配','Save & Rebalance','Simpan & Agih Semula')}</button></p>
      </form>
      <hr>
      <h3>${L('单独指定客户','Assign one customer manually','Tetapkan seorang pelanggan')}</h3>
      <p class="muted">${L('手动指定后默认锁定，不会被下一次平均分配移走。','Manual assignments are locked by default and will not be moved by rebalancing.','Agihan manual dikunci secara lalai dan tidak akan dipindahkan oleh agihan semula.')}</p>
      <div class="field"><label>${L('搜索客户 ID／姓名／电话／IC','Search Customer ID / name / phone / IC','Cari ID pelanggan / nama / telefon / IC')}</label><input id="v337CustomerSearch"></div>
      <div class="field"><label>${L('选择客户','Select customer','Pilih pelanggan')}</label><select id="v337CustomerSelect"></select></div>
      <label><input id="v337LockCustomer" type="checkbox" checked> ${L('锁定此客户，不参与自动重新分配','Lock this customer from automatic redistribution','Kunci pelanggan ini daripada agihan automatik')}</label>
      <p><button id="v337ManualAssign" class="btn btn-secondary" type="button">${L('指定到此银行','Assign to this bank','Tetapkan ke bank ini')}</button> <button id="v337ManualRemove" class="btn btn-danger" type="button">${L('取消客户银行分配','Remove customer bank assignment','Batalkan agihan bank pelanggan')}</button></p>`);

    const search=document.querySelector('#v337CustomerSearch'),select=document.querySelector('#v337CustomerSelect');
    const fill=()=>{const list=customerOptions(search.value);select.innerHTML=list.map(c=>{const a=(state.bankCustomerAssignments||[]).find(x=>String(x.customer_id)===String(c.id));const b=(state.banks||[]).find(x=>String(x.id)===String(a?.bank_id||c.assigned_bank_id));return `<option value="${c.id}">${safe(wlCustomerUsername(c))} · ${safe(c.full_name)}${b?` · ${safe(b.bank_name)}`:''}</option>`}).join('')||`<option value="">${L('没有找到客户','No customer found','Pelanggan tidak ditemui')}</option>`};
    search.oninput=fill;fill();

    document.querySelector('#v337CapacityForm').onsubmit=async e=>{
      e.preventDefault();
      const capacity=Math.max(0,Number(document.querySelector('#v337Capacity').value||0));
      const staffIds=[...e.currentTarget.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value);
      const r=await sb.rpc('wl_configure_bank_distribution',{p_bank_id:bankId,p_target_capacity:capacity,p_staff_ids:staffIds,p_auto_fill:document.querySelector('#v337AutoFill').checked});
      if(r.error||r.data?.ok===false)return toast(r.error?.message||r.data?.error||L('保存失败','Save failed','Simpan gagal'),true);
      closeModal();toast(L('已保存并完成平均分配','Saved and rebalanced','Disimpan dan diagih semula'));await loadAll();
    };

    async function manualAssign(bankValue,force=false){
      const customerId=select.value;if(!customerId)return;
      const r=await sb.rpc('wl_manual_assign_customer_bank',{p_customer_id:customerId,p_bank_id:bankValue,p_lock:document.querySelector('#v337LockCustomer').checked,p_force:force});
      if(r.error)return toast(r.error.message,true);
      if(r.data?.ok===false&&r.data?.error==='capacity_reached'){
        const yes=confirm(L(`此银行已达到目标 ${r.data.target_capacity} 位。是否强制分配？`,`This bank has reached its target of ${r.data.target_capacity}. Force assignment?`,`Bank ini telah mencapai sasaran ${r.data.target_capacity}. Paksa agihan?`));
        if(yes)return manualAssign(bankValue,true);
        return;
      }
      if(r.data?.ok===false)return toast(r.data?.error||L('分配失败','Assignment failed','Agihan gagal'),true);
      closeModal();toast(bankValue?L('客户已单独分配','Customer assigned manually','Pelanggan ditetapkan secara manual'):L('客户银行分配已取消','Customer bank assignment removed','Agihan bank pelanggan dibatalkan'));await loadAll();
    }
    document.querySelector('#v337ManualAssign').onclick=()=>manualAssign(bankId,false);
    document.querySelector('#v337ManualRemove').onclick=()=>manualAssign(null,true);
  }

  window.manageCustomerBank=openCapacityAssignment;

  function normalizeAccount(v){return String(v||'').replace(/\s+/g,'').toLowerCase()}
  async function ensureReceivingBank(companyBank){
    let legacy=(state.banks||[]).find(x=>
      normalizeAccount(x.account_number)===normalizeAccount(companyBank.account_number) ||
      (String(x.bank_name||'').trim().toLowerCase()===String(companyBank.bank_name||'').trim().toLowerCase() &&
       String(x.account_name||'').trim().toLowerCase()===String(companyBank.account_name||'').trim().toLowerCase())
    );
    if(legacy)return legacy;
    const payload={
      bank_name:companyBank.bank_name,
      account_name:companyBank.account_name,
      account_number:companyBank.account_number,
      is_enabled:companyBank.is_enabled!==false
    };
    const r=await sb.from('receiving_banks').insert(payload).select('*').single();
    if(r.error)throw r.error;
    state.banks=[...(state.banks||[]),r.data];
    return r.data;
  }

  window.v33ManageBankAssignment=async function(companyBankId){
    if(!canAssign())return toast(L('你没有分配公司银行的权限。','You do not have permission to assign company banks.','Anda tiada kebenaran menetapkan bank syarikat.'),true);
    try{
      const companyBanks=(window.fstate&&Array.isArray(window.fstate.banks))?window.fstate.banks:[];
      let b=companyBanks.find(x=>String(x.id)===String(companyBankId));
      if(!b){
        const q=await sb.from('company_bank_accounts').select('*').eq('id',companyBankId).maybeSingle();
        if(q.error)throw q.error;
        b=q.data;
      }
      if(!b)throw new Error(L('找不到公司银行账户。','Company bank account not found.','Akaun bank syarikat tidak ditemui.'));
      const legacy=await ensureReceivingBank(b);
      await openCapacityAssignment(legacy.id);
    }catch(e){
      console.error('Bank assignment open failed',e);
      toast(e?.message||String(e),true);
    }
  };

  // Stable delegated handler: remains active after language/sidebar/table re-renders.
  document.addEventListener('click',function(e){
    const btn=e.target.closest?.('[data-bank-assignment-id]');
    if(!btn)return;
    e.preventDefault();
    e.stopPropagation();
    window.v33ManageBankAssignment(btn.dataset.bankAssignmentId);
  },true);
})();

;

/* ===== v33.8-loan-review-flow.js ===== */
/* WL Credit V33.8 - reliable claim -> loan review flow */
(()=>{
'use strict';
const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
const appState=()=>window.state||window.__wlState||null;
const uid=()=>String(appState()?.staff?.user_id||window.AppSession?.staff?.user_id||'');
const role=()=>norm(appState()?.staff?.role||window.AppSession?.staff?.role||'');
const allAccess=()=>['super_admin','superadmin'].includes(role());
const ownerId=a=>String(a?.owner_staff_id||a?.claimed_by||a?.assigned_staff_id||a?.review_staff_id||'');
const underReview=a=>['under_review','reviewing','in_review','claimed'].includes(norm(a?.status));
const isMine=a=>allAccess()||ownerId(a)===uid();
const esc2=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money2=v=>typeof window.money==='function'?window.money(Number(v||0)):`MYR ${Number(v||0).toFixed(2)}`;

function staffName(id){
 const s=(appState()?.staffList||[]).find(x=>String(x.user_id)===String(id));
 return s?.full_name||s?.username||s?.auth_email||'-';
}
function reviewList(){
 return (appState()?.applications||[]).filter(a=>underReview(a)&&isMine(a));
}
function setLocalClaim(row){
 if(!row)return;
 const sid=uid(), st=window.state?.staff||window.AppSession?.staff||{};
 row.status='under_review';
 row.owner_staff_id=sid;
 row.claimed_by=sid;
 row.assigned_staff_id=sid;
 row.claimed_by_name=st.full_name||st.username||st.auth_email||'';
 row.claimed_at=new Date().toISOString();
}

window.claimApplication=async function(id){
 if(typeof window.requirePerm==='function'&&!window.requirePerm('applications_claim'))return;
 const client=window.__wlSupabase||window.sb;
 if(!client?.from){
  window.toast?.(L('系统连接尚未准备好，请刷新后重试','System connection is not ready. Refresh and try again.','Sambungan sistem belum sedia. Muat semula dan cuba lagi.'),true);
  return;
 }
 const st=appState()?.staff||window.AppSession?.staff||{};
 const sid=String(st.user_id||'');
 if(!sid){
  window.toast?.(L('登录资料已失效，请重新登录','Your session has expired. Please sign in again.','Sesi telah tamat. Sila log masuk semula.'),true);
  return;
 }
 const btn=document.activeElement;
 if(btn?.tagName==='BUTTON'){btn.disabled=true;btn.dataset.oldText=btn.textContent;btn.textContent=L('处理中…','Processing…','Memproses…')}
 try{
  // First read the real database row. Claim eligibility is based on status, not whether an old owner field is null.
  const before=await client.from('loan_applications')
   .select('id,status,owner_staff_id,claimed_by,assigned_staff_id,claimed_by_name')
   .eq('id',id)
   .maybeSingle();
  if(before.error)throw before.error;
  if(!before.data)throw new Error(L('找不到这笔贷款申请','Loan application not found','Permohonan pinjaman tidak ditemui'));

  const currentStatus=norm(before.data.status||'pending');
  if(underReview(before.data)){
   const currentOwner=ownerId(before.data);
   const ownerLabel=before.data.claimed_by_name||staffName(currentOwner);
   if(currentOwner===sid){
    const local=(appState()?.applications||[]).find(x=>String(x.id)===String(id));
    if(local)Object.assign(local,before.data);
    window.switchSection?.('loanReview');
    setTimeout(()=>window.renderLoanReview?.(),0);
    window.toast?.(L('这笔申请已经在您的贷款审核中','This application is already in your Loan Review','Permohonan ini sudah berada dalam Semakan Pinjaman anda'));
    return;
   }
   throw new Error(L(`这笔申请已由 ${ownerLabel||'其他客服'} 接受审核`,`This application has been claimed by ${ownerLabel||'another staff member'}`,`Permohonan ini telah diambil oleh ${ownerLabel||'kakitangan lain'}`));
  }
  const claimable=['pending','new','submitted','application_submitted',''].includes(currentStatus);
  if(!claimable){
   throw new Error(L(`当前状态为「${before.data.status||'-'}」，不能接受审核`,`Current status is “${before.data.status||'-'}” and cannot be claimed`,`Status semasa ialah “${before.data.status||'-'}” dan tidak boleh diambil`));
  }

  const now=new Date().toISOString();
  const payload={
   status:'under_review',
   owner_staff_id:sid,
   claimed_by:sid,
   assigned_staff_id:sid,
   claimed_by_name:st.full_name||st.username||st.auth_email||'',
   claimed_at:now,
   updated_at:now
  };
  // Atomic status lock: only the row with the exact status we just read can be updated.
  let q=client.from('loan_applications').update(payload).eq('id',id);
  if(before.data.status==null) q=q.is('status',null); else q=q.eq('status',before.data.status);
  const result=await q.select('*').maybeSingle();
  if(result.error)throw result.error;
  if(!result.data){
   const latest=await client.from('loan_applications')
    .select('id,status,owner_staff_id,claimed_by,assigned_staff_id,claimed_by_name')
    .eq('id',id).maybeSingle();
   if(latest.error)throw latest.error;
   const latestOwner=ownerId(latest.data||{});
   const ownerLabel=latest.data?.claimed_by_name||staffName(latestOwner);
   if(underReview(latest.data||{})){
    throw new Error(L(`这笔申请刚刚已由 ${ownerLabel||'其他客服'} 接受审核`,`This application was just claimed by ${ownerLabel||'another staff member'}`,`Permohonan ini baru sahaja diambil oleh ${ownerLabel||'kakitangan lain'}`));
   }
   throw new Error(L('接受审核失败：资料状态已改变，请刷新后重试','Claim failed because the application changed. Refresh and try again.','Gagal mengambil permohonan kerana status telah berubah. Muat semula dan cuba lagi.'));
  }

  const row=(appState()?.applications||[]).find(x=>String(x.id)===String(id));
  if(row)Object.assign(row,result.data);
  window.renderApplications?.();
  window.renderNotifications?.();
  if(typeof window.loadAll==='function')await window.loadAll();
  window.switchSection?.('loanReview');
  setTimeout(()=>window.renderLoanReview?.(),0);
  window.toast?.(L('已成功接受审核','Application successfully claimed','Permohonan berjaya diambil'));
 }catch(err){
  window.toast?.(err?.message||String(err),true);
  if(typeof window.loadAll==='function')await window.loadAll();
 }finally{
  if(btn?.tagName==='BUTTON'){btn.disabled=false;btn.textContent=btn.dataset.oldText||L('接受审核','Claim & Review','Ambil Semakan');delete btn.dataset.oldText}
 }
};


function appClient(){return window.__wlSupabase||window.sb||null}
function fieldRow(label,value){return `<div class="kv"><span>${esc2(label)}</span><strong>${esc2(value||'-')}</strong></div>`}
function appDocEntries(a){
 const raw=a?.document_paths;
 if(!raw)return [];
 if(Array.isArray(raw))return raw.map((path,i)=>[`document_${i+1}`,path]).filter(([,v])=>v);
 if(typeof raw==='object')return Object.entries(raw).filter(([,v])=>v);
 return [];
}
window.v35OpenApplicationDoc=async function(id,key){
 try{
  const a=(appState()?.applications||[]).find(x=>String(x.id)===String(id));
  const path=a?.document_paths?.[key];
  if(!path)throw new Error(L('找不到文件','Document not found','Dokumen tidak ditemui'));
  const c=appClient();if(!c?.storage)throw new Error(L('系统连接尚未准备好','System connection is not ready','Sambungan sistem belum sedia'));
  const r=await c.storage.from('loan-applications').createSignedUrl(path,600);
  if(r.error)throw r.error;
  window.open(r.data.signedUrl,'_blank','noopener');
 }catch(e){window.toast?.(e?.message||String(e),true)}
};
window.openApplicationReview=async function(id){
 if(typeof window.requirePerm==='function'&&!window.requirePerm('applications_view'))return;
 const c=appClient();
 let a=(appState()?.applications||[]).find(x=>String(x.id)===String(id));
 try{
  if(c?.from){
   const r=await c.from('loan_applications').select('*').eq('id',id).maybeSingle();
   if(r.error)throw r.error;
   if(r.data){a=r.data;const local=(appState()?.applications||[]).find(x=>String(x.id)===String(id));if(local)Object.assign(local,r.data)}
  }
  if(!a)throw new Error(L('找不到这笔贷款申请','Loan application not found','Permohonan pinjaman tidak ditemui'));
  const docs=appDocEntries(a);
  const docHtml=docs.length?docs.map(([k,path])=>`<button class="btn btn-secondary" type="button" onclick="v35OpenApplicationDoc('${esc2(a.id)}','${esc2(k)}')">${esc2(k.replaceAll('_',' '))}</button>`).join(' '):`<span class="muted">${L('没有上传文件','No uploaded documents','Tiada dokumen dimuat naik')}</span>`;
  const status=L('审核中','Under Review','Dalam Semakan');
  const html=`<div class="profile-head"><div><h2>${esc2(a.application_code||a.id)} · ${esc2(a.full_name||'-')}</h2><p class="muted">${L('申请资料与上传文件','Application details and uploaded documents','Butiran permohonan dan dokumen')}</p></div><span class="badge warn">${status}</span></div>
  <div class="application-detail-grid">
   <div class="card"><h3>${L('个人资料','Personal details','Butiran peribadi')}</h3>${fieldRow('IC',a.id_number)}${fieldRow(L('电话','Phone','Telefon'),a.phone)}${fieldRow(L('地址','Address','Alamat'),a.address)}</div>
   <div class="card"><h3>${L('工作与收入','Employment and income','Pekerjaan dan pendapatan')}</h3>${fieldRow(L('职业','Occupation','Pekerjaan'),a.occupation)}${fieldRow(L('公司','Employer','Majikan'),a.employer)}${fieldRow(L('月薪','Monthly salary','Gaji bulanan'),a.monthly_salary!=null?money2(a.monthly_salary):'-')}${fieldRow(L('发薪日','Salary date','Tarikh gaji'),a.salary_date||a.salary_frequency)}</div>
   <div class="card"><h3>${L('紧急联系人 1','Emergency contact 1','Hubungan kecemasan 1')}</h3>${fieldRow(L('姓名','Name','Nama'),a.emergency_name)}${fieldRow(L('关系','Relationship','Hubungan'),a.emergency_relation)}${fieldRow(L('电话','Phone','Telefon'),a.emergency_phone)}</div>
   <div class="card"><h3>${L('紧急联系人 2','Emergency contact 2','Hubungan kecemasan 2')}</h3>${fieldRow(L('姓名','Name','Nama'),a.emergency_name_2)}${fieldRow(L('关系','Relationship','Hubungan'),a.emergency_relation_2)}${fieldRow(L('电话','Phone','Telefon'),a.emergency_phone_2)}</div>
   <div class="card"><h3>${L('客户银行资料','Customer bank details','Butiran bank pelanggan')}</h3>${fieldRow(L('银行','Bank','Bank'),a.bank_name||a.customer_bank_name)}${fieldRow(L('户口姓名','Account name','Nama akaun'),a.bank_account_name||a.account_name)}${fieldRow(L('户口号码','Account number','Nombor akaun'),a.bank_account_number||a.account_number)}</div>
   <div class="card"><h3>${L('贷款申请','Loan request','Permohonan pinjaman')}</h3>${fieldRow(L('申请金额','Requested amount','Jumlah dipohon'),money2(a.requested_amount))}${fieldRow(L('用途','Purpose','Tujuan'),a.purpose)}</div>
  </div>
  <div class="card" style="margin-top:16px"><h3>${L('身份证与申请文件','Identity and application documents','Dokumen pengenalan dan permohonan')}</h3><div class="document-actions">${docHtml}</div></div>
  ${a.status==='under_review'&&isMine(a)?`<div class="tabs" style="margin-top:16px">${typeof window.has==='function'&&window.has('applications_approve')?`<button class="btn btn-primary" onclick="approveApplication('${esc2(a.id)}')">${L('批准贷款','Approve Loan','Luluskan Pinjaman')}</button>`:''}${typeof window.has==='function'&&window.has('applications_reject')?`<button class="btn btn-danger" onclick="rejectApplication('${esc2(a.id)}')">${L('拒绝贷款','Reject Loan','Tolak Pinjaman')}</button>`:''}</div>`:''}`;
  if(typeof window.modal!=='function')throw new Error(L('无法打开资料窗口','Unable to open details window','Tidak dapat membuka tetingkap butiran'));
  window.modal(html);
 }catch(e){window.toast?.(e?.message||String(e),true)}
};

window.renderLoanReview=function(){
 const rows=document.querySelector('#loanReviewRows');if(!rows||!appState())return;
 const list=reviewList();
 window.__wlReviewApplications=list;
 rows.innerHTML=list.map(a=>`<tr>
  <td class="mono">${esc2(a.application_code||a.id)}</td>
  <td><button type="button" class="link-button" onclick="openApplicationReview('${a.id}')">${esc2(a.full_name||'-')}</button></td>
  <td>${esc2(a.phone||'-')}</td>
  <td>${money2(a.requested_amount)}</td>
  <td>${esc2(staffName(ownerId(a)))}</td>
  <td><span class="badge warn">${L('审核中','Under Review','Dalam Semakan')}</span></td>
  <td><button class="btn btn-primary" onclick="openApplicationReview('${a.id}')">${L('继续审核','Continue Review','Teruskan Semakan')}</button>${allAccess()?` <button class="btn btn-secondary" onclick="v323TransferReview('${a.id}')">${L('转移客服','Transfer','Pindah')}</button>`:''}</td>
 </tr>`).join('')||`<tr><td colspan="7" class="muted">${L('暂无待审核申请','No applications under review','Tiada permohonan dalam semakan')}</td></tr>`;
 const badge=document.querySelector('#navLoanReviewBadge');
 if(badge){badge.textContent=String(list.length);badge.classList.toggle('hidden',list.length===0)}
};

// Keep review page correct after any full render, language change, or realtime update.
const previousRenderAll=window.renderAll;
if(typeof previousRenderAll==='function')window.renderAll=function(){const r=previousRenderAll.apply(this,arguments);setTimeout(()=>window.renderLoanReview?.(),0);return r};
window.addEventListener('swk-language-applied',()=>setTimeout(()=>window.renderLoanReview?.(),20));
})();

;

/* ===== v36-application-disbursement-flow.js ===== */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>window.SWK_LANG?.current||'zh';
const L=(z,e,m)=>lang()==='zh'?z:lang()==='ms'?m:e;
const state=()=>window.__wlState||window.state||{};
const db=()=>window.sb||window.__wlSupabase||window.supabaseClient;
const toast=(m,b=false)=>window.toast?.(m,b);
const money=n=>`MYR ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const isOwner=a=>String(a.owner_staff_id||'')===String(state().staff?.user_id||'');
const allAccess=()=>['super_admin'].includes(String(state().staff?.role||''));
const appById=id=>(state().applications||[]).find(a=>String(a.id)===String(id));
const today=()=>new Date().toISOString().slice(0,10);
const plusDays=(d,n)=>{const x=new Date(`${d}T00:00:00`);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};

async function refreshApplications(){
 const c=db(); if(!c?.from)return;
 const r=await c.from('loan_applications').select('*').order('created_at',{ascending:false});
 if(!r.error){state().applications=r.data||[];window.renderLoanReview?.();renderFinanceApplications();renderPendingFinance();window.renderAll?.();}
}

function docsHtml(a){
 const d=a.document_paths||{};
 const entries=Object.entries(d).filter(([,v])=>v);
 return entries.length?entries.map(([k])=>`<button type="button" class="btn btn-secondary" data-v36-doc="${esc(k)}" data-app-id="${esc(a.id)}">${esc(k.replaceAll('_',' '))}</button>`).join(' '):`<span class="muted">${L('没有上传文件','No uploaded documents','Tiada dokumen dimuat naik')}</span>`;
}
function row(label,value){return `<div class="detail-row"><span>${esc(label)}</span><strong>${esc(value??'-')}</strong></div>`}

window.v36OpenReview=async id=>{
 const c=db(); if(!c?.from)return toast(L('系统连接尚未准备好','System connection is not ready','Sambungan sistem belum sedia'),true);
 const r=await c.from('loan_applications').select('*').eq('id',id).maybeSingle();
 if(r.error||!r.data)return toast(r.error?.message||L('找不到申请','Application not found','Permohonan tidak ditemui'),true);
 const a=r.data; const own=isOwner(a)||allAccess();
 const financeDone=a.status==='finance_disbursed';
 const canSubmit=a.status==='under_review'&&own;
 const body=`<div class="profile-head"><div><h2>${esc(a.application_code||a.id)} · ${esc(a.full_name||'-')}</h2><p class="muted">${L('申请资料、证件与出款流程','Application details, documents and disbursement workflow','Butiran, dokumen dan aliran pengeluaran')}</p></div><span class="badge warn">${esc(a.status||'-')}</span></div>
 <div class="application-detail-grid">
  <div class="card"><h3>${L('个人资料','Personal details','Butiran peribadi')}</h3>${row('IC',a.id_number)}${row(L('电话','Phone','Telefon'),a.phone)}${row(L('地址','Address','Alamat'),a.address)}</div>
  <div class="card"><h3>${L('工作与收入','Employment and income','Pekerjaan dan pendapatan')}</h3>${row(L('职业','Occupation','Pekerjaan'),a.occupation)}${row(L('公司','Employer','Majikan'),a.employer)}${row(L('月薪','Monthly salary','Gaji bulanan'),money(a.monthly_salary))}${row(L('发薪日','Salary date','Tarikh gaji'),a.salary_date||a.salary_frequency)}</div>
  <div class="card"><h3>${L('客户银行资料','Customer bank details','Butiran bank pelanggan')}</h3>${row(L('银行','Bank','Bank'),a.bank_name||a.customer_bank_name)}${row(L('户口姓名','Account name','Nama akaun'),a.bank_account_name||a.account_name)}${row(L('户口号码','Account number','Nombor akaun'),a.bank_account_number||a.account_number)}</div>
  <div class="card"><h3>${L('申请资料','Loan request','Permohonan pinjaman')}</h3>${row(L('申请金额','Requested amount','Jumlah dipohon'),money(a.requested_amount))}${row(L('用途','Purpose','Tujuan'),a.purpose)}</div>
 </div>
 <div class="card" style="margin-top:16px"><h3>${L('身份证与申请文件','Identity and application documents','Dokumen pengenalan dan permohonan')}</h3><div class="document-actions">${docsHtml(a)}</div></div>
 ${financeDone?`<div class="card" style="margin-top:16px"><h3>${L('财务出款资料','Finance disbursement details','Butiran pengeluaran kewangan')}</h3>${row(L('出款金额','Amount','Jumlah'),money(a.approved_principal))}${row(L('参考号','Reference','Rujukan'),a.finance_reference)}${row(L('出款时间','Transferred at','Masa pindahan'),a.finance_disbursed_at)}${row(L('备注','Note','Catatan'),a.finance_note)}${a.finance_proof_path?`<div class="detail-row"><span>${L('出款截图','Disbursement proof','Bukti pengeluaran')}</span><button type="button" class="btn btn-secondary" data-v36-proof="${esc(a.id)}">${L('查看／下载','View / Download','Lihat / Muat Turun')}</button></div>`:''}</div>`:''}
 <div class="tabs" style="margin-top:16px">
  ${canSubmit?`<button type="button" class="btn btn-primary" data-v36-submit-finance="${esc(a.id)}">${L('提交财务出款','Submit to Finance','Hantar kepada Kewangan')}</button>`:''}
  ${financeDone&&own?`<button type="button" class="btn btn-primary" data-v36-final-approve="${esc(a.id)}">${L('确认通过并建立账号','Confirm & Create Account','Sahkan & Cipta Akaun')}</button>`:''}
  ${own&&['under_review','pending_disbursement','finance_disbursed'].includes(a.status)?`<button type="button" class="btn btn-danger" onclick="rejectApplication('${esc(a.id)}')">${L('拒绝申请','Reject','Tolak')}</button>`:''}
 </div>`;
 window.modal?.(body);
};
window.openApplicationReview=window.v36OpenReview;

function openSubmitFinance(id){
 const a=appById(id); if(!a)return;
 const p=Number(a.approved_principal||a.requested_amount||0),i=Number(a.approved_interest||Math.round(p*.01*100)/100),s=Number(a.approved_settlement_amount||p+i);
 window.modal?.(`<h2>${L('提交财务出款','Submit to Finance','Hantar kepada Kewangan')}</h2><form id="v36SubmitFinanceForm">
 <div class="grid2"><div class="field"><label>${L('本金','Principal','Prinsipal')}</label><input name="principal" type="number" step="0.01" min="0.01" required value="${p}"></div><div class="field"><label>${L('利息','Interest','Faedah')}</label><input name="interest" type="number" step="0.01" min="0" required value="${i}"></div><div class="field"><label>${L('清账金额','Settlement amount','Jumlah penyelesaian')}</label><input name="settlement" type="number" step="0.01" min="0.01" required value="${s}"></div><div class="field"><label>${L('到期日期','Due date','Tarikh tamat')}</label><input name="due" type="date" required value="${a.approved_due_date||plusDays(today(),30)}"></div></div>
 <div class="field"><label>${L('备注','Notes','Catatan')}</label><textarea name="notes">${esc(a.approval_notes||'')}</textarea></div>
 <button class="btn btn-primary">${L('确认提交财务','Confirm Submit','Sahkan Hantar')}</button></form>`);
 $('#v36SubmitFinanceForm').onsubmit=async e=>{
  e.preventDefault();const f=new FormData(e.target),c=db();
  const payload={approved_principal:Number(f.get('principal')),approved_interest:Number(f.get('interest')),approved_settlement_amount:Number(f.get('settlement')),approved_due_date:f.get('due'),approval_notes:f.get('notes')||null,status:'pending_disbursement',submitted_to_finance_at:new Date().toISOString(),submitted_to_finance_by:state().staff.user_id};
  const r=await c.from('loan_applications').update(payload).eq('id',id).eq('status','under_review').select('id').maybeSingle();
  if(r.error||!r.data)return toast(r.error?.message||L('提交财务失败','Failed to submit to finance','Gagal hantar kepada kewangan'),true);
  window.closeModal?.();toast(L('已提交财务出款','Submitted to finance','Telah dihantar kepada kewangan'));await refreshApplications();window.switchSection?.('pendingFinance');
 };
}

async function openFinalApprove(id){
 const c=db(),a=appById(id);if(!a)return;
 window.modal?.(`<h2>${L('确认通过并建立账号','Confirm & Create Account','Sahkan & Cipta Akaun')}</h2><form id="v36FinalApproveForm"><div class="field"><label>${L('临时密码','Temporary password','Kata laluan sementara')}</label><input name="pin" minlength="4" required value="WL${Math.floor(100000+Math.random()*900000)}"></div><button class="btn btn-primary">${L('确认建立账号与贷款','Create Account & Loan','Cipta Akaun & Pinjaman')}</button></form>`);
 $('#v36FinalApproveForm').onsubmit=async e=>{
  e.preventDefault();const pin=new FormData(e.target).get('pin');
  const back=await c.from('loan_applications').update({status:'under_review'}).eq('id',id).eq('status','finance_disbursed').select('id').maybeSingle();
  if(back.error||!back.data)return toast(back.error?.message||L('状态更新失败','Status update failed','Kemas kini status gagal'),true);
  const x=await c.rpc('staff_approve_loan_application',{p_application_id:id,p_temp_pin:pin,p_principal:Number(a.approved_principal||0),p_interest:Number(a.approved_interest||0),p_settlement_amount:Number(a.approved_settlement_amount||0),p_disbursement_date:String(a.finance_disbursed_at||today()).slice(0,10),p_due_date:a.approved_due_date,p_notes:a.approval_notes||''});
  if(x.error||!x.data?.ok){await c.from('loan_applications').update({status:'finance_disbursed'}).eq('id',id);return toast(x.error?.message||x.data?.error||L('建立账号失败','Account creation failed','Cipta akaun gagal'),true)}
  const d=x.data;window.modal?.(`<h2>${L('账号与贷款已建立','Account and loan created','Akaun dan pinjaman dicipta')}</h2><p><strong>Username：</strong>${esc(window.normalizeCustomerUsername?normalizeCustomerUsername(d.username||d.customer_code):d.username||d.customer_code)}</p><p><strong>Password：</strong>${esc(d.temporary_password)}</p><p><strong>Loan ID：</strong>${esc(window.canonicalLoanId?canonicalLoanId(d.loan_id):d.loan_id)}</p>`);await window.loadAll?.();await refreshApplications();
 };
}

async function openDoc(id,key){
 const a=appById(id);const path=a?.document_paths?.[key];if(!path)return toast(L('找不到文件','Document not found','Dokumen tidak ditemui'),true);
 const r=await db().storage.from('loan-applications').createSignedUrl(path,600);if(r.error)return toast(r.error.message,true);window.open(r.data.signedUrl,'_blank','noopener');
}
async function openDisbursementProof(id){
 const a=appById(id)||(await db().from('loan_applications').select('finance_proof_path,finance_proof_name').eq('id',id).maybeSingle()).data;
 const path=a?.finance_proof_path;if(!path)return toast(L('找不到出款截图','Disbursement proof not found','Bukti pengeluaran tidak ditemui'),true);
 const r=await db().storage.from('disbursement-proofs').createSignedUrl(path,600,{download:a.finance_proof_name||true});
 if(r.error)return toast(r.error.message,true);window.open(r.data.signedUrl,'_blank','noopener');
}

async function loadFinanceApps(){
 const c=db();if(!c?.from)return [];
 const r=await c.from('loan_applications').select('*').in('status',['pending_disbursement','finance_disbursed']).order('submitted_to_finance_at',{ascending:false});
 return r.error?[]:(r.data||[]);
}
async function renderFinanceApplications(){
 const rows=$('#v33DisbursementRows');if(!rows)return;
 const list=await loadFinanceApps();
 rows.innerHTML=list.filter(a=>a.status==='pending_disbursement').map(a=>`<tr><td class="mono">${esc(a.application_code||a.id)}</td><td>${esc(a.full_name||'-')}</td><td>${esc(a.bank_name||a.customer_bank_name||'-')}<br><small>${esc(a.bank_account_name||a.account_name||'-')} · ${esc(a.bank_account_number||a.account_number||'-')}</small></td><td>${money(a.approved_principal)}</td><td><span class="badge warn">${L('待财务出款','Pending disbursement','Menunggu pengeluaran')}</span></td><td><button type="button" class="btn btn-primary" data-v36-finance-disburse="${esc(a.id)}">${L('处理出款','Process','Proses')}</button></td></tr>`).join('')||`<tr><td colspan="6">${L('暂无待放款申请','No pending applications','Tiada permohonan menunggu')}</td></tr>`;
 const b=$('#v33DisbursementBadge');if(b){const n=list.filter(a=>a.status==='pending_disbursement').length;b.textContent=n;b.classList.toggle('hidden',!n)}
}
async function openFinanceDisbursement(id){
 const c=db();const a=appById(id)||(await c.from('loan_applications').select('*').eq('id',id).maybeSingle()).data;
 const banks=(await c.from('company_bank_accounts').select('*').eq('is_enabled',true).eq('can_disburse',true)).data||[];
 if(!banks.length)return toast(L('没有可用的出款银行','No disbursement bank available','Tiada bank pengeluaran'),true);
 window.modal?.(`<h2>${L('财务出款','Finance Disbursement','Pengeluaran Kewangan')}</h2><p>${esc(a.full_name||'-')} · ${money(a.approved_principal)}</p><div class="card" style="margin-bottom:14px">${row(L('客户银行','Customer bank','Bank pelanggan'),a.bank_name||a.customer_bank_name)}${row(L('户口姓名','Account name','Nama akaun'),a.bank_account_name||a.account_name)}${row(L('户口号码','Account number','Nombor akaun'),a.bank_account_number||a.account_number)}</div><form id="v36FinanceForm"><div class="field"><label>${L('公司出款银行','Company bank','Bank syarikat')}</label><select name="bank">${banks.map(b=>`<option value="${esc(b.id)}">${esc(b.bank_name)} · ${esc(b.account_number)}</option>`).join('')}</select></div><div class="field"><label>${L('出款时间','Transfer time','Masa pindahan')}</label><input name="at" type="datetime-local" required></div><div class="field"><label>${L('参考号','Reference','Rujukan')}</label><input name="ref"></div><div class="field"><label>${L('出款截图','Disbursement screenshot','Tangkapan skrin pengeluaran')}</label><input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required><small class="muted">${L('必须上传，客服之后可以查看和下载发送给客户。','Required. Customer service can view and download it for the customer.','Wajib. Khidmat pelanggan boleh melihat dan memuat turun untuk pelanggan.')}</small></div><div class="field"><label>${L('备注','Note','Catatan')}</label><textarea name="note"></textarea></div><button class="btn btn-primary">${L('确认已出款','Confirm disbursed','Sahkan telah keluar')}</button></form>`);
 const f=$('#v36FinanceForm');f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f),at=new Date(d.get('at')).toISOString();
  const proof=d.get('proof');
  if(!(proof instanceof File)||!proof.size)return toast(L('请上传出款截图','Please upload the disbursement screenshot','Sila muat naik tangkapan skrin pengeluaran'),true);
  const safeName=String(proof.name||'proof').replace(/[^a-zA-Z0-9._-]+/g,'-');
  const proofPath=`${id}/${Date.now()}-${safeName}`;
  const up=await c.storage.from('disbursement-proofs').upload(proofPath,proof,{cacheControl:'3600',upsert:false,contentType:proof.type||undefined});
  if(up.error)return toast(up.error.message,true);
  const u=await c.from('loan_applications').update({status:'finance_disbursed',finance_bank_account_id:d.get('bank'),finance_reference:d.get('ref')||null,finance_note:d.get('note')||null,finance_disbursed_at:at,finance_disbursed_by:state().staff.user_id,finance_proof_path:proofPath,finance_proof_name:proof.name||safeName}).eq('id',id).eq('status','pending_disbursement').select('id').maybeSingle();
  if(u.error||!u.data)return toast(u.error?.message||L('出款更新失败','Disbursement update failed','Kemas kini pengeluaran gagal'),true);
  const tx=await c.from('finance_transactions').insert({bank_account_id:d.get('bank'),transaction_type:'outflow',source_type:'application_disbursement',source_id:id,amount:Number(a.approved_principal||0),transaction_at:at,reference_no:d.get('ref')||null,note:d.get('note')||null,created_by:state().staff.user_id});
  if(tx.error)toast(tx.error.message,true);
  window.closeModal?.();toast(L('财务已完成出款','Finance disbursement completed','Pengeluaran selesai'));await refreshApplications();await renderFinanceApplications();
 };
}


let pendingFinanceFilter='all';
function pendingFinanceList(){
 const st=state().staff||{},r=String(st.role||'');
 return (state().applications||[]).filter(a=>{
  if(!['pending_disbursement','finance_disbursed'].includes(String(a.status||'')))return false;
  if(r==='super_admin'||r==='finance')return true;
  return String(a.owner_staff_id||a.claimed_by||a.assigned_staff_id||'')===String(st.user_id||'');
 });
}
function fmtDate(v){if(!v)return '-';try{return new Date(v).toLocaleString()}catch{return String(v)}}
function applyPendingFinanceLabels(){
 const pairs={
  navPendingFinanceLabel:L('待财务出款','Pending Finance Disbursement','Menunggu Pengeluaran Kewangan'),
  navPaymentHistoryLabel:L('付款历史','Payment History','Sejarah Bayaran'),
  pendingFinanceTitle:L('待财务出款','Pending Finance Disbursement','Menunggu Pengeluaran Kewangan'),
  pendingFinanceHelp:L('显示已提交财务的申请；财务出款后由原客服确认并建立账号。','Applications submitted to finance. After disbursement, the original staff confirms and creates the account.','Permohonan dihantar kepada kewangan. Selepas pengeluaran, staf asal mengesahkan dan mencipta akaun.'),
  pfColApp:L('申请编号','Application ID','ID Permohonan'),pfColCustomer:L('客户','Customer','Pelanggan'),pfColPrincipal:L('本金','Principal','Prinsipal'),pfColBank:L('客户银行','Customer Bank','Bank Pelanggan'),pfColSubmitted:L('提交时间','Submitted At','Masa Dihantar'),pfColStatus:L('状态','Status','Status'),pfColAction:L('操作','Action','Tindakan')
 };
 Object.entries(pairs).forEach(([id,v])=>{const el=$('#'+id);if(el)el.textContent=v});
 const tabs=$$('#pendingFinanceTabs [data-pf-status]');
 const tl={all:L('全部','All','Semua'),pending_disbursement:L('等待财务出款','Waiting for Finance','Menunggu Kewangan'),finance_disbursed:L('财务已出款','Finance Disbursed','Kewangan Telah Bayar')};
 tabs.forEach(b=>b.textContent=tl[b.dataset.pfStatus]||b.textContent);
}
function renderPendingFinance(){
 const rows=$('#pendingFinanceRows');if(!rows)return;
 applyPendingFinanceLabels();
 const all=pendingFinanceList();
 const list=pendingFinanceFilter==='all'?all:all.filter(a=>a.status===pendingFinanceFilter);
 rows.innerHTML=list.map(a=>{
  const done=a.status==='finance_disbursed';
  const own=isOwner(a)||allAccess();
  const status=done?L('财务已出款，待客服确认','Finance disbursed — staff confirmation pending','Kewangan telah bayar — menunggu pengesahan staf'):L('等待财务出款','Waiting for finance disbursement','Menunggu pengeluaran kewangan');
  const action=done&&own?`<button class="btn btn-primary" data-v36-final-approve="${esc(a.id)}">${L('确认通过并建立账号','Confirm & Create Account','Sahkan & Cipta Akaun')}</button>`:`<button class="btn btn-secondary" data-v36-review="${esc(a.id)}">${L('查看详情','View Details','Lihat Butiran')}</button>`;
  return `<tr><td class="mono">${esc(a.application_code||a.id)}</td><td>${esc(a.full_name||'-')}</td><td>${money(a.approved_principal)}</td><td>${esc(a.bank_name||a.customer_bank_name||'-')}<br><small>${esc(a.bank_account_name||a.account_name||'-')} · ${esc(a.bank_account_number||a.account_number||'-')}</small></td><td>${esc(fmtDate(a.submitted_to_finance_at))}</td><td><span class="badge ${done?'success':'warn'}">${status}</span></td><td>${action}</td></tr>`;
 }).join('')||`<tr><td colspan="7">${L('暂无记录','No records','Tiada rekod')}</td></tr>`;
 const badge=$('#navPendingFinanceBadge');if(badge){const n=all.length;badge.textContent=n;badge.classList.toggle('hidden',!n)}
}
function financeDisbursedForCurrentStaff(){return pendingFinanceList().filter(a=>a.status==='finance_disbursed').length}
window.renderPendingFinance=renderPendingFinance;

// Stable desktop + mobile event delegation.
document.addEventListener('click',e=>{
 const review=e.target.closest('[data-v36-review],#loanReviewRows .link-button,#loanReviewRows .btn-primary');
 if(review&&(review.closest('#loanReviewRows')||review.closest('#pendingFinanceRows'))){e.preventDefault();e.stopImmediatePropagation();const id=review.dataset.v36Review||review.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];if(id)window.v36OpenReview(id);return}
 const sf=e.target.closest('[data-v36-submit-finance]');if(sf){e.preventDefault();openSubmitFinance(sf.dataset.v36SubmitFinance);return}
 const fa=e.target.closest('[data-v36-final-approve]');if(fa){e.preventDefault();openFinalApprove(fa.dataset.v36FinalApprove);return}
 const doc=e.target.closest('[data-v36-doc]');if(doc){e.preventDefault();openDoc(doc.dataset.appId,doc.dataset.v36Doc);return}
 const proof=e.target.closest('[data-v36-proof]');if(proof){e.preventDefault();openDisbursementProof(proof.dataset.v36Proof);return}
 const fd=e.target.closest('[data-v36-finance-disburse]');if(fd){e.preventDefault();openFinanceDisbursement(fd.dataset.v36FinanceDisburse);return}
 const tab=e.target.closest('[data-pf-status]');if(tab){e.preventDefault();pendingFinanceFilter=tab.dataset.pfStatus;$$('#pendingFinanceTabs [data-pf-status]').forEach(b=>{b.classList.toggle('btn-primary',b===tab);b.classList.toggle('btn-secondary',b!==tab)});renderPendingFinance();return}
},true);

const oldRender=window.renderLoanReview;
window.renderLoanReview=function(){oldRender?.();document.querySelectorAll('#loanReviewRows tr').forEach(tr=>{const code=tr.querySelector('td')?.textContent?.trim();const a=(state().applications||[]).find(x=>String(x.application_code||x.id)===code);if(!a)return;tr.querySelectorAll('.link-button,.btn-primary').forEach(b=>{b.removeAttribute('onclick');b.dataset.v36Review=a.id})})};

setInterval(()=>{if($('#financeDisbursements')&&!$('#financeDisbursements').classList.contains('hidden'))renderFinanceApplications();if($('#pendingFinance')?.classList.contains('active'))renderPendingFinance()},4000);
window.addEventListener('swk-language-applied',()=>{window.renderLoanReview?.();renderFinanceApplications();renderPendingFinance()});
setTimeout(()=>{window.renderLoanReview?.();renderFinanceApplications();renderPendingFinance()},800);
})();

;

/* ===== v37.2-staff-payment-allocation.js ===== */
/* WL Credit V37.2 - Finance confirmed payment -> staff allocation */
(()=>{
 const L=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
 const E=v=>typeof esc==='function'?esc(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const M=n=>typeof money==='function'?money(Number(n||0)):`MYR ${Number(n||0).toFixed(2)}`;
 const uid=()=>String(state?.staff?.user_id||'');
 const role=()=>String(state?.staff?.role||'').toLowerCase();
 const isAdmin=()=>['super_admin','superadmin'].includes(role());
 const customerFor=x=>{
   const loan=(state.loans||[]).find(l=>String(l.id)===String(x.loan_id))||x.loans||{};
   const customer=(state.customers||[]).find(c=>String(c.id)===String(x.customer_id||loan.customer_id))||x.customers||{};
   return {loan,customer};
 };
 const assignedToMe=x=>{
   if(isAdmin())return true;
   const {customer}=customerFor(x);
   return [x.owner_staff_id,x.assigned_staff_id,customer.owner_staff_id,customer.claimed_by].some(v=>String(v||'')===uid());
 };
 const financeConfirmed=x=>{const a=String(x.status||'').toLowerCase(),b=String(x.finance_status||'').toLowerCase();return ['finance_confirmed','awaiting_staff','pending_allocation','customer_service_processing'].includes(a)||['confirmed','finance_confirmed','awaiting_staff','pending_allocation','customer_service_processing'].includes(b)};
 function list(){return (state.submissions||[]).filter(x=>financeConfirmed(x)&&assignedToMe(x));}
 function label(status){
   const s=String(status||'').toLowerCase();
   if(financeConfirmed({status:s}))return L('待客服入账','Pending staff allocation','Menunggu kemasukan staf');
   if(['completed','approved'].includes(s))return L('已完成','Completed','Selesai');
   return E(status||'-');
 }
 function render(){
   const rows=document.querySelector('#staffAllocationRows'); if(!rows)return;
   const items=list();
   rows.innerHTML=items.map(x=>{const {loan,customer}=customerFor(x);return `<tr>
    <td>${x.created_at?new Date(x.created_at).toLocaleString():'-'}</td>
    <td>${E(customer.full_name||x.customers?.full_name||'-')}</td>
    <td>${E(typeof wlShortLoanId==='function'?wlShortLoanId(loan.loan_id||x.loans?.loan_id||''):(loan.loan_id||x.loans?.loan_id||'-'))}</td>
    <td>${M(x.finance_confirmed_amount??x.confirmed_amount??x.amount)}</td>
    <td><span class="badge ok">${L('财务已确认','Finance confirmed','Kewangan disahkan')}</span></td>
    <td>${x.finance_confirmed_at?new Date(x.finance_confirmed_at).toLocaleString():(x.reviewed_at?new Date(x.reviewed_at).toLocaleString():'-')}</td>
    <td><button class="btn btn-primary" data-v372-allocate="${E(x.id)}">${L('开始入账','Start allocation','Mula rekod')}</button></td>
   </tr>`}).join('')||`<tr><td colspan="7">${L('暂无待入账付款','No payments awaiting allocation','Tiada bayaran menunggu rekod')}</td></tr>`;
   const badge=document.querySelector('#navStaffAllocationBadge');
   if(badge){badge.textContent=items.length;badge.classList.toggle('hidden',items.length===0)}
 }
 async function receiptUrl(path){if(!path)return '';const r=await sb.storage.from('payment-receipts').createSignedUrl(path,1200);if(r.error)return '';return r.data?.signedUrl||''}
 async function openAllocation(id){
   const x=(state.submissions||[]).find(v=>String(v.id)===String(id)); if(!x)return toast(L('找不到付款申请','Payment submission not found','Permohonan bayaran tidak ditemui'),true);
   if(!financeConfirmed(x))return toast(L('此付款尚未由财务确认','This payment is not finance-confirmed','Bayaran ini belum disahkan kewangan'),true);
   if(!assignedToMe(x))return toast(L('这不是您负责的客户','This customer is not assigned to you','Pelanggan ini bukan di bawah anda'),true);
   const {loan,customer}=customerFor(x);
   const amount=Number(x.finance_confirmed_amount ?? x.amount ?? 0);
   const interestDue=Math.max(0,Number(loan.interest||loan.current_due_amount||0));
   const settlementDue=Math.max(0,Number(loan.settlement_amount||loan.remaining_amount||0));
   const overdueDue=Math.max(0,Number(loan.overdue_charge||0));
   const path=x.receipt_path||x.receipt_storage_path||''; const url=await receiptUrl(path);
   const receipt=url?`<a class="btn btn-secondary" target="_blank" rel="noopener" href="${E(url)}">${L('查看收据','View receipt','Lihat resit')}</a>`:`<span class="muted">${L('没有收据','No receipt','Tiada resit')}</span>`;
   modal(`<div class="section-head"><div><h2>${L('付款分类入账','Allocate Payment','Pecahkan Bayaran')}</h2><p class="muted">${L('财务已确认到账。分类总额必须等于实际到账金额。','Finance has confirmed receipt. Allocation must equal the confirmed amount.','Kewangan telah mengesahkan penerimaan. Jumlah pecahan mesti sama.')}</p></div><button class="btn btn-secondary" type="button" onclick="closeModal()">${L('关闭','Close','Tutup')}</button></div>
   <div class="grid2"><div class="card"><h3>${L('客户与贷款','Customer & Loan','Pelanggan & Pinjaman')}</h3><div class="detail-list">
    <p><span>${L('客户','Customer','Pelanggan')}</span><strong>${E(customer.full_name||'-')}</strong></p><p><span>${L('贷款编号','Loan ID','ID Pinjaman')}</span><strong>${E(loan.loan_id||'-')}</strong></p>
    <p><span>${L('本期利息','Current interest','Faedah semasa')}</span><strong>${M(interestDue)}</strong></p><p><span>${L('逾期应收','Overdue due','Tertunggak')}</span><strong>${M(overdueDue)}</strong></p><p><span>${L('清账金额','Settlement','Penyelesaian')}</span><strong>${M(settlementDue)}</strong></p></div></div>
    <div class="card"><h3>${L('财务确认资料','Finance Confirmation','Pengesahan Kewangan')}</h3><div class="detail-list"><p><span>${L('实际到账','Confirmed amount','Jumlah diterima')}</span><strong>${M(amount)}</strong></p><p><span>${L('到账时间','Received at','Diterima pada')}</span><strong>${x.finance_confirmed_at?new Date(x.finance_confirmed_at).toLocaleString():(x.reviewed_at?new Date(x.reviewed_at).toLocaleString():'-')}</strong></p><p><span>${L('银行参考号','Bank reference','Rujukan bank')}</span><strong>${E(x.finance_reference_no||x.bank_reference_no||x.review_note||'-')}</strong></p><p><span>${L('收据','Receipt','Resit')}</span><strong>${receipt}</strong></p></div></div></div>
   <form id="v372AllocationForm"><div class="grid2">
    <div class="field"><label>${L('本金金额','Principal amount','Jumlah prinsipal')}</label><input name="principal" type="number" min="0" step="0.01" value="0" required></div>
    <div class="field"><label>${L('利息金额','Interest amount','Jumlah faedah')}</label><input name="interest" type="number" min="0" step="0.01" value="${Math.min(amount,interestDue).toFixed(2)}" required></div>
    <div class="field"><label>${L('逾期金额','Overdue amount','Jumlah tertunggak')}</label><input name="overdue" type="number" min="0" step="0.01" value="0" required></div>
    <div class="field"><label>${L('分类总额','Allocated total','Jumlah pecahan')}</label><input id="v372Total" readonly value="${Math.min(amount,interestDue).toFixed(2)}"></div>
   </div>
   <label class="check-row"><input name="settle" type="checkbox"> ${L('本次完成清账','Settle this loan','Selesaikan pinjaman ini')}</label>
   <div id="v372NextCycle" class="grid2"><div class="field"><label>${L('下一期到期日','Next due date','Tarikh matang seterusnya')}</label><input name="next_due" type="datetime-local"></div><div class="field"><label>${L('下一期利息','Next interest','Faedah seterusnya')}</label><input name="next_interest" type="number" min="0" step="0.01" value="${interestDue.toFixed(2)}"></div><div class="field"><label>${L('下一期清账金额','Next settlement','Penyelesaian seterusnya')}</label><input name="next_settlement" type="number" min="0" step="0.01" value="${settlementDue.toFixed(2)}"></div><div class="field"><label>${L('备注','Note','Catatan')}</label><input name="note"></div></div>
   <p><button class="btn btn-primary">${L('确认入账','Confirm allocation','Sahkan rekod')}</button></p></form>`);
   const form=document.querySelector('#v372AllocationForm'), settle=form.elements.settle, next=document.querySelector('#v372NextCycle'), totalEl=document.querySelector('#v372Total');
   const d=new Date();d.setDate(d.getDate()+30);form.elements.next_due.value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
   const recalc=()=>{totalEl.value=(Number(form.elements.principal.value||0)+Number(form.elements.interest.value||0)+Number(form.elements.overdue.value||0)).toFixed(2)};
   ['principal','interest','overdue'].forEach(n=>form.elements[n].addEventListener('input',recalc)); settle.addEventListener('change',()=>{next.style.display=settle.checked?'none':''});
   form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form),principal=Number(f.get('principal')||0),interest=Number(f.get('interest')||0),overdue=Number(f.get('overdue')||0),total=principal+interest+overdue;
    if(Math.abs(total-amount)>=0.01)return toast(L(`分类总额必须等于 ${M(amount)}`,`Allocation must equal ${M(amount)}`,`Jumlah pecahan mesti sama dengan ${M(amount)}`),true);
    if(overdue>overdueDue+0.01)return toast(L('逾期金额不能超过尚欠逾期','Overdue amount exceeds outstanding overdue','Jumlah tertunggak melebihi baki'),true);
    const btn=e.submitter;btn.disabled=true;
    try{const r=await sb.rpc('wl_approve_payment_split_v372',{p_submission_id:id,p_principal_amount:principal,p_interest_amount:interest,p_overdue_amount:overdue,p_settle:f.get('settle')==='on',p_next_due_at:f.get('settle')==='on'?null:new Date(f.get('next_due')).toISOString(),p_next_interest:f.get('settle')==='on'?0:Number(f.get('next_interest')||0),p_next_settlement:f.get('settle')==='on'?0:Number(f.get('next_settlement')||0),p_note:f.get('note')||null});
     if(r.error||r.data?.ok===false)throw new Error(r.error?.message||r.data?.error||'Allocation failed');closeModal();toast(L('付款已完成入账','Payment allocation completed','Bayaran selesai direkod'));await loadAll();render();if(typeof updateAll==='function')updateAll();}
    catch(err){toast(err.message||String(err),true);btn.disabled=false}
   };
 }
 window.v372OpenAllocation=openAllocation;
 document.addEventListener('click',e=>{const b=e.target.closest('[data-v372-allocate]');if(b){e.preventDefault();openAllocation(b.dataset.v372Allocate)}const nav=e.target.closest('[data-section="staffPaymentAllocation"]');if(nav){setTimeout(()=>{const t=document.querySelector('#pageTitle');if(t)t.textContent=L('待客服入账','Pending Staff Allocation','Menunggu Rekod Staf');render()},0)}});
 const oldLoad=window.loadAll||loadAll; window.loadAll=loadAll=async function(){const r=await oldLoad.apply(this,arguments);render();return r};
 document.addEventListener('DOMContentLoaded',()=>setTimeout(render,500)); setInterval(()=>{if(document.querySelector('#staffPaymentAllocation.active'))render()},5000);
})();

;

/* ===== v37.3-payment-finance-gate.js ===== */
/* WL Credit V37.3 - Finance must confirm before customer service can post payment */
(()=>{
 const L=(zh,en,ms)=>SWK_LANG.current==='zh'?zh:SWK_LANG.current==='ms'?ms:en;
 const E=v=>typeof esc==='function'?esc(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const M=n=>typeof money==='function'?money(Number(n||0)):`MYR ${Number(n||0).toFixed(2)}`;
 const role=()=>String(state?.staff?.role||'').toLowerCase();
 const isFinance=()=>role()==='finance';
 const isAdmin=()=>['super_admin','superadmin'].includes(role());
 const statusOf=x=>String(x?.status||'pending').toLowerCase();
 const financeStatusOf=x=>String(x?.finance_status||'').toLowerCase();
 const isFinanceConfirmed=x=>['finance_confirmed','awaiting_staff','pending_allocation','customer_service_processing'].includes(statusOf(x))||['confirmed','finance_confirmed','awaiting_staff','pending_allocation','customer_service_processing'].includes(financeStatusOf(x));
 const isCompleted=x=>['completed','approved'].includes(statusOf(x));
 const isRejected=x=>['rejected','failed','cancelled'].includes(statusOf(x))||financeStatusOf(x)==='rejected';
 const isPendingFinance=x=>!isFinanceConfirmed(x)&&!isCompleted(x)&&!isRejected(x);
 function publicLabel(x){
   if(isCompleted(x))return L('已完成','Completed','Selesai');
   if(isRejected(x))return L('已拒绝','Rejected','Ditolak');
   if(isFinanceConfirmed(x))return L('财务已确认，待客服入账','Finance confirmed, awaiting staff','Kewangan disahkan, menunggu staf');
   return L('等待财务确认','Pending finance confirmation','Menunggu pengesahan kewangan');
 }
 function badgeClass(x){return isCompleted(x)?'ok':isRejected(x)?'danger':isFinanceConfirmed(x)?'info':'warn'}
 function receiptButton(x){return `<button class="btn btn-secondary" type="button" onclick="viewReceipt('${E(x.id)}')">${L('查看收据','View receipt','Lihat resit')}</button>`}
 function renderLockedSubmissions(){
   const host=document.querySelector('#submissionRows'); if(!host)return;
   const rows=state.filter==='all'?state.submissions:state.submissions.filter(x=>statusOf(x)===String(state.filter||'').toLowerCase());
   host.innerHTML=rows.map(x=>{
     const customer=x.customers?.full_name||'-';
     const loan=x.loans?.loan_id||'-';
     let action=`<span class="muted">${isPendingFinance(x)?L('财务确认后才能入账','Staff posting is enabled only after finance confirmation','Rekod staf hanya selepas pengesahan kewangan'):isFinanceConfirmed(x)?L('请到“待客服入账”处理','Process in “Pending Staff Allocation”','Proses di “Menunggu Rekod Staf”'):'-'}</span>`;
     if(isFinanceConfirmed(x))action=`<button class="btn btn-primary" type="button" data-v373-open-allocation="${E(x.id)}">${L('前往待客服入账','Go to staff allocation','Pergi ke rekod staf')}</button>`;
     return `<tr><td>${typeof date==='function'?date(x.created_at):new Date(x.created_at).toLocaleDateString()}</td><td>${E(customer)}</td><td>${E(typeof wlShortLoanId==='function'?wlShortLoanId(loan):loan)}</td><td>${M(x.amount)}</td><td>${receiptButton(x)}</td><td><span class="badge ${badgeClass(x)}">${publicLabel(x)}</span></td><td>${action}</td></tr>`;
   }).join('')||`<tr><td colspan="7" class="muted">${L('暂无付款申请','No payment submissions','Tiada permohonan bayaran')}</td></tr>`;
 }
 // Hard gate: old buttons/functions can never let CS bypass finance.
 window.approveSubmission=function(id){
   const x=(state.submissions||[]).find(v=>String(v.id)===String(id));
   if(!x)return toast(L('找不到付款申请','Payment submission not found','Permohonan bayaran tidak ditemui'),true);
   if(!isFinanceConfirmed(x))return toast(L('财务尚未确认收到款项，客服不能入账','Finance has not confirmed receipt. Staff cannot post this payment yet.','Kewangan belum mengesahkan penerimaan. Staf belum boleh merekod bayaran.'),true);
   if(typeof window.v372OpenAllocation==='function')return window.v372OpenAllocation(id);
   toast(L('请到“待客服入账”页面处理','Please process this in Pending Staff Allocation','Sila proses di halaman Menunggu Rekod Staf'),true);
 };
 const oldRenderAll=window.renderAll;
 window.renderAll=function(){const r=oldRenderAll?.apply(this,arguments);setTimeout(renderLockedSubmissions,0);return r};
 const oldLoad=window.loadAll||loadAll;
 window.loadAll=loadAll=async function(){const r=await oldLoad.apply(this,arguments);renderLockedSubmissions();return r};
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-v373-open-allocation]');
   if(b){e.preventDefault();if(typeof window.switchSection==='function')window.switchSection('staffPaymentAllocation');setTimeout(()=>window.v372OpenAllocation?.(b.dataset.v373OpenAllocation),80)}
   const nav=e.target.closest('[data-section="paymentSubmissions"]');if(nav)setTimeout(renderLockedSubmissions,20);
 });
 document.addEventListener('DOMContentLoaded',()=>setTimeout(renderLockedSubmissions,700));
 window.addEventListener('swk-language-applied',()=>setTimeout(renderLockedSubmissions,30));
})();

;

/* ===== v37.6-direct-finance-payment-flow.js ===== */
/* WL Credit V37.6 - Customer payment goes directly to Finance, then to assigned CS */
(()=>{
 const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
 const S=x=>String(x?.status||'pending').trim().toLowerCase();
 const F=x=>String(x?.finance_status||'').trim().toLowerCase();
 const role=()=>String(window.state?.staff?.role||'').trim().toLowerCase();
 const uid=()=>String(window.state?.staff?.user_id||'');
 const closed=x=>['completed','approved','rejected','failed','cancelled'].includes(S(x));
 const financeDone=x=>['finance_confirmed','awaiting_staff','staff_processing','customer_service_processing'].includes(S(x))||['confirmed','finance_confirmed','awaiting_staff','staff_processing','customer_service_processing'].includes(F(x));
 const pendingFinance=x=>!closed(x)&&!financeDone(x);
 const assignedToCurrentStaff=x=>{
   if(['super_admin','superadmin'].includes(role()))return true;
   const loan=(window.state?.loans||[]).find(v=>String(v.id)===String(x.loan_id))||x.loans||{};
   const customer=(window.state?.customers||[]).find(v=>String(v.id)===String(x.customer_id||loan.customer_id))||x.customers||{};
   return [x.owner_staff_id,x.assigned_staff_id,customer.owner_staff_id,customer.claimed_by].some(v=>String(v||'')===uid());
 };
 function normaliseLocalRows(){
   (window.state?.submissions||[]).forEach(x=>{
     if(!x.status)x.status='pending';
     if(pendingFinance(x)&&!x.finance_status)x.finance_status='pending_finance';
   });
 }
 function enforceCustomerServicePaymentPage(){
   if(role()!=='customer_service')return;
   const host=document.querySelector('#submissionRows');
   if(!host)return;
   host.querySelectorAll('tr').forEach((tr,i)=>{
     const x=(window.state?.submissions||[])[i];
     if(!x)return;
     const actionCell=tr.lastElementChild;
     if(!actionCell)return;
     if(pendingFinance(x)){
       actionCell.innerHTML=`<span class="badge warn">${L('等待财务确认','Pending Finance','Menunggu Kewangan')}</span>`;
     }else if(financeDone(x)&&assignedToCurrentStaff(x)){
       actionCell.innerHTML=`<button class="btn btn-primary" type="button" data-v376-open-allocation="${String(x.id).replace(/"/g,'&quot;')}">${L('开始入账','Start Posting','Mula Rekod')}</button>`;
     }
   });
 }
 function updateRoleBadges(){
   const rows=window.state?.submissions||[];
   const financeCount=rows.filter(pendingFinance).length;
   const staffCount=rows.filter(x=>financeDone(x)&&assignedToCurrentStaff(x)).length;
   const paymentBadge=document.querySelector('#navPaymentBadge');
   const staffBadge=document.querySelector('#navStaffAllocationBadge');
   if(paymentBadge&&role()==='customer_service'){
     paymentBadge.textContent=financeCount;
     paymentBadge.classList.toggle('hidden',financeCount===0);
   }
   if(staffBadge){
     staffBadge.textContent=staffCount;
     staffBadge.classList.toggle('hidden',staffCount===0);
   }
 }
 function apply(){normaliseLocalRows();setTimeout(()=>{enforceCustomerServicePaymentPage();updateRoleBadges()},0)}
 const oldRender=window.renderAll;
 window.renderAll=function(){const r=oldRender?.apply(this,arguments);apply();return r};
 document.addEventListener('click',e=>{
   const b=e.target.closest('[data-v376-open-allocation]');
   if(!b)return;
   e.preventDefault();
   window.switchSection?.('staffPaymentAllocation');
   setTimeout(()=>window.v372OpenAllocation?.(b.dataset.v376OpenAllocation),80);
 });
 document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,900));
 window.addEventListener('swk-language-applied',apply);
 // Realtime already reloads payment_submissions in admin.js. This listener only refreshes role badges quickly.
 try{window.sb?.channel?.('v376-direct-payment-flow').on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},()=>setTimeout(apply,350)).subscribe()}catch(_){ }
})();

;

/* ===== v41-dashboard-notifications.js ===== */
/* WL Credit V41 - single-owner dashboard, settings and notification counts */
(()=>{
  'use strict';
  if(window.__WL_V41_DASHBOARD__) return;
  window.__WL_V41_DASHBOARD__=true;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const state=()=>window.__wlState||window.state||{};
  const role=()=>String(state().staff?.role||'').toLowerCase();
  const isFinance=()=>role()==='finance';
  const isCS=()=>role()==='customer_service';
  const isSuper=()=>role()==='super_admin';
  const currentLang=()=>localStorage.getItem('wl_lang')||$('.lang-select')?.value||'zh';
  const T=(zh,en,ms)=>currentLang()==='en'?en:currentLang()==='ms'?ms:zh;
  const norm=v=>String(v||'').trim().toLowerCase();
  const allStatuses=x=>new Set([norm(x?.status),norm(x?.finance_status),norm(x?.payment_status),norm(x?.workflow_status)].filter(Boolean));
  const has=(x,vals)=>vals.some(v=>allStatuses(x).has(v));
  const uid=()=>String(state().staff?.user_id||'');
  const mine=x=>isSuper()||String(x?.owner_staff_id||x?.assigned_staff_id||x?.claimed_by||x?.staff_id||x?.customer_service_id||'')===uid();
  const count=(arr,fn)=>Array.isArray(arr)?arr.filter(fn).length:0;
  const last={payment:null,disbursement:null,review:null};

  function badgeValue(id){
    const el=document.getElementById(id);
    if(!el) return null;
    const raw=String(el.textContent||'').trim();
    if(!raw) return el.classList.contains('hidden')?0:null;
    const n=Number.parseInt(raw.replace(/[^0-9-]/g,''),10);
    return Number.isFinite(n)?Math.max(0,n):null;
  }
  function firstBadge(ids){
    for(const id of ids){const n=badgeValue(id);if(n!==null)return n;}
    return null;
  }
  function fallbackCounts(){
    const s=state();
    const apps=s.loanApplications||s.applications||[];
    const pays=s.paymentSubmissions||s.submissions||[];
    const loans=s.loans||[];
    const pendingFinancePay=count(pays,x=>has(x,['pending','submitted','pending_finance','waiting_finance_receive','finance_pending'])&&!has(x,['finance_confirmed','awaiting_staff','staff_processing','completed','approved','rejected']));
    const pendingStaffPay=count(pays,x=>mine(x)&&has(x,['finance_confirmed','awaiting_staff','staff_processing'])&&!has(x,['completed','approved','rejected']));
    const pendingDisb=count(apps,x=>has(x,['pending_disbursement','waiting_finance','approved_for_disbursement']))+count(loans,x=>has(x,['pending_disbursement','transfer_processing']));
    const financeDone=count(apps,x=>mine(x)&&has(x,['finance_disbursed']));
    const review=isCS()
      ? count(apps,x=>has(x,['pending','submitted']) || (has(x,['under_review']) && mine(x)))
      : count(apps,x=>has(x,['pending','submitted','under_review']));
    return {pendingFinancePay,pendingStaffPay,pendingDisb,financeDone,review};
  }
  function resolveCounts(){
    // V41.3: all dashboard cards use the same live state as the actual work pages.
    // Never read legacy sidebar badges because old scripts may briefly write stale zeroes.
    const f=fallbackCounts();
    const model=isFinance()
      ? {payment:f.pendingFinancePay,disbursement:f.pendingDisb,review:0}
      : isCS()
        ? {payment:f.pendingStaffPay,disbursement:f.pendingDisb+f.financeDone,review:f.review}
        : {payment:f.pendingFinancePay+f.pendingStaffPay,disbursement:f.pendingDisb+f.financeDone,review:f.review};
    for(const key of Object.keys(model)){
      const n=Number(model[key]);
      if(Number.isFinite(n)){
        model[key]=Math.max(0,n);
        last[key]=model[key];
      }else model[key]=last[key];
    }
    return model;
  }
  function openSection(id){
    const b=document.querySelector(`[data-section="${id}"]`);
    if(b){b.click();return;}
    window.switchSection?.(id);
  }
  function cardModel(){
    const c=resolveCounts();
    const n=k=>c[k]===null?'—':c[k];
    if(isFinance()) return [
      {k:'payment',label:T('付款','Payments','Bayaran'),sub:T('待确认收款','Receipts to verify','Penerimaan untuk disahkan'),n:n('payment'),section:'financeReceipts',icon:'↙'},
      {k:'disbursement',label:T('放款','Disbursements','Pengeluaran'),sub:T('待财务出款','Pending disbursement','Menunggu pengeluaran'),n:n('disbursement'),section:'financeDisbursements',icon:'↗'},
      {k:'review',label:T('审核','Reviews','Semakan'),sub:T('待处理财务申请','Finance requests','Permohonan kewangan'),n:n('review'),section:'myHr',icon:'✓'}
    ];
    if(isCS()) return [
      {k:'payment',label:T('付款','Payments','Bayaran'),sub:T('财务已确认，待客服入账','Finance confirmed, awaiting posting','Disahkan kewangan, menunggu catatan'),n:n('payment'),section:'staffPaymentAllocation',icon:'↙'},
      {k:'disbursement',label:T('放款','Disbursements','Pengeluaran'),sub:T('待财务出款／已出款待确认','Pending / disbursed','Menunggu / telah dibayar'),n:n('disbursement'),section:'pendingFinance',icon:'↗'},
      {k:'review',label:T('审核','Reviews','Semakan'),sub:T('贷款申请与审核中','Applications and reviews','Permohonan dan semakan'),n:n('review'),section:'loanReview',icon:'✓'}
    ];
    return [
      {k:'payment',label:T('付款','Payments','Bayaran'),sub:T('全公司待处理付款','All pending payments','Semua bayaran tertunggak'),n:n('payment'),section:'financeReceipts',icon:'↙'},
      {k:'disbursement',label:T('放款','Disbursements','Pengeluaran'),sub:T('全公司待处理放款','All pending disbursements','Semua pengeluaran tertunggak'),n:n('disbursement'),section:'financeDisbursements',icon:'↗'},
      {k:'review',label:T('审核','Reviews','Semakan'),sub:T('全公司待处理审核','All pending reviews','Semua semakan tertunggak'),n:n('review'),section:'loanReview',icon:'✓'}
    ];
  }
  function removeLegacyNotificationCenters(){
    ['#v333WorkNotice','#workflowNoticeCenter','#v32WorkflowNoticeCenter','#bankHistoryCard'].forEach(sel=>$(sel)?.remove());
    // Defensive cleanup for legacy cards inserted without a stable id.
    $$('#dashboard .card').forEach(card=>{
      const title=norm(card.querySelector('h3')?.textContent);
      if(['通知中心','notification center','pusat pemberitahuan','pusat notifikasi','公司收款账号历史','公司收款賬號歷史','collection account history','sejarah akaun kutipan'].includes(title)) card.remove();
    });
  }
  function renderOverview(){
    const dash=$('#dashboard');if(!dash)return;
    let wrap=$('#v41RoleOverview');
    if(!wrap){
      $('#v39RoleOverview')?.remove();
      wrap=document.createElement('section');wrap.id='v41RoleOverview';wrap.className='v39-overview';
      dash.insertBefore(wrap,dash.firstElementChild);
      wrap.innerHTML='<div class="v41-card-grid v39-task-grid"></div>';
    }
    const grid=$('.v41-card-grid',wrap);if(!grid)return;
    const cards=cardModel();
    cards.forEach(x=>{
      let card=grid.querySelector(`[data-v41-key="${x.k}"]`);
      if(!card){
        card=document.createElement('button');card.type='button';card.className=`v39-task-card v39-${x.k}`;card.dataset.v41Key=x.k;grid.appendChild(card);
      }
      card.dataset.v41Section=x.section;
      const old=card.querySelector('strong')?.textContent;
      const next=String(x.n);
      card.innerHTML=`<span class="v39-task-icon">${x.icon}</span><span class="v391-card-bell">🔔</span><span class="v39-task-copy"><b>${x.label}</b><small>${x.sub}</small></span><strong>${old===next?old:next}</strong><span class="v39-arrow">›</span>`;
      card.onclick=()=>openSection(card.dataset.v41Section);
    });
  }
  function simplifyTopbar(){
    ['#notificationBell','#refreshBtn','#staffLogout'].forEach(s=>{const e=$(s);if(e)e.style.display='none'});
    const select=$('.topbar .lang-select');if(select)select.style.display='none';
    const sound=$('#enableSoundBtn');if(sound){sound.classList.add('v391-sound-toggle');sound.title=T('通知声音','Notification sound','Bunyi pemberitahuan');sound.setAttribute('aria-label',sound.title);sound.textContent=/enable|开启|hidup/i.test(sound.textContent||'')?'🔇':'🔊';}
  }
  function showSettings(){
    $$('.section').forEach(s=>s.classList.remove('active'));
    $('#localSettings')?.classList.add('active');
    $$('#nav [data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section==='localSettings'));
    const title=$('#pageTitle');if(title)title.textContent=T('设置','Settings','Tetapan');
    document.body.classList.remove('sidebar-open');
  }
  function ensureSettings(){
    const nav=$('#nav');if(!nav)return;
    let btn=$('[data-section="localSettings"]',nav);
    if(!btn){btn=document.createElement('button');btn.type='button';btn.dataset.section='localSettings';btn.className='nav-single v391-settings-nav';nav.appendChild(btn);btn.onclick=showSettings;}
    btn.textContent='⚙ '+T('设置','Settings','Tetapan');
    let section=$('#localSettings');if(!section){section=document.createElement('section');section.id='localSettings';section.className='section';$('main.main')?.appendChild(section);}
    const st=state().staff||{};
    section.innerHTML=`<div class="v391-settings-card"><div class="section-head"><div><h2>${T('设置','Settings','Tetapan')}</h2><p class="muted">${T('语言、通知声音与账户操作。','Language, notification sound and account actions.','Bahasa, bunyi pemberitahuan dan tindakan akaun.')}</p></div></div><div class="v391-setting-row"><div><b>${T('语言','Language','Bahasa')}</b></div><select id="v41Language"><option value="en">English</option><option value="zh">简体中文</option><option value="ms">Bahasa Melayu</option></select></div><div class="v391-setting-row"><div><b>${T('通知声音','Notification sound','Bunyi pemberitahuan')}</b></div><button id="v41Sound" class="v391-setting-button" type="button">🔊</button></div><div class="v391-account-box"><span>${T('登录账号','Signed-in account','Akaun log masuk')}</span><b>${st.username||st.full_name||'-'}</b><span>${T('职位','Role','Jawatan')}</span><b>${isFinance()?T('财务','Finance','Kewangan'):isCS()?T('客服','Customer Service','Khidmat Pelanggan'):T('超级管理员','Super Admin','Super Admin')}</b></div><button id="v41Logout" class="btn btn-danger v391-logout" type="button">${T('退出登录','Log out','Log keluar')}</button></div>`;
    const l=$('#v41Language');if(l){l.value=currentLang();l.onchange=()=>{localStorage.setItem('wl_lang',l.value);const original=$('.lang-select');if(original){original.value=l.value;original.dispatchEvent(new Event('change',{bubbles:true}));}schedule();};}
    $('#v41Sound')?.addEventListener('click',()=>$('#enableSoundBtn')?.click());
    $('#v41Logout')?.addEventListener('click',()=>$('#staffLogout')?.click());
  }
  function sidebar(){
    const nav=$('#nav');if(!nav)return;
    $('[data-section="myWork"]',nav)?.remove();$('#navMyWork')?.remove();
    const d=$('[data-section="dashboard"]',nav);if(d)d.textContent=T('总览','Overview','Ringkasan');
  }
  let liveTimer=0, liveChannel=null, liveBusy=false;
  async function syncLoanApplications(){
    if(liveBusy)return;
    const client=window.sb;
    if(!client?.from)return;
    liveBusy=true;
    try{
      const q=await client.from('loan_applications').select('*').order('created_at',{ascending:false});
      if(!q.error){
        const s=state();
        s.loanApplications=q.data||[];
        s.applications=s.loanApplications;
        renderOverview();
        try{window.renderLoanApplications?.()}catch(_){}
        try{window.renderLoanReview?.()}catch(_){}
        try{window.renderFinanceApplications?.()}catch(_){}
      }
    }catch(e){console.warn('V41 loan application sync failed',e)}finally{liveBusy=false}
  }
  function ensureLoanApplicationLive(){
    const client=window.sb;
    const staffId=uid();
    if(!client?.channel||!staffId)return;
    if(!liveChannel){
      try{
        liveChannel=client.channel('v414-loan-applications-'+staffId+'-'+Date.now())
          .on('postgres_changes',{event:'*',schema:'public',table:'loan_applications'},()=>setTimeout(syncLoanApplications,120))
          .subscribe(status=>{if(status==='SUBSCRIBED')syncLoanApplications()});
      }catch(e){console.warn('V41 realtime subscribe failed',e)}
    }
    if(!liveTimer)liveTimer=setInterval(syncLoanApplications,5000);
  }
  function authenticated(){return !!state().staff && !document.getElementById('adminApp')?.classList.contains('hidden');}
  function refresh(){if(!authenticated())return;simplifyTopbar();sidebar();ensureSettings();removeLegacyNotificationCenters();renderOverview();ensureLoanApplicationLive();}
  let timer=0;function schedule(){if(!authenticated())return;clearTimeout(timer);timer=setTimeout(refresh,120);}
  let started=false;function start(){if(started||!authenticated())return;started=true;refresh();setInterval(()=>{if(authenticated())refresh()},5000);}
  document.addEventListener('DOMContentLoaded',()=>{start();const wait=setInterval(()=>{if(authenticated()){clearInterval(wait);start()}},800)});
  document.addEventListener('change',e=>{if(e.target.matches('.lang-select'))schedule()});
  document.addEventListener('click',()=>{if(authenticated())start()},{passive:true});
})();

;

/* ===== v41.5-existing-customer-loan-finance-hr.js ===== */
(()=>{
 const $=s=>document.querySelector(s), esc=s=>window.esc?window.esc(s):String(s??''), L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
 const oldOpenLoan=window.openLoan;
 window.openLoan=function(id,customerId){
   if(id)return oldOpenLoan?.(id,customerId);
   if(!window.requirePerm?.('loans_create'))return;
   const c=(window.state?.customers||[]).find(x=>String(x.id)===String(customerId))||(window.state?.customers||[]).find(x=>x.is_active);
   if(!c)return window.toast?.(L('请先选择客户','Please select a customer','Sila pilih pelanggan'),true);
   window.modal?.(`<h2>${L('新增贷款（待财务出款）','New Loan (Pending Finance)','Pinjaman Baharu (Menunggu Kewangan)')}</h2>
   <div class="card" style="margin-bottom:14px"><strong>${esc(wlCustomerUsername(c))} · ${esc(c.full_name||'')}</strong><br><small>${L('此贷款不会立即生效；财务完成转账后才建立正式贷款。','This loan activates only after Finance completes the transfer.','Pinjaman hanya aktif selepas Kewangan selesai memindah.')}</small></div>
   <form id="v415ExistingLoanForm"><div class="grid2">
    <div class="field"><label>${L('本金','Principal','Prinsipal')}</label><input name="principal" type="number" min="0.01" step="0.01" required></div>
    <div class="field"><label>${L('利息','Interest','Faedah')}</label><input name="interest" type="number" min="0" step="0.01" required></div>
    <div class="field"><label>${L('清账金额','Settlement Amount','Jumlah Penyelesaian')}</label><input name="settlement" type="number" min="0.01" step="0.01" required></div>
    <div class="field"><label>${L('到期日期','Due Date','Tarikh Tamat')}</label><input name="due" type="date" required></div>
   </div><div class="field"><label>${L('备注','Notes','Catatan')}</label><textarea name="notes"></textarea></div>
   <button class="btn btn-primary">${L('提交财务出款','Submit to Finance','Hantar kepada Kewangan')}</button></form>`);
   const f=$('#v415ExistingLoanForm');
   f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;const d=new FormData(f);
    const r=await window.sb.rpc('wl_submit_existing_customer_loan',{p_customer_id:c.id,p_principal:Number(d.get('principal')),p_interest:Number(d.get('interest')),p_settlement:Number(d.get('settlement')),p_due_date:d.get('due'),p_notes:d.get('notes')||null});
    b.disabled=false;if(r.error||!r.data?.ok)return window.toast?.(r.error?.message||r.data?.error||'Submit failed',true);
    window.closeModal?.();window.toast?.(L('已提交财务出款','Submitted to Finance','Dihantar kepada Kewangan'));await window.loadAll?.();window.showSection?.('pendingFinance');
   };
 };

 const oldFinance=window.openFinanceDisbursement;
 window.openFinanceDisbursement=async function(id){
   const app=(window.state?.applications||[]).find(x=>String(x.id)===String(id));
   if(app?.application_type!=='existing_customer_new_loan')return oldFinance?.(id);
   const banks=(await window.sb.from('company_bank_accounts').select('*').eq('is_enabled',true).eq('can_disburse',true)).data||[];
   if(!banks.length)return window.toast?.(L('没有可用的出款银行','No disbursement bank available','Tiada bank pengeluaran'),true);
   window.modal?.(`<h2>${L('现有客户新贷款出款','Existing Customer Loan Disbursement','Pengeluaran Pinjaman Pelanggan Sedia Ada')}</h2>
   <p><strong>${esc(app.full_name||'-')}</strong> · MYR ${Number(app.approved_principal||0).toFixed(2)}</p>
   <form id="v415FinanceForm"><div class="field"><label>${L('公司出款银行','Company Bank','Bank Syarikat')}</label><select name="bank" required>${banks.map(x=>`<option value="${esc(x.id)}">${esc(x.bank_name)} · ${esc(x.account_number)}</option>`).join('')}</select></div>
   <div class="grid2"><div class="field"><label>${L('出款时间','Transfer Time','Masa Pindahan')}</label><input name="at" type="datetime-local" required></div><div class="field"><label>${L('参考号','Reference','Rujukan')}</label><input name="ref"></div></div>
   <div class="field"><label>${L('备注','Notes','Catatan')}</label><textarea name="note"></textarea></div><button class="btn btn-primary">${L('确认已出款并启用贷款','Confirm Transfer & Activate Loan','Sahkan & Aktifkan Pinjaman')}</button></form>`);
   const f=$('#v415FinanceForm');f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
   f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;const d=new FormData(f);
    const r=await window.sb.rpc('wl_finance_disburse_existing_customer_loan',{p_application_id:id,p_bank_account_id:d.get('bank'),p_reference:d.get('ref')||null,p_disbursed_at:new Date(d.get('at')).toISOString(),p_note:d.get('note')||null});
    b.disabled=false;if(r.error||!r.data?.ok)return window.toast?.(r.error?.message||r.data?.error||'Disbursement failed',true);
    window.closeModal?.();window.toast?.(L('已出款，贷款已正式生效','Disbursed; loan is now active','Telah dibayar; pinjaman kini aktif'));await window.loadAll?.();
   };
 };
})();

;

/* ===== v41.6-finance-superadmin-access.js ===== */
/* WL Credit V41.6 — Finance access aligned with Super Admin
   Finance can use all normal operating/admin features, including Company Management,
   staff, payroll, reports, banks, contacts and system settings.
   Telegram Bot and Danger Zone remain Super Admin only.
*/
(function(){
  'use strict';

  function role(){
    try{return String(window.state?.staff?.role||'').trim().toLowerCase().replaceAll('-','_').replaceAll(' ','_')}catch(_){return ''}
  }
  function isFinance(){return role()==='finance'}
  function isOwner(){return ['super_admin','superadmin'].includes(role())}
  function managementRole(){return isOwner()||isFinance()}

  // Make Finance an administrator for every ordinary permission check.
  try{
    const oldHas=window.has;
    window.has=function(permission){
      if(isFinance())return true;
      return typeof oldHas==='function'?oldHas(permission):isOwner();
    };
    window.requirePerm=function(permission){
      if(window.has(permission))return true;
      if(typeof window.toast==='function')window.toast(typeof window.tr==='function'?window.tr('noAccess'):'No access',true);
      return false;
    };
  }catch(e){console.warn('V41.6 permission override',e)}

  // Include Finance in every historical Company Management gate left by older patches.
  try{if(typeof window.v3013ManagementAllowed==='function')window.v3013ManagementAllowed=()=>managementRole()}catch(_){ }
  try{if(typeof window.v311IsManagement==='function')window.v311IsManagement=()=>managementRole()}catch(_){ }
  try{if(typeof window.v310EffectiveRole==='function'){
    const old=window.v310EffectiveRole;
    window.v310EffectiveRole=()=>isFinance()?'finance':old();
  }}catch(_){ }

  const previousRender=window.renderCompanyManagement;
  window.renderCompanyManagement=function(){
    if(!managementRole())return typeof previousRender==='function'?previousRender():undefined;
    const current=window.state?.staff?.role;
    const oldAdmin=window.isAdminLevel;
    try{
      if(typeof window.isAdminLevel==='function')window.isAdminLevel=()=>true;
      // Keep isSuperAdmin false for Finance, so Telegram/Danger remain protected.
      if(typeof previousRender==='function')return previousRender();
    }finally{
      if(window.state?.staff)window.state.staff.role=current;
      if(oldAdmin)window.isAdminLevel=oldAdmin;
    }
  };

  function enforceUI(){
    if(!managementRole())return;

    // Company Management must always be visible to Finance and Super Admin.
    const companyGroup=document.querySelector('[data-nav-group="company"]');
    const companyBtn=document.querySelector('#nav [data-section="companyManagement"]');
    if(companyGroup)companyGroup.classList.remove('hidden');
    if(companyBtn)companyBtn.classList.remove('hidden');

    // Finance receives report/audit access like Super Admin.
    const auditBtn=document.querySelector('#nav [data-section="auditLogs"]');
    if(auditBtn)auditBtn.classList.remove('hidden');

    // Explicit exceptions: only Super Admin can see or use Telegram/Danger.
    const telegramTab=document.querySelector('#telegramTabBtn');
    const dangerTab=document.querySelector('#dangerTabBtn');
    const telegramPanel=document.querySelector('#telegramSettings');
    const dangerPanel=document.querySelector('#dangerSettings');
    if(isFinance()){
      [telegramTab,dangerTab,telegramPanel,dangerPanel].forEach(el=>el?.classList.add('hidden'));
      if(telegramPanel?.classList.contains('active')||dangerPanel?.classList.contains('active')){
        document.querySelector('[data-tab="contactSettings"]')?.click();
      }
    }

    // Update any stale access message left by old renderers.
    const root=document.querySelector('#companyManagement');
    if(root?.classList.contains('active') && /Manager and Super Admin|经理和超级管理员|Pengurus dan Super Admin/i.test(root.textContent||'')){
      setTimeout(()=>window.renderCompanyManagement?.(),0);
    }
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('#nav [data-section="companyManagement"]'))setTimeout(()=>window.renderCompanyManagement?.(),0);
  });
  function appReady(){return managementRole() && !document.getElementById('adminApp')?.classList.contains('hidden');}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(appReady())enforceUI()},80));
  window.addEventListener('swk-language-applied',()=>setTimeout(()=>{if(appReady())enforceUI()},30));
  setInterval(()=>{if(appReady())enforceUI()},4000);
})();

;

/* ===== v42.1-finance-company-access.js ===== */
/* WL Credit V42.1 — final Finance Company Management access gate.
   Finance receives normal Super Admin operating access, except Telegram Bot and Danger Zone. */
(function(){
  'use strict';
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  const currentRole=()=>norm(window.state?.staff?.role);
  const isFinance=()=>currentRole()==='finance';
  const isOwner=()=>['super_admin','superadmin'].includes(currentRole());
  const canManageCompany=()=>isFinance()||isOwner();

  function hideRestricted(){
    if(!isFinance())return;
    ['#telegramTabBtn','#dangerTabBtn','#telegramSettings','#dangerSettings',
     '[data-section="telegramBot"]','[data-section="dangerZone"]',
     '[data-tab="telegram"]','[data-tab="danger"]']
      .forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.add('hidden')));
  }

  function allowCompanyUI(){
    if(!canManageCompany())return;
    document.querySelector('[data-nav-group="company"]')?.classList.remove('hidden');
    document.querySelectorAll('[data-section="companyManagement"]').forEach(el=>el.classList.remove('hidden'));
    hideRestricted();
  }

  const originalHas=window.has;
  window.has=function(permission){
    if(isFinance()){
      if(['telegram_bot_manage','telegram_manage','danger_zone_manage','danger_manage','system_reset'].includes(String(permission||'')))return false;
      return true;
    }
    return typeof originalHas==='function'?originalHas(permission):isOwner();
  };

  function patchRenderer(){
    const original=window.renderCompanyManagement;
    if(typeof original!=='function'||original.__v421)return;
    const wrapped=function(){
      if(!canManageCompany())return original.apply(this,arguments);
      const oldAdmin=window.isAdminLevel;
      const oldRole=window.state?.staff?.role;
      try{
        window.isAdminLevel=()=>true;
        const result=original.apply(this,arguments);
        setTimeout(()=>{allowCompanyUI();hideRestricted();},0);
        return result;
      } finally {
        if(window.state?.staff)window.state.staff.role=oldRole;
        if(oldAdmin)window.isAdminLevel=oldAdmin;
      }
    };
    wrapped.__v421=true;
    window.renderCompanyManagement=wrapped;
  }

  function repairAccessMessage(){
    if(!canManageCompany())return;
    const root=document.querySelector('#companyManagement');
    if(!root)return;
    const text=root.textContent||'';
    if(/Manager and Super Admin|经理和超级管理员|經理和超級管理員|Pengurus dan Super Admin/i.test(text)){
      patchRenderer();
      window.renderCompanyManagement?.();
    }
  }

  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-section="companyManagement"]')){
      setTimeout(()=>{patchRenderer();window.renderCompanyManagement?.();repairAccessMessage();},0);
    }
  },true);

  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{patchRenderer();allowCompanyUI();repairAccessMessage();},100));
  window.addEventListener('swk-language-applied',()=>setTimeout(()=>{patchRenderer();allowCompanyUI();repairAccessMessage();},20));
  setInterval(()=>{if(canManageCompany()){patchRenderer();allowCompanyUI();repairAccessMessage();}},1500);
})();

;

/* ===== v42.2-trilingual-ui.js ===== */
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

/* ===== v43-final-structure.js ===== */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const lang=()=>window.SWK_LANG?.current||localStorage.getItem('wl_lang')||'zh';
  const T=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
  const money=n=>`MYR ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const dateKey=v=>String(v||'').slice(0,10);
  const monthKey=v=>String(v||'').slice(0,7);

  function removeOtherIncome(){
    $('[data-company-tab="incomePanel"]')?.remove();
    $('#incomePanel')?.remove();
    // Remove any dynamically generated legacy tab.
    $$('[data-company-tab="income"]').forEach(x=>x.remove());
    const subtitle=$('#companyManagement > p.muted, #companyManagement .section-head + p.muted');
    if(subtitle) subtitle.textContent=T(
      '员工、人事、工资、开销、出勤与预支工资。',
      'Employees, HR, payroll, expenses, attendance and salary advances.',
      'Pekerja, HR, gaji, perbelanjaan, kehadiran dan pendahuluan gaji.'
    );
  }

  function unifyStaffReport(){
    const title=$('#v311StaffProfitTitle');
    if(title) title.textContent=T('客服业绩报表','Customer Service Performance Report','Laporan Prestasi Khidmat Pelanggan');
    const help=$('#v311StaffProfitHelp');
    if(help) help.textContent=T(
      '根据上方日期范围计算；同时显示客服放款、收款与盈亏。',
      'Calculated from the selected date range, including disbursements, collections and profit/loss.',
      'Dikira mengikut julat tarikh dipilih, termasuk pengeluaran, kutipan dan untung/rugi.'
    );
    // Remove the duplicated standalone report page/menu, leaving one report only.
    $('[data-section="staffPerformance"]')?.remove();
    $('#staffPerformance')?.remove();
  }

  function pendingAdvance(x){
    const s=String(x?.status||'').toLowerCase();
    return ['pending','submitted','requested','waiting','under_review'].includes(s);
  }
  function unpaidPayroll(x){
    const s=String(x?.payment_status||x?.status||'').toLowerCase();
    return !['paid','completed','cancelled','rejected'].includes(s);
  }
  function openCompanyTab(tab){
    const nav=$('[data-section="companyManagement"]');
    if(nav) nav.click(); else window.switchSection?.('companyManagement');
    setTimeout(()=>{
      const b=$(`.company-tab[data-company-tab="${tab}"]`);
      if(b) b.click();
      else {
        $$('.company-panel').forEach(p=>p.classList.remove('active'));
        $('#'+tab)?.classList.add('active');
      }
    },100);
  }

  function addSalaryCard(){
    const staff=window.state?.staff||{};
    const role=String(staff.role||'').toLowerCase();
    if(!['finance','super_admin','admin'].includes(role)){
      $('[data-v43-key="salary"]')?.remove();
      return;
    }
    const grid=$('#v41RoleOverview .v41-card-grid, #v41RoleOverview .v39-task-grid, #v39RoleOverview .v39-task-grid');
    if(!grid)return;
    grid.classList.add('v43-four-cards');
    let card=$('[data-v43-key="salary"]',grid);
    if(!card){
      card=document.createElement('button');
      card.type='button';
      card.className='v39-task-card v39-salary';
      card.dataset.v43Key='salary';
      grid.appendChild(card);
    }
    const advances=(window.state?.salaryAdvances||[]).filter(pendingAdvance).length;
    const payroll=(window.state?.payroll||[]).filter(unpaidPayroll).length;
    const count=advances+payroll;
    card.innerHTML=`<span class="v39-task-icon">💼</span><span class="v391-card-bell">🔔</span><span class="v39-task-copy"><b>${T('工资','Payroll','Gaji')}</b><small>${T('预支工资／发放工资','Salary advances / payroll','Pendahuluan / pembayaran gaji')}</small></span><strong>${count}</strong><span class="v39-arrow">›</span>`;
    card.onclick=()=>openCompanyTab(advances>0?'advancesPanel':'payrollPanel');
  }

  function outstandingAdvanceTotal(month){
    return (window.state?.salaryAdvances||[]).filter(x=>{
      const s=String(x.status||'').toLowerCase();
      if(['rejected','cancelled','deducted','settled','completed'].includes(s))return false;
      return monthKey(x.advance_date||x.created_at)===month;
    }).reduce((a,x)=>a+Number(x.amount||0),0);
  }

  function replaceProfitLoss(){
    window.renderProfitLoss=function(){
      const root=$('#profitLossPreview'); if(!root)return;
      const month=$('#plMonth')?.value||new Date().toISOString().slice(0,7);
      const inMonth=v=>monthKey(v)===month;
      const collections=(window.state?.repayments||[]).filter(x=>inMonth(x.payment_date||x.created_at)).reduce((a,x)=>a+Number(x.amount||0),0);
      const disbursements=(window.state?.loans||[]).filter(x=>inMonth(x.disbursement_date||x.finance_disbursed_at||x.disbursed_at||x.created_at)).reduce((a,x)=>a+Number(x.principal||x.principal_amount||x.loan_amount||x.approved_principal||0),0);
      const payroll=(window.state?.payroll||[]).filter(x=>String(x.payment_status||x.status||'').toLowerCase()==='paid'&&inMonth(x.payment_date||x.payroll_month||x.created_at)).reduce((a,x)=>a+Number(x.net_salary||x.amount||0),0);
      const expenses=(window.state?.expenses||[]).filter(x=>inMonth(x.expense_date||x.created_at)).reduce((a,x)=>a+Number(x.amount||0),0);
      const advances=outstandingAdvanceTotal(month);
      const net=collections-disbursements-payroll-expenses-advances;
      root.innerHTML=`<div class="stats report-stats v43-pl-grid">
        <div class="stat"><span>${T('总收款','Total collections','Jumlah kutipan')}</span><strong>${money(collections)}</strong></div>
        <div class="stat"><span>${T('总放款','Total disbursements','Jumlah pengeluaran')}</span><strong>${money(disbursements)}</strong></div>
        <div class="stat"><span>${T('已发工资','Payroll paid','Gaji dibayar')}</span><strong>${money(payroll)}</strong></div>
        <div class="stat"><span>${T('公司开销','Company expenses','Perbelanjaan syarikat')}</span><strong>${money(expenses)}</strong></div>
        <div class="stat"><span>${T('未扣回预支工资','Outstanding salary advances','Pendahuluan belum ditolak')}</span><strong>${money(advances)}</strong></div>
        <div class="stat"><span>${T('公司盈亏','Company profit / loss','Untung / rugi syarikat')}</span><strong class="${net<0?'danger-text':'success-text'}">${money(net)}</strong></div>
      </div><p class="muted">${T('公式：总收款－总放款－已发工资－公司开销－未扣回预支工资','Formula: collections − disbursements − payroll − expenses − outstanding salary advances','Formula: kutipan − pengeluaran − gaji − perbelanjaan − pendahuluan belum ditolak')}</p>`;
    };
  }

  function translateCompanyTabs(){
    const labels={
      employeesPanel:['员工资料','Employees','Pekerja'],payrollPanel:['工资管理','Payroll','Gaji'],expensesPanel:['公司开销','Company Expenses','Perbelanjaan Syarikat'],attendancePanel:['员工出勤','Attendance','Kehadiran'],advancesPanel:['预支工资','Salary Advances','Pendahuluan Gaji'],profitLossPanel:['盈亏报表','Profit & Loss','Untung & Rugi']
    };
    Object.entries(labels).forEach(([id,v])=>{const b=$(`[data-company-tab="${id}"]`);if(b)b.textContent=T(...v)});
  }

  function apply(){
    removeOtherIncome();
    unifyStaffReport();
    translateCompanyTabs();
    addSalaryCard();
    if($('#profitLossPanel.active')) window.renderProfitLoss?.();
  }
  replaceProfitLoss();
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(apply,300);setTimeout(apply,1200)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-section="dashboard"],[data-section="companyManagement"],.company-tab'))setTimeout(apply,150)});
  document.addEventListener('change',e=>{if(e.target.matches('.lang-select,#plMonth'))setTimeout(apply,80)});
  setInterval(apply,5000);
})();

;

/* ===== v43.1-profit-loss-report.js ===== */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const lang=()=>window.SWK_LANG?.current||localStorage.getItem('wl_lang')||'zh';
  const T=(zh,en,ms)=>lang()==='zh'?zh:lang()==='ms'?ms:en;
  const money=n=>`MYR ${Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const monthKey=v=>String(v||'').slice(0,7);
  const dateText=v=>{if(!v)return '-';try{return new Intl.DateTimeFormat(lang()==='zh'?'zh-MY':lang()==='ms'?'ms-MY':'en-MY',{dateStyle:'medium'}).format(new Date(String(v).length===10?v+'T00:00:00':v));}catch(_){return String(v)}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function currentMonth(){
    const input=$('#plMonth');
    if(input?.value)return input.value;
    const v=new Date();v.setMinutes(v.getMinutes()-v.getTimezoneOffset());
    const m=v.toISOString().slice(0,7);
    if(input)input.value=m;
    return m;
  }
  function amount(x,keys){for(const k of keys){const n=Number(x?.[k]);if(Number.isFinite(n)&&n!==0)return n;}return 0;}
  function dateOf(x,keys){for(const k of keys){if(x?.[k])return x[k];}return null;}
  function isMonth(v,m){return monthKey(v)===m;}
  function status(x){return String(x?.payment_status||x?.status||'').toLowerCase();}
  function payrollPaid(x){return ['paid','completed'].includes(status(x));}
  function advanceOutstanding(x){return !['rejected','cancelled','deducted','settled','completed','paid'].includes(status(x));}
  function personName(x){return x?.employees?.full_name||x?.employee_name||x?.full_name||'-';}

  function buildData(month){
    const s=window.state||window.__wlState||{};
    const rows=[];
    let collections=0,disbursements=0,payroll=0,expenses=0,advances=0;

    (s.repayments||[]).forEach(x=>{
      const d=dateOf(x,['payment_date','received_at','created_at']); if(!isMonth(d,month))return;
      const n=amount(x,['amount','total_amount','received_amount']); collections+=n;
      rows.push({date:d,type:T('收款','Collection','Kutipan'),description:`${x?.loans?.loan_id||x?.loan_id||'-'} · ${x?.loans?.customers?.full_name||x?.customer_name||'-'}`,income:n,expense:0,operator:x?.staff_profiles?.full_name||x?.created_by_name||'-'});
    });
    (s.loans||[]).forEach(x=>{
      const d=dateOf(x,['finance_disbursed_at','disbursed_at','disbursement_date','created_at']); if(!isMonth(d,month))return;
      const n=amount(x,['principal','principal_amount','loan_amount','approved_principal']); disbursements+=n;
      rows.push({date:d,type:T('放款','Disbursement','Pengeluaran'),description:`${x?.loan_id||'-'} · ${x?.customers?.full_name||x?.customer_name||'-'}`,income:0,expense:n,operator:x?.finance_disbursed_by_name||x?.disbursed_by_name||'-'});
    });
    (s.payroll||[]).forEach(x=>{
      if(!payrollPaid(x))return;
      const d=dateOf(x,['payment_date','paid_at','payroll_month','created_at']); if(!isMonth(d,month))return;
      const n=amount(x,['net_salary','amount','gross_salary','basic_salary']); payroll+=n;
      rows.push({date:d,type:T('工资','Payroll','Gaji'),description:personName(x),income:0,expense:n,operator:x?.paid_by_name||'-'});
    });
    (s.expenses||[]).forEach(x=>{
      const d=dateOf(x,['expense_date','payment_date','created_at']); if(!isMonth(d,month))return;
      const n=amount(x,['amount','expense_amount']); expenses+=n;
      rows.push({date:d,type:T('公司开销','Company Expense','Perbelanjaan Syarikat'),description:x?.description||x?.category||'-',income:0,expense:n,operator:x?.created_by_name||'-'});
    });
    (s.salaryAdvances||[]).forEach(x=>{
      if(!advanceOutstanding(x))return;
      const d=dateOf(x,['advance_date','approved_at','created_at']); if(!isMonth(d,month))return;
      const n=amount(x,['amount','approved_amount']); advances+=n;
      rows.push({date:d,type:T('未扣回预支工资','Outstanding Salary Advance','Pendahuluan Belum Ditolak'),description:personName(x),income:0,expense:n,operator:x?.approved_by_name||'-'});
    });
    rows.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    return {collections,disbursements,payroll,expenses,advances,net:collections-disbursements-payroll-expenses-advances,rows};
  }

  function render(){
    const root=$('#profitLossPreview'); if(!root)return;
    const month=currentMonth();
    const d=buildData(month);
    root.innerHTML=`
      <div class="stats report-stats v43-pl-grid v431-pl-grid">
        <div class="stat"><span>${T('总收款','Total Collections','Jumlah Kutipan')}</span><strong>${money(d.collections)}</strong></div>
        <div class="stat"><span>${T('总放款','Total Disbursements','Jumlah Pengeluaran')}</span><strong>${money(d.disbursements)}</strong></div>
        <div class="stat"><span>${T('已发工资','Payroll Paid','Gaji Dibayar')}</span><strong>${money(d.payroll)}</strong></div>
        <div class="stat"><span>${T('公司开销','Company Expenses','Perbelanjaan Syarikat')}</span><strong>${money(d.expenses)}</strong></div>
        <div class="stat"><span>${T('未扣回预支工资','Outstanding Salary Advances','Pendahuluan Belum Ditolak')}</span><strong>${money(d.advances)}</strong></div>
        <div class="stat"><span>${T('公司盈亏','Company Profit / Loss','Untung / Rugi Syarikat')}</span><strong class="${d.net<0?'danger-text':'success-text'}">${money(d.net)}</strong></div>
      </div>
      <p class="muted v431-formula">${T('公式：总收款－总放款－已发工资－公司开销－未扣回预支工资','Formula: collections − disbursements − payroll − expenses − outstanding salary advances','Formula: kutipan − pengeluaran − gaji − perbelanjaan − pendahuluan belum ditolak')}</p>
      <div class="section-head v431-detail-head"><h3>${T('收支明细','Income and Expense Details','Butiran Pendapatan dan Perbelanjaan')}</h3><small class="muted">${esc(month)}</small></div>
      <div class="table-wrap"><table class="table"><thead><tr>
        <th>${T('日期','Date','Tarikh')}</th><th>${T('类型','Type','Jenis')}</th><th>${T('说明','Description','Penerangan')}</th><th>${T('收入','Income','Pendapatan')}</th><th>${T('支出','Expense','Perbelanjaan')}</th><th>${T('操作人','Operator','Pengendali')}</th>
      </tr></thead><tbody>${d.rows.length?d.rows.map(r=>`<tr><td>${esc(dateText(r.date))}</td><td>${esc(r.type)}</td><td>${esc(r.description)}</td><td>${r.income?money(r.income):'-'}</td><td>${r.expense?money(r.expense):'-'}</td><td>${esc(r.operator)}</td></tr>`).join(''):`<tr><td colspan="6" class="muted">${T('本月没有收支记录','No income or expense records for this month','Tiada rekod pendapatan atau perbelanjaan bulan ini')}</td></tr>`}</tbody></table></div>`;
  }

  window.renderProfitLoss=render;
  function bind(){
    const tab=$('[data-company-tab="profitLossPanel"]');
    if(tab&&!tab.dataset.v431Bound){tab.dataset.v431Bound='1';tab.addEventListener('click',()=>setTimeout(render,0));}
    const month=$('#plMonth');
    if(month&&!month.dataset.v431Bound){month.dataset.v431Bound='1';month.addEventListener('change',render);}
    if($('#profitLossPanel')?.classList.contains('active'))render();
  }
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(bind,250);setTimeout(bind,1200)});
  document.addEventListener('click',e=>{if(e.target.closest('[data-company-tab="profitLossPanel"]'))setTimeout(render,30);});
  document.addEventListener('wl:data-loaded',()=>setTimeout(render,0));
  setInterval(()=>{if($('#profitLossPanel')?.classList.contains('active'))render();},10000);
})();

;
