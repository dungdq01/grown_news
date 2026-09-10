/**
 * MỘT phiếu chưng cất cho MỌI loại bản ghi, và một lời mời sau khi transcript xong.
 *
 * Chủ dự án 2026-09-07, ảnh chụp hai hộp thoại cạnh nhau:
 *   *"sao nút chưng cất tài liệu và video khác nhau vậy"*
 *
 * Đo được — cùng một việc, hai chất lượng:
 *
 *   tài liệu → `moPhieuChungCat`  chọn NHÀ · chọn MODEL · KHU VỰC ·
 *                                 cảnh báo egress · ô chỉ dẫn có CHIP + ĐẾM
 *   video    → `hoiChiDan`        một ô text trần. Không chọn model, không
 *                                 khu vực, KHÔNG cảnh báo egress
 *
 * Vế cuối là vế nặng: `§4.0c` của spec khai *"chọn model là chọn KHU VỰC PHÁP
 * LÝ — phải hiện, không được im"* (NĐ 356/2025 Điều 14). Đường video bỏ qua cả
 * phép chọn lẫn câu cảnh báo, tức nó gửi transcript đi bằng model MẶC ĐỊNH mà
 * người bấm không hề được nói cho biết dữ liệu đi đâu.
 *
 * ⚠️ Và `o-chi-dan-hien-that.test.js §2` XANH suốt trong lúc đó, vì nó hỏi
 * `/chi_dan_mau|goiY|chip/` — chuỗi `goiY` của `hoiChiDan` khớp. Cổng đo *"có
 * chữ gợi ý ở đâu đó"* thay vì *"hai đường CÙNG một phiếu"*. Đúng lớp lỗi
 * `cong-xanh-vi-neo-sai`: cổng xanh vì nó neo vào một mảnh chữ.
 *
 * `guiChungCat` post `{loai:"chung-cat-mot-nguon", slug, model, chi_dan}` —
 * Y HỆT cho video: `FR-070` để THỢ chọn nguyên liệu theo LOẠI bản ghi. Nên
 * không có lý do kỹ thuật nào cho hai phiếu.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
// File nguồn dùng CRLF, nên một neo đòi LF + `}` + LF KHÔNG khớp `}` + CR + LF.
// `than()` khi ấy trả một đoạn KHÔNG phải thân hàm, và mọi vế sau đo trên rác —
// đúng hai vế đã đỏ oan lần đầu chạy cổng này. Chuẩn hoá ngay ở phép ĐỌC: một
// cổng phải đo TÍNH CHẤT, không đo cách hệ điều hành xuống dòng.
const CR = String.fromCharCode(13)
const goc = doc("../plugins/cctab/src/cctab.inline.ts").split(CR).join("")
const tab = boCT(goc)
const than = (ten, n = 2000) => {
  const i = tab.indexOf(ten)
  if (i < 0) return ""
  const h = tab.indexOf("\n}\n", i)
  return tab.slice(i, h > 0 ? h : i + n)
}

console.log("\nmột phiếu chưng cất cho mọi loại bản ghi\n")

// ── 1 · đường VIDEO dùng CHÍNH phiếu của đường tài liệu ───────────────
{
  const t = than("async function moCuaSoChungCat")
  ok(t.length > 0, "1 · tìm thấy `moCuaSoChungCat` (đường video)")
  ok(/moPhieuChungCat/.test(t),
    "1b · đường video gọi `moPhieuChungCat`",
    "một việc hai phiếu ⇒ người gặp phiếu nào là do may rủi, và phiếu nghèo "
    + "hơn thiếu đúng phép chọn khu vực pháp lý")
  ok(!/hoiChiDan/.test(t),
    "1c · KHÔNG còn `hoi()` trần trên đường video",
    "một ô text không nói được model nào sẽ nhận dữ liệu")
}
ok(!/function hoiChiDan/.test(tab),
  "1d · `hoiChiDan` đã bị xoá, không để lại mã mồ côi",
  "hàm không ai gọi là hàm người sau tưởng còn dùng")

// ── 2 · công bố egress KHÔNG được nói sai thứ rời khỏi máy ────────────
//
// Vấn đề gốc: câu cũ khai *"TOÀN VĂN bản ghi này rời khỏi máy"* — SAI cho
// video, vì thứ rời máy là TRANSCRIPT (`FR-070`) còn `than` của một video là
// phần mô tả người gõ tay. Một câu cảnh báo sai chỗ tệ hơn không có: nó dạy
// người đọc rằng cảnh báo ở đây không chính xác.
//
// Lượt đầu tôi giải bằng `canhBaoCc(ban)` — rẽ theo loại. Nay chủ dự án bỏ hết
// văn xuôi (*"mô tả thừa thãi"*), nên câu còn đúng MỘT dòng: *"rời khỏi máy ·
// khu vực X"*. Nó KHÔNG nêu artefact nào cả, nên **không thể nói sai** cho bất
// kỳ loại bản ghi nào — cùng bất biến, đạt bằng cách rẻ hơn.
//
// Vế phải canh, và nó là vế duy nhất còn giá trị: đừng để một câu nói
// "toàn văn bản ghi" quay lại phiếu.
{
  const t = than("async function moPhieuChungCat", 3000)
  ok(/rời khỏi máy/i.test(t),
    "2 · phiếu công bố dữ liệu RỜI KHỎI MÁY",
    "`§4.0c` đòi khu vực pháp lý phải HIỆN, không được im")
  ok(!/TOÀN VĂN bản ghi/i.test(tab),
    "2b · KHÔNG câu nào khai *toàn văn bản ghi* rời máy",
    "với video thì đó là câu SAI — nguyên liệu là transcript, không phải `than`")
  ok(/data-f="kv"/.test(t),
    "2c · và khu vực pháp lý đi kèm ngay dòng ấy")
}

// ── 3 · transcript xong ⇒ MỜI chưng cất ngay tại chỗ ──────────────────
//
// Chủ dự án: *"Sau khi sinh transcript xong thì hiển thị luôn thông báo là
// «bạn có muốn chưng cất nội dung video luôn không?» → chưng cất"*.
/*
 * WO-081 · Phép đo DỜI THEO mã, không nới ra.
 *
 * Bản trước cắt 1400 ký tự sau `LOAI_KHONG_NHAP.has(loai)` rồi tìm chuỗi
 * `data-act="cc-tu-tr"` NGAY TRONG cửa sổ ấy — tức nó đo *"nút nằm cạnh
 * nhánh"*. Đúng khi markup còn viết thẳng tại chỗ. `WO-081` tách nút ra
 * `veNutChungCatTuTranscript` (chủ dự án: nút xuống footer, đổi màu xanh lam),
 * và phép đo đỏ dù hành vi ĐÚNG HƠN trước.
 *
 * Nới cửa sổ lên 4000 ký tự là cách làm nó xanh mà mất luôn ý nghĩa. Nên đo
 * đúng cái bất biến — cùng lối §3d bên dưới đã dùng cho bộ nghe: **hai mắt
 * xích thật**, nhánh gọi hàm, và hàm phát ra nút.
 */
{
  const i = tab.indexOf("LOAI_KHONG_NHAP.has(loai)")
  const t = i > 0 ? tab.slice(i, i + 4000) : ""
  ok(i > 0, "3 · tìm thấy nhánh *việc không sinh nháp*")
  ok(/veNutChungCatTuTranscript\(doc, sl\)/.test(t),
    "3b · nhánh transcript-xong GỌI phép vẽ nút chưng cất",
    "bắt người tự đi tìm nút ở một cửa sổ khác là bắt họ nhớ hộ hệ thống")

  const j = tab.indexOf("function veNutChungCatTuTranscript")
  const f = j > 0 ? tab.slice(j, j + 1200) : ""
  ok(j > 0, "3b2 · và phép vẽ ấy CÓ THẬT",
    "gọi một tên chưa định nghĩa thì nhánh ném lỗi ngay lúc vẽ")
  ok(/data-act="cc-tu-tr"/.test(f),
    "3b3 · nó phát ra đúng nút `cc-tu-tr`",
    "hai mắt xích: thiếu mắt nào thì người xong transcript vẫn không có nút")
  ok(/chưng cất/i.test(f), "3c · và nó nói bằng chữ, không chỉ một icon")
}
// Phép cũ ở đây XOÁ mọi `data-act="cc-tu-tr"` rồi tìm lại chuỗi ấy — nhưng
// selector của bộ nghe CŨNG chứa nó, nên nó tự xoá đúng bằng chứng mình cần.
// Hỏi thẳng cái bất biến: có một `addEventListener` treo trên selector đó, và
// nó gọi một hàm CÓ THẬT.
// So bằng CHUỖI, không bằng regex: mỗi tầng escape là một chỗ để vế này sai,
// và nó đã sai một lần đúng theo cách đó.
{
  const neo = 'querySelector(\'[data-act="cc-tu-tr"]\')'
  ok(tab.includes(neo) && tab.includes(neo + "?.addEventListener"),
    "3d · act `cc-tu-tr` có `addEventListener` treo trên đúng selector",
    "một `data-act` không ai bắt là một nút bấm không làm gì")
}
ok(/function chungCatTuTranscript/.test(tab)
  && /chungCatTuTranscript\(sl\)/.test(tab),
  "3e · và bộ nghe gọi một hàm CÓ THẬT",
  "treo listener vào một tên chưa định nghĩa thì nút ném lỗi lúc bấm")

// ── 4 · chống đỏ oan: phiếu vẫn phải còn ba phép chọn ─────────────────
{
  const t = than("async function moPhieuChungCat", 3000)
  for (const [k, v] of [["nha", "nhà cung cấp"], ["model", "model"],
                        ["kv", "khu vực"]])
    ok(new RegExp(`data-f="?${k}"?`).test(t) || t.includes(`data-f=${k}`),
      `4 · phiếu giữ phép chọn ${v}`)
  ok(/veOChiDan/.test(t), "4b · phiếu giữ ô chỉ dẫn có chip + đếm ký tự")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · một phiếu, cảnh báo nói đúng, transcript xong thì mời tiếp")
