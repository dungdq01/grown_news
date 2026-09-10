/**
 * WO-058 · Màn CÓ CHUNK RIÊNG phải khai `cat_khi_khac: true`.
 *
 * Bug chủ dự án bắt được 2026-09-06: bấm menu `/chung-cat/` ra màn TRỐNG; F5
 * mới hiện danh sách.
 *
 * Cơ chế: `chung-cat` khai `cat_khi_khac: false`, nên khung `v-chungcat` RỖNG
 * đi theo mọi trang. `doiView()` chỉ điều hướng thật khi khung ĐÓ KHÔNG có
 * (`v in DUONG && !G("v-" + v)`) — thấy khung tồn tại thì nó hiện tại chỗ, mà
 * mã đổ nội dung nằm trong `gn-chungcat.js` chưa ai nạp.
 *
 * Nên luật: màn nào có chunk riêng thì khung của nó KHÔNG được đi theo trang
 * khác. Khung rỗng ở trang khác vừa tốn byte của mọi trang, vừa BIẾN một phép
 * điều hướng đúng thành một màn trắng.
 */
import { napRender } from "./_render.mjs"
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}

const m = await napRender()
const MAN = JSON.parse(readFileSync(
  new URL("../../core/assets/man-hinh.json", import.meta.url), "utf8")).man
const coChunk = new Set(m.tenChunk())

console.log("\nWO-058 · màn có chunk riêng phải tự cắt\n")

for (const x of MAN) {
  if (!coChunk.has(x.id_shell)) continue
  ok(x.cat_khi_khac === true,
    `\`${x.path}\` (chunk \`${x.id_shell}\`) khai \`cat_khi_khac: true\``,
    "khung rỗng đi theo mọi trang ⇒ `doiView` hiện tại chỗ thay vì điều hướng, "
    + "và chunk chưa nạp ⇒ MÀN TRẮNG cho tới khi F5")
}

// Chiều ngược: khung của màn có chunk KHÔNG được xuất hiện ở trang khác.
const { trangHtml } = await import("./_render.mjs")
const home = await trangHtml("trang-chu")
for (const x of MAN) {
  if (!coChunk.has(x.id_shell) || x.path === "/") continue
  ok(!home.includes(`v-${x.id_shell}"`),
    `trang chủ KHÔNG mang khung rỗng \`v-${x.id_shell}\``,
    "đo trên HTML dựng thật — khai `cat_khi_khac` mà khung vẫn đi theo thì "
    + "bảng khai nói một đằng, emitter làm một nẻo")
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · màn có chunk tự cắt khỏi trang khác")
process.exit(loi ? 1 : 0)
