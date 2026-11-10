export function DataLoading({ label = "Loading…" }: { label?: string }) {
  return <div className="data-loading" role="status" aria-label={label} aria-busy="true">
    <span className="data-loading-label">{label}</span>
    <div className="data-loading-heading" aria-hidden="true"/>
    <div className="data-loading-grid" aria-hidden="true"><div className="data-loading-side"/>
      <div className="data-loading-list">{Array.from({length:4},(_,index)=><div className="data-loading-card" key={index}><i/><i/><i/></div>)}</div>
    </div>
  </div>;
}
