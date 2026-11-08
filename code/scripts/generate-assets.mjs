import fs from "node:fs/promises";
import sharp from "sharp";

const { name } = JSON.parse(await fs.readFile("src/config/site.json", "utf8"));
const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
await fs.mkdir("public/images", { recursive: true });
await sharp("public/brand-mark.svg").resize(96, 96).png().toFile("public/favicon.png");
await sharp("public/brand-mark.svg").resize(180, 180).png().toFile("public/apple-touch-icon.png");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#ffffff"/><text x="80" y="330" fill="#202124" font-family="sans-serif" font-size="${Math.min(64, 1000 / Math.max(name.length, 1))}">${escape(name)}</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/images/og-default.png");
console.log("已生成 favicon、Apple 图标和默认分享图片。");
