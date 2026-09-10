/**
 * Phiếu chưng cất — MODEL + PROMPT, và không gì thừa.
 *
 * Chủ dự án 2026-09-07, sau khi `SCR-23` bản đầu chạy thật:
 *   *"xoá hết text comment, mô tả thừa thãi đi. Tôi chỉ cần chọn model, viết
 *   prompt là được, mà ô viết prompt làm cho to tí"*
 *
 * ĐẢO LẠI `SCR-23` bản đầu. Thứ bị bỏ — khối ① GỬI GÌ (thanh + phần trăm), ba
 * nhãn đánh số, khung cảnh báo ba dòng, câu *"Chỉ dẫn KHÔNG đổi được khung
 * mục"* — đều là thứ TÔI thêm, không phải thứ được xin. Một phiếu ba khối cho
 * hai trường chính là cái *"mô tả thừa thãi"* bị báo.
 *
 * Cổng này nay canh HAI thứ, và chỉ hai:
 *   · phiếu GỌN — không quay lại được các khối đã bỏ
 *   · hai thứ KHÔNG ĐƯỢC MẤT khi gọn hoá:
 *       (a) công bố egress/khu vực — `spec §4.0c` FROZEN, NĐ 356/2025 Điều 14
 *       (b) stylesheet của chunk phải ĐƯỢC GẮN, không chỉ tồn tại
 *
 * (b) là vế đắt nhất file này. Nó sinh ra vì `moPhieuChungCat` từng không gọi
 * `trCss()`: mọi luật CSS có thật trong `KHOI_CSS`, cổng đo *"luật có tồn
 * tại"* nên xanh hết, còn phiếu chạy bằng style MẶC ĐỊNH của trình duyệt.
 * **Một luật không bao giờ được tiêm thì giống hệt một luật không tồn tại.**
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const CR = String.fromCharCode(13)
const goc = doc("../plugins/cctab/src/cctab.inline.ts").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tab = boCT(goc)
const than = (ten, n = 2600) => {
  const i = tab.indexOf(ten)
  if (i < 0) return ""
  const h = tab.indexOf("\n}\n", i)
  return tab.slice(i, h > 0 ? h : i + n)
}

console.log("\nphiếu chưng cất · model + prompt\n")

// ── 1 · STYLESHEET PHẢI ĐƯỢC GẮN, không chỉ TỒN TẠI ──────────────────
for (const ten of ["async function moPhieuChungCat", "async function veTranscript",
                   "async function veThanTranscript"]) {
  const t = than(ten, 500)
  if (!t) continue
  ok(/trCss\(\)/.test(t),
    `1 · \`${ten.replace("async function ", "")}\` gọi \`trCss()\``,
    "vẽ markup của chunk mà không tiêm CSS của chunk ⇒ style mặc định trình "
    + "duyệt, và mọi vế đo *luật có tồn tại* vẫn xanh")
}

// ── 2 · CÔNG BỐ EGRESS không được mất khi gọn hoá ─────────────────────
//
// `spec §4.0c`: *"chọn model là chọn KHU VỰC PHÁP LÝ — phải hiện, không được
// im"*. `FR-053 §1.4`: hiện NGUYÊN VĂN slug. Một dòng NGẮN vẫn là hiện; xoá
// hẳn mới là im. Đây là chỗ duy nhất trong phiếu KHÔNG được gọn tiếp.
{
  const t = than("async function moPhieuChungCat", 3000)
  ok(/pc-kv/.test(t), "2 · phiếu có dòng công bố khu vực")
  ok(/rời khỏi máy/i.test(t),
    "2b · và nói rõ dữ liệu RỜI KHỎI MÁY",
    "người bấm phải biết đây là một lần egress, không phải một phép tính nội bộ")
  ok(/data-f="kv"/.test(t), "2c · giá trị khu vực đổ vào một ô có thật")
  const k = than("function veKhuVuc")
  ok(/d\.khu_vuc/.test(k),
    "2d · đổ NGUYÊN VĂN slug (`FR-053 §1.4`)",
    "dịch chữ đi là bỏ mất thứ tra được trong bảng khai")
  ok(!/!==\s*["']khong-xac-dinh|===\s*["']khong-xac-dinh/.test(k),
    "2e · KHÔNG đặc cách `khong-xac-dinh`",
    "ẩn đúng giá trị đáng lo nhất là biến phép công bố thành phép giấu")
}

// ── 3 · Ô PROMPT: mở sẵn và TO ────────────────────────────────────────
{
  const t = than("function veOChiDan", 2000)
  ok(t.length > 0, "3 · tìm thấy `veOChiDan`")
  ok(!/<details/.test(t),
    "3b · ô prompt MỞ SẴN, không gấp trong `<details>`",
    "`T03-116` gấp nó vì cho là ít người dùng; chủ dự án khai ngược — nó là "
    + "MỘT TRONG HAI thứ chính, và một thứ chính phải bấm để mở là thứ bị giấu")
  const r = t.match(/rows="(\d+)"/)
  ok(r && Number(r[1]) >= 6,
    `3c · \`rows\` ≥ 6 (được ${r ? r[1] : "?"})`)
  const css = goc.slice(goc.indexOf("const KHOI_CSS"))
  const mh = css.match(/\.pc-ta\{[^}]*min-height:\s*([\d.]+)em/)
  ok(mh && Number(mh[1]) >= 8,
    "3d · và `.pc-ta` có `min-height` >= 8em (được "
    + (mh ? mh[1] + "em" : "không có") + ")",
    "font nhỏ làm 8 dòng vẫn thấp; `min-height` là phép chặn thật")
}

// ── 4 · GỌN — không quay lại các khối đã bỏ ───────────────────────────
// Quét trên TOÀN FILE cho những tên chỉ phiếu này dùng, và chỉ trong THÂN
// phiếu cho `dlg-canh` — lớp ấy còn phục vụ hai hộp thoại khác (phiếu loại
// bài, phiếu transcript), nên một phép quét cả file sẽ tố oan chúng.
{
  const t = than("async function moPhieuChungCat", 3000)
  for (const [k, ten] of [
    ["veKhoiGui", "khối ① GỬI GÌ"],
    ["pc-thanh", "thanh phần trăm"],
    ["tran_payload_byte", "mẫu số của thanh"],
    ["KV_NGHIA", "câu dịch khu vực"],
    ["KHÔNG đổi được khung mục", "câu chú thích dưới ô nhập"],
  ])
    ok(!tab.includes(k), `4 · đã bỏ ${ten}`,
      "chủ dự án gọi đây là *mô tả thừa thãi* — thêm lại là quay về chỗ bị báo")
  ok(!/dlg-canh/.test(t),
    "4 · đã bỏ đoạn cảnh báo văn xuôi KHỎI PHIẾU CHƯNG CẤT",
    "công bố egress nay là một dòng ở `.pc-kv`, không phải một đoạn")
}

// ── 5 · chuyển động còn lại vẫn tắt được, vẫn không animate layout ────
{
  const kf = goc.match(/@keyframes\s+pc-[\s\S]{0,400}?\}\s*\}/g) ?? []
  ok(kf.length > 0, "5 · còn `@keyframes pc-*`")
  ok(kf.every((k) => !/(height|width|top|left|margin|padding)\s*:/.test(k)),
    "5b · 0 thuộc tính LAYOUT được animate")
  const guard = goc.match(
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[^]*?\n\}/g) ?? []
  ok(/\.pc-|\.dlg#dlg-cc/.test(guard.join("\n")),
    "5c · chuyển động nằm TRONG guard opt-in")
  const ngoai = goc.split(/@media\s*\(prefers-reduced-motion[^]*?\n\}/).join("")
  ok(!/\.pc-[\w+.\s>]*\{[^}]*(animation|transition):(?!\s*none)/.test(ngoai),
    "5d · KHÔNG chuyển động `.pc-*` nào nằm NGOÀI guard")
  ok(!/display:\s*none|visibility:\s*hidden/.test(guard.join("\n")),
    "5e · guard KHÔNG giấu khối nào")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · model + prompt to, công bố egress còn nguyên, CSS được gắn")
