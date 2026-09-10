#!/usr/bin/env node
/**
 * M03 AC-2.4.2 - khong listener nao ro sau 10 lan dieu huong.
 *
 * SPA routing giu DOM state (dieu F1 dua vao), nhung listener gan lai moi lan
 * `nav` se chong len nhau: lan thu 10 thi mot cu bam chay handler 10 lan.
 *
 * Kiem TINH tren ma nguon thay vi chay trinh duyet: moi addEventListener tren
 * document/window phai co removeEventListener doi ung trong addCleanup.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

console.log("\nM03 AC-2.4.2 - khong ro listener qua SPA nav\n")

const gan = [...src.matchAll(/document\.addEventListener\("(\w+)"/g)].map((m) => m[1])
const go = [...src.matchAll(/document\.removeEventListener\("(\w+)"/g)].map((m) => m[1])

ok(gan.length > 0, `co ${gan.length} listener gan tren document`)
for (const e of new Set(gan)) {
  ok(go.includes(e), `listener "${e}" co removeEventListener doi ung`,
    "gan ma khong go => chong len nhau moi lan nav")
}

ok(/addCleanup\?\.\(/.test(src), "dung window.addCleanup de go",
  "Quartz goi ham nay truoc khi SPA thay trang")

// Handler phai la bien co ten, khong phai ham vo danh — ham vo danh khong go duoc
const voDanh = [...src.matchAll(/document\.addEventListener\("\w+",\s*\(/g)]
ok(voDanh.length === 0, "khong handler vo danh nao", `co ${voDanh.length}`)

console.log()
if (loi.length) { console.log(`${loi.length} loi`); process.exit(1) }
console.log("pass - moi listener deu go duoc")
