#!/usr/bin/env node
/**
 * WO-048 — CHI TIẾT VIỆC dạng NỔI (hover/focus), không phải khối trong luồng.
 *
 * Chỉ đạo chủ dự án 2026-09-05 (kèm ảnh màn `/chung-cat/?job=…`): *"Mục chi
 * tiết việc hiển thị dạng hover, chứ không để như hiện tại (không smart, mà
 * khi dữ liệu nhiều ⇒ có vấn đề)"*.
 *
 * VẤN ĐỀ ĐO ĐƯỢC của bản cũ, không phải chuyện thẩm mỹ:
 *   · khối `#cc-ct` nằm TRONG luồng ⇒ mở một việc là đẩy trang dài thêm, và
 *     người mất chỗ mình đang đứng trong lưới thẻ;
 *   · nó ở CUỐI lưới ⇒ với nhiều việc, thẻ vừa bấm ở đầu trang còn chi tiết
 *     hiện dưới màn hình — hai thứ của cùng một việc không thấy cùng lúc;
 *   · mỗi lần mở là **một `fetch`**, kể cả khi chỉ muốn nhìn qua.
 *
 * HỢP ĐỒNG MỚI, và nó có hai lối cố ý khác nhau:
 *   HOVER/FOCUS → xem nhanh, dữ liệu từ `CC_DS` đã có trong tay ⇒ 0 request.
 *   BẤM         → GHIM: `?job=` vào URL + đọc lại từ DỊCH VỤ (bản có thẩm quyền).
 *
 * ĐO NGUỒN FE. Vế "nó nổi đúng chỗ trên trình duyệt thật" là ảnh chụp — NGƯỜI
 * chấm; một cổng tĩnh không dựng nổi `getBoundingClientRect`.
 *
 * ĐỎ_KHI  chi tiết còn là khối trong luồng · hover đi kèm `fetch` · không có
 *         đường bàn phím · không có `Escape` · panel nổi không `position:fixed`
 *         · bấm không còn ghim `?job=`
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()

const NL = String.fromCharCode(10)
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)

const TS = chiMa(readFileSync(
  join(GOC, "web", "plugins", "chungcat", "src", "chungcat.inline.ts"), "utf8"))
const CSS = readFileSync(join(GOC, "web", "styles", "prototype.css"), "utf8")

/** Thân một hàm, đếm ngoặc — không đo bằng khoảng cách ký tự. */
function than(mau) {
  const i = TS.search(mau)
  if (i < 0) return ""
  const b = TS.indexOf("{", i)
  let sau = 0
  for (let k = b; k < TS.length; k++) {
    if (TS[k] === "{") sau++
    else if (TS[k] === "}") { sau--; if (!sau) return TS.slice(b, k + 1) }
  }
  return ""
}

console.log(`${NL}1 · Chi tiết là panel NỔI, không phải khối trong luồng${NL}`)

ok(/id="cc-hv"|"cc-hv"/.test(TS), "có panel nổi `#cc-hv`",
  "không có panel riêng ⇒ chi tiết vẫn phải chen vào luồng của lưới thẻ")

/*
 * `position:fixed` đo Ở ĐÂU CŨNG ĐƯỢC — mệnh đề là *"panel ra khỏi luồng"*,
 * không phải *"khai trong prototype.css"*.
 *
 * Nó khai từ chunk (`Object.assign(hv.style, …)`) chứ không trong
 * `prototype.css`, và đó là quyết định có số đo: `prototype.css` đi vào
 * `gn.css` — bundle CHUNG của MỌI trang — và sáu dòng ấy đẩy nó lên
 * 102524/102400, trong khi `FR-061` cấm nới bundle chung. Panel của MỘT màn,
 * do chunk của màn đó tạo, thuộc về chunk đó.
 *
 * Bản đầu của cổng này đòi một luật CSS và nó đỏ sau phép dời — lại là cổng đo
 * CHỖ KHAI thay vì đo tính chất.
 */
const luat = [...CSS.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter((m) => /#cc-hv/.test(m[1]))
const khaiFixed = luat.some((m) => /position\s*:\s*fixed/.test(m[2]))
  // Nhận CẢ ba cách khai: luật trong `prototype.css`, object `style` của JS,
  // và CSS do chunk tự tiêm (`st.textContent`) — bản hiện tại dùng cách thứ ba
  // vì `gn.css` chỉ còn 17 byte. Mệnh đề là *panel ra khỏi luồng*, không phải
  // *khai ở một chỗ cụ thể*.
  || /position:\s*["']?fixed/.test(TS)
ok(khaiFixed,
  "panel `position:fixed` — nó KHÔNG chiếm chỗ trong luồng",
  "`absolute` trong một cha có `overflow` sẽ bị cắt, và `static` thì lại đẩy "
  + "trang dài ra — đúng điều chỉ đạo yêu cầu bỏ")
ok(/transform\s*=|translate\(/.test(TS),
  "  và đặt chỗ bằng `transform`, không `top`/`left`",
  "`top`/`left` là thuộc tính LAYOUT — đổi chúng mỗi lần trỏ chuột là reflow "
  + "mỗi frame")

ok(!/id="cc-ct"/.test(TS) && !/"cc-ct-h"/.test(TS),
  "khối trong luồng `#cc-ct` / `#cc-ct-h` đã BỎ",
  "để lại là có HAI chỗ hiện cùng một việc, và chỗ thứ hai vẫn đẩy trang dài")

console.log(`${NL}2 · HOVER/FOCUS xem nhanh — 0 request${NL}`)

ok(/mouseenter|pointerenter/.test(TS), "có đường HOVER")
ok(/focusin|["']focus["']/.test(TS),
  "và có đường BÀN PHÍM (`focusin`)",
  "chỉ `mouseenter` thì người dùng bàn phím và người dùng cảm ứng không bao "
  + "giờ đọc được chi tiết — hover không phải một API mọi thiết bị đều có")

const xemNhanh = than(/function ccXemNhanh\b/)
ok(xemNhanh.length > 0, "có hàm xem nhanh riêng")
ok(!/fetch\s*\(/.test(xemNhanh),
  "xem nhanh KHÔNG `fetch` — nó đọc `CC_DS` đã có trong tay",
  "một request cho mỗi lần trỏ chuột qua thẻ là hàng chục request khi người "
  + "chỉ đang rê mắt xuống lưới")
ok(/CC_DS/.test(xemNhanh),
  "  và nó đọc từ `CC_DS`",
  "không đọc danh sách đã tải thì dữ liệu phải đến từ đâu đó — và chỗ duy "
  + "nhất còn lại là mạng")

console.log(`${NL}3 · BẤM = GHIM: URL + đọc lại từ dịch vụ${NL}`)

const mo = than(/async function ccMoChiTiet\b/)
ok(mo.length > 0, "hàm mở chi tiết còn đó")
ok(/searchParams\.set\(["']job["']/.test(mo),
  "bấm GHIM `?job=` vào URL — mở lại tab vẫn thấy đúng việc",
  "mất deep-link là mất cách duy nhất dẫn người khác tới một việc cụ thể")
ok(/fetch\(["'`]\/api\/viec\//.test(mo),
  "  và đọc lại từ DỊCH VỤ, không tin `CC_DS`",
  "`CC_DS` có thể đã cũ; bản ghim là bản người sẽ đọc kỹ, nên nó phải là bản "
  + "có thẩm quyền")

ok(/Escape/.test(TS),
  "`Escape` đóng panel đã ghim",
  "một panel nổi không đóng được bằng bàn phím là một panel bẫy tiêu điểm")

ok(/M12-R6/.test(TS) && /2\/2|>= 2/.test(TS),
  "vẫn NÓI RA khi `lan_gui` chạm trần `M12-R6`",
  "câu đúng khi chạm trần là *tạo việc mới*, không phải *thử lại* — bỏ câu đó "
  + "là mời người bấm một nút không thể hoạt động")

console.log(`${NL}4 · Ngân sách byte${NL}`)

const AS = await taiSan()
const b = (s) => Buffer.byteLength(s ?? "", "utf8")
for (const [ten, noi] of [["gn.css", AS.gnCss], ["gn.js", AS.gnJs]]) {
  // FR-068: `gn.css` 104448, `gn.js` giữ 102400 — trần theo TỪNG file.
  const tran = ten === "gn.css" ? TRAN.css : TRAN.js
  ok(b(noi) <= tran, `${ten} ${b(noi)}/${tran} (dư ${tran - b(noi)})`,
    "`FR-061` nới trần TẢI ĐẦU của trang có chunk, KHÔNG nới bundle CHUNG")
}

/*
 * `AC6` của khuôn UI: KHÔNG animate thuộc tính LAYOUT — chỉ trong luật CỦA
 * PANEL NÀY, không cả file (bài học `T03-110b`: bản đầu quét toàn `prototype.css`
 * và tố 8 rule CÓ SẴN của đơn vị khác).
 */
const LAYOUT = /(animation|transition)\s*:[^;}]*(width|height|top|left|right|bottom|margin|padding)/
/*
 * Đo trên CẢ nguồn chunk, không cắt thân `ccDatCho` bằng đếm ngoặc.
 *
 * Bản trước cắt thân hàm rồi soi trong đó, và nó trả `""` **trong khi cùng
 * phép cắt chạy đúng** cho `ccXemNhanh` và `ccMoChiTiet` ở trên. Tôi không
 * giải thích nổi vì sao, và một cổng đỏ mà không ai giải thích được là cổng
 * KHÔNG tin được — nó dạy người ta bỏ qua màu đỏ.
 *
 * Mệnh đề thật không cần phép cắt: *"không chỗ nào của MÀN NÀY animate thuộc
 * tính layout"* — và phạm vi "màn này" đã do chính file chunk giới hạn, nên
 * bài học `T03-110b` (đừng quét cả `prototype.css`) vẫn được tôn trọng.
 */
ok(/function ccDatCho/.test(TS), "có hàm đặt chỗ `ccDatCho`",
  "không có thì panel nằm ở góc màn hình, không neo vào thẻ nào")
const pham = luat.filter((m) => LAYOUT.test(m[2]))
  .map((m) => m[0].replace(/\s+/g, " ").slice(0, 60))
  .concat(LAYOUT.test(TS) ? ["nguồn chunk"] : [])
ok(pham.length === 0,
  `0 chỗ của màn animate thuộc tính LAYOUT (đo ${luat.length} luật + nguồn chunk)`,
  `thấy: ${pham.join(" · ")} — panel nổi phải đặt bằng \`transform\`, vì \`top\`/`
  + "\`left\` có transition là một panel bò theo con trỏ")

chot("chi tiết việc nổi theo thẻ · hover 0 request · bấm ghim URL + đọc dịch vụ")
