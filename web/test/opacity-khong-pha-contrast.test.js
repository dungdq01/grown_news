#!/usr/bin/env node
/**
 * `opacity` trên CHỮ làm nhạt màu SAU LƯNG contrast-audit.json.
 *
 * VÌ SAO CẦN CỔNG NÀY — lỗi thật, tôi vừa mắc:
 * contrast-audit.json đo 50 cặp màu ĐẶC và 50/50 pass. Nhưng `opacity` trộn
 * màu đó với nền TRƯỚC khi mắt thấy. Tôi viết `.rc-r .bt{opacity:.55}` cho hai
 * nút sửa/xoá; đo lại thì:
 *     ink-2 #3A3A42 → #919195 = 3.06:1   (cần 4.5)
 *     đỏ    #C81E1E → #DF8281 = 2.67:1   (cần 4.5)
 * Không test nào bắt: token-only chỉ soi px/rem, contrast-audit là JSON tĩnh
 * không biết CSS có opacity. Trang vẫn "xanh" mà chữ đọc không nổi.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
const tok = readFileSync(join(WEB, "..", "05_uiux", "tokens.css"), "utf8")
const loi = []
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}`)
  if (!d) loi.push(chu + (them ? ` — ${them}` : ""))
}

/** Hex của token trong khối :root ĐẦU (light). */
const hex = (ten) => {
  const m = tok.match(new RegExp(`--${ten}:\s*(#[0-9a-fA-F]{6})`))
  return m ? m[1] : null
}
const L = (h) => {
  const s = [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
}
const tron = (fg, bg, a) => "#" + [1, 3, 5].map((i) => {
  const f = parseInt(fg.substr(i, 2), 16), b = parseInt(bg.substr(i, 2), 16)
  return Math.round(f * a + b * (1 - a)).toString(16).padStart(2, "0")
}).join("")
const tiLe = (a, b) => {
  const x = L(a), y = L(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const NEN = hex("background") ?? "#FCFCFB"
const CHU = {
  ink: hex("foreground"), "ink-2": hex("secondary-foreground"),
  "ink-3": hex("muted-foreground"), destructive: hex("destructive"),
}

console.log("\n1 · Đọc được token màu để tính\n")
for (const [t, v] of Object.entries(CHU)) ok(!!v, `--${t} = ${v}`)
ok(!!NEN, `nền = ${NEN}`)

console.log("\n2 · Mọi luật opacity trên CHỮ phải còn ≥4.5:1 sau khi trộn\n")

/**
 * Miễn trừ, mỗi cái một lý do — không phải danh sách cho tiện:
 *   .grain/.rz-  phần tử KHÔNG chứa chữ (lớp nhiễu, tay kéo giãn)
 *   .flare       (FR-027d) lớp loé sáng — cùng loại `.grain`: không chữ, không
 *                `color`, `pointer-events:none`. Và nó ở z-index 3 còn panel ở
 *                5+, nên nó nằm DƯỚI panel: nó đổi màu NỀN mà panel trộn ra,
 *                không làm nhạt chữ nào. Đo ca tệ nhất (loé trắng .20 × .5 trên
 *                ảnh nhạt nhất) ⇒ nền panel #E9EAE9: chữ 14.83 · chữ mờ 5.25 ·
 *                đỏ 4.76 — cả ba PASS. `contrast-audit` 62 cặp · 0 trượt.
 *                `.vign` KHÔNG cần miễn: nó khai alpha trong gradient, không
 *                dùng thuộc tính `opacity` — cố ý, để không nhân hai lần.
 *   :disabled    WCAG 1.4.3 miễn trừ điều khiển vô hiệu hoá
 *   @keyframes   trạng thái GIỮA của animation, không phải trạng thái đọc
 *   .cd.st-*     opacity trên CẢ THẺ để nói "bản nháp / đã loại" — thẻ mờ là
 *                thông tin trạng thái (quyết định từ FR-008), không phải chữ
 *                bị làm nhạt. Đổi nó là đổi ngữ nghĩa, cần FR.
 *   .sky/.rise/  TRẠNG THÁI ĐẦU của chuyển động (opacity 0 rồi chạy lên 1) và
 *   .bars, `N%`  bước giữa keyframe. Không ai đọc chữ ở đó — `.rise` có sẵn
 *                khối prefers-reduced-motion trả về opacity:1 khi người dùng
 *                tắt chuyển động (motion-polish.test.js canh).
 */
/*
 * FR-041 · thêm 3 nhóm chart mới của màn Kho — CÙNG loại với `.rise`: trạng
 * thái ĐẦU của reveal (opacity 0 → 1 khi vào tầm nhìn), và khối
 * prefers-reduced-motion trả chúng về hiện đủ (kho-hinh-dang.test.js canh).
 * `.sl-` gồm cả `.sl-a` — vùng tô DƯỚI đường, trang trí, không ai đọc chữ ở đó.
 */
const MIEN = /\.grain|\.flare|\.rz-|:disabled|@keyframes|prefers-reduced|\.cd\.st-|\.sky|\.rise|\.bars|\.wf-o|\.lc|\.sl-|^\d+%$/

/**
 * Màu chữ THẬT của một luật: đọc `color:var(--x)` trong chính luật đó.
 *
 * KHÔNG đoán — bản đầu của test này áp --destructive cho MỌI selector và báo
 * sai 6 chỗ: `.bgn` là số đếm ảnh nền, `.more::after` là mũi tên "→"; cả hai
 * không bao giờ mang màu đỏ.
 */
const mauCua = (than, sel) => {
  const m = than.match(/color:\s*var\(--([a-z0-9-]+)\)/)
  if (m && CHU[m[1]]) return [[m[1], CHU[m[1]]]]
  // Không khai màu ⇒ thừa hưởng. Nút có thể mang --destructive; chỗ khác --ink-2.
  return /\.bt\b|dstr/.test(sel)
    ? [["destructive", CHU.destructive], ["ink-2", CHU["ink-2"]]]
    : [["ink-2", CHU["ink-2"]]]
}

/**
 * Cascade: cùng selector có thể khai lại opacity ở dưới — file này có tiền lệ
 * (`.bk-toc .n` opacity .65 ở :395 rồi opacity 1 ở :1113). Lấy bản CUỐI, đúng
 * thứ trình duyệt áp.
 */
const cuoi = new Map()
for (const m of css.matchAll(/([^{}\n][^{}]*)\{([^}]*opacity:\s*(\d*\.?\d+)[^}]*)\}/g)) {
  cuoi.set(m[1].trim().split("\n").pop().trim(), { than: m[2], a: Number(m[3]) })
}

let daKiem = 0
for (const [sel, { than, a }] of cuoi) {
  if (MIEN.test(sel) || MIEN.test(than) || a >= 1) continue
  daKiem++
  for (const [ten, mau] of mauCua(than, sel)) {
    const r = tiLe(tron(mau, NEN, a), NEN)
    ok(r >= 4.5, `\`${sel}\` opacity ${a} · ${ten} → ${r.toFixed(2)}:1`,
      "dưới 4.5 — chữ nhạt hơn thứ contrast-audit đã đo")
  }
}
ok(daKiem > 0, `đã kiểm ${daKiem} luật opacity áp lên chữ`)

console.log("\n3 · Nút trong hàng — nếu làm mờ thì phải còn đọc được\n")

/**
 * FR-021c BỎ opacity khỏi nút trong hàng: nó đổi MÀU CHỮ theo bậc
 * (--ink-3 → --ink-2 → --ink) thay vì làm nhạt một màu đậm. Đổi màu thì mỗi bậc
 * là một token ĐÃ audit; làm nhạt thì sinh ra màu chưa ai đo.
 *
 * Phép kiểm này KHÔNG đòi phải có opacity — nó nói: NẾU có thì phải pass. Khối 2
 * đã quét toàn file; đây là chốt ý định, kèm con số để lần sau ai định làm mờ nút
 * thì khỏi phải đo lại.
 */
const mBt = css.match(/\.rc-r \.bt\{[^}]*opacity:\s*(\d*\.?\d+)/)
if (mBt) {
  const a = Number(mBt[1])
  const rDo = tiLe(tron(CHU.destructive, NEN, a), NEN)
  ok(a >= 1 || rDo >= 4.5, `nút trong hàng opacity ${a} → ${rDo.toFixed(2)}:1`,
    "đỏ trượt trước nhất — nó chỉ có 5.59:1 khi đặc")
} else {
  ok(true, "nút trong hàng KHÔNG dùng opacity — phân cấp bằng màu đã audit")
  const r85 = tiLe(tron(CHU.destructive, NEN, 0.85), NEN)
  const r80 = tiLe(tron(CHU.destructive, NEN, 0.80), NEN)
  ok(r85 >= 4.5 && r80 < 4.5,
    `nếu sau này cần làm mờ: .85 → ${r85.toFixed(2)} pass · .80 → ${r80.toFixed(2)} trượt`)
}

console.log("\n4 · `color-mix` sinh màu chữ MỚI — cũng phải đo\n")

/**
 * Lớp lỗi thứ hai, cùng họ với opacity: `color-mix(in srgb, var(--ok) 72%,
 * var(--ink-2))` tạo ra một màu KHÔNG có trong contrast-audit.json. Audit đo
 * màu gốc; màu pha là màu khác.
 *
 * Tôi vừa mắc: nền hover nút Sửa pha `--ok 10%` làm chữ xanh tụt xuống 4.29:1.
 * Đo lại từng mức thì 6% là mức cao nhất còn pass (4.53). Cổng opacity ở trên
 * KHÔNG bắt được vì đây không phải opacity.
 */
const themMau = { brand: hex("primary"), ok: hex("success"), warn: hex("warning") }
const mix = (a, b, p) => "#" + [1, 3, 5].map((i) => {
  const x = parseInt(a.substr(i, 2), 16), y = parseInt(b.substr(i, 2), 16)
  return Math.round(x * p + y * (1 - p)).toString(16).padStart(2, "0")
}).join("")

let soMix = 0
for (const m of css.matchAll(
  /color:\s*color-mix\(in srgb,\s*var\(--([a-z0-9-]+)\)\s*(\d+)%,\s*var\(--([a-z0-9-]+)\)\)/g)) {
  const [, a, pct, b] = m
  const ma = CHU[a] ?? themMau[a], mb = CHU[b] ?? themMau[b]
  if (!ma || !mb) continue      // token không phải màu chữ (vd --edge) — bỏ qua
  soMix++
  const kq = mix(ma, mb, Number(pct) / 100)
  const r = tiLe(kq, NEN)
  ok(r >= 4.5, `color-mix(${a} ${pct}%, ${b}) = ${kq} → ${r.toFixed(2)}:1`,
    "màu PHA không có trong contrast-audit — audit đo màu gốc")
}
ok(soMix > 0, `đã kiểm ${soMix} màu chữ sinh bằng color-mix`)

console.log("\n5 · Nền hover của nút trong hàng — chữ trên nền PHA\n")

// Nền pha làm nền SÁNG lên ⇒ chữ cùng màu tụt tương phản. Xanh trượt trước đỏ
// vì nó chỉ có 4.89:1 khi đặc (đỏ có 5.59:1).
//
// Tôi vừa mắc: nền hover pha 10% cho chữ xanh 4.29:1. Đo từng mức: 8% → 4.40
// (vẫn trượt), 6% → 4.53 (pass). Đây là chỗ dễ tưởng "nhạt thế thì sao ảnh
// hưởng được" — nhạt 6% đã đủ ăn 0.36 điểm tương phản.
for (const [ten, bien, lop] of [["xanh", "success", "ghost"], ["đỏ", "destructive", "dstr"]]) {
  const mau = hex(bien)
  const khoi = css.match(new RegExp("\\.rc-r \\.bt\\." + lop + ":hover\\{[^}]*\\}"))
  const mPct = khoi && khoi[0].match(/color-mix\(in srgb,var\(--[a-z]+\) (\d+)%/)
  if (!mau || !mPct) { ok(false, `đọc được nền hover của nút ${ten}`); continue }
  const bg = mix(mau, NEN, Number(mPct[1]) / 100)
  const r = tiLe(mau, bg)
  ok(r >= 4.5, `chữ ${ten} trên nền hover pha ${mPct[1]}% → ${r.toFixed(2)}:1`,
    "10% cho 4.29 (trượt) · 6% cho 4.53 (pass) — xanh ít biên hơn đỏ")
}

if (loi.length) {
  console.log(`\nFAIL · ${loi.length} lỗi:\n`)
  for (const d of loi) console.log(`  x  ${d}`)
  console.log("\nSửa: tăng opacity, hoặc đổi sang màu đặc đã audit.")
  process.exit(1)
}
console.log("\npass · opacity không kéo chữ nào xuống dưới 4.5:1")
