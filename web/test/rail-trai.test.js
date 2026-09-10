#!/usr/bin/env node
/**
 * FR-027c · RAIL TRÁI 78px — thay thanh trên ngang, áp cho MỌI màn.
 *
 * `ui_guide §9`: "Rail trái 78px cố định… Bố cục nội dung: padding-left:78px."
 * Rail nằm NGOÀI mọi `.view` (shell.html dòng 5) nên nó là khung của cả 6 màn —
 * vỡ ở đây là vỡ toàn app, không phải một màn.
 *
 * Ba lớp lỗi test này canh, mỗi lớp đã xảy ra thật ở đâu đó trong dự án:
 *
 *  1 RAIL CHE NỘI DUNG. `.top` là `position:fixed` nên nó KHÔNG chiếm chỗ trong
 *    luồng. Thiếu `padding-left` trên `.wrap` thì 78px đầu của mọi trang nằm
 *    dưới rail — chữ vẫn ở đó, chỉ không đọc được.
 *  2 ICON PHÌNH HTML. 5 icon inline = 1293 byte × 7 trang. Chúng phải ở CSS
 *    (cached một lần), không ở markup.
 *  3 CỬA SỔ ĐỌC KÉO VÀO DƯỚI RAIL. Kẹp kéo cũ là `Math.max(56, …)` cho `top`
 *    (chiều cao thanh trên). Rail đổi trục nên kẹp phải đổi theo.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tatCaTrang } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
// FR-034/C5 · nguồn đổi từ output build sang renderTrang (bản real từ kho tạm).
const TRANG_MAP = await tatCaTrang()

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "")
const css = boCmt(readFileSync(join(WEB, "styles", "prototype.css"), "utf8"))
const shell = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")
// FR-027f · hằng số bố cục của `ui_guide §9` sống ở `tokens.css`, không gõ trong
// CSS nữa. Giá trị thật kiểm ở đây MỘT lần; các luật CSS chỉ phải đọc token.
const tokens = readFileSync(join(WEB, "..", "05_uiux", "tokens.css"), "utf8")

/**
 * CSS ở TẦNG GỐC — bỏ mọi khối `@media`.
 *
 * Cần vì phép kiểm "lấy luật cuối" (đúng theo cascade) lại bắt vào luật MOBILE:
 * `.mid` có một luật desktop và một luật trong `@media (max-width:720px)`, và
 * luật media đứng sau trong file. Lấy nó là đo bố cục điện thoại rồi kết luận
 * cho desktop.
 *
 * Hai lần trước tôi mắc lỗi cùng họ: `exec` lấy luật ĐẦU (bị đè), rồi `join`
 * mọi luật (khớp cả luật đã đè). Lần này lọc theo NGỮ CẢNH, không theo vị trí.
 */
const cssGoc = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")

console.log("\nFR-027c · rail trái 78px\n")

// ── 1 · Rail là cột trái, không phải thanh trên ─────────────────────────────
console.log("1 · Rail là CỘT, và nó không chiếm chỗ trong luồng\n")

// Lấy luật `.top{…}` cuối cùng — CSS cascade: khối FR-027c ở cuối file thắng.
const luatTop = [...cssGoc.matchAll(/(?:^|[};])\s*\.top\{([^}]*)\}/gm)].map((m) => m[1])
const top = luatTop.join(";")
ok(luatTop.length >= 1, `có ${luatTop.length} luật \`.top\``)
ok(/position:fixed/.test(top), "`.top` là `position:fixed`",
   "sticky ngang thì nó vẫn là thanh trên")
// FR-027f · đo TOKEN, không đo px. `--rail-w` là hằng số bố cục của
// `ui_guide §9`; giá trị thật kiểm ở `tokens.css` một lần, dưới đây.
ok(/width:var\(--rail-w\)/.test(top), "rail đọc `var(--rail-w)`")
ok(/--rail-w:78px/.test(tokens), "`--rail-w` = 78px (ui_guide §9)")
ok(/flex-direction:column/.test(top), "nav xếp DỌC")

// HAI LỚP (ui_guide §9) — FR-027e tách một `.wrap` gộp thành hai phần tử:
//   `.wrap`  padding-left:78px        bù rail, KHÔNG max-width
//   `.mid`   max-width:1280px + auto  căn giữa phần còn lại
// Bản trước gộp cả hai vào `.wrap` nên nội dung ra 1234px thay vì 1184px, và
// padding trong 24 thay vì 48 — chữ sát mép panel.
const luatWrap = [...cssGoc.matchAll(/(?:^|[};])\s*\.wrap\{([^}]*)\}/gm)].map((m) => m[1])
const coBu = luatWrap.some((x) => /padding-left:\s*(?:calc\(\s*)?var\(--rail-w\)/.test(x))
ok(coBu, "`.wrap` bù rail bằng `var(--rail-w)`",
   "rail `fixed` không chiếm chỗ ⇒ thiếu bù thì 78px đầu mỗi trang bị che")

// `.wrap` KHÔNG được mang max-width — đó là việc của `.mid`. Gộp lại thì phần
// bù nằm TRONG khung đã giới hạn, và nội dung lệch khỏi tâm vùng khả dụng.
ok(!luatWrap.some((x) => /max-width/.test(x)),
   "`.wrap` KHÔNG mang `max-width` — đó là việc của `.mid`",
   "gộp hai việc vào một phần tử là thứ ui_guide §9 cảnh báo")

const luatMid = [...cssGoc.matchAll(/(?:^|[};])\s*\.mid\{([^}]*)\}/gm)].map((m) => m[1])
// LUẬT CUỐI là luật trình duyệt vẽ. Nối tất cả rồi khớp regex là cái bẫy tôi
// vừa mắc: thêm một `.mid{max-width:1440px}` ở cuối file mà phép kiểm vẫn xanh
// vì nó khớp `1280px` của luật ĐÃ BỊ ĐÈ.
const mid = luatMid.length ? luatMid[luatMid.length - 1] : ""
ok(/max-width:var\(--mid-w\)/.test(mid) && /margin:0 auto/.test(mid),
   "`.mid` căn giữa, bề rộng đọc `var(--mid-w)`",
   `được: ${mid.slice(0, 80)}`)
const rMidW = /--mid-w:(\d+)px/.exec(tokens)
ok(rMidW && Number(rMidW[1]) >= 1280,
   `\`--mid-w\` = ${rMidW?.[1]}px (≥1280 của ui_guide §9)`)
ok(luatMid.length === 1,
   "chỉ MỘT luật `.mid` — một selector, một sự thật",
   `có ${luatMid.length} luật; hai luật thì phép kiểm dễ khớp vào luật đã bị đè`)
ok(/padding:0 var\(--mid-pad\)/.test(mid) && /--mid-pad:48px/.test(tokens),
   "`.mid` máng ngang `var(--mid-pad)` = 48px",
   "24px cho nội dung 1234px và chữ sát mép; 48px cho đúng con số tham khảo")

// FR-027f · trước đây đây là phép SO SÁNH hai con số gõ ở hai chỗ. Giờ cả hai
// đọc **cùng một token**, nên khớp là do CẤU TẠO — không thể lệch. Phép kiểm
// đổi vai: canh không ai gõ lại số 78 ở một trong hai chỗ.
const goLai = /(?:width|padding-left):\s*(?:calc\(\s*)?78px/.test(top + ";" + luatWrap.join(";"))
ok(!goLai, "không chỗ nào gõ lại `78px` — rail và phần bù cùng đọc `--rail-w`",
   "gõ lại là mở đường cho hai số lệch nhau, thứ chỉ hiện ra bằng một dải mỏng bị che")

// ── 1b · BA LỖI THỊ GIÁC ĐÃ XẢY RA — người dùng chỉ vào ảnh chụp ──────────
console.log("\n1b · Ba lỗi người dùng đã chỉ ra (bản đầu 'xấu quá')\n")

// Lỗi 1 · logo bị CẮT. Bản đầu nhồi "Grown_news" vào ô 40px bằng `text-indent`
// và ra "Grov". Rail 78px chỉ chứa nổi MỘT chữ — nên vẽ lại bằng `::before`,
// text thật giữ trong DOM cho screen reader.
const luatLogo = /\.top \.lg a\{([^}]*)\}/.exec(css)?.[1] ?? ""
ok(/font-size:0/.test(luatLogo), "chữ logo dài bị ẩn bằng `font-size:0`",
   "text-indent chỉ dịch chữ đi — nó vẫn vẽ và vẫn bị cắt giữa từ")
ok(/\.top \.lg a::before\{content:"[A-Za-z]"/.test(css),
   "logo vẽ lại bằng MỘT chữ trong `::before`",
   "78px không chứa nổi tên đầy đủ")
ok(/\.top \.lg a\{[^}]*width:38px/.test(css)
   && /border-radius:var\(--radius\)/.test(luatLogo) && /--radius:\.6875rem/.test(tokens),
   "ô logo 38×38, bán kính `var(--radius)` = 11px — đúng trang-chu.html")

// Lỗi 2 · nhãn XUỐNG DÒNG. "TRANG CHỦ" HOA + tracking trong cột 54px thì vỡ.
const luatTb = /(?:^|[};])\s*\.tb\{([^}]*)\}/gm
const tb = [...css.matchAll(luatTb)].map((m) => m[1]).join(";")
ok(/text-transform:none/.test(tb), "nhãn nav KHÔNG hoa",
   "HOA + tracking ở 10.5px trong cột 54px là thứ đẩy chữ xuống dòng")
ok(/letter-spacing:0/.test(tb), "nhãn nav KHÔNG giãn chữ")
ok(/white-space:nowrap/.test(tb), "nhãn nav không được xuống dòng")
// Và nhãn phải NGẮN — đây là gốc, CSS chỉ chữa phần ngọn.
const nhan = [...shell.matchAll(/data-nav="[a-z]+" data-i18n="nav\.[a-z]+">([^<]+)</g)]
  .map((m) => m[1].trim()).filter((x) => !x.startsWith("+"))
const dai = nhan.filter((x) => x.length > 9)
ok(dai.length === 0,
   `nhãn nav đều ngắn: ${nhan.join(" · ")}`,
   `quá dài cho cột 54px: ${dai.join(", ")} — trang-chu.html dùng "Chủ/Bài/Duyệt"`)

// Lỗi 3 · tab active thành CỤC ĐỎ. Bản đầu dùng `color:var(--primary)`.
//
// Lấy luật CUỐI, không luật đầu — cùng selector thì CSS cascade cho luật sau
// thắng, và đó là thứ trình duyệt vẽ. `.tb[aria-current]` có HAI luật: bản gốc
// s5 (chữ đỏ + gạch chân, cho tab NGANG) ở ~dòng 104 và bản rail ở cuối file.
// Dùng `exec` là đọc bản đã bị ghi đè — phép kiểm đỏ trong khi trang đúng.
const curAll = [...css.matchAll(/\.tb\[aria-current="true"\]\{([^}]*)\}/g)]
const cur0 = curAll.length ? curAll[curAll.length - 1][1] : ""
ok(!/color:var\(--primary\)/.test(cur0),
   "mục đang mở KHÔNG dùng chữ đỏ",
   "đỏ ở chip 54px đọc ra một cục; ui_guide §1 cho đỏ MỘT điểm nhấn/vùng — " +
   "và điểm đó đã là logo")
ok(/color:var\(--ink\)/.test(cur0),
   "mục đang mở dùng chữ SÁNG NHẤT (--ink) trên nền kính")

// ── 2 · Icon ở CSS, không ở HTML ───────────────────────────────────────────
console.log("\n2 · Icon nằm trong CSS (cached), không trong markup\n")

const svgShell = (shell.match(/<svg/g) ?? []).length
ok(svgShell <= 2, `shell chỉ còn ${svgShell} <svg> inline (search + …)`,
   "5 icon inline = 1293 byte × 7 trang; trong CSS thì tải một lần rồi cache")

const iconMask = (css.match(/\.tb\[data-nav="[a-z]+"\]::before\{mask-image:url\("data:image\/svg/g) ?? []).length
const soTab = (shell.match(/class="tb[^"]*" data-nav="[a-z]+"/g) ?? []).length
// FR-027g · bỏ `iconMask >= 5`. Số 5 là số cứng, và nó vừa sai khi màn Chờ
// duyệt gộp vào Kho (còn 4 tab, 4 icon). Ý ĐỊNH của luật này là "mọi tab đều
// có icon" — dòng dưới đã nói đúng điều đó và không bao giờ lạc hậu.
// Sàn thì thuộc về SỐ TAB, không thuộc số icon: `0 >= 0` cũng qua được.
ok(soTab >= 4, `rail có ${soTab} tab`,
   "dưới 4 tab thì rail mất một màn — kiểm lại `MAN` ở emitter")
ok(iconMask >= soTab, `mọi tab (${soTab}) đều có icon`,
   "tab thiếu icon đọc ra như một mục lỗi giữa các mục có icon")
ok(/\.tb::before\{[^}]*background:currentColor/.test(css),
   "`mask` tô bằng `currentColor` — icon đổi màu theo trạng thái tab",
   "màu cứng thì icon không theo được `aria-current`")

// ── 3 · Mục đang mở đọc ra được, và không dùng ngôn ngữ tab ngang ──────────
console.log("\n3 · Mục đang mở — nền, không gạch chân\n")

// Cùng lý do khối 1b: luật CUỐI là luật trình duyệt vẽ.
const cur = cur0
ok(/background:var\(--hov\)/.test(cur), "mục đang mở có nền `--hov` (ui_guide §9)")
ok(/var\(--gloss\)/.test(cur), "và có `--gloss` — cùng chất liệu kính với panel")
ok(/border-bottom-color:transparent/.test(cur),
   "TẮT gạch chân của tab ngang",
   "gạch chân ở cột dọc đọc ra như một đường kẻ lạc")

// ── 4 · Kẹp kéo cửa sổ đổi trục theo rail ──────────────────────────────────
console.log("\n4 · Cửa sổ đọc không kéo được vào dưới rail\n")

const fe = boCmt(readFileSync(join(WEB, "plugins", "multiwindow", "src", "scripts",
  "multiwindow.inline.ts"), "utf8"))
const kepL = /style\.left\s*=\s*Math\.max\((\d+),/.exec(fe)
const kepT = /style\.top\s*=\s*Math\.max\((\d+),/.exec(fe)
ok(kepL && Number(kepL[1]) >= 78,
   `kẹp \`left\` ≥ 78 (được ${kepL?.[1]})`,
   "kéo vào dưới rail thì thanh tiêu đề cửa sổ biến mất — không kéo ra được nữa")
ok(kepT && Number(kepT[1]) === 0,
   `kẹp \`top\` về 0 (được ${kepT?.[1]})`,
   "56 là chiều cao THANH TRÊN đã bỏ; giữ nó là chừa một dải trống vô nghĩa")

// ── 5 · Mobile: rail không ăn 20% bề rộng màn 390px ────────────────────────
console.log("\n5 · Mobile — rail nằm ngang dưới đáy\n")

// GỘP MỌI khối 720px, không lấy khối đầu tiên.
//
// Bản trước dùng `exec` nên nó lấy khối ĐẦU — và file có BA khối cùng
// breakpoint (dòng 567, 1460, 1752). Phép kiểm đỏ trong khi CSS đúng, chỉ vì nó
// soi khối khác. Cùng lớp lỗi với "ba nơi khai một luật": tìm một chỗ rồi kết
// luận cho cả file.
const mq = [...css.matchAll(/@media\s*\(max-width:720px\)\{([\s\S]*?)\n\}/g)]
  .map((m) => m[1]).join("\n")
ok(mq.length > 0, "có khối `@media (max-width:720px)` cho rail")
ok(/\.top\{[^}]*flex-direction:row/.test(mq),
   "rail chuyển sang xếp NGANG",
   "cột 78px trên màn 390px là ăn 20% bề rộng")
ok(/\.wrap\{[^}]*padding-left:0/.test(mq),
   "`.wrap` bỏ phần bù 78px khi rail không còn ở cạnh trái")
ok(/\.mid\{[^}]*padding:0 var\(--s-md\)/.test(mq),
   "`.mid` thu padding ngang trên mobile",
   "48px mỗi bên trên màn 390px là ăn 25% bề rộng")

// ── 6 · Trên TRANG ĐÃ BUILD — mọi MÀN cùng khung ──────────────────────────
console.log("\n6 · Trang đã build — mọi màn cùng một rail\n")

// FR-027g · `cho-duyet/index.html` ra khỏi danh sách này: nó không còn là một
// MÀN mà là trang chuyển hướng sang `/kho/#cho-duyet` — và trang chuyển hướng
// thì KHÔNG được có rail (dựng cả khung rồi nhảy đi ngay là lãng phí thuần).
// Nó được kiểm riêng ngay dưới, để "không có rail" là điều được KHAI chứ không
// phải điều bị bỏ qua.
const MAN = [["index.html", "Trang chủ"], ["tat-ca/index.html", "Tất cả"],
             ["kho/index.html", "Kho"],
             ["khai-niem/index.html", "Danh mục"], ["nap/index.html", "Nạp nguồn"]]
let du = 0
for (const [f, ten] of MAN) {
  const h = TRANG_MAP.get(f)
  if (!h) continue
  du++
  // FR-076 · nhóm điều khiển ĐỔI CHỖ: `.rail-d` (đáy rail) -> `.ph-d` (header).
  // Kẹp HAI PHÍA. Chỉ hỏi "`.ph-d` có chưa" thì một bản sao sót lại ở rail vẫn
  // xanh, và app hiện HAI bộ nút — đúng lớp lỗi mà việc có hai shell dễ gây ra.
  const dat = /<header class="top">/.test(h) && /class="ph-d"/.test(h)
    && !/class="rail-d"/.test(h)
    && /<div class="ph">/.test(h) && /<h1 class="lg"/.test(h)
  ok(dat, `${ten}: có rail + nhóm điều khiển ở HEADER + header trang + h1 logo`,
     `rail-d=${/class="rail-d"/.test(h)} ph-d=${/class="ph-d"/.test(h)}`
     + " — rail nằm ngoài mọi .view nên khung phải giống nhau ở MỌI màn")
}
ok(du >= MAN.length - 1, `kiểm được ${du}/${MAN.length} màn (bản real)`,
   "chưa build thì bỏ qua — nhưng thiếu quá một màn thì có gì đó không phát ra")

// Trang chuyển hướng: KHÔNG rail, và đó là đúng.
{
  const h = TRANG_MAP.get("cho-duyet/index.html")
  ok(!/<header class="top">/.test(h) && !/class="rail-d"/.test(h),
     "`/cho-duyet/` KHÔNG có rail — nó chỉ chuyển hướng",
     "dựng cả khung rồi nhảy đi ngay là lãng phí thuần")
}

// Search phải nằm TRONG `.ph`, không còn trong rail.
const home = TRANG_MAP.get("index.html") ?? ""
if (home) {
  const iPh = home.indexOf('class="ph"')
  const iSearch = home.indexOf("tsearch")
  const iTop = home.indexOf('<header class="top">')
  const iHetTop = home.indexOf("</header>", iTop)
  ok(iSearch > iPh && iSearch > iHetTop,
     "ô tìm kiếm nằm trong `.ph`, không trong rail",
     "78px không chứa nổi ô nhập — để trong rail là nó bị bóp hoặc tràn")
}

// ── 7 · FR-076 · NĂM ĐIỀU KHIỂN TOÀN APP ở header, không ở rail ───────────
console.log("\n7 · FR-076 · điều khiển toàn app nằm trong `.ph`\n")
{
  const shellRender = readFileSync(join(WEB, "render", "shell.html"), "utf8")
  const HAI = [["plugins/home-pages", shell], ["render", shellRender]]

  // 7a · HAI shell nguồn phải khớp. Chúng là 63 078 byte GIỐNG HỆT nhau, nên
  // sửa một cái là để lại một bản mang markup cũ — và bản nào được build thì
  // tuỳ đường gọi. Đây là vế rẻ nhất chặn cả lớp lỗi "sửa rồi mà không đổi".
  for (const [ten, h] of HAI) {
    ok(/<div class="ph-d">/.test(h) && !/class="rail-d"/.test(h),
       `7a · ${ten}/shell.html: có .ph-d, KHÔNG còn .rail-d`,
       `ph-d=${/class="ph-d"/.test(h)} rail-d=${/class="rail-d"/.test(h)}`)
  }

  // 7b · Đủ NĂM nút, và chúng nằm TRONG `.ph`. Đo trên LÁT CẮT bắt đầu từ
  // `.ph-d`, không quét cả trang: `id="tb"` chỉ khác class `.tb` (nút nav) một
  // ký tự, và quét toàn file là xanh oan.
  for (const [ten, h] of HAI) {
    const i = h.indexOf('<div class="ph-d">')
    const lat = i < 0 ? "" : h.slice(i, i + 900)
    const thieu = ["dmode", "lang", "tb", "bgb", "bgp"]
      .filter((x) => !new RegExp(`id="${x}"`).test(lat))
    ok(i >= 0 && thieu.length === 0,
       `7b · ${ten}: đủ 5 điều khiển trong .ph-d`,
       i < 0 ? "không thấy .ph-d" : `thiếu: ${thieu.join(", ")}`)
  }

  // 7c · `.ph-d` phải đứng SAU `class="ph"` và gần nó — ngoài `.ph` thì nó rơi
  // khỏi hàng ngang, thành một khối trôi giữa nội dung.
  for (const [ten, h] of HAI) {
    const iPh = h.indexOf('<div class="ph">')
    const iD = h.indexOf('<div class="ph-d">')
    ok(iPh >= 0 && iD > iPh && iD - iPh < 1200,
       `7c · ${ten}: .ph-d nằm TRONG khối .ph`, `ph@${iPh} ph-d@${iD}`)
  }

  // 7d · MOBILE. Trước FR-076, `@media (max-width:720px){.top .rail-d
  // {display:none}}` khiến người dùng điện thoại KHÔNG đổi được ngôn ngữ, tone
  // hay nguồn dữ liệu. Không ai khai đó là ý đồ — nó là hệ quả của rail nằm
  // ngang dưới đáy. Vế này giữ cho nó không quay lại dưới một cái tên khác.
  const media = css.match(/@media[^{]*max-width:\s*720px[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g) ?? []
  const an = media.filter((m) => /(rail-d|ph-d)[^{]*\{[^}]*display:\s*none/.test(m))
  ok(an.length === 0, "7d · mobile ≤720px KHÔNG ẩn nhóm điều khiển",
     an.join(" | ").slice(0, 200))

  // 7e · Khối đè `.dmode` DỌC phải đi cùng. `.dmode` gốc đã là inline-flex
  // ngang; `flex-direction:column;width:44px` chỉ có nghĩa trong cột 78px. Để
  // lại thì cặp REAL|MOCK vẫn xếp dọc giữa một hàng ngang.
  ok(!/\.rail-d\s+\.dmode/.test(css),
     "7e · đã xoá khối đè .dmode dọc — nó chỉ có nghĩa trong cột 78px",
     "còn luật `.rail-d .dmode` trong prototype.css")

  // 7f · Ba chỗ bind là delegated trên `document` (`t.closest("#…")`) nên đổi
  // chỗ trong DOM không phải sửa JS. Vế này KHẲNG ĐỊNH điều đó thay vì tin nó:
  // ai đổi sang một phép neo theo cha sẽ làm vế này đỏ, chứ không làm nút chết
  // câm trên màn thật.
  const js = [
    ["backdrop", join(WEB, "plugins", "backdrop", "src", "backdrop.inline.ts")],
    ["multiwindow", join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts")],
  ]
  for (const [ten, d] of js) {
    let m = ""
    try { m = readFileSync(d, "utf8") } catch { m = "" }
    const neoCha = /\.top[^\n]{0,40}(querySelector|closest)|querySelector\("\.rail-d/.test(m)
    ok(m !== "" && !neoCha, `7f · ${ten}: bind KHÔNG neo vào rail`,
       m === "" ? "không đọc được file"
         : "có chỗ neo theo .top/.rail-d — đổi chỗ DOM sẽ làm nút chết câm")
  }
}


if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · rail trái đúng 78px, bù đủ, icon ở CSS, 6 màn cùng khung\n")
