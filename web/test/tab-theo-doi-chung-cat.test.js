#!/usr/bin/env node
/**
 * T03-110b — cổng của TAB "Chưng cất" trong cửa sổ đọc.
 *
 * Chỉ đạo chủ dự án 2026-09-04 (kèm ảnh test thật): *"khi click Gửi chưng cất
 * thì không tự switch sang màn khác — cần làm thêm 1 Tab dạng multiwindow để
 * theo dõi trạng thái chưng cất và kết quả"*.
 *
 * ĐO NGUỒN FE, không đo DOM: tab sống trong cửa sổ đọc và chỉ hiện sau một
 * chuỗi bấm; dựng cả chuỗi đó trong một cổng tĩnh là dựng một bản mô phỏng
 * trình duyệt, và bản mô phỏng đó là thứ sẽ lệch khỏi trình duyệt thật.
 * Vế "chạy được trên trình duyệt" là `AC7` — NGƯỜI chấm trên ảnh chụp.
 *
 * ĐỎ_KHI  không có tab · lọc việc không theo slug · render % thay vì enum ·
 *         gửi xong không đổi tab · poll chạy khi tab đóng · animation ngoài
 *         khối `prefers-reduced-motion` · animate thuộc tính LAYOUT
 * XANH_KHI cả bảy vế đo được trên nguồn thật
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { maFeNguon, napRender, taiSan } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()

const NL = String.fromCharCode(10)
/** Bỏ chú thích trước khi đo: chú thích DẪN LẠI mã cũ để nói vì sao nó sai. */
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)

const TS = chiMa(maFeNguon(".ts"))
const CSS = readFileSync(join(GOC, "web", "styles", "prototype.css"), "utf8")

console.log("\n1 · TAB tồn tại và nằm trong dải tab của cửa sổ đọc\n")

ok(/data-tab=["'`]?cc/.test(TS) || /TAB_CC|tabChungCat/.test(TS),
  "có tab Chưng cất khai bằng `data-tab=\"cc\"` (hoặc hằng `TAB_CC`)",
  "tab phải nằm trong CÙNG dải `.bk-tabs` của cửa sổ — một panel nổi riêng là "
  + "một cửa sổ thứ hai, và chỉ đạo nói KHÔNG rời cửa sổ đang đọc")

console.log("\n2 · Lọc việc THEO SLUG của bản ghi đang mở\n")

/*
 * Thân hàm vẽ tab sống ở CHUNK `cctab`, không ở `gn.js` — `gn.js` là bundle
 * chung của mọi trang và `FR-061` cấm nới trần nó, nên mã của một tab chưa ai
 * bấm không được nằm trên đường tải đầu của người đọc.
 *
 * Nên đo NGUỒN CỦA CHUNK, không đo cả `maFeNguon()`: trong bản ghép, tên
 * `veTabChungCat` xuất hiện HAI lần — vỏ mỏng ở `multiwindow` (chỉ nạp chunk
 * rồi gọi) và thân thật ở đây. Regex trên bản ghép sẽ bắt cái nào tuỳ thứ tự
 * `readdirSync`, tức cổng đo đúng hay sai phụ thuộc tên thư mục plugin.
 */
const CCTAB = chiMa(readFileSync(
  join(GOC, "web", "plugins", "cctab", "src", "cctab.inline.ts"), "utf8"))

ok(/globalThis\.__GN_CCTAB__/.test(CCTAB)
  && /\/gn-cctab\.js/.test(TS)
  // Đo bằng MARKUP của tab (`cct-i`), không bằng `fetch("/api/job")`:
  // `guiChungCat` **POST** `/api/job` và nó phải ở lại `gn.js` — cấm chuỗi đó
  // là cấm chính việc gửi, tức đỏ oan.
  && !/cct-i|veViecCuaBan/.test(
    chiMa(readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
      "scripts", "multiwindow.inline.ts"), "utf8"))),
  "thân tab ở chunk NẠP THEO YÊU CẦU, không trong `gn.js`",
  "đưa thân tab vào `gn.js` là bắt mọi người đọc báo tải mã của một tab họ "
  + "chưa bấm — và nó ăn đúng phần dư `FR-061` từ chối nới")

const than = (() => {
  const i = CCTAB.search(/function\s+(veTabChungCat|tabChungCat|veViecCuaBan)\b/)
  if (i < 0) return ""
  const b = CCTAB.indexOf("{", i)
  let sau = 0
  for (let k = b; k < CCTAB.length; k++) {
    if (CCTAB[k] === "{") sau++
    else if (CCTAB[k] === "}") { sau--; if (!sau) return CCTAB.slice(b, k + 1) }
  }
  return ""
})()
ok(than.length > 0, "tìm được thân hàm vẽ tab")
ok(/slug/.test(than),
  "hàm vẽ tab LỌC theo `slug`",
  "không lọc ⇒ cửa sổ của bài A hiện việc của bài B, và người đọc tin đó là "
  + "việc của bài mình đang mở")

console.log("\n3 · Chip là ENUM `giai_doan`, KHÔNG phải phần trăm\n")

ok(/giai_doan/.test(than), "tab đọc `giai_doan` từ `/api/job`")
ok(!/%|phan_tram|percent|Math\.round\([^)]*100/.test(than),
  "KHÔNG render phần trăm — `giai_doan` là ENUM, và một % bịa từ enum là một "
  + "con số không ai đo được")

console.log("\n4 · Gửi XONG ⇒ đổi sang tab này; gửi TRƯỢT ⇒ KHÔNG đổi\n")

const thanGui = (() => {
  const i = TS.search(/async\s+function\s+guiChungCat\b/)
  if (i < 0) return ""
  const b = TS.indexOf("{", i)
  let sau = 0
  for (let k = b; k < TS.length; k++) {
    if (TS[k] === "{") sau++
    else if (TS[k] === "}") { sau--; if (!sau) return TS.slice(b, k + 1) }
  }
  return ""
})()
ok(thanGui.length > 0, "tìm được thân `guiChungCat`")
// Vế THẬT: lời gọi mở tab nằm SAU phép kiểm `r.ok`, không trước.
const iOk = thanGui.search(/if\s*\(!r\.ok\)/)
/*
 * `T03-112` ĐÈ hình dạng của `T03-110` ở đúng chỗ này.
 *
 * Chỉ đạo: *"mở 1 tab window CHẠY SONG SONG — tôi vừa xem bản tài liệu vừa xem
 * bản chưng cất BÊN CẠNH"*. Nên gửi xong KHÔNG còn đổi tab của cửa sổ đang đọc:
 * đổi tab là bắt người RỜI bài họ đang đọc, đúng thứ flow này sinh ra để bỏ.
 *
 * Vế mới, và nó mạnh hơn vế cũ: phải MỞ CỬA SỔ MỚI, và lời gọi đó nằm SAU
 * `if (!r.ok) throw` — mở một cửa sổ tiến trình cho một việc chưa ai nhận là
 * báo thành công sớm.
 */
const iMo = thanGui.search(/moCuaSoViec\(/)
ok(iMo > 0, "có lời gọi MỞ CỬA SỔ mới trong `guiChungCat` (`T03-112 AC1`)",
  "không mở cửa sổ ⇒ người không thấy tiến trình ở đâu cả")
ok(iOk > 0 && iMo > iOk,
  "mở cửa sổ nằm SAU `if (!r.ok) throw` — gửi TRƯỢT thì không mở gì",
  "mở cửa sổ tiến trình trước khi biết kết quả là báo thành công cho một việc "
  + "chưa ai nhận")
ok(!/moTab\(/.test(thanGui),
  "  và KHÔNG đổi tab của cửa sổ nguồn — nó giữ nguyên bài đang đọc",
  "`T03-112` bỏ phép đổi tab: cửa sổ nguồn phải ở nguyên chỗ để đọc song song")

/*
 * Cửa sổ mới phải nhận NGUỒN để đặt CẠNH. Không truyền thì `mo()` xếp chồng
 * theo bậc thang và che mất bài đang đọc — hai cửa sổ vẫn tồn tại nhưng flow
 * *"xem song song"* không đạt, và đó là ca cổng này phải bắt.
 */
ok(/moCuaSoViec\([^)]*__win/.test(thanGui) || /d\.__win/.test(thanGui),
  "  và truyền cửa sổ NGUỒN xuống để đặt cạnh",
  "thiếu ⇒ cửa sổ mới xếp chồng lên bài đang đọc")

console.log("\n5 · Poll chỉ khi tab MỞ và còn việc ĐANG CHẠY\n")

ok(/setInterval|setTimeout/.test(TS), "có nhịp poll")
ok(/clearInterval|clearTimeout/.test(than) || /dungPoll|huyPoll/.test(TS),
  "và có đường DỪNG poll",
  "poll không dừng là một tab đóng rồi vẫn gọi API mãi — đúng thứ ma trận UI "
  + "cấm ('không poll nền vô hạn')")

console.log("\n6 · `AC6` · animation nằm TRONG khối reduced-motion, và chỉ "
  + "transform/opacity\n")

// Mọi `@keyframes`/`animation:` của tab phải có chốt tắt. Đo bằng cách tìm
// khối `prefers-reduced-motion` rồi kiểm nó nhắc tới lớp của tab.
const coReduce = /@media\s*\(\s*prefers-reduced-motion/.test(CSS)
ok(coReduce, "`prefers-reduced-motion` có trong CSS")

/*
 * `AC6`: KHÔNG animate thuộc tính LAYOUT — **trong luật của TAB NÀY**, không
 * trong cả file. Bản đầu quét toàn `prototype.css` và tố 8 rule CÓ SẴN
 * (`transition:top`/`width` của thanh tiến trình, panel, rail). Đỏ OAN:
 * `T03-110` không viết chúng, và một cổng phạt đơn vị này vì nợ của đơn vị
 * khác là cổng nói sai chỗ hỏng. Nợ đó có ô backlog riêng.
 */
const RULE = [...CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter((m) => /\.cc-tab|\.cct\b/.test(m[1]))
const LAYOUT = /(animation|transition)\s*:[^;}]*\b(width|height|top|left|right|bottom|margin|padding)\b/
const viPham = RULE.filter((m) => LAYOUT.test(m[2]))
  .map((m) => m[0].replace(/\s+/g, " ").slice(0, 60))
ok(viPham.length === 0,
  `0 luật của TAB animate thuộc tính LAYOUT (đo ${RULE.length} rule của tab)`,
  `thấy: ${viPham.join(" · ")} — animate layout là reflow mỗi frame, và 60fps `
  + "chỉ đạt được bằng transform+opacity")

const khoiReduce = (CSS.match(
  new RegExp("@media\\s*\\(\\s*prefers-reduced-motion[\\s\\S]*?" + NL + "\\}", "g"),
) ?? []).join("")
const coAnim = RULE.some((m) => /animation\s*:/.test(m[2]))
ok(!coAnim || /\.cc-tab|\.cct\b/.test(khoiReduce),
  "animation của tab CÓ chốt trong khối `prefers-reduced-motion`",
  "một animation không tắt được là một trang gây chóng mặt cho người đã khai "
  + "mình cần nó tắt — và task cấm cắt vế này để lấy byte")

console.log("\n7 · Ngân sách byte — `FR-061` cho chỗ, không cho vô hạn\n")

const TS_AS = await taiSan()
const b = (s) => Buffer.byteLength(s ?? "", "utf8")
for (const [ten, noi] of [["gn.css", TS_AS.gnCss], ["gn.js", TS_AS.gnJs]]) {
  // FR-068: `gn.css` 104448, `gn.js` giữ 102400 — trần theo TỪNG file.
  const tran = ten === "gn.css" ? TRAN.css : TRAN.js
  ok(b(noi) <= tran, `${ten} ${b(noi)}/${tran} (dư ${tran - b(noi)})`,
    "`FR-061` nới trần TẢI ĐẦU của trang có chunk, KHÔNG nới bundle CHUNG")
}

chot("tab theo dõi: lọc theo slug · enum không % · đổi tab sau khi nhận · poll có dừng")
