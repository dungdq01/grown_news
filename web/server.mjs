#!/usr/bin/env node
/**
 * Server local — FR-010 (nạp `_inbox/`) + FR-011 (bàn biên tập, router M08).
 *
 * File này thuộc M03: entry duy nhất (bind 127.0.0.1), serve site tĩnh, và
 * `/api/inbox`. Đường CRUD vào kho sống ở `web/api/**` (M08_api) — server chỉ
 * mount router, không cầm logic ghi nào của M08.
 *
 * Vì sao `/api/inbox` không mở đường tới approved (luận cứ FR-011 §"Luận cứ
 * FR-010 phải viết lại" — bản cũ dựa schema khoá const draft, FR-012 đã tháo
 * đúng cái khoá đó vì nó khoá SAI CHỖ):
 *   1 gate.py hardcode review_status = draft khi nạp (test -k draft_external)
 *   2 approve đòi 3 trường M1 do NGƯỜI khai — code M08 không có default (M08-R3)
 *   3 đổi trạng thái CHỈ qua PATCH /status — cửa riêng, bảng chuyển cứng
 *
 * `_inbox/` KHÔNG thuộc kho: nó là thư mục trung chuyển của M05, xoá sạch
 * không mất gì.
 *
 * Năm chặn bù (FR-010 §"Chặn bù"), mỗi cái chặn một đường tấn công cụ thể:
 *   1 bind 127.0.0.1        — không truy cập từ máy khác
 *   2 chỉ .md, trần 1 MB     — word_count trần cứng 1800 từ, 1 MB đã rất rộng
 *   3 tên file chuẩn hoá     — chặn path traversal `../../kb/x.md`
 *   4 đích ghi CỐ ĐỊNH       — không nhận tham số đường dẫn từ client
 *   5 gọi gate.py làm tiến trình con, KHÔNG viết lại logic cổng bằng JS
 *     (M05-R3: hai bản kiểm sẽ lệch nhau im lặng)
 */
/*
 * NẠP `.env` TRƯỚC KHI BẤT KỲ MODULE NÀO ĐỌC `process.env`.
 *
 * Đo được 2026-09-06: `POST /api/job` trả **403** cho mọi lời gọi, và console
 * của chủ dự án đầy dòng ấy. Gốc: `tho-cua.mjs` gửi `X-Khoa-Loi` lấy từ
 * `process.env.CHUNGCAT_KHOA_LOI`, mà Node KHÔNG tự đọc `.env` — nên biến ấy
 * là `undefined`, cửa thợ so `bool(mong) && header === mong` và chặn.
 *
 * Phía Python đã nạp `.env` từ lâu (`moi_truong.nap()` trong `api.py`), nên
 * hai bên lệch nhau đúng ở chỗ này: một bên đọc file, một bên không.
 *
 * `loadEnvFile` chỉ điền biến CHƯA CÓ, nên biến đặt sẵn ở shell vẫn thắng —
 * cùng ngữ nghĩa với `moi_truong.nap()`. Thiếu `.env` KHÔNG phải lỗi: máy CI
 * không có file ấy và vẫn phải chạy được.
 */
// Đường tính theo VỊ TRÍ MODULE, không theo CWD: `loadEnvFile()` không tham
// số lấy `./.env` theo thư mục làm việc, mà server chạy trong `web/` còn
// `.env` nằm ở gốc repo — đo được: `ENOENT: open '.env'`.
try { process.loadEnvFile(new URL("../.env", import.meta.url)) }
catch { /* không có .env — env của shell là đủ (CI) */ }

import { spawn } from "node:child_process"
import { xuLyApi } from "./api/router.mjs"
import { envCon } from "./api/dungchung.mjs"   // ALLOWLIST env cho tien trinh con
import { createServer } from "node:http"

import { doThoiGian, ghiPid } from "./nhatky.mjs"
import {
  createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync,
  writeFileSync,
} from "node:fs"
import { dirname, extname, join, normalize, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const WEB = dirname(fileURLToPath(import.meta.url))
const GOC = join(WEB, "..")
// INBOX_DIR: cùng khuôn env override của SITE/API_PORT/PYTHON và của
// KB_DIR/RECYCLE_DIR ở dungchung.mjs. Thiếu cờ này thì `POST /api/inbox` KHÔNG
// TEST ĐƯỢC — mọi phép kiểm sẽ ghi vào `_inbox/` thật rồi chạy gate lên `kb/`
// thật. Đó chính là lý do luồng nạp là đường ghi duy nhất không có test hành vi
// nào, chỉ có regex tĩnh trong no-write-path.test.js.
const INBOX = process.env.INBOX_DIR ?? join(GOC, "_inbox")
const SITE = process.env.SITE ?? join(WEB, "site")
const CONG = Number(process.env.API_PORT ?? 8787)

const TRAN = 1024 * 1024        // 1 MB
const PY = process.env.PYTHON ?? "python"

/**
 * Chuẩn hoá tên file về `[a-z0-9-]+.md`.
 *
 * Đây là chặn path traversal, không phải chuyện thẩm mỹ: thiếu nó thì một tên
 * như `../../kb/paper/x.md` ghi thẳng vào nguồn chân lý, bỏ qua cả gate.py lẫn
 * cổng người. Bỏ mọi ký tự không thuộc whitelist thay vì tìm-và-chặn `..` —
 * whitelist không có đường lách.
 */
function tenAnToan(ten) {
  // WO-057 · GIAI MA TRUOC KHI SLUG. Header HTTP chi cho ISO-8859-1 nen FE
  // percent-encode `x-ten-file` (cung khuon `x-bo-sung` ngay duoi day da dung).
  // Khong giai ma thi `Thay on.md` toi day o dang `Th%E1%BA%A7y...` va slug ra
  // `th-e1-ba-a7y-...` — mot ten file rac, va khong ai bao.
  // `try/catch` bat buoc: mot `%` le lam `decodeURIComponent` nem `URIError`.
  let tho
  try { tho = decodeURIComponent(String(ten ?? "")) } catch { tho = String(ten ?? "") }
  const goc = tho.normalize("NFKD")
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
  return (goc || "khong-ten") + ".md"
}

const json = (res, ma, o) => {
  const b = JSON.stringify(o)
  res.writeHead(ma, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(b),
  })
  res.end(b)
}

/** Đọc body với trần cứng — hủy kết nối khi vượt, không đọc tiếp vào RAM. */
function docBody(req) {
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

/** Chạy gate.py và trả lại nguyên văn output — cổng nói gì thì hiện đúng thế. */
/**
 * Bài VỪA NỘP có vào kho không — đọc từ output gate, không từ exit code.
 *
 * gate.py in mỗi file một dòng `  vào kho  <ten>` hoặc `  TRẢ LẠI  <ten>`
 * (`gate.py:main`). Exit code là kết luận CẢ LÔ nên không trả lời được câu
 * "bài của tôi thế nào".
 *
 * Không thấy dòng nào cho file này ⇒ `false`. Fail closed: thà nói "chưa vào
 * kho" khi thực ra đã vào, còn hơn nói đã vào khi chưa — người sẽ đi kiểm.
 */
function ketCuaFile(chu, ten) {
  for (const d of String(chu ?? "").split(/\r?\n/)) {
    if (!d.includes(ten)) continue
    if (d.includes("vào kho")) return true
    if (d.includes("TRẢ LẠI")) return false
  }
  return false
}

function chayGate() {
  return new Promise((ok) => {
    const p = spawn(PY, [join(GOC, "05_intake", "gate.py")], {
      cwd: GOC,
      env: envCon(),   // ALLOWLIST — xem dungchung.mjs#envCon
    })
    let ra = "", er = ""
    p.stdout.on("data", (d) => { ra += d })
    p.stderr.on("data", (d) => { er += d })
    p.on("error", (e) => ok({ ma: -1, ra: "", er: String(e.message) }))
    p.on("close", (ma) => ok({ ma, ra, er }))
  })
}

// ── SSR (FR-034/C2) — render tu DB moi request, thay bundle Quartz ──────────
// Kill-switch: GN_SSR=0 bo qua TOAN BO khoi nay, roi ve serve site tinh nhu cu
// — diem rollback cua giai doan C (toi C5). Mac dinh SSR BAT.
const SSR_BAT = process.env.GN_SSR !== "0"

// Import DONG va cache: GN_SSR=0 thi khong nap module render nao — mot loi
// trong web/render/ khong duoc phep lam duong rollback cung chet theo.
let _ssr = null
function napSsr() {
  _ssr ??= Promise.all([
    import("./render/trang.mjs"),
    import("./render/data.mjs"),
    import("./render/assets.mjs"),
  ]).then(([t, d, a]) => ({ ...t, ...d, ...a }))
  return _ssr
}

const MIME_SSR = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
}

/*
 * BANG DUONG SSR — DAN XUAT tu `core/assets/man-hinh.json` (FR-038/C5).
 *
 * Truoc do go tay o day, va phai khop bang tay voi `MAN` (trang.mjs) + `DUONG`
 * (multiwindow.inline.ts) + `VIEWS` (test/_render.mjs). Bon ban go tay cho cung
 * mot su that la cho DA TROI: slug URL `khai-niem` ≠ id shell `concepts` ≠ tieu
 * de "Danh mục".
 *
 * `cho-duyet` KHONG o trong bang khai va do la co y: no khong phai mot MAN — no
 * la trang chuyen huong, khong co shell, khong co tab, khong co khoi `.view`.
 * Khai no o bang man la de bang man noi doi ve chinh no.
 */
const VIEW_SSR = Object.fromEntries([
  ...JSON.parse(readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8"))
    .man.map((m) => [m.path, m.ten]),
  ["/cho-duyet/", "cho-duyet"],
])

/**
 * Cac route SSR. Tra true khi da tra loi; false thi roi xuong nhanh tinh —
 * duong nao khong thuoc SSR van di loi cu, khong doi hanh vi.
 * Loi render nem ra ngoai cho catch cua createServer lo (500, khong chet process).
 */
async function xuLySsr(req, res) {
  const duongGoc = decodeURIComponent((req.url ?? "/").split("?")[0])

  const gui = (loai, than) => {
    res.writeHead(200, { "content-type": loai })
    res.end(than)
    return true
  }

  // Anh nen — stream tu public/ (thay backdrop-assets copy ra output).
  // Chi o goc: index.json tro URL tuyet doi /static/bg/ nen ban mock cung ve day.
  if (duongGoc === "/static/bg/index.json") {
    const m = await napSsr()
    return gui("application/json", m.anhNen().index)
  }
  /*
   * ICON — stream tu `public/icon/`, cung khuon `/static/bg/` ngay duoi.
   *
   * Vi sao `public/` GOC repo chu khong `web/public/`: ca `web/site/` lan
   * `web/public/` deu trong `.gitignore` (output build), nen mot file dat o do
   * KHONG bao gio duoc commit — no chay tren may toi va bien mat o may khac.
   * `public/` goc la cho anh duoc theo doi that (11 file dang trong git), va
   * dung la cho luat thuong truc cua chu du an noi: *"chi anh trong public/**
   * duoc push len github"*.
   *
   * Ten file la MOT doan duong: chan `..` va `/` de mot URL khong doc duoc
   * file ngoai thu muc icon.
   */
  if (duongGoc.startsWith("/i/")) {
    const ten = duongGoc.slice("/i/".length)
    if (!/^[a-z0-9_-]+\.svg$/.test(ten)) return false
    const f = join(GOC, "public", "icon", ten)
    if (!existsSync(f)) return false
    /*
     * WO-076 · ETag + `max-age` NGẮN. Bản trước gửi `max-age=86400` TRẦN —
     * không ETag, không `Last-Modified`, và URL không mang version. Hệ quả:
     * thay một icon thì người đã mở trang KHÔNG THẤY nó trong 24 giờ, và
     * không có dấu hiệu nào cho biết vì sao. Đo được 2026-09-09 khi đổi
     * `douyin.svg`: server trả file mới, `fetch` thấy file mới, mà mask trên
     * màn vẫn là glyph cũ.
     *
     * ETag theo `mtime`+`size` là đủ: một `.svg` sửa xong thì cả hai đổi.
     * `max-age=300` giữ phần lớn lợi ích của cache, còn 304 cho một file vài
     * KB thì rẻ hơn nhiều so với một icon sai đứng nguyên một ngày.
     */
    const st = statSync(f)
    const etag = `"${st.size.toString(36)}-${Math.trunc(st.mtimeMs).toString(36)}"`
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { etag, "cache-control": "public, max-age=300" })
      res.end()
      return true
    }
    res.writeHead(200, {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=300",
      etag,
    })
    createReadStream(f).pipe(res)
    return true
  }
  if (duongGoc.startsWith("/static/bg/")) {
    const m = await napSsr()
    const f = m.anhNen().file.get(duongGoc.slice("/static/bg/".length))
    if (!f || !existsSync(f)) return false
    res.writeHead(200, {
      "content-type": MIME_SSR[extname(f).toLowerCase()] ?? "application/octet-stream",
    })
    createReadStream(f).pipe(res)
    return true
  }

  // Template loi nap 02 — phat NGUYEN VAN file nguon, khong chep noi dung:
  // mot ban sao thu hai se lech khoi schema ngay lan dau schema doi.
  if (duongGoc === "/mau-nap-nguon.md") {
    const f = join(GOC, "core", "skill-src", "mau-dat-chuan.md")
    if (!existsSync(f)) return false
    res.writeHead(200, { "content-type": "text/markdown; charset=utf-8" })
    createReadStream(f).pipe(res)
    return true
  }

  // Hai ban: "" = real (doc DB) va "/mock" = doc kho mau file-based.
  const laMock = duongGoc.startsWith("/mock/")
  const duong = laMock ? duongGoc.slice("/mock".length) : duongGoc

  if (duong === "/gn.css" || duong === "/gn.js") {
    const m = await napSsr()
    return duong === "/gn.css"
      ? gui("text/css; charset=utf-8", m.gnCss())
      : gui("text/javascript; charset=utf-8", m.gnJs())
  }

  // T03-102 · CHUNK theo man: `/gn-<ten>.js`. Ten lay tu duong, va `gnChunk`
  // tra `null` cho ten khong khai — nen mot duong bia ra tra 404 o nhanh duoi,
  // khong tra mot file rong (mot file rong lam FE im lang thay vi bao loi).
  const chunk = /^\/gn-([a-z0-9-]+)\.js$/.exec(duong)
  if (chunk) {
    const m = await napSsr()
    const ma = m.gnChunk(chunk[1])
    if (ma) return gui("text/javascript; charset=utf-8", ma)
  }

  if (duong === "/static/open-index.json") {
    const m = await napSsr()
    return gui("application/json",
      m.openIndexJson(laMock ? m.duLieuMock() : m.duLieuReal()))
  }

  const view = VIEW_SSR[duong]
  if (view) {
    const m = await napSsr()
    const data = laMock ? m.duLieuMock() : m.duLieuReal()
    return gui("text/html; charset=utf-8", m.renderTrang(view, data))
  }

  const trangN = /^\/tat-ca\/(\d+)\/$/.exec(duong)
  if (trangN) {
    const m = await napSsr()
    const data = laMock ? m.duLieuMock() : m.duLieuReal()
    return gui("text/html; charset=utf-8",
      m.renderTrang("tat-ca-trang-n", data, Number(trangN[1])))
  }

  // Deep-link /:type/:slug — tra shell "Tat ca" ban real kem marker
  // `data-mo-bai` tren <body> de FE mo cua so doc (C4 lo phia FE).
  // type nam trong enum DONG + slug qua laSlug ⇒ path traversal chan bang
  // CAU TRUC, khong phai tim-va-chan.
  const baiLe = /^\/([a-z]+)\/([a-z0-9-]+)\/?$/.exec(duong)
  if (baiLe && !laMock) {
    const m = await napSsr()
    const [, type, slug] = baiLe
    if (!m.LOAI.includes(type) || !m.laSlug(slug)) return false
    const html = m.renderTrang("tat-ca", m.duLieuReal())
      .replace("<body>", `<body data-mo-bai="${type}/${slug}">`)
    return gui("text/html; charset=utf-8", html)
  }

  return false
}

/*
 * NHẬT KÝ VẬN HÀNH bọc TOÀN BỘ handler (chỉ đạo 2026-09-05).
 *
 * Bọc ở NGOÀI CÙNG, không ở từng nhánh: một nhánh mới thêm sau này tự có mặt
 * trong số liệu. Bọc từng nhánh thì nhánh mới nào cũng là một lỗ im lặng — và
 * lỗ đó chỉ lộ ra lúc đang tìm lỗi, đúng lúc không ai muốn phát hiện thêm việc.
 *
 * `han_ms = 5000`: SSR một trang 120 bản ghi đo được ~200ms, lời gọi xuyên
 * sang THỢ chậm nhất ~1.5s. 5 giây là *"chắc chắn có gì sai"*, không phải
 * *"hơi chậm"*. Nó KHÔNG cưỡng chế gì — chỉ để nhật ký nói ra.
 */
const server = createServer(doThoiGian("api-loi", 5000, async (req, res) => {
  // Cùng origin — trang do chính build này phát ra. Không mở CORS: không có
  // bên thứ hai nào cần gọi (RUNNING.md §6).
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return }

  try {
    if (req.method === "GET" && req.url === "/api/inbox") {
      const ds = existsSync(INBOX)
        ? readdirSync(INBOX).filter((f) => f.toLowerCase().endsWith(".md"))
        : []
      return json(res, 200, { files: ds })
    }

/*
 * GHEP PHAN BO SUNG vao file .md nop len — FILE THANG.
 *
 * Template `mau-nap-nguon.md` DA khai `one_liner` · `concepts` · `category`,
 * nen ba o tren man KHONG phai nguon thu hai: chung chi dien khoa mà file
 * THIEU. Ghi de khoa file da khai la lam mat thu nguoi dung viet trong file,
 * va ho khong biet vi sao.
 *
 * KHONG dung thu vien YAML: cau hoi duy nhat la "khoa nay co o cot 0 cua
 * frontmatter khong". Mot parser day du o day la mot phu thuoc moi cho mot
 * cau hoi co/khong.
 */
function ghepBoSung(than, tho) {
  if (!tho) return than
  let bs
  try { bs = JSON.parse(decodeURIComponent(tho)) } catch { return than }
  if (!bs || typeof bs !== "object") return than

  const chu = than.toString("utf8")
  // Frontmatter la doan giua `---` dau va `---` dong dau tien.
  const dong = chu.indexOf(NL_FM + "---", 3)
  if (dong < 0) return than
  const fm = chu.slice(0, dong)
  const con = chu.slice(dong)

  const them = []
  const vang = (k) => !new RegExp("^" + k + "\\s*:", "m").test(fm)
  for (const k of ["category", "concepts"]) {
    const v = bs[k]
    if (Array.isArray(v) && v.length && vang(k)) {
      them.push(k + ": [" + v.map((x) => String(x)).join(", ") + "]")
    }
  }
  let ra = them.length ? fm + NL_FM + them.join(NL_FM) + con : chu

  // THAN BAI: chi dien khi file khong co than nao (chi khoang trang).
  const iSau = ra.indexOf(NL_FM + "---", 3)
  const sau = iSau < 0 ? "" : ra.slice(iSau + NL_FM.length + 3)
  const moTa = String(bs.than ?? "").trim()
  if (moTa && !sau.trim()) ra = ra.trimEnd() + NL_FM + NL_FM + moTa + NL_FM
  return Buffer.from(ra, "utf8")
}
const NL_FM = "\n"
    if (req.method === "POST" && req.url === "/api/inbox") {
      const than = await docBody(req)
      const ten = tenAnToan(req.headers["x-ten-file"])
      if (!than.length) return json(res, 400, { loi: "File rỗng." })
      if (!than.toString("utf8", 0, 4).startsWith("---")) {
        return json(res, 400, {
          loi: "Không có frontmatter YAML — file phải bắt đầu bằng `---`.",
          cach_sua: "Tải template ở mục 02, điền rồi nộp lại.",
        })
      }

      mkdirSync(INBOX, { recursive: true })
      const dich = join(INBOX, ten)
      // KHÔNG ghi đè: trùng tên thường là nộp lại lần hai, và ghi đè thì bản
      // trước biến mất không dấu vết.
      if (existsSync(dich)) {
        return json(res, 409, {
          loi: `\`_inbox/${ten}\` đã tồn tại.`,
          cach_sua: "Chạy gate cho bản cũ trước, hoặc đổi tên file.",
        })
      }
      // Ghep TRUOC khi ghi: gate doc file tu `_inbox/`, nen mot ban ghi
      // thieu nhan phai duoc bo sung truoc do, khong phai sau.
      writeFileSync(dich, ghepBoSung(than, req.headers["x-bo-sung"]))

      const kq = await chayGate()
      const chu = kq.ra || kq.er
      return json(res, 200, {
        ten,
        gate_ma: kq.ma,
        gate_ra: chu,
        // ĐỌC KẾT QUẢ CỦA ĐÚNG FILE VỪA NỘP, không đọc exit code.
        //
        // Bug thật: `vao_kho: kq.ma === 0` lấy kết luận của CẢ LÔ. gate.py xử lý
        // mọi file trong `_inbox/`, nên một bản cũ nào đó còn nằm đó và trượt là
        // đủ làm exit != 0 — và người dùng thấy "chưa vào kho" cho bài của mình
        // dù nó vào kho thành công. Đo được bằng test: dòng "vào kho bai-dat.md"
        // xuất hiện trong output trong khi `gate_ma = 1`.
        vao_kho: ketCuaFile(chu, ten),
      })
    }

    // ── Bàn biên tập M08 (FR-011) — mount TRƯỚC serve tĩnh ─────────────────
    // Router là hàm thuần: khớp thì xử lý, không thì trả false và rơi xuống
    // nhánh tĩnh. Logic ghi + validate sống ở web/api/, không ở đây.
    if (await xuLyApi(req, res)) return

    // ── SSR (FR-034/C2) — SAU api, TRƯỚC nhánh tĩnh ───────────────────────
    // Không khớp route SSR nào thì rơi xuống nhánh tĩnh như cũ.
    if (SSR_BAT && req.method === "GET" && await xuLySsr(req, res)) return

    // ── Phục vụ site tĩnh trên CÙNG cổng ──────────────────────────────────
    // Vì sao không để Quartz serve lo: hai cổng thì FE phải gọi API bằng URL
    // tuyệt đối có host, và test no-write-path canh literal ngay sau `fetch(`
    // — ghép host từ biến làm nó không đọc được đích. Một cổng ⇒ FE gọi
    // `/api/inbox` tương đối, cổng còn răng.
    if (req.method === "GET") {
      // normalize + chặn `..` TRƯỚC khi ghép: cùng lý do như tenAnToan.
      let duong = decodeURIComponent((req.url ?? "/").split("?")[0])
      if (duong.includes("..")) return json(res, 400, { loi: "Đường không hợp lệ." })
      if (duong.endsWith("/")) duong += "index.html"
      // resolve cả hai bên rồi so: SITE có thể tới từ env dùng `/` trong khi
      // join() trả `\` trên Windows, và so chuỗi thô thì mọi đường đều "ngoài
      // phạm vi". Đây là chặn thoát thư mục, phải so trên đường đã chuẩn hoá.
      const f = resolve(SITE, "." + normalize(duong))
      if (!f.startsWith(resolve(SITE))) {
        return json(res, 400, { loi: "Ngoài phạm vi." })
      }
      if (existsSync(f) && statSync(f).isFile()) {
        const MIME = {
          ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
          ".js": "text/javascript; charset=utf-8", ".json": "application/json",
          ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml",
          ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
          ".webp": "image/webp", ".xml": "application/xml",
        }
        res.writeHead(200, {
          "content-type": MIME[extname(f).toLowerCase()] ?? "application/octet-stream",
        })
        createReadStream(f).pipe(res)
        return
      }
    }

    json(res, 404, { loi: "Không có đường này." })
  } catch (e) {
    if (String(e.message) === "qua-tran") {
      return json(res, 413, { loi: `File vượt trần ${TRAN / 1024} KB.` })
    }
    json(res, 500, { loi: String(e.message).slice(0, 200) })
  }
}))

/*
 * CHỈ LOOPBACK — không 0.0.0.0. BRD B-D3 + security_baseline §4: bản phân tích
 * có thể chứa nguồn nội bộ, nên không mở ra mạng.
 *
 * WO-033 · nghe CẢ `::1` nữa. Đo được: chỉ nghe IPv4 thì mở `localhost` trên
 * Windows tốn ~205 ms MỖI kết nối — trình duyệt phân giải `::1` trước, bị từ
 * chối, rồi chờ mới thử lại IPv4:
 *
 *     localhost:8787    connect 207 ms   ttfb 215 ms
 *     127.0.0.1:8787    connect   1 ms   ttfb   8 ms
 *
 * `::1` cũng là loopback, nên ràng buộc an ninh KHÔNG đổi. Listener thứ hai
 * dùng chung một handler; lỗi `EADDRINUSE`/`EAFNOSUPPORT` thì BỎ QUA — máy
 * không có IPv6 vẫn phải chạy được, chỉ là mất phần nhanh thêm.
 */
import { createServer as taoServer2 } from "node:http"
const server6 = taoServer2((req, res) => server.emit("request", req, res))
server6.on("error", () => { /* không IPv6 thì thôi, IPv4 vẫn phục vụ */ })
server6.listen(CONG, "::1")

ghiPid("api-loi")
server.listen(CONG, "127.0.0.1", () => {
  console.log(`địa chỉ  : http://127.0.0.1:${CONG}`)
  console.log(`site     : ${SITE}${existsSync(SITE) ? "" : "   ← CHƯA CÓ, chạy `npm run build`"}`)
  console.log(`ghi vào  : ${INBOX}`)
  // Không in đường dẫn kho ở đây: test no-write-path canh mọi lần nhắc kho
  // ngoài comment, và một dòng log vô hại làm nó không phân biệt được với
  // một đường ghi thật. Nghiêm hơn thì dễ tin hơn.
  console.log(`ghi kho  : CHỈ qua web/api (M08, FR-011) — mọi ghi qua validate trước`)
})
