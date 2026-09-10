/**
 * SCR-24 · Ba nút ở header cửa sổ — nhãn NGẮN, và màu nói trạng thái.
 *
 * Chủ dự án 2026-09-08: *"nút cần gọn gàng có màu sắc. Nếu video/bài viết đã
 * chưng cất/transcript rồi thì để màu chữ vàng, nếu chưa click active lần nào
 * thì màu hồng"* · chốt lối B: *"B đi, nhưng gọn gàng dễ dùng nha"*.
 *
 * ── MÀU là chiều HÀNH ĐỘNG, không phải chiều trạng thái bản ghi ─────────
 *
 *   hồng `--brand`  chưa làm lần nào  →  "đây là việc nên bấm"
 *   vàng `--warn`   ĐÃ có rồi         →  "bấm nữa là tiêu token lần nữa"
 *   mờ   `--ink-3`  chưa đủ điều kiện →  disabled, không mời bấm
 *
 * Hai token ấy KHÔNG phải mượn màu: *"đã chưng cất rồi"* **là** một cảnh báo
 * thật (một lần gửi nữa = một lần tiêu token nữa), và `--brand` cho *"chưa
 * làm"* đúng vai call-to-action. `SCR-20` khoá chiều TRẠNG THÁI BẢN GHI (draft
 * xanh dương · rejected đỏ) — hai chiều rời nhau, hai bảng màu rời nhau.
 *
 * Vế đắt nhất là §3: trạng thái thứ ba giữ MỜ. Sơn hồng một nút CHƯA BẤM ĐƯỢC
 * là mời một cú bấm dẫn tới 409 — đúng thứ `T03-123` sinh ra để chặn.
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
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const mw = boCT(doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts"))
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const css = doc("../styles/prototype.css").replace(/\/\*[^]*?\*\//g, "")
const than = (src, ten, n = 1400) => {
  const i = src.indexOf(ten)
  if (i < 0) return ""
  const h = src.indexOf("\n}\n", i)
  return src.slice(i, h > 0 ? h : i + n)
}

console.log("\nSCR-24 · nút header gọn + màu theo trạng thái\n")

// ── 1 · NHÃN NGẮN (lối B) ─────────────────────────────────────────────
{
  ok(/♫ Transcript/.test(mw), "1 · nhãn `♫ Transcript`")
  ok(/⚗ Chưng cất/.test(mw), "1b · nhãn `⚗ Chưng cất`")
  ok(/⚗ cần transcript"/.test(mw) || /⚗ cần transcript</.test(mw),
    "1c · nhãn `⚗ cần transcript` (bỏ chữ `trước`)")
  // Thu ve BANG KHAI: dong 2259 co chuoi `"chưa sinh — Sinh transcript"` nhung
  // do la mot CAU VAN XUOI giai thich, khong phai nhan nut. Quet ca file thi
  // mot loi giai thich TOT lam cong do.
  ok(!/nhan:\s*"Sinh transcript"/.test(mw),
    "1d · bảng khai KHÔNG còn nhãn dài `Sinh transcript`",
    "36 ký tự trong hàng tiêu đề bóp `.tt` (flex:1 + ellipsis) ⇒ người đọc "
    + "mất thứ nói đang xem bản ghi nào")
  // Chống đỏ oan: câu DÀI phải còn ở `title=`, không được mất theo nhãn.
  ok(/title="[^"]*transcript/i.test(mw),
    "1e · câu dài giữ ở `title=`",
    "icon gánh nghĩa thay chữ, nhưng người mới vẫn cần một câu đầy đủ khi hover")
}

// ── 2 · MÀU: hai class, hai token đã có, KHÔNG đẻ màu mới ─────────────
{
  ok(/nut-chua/.test(mw) || /nut-chua/.test(css), "2 · có class cho ca *chưa làm*")
  ok(/nut-roi/.test(mw) || /nut-roi/.test(css), "2b · có class cho ca *đã có*")
  const a = css.match(/\.nut-chua[^{]*\{[^}]*\}/)
  const b = css.match(/\.nut-roi[^{]*\{[^}]*\}/)
  ok(!!a && /var\(--brand\)/.test(a[0]),
    "2c · *chưa làm* dùng `--brand` (hồng)",
    "đẻ một mã màu mới là dựng bản thứ hai của một bảng màu đã có")
  ok(!!b && /var\(--warn\)/.test(b[0]),
    "2d · *đã có* dùng `--warn` (vàng)",
    "*đã chưng cất rồi* LÀ một cảnh báo: bấm nữa là tiêu token nữa")
  ok(!(a && /#[0-9a-f]{3,6}/i.test(a[0])) && !(b && /#[0-9a-f]{3,6}/i.test(b[0])),
    "2e · KHÔNG mã màu gõ tay trong hai luật ấy")
}

// ── 3 · disabled giữ MỜ, KHÔNG hồng ──────────────────────────────────
{
  const t = than(mw, "function nutChungCatRieng")
  ok(t.length > 0, "3 · tìm thấy `nutChungCatRieng`")
  // Cat dung CAU RETURN cua nhanh disabled. Cua so "lui 260 ky tu" bat trung
  // nhanh BAT DUOC ngay tren no, nen no do oan mot dong dung.
  const iDis = t.indexOf("disabled")
  const iRet = iDis > 0 ? t.lastIndexOf("return", iDis) : -1
  const doan = iRet > 0 ? t.slice(iRet, iDis + 120) : ""
  ok(iDis > 0 && iRet > 0 && !/nut-chua/.test(doan),
    "3b · nhánh `disabled` KHÔNG mang class hồng",
    "hồng nghĩa *bấm được, chưa làm*; nút này CHƯA bấm được, sơn hồng là mời "
    + "một cú bấm dẫn tới 409 — đúng thứ `T03-123` sinh ra để chặn")
}

// ── 4 · tín hiệu ĐÃ CÓ: hai nút, hai nguồn ───────────────────────────
{
  const t = than(mw, "function cumNutChungCat")
  ok(/coTranscript\(ban\)/.test(t),
    "4 · nút transcript quyết màu bằng `coTranscript(ban)` NGAY lúc render",
    "hiện vật `.vtt` đã nằm trên `media[]` — không có lý do chờ mạng cho nó")
  const v = than(mw, "async function veNutBanChungCat", 1200)
  ok(/nut-roi/.test(v),
    "4b · nút chưng cất được sơn vàng SAU khi `/api/index` trả lời",
    "một bản ghi chưng cất được NHIỀU lần nên không suy từ slug; chặn header "
    + "chờ mạng thì tiêu đề trống nửa giây, tệ hơn một nút đổi màu nửa giây sau")
  ok(/ds\.length/.test(v), "4c · và chỉ sơn khi thật sự CÓ bản")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · nhãn gọn, màu dùng token có sẵn, disabled không mời bấm")
