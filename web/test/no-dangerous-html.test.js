#!/usr/bin/env node
/**
 * M03-R3 · AC-2.1.3 — allowDangerousHTML KHÔNG được bật.
 *
 * Nội dung .md sinh từ nguồn ngoài untrusted (security_baseline §2). Quartz
 * sanitize mặc định; bật cờ này là mở đường cho script nhúng trong markdown
 * chạy trên site.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const loi = []

for (const f of ["quartz.config.yaml", "_quartz/quartz.config.yaml"]) {
  let t
  try { t = readFileSync(join(WEB, f), "utf8") } catch { continue }
  const bat = t.match(/allowDangerousHTML\s*:\s*true/i)
  console.log(`  ${bat ? "FAIL" : "ok  "} ${f}: allowDangerousHTML ${bat ? "BẬT" : "không bật"}`)
  if (bat) loi.push(f)

  // analytics phải null — công cụ cá nhân, không gửi dữ liệu đi đâu
  const an = t.match(/provider:\s*(\w+)/)
  const sach = !an || an[1] === "null"
  console.log(`  ${sach ? "ok  " : "FAIL"} ${f}: analytics ${an ? an[1] : "không khai"}`)
  if (!sach) loi.push(`${f} analytics`)
}

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · markdown được sanitize, không gửi dữ liệu ra ngoài")
