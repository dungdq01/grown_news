#!/usr/bin/env node
/**
 * WO-015 — hai bug KHÔNG cổng đọc-chuỗi nào thấy được.
 *
 * BUG-1 · `body.api-co .api-only{display:block}` (0,2,1) THẮNG
 * `[hidden]{display:none}` (0,1,0). Đo trên Chromium: `#f-bai` có
 * `hidden = true` mà `display = block`. Bình luận ở `prototype.css:1319-1321`
 * khai đã chữa — nó chưa chữa.
 *
 * BUG-2 · `apLoc()` đặt `#acount` bằng `.cd:not(.off)` **cả trang**. Mọi màn nằm
 * trong cùng tài liệu, nên con số là tổng của Trang chủ + Tổng hợp + ba màn loại.
 * Đo trên kho tạm 4 bản: nhãn "14 bản" cạnh một lưới có **7** thẻ.
 *
 * "Có luật `[hidden]` trong file" và "có chuỗi `.cd` trong `apLoc`" đều xanh
 * trong khi cả hai bug còn sống. Nên cổng này TÍNH TRỌNG SỐ và đo PHẠM VI.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
await napRender()
const css = (await taiSan()).gnCss ?? ""

/**
 * Trọng số CSS của một selector — `[a, b, c]` = [id, class/attr/pseudo-class,
 * type/pseudo-element]. Đủ cho các selector phẳng trong file này; không xử
 * `:where()`/`:is()` vì file không dùng chúng.
 */
function trongSo(sel) {
  const s = sel.trim()
  const id = (s.match(/#[\w-]+/g) ?? []).length
  const cls = (s.match(/\.[\w-]+/g) ?? []).length
    + (s.match(/\[[^\]]+\]/g) ?? []).length
    + (s.match(/:(?!:)[a-z-]+(\([^)]*\))?/g) ?? []).length
  const typ = (s.split(/[\s>+~]+/).filter((x) => /^[a-z]/i.test(x)) ?? []).length
    + (s.match(/::[a-z-]+/g) ?? []).length
  return [id, cls, typ]
}
const soSanh = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

console.log("\n1 · Trọng số — phép đo THẬT của cascade\n")

// Tự kiểm hàm đo trước khi tin nó: một phép đo chưa được thử là một phép đo chưa
// biết đúng. Ba mốc từ chính hai luật đang tranh nhau.
for (const [sel, cho] of [
  ["[hidden]", [0, 1, 0]],
  ["body.api-co .api-only", [0, 2, 1]],
  ["body.api-co .api-only[hidden]", [0, 3, 1]],
]) {
  const duoc = trongSo(sel)
  ok(JSON.stringify(duoc) === JSON.stringify(cho),
    `trọng số \`${sel}\` = ${JSON.stringify(cho)}`,
    `được ${JSON.stringify(duoc)} — hàm đo sai thì mọi kết luận dưới đây sai theo`)
}

console.log("\n2 · BUG-1 · `[hidden]` phải là BẤT BIẾN, không phải luật tranh đua\n")

/*
 * `[hidden]` là BẤT BIẾN, không phải một luật tranh đua.
 *
 * Bản đầu của phép kiểm này chỉ xét luật có `[hidden]` hoặc `.api-only` trong
 * selector — một TẬP CON. Luật thật sự thắng ở lượt hai là
 * `.np-form{display:grid}`, KHÔNG nằm trong tập đó, nên phép kiểm XANH trong khi
 * `#f-bai` vẫn `display: grid` với `hidden = true`. Chỉ trình duyệt nói ra.
 *
 * Nên đo thứ KHÁC: luật `[hidden]` phải mang `!important`. Đó là cách duy nhất
 * không phải đua với MỌI luật `display` ai thêm sau, và nó chỉ tắt `display`
 * cho đúng phần tử đang mang `hidden` — tức đúng phạm vi ta muốn.
 *
 * LỘT CHÚ THÍCH CSS trước khi tách luật: phần bắt selector là `[^{}@]+`, nên
 * một khối chú thích CSS ngay trước luật đi lọt vào selector (và chuỗi đóng
 * khối KHÔNG viết được ra đây — viết ra là tự đóng chính khối này, vừa trúng).
 * Vừa trúng thêm lần nữa: cổng báo
 * "thấy 0 luật [hidden]" ngay sau khi tôi viết chú thích cho chính bản sửa.
 * Cùng lớp lỗi với §3 phải lột chú thích của `apLoc`.
 */
const cssMa = css.replace(/[/][*][^]*?[*][/]/g, " ")
/*
 * MẪU KHÔNG ĐƯỢC NUỐT DẤU PHÂN CÁCH.
 *
 * Bản trước mở đầu bằng `(?:^|\\})` — nó KHỚP và do đó TIÊU THỤ dấu `}`
 * kết thúc luật trước. Sang lượt sau, `lastIndex` đã qua dấu đó, nên luật kế
 * tiếp không còn `}` nào phía trước để khớp ⇒ mẫu chỉ bắt được luật CÁCH MỘT.
 * `[hidden]{…}` rơi đúng vào nhịp bị bỏ, và cổng báo `thấy 0 luật` trong khi
 * luật có thật trong file — một phép đo nói KHÔNG CÓ về thứ nó không nhìn tới.
 *
 * Không cần dấu phân cách: `[^{}@]*` vốn không băng qua được `}`, nên phần bắt
 * selector tự bắt đầu sau luật trước. Thân dùng `[^{}]*` để khối `@media` bao
 * ngoài không khớp — engine lùi lại và bắt đúng luật BÊN TRONG khối.
 */
const luat = [...cssMa.matchAll(/([^{}@]*)\{([^{}]*display\s*:[^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim(), than: m[2] }))

// Phép đo phải có VẬT LIỆU: nhiều luật `display` cùng khớp một phần tử ẩn.
const doiThu = luat.filter(({ sel }) => /\[hidden\]|\.api-only|\.np-form/.test(sel))
ok(doiThu.length >= 3, `${doiThu.length} luật display cùng khớp phần tử ẩn`,
  "dưới 3 ⇒ phép đo không còn vật liệu, và nó xanh vô căn cứ")

const luatHidden = luat.filter((l) => l.sel === "[hidden]")
ok(luatHidden.length === 1,
  `có đúng một luật \`[hidden]\` (thấy ${luatHidden.length})`,
  "không có ⇒ không gì chặn nổi các luật `display` khác")
ok(luatHidden.length > 0
  && /display\s*:\s*none\s*!important/.test(luatHidden[0].than),
  "`[hidden]{display:none !important}` — bất biến, không đua trọng số",
  `được: ${luatHidden.map((l) => l.than.trim()).join(" · ")} · thiếu !important thì `
  + "MỌI luật `display` sau nó đều thắng, và cái thắng đó IM LẶNG")

// Trọng số vẫn phải đo: `!important` chỉ thắng khi không có `!important` khác.
const impKhac = luat
  .filter((l) => /!important/.test(l.than) && l.sel !== "[hidden]")
  .map((l) => `${l.sel} (${trongSo(l.sel).join(",")})`)
ok(impKhac.length === 0,
  "`!important` KHÔNG rải sang luật `display` nào khác",
  `dùng ở: ${impKhac.join(" · ")} — hai !important là đua trọng số lần nữa, `
  + "và lần này không còn bất biến nào phân xử")

console.log("\n3 · BUG-2 · `#acount` đếm trong ĐÚNG lưới, không cả trang\n")

const js = readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8")
const iAp = js.indexOf("function apLoc")
const thanAp = (() => {
  if (iAp < 0) return ""
  const b = js.indexOf("{", iAp)
  let sau = 0
  for (let k = b; k < js.length; k++) {
    if (js[k] === "{") sau++
    else if (js[k] === "}") { sau--; if (!sau) return js.slice(b, k + 1) }
  }
  return ""
})()
ok(thanAp.length > 0, "tìm được thân `apLoc`")

/*
 * LỘT CHÚ THÍCH trước khi đo. Chú thích của bản sửa DẪN LẠI code cũ
 * (`document.querySelectorAll(".cd:not(.off)")`) để nói vì sao nó sai — và phép
 * kiểm bắt đúng dòng chữ đó, báo đỏ trong khi mã đã đúng.
 *
 * Cùng lớp lỗi với một bình luận trong shell chứa `id="v-nap"` làm ba cổng cắt
 * vùng sai. Cổng phải đo MÃ, không đo văn xuôi kể về mã.
 */
const NL2 = String.fromCharCode(10)   // khong mot dau gach cheo nao
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL2)
  .split(NL2).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL2)
const maAp = chiMa(thanAp)

// Phép đếm phải có PHẠM VI là một lưới. `document.querySelectorAll(".cd…")`
// trong thân này là đếm cả trang — đúng bug.
ok(!/document\.querySelectorAll\(\s*["'`]\.cd:not\(\.off\)/.test(maAp),
  "`apLoc` KHÔNG đếm `.cd:not(.off)` trên `document`",
  "đếm cả trang ⇒ nhãn là tổng của mọi màn; đo được: nhãn 14 cạnh lưới 7 thẻ")
ok(/\.grid|luoi|querySelectorAll\(["'`]\.grid/.test(maAp),
  "  phép đếm có phạm vi là một LƯỚI",
  "không thấy phạm vi lưới nào trong thân hàm")

console.log("\n4 · Mỗi màn loại có ô đếm RIÊNG, đếm trong lưới của nó\n")

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
for (const m of BANG.filter((x) => x.menu && x.module)) {
  const h = await trangHtml(m.ten, { mock: true })
  ok(h.includes(`id="c-${m.id_shell}"`),
    `màn \`${m.ten}\` có ô đếm riêng \`#c-${m.id_shell}\``,
    "dùng chung `#acount` ⇒ bốn màn ghi vào một ô, và ba trong bốn nói sai")
}
// FE phải biết ô đếm của lưới nào — không gõ `acount` cứng cho mọi lưới.
ok(/c-\$\{|dataset\.dem|data-dem/.test(js) || /acount/.test(maAp) === false,
  "FE tìm ô đếm THEO lưới, không gõ `acount` cho mọi lưới",
  "một id cứng ⇒ lọc ở màn Video ghi số vào nhãn của màn Tổng hợp")

chot("hidden thắng bằng BẤT BIẾN · acount đếm đúng lưới · mỗi màn một ô đếm")
