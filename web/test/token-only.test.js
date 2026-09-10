#!/usr/bin/env node
/**
 * M03-R4 · AC-2.5.1 — không gõ lại giá trị token.
 *
 * s5 mất 20 bản mới hết lệch. Bản v4 gõ tay 9 giá trị spacing cho cùng một vai
 * ⇒ mất nhịp; v19 cửa sổ đọc dùng clamp tự do ⇒ chữ 19.3px giữa hệ 15px.
 * Một giá trị gõ tay là một chỗ sẽ lệch khi token đổi.
 *
 * Quét mọi .scss/.css/.ts/.tsx trong web/ (trừ _quartz và node_modules):
 * cấm px/rem cho font-size, margin, padding, gap, line-height — trừ 0 và 1px.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { basename, join, extname } from "node:path"

const GOC = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
// site/ là OUTPUT BUILD — CSS do Quartz sinh, không phải mã ta viết. Quét nó
// thì test báo 129 lỗi trên thứ ta không sở hữu và không sửa được.
// Luật "không gõ lại token" áp cho MÃ NGUỒN của M03, không cho thượng nguồn.
// `site-tam-cat` — FR-034/C5: phép kiểm chính của C5 đổi tên tạm `site/` sang
// tên này rồi chạy lại bộ test; output build cũ không thành mã nguồn nhờ đổi tên.
const BO_QUA = new Set(["_quartz", "node_modules", "public", "site",
                        "site-tam-cat", ".git", "test"])

// prototype.css: MIỄN THEO GIÁ TRỊ, không miễn theo file.
//
// Miễn trừ cũ bỏ qua CẢ FILE, với lý do "bê nguyên 437 dòng hợp đồng G5". Lý do
// đó đúng khi file có 437 dòng. Nó giờ **2046 dòng** — phần lớn là mã ta viết
// (FR-011 … FR-027) — nên miễn cả file có nghĩa **M03-R4 không có răng trên file
// CSS lớn nhất dự án**. Đo được: 59 giá trị ≥8px gõ tay nằm im trong đó, gồm 9
// luật `font-size`.
//
// Miễn đúng phạm vi của lý do gốc: **px < 8**. Đó là chi tiết tinh chỉnh mắt
// (2px vạch, 3px lệch, 6px góc) và thang `--s-*` bắt đầu ở 4px nên chúng thật sự
// không có token tương ứng. Từ 8px trở lên là **nhịp bố cục** — phải qua token.
//
// Nếu sau này cần một bậc mới: thêm vào `tokens.css`, đừng nới miễn trừ. Thiếu
// bậc là lý do 9 luật kia gõ px ngay từ đầu.
const MIEN_DUOI_8PX = new Set(["prototype.css"])
const chi_duoi_8px = (v) => {
  const so = [...v.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1]))
  return so.length > 0 && Math.max(...so) < 8
}
const DUOI = new Set([".scss", ".css", ".ts", ".tsx"])

// Thuộc tính phải đi qua token. line-height là tỉ lệ nên cho phép số trần.
const THUOC_TINH = /\b(font-size|margin|margin-\w+|padding|padding-\w+|gap|row-gap|column-gap|border-radius)\s*:\s*([^;}\n]+)/gi
// Cho phép: 0, 1px (đường kẻ), var(), calc() chứa var(), %, em trong clamp neo token
// Cho phép: 0, auto (căn giữa — không phải giá trị spacing), 1px (đường kẻ),
// % và các từ khoá. Và clamp() có neo token: DESIGN.md §2 ĐÒI cửa sổ đọc dùng
// clamp neo vào thang — cấm nó là cấm chính luật của s5.
// `0 0 0 auto` (căn phải trong flex) là TỪ KHOÁ CĂN, không phải giá trị nhịp —
// cùng vai với `0 auto` đã cho phép sẵn.
const CHO_PHEP = /^(0|0px|auto|inherit|initial|unset|none|1px|100%|0 auto|0 0 0 auto|-?\d*\.?\d+%)$/i
const CLAMP_NEO = /^clamp\(\s*\.?\d*\.?\d+rem\s*,[^,]+,\s*\.?\d*\.?\d+rem\s*\)$/

function quet(dir, ra = []) {
  for (const ten of readdirSync(dir)) {
    if (BO_QUA.has(ten)) continue
    const p = join(dir, ten)
    if (statSync(p).isDirectory()) quet(p, ra)
    else if (DUOI.has(extname(ten))) ra.push(p)
  }
  return ra
}

const loi = []
let nFile = 0
let nBoQua = 0

for (const f of quet(GOC)) {
  nFile++
  // Bỏ comment TRƯỚC khi quét: lượt đầu test đọc chữ "font-size" trong một dòng
  // giải thích và báo lỗi trên văn bản, không phải trên CSS.
  const mienNho = MIEN_DUOI_8PX.has(basename(f))
  const txt = readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
  for (const m of txt.matchAll(THUOC_TINH)) {
    const [, prop, giaTri] = m
    const v = giaTri.trim()
    if (v.includes("var(--")) continue          // đi qua token — đúng
    if (CHO_PHEP.test(v)) continue
    if (CLAMP_NEO.test(v)) continue          // clamp neo thang — DESIGN.md §2
    if (mienNho && chi_duoi_8px(v)) { nBoQua++; continue }   // tinh chỉnh <8px
    const dong = txt.slice(0, m.index).split("\n").length
    loi.push(`${f.replace(GOC, "")}:${dong}  ${prop}: ${v}`)
  }
}

console.log(`quét ${nFile} file trong web/ (bỏ _quartz, node_modules, public/site)`)
/*
 * TOKEN CHUA KHAI — `var(--x)` trỏ vào thứ không tồn tại.
 *
 * Lỗi IM LẶNG: không cảnh báo, không đỏ, chỉ một màu sai. Vừa trúng —
 * `var(--c-docs)` ở ba chỗ và token đó không có; viền "màu của module" rơi về
 * `rgb(23,23,26)` gần như đen, và nó đi qua một lượt quét 68 file test.
 *
 * Khai báo tìm ở CẢ `tokens.css` và mọi file vừa quét: một token có thể khai
 * cục bộ trong một khối `@media` hay `[data-theme]`.
 * Bỏ qua `var(--x, dự-phòng)`: ở đó thiếu token là CHỦ Ý.
 */
{
  const chuKhai = new Set()
  const daDung = new Map()
  const TOKENS = join(GOC, "..", "05_uiux", "tokens.css")
  const nguon = [...quet(GOC)]
  if (statSync(TOKENS, { throwIfNoEntry: false })) nguon.push(TOKENS)
  for (const f of nguon) {
    if (![".css", ".scss"].includes(extname(f))) continue
    const txt = readFileSync(f, "utf8")
    for (const m of txt.matchAll(/(--[a-z0-9-]+)\s*:/g)) chuKhai.add(m[1])
    for (const m of txt.matchAll(/var\((--[a-z0-9-]+)\s*\)/g)) {
      if (!daDung.has(m[1])) daDung.set(m[1], basename(f))
    }
  }
  const thieu = [...daDung].filter(([t]) => !chuKhai.has(t))
  for (const [t, f] of thieu) {
    loi.push(`${f}: \`var(${t})\` — TOKEN CHUA KHAI o dau ca`)
  }
  console.log(`${daDung.size} token duoc dung · ${chuKhai.size} token duoc khai`
    + (thieu.length ? ` · ${thieu.length} CHUA KHAI` : " · khong thieu"))
}

if (nBoQua) console.log(`bỏ qua ${nBoQua} giá trị tinh chỉnh <8px trong prototype.css`)
if (loi.length) {
  console.log()
  for (const l of loi) console.log("  FAIL", l)
  console.log(`\n${loi.length} giá trị gõ tay — phải dùng var(--token) từ 05_uiux/tokens.css`)
  process.exit(1)
}
console.log("pass · không giá trị spacing/font-size nào gõ tay ngoài token")
