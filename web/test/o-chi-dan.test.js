/**
 * T03-116 bước 2 · ô CHỈ DẪN THÊM trong popup chưng cất.
 *
 * Wireframe `SCR-18` đã được chủ dự án duyệt 2026-09-06 (`AC0`, mốc ở
 * `WL-01M1SH3B8W5R2Y7K4NPQVDXC6T`). Cổng này canh đúng những gì bản vẽ hứa.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const cc = doc("../plugins/cctab/src/cctab.inline.ts")

console.log("\nT03-116 · ô chỉ dẫn trong popup chưng cất\n")

// ── AC1 · GẤP mặc định ─────────────────────────────────────────────────
//
// Ô mở sẵn biến một hộp thoại XÁC NHẬN thành một cái FORM. Người bấm "Chưng
// cất" đã quyết rồi; bắt 100% người đi qua một ô trống nữa để phục vụ số ít
// có yêu cầu riêng là đổi sai chiều.
ok(/<details\b/.test(cc) || /data-cd-gap/.test(cc),
  "AC1 · ô chỉ dẫn GẤP mặc định (không mở sẵn)",
  "mở sẵn thì popup thành form, và wireframe hứa 'dài hơn hôm nay đúng một dòng'")
// Nhãn đổi từ *"Chỉ dẫn thêm (tuỳ chọn)"* sang *"③ Góc nhìn riêng (tuỳ
// chọn)"* — `SCR-23` (chủ dự án duyệt 2026-09-07) dựng phiếu thành BA KHỐI có
// đánh số, và khối ③ chính là ô này. `SCR-23` THAY thế `T03-116` ở vế chữ nghĩa.
//
// Vế đáng giữ KHÔNG phải bốn chữ cụ thể — nó là *"nhãn nói đây là TUỲ CHỌN"*.
// Một cổng khoá đúng bốn chữ thì mỗi lần đổi chữ là một lần cổng đỏ oan, và nó
// dạy người ta sửa cổng cho hết đỏ thay vì đọc xem cổng đang canh gì.
ok(/tuỳ chọn/i.test(cc),
  "AC1 · nhãn nói rõ ô này là TUỲ CHỌN (SCR-23 · khối ③)",
  "không nói tuỳ chọn thì người tưởng phải gõ mới bấm được")

// ── AC1b · CHIPS dẫn xuất từ API, CẤM gõ cứng ─────────────────────────
ok(/chi_dan_mau/.test(cc), "AC1b · chips đọc `chi_dan_mau` từ API")
for (const t of ["Tóm cho dev", "Tập trung rủi ro", "So sánh thực tiễn VN"]) {
  ok(!cc.includes(t), `AC1b · KHÔNG gõ cứng preset "${t}"`,
    "gõ cứng thì thêm một dòng bảng khai KHÔNG mọc thêm chip — hỏng cả AC4 của T12-25")
}

// ── AC2 · đếm NGƯỢC theo trần của API ─────────────────────────────────
ok(/tran_chi_dan_ky_tu/.test(cc), "AC2 · trần lấy từ API, không gõ trong FE")
ok(/còn |vượt /.test(cc), "AC2 · đếm NGƯỢC ('còn N'), không đếm xuôi",
  "người đang gõ hỏi 'tôi còn bao nhiêu chỗ', không hỏi 'tôi đã gõ bao nhiêu'")

// ── AC3 · KHÔNG nhập ⇒ trường VẮNG HẲN khỏi body ──────────────────────
//
// Gửi `chi_dan: ""` là gửi một trường rỗng cho mọi job — nó vào `sha256`,
// vào egress, và làm `T12-25 AC2` (regression 0) thành lời nói suông.
const i = cc.indexOf("loai: \"chung-cat-mot-nguon\"")
const than = i > 0 ? cc.slice(i - 200, i + 400) : ""
ok(/\.\.\.\(|chi_dan\s*\?|\?\s*\{\s*chi_dan/.test(than),
  "AC3 · `chi_dan` chỉ vào body KHI CÓ (spread có điều kiện)",
  "gửi chuỗi rỗng thì mọi job mang thêm một trường, và 'không chi_dan chạy y "
  + "như cũ' không còn đúng")

// ── AC4 · lỗi 422 hiện NGUYÊN VĂN của server ─────────────────────────
ok(!/dài quá|quá dài|vượt trần/i.test(cc.replace(/vượt \$\{[^}]*\}/g, "")),
  "AC4 · FE KHÔNG tự viết câu lỗi trần",
  "hai bản của một lời là hai chỗ để lệch — bản FE sẽ nói câu cũ sau lần "
  + "server đổi trần")

// ── AC5 · nút Gửi KHÔNG bị disable vì quá trần ───────────────────────
//
// Nút xám không nói vì sao nó xám; người bấm vào chỗ trống rồi tự đoán.
// `/tran/i` khớp cả chữ "**Tran**script" — và từ 2026-09-08 phiếu sinh
// transcript có một `disabled = true` (nhánh `catch` khi danh mục model hỏng)
// đứng ngay trước `async function guiTranscript`, nên vế này ĐỎ OAN cho một
// dòng đúng. Cùng lỗi neo đã trúng `o-chi-dan-hien-that` hôm 2026-09-07.
//
// Đòi đúng ĐỊNH DANH `tran`, có ranh giới từ hai đầu.
const iq = cc.indexOf("cc-gui");
ok(iq < 0 || !/disabled\s*=\s*true[^]{0,120}\btran\b/.test(cc),
  "AC5 · không disable nút theo trần — để nó bấm được và hiện câu 422")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · ô chỉ dẫn đúng bản vẽ đã duyệt")
process.exit(loi ? 1 : 0)
