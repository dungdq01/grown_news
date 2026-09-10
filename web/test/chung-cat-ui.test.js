#!/usr/bin/env node
/**
 * T03-92 — cụm nút CHƯNG CẤT trên thanh tiêu đề cửa sổ đọc.
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Chỉ đạo 2026-09-03: *"nhúng vào TẤT CẢ multiwindow — xem tài liệu hay video
 * đều có nút tiện ích đó"*. Nên phép đo phải là **MỘT component dùng chung**,
 * không phải hai nhánh `if` cho hai loại cửa sổ: hai nhánh thì nhánh thứ hai
 * sẽ lệch, và lệch ở đây nghĩa là một loại bản ghi mất nút mà không ai thấy.
 *
 * BA FACT HỢP ĐỒNG đã đo trên backend thật (smoke test 2026-09-03) — FE phải
 * bám đúng, và cổng này canh cả ba:
 *
 *   1. `GET /model` là nguồn bộ chọn, và `FR-053 §1.4` đòi **hiện `khu_vuc`
 *      cạnh từng model**. Giá trị thật hôm nay là `khong-xac-dinh` — FE phải
 *      hiện ĐÚNG CHỮ ĐÓ. Để trống hay ẩn đi là xoá đúng thứ người cần thấy
 *      trước khi bấm: một cú bấm là một lần chuyển dữ liệu xuyên biên giới.
 *   2. `POST /job` đòi HAI header (`X-Khoa-Loi` + `X-Nguoi-Dung`); thiếu ⇒ 403.
 *      Và body **KHÔNG** được chứa `nguoi_dung_id` — server lột nó (`AC-1.5`),
 *      nên gửi lên là gửi một thứ vô nghĩa và tạo cảm giác client quyết được.
 *   3. Mã trả về cho ca IDEMPOTENT **chưa chốt bằng FR** (đo được: nạp lại cùng
 *      ULID trả `201`, hàng đợi vẫn 1 việc). FE phải xử theo lớp `2xx = đã
 *      nhận`, **KHÔNG** rẽ nhánh theo `201` cứng.
 *
 * ĐỎ_KHI  cụm nút không nằm trong component thanh-tiêu-đề dùng chung · một loại
 *         cửa sổ thiếu nút · video-chưa-transcript render nút GỌI được (thay vì
 *         disabled + lý do) · bấm lần một đã gửi request · bộ chọn không hiện
 *         `khu_vuc` · body mang `nguoi_dung_id` · mã rẽ nhánh theo `201` cứng
 * XANH_KHI một component, ba loại cửa sổ, và ba fact hợp đồng được tôn trọng
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

/**
 * Phép PHỦ ĐỊNH chỉ có nghĩa khi tính năng ĐÃ TỒN TẠI.
 *
 * "Mã không rẽ nhánh theo 201" tự đúng khi chưa có dòng mã nào — một cổng xanh
 * RỖNG, và nó tệ hơn đỏ vì nó trông như đã được canh. Nên mọi phép phủ định đi
 * qua đây: chưa có tính năng ⇒ báo CHƯA ĐO ĐƯỢC, không báo ok.
 */
function okPhuDinh(coTinhNang, dk, ten, ct = "") {
  if (!coTinhNang) {
    console.log(`  --   ${ten}   (chưa đo được — tính năng chưa dựng)`)
    return
  }
  ok(dk, ten, ct)
}

/*
 * HAI file, không một: cụm NÚT ở `multiwindow` (nó nằm trong thanh tiêu đề của
 * mọi cửa sổ), còn HỘP THOẠI + `guiChungCat` đã dời sang chunk `cctab` —
 * `FR-062`, vì 2986 byte cho một hộp thoại chỉ mở khi người bấm không thuộc
 * đường tải đầu của người đọc báo.
 *
 * Đọc một file thì năm vế của cổng này đỏ trong khi mã vẫn nguyên (đo được:
 * "lần bấm THỨ HAI mới gửi" · "toast mang link ?job=" · ba vế hợp đồng LÕI).
 * Đỏ oan vì phép đo nhìn sai chỗ — không phải vì tính năng mất.
 */
const INLINE = join(GOC, "web/plugins/multiwindow/src/scripts/multiwindow.inline.ts")
const CCTAB = join(GOC, "web/plugins/cctab/src/cctab.inline.ts")
const src = [INLINE, CCTAB].map((p) => readFileSync(p, "utf8"))
  .join(String.fromCharCode(10))

console.log("\n1 · Cụm nút nằm trong component thanh-tiêu-đề DÙNG CHUNG\n")

// `.bk-t` là thanh tiêu đề của cửa sổ đọc — MỘT chỗ dựng cho mọi loại bản ghi
// (`multiwindow.inline.ts:178`). Nút phải nhúng vào đó, không vào một nhánh
// riêng theo `source_type`.
const khoiBkT = src.match(/'<div class="bk-t"[\s\S]{0,3000}?bk-pg/)
ok(khoiBkT !== null, "tìm được khối dựng thanh tiêu đề `.bk-t`")

const tb = khoiBkT ? khoiBkT[0] : ""

// Đo CẤU TRÚC, không đo vị trí chữ. Bản đầu của cổng này đòi chuỗi
// `data-act="chung-cat"` xuất hiện LITERAL trong khối `.bk-t` — nhưng cách
// dựng đúng là `.bk-t` **gọi** một helper dùng chung, nên chuỗi nằm trong
// helper. Cổng đo văn bản thay vì đo quan hệ thì nó phạt đúng cách làm đúng.
ok(/cumNutChungCat\(/.test(tb),
  "`.bk-t` GỌI helper dùng chung `cumNutChungCat(ban)` — một component cho mọi cửa sổ")

// Và nút được dựng ở ĐÚNG MỘT chỗ: hai chỗ dựng thì một chỗ sẽ lệch, và lệch
// ở đây nghĩa là một loại bản ghi mất nút mà không ai thấy.
// Đếm chỉ chỗ DỰNG nút. `[data-act="chung-cat"]` (có ngoặc vuông) là một
// SELECTOR — `veNutBanChungCat` dùng nó để TÌM nút mà sơn màu, và tìm không
// phải dựng. Bỏ qua dạng có `[` đứng trước, không thì cổng báo *"2 chỗ dựng
// nút"* cho một chuỗi chỉ đọc.
const soChoDung = (src.match(/(?<!\[)data-act="chung-cat"/g) ?? []).length
ok(soChoDung === 1,
  "chỉ MỘT chỗ trong mã dựng nút — không nhánh riêng theo loại",
  `thấy ${soChoDung} chỗ`)
ok(/function cumNutChungCat/.test(src), "helper tồn tại và là một hàm có tên")

console.log("\n2 · HÀNH VI theo loại đọc từ BẢNG KHAI, không rải `if`\n")

// Ba loại, ba hành vi (T03-92 §Là gì). Chúng phải sống trong một bảng khai
// đọc được, không phải một chuỗi `if/else if` — bảng thì thêm loại là thêm một
// dòng, `if` thì thêm loại là sửa một hàm và quên một nhánh.
// Bắt tới `\n};` — không tới `}` đầu tiên. Bản đầu dừng ở dấu đóng của MỤC
// THỨ NHẤT, nên nó báo thiếu `video`/`article` trong khi bảng có đủ: cổng đo
// một phần rồi phán về toàn thể.
const bang = src.match(/HANH_DONG_CHUNG_CAT\s*=\s*\{[\s\S]*?\n\};/)
ok(bang !== null,
  "có bảng khai hành động theo loại (`HANH_DONG_CHUNG_CAT`)")
const b = bang ? bang[0] : ""
for (const loai of ["tai-lieu", "video", "article"]) {
  ok(b.includes(loai), `bảng khai có mục cho loại \`${loai}\``)
}

console.log("\n3 · Video chưa transcript: nút NÓI THẬT, không nút chết\n")

// `S18`: không render nút gọi một endpoint chưa có. Nhưng chỉ đạo đòi nút HIỆN
// ở mọi cửa sổ — nên ca này là **disabled + lý do đọc được**, không phải nút
// biến mất và cũng không phải nút bấm-rồi-500.
// Đo trong THÂN HELPER — đó là chỗ trạng thái nút được quyết. Bản đầu đo trong
// bảng khai và trong `.bk-t`, hai chỗ không chứa nó.
// Cắt tới dấu đóng THẬT, không đặt một trần ký tự đoán tay: comment của
// `SCR-24` đẩy hàm này qua 1200 ký tự, nên `{0,1200}?` trả `null` và ba vế
// dưới đo trên một chuỗi RỖNG — cổng đỏ vì một lý do không liên quan gì tới
// hành vi nó canh.
const iHp = src.indexOf("function cumNutChungCat")
const jHp = iHp < 0 ? -1 : src.indexOf("\n}", iHp)
const hp = jHp > 0 ? src.slice(iHp, jHp + 2) : ""
ok(/disabled/.test(hp),
  "helper render `disabled` khi bảng khai nói `bat: false`")
ok(/title=/.test(hp) && /vi_sao/.test(hp),
  "kèm LÝ DO đọc được (`title` lấy từ `vi_sao`), không disabled im lặng")
ok(/ho_so/.test(hp),
  "helper đọc `ho_so` — bản `phan-tich` KHÔNG có nút (đã là sản phẩm)")

console.log("\n4 · Bấm lần MỘT không gửi gì — phiếu hỏi trước\n")

// Một cú bấm là một lần toàn văn rời khỏi máy (`FR-043` bậc 4), và từ khi
// NGƯỜI chọn model (`FR-053` §1.4) nó còn là một lần chọn KHU VỰC PHÁP LÝ.
// Nên hai lần bấm phải là HAI `data-act` khác nhau: một `data-act` làm cả hai
// việc thì lần bấm đầu đã gửi, và không có chỗ nào để hiện `khu_vuc` trước.
/*
 * ĐO LẠI 2026-09-05 (`T03-108`) — nhánh này nay rẽ HAI lối: bản ghi video đi
 * `moPhieuTranscript` (nó chưa có chữ để chưng cất), còn lại đi `moPhieu`, và
 * cả hai gọi qua cầu nạp chunk `goiChunk` (`FR-062`). Mẫu cũ đòi đúng chữ
 * `moPhieuChungCat` nên nó đỏ trong khi hành vi không đổi — lại là một cổng đo
 * TÊN HÀM thay vì đo mệnh đề.
 *
 * Mệnh đề thật, và nó mạnh hơn mẫu cũ: nhánh `chung-cat` phải dẫn tới một
 * `moPhieu…`, và trong nhánh đó KHÔNG được có một `fetch(` nào.
 */
/*
 * Cắt THÂN NHÁNH bằng đếm ngoặc, KHÔNG bằng khoảng cách ký tự.
 *
 * `[\s\S]{0,N}` là một con số phải nới mỗi lần ai thêm một dòng chú thích, và
 * nó đã phải nới hai lần (`{0,120}` → `{0,240}` → đỏ lại ở 320 vì ba dòng
 * chú thích của `T03-108`). Một cổng mà mỗi chú thích mới làm đỏ là cổng đo
 * ĐỘ DÀI thay vì đo hành vi — và nó dạy người ta bớt chú thích.
 */
const thanNhanh = (() => {
  const i = src.indexOf('act === "chung-cat"')
  if (i < 0) return ""
  const b = src.indexOf("{", i)
  let sau = 0
  for (let k = b; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}") { sau--; if (!sau) return src.slice(b, k + 1) }
  }
  return ""
})()
const nhanhMo = /moPhieu/.test(thanNhanh) ? thanNhanh : ""
ok(nhanhMo !== "", "bấm lần MỘT chỉ mở phiếu (`chung-cat` → `moPhieu…`)")
okPhuDinh(nhanhMo !== "", !/fetch\s*\(/.test(nhanhMo),
  "  và nhánh MỞ phiếu không tự gửi gì — một cú bấm là một lần toàn văn rời máy")
/*
 * ĐO LẠI 2026-09-04 (`T03-107`) — mẫu cũ `[^;]{0,120}` ĐỎ OAN khi phiếu chuyển
 * sang `<dialog>`: nhánh nay là
 *     if (act === "cc-gui") { e.preventDefault(); return void guiChungCat(d, ban) }
 * và một dấu `;` ở giữa làm `[^;]` không khớp. Hành vi KHÔNG đổi — chỉ hình
 * dạng câu lệnh đổi, và một cổng đỏ vì hình dạng câu lệnh là cổng đo sai chỗ.
 *
 * Mẫu mới đo đúng mệnh đề: giữa `cc-gui` và `guiChungCat` KHÔNG được có một
 * `fetch(` nào. Đó mới là điều cần bảo đảm — "nhánh này gửi việc, và nó gửi
 * bằng cách gọi `guiChungCat`, không tự dựng request".
 */
const nhanhGui = (src.match(/act === "cc-gui"[\s\S]{0,240}?guiChungCat/) ?? [""])[0]
ok(nhanhGui !== "", "lần bấm THỨ HAI mới gửi (`cc-gui` → `guiChungCat`)")
okPhuDinh(nhanhGui !== "", !/fetch\s*\(/.test(nhanhGui),
  "  và nhánh đó KHÔNG tự dựng request — nó gọi qua `guiChungCat`")
const thanMo = (src.match(/function moPhieuChungCat[\s\S]{0,3000}?\n\}/) ?? [""])[0]
okPhuDinh(thanMo !== "", !thanMo.includes('"/api/job"'),
  "hàm MỞ phiếu KHÔNG gọi `/api/job` — nó chỉ đọc danh mục model")
ok(/toàn văn|rời khỏi máy|CÓ VẾT/i.test(src),
  "phiếu NÓI RA rằng toàn văn rời khỏi máy và có vết — không chỉ hỏi 'chắc chưa?'")

console.log("\n5 · Ba fact hợp đồng của backend\n")

// Fact 1 · `khu_vuc` hiện CẠNH từng model, kể cả `khong-xac-dinh`.
ok(/khu_vuc/.test(src), "mã đọc `khu_vuc` từ `GET /model`")
okPhuDinh(/khu_vuc/.test(src),
  !/khu_vuc[^\n]{0,40}(!==|===)\s*['"]khong-xac-dinh['"]/.test(src),
  "KHÔNG lọc/ẩn giá trị `khong-xac-dinh` — nó phải hiện nguyên văn")

// Fact 2 · ĐẢO NGƯỢC sau T08-20 — xem đầu file.
//
// Bản đầu đòi mã FE gửi `X-Khoa-Loi` + `X-Nguoi-Dung`. Sau khi T08-20 mở hai
// cửa proxy ở LÕI, đó là **thứ phải CẤM**: khoá dịch vụ đọc từ env SERVER, và
// một chuỗi khoá trong bundle nghĩa là mở DevTools là thấy nó. Phép đo đổi từ
// KHẲNG ĐỊNH sang PHỦ ĐỊNH — lần này phủ định ĐO ĐƯỢC, vì tính năng gửi
// request đã tồn tại (`okPhuDinh` canh đúng chỗ đó).
const coGuiJob = src.includes('fetch("/api/job"')
ok(coGuiJob, "FE gọi `POST /api/job` của LÕI — không gọi thẳng `:8790`")
// ⚠️ HAI phép này đo **BUNDLE ĐÃ BUILD**, không đo nguồn.
//
// Bản đầu đo `src` (file `.ts`) và ĐỎ OAN: nguồn có hai dòng CHÚ THÍCH
// giải thích *"không gọi thẳng `:8790`"* và *"không chứa chuỗi
// `x-khoa-loi`"* — cổng đọc chính câu giải thích rồi tố nó. Một cổng phạt
// người viết vì đã viết ra lý do là cổng dạy người ta đừng viết lý do.
//
// Và bundle là phép đo ĐÚNG HƠN, không chỉ tránh đỏ oan: thứ tới trình
// duyệt là bundle. esbuild cắt chú thích, nên câu hỏi thật —
// *"khoá có ra máy người dùng không"* — chỉ trả lời được ở đó.
let bundle = ""
try {
  bundle = readFileSync(join(GOC,
    "web/plugins/multiwindow/src/scripts/multiwindow.inline.js"), "utf8")
} catch { /* chưa `npm run build` */ }
ok(bundle !== "", "bundle đã build tồn tại — chạy `npm run build` trước cổng này")
okPhuDinh(bundle !== "" && coGuiJob, !/x-khoa-loi/i.test(bundle),
  "BUNDLE không chứa chuỗi `x-khoa-loi` — khoá dịch vụ ở lại SERVER")
okPhuDinh(bundle !== "" && coGuiJob, !bundle.includes("8790"),
  "BUNDLE không gõ cổng `:8790` — trình duyệt chỉ biết `web`")
ok(src.includes('fetch("/api/model"'), "bộ chọn đọc `GET /api/model` của LÕI")
const thanPost = src.match(/JSON\.stringify\(\s*\{[\s\S]{0,400}?\}\s*\)/g) ?? []
okPhuDinh(thanPost.length > 0,
  !thanPost.some((t) => /nguoi_dung_id/.test(t)),
  "body POST /job KHÔNG chứa `nguoi_dung_id` (server lột — AC-1.5)")

// Fact 3 · xử theo lớp 2xx, không rẽ theo 201 cứng.
const coGui = /X-Khoa-Loi/i.test(src)
okPhuDinh(coGui,
  !/status\s*===\s*201|=== 201|== 201/.test(src),
  "KHÔNG rẽ nhánh theo `201` cứng — mã idempotent chưa chốt bằng FR, xử theo lớp 2xx",
  "tìm thấy so sánh === 201")
okPhuDinh(coGui, /\.ok\b|status\s*<\s*300/.test(src),
  "xử theo lớp `2xx = đã nhận`")

console.log("\n6 · Sau khi gửi: người Ở LẠI màn\n")

// Đo LỜI GỌI, không đo quy ước đặt tên. Bản đầu đòi `/toast|bao[A-Z]/` —
// hàm báo của dự án tên `bao(loi, chu)`, chữ thường, nên cổng đỏ vì cách
// đặt tên chứ không vì thiếu tính năng.
ok(/bao\(\s*(?:false|true)/.test(src),
  "có gọi `bao(loi, chu)` — hàm báo kết quả dùng chung của dự án")
ok(/\?job=/.test(src), "toast mang link `?job=<ulid>` sang màn Xưởng")
okPhuDinh(/\?job=/.test(src),
  !/location\.href\s*=\s*['"]\/xuong/.test(src),
  "KHÔNG chuyển hướng — người ở lại chỗ họ đang đọc")

chot("cụm nút một component · ba loại · ba fact hợp đồng được tôn trọng")
