/**
 * T03-120 · Trạng thái phải THẤY được, và nút phải nói rõ vai.
 *
 * `SCR-20` duyệt 2026-09-06. Trước đợt này màn nói trạng thái bằng ĐÚNG MỘT
 * kênh — một chuỗi `· draft` cỡ nano ở góc thẻ — cộng với `opacity` kéo cả
 * thẻ xuống. Hai cái đó có chung một khuyết tật: người phải ĐỌC mới biết,
 * không THẤY được; và `opacity` làm chữ mờ theo, tức trả tương phản để mua
 * một tín hiệu.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const css = doc("../styles/prototype.css")
const tok = doc("../../05_uiux/tokens.css")
const mw = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")

console.log("\nT03-120 · màu trạng thái + vai nút\n")

// ── 1 · MỘT token mới, bốn token DÙNG LẠI ─────────────────────────────
//
// Chốt 1 của `SCR-20`: draft xanh dương · edited cam · approved xanh lá ·
// rejected đỏ · rác xám. Bốn trong năm đã có tên ngữ nghĩa trong hệ; đẻ thêm
// token cho chúng là dựng hai tên cho một màu, và hai tên thì có ngày lệch.
ok(/--tt-draft\s*:/.test(tok), "1 · có token MỚI `--tt-draft` (xanh dương)")
{
  // Dự án đổi hệ bằng `[data-theme="dark"]` (người CHỌN), KHÔNG bằng
  // `prefers-color-scheme` — `tokens.css` không có dòng nào chứa chuỗi ấy.
  // Bản đầu của cổng này cắt file ở một mốc không tồn tại nên `sang` ôm cả
  // file, `toi` rỗng, và nó đỏ OAN. Đo sai thì sửa phép đo.
  const mocToi = tok.search(/\[data-theme="dark"\]/)
  ok(mocToi > 0, '1b · tokens.css có khối hệ tối `[data-theme="dark"]`')
  ok(mocToi > 0 && /--tt-draft\s*:/.test(tok.slice(0, mocToi))
    && /--tt-draft\s*:/.test(tok.slice(mocToi)),
    "1b · `--tt-draft` khai ở CẢ hệ sáng lẫn hệ tối",
    "một màu chỉ khai ở hệ sáng là một màu sẽ chói hoặc chìm ở hệ kia")
}
ok(!/--tt-(edited|approved|rejected|rac)\s*:/.test(tok),
  "1c · KHÔNG đẻ token cho bốn màu ĐÃ CÓ tên ngữ nghĩa",
  "`--warn` `--success` `--destructive` `--ink-3` đã là chúng — "
  + "đặt tên thứ hai là dựng chỗ để lệch")
ok(!/--tt-draft\s*:\s*var\(--c-video\)/.test(tok),
  "1d · `draft` KHÔNG mượn `--c-video`",
  "`--c-video` là màu của LOẠI NGUỒN; mượn cho TRẠNG THÁI là trộn hai chiều "
  + "phân loại vào một màu")

// ── 2 · thẻ: vạch trái là kênh THỨ HAI, opacity không còn là kênh ──────
for (const [tt, mau] of [
  ["draft", "--tt-draft"], ["edited", "--warn"],
  ["approved", "--success"], ["rejected", "--destructive"],
]) {
  const re = new RegExp(`\\.cd\\.st-${tt}\\{[^}]*border-left:[^}]*var\\(${mau}\\)`)
  ok(re.test(css), `2 · \`.cd.st-${tt}\` có vạch trái \`var(${mau})\``)
}
ok(/\.cd\.st-rejected\{[^}]*border-left-style:\s*dashed/.test(css)
  || /\.cd\.st-rejected\{[^}]*dashed/.test(css),
  "2b · `rejected` vạch trái ĐỨT — dấu hình học, không chỉ màu",
  "~8% đàn ông không phân biệt đỏ–xanh; một hệ chỉ-màu nói với họ rằng "
  + "bốn thẻ này giống nhau")
ok(!/\.cd\.st-(draft|rejected)\{[^}]*opacity:/.test(css),
  "2c · BỎ `opacity` khỏi thẻ draft/rejected",
  "`opacity` kéo cả CHỮ xuống — trả tương phản để mua một tín hiệu")

// ── 3 · gạch tiêu đề `rejected` phải ĐỎ (chốt 2 của chủ dự án) ─────────
//
// Gạch màu chữ chỉ nói "cũ". Gạch đỏ nói "đây là một PHÁN QUYẾT".
ok(/\.cd\.st-rejected h4\{[^}]*text-decoration-color:\s*var\(--destructive\)/.test(css),
  "3 · tiêu đề `rejected` gạch ngang MÀU ĐỎ",
  "chủ dự án chốt: *gạch ngang màu đỏ luôn*")

// ── 4 · nút có BA hình, ứng ba vai ────────────────────────────────────
for (const [lop, cau] of [
  ["bt-chinh", "CHÍNH — nền đặc"],
  ["bt-thuong", "THƯỜNG — ghost"],
  ["bt-nguy", "NGUY — viền đỏ"],
]) {
  ok(new RegExp(`\\.${lop}[ >.:\\w-]*\\{`).test(mw),
    `4 · \`.${lop}\` có luật hình thức (${cau})`)
}
ok(/\.bt-nguy\s+button\{[^}]*var\(--destructive\)/.test(mw),
  "4b · nút nguy hiểm mang màu `--destructive`")
ok(!/\.bt-nguy\s+button\{[^}]*background:\s*var\(--destructive\)/.test(mw),
  "4c · nhưng KHÔNG đỏ ĐẶC lúc nghỉ",
  "hai khối màu đặc trên một thanh chân thì mắt không biết đâu là việc chính, "
  + "và đỏ đặc kéo mắt MẠNH hơn nút chính")
ok(/\.bt-nguy\s+button:hover\{[^}]*background/.test(mw),
  "4d · chỉ đổ nền khi tay đã tới nơi (`:hover`)")

// ── 5 · nút CHÍNH không được TRÙNG HUE với nút nguy hiểm ──────────────
//
// Đo 2026-09-06: `--primary` là `#C81E1E` (đỏ), và ở hệ TỐI `--primary` và
// `--destructive` là **cùng một giá trị** `#F87171`. Nút chính sơn màu thương
// hiệu thì màn đang chỉ vào chỗ nguy hiểm nhất bằng chính cái nút nổi nhất.
ok(!/\.bt-chinh>button\{[^}]*var\(--(brand|primary|destructive)\)/.test(mw),
  "5 · nút CHÍNH dùng nền trung tính, KHÔNG `--brand`/`--primary`/`--destructive`",
  "hệ tối: `--primary` === `--destructive` === #F87171 — hai vai một màu")
{
  const iP = tok.search(/\[data-theme="dark"\]/)
  const toi = iP > 0 ? tok.slice(iP) : ""
  const mau = (t) => (toi.match(new RegExp(`--${t}\\s*:\\s*(#[0-9A-Fa-f]{3,8})`)) ?? [])[1]
  ok(mau("primary") !== undefined && mau("primary") === mau("destructive"),
    "5b · (ghi nhận) hệ tối ĐANG có `--primary` === `--destructive`",
    "vế này ĐỎ nghĩa là ai đó đã tách hai token — tin tốt: bỏ vế này đi, "
    + "và `.bt-chinh` được phép dùng lại `--primary`")
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · trạng thái thấy được, nút nói rõ vai")
process.exit(loi ? 1 : 0)
