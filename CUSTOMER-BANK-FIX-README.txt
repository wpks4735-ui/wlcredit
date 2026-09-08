WL Credit 客户个人银行修复说明

上线顺序
1. 在 Supabase SQL Editor 执行本包 WL-CREDIT-CUSTOMER-BANK-FIX.sql 的全部内容。
   本次需要执行，以保证字段完整和新旧字段双向同步；可重复执行。
   不需要逐个执行旧版 V24.3 / V24.4 / V24.4.1 银行 SQL。
2. 将本 ZIP 内 wlcredit-main 的项目文件更新到原网站项目并部署。
3. 刷新后台；/admin/ 会自动进入统一的 /admin.html。
4. 创建测试客户，填写个人银行名称、户名及以 00 开头的账号。
   创建后查看客户详情，再刷新、编辑、重新登录确认资料仍显示。
   同时确认公司收款账户仍显示在独立区域。

原因与修复
- admin.html 未加载旧 v24.4 个人银行显示补丁，而 extensions.js 的最终客户详情只显示公司收款银行。
- 新建客户先调用 staff_create_customer_auto，再更新 customers；原流程未验证更新结果，重试可能再次创建。
- 编辑表单只读取新字段，旧 account_name / account_number / bank_account 数据可能显示为空。
- /admin/index.html 仍运行不同版本脚本，已统一入口。

修改文件
- admin.html：加载个人银行模块，更新已修改脚本的缓存版本。
- admin/index.html：转到统一后台，保留查询参数和 URL hash。
- extensions.js：客户详情直接渲染独立个人银行卡片，明确公司收款银行标题。
- wl-credit-integrated-v25.8.4.js：编辑回填兼容旧字段；保存去除首尾空格；
  验证更新返回记录及银行字段；防重复提交；二次保存失败后在同一表单重试同一客户；
  创建结果缺少 ID 时停止继续操作并提示检查客户列表；上传失败不重复创建客户。
新增文件
- customer-personal-bank.js：统一客户个人银行读取与安全显示。
- WL-CREDIT-CUSTOMER-BANK-FIX.sql：统一迁移。
- tests/customer-bank.test.cjs：9 项回归测试，可用 node --test tests/customer-bank.test.cjs 运行。
- CUSTOMER-BANK-FIX-README.txt：本说明。

数据结构与兼容规则
- 客户个人银行的主记录保存在 customers：bank_name、bank_account_name、bank_account_number。
- 兼容 customers.customer_bank_name、account_name、account_number、bank_account。
- 读取优先使用非空新字段，然后读取旧字段；账号始终以文本保存，保留前导零。
- SQL 在缺少新字段值时使用旧字段补齐，并修复 INSERT / UPDATE / 清空值时的别名同步。
- 历史新旧字段都非空但值冲突时，迁移保留原值，末尾输出冲突客户数量供复核。
  页面优先显示新字段；以后明确编辑银行资料会按新值同步别名。
- loans 通过 customer_id 关联客户；现有前端贷款流程使用客户银行资料。
  ZIP 不含线上完整 loans 建表定义及所有 RPC 定义，无法证明历史 loans 中同名 bank 字段的归属。
  本次不将不明确的贷款银行字段或公司出款字段回填为个人银行，也不改写贷款历史快照。
- assigned_bank_id / receiving_bank 属于公司收款账户；company_bank_accounts 属于公司银行。
  个人银行读取、SQL 回填完全不使用这些数据。

验证范围及限制
- 已通过修改后 JavaScript 语法检查和 9 项模拟保存/UI 内容回归测试。
- 未连接线上 Supabase，未执行线上 SQL，也未进行真实登录后的浏览器端验收。
- 未改变 RLS 权限；数据库权限不足会明确报错，不会显示“已保存”。
- 创建与扩展资料更新仍为两步：基础客户创建成功、后续失败时，客户已经存在。
  保持当前表单可直接重试；若关闭窗口，去客户列表编辑已有客户，避免重复创建。
  若创建请求因网络中断导致结果不确定，先检查客户列表再重试。
- 若旧资料从未成功写入任何数据库字段，不能从空记录恢复，需在客户编辑页补填。
- 本 SQL 是当前已部署项目的银行修复迁移，不是新建空数据库的全系统安装脚本。
