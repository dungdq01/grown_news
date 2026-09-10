#!/usr/bin/env node
/**
 * FR-040 — ba đường API riêng, và mỗi đường mang CỔNG của module nó.
 *
 * VẾ NẶNG: chứng minh cổng riêng có THẬT, không phải ba tên gọi của một hàm.
 * "GET /api/video trả video" xanh ngay cả khi ba đường chỉ là bí danh của nhau.
 * Cách duy nhất phân biệt là bắt mỗi đường TỪ CHỐI đúng thứ đường kia nhận:
 *   `/api/tai-lieu` thiếu `media`            ⇒ 422
 *   `/api/video`    thiếu `url`              ⇒ 422
 *   `/api/video`    host ngoài whitelist     ⇒ 422
 * Nếu là bí danh thì cả ba ca đều 201 và mọi phép kiểm "trả đúng loại" vẫn xanh.
 *
 * ĐO ĐƯỢC TRƯỚC KHI VIẾT: whitelist host video hiện CHỈ cưỡng chế ở FE
 * (`multiwindow.inline.ts:1184`). Server không kiểm, nên POST thẳng vào API lưu
 * được một bản video với URL bất kỳ. §3 dưới đây là lần đầu luật đó có mặt ở
 * phía server.
 */
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, GOC, batServer, dungKho, dungSchema, goi, taoKiem, thanBai } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-route-module-kb", { chuDe: true })
const { ok, chot } = taoKiem()
const { schema } = dungSchema("gn-route-module-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })
const CONG = sv.cong

const NHOM = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "loai-nguon.json"), "utf8")).module
const LOAI_CUA = Object.fromEntries(NHOM.map((m) => [m.ten, m.loai]))

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")

// `id` PHẢI ≥ 6 ký tự sau `src_` (`^src_[a-z0-9]{6,}$`) — bản đầu của tôi dựng
// `src_rbai` và cả ba mầm gieo 422, khiến §1 đo NHẦM ba bản ghi của fixture.
const fmGoc = (slug, type, them = {}) => ({
  id: `src_${slug.replace(/-/g, "")}zzzzzz`.slice(0, 14),
  slug, source_type: type,
  url: `https://example.com/${slug}`, protocol_version: "2.0",
  analyzed_at: "2026-08-28", one_liner: `Ban thu ${slug}`,
  credibility_max: "plausible", conformance: "B", concepts: ["idempotency"], category: [CAT_FX[0][0]],
  ...them,
})

// Thân theo KHUNG cho mọi bản: hồ sơ `phan-tich` đòi đủ mục/dẫn nhập/tinh
// túy/locator, và một thân "Ghi chu ngan." làm bản `paper` 422 vì lý do không
// liên quan gì tới thứ đang kiểm. `thanBai()` là bản dựng sẵn của fixture.
const dat = (duong, fm) =>
  goi(CONG, "POST", duong, { body: { frontmatter: fm, body: thanBai() } })

try {
  // Gieo byte cho các ca tài liệu hợp lệ.
  await goi(CONG, "POST", "/api/articles/media", {
    tho: PDF, headers: { "content-type": "application/pdf", "x-ten-goc": "bia.pdf" },
  })

  console.log("\n1 · Ba đường tồn tại, và CHỈ trả bản của module mình\n")

  // Gieo mỗi nhóm một bản qua đường CŨ — để §1 đo phép LỌC của đường mới, không
  // đo luôn cả phép ghi của nó. Trộn hai thứ vào một phép kiểm thì lúc đỏ không
  // biết cái nào hỏng.
  await dat("/api/articles", fmGoc("r-bai", "paper"))
  await dat("/api/articles", fmGoc("r-tl", "tai-lieu", {
    ho_so: "thu-vien",
    media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf",
             so_byte: PDF.length }],
  }))
  await dat("/api/articles", fmGoc("r-vd", "video", {
    ho_so: "thu-vien", url: "https://youtu.be/abc123nhom0",
    url_normalized: "youtube.com/watch?v=abc123nhom0",
  }))

  for (const m of NHOM) {
    const r = await goi(CONG, "GET", `/api/${m.ten}`)
    ok(r.ma === 200, `GET /api/${m.ten} ⇒ 200 (được ${r.ma})`,
      "404 nghĩa là đường chưa tồn tại")
    const co = [...new Set((r.json?.items ?? []).map((b) => b.source_type))]
    ok(co.length > 0, `  /api/${m.ten} trả ít nhất một bản`)
    const la = co.filter((l) => !LOAI_CUA[m.ten].includes(l)).sort()
    ok(la.length === 0, `  /api/${m.ten} KHÔNG lẫn loại nhóm khác`,
      `lẫn: ${la.join(" · ")}`)
  }

  console.log("\n2 · CỔNG RIÊNG có THẬT — mỗi đường từ chối thứ đường kia nhận\n")

  /*
   * PHÂN BIỆT AI TỪ CHỐI, không chỉ "có bị từ chối không".
   *
   * Bản đầu của §2 chỉ đòi `ma === 422`, và kiểm hai chiều cho thấy nó XANH cả
   * khi cổng module bị tắt hoàn toàn — vì `validate.py` cũng từ chối đúng ba ca
   * đó. Nó đo cái hàm DÙNG CHUNG, tức đúng thứ FR-040 nói là vấn đề.
   *
   * Hai tầng trả hai HÌNH DẠNG lỗi khác nhau, và đó là thứ phân biệt được:
   *   cổng module  ⇒ { loi: … }
   *   validate.py  ⇒ { loi_validate: … }
   */
  const cuaCong = (r) => r.json && "loi" in r.json && !("loi_validate" in r.json)

  const thieuMedia = await dat("/api/tai-lieu",
    fmGoc("r-tl-thieu", "tai-lieu", { ho_so: "thu-vien" }))
  ok(thieuMedia.ma === 422 && cuaCong(thieuMedia),
    `POST /api/tai-lieu THIẾU \`media\` ⇒ 422 TỪ CỔNG MODULE (được ${thieuMedia.ma})`,
    `${JSON.stringify(thieuMedia.json).slice(0, 160)} — `
    + "lỗi mang `loi_validate` nghĩa là validate.py bắt, cổng module chưa bắn")

  const thieuUrl = await dat("/api/video",
    fmGoc("r-vd-thieu", "video", { ho_so: "thu-vien", url: "" }))
  ok(thieuUrl.ma === 422 && cuaCong(thieuUrl),
    `POST /api/video THIẾU \`url\` ⇒ 422 TỪ CỔNG MODULE (được ${thieuUrl.ma})`,
    JSON.stringify(thieuUrl.json).slice(0, 160))

  /*
   * HOST — luật này `validate.py` KHÔNG có. Đo trực tiếp: một bản video host lạ
   * kèm `url_normalized` hợp lệ đi qua `validate.py --strict` SẠCH.
   *
   * Nên ca này phải kèm `url_normalized`. Bản đầu của tôi bỏ trống nó và nhận
   * 422 — nhưng vì "video thu-vien phải khai url_normalized", KHÔNG vì host.
   * Một phép kiểm đỏ đúng mã vì SAI LÝ DO là một phép kiểm chưa đo gì.
   */
  const hostLa = await dat("/api/video", fmGoc("r-vd-host", "video", {
    ho_so: "thu-vien", url: "https://khong-co-trong-whitelist.example/v/1",
    url_normalized: "khong-co-trong-whitelist.example/v/1",
  }))
  ok(hostLa.ma === 422 && cuaCong(hostLa),
    `POST /api/video host NGOÀI whitelist ⇒ 422 TỪ CỔNG MODULE (được ${hostLa.ma})`,
    `${JSON.stringify(hostLa.json).slice(0, 160)} — whitelist host trước FR-040 `
    + "CHỈ sống ở FE, nên đây là lần đầu nó có mặt phía server")
  ok(/host|whitelist/i.test(String(hostLa.json?.loi ?? "")),
    "  lời từ chối nói ra là HOST, không nói chung chung",
    String(hostLa.json?.loi ?? hostLa.json?.loi_validate ?? "").slice(0, 160))

  // Hậu tố có dấu chấm, không `includes`: `youtube.com.kẻ-xấu.example` phải BỊ
  // chặn. Đây là cách một whitelist thành vô nghĩa mà khó thấy nhất.
  const hostGia = await dat("/api/video", fmGoc("r-vd-gia", "video", {
    ho_so: "thu-vien", url: "https://youtube.com.ke-xau.example/v/1",
    url_normalized: "youtube.com.ke-xau.example/v/1",
  }))
  ok(hostGia.ma === 422 && cuaCong(hostGia),
    `POST /api/video host GIẢ \`youtube.com.ke-xau.example\` ⇒ 422 (được ${hostGia.ma})`,
    "so bằng `includes` thì host này lọt — whitelist thành vô nghĩa")

  // Chiều DƯƠNG của cùng ba cổng: hợp lệ thì phải qua. Không có vế này thì một
  // cài đặt "từ chối tất" cũng xanh cả ba phép kiểm trên.
  const tlOk = await dat("/api/tai-lieu", fmGoc("r-tl-ok", "tai-lieu", {
    ho_so: "thu-vien",
    media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf",
             so_byte: PDF.length }],
  }))
  ok(tlOk.ma === 201, `POST /api/tai-lieu ĐỦ \`media\` ⇒ 201 (được ${tlOk.ma})`,
    JSON.stringify(tlOk.json).slice(0, 200))
  // `url_normalized` khai TAY o day: `validate.py:288` doi no cho video ho so
  // thu-vien, va cong `/api/video` CO Y khong tu tinh — tinh o JS la ban THU HAI
  // cua `chuan_hoa_url()` trong Python, dung lop loi "hai cong thuc khong ai doi
  // chieu" da trung o `dongBoThe`. Da ghi vao backlog M11.
  const vdOk = await dat("/api/video", fmGoc("r-vd-ok", "video", {
    ho_so: "thu-vien", url: "https://www.youtube.com/watch?v=abc123nhom1",
    url_normalized: "youtube.com/watch?v=abc123nhom1",
  }))
  ok(vdOk.ma === 201, `POST /api/video host trong whitelist ⇒ 201 (được ${vdOk.ma})`,
    JSON.stringify(vdOk.json).slice(0, 200))

  console.log("\n3 · Sai NHÓM là lỗi PHÂN LOẠI, không phải 404\n")

  const saiNhom = await goi(CONG, "GET", "/api/video/paper/r-bai")
  ok(saiNhom.ma === 400,
    `GET /api/video/paper/… ⇒ 400 (được ${saiNhom.ma})`,
    "404 nói sai chỗ: người gọi đi sửa slug trong khi cái sai là ĐƯỜNG")
  ok(/nhóm|nhom/i.test(JSON.stringify(saiNhom.json ?? "")),
    "  lời lỗi nói ra là sai NHÓM", JSON.stringify(saiNhom.json).slice(0, 160))

  console.log("\n4 · M08-R5 ở CẢ BA đường — client không đặt được trường server-quyết\n")

  for (const [nhom, type, them] of [
    ["bai-viet", "paper", {}],
    ["tai-lieu", "tai-lieu", { ho_so: "thu-vien",
      media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf",
               so_byte: PDF.length }] }],
    ["video", "video", { ho_so: "thu-vien",
      url: "https://www.youtube.com/watch?v=abc123nhom2",
      url_normalized: "youtube.com/watch?v=abc123nhom2" }],
  ]) {
    // Client gửi `rejected`/`pipeline`; server ÁP `approved`/`manual` cho bài
    // NGƯỜI TỰ VIẾT (`articles.mjs:470-471`). Gửi đúng giá trị server sẽ áp thì
    // phép kiểm không phân biệt được "đã lột" với "tình cờ trùng" — nên phải
    // gửi một giá trị KHÁC hẳn.
    const r = await dat(`/api/${nhom}`, fmGoc(`r-r5-${nhom}`, type, {
      ...them, review_status: "rejected", origin: "pipeline",
    }))
    ok(r.ma === 201, `  POST /api/${nhom} với trường server-quyết ⇒ 201`,
      JSON.stringify(r.json).slice(0, 200))
    const d = await goi(CONG, "GET", `/api/articles/${type}/r-r5-${nhom}`)
    ok(d.json?.frontmatter?.review_status === "approved",
      `  /api/${nhom} LỘT \`review_status\` client gửi (được ${d.json?.frontmatter?.review_status}, chờ approved)`,
      "một route mới quên lột là một lỗ, và nó không lộ ra ở đường cũ")
    ok(d.json?.frontmatter?.origin === "manual",
      `  /api/${nhom} LỘT \`origin\` của client (được ${d.json?.frontmatter?.origin})`)
  }

  console.log("\n5 · `/api/articles**` VẪN chạy — bí danh không bị xoá\n")

  const cu = await goi(CONG, "GET", "/api/articles")
  ok(cu.ma === 200 && (cu.json?.items ?? []).length > 0,
    `GET /api/articles ⇒ 200 với ${cu.json?.items?.length} bản`,
    "FE dựng URL thẳng ở bốn chỗ sửa đổi — xoá đường này là lặp lại FR-024")
  const cuChiTiet = await goi(CONG, "GET", "/api/articles/paper/r-bai")
  ok(cuChiTiet.ma === 200, `GET /api/articles/:type/:slug ⇒ 200 (được ${cuChiTiet.ma})`)
} finally {
  sv.dung()
  don()
}

chot("ba đường riêng · cổng riêng có thật · sai nhóm là 400 · bí danh còn sống")
