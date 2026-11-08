import { Fragment, type ReactNode } from "react";

function inline(value: string): ReactNode[] {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map((part, index) => {
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}
export function Markdown({ value }: { value: string }) {
  const lines = value.split("\n"), blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim(), key = index;
    if (!line) { index++; continue; }
    if (line.startsWith("```")) {
      const code: string[] = []; index++;
      while (index < lines.length && !lines[index].trim().startsWith("```")) code.push(lines[index++]);
      index++; blocks.push(<pre key={key}><code>{code.join("\n")}</code></pre>); continue;
    }
    if (line.startsWith("|") && /^\|?\s*:?-{2,}/.test(lines[index + 1]?.trim() || "")) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
      const headers = cells(line), rows: string[][] = []; index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) rows.push(cells(lines[index++]));
      blocks.push(<div className="zp-doc-table" key={key}><table><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    if (/^#{1,6}\s/.test(line)) { blocks.push(<h3 key={key}>{inline(line.replace(/^#{1,6}\s+/, ""))}</h3>); index++; continue; }
    if (/^[-*]\s/.test(line) || /^\d+[.)]\s/.test(line)) {
      const ordered = /^\d/.test(line), items: string[] = [];
      while (index < lines.length && (ordered ? /^\d+[.)]\s/ : /^[-*]\s/).test(lines[index].trim())) items.push(lines[index++].trim().replace(ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/, ""));
      const children = items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>);
      blocks.push(ordered ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>); continue;
    }
    if (/^---+$/.test(line)) blocks.push(<hr key={key}/>);
    else blocks.push(<p key={key}>{inline(line.replace(/^>\s*/, ""))}</p>);
    index++;
  }
  return <div className="zp-doc">{blocks}</div>;
}
