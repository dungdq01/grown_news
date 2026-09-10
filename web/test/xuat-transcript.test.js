/**
 * WO · Cửa xuất `transcript/<slug>` — bảng khai HỨA, mã KHÔNG GIAO.
 *
 * Chủ dự án báo 2026-09-06 (ảnh chụp): bấm *Phụ đề* ⇒ trình duyệt lưu về một
 * file `.json` mang tên bản ghi, nội dung là
 * `{"loi":"không có transcript/<slug>"}` — tức cửa trả 404 và trình duyệt
 * ngoan ngoãn lưu THÂN LỖI thành file.
 *
 * Gốc: `xuat-dang.json` khai `theo_loai.transcript = [srt,txt,docx,goc]` từ
 * `T08-33`, nhưng `cuaXuat` chỉ biết tra `khoDoc([loai])` — mà **transcript
 * không phải một BẢN GHI**. Nó là hiện vật `text/vtt` gắn trên bản ghi video.
 * Bảng khai hứa một dạng mà mã chưa bao giờ cài.
 *
 * Vì sao tới hôm nay mới lộ: `T03-121` là thứ ĐẦU TIÊN dựng đường dẫn tới nó.
 * Trước đó không ai bấm, nên không ai thấy.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const cua = doc("../api/xuat-cua.mjs")
const bang = JSON.parse(doc("../../core/assets/xuat-dang.json"))

console.log("\nWO · cửa xuất transcript\n")

// ── 1 · bảng khai và mã phải NÓI CÙNG MỘT THỨ ─────────────────────────
//
// Một dạng có trong bảng mà mã không cài là một cái nút dẫn tới 404 — và
// trình duyệt lưu thân lỗi thành file, nên người còn tưởng mình đã tải được.
ok((bang.theo_loai?.transcript ?? []).length > 0,
  "1 · bảng khai có `theo_loai.transcript`")
ok(/loai === "transcript"|=== *"transcript"/.test(cua),
  "1b · `xuat-cua.mjs` CÓ nhánh xử lý `transcript`",
  "bảng khai hứa mà mã không giao ⇒ 404, và trình duyệt lưu thân lỗi "
  + "thành một file `.json` mang tên bản ghi")

// ── 2 · transcript là HIỆN VẬT, không phải bản ghi ────────────────────
ok(/docHienVat/.test(cua),
  "2 · đọc byte hiện vật qua `docHienVat`",
  "`khoDoc([loai])` tra BẢN GHI; transcript không có bản ghi nào để tra")
ok(/text\/vtt/.test(cua), "2b · tìm hiện vật theo mime `text/vtt`")

// ── 3 · ba dạng dẫn xuất + bản gốc `.vtt` ────────────────────────────
ok(/vttSangSrt/.test(cua), "3 · `srt` dựng từ `vttSangSrt`")
ok(/vttSangTxt/.test(cua), "3b · `txt` dựng từ `vttSangTxt`")
{
  // Neo vào THÂN HÀM. Bám chuỗi `"transcript"` thì nó dính vào chú thích
  // đứng trước, và cửa sổ cắt trượt khỏi khúc cần soi.
  const i = cua.indexOf("function xuatTranscript")
  const than = i > 0 ? cua.slice(i, i + 3000) : ""
  ok(/docx\(/.test(than), "3c · `docx` dựng từ chữ của transcript")
  ok(/\.vtt/.test(than),
    "3d · `goc` trả NGUYÊN file `.vtt`, không đổi đuôi",
    "`goc` nghĩa là đúng byte đã có — đổi nó thành `.srt` là trả một thứ khác")
}

// ── 4 · bản ghi KHÔNG có transcript ⇒ câu nói rõ, không 404 trần ──────
//
// 404 trần làm trình duyệt lưu thân lỗi thành file. Người mở file ra thấy
// JSON và tưởng transcript của mình hỏng.
{
  // Neo vào THÂN HÀM. Bám chuỗi `"transcript"` thì nó dính vào chú thích
  // đứng trước, và cửa sổ cắt trượt khỏi khúc cần soi.
  const i = cua.indexOf("function xuatTranscript")
  const than = i > 0 ? cua.slice(i, i + 3000) : ""
  ok(/chưa sinh|chưa có transcript|Sinh transcript/.test(than),
    "4 · chưa có transcript ⇒ câu CHỈ ĐƯỜNG (nhắc sinh), không 404 trần")
}

// ── 5 · `goc` KHÔNG được trả một sản phẩm MÁY DẪN XUẤT ────────────────
//
// Bug đo được 2026-09-06: `/api/xuat/video/<slug>?dang=goc` trả file `.vtt`
// 20 KB (transcript do ASR sinh) dán nhãn *bản gốc của video*. Với một video
// đăng ký bằng URL, `media[0]` là transcript — phần tử duy nhất có mặt.
ok(/chi_dan_xuat/.test(cua),
  "5 · cửa BỎ hiện vật `chi_dan_xuat` khi chọn bản gốc",
  "đưa một sản phẩm máy sinh và gọi nó là bản gốc đúng là *nói dối bằng một "
  + "cái nút* mà chính `xuat-dang.json` cấm")
ok(!/mangMedia\[0\]\?\.sha256/.test(cua),
  "5b · KHÔNG lấy `media[0]` bừa")
ok(/media-mime\.json/.test(cua),
  "5c · danh sách mime dẫn xuất đọc từ BẢNG KHAI, không gõ cứng")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · bảng khai và mã nói cùng một thứ")
process.exit(loi ? 1 : 0)
