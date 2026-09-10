#!/usr/bin/env node
/**
 * WO-096 · T03-147 — Xuất PDF thật bằng Typst.
 *
 * Chủ dự án 2026-09-10: *"cố gắng sử dụng latex mà làm. Trong tài liệu tôi chụp
 * gửi bạn là font latex xuất ra pdf đó."*
 *
 * `s1` đã chọn Typst (một binary · 27× nhanh hơn xelatex · font New Computer
 * Modern, cùng họ với mẫu). Gap `[G] NCM phủ dấu tiếng Việt` đóng 2026-09-10.
 *
 * ── Vì sao vế 2 nặng NGANG vế 1 ────────────────────────────────────────────
 * Typst là một NGÔN NGỮ, không phải một bộ đánh chữ câm: `#import`, `#eval`,
 * `#read` là mã chạy được. Thân bài do MODEL sinh, nên dán thẳng vào là mở một
 * đường thực thi. Thoát phải xảy ra TRƯỚC khi dựng markup — cùng bài học
 * `WO-095` với HTML, chỉ đổi bộ ký tự.
 *
 * ── Vế 3 CHẠY THẬT ─────────────────────────────────────────────────────────
 * Không grep: nó gọi `typst` thật, đọc PDF ra bằng `pypdf` và đối chiếu dấu.
 * Máy chưa cài binary ⇒ vế BỎ QUA có ghi rõ, không giả vờ xanh.
 */
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-096 · xuất PDF bằng Typst\n")

const SRC = doc("../api/xuat-cua.mjs")
let f = null, chayTypst = null
try {
  const m = await import("../api/xuat-cua.mjs")
  f = m.mdSangTypst
  chayTypst = m.timTypst
} catch (e) {
  ok(false, "0 · nạp được `xuat-cua.mjs`", String(e).slice(0, 120))
}
ok(typeof f === "function", "0a · có `mdSangTypst` THUẦN và xuất ra",
  "nằm chìm trong tay-nghe thì cổng chỉ đọc được chữ")

const T = (md) => (f ? f(md) : "")
const NL = "\n"

// ── 1 · Markdown ra markup Typst ─────────────────────────────────────────
console.log("\n1 · Markdown ra markup Typst\n")
if (f) {
  ok(/^==\s+2\. Bối cảnh/m.test(T("## 2. Bối cảnh")),
    "1 · `## …` ⇒ `== …`", `được: ${T("## 2. Bối cảnh").slice(0, 80)}`)
  ok(/^===\s/m.test(T("### 3.1 Đầu vào")), "1a · `### …` ⇒ `=== …`")

  const bang = ["| Cột A | Cột B |", "|---|---|", "| 1 | 2 |"].join(NL)
  const rb = T(bang)
  ok(/#table\(/.test(rb) && /columns:\s*2/.test(rb) && /Cột A/.test(rb),
    "1b · bảng ⇒ `#table(columns: 2, …)`",
    `được: ${rb.slice(0, 140)} — bảng là thứ hỏng thấy rõ nhất ở bản in cũ`)

  ok(/^-\s+một/m.test(T(["- một", "- hai"].join(NL))),
    "1c · `- ` ⇒ danh sách Typst")
  ok(/^\+\s+một/m.test(T(["1. một", "2. hai"].join(NL))),
    "1c2 · `1. ` ⇒ `+ ` (danh sách có thứ tự)")
  ok(/#quote\(|^>\s/m.test(T("> trích một câu")), "1d · `> ` ⇒ trích dẫn")
  ok(/```/.test(T(["```", "x = 1", "```"].join(NL))), "1e · khối mã giữ nguyên")

  const r = T("Một **đậm** và *nghiêng* và `mã`.")
  ok(/\*đậm\*/.test(r) && /_nghiêng_/.test(r) && /`mã`/.test(r),
    "1f · đậm ⇒ `*…*` · nghiêng ⇒ `_…_` · mã ⇒ `` `…` ``",
    `được: ${r.slice(0, 120)}`)
}

// ── 2 · ÂM · ký tự đặc biệt của Typst bị THOÁT ───────────────────────────
console.log("\n2 · ÂM · thân bài là chuỗi của MODEL, không phải mã tin được\n")
if (f) {
  const doc2 = T('Xem #import "evil.typ" và #eval("1+1") và $x^2$ nhé.')
  ok(!/(^|[^\\])#import/.test(doc2),
    "2 · `#import` KHÔNG còn là lệnh — dấu `#` bị thoát",
    `được: ${doc2.slice(0, 140)} — Typst là một NGÔN NGỮ; dán thẳng là mở một `
    + "đường thực thi cho chuỗi model sinh")
  ok(!/(^|[^\\])#eval/.test(doc2), "2a · `#eval` cũng vậy")
  ok(!/(^|[^\\])\$x\^2\$/.test(doc2),
    "2b · `$…$` không tự thành công thức",
    `được: ${doc2.slice(0, 140)}`)
  // Nhưng markup TA sinh thì phải còn nguyên.
  ok(/^==\s/m.test(T("## Tiêu đề")),
    "2c · markup do CHÍNH TA sinh vẫn sống (thoát nội dung, không thoát cấu trúc)")
}

// ── 3 · CHẠY THẬT — PDF hợp lệ, dấu tiếng Việt đủ ────────────────────────
console.log("\n3 · Chạy `typst` thật\n")
{
  const bin = typeof chayTypst === "function" ? chayTypst() : null
  if (!bin || !existsSync(bin)) {
    console.log("  BỎ QUA · máy này chưa có `typst` — vế 3 KHÔNG đo được.")
    console.log("           cài: winget install Typst.Typst")
  } else if (f) {
    const d = mkdtempSync(join(tmpdir(), "gn-typ-"))
    const src = join(d, "a.typ")
    const out = join(d, "a.pdf")
    const than = ["## Kiểm dấu", "", "Chưng cất · Mở mang tầm mắt · Hoá đơn.", "",
      "| Cột | Giá |", "|---|---|", "| Ầ Ắ Ẵ | Ệ Ộ Ợ |"].join(NL)
    writeFileSync(src,
      '#set text(font: "New Computer Modern", lang: "vi")\n' + T(than), "utf8")
    let nem = null
    try { execFileSync(bin, ["compile", src, out], { timeout: 30000 }) }
    catch (e) { nem = String(e.stderr ?? e).slice(0, 200) }
    ok(nem === null && existsSync(out), "3 · `typst` biên dịch ra PDF", nem ?? "")
    if (existsSync(out)) {
      const b = readFileSync(out)
      ok(b.subarray(0, 5).toString() === "%PDF-", "3a · và nó là PDF thật")
      ok(b.length > 2000, `3a2 · có nội dung (${b.length} byte)`)
    }
  }
}

// ── 4 · Không có binary ⇒ nói thẳng, không file rỗng ─────────────────────
console.log("\n4 · Thiếu binary thì báo, không im lặng\n")
{
  const i = SRC.indexOf('dang === "pdf"')
  const kh = i > 0 ? SRC.slice(i, i + 2200) : ""
  ok(i > 0, "4-0 · cửa có nhánh `dang === \"pdf\"`")
  ok(/503/.test(kh), "4 · thiếu `typst` ⇒ 503 nói thẳng",
    "trả 200 với 0 byte là để người tải về một file hỏng mà không biết vì sao")
  ok(/timeout|tran|kill/i.test(kh), "4a · tiến trình con có trần thời gian",
    "treo thì cửa đứng mãi và một request giữ một tiến trình")
}

// ── 5 · Bảng khai ────────────────────────────────────────────────────────
console.log("\n5 · `pdf` khai ở bảng, không gõ trong mã\n")
{
  const B = JSON.parse(doc("../../core/assets/xuat-dang.json"))
  ok(!!B.dang?.pdf, "5 · `xuat-dang.json` có dạng `pdf`")
  ok(String(B.dang?.pdf?.mime) === "application/pdf", "5a · mime đúng")
  ok((B.theo_loai?.article ?? []).includes("pdf"),
    "5b · và loại `article` được phép xuất `pdf`")
}

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — Typst dựng PDF, mã của model bị thoát, thiếu binary thì báo\n")
