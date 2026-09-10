#!/usr/bin/env node
/**
 * FR-027h · CỬA SỔ ĐỌC — ba việc `REDESIGN-PLAN §3.2` còn nợ.
 *
 * ĐO TRƯỚC KHI LÀM, và kết quả đo đổi hẳn phạm vi: cửa sổ đọc **đã** có lưới
 * bất đối xứng (`.bk-b` grid `200px 1fr`), mục lục dính, đủ bốn thứ của kính,
 * và độ dài dòng đã chặn (`--w-read`, nới tới 820/900px trong cửa sổ rộng).
 * Nên KHÔNG dựng lại bố cục — chỉ thêm đúng ba thứ còn thiếu:
 *
 *  1 thanh tiến độ đọc
 *  2 metadata ở cột neo (trước đây cột trái CHỈ có mục lục, nên đọc xong muốn
 *    biết "cái này đáng tin đến đâu" thì phải đóng cửa sổ ra xem lại thẻ)
 *  3 mục 6 "Tinh túy" đọc ra KHÁC — nó là phần quan trọng nhất của bài mà
 *    `md()` giữ đúng cấp nên `### 6.1` ra `h3` y hệt mọi `h3` khác
 *
 * File này canh cả ba, VÀ canh những thứ đã đo được là ĐÚNG rồi — vì "đã đúng"
 * là thứ dễ mất nhất khi ai đó sửa quanh đó.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { taiSan } from "./_render.mjs"
import { TINH_TUY_O } from "./_khung.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "")
const css = boCmt(readFileSync(join(WEB, "styles", "prototype.css"), "utf8"))
// Tầng gốc: bỏ `@media` VÀ `@container`. Cửa sổ đọc dùng container query nên
// thiếu vế thứ hai là lấy luật của cửa sổ HẸP rồi kết luận cho cửa sổ rộng —
// cùng lớp lỗi "lấy luật cuối hoá ra là luật mobile" đã mắc ở `rail-trai`.
const cssGoc = css
  .replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")
  .replace(/@container[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")
/**
 * HAI helper, và chọn sai cái là nguồn của bốn lượt sai liên tiếp.
 *
 *   `cuoi(sel)`  lấy luật CUỐI — dùng khi hỏi về một thuộc tính bị GHI ĐÈ qua
 *                nhiều luật (vd `max-width` của `.mid` có bản desktop và bản
 *                mobile). Đây là câu hỏi "trình duyệt vẽ giá trị nào".
 *
 *   `gop(sel)`   NỐI mọi luật — dùng khi hỏi "selector này có KHAI thuộc tính X
 *                ở đâu đó không". Rất nhiều selector có nhiều luật khai những
 *                thuộc tính KHÁC NHAU: `.bk` có một luật mang vật liệu kính và
 *                một luật mang `min-width`; `.tt-b` có một luật mang counter và
 *                một luật mang cỡ chữ. Lấy luật cuối ở đây là đọc trúng một nửa
 *                rồi báo "THIẾU" cho nửa kia.
 *
 * Lần đầu tôi viết file này đã dùng `cuoi` cho cả hai loại câu hỏi và ra 10 báo
 * đỏ giả. Cùng lớp lỗi đã mắc ở `rail-trai` (lấy luật mobile) và ở `.qw .nw`.
 */
const luat = (sel, nguon = cssGoc) =>
  [...nguon.matchAll(new RegExp(`(?:^|\\})\\s*${sel}\\{([^}]*)\\}`, "g"))].map((m) => m[1])
const cuoi = (sel, nguon = cssGoc) => {
  const m = luat(sel, nguon)
  return m.length ? m[m.length - 1] : ""
}
const gop = (sel, nguon = cssGoc) => luat(sel, nguon).join(";")

/**
 * Cắt một khối at-rule bằng ĐẾM NGOẶC, không bằng regex tới `\n}`.
 *
 * `@container win (min-width:1100px){ .bk-b{...} }` có ngoặc lồng nhau; mẫu
 * `[\s\S]*?\n\}` phụ thuộc vào việc file có xuống dòng trước dấu đóng — tức nó
 * đo ĐỊNH DẠNG chứ không đo CẤU TRÚC, và nó lặng lẽ bỏ sót khối viết một dòng.
 */
const catAtRule = (nguon, dauRe) => {
  const ra = []
  for (const m of nguon.matchAll(dauRe)) {
    let i = nguon.indexOf("{", m.index), d = 0, j = i
    for (; j < nguon.length; j++) {
      if (nguon[j] === "{") d++
      else if (nguon[j] === "}" && --d === 0) break
    }
    ra.push([m[1] ? m[1].replace(/\s+/g, "") : "", nguon.slice(i + 1, j)])
  }
  return ra
}
const mw = boCmt(readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8"))

console.log("\nFR-027h · cửa sổ đọc\n")

// ══ 0 · Những thứ ĐÃ ĐÚNG — canh để không mất ════════════════════════════
console.log("0 · Nền đã đúng — canh để sửa quanh đó không phá\n")

// Lưới bất đối xứng sống trong `@container`, nên phải đo TRONG container query.
const cq = catAtRule(css, /@container\s+win\s*\(([^)]*)\)/g)
/**
 * NỐI mọi khối có cùng điều kiện, không lấy khối ĐẦU.
 *
 * Đo được: có **3** khối `@container win (max-width:640px)` — một từ FR-027c
 * (`.bk-b` 120px), hai từ FR-027h (`.bk-mr`, `.tt-b`). `find()` lấy khối đầu và
 * báo "THIẾU" cho hai khối sau. Cùng lớp lỗi với `cuoi()` vs `gop()` ở trên:
 * câu hỏi là "có khai ở đâu đó không", nên phải nối.
 *
 * Bỏ trắng luôn: CSS viết `.bk-pg>i` không có khoảng trắng quanh `>`, mà mẫu
 * kiểm thì tự nhiên viết `.bk-pg > i`. So trên bản đã bỏ trắng cả hai phía thì
 * phép kiểm không còn phụ thuộc cách gõ.
 */
const dk = (cond) => cq.filter(([c]) => c === cond).map(([, t]) => t)
  .join(";").replace(/\s+/g, "")
ok(cq.length >= 3, `có ${cq.length} container query cho cửa sổ`,
   "cửa sổ đọc kéo giãn được nên nó phải tự xếp lại theo BỀ RỘNG CHÍNH NÓ, " +
   "không theo bề rộng màn hình — đó là việc của @container, không phải @media")
const rong = dk("min-width:1100px")
/*
 * WO-034 · đọc qua TOKEN, không khớp chuỗi `200px 1fr`.
 *
 * Bản trước khớp literal. WO-034 đưa bề rộng cột neo vào `--toc-w` để `.hv`
 * trừ ra được cùng một con số — ý định không đổi một chút nào, nhưng phép kiểm
 * literal đỏ. Đó là phép kiểm ghim CÁCH VIẾT thay vì ghim ĐIỀU PHẢI ĐÚNG.
 *
 * Điều phải đúng: ở cửa sổ rộng, cột neo là 200px và lưới vẫn bất đối xứng
 * (cột neo | cột đọc), không phải một cột căn giữa — REDESIGN-PLAN §3.2.
 */
ok(/--toc-w:200px/.test(rong),
   "cửa sổ rộng: cột neo nới lên 200px",
   "REDESIGN-PLAN §3.2 đòi lưới bất đối xứng, không phải một cột căn giữa")
ok(/grid-template-columns:var\(--toc-w\)1fr/.test(css.replace(/\s+/g, "")),
   "lưới vẫn `<cột neo> 1fr` — bất đối xứng, đọc bề rộng từ token",
   "một cột căn giữa là mất cột neo mang metadata")
ok(/position:sticky/.test(gop("\\.bk-toc")), "cột neo DÍNH khi cuộn",
   "không dính thì cuộn xuống là mất mục lục — đúng thứ nó tồn tại để chống")
// Độ dài dòng: `--w-read` ở tầng gốc, nới ra trong cửa sổ rộng.
ok(/max-width:var\(--w-read\)/.test(gop("\\.doc")),
   "thân bài chặn độ dài dòng bằng `--w-read`",
   "cột đọc rộng 900px không chặn thì mắt mất dòng khi quay lại")
const noiRa = cq.filter(([, t]) => /\.doc\{max-width:min\(/.test(t)).length
ok(noiRa >= 2, `độ dài dòng NỚI theo bề rộng cửa sổ (${noiRa} bậc)`,
   "600px cố định trong một cửa sổ 1200px để lại hai phần ba là chỗ trống")
// Bốn thứ của kính (ui_guide §4) — `--gloss` đến từ luật gộp `.pn,.bk,.top`.
const thanBk = gop("\\.bk") + ";" + (/\.pn,\.bk,\.top\{([^}]*)\}/.exec(cssGoc)?.[1] ?? "")
for (const [ten, dau] of [["--edge viền", "edge"], ["--e-top gờ sáng", "e-top"],
                          ["blur nhoè nền", "blur-lift"], ["--gloss vệt sáng", "gloss"]]) {
  ok(thanBk.includes(dau), `kính: ${ten}`,
     "ui_guide §4 — thiếu một trong bốn là hỏng cảm giác vật liệu")
}

// ══ 1 · THANH TIẾN ĐỘ ĐỌC ════════════════════════════════════════════════
console.log("\n1 · Thanh tiến độ đọc\n")

ok(/class="bk-pg"/.test(mw), "cửa sổ có `.bk-pg`")
ok(/function ganTienDo\(/.test(mw), "có hàm gắn tiến độ riêng")
ok(/ganTienDo\(el\)/.test(mw), "gọi khi MỞ cửa sổ",
   "gọi trong `tai()` thì mỗi lần đổi tab lại gắn thêm một listener")

// Vùng cuộn là `.bk-b`, KHÔNG phải window — cửa sổ đọc là khung riêng.
const iG = mw.indexOf("function ganTienDo(")
const thanG = mw.slice(iG, iG + 1600)
ok(/querySelector<HTMLElement>\("\.bk-b"\)/.test(thanG),
   "đo cuộn của `.bk-b`, không của window",
   "cửa sổ đọc cuộn TRONG nó; đo window là đo sai vật")
ok(/scrollHeight - than\.clientHeight/.test(thanG),
   "tính đoạn cuộn được = `scrollHeight - clientHeight`")
// Bài ngắn hơn khung ⇒ không có tiến độ nào để báo. Báo 0% hay 100% đều sai.
ok(/doan > 2/.test(thanG), "bài ngắn hơn khung thì ẨN thanh",
   "đoạn cuộn 0 mà vẫn vẽ thanh thì nó báo 0% hoặc 100% — cả hai đều là số bịa")

// Hai chốt. `document.hidden` KHÔNG cần: không có vòng lặp nào chạy ngầm.
ok(/requestAnimationFrame\(ve\)/.test(thanG) && /if \(!tick\)/.test(thanG),
   "throttle bằng rAF + cờ `tick`",
   "`scroll` bắn hàng trăm lần/giây; ghi `width` mỗi lần là buộc tính lại layout")
ok(/removeEventListener\("scroll", khi\)/.test(thanG),
   "gỡ listener qua `addCleanup`",
   "không gỡ thì mỗi lần điều hướng SPA thêm một listener")
ok(/\{ passive: true \}/.test(thanG), "listener `passive` — không chặn cuộn")

// reduced-motion: KHÔNG tắt thanh này. Nó là THÔNG TIN, không phải hiệu ứng.
const rm = catAtRule(css, /@media\s*\((prefers-reduced-motion:reduce)\)/g)
  .map(([, x]) => x).join("")
ok(/\.bk-pg>i\{transition:none\}/.test(rm.replace(/\s+/g, "")),
   "reduced-motion chỉ bỏ `transition`, KHÔNG ẩn thanh",
   "thanh tiến độ là THÔNG TIN (đang ở đâu trong bài) — tắt nó là bỏ một thứ " +
   "người đọc dùng, khác hẳn tắt một hiệu ứng trang trí")

// ══ 2 · CỘT NEO — metadata ═══════════════════════════════════════════════
console.log("\n2 · Cột neo mang metadata, không chỉ mục lục\n")

ok(/class="bk-mt"/.test(mw), "cột neo có khối `.bk-mt`")
const iM = mw.indexOf('querySelector<HTMLElement>(".bk-mt")')
const thanM = mw.slice(iM, iM + 700)
for (const t of ["source_type", "credibility_max", "priority", "analyzed_at"]) {
  ok(thanM.includes(t), `in \`${t}\``,
     "bốn trường này ĐÃ nằm trên `ban` — đây chỉ là in lại, không truy vấn mới")
}
// Không được thêm nguồn dữ liệu nào: chỉ mục đã có đủ.
ok(!/fetch\(/.test(thanM), "không `fetch` nào trong khối metadata",
   "mọi trường đã có trên `ban` từ `open-index.json`")
ok(/\.bk-mt\{/.test(cssGoc.replace(/\s+/g, "")) || cuoi("\\.bk-mt") !== "",
   "`.bk-mt` có luật CSS")
// Cửa sổ hẹp: cột neo còn 120px ⇒ nhãn và giá trị trên một hàng thì cả hai bị cắt.
const hep = dk("max-width:640px")
ok(/\.bk-mr\{flex-direction:column/.test(hep),
   "cửa sổ hẹp: metadata xếp DỌC",
   "120px chia hai bên một hàng thì cả nhãn lẫn giá trị đều bị cắt")

// ══ 3 · MỤC "TINH TÚY" ═══════════════════════════════════════════════════
// FR-036 · mục tinh túy TỤT MỘT CẤP: `## 6.` → `### 3.4`, và các tinh túy tụt
// theo từ `### 6.x` → `#### 3.4.x`. Địa chỉ đọc từ khung, không gõ vào test.
console.log(`\n3 · Mục ${TINH_TUY_O} Tinh túy đọc ra KHÁC các mục khác\n`)

ok(/tinh\\s\*t\[úuủ\]y|tinh\\s\*t/.test(mw) || /tinh\s*t/i.test(mw),
   "JS tìm mục Tinh túy theo CHỮ của tiêu đề")
/*
 * CẮT THÂN BẰNG MỐC PHẢI TỒN TẠI.
 *
 * Bản trước cắt từ `mw.indexOf("const muc6")`. Đổi tên biến ⇒ `indexOf` trả
 * −1 ⇒ `slice(-1, 599)` cắt ĐÚNG MỘT ký tự ⇒ ba assertion dưới đây đỏ, nhưng
 * đỏ vì lý do SAI (không tìm được thân, chứ không phải logic hỏng). Nên khẳng
 * định mốc tồn tại TRƯỚC, rồi mới cắt.
 */
const iT = mw.indexOf("const mucTT")
ok(iT >= 0, "tìm được khối gắn class tinh túy (`const mucTT`)",
   "mốc không tồn tại thì mọi phép kiểm dưới đây đỏ vì lý do sai")
const thanT = iT >= 0 ? mw.slice(iT, iT + 700) : ""
ok(/classList\.add\("tt-h"\)/.test(thanT), "gắn `.tt-h` cho tiêu đề mục tinh túy")
ok(/classList\.add\("tt-b"\)/.test(thanT), "gắn `.tt-b` cho từng tinh túy")
// Tinh túy là h4, vì mục chứa nó (§3.4) đã là h3.
ok(/=== "H4"/.test(thanT), "tinh túy nhận class ở cấp `h4`",
   "mục tinh túy là `### 3.4` nên con của nó là `#### 3.4.x` ⇒ h4")
// Phải DỪNG ở h3 LẪN h2 — §3.4 là mục con CUỐI của §3.
ok(/tagName === "H2" \|\| n\.tagName === "H3"\) break/.test(thanT),
   "dừng ở `h3` lẫn `h2` kế tiếp",
   "chỉ chặn h2 thì mọi h4 của các mục sau §3.4 cũng thành tinh túy")
// Số thứ tự đếm bằng CSS counter — thêm/bớt một tinh túy thì số tự đúng.
ok(/counter-reset:tt/.test(gop("\\.doc")), "`.doc` mở counter `tt`")
ok(/counter-increment:tt/.test(gop("\\.tt-b")), "mỗi tinh túy tăng counter")
ok(/content:counter\(tt,decimal-leading-zero\)/.test(cuoi("\\.tt-b::before")),
   "số thứ tự vẽ bằng CSS counter, không ai gõ tay",
   "gõ tay thì thêm/bớt một tinh túy là phải sửa lại mọi số")
ok(/font-size:var\(--fs-stat\)/.test(cuoi("\\.tt-b::before")),
   "số cỡ display (`--fs-stat` 27px) — đây là thứ phân biệt mục 6",
   "REDESIGN-PLAN §3.2: 'khối lớn có số thứ tự cỡ display'")
// Chữ tinh túy KHÔNG được to hơn tít mục 6 — nó là con của mục đó.
const cTt = gop("\\.tt-b")
ok(/font-size:var\(--fs-lead\)/.test(cTt),
   "chữ tinh túy dùng `--fs-lead` (18px), không to hơn tít mục",
   "con to hơn cha thì thứ tự đọc bị đảo")
// Cửa sổ hẹp: số 27px + lề 32px ăn hết chỗ đọc.
ok(/\.tt-b\{padding-left:0\}/.test(hep),
   "cửa sổ hẹp: bỏ lề của tinh túy",
   "số cỡ 27px cộng lề 32px trong cột 120px thì không còn chỗ cho chữ")

// ══ 4 · Không hex gõ tay, không px gõ tay ════════════════════════════════
console.log("\n4 · Thang và màu đi qua token\n")

const khoi = [cuoi("\\.bk-pg"), cuoi("\\.bk-pg > i"), cuoi("\\.bk-mt"),
              cuoi("\\.bk-mr"), cuoi("\\.bk-mr i"), cuoi("\\.bk-mr b"),
              cuoi("\\.tt-h"), cTt, cuoi("\\.tt-b::before")].join(";")
const hex = khoi.match(/#[0-9a-fA-F]{3,8}/g) ?? []
ok(hex.length === 0, "không hex nào gõ tay trong khối mới", `thấy: ${hex.join(" ")}`)
const px = (khoi.match(/(?:font-size|padding|margin|gap):\s*[^;]*?(\d+(?:\.\d+)?)px/g) ?? [])
  .filter((x) => Number(/(\d+(?:\.\d+)?)px/.exec(x)[1]) >= 8)
ok(px.length === 0, "không giá trị ≥8px nào gõ tay", `thấy: ${px.join(" · ")}`)

// ══ 5 · Trên bundle đã build ═════════════════════════════════════════════
console.log("\n5 · Bundle đã build\n")

// FR-034/C5 · bundle lấy từ taiSan (SSR phát /gn.js, /gn.css) — không đọc site nữa.
{
  const { gnJs: j, gnCss: c } = await taiSan()
  for (const k of ["bk-pg", "bk-mt", "bk-mr", "tt-h", "tt-b"]) {
    ok(j.includes(k), `\`${k}\` có trong gn.js`)
    ok(c.includes(`.${k}`), `\`.${k}\` có luật trong gn.css`,
       "class có trong markup mà không có luật CSS là một class chết")
  }
}

console.log("\n6 · Chân cửa sổ — HAI HÀNG, và nhãn có dấu\n")

/*
 * FR-031 · Người dùng gửi ảnh: nhãn nút gãy 2-3 dòng ("✕ Loại (ghi lý / do)…"),
 * nút bị bóp còn ~70px.
 *
 * Nguyên nhân: `.bk-f` là MỘT hàng `space-between` chứa 4 nút biên tập + số
 * trang + prev/next. `space-between` chia đều KHOẢNG TRỐNG, không chia theo
 * nhu cầu — nên nút có nhãn dài bị bóp y như nút có nhãn ngắn.
 *
 * Canh CẤU TRÚC, không canh pixel: test không dựng được layout thật, nhưng
 * "hai hàng hay một hàng" là một quyết định đọc được trong CSS.
 */
const chanF = gop("\\.bk-f")
ok(/flex-direction:column/.test(chanF),
   "`.bk-f` xếp DỌC — hàng hành động tách khỏi hàng meta",
   `một hàng thì nhãn dài bị bóp; luật hiện tại: ${chanF.slice(0, 90)}`)
ok(/justify-content:space-between/.test(gop("\\.bk-fm")),
   "`.bk-fm` (hàng meta) mới là chỗ dùng `space-between`")
ok(!/justify-content:space-between/.test(chanF),
   "`.bk-f` KHÔNG còn `space-between`",
   "còn thì hai hàng bị đẩy ra hai đầu theo chiều dọc")
// `:empty` phải ẩn: không API thì hàng nút rỗng, để nguyên là một khoảng trống
// không ai giải thích được.
ok(/display:none/.test(gop("\\.bt-bt:empty")), "hàng nút rỗng thì ẩn")

// Nhãn TIẾNG VIỆT phải có dấu. `truoc`/`tiep` lọt qua mọi phép kiểm vì chúng
// là chữ hợp lệ — chỉ mắt người đọc mới thấy sai.
//
// `[^"'\n]` CÓ CHỦ ĐÍCH — bản đầu tôi viết `[^"'<]*`, và nó nuốt cả newline nên
// khớp từ một dấu nháy ở dòng này xuyên qua comment tới chữ `truoc` trong TÊN
// BIẾN (`const truoc = API_CO`). Báo động giả, và lý do thì sai hoàn toàn.
// Chuỗi hiển thị nằm TRÊN MỘT DÒNG; ràng buộc đó phải nằm trong regex.
for (const [xau, dung] of [["truoc", "trước"], ["tiep", "tiếp"], ["Dang tai", "Đang tải"]]) {
  const re = new RegExp(`["'][^"'\\n]*\\b${xau}\\b[^"'\\n]*["']`)
  const dong = mw.split("\n").filter((d) => !d.trim().startsWith("//") && re.test(d))
  ok(dong.length === 0, `nhãn không còn "${xau}" (phải là "${dung}")`,
     dong.length ? `còn ở: ${dong[0].trim().slice(0, 70)}` : "")
}

console.log("\nWO-034 · hiện vật giãn theo cửa sổ, chữ vẫn giữ độ dài dòng\n")

/*
 * Người dùng: *"phóng to cửa sổ detail thì khung xem bài viết / video / pdf vẫn
 * chưa tăng size theo, dẫn đến bị lệch khung"* — đo trên ảnh gửi kèm: cửa sổ
 * ~1700px, khung PDF hết ở ~1120px, PDF hiện ở 28%.
 *
 * Nguyên nhân: `.hv` nằm trong `<article class="doc">`, mà `.doc` bị chặn
 * `max-width` — 900px ở bậc cao nhất. Chặn đó ĐÚNG cho văn xuôi (ui_guide §9).
 * Sai ở chỗ hiện vật thừa hưởng cái chặn của CHỮ: một PDF 23 trang và một dòng
 * văn không có cùng bề rộng tối ưu.
 *
 * Hỏi HAI CHIỀU, vì bug này có hai cách "sửa" mà một cách phá thứ khác:
 *   (a) hiện vật không giãn      — bug đang có
 *   (b) bỏ max-width của `.doc`  — hết lệch khung, nhưng văn xuôi trải 1600px
 *                                  và luật độ dài dòng chết im lặng
 */

// ── a · `.doc` VẪN chặn độ dài dòng (chiều ngược) ───────────────────────
ok(/\.doc\{[^}]*max-width:var\(--w-read\)/.test(cssGoc),
   "`.doc` vẫn chặn bề rộng ở bậc gốc",
   "bỏ chặn là chữa lệch khung bằng cách phá luật đọc")
const bacDoc = (css.match(/@container win \(min-width:\d+px\)\{\s*\.doc\{max-width:/g) ?? []).length
ok(bacDoc >= 2, `\`.doc\` còn ${bacDoc} bậc chặn theo bề rộng cửa sổ`)

// ── b · `.hv` KHÔNG bị cột chữ chặn ─────────────────────────────────────
const khoiHv = (css.match(/(?:^|\})\s*\.hv\{([^}]*)\}/) ?? [])[1] ?? ""
ok(/cqw/.test(khoiHv),
   "`.hv` đọc bề rộng từ container cửa sổ (`cqw`), không từ cột chữ",
   `luật .hv hiện: ${khoiHv.slice(0, 90) || "(không thấy)"} — thiếu cqw nghĩa là `
   + "nó vẫn nằm gọn trong max-width của .doc")

// ── c · cột mục lục khai MỘT nơi ────────────────────────────────────────
//
// `.hv` phải trừ đi bề rộng cột mục lục. Cột đó đang khai ở
// `grid-template-columns` tại ba bậc. Gõ lại 150/120/200 ở chỗ thứ hai là cách
// hai bên lệch nhau ngay lần sửa đầu — cùng lớp lỗi mà `--rail-w` đã chặn.
ok(/--toc-w:/.test(css), "bề rộng cột mục lục khai thành token `--toc-w`")
ok(/grid-template-columns:var\(--toc-w\)/.test(css),
   "`grid-template-columns` ĐỌC `--toc-w`, không gõ lại số")
ok(/--toc-w/.test(khoiHv), "`.hv` cũng đọc `--toc-w` — một nguồn, hai bên dùng")

// ── d · hai loại hiện vật, hai hình dạng ────────────────────────────────
//
// Rộng ra mà giữ chung `aspect-ratio:4/3` thì 1600px thành hộp cao 1200px —
// tệ hơn trước khi sửa. Tài liệu cao theo TRANG; video 16/9.
// Tài liệu KHÔNG có class riêng trong markup — nó là  trần ( và
//  mới có class). Nên selector là phủ định, và phép kiểm phải hỏi
// ĐÚNG selector code dùng, không hỏi một class tôi mong nó có.
const khoiTl = (css.match(/\.hv:not\(\.vid\)\s+\.hv-f\{([^}]*)\}/) ?? [])[1] ?? ""
const khoiVid = (css.match(/\.hv\.vid\s+\.hv-f\{([^}]*)\}/) ?? [])[1] ?? ""
ok(/height:/.test(khoiTl),
   "khung tài liệu cao theo trang (`height`), không theo tỉ lệ 4/3",
   `luật hiện: ${khoiTl.slice(0, 70) || "(không thấy .hv.tl .hv-f)"}`)
ok(/aspect-ratio:16\s*\/\s*9/.test(khoiVid),
   "khung video 16/9",
   `luật hiện: ${khoiVid.slice(0, 70) || "(không thấy .hv.vid .hv-f)"}`)

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · cửa sổ đọc: tiến độ, cột neo, mục 6 khác biệt — nền cũ còn nguyên\n")
