#!/usr/bin/env node
/**
 * Hai kho phải TÁCH RIÊNG, và contract không được làm nguồn web.
 *
 * Người dùng hỏi: *"data mock lưu ở đâu, data thật lưu ở đâu, yêu cầu tách
 * riêng ra"*. Trước đó mock đọc thẳng `05_uiux/contracts/analyses.sample.v3.json`
 * — file có **hai vai lẫn nhau**:
 *
 *   hợp đồng G5   test đọc `_expected_render`, FROZEN, sửa phải qua FR
 *   kho bài mẫu   web đọc để dựng `/mock/`, sửa thoải mái
 *
 * Gộp làm một nghĩa là: thêm một bài mẫu ⇒ đụng contract ⇒ mở FR. Vô lý.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const ROOT = join(WEB, "..")

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

const demMd = (d) => {
  if (!existsSync(d)) return 0
  let n = 0
  const quet = (x) => {
    for (const f of readdirSync(x)) {
      const p = join(x, f)
      if (statSync(p).isDirectory()) quet(p)
      else if (f.endsWith(".md") && f.toLowerCase() !== "readme.md") n++
    }
  }
  quet(d)
  return n
}

console.log("\nHai kho tách riêng\n")

const KB = join(ROOT, "kb")
const MOCK = join(ROOT, "kb-mock")

ok(existsSync(KB), "kb/ tồn tại — dữ liệu THẬT")
ok(existsSync(MOCK), "kb-mock/ tồn tại — dữ liệu MẪU",
  "không có thì mock phải mượn contract làm nguồn")

const nMock = demMd(MOCK)
ok(nMock > 0, `kb-mock/ có ${nMock} bản ghi`)

// Cùng định dạng ⇒ cùng một hàm đọc, không có hai đường parse để lệch nhau
console.log("\nkb-mock/ dùng ĐÚNG định dạng kb/\n")

const mauMd = []
const quet = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) quet(p)
    else if (f.endsWith(".md") && f.toLowerCase() !== "readme.md") mauMd.push(p)
  }
}
quet(MOCK)

let duFrontmatter = 0
for (const p of mauMd) {
  if (/^---\r?\n[\s\S]*?\r?\n---/.test(readFileSync(p, "utf8"))) duFrontmatter++
}
ok(duFrontmatter === mauMd.length,
  `${duFrontmatter}/${mauMd.length} file có frontmatter YAML`,
  "sai định dạng ⇒ phải viết hàm đọc riêng ⇒ hai đường parse lệch nhau")

ok(existsSync(join(MOCK, "concepts.yaml")), "kb-mock/ có concepts.yaml như kb/")
ok(mauMd.some((p) => /\.v\d+\.md$/.test(p)),
  "có bản lưu trữ *.v<n>.md", "cần nó để kiểm luật 'bản lưu trữ không lên site'")

console.log("\nContract KHÔNG còn là nguồn của web\n")

const emitter = readFileSync(join(WEB, "plugins", "home-pages", "index.ts"), "utf8")
ok(!emitter.includes("analyses.sample"),
  "emitter không đọc contract JSON",
  "contract là HỢP ĐỒNG G5 — frozen, sửa phải qua FR")
ok(emitter.includes("kb-mock"), "emitter đọc kb-mock/")

const dev = readFileSync(join(WEB, "dev-server.mjs"), "utf8")
ok(!dev.includes("analyses.sample"), "dev-server không đọc contract JSON")
ok(dev.includes("kb-mock"), "dev-server đọc kb-mock/")

// Một hàm đọc cho cả hai kho — không có docContract() riêng
ok(!emitter.includes("function docContract"),
  "không có hàm đọc riêng cho mock",
  "hai đường parse sẽ lệch nhau ngay lần đầu schema đổi")

console.log("\nkb-mock/ không được lẫn vào kb/\n")

// Bài mẫu vào kb/ thật thì M1 đo sai — nó đếm cả bài không do người nạp
const slugMock = new Set(mauMd.map((p) => p.split(/[/\\]/).pop()))
const thatMd = []
if (existsSync(KB)) {
  const q = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f)
      if (statSync(p).isDirectory()) q(p)
      else if (f.endsWith(".md") && f.toLowerCase() !== "readme.md") thatMd.push(f)
    }
  }
  q(KB)
}
const lan = thatMd.filter((f) => slugMock.has(f))
ok(lan.length === 0, `kb/ không chứa bài mẫu nào`,
  `lẫn ${lan.join(" ")} — M1 sẽ đếm cả bài không do người nạp`)

console.log("\nCó cách sinh lại kb-mock/\n")

const sinh = join(ROOT, "core", "tools", "sinh_kb_mock.py")
ok(existsSync(sinh), "core/tools/sinh_kb_mock.py tồn tại",
  "không có thì kho mẫu thành thứ không ai dựng lại được")
ok(existsSync(join(MOCK, "README.md")), "kb-mock/README.md giải thích vai trò")

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · hai kho tách riêng, contract giữ đúng vai hợp đồng")
