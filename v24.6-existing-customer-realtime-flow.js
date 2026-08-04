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
      const r=await window.sb.from('loan_applications').select('*').order('submitted_to_finance_at',{ascending:true});
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
    pollTimer=setInterval(()=>syncFinanceQueue({notify:true}),3000);
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
