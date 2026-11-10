# 服务端数据层

此目录只供 Next.js 服务端和本地 Node 工具使用，禁止客户端组件导入。`content.mjs` 管理题库读写和 JSON 只读回退，`api.mjs` 负责路由、输入校验及管理员鉴权。HTTP 接口位于 `/api/data/`，说明见 `docs/data-api.md`。
