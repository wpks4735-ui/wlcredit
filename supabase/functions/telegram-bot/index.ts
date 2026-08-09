import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
const text=(v:unknown)=>String(v??"").trim();
const money=(v:number)=>`MYR ${Number(v||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const malaysiaDate=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kuala_Lumpur",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const malaysiaTime=()=>new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kuala_Lumpur",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());

const canonicalUsername=(v:unknown)=>{
  const raw=text(v).toUpperCase();
  const wl=raw.match(/^WL0*(\d+)$/);
  if(wl) return `WL${String(Number(wl[1])).padStart(3,"0")}`;
  const legacy=raw.match(/(?:SWKC|CUS|CUSTOMER|C|L)?0*(\d+)$/);
  return legacy?`WL${String(Number(legacy[1])).padStart(3,"0")}`:(raw||"-");
};
const canonicalLoanId=(v:unknown)=>{
  const raw=text(v).toUpperCase();
  const n=raw.match(/(\d+)$/)?.[1];
  return n?`L${String(Number(n)).padStart(5,"0")}`:(raw||"-");
};

async function sendTelegram(token:string,chatId:string,message:string){
  if(!token||!chatId) throw new Error("Telegram Bot Token or Chat ID is missing.");
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message,disable_web_page_preview:true})});
  const data=await r.json();
  if(!r.ok||!data?.ok) throw new Error(data?.description||"Telegram send failed");
  return data;
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return reply({ok:false,error:"Method not allowed"},405);
  try{
    const url=Deno.env.get("SUPABASE_URL")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if(!url||!service) return reply({ok:false,error:"Missing Supabase Edge Function secrets"},500);
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const body=await req.json().catch(()=>({}));
    const action=text(body.action);
    const force=body.force===true;
    const {data:settings,error:settingsError}=await admin.from("telegram_settings").select("*").eq("id",1).maybeSingle();
    if(settingsError) return reply({ok:false,error:settingsError.message},500);
    if(!settings) return reply({ok:false,error:"Telegram settings have not been configured."},400);

    // Tests and daily reports require an authenticated Admin/Super Admin, except the hourly cron action.
    if(force||["test_daily","test_notification"].includes(action)){
      const auth=req.headers.get("Authorization")||"";
      const jwt=auth.replace(/^Bearer\s+/i,"");
      const {data:{user}}=await admin.auth.getUser(jwt);
      if(!user) return reply({ok:false,error:"Not authenticated"},401);
      const {data:profile}=await admin.from("staff_profiles").select("role,is_active").eq("user_id",user.id).maybeSingle();
      if(!profile||profile.is_active===false||profile.role!=="super_admin") return reply({ok:false,error:"Super Admin access required"},403);
    }

    if(action==="loan_application"){
      if(settings.is_enabled!==true) return reply({ok:true,skipped:true});
      const code=text(body.application_code);
      const {data:a}=await admin.from("loan_applications").select("application_code,full_name,phone,requested_amount,created_at").eq("application_code",code).maybeSingle();
      if(!a) return reply({ok:false,error:"Loan application not found"},404);
      const msg=`🔔 New Loan Application\n\nApplication ID: ${a.application_code}\nName: ${a.full_name||"-"}\nPhone: ${a.phone||"-"}\nRequested Amount: ${money(a.requested_amount)}`;
      await sendTelegram(settings.bot_token,settings.notification_chat_id,msg);
      return reply({ok:true});
    }

    if(action==="payment_submission"){
      if(settings.is_enabled!==true) return reply({ok:true,skipped:true});
      const loanId=text(body.loan_id),amount=Number(body.amount||0);
      const {data:l}=await admin.from("loans").select("id,loan_id,customers(username,customer_code,full_name,phone,owner_staff_id)").eq("id",loanId).maybeSingle();
      const customerRow=(l as any)?.customers;
      const ownerId=customerRow?.owner_staff_id;
      const {data:owner}=ownerId?await admin.from("staff_profiles").select("full_name,username").eq("user_id",ownerId).maybeSingle():{data:null};
      const displayLoan=canonicalLoanId(l?.loan_id||loanId);
      const displayUsername=canonicalUsername(customerRow?.username||customerRow?.customer_code);
      const customer=customerRow?.full_name||"-";
      const staffName=(owner as any)?.full_name||(owner as any)?.username||"Unassigned";
      const msg=`💳 Customer Submitted Payment\n\nUsername: ${displayUsername}\nLoan ID: ${displayLoan}\nCustomer: ${customer}\nAssigned Staff: ${staffName}\nAmount: ${money(amount)}`;
      await sendTelegram(settings.bot_token,settings.notification_chat_id,msg);
      return reply({ok:true});
    }

    if(action==="test_notification"){
      await sendTelegram(settings.bot_token,settings.notification_chat_id,"✅ WL Credit notification group test successful.");
      return reply({ok:true});
    }
    if(action==="test_daily"){
      await sendTelegram(settings.bot_token,settings.daily_report_chat_id,"✅ WL Credit daily report group test successful.");
      return reply({ok:true});
    }

    if(action==="hourly_daily_report"||action==="daily_report"||action==="scheduled_daily_report"){
      if(settings.is_enabled!==true) return reply({ok:true,skipped:true});
      const today=malaysiaDate(),now=malaysiaTime(),configured=text(settings.daily_report_time||"21:05").slice(0,5);
      if(action==="scheduled_daily_report"||action==="hourly_daily_report"){
        const [nowHour,nowMinute]=now.split(":").map(Number);
        const [configuredHour,configuredMinute]=configured.split(":").map(Number);
        const nowTotal=nowHour*60+nowMinute;
        const configuredTotal=configuredHour*60+configuredMinute;
        // Cron checks every minute. Send on the first run at or after the time saved in Admin Settings,
        // and never more than once on the same Malaysia calendar date.
        if(!force&&(nowTotal<configuredTotal||settings.last_report_date===today)) return reply({ok:true,skipped:true,now,configured});
      }
      const monthStart=today.slice(0,7)+"-01";
      const [loansToday,repayToday,appsToday,loansMonth,repayMonth,expensesToday,expensesMonth]=await Promise.all([
        admin.from("loans").select("principal").gte("created_at",today+"T00:00:00+08:00").lt("created_at",today+"T23:59:59+08:00"),
        admin.from("repayments").select("amount").eq("payment_date",today),
        admin.from("loan_applications").select("id",{count:"exact",head:true}).gte("created_at",today+"T00:00:00+08:00").lt("created_at",today+"T23:59:59+08:00"),
        admin.from("loans").select("principal").gte("created_at",monthStart+"T00:00:00+08:00"),
        admin.from("repayments").select("amount").gte("payment_date",monthStart).lte("payment_date",today),
        admin.from("company_expenses").select("amount").eq("expense_date",today),
        admin.from("company_expenses").select("amount").gte("expense_date",monthStart).lte("expense_date",today),
      ]);
      const sum=(rows:any[]|null,key:string)=>Number((rows||[]).reduce((a,r)=>a+Number(r?.[key]||0),0));
      const todayDisbursed=sum(loansToday.data,"principal"),todayCollected=sum(repayToday.data,"amount"),todayExpenses=sum(expensesToday.data,"amount");
      const monthDisbursed=sum(loansMonth.data,"principal"),monthCollected=sum(repayMonth.data,"amount"),monthExpenses=sum(expensesMonth.data,"amount");
      const todayProfit=todayCollected-todayDisbursed-todayExpenses;
      const monthProfit=monthCollected-monthDisbursed-monthExpenses;
      const msg=`📊 WL CREDIT 每日營運報告
📅 日期：${today}

━━━━━━━━━━━━━━
🏢 今日公司營運

💸 今日放款
${(loansToday.data||[]).length} 筆｜${money(todayDisbursed)}

💰 今日收款
${(repayToday.data||[]).length} 筆｜${money(todayCollected)}

🆕 新貸款申請
${appsToday.count||0} 筆

🧾 公司支出
${money(todayExpenses)}

📈 今日盈虧
${money(todayProfit)}

━━━━━━━━━━━━━━
📆 本月累計

💸 本月放款：${money(monthDisbursed)}
💰 本月收款：${money(monthCollected)}
🧾 本月開銷：${money(monthExpenses)}
📈 本月盈虧：${money(monthProfit)}

━━━━━━━━━━━━━━
🤖 WL Credit 系統自動發送`;
      await sendTelegram(settings.bot_token,settings.daily_report_chat_id,msg);
      await admin.from("telegram_settings").update({last_report_date:today,last_report_sent_at:new Date().toISOString()}).eq("id",1);
      return reply({ok:true});
    }

    return reply({ok:false,error:`Unsupported action: ${action}`},400);
  }catch(e){console.error(e);return reply({ok:false,error:e instanceof Error?e.message:String(e)},500)}
});
