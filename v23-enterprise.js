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
