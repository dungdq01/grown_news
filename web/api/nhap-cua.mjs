/*
 * nhap-cua.mjs — NĂM cửa NHÁP cho TRÌNH DUYỆT (T08-22)
 *
 *   GET  /api/nhap-chung-cat            danh sách (không cõng thân bài)
 *   GET  /api/nhap-chung-cat/<ulid>     chi tiết — CẢ HAI bản, một lời gọi
 *   POST /api/nhap-chung-cat/<ulid>/sua        chỉ `ban_hien_tai`
 *   POST /api/nhap-chung-cat/<ulid>/tra-lai    bắt kèm `ly_do`
 *   POST /api/nhap-chung-cat/<ulid>/duyet      validate PASS mới ghi FILE
 *
 * VÌ SAO MỘT FILE RIÊNG, KHÔNG NHÉT VÀO HAI FILE ĐANG CÓ
 * `T08-22` khai `loi-cua.mjs`, và điều đó SAI VAI — đo được:
 *   · `loi-cua.mjs` = bảy cửa của MÁY (`FR-047`), `quaCong` **đòi khoá dịch
 *     vụ**. Người gọi năm cửa này là TRÌNH DUYỆT ⇒ 403 mọi lời gọi thật.
 *   · `tho-cua.mjs` = proxy LÕI→THỢ (T08-20/21). Năm cửa này **không proxy
 *     gì**: bảng nháp nằm trong DB của chính LÕI.
 * ⇒ Vai thứ ba: cửa cho NGƯỜI trên bảng của chính LÕI. Nó cần một cái tên.
 *
 * `POST /api/nhap-chung-cat` (không hậu tố) VẪN ở `loi-cua.mjs` và VẪN đòi
 * khoá: đó là cửa C2, đường worker M12 ghi nháp vào. Mở cửa cho NGƯỜI không
 * được nới cửa của MÁY — cổng đo cả hai chiều.
 *
 * KHÔNG cầm SQL (`api-guard` cấm ngoài `dungchung.mjs`): mọi truy vấn qua hàm
 * có tên trong `dungchung.mjs`.
 */
import {
  chuyenSangRac, docBai, docBody, ghiSauValidate, json, khoDoc, laSlug, LOAI,
  loiDoiTrangThaiNhap, loiGhiAudit, loiLietKeNhap, loiSuaNhap, loiXemNhap,
  tachFm, tuanTu,
} from "./dungchung.mjs"

/*
 * BẢN CHƯNG CẤT CŨ CỦA CÙNG MỘT NGUỒN → THÙNG RÁC.
 *
 * Chủ dự án chốt 2026-09-07: *"1 bài có thể có nhiều bài chưng cất, ta chỉ
 * cho xem bài gần nhất, các bản cũ không xem được nữa → để vậy dễ tràn tài
 * liệu"*.
 *
 * THÙNG RÁC, không xoá cứng. Một bản người đã đọc — có thể đã trích dẫn ở
 * đâu đó — không được biến mất không dấu vết; `chuyenSangRac` chụp nguyên văn
 * và khôi phục được ở màn Kho.
 *
 * Tìm bằng `nguon`, KHÔNG bằng slug: `nguon` là chỉ mục ngược đã có
 * (`FR-067` bắt buộc trường ấy với `origin: pipeline`), còn so theo slug gom
 * nhầm hai bài khác nguồn có tên na ná.
 *
 * Lỗi dọn KHÔNG huỷ việc duyệt: bản mới đã qua validate và đã nằm trong kho.
 * Huỷ nó vì một bước dọn là đánh đổi sai chiều — người mất công chưng cất,
 * còn cái hỏng chỉ là một thao tác gọn nhà.
 */
async function donBanCu(type, slug, fm) {
  const nguon = Array.isArray(fm?.nguon) ? fm.nguon : (fm?.nguon ? [fm.nguon] : [])
  if (!nguon.length) return []
  const dat = []
  try {
    const ds = khoDoc(LOAI).filter((b) => {
      const n = Array.isArray(b.fm?.nguon) ? b.fm.nguon : (b.fm?.nguon ? [b.fm.nguon] : [])
      return n.some((x) => nguon.includes(x))
    })
    /*
     * `khoDoc` trả khoá **`type`**, KHÔNG phải `source_type` — đo được
     * 2026-09-07 khi chạy thật: bản đầu tôi đọc `b.source_type` (undefined)
     * nên `duong` thành `undefined/<slug>`, không khớp gì, và
     * `chuyenSangRac(undefined, …)` không tìm ra hàng nào. Kết quả:
     * `ban_cu_vao_rac = []` trong khi cổng TĨNH vẫn xanh.
     *
     * Và KHÔNG dựa vào `ds[0]` để tìm "bản mới nhất": bản vừa duyệt là bản
     * mới nhất THEO ĐỊNH NGHĨA — nó vừa được tạo. Suy nó ra từ `analyzed_at`
     * thêm một chỗ sai (ngày do model khai, và bản mới có thể mang ngày cũ).
     */
    for (const b of ds) {
      const duong = `${b.type}/${b.slug}`
      if (duong === `${type}/${slug}`) continue      // chính bản vừa duyệt
      await chuyenSangRac(b.type, b.slug)
      dat.push(duong)
      loiGhiAudit({
        hanh_dong: "ban-chung-cat-cu-vao-rac", doi_tuong: duong, ok: true,
      })
    }
  } catch {
    // nuốt — xem chú thích trên
  }
  return dat
}

/** Đọc thân JSON của REQUEST (khác `body` = thân BÀI), trần 1 MB — cùng khuôn `docPayload` của `articles.mjs`. */
async function thanJson(req, res) {
  let raw
  try { raw = await docBody(req) } catch (e) {
    if (String(e.message) === "qua-tran") { json(res, 413, { loi: "Vượt trần 1 MB." }); return null }
    throw e
  }
  try { return JSON.parse(raw || "{}") } catch (e) {
    json(res, 400, { loi: `thân request không đọc được: ${e.message}` })
    return null
  }
}

/* ═══ GET /api/nhap-chung-cat — danh sách cho màn triage ══════════════════
 *
 * KHÔNG trả `ban_goc_ai`/`ban_hien_tai`. Chúng là THÂN BÀI, và một danh sách
 * 200 hàng sẽ nặng gấp trăm lần thứ nó cần hiện. Màn triage cần đúng bốn thứ:
 * mã việc · trạng thái · đã tỉa gì · vì sao bị trả lại.
 */
export function cuaDsNhap(req, res) {
  const u = new URL(req.url, "http://x")
  const n = Number(u.searchParams.get("n") ?? 50)
  return json(res, 200, loiLietKeNhap({
    trang_thai: u.searchParams.get("trang_thai") ?? null,
    // WO-090 · tab `Kết quả` xin CẢ bản đã bỏ. Cờ tường minh, mặc định giữ
    // nguyên hàng đợi việc của `T03-94`.
    gom_da_bo: u.searchParams.get("gom_da_bo") === "1",
    n: Number.isFinite(n) ? n : 50,
  }))
}

/* ═══ GET /api/nhap-chung-cat/<ulid> — CẢ HAI bản trong MỘT lời gọi ═══════
 *
 * `AC1`: FE dựng diff del/ins mà không cần gọi lần thứ hai. Hai lời gọi cho
 * một phép so là hai thời điểm khác nhau — bản gốc đọc lúc T, bản hiện tại
 * đọc lúc T+1, và diff nói về một cặp chưa bao giờ cùng tồn tại.
 */
export function cuaMotNhap(req, res, ulid) {
  const h = loiXemNhap(ulid)
  if (!h) return json(res, 404, { loi: `không có nháp ${ulid}` })
  return json(res, 200, h)
}

/* ═══ POST …/sua — chỉ `ban_hien_tai` ════════════════════════════════════
 *
 * Chữ ký `loiSuaNhap(job, ban)` nhận ĐÚNG hai đối số ⇒ không trường lạ nào của
 * payload tới được câu `UPDATE`. Đó là lớp một; lớp hai là trigger
 * `nhap_chung_cat_ban_goc_bat_bien` ở DDL. Hai lớp cho một luật, và lớp thứ
 * hai không quên được.
 *
 * `trang_thai` sang `da_sua` do CỬA đặt, không do payload: màn triage phân
 * biệt nháp chưa ai chạm với nháp đã biên tập, và nếu client đặt được trạng
 * thái đó thì phép phân biệt là lời khai của client.
 */
export async function cuaSuaNhap(req, res, ulid) {
  const b = await thanJson(req, res)
  if (!b) return
  if (typeof b.ban_hien_tai !== "string" || b.ban_hien_tai.trim() === "") {
    return json(res, 422, { loi: "thiếu `ban_hien_tai`" })
  }
  const h = loiXemNhap(ulid)
  if (!h) return json(res, 404, { loi: `không có nháp ${ulid}` })
  // T08-29 · `da_bo` là MỘT CHIỀU (`FR-057 §2`). Sửa một bản đã bỏ là đưa nó
  // về `da_sua`, tức hồi sinh nó bằng một nút — mà "dùng lại" là một quyết
  // định mới và nó cần một FR nói ra.
  if (h.trang_thai === DA_BO) return json(res, 409, { loi: LOI_DA_BO })
  loiSuaNhap(ulid, b.ban_hien_tai)
  loiDoiTrangThaiNhap(ulid, "da_sua")
  return json(res, 200, { job_ulid: ulid, trang_thai: "da_sua" })
}

/* ═══ POST …/tra-lai — bắt kèm `ly_do` ═══════════════════════════════════
 *
 * Trần 5 ký tự, cùng khuôn `reject_reason` của cửa Loại bài (`FR-033`): một
 * chữ "sai" không nói được vì sao sai, và người trả lại lần sau sẽ không biết
 * lần trước vướng gì — cùng loại nháp quay lại.
 *
 * Ràng này sống ở CỬA chứ không ở DDL vì `ly_do` chỉ bắt buộc cho MỘT trong
 * bốn trạng thái; một cột `NOT NULL` sẽ bị điền chuỗi rỗng cho đủ, và chuỗi
 * rỗng là một lý do KHÔNG đọc được.
 */
const TOI_THIEU_LY_DO = 5

/* ═══ POST …/bo — BỎ một bản nháp (FR-057) ═══════════════════════════════
 *
 * **Bỏ ≠ xoá.** Hàng CÒN, `ban_goc_ai` CÒN. Ba lý do (`FR-057 §1`):
 *   · `ban_goc_ai` tốn token model để tạo, và là thứ duy nhất trả lời
 *     *"người đã sửa những gì"* — `FR-046 §1` gọi nó **bất biến**;
 *   · `rule.md` mục 4 cấm agent tự xoá dữ liệu, và một cửa HTTP xoá hàng là
 *     đúng thứ đó khoác áo API;
 *   · `audit_loi` ghi *"ai bỏ"* — một dòng vết trỏ vào hàng đã biến mất là
 *     một vết vô nghĩa.
 *
 * HAI ca 409, mỗi ca một lý do khác nhau:
 *   · `da_duyet` — file đã nằm trong `kb/`. Bỏ hàng nháp KHÔNG gỡ file ra, và
 *     để hai thứ lệch nhau là dựng hai nguồn chân lý (`B-C1`). Gỡ một bài khỏi
 *     kho là đường khác (thùng rác của kho).
 *   · `da_bo` — một chiều. Không đi tiếp, và không bỏ lại.
 */
const DA_BO = "da_bo"
const LOI_DA_BO = "bản này đã bỏ — `da_bo` là một chiều; dùng lại là một quyết " +
  "định mới, và nó cần một FR nói ra"
const LOI_DA_DUYET = "bản đã duyệt KHÔNG bỏ được — file đã nằm trong kho, và bỏ " +
  "hàng nháp không gỡ file ra. Gỡ một bài khỏi kho là đường khác"

export async function cuaBoNhap(req, res, ulid) {
  const b = await thanJson(req, res)
  if (!b) return
  const ly = typeof b.ly_do === "string" ? b.ly_do.trim() : ""
  if (ly.length < TOI_THIEU_LY_DO) {
    return json(res, 422, {
      loi: `bỏ phải kèm \`ly_do\` ≥ ${TOI_THIEU_LY_DO} ký tự — bỏ mà không nói ` +
        "vì sao là mất câu duy nhất người sau cần đọc",
    })
  }
  const h = loiXemNhap(ulid)
  if (!h) return json(res, 404, { loi: `không có nháp ${ulid}` })
  if (h.trang_thai === DA_BO) return json(res, 409, { loi: LOI_DA_BO })
  if (h.trang_thai === "da_duyet") return json(res, 409, { loi: LOI_DA_DUYET })
  loiDoiTrangThaiNhap(ulid, DA_BO, ly)
  loiGhiAudit({ hanh_dong: "bo-nhap", doi_tuong: ulid, ok: true })
  return json(res, 200, { job_ulid: ulid, trang_thai: DA_BO, ly_do: ly })
}

export async function cuaTraLaiNhap(req, res, ulid) {
  const b = await thanJson(req, res)
  if (!b) return
  const ly = typeof b.ly_do === "string" ? b.ly_do.trim() : ""
  if (ly.length < TOI_THIEU_LY_DO) {
    return json(res, 422, {
      loi: `trả lại phải kèm \`ly_do\` ≥ ${TOI_THIEU_LY_DO} ký tự — ` +
        "không lý do thì cùng loại nháp sẽ quay lại",
    })
  }
  if (!loiXemNhap(ulid)) return json(res, 404, { loi: `không có nháp ${ulid}` })
  loiDoiTrangThaiNhap(ulid, "tra_lai", ly)
  loiGhiAudit({ hanh_dong: "tra-lai-nhap", doi_tuong: ulid, ok: true })
  return json(res, 200, { job_ulid: ulid, trang_thai: "tra_lai", ly_do: ly })
}

/* ═══ POST …/duyet — validate PASS MỚI ghi FILE ══════════════════════════
 *
 * THỨ TỰ LÀ CẢ LUẬT: validate trước, đổi trạng thái sau.
 *
 * Cửa đổi `trang_thai='da_duyet'` rồi mới validate sẽ để lại một hàng nói "đã
 * duyệt" trong khi kho KHÔNG có file — hai nguồn chân lý, và nguồn sai là
 * nguồn người đọc trước.
 *
 * Dùng lại `ghiSauValidate()` của `dungchung.mjs`, KHÔNG dựng đường ghi thứ
 * hai: `B-C1` cho `kb/` đúng MỘT cửa ghi, và một cửa thứ hai là chỗ luật
 * `--strict` bị bỏ quên.
 *
 * ⚠️ `da_duyet` KHÔNG nghĩa "review_status = approved". Nó nói vòng đời của
 * BẢN NHÁP; từ giây file vào `kb/`, **file là chân lý** (`FR-046 §1` · `B-C1`)
 * và bảng nháp chỉ còn là lịch sử. `review_status` của bảng này vẫn `draft`,
 * cưỡng chế bằng `CHECK` hằng ở DDL.
 */
export async function cuaDuyetNhap(req, res, ulid) {
  const b = await thanJson(req, res)
  if (!b) return
  const h = loiXemNhap(ulid)
  if (!h) return json(res, 404, { loi: `không có nháp ${ulid}` })

  const t = tachFm(h.ban_hien_tai)
  if (!t) return json(res, 422, { loi: "bản nháp không có frontmatter `---`" })
  const fm = t.fm, type = fm.source_type, slug = fm.slug
  if (!LOAI.includes(type)) {
    return json(res, 422, { loi: `source_type phải thuộc: ${LOAI.join(", ")}` })
  }
  if (!laSlug(slug)) return json(res, 422, { loi: "slug phải khớp [a-z0-9]+(-[a-z0-9]+)*" })

  return tuanTu(async () => {
    /*
     * WO-093 · Kho đã có bản này ⇒ THAY nếu nó là bản MÁY, chặn nếu là bản NGƯỜI.
     *
     * Chủ dự án 2026-09-10 bỏ vòng duyệt: chưng cất xong là vào kho, và *"khi
     * có bản mới thì bản cũ bị ẩn đi"*. Bản chưng cất luôn mang slug
     * `phan-tich-<ten>`, nên chạy lại lần hai là đụng chính nó — mà "chạy lại"
     * CHÍNH LÀ cách người dùng nói *tôi không ưng, làm lại*.
     *
     * GIỚI HẠN, và đây là vế nặng nhất của WO: chỉ thay khi bản đang nằm đó
     * mang `origin: pipeline`. Một bản `manual` — người đã sửa tay — thì 409
     * giữ nguyên. Không được để một lượt chạy tự động ghi đè công người viết,
     * im lặng, và không cổng nào khác canh.
     *
     * `donBanCu()` ở cuối hàm lo phần đẩy bản cũ vào rác; ở đây chỉ gỡ chốt.
     */
    const dangCo = docBai(type, slug)
    if (dangCo) {
      const oGoc = String(dangCo.fm?.origin ?? dangCo.frontmatter?.origin ?? "")
      if (oGoc !== "pipeline") {
        return json(res, 409, { loi: `kho đã có ${type}/${slug}.md — sửa bài đó, đừng duyệt nháp thành bản thứ hai` })
      }
    }
    const kq = await ghiSauValidate(fm, t.body ?? "", type, slug)
    // Trượt ⇒ TRẢ NGUYÊN VĂN lỗi từng cổng, và nháp GIỮ NGUYÊN trạng thái.
    // Một mã 422 trần bắt người duyệt đi đoán; `loi_validate` cho họ đúng dòng.
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    loiDoiTrangThaiNhap(ulid, "da_duyet")
    loiGhiAudit({ hanh_dong: "duyet-nhap-vao-kho", doi_tuong: `${type}/${slug}`, ok: true })
    // SAU khi bản mới đã chắc chắn trong kho — không trước.
    const daDon = await donBanCu(type, slug, fm)
    return json(res, 200, {
      job_ulid: ulid, trang_thai: "da_duyet",
      path: `${type}/${slug}.md`, etag: kq.etag,
      ban_cu_vao_rac: daDon,
    })
  })
}
