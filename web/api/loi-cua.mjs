/*
 * loi-cua.mjs — BẢY CỬA C1–C7 (FR-047 §2 · T08-12 + T08-14)
 *
 * File này KHÔNG cầm SQL. `api-guard.test.js:69-71` cấm `prepare(` ·
 * `BEGIN IMMEDIATE` · `DatabaseSync` trong mọi file `web/api/` trừ
 * `dungchung.mjs`. Handler gọi **thao tác có tên**, không cầm `db` thô.
 *
 * Ràng buộc đó là món quà: nó ép chokepoint của `M18 AC-3.1` thành CẤU TRÚC.
 * Một handler cầm `db` thô thì "đúng một chỗ ghi" chỉ là lời hứa.
 *
 * Ba luật xuyên suốt (FR-047 §2.1) áp cho CẢ NĂM:
 *   L1 danh tính do LÕI gán, payload bị lột
 *   L2 thiếu danh tính ⇒ DENY, không nới
 *   L3 khoá service-to-service RIÊNG + kiểm `aud`
 */
import {
  docBai, ghiSauValidate, laSlug, LOAI, loiBuocDinhDanh, loiChoThu, loiGhiAudit,
  donNhapCu, loiKiemKhoaDichVu, loiTaoNhap, loiTraDinhDanh, loiXemMaMoi, loiXemPhien,
  tuanTu, AUD_LOI,
} from "./dungchung.mjs"

const json = (res, ma, o) => {
  res.writeHead(ma, { "content-type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(o))
}

/**
 * L3 · cổng vào của cả năm cửa. Fail-CLOSED.
 *
 * Không có khoá ⇒ 401. Sai khoá ⇒ 401. Dùng khoá session ⇒ 401
 * (`CVE-2025-41258`: dùng chung một secret cho session và dịch vụ nội bộ ⇒
 * token session đi vòng toàn bộ ACL, gồm cả GHI).
 *
 * Thông báo **giống hệt nhau** cho cả ba ca — phân biệt được là chỉ cho người
 * dò biết họ sai ở đâu.
 */
function quaCong(req, res, { ma } = {}) {
  const khoa = req.headers["x-khoa-dich-vu"] ?? ""
  const aud = req.headers["x-aud"] ?? ""
  if (!loiKiemKhoaDichVu({ khoa, aud })) {
    json(res, 401, { loi: "không được phép" })
    return false
  }
  /*
   * FR-049 · chặn dò. Đếm SAU khi khoá dịch vụ đã qua, không trước — không thì
   * một người lạ không có khoá cũng làm cạn quota của M15/M17 (`x-forwarded-for`
   * do họ tự khai), tức một cổng chống dò trở thành một cổng gây DoS nội bộ.
   *
   * `ma` chỉ có ở hai cửa tiêu mã (C4/C7); các cửa khác đếm theo IP thôi.
   */
  const ip = (req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() ||
    req.socket?.remoteAddress || "?"
  if (!loiChoThu({ ip, ma })) {
    // 429, KHÔNG 401: hai ca khác nhau và người gọi HỢP LỆ cần biết mình nên
    // chờ chứ không nên đổi khoá. Đây là cửa của MÁY đã xác thực, nên nói rõ
    // không rò gì cho người lạ.
    json(res, 429, { loi: "quá nhiều lần thử — chờ rồi thử lại" })
    return false
  }
  return true
}

/** Đọc body JSON có trần — cùng trần `TRAN` của đường ghi hiện có. */
async function docBody(req, tran = 64 * 1024) {
  const doan = []
  let n = 0
  for await (const c of req) {
    n += c.length
    if (n > tran) throw new Error("body quá trần")
    doan.push(c)
  }
  return doan.length ? JSON.parse(Buffer.concat(doan).toString("utf8")) : {}
}

/** C3 · GET /api/dinh-danh?kenh=&chat_id= → `{nguoi_dung_id}` hoặc `{}`. */
export function cuaTraDinhDanh(req, res, u) {
  if (!quaCong(req, res)) return
  try {
    // V6 · hai ca "lạ" và "chưa buộc" đi qua CÙNG một nhánh và trả cùng một
    // thứ. Không có `if (chat_id có trong hệ thống)` nào ở đây, và không được
    // thêm: phân biệt hai ca là một phép ĐẾM TÀI KHOẢN cho người lạ.
    json(res, 200, loiTraDinhDanh({
      kenh: u.searchParams.get("kenh"),
      chat_id: u.searchParams.get("chat_id"),
    }))
  } catch (e) {
    json(res, 400, { loi: e.message })
  }
}

/** C4 · POST /api/dinh-danh — buộc `chat_id`, tiêu `ma_moi` cùng transaction. */
export async function cuaBuocDinhDanh(req, res) {
  // Đọc body TRƯỚC `quaCong` vì phép chặn theo MÃ cần biết mã nào đang bị thử.
  // Đọc body của một request chưa xác thực là chấp nhận được ở đây: `docBody`
  // có trần, và không byte nào chạm dữ liệu trước khi khoá dịch vụ qua.
  let b
  try { b = await docBody(req) } catch (e) { return json(res, 400, { loi: e.message }) }
  if (!quaCong(req, res, { ma: b.ma })) return
  try {
    // L1 · KHÔNG chuyền `b.nguoi_dung_id` xuống. Chủ đến từ MÃ, do LÕI đọc.
    const r = loiBuocDinhDanh({ kenh: b.kenh, chat_id: b.chat_id, ma: b.ma })
    loiGhiAudit({ hanh_dong: "buoc-dinh-danh", doi_tuong: b.kenh, ok: true })
    json(res, 201, r)
  } catch (e) {
    // Ghi CẢ ca thất bại — không có nó thì ba tháng sau không ai biết có đang
    // bị dò hay không (M17 AC-3.6). Và KHÔNG kèm mã đã thử (M18-R2).
    loiGhiAudit({ hanh_dong: "buoc-dinh-danh", ok: false })
    json(res, 400, { loi: "không buộc được" })
  }
}

/** C5 · POST /api/audit — append-only; không có route sửa/xoá ở file này. */
export async function cuaGhiAudit(req, res) {
  if (!quaCong(req, res)) return
  try {
    const b = await docBody(req)
    json(res, 201, { stt: loiGhiAudit({
      hanh_dong: b.hanh_dong, doi_tuong: b.doi_tuong, ok: b.ok !== false,
    }) })
  } catch (e) {
    json(res, 400, { loi: e.message })
  }
}

/** C6 · GET /api/phien/:id → `{nguoi_dung_id, het_han}`; KHÔNG `ngu_canh`. */
export function cuaXemPhien(req, res, id) {
  if (!quaCong(req, res)) return
  try {
    const p = loiXemPhien(id)
    // Hết hạn · không có · chủ đã thu hồi ⇒ CÙNG một phản hồi.
    if (!p) return json(res, 404, {})
    json(res, 200, p)
  } catch (e) {
    json(res, 400, { loi: e.message })
  }
}

/** C7 · POST /api/ma-moi/dung — tra + đánh dấu, một lần. */
export async function cuaDungMaMoi(req, res) {
  // Đọc body TRƯỚC `quaCong` vì phép chặn theo MÃ cần biết mã nào đang bị thử.
  // Đọc body của một request chưa xác thực là chấp nhận được ở đây: `docBody`
  // có trần, và không byte nào chạm dữ liệu trước khi khoá dịch vụ qua.
  let b
  try { b = await docBody(req) } catch (e) { return json(res, 400, { loi: e.message }) }
  if (!quaCong(req, res, { ma: b.ma })) return
  try {
    const r = loiBuocDinhDanh({ kenh: b.kenh, chat_id: b.chat_id, ma: b.ma })
    loiGhiAudit({ hanh_dong: "dung-ma-moi", ok: true })
    json(res, 200, r)
  } catch {
    loiGhiAudit({ hanh_dong: "dung-ma-moi", ok: false })
    json(res, 400, { loi: "mã không dùng được" })
  }
}


/* ═══ C1 · POST /api/nhap — nạp nội dung TỪ MÁY (FR-047) ══════════════
 *
 * Khác `POST /api/articles` ở đúng một chỗ, và chỗ đó là cả lý do nó tồn tại:
 * `taoBai` đặt `review_status = "approved"` vì nó là **cửa của NGƯỜI** — chủ
 * dự án ngồi ở bàn biên tập local. `C1` là **cửa của MÁY** (M15_kenh), nên nó
 * ép **`draft` VÔ ĐIỀU KIỆN**.
 *
 * `review_status` trong payload bị **LỘT**, không phải bị **TỪ CHỐI** (FR-047
 * §2 C1). Khác biệt có chủ ý: từ chối dạy người gọi rằng trường đó tồn tại và
 * đáng thử lại; lột thì trường đó đơn giản không có tác dụng gì.
 *
 * `B-B1` không đổi một chữ: một tài khoản thật vẫn có thể nạp rác, và mọi thứ
 * nạp qua đây dừng ở `draft` cho tới khi CHỦ DỰ ÁN duyệt (M05-R1).
 */
export async function cuaNhap(req, res) {
  if (!quaCong(req, res)) return
  let p
  try {
    p = await docBody(req, 1024 * 1024)
  } catch (e) {
    return json(res, 400, { loi: e.message })
  }
  const fm = { ...(p.frontmatter ?? {}) }

  // L1 · LỘT mọi trường server-quyết. Thứ tự quan trọng: xoá TRƯỚC khi đặt,
  // không thì một payload khai `review_status` sau `origin` vẫn lọt.
  delete fm.review_status
  delete fm.origin
  delete fm.nguoi_dung_id
  fm.origin = "may"
  fm.review_status = "draft"

  const type = fm.source_type, slug = fm.slug
  if (!LOAI.includes(type)) {
    return json(res, 400, { loi: `source_type phải thuộc: ${LOAI.join(", ")}` })
  }
  if (!laSlug(slug)) {
    return json(res, 400, { loi: "slug phải khớp [a-z0-9]+(-[a-z0-9]+)*" })
  }
  return tuanTu(async () => {
    if (docBai(type, slug)) return json(res, 409, { loi: `kho đã có ${type}/${slug}.md` })
    const kq = await ghiSauValidate(fm, p.body ?? "", type, slug)
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    loiGhiAudit({ hanh_dong: "nhap-tu-may", doi_tuong: `${type}/${slug}`, ok: true })
    return json(res, 201, { path: `${type}/${slug}.md`, review_status: "draft" })
  })
}

/* ═══ C2 · POST /api/nhap-chung-cat — ghi bảng nháp (FR-046) ══════════
 *
 * `ban_goc_ai` GHI MỘT LẦN — trigger `nhap_chung_cat_ban_goc_bat_bien` trong
 * DDL cưỡng chế, không phải handler. Mất bản gốc là mất khả năng trả lời
 * *"người đã sửa những gì"*, và bản gốc là thứ TỐN TOKEN MODEL để tạo ra.
 *
 * `nguoi_dung_id` do LÕI gán (M12 AC-1.5) — payload khai thì bị lột.
 *
 * `trang_thai` và `review_status` KHÔNG lột bằng `delete` như C1 — chúng được
 * chặn bằng CẤU TRÚC, hai lớp, và đó là lớp mạnh hơn:
 *   1. `loiTaoNhap` nhận ĐÚNG HAI trường có tên (`nguoi_dung_id`, `ban_goc_ai`)
 *      ⇒ không có đường nào cho một khoá lạ trong `b` chạm tới câu INSERT.
 *   2. DDL: `trang_thai DEFAULT 'nhap'` + `review_status DEFAULT 'draft'
 *      CHECK (review_status = 'draft')` ⇒ kể cả khi lớp 1 vỡ, DB vẫn từ chối.
 * C1 phải `delete` vì nó trải NGUYÊN frontmatter của người gọi vào file; ở đây
 * không có phép trải nào, nên thêm `delete` chỉ là mã trang trí — và mã trang
 * trí làm người đọc sau tưởng ĐÓ là chỗ cưỡng chế.
 * Phép kiểm nằm ở `web/test/loi-cua.test.js` (gieo payload đòi `approved`).
 */
export async function cuaNhapChungCat(req, res) {
  if (!quaCong(req, res)) return
  try {
    const b = await docBody(req, 1024 * 1024)
    // L1 · người gọi KHÔNG tự khai mình là ai. Danh tính đến từ phiên mà LÕI
    // tra, không từ thân request — CVE-2026-47713 là hình dạng ngược lại.
    const chu = b.phien ? (loiXemPhien(b.phien)?.nguoi_dung_id ?? null) : null
    const job = loiTaoNhap({ nguoi_dung_id: chu, ban_goc_ai: b.ban_goc_ai })
    // Bản MỚI vừa vào ⇒ các bản NHÁP cũ cùng nguồn tự vào thùng rác.
    const m = /^nguon:\s*(.+)$/m.exec(String(b.ban_goc_ai ?? ""))
    if (m) donNhapCu(job, [...String(m[1]).matchAll(/[\w./-]+\/[\w.-]+/g)].map((x) => x[0]))
    loiGhiAudit({ hanh_dong: "tao-nhap-chung-cat", nguoi_dung_id: chu, ok: true })
    return json(res, 201, { job_ulid: job, trang_thai: "nhap", review_status: "draft" })
  } catch (e) {
    loiGhiAudit({ hanh_dong: "tao-nhap-chung-cat", ok: false })
    return json(res, 400, { loi: e.message })
  }
}

/** Cho router: bảng route của năm cửa, một chỗ khai. */
export const CUA_LOI = [
  { duong: "dinh-danh", method: "GET", ham: cuaTraDinhDanh, canU: true },
  { duong: "dinh-danh", method: "POST", ham: cuaBuocDinhDanh },
  { duong: "audit", method: "POST", ham: cuaGhiAudit },
  { duong: "ma-moi", method: "POST", ham: cuaDungMaMoi },
]

export { AUD_LOI, loiXemMaMoi }
