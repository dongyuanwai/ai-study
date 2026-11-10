"use client";

import { useEffect, useState } from "react";
import styles from "./local-ai-editor.module.css";

export type AnswerValue = { answer: string };
const origin = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_LOCAL_AI_ORIGIN : undefined;
const token = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_LOCAL_AI_TOKEN : undefined;
function useLocalEditor() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => { setEnabled(Boolean(origin && token && ["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname))); }, []);
  return enabled;
}
async function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  if (!origin || !token) throw new Error("请通过 npm run dev 启动本地 AI 工具。");
  let response;
  try {
    response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal, cache: "no-store" });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("无法连接本地 AI 服务，请重新启动 npm run dev 并刷新页面。");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "操作失败，请稍后重试。");
  return data;
}

export function LocalAiSettings() {
  const enabled = useLocalEditor();
  const [open, setOpen] = useState(false);
  const [baseURL, setBaseURL] = useState("");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!enabled) return null;
  async function toggle() {
    if (open) { setOpen(false); setApiKey(""); return; }
    setOpen(true); setBusy(true); setError(""); setMessage("");
    try {
      const settings = await request<{ baseURL: string; modelId: string; hasApiKey: boolean }>("/settings");
      setBaseURL(settings.baseURL); setModelId(settings.modelId); setHasApiKey(settings.hasApiKey);
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <div className={styles.settings}>
    <button type="button" className={styles.button} onClick={toggle} aria-expanded={open}>本地默认配置</button>
    {open && <form className={styles.form} onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage(""); setError("");
      try {
        const saved = await request<{ baseURL: string; modelId: string; hasApiKey: boolean }>("/settings", "POST", { baseURL, modelId, apiKey });
        setBaseURL(saved.baseURL); setModelId(saved.modelId); setHasApiKey(saved.hasApiKey); setApiKey(""); setMessage("配置已保存。");
      } catch (error) { setError((error as Error).message); }
      finally { setBusy(false); }
    }}>
      <label>URL（Base URL）<input type="url" required value={baseURL} onChange={event => setBaseURL(event.target.value)} placeholder="https://你的接口地址/v1" autoComplete="off" disabled={busy}/></label>
      <label>模型 ID<input required value={modelId} onChange={event => setModelId(event.target.value)} placeholder="填写服务商提供的模型 ID" autoComplete="off" disabled={busy}/></label>
      <label>API Key<input type="password" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={hasApiKey ? "已配置，留空保留原 Key" : "填写 API Key；无鉴权的本机模型可留空"} autoComplete="new-password" disabled={busy}/></label>
      <p>支持 OpenAI 兼容接口。Key 仅存于本机 .env.local，不提交到 Git。更换 URL 时需重新填写 Key。</p>
      <button type="submit" className={styles.primary} disabled={busy}>{busy ? "处理中…" : "保存配置"}</button>
      {message && <span role="status" className={styles.success}>{message}</span>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>}
  </div>;
}
