"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Markdown } from './markdown';
import styles from './local-ai-editor.module.css';

type Config = { mode: 'custom'; settings: { baseURL: string; apiKey: string; modelId: string } } | { mode: 'default'; accessKey: string };
const AiContext = createContext<{ config: Config | null; configure: (value: Config | null) => void; open: boolean; setOpen: (value: boolean) => void } | null>(null);
export function AiAnswerProvider({ children }: { children: ReactNode }) {
  const [config, configure] = useState<Config | null>(null);
  const [open,setOpen] = useState(false);
  return <AiContext.Provider value={{config,configure,open,setOpen}}>{children}</AiContext.Provider>;
}
function useAi() { const value=useContext(AiContext); if(!value) throw new Error('AI 配置不可用'); return value; }
export function AiSettings() {
  const {config,configure,open,setOpen}=useAi();
  const [mode,setMode]=useState<'custom'|'default'>('custom');
  const [baseURL,setBaseURL]=useState(''),[apiKey,setApiKey]=useState(''),[modelId,setModelId]=useState(''),[accessKey,setAccessKey]=useState('');
  const clear=()=>{configure(null);setApiKey('');setAccessKey('');};
  return <div id="ai-settings" className={styles.settings}>
    <div className={styles.actions}><button className={styles.button} onClick={()=>setOpen(!open)} aria-expanded={open}>AI 设置</button>{config && <><span className={styles.success}>{config.mode==='custom'?'使用自己的模型':'使用默认模型'}</span><button className={styles.button} onClick={clear}>清除配置</button></>}</div>
    {open && <form className={styles.form} onSubmit={event=>{event.preventDefault();configure(mode==='custom'?{mode,settings:{baseURL:baseURL.trim(),apiKey:apiKey.trim(),modelId:modelId.trim()}}:{mode,accessKey:accessKey.trim()});setOpen(false);}}>
      <div className={styles.actions} role="group" aria-label="模型使用方式"><button type="button" className={mode==='custom'?styles.primary:styles.button} aria-pressed={mode==='custom'} onClick={()=>{setMode('custom');}}>自己的模型</button><button type="button" className={mode==='default'?styles.primary:styles.button} aria-pressed={mode==='default'} onClick={()=>{setMode('default');}}>访问密钥</button></div>
      {mode==='custom'?<><label>API 地址<input type="url" required placeholder="https://你的接口地址/v1" value={baseURL} onChange={e=>setBaseURL(e.target.value)} autoComplete="off"/></label><label>模型 ID<input required value={modelId} onChange={e=>setModelId(e.target.value)} autoComplete="off"/></label><label>API Key<input required type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} autoComplete="new-password"/></label></>:<label>访问密钥<input required type="password" value={accessKey} onChange={e=>setAccessKey(e.target.value)} autoComplete="new-password"/></label>}
      <p>{mode==='custom'?'支持 OpenAI 兼容的公网 HTTPS 接口。':'输入站点提供的访问密钥，使用默认模型。'}配置仅保留在当前页面，刷新后清除。</p>
      <button className={styles.primary} type="submit">应用配置</button>
    </form>}
  </div>;
}
export function AiAnswer({ interviewId, questionId, onSaved }: { interviewId: string; questionId: string; onSaved: (value: {answer: string}) => void }) {
  const {config,setOpen}=useAi();
  const [answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [approval,setApproval]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  const generate=async()=>{
    if(!config){setOpen(true);setError('请先配置自己的模型，或填写访问密钥。');document.getElementById('ai-settings')?.scrollIntoView({block:'center'});return;}
    setBusy(true);setError('');setMessage('');const current=new AbortController();controller.current=current;
    try{const response=await fetch('/api/ai/answer/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interviewId,questionId,...config}),signal:current.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'生成失败，请稍后重试。');setAnswer(data.answer);setApproval(data.approvalToken||'');}
    catch(reason){if(!current.signal.aborted)setError(reason instanceof Error?reason.message:'生成失败，请稍后重试。');}
    finally{controller.current=null;setBusy(false);}
  };
  const approve=async()=>{
    if(!approval||config?.mode!=='default')return;
    setSaving(true);setError('');setMessage('');
    try{const response=await fetch('/api/ai/approve/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({approvalToken:approval,accessKey:config.accessKey,confirm:true})});const data=await response.json();if(!response.ok)throw new Error(data.error||'保存失败');onSaved({answer:data.answer});setApproval('');setMessage('公共答案已更新。');}
    catch(reason){setError(reason instanceof Error?reason.message:'保存失败，请重试。');}
    finally{setSaving(false);}
  };
  return <div className={styles.editor}><div className={styles.actions}><button className={styles.button} onClick={generate} disabled={busy||saving}>{busy?'正在生成…':'AI 回答'}</button>{busy&&<button className={styles.button} onClick={()=>controller.current?.abort()}>取消生成</button>}</div>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {answer&&<section className={styles.preview} aria-label="我的 AI 回答"><h5>AI 回答</h5><p className={styles.hint}>{approval && config?.mode==='default'?'确认后可替换这道题的公共参考答案。':'仅供本次查看。'}</p><Markdown value={answer}/>{approval && config?.mode==='default' && <button className={styles.primary} disabled={busy||saving} onClick={approve}>{saving?'正在保存…':'替换公共答案'}</button>}{message && <p role="status" className={styles.success}>{message}</p>}<button className={styles.button} disabled={saving} onClick={()=>{setAnswer('');setApproval('');}}>收起回答</button></section>}
  </div>;
}
