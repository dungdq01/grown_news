/**
 * Header phải ĐỔI THEO MÀN, không đứng lại ở màn đầu tiên.
 *
 * Chủ dự án bắt 2026-09-07 (ba ảnh): đứng ở `/tai-lieu/` mà nút nạp vẫn là
 * **ĐĂNG KÝ VIDEO**, và số đếm vẫn là của màn trước (`4 bài · 5 bản ghi` ở
 * ảnh này, `2 bài · 2 bản ghi` ở ảnh kia — CÙNG một URL).
 *
 * Gốc: shell có ĐÚNG MỘT `#nutnap` và MỘT `#tcount`, đổ ở máy chủ cho màn
 * được render. `doiView()` đổi `.view.on` rồi `pushState` sang URL mới —
 * nhưng header không nằm trong `.view` nào, nên nó GIỮ NGUYÊN nội dung của
 * màn đã render lúc tải trang.
 *
 * Hệ quả nặng hơn một lỗi hiển thị: nút ấy MỞ MỘT MÀN NẠP. Người đang ở Tài
 * liệu bấm nút đó sẽ đi đăng ký một VIDEO — màn nói sai việc nó sắp làm.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const tr = doc("../render/trang.mjs")
const mw = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const mwS = boCT(mw)

console.log("\nheader đổi theo màn\n")

// ── 1 · máy chủ phát header CHO TỪNG MÀN, không chỉ cho màn đang render ──
ok(/data-napfor=/.test(tr),
  "1 · mỗi màn có nút nạp riêng, gắn `data-napfor`",
  "một `#nutnap` đổ sẵn cho MỘT màn thì mọi màn khác trong cùng tài liệu "
  + "dùng nhờ nút của màn ấy")
ok(/data-tcfor=/.test(tr),
  "1b · mỗi màn có số đếm riêng, gắn `data-tcfor`")

// ── 2 · `doiView` PHẢI đổi header ───────────────────────────────────────
{
  const i = mwS.indexOf("function doiView")
  const than = i > 0 ? mwS.slice(i, i + 1600) : ""
  ok(i > 0, "2 · tìm thấy `doiView`")
  ok(/data-napfor|napfor/.test(than),
    "2b · `doiView` đổi nút nạp theo màn mới",
    "đổi `.view.on` + `pushState` mà bỏ header là để URL nói một đằng, "
    + "header nói một nẻo")
  ok(/data-tcfor|tcfor/.test(than),
    "2c · `doiView` đổi số đếm theo màn mới")
}

// ── 3 · nút nạp SAI màn là nút dẫn người đi làm việc của module khác ────
//
// Không chỉ là lỗi hiển thị: nút ấy MỞ một màn nạp. Vế này canh đúng chỗ
// nguy: chỉ MỘT nút được hiện tại một lúc.
ok(/\.nap1\b|hidden/.test(tr) || /napfor[^]{0,200}?hidden/.test(tr),
  "3 · chỉ MỘT nút nạp hiện tại một thời điểm",
  "hai nút nạp cùng hiện thì người bấm cái nào cũng có lý")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · header nói đúng màn đang đứng")
process.exit(loi ? 1 : 0)
