#!/usr/bin/env node
/**
 * AC-2.4.1 (M08) — chặn bù là CẤU TRÚC CODE, kiểm tĩnh không cần chạy server.
 *
 * Năm điều, mỗi điều là răng của một rule:
 *   1 handler KHÔNG cầm lời gọi fs ghi nào — mọi ghi sống ở dungchung.mjs
 *   2 dungchung có spawn validate.py --strict, và không có unlink ở đâu cả
 *   3 không listen( / 0.0.0.0 trong web/api/** (M08-R1 — cổng duy nhất là server.mjs)
 *   4 không literal default cho trường quyết định (M08-R3 — B-B1 bằng máy)
 *   5 không đường nào ghi "approved" bằng literal (chỉ PATCH gán từ biến)
 */
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST = dirname(fileURLToPath(import.meta.url))
const API = join(TEST, "..", "api")

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// So code, không so lời kể — bỏ comment trước khi quét (cùng cách no-write-path
// xử server.mjs: một dòng chú thích vô hại không được phép che một đường thật).
const boComment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")

const tenFile = readdirSync(API).filter((f) => f.endsWith(".mjs"))
const src = Object.fromEntries(
  tenFile.map((f) => [f, boComment(readFileSync(join(API, f), "utf8"))]))
const tatCa = Object.values(src).join("\n")
const handler = tenFile.filter((f) => f !== "dungchung.mjs")

console.log(`\n1 · Handler không cầm đường ghi (${handler.join(", ")})\n`)

const GHI = /\b(writeFileSync|writeFile|renameSync|rename|rmSync|rmdirSync|unlinkSync|unlink|appendFile\w*|createWriteStream|mkdirSync|mkdtempSync|truncateSync|copyFileSync)\s*\(/
for (const f of handler) {
  const m = GHI.exec(src[f])
  ok(!m, `${f} không có lời gọi fs ghi`, m ? `thấy ${m[1]}(` : "")
}

/*
 * VÀ NHẬT KÝ KHÔNG ĐƯỢC QUAY VỀ `web/api/`.
 *
 * `nhatky.mjs` (chỉ đạo 2026-09-05) PHẢI ghi file, nên nó sống ở `web/`, ngoài
 * thư mục handler. Vế này chốt chỗ đó lại: không có nó thì lần sau ai đó dời nó
 * vào `api/` "cho gọn", cổng trên đỏ, và cách sửa nhanh nhất trông như thêm nó
 * vào một danh sách MIỄN — tức mở lại đúng ranh giới luật này bảo vệ.
 *
 * Đo bằng SỰ TỒN TẠI của file, không bằng một danh sách miễn: danh sách miễn là
 * chỗ mọi ngoại lệ sau này trôi vào.
 */
ok(!tenFile.includes("nhatky.mjs"),
  "`nhatky.mjs` KHÔNG nằm trong `web/api/` — nó là hạ tầng, không phải handler",
  "nó cầm đường ghi; để nó cạnh handler là để một mồi ghi-tuỳ-ý cạnh chỗ nhận "
  + "request. Chỗ của nó là `web/nhatky.mjs`")

console.log("\n2 · dungchung.mjs — mọi ghi kho đứng sau validate.py\n")

const dc = src["dungchung.mjs"] ?? ""
ok(/spawn\(/.test(dc) && /validate\.py/.test(dc) && /--strict/.test(dc),
  "có spawn validate.py --strict — cổng là python thật, không viết lại bằng JS (M05-R3)")
ok(!/unlink/.test(tatCa), "không unlink ở BẤT KỲ đâu trong web/api (M08-R4)")
const rmXaiSai = [...dc.matchAll(/rmSync\(\s*(\w+)/g)].filter((m) => !/^tmp/.test(m[1]))
ok(rmXaiSai.length === 0, "rmSync chỉ dọn thư mục tạm (biến tmp*), không trỏ kho",
  rmXaiSai.map((m) => m[1]).join(", "))
/*
 * FR-034 · API KHÔNG DI CHUYỂN/GHI FILE KHO NỮA — nguồn chân lý là DB, đường
 * ghi file kb/** duy nhất là core/tools/xuat_kho.py (spawn qua banXuat).
 * `renameSync` từng sống trong 3 hàm (doiTenBenBi/chuyenSangRac/phucHoi) —
 * cả ba giờ đi qua DB. MỘT lời gọi renameSync mọc lại là một đường ghi file
 * thứ hai: đúng "hai nguồn chân lý" mà M02-R2 chống.
 */
ok(!/renameSync\(/.test(dc), "KHÔNG renameSync nào trong dungchung.mjs (FR-034 — file là export)")
// writeFileSync chỉ được phục vụ tmp của validate (compose bài + snapshot
// danh mục) — mọi dòng gọi nó phải nhắc một biến tmp*/conc/cat, không bao giờ
// nhắc KB/RAC.
const dongGhiKho = dc.split("\n").filter((l) =>
  /(writeFileSync|appendFileSync)\(/.test(l) && /\b(KB|RAC)\b|kb\//.test(l))
ok(dongGhiKho.length === 0, "writeFileSync không dòng nào trỏ kho — chỉ tmp validate",
  dongGhiKho[0]?.trim().slice(0, 70) ?? "")

// Mutation SQL chỉ ở dungchung.mjs — handler không cầm prepare/BEGIN.
for (const f of handler) {
  ok(!/\.prepare\(|BEGIN IMMEDIATE|DatabaseSync/.test(src[f]),
    `${f} không cầm SQL — mọi mutation ở dungchung.mjs`)
}

/*
 * Mỗi hàm ghi DB (chứa `giaoDich(`) PHẢI gọi `banXuat(` — thiếu là DB đổi mà
 * export không đổi: kb/ thành ảnh chết, git status nói dối. Cùng bài học
 * "banIndex ở mọi đường ghi" của FR-023, đổi đối tượng.
 */
const bienGioi = [...dc.matchAll(
  /^(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(?:export\s+)?const\s+(\w+)\s*=/gm)]
  .map((m) => ({ ten: m[1] ?? m[2], tai: m.index }))
const trongHam = (vt) => {
  let ten = "(ngoài mọi hàm)"
  for (const h of bienGioi) { if (h.tai <= vt) ten = h.ten; else break }
  return ten
}
const hamGhiDb = [...new Set([...dc.matchAll(/giaoDich\(/g)].map((m) => trongHam(m.index)))]
  .filter((h) => h !== "giaoDich")
const hamCoXuat = new Set([...dc.matchAll(/banXuat\(/g)].map((m) => trongHam(m.index)))
const thieuXuat = hamGhiDb.filter((h) => !hamCoXuat.has(h))
ok(hamGhiDb.length >= 5 && thieuXuat.length === 0,
  `mỗi hàm ghi DB đều banXuat() — ${hamGhiDb.length} hàm giaoDich, đủ cặp`,
  thieuXuat.length ? `thiếu banXuat ở: ${thieuXuat.join(", ")}` : `chỉ thấy ${hamGhiDb.length} hàm giaoDich`)

console.log("\n3 · Không tự mở cổng mạng (M08-R1)\n")

ok(!/\blisten\s*\(/.test(tatCa), "không listen( trong web/api — cổng duy nhất là server.mjs")
ok(!tatCa.includes("0.0.0.0"), "không 0.0.0.0")
ok(!/createServer/.test(tatCa), "không createServer trong web/api")

console.log("\n4 · Không default trường quyết định (M08-R3 — B-B1 bằng máy)\n")

// Literal ngay sau : hoặc = là máy tự điền. Gán từ biến (p.insight_new) thì được.
for (const truong of ["insight_new", "skill_installed", "review_minutes", "reject_reason"]) {
  const m = new RegExp(`${truong}\\s*[:=]\\s*(true|false|-?\\d|["'\`])`).exec(tatCa)
  ok(!m, `không literal default cho ${truong}`, m ? `thấy: ${m[0]}` : "")
  const macDinh = new RegExp(`${truong}[^\\n]*\\?\\?`).exec(tatCa)
  ok(!macDinh, `không toán tử ?? trên ${truong}`, macDinh ? macDinh[0].slice(0, 60) : "")
}

console.log("\n5 · Không đường literal nào tới approved\n")

/*
 * FR-033 · MỘT ngoại lệ, khai bằng TÊN HÀM — không nới thành "được phép ở đâu đó".
 *
 * Người dùng bỏ hẳn bước duyệt: bài tạo trên web lên site ngay. Nên `taoBai`
 * PHẢI gán `approved` bằng literal — đó là cả điểm của thay đổi.
 *
 * Nhưng luật cũ vẫn đúng ở MỌI CHỖ KHÁC: `doiTrangThai` lấy đích từ body người
 * gửi qua `BANG_CHUYEN`, không tự chọn. Một literal `approved` mọc ở đó là máy
 * tự đưa bài lên site sau lưng người dùng — đúng thứ B-B1 chống, và thứ này
 * KHÔNG nằm trong cái người dùng vừa bỏ.
 *
 * Nên phép kiểm đếm THEO HÀM, không đếm số lần: cho một chỗ có tên, cấm phần
 * còn lại. Đếm số lần thì thêm một literal ở `doiTrangThai` rồi bớt một ở
 * `taoBai` là tổng vẫn khớp.
 */
{
  const CHO_PHEP = "taoBai"
  const src = readFileSync(join(API, "articles.mjs"), "utf8")
  const bienGioi = [...src.matchAll(
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(?:export\s+)?const\s+(\w+)\s*=/gm)]
    .map((m) => ({ ten: m[1] ?? m[2], tai: m.index }))
  const trongHam = (vt) => {
    let ten = "(ngoài mọi hàm)"
    for (const h of bienGioi) { if (h.tai <= vt) ten = h.ten; else break }
    return ten
  }
  // Quét CẢ hai file có thể gán trạng thái, nhưng chỉ `articles.mjs` có hàm tên.
  const khac = [...tatCa.matchAll(/review_status\s*[:=]\s*["'`]approved/g)]
  const trongArticles = [...src.matchAll(/review_status\s*[:=]\s*["'`]approved/g)]
    .map((m) => trongHam(m.index))
  const sai = [...new Set(trongArticles)].filter((h) => h !== CHO_PHEP)
  ok(sai.length === 0,
    `literal 'approved' CHỈ trong \`${CHO_PHEP}\` (${trongArticles.length} chỗ)`,
    sai.length ? `mọc ở: ${sai.join(", ")}` : "")
  ok(khac.length === trongArticles.length,
    "không file API nào khác gán 'approved' bằng literal",
    `${khac.length - trongArticles.length} chỗ ngoài articles.mjs`)
  // Chiều ngược: `taoBai` PHẢI còn gán — mất nó là bài tạo mới lại vào hàng đợi.
  ok(trongArticles.includes(CHO_PHEP),
    `\`${CHO_PHEP}\` vẫn đưa bài mới lên site ngay`,
    "mất literal này là bài tạo trên web quay về `draft` — dựng lại hàng đợi")
}

console.log("\n6 · KHÔNG còn đường build-sau-ghi — SSR thay build (FR-034/C3)\n")

/*
 * FR-034/C3 · SSR đọc DB ngay lúc request, nên `dungLaiTrang()` (FR-035 —
 * spawn `npm run build` sau mỗi export) đã GỠ. Phép kiểm ĐẢO CHIỀU so với bản
 * trước: một đường build-sau-ghi mọc lại trong dungchung.mjs là quay về kiến
 * trúc cũ — hai tầng render (SSR + bundle tĩnh) cùng sống thì chúng lệch nhau
 * im lặng, và mỗi lần ghi lại trả giá một lần build không ai đọc.
 * `npm run build` chạy TAY vẫn hợp lệ — luật này chỉ canh dungchung.mjs.
 */
{
  const dc2 = src["dungchung.mjs"] ?? ""
  ok(!/dungLaiTrang/.test(dc2),
     "không còn `dungLaiTrang` trong dungchung.mjs",
     "SSR đã thay build — đường build-sau-ghi mọc lại là kiến trúc cũ")
  ok(!/npm run build/.test(dc2) && !/spawn\(\s*["'`]npm["'`]/.test(dc2),
     "không spawn npm/`npm run build` từ đường ghi nào",
     "ghi xong là trang ĐÃ mới (SSR đọc DB) — build ở đây chỉ đốt 7 giây/lượt")
  // `banXuat` vẫn phải sống: export DB→file là đường backup git (FR-034),
  // gỡ nhầm nó khi dọn build là mất luôn ảnh kb/ trong git.
  ok(dc2.includes("export function banXuat"), "`banXuat` (export DB→file) vẫn còn")
}

console.log("\n7 · Hai trần RIÊNG — TRAN không bị nới để chứa hiện vật (M09-R5)\n")

/*
 * FR-036/B3 · `TRAN` là chặn bù của MỌI lần ghi bài (FR-010), không của riêng
 * đường media. Nới nó để chứa một PDF 25 MB là nới cả cửa kia — và cửa kia là
 * cửa mà `docBody` bảo vệ trước validate.py.
 *
 * Phép kiểm ghim GIÁ TRỊ, không ghim "có tồn tại": một hằng đúng tên mà sai số
 * là đúng thứ luật này chống. Đổi cách viết (`1024 ** 2`) cũng đỏ — cố ý: đây
 * là hợp đồng về một con số, và một con số thì viết một cách.
 */
{
  const dc3 = src["dungchung.mjs"] ?? ""
  ok(/export const TRAN = 1024 \* 1024\b/.test(dc3),
    "TRAN vẫn đúng `1024 * 1024` (1 MB) — đường JSON không bị nới",
    "nới TRAN để chứa hiện vật là hạ chặn của mọi lần ghi bài (M09-R5)")
  ok(/export const TRAN_MEDIA\b/.test(dc3),
    "TRAN_MEDIA là hằng RIÊNG, không dùng lại TRAN")
  // Trần media KHAI ở media-mime.json (cùng chỗ với bảng mime + host video —
  // cả ba trả lời cùng câu "thư viện gồm gì"). Gõ 26214400 vào đây là bản thứ
  // hai, và bản thứ hai luôn là bản sẽ lệch.
  const dongTran = /export const TRAN_MEDIA\s*=\s*([^\n]+)/.exec(dc3)
  ok(dongTran && /tran_byte/.test(dongTran[1]),
    "TRAN_MEDIA đọc `tran_byte` từ media-mime.json, không gõ số lần thứ hai",
    dongTran ? dongTran[1].trim() : "không thấy khai TRAN_MEDIA")
  ok(dongTran && !/\d{5,}/.test(dongTran[1]),
    "và không có số byte thô nào trên dòng khai đó",
    dongTran ? dongTran[1].trim() : "")
  // Enum mime cũng vậy: 5 chuỗi mime dài là tập gõ tay điển hình.
  ok(/media-mime\.json/.test(dc3),
    "dungchung.mjs đọc bảng mime từ media-mime.json")
  ok(!/openxmlformats/.test(dc3),
    "không chuỗi mime nào gõ tay trong dungchung.mjs — enum đến từ bảng khai",
    "hai bản gõ tay lệch nhau là cách file export mang đuôi khác content-type")
}

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · chặn bù nằm trong cấu trúc code, không nằm trong lời hứa")
