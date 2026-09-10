#!/usr/bin/env node
/**
 * FR-034/C5 · SSR ROUTES — server THẬT trả trang render từ DB (AC2 của T03-8).
 *
 * Các test giao diện khác đo qua `_render.mjs` (gọi thẳng renderTrang) — nhanh,
 * nhưng KHÔNG chứng minh server đã nối route nào vào hàm nào. File này spawn
 * server thật trên kho tạm và đo bảy điều:
 *
 *   1 · 5 màn + /cho-duyet/ + /mock/* + /tat-ca/2/ trả 200, thân có mốc `.mid`
 *   2 · /gn.css /gn.js đúng content-type (cả bản /mock/)
 *   3 · deep-link /:type/:slug của bài seed → 200 + marker `data-mo-bai`
 *   4 · type/slug BẨN không ra marker — path traversal chặn bằng CẤU TRÚC
 *   5 · kho 0 BÀI: 5 màn vẫn 200, có chữ gợi ý — không màn trắng (FR-008 L1)
 *   6 · open-index.json hai bản khác nhau, bg index là JSON
 *   7 · GN_SSR=0: `/` KHÔNG còn do SSR trả (rơi về nhánh tĩnh — điểm rollback)
 */
import { readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { GOC, batServer, dungKho, napLaiDb, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

/** fetch trả THÂN CHỮ + content-type — goi() của _api.mjs chỉ nói JSON. */
async function lay(cong, duong) {
  const r = await fetch(`http://127.0.0.1:${cong}${duong}`)
  return { ma: r.status, loai: r.headers.get("content-type") ?? "", chu: await r.text() }
}

const { kho, rac, don } = dungKho("gn-ssr")
const { cong, dung } = await batServer({ kho, rac })

try {
  // ── 1 · 5 màn + trang chuyển hướng + mock + phân trang ─────────────────
  console.log("\n1 · Các màn trả 200 từ SSR — cả real lẫn mock\n")
  /*
   * DAN XUAT tu `core/assets/man-hinh.json` (FR-038/C6a).
   *
   * Danh sach CUNG o day la mot lo im lang theo HAI chieu: man MOI khong
   * duoc kiem 200/empty-state, va man DA BO van duoc doi 200 — vua xay ra
   * ve sau khi `/nap/` chung bi bo.
   */
  const MAN = JSON.parse(readFileSync(
    join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man.map((m) => m.path)
  for (const goc of ["", "/mock"]) {
    for (const d of MAN) {
      const r = await lay(cong, goc + d)
      ok(r.ma === 200 && r.chu.includes('class="mid"'),
         `GET ${goc + d} ⇒ 200 + mốc .mid`, `nhận ${r.ma}`)
    }
  }
  {
    const r = await lay(cong, "/cho-duyet/")
    ok(r.ma === 200 && /http-equiv="refresh"/.test(r.chu),
       "GET /cho-duyet/ ⇒ 200, trang chuyển hướng", `nhận ${r.ma}`)
    const r2 = await lay(cong, "/tat-ca/2/")
    ok(r2.ma === 200 && r2.chu.includes('class="mid"'),
       "GET /tat-ca/2/ ⇒ 200 + mốc .mid (phân trang không 404)", `nhận ${r2.ma}`)
  }

  // ── 2 · asset đúng content-type ────────────────────────────────────────
  console.log("\n2 · gn.css / gn.js đúng content-type\n")
  for (const goc of ["", "/mock"]) {
    const c = await lay(cong, `${goc}/gn.css`)
    ok(c.ma === 200 && c.loai.startsWith("text/css"),
       `GET ${goc}/gn.css ⇒ text/css`, `${c.ma} · ${c.loai}`)
    const j = await lay(cong, `${goc}/gn.js`)
    ok(j.ma === 200 && j.loai.startsWith("text/javascript"),
       `GET ${goc}/gn.js ⇒ text/javascript`, `${j.ma} · ${j.loai}`)
  }

  // ── 6 · chỉ mục hai bản + ảnh nền ──────────────────────────────────────
  console.log("\n3 · Chỉ mục mở cửa sổ theo TỪNG bản\n")
  {
    const real = await lay(cong, "/static/open-index.json")
    const mock = await lay(cong, "/mock/static/open-index.json")
    ok(real.ma === 200 && real.loai.includes("json"), "open-index bản real là JSON")
    ok(mock.ma === 200 && JSON.parse(mock.chu).articles.length >
       JSON.parse(real.chu).articles.length,
       "hai bản có chỉ mục RIÊNG (mock 13 bản > real kho tạm)",
       "chung một chỉ mục là data-open trỏ sai bài — đúng bug open-card canh")
  }

  // ── 3 · deep-link bài seed ─────────────────────────────────────────────
  console.log("\n4 · Deep-link /:type/:slug\n")
  {
    const r = await lay(cong, "/article/bai-nhap")
    ok(r.ma === 200 && r.chu.includes('data-mo-bai="article/bai-nhap"'),
       "GET /article/bai-nhap ⇒ 200 + data-mo-bai", `nhận ${r.ma}`)
    // paper cũng là một type hợp lệ — enum LOAI, không hardcode "article"
    const p = await lay(cong, "/paper/bai-duyet/")
    ok(p.ma === 200 && p.chu.includes('data-mo-bai="paper/bai-duyet"'),
       "GET /paper/bai-duyet/ (có / cuối) ⇒ 200 + data-mo-bai", `nhận ${p.ma}`)
  }

  // ── 4 · type/slug bẩn — không marker ───────────────────────────────────
  console.log("\n5 · Đường bẩn không ra marker\n")
  for (const d of ["/khong-phai-type/bai-nhap", "/article/Bai_NHAP",
                   "/article/..%2F..%2Fkb", "/article/bai-nhap/them"]) {
    const r = await lay(cong, d)
    ok(!r.chu.includes("data-mo-bai"),
       `GET ${d} không mang data-mo-bai (nhận ${r.ma})`,
       "type ngoài enum / slug ngoài [a-z0-9-] mà vẫn render là cửa traversal")
  }

  // ── 5 · kho 0 BÀI — không màn trắng ────────────────────────────────────
  console.log("\n6 · Kho 0 bài: 5 màn vẫn đứng, có chữ gợi ý\n")
  // Xoá HẾT bài (giữ danh mục) rồi nạp lại DB — server đọc DB mỗi request nên
  // không cần restart. Đây là trạng thái HỢP LỆ (FR-008 L1), không phải lỗi.
  rmSync(join(kho, "article"), { recursive: true, force: true })
  rmSync(join(kho, "paper"), { recursive: true, force: true })
  napLaiDb(kho, rac)
  for (const d of MAN) {
    const r = await lay(cong, d)
    const co = /class="hint"|Kho trống|Chưa có bài nào/.test(r.chu)
    ok(r.ma === 200 && co, `GET ${d} (kho rỗng) ⇒ 200 + chữ gợi ý`,
       `nhận ${r.ma}${co ? "" : " — màn trắng không lời giải thích"}`)
  }
} finally {
  dung()
  don()
}

// ── 7 · GN_SSR=0 — kill-switch rơi về nhánh tĩnh ─────────────────────────
console.log("\n7 · GN_SSR=0: SSR tắt hẳn\n")
{
  const kho2 = dungKho("gn-ssr-off")
  process.env.GN_SSR = "0"
  let s2
  try {
    s2 = await batServer({ kho: kho2.kho, rac: kho2.rac })
  } finally {
    delete process.env.GN_SSR   // không rò cờ sang test khác trong cùng process
  }
  try {
    // SITE của batServer trỏ thư mục rỗng ⇒ không SSR thì `/` là 404 tĩnh.
    const r = await lay(s2.cong, "/")
    ok(r.ma !== 200 && !r.chu.includes('class="mid"'),
       `GN_SSR=0: GET / không còn do SSR trả (nhận ${r.ma})`,
       "kill-switch chết thì giai đoạn C mất điểm rollback")
    const c = await lay(s2.cong, "/gn.css")
    ok(c.ma !== 200, `GN_SSR=0: /gn.css cũng tắt theo (nhận ${c.ma})`)
    // API vẫn sống — kill-switch chỉ tắt tầng render, không tắt bàn biên tập.
    const h = await lay(s2.cong, "/api/health")
    ok(h.ma === 200, "GN_SSR=0: /api/health vẫn 200 — API không dính cờ render")
  } finally {
    s2.dung()
    kho2.don()
  }
}

chot("SSR routes · 5 màn + mock + deep-link + kho rỗng + kill-switch")
