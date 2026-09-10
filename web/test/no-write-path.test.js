#!/usr/bin/env node
/**
 * M03-R2 (ban FR-011) - BUNDLE TINH khong duong ghi nao vao kb/.
 *
 * FR-011 tach "web" lam hai: bundle tinh (test nay canh — read-only tuyet doi,
 * deploy duoc) va API bien tap local (web/api/, M08 — api-guard.test.js canh).
 *
 * FE duoc fetch ghi toi WHITELIST LITERAL DONG — nam duong, khong hon:
 *   /api/inbox      FR-010 — nop file vao _inbox/, gate.py hardcode draft
 *   /api/articles   FR-011 — CRUD qua M08, moi ghi qua validate.py --strict
 *   /api/recycle    FR-011 — thung rac (xem/khoi phuc)
 *   /api/concepts   FR-019 — THEM khai niem, doi >=concept_merge_min bai de xuat
 *   /api/categories FR-019 — THEM chu de, ghi ca enum schema, rollback neu cong do
 * Them duong thu SAU la test do — sua test la mot quyet dinh co ho so, khong
 * lot im. (Luan cu cu "schema khoa const draft" da thay bang: gate hardcode
 * draft + 3 truong M1 do NGUOI khai + PATCH /status la cua rieng — FR-012.)
 *
 * VI SAO FR-019 duoc them HAI duong — ghi ro de lan sau doc lai duoc:
 *
 * M02-R3 cam concepts.yaml "bi sua BOI MAY, khong qua nguoi". Ly do no neu ra la
 * may tu SINH ten thi sau 60 bai co rag / RAG / retrieval-augmented — bon ten mot
 * thu. Endpoint nay KHONG sinh ten: no ghi cai nguoi go, va doi bang chung rang
 * nhan do da xuat hien trong >=N bai (concept_merge_min, doc tu thresholds.yaml).
 * Cung khuon lap luan security_baseline §1 dung cho nut Duyet — thu nhay cam hon
 * nhieu: "them be mat, khong them chu the".
 *
 * CHI-THEM: PUT/PATCH/DELETE tren hai duong nay tra 404 (router khong co nhanh).
 * Xoa hay doi ten mot nhan lam bai cu tro vao nhan khong ton tai — viec do van
 * phai qua FR de co nguoi ra lai kho.
 *
 * Quet ma nguon plugin + script + server. KHONG quet emitter (emitter ghi ra
 * output build, do la viec cua no).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const loi = []

// Script chay TREN TRINH DUYET: khong duoc co loi goi ghi nao ngoai /api/inbox
const FE = [
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"),
  join(WEB, "plugins", "backdrop", "src", "backdrop.inline.ts"),
]
// Duong GHI duoc phep: nam duong co dinh + ba duong theo module cua FR-040.
//
// `job` them 2026-09-03 (T03-92). No la duong GHI thu nam, va cong nay do dung
// khi no bat: mot `POST` moi tu trinh duyet phai la mot QUYET DINH duoc khai,
// khong phai mot dong lot vao.
//
// Vi sao `job` duoc phep: `POST /api/job` cua LOI (T08-20) khong ghi vao kho —
// no xep mot viec vao hang doi cua THO, va chinh no la cho khoa dich vu duoc
// gan PHIA SERVER de trinh duyet khong bao gio cam khoa. Duong nay ton tai
// CHINH VI de trinh duyet khong goi thang `:8790`.
//
// `viec` them 2026-09-09 (WO-067): `POST /api/viec/<id>/lai` CHAY LAI mot viec
// HONG. Cung lop voi `job` — doi TRANG THAI o THO, khong ghi kho, khoa dich vu
// gan phia server. Truoc do `viec` co y KHONG nam day vi chi co GET; nay co
// dung MOT POST, va no duoc khai o day nhu mot QUYET DINH, dung nhu cong nay
// doi.
const DUONG_GHI = ["inbox", "articles", "recycle", "concepts", "categories", "job", "viec",
  ...JSON.parse(readFileSync(
    join(WEB, "..", "core", "assets", "loai-nguon.json"), "utf8"))
    .module.map((m) => m.ten)]

const CAM_FE = [
  // Ba dau nhay viet bang MA HEX: `[\x22\x27\x60]` thay cho lop ky tu chua
  // mot backtick. Backtick lam dut moi template literal, va trong chuoi thuong
  // thi moi tang cong cu lai an mot dau gach cheo — day la dang khong tang nao
  // doi duoc.
  [new RegExp(
    "\\bfetch\\(\\s*(?![\\x22\\x27\\x60]\\/api\\/("
    + DUONG_GHI.join("|")
    + "))[^)]*,\\s*\\{[^}]*method\\s*:\\s*[\\x22\\x27](POST|PUT|PATCH|DELETE)",
    "i"),
   "fetch ghi toi duong ngoai whitelist /api/{" + DUONG_GHI.join(",") + "}"],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/navigator\.sendBeacon/, "sendBeacon"],
  [/localStorage\.setItem\([^)]*kb/i, "ghi kb vao localStorage"],
]

console.log("\nM03-R2 - khong duong ghi nao vao kb/\n")

for (const f of FE) {
  const src = readFileSync(f, "utf8")
  const ten = f.slice(WEB.length + 1)
  for (const [re, mo] of CAM_FE) {
    const co = re.test(src)
    console.log(`  ${co ? "FAIL" : "ok  "} ${ten}: khong ${mo}`)
    if (co) loi.push(`${ten} co ${mo}`)
  }
}

// Emitter duoc ghi, nhung CHI vao ctx.argv.output — khong duoc tro vao kb/
const quet = (d, ra = []) => {
  for (const t of readdirSync(d)) {
    if (t === "node_modules") continue
    const p = join(d, t)
    if (statSync(p).isDirectory()) quet(p, ra)
    else if ([".ts", ".tsx", ".mjs", ".js"].includes(extname(t))) ra.push(p)
  }
  return ra
}

for (const f of quet(join(WEB, "plugins"))) {
  const src = readFileSync(f, "utf8")
  const ten = f.slice(WEB.length + 1)
  const ghiKb = /writeFile\s*\([^)]*["'][^"']*\bkb\//.test(src) ||
                /mkdir\s*\([^)]*["'][^"']*\bkb\//.test(src)
  if (ghiKb) { console.log(`  FAIL ${ten}: ghi vao kb/`); loi.push(ten) }
}
console.log(`  ok   khong plugin nao ghi vao kb/`)

// ── web/render/ — module render READ-ONLY voi kho (M03-R2 ban FR-034) ─────
// SSR render tu DB moi request: mot duong ghi trong tang render la mot duong
// ghi chay MOI LAN CO NGUOI MO TRANG — nguy hiem hon moi duong ghi khac.
// Render chi duoc DOC (readFileSync/khoDoc); ghi kho la viec cua web/api qua
// validate, ghi dia la viec cua server.mjs (_inbox/, co test rieng ben duoi).
{
  const RENDER = join(WEB, "render")
  console.log("\nFR-034 · web/render/ — khong duong ghi, khong tien trinh con\n")
  if (!existsSync(RENDER)) {
    console.log("  ok   chua co web/render (chua bat FR-034)")
  } else {
    const srcRender = quet(RENDER).map((f) => readFileSync(f, "utf8")).join("\n")
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
    const kiem = [
      [!/writeFile|appendFile|createWriteStream/.test(srcRender),
       "khong writeFile/appendFile/createWriteStream nao"],
      // RANH GIOI TU tren moi ten ham. `rmSync` tran khop ca ben trong
      // `transformSync` (esbuild) — `transfo`+`rmSync` — nen cong to mot API
      // bien dich la mot phep xoa file. Do oan o mot cong AN NINH con te hon
      // cho khac: no day nguoi doc bo qua dung cai canh bao can doc.
      [!/\bmkdir|\brmSync\b|\brm\s*\(|\bunlink|\brenameSync\b|\bcopyFile/.test(srcRender),
       "khong mkdir/rm/unlink/rename/copy nao"],
      // `re.exec(chuoi)` cua RegExp la phep DOC — thu bi cam la child_process.
      [!/child_process|\bspawn|execSync|execFile|\bfork\s*\(/.test(srcRender),
       "khong tu spawn tien trinh con nao — validate/export la viec cua web/api"],
      [!/\bfetch\s*\(/.test(srcRender),
       "khong fetch — doc kho qua HAM khoDoc(), khong self-HTTP"],
      [!/\blisten\s*\(/.test(srcRender) && !srcRender.includes("0.0.0.0"),
       "khong tu mo cong — entry duy nhat la server.mjs"],
    ]
    for (const [dat, mo] of kiem) {
      console.log(`  ${dat ? "ok  " : "FAIL"} ${mo}`)
      if (!dat) loi.push(`web/render: ${mo}`)
    }
  }
}

// ── server.mjs — file DUY NHAT trong web/ co quyen ghi dia (FR-010) ────────
// Truoc FR-010 test nay chi MIEN TRU emitter. Gio co mot file ghi that, nen
// phai canh CHINH NO — mien tru ma khong canh la mo cua roi khong nhin.
{
  const f = join(WEB, "server.mjs")
  console.log("\nFR-010 · server.mjs chi ghi _inbox/\n")
  if (!existsSync(f)) {
    console.log("  ok   khong co server.mjs (chua bat FR-010)")
  } else {
    const src = readFileSync(f, "utf8")
    const kiem = [
      // Moi loi ghi phai co dich la INBOX. Bat ten bien, khong bat chuoi:
      // join(GOC,"kb",...) ghep dong thi regex chuoi khong thay.
      [!/\bkb\b/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")),
       "khong nhac kb/ ngoai comment"],
      [/writeFileSync\(\s*dich\b/.test(src) || /writeFileSync\([^)]*INBOX/.test(src),
       "writeFileSync chi ghi vao duong da chuan hoa"],
      [/listen\([^)]*["']127\.0\.0\.1["']/.test(src),
       "bind 127.0.0.1, khong 0.0.0.0"],
      [!/["']0\.0\.0\.0["']/.test(src), "khong bind 0.0.0.0"],
      [/function tenAnToan/.test(src), "co ham chuan hoa ten file"],
      [/replace\(\/\[\^a-z0-9\]\+\/g/.test(src) || /\[\^a-z0-9\]/.test(src),
       "chuan hoa bang WHITELIST (khong tim-va-chan `..`)"],
      [/spawn\(/.test(src) && /gate\.py/.test(src),
       "goi gate.py lam tien trinh con, khong viet lai cong (M05-R3)"],
    ]
    for (const [dat, mo] of kiem) {
      console.log(`  ${dat ? "ok  " : "FAIL"} ${mo}`)
      if (!dat) loi.push(`server.mjs: ${mo}`)
    }
  }
}

// ── web/api/ — duong ghi M08 (FR-011): canh chot then o day, ban day du la
// api-guard.test.js. Hai lop cung nhin mot cho la CO Y: sua api-guard ma quen
// sua day (hoac nguoc lai) thi van con mot lop do.
{
  const API = join(WEB, "api")
  console.log("\nFR-011 · web/api/ — then cua co that\n")
  if (!existsSync(API)) {
    console.log("  ok   chua co web/api (chua bat FR-011)")
  } else {
    const srcApi = quet(API).map((f) => readFileSync(f, "utf8")).join("\n")
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
    const kiem = [
      [/spawn\(/.test(srcApi) && /validate\.py/.test(srcApi) && /--strict/.test(srcApi),
       "moi ghi di qua validate.py --strict (M08-R2)"],
      [!/unlink/.test(srcApi), "khong unlink — xoa la recycle (M08-R4)"],
      [!/\blisten\s*\(/.test(srcApi) && !srcApi.includes("0.0.0.0"),
       "khong tu mo cong — entry duy nhat la server.mjs (M08-R1)"],
    ]
    for (const [dat, mo] of kiem) {
      console.log(`  ${dat ? "ok  " : "FAIL"} ${mo}`)
      if (!dat) loi.push(`web/api: ${mo}`)
    }
  }
}

console.log()
if (loi.length) { console.log(`${loi.length} loi`); process.exit(1) }
console.log("pass - bundle tinh chi doc; duong ghi chi qua whitelist dong + validate")
