/* WL Credit - approved loan dossier. All reads remain under the signed-in user's RLS. */
(()=>{
'use strict';
const S=()=>window.state||{}, txt=v=>String(v??'').trim(), E=v=>window.esc(txt(v));
const approved=l=>['approved','active','overdue','paid','completed'].includes(txt(l?.status).toLowerCase());
function money(v){if(v===null||v===undefined||txt(v)===''||!Number.isFinite(Number(v))||Number(v)<0)throw Error('贷款金额不完整 / Missing loan amount');return 'RM '+Number(v).toFixed(2)}
function fields(c,l){
 const b=window.WLCustomerBank.read(c);
 const ec=(n,k)=>c[`emergency_${k}${n===2?'_2':''}`]||c[`emergency_contact_${n}_${k}`]||c[`emergency_${n}_${k}`]||'';
 return [
 ['CUSTOMER INFORMATION / 客户资料',true],
 ['CUSTOMER ID / 客户编号：'+txt(c.customer_code||c.username||c.id)],
 ['NAME / 姓名：'+txt(c.full_name)],['IC / 身份证号码：'+txt(c.id_number)],['PHONE / 电话：'+txt(c.phone)],['ADDRESS / 地址：'+txt(c.address)],
 ['JOB & SALARY / 工作与薪水：'+(c.occupation||c.employer||c.monthly_salary!=null?[c.occupation,c.employer,c.monthly_salary!=null?'RM '+c.monthly_salary:''].filter(Boolean).join(' | '):txt(c.work_salary))],
 ['BANK / 个人银行：'+b.bank_name],['ACCOUNT HOLDER / 银行户名：'+b.bank_account_name],['BANK ACCOUNT / 银行账号：'+b.bank_account_number],
 ...[1,2].flatMap(n=>[[`EMERGENCY CONTACT ${n} / 紧急联系人 ${n}`,true],['NAME / 姓名：'+ec(n,'name')],['RELATIONSHIP / 关系：'+ec(n,'relation')],['CONTACT / 联系电话：'+ec(n,'phone')]]),
 ['LOAN SUMMARY / 贷款明细',true,true],['LOAN ID / 贷款编号：'+txt(l.loan_id||l.id)],
 ['NET AMOUNT / 到手金额：'+money(l.principal)],['INTEREST / 每期利息：'+money(l.interest)],['FULL SETTLEMENT / 清账金额：'+money(l.settlement_amount)],
 ['DISBURSEMENT DATE / 放款日期：'+(txt(l.disbursement_date)||'未记录 / Not recorded')],
 ['REPAYMENT TERMS / 还款说明',true],
 ['Payment must be made by 11:59 PM on the repayment due date (Malaysia time).'],['须在还款到期日当天晚上 11:59 前还款（马来西亚时间）。'],
 ['Late repayment fee: RM 200 per day after the deadline.'],['超过上述还款期限，迟还费用为每天 RM200。'],
 ['Interest and full settlement are separate. Paying interest does not reduce the full settlement amount.'],['利息与清账金额分开计算。支付利息不会抵扣或减少清账金额。'],
 ['The figures above are the recorded loan terms, not a current payoff quotation. Any late fees are separate.'],['以上为贷款记录中的约定金额，不代表当前结清报价；迟还费用另列。']
 ];
}
async function query(q){const r=await q;if(r.error)throw r.error;return r.data}
async function collect(l){
 const docs=await query(window.sb.from('customer_documents').select('*').eq('customer_id',l.customer_id).order('created_at',{ascending:true}));
 // Application uploads can predate customer creation. Include only applications linked to this customer/loan.
 const apps=await query(window.sb.from('loan_applications').select('*').eq('customer_id',l.customer_id));
 const linked=await query(window.sb.from('loan_applications').select('*').eq('created_loan_id',l.id));
 const all=[...(docs||[])];
 for(const a of [...(apps||[]),...(linked||[])]){
  if(a.customer_id&&String(a.customer_id)!==String(l.customer_id))continue;
  for(const [category,value] of Object.entries(a.document_paths||{}))for(const path of (Array.isArray(value)?value:[value])){
   if(typeof path==='string'&&path)all.push({category,storage_path:path,bucket_name:'loan-applications',file_name:path.split('/').pop()});
  }
 }
 const seen=new Set();return all.filter(d=>{if(!d.storage_path)throw Error('附件缺少路径 / Missing attachment path');const k=(d.bucket_name||'customer-documents')+'/'+d.storage_path;if(seen.has(k))return false;seen.add(k);return true});
}
async function imageData(blob){const bitmap=await createImageBitmap(blob);try{const c=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);return c.toDataURL('image/png')}finally{bitmap.close()}}
async function cover(url){return new Promise(resolve=>{const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.preload='auto';let done=false;const finish=r=>{if(done)return;done=true;clearTimeout(timer);v.removeAttribute('src');v.load();resolve(r)};const timer=setTimeout(()=>finish(null),12000);v.onerror=()=>finish(null);v.onloadeddata=()=>{try{const c=document.createElement('canvas');c.width=640;c.height=Math.max(1,Math.round(640*v.videoHeight/v.videoWidth));c.getContext('2d').drawImage(v,0,0,c.width,c.height);finish(c.toDataURL('image/png'))}catch(_){finish(null)}};v.src=url;v.play().catch(()=>{});})}
async function build(c,l,docs,progress=()=>{}){
 if(!approved(l))throw Error('贷款尚未通过 / Loan is not approved');
 const isVideo=d=>txt(d.mime_type).startsWith('video/')||/\.(mp4|mov|webm)$/i.test(d.storage_path||'')||/\.(mp4|mov|webm)$/i.test(d.file_name||'');
 docs=[...docs.filter(d=>!isVideo(d)),...docs.filter(isVideo)];
 let totalVideoBytes=0,photoCount=0;
 const rows=fields(c,l),P=window.PDFLib,pdf=await P.PDFDocument.create();
 const W=595,H=842,scale=2;let canvas,ctx,y,links=[],previews=[];
 function page(){canvas=document.createElement('canvas');canvas.width=W*scale;canvas.height=H*scale;ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='white';ctx.fillRect(0,0,W,H);ctx.fillStyle='#123a66';ctx.fillRect(0,0,W,95);ctx.fillStyle='white';ctx.font='bold 22px "Microsoft YaHei",sans-serif';ctx.fillText('WL CREDIT',42,43);ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText('LOAN DOSSIER / 客户贷款资料',42,72);y=123;links=[];previews=[]}
 async function flush(){ctx.fillStyle='#627387';ctx.font='9px "Microsoft YaHei",sans-serif';ctx.fillText('PRIVATE / 私人资料  |  '+txt(l.loan_id||l.id).slice(0,45),42,816);const im=await pdf.embedPng(canvas.toDataURL('image/png'));const p=pdf.addPage([W,H]);p.drawImage(im,{x:0,y:0,width:W,height:H});for(const preview of previews)p.drawPage(preview.page,preview.options);for(const a of links){const ref=pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'FileAttachment',Rect:[519,H-a.y-5,542,H-a.y+18],FS:a.fileRef,Name:'Paperclip',Contents:P.PDFHexString.fromText(a.name),T:P.PDFHexString.fromText(a.title||'Video / 视频附件'),F:4}));p.node.addAnnot(ref)}}
 async function line(value,heading=false,newPage=false){if(newPage&&y>123){await flush();page()}ctx.font=(heading?'bold 12':'11')+'px "Microsoft YaHei","Noto Sans CJK SC",sans-serif';const lines=[];let s='';for(const ch of txt(value)){if(ctx.measureText(s+ch).width>487){lines.push(s);s=ch}else s+=ch}lines.push(s);const h=lines.length*18+(heading?20:10);if(y+h>782){await flush();page();ctx.font=(heading?'bold 12':'11')+'px "Microsoft YaHei",sans-serif'}if(heading){ctx.fillStyle='#edf3f9';ctx.fillRect(42,y-14,511,h);y+=4}ctx.fillStyle='#123a66';for(const t of lines){ctx.fillText(t,53,y);y+=18}y+=heading?15:10}
 page();for(const r of rows)await line(...r);
 if(!docs.length)await line('No uploaded files / 暂无上传资料');
 await flush();
 for(let i=0;i<docs.length;i++){
  const d=docs[i],name=d.file_name||d.storage_path.split('/').pop(),bucket=d.bucket_name||'customer-documents';progress(`附件 / Attachment ${i+1} / ${docs.length}: ${name}`);
  try{
   const video=txt(d.mime_type).startsWith('video/')||/\.(mp4|mov|webm)$/i.test(d.storage_path)||/\.(mp4|mov|webm)$/i.test(name);
   if(video){
    if(photoCount){await flush();photoCount=0;}
    const blob=await query(window.sb.storage.from(bucket).download(d.storage_path));if(!blob||!blob.size)throw Error('Video file is empty / 视频文件为空');
    if(blob.size>200*1024*1024||totalVideoBytes+blob.size>350*1024*1024)throw Error('Video files are too large for browser export / 视频超过浏览器导出限制（单个200MB，合计350MB）');
    totalVideoBytes+=blob.size;
    const objectURL=URL.createObjectURL(blob);let thumbnail;try{thumbnail=await cover(objectURL)}finally{URL.revokeObjectURL(objectURL)}
    const ext=/\.(mp4|mov|webm)$/i.exec(name)?.[1]?.toLowerCase()||/\.(mp4|mov|webm)$/i.exec(d.storage_path)?.[1]?.toLowerCase()||(txt(d.mime_type||blob.type).includes('webm')?'webm':txt(d.mime_type||blob.type).includes('quicktime')?'mov':'mp4');
    const attachmentName='video-'+(i+1)+'.'+ext;
    await pdf.attach(await blob.arrayBuffer(),attachmentName,{mimeType:ext==='mov'?'video/quicktime':'video/'+ext,description:name});
    await pdf.flush();
    const fileNames=pdf.catalog.lookup(P.PDFName.of('Names'),P.PDFDict).lookup(P.PDFName.of('EmbeddedFiles'),P.PDFDict).lookup(P.PDFName.of('Names'),P.PDFArray);
    const fileRef=fileNames.get(fileNames.size()-1);
    page();await line('CUSTOMER VIDEO / 客户视频',true);await line(name);
    if(thumbnail){const img=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=thumbnail});const r=Math.min(470/img.width,290/img.height);ctx.drawImage(img,53,y,img.width*r,img.height*r);y+=img.height*r+30}
    else {ctx.fillStyle='#edf3f9';ctx.fillRect(53,y,470,100);ctx.fillStyle='#123a66';ctx.font='bold 26px sans-serif';ctx.fillText('VIDEO',230,y+60);y+=130;}
    ctx.fillStyle='#d9eaff';ctx.fillRect(42,y-18,511,30);links.push({y,fileRef,name:attachmentName});await line('VIDEO ATTACHMENT / 视频附件');
    await line('如无法打开，请联系我。');
    await line('If you cannot open this file, please contact me.');
    await flush();continue;
   }
   const blob=await query(window.sb.storage.from(bucket).download(d.storage_path));if(!blob)throw Error('Empty file');if(blob.size>80*1024*1024)throw Error('File exceeds 80 MB / 文件超过80MB');
   const isPDF=txt(d.mime_type)==='application/pdf'||/\.pdf$/i.test(d.storage_path)||/\.pdf$/i.test(name)||blob.type==='application/pdf';
   if(isPDF){
    if(photoCount){await flush();photoCount=0;}
    const bytes=await blob.arrayBuffer();if(!bytes.byteLength)throw Error('Empty PDF / PDF文件为空');
    const attachmentName='document-'+(i+1)+'.pdf';
    await pdf.attach(bytes,attachmentName,{mimeType:'application/pdf',description:name});await pdf.flush();
    const fileNames=pdf.catalog.lookup(P.PDFName.of('Names'),P.PDFDict).lookup(P.PDFName.of('EmbeddedFiles'),P.PDFDict).lookup(P.PDFName.of('Names'),P.PDFArray);
    const fileRef=fileNames.get(fileNames.size()-1);
    page();await line('PDF DOCUMENT / PDF 文件',true);await line(name);
    // Preview the first page only. Keep the full original file byte-for-byte in EmbeddedFiles.
    let first;
    try{const source=await P.PDFDocument.load(bytes);if(source.getPageCount()){first=await pdf.embedPage(source.getPage(0));await first.embed();}}catch(_){first=null;}
    if(first){const r=Math.min(470/first.width,290/first.height),width=first.width*r,height=first.height*r;previews.push({page:first,options:{x:(W-width)/2,y:H-y-height,width,height}});y+=height+28;}
    else {ctx.fillStyle='#edf3f9';ctx.fillRect(53,y,470,150);ctx.fillStyle='#123a66';ctx.font='bold 36px sans-serif';ctx.fillText('PDF',250,y+85);y+=180;}
    ctx.fillStyle='#d9eaff';ctx.fillRect(42,y-18,511,30);links.push({y,fileRef,name:attachmentName,title:'PDF / PDF 文件附件'});await line('PDF ATTACHMENT / PDF 附件');
    await line('如无法打开，请联系我。');await line('If you cannot open this file, please contact me.');await flush();
   }
   else if(txt(d.mime_type||blob.type).startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(d.storage_path)||/\.(png|jpe?g|webp)$/i.test(name)){
    if(!photoCount){page();await line('PHOTOS / 客户照片',true);}const data=await imageData(blob);const im=await new Promise((ok,no)=>{const img=new Image();img.onload=()=>ok(img);img.onerror=()=>no(Error('Image decode failed / 图片无法解码'));img.src=data});const x=53+(photoCount%2)*251,top=165+Math.floor(photoCount/2)*307,r=Math.min(232/im.width,266/im.height);ctx.drawImage(im,x+(232-im.width*r)/2,top,im.width*r,im.height*r);ctx.fillStyle='#123a66';ctx.font='10px "Microsoft YaHei",sans-serif';let label=(i+1)+'. '+name;while(ctx.measureText(label).width>226)label=label.slice(0,-2)+'…';ctx.fillText(label,x,top+286);photoCount++;if(photoCount===4){await flush();photoCount=0;}
   }else throw Error('Unsupported file type / 不支持的附件类型');
  }catch(e){throw Error(name+'：'+(e.message||String(e))+'。PDF 未生成，请修复附件后重试 / Export stopped; fix this attachment and retry.')}
 }
 if(photoCount)await flush();
 pdf.setTitle('WL Credit '+txt(l.loan_id||l.id));pdf.setAuthor('WL Credit');return pdf.save();
}
let busy=false;
async function download(id,button){if(busy)return;busy=true;const old=button?.textContent;try{if(button)button.disabled=true;const progress=t=>{if(button)button.textContent=t};progress('正在读取 / Loading...');const l=await query(window.sb.from('loans').select('*').eq('id',id).single());if(!approved(l))throw Error('贷款尚未通过 / Loan is not approved');const c=await query(window.sb.from('customers').select('*').eq('id',l.customer_id).single());const docs=await collect(l);const bytes=await build(c,l,docs,progress);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=('WL-Credit-'+txt(c.customer_code||c.id)+'-'+txt(l.loan_id||l.id)).replace(/[^\w.-]/g,'_')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);window.toast('PDF 已生成 / PDF downloaded')}catch(e){window.toast(e.message||String(e),true)}finally{busy=false;if(button){button.disabled=false;button.textContent=old}}}
const oldProfile=window.openCustomerProfile;
window.openCustomerProfile=function(id){const r=oldProfile.apply(this,arguments);const host=document.querySelector('#modalBody');if(host&&!host.querySelector('#loanPdfDownloads')){const loans=(S().loans||[]).filter(l=>String(l.customer_id)===String(id)&&approved(l));if(loans.length){const div=document.createElement('div');div.id='loanPdfDownloads';div.className='card';div.innerHTML='<h3>LOAN PDF / 贷款资料 PDF</h3>'+loans.map(l=>`<p><button class="btn btn-primary" data-loan-pdf="${E(l.id)}">下载 PDF / Download PDF · ${E(l.loan_id||l.id)}</button></p>`).join('');host.prepend(div)}}return r};
document.addEventListener('click',e=>{const b=e.target.closest('[data-loan-pdf]');if(b){e.preventDefault();download(b.dataset.loanPdf,b)}});
// Retired video links must never open a modal or request a signed URL.
function clearLegacyVideoHash(){
 if(location.hash.startsWith('#loan-video='))history.replaceState(history.state,'',location.pathname+location.search);
}
clearLegacyVideoHash();
window.addEventListener('hashchange',clearLegacyVideoHash);
window.WLLoanPDF={approved,fields,collect,build,download};
})();
