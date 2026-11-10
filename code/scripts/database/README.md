# 数据库工具

- `config.mjs`：读取 .env.local，校验本地写入凭据。
- `repository.mjs`：AI 生成前读取当前题目，确认后调用事务函数保存答案。
- `seed.mjs`：导入知识库和公司真题；重复执行仅补缺，不覆盖云端答案。
- `test-postgres.mjs`：用隔离临时 PostgreSQL 容器测试迁移、权限和并发，不连接云端。

REST 传输层在 src/lib/supabase-data.mjs；通用 CRUD 业务在 src/lib/server。不要在浏览器导入服务端模块或密钥。
