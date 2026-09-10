/**
 * M08_api — đồ dùng chung (FR-011, ĐẢO NGUỒN CHÂN LÝ ở FR-034).
 *
 * NGUỒN CHÂN LÝ: `kb/_kho.sqlite`. MỌI mutation SQL của web/api/ sống trong
 * file này — handler khác chỉ gọi, không cầm SQL/ghi file. api-guard.test.js
 * canh đúng điều đó.
 *
 * Đường ghi (M08-R2 giữ nguyên tinh thần): compose .md → tmp NGOÀI repo (kèm
 * snapshot danh mục SELECT từ DB, cùng nhịp) → validate.py --fix --strict →
 * đạt mới BEGIN IMMEDIATE … COMMIT → banXuat() export async (xuat_kho.py —
 * đường ghi file kb/** DUY NHẤT, một chiều DB→file).
 *
 * KHÔNG fallback đọc đĩa: fallback là nguồn chân lý thứ hai. Thiếu node:sqlite
 * hay thiếu DB (khi kb/ có bài) là lỗi RÕ kèm hướng dẫn, không phải im lặng
 * đổi nguồn. check_export_dan_xuat.py là răng của cả khối này.
 *
 * Vài helper (json/docBody) trông giống server.mjs — cố ý KHÔNG import từ đó:
 * server.mjs thuộc M03 và no-write-path.test.js canh nó nguyên trạng.
 */
import { spawn } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const API = dirname(fileURLToPath(import.meta.url))
export const WEB = join(API, "..")
export const GOC = join(WEB, "..")

// Env override cùng khuôn SITE/API_PORT/PYTHON của FR-010 — để test trỏ kho
// tạm ở os.tmpdir(), KHÔNG test nào đụng kho thật. DB nằm DƯỚI KB_DIR nên
// toàn bộ plumbing test tái dùng (FR-034).
export const KB = process.env.KB_DIR ?? join(GOC, "kb")
export const RAC = process.env.RECYCLE_DIR ?? join(GOC, "_recycle")
export const PY = process.env.PYTHON ?? "python"
export const TRAN = 1024 * 1024 // 1 MB — khớp trần FR-010
export const DB_FILE = join(KB, "_kho.sqlite")

// C6 · yaml là devDep THẬT của web/ (yaml@2.9.0 — đúng bản từng mượn của
// _quartz, pin exact). Chỉ còn dùng cho compose/parse tmp .md.
const canRequire = createRequire(join(WEB, "package.json"))
export const YAML = canRequire("yaml")

// Bảng khai DB của LÕI (T08-11) — tên + đường dẫn, không SQL.
import { LOI_SCHEMA, duongLoiDb } from "./loidb.mjs"
export { BANG_LOI, duongLoiDb } from "./loidb.mjs"

/*
 * ═══ LOẠI NGUỒN ↔ BẢNG — đọc từ BẢNG KHAI (FR-038) ═════════════════════════
 *
 * `core/assets/loai-nguon.json` là nguồn duy nhất. Trước FR-038 tập 7 giá trị
 * này gõ tay ở BỐN nơi: `kho.schema.sql` · `xuat_kho.py` · `dung_lai_db.py` ·
 * file này.
 *
 * `LOAI` vẫn là enum ĐÓNG cho route `/:type/:slug` — path traversal chặn bằng
 * CẤU TRÚC, không bằng phép lọc chuỗi. Điều đổi là nó **dẫn xuất**, không gõ.
 */
const NHOM_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module
export const LOAI = NHOM_BANG.flatMap((m) => m.loai)
const BANG_CUA = Object.fromEntries(
  NHOM_BANG.flatMap((m) => m.loai.map((l) => [l, m.bang])))

/** Tên ba nhóm module — `bai-viet` · `tai-lieu` · `video`. Thứ tự của bảng khai. */
export const NHOM = NHOM_BANG.map((m) => m.ten)
const LOAI_CUA_NHOM = Object.fromEntries(NHOM_BANG.map((m) => [m.ten, m.loai]))

/**
 * Các `source_type` của một nhóm module — `null` nếu nhóm không có trong bảng khai.
 *
 * Trả `null` chứ không trả `[]`: `[]` đi tiếp thành `WHERE source_type IN ()`, tức
 * MỘT DANH SÁCH RỖNG — không phân biệt được với "kho chưa có gì". Caller phải phân
 * biệt được "nhóm lạ" (⇒ 400) với "nhóm đúng, chưa có bản nào" (⇒ 200 rỗng), nên
 * hai ca đó phải là hai giá trị trả về khác nhau ở đây.
 */
export function loaiCuaNhom(ten) {
  return LOAI_CUA_NHOM[ten] ?? null
}

/**
 * Bảng đích của một `source_type`. Đường GHI nêu **tên bảng thật**.
 *
 * KHÔNG dùng `INSTEAD OF` trigger trên một view tên `articles` (diff ≈ 0): đo
 * được là ghi qua view có trigger thì `changes()` **nói dối** — `rowcount = 0`
 * trong khi hàng đã đổi. File này hôm nay không đọc `.changes`, và đó CHÍNH XÁC
 * là hình dạng cái bẫy `PRAGMA foreign_keys = ON` mà `check_media_ddl.py:6-9`
 * viết cả một đoạn để kể: vô hại chỉ vì chưa ai dùng.
 */
export function bangCua(type) {
  const b = BANG_CUA[type]
  // Loại lạ ⇒ NÉM, không rơi về một bảng mặc định. Một mặc định ở đây là một
  // bản ghi vào sai bảng, im lặng, và `xuat_kho` reap nó ở lần export kế tiếp.
  if (!b) throw new Error(`source_type lạ: ${type} — xem core/assets/loai-nguon.json`)
  return b
}

/*
 * ═══ KHO HIỆN VẬT — bảng khai, không bản gõ tay thứ hai (FR-036/B3) ═════════
 *
 * `core/assets/media-mime.json` là NGUỒN cho cả `core/tools/xuat_kho.py` (đặt
 * đuôi file export) và file này (content-type phục vụ lại + magic-byte). Hai
 * bản gõ tay sẽ lệch, và lệch ở đây nghĩa là file export mang một đuôi mà
 * server phục vụ bằng content-type khác.
 *
 * TRAN_MEDIA là hằng RIÊNG: `TRAN` (1 MB) là chặn bù của MỌI lần ghi bài
 * (FR-010), nới nó để chứa một PDF là nới cả cửa kia (M09-R5).
 */
const MEDIA_BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
export const TRAN_MEDIA = MEDIA_BANG.tran_byte
const MEDIA_LOAI = new Map(MEDIA_BANG.loai.map((l) => [l.mime, l]))

/*
 * FR-039 · BẢNG TRÊN THÔI LÀM CỔNG NHẬN. Người dùng chốt nhận mọi định dạng,
 * chặn theo trần dung lượng. Bảng ở lại làm bảng RENDER — `mac_dinh` là nhánh
 * cho định dạng lạ: `application/octet-stream` + `xem_truoc` không phải iframe
 * ⇒ `phucVuHienVat` tự cho `attachment`.
 *
 * Hình dạng `mime` ĐỌC TỪ SCHEMA, không gõ lại regex ở đây. Đây là chuỗi đi
 * THẲNG vào đầu đề `content-type`, nên `\r\n` hay `;` trong nó là đường tách đầu
 * đề — bỏ enum không phải bỏ phép kiểm, mà là đổi phép kiểm từ "nằm trong danh
 * sách" sang "đúng hình dạng". Hai bản regex sẽ lệch, và lệch ở đây nghĩa là
 * `luuHienVat` nhận một chuỗi mà validate sẽ từ chối — hoặc ngược lại.
 */
const MEDIA_MAC_DINH = MEDIA_BANG.mac_dinh
const _MS = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "frontmatter.schema.json"), "utf8"))
  // FR-052 · `media` là MẢNG nên `mime` xuống một tầng: `media.items.properties`.
  // Bản đầu đọc `media.properties.mime` và sau khi đổi schema nó là `undefined`
  // ⇒ `new RegExp(undefined)` khớp MỌI chuỗi, tức phép kiểm mime BIẾN MẤT mà
  // không lỗi. Đọc cả hai tầng: bản cũ vẫn đọc được trong lúc di trú.
  .properties.media, MEDIA_SCHEMA = _MS.items?.properties ?? _MS.properties
const DANG_MIME = new RegExp(MEDIA_SCHEMA.mime.pattern)

/** Đuôi file an toàn suy từ `ten_goc` — hoặc đuôi mặc định của bảng khai. */
function duoiSuyRa(tenGoc) {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(tenGoc ?? ""))
  return m ? "." + m[1].toLowerCase() : MEDIA_MAC_DINH.duoi
}

export const laSlug = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(s ?? ""))

export const json = (res, ma, o) => {
  const b = JSON.stringify(o)
  res.writeHead(ma, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(b),
  })
  res.end(b)
}

/** Đọc body với trần cứng — hủy kết nối khi vượt (cùng khuôn server.mjs). */
export function docBody(req) {
  return new Promise((ok, loi) => {
    let n = 0
    const phan = []
    req.on("data", (c) => {
      n += c.length
      if (n > TRAN) { req.destroy(); loi(new Error("qua-tran")); return }
      phan.push(c)
    })
    req.on("end", () => ok(Buffer.concat(phan)))
    req.on("error", loi)
  })
}

/**
 * Đọc body HIỆN VẬT — chặn theo `content-length` TRƯỚC khi đọc byte đầu tiên.
 *
 * Hai lớp, không một: header là DỮ LIỆU của người gửi, nên nó đủ để từ chối
 * SỚM (không tốn RAM, không tốn thời gian) nhưng KHÔNG đủ để tin. Khai 10 byte
 * rồi bơm 30 MB phải chết ở lớp thứ hai.
 */
export function docBodyMedia(req) {
  return new Promise((xong, loi) => {
    const khai = Number(req.headers["content-length"])
    if (Number.isFinite(khai) && khai > TRAN_MEDIA) {
      // KHÔNG destroy ở đây (đổi so với bản đầu, phát hiện lúc đấu route ở B5):
      // `req.destroy()` giết socket ⇒ handler không còn chỗ nào để nói `413`, và
      // một trần chặn im lặng là một trần người dùng không hiểu. Chủ của socket
      // là HANDLER — nó trả lời trước, rồi mới cắt.
      loi(new Error("qua-tran")); return
    }
    let n = 0
    const phan = []
    req.on("data", (c) => {
      n += c.length
      if (n > TRAN_MEDIA) { req.destroy(); loi(new Error("qua-tran")); return }
      phan.push(c)
    })
    req.on("end", () => xong(Buffer.concat(phan)))
    req.on("error", loi)
  })
}

/** Tách frontmatter. Trả null nếu không có `---`. */
export function tachFm(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return null
  let fm
  try { fm = YAML.parse(m[1]) } catch { return null }
  if (!fm || typeof fm !== "object") return null
  return { fm, body: text.slice(m[0].length) }
}

export function ghepFm(fm, body) {
  return "---\n" + YAML.stringify(fm) + "---\n\n" + String(body ?? "").replace(/^\s+/, "")
}

/** Đường file EXPORT của một bài — chỉ để hiển thị/deep-link, không phải nguồn. */
export const duongBai = (type, slug) => join(KB, type, slug + ".md")

// ── Kho SQLite — MỞ-DÙNG-ĐÓNG mỗi lượt, không giữ handle ────────────────────
// Bài học FR-023 GĐ 3 giữ nguyên: giữ handle thì EBUSY khi test dọn kho tạm
// (Windows, lỗi cứng) và handle trỏ inode cũ. SQLite mở file là micro-giây.
function napSqlite() {
  try {
    return canRequire("node:sqlite")
  } catch {
    // KHÔNG rơi về đọc đĩa — fallback là nguồn chân lý thứ hai (FR-034).
    throw new Error(
      "node:sqlite không có — cần Node >= 22.5 (web/package.json#engines). " +
      "Kho sống trong kb/_kho.sqlite, không có đường đọc thay thế.")
  }
}

/** kb/ có file bài export nào không — quét thô, chỉ dùng cho guard mất-dữ-liệu. */
function coFileBai() {
  for (const type of LOAI) {
    const d = join(KB, type)
    if (!existsSync(d)) continue
    for (const ten of readdirSync(d)) {
      if (ten.endsWith(".md") && !ten.startsWith("_") && ten.toLowerCase() !== "readme.md") return true
    }
  }
  return false
}

/**
 * Mở kho. `ghi=true` mở read-write; DB chưa tồn tại thì:
 *   · kb/ RỖNG  → tạo DB mới từ kho.schema.sql (kho mới tinh — hợp lệ);
 *   · kb/ CÓ BÀI → NÉM kèm hướng dẫn. Tự tạo DB rỗng lúc này rồi banXuat()
 *     là xuat_kho coi mọi export hiện có là MỒ CÔI và xoá sạch — guard này
 *     chống đúng ca mất-dữ-liệu đó. Đường nhập duy nhất: dung_lai_db.py.
 */
function moKho(ghi = false) {
  const { DatabaseSync } = napSqlite()
  if (!existsSync(DB_FILE)) {
    if (!ghi) return null
    if (coFileBai()) {
      throw new Error(
        "kb/ có bài export nhưng chưa có kb/_kho.sqlite — chạy: " +
        "python core/tools/dung_lai_db.py (đường file→DB duy nhất, FR-034)")
    }
    const db = new DatabaseSync(DB_FILE)
    db.exec("PRAGMA journal_mode = WAL")
    db.exec(readFileSync(join(GOC, "core", "assets", "kho.schema.sql"), "utf8"))
    db.exec("PRAGMA busy_timeout = 5000")
    return db
  }
  const db = new DatabaseSync(DB_FILE, ghi ? {} : { readOnly: true })
  db.exec("PRAGMA busy_timeout = 5000")
  return db
}

/** SELECT một lượt rồi đóng. DB chưa có ⇒ null (kho rỗng hợp lệ — FR-031). */
function doc(cau, ...thamSo) {
  const db = moKho(false)
  if (!db) return null
  try {
    return db.prepare(cau).all(...thamSo)
  } finally {
    try { db.close() } catch { /* đọc-only, không có gì để cứu */ }
  }
}

/**
 * Chạy `viec(db)` trong BEGIN IMMEDIATE — transaction ghi duy nhất của module.
 * IMMEDIATE lấy khoá ghi NGAY, tránh deadlock nâng khoá giữa hai process
 * (FR-011 — hai AI song song trên cùng DB; WAL + busy_timeout=5000 lo phần chờ).
 */
function giaoDich(viec) {
  const db = moKho(true)
  db.exec("BEGIN IMMEDIATE")
  try {
    const kq = viec(db)
    db.exec("COMMIT")
    return kq
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* đã rollback do lỗi */ }
    throw e
  } finally {
    try { db.close() } catch { /* hết việc */ }
  }
}

const etagCua = (version, fmJson, than) =>
  createHash("sha256").update(`${version}\n${fmJson}\n${than}`).digest("hex").slice(0, 16)

export function docBai(type, slug) {
  const hang = doc(
    "SELECT frontmatter, than, etag, version FROM ban_ghi WHERE source_type = ? AND slug = ?",
    type, slug)
  if (!hang || !hang.length) return null
  const r = hang[0]
  return { fm: JSON.parse(r.frontmatter), body: r.than, etag: r.etag, version: r.version }
}

/**
 * KHO ĐỌC — một cửa duy nhất cho mọi đường ĐỌC danh sách bài (FR-023 giữ vai,
 * FR-034 đổi nguồn: SELECT thẳng, không còn hai đường index/đĩa để lệch).
 * Trả `[{type, slug, duong, review_status, fm, than, etag}]` — `duong` là
 * đường EXPORT (hiển thị), không phải nguồn.
 */
/**
 * Cả kho, hoặc chỉ các `source_type` được truyền vào (FR-038/C4).
 *
 * LỌC BẰNG `source_type`, KHÔNG BẰNG CỘT `bang` — phép ĐO, không phải sở thích.
 * `EXPLAIN QUERY PLAN` trên chính DDL hiện tại:
 *
 *   WHERE bang = 'video'            → SCAN bai_viet · SCAN tai_lieu · SCAN video
 *   WHERE source_type IN ('video')  → SEARCH … (source_type=?) trên cả ba PK index
 *
 * `bang` là **literal** trong từng nhánh UNION ALL nên SQLite không tỉa nhánh theo
 * nó — nó quét cả ba rồi lọc, tức đúng cái việc lọc này muốn tránh. `source_type`
 * là cột thật, đầu PK, nên vị từ đẩy xuống được.
 */
export function khoDoc(loai) {
  const nhieu = Array.isArray(loai) && loai.length > 0
  const hang = doc(
    "SELECT source_type, slug, frontmatter, than, etag FROM ban_ghi"
    + (nhieu ? ` WHERE source_type IN (${loai.map(() => "?").join(",")})` : ""),
    ...(nhieu ? loai : []))
  if (!hang) return []
  const ds = []
  for (const r of hang) {
    let fm
    try { fm = JSON.parse(r.frontmatter) } catch { continue }
    ds.push({
      type: r.source_type, slug: r.slug, duong: duongBai(r.source_type, r.slug),
      review_status: fm?.review_status ?? "", fm, than: r.than, etag: r.etag,
    })
  }
  return ds
}

/*
 * T08-35 · KHO-DELTA cho indexer M13 — NĂM trường, không hơn không kém.
 *
 *   slug · loai (= `source_type`) · updated_at · sha_than · space
 *
 * `sha_than` = sha256(`than`) là TÍN HIỆU ĐỔI thật: DB không có mốc sửa, nên
 * `updated_at` = `fm.analyzed_at` (mốc phân tích, không phải mốc sửa — ghi thẳng
 * ra đây để M13 không tin nó một mình). `space` là cột DÀNH SẴN = `"mac-dinh"`
 * cho tới `FR-080` áp (view `ban_ghi` chưa có cột) — ĐIỂM NỐI KHOÁ với nhánh
 * Space (`rule.md` mục 13): đổi tên/giá trị phải qua FR VÀ báo PM-Space.
 * Đọc DB CHÂN LÝ (view `ban_ghi`), không đọc export `kb/` (FR-034).
 */
const SPACE_MAC_DINH = "mac-dinh"

export function khoDelta() {
  const hang = doc("SELECT source_type, slug, frontmatter, than FROM ban_ghi ORDER BY slug")
  if (!hang) return []
  return hang.map((r) => {
    let fm = null
    try { fm = JSON.parse(r.frontmatter) } catch { /* fm hỏng ⇒ updated_at null, vẫn liệt */ }
    return {
      slug: r.slug,
      loai: r.source_type,
      updated_at: fm?.analyzed_at ?? null,
      sha_than: createHash("sha256").update(r.than ?? "").digest("hex"),
      space: SPACE_MAC_DINH,
    }
  })
}

/** Số bài trong kho — guard "kho rỗng thì không suy được gì" của danhmuc.mjs. */
export function demSoBai() {
  const hang = doc("SELECT count(*) AS n FROM ban_ghi")
  return hang ? hang[0].n : 0
}

/**
 * LOAI NGUON tu DB (WO-019).
 *
 * `module` tra loi *loai nguon nao ung voi phan loai nao*. No den tu PHEP SUY
 * (`nguonCua`) chu khong tu nguoi go, nen `suaLoaiNguon` chi doi NHAN. Cho doi
 * `module` la lam facet noi sai ve chinh ban ghi: mot bang `pdf` gan sang
 * `video` thi man Video liet ke mot dinh dang khong video nao co.
 */
export function docLoaiNguon() {
  const hang = doc(
    "SELECT id, module, nhan, thu_tu FROM loai_nguon ORDER BY thu_tu, id")
  return (hang ?? []).map((r) => ({
    id: r.id, module: r.module, label_vi: r.nhan, thu_tu: r.thu_tu,
  }))
}

/** Sua NHAN cua mot loai nguon. `false` khi khong co id do. */
export async function suaLoaiNguon(id, nhan) {
  const co = doc("SELECT 1 AS n FROM loai_nguon WHERE id = ?", id)
  if (!co || !co.length) return false
  giaoDich((db) => {
    db.prepare("UPDATE loai_nguon SET nhan = ? WHERE id = ?").run(nhan, id)
  })
  await banXuat()
  return true
}

/** Danh mục từ DB — hình dạng y hệt entry yaml cũ, cho GET + suaDanhMuc. */
export function docDanhMucDb(bang) {
  // ORDER BY rowid — thứ tự người thêm, khớp thứ tự export (xuat_kho.py).
  if (bang === "concepts") {
    const hang = doc("SELECT id, label_vi, aliases FROM concepts ORDER BY rowid")
    return (hang ?? []).map((r) => ({
      id: r.id, label_vi: r.label_vi, aliases: JSON.parse(r.aliases),
    }))
  }
  const hang = doc("SELECT id, label_vi, gom FROM categories ORDER BY rowid")
  return (hang ?? []).map((r) => ({ id: r.id, label_vi: r.label_vi, gom: r.gom }))
}

// ── Tuần tự hoá ghi trong process ───────────────────────────────────────────
// BEGIN IMMEDIATE lo xung đột GIỮA process; mutex này giữ thứ tự trong process
// (một request không chen giữa validate và COMMIT của request khác).
// Lost-update giữa hai cửa sổ bắt bằng ETag If-Match ở tầng handler.
let hang = Promise.resolve()
export function tuanTu(viec) {
  const kq = hang.then(viec)
  hang = kq.then(() => {}, () => {})
  return kq
}

/**
 * Snapshot danh mục từ DB ra hai yaml TẠM — validate đọc catalog CÙNG NHỊP với
 * nội dung kiểm, không phụ thuộc độ tươi của export async. File RỖNG vẫn ghi:
 * validate coi rỗng = "danh mục đóng, chưa có mục" (cổng BẬT), thiếu file mới
 * là catalog_missing.
 */
function vietDanhMucTam(thuMuc) {
  const inYaml = (ds) => ds.length ? YAML.stringify(ds) : ""
  const conc = join(thuMuc, "concepts.yaml")
  const cat = join(thuMuc, "categories.yaml")
  writeFileSync(conc, inYaml(docDanhMucDb("concepts")), "utf8")
  writeFileSync(cat, inYaml(docDanhMucDb("categories")), "utf8")
  return { conc, cat }
}

/** Chạy validate.py, trả {ma, ra, loi_that} — cổng nói gì trả nguyên văn thế. */
/**
 * Biến môi trường truyền xuống TIẾN TRÌNH CON — ALLOWLIST.
 *
 * ⚠️ Ba chỗ trong `web/` từng truyền `{ ...process.env }` xuống Python con
 * (`dungchung.mjs:432` · `:482` · `server.mjs:117`). Với `.env` theo service
 * (`04_system/env-theo-service.md`), điều đó nghĩa là **mọi bí mật của LÕI
 * chảy vào tiến trình `validate.py`/`xuat_kho.py`** — và tiến trình đó chạy mã
 * có `--fix` ghi vào kho.
 *
 * "Một `.env` cho mỗi service" KHÔNG ĐỦ nếu ranh giới tiến trình rò xuống dưới.
 *
 * ALLOWLIST, không denylist: một denylist *"trừ `KHOA_*`"* sẽ bỏ sót biến thứ
 * hai ai đó thêm sau. Cùng bài học `CVE-2018-8007` (CouchDB) — đi vòng đúng
 * một blacklist.
 *
 * Tiến trình Python cần ĐÚNG những biến dưới đây. Thêm một biến vào đây là một
 * quyết định, không phải một tiện tay.
 */
const ENV_CHO_CON = [
  "PYTHONIOENCODING",   // core/* tự reconfigure stdout, nhưng đặt cho chắc
  "PYTHONPATH",         // vài môi trường cần
  "KB_DIR",             // kho tạm của test
  "RECYCLE_DIR",
  "SCHEMA_DIR",
  "INBOX_DIR",
  "PATH",               // không có PATH thì không tìm được interpreter
  "SYSTEMROOT",         // Windows: thiếu là Python không khởi động
  "SystemRoot",
  "TEMP", "TMP", "TMPDIR",
  "APPDATA", "LOCALAPPDATA",
  "HOME", "USERPROFILE",
  "LANG", "LC_ALL",
]

/** Env cho tiến trình con — chỉ biến trong allowlist, cộng phần ghi đè. */
export function envCon(ghiDe = {}) {
  const ra = {}
  for (const k of ENV_CHO_CON) {
    if (process.env[k] !== undefined) ra[k] = process.env[k]
  }
  return { ...ra, PYTHONIOENCODING: "utf-8", ...ghiDe }
}

function chayValidate(target, catalog, them = []) {
  return new Promise((ok) => {
    const p = spawn(PY, [
      join(GOC, "core", "src", "source_distiller", "validate.py"),
      target, "--strict",
      "--concepts", catalog.conc,
      "--categories", catalog.cat,
      ...them,
    ], { cwd: GOC, env: envCon() })
    let ra = "", er = ""
    p.stdout.on("data", (d) => { ra += d })
    p.stderr.on("data", (d) => { er += d })
    p.on("error", (e) => ok({ ma: -1, ra: String(e.message), loi_that: true }))
    p.on("close", (ma) => {
      const chu = ra || er
      ok({ ma, ra: chu, loi_that: coLoiThat(ma, chu) })
    })
  })
}

/**
 * `--strict` exit 1 khi có LỖI **hoặc** CẢNH BÁO. Đúng cho CI chấm cả kho, SAI
 * cho API chặn một lần ghi ("khái niệm chờ duyệt" là cơ chế được chỉ định,
 * không phải lý do 422 — bug thật FR-024). Chặn theo số LỖI, không exit code;
 * `--strict` vẫn chạy và output trả nguyên văn (M08-R2 nguyên).
 */
function coLoiThat(ma, chu) {
  if (ma === 0) return false
  if (ma < 0) return true                    // spawn chết — không có phán quyết
  const m = /(\d+)\s+lỗi/.exec(chu)
  if (!m) return true                        // không đọc được ⇒ coi như lỗi
  return Number(m[1]) > 0
}

// FR-035 `dungLaiTrang` ĐÃ GỠ (FR-034/C3): SSR đọc DB ngay lúc request nên
// build-sau-ghi là vô nghĩa — một đường build mọc lại là quay về kiến trúc cũ
// (api-guard.test.js mục 6 canh). `npm run build` vẫn chạy TAY được.

/**
 * EXPORT sau mỗi COMMIT — DB→file một chiều, spawn `xuat_kho.py` (đường ghi
 * file kb/** DUY NHẤT). Thay capNhatIndex của FR-023, giữ khuôn tuần-tự-hoá
 * (bug DELETE-rồi-restore-lượt-chậm-thắng đã có thuốc sẵn ở đó).
 *
 * ĐƯỢC AWAIT trong request (khác capNhatIndex cũ chạy rơi): trả lời HTTP nghĩa
 * là export ĐÃ xong — git status ngay sau một thao tác luôn nói thật, và test
 * đọc file không cần poll. Giá ~300ms/lượt ghi, chấp nhận cho app local
 * một-người (khai ở FR-034). Lỗi export KHÔNG làm ghi thất bại: DB đã COMMIT
 * là nguồn chân lý đã đúng; `xuat_kho --kiem`/cổng round-trip bắt drift.
 *
 * MỌI đường ghi DB phải gọi hàm này — check_export_dan_xuat.py răng 3 đếm.
 */
let hangXuat = Promise.resolve()

export function banXuat() {
  const chay = () => new Promise((ok) => {
    const p = spawn(PY, [join(GOC, "core", "tools", "xuat_kho.py")], {
      cwd: GOC,
      // Trỏ TƯỜNG MINH: kho tạm của test phải export vào chính kho tạm đó.
      env: envCon({ KB_DIR: KB, RECYCLE_DIR: RAC }),
    })
    p.on("error", () => ok(false))
    p.on("close", (ma) => ok(ma === 0))
  })
  const kq = hangXuat.then(chay)
  hangXuat = kq.then(() => {}, () => {})
  return kq
}

/**
 * Nạp một hiện vật vào kho — ĐỊA CHỈ THEO NỘI DUNG (M09-R2).
 *
 * `sha256` và `so_byte` do MÁY tính, và tham số cùng tên gửi kèm bị BỎ QUA:
 * khoá lưu trữ đến từ client là để client chọn nó nằm ở đâu.
 *
 * LỚP THỨ SÁU của intake: năm lớp hiện có (bind 127.0.0.1 · trần kích cỡ · tên
 * file whitelist · đích cố định · spawn cổng thật) KHÔNG lớp nào soi byte.
 * Không có magic-byte thì một file HTML-có-script dán nhãn `application/pdf`
 * được phục vụ lại SAME-ORIGIN dưới content-type đó.
 *
 * `INSERT OR IGNORE`: cùng nội dung ⇒ cùng khoá ⇒ một dòng. Blob chưa có bản
 * ghi tham chiếu là HỢP LỆ đúng khoảng thời gian người dùng điền form; bỏ form
 * giữa chừng thì lần export kế tiếp reap nó như mồ côi (M09-R1).
 */
export async function luuHienVat({ byte, mime }) {
  const ten = String(mime ?? "")
  const loai = MEDIA_LOAI.get(ten)
  /*
   * FR-039 · CỬA NHẬN ĐÃ MỞ — nhưng chỉ cửa đó.
   *
   * Trước đây mime ngoài enum ⇒ 415. Người dùng chốt nhận mọi định dạng, và ô
   * chọn có ghi rõ điều đó gỡ lớp magic-byte. Nên: định dạng LẠ vào được, còn
   * `ma` 415 chỉ còn dành cho một mime SAI HÌNH DẠNG.
   *
   * Phép kiểm hình dạng KHÔNG phải thủ tục: chuỗi này đi thẳng vào đầu đề
   * `content-type`, nên một mime mang `\r\n` là tách đầu đề. Bỏ danh sách không
   * phải bỏ phép kiểm.
   */
  if (!DANG_MIME.test(ten)) {
    return {
      ok: false, ma: 415,
      loi: `mime \`${ten}\` sai hình dạng — cần \`type/subtype\` không dấu ` +
        `cách, không \`;\`, không ký tự điều khiển.`,
    }
  }
  const b = Buffer.isBuffer(byte) ? byte : Buffer.from(byte ?? [])
  if (!b.length) return { ok: false, ma: 422, loi: "Hiện vật rỗng — không có byte nào để lưu." }
  if (b.length > TRAN_MEDIA) {
    return { ok: false, ma: 413, loi: `Hiện vật ${b.length} byte, vượt trần ${TRAN_MEDIA}.` }
  }
  /*
   * Magic-byte GIỮ NGUYÊN cho định dạng ĐÃ BIẾT. FR-039 bỏ cửa cho loại LẠ, và
   * chỉ loại lạ: một file khai `application/pdf` mà byte không phải PDF vẫn là
   * lời khai sai, và lớp này vẫn bắt được nó. Bỏ luôn cả nhánh này là nới rộng
   * hơn thứ người dùng xin.
   *
   * Với loại lạ thì lớp thứ sáu **không tồn tại** — không có chữ ký để so. Nói
   * "yếu đi" là nói giảm; nó không chạy.
   */
  if (loai) {
    /*
     * `magic_bu` — ĐỘ LỆCH byte để bắt đầu so, mặc định 0.
     *
     * ISO BMFF (mp4 · m4a · mov) đặt `ftyp` ở byte **4**: bốn byte đầu là ĐỘ
     * DÀI box và chúng khác nhau theo từng file. Một magic TIỀN TỐ là bất khả
     * thi với họ định dạng đó — sự thật về định dạng, không phải một lựa chọn
     * thiết kế. Bỏ qua `magic_bu` ở đây thì MỌI mp4 thật nhận 422, tức lớp thứ
     * sáu thôi bảo vệ và bắt đầu chặn oan.
     */
    const bu = Number(loai.magic_bu ?? 0)
    const dau = Buffer.from(loai.magic, "hex")
    if (b.length < bu + dau.length
        || !b.subarray(bu, bu + dau.length).equals(dau)) {
      return {
        ok: false, ma: 422,
        loi: `Byte mở đầu không khớp magic của \`${ten}\` — file không phải ` +
          `${loai.ten} thật, dù tên hay content-type nói vậy.`,
      }
    }
  }
  const sha256 = createHash("sha256").update(b).digest("hex")
  giaoDich((db) => {
    db.prepare("INSERT OR IGNORE INTO media (sha256, byte) VALUES (?,?)").run(sha256, b)
  })
  await banXuat()
  return { ok: true, sha256, so_byte: b.length, mime }
}

/**
 * Đọc byte của một hiện vật. `sha256` là khoá do MÁY tính nên không có đường
 * traversal nào ĐI QUA ĐƯỢC — nhưng vẫn ép dạng: một khoá lệch dạng là dấu
 * hiệu ai đó đang thử, và trả `null` sớm rẻ hơn một truy vấn.
 */
/**
 * MỌI hiện vật của một frontmatter (`FR-052` — `media` là MẢNG).
 *
 * Chấp nhận CẢ HAI hình dạng: object (bản trước `FR-052`) và mảng. Đọc được
 * bản cũ không phải nhân nhượng — nó là thứ làm việc đổi schema **không** thành
 * một ngày cờ: mọi bản ghi phải di trú cùng lúc với mọi đoạn mã, và bất kỳ thứ
 * tự nào cũng có một khoảng thời gian hệ thống từ chối dữ liệu của chính nó.
 *
 * Schema thì ÉP mảng cho bản ghi MỚI (`minItems: 1`). Hai tầng khác nhau, và
 * trộn chúng lại là để hình dạng cũ sống mãi.
 */
export function hienVat(fm) {
  const m = fm?.media
  if (!m) return []
  if (Array.isArray(m)) return m.filter((x) => x && typeof x === "object")
  return typeof m === "object" ? [m] : []
}

/**
 * Ghi cột `kieu_moc` cho một hiện vật — WO-071.
 *
 * Cột này có trong `kho.schema.sql` từ `T01-45` và cửa gắn đã KIỂM giá trị của
 * nó từ `T08-30`, nhưng **chưa ai GHI**: đo 2026-09-09, không một `UPDATE
 * media SET kieu_moc` nào trong repo. Nên `AC-V1` (*hiện vật `.vtt` mang
 * `kieu_moc: la_asr`*) chưa bao giờ đúng trong DB, và phép THAY-theo-`kieu_moc`
 * không có gì để khoá vào.
 *
 * `null` xoá cờ — dùng khi một hiện vật thôi là dẫn xuất của loại đó.
 */
export function ghiKieuMoc(sha256, kieuMoc) {
  if (!/^[0-9a-f]{64}$/.test(String(sha256 ?? ""))) return false
  giaoDich((db) => {
    db.prepare("UPDATE media SET kieu_moc = ? WHERE sha256 = ?")
      .run(kieuMoc == null ? null : String(kieuMoc), String(sha256))
  })
  return true
}

/** `sha256` của mọi hiện vật mang một `kieu_moc` — cho phép THAY theo loại. */
export function shaTheoKieuMoc(kieuMoc) {
  const h = doc("SELECT sha256 FROM media WHERE kieu_moc = ?", String(kieuMoc))
  return new Set((h ?? []).map((x) => String(x.sha256)))
}

export function docHienVat(sha256) {
  if (!/^[0-9a-f]{64}$/.test(String(sha256 ?? ""))) return null
  const hang = doc("SELECT byte FROM media WHERE sha256 = ?", String(sha256))
  if (!hang || !hang.length) return null
  return Buffer.from(hang[0].byte)
}

/**
 * Mọi thứ đường PHỤC VỤ cần cho một hiện vật — hoặc `null` (FR-036/B6).
 *
 * `mime` KHÔNG sống trong bảng `media` (bảng đó cố ý không có cột metadata
 * nào). Nó sống trong `articles.frontmatter.media`, nên phải tra từ bản ghi TRỎ
 * TỚI byte — và tra trên CÙNG union ba bảng mà exporter dùng cho luật mồ côi
 * (M09-R1). Một phép tính, hai người gọi.
 *
 * BLOB KHÔNG BẢN GHI NÀO TRỎ ⇒ `null` ⇒ 404. Byte đang staging (người dùng vừa
 * nạp, chưa bấm Ghi) là HỢP LỆ trong kho nhưng KHÔNG phải nội dung công khai.
 * Phục vụ nó là biến cửa nạp thành một chỗ chứa file ai cũng đọc được, chỉ cần
 * biết sha256.
 */
export function hienVatPhucVu(sha256) {
  const byte = docHienVat(sha256)
  if (!byte) return null
  // Năm nhánh khai MỘT nơi — VIEW `tham_chieu_media` trong DDL (FR-038). Trước
  // đó tập này gõ tay ở đây VÀ ở `xuat_kho.py:168-170`, và tách bảng nâng nó từ
  // 3 lên 5 nhánh ở cả hai nơi. M09-R1 giờ là CẤU TRÚC, không còn là kỷ luật.
  const hang = doc("SELECT frontmatter FROM tham_chieu_media") ?? []
  for (const r of hang) {
    let hv
    try { hv = hienVat(JSON.parse(r.frontmatter) || {}) } catch { continue }
    // FR-052 · quét MỌI hiện vật của bản ghi, không chỉ cái đầu.
    const m = hv.find((x) => x.sha256 === sha256)
    if (!m) continue
    const loai = MEDIA_LOAI.get(String(m.mime))
    if (loai) {
      return {
        byte, mime: loai.mime, duoi: loai.duoi, xem_truoc: loai.xem_truoc,
        ten_goc: String(m.ten_goc ?? ""),
      }
    }
    /*
     * FR-039 · ĐỊNH DẠNG LẠ — trước đây rơi xuống `null` ⇒ 404, tức "nạp được
     * mà không đọc lại được". Giờ phục vụ dưới khối `mac_dinh`.
     *
     * KHÔNG phục vụ `m.mime` của người gửi: với định dạng chưa soi được byte,
     * mime là LỜI KHAI, và `nosniff` tồn tại chính vì lời khai có thể sai. Trả
     * `application/octet-stream` là nói đúng thứ ta biết — "một chuỗi byte".
     *
     * `xem_truoc` của `mac_dinh` không phải `iframe`, nên `phucVuHienVat` tự
     * đặt `attachment`. Đó là chính sách xem trước cho thứ không render được,
     * và nó đến từ bảng khai chứ không gõ lại ở tầng handler.
     *
     * Đuôi SUY TỪ `ten_goc` nhưng lọc `[A-Za-z0-9]{1,8}` — tên gốc là chuỗi của
     * người gửi và đuôi này đi vào `filename=`. Không khớp thì dùng `.bin` của
     * bảng khai, không dùng chuỗi rỗng.
     */
    return {
      byte, mime: MEDIA_MAC_DINH.mime, duoi: duoiSuyRa(m.ten_goc),
      xem_truoc: MEDIA_MAC_DINH.xem_truoc, ten_goc: String(m.ten_goc ?? ""),
    }
  }
  return null
}

/**
 * ĐƯỜNG GHI DUY NHẤT vào kho cho nội dung bài mới/sửa (M08-R2).
 *
 * compose → tmp NGOÀI repo (kèm snapshot danh mục) → validate --fix --strict
 * → đạt mới UPSERT trong BEGIN IMMEDIATE (version+1, etag mới) → banXuat().
 */
export async function ghiSauValidate(fm, body, type, slug) {
  /*
   * M09-R1 · CON TRỎ TREO không được COMMIT. `validate.py` kiểm được DẠNG của
   * `media.sha256` (schema: 64 hex) nhưng không biết bảng `media` — nó chạy
   * trên một file tmp ngoài repo. Nên phép kiểm "byte có thật" chỉ sống được ở
   * đây, ngay trước cửa ghi.
   *
   * Vì sao chặn TRƯỚC validate: một bản ghi trỏ vào byte không tồn tại là bản
   * ghi mà `phucHoi()` sau này vẫn báo THÀNH CÔNG — nó chạy lại validate, mà
   * validate không bao giờ thấy blob. Mất dữ liệu im lặng với bộ test xanh.
   */
    // FR-052 · kiểm MỌI con trỏ, không chỉ cái đầu. Một bản ghi ba hiện vật mà
  // chỉ hiện vật ĐẦU có byte là đúng ca guard này tồn tại để chặn.
  const treo = hienVat(fm).map((x) => x.sha256)
    .filter((s) => s !== undefined && docHienVat(s) === null)
  if (treo.length) {
    return {
      ok: false,
      loi: `media.sha256 \`${treo.join("`, `")}\` không có byte nào trong kho — ` +
        `nạp hiện vật trước (POST /api/articles/media), rồi mới tạo bản ghi.`,
    }
  }

  // Bang dich tra tu BANG KHAI. Goi TRUOC khi mo tmp: loai la thi nem o day,
  // khong phai sau khi da tao thu muc tam va spawn python.
  const bang = bangCua(type)
  const tmpGoc = mkdtempSync(join(tmpdir(), "gn-api-"))
  try {
    const tmpFile = join(tmpGoc, slug + ".md")
    writeFileSync(tmpFile, ghepFm(fm, body), "utf8")
    const catalog = vietDanhMucTam(tmpGoc)
    /*
     * `--kho KB` · WO-040 · B-A6 — CỬA GHI phải tính `citations_*`, không nhận
     * lời khai. Không có nó thì cổng địa chỉ TẮT ở đây: `validate.py` chỉ tự
     * bật khi target là THƯ MỤC, mà ta cố ý validate một FILE trong tmp ngoài
     * repo (M08-R2). Hệ quả đo được: bản ghi 15 địa chỉ không phân giải được +
     * khai `3/3` sai đi qua cửa này SẠCH, rồi `ci.yml:43` và `api-crud` §7
     * validate cả thư mục và đỏ — hai bên đo hai luật.
     *
     * `KB` chứ KHÔNG gõ cứng `kb/`: mọi test chạy trên `KB_DIR` tạm, gõ cứng là
     * phân giải địa chỉ vào kho THẬT của chủ dự án.
     *
     * Đi cùng `--fix` (đã có) là cố ý: ba trường đó là DẪN XUẤT, nên cửa ghi
     * TÍNH chúng rồi đọc lại bản đã fix ở dòng dưới — không phải từ chối bài vì
     * client gửi sai số.
     */
    const kq = await chayValidate(tmpFile, catalog, ["--fix", "--kho", KB])
    if (kq.loi_that) return { ok: false, loi: kq.ra }

    // Đọc lại bản đã --fix (word_count là phép tính) — ĐÚNG nội dung sẽ COMMIT.
    const t = tachFm(readFileSync(tmpFile, "utf8"))
    if (!t) return { ok: false, loi: "Không đọc lại được bản đã fix." }
    const fmJson = JSON.stringify(t.fm)
    const than = t.body.replace(/^\s+|\s+$/g, "")

    const etag = giaoDich((db) => {
      const cu = db.prepare(
        `SELECT version FROM ${bang} WHERE source_type = ? AND slug = ?`,
      ).all(type, slug)
      const version = cu.length ? cu[0].version + 1 : 1
      const e = etagCua(version, fmJson, than)
      if (cu.length) {
        db.prepare(
          `UPDATE ${bang} SET frontmatter = ?, than = ?, version = ?, etag = ?` +
          " WHERE source_type = ? AND slug = ?",
        ).run(fmJson, than, version, e, type, slug)
      } else {
        db.prepare(
          `INSERT INTO ${bang} (source_type, slug, frontmatter, than, version, etag)` +
          " VALUES (?,?,?,?,?,?)",
        ).run(type, slug, fmJson, than, version, e)
      }
      return e
    })
    await banXuat()
    return { ok: true, etag }
  } finally {
    rmSync(tmpGoc, { recursive: true, force: true })
  }
}

/**
 * FR-019/FR-034 — THÊM một nhãn vào danh mục (bảng concepts/categories).
 * Răng giữ nguyên: trùng id 409 · trùng alias 409 · người khai nhãn (handler
 * lo phần đòi label_vi/gom — M08-R3). Giao dịch thay cho rollback tay.
 */
export async function themVaoDanhMuc(ten, moi) {
  const bang = ten === "concepts.yaml" ? "concepts" : "categories"
  const ds = docDanhMucDb(bang)
  for (const c of ds) {
    if (c.id === moi.id) return { ok: false, ma: 409, loi: `\`${moi.id}\` đã có trong ${ten}.` }
    if (Array.isArray(c.aliases) && c.aliases.includes(moi.id)) {
      return { ok: false, ma: 409, loi: `\`${moi.id}\` đang là alias của \`${c.id}\` — dùng id chính.` }
    }
  }
  giaoDich((db) => {
    if (bang === "concepts") {
      db.prepare("INSERT INTO concepts (id, label_vi, aliases) VALUES (?,?,?)")
        .run(moi.id, moi.label_vi, JSON.stringify(moi.aliases ?? []))
    } else {
      db.prepare("INSERT INTO categories (id, label_vi, gom) VALUES (?,?,?)")
        .run(moi.id, moi.label_vi, moi.gom ?? "")
    }
  })
  await banXuat()
  return { ok: true, so_muc: ds.length + 1 }
}

/**
 * FR-021/FR-034 — SỬA hoặc XOÁ mục danh mục. `viec(ds)` nhận mảng hình dạng
 * entry cũ, trả `{ds}` mới hoặc `{loi, ma}` — chữ ký giữ nguyên để handler
 * không đổi. Ghi lại = thay cả bảng trong MỘT giao dịch.
 */
export async function suaDanhMuc(ten, viec) {
  const bang = ten === "concepts.yaml" ? "concepts" : "categories"
  const ds = docDanhMucDb(bang)
  const kq = viec(ds)
  if (!kq || kq.loi) return { ok: false, ma: kq?.ma ?? 400, loi: kq?.loi ?? "Không sửa gì." }
  giaoDich((db) => {
    db.prepare(`DELETE FROM ${bang}`).run()
    for (const c of kq.ds) {
      if (bang === "concepts") {
        db.prepare("INSERT INTO concepts (id, label_vi, aliases) VALUES (?,?,?)")
          .run(c.id, c.label_vi ?? c.id, JSON.stringify(c.aliases ?? []))
      } else {
        db.prepare("INSERT INTO categories (id, label_vi, gom) VALUES (?,?,?)")
          .run(c.id, c.label_vi ?? c.id, c.gom ?? "")
      }
    }
  })
  await banXuat()
  return { ok: true, so_muc: kq.ds.length }
}

/**
 * Nhật ký — bảng audit_log CHỈ NỐI THÊM (trigger trong DDL cấm UPDATE/DELETE,
 * răng cứng hơn appendFileSync). Export in ra kb/_nhat-ky-danh-muc.md +
 * kb/_audit.jsonl cho mắt người và cho dựng-lại.
 */
export async function ghiNhatKyDanhMuc(bang, hanhDong, doiTuong, chiTiet = null) {
  giaoDich((db) => {
    db.prepare(
      "INSERT INTO audit_log (khi, bang, hanh_dong, doi_tuong, chi_tiet) VALUES (?,?,?,?,?)",
    ).run(new Date().toISOString().slice(0, 10), bang, hanhDong, doiTuong,
      chiTiet == null ? null : JSON.stringify(chiTiet))
  })
  await banXuat()
}

/**
 * DELETE = INSERT recycle (snapshot nguyên văn) + DELETE articles trong CÙNG
 * transaction (M08-R4 dạng FR-034) — crash giữa chừng không để lại trạng thái
 * mất bài. Không code path nào DELETE trên bảng recycle (trừ restore — chiều
 * thuận nghịch có INSERT articles đối xứng).
 */
export async function chuyenSangRac(type, slug) {
  const stt = giaoDich((db) => {
    const hang = db.prepare(
      "SELECT frontmatter, than FROM ban_ghi WHERE source_type = ? AND slug = ?",
    ).all(type, slug)
    if (!hang.length) return null
    db.prepare(
      "INSERT INTO recycle (source_type, slug, frontmatter, than, deleted_at)" +
      " VALUES (?,?,?,?,?)",
    ).run(type, slug, hang[0].frontmatter, hang[0].than, new Date().toISOString())
    db.prepare(`DELETE FROM ${bangCua(type)} WHERE source_type = ? AND slug = ?`).run(type, slug)
    return db.prepare("SELECT last_insert_rowid() AS stt").all()[0].stt
  })
  if (stt != null) await banXuat()
  return stt
}

/** Liệt kê thùng rác — từ bảng recycle, deleted_at là cột thật không phải mtime. */
export function quetRac() {
  const hang = doc(
    "SELECT stt, source_type, slug, deleted_at FROM recycle ORDER BY stt DESC")
  return (hang ?? []).map((r) => ({
    type: r.source_type, slug: r.slug, stt: r.stt,
    ten_file: `${r.slug}.${r.stt}.md`, deleted_at: r.deleted_at,
  }))
}

/**
 * Restore — validate snapshot trong bảng recycle rồi INSERT về articles trong
 * một giao dịch (kèm DELETE hàng rác — chiều ngược của chuyenSangRac). Vẫn
 * phải qua validate: schema có thể đã đổi từ lúc xoá, M08-R2 không có ngoại lệ
 * "ngày xưa từng hợp lệ". Trượt validate ⇒ hàng rác còn NGUYÊN — không mất gì.
 *
 * `slugMoi` (FR-031): khôi phục dưới tên khác khi kho đã có bài cùng tên —
 * sửa `slug` trong frontmatter cho khớp (slug API trả lấy từ khoá, form đọc
 * fm.slug — để lệch là bug im lặng).
 */
export async function phucHoi(type, slug, slugMoi = null) {
  const hang = doc(
    "SELECT stt, frontmatter, than FROM recycle" +
    " WHERE source_type = ? AND slug = ? ORDER BY stt DESC LIMIT 1",
    type, slug)
  if (!hang || !hang.length) return { ma: 404, loi: "Không có bản này trong thùng rác." }
  const r = hang[0]

  const ten = slugMoi ?? slug
  if (slugMoi !== null && !laSlug(slugMoi)) {
    return { ma: 400, loi: "Tên mới phải là chữ thường, số, nối bằng gạch ngang." }
  }
  if (docBai(type, ten)) {
    return {
      ma: 409,
      loi: slugMoi === null
        ? "Kho đã có bài cùng tên."
        : `Kho cũng đã có \`${type}/${ten}\` — chọn tên khác.`,
      trung: `${type}/${ten}`,
    }
  }

  const fm = JSON.parse(r.frontmatter)
  if (slugMoi !== null) fm.slug = ten

  // Validate ĐÚNG nội dung sẽ về kho — compose tmp từ snapshot.
  // Bang dich tra tu BANG KHAI. Goi TRUOC khi mo tmp: loai la thi nem o day,
  // khong phai sau khi da tao thu muc tam va spawn python.
  const bang = bangCua(type)
  const tmpGoc = mkdtempSync(join(tmpdir(), "gn-api-"))
  try {
    const tmpFile = join(tmpGoc, ten + ".md")
    writeFileSync(tmpFile, ghepFm(fm, r.than), "utf8")
    const catalog = vietDanhMucTam(tmpGoc)
    const kq = await chayValidate(tmpFile, catalog)
    if (kq.loi_that) return { ma: 422, loi: kq.ra }
  } finally {
    rmSync(tmpGoc, { recursive: true, force: true })
  }

  const fmJson = JSON.stringify(fm)
  const than = r.than
  const etag = giaoDich((db) => {
    const e = etagCua(1, fmJson, than)
    db.prepare(
      `INSERT INTO ${bang} (source_type, slug, frontmatter, than, version, etag)` +
      " VALUES (?,?,?,?,1,?)",
    ).run(type, ten, fmJson, than, e)
    db.prepare("DELETE FROM recycle WHERE stt = ?").run(r.stt)
    return e
  })
  await banXuat()
  return { ma: 200, etag, slug: ten }
}

/* ═══ DB RIÊNG CỦA LÕI — dữ liệu GỐC (ADR-06 · FR-047 · T08-11) ═══════════
 *
 * Năm bảng: nguoi_dung · ma_moi · dinh_danh_kenh · phien · nhap_chung_cat.
 * KHÔNG ở `kb/_kho.sqlite`: `core/tools/dung_lai_db.py:139-140` XOÁ file đó rồi
 * dựng lại TỪ FILE, nên dữ liệu gốc nằm trong đó bị xoá sạch trên một lệnh
 * thường xuyên. Cổng canh: `core/tests/check_db_dung_cho.py`.
 *
 * Ở ĐÂY chứ không phải một file riêng vì `api-guard` răng 2: mọi SQL sống
 * trong đúng một file. Một DB thứ hai không phải lý do cho một cửa SQL thứ hai.
 */
/*
 * WO-044 · DI TRÚ bảng nháp — `CREATE TABLE IF NOT EXISTS` KHÔNG sửa bảng đã có.
 *
 * Bug đo được trên server thật: `T08-27` thêm hai cột và siết `CHECK`, nhưng
 * với một DB **đã tồn tại** câu `CREATE TABLE IF NOT EXISTS` là **no-op** —
 * bảng cũ giữ 9 cột, mã mới `SELECT` 11 ⇒ `no such column` ngay cửa đầu.
 *
 * Và KHÔNG cổng nào bắt được: mọi cổng trỏ `LOI_DB` vào thư mục tạm nên chúng
 * luôn chạy trên DB MỚI TOANH, nơi `CREATE TABLE` chạy thật. Bộ cổng đo
 * *"schema đúng khi dựng từ đầu"*; không ai đo *"schema đúng khi DB đã có"*.
 * `loi-nhap-cua.test.js §6b` nay đo đúng ca đó.
 *
 * VÌ SAO DỰNG BẢNG MỚI chứ không `ALTER`: SQLite `ALTER TABLE ADD COLUMN` thêm
 * được cột, nhưng **không sửa được `CHECK`** — và `T08-27` đổi enum ba giá trị
 * thành bốn. Muốn `CHECK` mới thì phải dựng bảng theo schema mới, copy dữ liệu,
 * rồi đổi tên. Đó là đường duy nhất SQLite cho.
 *
 * IDEMPOTENT: `PRAGMA table_info` quyết định có làm gì không, nên hàm này chạy
 * ở MỖI lần mở DB mà không tốn gì khi schema đã đúng — cùng khuôn `busy_timeout`
 * ở trên. Không có cột cờ "đã di trú": một cờ như vậy nói về LỜI KHAI, còn
 * `table_info` nói về thứ CÓ THẬT.
 */
function diTruLoi(db) {
  const cot = db.prepare("SELECT name FROM pragma_table_info('nhap_chung_cat')")
    .all().map((r) => r.name)
  if (cot.length === 0) return                        // bảng chưa dựng — không phải việc ở đây
  const thieu = ["khang_dinh_bi_tia", "ly_do"].filter((c) => !cot.includes(c))
  const sql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='nhap_chung_cat'",
  ).get()?.sql ?? ""
  const enumCu = sql.includes("'da_gui'") || sql.includes("'bo'")
  // T08-29 · enum-4 → enum-5. `ALTER TABLE` không đổi được `CHECK`, nên đường
  // di trú vẫn là dựng-lại-rồi-chép. Đo bằng SỰ VẮNG MẶT của `da_bo` trong DDL
  // thật, không bằng một cột cờ "đã di trú" — cờ đó là một lời khai.
  const thieuDaBo = !sql.includes("'da_bo'")
  if (!thieu.length && !enumCu && !thieuDaBo) return  // đã đúng schema

  /*
   * Dựng bảng mới rồi copy. `foreign_keys` phải TẮT trong lúc đổi tên: bảng
   * `audit_loi` không trỏ tới đây, nhưng `nguoi_dung_id` của bảng này là một
   * FK ra ngoài — một lần `DROP` giữa lúc FK còn bật là một lần SQLite từ chối.
   *
   * `trang_thai` cũ có thể mang `da_gui`/`bo` — hai giá trị KHÔNG có trong enum
   * mới. Chúng ánh xạ về `nhap`: cả hai vốn không có nguồn (không spec, không
   * FR), nên đọc chúng thành "chưa đi đâu cả" là bảo toàn ý nghĩa gần nhất —
   * và giữ nguyên thì `INSERT` vỡ ở `CHECK`, mất cả hàng.
   */
  db.exec("PRAGMA foreign_keys = OFF")
  db.exec("DROP TABLE IF EXISTS nhap_chung_cat_moi")
  db.exec(`CREATE TABLE nhap_chung_cat_moi (
    job_ulid      TEXT    PRIMARY KEY,
    nguoi_dung_id INTEGER REFERENCES nguoi_dung(id),
    ban_goc_ai    TEXT    NOT NULL,
    ban_hien_tai  TEXT    NOT NULL,
    trang_thai    TEXT    NOT NULL DEFAULT 'nhap'
                  CHECK (trang_thai IN ('nhap', 'da_sua', 'da_duyet', 'tra_lai',
                                        'da_bo')),
    khang_dinh_bi_tia TEXT,
    ly_do         TEXT,
    review_status TEXT    NOT NULL DEFAULT 'draft'
                  CHECK (review_status = 'draft'),
    lan_gui_duyet INTEGER NOT NULL DEFAULT 0,
    tao_luc       TEXT    NOT NULL DEFAULT (datetime('now')),
    cap_nhat_luc  TEXT    NOT NULL DEFAULT (datetime('now')))`)
  db.exec(`INSERT INTO nhap_chung_cat_moi
      (job_ulid, nguoi_dung_id, ban_goc_ai, ban_hien_tai, trang_thai,
       khang_dinh_bi_tia, ly_do, review_status, lan_gui_duyet, tao_luc, cap_nhat_luc)
    SELECT job_ulid, nguoi_dung_id, ban_goc_ai, ban_hien_tai,
      CASE WHEN trang_thai IN ('nhap','da_sua','da_duyet','tra_lai','da_bo')
           THEN trang_thai ELSE 'nhap' END,
      ${cot.includes("khang_dinh_bi_tia") ? "khang_dinh_bi_tia" : "NULL"},
      ${cot.includes("ly_do") ? "ly_do" : "NULL"},
      review_status, lan_gui_duyet, tao_luc, cap_nhat_luc
    FROM nhap_chung_cat`)
  db.exec("DROP TABLE nhap_chung_cat")
  db.exec("ALTER TABLE nhap_chung_cat_moi RENAME TO nhap_chung_cat")
  // Trigger `ban_goc_ai` bất biến gắn với bảng CŨ và chết theo nó ⇒ dựng lại.
  // Bỏ dòng này là mất một bất biến mà không ai báo — đúng lớp lỗi đang sửa.
  db.exec(`CREATE TRIGGER IF NOT EXISTS nhap_chung_cat_ban_goc_bat_bien
    BEFORE UPDATE OF ban_goc_ai ON nhap_chung_cat
    WHEN NEW.ban_goc_ai IS NOT OLD.ban_goc_ai
    BEGIN SELECT RAISE(ABORT, 'ban_goc_ai ghi MOT LAN — FR-046'); END`)
  db.exec("PRAGMA foreign_keys = ON")
}

export function dungLoiDb(viec, { duong = duongLoiDb() } = {}) {
  const { DatabaseSync } = napSqlite()
  const db = new DatabaseSync(duong)
  try {
    // busy_timeout TRƯỚC schema: hai tiến trình cùng dựng lần đầu thì đứa thứ
    // hai phải ĐỢI, không nhận SQLITE_BUSY. Thiếu dòng này thì ca đồng thời
    // của M18-R1 sẽ NHIỄU chứ không ĐỎ — và nhiễu đọc như xanh.
    db.exec("PRAGMA busy_timeout = 5000")
    db.exec(readFileSync(LOI_SCHEMA, "utf8"))
    diTruLoi(db)
    return viec(db)
  } finally {
    // MỞ-DÙNG-ĐÓNG mỗi lượt, không giữ handle — cùng luật dòng 208-210 đã trả
    // giá ở FR-023 GĐ 3: giữ handle thì EBUSY khi test dọn kho tạm (Windows).
    db.close()
  }
}

/** Tên bảng có thật — cho cổng đối chiếu với BANG_LOI. */
export function bangLoiCoThat(db) {
  return db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all().map((r) => r.name).filter((n) => !n.startsWith("sqlite_"))
}

/* ═══ NĂM CỬA TÀI KHOẢN C3–C7 — thao tác CÓ TÊN (FR-047 · T08-12) ═══════
 *
 * Vì sao ở ĐÂY chứ không phải trong handler: `api-guard.test.js:69-71` cấm
 * `prepare(` · `BEGIN IMMEDIATE` · `DatabaseSync` trong mọi file `web/api/`
 * trừ file này. Handler gọi TÊN, không cầm `db` thô.
 *
 * Ràng buộc đó ép đúng thứ `M18 AC-3.1` đòi — "đúng MỘT chỗ INSERT INTO
 * dinh_danh_kenh" — thành CẤU TRÚC thay vì kỷ luật. Đếm được bằng grep.
 *
 * Ba luật xuyên suốt (FR-047 §2.1):
 *   L1 danh tính do LÕI gán, không nhận từ payload  (CVE-2026-47713)
 *   L2 thiếu danh tính ⇒ DENY, không nới            (cùng CVE)
 *   L3 khoá service-to-service RIÊNG + kiểm `aud`   (CVE-2025-41258, CVSS 8.0)
 */

/** L2 — thiếu thì NÉM, không rơi về mặc định. */
function doi(gt, ten) {
  if (gt === undefined || gt === null || gt === "") {
    throw new Error(`thiếu ${ten} — DENY, không nới (FR-047 L2)`)
  }
  return gt
}

/*
 * L3 · khoá dịch vụ. So sánh HẰNG THỜI GIAN và fail-closed.
 *
 * `KHOA_DICH_VU` phải KHÁC `KHOA_PHIEN`. CVE-2025-41258 (LibreChat, CVSS 8.0):
 * dùng CÙNG một secret cho session trình duyệt và cho dịch vụ nội bộ ⇒ một
 * token session hợp lệ xác thực thẳng vào dịch vụ và đi vòng TOÀN BỘ ACL một
 * lúc, gồm cả GHI.
 *
 * `aud` là vế thứ hai: một khoá đúng nhưng gửi tới người nhận sai vẫn là một
 * khoá bị dùng sai chỗ.
 */
export const AUD_LOI = "loi"

export function loiKiemKhoaDichVu({ khoa, aud } = {}) {
  const that = process.env.KHOA_DICH_VU
  if (!that || !khoa || aud !== AUD_LOI) return false
  if (that === process.env.KHOA_PHIEN) return false   // dùng chung ⇒ chặn thẳng
  if (khoa.length !== that.length) return false
  let khac = 0
  for (let i = 0; i < khoa.length; i++) khac |= khoa.charCodeAt(i) ^ that.charCodeAt(i)
  return khac === 0
}

/* ── tài khoản ─────────────────────────────────────────────────────── */


/**
 * Gọi SAU mỗi lần ghi vào một trong BA bảng phải-xuất. Cùng khuôn `banXuat()`
 * của kho: DB là chân lý, file trong git là bản lùi, và bản lùi chỉ có giá trị
 * nếu nó **tự cập nhật**.
 *
 * Một `xuatLoi()` không ai gọi thì `ADR-06 (c)` là một hàm, không phải một
 * backup. Đây là chỗ biến nó thành backup.
 *
 * Gọi NGOÀI khối `dungLoiDb` của thao tác gọi nó — `xuatLoi` tự mở DB, và mở
 * lồng nhau là chỗ khoá tự chờ chính mình.
 *
 * Nuốt lỗi CÓ CHỦ Ý: xuất hỏng (đĩa đầy, quyền) KHÔNG được làm hỏng phép ghi
 * đã COMMIT. Nhưng nó phải KÊU — im lặng ở đây là mất backup mà không ai biết.
 */
function sauGhiLoi() {
  try {
    xuatLoi()
  } catch (e) {
    console.error("[ADR-06 c] XUẤT BẢN LÙI THẤT BẠI — dữ liệu gốc đang KHÔNG có backup:", e.message)
  }
}


/**
 * ÉP QUYỀN ở tầng THAO TÁC — `FR-051`, cắm cả bốn cửa (chốt 2026-09-03).
 *
 * Vì sao ở đây chứ không ở route: đo được **3 trong 4** `viec` (`moi-nguoi-moi`
 * · `thu-hoi` · `xem-audit`) **chưa có route nào** — màn admin chưa dựng
 * (`M18 screens: []`). Cắm ở route nghĩa là để ba lỗ hở tới ngày dựng màn, và
 * ngày đó ai dựng route sẽ phải **NHỚ** cắm. Một phép kiểm phải-nhớ-cắm là một
 * phép kiểm sẽ có ngày không được cắm.
 *
 * ⇒ Đặt trong hàm. Route mới **không thể bỏ qua**, vì nó không đi vòng được.
 *
 * FAIL-CLOSED, với đúng MỘT cửa thoát và cửa đó TỰ ĐÓNG:
 *
 *   `boi` có     ⇒ hỏi `duocLam(boi, viec)`; false ⇒ NÉM
 *   `boi` vắng   ⇒ NÉM — TRỪ KHI bảng `nguoi_dung` còn RỖNG (bootstrap)
 *
 * Cửa bootstrap tồn tại vì tài khoản ĐẦU TIÊN không thể do ai tạo — chưa có ai.
 * Và nó **tự đóng**: sau hàng đầu tiên, `count(*) > 0` vĩnh viễn, nên không
 * cần cờ nào để nhớ tắt. Đây là bài học `S18` (*"thứ phải nhớ lật sẽ có ngày
 * không được lật"*) áp cho một cửa thoát an ninh.
 *
 * KHÔNG fail-open: `boi` vắng mà bảng đã có người ⇒ NÉM, không phải "cho qua".
 * Fail-open là hình dạng `CVE-2026-47713` (`user ? whereWithUser(user) :
 * where({})` — thiếu danh tính thì trả TẤT CẢ).
 */
function epQuyen(viec, boi) {
  const soNguoi = dungLoiDb((db) =>
    db.prepare("SELECT count(*) AS n FROM nguoi_dung").get().n)
  if (boi === null || boi === undefined) {
    if (soNguoi === 0) return          // bootstrap — cửa tự đóng sau hàng đầu
    throw new Error(
      `thiếu danh tính người gọi cho \`${viec}\` — DENY, không nới ` +
      `(FR-051; truyền { boi: <nguoi_dung_id> })`)
  }
  if (!duocLam(boi, viec)) {
    loiGhiAudit({ hanh_dong: `tu-choi:${viec}`, boi, ok: false })
    throw new Error(`tài khoản ${boi} không được phép \`${viec}\` (FR-051)`)
  }
}

export function loiTaoNguoiDung({ ten, boi = null } = {}) {
  doi(ten, "ten")
  const dauTien = dungLoiDb((db) =>
    db.prepare("SELECT count(*) AS n FROM nguoi_dung").get().n) === 0
  epQuyen("moi-nguoi-moi", boi)
  /*
   * TÀI KHOẢN ĐẦU TIÊN LÀ CHỦ DỰ ÁN — và đây là chỗ sửa một DEADLOCK trong
   * bản đầu của tôi.
   *
   * Bản đầu luôn tạo `dong_nghiep` (DDL DEFAULT). Hệ quả: tài khoản đầu tiên
   * tạo được (cửa bootstrap), nhưng **không bao giờ nâng lên `chu` được** —
   * `loiDatVai` đòi quyền `moi-nguoi-moi`, quyền đó đòi vai `chu`, và không ai
   * có vai `chu`. Một hệ thống không ai quản được, từ dòng đầu tiên.
   *
   * Cửa bootstrap không chỉ phải cho TẠO, nó phải cho tạo **một người quản
   * được hệ**. Khớp `prd.md:8`: MỘT chủ dự án + 5 đồng nghiệp.
   *
   * Và nó tự đóng: `dauTien` chỉ đúng khi bảng rỗng.
   */
  const id = dungLoiDb((db) => {
    db.prepare("INSERT INTO nguoi_dung (ten, vai) VALUES (?, ?)")
      .run(ten, dauTien ? "chu" : "dong_nghiep")
    return db.prepare("SELECT last_insert_rowid() AS id").get().id
  })
  sauGhiLoi()
  return id
}

/**
 * Thu hồi. ĐỔI trạng thái, KHÔNG xoá hàng (M18 AC-1.2) — xoá hàng làm mọi
 * audit_log trỏ tới nó thành mồ côi.
 *
 * `thu_hoi_luc` là MỐC, không phải cờ: AC-1.3 *edge 2* đòi phiên cũ vẫn chết
 * kể cả sau khi khôi phục tài khoản. Suy hiệu lực từ `trang_thai` hiện tại thì
 * khôi phục sẽ làm phiên SỐNG LẠI.
 */
export function loiThuHoi(id, { boi = null } = {}) {
  doi(id, "id")
  epQuyen("thu-hoi", boi)
  const _kq = dungLoiDb((db) => {
    // CHẶN ADMIN CUỐI — cùng lý do `loiDatVai`. Thu hồi chủ dự án duy nhất để
    // lại một hệ thống không ai quản được, và DENY mặc định làm nó không tự
    // khôi phục được.
    /*
     * Phep dem lam TRON MOT CAU SQL, khong doc `.vai` ra JS.
     *
     * Ban dau toi doc `la.vai === "chu"` trong JS, va cong `Y3` do NGAY:
     * "2 cho doc .vai" thay vi 1. Cong dung — bat bien la "dung MOT cho doc
     * `vai` de quyet dinh", va no khong phan biet duoc "quyet dinh ai lam duoc
     * gi" voi "quyet dinh con ai lam duoc khong".
     *
     * Noi bat bien ra 2 de vua mot ca la dung thu drift ma cong ay ton tai de
     * chan. Nen doi CACH DEM: `vai` chi xuat hien trong mot literal SQL, khong
     * bao gio thanh mot gia tri JS o day.
     */
    const chan = db.prepare(
      "SELECT count(*) AS n FROM nguoi_dung " +
      "WHERE vai = 'chu' AND trang_thai = 'hoat_dong' AND id <> ? " +
      "  AND EXISTS (SELECT 1 FROM nguoi_dung WHERE id = ? AND vai = 'chu')",
    ).get(id, id).n
    const laChu = db.prepare(
      "SELECT EXISTS (SELECT 1 FROM nguoi_dung WHERE id = ? AND vai = 'chu') AS x",
    ).get(id).x
    if (laChu && chan === 0) {
      throw new Error("khong thu hoi CHU DU AN cuoi cung — xem loiDatVai")
    }
    db.prepare(
      "UPDATE nguoi_dung SET trang_thai='thu_hoi', thu_hoi_luc=datetime('now') WHERE id=?",
    ).run(id)
    return db.prepare("SELECT changes() AS n").get().n
  })
  sauGhiLoi()
  return _kq
}

/**
 * Đặt `vai`. Cột này CHƯA AI ĐỌC và `M18-R3` cấm dùng nó làm cổng chặn cho tới
 * khi có quyết định "vai nào làm được gì". Hàm này tồn tại để màn admin hiển
 * thị được, và để cổng `AC-6.1` gieo được bốn giá trị khác nhau rồi đòi CÙNG
 * một kết quả — không có nó thì luật "vai không phải cổng" không đo được.
 */
export function loiDatVai(id, vai, { boi = null } = {}) {
  doi(id, "id")
  epQuyen("moi-nguoi-moi", boi)
  const _kq = dungLoiDb((db) => {
    /*
     * CHẶN ADMIN CUỐI. Không có nó thì `loiDatVai(chuDuyNhat, "dong_nghiep")`
     * để lại **0** vai `chu` đang hoạt động — và vì `duocLam` DENY mặc định,
     * trạng thái đó **không tự khôi phục được**: không ai mời được ai, không ai
     * đổi được vai. Đường ra duy nhất là SQL thô vào file `.db`.
     *
     * Bốn sản phẩm công bố bất biến này (Entra · Entra PIM · Directus ·
     * Strapi). Bản đầu của tôi không có, và cổng `Y1`–`Y7` không hỏi câu này —
     * chúng đo *ai làm được gì*, không đo *có còn ai làm được không*.
     */
    if (vai !== "chu") {
      const con = db.prepare(
        "SELECT count(*) AS n FROM nguoi_dung " +
        "WHERE vai = 'chu' AND trang_thai = 'hoat_dong' AND id <> ?",
      ).get(id).n
      if (con === 0) {
        throw new Error(
          "khong ha vai cua CHU DU AN cuoi cung — se khong con ai moi/thu hoi " +
          "duoc, va DENY mac dinh lam trang thai do khong tu khoi phuc duoc")
      }
    }
    db.prepare("UPDATE nguoi_dung SET vai = ? WHERE id = ?").run(vai, id)
    return db.prepare("SELECT changes() AS n").get().n
  })
  /*
   * FR-051 §7b — đổi quyền PHẢI có vết, và vết phải nói AI ĐÃ ĐỔI.
   *
   * ⚠️ Bản đầu ghi `nguoi_dung_id: id` — tức người **BỊ** đổi vai, không phải
   * người **ĐÃ** đổi. Ba tháng sau câu *"ai nâng tài khoản này lên chu?"* không
   * có câu trả lời. Đó đúng là trường `CVE-2026-48086` ghi là chỗ né được, và
   * đúng trường SEC 17a-4(f)(2)(i) gọi tên (*identity of the actor*).
   *
   * Nay ghi CẢ HAI: `boi` = ai đã đổi · `nguoi_dung_id` = ai bị đổi.
   * `boi = null` nghĩa là **chưa ai truyền vào** — không phải "hệ thống tự
   * đổi". Cổng `Y8` đòi mọi lời gọi từ route phải truyền `boi`.
   */
  loiGhiAudit({
    hanh_dong: "doi-vai", doi_tuong: `nd:${id}:${vai}`,
    nguoi_dung_id: id, boi, ok: true,
  })
  sauGhiLoi()
  return _kq
}

export function loiDemNguoiDung() {
  return dungLoiDb((db) => db.prepare("SELECT count(*) AS n FROM nguoi_dung").get().n)
}

/* ── C7 · mã mời ───────────────────────────────────────────────────── */

export function loiCapMaMoi({ nguoi_dung_id, phut = 60, boi = null } = {}) {
  doi(nguoi_dung_id, "nguoi_dung_id")
  epQuyen("moi-nguoi-moi", boi)
  // Entropy: 32 byte từ nguồn mã hoá. AC-7.2 đòi ≥128 bit — đây là 256.
  const ma = randomBytes(32).toString("base64url")
  return dungLoiDb((db) => {
    db.prepare(
      "INSERT INTO ma_moi (ma, nguoi_dung_id, het_han) " +
      "VALUES (?, ?, datetime('now', ?))",
    ).run(ma, nguoi_dung_id, `${phut} minutes`)
    return ma
  })
}

export function loiXemMaMoi(ma) {
  doi(ma, "ma")
  return dungLoiDb((db) =>
    db.prepare("SELECT ma, nguoi_dung_id, het_han, dung_luc FROM ma_moi WHERE ma=?")
      .get(ma) ?? null)
}

/* ── C3/C4 · định danh kênh ────────────────────────────────────────── */

/**
 * C3 · tra. **V6**: `chat_id` lạ và `chat_id` có-nhưng-chưa-buộc trả GIỐNG
 * HỆT nhau — hai phản hồi khác nhau là một phép ĐẾM TÀI KHOẢN cho người lạ.
 * Ở đây điều đó là hiển nhiên vì chỉ có MỘT bảng để tra, nhưng viết ra để
 * không ai thêm một nhánh "chat_id này có trong hệ thống" cho thân thiện.
 *
 * Trả DUY NHẤT `nguoi_dung_id` — không tên, không email (FR-047 C3).
 */
export function loiTraDinhDanh({ kenh, chat_id } = {}) {
  doi(kenh, "kenh"); doi(chat_id, "chat_id")
  return dungLoiDb((db) => {
    const h = db.prepare(
      "SELECT nguoi_dung_id FROM dinh_danh_kenh WHERE kenh=? AND chat_id=?",
    ).get(kenh, chat_id)
    return h ? { nguoi_dung_id: h.nguoi_dung_id } : {}
  })
}

/**
 * C4 · buộc. **ĐÚNG MỘT chỗ ghi vào bảng định danh trong toàn repo**
 * (M18 AC-3.1) — đo bằng đếm, không bằng "không tìm thấy allowlist".
 *
 * ⚠️ Bình luận này CỐ Ý không viết câu lệnh INSERT ra chữ. Bản đầu có, và phép
 * đếm ra 2 thay vì 1 — cổng đỏ vì một BÌNH LUẬN. Đúng lỗi
 * cac-man-con-lai.test.js:117 đã vấp: thứ phá phép cắt là một literal nằm trong chú thích.
 *
 * L1: `nguoi_dung_id` trong payload bị **LỘT**. Chủ của ràng buộc là chủ của
 * MÃ, do LÕI đọc từ bảng. CVE-2026-47713 là hình dạng ngược lại.
 *
 * Tiêu mã và ghi ràng buộc trong CÙNG một transaction: M18-R1 đòi hai request
 * đồng thời cho ra đúng MỘT thành công, và phép đếm là `changes()` sau
 * `UPDATE … WHERE dung_luc IS NULL` — không phải SELECT-rồi-UPDATE.
 */
export function loiBuocDinhDanh({ kenh, chat_id, ma } = {}) {
  doi(kenh, "kenh"); doi(chat_id, "chat_id"); doi(ma, "ma")
  const _kq = dungLoiDb((db) => {
    db.exec("BEGIN IMMEDIATE")
    try {
      db.prepare(
        "UPDATE ma_moi SET dung_luc = datetime('now') " +
        "WHERE ma = ? AND dung_luc IS NULL AND het_han > datetime('now')",
      ).run(ma)
      if (db.prepare("SELECT changes() AS n").get().n !== 1) {
        throw new Error("mã không dùng được — đã dùng, hết hạn, hoặc không tồn tại")
      }
      const chu = db.prepare("SELECT nguoi_dung_id FROM ma_moi WHERE ma=?").get(ma)
      db.prepare(
        "INSERT INTO dinh_danh_kenh (kenh, chat_id, nguoi_dung_id, ma_da_dung) " +
        "VALUES (?, ?, ?, ?)",
      ).run(kenh, chat_id, chu.nguoi_dung_id, ma)
      db.exec("COMMIT")
      return { nguoi_dung_id: chu.nguoi_dung_id }
    } catch (e) {
      db.exec("ROLLBACK")
      throw e
    }
  })
  sauGhiLoi()
  return _kq
}

/* ── C6 · phiên ────────────────────────────────────────────────────── */

export function loiMoPhien({ nguoi_dung_id, kenh, ngu_canh = null, gio = 24 } = {}) {
  doi(nguoi_dung_id, "nguoi_dung_id"); doi(kenh, "kenh")
  const id = randomBytes(24).toString("base64url")
  return dungLoiDb((db) => {
    db.prepare(
      "INSERT INTO phien (id, nguoi_dung_id, kenh, ngu_canh, het_han) " +
      "VALUES (?, ?, ?, ?, datetime('now', ?))",
    ).run(id, nguoi_dung_id, kenh, ngu_canh, `${gio} hours`)
    return id
  })
}

/**
 * C6 · tra danh tính. Trả `{nguoi_dung_id, het_han}` — **KHÔNG** `ngu_canh`
 * (FR-045 U6): ngữ cảnh là dữ liệu, và THỢ không được đọc dữ liệu.
 *
 * `null` khi: không có · hết hạn · **chủ đã bị thu hồi SAU khi phiên mở**.
 * Vế thứ ba là AC-1.3 — `CVE-2026-44560` ghi thẳng *"revocation is
 * ineffective"* vì ba trong năm đường code không kiểm lại sau khi gỡ quyền.
 */
export function loiXemPhien(id) {
  doi(id, "id")
  return dungLoiDb((db) => {
    const h = db.prepare(
      "SELECT p.nguoi_dung_id, p.het_han, p.tao_luc, n.trang_thai, n.thu_hoi_luc " +
      "FROM phien p JOIN nguoi_dung n ON n.id = p.nguoi_dung_id " +
      "WHERE p.id = ? AND p.het_han > datetime('now')",
    ).get(id)
    if (!h) return null
    if (h.trang_thai !== "hoat_dong") return null
    if (h.thu_hoi_luc && h.thu_hoi_luc >= h.tao_luc) return null
    return { nguoi_dung_id: h.nguoi_dung_id, het_han: h.het_han }
  })
}

/* ── C5 · audit — APPEND-ONLY ──────────────────────────────────────── */

/**
 * V5: **không có** `loiSuaAudit` và **không có** `loiXoaAudit` trong file này.
 * Sự vắng mặt đó là hợp đồng, và cổng đo nó bằng `typeof … !== "function"`.
 *
 * M18-R2: dòng log ghi SỰ KIỆN, **không kèm giá trị bí mật**. Không có tham số
 * nào nhận mã mời — log không hết hạn, còn mã thì có.
 */
export function loiGhiAudit(
  { hanh_dong, doi_tuong = null, nguoi_dung_id = null, boi = null, ok = true } = {},
) {
  doi(hanh_dong, "hanh_dong")
  return dungLoiDb((db) => {
    db.exec(
      "CREATE TABLE IF NOT EXISTS audit_loi (" +
      " stt INTEGER PRIMARY KEY, khi TEXT NOT NULL DEFAULT (datetime('now'))," +
      " hanh_dong TEXT NOT NULL, doi_tuong TEXT, nguoi_dung_id INTEGER," +
      // `boi` = AI ĐÃ làm. `nguoi_dung_id` = ai BỊ tác động. Hai câu hỏi khác
      // nhau, và bản đầu chỉ ghi câu thứ hai — xem `loiDatVai`.
      " boi INTEGER, ok INTEGER NOT NULL)",
    )
    /*
     * BA TRIGGER — append-only bằng CẤU TRÚC, không bằng lời khai.
     *
     * ⚠️ Bản đầu của hàm này có một bình luận viết `audit_loi` không có đường
     * sửa. Đó là **LỜI KHAI**, không phải sự thật: bảng đó là bảng thường, và
     * `UPDATE`/`DELETE` chạy được. `CLAUDE.md` cấm đúng điều đó ("tự khai").
     *
     * Và khuôn đã có sẵn để chép: `audit_log` của kho có hai trigger từ trước
     * (`kho.schema.sql`) — tôi khẳng định một tính chất an ninh mà không chép
     * mười dòng đang nằm cách đó một file.
     *
     * Cửa thứ ba (`INSERT OR REPLACE`) đo được là đi vòng cả hai trigger kia,
     * nên nó cần trigger riêng. Xem ghi chú dài ở `kho.schema.sql`.
     */
    db.exec(
      "CREATE TRIGGER IF NOT EXISTS audit_loi_chi_noi_them " +
      "BEFORE UPDATE ON audit_loi BEGIN " +
      " SELECT RAISE(ABORT, 'audit_loi APPEND-ONLY — khong sua'); END")
    db.exec(
      "CREATE TRIGGER IF NOT EXISTS audit_loi_khong_xoa " +
      "BEFORE DELETE ON audit_loi BEGIN " +
      " SELECT RAISE(ABORT, 'audit_loi APPEND-ONLY — khong xoa'); END")
    db.exec(
      "CREATE TRIGGER IF NOT EXISTS audit_loi_khong_ghi_de " +
      "BEFORE INSERT ON audit_loi " +
      "WHEN EXISTS (SELECT 1 FROM audit_loi WHERE stt = NEW.stt) BEGIN " +
      " SELECT RAISE(ABORT, 'audit_loi APPEND-ONLY — khong ghi de'); END")
    db.prepare(
      "INSERT INTO audit_loi (hanh_dong, doi_tuong, nguoi_dung_id, boi, ok) " +
      "VALUES (?, ?, ?, ?, ?)",
    ).run(hanh_dong, doi_tuong, nguoi_dung_id, boi, ok ? 1 : 0)
    return db.prepare("SELECT last_insert_rowid() AS id").get().id
  })
}

export function loiDemAudit() {
  return dungLoiDb((db) => {
    db.exec("CREATE TABLE IF NOT EXISTS audit_loi (stt INTEGER PRIMARY KEY, khi TEXT, hanh_dong TEXT, doi_tuong TEXT, nguoi_dung_id INTEGER, ok INTEGER)")
    return db.prepare("SELECT count(*) AS n FROM audit_loi").get().n
  })
}

export function loiDocAudit(gioiHan = 100, { boi = null } = {}) {
  epQuyen("xem-audit", boi)
  return dungLoiDb((db) => {
    db.exec("CREATE TABLE IF NOT EXISTS audit_loi (stt INTEGER PRIMARY KEY, khi TEXT, hanh_dong TEXT, doi_tuong TEXT, nguoi_dung_id INTEGER, ok INTEGER)")
    return db.prepare("SELECT * FROM audit_loi ORDER BY stt DESC LIMIT ?").all(gioiHan)
  })
}

/* ── C2 phụ · nháp chưng cất (V8) ──────────────────────────────────── */

export function loiTaoNhap({ nguoi_dung_id = null, ban_goc_ai } = {}) {
  doi(ban_goc_ai, "ban_goc_ai")
  const job = randomBytes(16).toString("hex")
  const _kq = dungLoiDb((db) => {
    db.prepare(
      "INSERT INTO nhap_chung_cat (job_ulid, nguoi_dung_id, ban_goc_ai, ban_hien_tai) " +
      "VALUES (?, ?, ?, ?)",
    ).run(job, nguoi_dung_id, ban_goc_ai, ban_goc_ai)
    return job
  })
  sauGhiLoi()
  return _kq
}

/** Sửa BẢN HIỆN TẠI. `ban_goc_ai` không có đường sửa — trigger DDL chặn nốt. */
export function loiSuaNhap(job, ban) {
  doi(job, "job"); doi(ban, "ban")
  const _kq = dungLoiDb((db) => {
    db.prepare(
      "UPDATE nhap_chung_cat SET ban_hien_tai=?, cap_nhat_luc=datetime('now') WHERE job_ulid=?",
    ).run(ban, job)
    return db.prepare("SELECT changes() AS n").get().n
  })
  sauGhiLoi()
  return _kq
}

/**
 * T08-22 · LIỆT KÊ nháp cho màn triage — KHÔNG cõng hai bản toàn văn.
 *
 * Cột liệt kê TƯỜNG MINH, không `SELECT *`: `SELECT *` sẽ kéo cả `ban_goc_ai`
 * lẫn `ban_hien_tai` (thân bài) vào một danh sách 200 hàng, và nó cũng sẽ kéo
 * bất kỳ cột nào bảng có về sau — cùng lý do `XUAT_LOI` liệt kê tường minh.
 *
 * Sắp theo `cap_nhat_luc` GIẢM: hàng đợi triage đọc từ việc mới nhất.
 */
/**
 * Ba trường tóm tắt rút từ frontmatter của bản nháp: `nguon` (bản ghi GỐC),
 * `slug` (của chính bản nháp), và cặp citations.
 *
 * KHÔNG dùng thư viện YAML: câu hỏi duy nhất là *"dòng `khoá: giá trị` này ở
 * cột 0 của frontmatter"* — cùng lập luận `ghepBoSung` của `server.mjs`. Một
 * parser đầy đủ ở đây là một phụ thuộc mới cho ba dòng regex.
 *
 * Thiếu trường ⇒ `null`, KHÔNG đoán: một `nguon` bịa ra là một cái link dẫn
 * người tới sai bản ghi, tệ hơn không có link.
 */
export function tomTatNhap(ban) {
  // `\\s` chứ không `\s`: đây là CHUỖI, và trong chuỗi JS thì `\s` là ký tự `s`. Bản đầu
  // viết một dấu, nên lớp ký tự thành `[sS]` — regex khớp chữ s/S thay vì
  // mọi khoảng trắng, và `tomTatNhap` trả `null` cho MỌI trường.
  const FM = new RegExp('^---[\\r\\n]+([\\s\\S]*?)[\\r\\n]+---')
  const fm = FM.exec(String(ban ?? ''))?.[1] ?? ''
  const lay = (k) => new RegExp('^' + k + ':\\s*(.+)$', 'm').exec(fm)?.[1]?.trim()
  const so = (k) => { const v = Number(lay(k)); return Number.isFinite(v) ? v : null }
  return {
    // `nguon: [tai-lieu/linux-foundation]` — bỏ ngoặc, lấy phần tử đầu.
    nguon: (lay('nguon') ?? '').replace(/^\[|\]$/g, '').split(',')[0].trim() || null,
    slug_nhap: lay('slug') ?? null,
    model_da_dung: lay('model_da_dung') ?? null,
    citations_sampled: so('citations_sampled'),
    citations_verified: so('citations_verified'),
  }
}

export function loiLietKeNhap({ trang_thai = null, n = 50, gom_da_bo = false } = {}) {
  const gioi = Math.max(1, Math.min(Number(n) || 50, 200))
  return dungLoiDb((db) => {
    const cot = "job_ulid, nguoi_dung_id, trang_thai, khang_dinh_bi_tia, ly_do, " +
      "review_status, lan_gui_duyet, tao_luc, cap_nhat_luc"
    /*
     * T08-29 / FR-057 · mặc định KHÔNG hiện `da_bo`.
     *
     * Danh sách này là HÀNG ĐỢI VIỆC PHẢI LÀM (`T03-94`), và một bản đã bỏ
     * không còn là việc. Nhưng nó KHÔNG biến mất: lọc tường minh
     * `?trang_thai=da_bo` vẫn đọc được — đó là khác biệt giữa "bỏ" và "xoá",
     * và nó phải nhìn thấy được ở tầng API, không chỉ ở tầng bảng.
     *
     * `tong` đếm CÙNG một tập với `dong`. Hai câu lệnh đếm hai tập khác nhau
     * là cách một badge nói dối: "5 việc" trong khi danh sách hiện 3.
     */
    /*
     * WO-090 · `gom_da_bo` — CỜ TƯỜNG MINH, không đổi mặc định.
     *
     * Tab `Kết quả` là LỊCH SỬ: nó phải thấy cả bản đã bỏ. Nhưng mặc định ở
     * trên đang bảo vệ HÀNG ĐỢI VIỆC của `T03-94`, và đổi nó là chữa một màn
     * bằng cách phá một màn khác — cái phá ấy không ai thấy ngay.
     *
     * Không nhồi vào `trang_thai=tat-ca`: `trang_thai` là một ENUM TRẠNG THÁI,
     * và nhét một giá trị-không-phải-trạng-thái vào đó là chỗ ca thứ ba lệch.
     */
    const loc = trang_thai
      ? { dieu: "WHERE trang_thai = ?", so: [trang_thai] }
      : gom_da_bo
        ? { dieu: "", so: [] }
        : { dieu: "WHERE trang_thai <> 'da_bo'", so: [] }
    /*
     * `ban_goc_ai` đọc THÊM, chỉ để rút ba trường tóm tắt — KHÔNG trả nguyên
     * bản ra danh sách.
     *
     * Vì sao cần: chủ dự án hỏi *"các bản xong rồi thì kết quả ở đâu, có link
     * với bài viết gốc không?"*. Bản nháp có tồn tại, nhưng danh sách không
     * mang một trường nào nói nó thuộc bản ghi NÀO — nên màn quản lý không dựng
     * nổi một cái link. Nguồn nằm trong frontmatter của `ban_goc_ai`.
     *
     * Rút Ở ĐÂY chứ không để FE gọi từng bản: 50 bản nháp = 50 request, và mỗi
     * request kéo NGUYÊN bài (vài KB) chỉ để lấy một dòng `nguon:`.
     *
     * Và KHÔNG trả `ban_goc_ai` ra: danh sách là danh sách, không phải nội
     * dung. Trả cả bài cho 50 dòng là vài trăm KB cho một màn tóm tắt.
     */
    const tho = db.prepare(
      `SELECT ${cot}, ban_goc_ai FROM nhap_chung_cat ${loc.dieu} ` +
      "ORDER BY cap_nhat_luc DESC, rowid DESC LIMIT ?",
    ).all(...loc.so, gioi)
    const dong = tho.map(({ ban_goc_ai, ...r }) => ({
      ...r, ...tomTatNhap(ban_goc_ai),
    }))
    const tong = db.prepare(
      `SELECT COUNT(*) AS n FROM nhap_chung_cat ${loc.dieu}`).get(...loc.so).n
    return { dong, tong, tran: 200 }
  })
}

/**
 * T08-22 · đổi `trang_thai` (+ `ly_do` cho ca trả lại).
 *
 * `trang_thai` là ĐỐI SỐ CÓ TÊN, không phải một trường của payload: cửa quyết
 * trạng thái, client không. Và enum bốn giá trị cưỡng chế ở DDL (`CHECK`,
 * T08-27) nên một giá trị lạ chết ở tầng bảng, không ở tầng handler.
 *
 * `ly_do` chỉ ghi khi có truyền — ba trạng thái kia không có lý do, và ghi
 * `NULL` đè lên một lý do cũ là xoá thông tin mà không ai yêu cầu.
 */
/*
 * NHÁP CŨ cùng nguồn → `da_bo`.
 *
 * Chủ dự án bắt 2026-09-07 (ảnh): bốn việc `xong` mà chỉ MỘT dòng gạch đỏ, và
 * các bản nháp cũ *"vẫn tồn đọng"*. Gốc là chỗ tôi đọc lướt câu chốt: `donBanCu`
 * chỉ chạy ở cửa DUYỆT, nên một bản nháp KHÔNG BAO GIỜ được duyệt thì nằm lại
 * mãi — mà chủ dự án nói rõ *"các bản cũ (NHÁP) … cho vào thùng rác"*.
 *
 * `da_bo`, KHÔNG xoá hàng: `FR-057` chốt *bỏ ≠ xoá* — `ban_goc_ai` tốn token
 * để tạo và là thứ duy nhất trả lời *"người đã sửa những gì"*.
 *
 * So bằng `nguon` đọc từ frontmatter của `ban_goc_ai`, không bằng slug: một
 * nguồn chưng cất nhiều lần thì slug có thể trùng hoặc không, còn `nguon` thì
 * luôn trỏ đúng bản ghi gốc.
 *
 * Chỉ đụng trạng thái `nhap`. `da_duyet` đã thành bài trong kho (đường của nó
 * là thùng rác của KHO, `donBanCu`); `da_bo` thì một chiều.
 */
export function donNhapCu(jobGiuLai, nguon) {
  const ds = Array.isArray(nguon) ? nguon : (nguon ? [nguon] : [])
  if (!ds.length) return []
  const dat = []
  try {
    const hang = dungLoiDb((db) => db.prepare(
      "SELECT job_ulid, ban_goc_ai FROM nhap_chung_cat WHERE trang_thai = 'nhap'",
    ).all())
    for (const h of hang) {
      if (h.job_ulid === jobGiuLai) continue
      const m = /^nguon:\s*(.+)$/m.exec(String(h.ban_goc_ai ?? ""))
      if (!m) continue
      const cua = m[1]
      if (!ds.some((x) => cua.includes(x))) continue
      loiDoiTrangThaiNhap(h.job_ulid, "da_bo",
        "bản cũ — đã có bản chưng cất mới hơn cho cùng nguồn (tự dọn)")
      dat.push(h.job_ulid)
    }
  } catch {
    // Dọn trượt KHÔNG được huỷ việc tạo nháp mới: bản mới đã tốn token model,
    // còn cái hỏng chỉ là một thao tác gọn nhà.
  }
  return dat
}

export function loiDoiTrangThaiNhap(job, trang_thai, ly_do) {
  doi(job, "job"); doi(trang_thai, "trang_thai")
  const _kq = dungLoiDb((db) => {
    if (ly_do === undefined) {
      db.prepare(
        "UPDATE nhap_chung_cat SET trang_thai=?, cap_nhat_luc=datetime('now') WHERE job_ulid=?",
      ).run(trang_thai, job)
    } else {
      db.prepare(
        "UPDATE nhap_chung_cat SET trang_thai=?, ly_do=?, cap_nhat_luc=datetime('now') " +
        "WHERE job_ulid=?",
      ).run(trang_thai, ly_do, job)
    }
    return db.prepare("SELECT changes() AS n").get().n
  })
  sauGhiLoi()
  return _kq
}

export function loiXemNhap(job) {
  doi(job, "job")
  return dungLoiDb((db) =>
    db.prepare("SELECT * FROM nhap_chung_cat WHERE job_ulid=?").get(job) ?? null)
}

/* ═══ XUẤT BA BẢNG GỐC RA FILE — backup theo ADR-06 (c) · T08-13 ════════
 *
 * Chỉ đạo nguyên văn: *"dữ liệu mới làm như dữ liệu cũ đi, site chính `.db`
 * còn ta vẫn xuất ra được `.md`/`.yaml` để backup"*. Đúng cơ chế `B-C1` đang
 * dùng cho kho: DB là chân lý, file trong git là bản lùi.
 *
 * BA bảng xuất: `nguoi_dung` · `dinh_danh_kenh` · `nhap_chung_cat`.
 * HAI bảng KHÔNG xuất trạng thái: `ma_moi` (bí mật) · `phien` (session) —
 * khôi phục một mã đã hết hạn hay một session cũ không khôi phục được gì, và
 * ghi chúng ra file là biến một bí mật ngắn hạn thành một bí mật vĩnh viễn
 * nằm trong git. Dấu vết của chúng sống trong audit dưới dạng SỰ KIỆN.
 *
 * ⚠️ KHÔNG có vòng reap ở đây. `xuat_kho.py:141-146` xoá mọi file không nằm
 * trong tập `can_co` — cơ chế đó suýt xoá cả một loại trong kho (`S12`), và
 * nó chỉ quét `kb/` + `_recycle/` nên không với tới đây. Hàm này **chỉ ghi
 * đè ba file đã biết tên**, không quét thư mục, không xoá gì. Muốn dọn file
 * thừa thì đó là một quyết định riêng, không phải tác dụng phụ của một lần ghi.
 *
 * ⚠️ File ra chứa DỮ LIỆU CÁ NHÂN (`nguoi_dung.ten`, `dinh_danh_kenh.chat_id`).
 * Trong git LOCAL thì không khác gì DB. `git push` lên remote là CHUYỂN DỮ
 * LIỆU CÁ NHÂN RA NGOÀI ⇒ `B-E5` (NĐ 356/2025) áp vào, cùng hồ sơ DPIA chưa
 * ai lập. Không chặn gì hôm nay; chặn LẦN PUSH ĐẦU TIÊN.
 */
/*
 * Đích bản lùi. `_backup/` ở GỐC REPO, KHÔNG trong `web/` — FR-050 cách 2.
 *
 * Chủ dự án chốt: backup ra ổ, KHÔNG vào git. Hai trong ba file chứa dữ liệu
 * cá nhân (`ten`, `chat_id`), nên cách này XOÁ vấn đề `B-E5` thay vì quản nó.
 *
 * ⚠️ ĐÁNH ĐỔI: mất `_backup/` = MẤT TÀI KHOẢN. Không có bản thứ hai ở đâu cả.
 * Git remote từng là bản thứ hai ở cách 1; cách 2 không có. Ghi ở đây vì đây
 * là chỗ người ta đọc khi đi tìm bản lùi.
 *
 * `LOI_LUU` override cùng khuôn `LOI_DB`/`KB_DIR` — test trỏ sang thư mục tạm.
 */
export const LUU_LOI = () => process.env.LOI_LUU ?? join(GOC, "_backup")

/** Ba bảng phải-xuất — nguồn cho cổng, không gõ lại ở chỗ thứ hai. */
export const XUAT_LOI = [
  { bang: "nguoi_dung", file: "nguoi-dung.yaml",
    cot: "id, ten, vai, trang_thai, tao_luc, thu_hoi_luc" },
  { bang: "dinh_danh_kenh", file: "dinh-danh-kenh.yaml",
    // `ma_da_dung` CỐ Ý ngoài danh sách — nó là chính mã mời, và ADR-06 (c)
    // cấm mã ra file. Bản đầu dùng `SELECT *` và mã ĐI THẲNG vào export; phép
    // thử "không file nào chứa mã" bắt được ngay lượt chạy đầu.
    cot: "kenh, chat_id, nguoi_dung_id, buoc_luc" },
  { bang: "nhap_chung_cat", file: "nhap-chung-cat.yaml",
    // 2026-09-03: `lan_gui` → `lan_gui_duyet` (tên `lan_gui` có chủ ở M12 —
    // bộ đếm egress của THỢ, spec §5.1); `review_status` là cột MỚI (M12
    // AC-1.3). Cả hai vào danh sách một cách CÓ Ý THỨC, đúng luật khối chú
    // thích dưới: `review_status` không phải bí mật, và hôm nay nó hằng
    // (`CHECK = 'draft'`) không bảo đảm ngày mai — bỏ nó khỏi backup là để
    // một trường của bản ghi ra ngoài tầm nhìn.
    // 2026-09-04 (T08-27/WO-043): `khang_dinh_bi_tia` + `ly_do` là hai cột MỚI
    // của `FR-046 §1`. Vào danh sách CÓ Ý THỨC: cả hai là dữ liệu làm-việc của
    // hàng đợi, không phải bí mật, và bỏ chúng khỏi backup nghĩa là dựng lại DB
    // sẽ mất câu "bản này đã bị tỉa gì" và "vì sao nó bị trả lại" — đúng hai
    // câu mà màn triage `T03-94` sống bằng.
    cot: "job_ulid, nguoi_dung_id, ban_goc_ai, ban_hien_tai, trang_thai, khang_dinh_bi_tia, ly_do, review_status, lan_gui_duyet, tao_luc, cap_nhat_luc" },
  { bang: "audit_loi", file: "audit-loi.yaml",
    // 2026-09-04 (T08-28/WO-046): bảng THỨ TƯ.
    //
    // Ba bảng đầu là dữ liệu; `audit_loi` là VẾT — nó tồn tại đúng để trả lời
    // *"ai đã làm gì"* khi dữ liệu đã đổi. Không có đường backup, một lần dựng
    // lại DB xoá vết audit IM LẶNG, và thứ mất là thứ duy nhất chứng minh
    // chuyện đã xảy ra. `WO-044` đã phải xuất TAY 9 hàng ra thư mục tạm vì
    // đường chính thức không có.
    //
    // Không cột nào bí mật: `boi`/`nguoi_dung_id` là id, không phải danh tính;
    // `doi_tuong` không bao giờ mang mã mời — `V5` của `loi-cua.test.js` canh
    // đúng điều đó ("không dòng audit nào chứa giá trị mã mời").
    //
    // `ma_moi` + `phien` VẪN không xuất — ADR-06 (c) giữ nguyên vế bí mật.
    cot: "stt, khi, hanh_dong, doi_tuong, nguoi_dung_id, boi, ok" },
]

/*
 * ⚠️ CỘT LIỆT KÊ TƯỜNG MINH, KHÔNG `SELECT *`. `SELECT *` xuất bất kỳ cột nào
 * bảng có — nên ngày ai đó thêm một cột bí mật, nó ra file NGAY mà không ai
 * sửa dòng nào ở đây. Danh sách tường minh biến "thêm cột bí mật" thành một
 * việc phải làm CÓ Ý THỨC. Cùng bài học `S8` của plan tách-ba-bảng.
 */

/**
 * Xuất BỐN bảng. Trả `{ghi, bang}`.
 *
 * Điểm bất động: chạy hai lần liên tiếp cho ra **cùng byte** — cột thời gian
 * đi thẳng từ DB, không có `now()` nào trong đường ghi. Không có điều đó thì
 * mỗi lần xuất là một diff git rác, và bản backup mất khả năng nói *"có gì
 * đổi không"*.
 */
export function xuatLoi({ thuMuc = LUU_LOI() } = {}) {
  mkdirSync(thuMuc, { recursive: true })
  let ghi = 0
  const hang = dungLoiDb((db) => {
    const r = {}
    /*
     * T08-28 · `audit_loi` được TẠO LÚC GHI đầu tiên (`loiGhiAudit`), không ở
     * `loi.schema.sql` — nên trên một DB vừa dựng mà chưa ai ghi audit, bảng
     * CHƯA CÓ. Không phải ca tưởng tượng: một lần xuất ngay sau khi init là
     * đường có thật, và `SELECT` sẽ ném `no such table`.
     *
     * Xuất file RỖNG chứ không bỏ qua bảng: "chưa có dòng audit nào" là một
     * câu trả lời, còn thiếu hẳn file là im lặng — và im lặng ở chỗ này đọc
     * giống hệt "bản lùi này không có audit", đúng thứ WO-046 đi dẹp.
     */
    const coBang = (t) => db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t) != null
    for (const { bang, cot } of XUAT_LOI) {
      if (!coBang(bang)) { r[bang] = []; continue }
      // `nhap_chung_cat` xuất CẢ `ban_goc_ai` lẫn `ban_hien_tai`: bản gốc là
      // thứ tốn token model để tạo, và là thứ trả lời "người đã sửa những gì".
      r[bang] = db.prepare(`SELECT ${cot} FROM ${bang} ORDER BY rowid`).all()
    }
    return r
  })
  for (const { bang, file } of XUAT_LOI) {
    const noi =
      `# SINH TỰ ĐỘNG — ADR-06 (c). Nguồn chân lý là DB, file này là BẢN LÙI.\n` +
      `# Sửa tay ở đây KHÔNG vào DB. Bảng: ${bang}\n` +
      YAML.stringify({ [bang]: hang[bang] })
    const duong = join(thuMuc, file)
    // Chỉ ghi khi ĐỔI — giữ mtime ổn định, và làm điểm bất động nhìn thấy được.
    if (!existsSync(duong) || readFileSync(duong, "utf8") !== noi) {
      writeFileSync(duong, noi, "utf8")
      ghi++
    }
  }
  return { ghi, bang: XUAT_LOI.length }
}

/* ═══ CHẶN DÒ — rate limit hai chiều (FR-049 · T08-15) ════════════════
 *
 * `ma_moi` một-lần + hết-hạn chặn *dùng lại* và *dùng muộn*. Nó KHÔNG chặn
 * **thử hàng nghìn lần trong cửa sổ còn hiệu lực** — và hậu quả không phải
 * "đăng nhập sai": đoán được mã là **THÀNH người khác trong kho**.
 *
 * BỘ ĐẾM TRONG DB, KHÔNG TRONG RAM. Hai lý do, cả hai đo được:
 *   · RAM mất khi restart ⇒ kẻ dò chỉ cần đợi một lần khởi động lại.
 *   · `web/` chạy MỘT tiến trình hôm nay, nhưng `ADR-05` mở đường cho nhiều —
 *     bộ đếm RAM sẽ đếm RIÊNG từng tiến trình, tức ngưỡng thật thành
 *     `N × số tiến trình` mà không ai đổi một dòng cấu hình nào.
 */
let _nguong = null

/** Ngưỡng từ BẢNG KHAI. Cache trong tiến trình; test gọi `xoaCacheNguong()`. */
export function nguongLoi() {
  if (!_nguong) {
    _nguong = JSON.parse(
      readFileSync(join(GOC, "core", "assets", "nguong-loi.json"), "utf8"))
  }
  return _nguong
}

/** Chỉ cho test đổi bảng khai giữa lượt — cổng W3b đòi điểm chặn dời theo. */
export function xoaCacheNguong() {
  _nguong = null
}

/**
 * Cho phép một lần thử không? Trả `true` = cho, `false` = CHẶN.
 *
 * Đếm HAI CHIỀU độc lập trong cùng một cửa sổ:
 *   · theo `ip`  — chặn một máy thử nhiều mã
 *   · theo `ma`  — chặn nhiều máy cùng thử một mã
 *
 * Ghi lượt thử TRƯỚC khi so ngưỡng, nên lần vượt ngưỡng cũng được ghi — không
 * thì lần đầu tiên bị chặn sẽ không có vết, và đó là lần đáng có vết nhất.
 *
 * Bị chặn ⇒ ghi `audit`, KHÔNG kèm giá trị mã (`M18-R2`): log không hết hạn,
 * còn mã thì có.
 */
export function loiChoThu({ ip, ma } = {}) {
  const n = nguongLoi()
  const cua = `-${n.cua_so_phut} minutes`
  const kq = dungLoiDb((db) => {
    db.exec(
      "CREATE TABLE IF NOT EXISTS lan_thu (" +
      " stt INTEGER PRIMARY KEY, khi TEXT NOT NULL DEFAULT (datetime('now'))," +
      " ip TEXT, ma_bam TEXT)")
    // Lưu BĂM của mã, không lưu mã. Bảng này đủ để đếm "cùng một mã bị thử
    // bao nhiêu lần" mà không giữ bí mật nào — nếu ai đọc được DB thì họ cũng
    // không lấy được mã từ đây.
    const bam = ma ? createHash("sha256").update(String(ma)).digest("hex") : null
    db.prepare("INSERT INTO lan_thu (ip, ma_bam) VALUES (?, ?)").run(ip ?? null, bam)

    const dem = (cot, gt) => db.prepare(
      `SELECT count(*) AS n FROM lan_thu WHERE ${cot} = ? AND khi > datetime('now', ?)`,
    ).get(gt, cua).n

    const nIp = ip ? dem("ip", ip) : 0
    const nMa = bam ? dem("ma_bam", bam) : 0
    if (nIp > n.thu_theo_ip) return { cho: false, ly_do: "ip", dem: nIp }
    if (nMa > n.thu_theo_ma) return { cho: false, ly_do: "ma", dem: nMa }
    return { cho: true }
  })
  if (!kq.cho) {
    loiGhiAudit({
      hanh_dong: "chan-do",
      doi_tuong: kq.ly_do === "ip" ? `ip:${ip}` : "ma:<băm>",
      ok: false,
    })
  }
  return kq.cho
}

/**
 * Bản lùi có ở đây không — và NÓI RA nếu không (FR-050 `X7`).
 *
 * Sau `FR-050` cách 2, bản lùi **không** vào git. Nên một `clone` mới sẽ chạy
 * được **và không có tài khoản nào** — và đó trông **GIỐNG HỆT** một hệ thống
 * mới tinh chưa mời ai.
 *
 * Hai ca phải phân biệt được:
 *   · "chưa mời ai"           → DB rỗng, `_backup/` rỗng ⇒ bình thường
 *   · "backup không ở đây"    → DB rỗng nhưng ĐÃ TỪNG có người ⇒ **CẢNH BÁO**
 *
 * Cùng lớp lỗi `ui_flow §3` đã ghi: *một danh sách rỗng vì API chết trông
 * giống hệt một hệ thống chưa mời ai* — và dự án đã vấp đúng nó một lần ở màn
 * Danh mục (`0035fa3`).
 *
 * ⚠️ Không tự khôi phục, không tự tạo gì. Chỉ TRẢ LỜI. Một hàm khôi phục tự
 * động ở đây sẽ chạy đúng vào lúc người ta chưa kịp nghĩ.
 */
export function trangThaiBanLui({ thuMuc = LUU_LOI() } = {}) {
  const ten = XUAT_LOI.map((x) => x.file)
  const co = existsSync(thuMuc)
    ? ten.filter((f) => existsSync(join(thuMuc, f)))
    : []
  const soTaiKhoan = dungLoiDb((db) =>
    db.prepare("SELECT count(*) AS n FROM nguoi_dung").get().n)

  if (co.length === ten.length) {
    return { co_file: true, thieu: [], so_tai_khoan: soTaiKhoan, canh_bao: "" }
  }
  // DB có người mà bản lùi thiếu ⇒ đang chạy KHÔNG CÓ backup.
  const canh_bao = soTaiKhoan > 0
    ? `KHÔNG CÓ BẢN LÙI cho ${soTaiKhoan} tài khoản đang tồn tại. ` +
      `Thiếu ${ten.length - co.length}/${ten.length} file ở ${thuMuc}. ` +
      `Mất ổ này là mất tài khoản — git KHÔNG phủ (FR-050 cách 2).`
    : `Chưa có bản lùi ở ${thuMuc} — và DB cũng chưa có tài khoản nào. ` +
      `Đây có thể là hệ thống mới, HOẶC một clone thiếu backup. ` +
      `Hai ca đó trông giống nhau; kiểm ổ backup trước khi mời người mới.`
  return {
    co_file: false,
    thieu: ten.filter((f) => !co.includes(f)),
    so_tai_khoan: soTaiKhoan,
    canh_bao,
  }
}

/* ═══ PHÂN QUYỀN HAI VAI — FR-051 · T08-16 ═════════════════════════════
 *
 * Ma trận chốt bởi chủ dự án 2026-09-02: chủ dự án ✅ cả bốn · đồng nghiệp ❌
 * cả bốn. Hai cột `duyet-bai` và `nap-nguon` KHÔNG ở đây — xem dưới.
 *
 * ⚠️ `duyet-bai` CỐ Ý VẮNG MẶT trong bảng này.
 *
 * `B-B1` (*"chỉ chủ dự án duyệt bài"*) phải ở **MÃ**, không ở bảng quyền —
 * `FR-051 §7a`. Một cờ tắt được `B-B1` là một cờ sẽ có ngày bị tắt, và ngày đó
 * không ai nhớ vì sao nó từng bật.
 *
 * Điều đó quan trọng hơn khi chỉ đạo *"phân quyền thành setting on/off sửa
 * được trên web"* (`FR-051 §7`) được thi công: lúc đó bảng này thành **dữ
 * liệu**, và mọi thứ trong nó thành **sửa được từ một form**. `duyet-bai` không
 * ở trong bảng nghĩa là nó **không** thành sửa-được.
 *
 * `nap-nguon` ở đây và CẢ HAI vai đều được — `M05-R1` lo phần *"dừng ở draft"*.
 * Quyền NẠP khác quyền DUYỆT, và trộn hai thứ là cách `B-B1` chết.
 */
export const QUYEN = {
  "sua-bai-nguoi-khac": ["chu"],
  "moi-nguoi-moi": ["chu"],
  "thu-hoi": ["chu"],
  "xem-audit": ["chu"],
  "nap-nguon": ["chu", "dong_nghiep"],
}

/**
 * ĐÚNG MỘT chỗ đọc `vai` để quyết định (`FR-051 §3c`, cùng hình dạng
 * `M14 AC-8.4` và `M18 AC-3.1`). Đếm được bằng grep.
 *
 * DENY MẶC ĐỊNH: `viec` không có trong `QUYEN` ⇒ `false`. Thêm một thao tác mới
 * mà quên khai quyền ⇒ nó **không chạy được**, chứ không phải **ai cũng chạy
 * được**. Đây là cả điểm của fail-closed, và là chiều ngược của
 * `CVE-2026-47713` (`user ? whereWithUser(user) : where({})` — thiếu danh tính
 * thì trả TẤT CẢ).
 */
export function duocLam(nguoi_dung_id, viec) {
  if (!nguoi_dung_id || !viec) return false
  const cho = QUYEN[viec]
  if (!cho) return false            // chưa khai ⇒ DENY
  const h = dungLoiDb((db) =>
    db.prepare(
      "SELECT vai FROM nguoi_dung WHERE id = ? AND trang_thai = 'hoat_dong'",
    ).get(nguoi_dung_id))
  if (!h) return false              // không có, hoặc đã thu hồi ⇒ DENY
  return cho.includes(h.vai)
}

/** Một hàng, đủ để màn admin hiển thị. Không trả gì ngoài cột đã khai. */
export function loiXemNguoiDung(id) {
  doi(id, "id")
  return dungLoiDb((db) =>
    db.prepare(
      "SELECT id, ten, vai, trang_thai, tao_luc FROM nguoi_dung WHERE id = ?",
    ).get(id) ?? null)
}

/** Cho cổng `Y2` — phải luôn là 0 sau khi DDL có NOT NULL. */
export function loiDemVaiNull() {
  return dungLoiDb((db) =>
    db.prepare("SELECT count(*) AS n FROM nguoi_dung WHERE vai IS NULL").get().n)
}
