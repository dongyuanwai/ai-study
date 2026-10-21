import type { Question } from "./types";

// Curated examples. Each card keeps its source and verification date so it can be reviewed later.
export const updates: Question[] = [
  {
    id: "latest-openai-voice-2026-10-16",
    number: 1,
    title: "OpenAI 新推出的 prompt-to-voice 能做什么？创建声音与使用声音有什么区别？",
    difficulty: "latest",
    topicId: "latest",
    originalCategory: "模型能力与 API 变化",
    tags: ["语音", "实时交互", "API 更新"],
    sourceUrl: "https://developers.openai.com/api/docs/changelog",
    publishedAt: "2026-10-16",
    verifiedAt: "2026-10-19",
    answer: {
      core: "OpenAI 于 2026-10-16 在更新记录中宣布，用户可以用文字描述创建自定义声音，再通过 API 或 Voice Playground 创建并在 GPT-Live 会话中复用。创建声音与后续语音生成是不同环节；创建 prompt-generated voice 免费，语音生成按 GPT-Live 会话的常规方式计费。接入前应核对目标账号、地区、使用条款和当前文档。",
      oral: "它让开发者从文字描述创建可复用的声音，并在 GPT-Live 会话中使用。创建和后续语音生成是两个环节，能力与计费都要按官方更新核对。",
      pitfalls: "不要把‘生成声音’误说成所有语音输出都免费，也不要把它等同于任意真人声音克隆。"
    }
  },
  {
    id: "latest-gemini-argon-2026-10-13",
    number: 2,
    title: "Gemini 4 Argon 的发布状态和定位是什么？选型时还应验证什么？",
    difficulty: "latest",
    topicId: "latest",
    originalCategory: "模型能力与 API 变化",
    tags: ["模型选型", "版本更新"],
    sourceUrl: "https://ai.google.dev/gemini-api/docs/changelog",
    publishedAt: "2026-10-13",
    verifiedAt: "2026-10-19",
    answer: {
      core: "Google 的 Gemini API 更新记录显示，Gemini 4 Argon 于 2026-10-13 正式可用，定位于复杂编程、Agent、数学和科学任务。‘官方定位’不是你自己的业务评测结果；选型时仍要用代表性任务比较正确率、延迟、费用、工具能力、配额及区域可用性，并核对当前迁移指南。",
      oral: "官方在 2026-10-13 宣布 Gemini 4 Argon 正式可用，主要面向复杂编程、Agent、数学和科学任务。选型不能只看发布文案，还要用自己的任务评测质量、延迟和成本。",
      pitfalls: "不要把厂商的能力描述直接当作项目里的实测结论。"
    }
  },
  {
    id: "latest-mcp-stateless-2026-07-28",
    number: 3,
    title: "MCP 2026-07-28 规范为何强调无状态协议核心？业务状态怎么办？",
    difficulty: "latest",
    topicId: "latest",
    originalCategory: "Agent 工具与协议",
    tags: ["MCP", "协议", "架构"],
    sourceUrl: "https://blog.modelcontextprotocol.io/posts/2026-07-28/",
    publishedAt: "2026-07-28",
    verifiedAt: "2026-10-19",
    answer: {
      core: "MCP 2026-07-28 版本把协议核心改为无状态：不再依赖旧式初始化握手和协议级会话 ID，请求可以由任意服务实例处理，更容易水平扩展。无状态说的是协议传输层，不意味着业务不能保存状态；购物篮或浏览器会话等业务状态可以由服务端生成显式句柄，并在后续工具参数中传递。实际接入仍需确认客户端与服务端协商的协议版本。",
      oral: "新规范减少了协议级会话依赖，让请求更容易落到任意实例；业务需要状态时，可以用显式句柄而不是依赖连接本身。还要注意新旧协议版本兼容。",
      pitfalls: "不要把‘协议无状态’理解成‘应用不能有状态’，也不要忽略旧客户端兼容。"
    }
  }
];
