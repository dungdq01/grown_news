/**
 * T03-123 · nút Chưng cất chỉ MỞ SAU transcript, và mở CỬA SỔ riêng.
 *
 * Chủ dự án 2026-09-07: *"Sau khi có bản transcript rồi thì mới hiển thị
 * button chưng cất, bấm vào button đó thì bản transcript mới truyền vào làm
 * input… ⇒ nó sẽ ra 1 cửa sổ multi window khác. Và cửa sổ chưng cất này mới
 * hiển thị tiến trình và kết quả chưng cất."*
 *
 * VÌ SAO NÚT PHẢI NÓI THẬT: từ `FR-070`, chưng cất một video ĐÒI transcript.
 * Một nút bấm vào ra lỗi là một nút nói dối về việc nó làm được — và người
 * bấm mất một vòng để biết điều lẽ ra nhìn là thấy.
 *
 * THÊM, KHÔNG SỬA: nút «Sinh transcript» ở thanh tiêu đề và tab `Chưng cất`
 * trong cửa sổ đọc giữ nguyên (chủ dự án dặn *"chỉ làm thêm"*).
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const mw = boCT(doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts"))
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))

console.log("\nT03-123 · chưng cất sau transcript\n")

// ── 1 · nút biết bản ghi ĐÃ có transcript chưa ───────────────────────
ok(/coTranscript|hienVatVtt/.test(mw),
  "1 · màn tra được bản ghi đã có transcript chưa")
ok(/data-act="cc-rieng"|data-ccrieng/.test(mw),
  "1b · có nút Chưng cất RIÊNG, không mượn `data-act=\"chung-cat\"`",
  "`chung-cat` của video đang mở phiếu TRANSCRIPT (`T03-108`) — mượn nó là "
  + "sửa một đường đã chốt, mà chủ dự án dặn chỉ làm thêm")

// ── 2 · BA trạng thái, ba câu khác nhau ──────────────────────────────
//
// Gộp chúng là bỏ mất đúng thông tin người cần: *chưa có* thì phải sinh,
// *đang sinh* thì phải đợi, *có rồi* thì bấm được.
for (const [chu, y] of [
  ["cần transcript", "chưa có ⇒ nói phải sinh trước"],
  ["đang sinh", "đang chạy ⇒ nói phải đợi"],
]) {
  // Ca «đang sinh» sống ở CHUNK: hàm vá gọi mạng và chỉ dùng cho video, nên
  // để trong `gn.js` là bắt mọi trang tải nó — đo được: đẩy bundle lên
  // 102490/102400. Cổng đo cả hai file thay vì đoán nó ở đâu.
  ok(mw.includes(chu) || tab.includes(chu), `2 · có câu cho ca «${y}»`)
}
{
  // Neo vào hàm DỰNG NÚT, không vào chuỗi `data-act` đầu tiên: chuỗi ấy nay
  // xuất hiện trước ở `querySelector` của hàm VÁ, nơi không có `disabled`.
  const i = mw.indexOf("function nutChungCatRieng")
  const quanh = i > 0 ? mw.slice(i, i + 1200) : ""
  ok(/disabled|tx-mo|mo\b/.test(quanh),
    "2b · chưa đủ điều kiện ⇒ nút MỜ, không bấm được",
    "bấm được rồi ra lỗi là bắt người mất một vòng để biết điều nhìn là thấy")
}

// ── 3 · bấm ⇒ PHIẾU đầy đủ rồi mở CỬA SỔ RIÊNG ───────────────────────
//
// Ba vế 3c/3d/3e trước đây neo vào THÂN `moCuaSoChungCat`, vì lúc ấy hàm đó tự
// POST và tự dựng cửa sổ. Từ 2026-09-07 nó UỶ QUYỀN cho `moPhieuChungCat` —
// chủ dự án bắt được hai phiếu khác nhau cho một việc. Tính chất không đổi một
// chút nào; chỉ đổi NHÀ. Neo theo CHUỖI thật, đừng neo vào một thân hàm.
ok(/moCuaSoChungCat/.test(tab), "3 · có `moCuaSoChungCat`")
{
  const i = tab.indexOf("async function moCuaSoChungCat")
  const than = i > 0 ? tab.slice(i, i + 600) : ""
  ok(i > 0, "3b · tìm thấy thân hàm")
  ok(/moPhieuChungCat/.test(than),
    "3c · đường video đi qua CHÍNH phiếu đầy đủ",
    "phiếu ấy mới có phép chọn model ⇒ mới nói được KHU VỰC PHÁP LÝ (§4.0c)")
  const g = tab.indexOf("async function guiChungCat")
  const tg = g > 0 ? tab.slice(g, g + 1800) : ""
  ok(/api\/job/.test(tg), "3d · phiếu tạo việc qua `POST /api/job`")
  ok(/chi_dan/.test(tg),
    "3e · và mang theo `chi_dan` của người (`T12-25`)",
    "chỉ dẫn CỘNG THÊM vào nguyên liệu, không thay nguyên liệu")
  ok(/moCuaSoViec\(/.test(tg),
    "3f · xong thì mở CỬA SỔ RIÊNG cho việc, đặt cạnh cửa sổ nguồn")
}

// ── 4 · tiến trình + kết quả nằm TRONG cửa sổ ấy ─────────────────────
ok(/veTienDoChungCat|theoDoiChungCat/.test(tab),
  "4 · cửa sổ tự theo dõi tiến trình",
  "bắt người mở tab khác để xem việc mình vừa bấm là bắt họ đi tìm — cả điểm "
  + "của flow là ba cửa sổ CẠNH nhau")

// ── 5 · KHÔNG đụng đường đã chốt ─────────────────────────────────────
ok(/data-act="chung-cat"/.test(mw),
  "5 · nút «Sinh transcript» cũ VẪN CÒN",
  "chủ dự án dặn *chỉ làm thêm, không sửa các tính năng đã chốt*")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · chưng cất mở đúng lúc, ở cửa sổ của nó")
process.exit(loi ? 1 : 0)
