const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{if(req.url==='/'){res.end('<html><body><div id="modalBody"></div></body></html>');return}res.statusCode=404;res.end()}).listen(0,'127.0.0.1');
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
 try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(()=>{window.state={staff:{},loans:[]};window.esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));window.openCustomerProfile=()=>{};window.toast=()=>{};window.modal=()=>{};});
 await page.addScriptTag({path:path.join(root,'vendor/pdf-lib.min.js')});await page.addScriptTag({path:path.join(root,'customer-personal-bank.js')});await page.addScriptTag({path:path.join(root,'loan-pdf.js')});
 const result=await page.evaluate(async()=>{
 const api=WLLoanPDF,expect=(ok,msg)=>{if(!ok)throw Error(msg)},c={id:'customer-1',customer_code:'WL022',full_name:'TEST CUSTOMER 测试客户',id_number:'000000-00-0000',phone:'60000000000',address:'TEST ADDRESS 测试地址',work_salary:'TEST JOB | RM3156',bank_name:'RHB BANK',bank_account_name:'TEST CUSTOMER 测试客户',bank_account_number:'0000-0000-0000',emergency_name:'TEST CONTACT ONE',emergency_relation:'WIFE',emergency_phone:'60000000001',emergency_name_2:'TEST CONTACT TWO',emergency_relation_2:'MOTHER',emergency_phone_2:'60000000002'},l={id:'loan-1',loan_id:'SAMPLE-LOAN',customer_id:c.id,status:'active',principal:1100,interest:400,settlement_amount:1500,due_date:'2026-09-30',disbursement_date:'2026-09-08'};
 expect(!api.approved({status:'pending_disbursement'}),'pending gated');expect(!api.approved({status:'rejected'}),'rejected gated');expect(api.approved(l),'active allowed');expect(!api.fields(c,l).some(r=>/DUE DATE|STATUS|2026-09-30/.test(r[0])),'no due date or status');expect(api.fields(c,{...l,due_date:null}).length>0,'due date not required for export');
 expect(api.fields(c,{...l,interest:0}).some(r=>r[0].includes('RM 0.00')),'zero interest');let failed=false;try{api.fields(c,{...l,interest:null})}catch(_){failed=true}expect(failed,'missing amount blocked');
 const source=await PDFLib.PDFDocument.create();source.addPage().drawText('PDF ATTACHMENT TEST - PAGE 1');source.addPage().drawText('PDF ATTACHMENT TEST - PAGE 2');const pdfBlob=new Blob([await source.save()],{type:'application/pdf'});
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=300;const ctx=canvas.getContext('2d');ctx.fillStyle='#123a66';ctx.fillRect(0,0,600,300);ctx.fillStyle='white';ctx.font='26px sans-serif';ctx.fillText('IMAGE / VIDEO TEST',40,150);const image=await new Promise(r=>canvas.toBlob(r,'image/png'));
 const stream=canvas.captureStream(10),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const videoPromise=new Promise(r=>rec.onstop=()=>r(new Blob(chunks,{type:'video/webm'})));rec.start();const frames=setInterval(()=>{ctx.fillRect(0,0,10,10);},50);await new Promise(r=>setTimeout(r,1000));clearInterval(frames);rec.stop();const video=await videoPromise;stream.getTracks().forEach(t=>t.stop());const videoUrl=URL.createObjectURL(video);
 const docs=[{id:'d1',storage_path:'customer-1/a.pdf',file_name:'Example-statement.pdf',mime_type:'application/pdf'},{id:'d2',storage_path:'customer-1/opaque-photo',file_name:'Example-photo.png',mime_type:''},{id:'d3',storage_path:'customer-1/opaque-video',file_name:'Example-video.webm',mime_type:''}];
 window.sb={storage:{from:()=>({download:async p=>({data:p.endsWith('.pdf')?pdfBlob:image}),createSignedUrl:async()=>({data:{signedUrl:videoUrl}})})}};
 const bytes=await api.build(c,l,docs);const output=await PDFLib.PDFDocument.load(bytes);expect(output.getPageCount()===7,'all PDF/image/video pages appended');
 const last=output.getPages().at(-1);expect(last.node.Annots()?.size()===1,'video link present');
 const link=api.videoURL(docs[2]);expect(link.includes('#loan-video=')&&!link.includes('token='),'durable video link without token');
 window.state.loans=[l,{...l,id:'pending',status:'pending'},{...l,id:'foreign',customer_id:'foreign'}];window.openCustomerProfile(c.id);expect(document.querySelectorAll('[data-loan-pdf]').length===1,'customer scoped button');
 window.sb.storage.from=()=>({download:async()=>({error:{message:'Denied'}})});failed=false;try{await api.build(c,l,[docs[0]])}catch(e){failed=e.message.includes('Example-statement.pdf')}expect(failed,'attachment failure aborts with filename');
 const queryCalls=[];window.sb.from=table=>({select:()=>({eq:(key,val)=>({order:async()=>({data:docs}),then:resolve=>{queryCalls.push([table,key,val]);resolve({data:key==='customer_id'?[{customer_id:c.id,document_paths:{pdf:['x.pdf','x.pdf']}}]:[{customer_id:'other',document_paths:{pdf:'secret.pdf'}}]})}})})});
 const collected=await api.collect(l);expect(collected.length===4,'dedup and foreign customer exclusion');
 URL.revokeObjectURL(videoUrl);
 return {bytes:Array.from(bytes),pages:output.getPageCount(),checks:14};
 });
 fs.writeFileSync(require('os').tmpdir()+'/WL-Loan-PDF-Integration-Test.pdf',Buffer.from(result.bytes));console.log(JSON.stringify({checks:result.checks,pages:result.pages}));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
