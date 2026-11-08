"use client";

import { useEffect, useRef, type RefObject } from "react";

type Point = { x: number; y: number; z: number };
const colors: Record<string, number[]> = { tuning: [135, 91, 207], knowledge: [36, 153, 153], models: [72, 112, 221], agents: [200, 134, 65] };
const count = 680;
function geometry(id: string, i: number): Point {
  const angle = i * 2.399963229728653;
  if (id === "qlora") return { x: ((i % 17) - 8) * .12, y: ((Math.floor(i / 17) % 10) - 4.5) * .18, z: (Math.floor(i / 170) - 1.5) * .35 };
  if (id === "self-rag") { const a = i / count * Math.PI * 2, b = angle; return { x: (1 + .34 * Math.cos(b)) * Math.cos(a), y: .34 * Math.sin(b), z: (1 + .34 * Math.cos(b)) * Math.sin(a) }; }
  if (id === "a2a") { const cluster = i % 4, a = cluster * Math.PI / 2, y = 1 - 2 * (i / count), r = Math.sqrt(Math.max(0, 1 - y * y)); return { x: Math.cos(a) * .9 + Math.cos(angle) * r * .32, y: y * .32 + (cluster % 2 ? .35 : -.35), z: Math.sin(a) * .9 + Math.sin(angle) * r * .32 }; }
  if (id === "dpo") { const a = i / count * Math.PI * 8, side = i % 2 ? 1 : -1; return { x: Math.cos(a) * .75, y: (i / count - .5) * 1.9, z: Math.sin(a) * .75 * side }; }
  if (id === "graphrag") { const cluster = i % 7, a = cluster * Math.PI * 2 / 7, y = 1 - 2 * i / count, radius = Math.sqrt(1 - y * y); return { x: Math.cos(a) * .95 + Math.cos(angle) * radius * .35, y: Math.sin(a) * .75 + y * .35, z: Math.sin(angle) * radius * .55 }; }
  if (id === "mcp") { const a = i / count * Math.PI * 2, band = i % 3, radius = .75 + band * .22; return { x: Math.cos(a) * radius, y: Math.sin(a) * radius * (band === 1 ? .95 : .3), z: Math.sin(a) * radius * (band === 1 ? .25 : .95) }; }
  const y = 1 - 2 * (i / (count - 1)), radius = Math.sqrt(1 - y * y);
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
}

export function TimelineField({ progress, nodes }: { progress: RefObject<number>; nodes: { id: string; category: string }[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const signature = nodes.map(node => `${node.id}:${node.category}`).join(",");
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const scenes = signature.split(",").map(value => { const [id, category] = value.split(":"); return { id, category }; });
    const shapes = scenes.map(scene => Array.from({ length: count }, (_, i) => geometry(scene.id, i)));
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1, height = 1, frame = 0, lastTime = 0, lastProgress = -1, visible = true;
    const stage = element.closest<HTMLElement>(".zt-journey") || element.parentElement!;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const move = (event: PointerEvent) => { if (event.pointerType !== "mouse") return; const rect = stage.getBoundingClientRect(); pointer.targetX = (event.clientX - rect.left) / rect.width - .5; pointer.targetY = (event.clientY - rect.top) / rect.height - .5; };
    const leave = () => { pointer.targetX = 0; pointer.targetY = 0; };
    stage.addEventListener("pointermove", move); stage.addEventListener("pointerleave", leave);
    function resize() { const rect = element!.getBoundingClientRect(); width = rect.width; height = rect.height; const ratio = Math.min(devicePixelRatio, 2); element!.width = width * ratio; element!.height = height * ratio; context!.setTransform(ratio, 0, 0, ratio, 0, 0); lastProgress = -1; }
    const observer = new ResizeObserver(resize); observer.observe(element);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); visibility.observe(element);
    const refresh = () => { lastProgress = -1; }; media.addEventListener("change", refresh);
    function draw(time: number) {
      frame = requestAnimationFrame(draw);
      if (!visible || time - lastTime < 32) return;
      const raw = Math.max(0, Math.min(scenes.length - 1, progress.current));
      if (media.matches && raw === lastProgress) return;
      lastTime = time; lastProgress = raw;
      const base = media.matches ? Math.round(raw) : Math.floor(raw), next = Math.min(base + 1, scenes.length - 1);
      const t = media.matches ? 0 : raw - base, blend = t * t * (3 - 2 * t);
      const rgb = colors[scenes[base].category].map((value, index) => Math.round(value + (colors[scenes[next].category][index] - value) * blend));
      const color = rgb.join(",");
      context!.clearRect(0, 0, width, height);
      pointer.x += (pointer.targetX - pointer.x) * .08; pointer.y += (pointer.targetY - pointer.y) * .08;
      const angle = media.matches ? .4 : time * .000075 + raw * .8 + pointer.x * .45;
      const tilt = media.matches ? -.3 : -.35 + Math.sin(raw * .7) * .35 + pointer.y * .3;
      const scale = Math.min(width * .38, height * .55) * (media.matches ? 1 : 1 + Math.sin(t * Math.PI) * .3);
      const projected = shapes[base].map((point, i) => {
        const target = shapes[next][i], x = point.x + (target.x - point.x) * blend, y = point.y + (target.y - point.y) * blend, z = point.z + (target.z - point.z) * blend;
        const xx = x * Math.cos(angle) - z * Math.sin(angle), zz = x * Math.sin(angle) + z * Math.cos(angle);
        const yy = y * Math.cos(tilt) - zz * Math.sin(tilt), depth = y * Math.sin(tilt) + zz * Math.cos(tilt), perspective = 3.6 / (3.6 + depth);
        return { x: width * .5 + xx * scale * perspective, y: height * .48 + yy * scale * perspective, z: depth, r: perspective };
      });
      context!.lineWidth = .55;
      for (let i = 0; i < count; i += 2) {
        const a = projected[i], b = projected[(i + (scenes[base].id === "qlora" ? 17 : 7)) % count];
        if (Math.hypot(a.x - b.x, a.y - b.y) < scale * .23) { context!.strokeStyle = `rgba(${color},${Math.max(.035, .2 - a.z * .04)})`; context!.beginPath(); context!.moveTo(a.x, a.y); context!.lineTo(b.x, b.y); context!.stroke(); }
      }
      projected.sort((a, b) => b.z - a.z).forEach((point, i) => { context!.fillStyle = `rgba(${color},${Math.max(.13, .55 - point.z * .18)})`; context!.beginPath(); context!.arc(point.x, point.y, (i % 13 === 0 ? 2.2 : 1.05) * point.r, 0, Math.PI * 2); context!.fill(); });
      // 环境粒子分布在整个视口，随滚动产生不同深度的位移。
      for (let i = 0; i < 44; i++) {
        const x = ((i * 137.5 + (media.matches ? 0 : raw * 24 * (i % 3 + 1))) % width + width) % width;
        const y = ((i * 83.7 - (media.matches ? 0 : time * .002 + raw * 35)) % height + height) % height;
        context!.fillStyle = `rgba(${color},.2)`; context!.fillRect(x, y, i % 6 === 0 ? 3 : 1, i % 6 === 0 ? 3 : 1);
      }
    }
    resize(); frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave); media.removeEventListener("change", refresh); };
  }, [signature, progress]);
  return <canvas ref={canvas} className="zt-field" aria-hidden="true"/>;
}
