/* WL Credit V24.4 — customer personal bank profile + selectable customer for new loans */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=v=>window.esc?window.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const T=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
  const st=()=>window.state||window.__wlState||{};
  const username=c=>window.customerUsername?window.customerUsername(c):(c?.customer_code||c?.username||'-');

  function personalBankHtml(c){
    return `<div class="v244-personal-bank">
      <h3>${T('个人银行资料','Personal Bank Details','Butiran Bank Peribadi')}</h3>
      <div class="kv"><span>${T('银行名称','Bank Name','Nama Bank')}</span><strong>${esc(c?.bank_name||'-')}</strong></div>
      <div class="kv"><span>${T('户名','Account Name','Nama Akaun')}</span><strong>${esc(c?.bank_account_name||'-')}</strong></div>
      <div class="kv"><span>${T('银行账号','Account Number','Nombor Akaun')}</span><strong>${esc(c?.bank_account_number||'-')}</strong></div>
    </div>`;
  }

  const oldProfile=window.openCustomerProfile;
  if(typeof oldProfile==='function'){
    window.openCustomerProfile=function(id){
      const result=oldProfile.apply(this,arguments);
      setTimeout(()=>{
        const c=(st().customers||[]).find(x=>String(x.id)===String(id));
        if(!c)return;
        const firstCard=document.querySelector('#modalBody .application-detail-grid .card');
        if(firstCard&&!firstCard.querySelector('.v244-personal-bank')){
          firstCard.insertAdjacentHTML('beforeend',personalBankHtml(c));
        }
        const category=$('#customerDocumentCategory');
        if(category){
          const options=[
            ['ic_front',T('IC 正面','IC Front','IC Depan')],
            ['ic_back',T('IC 背面','IC Back','IC Belakang')],
            ['holding_ic',T('手持 IC','Holding IC','Pegang IC')],
            ['payslip',T('工资单','Payslip','Slip Gaji')],
            ['bank_statement',T('Bank Statement','Bank Statement','Penyata Bank')],
            ['epf',T('EPF','EPF','EPF')],
            ['additional',T('补充资料','Additional Document','Dokumen Tambahan')]
          ];
          category.innerHTML=options.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join('');
        }
        const grid=$('#wlCustomerDocuments');
        if(grid&&!document.querySelector('#v244RequiredDocs')){
          const app=(st().applications||[]).filter(a=>String(a.customer_id||'')===String(c.id)).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0];
          const saved=(st().documents||[]).filter(d=>String(d.customer_id)===String(c.id));
          const have=new Set();
          Object.keys(app?.document_paths||{}).forEach(k=>{if(app.document_paths[k])have.add(String(k).toLowerCase())});
          saved.forEach(d=>have.add(String(d.category||d.file_name||'').toLowerCase()));
          const req=[['ic_front',T('IC 正面','IC Front','IC Depan')],['ic_back',T('IC 背面','IC Back','IC Belakang')],['holding_ic',T('手持 IC','Holding IC','Pegang IC')],['payslip',T('工资单','Payslip','Slip Gaji')],['bank_statement','Bank Statement'],['epf','EPF']];
          const has=k=>[...have].some(v=>v===k||v.replace(/[ -]/g,'_').includes(k));
          grid.insertAdjacentHTML('beforebegin',`<div id="v244RequiredDocs" class="v244-required-docs">${req.map(([k,l])=>`<div class="v244-doc-status ${has(k)?'ok':'missing'}"><strong>${esc(l)}</strong><span>${has(k)?T('已上传','Uploaded','Dimuat naik'):T('尚未上传','Not uploaded','Belum dimuat naik')}</span></div>`).join('')}</div>`);
        }
      },30);
      return result;
    };
  }

  const oldCustomer=window.openCustomer;
  if(typeof oldCustomer==='function'){
    window.openCustomer=function(id){
      const result=oldCustomer.apply(this,arguments);
      setTimeout(()=>{
        const c=(st().customers||[]).find(x=>String(x.id)===String(id))||{};
        const form=$('#customerForm');if(!form||form.querySelector('.v244-bank-fields'))return;
        const grid=form.querySelector('.grid2');
        grid?.insertAdjacentHTML('beforeend',`<div class="v244-bank-fields" style="display:contents">
          <div class="field"><label>${T('个人银行名称','Personal Bank Name','Nama Bank Peribadi')}</label><input name="personal_bank_name" value="${esc(c.bank_name||'')}"></div>
          <div class="field"><label>${T('银行户名','Bank Account Name','Nama Pemilik Akaun')}</label><input name="personal_bank_account_name" value="${esc(c.bank_account_name||'')}"></div>
          <div class="field"><label>${T('银行账号','Bank Account Number','Nombor Akaun Bank')}</label><input name="personal_bank_account_number" value="${esc(c.bank_account_number||'')}"></div>
        </div>`);
        if(id){
          const original=form.onsubmit;
          form.onsubmit=async function(e){
            const fd=new FormData(form);
            await original?.call(form,e);
            const x=await window.sb.from('customers').update({
              bank_name:String(fd.get('personal_bank_name')||'').trim()||null,
              bank_account_name:String(fd.get('personal_bank_account_name')||'').trim()||null,
              bank_account_number:String(fd.get('personal_bank_account_number')||'').trim()||null,
              updated_at:new Date().toISOString()
            }).eq('id',id);
            if(x.error)return window.toast?.(x.error.message,true);
            await window.loadAll?.();
          };
        }
      },20);
      return result;
    };
  }

  // V24.5: use the main openLoan dialog directly. It already provides a searchable
  // customer selector, keeps a customer preselected when opened from a profile, and
  // still allows staff to choose another customer. Do not wrap it with a second modal.
})();
