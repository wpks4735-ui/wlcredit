/* Customer-owned bank fields only. Never resolve company bank assignments here. */
(()=>{
 'use strict';
 const text=v=>String(v??'').trim();
 const first=(...values)=>values.map(text).find(Boolean)||'';
 const read=(c={})=>({
  bank_name:first(c.bank_name,c.customer_bank_name),
  bank_account_name:first(c.bank_account_name,c.account_name),
  bank_account_number:first(c.bank_account_number,c.account_number,c.bank_account)
 });
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const L=(zh,en,ms)=>window.SWK_LANG?.current==='zh'?zh:window.SWK_LANG?.current==='ms'?ms:en;
 function card(c){
  const b=read(c);
  return `<div class="card" id="customerPersonalBank"><h3>${L('客户个人银行资料','Customer Personal Bank Information','Maklumat Bank Peribadi Pelanggan')}</h3>${[
   [L('银行名称','Bank Name','Nama Bank'),b.bank_name],
   [L('银行户名','Account Holder Name','Nama Pemilik Akaun'),b.bank_account_name],
   [L('银行账号','Account Number','Nombor Akaun'),b.bank_account_number]
  ].map(([label,value])=>`<div class="kv"><span>${label}</span><strong>${esc(value||L('未填写','Not provided','Belum diisi'))}</strong></div>`).join('')}</div>`;
 }
 window.WLCustomerBank={read,card};
})();
