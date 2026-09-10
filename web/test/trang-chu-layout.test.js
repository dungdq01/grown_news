#!/usr/bin/env node
/**
 * FR-027e · TRANG CHỦ dựng theo `trang-chu.html` — bố cục + chuyển động.
 *
 * VÌ SAO CÓ FILE NÀY: ba lượt trước tôi "sơn lại" layout cũ (đổi token, thêm
 * tầng loé sáng, đổi rail) và người dùng nói *chưa đẹp* — vì kiến trúc thông
 * tin trùng nhau nhưng CÁCH TRÌNH BÀY từng vùng khác hẳn. File này chốt cách
 * trình bày, để nó không trôi về bản cũ.
 *
 * Và nó canh BA QUIRK mà bản tham khảo tự mắc — port nguyên là mang cả lỗi:
 *
 *  1 `countUp(document)` / `growBars(document)` gọi lúc load đặt cờ `__c`/`__g`,
 *    nên lần gọi trong IntersectionObserver không bao giờ làm gì ⇒
 *    reveal-on-scroll KHÔNG TỒN TẠI.
 *  2 Cờ `hover` chỉ gắn hero mà dùng cho cả vòng biểu đồ ⇒ hover hero đóng băng
 *    biểu đồ, hover biểu đồ không dừng gì.
 *  3 `style-hover="…"` là thuộc tính BỊA — hover `translateY(-3px)` chưa từng
 *    chạy. Phải là CSS `:hover` thật.
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "")
const css = boCmt(readFileSync(join(WEB, "styles", "prototype.css"), "utf8"))
// CSS tầng gốc — bỏ `@media`. "Luật cuối thắng" là đúng cascade, nhưng luật
// cuối trong file thường là luật MOBILE; lấy nó là đo điện thoại rồi kết luận
// cho desktop. Lọc theo NGỮ CẢNH, không theo vị trí.
const cssGoc = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")
const cuoi = (sel) => {
  const m = [...cssGoc.matchAll(new RegExp(`(?:^|\\})\\s*${sel}\\{([^}]*)\\}`, "g"))]
  return m.length ? m[m.length - 1][1] : ""
}
const tokens = readFileSync(join(WEB, "..", "05_uiux", "tokens.css"), "utf8")
const shell = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")
// FR-034/C5 · template render sống ở web/render/trang.mjs (port từ emitter).
const emit = readFileSync(join(WEB, "render", "trang.mjs"), "utf8")
const jsMo = join(WEB, "plugins", "home-motion", "src", "home-motion.inline.ts")
const js = existsSync(jsMo) ? boCmt(readFileSync(jsMo, "utf8")) : ""

console.log("\nFR-027e · Trang chủ theo trang-chu.html\n")

// ══ 1 · VÙNG NỔI BẬT — 2 cột, KHÔNG panel bọc ═════════════════════════════
console.log("1 · Vùng Nổi bật — 2 cột, 3 panel xếp chồng\n")

const brk = cuoi("\\.brk-g")
// NEO CUỐI bằng `;`. Không neo thì `1.5fr 1fr` khớp luôn cả
// `1.5fr 1fr 1fr` — tức bố cục 3 cột CŨ vẫn qua được cổng. Đo tiền tố
// không phải đo giá trị.
ok(/grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\);/.test(brk),
   "`.brk-g` là 2 cột `1.5fr / 1fr` (và ĐÚNG hai cột)",
   "3 cột cho mỗi bài 233px — tít phải xuống 20px và dek cắt một dòng")
ok(/perspective:1800px/.test(brk), "`.brk-g` mang `perspective:1800px`",
   "thiếu nó thì `#hero` không có chiều sâu để nghiêng theo cuộn")
ok(/transform-style:preserve-3d/.test(cuoi("#hero")),
   "`#hero` mang `preserve-3d`")

// KHÔNG panel bọc — panel-trong-panel là hai lớp kính chồng nhau, đọc ra đục.
ok(!/class="pn brk/.test(shell),
   "vùng Nổi bật KHÔNG có `.pn` bọc ngoài",
   "bọc lại thì 3 thẻ bên trong thành panel-trong-panel")
ok(/class="brk-h/.test(shell), "tiêu đề vùng là `.brk-h` trần")

// 3 thẻ XẾP CHỒNG — `grid-area:1/1` trên `display:grid`, không position absolute.
ok(/grid-area:1\/1/.test(cuoi("\\.feat")),
   "`.feat` xếp chồng bằng `grid-area:1/1`",
   "absolute thì khung mất chiều cao và layout nhảy khi đổi thẻ")
ok(/display:grid/.test(cuoi("\\.hero-r")),
   "`.hero-r` là `display:grid` — khung chồng")
// FR-027f · đòi TOKEN, không đòi chuỗi clamp gõ tay. Luật cũ khớp
// `clamp(30px,…)` viết thẳng trong CSS — mà đó chính là giá trị `token-only`
// phải chặn. Một bậc chữ CÓ TÊN thì thuộc `tokens.css`.
ok(/font-size:var\(--fs-feat\)/.test(cuoi("\\.feat-t")),
   "tít nổi bật dùng `var(--fs-feat)` (ui_guide §3)")
ok(/--fs-feat:clamp\(1\.875rem,3\.1vw,2\.75rem\)/.test(tokens),
   "`--fs-feat` neo đúng 30↔44px",
   "ui_guide §3 chốt clamp(30px,3.1vw,44px)")
ok(/max-width:62ch/.test(cuoi("\\.feat-d")),
   "dek giới hạn 62ch — quá dài thì mắt mất dòng khi quay lại")

// Số thẻ khai ở NGƯỠNG, không gõ trong template.
ok(/feat:\s*\d+/.test(emit) && /phu:\s*\d+/.test(emit),
   "số thẻ chồng/phụ khai ở `NGUONG`",
   "gõ `.slice(0,3)` thì sửa ngưỡng phải sửa nhiều chỗ")

// ══ 2 · BA PANE + KHỐI 3D ═════════════════════════════════════════════════
console.log("\n2 · Ba pane biểu đồ + khối 3D\n")

ok(/display:grid/.test(cuoi("\\.pn-w")), "`.pn-w` là khung chồng pane")
ok(/grid-area:1\/1/.test(cuoi("\\.pane")), "`.pane` xếp chồng")
ok(/grid-template-columns:1fr 1fr/.test(cuoi("\\.kpi")),
   "KPI xếp 2×2",
   "3 ô trong lưới 2 cột cho ra 2+1 — ô lẻ đọc ra như thiếu dữ liệu")

// Ba TẦNG transform. Gộp perspective vào `.tw-i` thì nó áp cho CHÍNH nó,
// không cho con, và khối sẽ phẳng.
ok(/perspective:1500px/.test(cuoi("\\.tw-w")), "tầng 1 `.tw-w` mang perspective")
// FR-027f · `#tower` → `.tw-i`. Khối 3D dựng ở nhiều màn, mà cả 6 màn nằm
// trong CÙNG một tài liệu (SPA đổi `.view`) — id thứ hai là HTML sai và
// `querySelector` sẽ lấy đúng cái đầu, ba màn kia im lặng không xoay.
const tw = cuoi("\\.tw-i")
ok(/preserve-3d/.test(tw), "tầng 2 `.tw-i` mang `preserve-3d`")
ok(!/id="tower"/.test(emit), "khối 3D dùng CLASS, không dùng id",
   "id trùng khi có nhiều hơn một khối trong cùng tài liệu")
ok(/rotateX\(60deg\) rotateZ\(-38deg\)/.test(tw),
   "mặt bằng nghiêng `rotateX(60) rotateZ(-38)` — đúng trang-chu.html")
ok(/preserve-3d/.test(cuoi("\\.tw-p")), "tầng 3 `.tw-p` mang `preserve-3d`")

// Ba mặt, mỗi mặt MỘT thuộc tính để dựng cao — CSS neo `transform-origin` nên
// JS không phải tính lại vị trí.
ok(/transform-origin:top left/.test(cuoi("\\.tw-f")), "mặt trước neo `top left`")
ok(/transform-origin:top left/.test(cuoi("\\.tw-s")), "mặt hông neo `top left`")

// 9 token mặt khối — BA mặt ba màu giả một nguồn sáng. Cùng một màu cho ba mặt
// thì khối là hình vẽ phẳng, không phải thể tích.
// Đếm TRONG TỪNG KHỐI chế độ, không trên cả file. Tìm `--b2s:` ở phạm vi
// file thì chỉ cần MỘT trong hai chế độ có nó là đủ xanh — mà một bộ màu
// dùng cho hai nền thì đúng một nền. Cắt khối trước, đo sau.
const iToi = tokens.indexOf('[data-theme="dark"]')
const kSang = tokens.slice(0, iToi)
const kToi = tokens.slice(iToi)
const thieuTk = []
for (const [ten, khoi] of [["sáng", kSang], ["tối", kToi]]) {
  for (const n of [1, 2, 3]) {
    for (const m of ["t", "f", "s"]) {
      if (!new RegExp(`--b${n}${m}:`).test(khoi)) thieuTk.push(`${ten}:--b${n}${m}`)
    }
  }
  for (const x of ["--gridline", "--planeb"]) {
    if (!new RegExp(`${x}:`).test(khoi)) thieuTk.push(`${ten}:${x}`)
  }
}
ok(thieuTk.length === 0, "đủ 9 token mặt khối + 2 token mặt bằng, ở CẢ HAI chế độ",
   `thiếu: ${thieuTk.join(", ")}`)

// ══ 3 · BA QUIRK CỦA BẢN THAM KHẢO ════════════════════════════════════════
console.log("\n3 · Ba quirk bản tham khảo — phải KHÔNG có ở đây\n")

ok(js.length > 0, "có plugin chuyển động `home-motion`")
ok(!/demSo\(document\)|veCot\(document\)/.test(js),
   "quirk 1: KHÔNG gọi đếm số / dựng cột ở scope `document` lúc load",
   "gọi lúc load thì cờ __c/__g chặn luôn observer ⇒ reveal-on-scroll chết")
ok(/IntersectionObserver/.test(js), "reveal đi qua IntersectionObserver")
// Kiểm hai cờ được KHAI, không chỉ hai tên xuất hiện đâu đó.
//
// Bản đầu của phép kiểm này dùng `/treoFeat[\s\S]*treoPane/` và nó KHÔNG bắt
// được khi tôi đổi dòng khai thành `let treoChung` — vì `treoPane` vẫn còn ở
// các chỗ dùng. Tìm một tên xuất hiện là phép kiểm yếu; hỏi "nó có được khai
// không" mới là phép kiểm thật. Cùng lớp lỗi với `count("banIndex()") >= 3`.
const khaiCo = [...js.matchAll(/\b(?:let|const|var)\s+([\w,\s=falsetrue]+)/g)]
  .map((m) => m[1]).join(" ")
ok(/\btreoFeat\b/.test(khaiCo) && /\btreoPane\b/.test(khaiCo),
   "quirk 2: HAI cờ hover riêng ĐƯỢC KHAI cho hai vòng",
   "một cờ dùng chung ⇒ hover hero đóng băng biểu đồ, hover biểu đồ không dừng")
ok(!/style-hover/.test(shell) && !/style-hover/.test(emit),
   "quirk 3: KHÔNG dùng `style-hover` (thuộc tính bịa)",
   "nó không có tác dụng nào — hover phải là CSS `:hover` thật")
ok(/\.pcard:hover\{[^}]*transform:translateY\(-3px\)/.test(css),
   "hover thẻ phụ là CSS `:hover` THẬT")

// ══ 4 · BA CHỐT của mọi vòng (ui_guide §6 · DESIGN.md §7) ═════════════════
console.log("\n4 · Ba chốt chặn của vòng tự chuyển\n")

ok(/prefers-reduced-motion/.test(js), "tôn trọng `prefers-reduced-motion`")
ok(/if \(!reduced\)/.test(js), "`reduced` TẮT hẳn vòng, không giảm biên độ",
   "DESIGN.md §7 nói tắt HOÀN TOÀN")
ok(/document\.hidden/.test(js), "dừng khi tab ẩn")
ok(/mouseenter/.test(js) && /mouseleave/.test(js),
   "dừng khi chuột vào vùng — người đang đọc thì không cướp nội dung")
ok(/6000/.test(js), "vòng tin nổi bật 6s (ui_guide §5)")
ok(/5000/.test(js), "vòng biểu đồ 5s")
ok(/addCleanup/.test(js), "gỡ `setInterval` + observer khi điều hướng SPA",
   "không gỡ thì mỗi lần nav thêm một bộ hẹn giờ chạy song song")

// ══ 5 · Nút bấm tay cho cả hai vòng ══════════════════════════════════════
console.log("\n5 · Nút bấm tay — dot và tab\n")

ok(/data-dot=/.test(emit), "có `[data-dot]` cho vòng tin")
ok(/data-tab=/.test(emit), "có `[data-tab]` cho vòng biểu đồ")
ok(/dataset\.dot/.test(js) && /dataset\.tab/.test(js),
   "cả hai nhóm nút đều có handler",
   "`ui_guide §5`: mỗi vòng có nút bấm tay gọi CÙNG hàm show*(i)")

// ══ 6 · Trên TRANG ĐÃ BUILD ══════════════════════════════════════════════
console.log("\n6 · Trang đã build\n")

// FR-034/C5 · trang mock render trực tiếp — không còn nhánh "chưa build".
{
  const h = await trangHtml("trang-chu")
  const home = h.slice(h.indexOf('id="v-home"'), h.indexOf('id="v-all"'))
  const dem = (re) => (home.match(re) ?? []).length
  ok(dem(/data-feat="/g) === 3, `3 thẻ nổi bật xếp chồng — được ${dem(/data-feat="/g)}`)
  ok(dem(/data-dot="/g) === 3, `3 dot — được ${dem(/data-dot="/g)}`)
  ok(dem(/data-pane="/g) === 3, `3 pane biểu đồ — được ${dem(/data-pane="/g)}`,
     "người dùng đòi 'nhiều hơn 1 biểu đồ để làm hiệu ứng chuyển đổi'")
  ok(dem(/data-tab="/g) === 3, `3 tab — được ${dem(/data-tab="/g)}`)
  ok(dem(/data-bar="/g) === 3, `khối 3D có 3 cột — được ${dem(/data-bar="/g)}`)
  ok(dem(/class="tw-[tfs]"/g) === 9, `9 mặt (3 cột × 3) — được ${dem(/class="tw-[tfs]"/g)}`)
  ok(dem(/class="kp /g) === 4, `4 ô KPI — được ${dem(/class="kp /g)}`)
  // Mỗi thẻ phải mở được cửa sổ đọc — đổi layout không được mất chức năng.
  ok(dem(/data-open="/g) > 0, `${dem(/data-open="/g)} điểm mở cửa sổ đọc`,
     "bấm thẻ mở bài là chức năng đang có, không được mất khi đổi bố cục")
}

// Trạng thái RỖNG phải có panel — bug thật trên bản real (kho 0 bài approved).
{
  const hr = await trangHtml("trang-chu", { mock: false })
  const rong = /<p class="hint">/.test(
    hr.slice(hr.indexOf('id="brk"'), hr.indexOf('class="two"')))
  if (rong) {
    ok(/\.brk-g > \.hint\{[^}]*grid-column:1\/-1/.test(css),
       "trạng thái rỗng của vùng Nổi bật có panel riêng",
       "bỏ `.pn` bọc thì dòng gợi ý trôi giữa ảnh nền, không có panel")
  } else {
    ok(true, "bản real có bài approved — không cần kiểm trạng thái rỗng")
  }
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · Trang chủ đúng bố cục tham khảo, ba quirk đã sửa, ba chốt đủ\n")
