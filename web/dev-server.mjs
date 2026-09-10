#!/usr/bin/env node
/**
 * May chu xem thu — HAI CHE DO du lieu.
 *
 *   npm run dev       doc kb-mock/ — kho bai MAU (13 ban ghi)
 *   npm run dev:kb    doc kb/ that
 *
 * Vi sao chon bang bien moi truong chu khong phai nut tren web: du lieu duoc
 * quyet dinh luc BUILD — Quartz doc thu muc content roi sinh HTML tinh. Mot nut
 * tren web chi doi duoc thu da build san; muon doi NGUON thi phai build lai.
 *
 * `npm run build` (ban phat hanh) LUON doc kb/ that, khong bao gio sample.
 */
import { spawn } from "node:child_process"
import { existsSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"


const WEB = dirname(fileURLToPath(import.meta.url))
const CONG = process.env.PORT ?? "8080"
// Tham so dong lenh, khong phai bien moi truong: `GN_DATA=x cmd` khong chay
// tren PowerShell, va them cross-env la them phu thuoc cho mot viec nho.
const CHE_DO = process.argv.includes("--kb") || process.env.GN_DATA === "kb"
  ? "kb" : "mau"

const KB = join(WEB, "..", "kb")
const KB_MOCK = join(WEB, "..", "kb-mock")

function demBai(d) {
  if (!existsSync(d)) return 0
  let n = 0
  const quet = (x) => {
    for (const f of readdirSync(x, { withFileTypes: true })) {
      if (f.isDirectory()) quet(join(x, f.name))
      else if (f.name.endsWith(".md") && f.name.toLowerCase() !== "readme.md") n++
    }
  }
  quet(d)
  return n
}

let nguon
if (CHE_DO === "kb") {
  nguon = KB
  const n = demBai(KB)
  console.log(`che do    : DU LIEU THAT (kb/)`)
  console.log(`kho       : ${n} ban ghi`)
  if (n === 0) {
    console.log("")
    console.log("  kb/ dang RONG — site se khong co bai nao.")
    console.log("  Nap bai that, hoac dung `npm run dev` de xem tren sample.")
    console.log("")
  }
} else {
  // kb-mock/ la thu muc THAT trong repo — khong sinh kho tam nua.
  // Truoc do dev-server goi seed() de dung kho tam tu contract JSON; gio kho
  // mau da la .md trong repo, doc thang duoc.
  nguon = KB_MOCK
  console.log(`che do    : MAU (kb-mock/)`)
  console.log(`kho       : ${demBai(KB_MOCK)} ban ghi tu kb-mock/`)
}

// Build ra thu muc TAM, khong tranh web/site/ voi `npm run build`.
// Quartz xoa sach thu muc output truoc moi build; dung chung thi may chu dang
// chay giu khoa va lan sau chet voi "EBUSY: rmdir web/site".
const RA = join(tmpdir(), `grown-news-dev-${CHE_DO}`)
if (existsSync(RA)) {
  try { rmSync(RA, { recursive: true, force: true }) } catch { /* Quartz se bao */ }
}

console.log(`build ra  : ${RA}`)
console.log(`dia chi   : http://localhost:${CONG}`)
console.log("")

const p = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["quartz", "build", "-d", nguon, "-o", RA, "--serve", "--port", CONG],
  { cwd: join(WEB, "_quartz"), stdio: "inherit", shell: process.platform === "win32" },
)

p.on("exit", (ma) => process.exit(ma ?? 0))
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => { p.kill(sig); process.exit(0) })
}
