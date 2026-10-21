import { startSessionAction } from "@/app/actions";
import { Icon } from "@/components/icon";
import { updates } from "@/lib/updates";

export default function KnowledgePage() {
  return <>
    <div className="page-intro"><span className="eyebrow">CURATED UPDATES</span><h1>最新知识，也要练成自己的</h1><p>这里是人工选出的近期 AI 动态示例，每条都标注原始来源、发布日期和核对日期。动态知识会变化，练习前请打开来源再确认一次。</p></div>
    <form action={startSessionAction} className="knowledge-action"><input type="hidden" name="mode" value="latest"/><button className="button button-primary" type="submit">练习这些新知识 <Icon name="arrow"/></button></form>
    <div className="knowledge-grid">{updates.map((item, index) => <article className="surface-card knowledge-card" key={item.id}><span className="topic-index">{String(index + 1).padStart(2, "0")}</span><div className="tag-list">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h2>{item.title}</h2><p>先尝试自己回答，再进入练习查看参考要点。阅读原始来源时，也请留意发布状态和适用边界。</p><div className="source-meta"><span>发布 {item.publishedAt}</span><span>核对 {item.verifiedAt}</span></div><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">查看官方来源 <Icon name="external"/></a></article>)}</div>
    <p className="small-note">目前是手动维护的精选条目，不会自动抓取或自动更新；来源日期用于提醒你复核时效性。</p>
  </>;
}
