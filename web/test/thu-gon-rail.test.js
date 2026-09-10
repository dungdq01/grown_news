/**
 * THU GỌN thanh bên — chủ dự án 2026-09-07: *"làm thêm chức năng đóng thanh bên
 * menu"* (kèm ảnh chụp ChatGPT: *"Đóng thanh bên"*).
 *
 * ── Vì sao lối này rẻ nhất, và nó là một phép đo chứ không phải may mắn ──
 *
 * `--rail-w: 78px` là MỘT token, và `05_uiux/tokens.css` đã ghi rõ *"rail và
 * phần bù của khung nội dung PHẢI khớp"*:
 *
 *     .top  { width: var(--rail-w) }         ← thanh bên
 *     .wrap { padding-left: var(--rail-w) }  ← phần bù của nội dung
 *
 * ⇒ Thu gọn = đổi ĐÚNG MỘT biến. Cả hai bên tự theo, nên không có trạng thái
 * nào mà rail đã ẩn còn nội dung vẫn thụt lề — thứ sẽ xảy ra nếu tôi đặt
 * `width` và `padding` bằng hai con số rời.
 *
 * ── Ba thứ cổng này canh ─────────────────────────────────────────────────
 *
 * 1. Nút mở lại phải CÒN NHÌN THẤY lúc đã thu gọn. Một nút nằm trong chính
 *    thứ nó vừa ẩn là một cửa một chiều — người dùng mất menu và không có
 *    đường về, và đó là lỗi tệ nhất một toggle có thể có.
 * 2. Trạng thái phải SỐNG QUA F5 (`localStorage`), cùng khuôn `gn-theme` /
 *    `gn-lang` đã có. Một tuỳ chọn quên mình sau mỗi lần tải là một tuỳ chọn
 *    người dùng phải bấm lại mãi.
 * 3. `aria-expanded` phải nói thật. Nút này ẩn cả một vùng điều hướng; người
 *    đọc bằng trình đọc màn hình cần biết vùng ấy đang mở hay đóng.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const shell = doc("../plugins/home-pages/shell.html")
// BO COMMENT truoc khi do: ve 2b tim mot chuoi ma chinh comment ta bug lai
// chua no, nen no do vao loi ke ve bug thay vi vao CSS. Cung lop loi
// "cong xanh/do vi neo vao chu, khong vao co che".
const css = doc("../styles/prototype.css").replace(/\/\*[^]*?\*\//g, "")
const js = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
  .replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

console.log("\nthu gọn thanh bên\n")

// ── 1 · có nút, và nó khai vai bằng `aria-expanded` ───────────────────
ok(/id="rc"/.test(shell), "1 · shell có nút thu gọn (`#rc`)")
{
  const i = shell.indexOf('id="rc"')
  const t = i > 0 ? shell.slice(Math.max(0, i - 240), i + 240) : ""
  ok(/aria-expanded/.test(t),
    "1b · nút khai `aria-expanded`",
    "nút này ẩn cả một vùng điều hướng — trình đọc màn hình phải biết mở/đóng")
  ok(/aria-label|title=/.test(t),
    "1c · và có nhãn đọc được (nó chỉ là một icon)")
}

// ── 2 · rail PHẢI RỜI KHỎI MÀN, và nội dung phải thu lề ───────────────
//
// Vế này viết lại 2026-09-08 sau khi bản đầu của TÔI gây đúng một bug. Bất
// biến cũ tôi tự khai — *"phải đổi `--rail-w`, không đặt lại width/padding
// riêng"* — nghe gọn và SAI:
//
//     .top{width:var(--rail-w)}  +  html.rail-gon{--rail-w:0px}
//     html.rail-gon .top{transform:translateX(-100%)}
//
// `-100%` của một phần tử rộng 0 là **0**. Rail không dịch đi đâu, chỉ co về 0
// rồi nội dung tràn ra — chủ dự án chụp lại: nhãn bị cắt còn "hợp", "viết".
//
// Ở đây có HAI sự thật, và thu gọn làm chúng tách ra:
//   · bề rộng THẬT của rail         — phải GIỮ, không thì `translateX` hết nghĩa
//   · chỗ mà nội dung CHỪA cho rail — phải về 0
// Một token không nói được hai sự thật. Nên cổng canh cả hai vế ấy, và canh
// **cấm** cái bẫy cũ.
{
  ok(/--rail-w/.test(css), "2 · `--rail-w` vẫn là token dùng chung")
  ok(!/\.rail-gon[^{]*\{[^}]*--rail-w\s*:\s*0/.test(css),
    "2b · KHÔNG zero hoá `--rail-w` khi thu gọn",
    "`.top` lấy `width` từ token ấy ⇒ zero nó làm `translateX(-100%)` = 0, và "
    + "rail đứng nguyên chỗ với nội dung tràn ra ngoài")
  ok(/\.rail-gon\s+\.top[^{]*\{[^}]*transform\s*:\s*translateX\(-100%\)/.test(css),
    "2c · rail RỜI KHỎI MÀN bằng `translateX(-100%)`")
  ok(/\.rail-gon\s+\.wrap[^{]*\{[^}]*padding-left\s*:\s*0/.test(css),
    "2d · và nội dung thu lề về 0",
    "rail đi rồi mà nội dung vẫn thụt 78px là một dải trống không ai giải "
    + "thích được")
}

// ── 3 · nút mở lại CÒN NHÌN THẤY khi đã thu gọn ───────────────────────
//
// Vế nặng nhất. Một nút nằm trong chính thứ nó vừa ẩn là cửa MỘT CHIỀU.
{
  // Nhận CẢ `.rc` lẫn `#rc`: bất biến là *"nút mở lại được đặt trên lớp
  // riêng"*, không phải *"chọn nó bằng id hay class"*. Khoá cách chọn là khoá
  // cách viết, và nó đỏ oan một dòng đúng.
  const m = css.match(/[^{}\n]*[.#]rc\b[^{]*\{[^}]*\}/g) ?? []
  const gop = m.join("\n")
  ok(m.length > 0, "3 · nút mở lại (`.rc`/`#rc`) có luật CSS riêng")
  ok(/position:\s*fixed|z-index/.test(gop),
    "3b · nút nổi trên lớp riêng, không trôi theo rail đã ẩn",
    "mất menu mà không có đường về là lỗi tệ nhất một toggle có thể có")
  // `position:fixed` đọc `left` theo KHUNG NHÌN, không theo rail. Tôi viết
  // `left:50%` với ý *"căn giữa rail"* và nút ra GIỮA MÀN HÌNH — 50% của màn
  // 2555px là 1277px. Chủ dự án bắt 2026-09-08: *"sao nút rail này ở giữa màn
  // hình? phải đặt nó ở góc chứ?"*.
  //
  // Vế này cấm đúng cái bẫy ấy: một phần tử `fixed` KHÔNG được lấy phần trăm
  // làm gốc ngang, vì phần trăm ở đó không nói về thứ ta tưởng nó nói.
  ok(!/#rc[^{]*\{[^}]*left:\s*\d+%/.test(gop),
    "3b2 · KHÔNG neo `left` bằng phần trăm",
    "`fixed` + `left:50%` = giữa MÀN HÌNH, không phải giữa rail")
  ok(/#rc[^{]*\{[^}]*left:\s*(?:calc\(|var\(|-?[\d.]+(?:px|rem|em))/.test(gop),
    "3b3 · `left` neo bằng độ dài thật (px/rem/var/calc)")
  const an = css.match(/\.rail-gon[^{]*\.top[^{]*\{[^}]*\}/g) ?? []
  ok(!/(^|[^-])#rc[^{]*\{[^}]*display:\s*none/.test(gop),
    "3c · KHÔNG `display:none` chính nút mở lại")
  ok(an.length > 0 || /\.rail-gon/.test(css),
    "3d · rail được ẩn khi thu gọn")
}

// ── 4 · trạng thái sống qua F5, cùng khuôn `gn-theme`/`gn-lang` ───────
ok(/gn-rail/.test(js),
  "4 · lưu trạng thái dưới khoá `gn-rail`",
  "một tuỳ chọn quên mình sau mỗi lần tải là tuỳ chọn phải bấm lại mãi")
ok(/localStorage\.setItem\(\s*["']gn-rail/.test(js), "4b · có ghi")
ok(/localStorage\.getItem\(\s*["']gn-rail/.test(js),
  "4c · và có ĐỌC LẠI lúc khởi động",
  "ghi mà không đọc thì trạng thái chỉ sống trong một lần tải")

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · một biến, nút không mất, trạng thái sống qua F5")
