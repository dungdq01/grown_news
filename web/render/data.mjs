/**
 * M03_web · SSR (FR-034/C1) — TẦNG DỮ LIỆU cho web/render/trang.mjs.
 *
 * Hai nguồn, MỘT hình dạng Ban (khớp emitter home-pages cũ):
 *   duLieuReal() — SELECT từ kb/_kho.sqlite qua HÀM khoDoc()/docDanhMucDb()
 *                  của web/api/dungchung.mjs. Import trực tiếp, KHÔNG self-HTTP:
 *                  cùng process thì một vòng request chỉ thêm chỗ hỏng.
 *   duLieuMock() — đọc kb-mock/ file-based (port docTuDia nguyên trạng): kho
 *                  mẫu KHÔNG nằm trong DB, nó là đồ xem giao diện khi kho rỗng.
 *
 * Ban = { slug, id, title, priority, credibility_max, origin, source_type,
 *         review_status, analyzed_at, one_liner, concepts, concepts_proposed,
 *         category, url_normalized, than } — trang.mjs chỉ biết hình dạng này,
 * không biết dữ liệu tới từ DB hay đĩa.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { khoDoc, docDanhMucDb, docLoaiNguon, LOAI, laSlug }
  from "../api/dungchung.mjs"

// Re-export cho server.mjs: route /:type/:slug cần enum đóng + phép thử slug,
// và lấy qua đây thì server không phải import M08 thêm một đường riêng.
export { LOAI, laSlug }

const RENDER = dirname(fileURLToPath(import.meta.url))
const WEB = join(RENDER, "..")
const GOC = join(WEB, "..")
const SEP = String.fromCharCode(92)

const duongKho = (ten) => join(GOC, ten)

/**
 * Doc mot truong MANG tu frontmatter da parse tho.
 *
 * Vi sao can ham rieng: parser cua docTuDia thu JSON.parse tung dong roi fallback
 * ve chuoi. YAML flow style hop le `[a, b]` KHONG phai JSON hop le (thieu ngoac
 * kep) nen no ngã va tra ve CHUOI "[a, b]". Chi `[]` va `["a","b"]` mới ra mang.
 *
 * Do that tren mau-dat-chuan.md:11 — `concepts: [walk-forward-validation,
 * data-leakage]` parse ra chuoi. Neu tin vao Array.isArray thi moi filter se
 * rong voi MOI file that, con sample thi chay dung => loi chi lo khi nap bai that.
 *
 * (fm từ DB là JSON thật nên mảng là mảng — nhánh chuỗi chỉ còn phục vụ mock.)
 */
function mang(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  if (typeof v !== "string") return []
  const s = v.trim()
  if (!s.startsWith("[") || !s.endsWith("]")) return []
  return s.slice(1, -1).split(",")
    .map((x) => x.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

/**
 * Doc THANG tu thu muc kho mock. Doc file la CHI DOC — M03 khong thuoc kb_writers.
 * (Port nguyên trạng từ emitter home-pages — chỉ còn phục vụ kb-mock/;
 * kho thật đi đường duLieuReal() → DB.)
 */
/**
 * `ho_so` + `media` — HAI truong FR-036, dung mot cach o CA HAI ham dung `Ban`.
 *
 * Viet mot lan roi goi hai cho, khong copy: hai ham dung `Ban` la ban song sinh
 * (`hai-ban-shape.test.js` canh tap khoa), va cach chac chan nhat de hai ban
 * KHONG lech la de chung goi cung mot hàm.
 *
 * `ho_so` VANG ⇒ `phan-tich`, khop `validate.py` va schema — khong ban ghi cu
 * nao phai sua.
 *
 * `media` VANG ⇒ `null`, khong `undefined` va khong `""`. Mot hinh dang ON DINH
 * la thu FE kiem duoc bang MOT phep thu; ba kieu rong khac nhau la ba nhanh o
 * phia FE. Va CHI nhan object: parser YAML tu che cua `docTuDia` doc duoc block
 * LIST (`- x`) nhung KHONG doc duoc block MAPPING, nen `media:` kieu block se ra
 * chuoi rong — tra `null` o do la noi that, khong phai che loi. Ban ghi trong
 * `kb-mock/` muon co media thi phai viet FLOW JSON (`media: {"sha256": …}`),
 * dang ma `JSON.parse` o parser nay doc duoc.
 */
function hoSoVaMedia(fm) {
  // FR-052 · `media` la MANG. Ban dau dong duoi CHU DONG chan mang
  // (`!Array.isArray(m) ? m : null`), nen doi schema ma quen no la `media`
  // thanh `null` IM LANG tren moi ban ghi render.
  const m = fm.media
  const hv = Array.isArray(m) ? m.filter((x) => x && typeof x === "object")
    : (m && typeof m === "object") ? [m] : []
  return {
    ho_so: String(fm.ho_so ?? "phan-tich"),
    media: hv.length ? hv : null,
    // FR-067 · `nguon` — TRUONG NHAN DIEN: ban chung cat nay sinh tu ban ghi
    // nao. Dat o DAY chu khong chep vao tung builder: ca `docTuDia` lan
    // `banTuDb` deu goi ham nay, nen mot cho khai la hai duong doc khop nhau.
    // Dung thu tu do chinh chu thich `articles.mjs:55` goi ten: bon builder
    // dung cung mot hinh dang, va thieu mot truong o MOT cho thi FE nhan
    // `undefined` tren dung duong ay ma khong loi nao no.
    // Vang ⇒ `[]`, KHONG `undefined`: mot hinh dang on dinh la thu FE kiem
    // duoc bang MOT phep thu.
    nguon: Array.isArray(fm.nguon) ? fm.nguon : [],
  }
}

function docTuDia(thuMuc, hong) {
  const ra = []
  const quet = (d) => {
    for (const t of readdirSync(d)) {
      const p = join(d, t)
      if (statSync(p).isDirectory()) { quet(p); continue }
      if (!t.endsWith(".md") || t.startsWith("_") || t.toLowerCase() === "readme.md") continue
      if (/\.v\d+\.md$/.test(t)) continue

      // File KHONG doc duoc thi GHI TEN LAI, khong bo qua im lang.
      //
      // Bug that: kb/docs/AIAgent-deploy-prototype.md khong co frontmatter.
      // `continue` o day lam no bien mat khoi MOI con so va MOI man — nguoi
      // dung tuong da nap xong, he thong coi nhu khong ton tai. validate.py
      // bat ngay ("Khong co frontmatter YAML") nhung web thi im.
      // Bo qua duoc thi phai NOI RA da bo qua cai gi.
      const m = readFileSync(p, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!m) {
        hong?.push(p.slice(thuMuc.length + 1).split(SEP).join("/"))
        continue
      }
      const fm = {}
      // Parse hai dang YAML, ca hai deu xuat hien THAT trong kho:
      //   flow  `concepts: [a, b]`   — skill source-distiller va kb-mock sinh
      //   block `concepts:` + `- a`  — 05_intake/gate.py sinh (yaml.dump macdinh)
      //
      // Truoc day chi doc dong mot: bai nap qua _inbox/ len web voi category va
      // concepts RONG, sidebar mat han tang chu de. Sample dung flow style nen
      // moi test xanh — loi chi lo khi nap bai that qua cong intake.
      const dongs = m[1].split(/\r?\n/)
      for (let i = 0; i < dongs.length; i++) {
        const kv = dongs[i].match(/^([a-z_]+):\s*(.*)$/)
        if (!kv) continue
        const [, khoa, gt] = kv
        if (gt.trim() === "") {
          // Khoa khong co gia tri cung dong ⇒ co the la block list phia duoi
          const ds = []
          while (i + 1 < dongs.length) {
            const con = dongs[i + 1].match(/^\s*-\s+(.*)$/)
            if (!con) break
            ds.push(con[1].trim().replace(/^["']|["']$/g, ""))
            i++
          }
          if (ds.length) { fm[khoa] = ds; continue }
        }
        try { fm[khoa] = JSON.parse(gt) } catch { fm[khoa] = gt.replace(/^"|"$/g, "") }
      }
      if (typeof fm.review_status !== "string") {
        hong?.push(p.slice(thuMuc.length + 1).split(SEP).join("/"))
        continue
      }

      const uv = Array.isArray(fm.skill_candidates) ? fm.skill_candidates : []
      const slug = p.slice(thuMuc.length + 1).split(SEP).join("/").replace(/\.md$/, "")
      ra.push({
        // Fallback tiêu đề phải KHỚP đường API (`articles.mjs`: `fm.title ??
        // r.slug`, slug TRẦN). `slug` ở đây CÓ tiền tố loại, nên dùng thẳng nó
        // đã in ra "article/thu-realtime" làm tiêu đề — vừa xấu, vừa làm
        // `dongBoThe` cũ (so chữ hiển thị) chèn thẻ trùng.
        slug, id: String(fm.id ?? ""),
        title: String(fm.title ?? slug.split("/").pop() ?? slug),
        priority: uv.reduce((mx, c) =>
          Math.max(mx, typeof c?.priority === "number" ? c.priority : 0), 0),
        credibility_max: String(fm.credibility_max ?? ""),
        origin: String(fm.origin ?? ""),
        source_type: String(fm.source_type ?? ""),
        review_status: String(fm.review_status),
        analyzed_at: String(fm.analyzed_at ?? ""),
        one_liner: String(fm.one_liner ?? ""),
        concepts: mang(fm.concepts),
        concepts_proposed: mang(fm.concepts_proposed),
        category: mang(fm.category),
        url_normalized: String(fm.url_normalized ?? ""),
        ...hoSoVaMedia(fm),
        // Than bai (sau `---`) — de cua so doc mo duoc NGAY tu chi muc.
        than: readFileSync(p, "utf8").slice(m[0].length).trim(),
      })
    }
  }
  quet(thuMuc)
  return ra
}

/**
 * Doc danh muc nhan tu <kho>/<ten>.yaml — CHỈ còn cho kb-mock/ (kho thật đọc
 * bảng concepts/categories qua docDanhMucDb). MOT ham cho CA HAI file: hai file
 * cung hinh dang, list cap 1 voi `- id:` + `label_vi:`, categories.yaml co
 * thêm `gom:`. Viet ban thu hai la nhan ban no.
 *
 * Khong dung thu vien YAML: chi can 3 khoa scalar o muc cap 1, va them mot phu
 * thuoc chi de doc 22 dong la khong tuong xung.
 */
function docDanhMucFile(kho, ten) {
  const f = join(duongKho(kho), ten)
  if (!existsSync(f)) return []
  const ra = []
  for (const dong of readFileSync(f, "utf8").split(/\r?\n/)) {
    const mId = dong.match(/^-\s+id:\s*(\S+)/)
    if (mId) { ra.push({ id: mId[1], label: "", gom: "" }); continue }
    if (!ra.length) continue
    const mLb = dong.match(/^\s+label_vi:\s*(.+)$/)
    if (mLb) { ra[ra.length - 1].label = mLb[1].trim(); continue }
    const mGom = dong.match(/^\s+gom:\s*(.+)$/)
    if (mGom) ra[ra.length - 1].gom = mGom[1].trim()
  }
  return ra
}

/**
 * FR-027k · TAP TRANG THAI doc tu ENUM CUA SCHEMA, khong liet ke tay.
 *
 * Bon lan lien tiep cung mot lop loi: code liet ke tay ba gia tri cua
 * `review_status` va bo sot `edited`. Nguon chan ly cua TAP nay la schema —
 * doc thang tu do thi them mot trang thai thu nam khong con lam bieu do lang
 * le thieu no. `bon-trang-thai.test.js` §4b canh chinh dieu nay.
 */
export const TRANG_THAI = (() => {
  const f = join(GOC, "core", "assets", "frontmatter.schema.json")
  if (!existsSync(f)) return ["approved", "draft", "edited", "rejected"]
  try {
    const sc = JSON.parse(readFileSync(f, "utf8"))
    const e = sc?.properties?.review_status?.enum
    return Array.isArray(e) && e.length ? e.map(String) : ["approved", "draft", "edited", "rejected"]
  } catch { return ["approved", "draft", "edited", "rejected"] }
})()

/**
 * CHI MUC MO CUA SO — gop theo url_normalized, gom MOI trang thai.
 * (Port nguyên khối từ emitter — dùng chung cho trang.mjs lẫn open-index.json
 * của assets.mjs, để hai nơi không bao giờ đánh số lệch nhau.)
 */
export function tinhChiMuc(tatCa) {
  // Gom tu `tatCa`, KHONG tu [...appr, ...draft, ...rej]: bo ba do thieu
  // `edited` — trang thai thu tu cua M02 §2.2. Ban `edited` roi khoi chi muc
  // => iCua() tra -1 => the khong co data-open => bam khong mo duoc gi.
  // Liet ke trang thai bang tay la dem thu cong mot enum se dai ra.
  const nhomBai = new Map()
  for (const b of tatCa) {
    const khoa = b.url_normalized || b.slug
    const co = nhomBai.get(khoa)
    if (co) {
      co.bans.push(b)
      if (b.priority > co.priority) co.priority = b.priority
    } else {
      nhomBai.set(khoa, { url_normalized: khoa, priority: b.priority, bans: [b] })
    }
  }
  return [...nhomBai.values()].sort((a, b) =>
    b.priority - a.priority ||
    (b.bans[0]?.analyzed_at ?? "").localeCompare(a.bans[0]?.analyzed_at ?? ""))
}

/** Ban từ một hàng khoDoc() — đối chiếu từng trường với docTuDia ở trên. */
function banTuDb(r) {
  const fm = r.fm ?? {}
  const uv = Array.isArray(fm.skill_candidates) ? fm.skill_candidates : []
  return {
    // slug CÓ tiền tố loại — khớp docTuDia (slug là đường tương đối bỏ .md).
    slug: `${r.type}/${r.slug}`, id: String(fm.id ?? ""),
    title: String(fm.title ?? r.slug),
    priority: uv.reduce((mx, c) =>
      Math.max(mx, typeof c?.priority === "number" ? c.priority : 0), 0),
    credibility_max: String(fm.credibility_max ?? ""),
    origin: String(fm.origin ?? ""),
    source_type: String(fm.source_type ?? ""),
    review_status: String(fm.review_status ?? ""),
    analyzed_at: String(fm.analyzed_at ?? ""),
    one_liner: String(fm.one_liner ?? ""),
    concepts: mang(fm.concepts),
    concepts_proposed: mang(fm.concepts_proposed),
    category: mang(fm.category),
    url_normalized: String(fm.url_normalized ?? ""),
    ...hoSoVaMedia(fm),
    than: String(r.than ?? ""),
  }
}

/** Danh mục DB → hình dạng MucDanhMuc {id, label, gom} mà template dùng. */
const mucTuDb = (r) => ({ id: r.id, label: r.label_vi ?? "", gom: r.gom ?? "" })

/**
 * Dữ liệu bản REAL — SELECT từ DB, mỗi lần gọi một ảnh tươi (kho nhỏ, đọc là
 * micro-giây; cache là thêm một nguồn chân lý thứ hai để lệch).
 * `hong: []` — DB không có khái niệm "file không đọc được": mọi hàng đều đã
 * qua validate lúc ghi. Dải cảnh báo giữ chỗ cho mock (kho file vẫn hỏng được).
 */
export function duLieuReal() {
  return {
    bans: khoDoc().map(banTuDb),
    concepts: docDanhMucDb("concepts").map(mucTuDb),
    categories: docDanhMucDb("categories").map(mucTuDb),
    // WO-019 · bang loai nguon di CUNG du lieu render. Khong mang no thi
    // panel buoc phai suy lai tu `media-mime.json`, va moi sua cua nguoi dung
    // trong DB khong bao gio hien ra — im lang.
    loai_nguon: docLoaiNguon(),
    hong: [],
    mock: false,
  }
}

/** Dữ liệu bản MOCK — đọc kb-mock/ file-based, y đường emitter cũ. */
export function duLieuMock() {
  const goc = duongKho("kb-mock")
  const hong = []
  return {
    bans: existsSync(goc) ? docTuDia(goc, hong) : [],
    concepts: docDanhMucFile("kb-mock", "concepts.yaml"),
    categories: docDanhMucFile("kb-mock", "categories.yaml"),
    loai_nguon: [],
    hong,
    mock: true,
  }
}
