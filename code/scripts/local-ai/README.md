# AI 答案工具

- `model.mjs`：本地与线上共用的 LangChain 调用和输出校验。
- `settings.mjs`：本地 AI 参数读写 .env.local，保留其他配置；兼容迁移旧 settings.json。
- `service.mjs`：只监听本机的管理员预览、审核与确认保存服务。
- `../dev.mjs`：启动 Next.js 与本地维护服务。

线上只读生成入口在 src/lib/server/ai-answer.mjs，允许用户自带配置或通过访问密钥使用默认模型；只有后者能取得签名预览，再经 ai-approval.mjs 校验后确认写入对应题目。用户临时配置不落盘，答案仅在明确确认替换后写入数据库。

本地默认配置统一存入 .env.local，备份仍在 .local-ai/backups。确认后仅更新 answer；配置 Supabase 后调用 ../database/repository.mjs 的事务方法，旧内容保存到数据库历史表。
