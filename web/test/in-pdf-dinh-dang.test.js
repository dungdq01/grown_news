#!/usr/bin/env node
/**
 * WO-095 · T03-146 — Trang in dựng HTML THẬT từ Markdown.
 *
 * `xuat-cua.mjs` nhét cả thân bài vào MỘT `<pre>`, nên bản PDF in ra hiện
 * đúng chữ `## 2. Bối cảnh`, bảng Markdown thành một rừng dấu `|`, và
 * `**đậm**` giữ nguyên hai dấu sao.
 *
 * ── Vì sao vế 2 nặng NGANG vế 1 ────────────────────────────────────────────
 * `<pre>` cũ AN TOÀN: `esc2` chặn mọi thẻ. Thân bài do MODEL sinh, nên đổi
 * sang dựng HTML là mở đúng cái cửa mà `<pre>` đang đóng. Thoát phải xảy ra
 * TRƯỚC khi dựng thẻ, và vế 2 gieo một `<script>` để chứng minh.
 *
 * Bỏ vế đó thì WO này đổi một bản in xấu lấy một lỗ XSS — một đánh đổi không
 * ai đồng ý nếu được hỏi.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-095 · bản in dựng HTML thật từ Markdown\n")

const SRC = doc("../api/xuat-cua.mjs")

let f = null
try {
  const m = await import("../api/xuat-cua.mjs")
  f = m.mdSangHtml
} catch (e) {
  ok(false, "0 · nạp được `xuat-cua.mjs`", String(e).slice(0, 120))
}
ok(typeof f === "function", "0a · cửa xuất có `mdSangHtml` THUẦN và xuất ra",
  "nằm chìm trong tay-nghe thì cổng chỉ đọc được chữ; một bộ dựng HTML mà "
  + "không ai chạy thử là một bộ dựng chưa biết đúng")

const H = (md) => (f ? f(md) : "")
const NL = "\n"

// ── 1 · Từng thứ Markdown ra đúng thẻ ────────────────────────────────────
console.log("\n1 · Markdown ra thẻ, không ra chữ thô\n")
if (f) {
  ok(/<h2[^>]*>\s*2\. Bối cảnh\s*<\/h2>/.test(H("## 2. Bối cảnh")),
    "1 · `## …` ⇒ `<h2>`",
    `được: ${H("## 2. Bối cảnh").slice(0, 90)} — bản cũ in ra đúng chữ "## "`)
  ok(/<h3/.test(H("### 3.1 Đầu vào")), "1a · `### …` ⇒ `<h3>`")

  const bang = ["| Cột A | Cột B |", "|---|---|", "| 1 | 2 |"].join(NL)
  const rb = H(bang)
  ok(/<table/.test(rb) && /<th[^>]*>\s*Cột A/.test(rb) && /<td[^>]*>\s*1/.test(rb),
    "1b · bảng Markdown ⇒ `<table>` có `<th>` và `<td>`",
    `được: ${rb.slice(0, 120)} — \`WO-077\` vừa mời model dùng bảng, nên đây `
    + "là thứ hỏng thấy rõ nhất")

  const ds = ["- một", "- hai"].join(NL)
  ok(/<ul>[\s\S]*<li>\s*một[\s\S]*<li>\s*hai/.test(H(ds)),
    "1c · `- ` ⇒ `<ul><li>`", `được: ${H(ds).slice(0, 90)}`)
  ok(/<ol>[\s\S]*<li>/.test(H(["1. một", "2. hai"].join(NL))),
    "1c2 · `1. ` ⇒ `<ol><li>`")

  ok(/<blockquote>/.test(H("> trích một câu")), "1d · `> ` ⇒ `<blockquote>`")
  ok(/<pre><code>/.test(H(["```", "x = 1", "```"].join(NL))),
    "1e · ```` ``` ```` ⇒ `<pre><code>`",
    "khối mã VẪN là `<pre>` — đó là chỗ `<pre>` đúng vai")

  const r = H("Một **đậm** và *nghiêng* và `mã`.")
  ok(/<strong>đậm<\/strong>/.test(r) && /<em>nghiêng<\/em>/.test(r)
    && /<code>mã<\/code>/.test(r),
    "1f · đậm · nghiêng · mã trong dòng", `được: ${r.slice(0, 120)}`)
  ok(/<a href="https:\/\/x\.vn"[^>]*>nhãn<\/a>/.test(H("[nhãn](https://x.vn)")),
    "1g · `[nhãn](url)` ⇒ `<a href>`", `được: ${H("[nhãn](https://x.vn)")}`)

  ok(!/<pre>[\s\S]*## /.test(H("## Tiêu đề" + NL + NL + "Đoạn văn.")),
    "1h · thân bài KHÔNG còn nằm trong một `<pre>` bao trùm",
    "đó là chính hình dạng cũ")
}

// ── 2 · ÂM · HTML do model sinh KHÔNG thành thẻ thật ─────────────────────
console.log("\n2 · ÂM · thân bài là chuỗi của MODEL, không phải HTML tin được\n")
if (f) {
  const doc2 = H('Xem <script>alert(1)</script> và <img src=x onerror=alert(2)>')
  ok(!/<script/i.test(doc2),
    "2 · `<script>` trong thân KHÔNG thành thẻ",
    `được: ${doc2.slice(0, 140)} — \`<pre>\` cũ an toàn nhờ \`esc2\`; bản mới `
    + "phải giữ đúng tính chất ấy, không đổi bản in xấu lấy một lỗ XSS")
  ok(!/<img/i.test(doc2), "2a · và `<img onerror=…>` cũng không",
    `được: ${doc2.slice(0, 140)}`)
  ok(/&lt;script&gt;/.test(doc2),
    "2a2 · chúng hiện ra dưới dạng CHỮ (đã thoát)",
    "nuốt mất còn tệ hơn: người đọc không biết bản gốc viết gì")

  // Thoát phải xảy ra TRƯỚC khi dựng thẻ, không sau.
  const lien = H("[nhãn](javascript:alert(1))")
  ok(!/href="javascript:/i.test(lien),
    "2b · liên kết `javascript:` bị chặn",
    `được: ${lien}`)
}

// ── 3 · CSS in — thứ quyết định bản PDF đọc được hay không ───────────────
console.log("\n3 · Kiểu chữ và ngắt trang\n")
{
  const i = SRC.indexOf('dang === "in"')
  const kh = i > 0 ? SRC.slice(i, i + 3000) : ""
  ok(/@page/.test(kh), "3 · có `@page` (lề trang)")
  ok(/orphans/.test(kh) && /widows/.test(kh),
    "3a · có `orphans`/`widows` — không để một dòng lạc sang trang")
  ok(/break-after\s*:\s*avoid/.test(kh),
    "3b · tiêu đề không rơi một mình cuối trang (`break-after: avoid`)")
  ok(/break-inside\s*:\s*avoid/.test(kh),
    "3c · bảng và khối mã không bị cắt đôi (`break-inside: avoid`)")
  ok(/window\.print\(\)/.test(kh), "3d · vẫn tự gọi `print()`")
  ok(/analyzed_at|ngay/.test(kh), "3e · vẫn mang tiêu đề + nguồn + ngày")
}

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — Markdown ra thẻ, thẻ của model bị thoát, trang in ngắt đúng\n")
