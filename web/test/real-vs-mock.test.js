#!/usr/bin/env node
/**
 * Bản REAL và MOCK phải đọc NGUỒN KHÁC NHAU.
 *
 * Lỗi đã gặp: bản real đọc `ctx.argv.directory`, mà `npm run dev` trỏ `-d` vào
 * kho **sample** để xem thử giao diện. Kết quả: hai bản giống hệt nhau, và nút
 * REAL/MOCK vô nghĩa.
 *
 * Build vẫn xanh, mọi test khác xanh — người dùng phát hiện bằng mắt.
 *
 * Test này chạy build với `-d` trỏ vào sample (đúng như `npm run dev`), rồi đòi
 * hai bản KHÁC nhau: real đọc `kb/` thật, mock đọc contract.
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { trangHtml, khoTam, napRender } from "./_render.mjs"

// FR-034/C5 · nguồn đổi: bản real render từ KHO TẠM qua DB (dungKho của
// _api.mjs — 3 bản ghi), bản mock từ kb-mock. Điều được canh KHÔNG đổi:
// hai bản phải đọc HAI NGUỒN KHÁC NHAU, và số real phải khớp kho làm
// đối chứng đếm bằng đường ĐỘC LẬP (đếm file .md export trong kho tạm).
await napRender()
const KB = khoTam().kho

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

function demKb() {
  if (!existsSync(KB)) return 0
  let n = 0
  const quet = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) quet(p)
      else if (f.endsWith(".md") && f.toLowerCase() !== "readme.md"
               && !f.startsWith("_") && !/\.v\d+\.md$/.test(f)) n++
    }
  }
  quet(KB)
  return n
}

// `[^>]*` giua id va `>`: tu WO-012 o dem la mot MOC (`data-mount`) do
// `renderTrang` dien theo man, nen the co thuoc tinh giua. Ban cu doi `>` lien
// ngay sau `id="tcount"` va hut — mot cong ghim hinh dang the, khong ghim gia tri.
const dem = (h) => (h.match(/id="tcount"[^>]*>([^<]*)/) ?? [])[1] ?? ""

const real = await trangHtml("trang-chu", { mock: false })
const mock = await trangHtml("trang-chu")
const nKb = demKb()

console.log("\nREAL và MOCK phải đọc nguồn khác nhau\n")

const dReal = dem(real)
const dMock = dem(mock)
console.log(`     real: ${dReal || "(trống)"}`)
console.log(`     mock: ${dMock || "(trống)"}\n`)

// Mock LUÔN có dữ liệu — nó đọc contract, không phụ thuộc kb/
ok(/[1-9]/.test(dMock), "mock có dữ liệu từ contract",
  "mock đọc analyses.sample.v3.json, không bao giờ rỗng")

// Real phải khớp kb/ THẬT. kb/ rỗng ⇒ real rỗng; kb/ có bài ⇒ real có bài.
if (nKb === 0) {
  ok(/^0 bài/.test(dReal), "kb/ rỗng ⇒ real rỗng",
    `real báo "${dReal}" — nó đang đọc nhầm nguồn khác`)
  ok(dReal !== dMock, "real KHÁC mock",
    "hai bản trùng nhau ⇒ nút REAL/MOCK vô nghĩa")
} else {
  ok(dReal.startsWith(`${nKb}`) || dReal.includes(`${nKb} bản ghi`),
    `real khớp kb/ thật (${nKb} bản ghi)`, `real báo "${dReal}"`)
}

console.log("\nKho trống phải BÁO RÕ, không im lặng\n")

if (nKb === 0) {
  for (const [id, mo] of [["brk", "vùng nổi bật"], ["nw", "danh sách mới"],
                          ["grid", "lưới thẻ"], ["grid2", "màn Tất cả"]]) {
    const i = real.indexOf(`id="${id}"`)
    const s = real.slice(real.indexOf(">", i) + 1, real.indexOf(">", i) + 400)
    const chu = s.replace(/<[^>]+>/g, "").trim()
    ok(chu.length > 10, `${mo} có thông báo rỗng`,
      "panel trắng không lời giải thích")
  }
  ok(real.includes('href="/mock/"'), "real trỏ người dùng sang /mock/",
    "kho trống mà không gợi ý gì thì người dùng tưởng web hỏng")
}

console.log("\nNút chuyển là LINK, không phải toggle JS\n")

// Dữ liệu quyết định lúc BUILD — một nút JS không đổi được nguồn của trang
// đã tải. Phải là link sang bản đã build sẵn.
ok(/<a[^>]+href="\/mock\/"/.test(real), "real có link sang /mock/")
ok(/<a[^>]+href="\/"/.test(mock), "mock có link về /")
ok(/aria-current="true"/.test(real) && /aria-current="true"/.test(mock),
  "bản đang xem được đánh dấu aria-current")

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · hai bản đọc nguồn khác nhau, kho trống báo rõ")
