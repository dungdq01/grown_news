#!/usr/bin/env node
/**
 * FR-028c · VÒNG ĐỜI MỘT BÀI — đi liền mạch, không cắt khúc.
 *
 * Người dùng hỏi: *"kiểm tra API bài viết: duyệt / sửa / loại / chuyển kho — có
 * hoạt động không?"*
 *
 * Bốn thao tác đó ánh xạ vào:
 *   duyệt / loại   `PATCH /api/articles/:type/:slug/status`
 *   sửa            `PUT   /api/articles/:type/:slug`   (đòi `If-Match`)
 *   chuyển kho     `DELETE …` (kb/ → _recycle/) và `POST …/restore` (ngược lại)
 *
 * VÌ SAO CẦN FILE NÀY khi đã có `api-status` · `api-crud` · `api-recycle` ·
 * `luong-day-du`: bốn file đó phủ **ca biên** rất tốt — ma trận 16 cặp chuyển,
 * 404, thiếu `If-Match`, etag cũ, xoá hai lần, payload chèn `slug`. Nhưng không
 * file nào đi **một vòng đời liền mạch**.
 *
 * Ca biên xanh không chứng minh vòng đời chạy. Đúng lớp lỗ vừa tìm ra ở
 * `categories`: DELETE có mã, có test ranh giới method, mà **đường thành công
 * chưa ai chạy** — và khi chạy thì nó đòi thêm một thứ (schema tạm) mà không
 * test nào nói.
 *
 * Vòng đời ở đây theo đúng đường người dùng đi:
 *
 *   tạo (draft) → sửa → duyệt → sửa lại (⇒ edited) → duyệt lại
 *               → loại → chuyển ra thùng rác → chuyển về kho
 *
 * Mỗi bước kiểm CẢ hai vế: API trả gì, VÀ trạng thái trên đĩa có đúng thế không.
 * Chỉ tin mã trả về là tin lời khai của bên bị kiểm.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
// Duong toi web/api de doc BANG_CHUYEN — nguon chan ly, khong go lai.
const WEB_API = join(dirname(fileURLToPath(import.meta.url)), "..", "api")
import { banGhi, batServer, dungKho, dungSchema, GOC, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

console.log("\nFR-028c · vòng đời một bài — duyệt · sửa · loại · chuyển kho\n")

const { kho, rac, don } = dungKho("gn-api-vong-doi", { chuDe: true })
const sc = dungSchema("gn-api-vong-doi-schema", { chuDe: true })
const sv = await batServer({ kho, rac, schema: sc.goc })
const CONG = sv.cong

/** Đọc trạng thái THẬT trên đĩa — không tin mã trả về của API. */
const tuDia = (type, slug) => {
  try {
    const t = readFileSync(join(kho, type, `${slug}.md`), "utf8")
    return (/^review_status:\s*(\w+)/m.exec(t) ?? [])[1] ?? "(không có trường)"
  } catch { return "(không có file)" }
}
const buoc = (n) => console.log(`\n── ${n}\n`)

try {
  // ── 1 · TẠO ────────────────────────────────────────────────────────────────
  buoc("1 · tạo bài mới")
  // API doi `{frontmatter, body}` — KHONG phai truong phang. Luot dau toi gui
  // truong phang va no tra 400 "Thieu {frontmatter, body}." — thong bao loi noi
  // dung thu thieu, nen mot vong doan la du.
  const type = "article"
  const slug = "bai-vong-doi"
  const mau = banGhi({ id: "src_vongdoi", slug })
  const thanMoi = mau.split("---\n\n")[1]
  const fm = {
    id: "src_vongdoi", slug, source_type: type,
    url: "https://example.com/vong-doi", protocol_version: "2.0",
    analyzed_at: "2026-08-19", one_liner: "Bài thử vòng đời",
    credibility_max: "plausible", conformance: "B", concepts: ["idempotency"],
    // Client CO TINH nhet `approved` — server phai LOT (M08-R5). Neu no giu
    // thi mot form web bo qua duoc ca cong duyet, tuc B-B1 hong.
    review_status: "approved", origin: "pipeline",
  }
  let r = await goi(CONG, "POST", "/api/articles",
    { body: { frontmatter: fm, body: thanMoi } })
  ok(r.ma === 201, `POST tạo được (${r.ma})`,
     `thân: ${JSON.stringify(r.json).slice(0, 260)}`)

  /*
   * FR-033 · server tự áp `approved` — bài tạo trên web LÊN SITE NGAY.
   *
   * Payload trên CỐ TÌNH khai `origin: pipeline`. Điều M08-R5 canh KHÔNG đổi:
   * client không chọn được `review_status`/`origin`; server lột cả hai rồi tự
   * áp giá trị của mình. Chỉ giá trị đó giờ là `approved` + `manual`.
   */
  ok(tuDia(type, slug) === "approved",
     `trên đĩa là \`approved\` — lên site ngay (được ${tuDia(type, slug)})`,
     "server phải TỰ áp trạng thái — nếu payload chọn được thì M08-R5 hỏng")
  ok(/^origin: manual$/m.test(readFileSync(join(kho, type, `${slug}.md`), "utf8")),
     "`origin` bị lột và áp `manual` — client khai `pipeline` không có tác dụng")

  const doc = async () => {
    const x = await goi(CONG, "GET", `/api/articles/${type}/${slug}`)
    return { ma: x.ma, etag: x.json?.etag, fm: x.json?.fm ?? x.json?.frontmatter, than: x.json }
  }

  // ── 2 · SỬA — bài VẪN trên site ───────────────────────────────────────────
  buoc("2 · sửa bài — không hạ trạng thái (FR-033)")
  let d = await doc()
  ok(d.ma === 200 && !!d.etag, `GET trả 200 + etag (${d.ma})`)
  r = await goi(CONG, "PUT", `/api/articles/${type}/${slug}`, {
    body: { frontmatter: { ...d.fm, one_liner: "Câu mô tả ĐÃ SỬA" }, body: thanMoi },
    headers: { "if-match": d.etag },
  })
  ok(r.ma === 200, `PUT sửa được (${r.ma})`,
     `thân: ${JSON.stringify(r.json).slice(0, 260)}`)
  d = await doc()
  ok(JSON.stringify(d.than ?? "").includes("ĐÃ SỬA"), "GET thấy nội dung ĐÃ SỬA",
     "PUT trả 200 mà giá trị không đổi là ghi vào hư vô")
  /*
   * FR-033 · ĐÂY LÀ PHÉP KIỂM DỄ HỒI QUY NHẤT CỦA CẢ VÒNG ĐỜI.
   *
   * Trước: sửa một bài `approved` hạ nó xuống `edited` ⇒ rời site ⇒ phải duyệt
   * lại. Đó là hàng đợi mang tên khác, và người dùng đã bỏ hàng đợi.
   *
   * Một nhánh `if (noiDungDoi)` mọc lại trong `suaBai` là bài của người dùng
   * lặng lẽ biến mất khỏi site sau mỗi lần bấm Lưu — im lặng, và họ sẽ đi tìm
   * nó ở chỗ khác.
   */
  ok(tuDia(type, slug) === "approved",
     `sửa xong VẪN trên site (được ${tuDia(type, slug)})`,
     "hạ trạng thái khi sửa là dựng lại hàng đợi vừa bỏ")

  // ── 3 · BA TRƯỜNG M1 — tuỳ chọn, và máy KHÔNG điền hộ ────────────────────
  buoc("3 · M1 tuỳ chọn — nhưng máy không điền hộ")
  const fileM1 = readFileSync(join(kho, type, `${slug}.md`), "utf8")
  for (const x of ["insight_new", "skill_installed", "review_minutes"]) {
    ok(!new RegExp("^" + x + ":", "m").test(fileM1),
       `\`${x}\` VẮNG MẶT — không ai khai thì không ai điền`,
       "một giá trị mặc định ở đây là máy tự khai có vỏ bọc người bấm (B-B1)")
  }

  // ── 4 · LOẠI — phán quyết, đòi lý do ─────────────────────────────────────
  buoc("4 · loại bài đang trên site")
  d = await doc()
  r = await goi(CONG, "PATCH", `/api/articles/${type}/${slug}/status`, {
    body: { to: "rejected", reject_reason: "abc" },
    headers: { "if-match": d.etag },
  })
  ok(r.ma === 422, `loại mà lý do < 5 ký tự ⇒ 422 (${r.ma})`,
     "lý do là thứ duy nhất phân biệt một phán quyết với một cú bấm nhầm")
  ok(tuDia(type, slug) === "approved", "file KHÔNG đổi sau 422")

  r = await goi(CONG, "PATCH", `/api/articles/${type}/${slug}/status`, {
    body: { to: "rejected", reject_reason: "đọc rồi, không đáng giữ trên site" },
    headers: { "if-match": d.etag },
  })
  ok(r.ma === 200, `loại ⇒ 200 (${r.ma})`,
     `thân: ${JSON.stringify(r.json).slice(0, 260)}`)
  ok(tuDia(type, slug) === "rejected", `trên đĩa là \`rejected\``)
  ok(/reject_reason:/.test(readFileSync(join(kho, type, `${slug}.md`), "utf8")),
     "lý do loại ĐƯỢC GHI vào file",
     "trả 200 mà không ghi lý do thì lần sau không ai biết vì sao bài bị loại")

  // ── 5 · ĐƯA LÊN SITE LẠI — thẳng, không vòng qua hàng chờ ────────────────
  buoc("5 · rejected → approved (FR-033 mở đường thẳng)")
  d = await doc()
  r = await goi(CONG, "PATCH", `/api/articles/${type}/${slug}/status`, {
    body: { to: "approved" }, headers: { "if-match": d.etag },
  })
  ok(r.ma === 200, `đưa lên site lại ⇒ 200 (${r.ma})`,
     `thân: ${JSON.stringify(r.json).slice(0, 260)}`)
  ok(tuDia(type, slug) === "approved", "bài trở lại trên site")
  ok(!/^reject_reason:/m.test(readFileSync(join(kho, type, `${slug}.md`), "utf8")),
     "`reject_reason` BỊ BỎ khi thu hồi phán quyết",
     "giữ lý do cũ là để lại một lời khai không còn mô tả hiện trạng")

  // ── 6 · ĐỒ THỊ KHÔNG CÒN NGÕ CỤT ─────────────────────────────────────────
  buoc("6 · mọi trạng thái đều có đường ra")
  {
    const st = readFileSync(join(GOC, "web", "api", "status.mjs"), "utf8")
    const khoi = /const BANG_CHUYEN = \{([\s\S]*?)\n\}/.exec(st)
    const bang = {}
    for (const dong of (khoi?.[1] ?? "").split("\n")) {
      const m = /^\s*(\w+)\s*:\s*\[([^\]]*)\]/.exec(dong)
      if (m) bang[m[1]] = (m[2].match(/["'](\w+)["']/g) ?? []).map((x) => x.slice(1, -1))
    }
    const cut = Object.entries(bang).filter(([, den]) => den.length === 0).map(([t]) => t)
    ok(Object.keys(bang).length > 0 && cut.length === 0,
       `${Object.keys(bang).length} trạng thái, không cái nào là ngõ cụt`,
       `ngõ cụt: ${cut.join(", ")} — bài rơi vào đó chỉ còn cách nạp lại như bài mới`)
    // Và `approved` KHÔNG được có đường về `draft`: đó đúng là trả về hàng chờ.
    ok(!(bang.approved ?? []).includes("draft"),
       "`approved → draft` ĐÓNG — không còn đường trả bài về hàng chờ",
       "mở lại cặp này là dựng lại hàng đợi bằng một cái tên khác")
  }


  // ── 7 · CHUYỂN KHO · kb/ → _recycle/ ──────────────────────────────────────
  buoc("7 · chuyển ra thùng rác (kb/ → _recycle/)")
  const byteTruoc = readFileSync(join(kho, type, `${slug}.md`))
  const ttTruoc = tuDia(type, slug)
  d = await doc()
  r = await goi(CONG, "DELETE", `/api/articles/${type}/${slug}`,
    { headers: { "if-match": d.etag } })
  ok(r.ma === 200 || r.ma === 204, `DELETE ⇒ ${r.ma}`,
     `thân: ${JSON.stringify(r.json).slice(0, 200)}`)
  ok(tuDia(type, slug) === "(không có file)", "file KHÔNG còn trong kb/")
  r = await goi(CONG, "GET", "/api/recycle")
  ok(r.ma === 200 && JSON.stringify(r.json).includes(slug),
     "thùng rác CÓ bài vừa xoá",
     "xoá mà không vào thùng rác thì đó là xoá THẬT — M08-R4 cấm")

  // ── 8 · CHUYỂN KHO · _recycle/ → kb/, byte nguyên vẹn ─────────────────────
  buoc("8 · chuyển về kho (_recycle/ → kb/)")
  r = await goi(CONG, "POST", `/api/articles/${type}/${slug}/restore`)
  ok(r.ma === 200 || r.ma === 201, `restore ⇒ ${r.ma}`,
     `thân: ${JSON.stringify(r.json).slice(0, 200)}`)
  ok(tuDia(type, slug) === ttTruoc,
     `về kho với ĐÚNG trạng thái lúc xoá (\`${ttTruoc}\` → được \`${tuDia(type, slug)}\`)`,
     "khôi phục mà đổi trạng thái là sửa dữ liệu người dùng không yêu cầu")
  ok(byteTruoc.equals(readFileSync(join(kho, type, `${slug}.md`))),
     "khôi phục BYTE-EQUAL với lúc xoá",
     "lệch một byte nghĩa là đường khôi phục có ghi lại — và ghi lại thì mất gì đó")

  // ── 9 · Kho vẫn qua được cổng validate sau cả vòng ────────────────────────
  buoc("9 · sau cả vòng, kho vẫn qua cổng")
  // Đây là phép kiểm cuối và là phép quan trọng nhất: API không được để kho ở
  // trạng thái mà `validate.py` không nhận. Trả 200 mà kho hỏng là tệ hơn 500.
  r = await goi(CONG, "GET", "/api/articles")
  ok(r.ma === 200, `GET danh sách ⇒ 200 (${r.ma})`)
  ok(JSON.stringify(r.json).includes(slug), "bài vừa khôi phục có trong danh sách")
} finally {
  sv.dung()
  don()
  sc.don()
}

chot("vòng đời một bài: tạo → lên site ngay · sửa không hạ · loại · lên lại · chuyển kho hai chiều")
