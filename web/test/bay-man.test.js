#!/usr/bin/env node
/**
 * FR-038/C5 — BẢY MÀN, và chỉ hai trong số đó được trộn danh sách.
 *
 * Người dùng chốt nguyên văn: *"thanh menu cần phân biệt rõ: 1 tổng hợp,
 * 2 bài viết, 3 tài liệu, 4 video (cùng với đó màn dashboard, kho, tổng hợp bài
 * hay danh mục cũng cần giữ lại)"* và *"Chỉ có màn kho và tổng hợp là để chung
 * danh sách bài viết, tài liệu, video"*.
 *
 * CHIỀU ÂM LÀ VẾ NẶNG. "Màn Video có video" xanh ngay cả khi màn Video hiện CẢ
 * KHO — đó chính là kiến trúc người dùng vừa bác bỏ. Vế bắt được là *"màn Video
 * KHÔNG được có một thẻ `paper` nào"*.
 *
 * KỲ VỌNG ĐỌC TỪ `man-hinh.json`, không gõ tay lại. Một cổng gõ tay lại bảng khai
 * là bản gõ tay thứ hai — đúng thứ `check_khai_mot_noi` §3 sinh ra để cấm, và nó
 * sẽ lệch đúng vào hôm bảng khai đổi.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const NHOM_LOAI = Object.fromEntries(JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8"))
  .module.map((m) => [m.ten, m.loai]))

/*
 * FR-041 · pane "Theo loại nguồn" của Kho giờ khai loại THẬT (pdf · youtube ·
 * repo…) thay vì tên bảng — người dùng chỉ thẳng bug đó bằng ảnh. Phép đo
 * nhóm phải hiểu cả hai tầng, nên dựng map TINH→nhóm từ CÙNG hai bảng khai mà
 * render dùng (loai-nguon.json + media-mime.json) — không gõ tay danh sách.
 */
const MEDIA_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const NHOM_TINH = Object.fromEntries(
  Object.entries(NHOM_LOAI).flatMap(([m, ds]) => ds.map((l) => [l, m])))
for (const l of MEDIA_BANG.loai) NHOM_TINH[l.duoi.replace(".", "")] = "tai-lieu"
NHOM_TINH[MEDIA_BANG.mac_dinh.duoi.replace(".", "")] = "tai-lieu"
for (const h of MEDIA_BANG.video_host) NHOM_TINH[h.nhan] = "video"
NHOM_TINH["tai-len"] = "video"

const { ok, chot } = (await import("./_api.mjs")).taoKiem()
await napRender()

/** Khối `<div class="view" id="v-…">` của MỘT màn, cắt tới view kế tiếp. */
function khoiView(html, id) {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}

/*
 * TẬP loại xuất hiện trong một khối view — BA hình dạng, vì màn dùng ba bộ dựng:
 *   `the()`  thẻ, có `data-loai`                      (Trang chủ · Tổng hợp)
 *   `dong()` dòng, chỉ có phù hiệu `tg()`
 *   `.bl`    nhãn cột của biểu đồ "Theo loại nguồn"   (Kho)
 *
 * Đọc thiếu một hình dạng là một màn trả về RỖNG và mọi phép kiểm về nó xanh vô
 * căn cứ. Đo được trước khi viết: `v-kho` có **0** `data-loai` và **0** `tg` trên
 * 8476 byte — nó khai loại qua biểu đồ. Một cổng chỉ đọc `data-loai` sẽ báo
 * "Kho trộn 0 nhóm" và tôi suýt sửa MÀN thay vì sửa PHÉP ĐO.
 *
 * Lọc theo `MOI_LOAI`: `.bl` cũng là nhãn của biểu đồ chủ đề/khái niệm, và những
 * nhãn đó không phải source_type.
 *
 * Trả TẬP chứ không trả danh sách: một thẻ mang CẢ `data-loai` lẫn `tg` nên đếm
 * thì gấp đôi — và một con số gấp đôi ở hai vế của một phép so vẫn "khớp",
 * tức phép so đó không đo cái nó nói.
 */
const MOI_LOAI = new Set(Object.values(NHOM_LOAI).flat())
function loaiTrong(khoi) {
  const ra = new Set()
  // FR-041 · biểu đồ "Theo loại nguồn" của Kho đổi từ bar (`.bl`) sang lưới ô
  // — loại giờ khai ở LEGEND `.tp-r .l`. Mẫu này chỉ ăn tên trong MOI_LOAI nên
  // các hàng legend khác ("trên site"…) không lọt.
  for (const re of [/data-loai="([a-z-]+)"/g,
                    /<i class="tg"><b [^>]*>([a-z-]+)<\/b>/g,
                    /<span class="bl">([a-z-]+)<\/span>/g,
                    /<span class="l">([a-z-]+)<\/span>/g]) {
    for (const m of khoi.matchAll(re)) {
      // nhận cả loại THÔ (source_type) lẫn loại TINH (pdf/youtube…) — FR-041
      if (MOI_LOAI.has(m[1]) || NHOM_TINH[m[1]]) ra.add(m[1])
    }
  }
  return ra
}

/** Số bản ghi hiện trong khối — thẻ và dòng đều mang `data-slug`. */
const soBanGhi = (khoi) => (khoi.match(/data-slug="/g) ?? []).length

const nhomCua = (loai) => NHOM_TINH[loai] ?? `?${loai}`

console.log("\n1 · Mỗi màn trong bảng khai render được, mang đúng tiêu đề\n")

const trang = {}
for (const m of BANG) {
  let html = ""
  try {
    html = await trangHtml(m.ten, { mock: true })
  } catch (e) {
    ok(false, `màn \`${m.ten}\` render được`, String(e.message ?? e))
    continue
  }
  trang[m.ten] = html
  ok(html.length > 0, `màn \`${m.ten}\` render được (${(html.length / 1024).toFixed(0)} KB)`)
  ok(html.includes(`<title>${m.tieu_de} `) || html.includes(`<title>${m.tieu_de}<`),
    `  \`${m.ten}\` mang tiêu đề khai "${m.tieu_de}"`,
    `được ${/<title>([^<]*)</.exec(html)?.[1]}`)
  ok(khoiView(html, m.id_shell).length > 0,
    `  \`${m.ten}\` có khối \`v-${m.id_shell}\` trong DOM`,
    "màn bị cắt khỏi chính trang của nó — kiểm `cat_khi_khac` / catNap()")
}

console.log("\n2 · Thanh menu — bảy tab, hai nhóm 4 + 3\n")

// Đọc shell NGUỒN, không đọc trang đã render: `doiView()` chèn
// `aria-current="true"` vào GIỮA `class` và `data-nav` của tab đang mở, nên đếm
// trên trang render ra 3 chứ không 4. `rail-trai.test.js` cũng đọc shell nguồn.
const shell = readFileSync(join(GOC, "web", "render", "shell.html"), "utf8")
const tabs = [...shell.matchAll(
  /<button class="tb[^"]*"([^>]*)data-nav="([a-z]+)"([^>]*)>/g)]
const menuKhai = BANG.filter((m) => m.menu)
ok(tabs.length === menuKhai.length,
  `shell có ${tabs.length} tab, bảng khai có ${menuKhai.length}`,
  `lệch: shell ${tabs.map((t) => t[2]).join(",")}`)

const navShell = new Set(tabs.map((t) => t[2]))
for (const m of menuKhai) {
  ok(navShell.has(m.data_nav), `tab \`${m.data_nav}\` (${m.nhan}) có trong shell`)
}

/*
 * Nhóm đọc từ THẺ BAO `.tbg`, không từ thuộc tính của nút — và đó là ràng buộc
 * ĐO ĐƯỢC, không phải sở thích. Hai regex của `rail-trai.test.js` kẹp chặt thẻ
 * nút từ hai phía:
 *   :167  class="tb[^"]*" data-nav="[a-z]+"          → data-nav LIỀN sau class
 *   :137  data-nav="[a-z]+" data-i18n="nav\.[a-z]+"> → data-i18n LIỀN sau, rồi ">"
 * Nhét `data-nhom` vào nút làm đứt một trong hai, và cái đứt đó IM LẶNG: nhãn
 * rời khỏi phép đo độ dài rồi `soTab` tụt xuống dưới 4.
 *
 * Đọc từ markup chứ không suy từ THỨ TỰ: suy từ thứ tự thì đảo hai tab là hai
 * nhóm sai mà không phép kiểm nào thấy.
 */
const nhomTab = {}
for (const g of shell.matchAll(
  /<div class="tbg" data-nhom="([a-z]+)"[\s\S]*?<\/div>/g)) {
  for (const t of g[0].matchAll(/data-nav="([a-z]+)"/g)) nhomTab[t[1]] = g[1]
}
for (const m of menuKhai) {
  ok(nhomTab[m.data_nav] === m.nhom,
    `  \`${m.data_nav}\` thuộc nhóm \`${m.nhom}\``,
    `được ${JSON.stringify(nhomTab[m.data_nav])}`)
}
for (const g of ["noidung", "hethong"]) {
  const cho = menuKhai.filter((m) => m.nhom === g).length
  const co = Object.values(nhomTab).filter((x) => x === g).length
  ok(co === cho, `nhóm \`${g}\` có ${co} tab (bảng khai: ${cho})`)
}

// Mỗi tab một icon — `rail-trai.test.js:174` đòi `iconMask >= soTab`, nên ba tab
// mới không có icon là ĐỎ ở đó. Nhắc lại ở đây để lời lỗi nói đúng màn nào thiếu.
const css = (await taiSan()).gnCss ?? ""
for (const m of menuKhai) {
  ok(css.includes(`.tb[data-nav="${m.data_nav}"]::before{mask-image:url("data:image/svg`),
    `  tab \`${m.data_nav}\` có icon trong CSS`,
    "tab thiếu icon đọc ra như một mục lỗi giữa các mục có icon")
}

console.log("\n3 · CHIỀU ÂM — ba màn loại KHÔNG được lẫn loại khác\n")

// `menu &&` bat buoc: tu C6a hai man NAP cung khai `module`, va man nap khong
// phai man danh sach. Cung phep phan biet ma `trang.mjs` dung.
const manLoai = BANG.filter((m) => m.menu && m.module)
ok(manLoai.length === 3, `bảng khai có ${manLoai.length} màn loại`)
for (const m of manLoai) {
  const khoi = khoiView(trang[m.ten] ?? "", m.id_shell)
  const co = [...loaiTrong(khoi)]
  ok(soBanGhi(khoi) > 0, `màn \`${m.ten}\` có bản ghi (${soBanGhi(khoi)})`,
    "rỗng ⇒ hoặc màn chưa dựng hoặc lọc sai — cả hai phải đỏ")
  const la = co.filter((l) => !NHOM_LOAI[m.module].includes(l)).sort()
  ok(la.length === 0, `  \`${m.ten}\` KHÔNG lẫn loại nhóm khác`,
    `lẫn: ${la.map((l) => `${l}(${nhomCua(l)})`).join(" · ")} — màn loại đang hiện cả kho`)
}

console.log("\n4 · CHIỀU DƯƠNG — chỉ Tổng hợp và Kho được TRỘN\n")

for (const ten of ["tat-ca", "kho"]) {
  const m = BANG.find((x) => x.ten === ten)
  const co = [...loaiTrong(khoiView(trang[ten] ?? "", m.id_shell))]
  const nhomCo = [...new Set(co.map(nhomCua))].sort()
  ok(nhomCo.length >= 2,
    `màn \`${ten}\` trộn ${nhomCo.length} nhóm: ${nhomCo.join(" · ")}`,
    "người dùng chốt HAI màn này để chung danh sách cả ba loại")
  ok(m.tron === true, `  bảng khai đánh dấu \`${ten}\` là màn TRỘN`)
}

console.log("\n5 · Ba màn loại đọc ĐÚNG kho, không đọc một tập con cứng\n")

// HỢP tập loại của ba màn loại phải BẰNG tập loại của màn Tổng hợp. Thiếu nghĩa
// là một loại rơi ra ngoài cả bốn màn và KHÔNG màn nào báo — đúng lớp lỗi "view
// thiếu một nhánh" mà `check_ba_bang` canh ở tầng SQL.
//
// So TẬP, không so số đếm: một thẻ mang cả `data-loai` lẫn `tg` nên số đếm gấp
// đôi ở CẢ HAI vế và phép so vẫn "khớp" — tức nó không đo cái nó nói.
const tapAll = loaiTrong(khoiView(trang["tat-ca"] ?? "", "all"))
const tapLoai = new Set(manLoai.flatMap(
  (m) => [...loaiTrong(khoiView(trang[m.ten] ?? "", m.id_shell))]))
const hut = [...tapAll].filter((l) => !tapLoai.has(l)).sort()
const thua = [...tapLoai].filter((l) => !tapAll.has(l)).sort()
ok(hut.length === 0, `mọi loại của Tổng hợp có mặt trên một màn loại`,
  `hụt: ${hut.map((l) => `${l}(${nhomCua(l)})`).join(" · ")} — loại này không màn nào hiện`)
ok(thua.length === 0, `không màn loại nào hiện loại mà Tổng hợp không có`,
  `thừa: ${thua.join(" · ")}`)

chot("bảy màn đủ · menu hai nhóm · ba màn loại thuần · chỉ Tổng hợp+Kho trộn")
