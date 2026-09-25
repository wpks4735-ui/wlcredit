1.6.0 Telegram 还款通知跳转
1. 上传本包网页文件覆盖 GitHub，等待部署完成。
2. Supabase → Edge Functions → telegram-bot → Code：用本包 supabase/functions/telegram-bot/index.ts 替换完整代码，点击 Deploy updates。不是粘贴到 SQL Editor。
3. 默认后台网址 https://wlcredit.pages.dev/admin.html。如换域名，在 Edge Function Secrets 设置 ADMIN_SITE_URL 为新网站地址。
4. 新还款通知底部会显示“进入网页审核收款”；旧通知不会补按钮。
5. 未登录先登录，财务或 Super Admin 才能进入审核。仅跳转并标记，不自动确认收款。
本次不需要新 SQL；原分成 SQL 已执行则无需重复。
1.5.1 修正：客服报表接入实际总览页面，姓名可点击，月份选择、分成及PDF下载生效；保留自动刷新。修正总览初始化旧控件引用，备份区保持可见。
本次SQL与1.5.0相同，已执行成功无需重复执行。
1.5.0 客服月度业绩与分成
先在 Supabase SQL Editor 执行 STAFF-COMMISSION.sql 一次，再上传网站文件。
总览客服表可选择月份，点击姓名打开明细及下载 PDF。分成由 Super Admin 按客服及月份设置，客服仅可查看自身。
清账收款来自已入账记录的 principal_amount 分类；利息及逾期独立统计。未分类金额不计入利息分成。盈亏=共收款-共放款，未扣分成。客户数及进行中贷款是当前数量。
本包包含所有之前的页面修改，共30文件（含此说明及SQL）。
