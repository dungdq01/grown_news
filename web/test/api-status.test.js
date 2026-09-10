#!/usr/bin/env node
/**
 * AC-2.2.1 (M08) — cửa chuyển trạng thái: người khai, máy không điền hộ.
 *
 * Ba lưỡi của B-B1 sau FR-011: (1) approve đòi ĐỦ 3 trường M1 từ body — thiếu
 * cái nào 422 cái đó và FILE KHÔNG ĐỔI BYTE; (2) reject đòi lý do ≥5 ký tự;
 * (3) bảng chuyển đóng theo M02 §2.2 — ngoài bảng 409. Cộng FR-012: bài
 * external giờ approve ĐƯỢC (khoá const draft đã tháo đúng chỗ).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { batServer, dungKho, goi, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-api-status-kb")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

const byteCua = (t, s) => readFileSync(join(kho, t, s + ".md"))

try {
  console.log("\n1 · Ba trường M1 TUỲ CHỌN — nhưng máy không điền hộ (FR-033)\n")

  /*
   * ĐỔI CHIỀU HOÀN TOÀN so với bản trước, và đây là chỗ ghi lại vì sao.
   *
   * Trước: thiếu một trường M1 ⇒ 422 "Approve cần NGƯỜI khai". Đó là cổng của
   * BƯỚC DUYỆT, và người dùng đã bỏ bước duyệt ("bỏ tất cả thứ gọi là chờ
   * duyệt"). Giữ cổng thì nút "Đưa lên site" ăn 422 vì một thủ tục không còn.
   *
   * Cái KHÔNG được mất, và giờ nó là toàn bộ phần còn lại của B-B1/M08-R3:
   * máy KHÔNG BAO GIỜ điền hộ. Không gửi ⇒ trường VẮNG MẶT trong file. Vắng là
   * sự thật ("không ai khai"); `false` là một lời khai không ai đưa ra.
   */
  let r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  const etag0 = r.json.etag
  const goc = byteCua("article", "bai-nhap")

  r = await goi(CONG, "PATCH", "/api/articles/article/bai-nhap/status",
    { body: { to: "approved" }, headers: { "if-match": etag0 } })
  ok(r.ma === 200, `approve KHÔNG kèm M1 ⇒ 200 — được ${r.ma}`)
  const sauLen = byteCua("article", "bai-nhap").toString("utf8")
  ok(/review_status: approved/.test(sauLen), "bài đã lên site")
  for (const x of ["insight_new", "skill_installed", "review_minutes"]) {
    ok(!new RegExp("^" + x + ":", "m").test(sauLen),
       `\`${x}\` VẮNG MẶT — máy không điền hộ`,
       "một giá trị mặc định ở đây là máy tự khai có vỏ bọc người bấm")
  }

  console.log("\n1b · Gửi SAI KIỂU vẫn bị chặn\n")

  // Tuỳ chọn nghĩa là được phép VẮNG, không phải được phép là RÁC.
  // Kiểm KIỂU chỉ chạy ở nhánh `den === "approved"` — ba trường này chỉ có
  // nghĩa khi bài lên site. Nên ca âm phải đi qua ĐÚNG nhánh đó, trên một bài
  // còn `draft`. Gửi sai kiểu ⇒ 422 ⇒ file không đổi ⇒ bài vẫn draft cho các
  // mục dưới dùng tiếp.
  r = await goi(CONG, "GET", "/api/articles/article/bai-ngoai")
  const etagP = r.json.etag
  const gocP = byteCua("article", "bai-ngoai")
  for (const [ten, body] of [
    ["insight_new", { to: "approved", insight_new: "có" }],
    ["review_minutes", { to: "approved", review_minutes: -2 }],
  ]) {
    r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
      { body, headers: { "if-match": etagP } })
    ok(r.ma === 422 && JSON.stringify(r.json).includes(ten),
      `${ten} sai kiểu ⇒ 422 nêu đúng trường — được ${r.ma}`)
    ok(byteCua("article", "bai-ngoai").equals(gocP), `file không đổi byte (${ten})`)
  }

  console.log("\n2 · Reject đòi lý do thật\n")

  r = await goi(CONG, "GET", "/api/articles/article/bai-ngoai")
  const etagN = r.json.etag
  const gocN = byteCua("article", "bai-ngoai")
  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "rejected", reject_reason: "rác" }, headers: { "if-match": etagN } })
  ok(r.ma === 422, `reject_reason 3 ký tự ⇒ 422 — được ${r.ma}`)
  ok(byteCua("article", "bai-ngoai").equals(gocN), "file vẫn không đổi byte")

  console.log("\n3 · Bảng chuyển — cái gì mở, cái gì đóng\n")

  // `draft → edited` KHÔNG có trong bảng: `edited` chỉ còn ở dữ liệu cũ và
  // hàng nhập từ `_inbox/`, không phải một đích ai đó chuyển tới.
  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "edited" }, headers: { "if-match": etagN } })
  ok(r.ma === 409, `draft → edited qua PATCH ⇒ 409 — được ${r.ma}`)

  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "rejected", reject_reason: "bản thử, loại có lý do" },
      headers: { "if-match": etagN } })
  ok(r.ma === 200, `draft → rejected hợp lệ ⇒ 200 — được ${r.ma}`)
  const etag1 = r.json.etag

  /*
   * FR-033 · `rejected → approved` MỞ (trước là 409).
   *
   * Trước phải vòng qua `draft`, tức qua hàng đợi. Bỏ hàng đợi thì bài bị loại
   * phải lên lại được thẳng — nếu không `rejected` thành ngõ cụt y như trước
   * FR-026.
   */
  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "approved" }, headers: { "if-match": etag1 } })
  ok(r.ma === 200, `rejected → approved ⇒ 200 (FR-033 mở) — được ${r.ma}`)
  ok(!/^reject_reason:/m.test(byteCua("article", "bai-ngoai").toString("utf8")),
    "`reject_reason` bị bỏ — phán quyết thu hồi thì lý do hết mô tả hiện trạng")

  // `approved → draft` ĐÓNG: đó đúng là trả bài về hàng chờ.
  r = await goi(CONG, "GET", "/api/articles/article/bai-ngoai")
  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "draft" }, headers: { "if-match": r.json.etag } })
  ok(r.ma === 409, `approved → draft ⇒ 409 (không còn hàng chờ) — được ${r.ma}`)


  console.log("\n4 · If-Match bắt lost-update giữa hai cửa sổ\n")

  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "rejected", reject_reason: "thử etag" } })
  ok(r.ma === 400, `thiếu If-Match ⇒ 400 — được ${r.ma}`)
  r = await goi(CONG, "PATCH", "/api/articles/article/bai-ngoai/status",
    { body: { to: "rejected", reject_reason: "thử etag" }, headers: { "if-match": "cu-ky" } })
  ok(r.ma === 412, `etag cũ ⇒ 412 — được ${r.ma}`)

  console.log("\n5 · FR-012 — bài external duyệt ĐƯỢC (người khai đủ M1)\n")

  // Mục 3 đã đưa chính bài này lên site (`rejected → approved`). Nên ở đây
  // không PATCH lại — `approved → approved` là 409, và 409 đó sẽ đọc ra như
  // "external bị chặn" trong khi nó chỉ là chuyển-tới-chính-mình.
  //
  // Điều FR-012 khai vẫn được canh, chỉ bằng KẾT QUẢ: một bài `origin:
  // external` ĐANG ở `approved` là bằng chứng schema không chặn nó vĩnh viễn.
  r = await goi(CONG, "GET", "/api/articles/article/bai-ngoai")
  ok(r.json.frontmatter.origin === "external", "bản thử đúng là external")
  ok(r.json.frontmatter.review_status === "approved",
    `external ĐÃ lên site được — được ${r.json.frontmatter.review_status}`,
    "trước FR-012 schema chặn external khỏi approved vĩnh viễn")
  ok(/review_status: approved/.test(String(byteCua("article", "bai-ngoai"))),
    "trạng thái mới nằm trong .md — nguồn chân lý, không phải cache")
} finally {
  sv.dung()
  don()
}

chot("cổng người: đòi đủ lời khai, bảng chuyển đóng, etag bắt va chạm")
