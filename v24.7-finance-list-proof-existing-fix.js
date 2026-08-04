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
