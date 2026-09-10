#!/usr/bin/env node
/**
 * WO-091 · T03-144 — Tên file tải xuống, và `?dang=goc` luôn `attachment`.
 *
 * Chủ dự án 2026-09-09: bấm *Tải xuống ▾ → Bản gốc* thì file lưu thành
 * `6714ee19086f.pdf`, và với PDF trình duyệt **mở tab** thay vì tải.
 *
 * ── Vì sao KHÔNG chỉ "dùng `ten_goc`" ──────────────────────────────────────
 * Chú thích ở `articles.mjs:470` đã ghi lý do, và lý do ấy ĐÚNG: `ten_goc` là
 * chuỗi của NGƯỜI GỬI, và một `filename=` mang `"` hay newline là đường tách
 * đầu đề HTTP. Bỏ lớp chặn đó để lấy một cái tên đẹp là đổi một phiền toái
 * lấy một lỗ bảo mật.
 *
 * Nên vế 4 ở đây KHÔNG phải vế phụ: nó gieo đúng một `ten_goc` mang `"`, `\`,
 * CR và LF, rồi đòi đầu đề đi ra vẫn nguyên một dòng.
 *
 * ── Vì sao vế 2 nặng ngang vế 1 ────────────────────────────────────────────
 * Cách sửa DỄ là ép `attachment` mọi lúc. Làm thế thì `<video>` không phát và
 * thẻ 2 tầng câm — đúng bug `WO-064` đã sửa một lần rồi. Ý định TẢI phải nói
 * ra ở URL, không suy từ mime.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-091 · tên file tải xuống · `?dang=goc` luôn attachment\n")

const SRC = doc("../api/articles.mjs")

/** Trích `function <ten>(…){…}` bằng phép đếm ngoặc. */
function tach(src, ten) {
  const i = src.indexOf("function " + ten + "(")
  if (i < 0) return null
  const j = src.indexOf("{", i)
  let sau = 0
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
  }
  return null
}

// ── Phép dựng đầu đề phải TÁCH RA để chạy được ───────────────────────────
const src = tach(SRC, "dinhDanhTai")
ok(!!src, "0 · có phép THUẦN `dinhDanhTai(ten_goc, sha256, duoi)`",
  "nằm chìm trong `phucVuHienVat` thì cổng chỉ đọc được chữ, không chạy được — "
  + "và một phép lọc ký tự mà không ai chạy thử là một phép lọc chưa biết đúng")

let f = null
if (src) {
  try { f = new Function(src + "; return dinhDanhTai")() }
  catch (e) { ok(false, "0a · nạp được", String(e).slice(0, 110)) }
}

const SHA = "a".repeat(64)

// ── 1 · `?dang=goc` ⇒ attachment ─────────────────────────────────────────
console.log("1 · Ý định TẢI nói ở URL, không suy từ mime\n")
{
  const p = tach(SRC, "phucVuHienVat") ?? ""
  ok(/dang.{0,24}goc/.test(p), "1 · `phucVuHienVat` đọc `?dang=goc`",
    "không đọc thì không phân biệt được 'xem' với 'tải'")
  // `iframe`/`phat`/`anh` vẫn inline khi KHÔNG có cờ — và attachment khi có.
  ok(/\bgoc\b[^]{0,160}attachment/.test(p) || /attachment[^]{0,160}\bgoc\b/.test(p),
    "1a · và cờ ấy ép `attachment`",
    "PDF có `xem_truoc: iframe` nên mặc định là `inline`; bấm 'Bản gốc' mà mở "
    + "tab là đúng triệu chứng chủ dự án báo")
  ok(/xem_truoc/.test(p),
    "2 · KHÔNG bỏ nhánh `xem_truoc` — không cờ thì hành vi y như cũ",
    "ép `attachment` mọi lúc ⇒ `<video>` không phát, thẻ 2 tầng câm; đó là bug "
    + "`WO-064` đã sửa một lần")
}

// ── 1b · CHUYỂN HƯỚNG phải CÕNG THEO ý định ──────────────────────────────
console.log("\n1b · 302 sang cửa hiện vật phải mang theo `?dang=goc`\n")
{
  const X = doc("../api/xuat-cua.mjs")
  const i = X.indexOf('location: "/api/articles/media/"')
  const d = i > 0 ? X.slice(i, i + 160) : ""
  ok(i > 0, "1b · tìm thấy chỗ chuyển hướng")
  ok(/dang=goc/.test(d),
    "1b2 · và nó CÕNG THEO `?dang=goc`",
    "đây là mắt xích bị đứt: nhánh `goc` của `/api/xuat/` chuyển hướng sang cửa "
    + "hiện vật mà BỎ RƠI ý định, nên cửa kia lại thấy PDF là `iframe` ⇒ `inline`. "
    + "Sửa mỗi cửa kia là sửa nửa đường")
}

// ── 3 · `filename*` mang tên thật ────────────────────────────────────────
console.log("\n3 · Tên thật đi qua `filename*`, phần trăm-mã hoá\n")
if (f) {
  const r = f("Báo cáo quý 3.pdf", SHA, ".pdf")
  ok(/filename\*=UTF-8''/.test(r), "3 · có `filename*=UTF-8''…`",
    `được: ${r.slice(0, 110)}`)
  ok(/B%C3%A1o/.test(r), "3a · và tên tiếng Việt được phần trăm-mã hoá",
    `được: ${r.slice(0, 110)} — dán thô thì đầu đề mang byte non-ASCII`)
  /*
   * ĐUÔI phải lấy từ BẢNG KHAI, không từ tên người gửi. Đo được: một PPTX nạp
   * dưới tên `goc.bin` — tin đuôi của client thì file lưu ra `.bin` và mở bằng
   * nhầm ứng dụng. `nosniff` tồn tại đúng vì lời khai của client có thể sai,
   * và đuôi cũng là một lời khai. Cổng `media-dau-de` bắt đúng chỗ này khi bản
   * đầu của tôi dán cả `ten_goc`.
   */
  const r2 = f("goc.bin", SHA, ".pptx")
  ok(/filename="goc\.pptx"/.test(r2) && !/\.bin/.test(r2),
    "3b · đuôi lấy từ BẢNG KHAI, không từ tên người gửi",
    `được: ${r2}`)
}

// ── 4 · ÂM · `ten_goc` độc hại KHÔNG tách được đầu đề ────────────────────
console.log("\n4 · ÂM · tên gửi lên có `\"` `\\` CR LF\n")
if (f) {
  const doc2 = f('x";\r\nSet-Cookie: a=b\\.pdf', SHA, ".pdf")
  ok(!/[\r\n]/.test(doc2), "4 · đầu đề đi ra KHÔNG có CR/LF",
    `được: ${JSON.stringify(doc2)} — một newline ở đây là tách đầu đề`)
  const ascii = /filename="([^"]*)"/.exec(doc2)?.[1] ?? ""
  ok(!/["\\]/.test(ascii), `4a · phần \`filename="…"\` không có \` " \` hay \` \\ \``,
    `được ${JSON.stringify(ascii)}`)
  /*
   * Ve nay ban dau cam chuoi con `Set-Cookie`. SAI: chu ay nam trong dau nhay
   * thi vo hai, va cam no la cam mot ten file hop le. Bat bien THAT la ve 4
   * (khong CR/LF) + ve 4a (khong nhay/backslash) — hai cai do lam viec tach
   * dau de bat kha thi. Ve nay giu phan CON LAI: phan `filename*` phai duoc
   * phan tram-ma hoa HET, khong con mot ky tu tho nao lot ra.
   */
  const sao = /filename\*=UTF-8''(.*)$/.exec(doc2)?.[1] ?? ""
  ok(sao !== "" && !/["\\;\r\n]/.test(sao),
    "4b · phần `filename*` phần trăm-mã hoá HẾT, không sót ký tự thô",
    `được ${JSON.stringify(sao)}`)
}

// ── 5 · Tên rỗng / toàn ký tự lạ ⇒ lùi về sha ────────────────────────────
console.log("\n5 · Không có tên dùng được thì lùi về `<sha12><duoi>`\n")
if (f) {
  for (const [ten, nhan] of [["", "rỗng"], ["   ", "toàn khoảng trắng"],
                             ["///", "toàn ký tự lạ"]]) {
    const r = f(ten, SHA, ".pdf")
    ok(r.includes(SHA.slice(0, 12) + ".pdf"),
      `5 · ${nhan} ⇒ lùi \`${SHA.slice(0, 12)}.pdf\``,
      `được: ${r.slice(0, 110)} — một \`filename=""\` là trình duyệt tự đặt tên`)
  }
}

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — tên thật qua `filename*`, đầu đề một dòng, xem trước không hỏng\n")
