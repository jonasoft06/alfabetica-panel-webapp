import "server-only";
import { db } from "../db";
import { noContent, notFound } from "../http";
import type { MockRouter } from "../router";

const COLORS = ["#008f9f", "#6c63ff", "#f0603a", "#e9b949", "#c46aa8", "#00727f"];

function placeholderSvg(title: string, seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const color = COLORS[hash % COLORS.length];
  const words = title.split(" ").slice(0, 6);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last && (last + " " + word).length <= 14) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  const text = lines
    .slice(0, 4)
    .map((line, i) => `<tspan x="90" dy="${i === 0 ? 0 : 92}">${line.replace(/[<&>]/g, "")}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="${color}"/><rect x="0" y="0" width="56" height="1600" fill="#000" opacity=".12"/><circle cx="1040" cy="1420" r="260" fill="#fff" opacity=".12"/><text x="90" y="420" font-family="Georgia,serif" font-size="88" font-weight="700" fill="#fff">${text}</text><text x="90" y="1480" font-family="sans-serif" font-size="40" fill="#fff" opacity=".8">Alfabética</text></svg>`;
}

/** Stand-ins for DigitalOcean Spaces (presigned PUT + CDN GET). Only reachable in mock mode. */
export function registerFiles(router: MockRouter) {
  router.put("__mock/upload/:mediaId", async (req) => {
    const media = db().media.find((m) => m.id === req.params.mediaId);
    if (!media) throw notFound("Upload target not found");
    db().files.set(media.id, { bytes: await req.raw.arrayBuffer(), contentType: req.headers.get("content-type") ?? media.mimeType });
    return noContent();
  });

  router.get("__mock/files/:mediaId", (req) => {
    const media = db().media.find((m) => m.id === req.params.mediaId);
    if (!media) throw notFound("File not found");
    const headers = { "Cache-Control": "private, max-age=3600" };
    const file = db().files.get(media.id);
    if (file) return new Response(file.bytes, { headers: { ...headers, "Content-Type": file.contentType } });
    const project = db().projects.find((p) => p.id === media.projectId);
    return new Response(placeholderSvg(media.alt ?? project?.title ?? "Alfabética", media.id), {
      headers: { ...headers, "Content-Type": "image/svg+xml" },
    });
  });
}
