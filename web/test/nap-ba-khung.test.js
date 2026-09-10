#!/usr/bin/env node
/**
 * WO-017 — ba khung nạp riêng, và MỘT BUG SỐNG không cổng nào thấy.
 *
 * ĐO ĐƯỢC trên Chromium, `/bai-viet/nap/`: bấm "Tự viết bài" **không làm gì**.
 * Ba panel giữ `link=HIỆN · file=ẩn · viet=ẩn`, `aria-selected` không đổi,
 * `#f-bai` vẫn `hidden`. Tức **hai trong ba lối nạp bài viết không vào được**, và
 * người dùng không viết được bài nào qua web.
 *
 * Gốc: `data-naptab` chỉ còn trong `shell.html` và các bản build CŨ (`site/`,
 * `test/_probe/`) — `multiwindow.inline.ts` hiện **không có handler nào**. Nó mất
 * khi một lần `git checkout --` phá file đó; bản khôi phục từ build là bản
 * TRƯỚC khi handler được thêm.
 *
 * VÌ SAO 66 FILE TEST BỎ LỌT: `cac-man-con-lai` và `thu-vien-nap` có nhắc chuỗi
 * `naptab`, nhưng chúng kiểm MARKUP — "nút có trong DOM", "panel có trong DOM".
 * Cả hai đúng. Thứ sai là KHÔNG AI NỐI chúng lại, và markup không nói được điều
 * đó. Nên cổng này đòi song ánh tab↔panel VÀ đòi bundle có đường nối.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()
const AS = await taiSan()
const JS = AS.gnJs ?? ""

const BANG_MAN = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
/*
 * "Màn nạp" != "màn bị cắt": proxy `cat_khi_khac` từng vỡ khi một màn thường
 * (T03-90, đã gỡ) cũng cắt-khi-khác để giữ page-weight — và đợt hai sẽ thêm
 * màn như thế nữa. Lọc theo NGHĨA: màn nạp là màn CÓ `module` và bị cắt.
 */
const MAN_NAP = BANG_MAN.filter((m) => m.cat_khi_khac && m.module)
const MAN_LOAI = BANG_MAN.filter((m) => m.menu && m.module)

/** Cắt một view — mốc là view KẾ TIẾP, không phải `</main>`. */
function vungMan(html, idShell) {
  const mo = `id="v-${idShell}"`
  const i = html.indexOf(mo)
  if (i < 0) return ""
  const sau = html.slice(i + mo.length)
  const j = sau.search(/id="v-[a-z]+"/)
  return j < 0 ? sau.slice(0, sau.indexOf("</main>")) : sau.slice(0, j)
}

console.log("\n1 · Dải lối phải NỐI được — tab có handler, tab↔panel song ánh\n")

ok(MAN_NAP.length >= 3, `bảng khai có ${MAN_NAP.length} màn nạp`,
  "dưới 3 ⇒ một module không có đường nạp và cổng dưới đo trên tập thiếu")

/*
 * Bundle phải có đường nối. "Có nút trong DOM" là markup; "bấm được" là hành vi.
 * Đây là chỗ 66 file test bỏ lọt đúng một bug người dùng thấy ngay.
 */
ok(/data-naptab/.test(JS), "bundle ĐỌC `data-naptab`",
  "không đọc ⇒ ba tab là ba hình vẽ; đo được trên trình duyệt: bấm "
  + "'Tự viết bài' không làm gì, `#f-bai` vẫn `hidden`")
/*
 * ĐO CƠ CHẾ, KHÔNG ĐO CHUỖI. Bản đầu tìm chuỗi `napview` trong bundle — và một
 * bản cài đặt ĐÚNG dựng selector từ biến (`[data-${kho}view]`) nên chuỗi đó
 * KHÔNG tồn tại. Cổng đỏ trong khi trình duyệt đã xác nhận bấm là chuyển panel.
 *
 * Điều thật sự phải đúng: có một chỗ đặt `hidden` cho phần tử chọn theo thuộc
 * tính `…view`. Nhận cả hai hình dạng — gõ thẳng hoặc dựng từ biến.
 */
/*
 * VA PHAI DO TRONG DUNG THAN HAM. Ban truoc noi hai dieu kien tren CA BUNDLE:
 * `.hidden =` con xuat hien o nhieu ham khac, nen bo hang dat panel trong
 * `moTab` ma cong VAN XANH — kiem hai chieu bat duoc dung ca do.
 */
const iMT = JS.search(/function moTab/)
const thanMT = (() => {
  if (iMT < 0) return ""
  const b = JS.indexOf("{", iMT)
  let sau = 0
  for (let k = b; k < JS.length; k++) {
    if (JS[k] === "{") sau++
    else if (JS[k] === "}") { sau--; if (!sau) return JS.slice(b, k + 1) }
  }
  return ""
})()
ok(thanMT.length > 0, "tim duoc than `moTab` trong bundle",
  "khong co ham chuyen tab nao ⇒ moi tab la mot hinh ve")
const coDatPanel = /querySelectorAll[^)]*view/.test(thanMT)
  && /\.hidden\s*=/.test(thanMT)
ok(coDatPanel, "bundle ĐẶT `hidden` cho panel chọn theo thuộc tính `…view`",
  "đọc tab mà không đặt panel ⇒ `aria-selected` đổi mà không gì hiện ra")

// Song ánh: mỗi tab một panel, mỗi panel một tab — trong TỪNG màn nạp.
for (const m of MAN_NAP) {
  const h = await trangHtml(m.ten, { mock: true })
  const v = vungMan(h, m.id_shell)
  ok(v.length > 300, `vùng \`v-${m.id_shell}\` ${v.length} byte`)
  const tab = [...v.matchAll(/data-naptab="([a-z]+)"/g)].map((x) => x[1])
  const pan = [...v.matchAll(/data-napview="([a-z]+)"/g)].map((x) => x[1])
  ok(tab.length > 0, `  \`/${m.ten}/\` có ${tab.length} lối`,
    "0 lối ⇒ màn không nói người dùng có mấy đường vào")
  ok(JSON.stringify([...tab].sort()) === JSON.stringify([...pan].sort()),
    `  \`/${m.ten}/\` tab↔panel song ánh`,
    `tab [${[...tab].sort()}] · panel [${[...pan].sort()}] — tab không panel là `
    + "bấm vào thấy vùng trắng; panel không tab là nội dung không ai vào được")
  // Đúng MỘT panel mở sẵn.
  const dong = (v.match(/data-napview="[a-z]+"[^>]*hidden/g) ?? []).length
  ok(dong === pan.length - 1,
    `  ${dong}/${pan.length} panel đóng sẵn — đúng MỘT mở`,
    "hơn một mở ⇒ hai lối hiện cùng lúc; không cái nào mở ⇒ màn trắng")
}

console.log("\n2 · Ba khung RIÊNG — tên của module, không tên chung\n")

for (const m of MAN_NAP) {
  const h = await trangHtml(m.ten, { mock: true })
  const v = vungMan(h, m.id_shell)
  const tieuDe = (v.match(/<h2[^>]*>([^<]+)<\/h2>/) ?? [])[1] ?? ""
  ok(tieuDe.trim().length > 0, `\`/${m.ten}/\` có tiêu đề panel: "${tieuDe}"`)
  ok(!/^nạp nguồn$/i.test(tieuDe.trim()),
    `  tiêu đề KHÔNG phải tên chung "Nạp nguồn"`,
    `được "${tieuDe}" — ba màn của ba module mà một màn mang tên chung thì `
    + "người dùng không biết mình đang nạp gì")
}
// Ba tiêu đề phải KHÁC NHAU: cùng tên là ba màn đọc như một màn.
const tieu = []
for (const m of MAN_NAP) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.id_shell)
  tieu.push(((v.match(/<h2[^>]*>([^<]+)<\/h2>/) ?? [])[1] ?? "").trim())
}
ok(new Set(tieu).size === tieu.length, `${tieu.length} tiêu đề khác nhau`,
  `được [${tieu.join(" | ")}]`)

console.log("\n3 · Ba dải lối ĐỘC LẬP — sửa dải này không đổi dải kia\n")

/*
 * CA ÂM quan trọng nhất. Nếu ba màn dùng CHUNG một dải (cùng khối HTML, chỉ đổi
 * chữ) thì mọi phép kiểm §1-§2 vẫn xanh, trong khi thêm một lối cho tài liệu là
 * thêm cho cả bài viết — đúng "gộp chung tính năng" người dùng cấm.
 *
 * Phân biệt bằng TẬP GIÁ TRỊ: ba dải phải có tập `data-naptab` khác nhau. Dùng
 * chung thì ba tập TRÙNG nhau từng phần tử.
 */
const tapLoi = {}
for (const m of MAN_NAP) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.id_shell)
  tapLoi[m.ten] = [...new Set([...v.matchAll(/data-naptab="([a-z]+)"/g)]
    .map((x) => x[1]))].sort().join(",")
}
const ten = Object.keys(tapLoi)
for (let i = 0; i < ten.length; i++) {
  for (let j = i + 1; j < ten.length; j++) {
    ok(tapLoi[ten[i]] !== tapLoi[ten[j]],
      `\`${ten[i]}\` và \`${ten[j]}\` có dải lối KHÁC nhau`,
      `cả hai đều [${tapLoi[ten[i]]}] — dùng chung một dải thì thêm lối cho `
      + "module này là thêm cho module kia")
  }
}

console.log("\n4 · Nút nạp: màn loại mời ĐÚNG một, màn trộn mời BA\n")

for (const m of MAN_LOAI) {
  const h = await trangHtml(m.ten, { mock: true })
  const nut = [...h.matchAll(/data-nav="(nap[a-z]+)"/g)].map((x) => x[1])
  const rieng = [...new Set(nut)]
  ok(rieng.length === 1, `\`/${m.ten}/\` mời đúng MỘT đường nạp`,
    `được [${rieng}] — màn của một module mời đường của module khác là đưa `
    + "người dùng làm việc của module khác")
}
// Màn TRỘN (`tat-ca`) mời cả ba: ở đó không có module nào để suy ra một đường.
const hTron = await trangHtml("tat-ca", { mock: true })
const napTron = [...new Set([...hTron.matchAll(/data-nav="(nap[a-z]+)"/g)]
  .map((x) => x[1]))]
ok(napTron.length === MAN_NAP.length,
  `\`/tat-ca/\` mời cả ${MAN_NAP.length} đường nạp (thấy ${napTron.length})`,
  `được [${napTron}] — màn trộn rơi về một đường là chọn hộ người dùng, và nó `
  + "chọn luôn module")

console.log("\n5 · Ngân sách — đo BYTE\n")

for (const [ten2, noi] of [["gn.js", AS.gnJs], ["gn.css", AS.gnCss]]) {
  const b = Buffer.byteLength(noi ?? "", "utf8")
  // FR-068: `gn.css` 104448, `gn.js` giữ 102400.
  const tran = ten2 === "gn.css" ? TRAN.css : TRAN.js
  ok(b <= tran, `${ten2} ${b}/${tran} byte (dư ${tran - b})`,
    "`page-weight` so KB làm tròn nên cho lọt tới 511 byte quá trần")
}

console.log("\n6 · Luật tự-ẩn panel phải miễn trừ panel có ĐIỀU KHIỂN\n")

/*
 * BUG NẶNG NHẤT của WO-017, và không phép kiểm nào trước đó thấy được.
 *
 * Đo trên Chromium, `/tai-lieu/nap/`: `SECTION.pn rise` có `display: none`, và
 * luật khớp là
 *   .pn:has(> [data-mount]:empty):not(:has(> [data-mount]:not(:empty)))
 * `#mbnaptl` rỗng và không mốc nào khác trong section ⇒ CẢ SECTION tắt. Người
 * dùng mở màn đó thấy TRANG TRẮNG — đúng câu *"chưa có form và design UI cho
 * tài liệu / video"*.
 *
 * Chú thích của chính luật khai chủ ý: *"ẩn panel khi MỌI mốc của nó rỗng —
 * tức panel sẽ chỉ còn cái đầu bảng"*. Tiền đề đó SAI với hai màn nạp: chúng
 * đầy nội dung TĨNH. Vế còn thiếu: panel có ĐIỀU KHIỂN thì nó không rỗng.
 *
 * `display` tính ra thì chỉ trình duyệt biết; HÌNH DẠNG LUẬT thì đo được, và
 * đó là thứ giữ cho bản sửa không bị bỏ im lặng lần sau.
 */
const CSS_A = AS.gnCss ?? ""
const luatAn = [...CSS_A.matchAll(
  /([^{}@]*\[data-mount\]:empty[^{}@]*)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim(), than: m[2] }))
  .filter((l) => /display\s*:\s*none/.test(l.than) && /\.pn/.test(l.sel))
ok(luatAn.length === 1,
  `tìm được ${luatAn.length} luật tự-ẩn panel (chờ 1)`,
  "hai luật cùng việc là hai chỗ để lệch; 0 luật là phép đo không có vật liệu")
ok(luatAn.length > 0
  && /:not\(:has\([^)]*\b(?:input|button|select|textarea)\b/.test(luatAn[0].sel),
  "luật tự-ẩn MIỄN TRỪ panel có điều khiển",
  `selector: ${luatAn[0]?.sel ?? "(không có)"} — thiếu vế này thì hai màn `
  + "nạp thành TRANG TRẮNG, và không cổng nào nói ra")

// Và hai màn nạp PHẢI có điều khiển — nếu không, vế miễn trừ không cứu chúng.
for (const m of MAN_NAP) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.id_shell)
  const dk = (v.match(/<(?:input|button|select|textarea)\b/g) ?? []).length
  ok(dk > 0, `  \`/${m.ten}/\` có ${dk} điều khiển`,
    "0 điều khiển ⇒ luật tự-ẩn vẫn tắt màn này, và vế miễn trừ vô nghĩa")
}
chot("ba dải lối nối được · ba tiêu đề riêng · màn trộn mời cả ba · màn nạp không bị tự-ẩn")
