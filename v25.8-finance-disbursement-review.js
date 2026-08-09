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
 return `<div class="card" style="padding:12px"><strong>${E(label)}</strong><div style="margin-top:8px">${url?`<a class="btn btn-secondary" href="${E(url)}" target="_blank" rel="noopener">${L('查看文件','View file','Lihat fail')}</a>`:`<span class="muted">${L('无法读取','Unavailable','Tidak tersedia')}</span>`}</div></div>`;
}
async function openReview(id){
 const a=await getApp(id);if(!a)return window.toast?.(L('找不到申请','Application not found','Permohonan tidak ditemui'),true);
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
 <div class="card" style="margin-top:16px"><h3>${L('客户文件','Customer Documents','Dokumen Pelanggan')}</h3><div class="resource-grid">${dh}</div></div>
 <form id="v258FinanceForm" class="card" style="margin-top:16px"><h3>${L('最终贷款与出款资料','Final Loan & Disbursement','Pinjaman & Pengeluaran Akhir')}</h3>
 <div class="grid2">${field(L('本金 / 实际放款金额','Principal / Actual Disbursement','Prinsipal / Pengeluaran Sebenar'),'principal',p,'number','step="0.01" min="0.01" required')}${field(L('利息','Interest','Faedah'),'interest',interest,'number','step="0.01" min="0" required')}${field(L('清账金额','Settlement Amount','Jumlah Penyelesaian'),'settlement',settle,'number','step="0.01" min="0.01" required')}${field(L('到期日期','Due Date','Tarikh Tamat'),'due',due,'date','required')}</div>
 <div class="grid2"><div class="field"><label>${L('公司出款银行','Company Disbursement Bank','Bank Pengeluaran Syarikat')}</label><select name="bank" required>${banks.map(b=>`<option value="${E(b.id)}">${E(b.bank_name)} · ${E(b.account_number)}</option>`).join('')}</select></div>${field(L('出款时间','Transfer Time','Masa Pindahan'),'at','','datetime-local','required')}</div>
 <div class="grid2">${field(L('参考号','Reference','Rujukan'),'ref','')}<div class="field"><label>${L('出款截图','Disbursement Screenshot','Tangkapan Skrin Pengeluaran')}</label><input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required></div></div>
 <div class="field"><label>${L('备注','Note','Catatan')}</label><textarea name="note">${E(a.finance_note||'')}</textarea></div>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">${L('确认出款','Confirm Disbursement','Sahkan Pengeluaran')}</button><button class="btn btn-danger" type="button" id="v258Reject">${L('拒绝出款','Reject Disbursement','Tolak Pengeluaran')}</button><button class="btn btn-secondary" type="button" onclick="closeModal()">${L('取消','Cancel','Batal')}</button></div></form>`);
 const f=document.querySelector('#v258FinanceForm');f.elements.at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 document.querySelector('#v258Reject').onclick=()=>{window.closeModal?.(); if(typeof window.v233RejectFinanceDisbursement==='function')window.v233RejectFinanceDisbursement(id);else window.toast?.(L('拒绝功能未载入','Reject function unavailable','Fungsi tolak tidak tersedia'),true)};
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
