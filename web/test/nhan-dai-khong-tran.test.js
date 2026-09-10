#!/usr/bin/env node
/**
 * Nhãn dài KHÔNG được phình cột — lớp lỗi im lặng, phải có cổng.
 *
 * BUG THẬT đã xảy ra: sidebar lọc ở màn Tất cả đổi từ id thô (`agent-llm`) sang
 * nhãn tiếng Việt (`Kiểm định tiến dần theo thời gian`, 44 ký tự). Cột lọc khai
 * `190px` CỐ ĐỊNH nhưng phình ~450px và bóp lưới thẻ từ 4 cột còn 2.
 *
 * VÌ SAO `overflow:hidden` MỘT MÌNH KHÔNG ĐỦ — đây là phần dễ tưởng đã sửa:
 * `.fl-b span` ĐÃ có `overflow:hidden;text-overflow:ellipsis;white-space:nowrap`
 * từ đầu. Nhưng `overflow:hidden` chỉ cắt HÌNH VẼ. min-content contribution của
 * một flex item thiếu `min-width:0` vẫn là TOÀN BỘ chuỗi nowrap, và grid item
 * `min-width:auto` không co nhỏ hơn min-content của nó. Chuỗi vẫn "đòi" chỗ ở
 * tầng layout dù đã bị cắt ở tầng vẽ.
 *
 * VÌ SAO CẦN TEST chứ không chỉ sửa: lỗi này KHÔNG làm test nào đỏ, không làm
 * type-check đỏ, không làm build đỏ. Nó chỉ hiện ra khi có người nhìn màn hình
 * ở đúng bề rộng. Lần sau ai đổi nhãn hoặc thêm nhãn dài hơn là vỡ lại.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
const loi = []
const ok = (dieu, chu, them = "") => {
  console.log(`  ${dieu ? "ok  " : "FAIL"} ${chu}`)
  if (!dieu) loi.push(chu + (them ? ` — ${them}` : ""))
}

/**
 * Mọi khai báo áp cho một selector, nối lại.
 *
 * Hai điều phải xử lý đúng, cả hai đều từng làm bản đầu của test này báo SAI:
 *  1 file khai TRÙNG selector nhiều lần (lịch sử: sửa bản không thắng cascade)
 *    ⇒ phải gom hết, không lấy bản đầu.
 *  2 selector thường nằm GIỮA một danh sách:
 *    `.nw a>div,.brk-m>div,.cd,.fl-b span,.fw>*{min-width:0}`
 *    ⇒ tách khối theo `{}`, rồi so từng selector trong danh sách. Regex bắt
 *      "selector đứng ngay trước dấu {" bỏ sót đúng ca này.
 */
function moiLuat(sel) {
  const chuan = (s) => s.replace(/\s*([>+~,])\s*/g, "$1").replace(/\s+/g, " ").trim()
  const dich = chuan(sel)
  const ra = []
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const dau = m[1].split("\n").pop() ?? m[1]      // bỏ phần comment/at-rule trước
    if (m[1].includes("@")) continue                 // bỏ qua @media/@supports mở khối
    if (chuan(dau).split(",").some((s) => chuan(s) === dich)) ra.push(m[2])
  }
  return ra.join(";")
}

console.log("\n1 · Nút lọc — nhãn dài phải cắt được, KHÔNG phình cột\n")

const spanLoc = moiLuat(".fl-b span")
ok(/min-width:\s*0/.test(spanLoc),
  ".fl-b span có min-width:0 — nếu không, chuỗi nowrap đòi đủ chỗ dù overflow:hidden",
  "đây chính là bug đã xảy ra: cột 190px phình ~450px")
ok(/text-overflow:\s*ellipsis/.test(spanLoc), ".fl-b span có text-overflow:ellipsis")
ok(/overflow:\s*hidden/.test(spanLoc), ".fl-b span có overflow:hidden")

console.log("\n2 · Hai cột màn Tất cả — cả sidebar và lưới phải co được\n")

const fw = moiLuat(".fw")
ok(/grid-template-columns/.test(fw), ".fw khai grid-template-columns")
const conFw = moiLuat(".fw>*")
ok(/min-width:\s*0/.test(conFw),
  ".fw > * có min-width:0 — chặn CẢ .grid, không chỉ sidebar",
  ".grid cũng là grid item và cũng thiếu min-width:0")

console.log("\n3 · Chip danh mục — một chip đơn quá dài\n")

const ch = moiLuat(".ch")
ok(/max-width:\s*100%/.test(ch),
  ".ch có max-width:100% — flex-wrap chỉ giúp khi NHIỀU chip; một chip 44 ký tự vẫn phình")
const chB = moiLuat(".ch b")
ok(/min-width:\s*0/.test(chB) && /text-overflow:\s*ellipsis/.test(chB),
  ".ch b cắt được chữ (min-width:0 + ellipsis)")

console.log("\n4 · Nhãn thật trong danh mục — dài tới đâu\n")

const GOC = join(WEB, "..")
let daiNhat = 0, tenDaiNhat = ""
for (const f of ["concepts.yaml", "categories.yaml"]) {
  let txt
  try { txt = readFileSync(join(GOC, "kb", f), "utf8") } catch { continue }
  for (const m of txt.matchAll(/^\s+label_vi:\s*(.+)$/gm)) {
    const n = m[1].trim().length
    if (n > daiNhat) { daiNhat = n; tenDaiNhat = m[1].trim() }
  }
}
/*
 * FR-031 · danh mục thật có thể RỖNG (người dùng xoá sạch để nhập lại). Mục này
 * là một PHÉP ĐO trên dữ liệu thật, không phải một khẳng định về hệ thống — nên
 * nó không được đỏ khi không có gì để đo.
 *
 * Ba phép kiểm CSS ở trên mới là răng thật: chúng canh `prototype.css` cắt được
 * MỌI độ dài, và chúng không cần một cái nhãn nào tồn tại.
 */
if (daiNhat > 0) {
  console.log(`  ok   nhãn dài nhất trong kb/: ${daiNhat} ký tự — "${tenDaiNhat}"`)
  // Không assert một trần độ dài đẹp: nhãn là quyết định của người, không phải
  // lỗi. 200 là ngưỡng "đây là một câu, không phải một nhãn".
  ok(daiNhat < 200, "nhãn dưới 200 ký tự — dài hơn thế thì nó là câu, không phải nhãn")
} else {
  console.log("  ok   danh mục kb/ đang rỗng — không có nhãn nào để đo (hợp lệ)")
}

if (loi.length) {
  console.log(`\nFAIL · ${loi.length} lỗi:\n`)
  for (const d of loi) console.log(`  x  ${d}`)
  console.log("\nSửa ở web/styles/prototype.css — xem comment ở danh sách min-width:0 đầu file.")
  process.exit(1)
}
console.log("\npass · nhãn dài cắt được ở cả sidebar và chip, cột không phình")
