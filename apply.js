(()=>{
 const cfg=window.SWK_CONFIG||{},$=s=>document.querySelector(s);let appSb;
 const escExt=n=>(String(n||'file').split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase();
 const show=(id)=>{['loginView','applicationView','applicationSuccessView'].forEach(x=>$('#'+x)?.classList.toggle('hidden',x!==id));window.scrollTo({top:0,behavior:'smooth'})};
 async function upload(file,prefix){if(!file)return null;const path=`${crypto.randomUUID()}/${prefix}-${crypto.randomUUID()}.${escExt(file.name)}`;const x=await appSb.storage.from('loan-applications').upload(path,file,{contentType:file.type,upsert:false});if(x.error)throw x.error;return path}
 document.addEventListener('DOMContentLoaded',()=>{
  appSb=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
  $('#openApplication')?.addEventListener('click',()=>show('applicationView'));
  $('#backToLogin')?.addEventListener('click',()=>show('loginView'));
  $('#applicationDone')?.addEventListener('click',()=>show('loginView'));
  $('#loanApplicationForm')?.addEventListener('submit',async e=>{
   e.preventDefault();const btn=$('#submitApplication'),f=e.target;btn.disabled=true;btn.textContent='Submitting…';
   try{
    const docs={ic_front:await upload($('#applyIcFront').files[0],'ic-front'),ic_back:await upload($('#applyIcBack').files[0],'ic-back'),holding_ic:await upload($('#applyHoldingIc').files[0],'holding-ic'),payslip:await upload($('#applyPayslip').files[0],'payslip'),bank_statement:await upload($('#applyBankStatement').files[0],'bank-statement')};
    const x=await appSb.rpc('public_submit_loan_application',{p_full_name:$('#applyName').value,p_id_number:$('#applyIc').value,p_phone:$('#applyPhone').value,p_address:$('#applyAddress').value,p_occupation:$('#applyOccupation').value,p_employer:$('#applyEmployer').value,p_monthly_salary:Number($('#applySalary').value||0)||null,p_salary_frequency:$('#applySalaryFrequency').value,p_emergency_name:$('#applyEmergencyName').value,p_emergency_relation:$('#applyEmergencyRelation').value,p_emergency_phone:$('#applyEmergencyPhone').value,p_emergency_name_2:$('#applyEmergencyName2').value,p_emergency_relation_2:$('#applyEmergencyRelation2').value,p_emergency_phone_2:$('#applyEmergencyPhone2').value,p_bank_name:$('#applyBankName').value,p_bank_account_name:$('#applyBankAccountName').value,p_bank_account_number:$('#applyBankAccountNumber').value,p_requested_amount:Number($('#applyAmount').value),p_purpose:$('#applyPurpose').value,p_document_paths:docs});
    if(x.error||!x.data?.ok)throw x.error||new Error('Submit failed');
    $('#applicationCode').textContent=x.data.application_code;try{await appSb.functions.invoke('telegram-bot',{body:{action:'loan_application',application_code:x.data.application_code}})}catch(_){ }f.reset();show('applicationSuccessView');
   }catch(err){alert(err.message||String(err))}finally{btn.disabled=false;btn.textContent='Submit Application'}
  });
 });
})();
