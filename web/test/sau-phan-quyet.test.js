/**
 * T03-119 · Sau một phán quyết: màn phải NÓI ĐỦ và ĐỔI NGAY.
 *
 * Chủ dự án báo: *"Loại/Bỏ xong phải F5, toast mù"*.
 *
 * Hai khuyết tật, hai tầng:
 *   toast nói TIẾNG MÁY  — "Đã ghi rejected vào kho": không chủ ngữ, và
 *                          `rejected` là giá trị enum, không phải tiếng Việt
 *   thẻ ngoài lưới ĐỨNG YÊN — cửa sổ đổi rồi mà lưới sau lưng vẫn trạng thái cũ
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const mw = readFileSync(new URL(
  "../plugins/multiwindow/src/scripts/multiwindow.inline.ts", import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const ma = boCT(mw)

console.log("\nT03-119 · sau phán quyết\n")

// ── 1 · toast nói TIẾNG NGƯỜI, đủ chủ–vị ──────────────────────────────
ok(!/Đã ghi \$\{den\} vào kho/.test(ma),
  "1 · KHÔNG đổ thẳng giá trị enum vào câu cho người",
  "`rejected` là giá trị máy; người đọc cần biết BÀI NÀO vừa bị làm SAO")
ok(/nhanTrangThai|NHAN_TT/.test(ma),
  "1b · có bảng chữ NGƯỜI cho từng trạng thái",
  "một bảng, mọi chỗ đọc — hai bản dịch cho một enum là hai chỗ để lệch")
ok(/function toastPhanQuyet|toastPQ/.test(ma),
  "1c · có MỘT chỗ dựng câu toast sau phán quyết")

// ── 2 · thẻ ngoài lưới đổi TẠI CHỖ ────────────────────────────────────
//
// Cửa sổ đổi rồi mà lưới sau lưng còn trạng thái cũ thì người phải F5 mới tin
// — và F5 là cách màn nói *"tôi không chắc mình vừa làm gì"*.
ok(/capNhatThe/.test(ma), "2 · có `capNhatThe` — sửa thẻ tại chỗ")
ok(/st-\$\{|"st-" \+|st-' \+/.test(ma) || /classList/.test(ma),
  "2b · đổi lớp trạng thái của thẻ")

// ── 3 · BỎ thì thẻ RỜI lưới + đường khôi phục trong toast ─────────────
const iX = ma.indexOf("async function xoaTuCua")
const thanX = iX > 0 ? ma.slice(iX, iX + 1400) : ""
ok(/capNhatThe|remove\(\)/.test(thanX),
  "3 · Bỏ ⇒ thẻ rời lưới ngay, không đợi F5")
ok(/khôi phục|Kho/.test(thanX),
  "3b · toast chỉ ĐƯỜNG KHÔI PHỤC",
  "một thao tác xoá được mà không nói cách lấy lại là một thao tác đáng sợ")

// ── 4 · nhãn NGỮ CẢNH ở chân cửa sổ ───────────────────────────────────
for (const n of ["KHO — chưa lên site", "ĐANG TRÊN SITE"]) {
  ok(ma.includes(n), `4 · có nhãn "${n}"`,
    "người mở một bài cần biết NÓ ĐANG Ở ĐÂU trước khi quyết")
}

// ── 5 · cửa sổ NHÁP: cùng một luật, khác bộ nút ───────────────────────
const cc = boCT(readFileSync(new URL(
  "../plugins/cctab/src/cctab.inline.ts", import.meta.url), "utf8"))

ok(/bt-chinh/.test(cc) && /bt-nguy/.test(cc),
  "5 · nháp cũng ba cụm CHÍNH · THƯỜNG · NGUY",
  "hai màn cùng làm một việc mà xếp nút khác nhau thì người phải học hai lần")
ok(cc.includes("BẢN NHÁP"), "5b · nhãn ngữ cảnh 'BẢN NHÁP'")

// Checkbox "lên site luôn": MẶC ĐỊNH TẮT.
//
// Máy vẫn không tự `approve` — nó chỉ làm hộ CÚ BẤM THỨ HAI của người vừa
// đánh dấu. Mặc định bật là máy quyết thay, và `M12-R2` cấm đúng chỗ đó.
ok(/data-nhlen/.test(cc), "5c · có ô 'Đưa lên site luôn sau duyệt'")
const iCb = cc.indexOf("data-nhlen")
ok(iCb > 0 && !/checked/.test(cc.slice(Math.max(0, iCb - 220), iCb + 220)),
  "5d · ô ấy MẶC ĐỊNH TẮT", "người quyết đưa lên site, không phải máy")

ok(!/bao\(false, hanh === "duyet" \? "Đã duyệt vào kho\." /.test(cc),
  "5e · toast nháp cũng có chủ ngữ")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · màn nói đủ và đổi ngay")
process.exit(loi ? 1 : 0)
