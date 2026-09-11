#!/usr/bin/env node
/**
 * T03-148 — C3 · `id` trên heading render KHỚP anchor M13 — cổng đối chiếu BA BẢN (FR-073 A3).
 *
 * Đóng ô mở từ 2026-09-02 ở `06_modules/M03_web/backlog.md`: `md()` render `<h2>`/`<h3>` KHÔNG
 * có `id`, nên `file#anchor` M13 trả về (và chatbot trích) bấm không tới đâu — link chết IM LẶNG
 * vì hai phía đều "chạy đúng". Ba bản của MỘT luật slug: `slugGoiY()` (FE) · `anchor_py()`
 * (M13, `truyhoi/src/anchor.py`) · `id` trong HTML (đơn vị này tạo ra, T03-149).
 *
 * Chạy hàm THẬT: trích `esc` · `slugGoiY` · `md` từ `multiwindow.inline.js` (bản esbuild của
 * `.inline.ts` — dựng bằng `node build-fe.mjs` nếu chưa có) bằng `tach()` (khuôn
 * `chung-cat-nhom-theo-bai.test.js`), ghép bằng `new Function`. Không so với bảng giá trị tay.
 *
 * ĐỒ_KHI  heading không có `id` · `id` ≠ slugGoiY(text) · trùng slug không ra -1/-2 hoặc đổi giữa hai
 *         lần render · hai bài chung state · BA bản lệch ở một heading kho thật (nêu heading + bản)
 * XANH_KHI bốn ca A·B·C·D xanh
 * --tu-kiem   sửa `slice(0, 60)`→`80` hoặc bỏ `đ→d` ở MỘT bản ⇒ ca D phải ĐỎ nêu đúng heading + bản
 * --mot-luat  đếm `normalize("NFD")` trong web/plugins/** và số dòng đổi của multiwindow.inline.ts ở HEAD
 */
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const TEST = import.meta.dirname
const WEB = join(TEST, "..")
const GOC = join(WEB, "..")
const TS = join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts")
const JS = join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js")
const PY = process.env.PYTHON ?? "python"
const TU_KIEM = process.argv.includes("--tu-kiem")
const MOT_LUAT = process.argv.includes("--mot-luat")

/* ── trích hàm từ mã nguồn (khuôn chung-cat-nhom-theo-bai.test.js:44) ──────────── */
function tach(src, ten) {
  const dau = new RegExp(`(?:^|\\n)[\\t ]*((?:async )?(?:function ${ten}\\(|const ${ten} = ))`)
  const m = dau.exec(src)
  if (!m) return null
  const i = m.index + m[0].indexOf(m[1])
  if (m[1].includes("function")) {
    const j = src.indexOf("{", i)
    let sau = 0
    for (let k = j; k < src.length; k++) {
      if (src[k] === "{") sau++
      else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
    }
    return null
  }
  let sau = 0
  for (let k = i; k < src.length; k++) {
    const c = src[k]
    if ("({[".includes(c)) sau++
    else if (")}]".includes(c)) sau--
    else if (c === ";" && sau === 0) return src.slice(i, k + 1)
  }
  return null
}

function nguonJs() {
  if (!existsSync(JS)) execFileSync(process.execPath, ["build-fe.mjs"], { cwd: WEB, stdio: "ignore" })
  return readFileSync(JS, "utf8")
}

/** Dựng {md, slugGoiY} chạy được từ mã nguồn — `bien` cho phép thay thân slugGoiY (tu-kiem). */
function lapMay(src, bien = (s) => s) {
  const esc = tach(src, "esc"), slug = tach(src, "slugGoiY"), md = tach(src, "md")
  if (!esc || !slug || !md) throw new Error(`không trích được: esc=${!!esc} slugGoiY=${!!slug} md=${!!md}`)
  return new Function(`${esc}\n${bien(slug)}\n${md}\nreturn { md, slugGoiY }`)()
}

const idCua = (html) => [...html.matchAll(/<h([2-3])(?:\s+id="([^"]*)")?>/g)].map((m) => ({ cap: m[1], id: m[2] ?? null }))

function anchorPy(headings) {
  const r = spawnSync(PY, ["-c",
    "import sys,json; sys.path.insert(0,'truyhoi/src'); import anchor; print(json.dumps([anchor.slug(h) for h in json.load(sys.stdin)]))"],
  { cwd: GOC, input: JSON.stringify(headings), encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } })
  if (r.status !== 0) throw new Error(`anchor.py: ${(r.stderr || "").slice(0, 200)}`)
  return JSON.parse(r.stdout)
}

function headingKhoThat() {
  const ra = []
  for (const loai of readdirSync(join(GOC, "kb"), { withFileTypes: true })) {
    if (!loai.isDirectory() || loai.name.startsWith("_")) continue
    for (const f of readdirSync(join(GOC, "kb", loai.name))) {
      if (!f.endsWith(".md") || /\.v\d+\.md$/.test(f)) continue
      for (const l of readFileSync(join(GOC, "kb", loai.name, f), "utf8").split(/\r?\n/)) {
        const m = l.match(/^#{2,3}\s+(.+?)\s*#*\s*$/)
        if (m) ra.push(m[1])
      }
    }
  }
  return ra
}

/** Ca D — BA bản trên một danh sách heading. Trả danh sách lệch "heading · bản". */
function soiBaBan(may, headings, py) {
  const lech = []
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const id = idCua(may.md(`## ${h}`))[0]?.id ?? null
    const js = may.slugGoiY(h)
    if (id !== js) lech.push(`\`${h.slice(0, 40)}\` · id HTML=${id} ≠ slugGoiY=${js}`)
    if (py[i] !== js) lech.push(`\`${h.slice(0, 40)}\` · anchor_py=${py[i]} ≠ slugGoiY=${js}`)
  }
  return lech
}

const SRC = nguonJs()

if (MOT_LUAT) {
  console.log("\n--mot-luat · một luật slug, một chỗ sửa nhỏ\n")
  const nfd = []
  const quet = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) quet(p)
    else if (e.name.endsWith(".ts")) readFileSync(p, "utf8").split("\n").forEach((l, i) => { if (l.includes('normalize("NFD")')) nfd.push(`${p.slice(WEB.length + 1)}:${i + 1}`) })
  } }
  quet(join(WEB, "plugins"))
  ok(nfd.length === 1, `normalize("NFD") trong web/plugins/**/*.ts ⇒ đúng 1 chỗ (một luật slug)`, nfd.join(" · "))
  const st = spawnSync("git", ["diff", "--numstat", "HEAD~1", "HEAD", "--", TS], { cwd: GOC, encoding: "utf8" }).stdout.trim()
  const [them, bo] = st ? st.split(/\s+/).map(Number) : [0, 0]
  ok(them + bo <= 8, `diff multiwindow.inline.ts ở HEAD ≤ 8 dòng (rule 15)`, `+${them} −${bo}`)
  chot("một luật · diff nhỏ")
}

if (TU_KIEM) {
  console.log("\n--tu-kiem · ca D phải ĐỔ ĐƯỢC khi MỘT bản lệch\n")
  const hs = ["Hướng dẫn cài đặt", "Đường ống dữ liệu", "Hướng ".repeat(40).trim()]
  const py = anchorPy(hs)
  // Chỉ soi cặp JS↔PY ở đây: bản HTML (id) là thứ T03-149 tạo — trước đó nó null ở MỌI heading,
  // đưa vào tu-kiem là đo trạng thái chưa có mã, không đo phép chấm.
  const jsPy = (l) => l.filter((x) => x.includes("anchor_py"))
  const may80 = lapMay(SRC, (s) => s.replace("slice(0, 60)", "slice(0, 80)"))
  const l1 = jsPy(soiBaBan(may80, hs, py))
  ok(l1.length === 1 && l1[0].includes("Hướng Hướng"), "JS cắt 80 thay 60 ⇒ CHỈ heading dài bị nêu, kèm tên bản (anchor_py ≠ slugGoiY)", l1.join(" · "))
  const mayKhongD = lapMay(SRC, (s) => s.replace('.replace(/đ/g, "d")', ""))
  const l2 = jsPy(soiBaBan(mayKhongD, hs, py))
  // Hai heading có `đ` (`cài đặt` · `Đường ống`) nên bỏ bước đ→d làm lệch CẢ HAI — đòi đúng một là
  // kỳ vọng sai của bản đầu, và một cổng kỳ vọng sai thì đỏ oan đúng lúc nó phải nói thật.
  ok(l2.length === 2 && l2.some((x) => x.includes("Đường ống")) && l2.some((x) => x.includes("cài đặt")),
    "JS bỏ đ→d ⇒ nêu ĐÚNG hai heading có `đ`, không nêu heading khác", l2.join(" · "))
  const may = lapMay(SRC)
  const l3 = jsPy(soiBaBan(may, hs, py))
  ok(l3.length === 0, "hai bản y hệt ⇒ 0 lệch JS↔PY (không đỏ oan)", l3.join(" · "))
  chot("ca D đỏ được, nêu heading + bản")
}

const may = lapMay(SRC)

console.log("\nA · mỗi <h2>/<h3> có id == slugGoiY(text) — kể cả ca đ\n")
const htmlA = may.md("## Hướng dẫn cài đặt\n\nmột\n\n### Đường ống dữ liệu\n\nhai\n")
const ids = idCua(htmlA)
ok(ids.length === 2, "render ra đúng 2 heading", JSON.stringify(ids))
ok(ids[0]?.id === "huong-dan-cai-dat", "`## Hướng dẫn cài đặt` ⇒ id=huong-dan-cai-dat", `id=${ids[0]?.id} (heading không có id)`)
ok(ids[1]?.id === "duong-ong-du-lieu", "`### Đường ống dữ liệu` ⇒ id=duong-ong-du-lieu (ca đ)", `id=${ids[1]?.id}`)

console.log("\nB · trùng slug trong MỘT bài ⇒ -1, -2 · render lại y hệt\n")
const srcB = "## Foo 1\n\nx\n\n## Foo\n\ny\n\n## Foo\n\nz\n\n## Foo\n\nw\n"
const b1 = idCua(may.md(srcB)).map((x) => x.id)
const b2 = idCua(may.md(srcB)).map((x) => x.id)
ok(JSON.stringify(b1) === JSON.stringify(["foo-1", "foo", "foo-2", "foo-3"]), "`Foo 1 · Foo · Foo · Foo` ⇒ foo-1 · foo · foo-2 · foo-3 (github-slugger, vòng while)", JSON.stringify(b1))
ok(JSON.stringify(b1) === JSON.stringify(b2), "render lại ⇒ cùng hậu tố (ổn định)", JSON.stringify(b2))

console.log("\nC · cùng slug ở HAI bài ⇒ mỗi bài không hậu tố (state theo bài, reset mỗi md())\n")
const c1 = idCua(may.md("## Hướng dẫn cài đặt\n\na\n")).map((x) => x.id)
const c2 = idCua(may.md("## Hướng dẫn cài đặt\n\nb\n")).map((x) => x.id)
ok(c1[0] === "huong-dan-cai-dat" && c2[0] === "huong-dan-cai-dat", "hai bài, hai lần md() ⇒ cả hai `huong-dan-cai-dat`, không -1", `${c1} · ${c2}`)

console.log("\nD · BA bản trên heading KHO THẬT — id HTML == slugGoiY == anchor_py (FR-073 A3)\n")
const hs = headingKhoThat()
console.log(`  ·  N = ${hs.length} heading thật trong kb/*/*.md` + (hs.length < 50 ? " — ngưỡng 50 chưa đạt, so trên toàn bộ N" : ""))
ok(hs.length > 0, "kho có heading để so")
const py = anchorPy(hs)
const lech = soiBaBan(may, hs, py)
ok(lech.length === 0, `${hs.length}/${hs.length} heading: ba bản khớp từng ký tự`, lech.slice(0, 3).join(" · "))

chot("id trên heading == slugGoiY == anchor_py · dedup -1/-2 ổn định · state theo bài")
