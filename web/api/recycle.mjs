/**
 * M08_api — thùng rác (FR-011, M08-R4).
 *
 * DELETE không bao giờ unlink: file rename sang `_recycle/<type>/` giữ nguyên
 * byte. `_recycle/` nằm NGOÀI kho và ngoài input build — bài xoá biến khỏi web
 * ngay, dữ liệu còn nguyên, restore là thao tác thuận nghịch nên máy làm được.
 * Mọi lời gọi fs sống ở dungchung.mjs — file này chỉ điều phối.
 */
import { chuyenSangRac, docBai, json, phucHoi, quetRac, tuanTu } from "./dungchung.mjs"

export function xoaBai(req, res, type, slug) {
  return tuanTu(async () => {
    const cu = docBai(type, slug)
    if (!cu) return json(res, 404, { loi: "Không có bài này." })

    const im = req.headers["if-match"]
    if (!im) return json(res, 400, { loi: "Thiếu header If-Match (lấy etag từ GET)." })
    if (im !== cu.etag) return json(res, 412, { loi: "Bài đã đổi ở nơi khác — GET lại trước." })

    const stt = await chuyenSangRac(type, slug)
    if (stt == null) return json(res, 404, { loi: "Không có bài này." })
    return json(res, 200, {
      // FR-034: rác là bảng `recycle`; đường file là EXPORT của hàng đó.
      recycle_path: `${type}/${slug}.${stt}.md`,
      ghi_chu: "Không xoá thật — restore được qua POST .../restore.",
    })
  })
}

export function danhSachRac(req, res) {
  return json(res, 200, { items: quetRac() })
}

/**
 * POST .../restore — trả bài từ rác về kho.
 *
 * FR-031 · body tuỳ chọn `{ slug_moi }` để khôi phục DƯỚI TÊN KHÁC khi kho đã
 * có bài cùng tên. Không có body vẫn chạy như cũ (giữ nguyên byte) — đường cũ
 * là đường mặc định, tên mới là ngoại lệ người dùng phải nói ra.
 */
export function khoiPhuc(req, res, type, slug) {
  return tuanTu(async () => {
    // Body RỖNG là hợp lệ, nên không dùng `docP` (nó 400 khi body không phải
    // JSON). Đọc thẳng, và không đọc được thì coi như không có tên mới.
    let slugMoi = null
    const tho = await new Promise((tra) => {
      let s = ""
      req.on("data", (d) => { s += d; if (s.length > 4096) req.destroy() })
      req.on("end", () => tra(s))
      req.on("error", () => tra(""))
    })
    if (tho.trim()) {
      try {
        const v = JSON.parse(tho)?.slug_moi
        if (typeof v === "string" && v.trim()) slugMoi = v.trim()
      } catch { /* không phải JSON ⇒ khôi phục tên cũ */ }
    }

    const kq = await phucHoi(type, slug, slugMoi)
    if (kq.ma !== 200) {
      return json(res, kq.ma, { loi: kq.loi, ...(kq.trung ? { trung: kq.trung } : {}) })
    }
    return json(res, 200, {
      path: `${type}/${kq.slug}.md`, etag: kq.etag,
      ...(slugMoi ? { doi_ten: { tu: slug, sang: kq.slug } } : {}),
    })
  })
}
