#!/usr/bin/env node
/**
 * Cửa sổ đọc KHÔNG được vẽ hai tiêu đề, và mục lục KHÔNG được chứa tên bài.
 *
 * BUG THẬT, lộ ra ở bài kb/ đầu tiên:
 *   `doc.innerHTML = "<h1>" + ban.title + "</h1>" + md(ban.than)` — nhưng thân
 *   bài THEO MẪU CHUẨN đã mở đầu bằng `# H1` (mau-dat-chuan.md:38). Hai tiêu đề.
 *   Và md() hạ cấp mọi heading một bậc (`#`→h2) nên H1 của thân bài lọt vào mục
 *   lục — "mục 01" hoá ra là chính tên bài.
 *
 * VÌ SAO KHÔNG TEST NÀO BẮT: 15/15 bản ghi trong kb-mock/ KHÔNG có `# H1` nào
 * (sinh_kb_mock.py dựng thân bài từ template không tiêu đề). Mọi test đọc mock
 * nên lỗi ngủ tới khi có bài thật đi theo mẫu chuẩn.
 *
 * Đây là lớp lỗi "dữ liệu mẫu không phủ hình dạng dữ liệu thật" — cùng họ với
 * bug parser YAML flow-vs-block (FR-010) và word_count (FR-015).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const loi = []
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}`)
  if (!d) loi.push(chu + (them ? ` — ${them}` : ""))
}

const src = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

console.log("\n1 · Chỉ chèn <h1> khi thân bài CHƯA có\n")

ok(/\/\^#\s\+\S\/m\.test/.test(src) || /coH1/.test(src),
  "có phép kiểm thân bài đã có H1 chưa",
  "thiếu thì bài theo mẫu chuẩn hiện hai tiêu đề")
ok(!/doc\.innerHTML = ban\.than\s*\n\s*\? "<h1>"/.test(src),
  "không chèn <h1> vô điều kiện trước md(than)")

console.log("\n2 · md() giữ ĐÚNG cấp heading\n")

const mCap = src.match(/const c = Math\.min\(h\[1\]\.length([^,]*),\s*4\)/)
ok(!!mCap, "tìm được phép tính cấp heading trong md()")
ok(mCap && !/\+\s*1/.test(mCap[1]),
  "KHÔNG hạ cấp (+1) — `#`→h1, `##`→h2",
  "hạ cấp làm tên bài lọt mục lục và mọi ## tụt xuống h3")

console.log("\n3 · Mục lục đọc h2 — cấp của các mục 1-9\n")

ok(/querySelectorAll<HTMLElement>\("\.doc h2"\)/.test(src),
  "mục lục lấy `.doc h2` — nên `## N. Tên` phải ra h2")

console.log("\n4 · Dữ liệu mẫu KHÔNG phủ hình dạng thật — ghi lại để nhớ\n")

// Đây là gốc của việc lỗi ngủ lâu. Không assert mock PHẢI có H1 (sửa
// sinh_kb_mock.py là việc khác), chỉ đo và nói ra.
const GOC = join(WEB, "..")
let coH1 = 0, tong = 0
for (const t of ["announcement", "article", "docs", "paper", "repo", "video"]) {
  const d = join(GOC, "kb-mock", t)
  if (!existsSync(d)) continue
  for (const f of readdirSync(d)) {
    if (!f.endsWith(".md")) continue
    tong++
    const than = readFileSync(join(d, f), "utf8").split(/^---$/m)[2] ?? ""
    if (/^#\s+\S/m.test(than)) coH1++
  }
}
ok(tong > 0, `đọc được ${tong} bản ghi mock`)
console.log(`       ${coH1}/${tong} bản mock có \`# H1\` — mẫu chuẩn thì CÓ`)
ok(true, "ghi nhận: mock không phủ hình dạng này, nên phép kiểm ở khối 1-2 là cổng duy nhất")

if (loi.length) {
  console.log(`\nFAIL · ${loi.length} lỗi:\n`)
  for (const d of loi) console.log(`  x  ${d}`)
  process.exit(1)
}
console.log("\npass · một tiêu đề, mục lục không chứa tên bài")
