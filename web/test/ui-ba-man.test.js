#!/usr/bin/env node
/**
 * WO-012 — ba màn loại phải ĐẦY ĐỦ như màn Tổng hợp, và panel kéo tới đáy.
 *
 * Người dùng: *"tôi thấy chưa đẹp và khoa học đâu"*. Sáu điều đo được trên ảnh
 * chụp ở `.factory/wo/WO-012-*.md`; cổng này canh sáu điều đó.
 *
 * ĐỐI CHIẾU VỚI MÀN TỔNG HỢP, không gõ danh sách thành phần. Gõ tay thì hôm nào
 * Tổng hợp thêm một khối, ba màn loại lại tụt lại mà không cổng nào thấy — và đó
 * CHÍNH LÀ cách ba màn loại sinh ra nghèo ở C5: tôi viết "cùng một khuôn" trong
 * khi khuôn tôi chọn là khuôn tối giản nhất.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
await napRender()

function khoiView(html, id) {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}

const MAN_LOAI = BANG.filter((m) => m.menu && m.module)
const trangCua = {}
for (const m of BANG) {
  try { trangCua[m.ten] = await trangHtml(m.ten, { mock: true }) } catch { /* báo dưới */ }
}

console.log("\n1 · Ba màn loại có ĐỦ khối mà màn Tổng hợp có\n")

const vAll = khoiView(trangCua["tat-ca"] ?? "", "all")
ok(vAll.length > 0, "đọc được màn Tổng hợp làm mốc đối chiếu")

// Khối = thứ NGƯỜI DÙNG dùng được, không phải mọi class. Bốn thứ này là bốn
// việc: lọc · sắp · nhìn phân bố · xem lưới.
const KHOI = [
  ['class="fl"', "sidebar lọc"],
  ['class="sortb"', "ba nút sắp xếp"],
  ['class="mb"', "dải số đếm"],
  ['class="grid"', "lưới thẻ"],
]
for (const [dau, ten] of KHOI) {
  ok(vAll.includes(dau), `màn Tổng hợp có ${ten} (mốc)`)
}
for (const m of MAN_LOAI) {
  const v = khoiView(trangCua[m.ten] ?? "", m.id_shell)
  const thieu = KHOI.filter(([dau]) => !v.includes(dau)).map(([, ten]) => ten)
  ok(thieu.length === 0, `màn \`${m.ten}\` có đủ ${KHOI.length} khối`,
    `thiếu: ${thieu.join(" · ")} — bấm từ Tổng hợp sang đây là tụt một bậc`)
}

console.log("\n2 · Dải của màn loại nói số CỦA LOẠI, không nói số cả kho\n")

// Nếu ba dải cùng một con số thì chúng đang in số cả kho — "có dải" không bắt
// được điều đó, chỉ so BA dải với nhau mới bắt được.
const soCua = {}
for (const m of MAN_LOAI) {
  const v = khoiView(trangCua[m.ten] ?? "", m.id_shell)
  const i = v.indexOf('class="mb"')
  soCua[m.ten] = i < 0 ? "(không dải)"
    : (v.slice(i, i + 900).match(/>(\d+)</g) ?? []).join(",")
}
const khac = new Set(Object.values(soCua))
ok(khac.size >= 2,
  `ba dải nói ${khac.size} tập số khác nhau`,
  `cùng một tập ⇒ đang in số CẢ KHO: ${JSON.stringify(soCua)}`)

console.log("\n3 · Trạng thái rỗng KHÔNG nằm trong `.grid`\n")

for (const m of MAN_LOAI) {
  const v = khoiView(trangCua[m.ten] ?? "", m.id_shell)
  const iG = v.indexOf('class="grid"')
  const iE = v.indexOf('class="empty"')
  if (iE < 0) { ok(true, `màn \`${m.ten}\` có bản ghi — không có ô rỗng để đo`); continue }
  const dongG = iG >= 0 ? v.indexOf("</div>", iG) : -1
  ok(!(iG >= 0 && iE > iG && iE < dongG),
    `màn \`${m.ten}\`: chữ "chưa có gì" nằm NGOÀI lưới`,
    "nằm trong lưới ⇒ nó ăn một cột 240px và câu xuống dòng giữa")
}

console.log("\n4 · Panel kéo tới đáy — ảnh nền chỉ còn ở viền\n")

const css = (await taiSan()).gnCss ?? ""
const luatMid = [...css.matchAll(/(?:^|[};])\s*\.mid\{([^}]*)\}/gm)].map((x) => x[1])
ok(luatMid.length > 0, "tìm được luật `.mid`")
ok(luatMid.some((l) => /min-height:[^;]*(vh|dvh|calc)/.test(l)),
  "`.mid` có `min-height` theo chiều cao khung nhìn",
  "không có ⇒ panel cao theo nội dung, và độ dài nội dung quyết định ảnh lộ bao nhiêu")
// KHÔNG đặt trên `.view`: nó bị `display:none` khi không mở nên min-height ở đó
// không giữ được chiều cao nào.
const luatView = [...css.matchAll(/(?:^|[};])\s*\.view\{([^}]*)\}/gm)].map((x) => x[1])
ok(!luatView.some((l) => /min-height:[^;]*(vh|dvh)/.test(l)),
  "  và KHÔNG đặt `min-height` viewport trên `.view`",
  "`.view` không mở thì `display:none` — min-height ở đó là luật không bao giờ chạy")

console.log("\n5 · Nút header + số đếm đổi theo MÀN\n")

/*
 * Vùng đo là `.ph` — THANH TRÊN, không phải `<header class="top">`.
 *
 * Bản đầu của tôi cắt tới `</header>`, và `<header class="top">` là RAIL TRÁI:
 * chữ "viết bài" chưa bao giờ ở đó. Nên CẢ HAI chiều đều xanh vô căn cứ — vế âm
 * xanh vì đo vùng không có gì, vế dương đỏ vì cùng lý do.
 */
const thanhTren = (h) => {
  const i = h.indexOf('class="ph"')
  return i < 0 ? "" : h.slice(i, h.indexOf('<div class="view"', i))
}
for (const m of MAN_LOAI) {
  const dau = thanhTren(trangCua[m.ten] ?? "")
  ok(dau.length > 0, `  đọc được thanh trên của \`${m.ten}\``,
    "không đọc được ⇒ hai phép kiểm dưới chưa đo gì")
  if (m.module === "bai-viet") {
    ok(/viết bài/i.test(dau), `header màn \`${m.ten}\` mời viết bài`)
  } else {
    ok(!/viết bài/i.test(dau),
      `header màn \`${m.ten}\` KHÔNG mời "viết bài"`,
      "nút của module khác đứng trên màn này — đúng 'gộp chung tính năng' bị cấm")
  }
}

console.log("\n6 · Màn nạp tài liệu KHÔNG nói kiến trúc\n")

const vNapTL = khoiView(trangCua["nap-tai-lieu"] ?? "", "naptailieu")
ok(vNapTL.length > 0, "đọc được màn nạp tài liệu")
ok(!/lớp cổng/i.test(vNapTL),
  "màn nạp tài liệu KHÔNG có chữ `lớp cổng`",
  "từ vựng nội bộ — `chu-giao-dien` cấm màn hình nói kiến trúc, và tôi tự thêm nó ở C6a")
ok(/id="tv-ghi"[^>]*class="[^"]*\bpri\b|class="[^"]*\bpri\b[^"]*"[^>]*id="tv-ghi"/.test(vNapTL)
   || /<button[^>]*class="bt pri[^"]*"[^>]*>[^<]*[Gg]hi vào kho/.test(vNapTL),
  "nút ghi vào kho là nút CHÍNH (`.pri`)",
  "hành động chính của màn mà là nút ghost thì thứ bậc ngược — `+ VIẾT BÀI` ở " +
  "header đang đỏ đậm trong khi nút này mờ")


console.log("\n7 · GIỚI HẠN của cổng này, nói ra để không ai tin quá\n")

/*
 * §4 đo CÓ LUẬT `min-height`, không đo panel CÓ CAO tới đáy. Khác biệt đó không
 * phải lý thuyết — nó vừa xảy ra: `.mid` có `min-height` và cổng XANH, trong khi
 * trên trình duyệt `.mid` cao 906/1026px mà `.pn` (khối kính NHÌN THẤY ĐƯỢC) vẫn
 * 278px. `.mid` trong suốt, nên kéo nó cao không làm tờ báo cao thêm một pixel.
 *
 * Dự án không có trình duyệt headless trong `npm test`, nên §4 chỉ canh được
 * CHUỖI BA KHÂU (`.mid` cột flex → `.view.on` ăn phần còn lại → `.pn` giãn).
 * Thiếu một khâu là dây đứt; ba khâu có mặt là điều kiện CẦN, không phải ĐỦ.
 *
 * Số đo THẬT, lấy bằng Playwright trên `/tai-lieu/` (kho 0 tài liệu, khung
 * 1600×1026) sau khi sửa:
 *     panel 722/1026 = 70% khung nhìn   (trước: 278 = 27%)
 *     ảnh nền dưới panel = 20%          (trước: 65%)
 *     #tcount = "0 bài · 0 bản ghi"     (trước: "1 bài · 1 bản ghi")
 *     nút header = "+ nạp tài liệu"     (trước: "+ VIẾT BÀI")
 * Ai sửa ba khâu đó phải đo lại bằng mắt, không đọc màu xanh này là "đã đẹp".
 */
ok(css.includes(".view.on{flex:1") || /\.view\.on\{[^}]*flex:1/.test(css),
  "khâu 2/3: `.view.on` ăn hết phần còn lại của `.mid`",
  "thiếu khâu này thì `.mid` cao mà view vẫn co theo nội dung")
ok(/\.view\.on\s*>\s*\.pn\{[^}]*flex:1/.test(css),
  "khâu 3/3: `.pn` giãn trong view — đây là khối NHÌN THẤY ĐƯỢC",
  "thiếu khâu này thì view cao mà khối kính vẫn ngắn, và ảnh nền vẫn chiếm 2/3")
ok(true, "§7 · giới hạn đã khai: đây là phép kiểm CHUỖI LUẬT, không phải phép đo layout")

chot("ba màn loại đầy đủ · dải nói số của loại · panel kéo đáy · header theo màn")
