import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "langchain";

export function validateAnswer(value, question) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("模型未返回有效答案，请重新生成。");
  if (typeof value.answer !== "string" || !value.answer.trim() || value.answer.length > 24000) {
    throw new Error("模型未返回有效答案，或内容过长，请重新生成。");
  }
  const result = { answer: value.answer.trim() };
  if (question.group === "手撕算法" && (!/```(?:javascript|js)\s*\n/.test(result.answer) || /```python\b/.test(result.answer))) {
    throw new Error("算法回答必须包含 JavaScript 实现，请重新生成。");
  }
  return result;
}

export async function generateAnswer(settings, interview, question, signal, options = {}) {
  const model = new ChatOpenAI({
    model: settings.modelId,
    apiKey: settings.apiKey || "local-no-key",
    useResponsesApi: false,
    maxRetries: 0,
    timeout: 90000,
    configuration: {
      baseURL: settings.baseURL,
      fetch: options.fetch || ((url, init) => fetch(url, { ...init, redirect: "error" })),
    },
  });
  const response = await model.invoke([
    new SystemMessage("你是一位经验丰富的 AI Agent 开发工程师，拥有丰富的面试经验和项目实战经验。请结合工程实践，清晰说明关键原理、实现方法和技术取舍。请直接回答给定的面试题，使用中文 Markdown，答案包含“## 详细解答”和“## 面试口述版”两部分。详细解答讲清原理、实现和取舍；面试口述版用自然口语组织成可直接练习背诵的回答，先说结论，再讲关键点，控制在约 1–2 分钟，避免书面腔和机械罗列。只输出这两部分，不重复题目，不附加易错点、开场白或来源链接，不输出 JSON。回答准确清晰，不编造个人项目经历或数据。算法题使用 JavaScript，包含实现、复杂度和必要的边界说明。"),
    new HumanMessage(JSON.stringify({ company: interview.company, role: interview.role, group: question.group, topic: question.topic, question: question.title })),
  ], { signal });
  const content = typeof response.content === "string" ? response.content : response.content.filter(part => part.type === "text").map(part => part.text).join("\n");
  return validateAnswer({ answer: content }, question);
}
