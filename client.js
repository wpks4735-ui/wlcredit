const cfg=window.SWK_CONFIG||{},$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let sb=null,data=null,token=localStorage.getItem('swk_customer_session')||'',tab='active',idleTimer,warningTimer,refreshTimer,lastActivity=Date.now();
const IDLE=5*60*1000,WARN=30;
const today=()=>new Date().toISOString().slice(0,10);
const tr=(k,v)=>SWK_LANG.t(k,v);
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function money(v){return new Intl.NumberFormat('en-US',{style:'currency',currency:'MYR',currencyDisplay:'code',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0)).replace(/\s+/g,' ')}
function date(v){return v?new Intl.DateTimeFormat(SWK_LANG.current==='ms'?'ms-MY':SWK_LANG.current==='zh'?'zh-MY':'en-MY').format(new Date(v+(String(v).length===10?'T00:00:00':''))):'-'}
function toast(m,e=false){const x=$('#toast');x.textContent=m;x.className='toast show'+(e?' error':'');setTimeout(()=>x.className='toast',3000)}
async function fetchPortal(){const x=await sb.rpc('customer_portal_data',{p_session_token:token});if(x.error)throw x.error;if(!x.data?.ok){clearSession(false);return null}try{const extra=await sb.rpc('wl_customer_loan_extras_v304',{p_session_token:token});if(!extra.error&&Array.isArray(extra.data)){const byId=new Map(extra.data.map(v=>[String(v.id),v]));x.data.loans=(x.data.loans||[]).map(l=>Object.assign({},l,byId.get(String(l.id))||{}))}}catch(_){}return x.data}
function contactLink(c){if(!c)return'';let u=c.contact_value||'';if(c.channel_type==='whatsapp')u='https://wa.me/'+u.replace(/\D/g,'');if(c.channel_type==='telegram'&&!/^https?:/i.test(u))u='https://t.me/'+u.replace('@','');if(c.channel_type==='phone')u='tel:'+u;return `<a target="_blank" rel="noopener" href="${esc(u)}">${esc(c.label)} · ${esc(c.contact_value)}</a>`}
function contactsHtml(){const ct=data?.contacts||{},rows=[];if(ct.telegram)rows.push(`<div><strong>Telegram:</strong> ${contactLink(ct.telegram)}</div>`);if(ct.whatsapp)rows.push(`<div><strong>WhatsApp:</strong> ${contactLink(ct.whatsapp)}</div>`);return rows.length?rows.join(''):`<span class="muted">${tr('contactNotAssigned')}</span>`}
window.copyBankAccount=async value=>{try{await navigator.clipboard.writeText(value);toast(tr('copySuccess'))}catch{const ta=document.createElement('textarea');ta.value=value;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(tr('copySuccess'))}catch{toast(tr('copyFailed'),true)}ta.remove()}}
function render(){
 if(!data)return;
 $('#clientName').textContent=data.customer.full_name;$('#clientCodeDisplay').textContent=wlCanonicalCustomerUsername(data.customer.username||data.customer.customer_code);
 const all=data.loans||[],active=all.filter(x=>x.status==='active'),hist=all.filter(x=>x.status==='paid'),shown=tab==='active'?active:tab==='history'?hist:all;
 const historyOnly=tab==='history';
 ['announcementSection','contactSection','paymentSubmissionsSection'].forEach(id=>{const el=$('#'+id);if(el)el.classList.toggle('hidden',historyOnly)});
 $('#activeCount').textContent=active.length;$('#historyCount').textContent=hist.length;$('#allCount').textContent=all.length;
 const reps=data.repayments||[];
 const homeContacts=$('#homeContacts');if(homeContacts)homeContacts.innerHTML=contactsHtml();
 const pendingLoanIds=new Set((data.payment_submissions||[]).filter(x=>!['completed','approved','rejected','failed','cancelled'].includes(String(x.status||'').trim().toLowerCase())).map(x=>String(x.loan_id)));
 $('#clientLoans').innerHTML=shown.length?shown.map(l=>{
  const baseDue=Number(l.current_due_amount||l.interest),overdueCharge=Number(l.overdue_charge||0),due=baseDue+overdueCharge,paid=Number(l.current_paid_amount||0),bal=Math.max(due-paid,0),lr=reps.filter(r=>r.loan_id===l.loan_id),paidLoan=l.status==='paid';
  return `<article class="card loan-card"><h3>${esc(l.loan_id)} <span class="badge ${paidLoan?'ok':'warn'}">${paidLoan?tr('settled'):tr('inProgress')}</span></h3>
  <div class="kv"><span>${tr('principal')}</span><strong>${money(l.principal)}</strong></div>
  <div class="kv"><span>${tr('interest')}</span><strong>${money(l.interest)}</strong></div>
  <div class="kv"><span>${tr('settlementAmount')}</span><strong>${money(l.settlement_amount)}</strong></div>
  <div class="kv"><span>${tr('disbursementDate')}</span><span>${date(l.disbursement_date)}</span></div>
  <div class="kv"><span>${paidLoan?tr('settlementDate'):tr('dueDate')}</span><span>${date(paidLoan?l.settled_at:l.due_date)}</span></div>${!paidLoan&&l.expected_payment_at?`<div class="kv"><span>${SWK_LANG.current==='zh'?'预计到账时间':SWK_LANG.current==='ms'?'Masa Bayaran Dijangka':'Expected Payment Time'}</span><strong>${new Date(l.expected_payment_at).toLocaleString(SWK_LANG.current==='zh'?'zh-CN':SWK_LANG.current==='ms'?'ms-MY':'en-MY')}</strong></div>`:''}${!paidLoan&&overdueCharge>0?`<div class="kv overdue-charge"><span>${SWK_LANG.current==='zh'?'逾期应收':SWK_LANG.current==='ms'?'Caj Tertunggak':'Overdue Charge'}</span><strong>${money(overdueCharge)}</strong></div>${l.overdue_note?`<p class="muted">${esc(l.overdue_note)}</p>`:''}`:''}
  ${!paidLoan?`<div class="current-pay"><div class="kv"><span>${tr('currentPeriodDue')}</span><strong>${money(due)}</strong></div><div class="kv"><span>${tr('currentPeriodPaid')}</span><strong>${money(paid)}</strong></div><div class="kv"><span>${tr('currentPeriodBalance')}</span><strong>${money(bal)}</strong></div></div>`:''}
  ${!paidLoan?(pendingLoanIds.has(String(l.loan_id))?`<button type="button" class="btn btn-secondary full" disabled>${tr('pendingReview')}</button>`:`<button type="button" class="btn btn-primary full pay-now-btn" data-loan-uuid="${esc(l.id)}" data-loan-code="${esc(l.loan_id)}">${tr('payNow')}</button>`):''}
  ${paidLoan?`<details><summary>${tr('viewPaymentHistory')}</summary>${lr.map(r=>`<div class="history-payment">${date(r.payment_date)} · ${money(r.amount)}</div>`).join('')||`<p>${tr('noPaymentHistory')}</p>`}</details>`:''}</article>`
 }).join(''):`<p>${tr('noRecords')}</p>`;
 $('#announcementText').textContent=data.settings?.announcement||'-';
 $$('.pay-now-btn').forEach(btn=>btn.onclick=()=>openPaymentPage(btn.dataset.loanUuid,btn.dataset.loanCode));
 const subs=data.payment_submissions||[];
 const clientPaymentStatus=x=>{const s=String(x.status||'').toLowerCase();if(['completed','approved'].includes(s))return {key:'completed',label:SWK_LANG.current==='zh'?'已完成':SWK_LANG.current==='ms'?'Selesai':'Completed',cls:'ok'};if(['rejected','failed','cancelled'].includes(s))return {key:'rejected',label:SWK_LANG.current==='zh'?'已拒绝':SWK_LANG.current==='ms'?'Ditolak':'Rejected',cls:'danger'};return {key:'pending',label:'Pending',cls:'warn'}};
 $('#clientSubmissionList').innerHTML=subs.length?subs.map(x=>{const ps=clientPaymentStatus(x);return `<div class="submission-card"><div><strong>${esc(x.loan_id)}</strong><div class="muted">${date(x.payment_date)} · ${money(x.amount)}</div></div><span class="badge ${ps.cls}">${ps.label}</span></div>`}).join(''):`<p>${tr('noPaymentSubmissions')}</p>`;
 SWK_LANG.apply($('#portalView'));
}
function renderPaymentAssignment(){
 const box=$('#paymentAssignment');if(!box)return;
 const b=data?.bank;
 const bankHtml=b?`<div class="payment-info-grid"><div><span class="muted">${tr('bankName')}</span><strong>${esc(b.bank_name)}</strong></div><div><span class="muted">${tr('accountName')}</span><strong>${esc(b.account_name)}</strong></div><div class="payment-account-row"><div><span class="muted">${tr('accountNumber')}</span><strong class="bank-number">${esc(b.account_number)}</strong></div><button type="button" class="btn btn-secondary btn-copy" onclick='copyBankAccount(${JSON.stringify(String(b.account_number))})'>${tr('copy')}</button></div></div>`:`<p class="muted">${tr('bankNotAssigned')}</p>`;
 box.innerHTML=`<h3>${tr('paymentInformation')}</h3>${bankHtml}`;
}


function wlCanonicalCustomerUsername(value){
 const raw=String(value||'').trim().toUpperCase();
 const m=raw.match(/(\d+)$/);
 if(!m)return raw;
 if(/^WL\d+$/.test(raw)||/^(?:SWKC|CUS|CUSTOMER|C)\d+$/.test(raw))return 'WL'+String(Number(m[1])).padStart(3,'0');
 return raw;
}

function wlShortLoanCode(value){
 const raw=String(value||'');
 const m=raw.match(/(\d+)$/);
 return m?'L'+String(Number(m[1])).padStart(5,'0'):raw;
}

function openPaymentPage(loanUuid,loanCode){
 $('#paymentLoan').value=loanUuid;$('#paymentLoanDisplay').value=wlShortLoanCode(loanCode);renderPaymentAssignment();$('#loansPage').classList.add('hidden');$('#paymentPage').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});SWK_LANG.apply($('#paymentPage'));
}
function closePaymentPage(){
 $('#paymentPage').classList.add('hidden');$('#loansPage').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});
}
let portalRealtime=null;function startPortalRealtime(){try{if(portalRealtime)sb.removeChannel(portalRealtime);portalRealtime=sb.channel('customer-loan-live-'+Date.now()).on('postgres_changes',{event:'*',schema:'public',table:'loans'},async()=>{try{data=await fetchPortal();if(data)render()}catch(_){}}).subscribe()}catch(_){}}
function showPortal(){$('#loginView').classList.add('hidden');$('#forcePasswordView').classList.add('hidden');$('#portalView').classList.remove('hidden');render();startPortalRealtime();resetIdle();clearInterval(refreshTimer);refreshTimer=null}
function showForce(){$('#loginView').classList.add('hidden');$('#portalView').classList.add('hidden');$('#forcePasswordView').classList.remove('hidden')}
async function clearSession(server=true){clearInterval(refreshTimer);clearTimeout(idleTimer);clearInterval(warningTimer);if(server&&token)try{await sb.rpc('customer_logout',{p_session_token:token})}catch{}token='';data=null;localStorage.removeItem('swk_customer_session');$('#portalView').classList.add('hidden');$('#forcePasswordView').classList.add('hidden');$('#loginView').classList.remove('hidden')}
function resetIdle(){lastActivity=Date.now();clearTimeout(idleTimer);$('#idleWarning').classList.remove('show');if(token)idleTimer=setTimeout(()=>{let n=WARN;$('#idleCountdown').textContent=n;$('#idleWarning').classList.add('show');warningTimer=setInterval(()=>{n--;$('#idleCountdown').textContent=n;if(n<=0){clearInterval(warningTimer);clearSession(true)}},1000)},IDLE-WARN*1000)}
document.addEventListener('DOMContentLoaded',async()=>{
 SWK_LANG.init();window.addEventListener('swk-language-applied',()=>{if(data)render()});
 sb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:false}});$('#paymentDate').value=today();
 $$('.client-tab').forEach(b=>b.onclick=()=>{$$('.client-tab').forEach(x=>x.className='btn btn-secondary client-tab');b.className='btn btn-primary client-tab active';tab=b.dataset.tab;render()});
 ['click','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{if(token&&Date.now()-lastActivity>1000)resetIdle()},{passive:true}));
 $('#continueSession').onclick=resetIdle;$('#idleLogout').onclick=()=>clearSession(true);$('#backToLoans').onclick=closePaymentPage;
 $('#clientLogin').onsubmit=async e=>{e.preventDefault();const x=await sb.rpc('customer_portal_login',{p_code:$('#customerCode').value.trim(),p_pin:$('#customerPin').value});if(x.error||!x.data?.ok)return toast(tr('loginError'),true);token=x.data.session_token;localStorage.setItem('swk_customer_session',token);data=x.data;data.must_change_pin?showForce():showPortal()};
 $('#forcePasswordForm').onsubmit=async e=>{e.preventDefault();if($('#newClientPin').value!==$('#confirmClientPin').value)return toast(tr('passwordMismatchShort'),true);const x=await sb.rpc('customer_change_pin_session',{p_session_token:token,p_new_pin:$('#newClientPin').value});if(x.error)return toast(x.error.message,true);data=await fetchPortal();showPortal()};
 $('#paymentUploadForm').onsubmit=async e=>{e.preventDefault();const file=$('#paymentReceipt').files[0];if(!file)return toast(tr('receiptRequired'),true);const path=`${crypto.randomUUID()}.${(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'')}`;const up=await sb.storage.from('payment-receipts').upload(path,file,{contentType:file.type});if(up.error)return toast(up.error.message,true);const x=await sb.rpc('customer_submit_payment_session',{p_session_token:token,p_loan_id:$('#paymentLoan').value,p_amount:Number($('#paymentAmount').value),p_payment_date:$('#paymentDate').value,p_payment_bank:'',p_receipt_path:path,p_notes:$('#paymentNotes').value});if(x.error||!x.data?.ok){await sb.storage.from('payment-receipts').remove([path]);return toast(x.error?.message||tr('submitFailed'),true)}try{await sb.functions.invoke('telegram-bot',{body:{action:'payment_submission',loan_id:$('#paymentLoan').value,amount:Number($('#paymentAmount').value)}})}catch(_){ }toast(tr('submittedPayment'));e.target.reset();$('#paymentDate').value=today();data=await fetchPortal();render();closePaymentPage()};
 $('#logoutClient').onclick=()=>clearSession(true);if(token){try{data=await fetchPortal();if(data)(data.must_change_pin?showForce():showPortal())}catch{clearSession(false)}}
});

/* ===== WL Credit V30.3 payment details ===== */
const v302OldRenderPaymentAssignment = renderPaymentAssignment;
renderPaymentAssignment = function(){
  v302OldRenderPaymentAssignment();
  const box=$('#paymentAssignment');
  const loanId=$('#paymentLoan')?.value;
  const l=(data?.loans||[]).find(x=>String(x.id)===String(loanId));
  if(!box||!l)return;
  const overdue=Number(l.overdue_charge||0);
  const interest=Number(l.interest||0);
  const settlement=Number(l.settlement_amount||0)+overdue;
  const details=document.createElement('div');
  details.className='payment-amount-summary';
  details.innerHTML=`<h3>${SWK_LANG.current==='zh'?'还款金额参考':SWK_LANG.current==='ms'?'Rujukan Jumlah Bayaran':'Payment Amount Reference'}</h3>
  <div class="payment-info-grid"><div><span class="muted">${SWK_LANG.current==='zh'?'本期利息':SWK_LANG.current==='ms'?'Faedah Tempoh Ini':'Current Interest'}</span><strong>${money(interest)}</strong></div>
  <div><span class="muted">${SWK_LANG.current==='zh'?'清账金额':SWK_LANG.current==='ms'?'Jumlah Penyelesaian':'Settlement Amount'}</span><strong>${money(settlement)}</strong></div>
  ${overdue>0?`<div><span class="muted">${SWK_LANG.current==='zh'?'逾期应收':SWK_LANG.current==='ms'?'Caj Tertunggak':'Overdue Charge'}</span><strong>${money(overdue)}</strong></div>`:''}</div>`;
  box.appendChild(details);
};

/* ===== WL Credit V30.5 compact payment page + immediate sync ===== */
renderPaymentAssignment = function(){
  const box=$('#paymentAssignment');
  const loanId=$('#paymentLoan')?.value;
  const l=(data?.loans||[]).find(x=>String(x.id)===String(loanId));
  if(!box||!l)return;
  const bank=data?.customer?.receiving_bank||data?.receiving_bank||null;
  const overdue=Number(l.overdue_charge||0);
  const interest=Number(l.interest||0);
  const settlement=Number(l.settlement_amount||0)+overdue;
  box.innerHTML=`
    <div class="payment-loan-summary">
      <div class="kv"><span>${SWK_LANG.current==='zh'?'贷款编号':SWK_LANG.current==='ms'?'ID Pinjaman':'Loan ID'}</span><strong>${esc(wlShortLoanCode(l.loan_id||l.loan_number||'-'))}</strong></div>
      <div class="kv"><span>${SWK_LANG.current==='zh'?'利息':SWK_LANG.current==='ms'?'Faedah':'Interest'}</span><strong>${money(interest)}</strong></div>
      <div class="kv"><span>${SWK_LANG.current==='zh'?'清账金额':SWK_LANG.current==='ms'?'Jumlah Penyelesaian':'Settlement Amount'}</span><strong>${money(settlement)}</strong></div>
      ${overdue>0?`<div class="kv overdue-charge"><span>${SWK_LANG.current==='zh'?'逾期应收':SWK_LANG.current==='ms'?'Caj Tertunggak':'Overdue Charge'}</span><strong>${money(overdue)}</strong></div>`:''}
    </div>
    ${bank?`<div class="payment-bank-card"><div class="kv"><span>${SWK_LANG.current==='zh'?'银行':SWK_LANG.current==='ms'?'Bank':'Bank'}</span><strong>${esc(bank.bank_name||'-')}</strong></div><div class="kv"><span>${SWK_LANG.current==='zh'?'账户姓名':SWK_LANG.current==='ms'?'Nama Akaun':'Account Name'}</span><strong>${esc(bank.account_name||'-')}</strong></div><div class="kv"><span>${SWK_LANG.current==='zh'?'账号':SWK_LANG.current==='ms'?'Nombor Akaun':'Account Number'}</span><strong>${esc(bank.account_number||'-')}</strong></div></div>`:''}`;
};

startPortalRealtime = function(){
  try{
    if(portalRealtime)sb.removeChannel(portalRealtime);
    const refreshPortal=async()=>{try{data=await fetchPortal();if(data)render()}catch(e){console.error('Portal live refresh failed',e)}};
    portalRealtime=sb.channel('customer-portal-live-v305-'+Date.now())
      .on('postgres_changes',{event:'*',schema:'public',table:'loans'},refreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},refreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'repayments'},refreshPortal)
      .subscribe();
  }catch(e){console.error(e)}
};

/* ===== WL Credit V30.6 reliable overdue live sync ===== */
startPortalRealtime = function(){
 try{
  if(portalRealtime)sb.removeChannel(portalRealtime);
  let timer=null;
  const refreshPortal=()=>{clearTimeout(timer);timer=setTimeout(async()=>{try{const fresh=await fetchPortal();if(fresh){data=fresh;render();}}catch(e){console.error('Portal live refresh failed',e)}},120)};
  portalRealtime=sb.channel('customer-portal-live-v306-'+Date.now())
   .on('postgres_changes',{event:'*',schema:'public',table:'loans'},refreshPortal)
   .on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},refreshPortal)
   .on('postgres_changes',{event:'*',schema:'public',table:'repayments'},refreshPortal)
   .subscribe(status=>{if(status==='SUBSCRIBED')refreshPortal()});
 }catch(e){console.error(e)}
};

/* ===== WL Credit V30.9 bank/contact/payment live refresh ===== */
renderPaymentAssignment=function(){
  const box=$('#paymentAssignment');
  const loanId=$('#paymentLoan')?.value;
  const l=(data?.loans||[]).find(x=>String(x.id)===String(loanId));
  if(!box||!l)return;
  // customer_portal_data returns the assigned company bank as data.bank.
  const bank=data?.bank || data?.receiving_bank || data?.customer?.receiving_bank || null;
  const overdue=Number(l.overdue_charge||0);
  const interest=Number(l.interest||0);
  const settlement=Number(l.settlement_amount||0);
  const bankHtml=bank?`<div class="payment-bank-card">
    <div class="kv"><span>${SWK_LANG.current==='zh'?'银行':SWK_LANG.current==='ms'?'Bank':'Bank'}</span><strong>${esc(bank.bank_name||'-')}</strong></div>
    <div class="kv"><span>${SWK_LANG.current==='zh'?'账户姓名':SWK_LANG.current==='ms'?'Nama Akaun':'Account Name'}</span><strong>${esc(bank.account_name||'-')}</strong></div>
    <div class="kv payment-account-row"><div><span>${SWK_LANG.current==='zh'?'账号':SWK_LANG.current==='ms'?'Nombor Akaun':'Account Number'}</span><strong class="bank-number">${esc(bank.account_number||'-')}</strong></div><button type="button" class="btn btn-secondary btn-copy" onclick='copyBankAccount(${JSON.stringify(String(bank.account_number||''))})'>${tr('copy')}</button></div>
  </div>`:`<p class="muted">${tr('bankNotAssigned')}</p>`;
  box.innerHTML=`<div class="payment-loan-summary">
    <div class="kv"><span>${SWK_LANG.current==='zh'?'贷款编号':SWK_LANG.current==='ms'?'ID Pinjaman':'Loan ID'}</span><strong>${esc(wlShortLoanCode(l.loan_id||l.loan_number||'-'))}</strong></div>
    <div class="kv"><span>${SWK_LANG.current==='zh'?'利息':SWK_LANG.current==='ms'?'Faedah':'Interest'}</span><strong>${money(interest)}</strong></div>
    <div class="kv"><span>${SWK_LANG.current==='zh'?'清账金额':SWK_LANG.current==='ms'?'Jumlah Penyelesaian':'Settlement Amount'}</span><strong>${money(settlement)}</strong></div>
    ${overdue>0?`<div class="kv overdue-charge"><span>${SWK_LANG.current==='zh'?'逾期应收':SWK_LANG.current==='ms'?'Caj Tertunggak':'Overdue Charge'}</span><strong>${money(overdue)}</strong></div>`:''}
  </div>${bankHtml}`;
};

let v309RefreshBusy=false,v309LastSignature='';
async function v309RefreshPortal(){
  if(v309RefreshBusy||!token)return;
  v309RefreshBusy=true;
  try{
    const fresh=await fetchPortal();
    if(!fresh)return;
    const signature=JSON.stringify({
      loans:(fresh.loans||[]).map(x=>[x.id,x.status,x.current_paid_amount,x.current_due_amount,x.interest,x.settlement_amount,x.overdue_charge,x.updated_at]),
      submissions:(fresh.payment_submissions||[]).map(x=>[x.id,x.status,x.updated_at]),
      bank:fresh.bank,
      contacts:fresh.contacts,
      settings:fresh.settings
    });
    if(signature!==v309LastSignature){
      v309LastSignature=signature;data=fresh;
      const paymentOpen=!$('#paymentPage')?.classList.contains('hidden');
      if(paymentOpen){renderPaymentAssignment();contactsHtml();}else render();
    }
  }catch(e){console.error('V30.9 portal refresh failed',e)}finally{v309RefreshBusy=false}
}
startPortalRealtime=function(){
  try{
    if(portalRealtime)sb.removeChannel(portalRealtime);
    portalRealtime=sb.channel('customer-portal-live-v309-'+Date.now())
      .on('postgres_changes',{event:'*',schema:'public',table:'loans'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'payment_submissions'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'repayments'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'customers'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'receiving_banks'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'contact_channels'},v309RefreshPortal)
      .on('postgres_changes',{event:'*',schema:'public',table:'app_settings'},v309RefreshPortal)
      .subscribe(status=>{if(status==='SUBSCRIBED')v309RefreshPortal()});
    clearInterval(refreshTimer);
    refreshTimer=setInterval(()=>{if(document.visibilityState==='visible')v309RefreshPortal()},2500);
  }catch(e){console.error(e)}
};
window.addEventListener('focus',()=>v309RefreshPortal());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')v309RefreshPortal()});

/* ===== WL Credit V30.10 customer live contacts + short Loan ID ===== */
function v310ShortLoanId(value){
  const raw=String(value||'').trim();
  const match=raw.match(/(\d+)$/);
  if(!match)return raw||'-';
  return 'L'+String(Number(match[1])).padStart(5,'0');
}
function v310ApplyShortLoanIds(root=document){
  const nodes=root.querySelectorAll?.('.loan-card h3, .submission-card strong, #paymentAssignment .payment-loan-summary strong')||[];
  nodes.forEach(el=>{
    const text=String(el.firstChild?.nodeValue||el.textContent||'').trim();
    if(/^(?:SWK)?L\d+$/i.test(text)){
      if(el.firstChild&&el.firstChild.nodeType===3)el.firstChild.nodeValue=v310ShortLoanId(text)+' ';
      else el.textContent=v310ShortLoanId(text);
    }
  });
}
const v310BaseRender=render;
render=function(){
  const result=v310BaseRender();
  v310ApplyShortLoanIds(document);
  return result;
};
const v310BasePaymentAssignment=renderPaymentAssignment;
renderPaymentAssignment=function(){
  const result=v310BasePaymentAssignment();
  const loanStrong=document.querySelector('#paymentAssignment .payment-loan-summary .kv strong');
  if(loanStrong)loanStrong.textContent=v310ShortLoanId(loanStrong.textContent);
  return result;
};

let v310LiveTimer=null,v310LiveBusy=false;
async function v310LiveSync(){
  if(v310LiveBusy||!token||document.visibilityState==='hidden')return;
  v310LiveBusy=true;
  try{
    const fresh=await fetchPortal();
    if(!fresh)return;
    data=fresh;
    const homeContacts=document.querySelector('#homeContacts');
    if(homeContacts)homeContacts.innerHTML=contactsHtml();
    const paymentOpen=!document.querySelector('#paymentPage')?.classList.contains('hidden');
    if(paymentOpen)renderPaymentAssignment();
    else render();
  }catch(e){console.error('V30.10 live sync failed',e)}finally{v310LiveBusy=false}
}
function v310StartLiveTimer(){
  clearInterval(v310LiveTimer);
  v310LiveTimer=setInterval(v310LiveSync,2000);
  setTimeout(v310LiveSync,200);
}
const v310BaseShowPortal=showPortal;
showPortal=function(){
  const result=v310BaseShowPortal();
  v310StartLiveTimer();
  return result;
};
window.addEventListener('focus',v310LiveSync);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')v310LiveSync()});
