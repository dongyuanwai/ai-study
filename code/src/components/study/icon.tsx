import type { CSSProperties } from "react";

const paths = {
  timeline: <><path d="M6 5v14M10 5h10M10 12h7M10 19h10"/><circle cx="6" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="19" r="2"/></>,
  home: <><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></>,
  book: <><path d="M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15"/></>,
  scan: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  diagonal: <path d="M6 18 18 6M6 6h12v12"/>,
  chevron: <path d="m9 5 7 7-7 7"/>,
  down: <path d="m5 9 7 7 7-7"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  message: <path d="M3 4h18v13H8l-5 4zM7 8h10M7 12h7"/>,
} as const;
export function Icon({ name, style }: { name: keyof typeof paths; style?: CSSProperties }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
