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
