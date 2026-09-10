/**
 * Bản ghi trong BỘ NHỚ có thể lạc hậu — phải hỏi lại kho trước khi nói "chưa có".
 *
 * Chủ dự án báo 2026-09-07, hai triệu chứng:
 *   1. transcript sinh xong rồi mà nút Chưng cất vẫn là "⚗ cần transcript trước"
 *   2. tab Transcript vẫn trống
 *   + *"F5 (Ctrl+Shift+R) mới có"*
 *
 * MỘT GỐC. Đo được:
 *
 *   /api/articles/video/hermes-…   media: [{mime: "text/vtt", so_byte: 18814}]  ← CÓ
 *   /api/index                     media: [{mime: "text/vtt", …}]              ← CÓ
 *   `ban` trong bộ nhớ FE          media: null                                 ← LẠC HẬU
 *
 * `BAI` nạp từ `/api/index` MỘT LẦN lúc tải trang. Việc `sinh-transcript` xong
 * SAU đó và gắn `.vtt` vào bản ghi, nhưng không gì đọc lại — nên `ban.media`
 * đứng nguyên ở giá trị của quá khứ. Ctrl+Shift+R nạp lại `/api/index` ⇒ "F5
 * mới có". Câu ấy của chủ dự án chính là phép đo chỉ đúng vào gốc.
 *
 * Và `veNutChungCatRieng` không cứu được: nó tra HÀNG ĐỢI, thấy không việc nào
 * đang chạy thì `return` — nó có ca *đang sinh*, KHÔNG có ca *đã xong*.
 *
 * Bài học lặp lại lần thứ ba trong tuần (`moTheoSlug`, `_doc_nguon`, nay đây):
 * đọc hình dạng THẬT của dữ liệu, và hỏi *"thứ tôi đang cầm có còn đúng không"*.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))

console.log("\nhiện vật lạc hậu · hỏi lại kho trước khi nói «chưa có»\n")

// ── 1 · có một phép đọc lại, và nó GHI vào chính `ban` ────────────────
ok(/function lamMoiHienVat/.test(tab), "1 · có `lamMoiHienVat`")
{
  const i = tab.indexOf("function lamMoiHienVat")
  const het = i > 0 ? tab.indexOf("\n}", i) : -1
  const than = i > 0 ? tab.slice(i, het > 0 ? het : i + 900) : ""
  ok(/\/api\/articles\//.test(than),
    "1b · hỏi cửa BẢN GHI, không hỏi hàng đợi",
    "hàng đợi nói *việc* đang ở đâu; câu hỏi ở đây là *bản ghi* có hiện vật chưa")
  ok(/ban\.media\s*=/.test(than),
    "1c · GHI kết quả vào chính `ban`",
    "không ghi lại thì mỗi bề mặt tự hỏi một lần, và hai bề mặt trả lời khác nhau")
  ok(/if\s*\(\s*hienVatVtt\(ban\)\s*\)\s*return/.test(than.replace(/\s+/g, " "))
    || /hienVatVtt\(ban\)[^]{0,40}return/.test(than),
    "1d · ĐÃ có vtt ⇒ về ngay, KHÔNG gọi mạng",
    "một lời gọi mạng cho câu trả lời mình đã cầm là phí, và nó chạy mỗi lần mở tab")
}

// ── 2 · tab Transcript hỏi lại TRƯỚC khi kết luận "chưa có" ───────────
{
  const i = tab.indexOf("async function veTranscript")
  const het = i > 0 ? tab.indexOf("\n}", i) : -1
  const than = i > 0 ? tab.slice(i, het > 0 ? het : i + 1200) : ""
  ok(i > 0, "2 · tìm thấy `veTranscript`")
  const iLamMoi = than.indexOf("lamMoiHienVat")
  const iChuaCo = than.indexOf("Chưa có transcript")
  ok(iLamMoi > 0 && iChuaCo > 0 && iLamMoi < iChuaCo,
    "2b · `lamMoiHienVat` chạy TRƯỚC câu «Chưa có transcript»",
    "kết luận trước khi hỏi thì câu trả lời là của quá khứ")
}

// ── 3 · nút Chưng cất có ca ĐÃ XONG, không chỉ ca đang chạy ───────────
{
  const i = tab.indexOf("async function veNutChungCatRieng")
  const het = i > 0 ? tab.indexOf("\n}\n", i) : -1
  const than = i > 0 ? tab.slice(i, het > 0 ? het : i + 1600) : ""
  ok(i > 0, "3 · tìm thấy `veNutChungCatRieng`")
  ok(/lamMoiHienVat/.test(than),
    "3b · nút cũng hỏi lại kho, không chỉ tra hàng đợi",
    "`if (!chay) return` bỏ trọn ca *việc đã xong* — nút không bao giờ tự sáng")
  ok(/disabled\s*=\s*false|removeAttribute\(["']disabled/.test(than),
    "3c · có vtt ⇒ MỞ KHOÁ nút",
    "một nút disabled vĩnh viễn cho một việc làm được là nút nói dối")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · hai bề mặt cùng hỏi kho, và cùng nhận một câu trả lời")
