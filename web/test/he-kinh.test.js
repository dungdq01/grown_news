#!/usr/bin/env node
/**
 * FR-027 · HỆ KÍNH TRÊN ẢNH — bốn thứ, thiếu một là hỏng.
 *
 * `ui_guide.md` §4 nói thẳng: bốn thứ tạo cảm giác kính, **thiếu một là hỏng**.
 * Ba trong bốn đã có từ FR-013/FR-014 (`--edge`, `--e-top`, `--blur-lift`) nên
 * dễ tưởng là đủ — bản trước FR-027 thiếu đúng thứ thứ tư (`--gloss`) và panel
 * đọc ra là "ô mờ", không phải mặt kính.
 *
 * Test này canh cả bốn cùng có mặt, VÀ canh bốn ràng buộc hiệu năng ở §6 —
 * chỗ dễ làm lag nhất. Không có nó thì hệ kính sẽ phình bằng cách thêm lớp
 * blur, và không ai biết cho tới lúc trang giật.
 *
 * Chạy: node web/test/he-kinh.test.js
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const GOC = join(WEB, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

// Bỏ comment TRƯỚC khi quét. Bài học lặp lại nhiều lần trong repo này: phép
// kiểm quét văn bản thô sẽ khớp vào chính lời giải thích của mình.
const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "")

const tokens = boCmt(readFileSync(join(GOC, "05_uiux", "tokens.css"), "utf8"))
const css = boCmt(readFileSync(join(WEB, "styles", "prototype.css"), "utf8"))

console.log("\nFR-027 · hệ kính trên ảnh\n")

// ══ 1 · BỐN THỨ CỦA §4 ═════════════════════════════════════════════════════
console.log("1 · Bốn thứ tạo cảm giác kính — thiếu một là hỏng\n")

for (const [t, vai] of [
  ["--gloss", "vệt sáng chéo 157° (phản chiếu nguồn sáng trên cao)"],
  ["--e-top", "gờ sáng 1px mép trên (bề dày vật liệu)"],
  ["--edge", "viền 1px"],
  ["--blur-lift", "làm nhoè cái phía sau"],
]) {
  ok(new RegExp(`${t}\\s*:`).test(tokens), `token \`${t}\` — ${vai}`,
     "khai trong tokens.css, không gõ giá trị tại chỗ")
}

// `.pn` là bề mặt kính chính. Cả bốn phải tới được nó.
const luatPn = [...css.matchAll(/\.pn\b[^{]*\{([^}]*)\}/g)].map((m) => m[1]).join(";")
for (const t of ["--gloss", "--e-top", "--edge", "--blur-lift"]) {
  ok(luatPn.includes(t) || css.includes(`.pn,`) && css.includes(t),
     `\`.pn\` dùng \`${t}\``,
     "ba thứ có mà thiếu một thì panel là ô mờ, không phải mặt kính")
}

// Hai chế độ phải có `--gloss` RIÊNG. Nền tối và nền sáng cần alpha khác nhau
// — cùng lý do `--e-top` đã override từ FR-013 (.55 thành vạch chói ở tone tối).
const glossSang = /:root\{[\s\S]*?--gloss:/.test(tokens)
const glossToi = /\[data-theme="dark"\]\{[\s\S]*?--gloss:/.test(tokens)
ok(glossSang && glossToi, "`--gloss` khai riêng cho CẢ HAI chế độ",
   `sáng=${glossSang} tối=${glossToi} — một giá trị cho hai nền là một nền sai`)

// ══ 2 · §6a · ĐẾM SỐ LỚP blur ═════════════════════════════════════════════
console.log("\n2 · §6a — đếm số lớp backdrop-filter\n")

// Mỗi lớp buộc trình duyệt chụp lại nền phía sau MỖI KHUNG HÌNH, mà nền đang
// có ảnh + veil. Ngưỡng khai ở đây, không phải cảm tính: 6 lớp là hiện trạng
// (thanh trên · panel · cửa sổ đọc · nộp file · form · dialog-backdrop).
const NGUONG_BLUR = 8
const soBlur = (css.match(/backdrop-filter\s*:/g) ?? []).length
ok(soBlur <= NGUONG_BLUR, `${soBlur} lớp backdrop-filter (ngưỡng ${NGUONG_BLUR})`,
   "mỗi lớp = một lần chụp lại nền mỗi khung hình; nền đang có ảnh + veil")

// Thẻ nhỏ KHÔNG được blur — lưới 24 thẻ × blur = 24 lần chụp.
const luatCd = [...css.matchAll(/^\.cd\b[^{]*\{([^}]*)\}/gm)].map((m) => m[1]).join(";")
ok(!luatCd.includes("backdrop-filter"),
   "`.cd` (thẻ nhỏ) KHÔNG blur — dùng nền đặc + vệt sáng",
   "24 thẻ × blur = 24 lần chụp nền mỗi khung hình")

// ══ 3 · §6b · MỘT blur duy nhất ═══════════════════════════════════════════
console.log("\n3 · §6b + DESIGN.md §9 — một blur duy nhất\n")

// DESIGN.md §9: "Không thêm blur khác --blur-lift". Luật có vì bản v15 dùng ba
// mức blur và mắt đọc ra ba chất liệu trên cùng màn hình.
const blurGoTay = [...css.matchAll(/backdrop-filter\s*:\s*([^;}]+)/g)]
  .map((m) => m[1].trim())
  .filter((v) => !v.includes("var(--blur-lift)"))
ok(blurGoTay.length === 0,
   "mọi `backdrop-filter` dùng `var(--blur-lift)`",
   `gõ tay: ${blurGoTay.join(" · ")} — ba mức blur = ba chất liệu trên một màn`)

// §6b: không `saturate()` thêm ngoài cái đã nằm trong token.
const satNgoai = [...css.matchAll(/filter\s*:\s*([^;}]*saturate[^;}]*)/g)]
  .map((m) => m[1]).filter((v) => !v.includes("var(--"))
ok(satNgoai.length === 0, "không `saturate()` gõ tay ngoài token",
   `${satNgoai.join(" · ")} — thêm một lượt xử lý nữa mỗi khung hình`)

// ══ 4 · §6c · KHÔNG mix-blend-mode trên lớp phủ toàn màn ══════════════════
console.log("\n4 · §6c — không mix-blend-mode trên lớp phủ toàn màn\n")

// Đặc biệt là lớp có `animation`. Lớp phủ toàn màn nhận ra qua `position:fixed`
// + `inset`, tức `.sky` / `.mist` / `.grain`.
const xau = []
for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const [, sel, than] = m
  if (!/mix-blend-mode/.test(than)) continue
  if (/position\s*:\s*fixed/.test(than) && /inset\s*:/.test(than)) xau.push(sel.trim())
}
ok(xau.length === 0, "không lớp phủ toàn màn nào dùng mix-blend-mode",
   xau.join(" · "))

// ══ 5 · §6d · CANVAS có chốt chặn ═════════════════════════════════════════
console.log("\n5 · §6d — canvas (nếu có) phải có chốt chặn\n")

const jsNguon = join(WEB, "plugins", "backdrop", "src", "backdrop.inline.ts")
const js = existsSync(jsNguon) ? boCmt(readFileSync(jsNguon, "utf8")) : ""

// PHÂN BIỆT hai cách dùng rAF — bản trước gộp chúng và báo sai:
//
//   VÒNG LẶP TỰ CHẠY   `raf = requestAnimationFrame(step)` GỌI LẠI CHÍNH NÓ.
//                      Nó chạy mãi ⇒ phải khoá khung (§6d: 30fps).
//   THROTTLE SỰ KIỆN   rAF gọi MỘT lần cho mỗi đợt `scroll`, rồi hết.
//                      Khoá khung ở đây là vô nghĩa — nó vốn đã ≤1 lần/khung.
//
// Bản trước chỉ tìm chuỗi `requestAnimationFrame` nên parallax (throttle) bị
// đòi khoá 30fps và test đỏ trên code đúng.
const coVongLap = /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]{0,600}?requestAnimationFrame\(\s*\1\s*\)/
  .test(js) || /requestAnimationFrame\(step\)/.test(js)
const coCanvas = /getContext\(/.test(js)

if (!coCanvas && !coVongLap) {
  // Chưa có canvas là trạng thái HỢP LỆ — guide mô tả nó, không bắt buộc.
  ok(true, "chưa có canvas / vòng lặp tự chạy — bỏ qua §6d (đúng thực tế)")
} else {
  ok(/document\.hidden/.test(js), "vòng lặp có chốt `document.hidden`",
     "không có thì canvas chạy nền khi người dùng đổi tab")
  ok(/FRAME|1000\s*\/\s*30|33\.3/.test(js), "có khoá khung hình (~30fps)",
     "không khoá thì nó chạy 60-144fps cho một lớp nền mờ")
  ok(/prefers-reduced-motion/.test(js), "tôn trọng `prefers-reduced-motion`")
}

// rAF dùng làm THROTTLE thì vẫn phải có hai chốt — đây là parallax (§7).
if (/requestAnimationFrame/.test(js) && !coVongLap) {
  ok(/document\.hidden/.test(js), "throttle rAF có chốt `document.hidden`",
     "cuộn ở tab ẩn thì không có gì để vẽ")
  ok(/prefers-reduced-motion/.test(js), "parallax tắt khi `prefers-reduced-motion`",
     "DESIGN.md §7 nói TẮT HOÀN TOÀN, không phải giảm biên độ")
  ok(/removeEventListener\("scroll"/.test(js), "gỡ listener `scroll` khi dọn",
     "điều hướng SPA gọi lại `gan()` ⇒ listener chồng nhau sau mỗi lần nav")
}

// ══ 6 · ẢNH NỀN — cho crossfade mượt ═════════════════════════════════════
console.log("\n6 · Ảnh nền — nặng thì crossfade giật\n")

// Đo trên `public/` (NGUỒN), không trên output: output bị Quartz xoá mỗi build
// nên test chạy trước build sẽ không thấy gì.
const TRAN_ANH_KB = 500
const anh = []
for (const d of ["public", join("public", "light")]) {
  const p = join(GOC, d)
  if (!existsSync(p)) continue
  for (const f of readdirSync(p)) {
    if (!/\.(jpe?g|png|webp|avif)$/i.test(f)) continue
    anh.push([f, statSync(join(p, f)).size])
  }
}
ok(anh.length > 0, `có ${anh.length} ảnh nền trong public/`)
// WO-025 · SO THEO BYTE, HIEN THEO KB. `Math.round(size/1024) > 500` cho lot
// mot anh 512511 byte — 511 byte im lang qua tran, cung lo da bat o
// `page-weight`. O do no DA LOT THAT mot lan (gn.js 102666 byte bao "100 KB
// (nguong 100)" va XANH), nen day khong phai gia dinh.
const kbCua = (b) => Math.round(b / 1024)
const nang = anh.filter(([, b]) => b > TRAN_ANH_KB * 1024)
ok(nang.length === 0,
   `mọi ảnh ≤ ${TRAN_ANH_KB} KB (lớn nhất ${kbCua(Math.max(0, ...anh.map((a) => a[1])))} KB)`,
   `nặng: ${nang.map(([f, b]) => `${f} ${kbCua(b)}KB (${b} byte)`).join(" · ")} — ` +
   "crossfade phải giải mã lại cả khung; sửa: python core/tools/toi_uu_anh_nen.py")

// Trùng ảnh: hai file cùng byte là một file dư phải tải. Chú thích này NÓI
// "byte" từ đầu, nhưng phép so trước đây dùng KB đã làm tròn — nên hai ảnh cách
// nhau 400 byte bị báo là TRÙNG. Một biến tên `kb` giữ byte chính là hình dạng
// của cả lớp lỗi này, nên đổi tên luôn.
const theoKich = new Map()
for (const [f, b] of anh) {
  const k = String(b)
  theoKich.set(k, [...(theoKich.get(k) ?? []), f])
}
const nghiTrung = [...theoKich.values()].filter((v) => v.length > 1)
ok(nghiTrung.length === 0,
   "không cặp ảnh nào cùng dung lượng (dấu hiệu trùng)",
   `${nghiTrung.map((v) => v.join(" = ")).join(" · ")} — kiểm bằng ` +
   "`python core/tools/toi_uu_anh_nen.py --xem`")

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · bốn thứ của kính đủ cả bốn; hiệu năng trong ngưỡng đã khai\n")
