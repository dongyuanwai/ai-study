import type { SVGProps } from "react";

type IconName = "book" | "spark" | "repeat" | "chart" | "arrow" | "check" | "clock" | "layers" | "history" | "external";

const paths: Record<IconName, React.ReactNode> = {
  book: <><path d="M12 5.5C9 3.8 5.5 3.5 3 4v15c3-.5 6.5-.2 9 1.5M12 5.5c3-1.7 6.5-2 9-1.5v15c-3-.5-6.5-.2-9 1.5V5.5Z"/></>,
  spark: <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z"/></>,
  repeat: <><path d="M20 7H6a3 3 0 0 0-3 3v1m0-4 3 3-3 3M4 17h14a3 3 0 0 0 3-3v-1m0 4-3-3 3-3"/></>,
  chart: <><path d="M4 20V11m6 9V4m6 16v-7m4 7V8"/></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
  check: <><path d="m4 12 5 5L20 6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></>,
  history: <><path d="M3 12a9 9 0 1 0 2.5-6.2M3 4v4h4M12 7v5l3 2"/></>,
  external: <><path d="M13 5h6v6M19 5l-9 9M19 14v5H5V5h5"/></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
