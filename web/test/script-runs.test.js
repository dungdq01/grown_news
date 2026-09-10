#!/usr/bin/env node
/**
 * Script nhúng phải CHẠY ĐƯỢC, không chỉ có mặt trong trang.
 *
 * Lỗi đã gặp: hai script nối nhau bằng ";" — cả hai khai `khoiDong`, `gan`,
 * `khiNav` ở cùng phạm vi ⇒ SyntaxError ⇒ KHÔNG DÒNG NÀO CHẠY, kể cả phần
 * hiện panel. Trang chủ trắng trơn dù HTML có đủ 4852 ký tự nội dung:
 * `.rise{opacity:0}` ẩn sẵn mọi panel, chờ JS thêm class `.in`.
 *
 * `css-applied.test.js` vẫn xanh khi đó — nó chỉ kiểm script CÓ MẶT.
 * Test này kiểm script CHẠY.
 */
import { execSync } from "node:child_process"
import { writeFileSync, unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { trangHtml, taiSan } from "./_render.mjs"

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// Doc ban mock va JS tu gn.js — van tach file de trinh duyet cache (SSR phat
// o /gn.js). Phep kiem giu nguyen: cu phap, IIFE, phan hien panel.
// FR-034/C5 · nguon doi tu output build sang renderTrang/taiSan.
const html = await trangHtml("trang-chu")
const script = (await taiSan()).gnJs

console.log("\nScript phải chạy được, không chỉ có mặt\n")

ok(script.length > 100, `script có ${script.length} ký tự`)

// 1 · Cú pháp — đây là thứ bắt được lỗi khai trùng tên
const tmp = join(tmpdir(), `gn-check-${Date.now()}.js`)
writeFileSync(tmp, script, "utf8")
let cuPhap = true
let loiCuPhap = ""
try { execSync(`node --check "${tmp}"`, { stdio: "pipe" }) }
catch (e) { cuPhap = false; loiCuPhap = String(e.stderr ?? e).slice(0, 200) }
unlinkSync(tmp)
ok(cuPhap, "node --check sạch", loiCuPhap)

// 2 · Mỗi script bọc IIFE riêng — không thì khai trùng tên
const iife = (script.match(/\(function\(\)\{/g) ?? []).length
ok(iife >= 2, `${iife} script bọc IIFE riêng`,
  "nối thẳng thì khai trùng ⇒ SyntaxError ⇒ không dòng nào chạy")

// Ten trung phai nam trong IIFE KHAC NHAU, khong phai cung pham vi.
// Khong dem bang regex bam dau dong: esbuild khong thut le nen no khop ca ben
// trong IIFE. `node --check` o tren moi la bang chung that — hai khai bao cung
// pham vi thi no da do.
const khoi = script.split("(function(){")
ok(khoi.length - 1 >= 2, "moi script mot khoi rieng")
for (const ten of ["khoiDong", "gan", "khiNav"]) {
  const trongKhoi = khoi.slice(1).map(
    (k) => (k.match(new RegExp("(?:function|const|let) " + ten + "\\b", "g")) ?? []).length)
  ok(trongKhoi.every((n) => n <= 1),
    `"${ten}" khai <=1 lan TRONG MOI khoi`, `${trongKhoi}`)
}

console.log("\nPhần hiện panel phải có mặt\n")

// .rise{opacity:0} ẩn sẵn — thiếu phần này là trang trắng trơn
ok(script.includes("IntersectionObserver"), "có IntersectionObserver",
  ".rise{opacity:0} ẩn sẵn panel, cần JS thêm class .in")
ok(/classList\.add\(["']in["']\)/.test(script), 'có classList.add("in")')

// Panel đã trong khung nhìn phải hiện ngay, không đợi cuộn
ok(script.includes("getBoundingClientRect"), "có kiểm panel đã trong khung nhìn",
  "chỉ dựa observer thì panel đầu trang có thể không bao giờ hiện")

console.log("\nHTML có nội dung để hiện\n")

const main = (html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/) ?? [])[1] ?? ""
ok(main.length > 1000, `<main> có ${main.length} ký tự nội dung`,
  "HTML rỗng thì JS chạy đúng cũng vô nghĩa")
const rise = (html.match(/class="[^"]*\brise\b/g) ?? []).length
ok(rise >= 3, `${rise} panel .rise chờ hiện`)

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · script chạy được và có phần hiện panel")
