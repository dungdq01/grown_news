/**
 * WO-060 · Sau khi ghi video: đi đâu, nói gì — và tab mang tên gì.
 *
 * Ba chỗ chủ dự án bắt 2026-09-06, cùng một gốc: **màn nói bằng tiếng của MÁY,
 * không phải tiếng của người**.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-060 · sau khi ghi video\n")

const nv = doc("../plugins/napvideo/src/napvideo.inline.ts")
const mw = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")

// ── 1 · Nhãn tab là TIÊU ĐỀ, không phải `id` máy sinh ───────────────────
//
// Ảnh chủ dự án: hai tab đọc `src_thunghiemg` · `src_caidatvath`. Đó là
// `frontmatter.id` — một chuỗi máy dựng từ slug, cắt 10 ký tự. Người mở hai
// cửa sổ cạnh nhau không phân biệt được cái nào là cái nào.
ok(!/data-tab="' \+ i \+ '"[^]{0,120}\+ b\.id \+/.test(mw),
  "1 · nhãn tab KHÔNG dùng `b.id`",
  "`src_thunghiemg` là mã máy, không phải tên người đọc được")
ok(/nhanTab\s*\(/.test(mw), "1 · có hàm dựng nhãn tab riêng",
  "cắt tiêu đề dài phải là một phép có tên, không phải một biểu thức nhét giữa dòng")

// ── 2 · Ghi xong thì ĐI, và nói rõ đã ghi gì ───────────────────────────
//
// Bản trước dừng tại chỗ với câu `Đã ghi video/abc.md vào kho.` — một ĐƯỜNG
// DẪN FILE. Người vừa đăng ký một video không quan tâm file nằm đâu; họ muốn
// biết bản ghi đã vào kho và muốn nhìn thấy nó.
ok(!/Đã ghi \$\{d\.path\} vào kho/.test(nv),
  "2 · không còn báo bằng ĐƯỜNG DẪN FILE",
  "`video/abc.md` là chi tiết lưu trữ, không phải câu trả lời cho người bấm")
ok(/doiView\s*\(|location\.(href|assign)|data-nav="video"/.test(nv),
  "2 · ghi xong thì CHUYỂN MÀN, không đứng lại ở form rỗng",
  "form trống sau khi bấm là màn không nói được việc đã xong hay chưa")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · màn nói tiếng người")
process.exit(loi ? 1 : 0)
