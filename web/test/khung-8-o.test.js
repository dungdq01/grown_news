#!/usr/bin/env node
/**
 * FR-036 · FORM NẠP THEO KHUNG KHAI — số ô = số mục LÁ, không phải số gõ tay.
 *
 * ═══ VÌ SAO CẦN PHÉP KIỂM NÀY ═══════════════════════════════════════════════
 *
 * `SCR-05 §1` khai nguyên tắc: *"mỗi ràng buộc của cổng phải có một ô nhập
 * tương ứng"*. Trước FR-036 nguyên tắc đó được canh bằng một literal —
 * `four-screens` khẳng định `id="f-muc9"`. Con số 9 nằm trong tên id, trong
 * nhãn nút, trong hai mảng JS, và trong test. Năm chỗ, một sự thật.
 *
 * Khung đổi từ 9 mục sang 5 mục (§3 có bốn mục con ⇒ 8 mục lá) và mọi chỗ đó
 * phải đổi tay. Đây là chỗ đặt cái răng ĐẾM THEO KHUNG, để lần đổi sau không
 * ai phải sửa test nữa.
 *
 * ═══ ĐIỀU NÓ KHÔNG LÀM ══════════════════════════════════════════════════════
 * Không mô phỏng cú bấm — dự án không có trình duyệt headless. Nó đo BUNDLE ĐÃ
 * BUILD và MARKUP ĐÃ RENDER. Nó không bắt được: form dựng đủ ô mà ghép markdown
 * sai, CSS che một ô, lỗi lúc chạy. Người chốt vẫn phải gõ thật một bài.
 */
import { trangHtml, taiSan } from "./_render.mjs"
import { KHUNG, CAN_LOCATOR } from "./_khung.mjs"

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  <- " + ct}`)
  if (!dk) loi.push(ten)
}

// FR-038/C6a · man `/nap/` chung DA BO — moi loai mot man nap rieng.
const nap = await trangHtml("nap-bai-viet")
/*
 * GIẢI ESCAPE TRƯỚC KHI SO CHỮ CÓ DẤU.
 *
 * esbuild phát ra ASCII: "Bối cảnh" thành "Bối cảnh" trong bundle.
 * `js.includes("Bối cảnh")` luôn FALSE — và nó false theo hướng BÁO ĐỘNG GIẢ,
 * tức tố cáo code hỏng khi code đúng. Đã trúng lỗi này một lần trong phiên
 * trước khi kiểm `NHAC_BUILD`.
 */
const js = (await taiSan()).gnJs
  // esbuild dùng CẢ HAI dạng: `ố` cho ký tự ngoài Latin-1 và `\xE0` cho ký
  // tự trong nó. Giải một dạng thôi là vẫn đỏ oan cho dạng kia.
  .replace(/\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
           (_, u, x) => String.fromCharCode(parseInt(u ?? x, 16)))

// Mục LÁ — cùng định nghĩa với `khung.py:LA` và `dungKhung()` trong FE.
const LA = KHUNG.muc.flatMap((m) => m.con?.length ? m.con.map((c) => c.so) : [String(m.so)])

console.log(`\nFR-036 · khung ${KHUNG.muc.length} mục / ${LA.length} ô nhập\n`)

// ─── 1 · CON SỐ TRONG MARKUP DẪN XUẤT TỪ KHUNG ──────────────────────────────
console.log("1 · Nhãn trong markup khớp khung\n")
// WO-037 · phép kiểm nhãn `N ô` ĐÃ BỎ cùng với nút chế độ soạn thô.
//
// Nó canh một BẢN GÕ TAY THỨ HAI của số mục lá: shell viết `8 ô`, bảng khai
// nói 8. Gỡ nút xong thì shell không nói con số ấy ở đâu nữa — `dungKhung()`
// dựng ô từ bảng khai lúc chạy. Bản sao biến mất, nên phép canh nó chỉ còn
// đỏ oan được.
//
// Số ô VẪN được canh, ở chỗ nó còn sống: `form-van-xuoi.test.js` §1 dựng form
// THẬT rồi đếm `placeholder`, và đòi đúng `LA.length`.
ok(nap.includes(`nạp khung ${KHUNG.muc.length} mục`),
   `nút nạp khung ghi \`${KHUNG.muc.length} mục\``,
   "nút này tải template — số MỤC (`##`), không phải số Ô")
ok(nap.includes('id="f-o-muc"'), "khối ô mang id KHÔNG có số (`f-o-muc`)",
   "id mang số là một tập gõ tay nữa: đổi khung lại phải rename shell + CSS + test")
ok(!/id="f-muc\d/.test(nap), "không còn id kiểu `f-muc9`")

// ─── 2 · BUNDLE ĐỌC KHUNG, KHÔNG GÕ LẠI ────────────────────────────────────
console.log("\n2 · Bundle đọc khung thay vì gõ lại\n")
// Khung nhúng lúc build (esbuild `define`) ⇒ tên mục PHẢI có trong bundle.
for (const m of KHUNG.muc) {
  ok(js.includes(m.ten), `bundle mang tên mục "${m.ten}"`,
     "thiếu ⇒ `__KHUNG__` không được nhúng, form sẽ dựng 0 ô")
}
ok(!js.includes("$comment"),
   "bình luận của file khai KHÔNG đi xuống trình duyệt",
   "page-weight cho gn.js trần 100 KB — bình luận là để người đọc file khai")
// Ba hàm của vòng ghép/rải. Tên KHÔNG mang số nữa.
for (const [ham, mo] of [["dungKhung", "dựng ô"], ["gomKhung", "ô → markdown"],
                         ["raiKhung", "markdown → ô"]]) {
  ok(js.includes(ham), `bundle có \`${ham}\` (${mo})`)
}
ok(!/dungMuc9|gomMuc9|raiMuc9|TEN_MUC|GOI_Y_MUC/.test(js),
   "không còn tên/mảng của khung 9 mục",
   "hai mảng gõ tay đó là chỗ bộ tên mục thứ hai đã sinh ra và trôi")

// ─── 3 · CẤP LỒNG CỦA §3 ────────────────────────────────────────────────────
console.log("\n3 · Mục con của §3 có chỗ riêng\n")
const coCon = KHUNG.muc.filter((m) => m.con?.length)
ok(coCon.length > 0, `${coCon.length} mục có mục con`)
// Nhãn nhóm + ô con thụt vào: SCR-05 §a đòi cấp khác phải KHÁC HÌNH.
ok(js.includes("f-mnhom"), "có nhãn nhóm cho mục cha (`.f-mnhom`)",
   "không có nhãn nhóm thì bốn ô `3.x` trông ngang hàng với §1/§2")
ok(/" con"/.test(js), "ô con nhận class `con` để thụt vào")
// Ghép phải phát CẢ HAI cấp tiêu đề.
ok(js.includes("## ${m.so}. ${m.ten}") || /## \$\{/.test(js),
   "ghép phát tiêu đề cấp `##`")
ok(/### \$\{c\.so\}/.test(js), "ghép phát tiêu đề cấp `###` cho mục con",
   "không phát thì bốn mục con biến mất khỏi markdown gửi đi")

// ─── 4 · TINH TÚY LÀ MỘT Ô, KHÔNG CÓ CẤP THỨ TƯ ──────────────────────────
console.log("\n4 · Tinh túy là một ô văn xuôi — không `####`, không bullet\n")

/*
 * WO-038 · §4 ĐỔI ĐÍCH, không xoá.
 *
 * Bản trước đòi bundle CÓ `####` và mang đủ năm dòng bullet — đúng hợp đồng
 * lúc đó. Người dùng chốt: *"chỉ cần 1 header duy nhất là tinh túy, sau đó tất
 * cả là text văn bản gõ vào, giống các ô khác"*. Nên phép kiểm đảo chiều: giờ
 * bundle KHÔNG được sinh cấp thứ tư nào.
 *
 * Neo bằng ký tự MỞ CHUỖI như bản cũ đã học: `###` là chuỗi con của `####`,
 * nên `!js.includes("###")` là phép kiểm đỏ oan vĩnh viễn.
 */
ok(!/[`"']#### /.test(js), "bundle KHÔNG sinh tiêu đề cấp `####`",
   "còn sinh ⇒ vẫn ép người viết theo cấu trúc con vừa bỏ")
ok(!/- \*\*\$\{/.test(js) && !/tinh_tuy/.test(js),
   "bundle KHÔNG còn dòng bullet đậm sinh từ bảng khai",
   "năm nhãn Không hiển nhiên vì / Chuyển giao / … đã bỏ khỏi hợp đồng")

// Chiều ngược: mục tinh túy vẫn TỒN TẠI và vẫn là mục lá của form.
const tt = KHUNG.muc.flatMap((m) => m.con ?? []).filter((c) => c.ten === "Tinh túy")
ok(tt.length === 1, `khung vẫn có đúng một mục Tinh túy (${tt.length})`,
   "bỏ cấu trúc con KHÔNG phải bỏ mục")
ok(tt[0]?.nang === true, "và nó vẫn là mục NẶNG")
// ─── 5 · LOCATOR: GỢI Ý PHẢI Ở ĐÚNG Ô ĐÒI NÓ ───────────────────────────────
console.log("\n5 · Mục đòi locator có gợi ý nhắc locator\n")
const goiY = Object.fromEntries(
  KHUNG.muc.flatMap((m) => m.con?.length
    ? m.con.map((c) => [c.so, c.goi_y])
    : [[String(m.so), m.goi_y]]))
for (const dc of CAN_LOCATOR) {
  ok(/locator|\[/.test(goiY[dc] ?? ""),
     `mục ${dc} (đòi locator) có gợi ý nhắc địa chỉ`,
     "cổng 7 trả bài về vì thiếu locator — ô nào đòi thì ô đó phải nói ra")
}

console.log("\n" + "-".repeat(62))
if (loi.length) {
  for (const x of loi) console.log("  -", x)
  console.error(`\n${loi.length} lỗi · form không khớp khung khai`)
  process.exit(1)
}
console.log(`pass · form ${LA.length} ô dẫn xuất từ khung ${KHUNG.muc.length} mục`)
