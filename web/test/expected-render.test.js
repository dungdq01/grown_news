#!/usr/bin/env node
/**
 * M03 AC-2.1.2 và AC-2.1.3 · gộp theo url_normalized, sắp theo priority.
 *
 * Test đọc `_expected_render` của contract — số ở đó **tính bằng máy**, không gõ
 * tay. Không hardcode số 8 trong file này: thêm bản ghi vào sample thì contract
 * đổi và test tự bắt.
 *
 * FR-034/C5 · nguồn đo đổi: `merged-index.json` (plugin merge-by-source của
 * build Quartz) không còn — đường gộp/sắp SỐNG ở `web/render` (`tinhChiMuc`
 * của data.mjs cho gộp, `dungShell` sắp priority cho vùng nổi bật). Test dựng
 * data hình dạng Ban TỪ CONTRACT rồi đo trên chính hai đường đó:
 *   · gộp + thứ tự  — `tinhChiMuc` (đúng hàm mà trang HTML lẫn open-index dùng)
 *   · bài nổi bật   — render `trang-chu` thật, đọc thẻ [data-feat="0"]
 * Assertion giữ nguyên từng con số của contract.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { napRender } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")

const contract = JSON.parse(readFileSync(
  join(GOC, "05_uiux", "contracts", "analyses.sample.v5.json"), "utf8"))
const mong = contract._expected_render
const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// Ban từ một bản ghi contract — CÙNG công thức priority với banTuDb/docTuDia
// của web/render/data.mjs (max priority trong skill_candidates).
const banTu = (r) => {
  const uv = Array.isArray(r.skill_candidates) ? r.skill_candidates : []
  return {
    slug: `${r.source_type}/${r.slug}`, id: String(r.id ?? ""),
    title: String(r.title ?? r.slug),
    priority: uv.reduce((mx, c) =>
      Math.max(mx, typeof c?.priority === "number" ? c.priority : 0), 0),
    credibility_max: String(r.credibility_max ?? ""),
    origin: String(r.origin ?? ""),
    source_type: String(r.source_type ?? ""),
    review_status: String(r.review_status ?? ""),
    analyzed_at: String(r.analyzed_at ?? ""),
    one_liner: String(r.one_liner ?? ""),
    concepts: [], concepts_proposed: [], category: [],
    url_normalized: String(r.url_normalized ?? ""),
    than: "x",
  }
}

const m = await napRender()
const bans = contract.analyses.map(banTu)

console.log("\nM03 AC-2.1.2 · gộp theo url_normalized\n")

// Thứ tự bắt buộc: lọc approved TRƯỚC, gộp SAU. Ngược lại thì bản draft cùng
// nguồn kéo bản approved lên site.
const appr = bans.filter((b) => b.review_status === "approved")
const nhom = m.tinhChiMuc(appr)

ok(nhom.length === mong.articles_on_site,
  `${mong.articles_on_site} bài trên site`, `sinh ra ${nhom.length}`)

// Nhóm gộp: cùng tập id, không quan tâm thứ tự trong nhóm
const raGop = Object.fromEntries(nhom.filter((g) => g.bans.length > 1)
  .map((g) => [g.url_normalized, g.bans.map((b) => b.id)]))
const nhomMong = Object.entries(mong.merged_groups)
ok(Object.keys(raGop).length === nhomMong.length,
  `${nhomMong.length} nhóm được gộp`, `sinh ra ${Object.keys(raGop).length}`)

for (const [url, ids] of nhomMong) {
  const co = raGop[url]
  ok(co && [...co].sort().join() === [...ids].sort().join(),
    `${url} gộp ${ids.join(" + ")}`, `sinh ra ${co}`)
}

const idTrongSite = new Set(nhom.flatMap((g) => g.bans.map((x) => x.id)))
const draftRej = contract.analyses.filter((r) => r.review_status !== "approved")
for (const r of draftRej) {
  ok(!idTrongSite.has(r.id), `${r.id} (${r.review_status}) không lọt qua đường gộp`)
}

console.log("\nM03-R5 · sắp theo priority, KHÔNG theo analyzed_at\n")

// Bài nổi bật đo trên TRANG RENDER THẬT: dungShell sắp `appr` theo priority
// giảm dần rồi lấy 3 bản đầu làm [data-feat]. Thẻ đầu phải là featured_id.
const noiBat = contract.analyses.find((r) => r.id === mong.featured_id)
const html = m.renderTrang("trang-chu",
  { bans, concepts: [], categories: [], hong: [], mock: true })
const feat0 = (html.match(/<article class="feat" data-feat="0"[\s\S]*?<\/article>/) ?? [""])[0]
ok(feat0.includes(`>${noiBat.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}<`)
   || feat0.includes(noiBat.title),
  `bài nổi bật là ${mong.featured_id}`, `[data-feat="0"] không mang "${noiBat.title}"`)
const banNoiBat = bans.find((b) => b.id === mong.featured_id)
ok(banNoiBat.priority === mong.featured_priority,
  `priority ${mong.featured_priority}`, `sinh ra ${banNoiBat.priority}`)
ok(feat0.includes(`ưu tiên ${mong.featured_priority}`),
  "trang chủ in đúng priority của bài nổi bật")

// tinhChiMuc sắp priority giảm dần — cùng thứ tự cho trang HTML lẫn open-index.
const p = nhom.map((g) => g.priority)
ok(p.every((v, i) => i === 0 || p[i - 1] >= v), "priority giảm dần", `${p}`)

// Bài mới nhất KHÔNG được là bài nổi bật (trừ khi trùng) — đó là điểm của R5
const moiNhat = [...contract.analyses]
  .filter((r) => r.review_status === "approved")
  .sort((a, b) => String(b.analyzed_at).localeCompare(String(a.analyzed_at)))[0]
if (moiNhat.id !== mong.featured_id) {
  ok(!feat0.includes(moiNhat.title),
    `bài mới nhất (${moiNhat.id}) KHÔNG chiếm chỗ nổi bật`,
    "đang sắp theo ngày chứ không theo priority")
}

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log(`pass · ${nhom.length} bài, ${nhomMong.length} nhóm gộp, sắp đúng priority`)
