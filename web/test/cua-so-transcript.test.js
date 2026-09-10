/**
 * T03-122 · CỬA SỔ TRANSCRIPT riêng.
 *
 * Chủ dự án 2026-09-07: *"Transcript → sinh text realtime và sau khi xong thì
 * cửa sổ multi window hiển thị bản sinh transcript luôn (đó là cửa sổ riêng
 * của transcript)"*, và *"thẻ Transcript ở /chung-cat/ hiện tại nó không xem
 * detail được như chưng cất"*.
 *
 * VÌ SAO CẦN CỬA SỔ RIÊNG DÙ ĐÃ CÓ TAB: tab nằm TRONG cửa sổ bản ghi, nên xem
 * transcript là MẤT CHỖ ĐANG ĐỌC. Cả điểm của flow là *vừa xem video, vừa đọc
 * transcript, vừa duyệt bản chưng cất* — ba thứ CẠNH nhau.
 *
 * THÊM, KHÔNG SỬA: ba tab `Xem · Chưng cất · Transcript` giữ nguyên (chủ dự
 * án dặn *"chỉ làm thêm, không sửa các tính năng đã chốt"*).
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const cc = boCT(doc("../plugins/chungcat/src/chungcat.inline.ts"))
const mw = boCT(doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts"))

console.log("\nT03-122 · cửa sổ transcript riêng\n")

// ── 1 · có cửa sổ riêng, KHÔNG chạy `tai()` ──────────────────────────
ok(/moCuaSoTranscript/.test(tab), "1 · có `moCuaSoTranscript`")
{
  const i = tab.indexOf("async function moCuaSoTranscript")
  const than = i > 0 ? tab.slice(i, i + 2200) : ""
  ok(i > 0, "1b · tìm thấy thân hàm")
  ok(/kieu:\s*"transcript"|kieu: "nhap"/.test(than),
    "1c · mở bằng `kieu` riêng — KHÔNG dùng cửa sổ bài-kho generic",
    "cửa sổ generic chạy `tai()` ⇒ `GET /api/articles/<slug>` ⇒ 404 và bốn nút "
    + "chết, đúng bug `T03-113` đã trúng một lần")
  ok(/media\/|sha256/.test(than),
    "1d · đọc byte transcript qua cửa hiện vật (`sha256`)")
}

// ── 2 · CHƯA có transcript ⇒ nói rõ, KHÔNG mở cửa sổ trống ───────────
{
  const i = tab.indexOf("async function moCuaSoTranscript")
  const than = i > 0 ? tab.slice(i, i + 2200) : ""
  ok(/chưa có transcript|Chưa có transcript/i.test(than),
    "2 · chưa sinh ⇒ câu nói rõ",
    "mở một cửa sổ trống là bắt người tự đoán vì sao nó trống")
}

// ── 3 · MỘT đường, hai màn cùng gọi ─────────────────────────────────
//
// Thẻ ở `/chung-cat/` và dòng trong tab phải mở CÙNG một cửa sổ. Hai đường là
// hai chỗ để lệch — bài học `veNutBanChungCat` bóc sai phong bì đã trả giá.
ok(/moCuaSoTranscript/.test(cc),
  "3 · thẻ ở màn `/chung-cat/` gọi CÙNG hàm ấy",
  "trước đợt này thẻ transcript không mở được gì — chủ dự án bắt đúng")
ok(/data-cctr|ccTranscript/.test(cc),
  "3b · thẻ transcript có móc bấm riêng")

// ── 4 · việc XONG ⇒ tự mở, đặt CẠNH cửa sổ nguồn ────────────────────
ok(/moCuaSoTranscript\([^)]*canh|canh:/.test(tab),
  "4 · mở kèm `canh` — đặt cạnh cửa sổ nguồn, không đè lên nhau")

// ── 5 · KHÔNG đụng ba tab đã chốt ───────────────────────────────────
ok(/TAB_TR/.test(mw),
  "5 · tab `Transcript` trong cửa sổ đọc VẪN CÒN",
  "chủ dự án dặn *chỉ làm thêm, không sửa các tính năng đã chốt*")

/*
 * ── 6 · WO-081/AC2 · transcript XONG ⇒ MỘT dòng xanh, rồi CUE ─────────
 *
 * Chủ dự án: *"transcript đã xong là hiển thị kết quả transcript luôn … thông
 * báo lại cái hiệu ứng xanh lá cây đơn giản thôi"*. Bản trước panel dành cả
 * khoảng cho một đoạn văn giải thích *"transcript là hiện vật, không vào hàng
 * nháp"* rồi bảo người sang cửa sổ khác mà xem.
 *
 * `check_g6b` bắt đúng chỗ này: `T03-135` khai AC2 là `hard` mà KHÔNG có
 * `cmd` — tức không cổng nào đo. Một AC không ai đo thì nó là lời hứa, và
 * `R3` hạ cả task xuống `soft`. Vế dưới đây là cái `cmd` còn thiếu.
 */
{
  const i = tab.indexOf('class="vc-ok"')
  ok(i > 0, "6 · panel xong có MỘT dòng `.vc-ok`",
    "không có nó thì thông báo lại là một khối văn, đúng thứ đã bị bỏ")
  // "Một dòng" đo được: cả thẻ `<p class="vc-ok">…</p>` phải ngắn.
  const p = i > 0 ? tab.slice(i, tab.indexOf("</p>", i) + 4) : ""
  ok(p.length > 0 && p.length < 160,
    `6a · và nó NGẮN — một dòng, không một đoạn (${p.length} ký tự)`,
    "trần 160 là chỗ một câu vừa hết; dài hơn là đoạn văn quay lại")
  ok(/vc-tr/.test(tab),
    "6b · ngay dưới nó là KHE CUE, không phải lời mời sang cửa sổ khác",
    "chủ dự án muốn xem transcript TẠI ĐÓ")
  const css = doc("../styles/prototype.css")
  ok(/\.vc-ok\s*[,{]/.test(css), "6c · `.vc-ok` có luật CSS thật",
    "một class không luật thì 'xanh lá' chỉ có trong task file")
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · transcript có cửa sổ của nó")
process.exit(loi ? 1 : 0)
