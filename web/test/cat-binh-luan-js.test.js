#!/usr/bin/env node
/**
 * T03-101 — CẮT BÌNH LUẬN JS lúc ghép bundle. Sở hữu cổng: T03-96 (đơn vị TEST).
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Cắt bình luận trong JS **không** an toàn như trong CSS: `//` sống được trong
 * chuỗi (`"http://x"`), trong regex literal, và trong template literal nhiều
 * dòng. Một phép cắt quá tay làm hỏng mã **im lặng** — bundle vẫn có, vẫn tải,
 * và vỡ ở một nhánh không ai bấm tới trong lúc test.
 *
 * Nên cổng này đo BA thứ, và thứ ba mới là thứ đắt:
 *   1 · bundle NHỎ hơn nguồn (phép cắt có chạy)
 *   2 · SỐ DÒNG bằng nhau (bình luận thành dòng trống, không bị xoá dòng —
 *       nếu xoá dòng thì số dòng trong DevTools lệch, đúng thứ `FR-027f` đã
 *       từ chối khi nó từ chối minify)
 *   3 · `//` và `/*` NẰM TRONG CHUỖI **không** bị cắt
 *
 * ĐỎ_KHI  phép cắt không chạy · số dòng lệch · một chuỗi chứa `//` bị cắt mất
 *         phần sau · bundle không parse được
 * XANH_KHI nhỏ hơn, cùng số dòng, chuỗi nguyên vẹn, và parse được
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
let loi = 0
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi++
}

// `pathToFileURL`: trên Windows một đường `C:\…` không phải URL hợp lệ cho
// `import()` — Node trả `ERR_UNSUPPORTED_ESM_URL_SCHEME` và coi `C:` là scheme.
const { catBinhLuanJs } = await import(
  pathToFileURL(join(WEB, "render", "assets.mjs")).href)

console.log("\n1 · Phép cắt tồn tại và được export để đo được\n")

ok(typeof catBinhLuanJs === "function",
  "`catBinhLuanJs` được export từ `assets.mjs`",
  "không export thì phép cắt chỉ đo được qua kích thước bundle — và kích thước " +
  "không phân biệt 'cắt đúng' với 'cắt mất một dòng mã'")

console.log("\n2 · Cắt ĐÚNG hai dạng không nhập nhằng\n")

const nguon = [
  "// dòng bình luận đầy đủ",
  "  // thụt vào vẫn là bình luận đầy đủ",
  "const a = 1;",
  "/*",
  " * khối bình luận, `/*` là ký tự đầu dòng",
  " */",
  "const b = 2;",
].join("\n")
const ra = catBinhLuanJs(nguon)
ok(!ra.includes("dòng bình luận đầy đủ"), "cắt dòng `//` đầy đủ")
ok(!ra.includes("thụt vào vẫn là"), "cắt dòng `//` có thụt đầu dòng")
ok(!ra.includes("khối bình luận"), "cắt khối `/* … */` mở ở đầu dòng")
ok(ra.includes("const a = 1;") && ra.includes("const b = 2;"), "giữ nguyên mã")
ok(ra.split("\n").length === nguon.split("\n").length,
  `số dòng giữ nguyên (${ra.split("\n").length}/${nguon.split("\n").length})`,
  "bình luận phải thành DÒNG TRỐNG, không bị xoá dòng — xoá dòng thì số dòng " +
  "trong DevTools lệch, đúng thứ FR-027f từ chối khi nó từ chối minify")

console.log("\n3 · KHÔNG cắt `//` nằm trong chuỗi — ca làm hỏng mã im lặng\n")

const bay = [
  'const u = "http://127.0.0.1:8787/api/job";',
  "const v = 'a // b';",
  "const w = `x /* y */ z`;",
  "const re = /\\/\\//;",
  'const sau = "giữ" + " phần này";',
].join("\n")
const raBay = catBinhLuanJs(bay)
ok(raBay.includes("http://127.0.0.1:8787/api/job"),
  "URL trong chuỗi nguyên vẹn — `//` của `http://` không phải bình luận",
  raBay)
ok(raBay.includes("a // b"), "`//` giữa một chuỗi nháy đơn nguyên vẹn")
ok(raBay.includes("x /* y */ z"), "`/* */` trong template literal nguyên vẹn")
ok(raBay.includes("/\\/\\//"), "regex literal chứa dấu gạch nguyên vẹn")
ok(raBay.includes('"giữ" + " phần này"'), "phần sau chuỗi không bị mất")

console.log("\n4 · Bundle THẬT: nhỏ hơn, cùng số dòng, và PARSE được\n")

const goc = [
  "plugins/backdrop/src/backdrop.inline.js",
  "plugins/home-motion/src/home-motion.inline.js",
  "plugins/multiwindow/src/scripts/multiwindow.inline.js",
].map((f) => {
  try { return readFileSync(join(WEB, f), "utf8") } catch { return "" }
}).filter(Boolean)
  // BỌC IIFE y như `assets.mjs` — cả ba file khai `khiNav`/`khoiDong`/`gan`, nối
  // thẳng thì trùng tên và `new Function` báo lỗi TRÙNG TÊN, không báo lỗi của
  // phép cắt. Bản đầu của cổng này nối thẳng và tố oan đúng chỗ đó.
  .map((s) => ["(function(){", s, "})();"].join("\n")).join("\n")

ok(goc !== "", "ba file `.inline.js` tồn tại — chạy `npm run build` trước cổng này")
if (goc) {
  const catRoi = catBinhLuanJs(goc)
  ok(catRoi.length < goc.length,
    `bundle nhỏ hơn nguồn (${catRoi.length} < ${goc.length}, bớt ` +
    `${goc.length - catRoi.length} byte)`,
    "không nhỏ hơn nghĩa là phép cắt không chạy trên mã thật")
  ok(catRoi.split("\n").length === goc.split("\n").length,
    "số dòng bundle thật giữ nguyên")
  // PARSE bằng chính máy JS. Đo kích thước không phân biệt "cắt đúng" với
  // "cắt mất một dấu ngoặc" — thứ hai vẫn nhỏ hơn.
  let parseDuoc = true
  let viSao = ""
  try {
    new Function(catRoi)
  } catch (e) {
    parseDuoc = false
    viSao = String(e.message)
  }
  ok(parseDuoc, "bundle đã cắt PARSE được bằng máy JS thật", viSao)
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · cắt là phép BỎ: nhỏ hơn, cùng số dòng, chuỗi nguyên vẹn, parse được\n")
