#!/usr/bin/env node
/**
 * FR-028b · CRUD DANH MỤC — chạy THẬT cả bốn đường, trên kho tạm.
 *
 * Người dùng hỏi: *"kiểm tra lại xem API CRUD catalog hoạt động hay không? sau
 * này thêm sửa xoá catalog trên web hết nhé"*.
 *
 * `danh-muc-them.test.js` tự khai ở đầu file: *"nhánh POST/DELETE categories
 * KHÔNG có test đường-thành-công (nợ FR-021 tự khai)"*. Tức trước file này,
 * câu trả lời đúng là **"có mã, nhưng đường thành công của DELETE và của
 * `categories` chưa ai chạy thử"** — và "có mã" không phải "chạy được".
 *
 * File này chạy đủ vòng cho CẢ HAI loại nhãn:
 *
 *   POST   → tạo
 *   GET    → thấy trong danh sách
 *   PATCH  → sửa `label_vi`
 *   DELETE → xoá, và GET không còn thấy
 *
 * Trên kho TẠM ở `os.tmpdir()` — không đụng `kb/` thật.
 */
import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()

console.log("\nFR-028b · CRUD danh mục — chạy thật cả bốn đường\n")

const { kho, rac, don } = dungKho("gn-api-dm-crud", { chuDe: true })
// Schema TẠM là bắt buộc, không phải tuỳ chọn. Thêm/xoá một CHỦ ĐỀ đổi `enum`
// trong `frontmatter.schema.json`; đặt kho tạm mà để schema ở repo thì API trả
// 409 kèm đúng câu: *"KB_DIR trỏ kho tạm nhưng schema vẫn ở repo — enum và
// categories.yaml sẽ lệch"*. Đó là một cổng ĐÚNG, và nó bắt lượt đầu của tôi.
const sc = dungSchema("gn-api-dm-crud-schema", { chuDe: true })
const sv = await batServer({ kho, rac, schema: sc.goc })
const cong = sv.cong

try {
  for (const [duong, loai, truong] of [
    ["concepts", "khái niệm", "concepts"],
    ["categories", "chủ đề", "category"],
  ]) {
    console.log(`\n── ${loai} (/api/${duong})\n`)
    const id = `thu-${duong}-crud`

    // ── C · TẠO ────────────────────────────────────────────────────────────
    // `categories` đòi xác nhận 2 bước (FR-021) — gửi `xacnhan` ngay từ đầu để
    // đi đường thành công. Nếu API đổi giao thức thì test này đỏ, và đó đúng là
    // điều nó tồn tại để bắt.
    // Hai loại nhãn KHÁC yêu cầu, và khác có lý do: thêm một CHỦ ĐỀ sửa `enum`
    // trong schema FROZEN — không có đường lùi tự động — nên nó đòi `gom` (ranh
    // giới mảng) và `xac_nhan: true`. Thêm KHÁI NIỆM không sửa schema nên nhẹ hơn.
    // Lượt đầu tôi gửi `xacnhan` (thiếu gạch dưới) và API trả 422 kèm ĐÚNG danh
    // sách trường thiếu — thông báo lỗi tốt là thứ đã tiết kiệm một vòng đoán.
    const than = duong === "categories"
      ? { id, label_vi: "Thử CRUD", gom: "ranh giới thử — chỉ dùng trong test", xac_nhan: true }
      : { id, label_vi: "Thử CRUD" }
    let r = await goi(cong, "POST", `/api/${duong}`, { body: than })
    ok(r.ma === 200 || r.ma === 201, `POST tạo được (${r.ma})`,
       `thân: ${JSON.stringify(r.json).slice(0, 200)}`)

    // ── R · ĐỌC ────────────────────────────────────────────────────────────
    r = await goi(cong, "GET", `/api/${duong}`)
    ok(r.ma === 200, `GET trả 200 (${r.ma})`)
    const co = (x) => JSON.stringify(x ?? "").includes(id)
    ok(co(r.json), "GET thấy nhãn vừa tạo",
       "tạo xong mà danh sách không có nó thì ghi không tới nơi")

    // ── U · SỬA ────────────────────────────────────────────────────────────
    r = await goi(cong, "PATCH", `/api/${duong}/${id}`,
      { body: { label_vi: "Đã sửa nhãn" } })
    ok(r.ma === 200, `PATCH sửa được (${r.ma})`,
       `thân: ${JSON.stringify(r.json).slice(0, 200)}`)
    r = await goi(cong, "GET", `/api/${duong}`)
    ok(JSON.stringify(r.json ?? "").includes("Đã sửa nhãn"),
       "GET thấy nhãn ĐÃ SỬA",
       "PATCH trả 200 mà giá trị không đổi là ghi vào hư vô")

    // ── D · XOÁ ────────────────────────────────────────────────────────────
    // Đây là đường mà `danh-muc-them.test.js` tự khai là CHƯA có test thành công.
    r = await goi(cong, "DELETE", `/api/${duong}/${id}`)
    ok(r.ma === 200 || r.ma === 204, `DELETE xoá được (${r.ma})`,
       `thân: ${JSON.stringify(r.json).slice(0, 200)}`)
    r = await goi(cong, "GET", `/api/${duong}`)
    ok(!co(r.json), "GET KHÔNG còn thấy nhãn đã xoá",
       "xoá trả 200 mà nhãn còn trong danh sách là xoá giả")

    // ── Xoá lại phải 404, không phải 200 ──────────────────────────────────
    // Xoá hai lần mà cả hai đều 200 thì không phân biệt được "đã xoá" với
    // "chưa từng có" — và người dùng mất tín hiệu duy nhất rằng lệnh có tác dụng.
    r = await goi(cong, "DELETE", `/api/${duong}/${id}`)
    ok(r.ma === 404 || r.ma === 409 || r.ma === 422,
       `xoá lần hai → ${r.ma} (không phải 200)`,
       "xoá cái không tồn tại mà trả 200 thì mọi lệnh xoá đều 'thành công'")
  }

  // ── Ranh giới KHÔNG được nới theo ────────────────────────────────────────
  console.log("\n── Ranh giới giữ nguyên\n")
  // `PUT` là "thay toàn bộ", tức đường đổi `id` — thứ bài viết TRỎ VÀO. Mở nó
  // là mở đường làm mồ côi mọi tham chiếu trong `kb/`.
  const r = await goi(cong, "PUT", "/api/concepts/thu-concepts-crud",
    { body: { id: "doi-id-khac" } })
  ok(r.ma === 404 || r.ma === 405, `PUT vẫn đóng (${r.ma})`,
     "PUT đổi được `id` ⇒ mọi bài trỏ vào nhãn cũ thành mồ côi")
} finally {
  sv.dung()
  don()
  sc.don()
}

chot("CRUD danh mục chạy thật cả bốn đường, hai loại nhãn")
