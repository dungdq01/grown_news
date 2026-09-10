#!/usr/bin/env node
/**
 * WO-014 — "phân loại" và "loại nguồn" là HAI chiều, không một ô.
 *
 * Người dùng, kèm hai ảnh chụp: *"chúng ta đang nhầm mục loại nguồn và phân
 * loại… trong trang danh sách tổng hợp, các key như video, tai-lieu, bài viết
 * KHÔNG THỂ để chung chỗ loại nguồn như tiktok / youtube / article / paper"*.
 *
 * VẾ NẶNG: **ba tập KHÔNG GIAO NHAU.** Nếu phép suy rơi về `source_type` cho mọi
 * module thì `/video/` vẫn có facet "video" và mọi phép kiểm "có facet" đều xanh
 * — trong khi sidebar vẫn vô nghĩa đúng như ảnh chụp. Chỉ *"tập của video KHÔNG
 * chứa `article`, và tập của bài viết KHÔNG chứa `youtube`"* mới bắt được.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const NHOM = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module
await napRender()

function khoiView(html, id) {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}

/** Các giá trị của MỘT nhóm facet trong một khối view. */
function facet(khoi, khoa) {
  return [...new Set([...khoi.matchAll(
    new RegExp(`data-loc="${khoa}" data-gt="([^"]+)"`, "g"))].map((m) => m[1]))]
}

const trangCua = {}
for (const m of BANG) {
  try { trangCua[m.ten] = await trangHtml(m.ten, { mock: true }) } catch { /* báo dưới */ }
}

console.log("\n1 · Màn TRỘN — facet là PHÂN LOẠI, không phải loại nguồn\n")

const TEN_NHOM = NHOM.map((m) => m.ten)
const MOI_LOAI = NHOM.flatMap((m) => m.loai)

for (const m of BANG.filter((x) => x.tron && x.menu)) {
  const v = khoiView(trangCua[m.ten] ?? "", m.id_shell)
  if (!v.includes('class="fl"')) { ok(true, `màn \`${m.ten}\` không có sidebar lọc — bỏ qua`); continue }
  const pl = facet(v, "pl")
  ok(pl.length > 0, `màn \`${m.ten}\` có facet PHÂN LOẠI`,
    "không có ⇒ facet duy nhất đang là `source_type`, tức trộn hai chiều")
  const la = pl.filter((x) => !TEN_NHOM.includes(x)).sort()
  ok(la.length === 0, `  chỉ chứa tên MODULE (${TEN_NHOM.join(" · ")})`,
    `lẫn: ${la.join(" · ")} — đúng thứ người dùng chỉ vào`)
}

console.log("\n2 · Ba màn loại — facet LOẠI NGUỒN của module đó\n")

const tapCua = {}
for (const m of BANG.filter((x) => x.menu && x.module)) {
  const v = khoiView(trangCua[m.ten] ?? "", m.id_shell)
  const ng = facet(v, "nguon")
  tapCua[m.module] = ng
  ok(ng.length > 0, `màn \`${m.ten}\` có facet LOẠI NGUỒN (${ng.join(" · ")})`,
    "rỗng ⇒ chưa tách chiều, hoặc kho mẫu chưa có bản nào của loại này")
}

// Bài viết: loại nguồn CHÍNH LÀ `source_type` của nhóm đó.
const loaiBaiViet = NHOM.find((m) => m.ten === "bai-viet").loai
const ngBv = tapCua["bai-viet"] ?? []
ok(ngBv.every((x) => loaiBaiViet.includes(x)),
  `\`bai-viet\` chỉ chứa loại nguồn của nó (${loaiBaiViet.join(" · ")})`,
  `được: ${ngBv.join(" · ")}`)

// Tài liệu / video: KHÔNG được là tên module, và KHÔNG được là `source_type`
// của bài viết. Đây là vế bắt được "rơi về source_type".
for (const nhom of ["tai-lieu", "video"]) {
  const ng = tapCua[nhom] ?? []
  ok(!ng.includes(nhom),
    `\`${nhom}\` KHÔNG lấy chính tên module làm loại nguồn`,
    `được: ${ng.join(" · ")} — một dòng "${nhom}" trong sidebar "${nhom}" là vô nghĩa`)
  const lan = ng.filter((x) => loaiBaiViet.includes(x))
  ok(lan.length === 0, `  và KHÔNG lẫn loại nguồn của bài viết`,
    `lẫn: ${lan.join(" · ")}`)
}

console.log("\n3 · BA TẬP KHÔNG GIAO NHAU — vế bắt được 'rơi về source_type'\n")

const ten = Object.keys(tapCua)
for (let i = 0; i < ten.length; i++) {
  for (let j = i + 1; j < ten.length; j++) {
    const giao = (tapCua[ten[i]] ?? []).filter((x) => (tapCua[ten[j]] ?? []).includes(x))
    ok(giao.length === 0, `\`${ten[i]}\` ∩ \`${ten[j]}\` rỗng`,
      `chung: ${giao.join(" · ")} — hai module không thể có cùng một loại nguồn`)
  }
}

console.log("\n4 · Thẻ mang CẢ HAI chiều, và `data-loai` GIỮ nghĩa cũ\n")

const vAll = khoiView(trangCua["tat-ca"] ?? "", "all")
const the1 = /<button[^>]*class="cd[^"]*"[^>]*>/.exec(vAll)?.[0] ?? ""
ok(the1.length > 0, "đọc được một thẻ trên màn Tổng hợp")
for (const [k, vs] of [["data-pl", "phân loại"], ["data-nguon", "loại nguồn"]]) {
  ok(the1.includes(k), `thẻ mang \`${k}\` (${vs})`,
    `được: ${the1.slice(0, 200)}`)
}
const dLoai = /data-loai="([^"]*)"/.exec(the1)?.[1]
ok(MOI_LOAI.includes(dLoai),
  `\`data-loai\` GIỮ nghĩa \`source_type\` (được ${dLoai})`,
  "đổi nghĩa nó là phá `bay-man` §3-5 · `nut-song` · `ui-ba-man` vì lý do không liên quan")

console.log("\n5 · MỘT phép suy, không hai công thức\n")

const src = readFileSync(join(GOC, "web", "render", "trang.mjs"), "utf8")
const soHam = (src.match(/function nguonCua\b/g) ?? []).length
ok(soHam === 1, `đúng MỘT hàm \`nguonCua\` trong trang.mjs (thấy ${soHam})`,
  "hai phép suy cho cùng một nhãn là hai chỗ để lệch — lớp lỗi `dongBoThe`")
const js = readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8")
// Đo ĐÚNG thứ muốn nói: FE không có HÀM tính nhãn nguồn. Bản đầu của tôi cấm
// `video_host` đứng gần `mime` — và nó bắt oan `xemTruocHienVat`, nơi dùng cả
// hai một cách hợp lệ để XEM TRƯỚC. Một phép kiểm cấm theo khoảng cách chuỗi
// không phân biệt được hai việc khác nhau tình cờ dùng chung hai tên.
ok(!/function nguonCua|const nguonCua/.test(js),
  "FE KHÔNG có hàm tính nhãn nguồn — nó lọc theo `data-nguon` trong markup",
  "một bản thứ hai bằng JS là đúng lớp lỗi `dongBoThe`")
ok(/TANG = \[[^\]]*"nguon"/.test(js) && /TANG = \[[^\]]*"pl"/.test(js),
  "  FE khai `pl` và `nguon` là hai tầng lọc",
  "thiếu ⇒ bấm một nút facet mới không ăn, và không lời nào")

chot("hai chiều tách bạch · ba tập rời nhau · một phép suy · data-loai giữ nghĩa")
