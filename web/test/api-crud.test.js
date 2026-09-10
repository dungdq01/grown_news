#!/usr/bin/env node
/**
 * AC-2.1.1 (M08) — vòng CRUD đủ trên kho tạm, kèm ca âm.
 *
 * Chuỗi: đọc danh sách/chi tiết → tạo → sửa → duyệt → sửa-khi-approved ⇒ edited
 * → duyệt lại → xoá → restore. Cuối test: kho tạm vẫn qua validate --strict —
 * API không được để lại kho ở trạng thái cổng không nhận.
 */
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { GOC, banGhi, batServer, dungKho, goi, taoKiem } from "./_api.mjs"
import { TINH_TUY_O } from "./_khung.mjs"

const { kho, rac, don } = dungKho("gn-api-crud-kb")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

try {
  console.log("\n1 · Đọc — JSON là view của .md\n")

  let r = await goi(CONG, "GET", "/api/articles")
  ok(r.ma === 200 && r.json.total === 3, `danh sách 3 bài (v1.md vô hình) — được ${r.json?.total}`)
  ok(!r.json.items.some((b) => /\.v\d/.test(b.slug)), "không bản lưu trữ nào lộ ra")
  ok(r.json.items.every((b) => b.etag && b.review_status), "mỗi thẻ có etag + trạng thái")

  r = await goi(CONG, "GET", "/api/articles?status=draft")
  ok(r.json.total === 2, `filter status=draft ra 2 — được ${r.json?.total}`)
  r = await goi(CONG, "GET", "/api/articles?concept=idempotency&type=paper")
  ok(r.json.total === 1, `filter concept+type ra 1 — được ${r.json?.total}`)
  r = await goi(CONG, "GET", "/api/articles?q=bai-ngoai")
  ok(r.json.total === 1, "tìm chữ q= chạy")

  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  ok(r.ma === 200 && r.json.frontmatter?.id === "src_nhap01"
     && r.json.body.includes(`### ${TINH_TUY_O} `),
    "chi tiết trả frontmatter + body + etag",
    "mốc là mục tinh túy — địa chỉ đọc từ khung, không gõ `## 6.` vào test")
  const etagNhap = r.json.etag

  console.log("\n2 · Cổng cấu trúc của route\n")

  r = await goi(CONG, "GET", "/api/articles/tai-lieu-la/bai-nhap")
  ok(r.ma === 400, `type ngoài enum ⇒ 400 — được ${r.ma}`)
  r = await goi(CONG, "GET", "/api/articles/article/..%2F..%2Fconcepts")
  ok(r.ma === 400, `slug traversal ⇒ 400 — được ${r.ma}`)

  console.log("\n3 · Tạo — server áp manual + draft\n")

  const bai = banGhi({ id: "src_taomoi", slug: "bai-tao-moi" })
  const fmMoi = {
    id: "src_taomoi", slug: "bai-tao-moi", source_type: "article",
    url: "https://example.com/tao-moi", protocol_version: "2.0",
    analyzed_at: "2026-08-19", one_liner: "Bài tạo từ web",
    credibility_max: "plausible", conformance: "B", concepts: ["idempotency"],
    // client cố nhét trạng thái — server phải LỘT (M08-R5)
    review_status: "approved", origin: "pipeline",
  }
  const thanMoi = bai.split("---\n\n")[1] ?? bai.slice(bai.indexOf("## 1."))
  r = await goi(CONG, "POST", "/api/articles", { body: { frontmatter: fmMoi, body: thanMoi } })
  ok(r.ma === 201, `POST hợp lệ ⇒ 201 — được ${r.ma}: ${JSON.stringify(r.json).slice(0, 120)}`)
  const tren = readFileSync(join(kho, "article", "bai-tao-moi.md"), "utf8")
  // FR-033 · server áp `approved`, không còn `draft`. Ý ĐỊNH KHÔNG ĐỔI và đó
  // mới là thứ M08-R5 canh: client KHÔNG đặt được `review_status`/`origin`.
  // Payload trên khai `approved` + `pipeline`; server vẫn lột cả hai và tự áp
  // giá trị của mình — chỉ giá trị đó giờ là `approved` + `manual`.
  ok(/review_status: approved/.test(tren) && /origin: manual/.test(tren),
    "trạng thái client gửi BỊ LỘT — server áp approved + manual (M08-R5)")
  ok(/word_count: \d+/.test(tren), "word_count máy tính qua --fix, không khai tay")

  r = await goi(CONG, "POST", "/api/articles", { body: { frontmatter: fmMoi, body: thanMoi } })
  ok(r.ma === 409, `POST trùng ⇒ 409 — được ${r.ma}`)

  const hong = { ...fmMoi, slug: "bai-hong", id: "khong-dung-dinh-dang" }
  r = await goi(CONG, "POST", "/api/articles", { body: { frontmatter: hong, body: thanMoi } })
  ok(r.ma === 422 && String(r.json.loi_validate).includes("id"),
    `POST id sai định dạng ⇒ 422 nguyên văn lỗi validate — được ${r.ma}`)

  console.log("\n4 · Sửa — If-Match + địa chỉ bất biến\n")

  r = await goi(CONG, "GET", "/api/articles/article/bai-tao-moi")
  const etagTao = r.json.etag
  const fmSua = { ...r.json.frontmatter, one_liner: "Đã sửa dòng mô tả" }

  r = await goi(CONG, "PUT", "/api/articles/article/bai-tao-moi",
    { body: { frontmatter: fmSua, body: thanMoi } })
  ok(r.ma === 400, `PUT thiếu If-Match ⇒ 400 — được ${r.ma}`)
  r = await goi(CONG, "PUT", "/api/articles/article/bai-tao-moi",
    { body: { frontmatter: fmSua, body: thanMoi }, headers: { "if-match": "etag-cu-ky" } })
  ok(r.ma === 412, `PUT etag cũ ⇒ 412 — được ${r.ma}`)
  r = await goi(CONG, "PUT", "/api/articles/article/bai-tao-moi",
    { body: { frontmatter: { ...fmSua, slug: "doi-ten" }, body: thanMoi },
      headers: { "if-match": etagTao } })
  ok(r.ma === 400, `PUT đổi slug ⇒ 400 — được ${r.ma}`)

  r = await goi(CONG, "PUT", "/api/articles/article/bai-tao-moi",
    { body: { frontmatter: { ...fmSua, review_status: "approved" }, body: thanMoi },
      headers: { "if-match": etagTao } })
  ok(r.ma === 200 && r.json.review_status === "approved",
    `PUT chở review_status ⇒ bị lột, giữ nguyên approved — được ${r.json?.review_status}`)

  console.log("\n5 · Sửa bài trên site KHÔNG hạ trạng thái (FR-033)\n")

  /*
   * Trước FR-033: sửa một bài `approved` tự hạ nó xuống `edited` ⇒ RỜI KHỎI
   * SITE ⇒ phải duyệt lại. Đó chính là hàng đợi mang tên khác, và người dùng
   * đã bỏ hàng đợi.
   *
   * Phép kiểm đổi CHIỀU: sửa xong bài phải VẪN `approved`. Đây là điều dễ hồi
   * quy nhất của cả FR — một nhánh `if (noiDungDoi)` mọc lại là bài của người
   * dùng lặng lẽ biến mất khỏi site sau mỗi lần lưu.
   */
  r = await goi(CONG, "GET", "/api/articles/paper/bai-duyet")
  const etagDuyet = r.json.etag
  const fmDuyet = r.json.frontmatter
  r = await goi(CONG, "PUT", "/api/articles/paper/bai-duyet",
    { body: { frontmatter: fmDuyet, body: r.json.body + "\nMột dòng thêm.\n" },
      headers: { "if-match": etagDuyet } })
  ok(r.ma === 200 && r.json.review_status === "approved",
    `sửa bài trên site ⇒ VẪN approved — được ${r.json?.review_status}`)
  const trenDia = readFileSync(join(kho, "paper", "bai-duyet.md"), "utf8")
  ok(/review_status: approved/.test(trenDia),
    "và trên ĐĨA cũng approved — không chỉ trong mã trả về")


  console.log("\n6 · Xoá vào thùng rác + restore\n")

  r = await goi(CONG, "GET", "/api/articles/article/bai-tao-moi")
  r = await goi(CONG, "DELETE", "/api/articles/article/bai-tao-moi",
    { headers: { "if-match": r.json.etag } })
  ok(r.ma === 200 && r.json.recycle_path?.includes("bai-tao-moi"),
    `DELETE ⇒ 200 + đường trong thùng rác — được ${r.ma}`)
  r = await goi(CONG, "GET", "/api/articles")
  ok(r.json.total === 3, `bài xoá biến khỏi danh sách — còn ${r.json?.total}`)
  r = await goi(CONG, "POST", "/api/articles/article/bai-tao-moi/restore")
  ok(r.ma === 200, `restore ⇒ 200 — được ${r.ma}`)
  r = await goi(CONG, "GET", "/api/articles")
  ok(r.json.total === 4, `bài trở lại danh sách — ${r.json?.total}/4`)

  console.log("\n7 · Kho tạm vẫn sạch qua cổng M01\n")

  let khoSach = true
  try {
    execFileSync("python",
      [join(GOC, "core", "src", "source_distiller", "validate.py"), kho,
       "--strict", "--concepts", join(kho, "concepts.yaml")],
      { env: { ...process.env, PYTHONIOENCODING: "utf-8" }, stdio: "pipe" })
  } catch { khoSach = false }
  ok(khoSach, "validate --strict cả kho tạm exit 0 sau đủ vòng CRUD")
} finally {
  sv.dung()
  don()
}

chot("vòng CRUD đủ, ca âm chặn đúng chỗ, kho sạch sau cùng")
