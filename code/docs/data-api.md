# 数据增删改查接口

接口基路径：`/api/data/`，路径以 `/` 结尾。知识库和通用面试题来自同一份数据，不重复建表；公司真题独立存储。所有 GET 公开，写操作必须携带 `Authorization: Bearer <ADMIN_API_TOKEN>`。管理员令牌和 Supabase Secret Key 不放入前端代码。

| 资源 | 列表/新增 | 详情/修改/删除 |
| --- | --- | --- |
| 知识库、通用面试题 | `/api/data/knowledge/` | `/api/data/knowledge/{id}/` |
| 公司面试记录 | `/api/data/interviews/` | `/api/data/interviews/{id}/` |
| 某场公司面试的题目与答案 | `/api/data/interviews/{interviewId}/questions/` | `/api/data/interviews/{interviewId}/questions/{questionId}/` |

列表使用 GET，新增 POST；详情 GET，部分修改 PATCH，删除 DELETE。新增公司记录不接受嵌套 questions，先建记录再逐题新增。支持以下参数：

- `limit`：默认 100，最大 500。
- `offset`：默认 0。
- 公司列表 `include=questions`：附带每场面试的题目。

列表返回 `{ "data": [...], "nextOffset": 100 }`，继续传 nextOffset 直至 null；详情和写入返回 `{ "data": {...} }`。记录包含 `_revision` 和 `_position`。未配置数据库时，GET 返回 JSON 资料、版本为 0；写入返回 503，不修改 JSON。

## 示例

公开查询：

```sh
curl 'http://127.0.0.1:3035/api/data/knowledge/?limit=20&offset=0'
curl 'http://127.0.0.1:3035/api/data/interviews/?include=questions'
curl -i 'http://127.0.0.1:3035/api/data/knowledge/easy-1/'
```

最后一个响应包含 `ETag: "1"`（示例）。修改和删除必须提供读取到的真实版本：

```sh
curl -X PATCH 'http://127.0.0.1:3035/api/data/knowledge/easy-1/' \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'If-Match: "1"' \
  --data '{"core":"更新后的参考答案"}'
```

上面的环境变量需由调用方自行设置，不要将真实令牌写进共享脚本。不要原样执行示例覆盖现有题目。

## 新增字段

- 知识库：`id`、`number`、`title`、`level`、`category`、`sourceTopic`、`tags`、`core`、`oral`、`pitfalls`。可选 `source`（url/title/date/checkedAt）。
- 公司记录：`id`、`company`、`companyEn`、`role`、`round`、`duration`、`summary`、`tags`（数组）、`notes`（数组）；可选 `answerNote`。
- 公司题目：`id`、`number`、`group`、`topic`、`title`、`answer`、`oral`、`pitfalls`；后三项允许 null。
- 所有资源可选 `_position`（非负整数）控制顺序，默认 0。id 稳定且只允许字母、数字、下划线和连字符，创建后不可修改；`number` 为正整数。
- PATCH 只发送要修改的字段，不发送 id 或 `_revision`；空对象和未知字段会被拒绝。

知识库 level 为 简单/中等/困难，category 为 llm/prompt/rag/agent/protocol/framework/finetune/transformer/engineering。只录入真实资料，不编造个人经历或公司面试来源。

## 版本与删除

修改和删除都要 `If-Match: "版本号"`，缺失返回 428，过期返回 409。数据库使用条件写入和版本递增避免并发覆盖；题目历史和实际修改在同一事务提交。DELETE 为真实删除，旧内容留在受保护的历史表。含题目的公司面试记录不能直接删除（409），需先逐题删除。重复执行初始化导入会补回已删除但仍存在于本地 JSON 的 ID，因此初始化完成后日常管理应使用 API。

历史表 `knowledge_question_history`、`interview_answer_history` 仅管理员可读，未提供公开历史 API。公司记录的元信息不保存历史，删除前由调用方自行备份。

## 错误

400 参数错误；401 管理员令牌缺失或错误；404 无记录；405 方法错误；409 版本冲突、重复 ID 或关联数据冲突；413 请求体超过 200 KB；415 非 JSON；428 缺少版本；502 数据库请求失败；503 未配置数据库/管理员接口或服务暂不可用。

API 不自动导入数据，不将数据库原始错误或任何密钥返回给客户端。AI 生成入口为 POST /api/ai/answer/。自带模型仅个人查看；访问密钥模式返回签名预览，可经 POST /api/ai/approve/ 确认替换对应题目的 answer，原 oral 和 pitfalls 保留。此能力不授予通用 CRUD 管理权限。


## AI 生成和确认

`POST /api/ai/answer/` 请求包含 interviewId、questionId，以及下列一种配置：

- `mode: "custom"`，`settings: {baseURL, apiKey, modelId}`：自带模型，返回 answer，无写入凭据。
- `mode: "default"`，`accessKey`：通过站点访问密钥调用默认模型，返回 answer 和 approvalToken。

`POST /api/ai/approve/` 请求为 `{accessKey, approvalToken, confirm: true}`。服务器再次验证密钥和预览签名，忽略额外传来的答案/题目字段，只写入签名中指定的答案和题目。预览 30 分钟有效；修改后重复提交或版本冲突返回 409，过期返回 410。默认模型 API Key 变更会使已有签名失效，需重新生成。
