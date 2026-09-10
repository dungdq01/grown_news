/**
 * T03-117 bước 2 · nút "Tải xuống ▾" + trang in.
 *
 * Wireframe `SCR-19` chủ dự án duyệt 2026-09-06, mốc ở
 * `WL-01M1T7X3B6N4K8P2VQDWHM5FGJ` kèm ba quyết định:
 *   1. GIỮ menu xổ kể cả khi chỉ một mục — nút cùng chỗ, cùng hình ở mọi loại
 *   2. bài viết CÓ "File gốc" (`md` = thân bài, `goc` = nguyên file)
 *   3. tạm thời chỉ đặt trong cửa sổ đọc
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const mw = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
const trang = doc("../render/trang.mjs")
const BANG = JSON.parse(doc("../../core/assets/xuat-dang.json"))

console.log("\nT03-117 · nút tải xuống + trang in\n")

// ── AC1 · menu DẪN XUẤT từ bảng khai ──────────────────────────────────
ok(/xuat-dang|XUAT_DANG|__XUAT__/.test(mw),
  "AC1 · menu đọc bảng khai `xuat-dang.json`",
  "gõ cứng thì thêm một dạng vào bảng KHÔNG mọc thêm mục — hai nguồn sự thật")
for (const t of ["Markdown", "Word", "Phụ đề SRT"]) {
  ok(!mw.includes(`"${t}"`) && !mw.includes(`'${t}'`),
    `AC1 · KHÔNG gõ cứng tên dạng "${t}"`)
}

// ── AC2 · mục tải là <a href> THẲNG cửa, 0 blob ───────────────────────
//
// Trình duyệt tải bằng chính bộ tải của nó: có thanh tiến trình, có thư mục
// Do tren THAN HAM, bo chu thich: doan giai thich vi sao KHONG dung blob
// buoc phai nhac ten `createObjectURL`, va mot cong dem chuoi trong van xuoi
// thi phat nguoi viet chu thich ro.
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const iM = mw.indexOf("function menuTai(")
const thanMenu = iM > 0 ? boCT(mw.slice(iM, iM + 1800)) : ""
ok(/api\/xuat\//.test(thanMenu), "AC2 · muc tai tro thang cua `api/xuat/`")
ok(/<a class="tx-m" download href=/.test(thanMenu),
  "AC2 · la the `<a download>`, khong phai nut goi JS")
ok(!/createObjectURL|new Blob/.test(thanMenu),
  "AC2 · KHONG dung blob",
  "blob thi ta phai tu dung lai thanh tien trinh, thu muc Tai xuong, phep huy")
// AC2b · trang in — do TINH CHAT, khong do CHO DAT.
//
// Ban khai dau dinh dat nhanh o `trang.mjs`; do ra la khong dat duoc (site
// chi co route theo MAN). Cong nay hoi *trang in co ton tai va co sach
// khong*, khong hoi *no nam file nao* — cho dat la quyet dinh thi cong, con
// tinh chat moi la thu can giu.
const cuaXuat = doc("../api/xuat-cua.mjs")
ok(/dang === "in"/.test(cuaXuat), "AC2b · co nhanh trang in")
ok(/window\.print\(\)/.test(cuaXuat), "AC2b · trang in tu goi `window.print()`")
ok(!/data-nav|class="rail"|<aside/.test(cuaXuat),
  "AC2b · trang in SACH — 0 rail, 0 menu, 0 nut")
ok(/@media print/.test(cuaXuat), "AC2b · co khoi `@media print`")

// ── AC3 · quyết định 1: menu GIỮ kể cả một mục ────────────────────────
ok(/details|dialog/.test(mw.slice(mw.indexOf("Tải xuống") - 400,
                                  mw.indexOf("Tải xuống") + 900)),
  "AC3 · menu là `<details>`/`<dialog>` (FR-022 — không confirm/prompt)")

// ── AC3b · bảng khai đủ bốn ca của wireframe ─────────────────────────
ok((BANG.theo_loai["tai-lieu"] || []).length === 1,
  "AC3b · ca tài-liệu đúng MỘT mục — menu vẫn xổ (quyết định 1)")
ok((BANG.theo_loai.article || []).includes("goc"),
  "AC3b · bài viết có `goc` (quyết định 2)")
ok((BANG.theo_loai.transcript || []).includes("srt"),
  "AC3b · transcript có `srt`")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · nút tải xuống đúng bản vẽ đã duyệt")
process.exit(loi ? 1 : 0)
