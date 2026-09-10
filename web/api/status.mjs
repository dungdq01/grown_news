/**
 * M08_api — PATCH /api/articles/:type/:slug/status (FR-011).
 *
 * CỬA DUY NHẤT đổi review_status từ web. Bảng chuyển CỨNG theo vòng đời
 * M02 §2.2 — ngoài bảng ⇒ 409. (approved → edited không nằm đây: nó là hệ quả
 * của PUT sửa nội dung, không phải một lệnh đổi trạng thái.)
 *
 * B-B1 nguyên vẹn — kiểm được bằng máy: 3 trường M1 và reject_reason lấy
 * NGUYÊN từ body người gửi, code không có default nào để tự điền (M08-R3;
 * api-guard.test.js quét literal). Schema FR-001 là lưới thứ hai: thiếu trường
 * thì validate.py trượt ⇒ 422, file không đổi byte.
 */
import { docBai, docBody, ghiSauValidate, json, tuanTu } from "./dungchung.mjs"

/**
 * FR-026 vế B + B2 — người dùng chốt: *"mở cả hai đi, sao cho tiện nhất mà đầy đủ"*.
 *
 * TRƯỚC: `approved` và `rejected` là hai NGÕ CỤT. Hệ quả đo được — một bài đã
 * duyệt **không có đường nào** tới `rejected`, kể cả đi qua `edited` (vì
 * `edited` chỉ tới `approved`). Đường ra duy nhất là XOÁ. Tức: duyệt nhầm một
 * bài thì phải xoá nó, và xoá là một việc khác hẳn về nghĩa.
 *
 * SAU: mọi trạng thái về được `draft`, nên đồ thị KHÔNG còn ngõ cụt nào.
 *
 *     draft    → approved | rejected
 *     edited   → approved | rejected      ← MỚI: sửa rồi thấy dở thì loại được
 *     approved → draft    | rejected      ← MỚI (vế B2 · bỏ duyệt)
 *     rejected → draft                    ← MỚI (vế B · đưa lại vào hàng chờ)
 *
 * B-B1 NGUYÊN VẸN. Luật đó nói *chỉ người được ĐẶT `approved`* — bốn đường mới
 * đều **rút** hoặc **từ chối**, không đường nào CẤP phê duyệt. Và `→ approved`
 * vẫn đòi đủ ba trường M1 như cũ.
 *
 * `→ draft` KHÔNG đòi trường mới. Ba lý do:
 *   1 `kb/` nằm trong git và B-C1 nói `.md` trong git là nguồn chân lý duy nhất
 *     — git CHÍNH LÀ dấu vết cho mọi chuyển đổi bài. Thêm một trường "lý do rút"
 *     là ghi lại thứ git đã ghi.
 *   2 Thêm trường = sửa `frontmatter.schema.json`, một file FROZEN. Đắt, và
 *     người dùng không yêu cầu.
 *   3 Rút phê duyệt là việc PHỤC HỒI ĐƯỢC (duyệt lại là xong), khác `rejected`
 *     là một PHÁN QUYẾT — nên nó không cần lý do như phán quyết cần.
 */
/*
 * FR-033 · BỎ HÀNG ĐỢI — bảng còn lại nói về VIỆC CÒN THẬT.
 *
 * Không còn "chờ duyệt", nên `draft` thôi là nơi bài ĐI QUA; nó chỉ còn là nơi
 * hàng NHẬP TỪ NGOÀI dừng lại (`gate.py:123`, M05-R1 — một file thả vào thư mục
 * không được tự lên site).
 *
 * Hai đổi:
 *   `rejected → approved`  MỞ. Trước phải vòng qua `draft`, tức qua hàng đợi.
 *                          Bỏ hàng đợi thì bài bị loại phải lên lại được thẳng.
 *   `approved → draft`     BỎ. Đó đúng là "trả về hàng chờ" — thứ vừa xoá.
 *                          Muốn gỡ một bài khỏi site thì `rejected` (Loại), có
 *                          ghi lý do, và đó là một PHÁN QUYẾT chứ không phải
 *                          một chỗ đứng chờ.
 */
const BANG_CHUYEN = {
  draft: ["approved", "rejected"],
  edited: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: ["approved"],
}

/**
 * Trường nào HẾT HIỆU LỰC khi rời một trạng thái.
 *
 * Ba trường M1 là LỜI KHAI của người, gắn với MỘT lần phê duyệt cụ thể ("tôi đã
 * đọc, nó dạy tôi cái mới, mất N phút"). Rút phê duyệt thì lời khai đó không
 * còn mô tả hiện trạng — để nguyên là để một bản `draft` mang một lời khai đã
 * ký cho một phê duyệt không còn tồn tại.
 *
 * Cùng lý với `reject_reason` khi rời `rejected`: lý do đó giải thích một phán
 * quyết đã được thu hồi.
 *
 * XOÁ KHOÁ, không đặt `null`: `insight_new` khai kiểu `boolean` trong schema nên
 * `null` sẽ trượt validate. `reject_reason` cho `["string","null"]` nhưng xoá
 * thì nhất quán hơn — một khoá vắng đọc ra "không có", một khoá `null` đọc ra
 * "có mà rỗng".
 */
const HET_HIEU_LUC = {
  approved: ["insight_new", "skill_installed", "review_minutes"],
  rejected: ["reject_reason"],
}

export async function doiTrangThai(req, res, type, slug) {
  let p
  try { p = JSON.parse((await docBody(req)).toString("utf8")) } catch {
    return json(res, 400, { loi: "Body phải là JSON." })
  }
  if (!p || typeof p !== "object") return json(res, 400, { loi: "Body phải là JSON object." })

  return tuanTu(async () => {
    const cu = docBai(type, slug)
    if (!cu) return json(res, 404, { loi: "Không có bài này." })

    const im = req.headers["if-match"]
    if (!im) return json(res, 400, { loi: "Thiếu header If-Match (lấy etag từ GET)." })
    if (im !== cu.etag) return json(res, 412, { loi: "Bài đã đổi ở nơi khác — GET lại trước." })

    const den = p.to
    const duocPhep = BANG_CHUYEN[cu.fm.review_status] ?? []
    if (!duocPhep.includes(den)) {
      return json(res, 409, {
        loi: `Không có đường ${cu.fm.review_status} → ${den ?? "?"} trong vòng đời M02 §2.2.`,
        duoc_phep: duocPhep,
      })
    }

    const fm = { ...cu.fm }

    // FR-026 vế B/B2 · bỏ những trường HẾT HIỆU LỰC khi RỜI trạng thái cũ.
    // Làm TRƯỚC khi điền trường mới: `approved → rejected` phải bỏ M1 rồi mới
    // đặt `reject_reason`, không phải ngược lại.
    for (const k of HET_HIEU_LUC[cu.fm.review_status] ?? []) delete fm[k]

    if (den === "approved") {
      /*
       * ═══ FR-033 · BA TRƯỜNG M1 THÀNH TUỲ CHỌN ════════════════════════════
       *
       * Trước: thiếu một trường ⇒ 422 "Approve cần NGƯỜI khai". Đó là cổng của
       * bước duyệt — và bước duyệt đã bỏ (người dùng: *"bỏ tất cả thứ gọi là
       * chờ duyệt"*). Giữ lại thì nút "Đưa lên site" ăn 422 vì một thủ tục
       * không còn tồn tại, và schema cũng thôi đòi chúng.
       *
       * ĐIỀU KHÔNG ĐỔI, và nó là phần còn lại của B-B1/M08-R3: MÁY KHÔNG BAO
       * GIỜ ĐIỀN HỘ. Không có `?? false`, không có `?? 0`. Client gửi thì nhận
       * và kiểm KIỂU; không gửi thì trường vắng mặt — vắng là sự thật ("không
       * ai khai"), còn `false` là một lời khai mà không ai đưa ra.
       *
       * Kiểu vẫn kiểm: gửi `insight_new: "có"` là dữ liệu rác vào kho, và cái
       * đó không liên quan gì tới việc bỏ hay giữ bước duyệt.
       */
      const sai = []
      if (p.insight_new !== undefined) {
        if (typeof p.insight_new !== "boolean") sai.push("insight_new (true/false)")
        else fm.insight_new = p.insight_new
      }
      if (p.skill_installed !== undefined) {
        if (typeof p.skill_installed !== "boolean") sai.push("skill_installed (true/false)")
        else fm.skill_installed = p.skill_installed
      }
      if (p.review_minutes !== undefined) {
        if (!Number.isInteger(p.review_minutes) || p.review_minutes < 0) {
          sai.push("review_minutes (số nguyên, số phút đọc thật)")
        } else fm.review_minutes = p.review_minutes
      }
      if (sai.length) return json(res, 422, { loi: "Trường khai SAI KIỂU:", thieu: sai })
    }
    if (den === "rejected") {
      const lyDo = typeof p.reject_reason === "string" ? p.reject_reason.trim() : ""
      if (lyDo.length < 5) {
        return json(res, 422, {
          loi: "reject_reason tối thiểu 5 ký tự — loại mà không ghi lý do thì cùng loại rác sẽ quay lại mãi (M02 §2.2).",
        })
      }
      fm.reject_reason = lyDo
    }
    fm.review_status = den

    const kq = await ghiSauValidate(fm, cu.body, type, slug)
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    return json(res, 200, { review_status: den, etag: kq.etag })
  })
}
