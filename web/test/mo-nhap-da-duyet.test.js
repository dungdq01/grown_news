/**
 * WO · "xem bản nháp" của một việc ĐÃ DUYỆT mở ra một cửa sổ RỖNG.
 *
 * Chủ dự án bắt 2026-09-06 (hai ảnh cạnh nhau, CÙNG một slug):
 *   mở từ `/bai-viet/`            ⇒ thân bài đủ, mục lục 5 mục
 *   mở bằng "xem bản nháp ›"      ⇒ *"Bản này không có thân bài."*
 *
 * Hai lỗi chồng nhau trong `moCuaSoNhap`:
 *
 *   1 · nó **BỊA** một bản ghi — `than: ""`, `analyzed_at: ""`, `one_liner: ""`,
 *       `category: []`, `title: slug` — rồi giao cho `mo()`. Một cửa sổ dựng
 *       từ một bản ghi bịa thì mọi trường đều sai, không riêng thân bài.
 *
 *   2 · `tomSlug()` đọc `slug:` trong frontmatter của bản nháp và trả slug
 *       **TRẦN** (`phan-tich-…`), thiếu tiền tố loại. `tai()` gọi
 *       `/api/articles/phan-tich-…` ⇒ 404 ⇒ thân rỗng. Đây ĐÚNG là lỗi mà
 *       `FR-031` + bất biến `duongBai` đã trả giá một lần: đường bài luôn là
 *       `<loại>/<slug>`.
 *
 * Đường đúng đã có sẵn: `moTheoSlug` (`T03-118`) — nó đọc cửa thật, bóc phong
 * bì `{frontmatter, body}` và điền đủ trường. Bịa một bản ghi thứ hai cạnh nó
 * là dựng hai sự thật cho một bài.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const cc = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const mw = boCT(doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts"))

console.log("\nWO · mở nháp ĐÃ DUYỆT\n")

// ── 1 · đi ĐƯỜNG CÓ SẴN, không bịa bản ghi ────────────────────────────
const i = cc.indexOf("async function moCuaSoNhap")
const than = i > 0 ? cc.slice(i, i + 2200) : ""
ok(i > 0, "1 · tìm thấy `moCuaSoNhap`")

const iDuyet = than.indexOf('"da_duyet"')
const nhanhDuyet = iDuyet > 0 ? than.slice(iDuyet, iDuyet + 900) : ""
ok(/moTheoSlug/.test(nhanhDuyet),
  "1b · nhánh `da_duyet` gọi `moTheoSlug` — cửa THẬT",
  "bịa một bản ghi rỗng rồi giao cho `mo()` thì mọi trường đều sai, "
  + "không riêng thân bài")
// Nhánh `da_duyet` chỉ được GỌI cửa thật. Đo bằng "không có `w.mo(` ở đây"
// chứ không bằng "không có `than: \"\"`": chuỗi ấy VẪN hợp lệ ở nhánh
// nháp-thật bên dưới (ở đó `veCuaSoNhap` đổ thân vào sau), nên bắt nó là
// bắt oan một dòng đúng.
// Cắt ở chỗ nhánh nháp-thật BẮT ĐẦU, không cắt bằng một số ký tự đoán bừa:
// cửa sổ rộng quá thì nó ôm luôn dòng `w.mo(` hợp lệ bên dưới và đỏ oan.
const ketNhanh = nhanhDuyet.indexOf("const wid = w.mo(")
ok(!/w\.mo\(/.test(ketNhanh > 0 ? nhanhDuyet.slice(0, ketNhanh) : nhanhDuyet),
  "1c · nhánh ấy KHÔNG tự dựng cửa sổ bằng bản ghi bịa",
  "bản ghi bịa có `than: \"\"` — đó chính là câu *Bản này không có thân bài*")

// ── 2 · cầu `__GN_MW__` phải CHỞ được `moTheoSlug` ────────────────────
ok(/moTheoSlug/.test(mw.slice(mw.indexOf("function _cau"), mw.indexOf("function _cau") + 400)),
  "2 · `_cau()` xuất `moTheoSlug` cho chunk dùng",
  "cctab không gọi thẳng được hàm trong `gn.js` — nó chỉ có cây cầu")

// ── 3 · slug phải MANG TIỀN TỐ LOẠI ───────────────────────────────────
//
// `FR-031` + bất biến `duongBai`: đường bài LUÔN là `<loại>/<slug>`. Slug
// trần đi vào `/api/articles/…` là 404, và 404 ở đây hiện ra thành một cửa
// sổ trống chứ không thành một câu lỗi — nên không ai biết nó 404.
ok(/tomLoai|source_type:/.test(cc),
  "3 · có chỗ đọc LOẠI của bản nháp (không mặc định mù)")
ok(/tomSlug\(j\)[^)]*\/|loai \+ "\/"|`\$\{loai\}\/\$\{/.test(cc)
  || /duongDayDu|slugDayDu/.test(cc),
  "3b · dựng đường ĐẦY ĐỦ `<loại>/<slug>` trước khi mở",
  "slug trần ⇒ `/api/articles/phan-tich-…` ⇒ 404 ⇒ cửa sổ rỗng câm")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · nháp đã duyệt mở đúng bài thật")
process.exit(loi ? 1 : 0)
