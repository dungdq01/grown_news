/**
 * Thẻ/dòng việc phải NÓI RÕ nó là việc GÌ.
 *
 * Chủ dự án 2026-09-07: *"sao vẫn tồn tại 2 bản (2 thẻ)"* — rồi hỏi tiếp
 * *"cái bản ghi 'đã gắn vào bản ghi — xem tab Transcript' mục đích để làm
 * gì?"*.
 *
 * Đo: hai thẻ ấy là HAI LOẠI VIỆC KHÁC HẲN NHAU —
 *   `chung-cat-mot-nguon` → sinh một BẢN NHÁP, phải duyệt vào kho
 *   `sinh-transcript`     → sinh một file `.vtt`, gắn THẲNG vào bản ghi
 *
 * Nhưng thẻ chỉ hiện `slug` + tên model. Cùng nguồn thì hai dòng ấy giống hệt
 * nhau, nên người đọc thành *"hai bản của một thứ"* — và đi tìm cách xoá bớt
 * một cái đang làm đúng việc của nó.
 *
 * Đây không phải lỗi của người đọc. Một màn bày hai việc khác loại bằng cùng
 * một hình dạng là màn đang giấu chiều thông tin quan trọng nhất.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const cc = boCT(doc("../plugins/chungcat/src/chungcat.inline.ts"))
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))

console.log("\nthẻ việc nói rõ LOẠI\n")

// ── 1 · MỘT bảng chữ cho tên loại việc ───────────────────────────────
//
// Một bảng, hai màn đọc. Hai bản dịch cho một enum là hai chỗ để lệch — cùng
// bài học `NHAN_TT` của `T03-119`.
ok(/NHAN_LOAI|TEN_LOAI/.test(cc), "1 · có bảng chữ người cho `loai` việc")
for (const l of ["chung-cat-mot-nguon", "sinh-transcript", "tai-video"]) {
  ok(cc.includes(l), `1b · bảng có \`${l}\``)
}
ok(/\?\?|\|\|/.test((/NHAN_LOAI|TEN_LOAI/.exec(cc) ? cc.slice(cc.search(/NHAN_LOAI|TEN_LOAI/), cc.search(/NHAN_LOAI|TEN_LOAI/) + 700) : "")),
  "1c · loại LẠ vẫn hiện được (rơi về chính chuỗi enum)",
  "một loại việc mới ra đời không được làm thẻ trống chữ")

// ── 2 · thẻ ở màn /chung-cat/ hiện loại ──────────────────────────────
/*
 * WO-086 · Đo trên bản ĐÃ BUILD, không trên `.ts`.
 *
 * `boCT` gỡ chú thích bằng regex, nhưng nó không gỡ được chú thích lồng trong
 * chuỗi, và quan trọng hơn: cửa sổ 1800 ký tự tính trên nguồn thì một khối
 * giải thích dài đẩy `tenLoai(` ra ngoài — vế đỏ vì có người VIẾT CHÚ THÍCH,
 * không vì mã sai. Đo được đúng thế 2026-09-10 khi `SCR-26` đổi `ccThe` thành
 * bộ vẽ chặng: trong bản build `tenLoai(` nằm ở offset 729, thừa sức lọt.
 */
const ccJs = doc("../plugins/chungcat/src/chungcat.inline.js")
// Neo phải mang cả dấu `(`: `WO-086` đặt tên `ccTheoNgay`, và một neo lỏng
// `"function ccThe"` khớp NHẦM hàm ấy trước — cửa sổ 1800 ký tự rơi vào chỗ
// khác và vế đỏ dù `ccThe` vẫn in tên loại.
ok(/tenLoai\(/.test(ccJs.slice(ccJs.indexOf("function ccThe("), ccJs.indexOf("function ccThe(") + 1800)),
  "2 · `ccThe` in tên loại lên thẻ",
  "hai việc khác loại cùng nguồn trông y hệt nhau thì người đọc thành *hai "
  + "bản của một thứ*")

// ── 3 · dòng trong tab cũng vậy ──────────────────────────────────────
ok(/NHAN_LOAI|TEN_LOAI/.test(tab),
  "3 · dòng việc trong tab Chưng cất cũng nói loại",
  "cùng một sự thật ở hai màn thì phải hiện giống nhau")

// ── 4 · MÀU + DẤU, không chỉ chữ ─────────────────────────────────────
//
// Chủ dự án 2026-09-07: *"phải đổi màu sắc hoặc đánh dấu gì đó để tôi phân
// biệt chứ?"*. Đúng: chữ bắt người ĐỌC, màu cho người THẤY.
//
// MÀU LÀ KÊNH THỨ HAI, không phải kênh duy nhất — cùng luật `SCR-20` đã chốt
// cho trạng thái bài: ~8% đàn ông không phân biệt đỏ–xanh, và một hệ chỉ-màu
// nói với họ rằng hai thẻ giống nhau.
const tok = doc("../../05_uiux/tokens.css")
ok(/--vl-/.test(tok), "4 · có token màu RIÊNG cho LOẠI VIỆC")
{
  const moc = tok.search(/\[data-theme="dark"\]/)
  ok(moc > 0 && /--vl-/.test(tok.slice(0, moc)) && /--vl-/.test(tok.slice(moc)),
    "4b · khai ở CẢ hệ sáng lẫn hệ tối")
}
ok(!/--vl-[a-z]+ *: *var\(--c-(video|article|paper|repo)\)/.test(tok),
  "4c · KHÔNG mượn màu của LOẠI NGUỒN",
  "`--c-video` là màu của loại NGUỒN; mượn cho loại VIỆC là trộn hai chiều "
  + "phân loại vào một màu — đúng lỗi `SCR-20` đã cấm với `draft`")
ok(/DAU_LOAI|BIEU_LOAI/.test(cc),
  "4d · có DẤU (ký hiệu) đi kèm màu",
  "màu một mình là kênh duy nhất; người không phân biệt được màu thì mất sạch")
ok(/--vl-/.test(cc), "4e · màn `/chung-cat/` dùng token ấy")
ok(/--vl-/.test(tab), "4f · tab Chưng cất dùng token ấy")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · nhìn thẻ là biết nó là việc gì")
process.exit(loi ? 1 : 0)
