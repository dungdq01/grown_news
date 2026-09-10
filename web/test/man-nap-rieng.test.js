#!/usr/bin/env node
/**
 * FR-038/C6a — MỖI LOẠI MỘT MÀN NẠP, và không màn nào mang lối của loại khác.
 *
 * Người dùng chốt: *"các giao diện nạp bài, CRUD cũng cần tách biệt rõ ràng…
 * ko gộp chung các màn và tính năng lại với nhau"*.
 *
 * VẾ NẶNG LÀ CHIỀU ÂM. *"Màn nạp Tài liệu có ô chọn file"* xanh ngay cả khi màn
 * đó mang nguyên cả bốn lối như `/nap/` cũ — tức đúng thứ vừa bị cấm. Vế bắt
 * được là *"màn nạp Tài liệu KHÔNG được chứa form viết bài"*.
 *
 * Kỳ vọng đọc từ `man-hinh.json`; cổng gõ tay lại bảng khai là bản gõ tay thứ hai.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan, tatCaTrang, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
await napRender()

/** Khối `<div class="view" id="v-…">` — cắt tới view kế tiếp hoặc hết `<main>`. */
function khoiView(html, id) {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}

/*
 * DẤU NHẬN BIẾT của mỗi lối — chọn thứ chỉ lối đó mới có, không chọn chữ hiển
 * thị. Chữ đổi được mà không đổi hành vi; `id`/`data-` là hợp đồng.
 */
const DAU = {
  viet: '<form class="np-form api-only" id="f-bai"',   // form viết bài 9 KB
  hienVat: 'id="up-tv-f"',                             // ô chọn file hiện vật
  link: 'data-napview="link"',
  file: 'data-napview="file"',
}

// Render MOI man mot lan — dung lai o §2 va §5. Render hai lan la hai co hoi
// de hai muc doc hai thu khac nhau.
const trangCua = {}
for (const m of BANG) {
  try { trangCua[m.ten] = await trangHtml(m.ten, { mock: true }) } catch { /* §2 bao */ }
}

console.log("\n1 · Bảng khai — hai màn nạp riêng, KHÔNG còn `/nap/` chung\n")

const ten = new Set(BANG.map((m) => m.ten))
ok(ten.has("nap-bai-viet"), "bảng khai có `nap-bai-viet`")
ok(ten.has("nap-tai-lieu"), "bảng khai có `nap-tai-lieu`")
ok(!ten.has("nap"),
  "bảng khai KHÔNG còn màn `/nap/` chung",
  "giữ nó là BỐN màn nạp cho ba loại — đúng 'gộp chung màn' người dùng cấm")
for (const t of ["nap-bai-viet", "nap-tai-lieu"]) {
  const m = BANG.find((x) => x.ten === t)
  ok(m?.menu === false, `  \`${t}\` KHÔNG lên thanh menu`)
  ok(m?.cat_khi_khac === true, `  \`${t}\` bị cắt khỏi trang khác`,
    "không cắt ⇒ mỗi trang mang cả hai màn nạp, +16 KB HTML")
  ok(!!m?.module, `  \`${t}\` khai \`module\` của nó (được ${m?.module})`)
}

console.log("\n2 · CHIỀU ÂM — không màn nạp nào mang lối của loại khác\n")

const mNapBai = BANG.find((m) => m.ten === "nap-bai-viet")
const mNapTL = BANG.find((m) => m.ten === "nap-tai-lieu")

let hBai = "", hTL = ""
try { hBai = await trangHtml("nap-bai-viet", { mock: true }) } catch (e) {
  ok(false, "màn `nap-bai-viet` render được", String(e.message ?? e))
}
try { hTL = await trangHtml("nap-tai-lieu", { mock: true }) } catch (e) {
  ok(false, "màn `nap-tai-lieu` render được", String(e.message ?? e))
}

const vBai = khoiView(hBai, mNapBai?.id_shell ?? "napbaiviet")
const vTL = khoiView(hTL, mNapTL?.id_shell ?? "naptailieu")

ok(vBai.length > 0, `khối \`v-${mNapBai?.id_shell}\` có trong trang của nó (${vBai.length} ký tự)`)
ok(vTL.length > 0, `khối \`v-${mNapTL?.id_shell}\` có trong trang của nó (${vTL.length} ký tự)`)

// Bài viết: BA lối nhận một BẢN PHÂN TÍCH — dán link, nộp .md, tự viết.
ok(vBai.includes(DAU.viet), "màn nạp Bài viết CÓ form viết bài")
ok(vBai.includes(DAU.link), "  và lối dán link")
ok(vBai.includes(DAU.file), "  và lối nộp file .md")
ok(!vBai.includes(DAU.hienVat),
  "màn nạp Bài viết KHÔNG có ô chọn hiện vật",
  "còn ô đó nghĩa là lối tài liệu vẫn nằm chung — chưa tách")

// Tài liệu: MỘT lối, nhận một HIỆN VẬT + nhãn.
ok(vTL.includes(DAU.hienVat), "màn nạp Tài liệu CÓ ô chọn hiện vật")
ok(!vTL.includes(DAU.viet),
  "màn nạp Tài liệu KHÔNG có form viết bài",
  "form 9 KB của bài phân tích không thuộc màn nạp một file PDF")
ok(!vTL.includes(DAU.link) && !vTL.includes(DAU.file),
  "màn nạp Tài liệu KHÔNG có lối dán link / nộp .md")

console.log("\n3 · `cat_khi_khac` — màn nạp CHỈ nằm trên trang của nó\n")

const trang = await tatCaTrang()
for (const m of BANG.filter((x) => x.cat_khi_khac)) {
  const rieng = m.path.replace(/^\/|\/$/g, "")
  const lot = []
  for (const [ten2, html] of trang) {
    const cuaNo = ten2.replace(/^mock\//, "").replace(/index\.html$/, "")
      .replace(/\/$/, "") === rieng
    if (!cuaNo && html.includes(`id="v-${m.id_shell}"`)) lot.push(ten2)
  }
  ok(lot.length === 0, `\`v-${m.id_shell}\` chỉ có ở /${rieng}/`,
    `lọt sang: ${lot.slice(0, 4).join(" · ")}`)
}

console.log("\n4 · Không nút nào trỏ vào một màn không tồn tại\n")

const shell = readFileSync(join(GOC, "web", "render", "shell.html"), "utf8")
const navKhai = new Set(BANG.map((m) => m.data_nav).filter(Boolean))
const navDung = [...new Set(
  [...shell.matchAll(/data-nav="([a-z]+)"/g)].map((m2) => m2[1]))]
const chet = navDung.filter((n) => !navKhai.has(n)).sort()
ok(chet.length === 0, `${navDung.length} \`data-nav\` trong shell đều có màn thật`,
  `trỏ vào màn không tồn tại: ${chet.join(" · ")} — bỏ màn mà để nút trỏ vào nó `
  + "là một nút chết")

console.log("\n5 · Màn ĐANG MỞ phải là màn của URL — cả SSR lẫn sau khi FE chạy\n")

/*
 * LỖ CỦA CHÍNH CỔNG NÀY, tìm ra bằng TRÌNH DUYỆT chứ không bằng test.
 *
 * §2 hỏi *"khối `v-naptailieu` có trong DOM không"* — và câu đó XANH trong khi
 * `/tai-lieu/nap/` hiện màn DANH SÁCH tài liệu. Tiêu đề trang nói "Nạp tài
 * liệu", thân trang nói "Chưa có tài liệu nào". Có mặt trong tài liệu ≠ được
 * HIỆN.
 *
 * Gốc: `manTuUrl()` lấy `p.split("/")[0]`, nên `/tai-lieu/nap/` cho `tai-lieu`
 * và khớp màn danh sách. SSR đặt đúng `v-naptailieu.on`, rồi `khoiDong()` gọi
 * `doiView(manTuUrl())` và GHI ĐÈ.
 *
 * Hai vế dưới đây canh hai tầng khác nhau — SSR (chuỗi `view on`) và FE (phép
 * khớp đường). Chỉ canh một tầng thì tầng kia sửa lại được mà không ai thấy.
 */
for (const m of BANG) {
  const h = trangCua[m.ten]
  if (!h) continue
  const dangMo = [...h.matchAll(/<div class="view on" id="v-([a-z]+)"/g)].map((x) => x[1])
  ok(dangMo.length === 1 && dangMo[0] === m.id_shell,
    `SSR /${m.path.replace(/^\//, "")} mở đúng \`v-${m.id_shell}\``,
    `đang mở: ${dangMo.join(" · ") || "(không màn nào)"}`)
}

// FE: phép khớp đường phải lấy đường DÀI NHẤT. `startsWith` một mình không đủ —
// `/tai-lieu/nap/` bắt đầu bằng `tai-lieu` nên nó khớp CẢ HAI, và thứ quyết định
// là cái nào được chọn.
const js = (await taiSan()).gnJsNguon ?? ""
// `function manTuUrl`, KHONG chi `manTuUrl`: ban dau toi tim ten tran va trung
// mot CHO GOI nam truoc dinh nghia, nen cua so 700 ky tu khong chua than ham va
// hai phep kiem do oan. Cat than ham bang moc rieng cua no.
const iFn = js.indexOf("function manTuUrl")
const NL = String.fromCharCode(10)   // khong mot dau gach cheo nao
const than = iFn > 0 ? js.slice(iFn, js.indexOf(NL + "}", iFn) + 2) : ""
ok(iFn > 0, "tim duoc than ham `manTuUrl` trong bundle",
  "khong tim duoc ⇒ hai phep kiem duoi day chua do gi")
ok(/\.length\s*-\s*\w+\[\w+\]\.length|length - DUONG|sort\(/.test(than),
  "`manTuUrl` SẮP theo độ dài rồi lấy khớp dài nhất",
  "chỉ `split(\"/\")[0]` hoặc `find` đầu tiên ⇒ đường lồng nhau rơi về màn cha")
ok(than.includes('+ "/"') || than.includes("+ '/'"),
  "  và khớp có ranh giới `/` — không khớp tiền tố chuỗi trần",
  "`startsWith(\"video\")` khớp cả `videoclip` nếu có màn tên đó")

chot("hai màn nạp riêng · không lối nào lẫn · cắt đúng trang · màn đang mở khớp URL")
