/**
 * Một nguồn chưng cất NHIỀU lần ⇒ bản cũ vào THÙNG RÁC, và dòng cũ ở tab
 * Chưng cất gạch đỏ.
 *
 * Chủ dự án chốt 2026-09-07: *"1 bài có thể có nhiều bài chưng cất, ta chỉ
 * cho xem bài gần nhất, các bản cũ không xem được nữa → để vậy dễ tràn tài
 * liệu"*.
 *
 * Hai vế, hai tầng, và chúng KHÁC nhau:
 *
 *   KHO  — bản chưng cất cũ RỜI kho (vào thùng rác, khôi phục được). Không
 *          xoá cứng: một bản người đã đọc và trích dẫn không được biến mất
 *          không dấu vết.
 *   TAB  — dòng VIỆC cũ vẫn còn (git của việc), nhưng GẠCH ĐỎ như một bài bị
 *          loại. Vết công việc là thứ khác với vật phẩm trong kho, nên nó
 *          không đi theo vào thùng rác.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const nhapGoc = doc("../api/nhap-cua.mjs")
// Chú thích KHÔNG phải mã: vế 1d đo `b.source_type` sẽ đỏ vì chính câu GIẢI
// THÍCH tại sao khoá ấy sai — đúng loại đỏ oan đã gặp ba lần trong phiên này.
const nhap = boCT(nhapGoc)
const cc = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const css = doc("../styles/prototype.css")

console.log("\nbản chưng cất cũ → thùng rác\n")

// ── 1 · duyệt một bản MỚI ⇒ bản CŨ cùng nguồn rời kho ─────────────────
ok(/donBanCu|banCuVaoRac/.test(nhap),
  "1 · cửa duyệt gọi một bước dọn bản cũ")
ok(/chuyenSangRac/.test(nhap),
  "1b · dùng `chuyenSangRac` — THÙNG RÁC, không xoá cứng",
  "một bản người đã đọc và trích dẫn không được biến mất không dấu vết")
{
  const i = nhap.search(/function donBanCu|function banCuVaoRac/)
  const than = i > 0 ? nhap.slice(i, i + 1800) : ""
  ok(/nguon/.test(than),
    "1c · tìm bản cũ bằng `nguon` — CHỈ cùng một nguồn",
    "so theo slug là gom nhầm hai bài khác nguồn có tên giống nhau")
  // `khoDoc` trả khoá `type`, KHÔNG phải `source_type`. Bản đầu tôi đọc nhầm
  // và `donBanCu` im lặng KHÔNG dọn gì — cổng tĩnh vẫn xanh, chỉ một lần chạy
  // thật mới thấy (`ban_cu_vao_rac = []`).
  ok(!/b\.source_type/.test(than),
    "1d · đọc `b.type` — đúng khoá `khoDoc` trả",
    "`b.source_type` là `undefined`; `chuyenSangRac(undefined, …)` không tìm ra hàng nào")
  // Phép chặn viết dạng KHẲNG ĐỊNH rồi `continue` (`if (x === y) continue`),
  // không dạng phủ định — bản đầu của vế này đòi `!==` nên nó đỏ oan một mã
  // đúng.
  ok(/=== *`\$\{type\}\/\$\{slug\}`[^]{0,40}continue/.test(than),
    "1e · KHÔNG dọn chính bản vừa duyệt",
    "dọn cả bản mới là dọn đúng thứ người vừa làm ra")
}

// ── 2 · lỗi dọn KHÔNG được huỷ việc duyệt ────────────────────────────
{
  const i = nhap.search(/function donBanCu|function banCuVaoRac/)
  const than = i > 0 ? nhap.slice(i, i + 1800) : ""
  ok(/try|catch/.test(than),
    "2 · dọn trượt ⇒ bản mới VẪN vào kho",
    "bản mới đã qua validate; huỷ nó vì một bước dọn là đánh đổi sai chiều")
}

// ── 3 · tab Chưng cất: dòng CŨ gạch đỏ ───────────────────────────────
ok(/cct-cu|cu-roi|banCu/.test(cc),
  "3 · dòng việc cũ có dấu riêng trong tab")
ok(/\.cct-cu\b/.test(cc) || /cct-cu/.test(css),
  "3b · có luật CSS cho dấu ấy")
{
  const nguon = /\.cct-cu[^{]*\{([^}]*)\}/.exec(cc) ?? /\.cct-cu[^{]*\{([^}]*)\}/.exec(css)
  const than = nguon ? nguon[1] : ""
  ok(/line-through/.test(than), "3c · GẠCH NGANG")
  ok(/--destructive|--b1f|red/.test(than),
    "3d · và gạch MÀU ĐỎ — cùng ngôn ngữ với bài bị loại",
    "gạch màu chữ chỉ nói *cũ*; đỏ nói *bản này không còn dùng*")
}

// ── 4 · NHÁP cũ cũng phải đi — không chỉ bài ĐÃ DUYỆT ─────────────────
//
// Chủ dự án bắt 2026-09-07 (ảnh): bốn việc `xong` mà chỉ MỘT dòng gạch đỏ, và
// các bản nháp cũ vẫn *"tồn đọng"*. Gốc: `donBanCu` chỉ chạy ở cửa DUYỆT, nên
// một bản nháp KHÔNG BAO GIỜ được duyệt thì nằm lại mãi.
//
// Chủ dự án nói rõ *"các bản cũ (NHÁP) của bản chưng cất thì mặc định cho vào
// thùng rác"* — chữ "nháp" nằm trong chính câu chốt, và tôi đã đọc lướt nó.
const db = doc("../api/dungchung.mjs")
ok(/donNhapCu|nhapCuVaoRac/.test(db + nhap),
  "4 · có bước dọn NHÁP cũ cùng nguồn",
  "nháp không duyệt thì `donBanCu` không bao giờ chạm tới")
{
  const hop = db + nhap
  const i = hop.search(/function donNhapCu|function nhapCuVaoRac/)
  const than = i >= 0 ? hop.slice(i, i + 1600) : ""
  ok(/nguon/.test(than), "4b · so bằng `nguon`, không bằng slug")
  ok(/da_bo|DA_BO/.test(than),
    "4c · nháp cũ chuyển `da_bo` — hàng CÒN, `ban_goc_ai` CÒN",
    "`FR-057`: bỏ ≠ xoá; `ban_goc_ai` tốn token để tạo và là thứ duy nhất trả "
    + "lời *người đã sửa những gì*")
}

// ── 5 · màn /chung-cat/ cũng gạch đỏ, không chỉ tab ───────────────────
const cc2 = boCT(doc("../plugins/chungcat/src/chungcat.inline.ts"))
ok(/cct-cu|viec-cu|banCu|danhDauCu/.test(cc2),
  "5 · thẻ việc ở màn /chung-cat/ có dấu bản cũ",
  "cùng một sự thật hiện ở hai màn thì phải hiện GIỐNG NHAU — chủ dự án nhìn "
  + "màn /chung-cat/ thấy bốn thẻ xanh y hệt nhau")

// ── 6 · dòng CŨ KHÔNG được mời mở một bản nháp ĐÃ DỌN ────────────────
//
// Chủ dự án 2026-09-07: *"1 video nhưng tồn tại 2"*. Đo trên máy thật:
//   việc `75b5157b` · `nhap_id` = `e3be6337`
//   GET /api/nhap-chung-cat/e3be6337 → {"loi":"không có nháp e3be6337…"}
//
// Dòng cũ vẫn mời *"xem bản nháp ›"* cho một bản `donNhapCu` đã dọn. Bấm vào
// ra câu lỗi — đúng MỤC CHẾT mà SCR-21 xếp là lối TỆ NHẤT: màn hứa một thứ
// nó không giao.
//
// Gạch đỏ nói *bản này cũ*; nút bấm được nói *vẫn xem được*. Hai câu trái
// nhau trên cùng một dòng, và người tin câu nào cũng có lý.
ok(/nhapCon|nhapSong/.test(cc),
  "6 · tab biết bản nháp nào CÒN SỐNG",
  "không biết thì nó mời mở một thứ đã bị dọn")
{
  const i = cc.indexOf("xem bản nháp")
  const quanh = i > 0 ? cc.slice(Math.max(0, i - 700), i + 200) : ""
  ok(/nhapCon|nhapSong/.test(quanh),
    "6b · nút *xem bản nháp* chỉ hiện khi nháp CÒN")
}
ok(/nhapCon|nhapSong/.test(cc2),
  "6c · màn `/chung-cat/` cũng vậy — thẻ `data-ccnhap` trỏ nháp đã dọn là thẻ chết")

// ── 7 · dòng CŨ ẩn mặc định, mở được bằng một cú bấm ─────────────────
//
// Chủ dự án chốt 2026-09-07: dòng việc cũ *"ẩn hẳn khỏi tab, chỉ hiện khi bật
// bộ lọc"*. Vết công việc vẫn CÒN — nó chỉ không chen vào mắt người đang tìm
// bản đang dùng.
//
// ẨN, không XOÁ: một tab chỉ hiện bản mới nhất là một tab không trả lời được
// *"đã chạy mấy lần, tốn bao nhiêu"* — mà đó là câu hàng đợi việc sinh ra để
// trả lời.
ok(/hienCu|CU_HIEN/.test(cc), "7 · tab có công tắc hiện/ẩn dòng cũ")
{
  const i = cc.search(/hienCu|CU_HIEN/)
  const than = i > 0 ? cc.slice(Math.max(0, i - 400), i + 900) : ""
  ok(/false/.test(than), "7b · MẶC ĐỊNH ẩn")
}
ok(/bản cũ/.test(cc),
  "7c · nói RÕ còn bao nhiêu bản cũ đang ẩn",
  "ẩn mà không đếm là giấu — người không biết mình đang không thấy gì")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · bản cũ rời kho, dòng cũ nhìn là biết")
process.exit(loi ? 1 : 0)
