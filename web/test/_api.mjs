#!/usr/bin/env node
/**
 * Đồ dùng chung cho 4 test api-*.test.js (FR-011).
 *
 * Kho tạm ở os.tmpdir() — KHÔNG test nào đụng kb/, _recycle/, _inbox/ thật
 * (cùng lý _seed.mjs: thư mục trong repo bị gitignore/quartz nuốt, và kho thật
 * là thứ M1 đo). Server spawn làm tiến trình con với env override
 * KB_DIR/RECYCLE_DIR/API_PORT — đúng khuôn SITE/PYTHON của FR-010.
 *
 * Bản ghi seed viết TAY cho qua đủ 9 cổng validate — contract v4 có 7 bản
 * approved thiếu 3 trường M1 (ra đời trước FR-001) nên không seed thẳng được.
 */
import { spawn, spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { thanBaiKhung } from "./_khung.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
export const GOC = join(TEST, "..", "..")

/**
 * Thân bài từ KHUNG KHAI — qua cổng mục/mục con/locator/tinh túy.
 *
 * `mo` đi vào §1 (Overview). Bản trước gõ cứng 9 mục ở đây với một bộ tên khác
 * bộ tên trong form; cả hai qua cổng vì cổng chỉ ép SỐ mục.
 */
export function thanBai(mo = "Nội dung thử.") {
  /*
   * Mục 3–5 phải NẶNG hơn mục 1+2, vì `tran_dan_nhap` (25%) đo đúng tỷ lệ đó.
   *
   * Bản trước để mọi mục nội dung là `—` và vẫn qua, nhưng chỉ nhờ 5 dòng
   * bullet của tinh túy độn thêm ~30 từ. WO-038 bỏ chúng ⇒ tỷ lệ vọt lên 36%
   * và cổng đỏ — cổng ĐÚNG, fixture mới là thứ suy biến: một bài mà phần thân
   * rỗng thì phần dẫn nhập chiếm hết là chuyện đương nhiên.
   */
  return thanBaiKhung({
    "1": mo,
    "3.1": "Đầu vào là một bản ghi nguồn đã tải về và một khung phân tích.",
    "3.2": "Chi tiết vận hành thật của cơ chế này [nguon.py:10-40]",
    "3.3": "Đầu ra là bản phân tích năm mục, mỗi mục có địa chỉ [nguon.md:3-9]",
    "3.4": "Điều rút ra: khung cố định làm phần so sánh rẻ đi [nguon.md:1-2]",
    "4": "Dùng khi cần đối chiếu nhiều nguồn cùng một chủ đề [nguon.md:1-2]",
    "5": "Rủi ro: khung quá chặt thì nguồn lạ không lọt vào được.",
  })
}

/** Một bản ghi hợp lệ. Ghi đè trường qua `them`. */
export function banGhi({ id, slug, type = "article", status = "draft",
                         origin = "manual", them = {}, mo } = {}) {
  const fm = {
    id, slug, source_type: type,
    url: `https://example.com/${slug}`,
    protocol_version: "2.0",
    analyzed_at: "2026-08-19",
    one_liner: `Bản thử ${slug}`,
    credibility_max: "plausible",
    review_status: status,
    origin,
    conformance: "B",
    concepts: ["idempotency"],
    ...them,
  }
  const yamlDong = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n")
  return `---\n${yamlDong}\n---\n\n${thanBai(mo)}`
}

/*
 * ═══ DANH MỤC CỦA FIXTURE — tự sở hữu, không đi vay của người dùng ══════════
 *
 * FR-031 xoá sạch danh mục thật theo yêu cầu người dùng, và ngay lập tức 12 phép
 * kiểm api-* đỏ: "POST hợp lệ ⇒ 422" (bản ghi seed trỏ `idempotency` không còn),
 * "schema tạm khởi đầu 6 chủ đề — được 0", "aliases của mục CŨ không bị mất"…
 *
 * Không cái nào tìm ra bug. Chúng chỉ mất thứ để đo, vì fixture đang MƯỢN danh
 * mục của người dùng. Kho thật rỗng là trạng thái HỢP LỆ — nó không được làm bộ
 * test mù.
 *
 * `aliases` viết FLOW style `[a, b]` đúng như file nguồn: `danh-muc-them` canh
 * rằng sửa/xoá KHÔNG làm nó nở thành block list.
 */
export const CPT_FX = [
  ["idempotency", "Bất biến khi gọi lại", ["idempotent-write"]],
  ["walk-forward-validation", "Kiểm định tiến dần", ["rolling-origin", "time-series-cv"]],
  ["staging-table-pattern", "Bảng trung chuyển", []],
  ["eventual-consistency", "Nhất quán sau cùng", []],
  ["circuit-breaker", "Ngắt mạch", ["breaker"]],
  ["backpressure", "Đẩy lùi áp lực", []],
]

/*
 * CHỦ ĐỀ chỉ dùng được khi caller CŨNG dựng schema tạm.
 *
 * `check_danh_muc.py` so `categories.yaml` với `enum category` trong schema, và
 * `khoVaSchemaLech()` chặn nếu kho tạm đi với schema repo. Nên danh sách này
 * phải vào CẢ HAI chỗ cùng lúc: `dungKho(ten, {chuDe:true})` ghi yaml,
 * `dungSchema(ten, {chuDe:true})` ghi enum. Lệch một bên là 409/500, không phải
 * một phép kiểm đỏ dễ đọc.
 */
export const CAT_FX = [
  ["fx-agent", "Agent và LLM", "agent, LLM, prompt"],
  ["fx-hau-truong", "Hậu trường", "hạ tầng, hàng đợi"],
  ["fx-du-lieu", "Dữ liệu và ML", "ETL, huấn luyện"],
]

const yamlCpt = () =>
  "# Danh mục KHÁI NIỆM của fixture test — không phải danh mục thật.\n"
  + CPT_FX.map(([id, nhan, al]) => `- id: ${id}\n  label_vi: ${nhan}\n`
    + (al.length ? `  aliases: [${al.join(", ")}]\n` : "")).join("")

const yamlCat = () =>
  "# Danh mục CHỦ ĐỀ của fixture test — không phải danh mục thật.\n"
  + CAT_FX.map(([id, nhan, gom]) =>
    `- id: ${id}\n  label_vi: ${nhan}\n  gom: ${gom}\n`).join("")

/** Dựng kho tạm: danh mục của FIXTURE + 4 bản ghi phủ các nhánh vòng đời. */
export function dungKho(ten, { chuDe = false } = {}) {
  // Tên kho tạm mang PID — KHÔNG dùng tên cố định.
  //
  // Tên cố định thì hai lượt chạy song song (hai người, hoặc một người và một
  // agent khác trong cùng repo) dùng CHUNG một thư mục: lượt sau `rmSync` xoá
  // kho của lượt trước đang chạy dở ⇒ PUT trả 404 sau khi POST vừa 201.
  // Triệu chứng là "test chập chờn", và test chập chờn thì tệ hơn không có test
  // — nó dạy người ta bỏ qua màu đỏ.
  const kho = join(tmpdir(), `${ten}-${process.pid}`)
  const rac = join(tmpdir(), `${ten}-${process.pid}-rac`)
  rmSync(kho, { recursive: true, force: true })
  rmSync(rac, { recursive: true, force: true })
  mkdirSync(join(kho, "article"), { recursive: true })
  mkdirSync(join(kho, "paper"), { recursive: true })
  /*
   * ═══ DANH MỤC CỦA FIXTURE — tự sở hữu, không đi vay của người dùng ════════
   *
   * `categories.yaml` COPY từ `kb/`: nó phải khớp `enum category` trong schema,
   * và `check_danh_muc.py` (API gọi làm cổng sau mỗi ghi danh mục) so hai bên.
   * Thiếu file ⇒ cổng đỏ ⇒ mọi ghi rollback và trả 500 — đúng lúc kiểm, sai lý do.
   *
   * `concepts.yaml` thì KHÔNG copy — fixture tự viết. Vì sao khác nhau:
   *   · `concepts` không có enum trong schema, nên danh mục khái niệm của kho
   *     tạm hoàn toàn tự do.
   *   · và nó BẮT BUỘC phải tự do: `banGhi()` gán `concepts: ["idempotency"]`
   *     cho mọi bản ghi seed. FR-031 xoá sạch `kb/concepts.yaml` theo yêu cầu
   *     người dùng, và ngay lập tức 4 file api-* đỏ với "POST hợp lệ ⇒ 422" —
   *     vì bản ghi seed trỏ vào một nhãn không còn tồn tại.
   *
   * Kho thật rỗng là trạng thái HỢP LỆ. Nó không được làm bộ test mù.
   *
   * Sáu mục, không một: `danh-muc-phan-trang-ep-xoa` cần đủ mục để cắt trang.
   */
  writeFileSync(join(kho, "concepts.yaml"), yamlCpt(), "utf8")
  // `categories.yaml` chỉ có mục khi caller cũng dựng schema tạm — xem CAT_FX.
  writeFileSync(join(kho, "categories.yaml"),
    chuDe ? yamlCat() : readFileSync(join(GOC, "kb", "categories.yaml")), "utf8")

  writeFileSync(join(kho, "article", "bai-nhap.md"),
    banGhi({ id: "src_nhap01", slug: "bai-nhap", status: "draft" }), "utf8")
  writeFileSync(join(kho, "article", "bai-ngoai.md"),
    banGhi({
      id: "src_ngoai1", slug: "bai-ngoai", status: "draft", origin: "external",
      them: { citations_sampled: 2, citations_verified: 2, ingested_at: "2026-08-19" },
    }), "utf8")
  writeFileSync(join(kho, "paper", "bai-duyet.md"),
    banGhi({
      id: "src_duyet1", slug: "bai-duyet", type: "paper", status: "approved",
      origin: "pipeline",
      them: { insight_new: true, skill_installed: false, review_minutes: 12 },
    }), "utf8")
  // Bản lưu trữ — PHẢI vô hình với mọi endpoint (M02 §2.5)
  writeFileSync(join(kho, "paper", "bai-duyet.v1.md"),
    readFileSync(join(kho, "paper", "bai-duyet.md")), "utf8")

  // FR-034 — nguồn chân lý là kb/_kho.sqlite. Seed file ở trên chỉ là EXPORT;
  // phải nạp vào DB bằng đường file→DB duy nhất. ĐỒNG BỘ: server dậy sau là
  // thấy đủ dữ liệu, không có cửa sổ async nào để test chập chờn.
  // B-A6 · `citations_*` là DỮ LIỆU DẪN XUẤT sau C1. Fixture ở trên ghi thẳng
  // file, KHÔNG đi qua cửa ghi, nên không ai tính ba trường đó — và §7 của
  // `api-crud` validate cả kho tạm thì đỏ. Nơi GIEO dữ liệu là nơi TÍNH nó,
  // cùng bài học `sinh_kb_mock.py:65` cho `word_count`.
  //
  // CỐ Ý không gõ `unverifiable_citations: true` vào fixture: gõ tay một số dẫn
  // xuất là đúng thứ B-A6 cấm. Và cố ý KHÔNG sửa địa chỉ trong thân — chúng
  // không phân giải được, và đó là ca C1 vừa dựng, phải còn được đi qua.
  vaSoDanXuat(kho)
  napLaiDb(kho, rac)
  // Export lại NGAY để file seed thành dạng CANONICAL của xuat_kho — mọi phép
  // so byte về sau (rác, restore) so canonical với canonical, không so bản
  // viết tay với bản máy in.
  xuatKho(kho, rac)

  return { kho, rac, don: () => {
    // `maxRetries` vì FR-023: server bắn `sinh_index.py` sau mỗi ghi và KHÔNG
    // chờ nó (chờ = +430ms mỗi request). Tiến trình python đó có thể còn đang
    // mở `_index.sqlite` đúng lúc test dọn ⇒ EBUSY trên Windows, và EBUSY ở đây
    // làm CẢ file test chết chứ không chỉ đỏ một phép kiểm.
    // Dọn kho tạm là việc bên lề, không phải thứ đang được kiểm — nên thử lại
    // vài nhịp rồi bỏ qua, thay vì để nó giết bộ test.
    for (const d of [kho, rac]) {
      try {
        rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
      } catch { /* python còn giữ file — thư mục tạm, OS sẽ dọn */ }
    }
  } }
}

/**
 * `validate --fix` trên kho TẠM — điền `word_count` + `citations_*` +
 * `unverifiable_citations` cho fixture viết tay.
 *
 * KHÔNG ném khi exit != 0: một số fixture cố ý sai (bài để test 422), và phép
 * kiểm thật nằm ở §7 của `api-crud` — nó validate `--strict` cả kho ở cuối vòng
 * CRUD. Ném ở đây là biến một bước chuẩn bị thành một cổng thứ hai, và cổng đó
 * sẽ đỏ vì lý do không liên quan tới thứ test đang kiểm.
 */
function vaSoDanXuat(kho) {
  spawnSync(process.env.PYTHON ?? "python",
    [join(GOC, "core", "src", "source_distiller", "validate.py"), kho, "--fix"],
    { env: { ...process.env, PYTHONIOENCODING: "utf-8" }, encoding: "utf8" })
}

/**
 * FR-034 — dựng lại kb/_kho.sqlite của kho TẠM từ file .md/.yaml trong đó.
 *
 * Test nào GIEO thêm file .md giữa chừng (sau dungKho) phải gọi lại hàm này —
 * server đọc DB, không đọc file; gieo file mà không nạp là bài "biến mất".
 * Chạy ĐỒNG BỘ (spawnSync): thứ tự trong test là thứ tự thật.
 */
export function napLaiDb(kho, rac) {
  const r = spawnSync(process.env.PYTHON ?? "python",
    [join(GOC, "core", "tools", "dung_lai_db.py")], {
      env: {
        ...process.env, PYTHONIOENCODING: "utf-8",
        KB_DIR: kho, RECYCLE_DIR: rac,
      },
      encoding: "utf8",
    })
  if (r.status !== 0) {
    throw new Error(`dung_lai_db.py trượt trên kho tạm:\n${r.stderr || r.stdout}`)
  }
}

/** Export DB kho tạm → file (đồng bộ) — canonical hoá seed, kiểm file sau ghi. */
export function xuatKho(kho, rac) {
  const r = spawnSync(process.env.PYTHON ?? "python",
    [join(GOC, "core", "tools", "xuat_kho.py")], {
      env: {
        ...process.env, PYTHONIOENCODING: "utf-8",
        KB_DIR: kho, RECYCLE_DIR: rac,
      },
      encoding: "utf8",
    })
  if (r.status !== 0) {
    throw new Error(`xuat_kho.py trượt trên kho tạm:\n${r.stderr || r.stdout}`)
  }
}

/**
 * Cổng TRỐNG do HĐH cấp — không hardcode: máy này có server cũ/AI khác đang
 * giữ 8787-8792, test giả định cổng cố định là đỏ vì môi trường chứ không vì code.
 */
function timCongTrong() {
  return new Promise((ok, loi) => {
    const s = createServer()
    s.once("error", loi)
    s.listen(0, "127.0.0.1", () => {
      const cong = s.address().port
      s.close(() => ok(cong))
    })
  })
}

/**
 * Bản sao TẠM của hai file schema — để test kiểm được đường ghi CHỦ ĐỀ.
 *
 * Thêm/xoá chủ đề sửa `enum` trong schema. Không có bản tạm thì test buộc sửa
 * schema THẬT trong repo — tự tạo ra đúng thứ `check_frozen` sinh ra để bắt.
 * FR-021 tự khai đây là nợ; hàm này trả nợ đó.
 */
export function dungSchema(ten, { chuDe = false } = {}) {
  const goc = join(tmpdir(), ten)
  rmSync(goc, { recursive: true, force: true })
  for (const [thu, ten2] of [["assets", "assets"], ["skill-src", "skill-src"]]) {
    mkdirSync(join(goc, ten2), { recursive: true })
    const src = readFileSync(join(GOC, "core", thu, "frontmatter.schema.json"), "utf8")
    // FR-034 — schema KHÔNG còn enum category để bơm (`chuDe` giờ vô hại):
    // danh mục chủ đề của fixture đi qua kho/categories.yaml → dung_lai_db →
    // bảng `categories`. Hàm giữ nguyên chữ ký vì API không còn ghi schema —
    // SCHEMA_DIR chỉ còn vai "đánh dấu đang chạy kho tạm".
    void chuDe
    writeFileSync(join(goc, ten2, "frontmatter.schema.json"), src, "utf8")
  }
  return { goc, don: () => rmSync(goc, { recursive: true, force: true }) }
}

/** Spawn server thật trên cổng trống, đợi /api/health sống. Trả cả `cong`. */
export async function batServer({ kho, rac, schema, inbox, loi }) {
  const cong = await timCongTrong()
  const p = spawn(process.execPath, [join(GOC, "web", "server.mjs")], {
    cwd: join(GOC, "web"),
    env: {
      ...process.env,
      KB_DIR: kho, RECYCLE_DIR: rac, API_PORT: String(cong),
      SITE: join(tmpdir(), "gn-api-site-rong"),
      // Chỉ đặt khi test cần: kho tạm + schema tạm phải CÙNG PHÍA, nếu không
      // handler trả 409 (khoVaSchemaLech).
      ...(schema ? { SCHEMA_DIR: schema } : {}),
      // `inbox` bắt buộc khi test gọi POST /api/inbox: không đặt thì handler
      // ghi vào `_inbox/` THẬT rồi chạy gate lên `kb/` thật.
      ...(inbox ? { INBOX_DIR: inbox } : {}),
      // `loi` bắt buộc khi test gọi bảy cửa C1–C7 (FR-047): không đặt thì
      // server dùng `web/_loi.sqlite` THẬT và ghi bản lùi vào `web/_luu/`
      // thật — cùng lý do `inbox` tồn tại.
      ...(loi ?? {}),
    },
    stdio: ["ignore", "ignore", "pipe"],
  })
  let er = ""
  p.stderr.on("data", (d) => { er += d })
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${cong}/api/health`)
      if (r.ok) return { cong, dung: () => p.kill(), loi: () => er }
    } catch { /* chưa dậy */ }
    await new Promise((x) => setTimeout(x, 100))
  }
  p.kill()
  throw new Error("server không dậy sau 10s" + (er ? `\nstderr: ${er.slice(0, 500)}` : ""))
}

/** fetch JSON gọn. Trả {ma, json}. */
/**
 * `body` là object ⇒ JSON.stringify. `tho` là chuỗi gửi NGUYÊN VĂN — cần cho
 * phép kiểm "body không phải JSON ⇒ 400": không có nó thì nhánh đó không test
 * được vì mọi thứ đi qua đây đều đã là JSON hợp lệ.
 */
export async function goi(cong, method, duong, { body, headers, tho } = {}) {
  const r = await fetch(`http://127.0.0.1:${cong}${duong}`, {
    method,
    headers: { "content-type": "application/json", ...(headers ?? {}) },
    body: tho !== undefined ? tho : body === undefined ? undefined : JSON.stringify(body),
  })
  let j = null
  /*
   * `T08-33` · trả THÊM thân thô + header, giữ nguyên `{ma, json}`.
   *
   * Cửa xuất trả `text/markdown` · `.docx` · `.srt` — không JSON. Một helper
   * chỉ đọc được JSON thì mọi cổng cho cửa ấy phải tự gọi `fetch`, và lúc đó
   * mỗi cổng có một bản riêng của phép gọi.
   *
   * `clone()` vì thân chỉ đọc được MỘT lần: đọc JSON rồi thì đọc text ra rỗng.
   */
  const ban = r.clone()
  try { j = await r.json() } catch { /* body rỗng hoặc không phải JSON */ }
  // `than`, KHÔNG `tho`: `tho` đã là TÊN THAM SỐ của hàm này (thân request
  // dạng thô). Trùng tên trong cùng phạm vi là lỗi cú pháp, và nó nổ lúc NẠP
  // module nên mọi cổng dùng helper này chết cùng lúc.
  let than = ""
  try { than = await ban.text() } catch { /* nhị phân */ }
  // `hd`, không `headers`: `headers` cũng là tham số của hàm này. Hai tên
  // trùng trong một phạm vi nổ lúc NẠP module, nên mọi cổng dùng helper chết
  // cùng lúc — và câu lỗi nói về `_api.mjs`, không về cổng đang chạy.
  const hd = {}
  r.headers.forEach((v, k) => { hd[k] = v })
  return { ma: r.status, json: j, tho: than, headers: hd }
}

export function taoKiem() {
  const loi = []
  const ok = (dk, ten, ct = "") => {
    console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
    if (!dk) loi.push(ten)
  }
  const chot = (tenTest) => {
    console.log()
    if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
    console.log(`pass · ${tenTest}`)
  }
  return { ok, chot }
}
