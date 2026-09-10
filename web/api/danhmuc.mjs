/**
 * M08_api — danh mục nhãn (FR-019 mở, FR-021 sửa/xoá, FR-034 đảo nguồn).
 *
 * FR-034: chân lý danh mục là BẢNG `concepts`/`categories` trong kb/_kho.sqlite;
 * hai file yaml là export dẫn xuất. Đường ghi-schema-kép của FR-019
 * (ghiHopDong/khoVaSchemaLech/kyLaiBaseline + check_danh_muc chạy-sau-ghi +
 * rollback tay) CHẾT theo enum — chỗ FR-019 tự khai là yếu nhất đã được nhổ
 * tận gốc thay vì vá.
 *
 * Răng CÒN NGUYÊN: (M08-R3) người khai nhãn — id/label_vi/gom bắt buộc, máy
 * không sinh tên; (M02-R3) trùng id/alias 409, không đổi id, không xoá nhãn
 * đang có bài dùng; audit_log chỉ-nối-thêm thay _nhat-ky (trigger DB cấm
 * sửa/xoá — răng cứng hơn appendFileSync).
 */
import { suaLoaiNguon } from "./dungchung.mjs"
import {
  demSoBai, docBody, ghiNhatKyDanhMuc, json, khoDoc, laSlug, suaDanhMuc,
  themVaoDanhMuc, tuanTu,
} from "./dungchung.mjs"

/** Đọc body JSON — khuôn status.mjs. */
async function docP(req, res) {
  let p
  try { p = JSON.parse((await docBody(req)).toString("utf8")) } catch {
    json(res, 400, { loi: "Body phải là JSON." }); return null
  }
  if (!p || typeof p !== "object") { json(res, 400, { loi: "Body phải là JSON object." }); return null }
  return p
}

/**
 * POST /api/concepts — thêm một khái niệm.
 * 3 răng: slug hợp lệ · label_vi do NGƯỜI khai (M08-R3, không default) · chưa
 * tồn tại kể cả trùng alias (trong themVaoDanhMuc). FR-033: tạo là chính thức.
 */
export async function themKhaiNiem(req, res) {
  const p = await docP(req, res)
  if (!p) return
  return tuanTu(async () => {
    const id = String(p?.id ?? "").trim()
    const label = String(p?.label_vi ?? "").trim()

    const thieu = []
    if (!laSlug(id)) thieu.push("id (kebab-case: chữ thường, số, gạch ngang)")
    if (label.length < 2) thieu.push("label_vi (nhãn tiếng Việt — máy không đặt hộ)")
    if (thieu.length) return json(res, 422, { loi: "Thêm khái niệm cần NGƯỜI khai:", thieu })

    const kq = await themVaoDanhMuc("concepts.yaml", {
      id, label_vi: label,
      aliases: Array.isArray(p.aliases) ? p.aliases.filter(laSlug) : [],
    })
    if (!kq.ok) return json(res, kq.ma ?? 500, { loi: kq.loi })

    await ghiNhatKyDanhMuc("concepts", "THEM", id, { label_vi: label })
    return json(res, 200, {
      id, so_muc: kq.so_muc,
      ghi_chu: "Bài đang dùng nhãn này ở `concepts_proposed` cần chuyển sang `concepts` — sửa từng bài.",
    })
  })
}

/**
 * POST /api/categories — thêm một chủ đề.
 *
 * FR-034 làm đường này ĐƠN GIẢN BẰNG đường concepts: chỉ còn INSERT một bảng.
 * Trước nó phải ghi 3 file (yaml + 2 bản schema frozen) với rollback tay và
 * cổng check_danh_muc chạy-sau-ghi — FR-019 gọi thẳng đó là chỗ yếu nhất.
 * Răng người-khai giữ: đòi thêm `gom` (ranh giới mảng) vì chủ đề không có
 * đường đề-xuất-trước như concepts_proposed.
 */
export async function themChuDe(req, res) {
  const p = await docP(req, res)
  if (!p) return
  return tuanTu(async () => {
    const id = String(p?.id ?? "").trim()
    const label = String(p?.label_vi ?? "").trim()
    const gom = String(p?.gom ?? "").trim()

    const thieu = []
    if (!laSlug(id)) thieu.push("id (kebab-case)")
    if (label.length < 2) thieu.push("label_vi (nhãn tiếng Việt)")
    if (gom.length < 4) thieu.push("gom (ranh giới mảng này — để phân biệt với mảng khác)")
    if (thieu.length) return json(res, 422, { loi: "Thêm chủ đề cần NGƯỜI khai:", thieu })

    const kq = await themVaoDanhMuc("categories.yaml", { id, label_vi: label, gom })
    if (!kq.ok) return json(res, kq.ma ?? 500, { loi: kq.loi })

    await ghiNhatKyDanhMuc("categories", "THEM", id, { label_vi: label, gom })
    return json(res, 200, { id, so_muc: kq.so_muc })
  })
}

/**
 * Đếm bài đang dùng một nhãn ở trường `concepts` / `category` (KHÔNG phải đề xuất).
 *
 * Con số này QUYẾT ĐỊNH xoá được nhãn hay không (M02-R3: xoá nhãn đang có bài
 * dùng ⇒ bài trỏ vào nhãn không tồn tại, validate chặn MỌI lần ghi bài đó sau
 * này). Đọc cùng cửa với mọi con số khác — `khoDoc()` (giờ là SELECT DB).
 *
 * ⚠️ ĐỪNG hợp nhất với `demDaDuyet()` ở `articles.mjs` (FR-028). Trông giống
 * nhau, trả lời hai câu khác nhau:
 *   demDangDung  MỌI trạng thái  "có bài nào TRỎ VÀO nhãn này không?"
 *   demDaDuyet   chỉ approved    "nhãn này ĐƯỢC DÙNG TỐT chưa?"
 */
function demDangDung(truong, id) {
  return baiDangDung(truong, id).length
}

/** FR-031 · CHÍNH những bài nào đang dùng nhãn — người ép xoá cần biết mình
 *  vừa làm hỏng bài NÀO, "3 bài" không cho họ đường đi tiếp. */
function baiDangDung(truong, id) {
  const ds = []
  for (const b of khoDoc()) {
    const v = b.fm?.[truong]
    if (Array.isArray(v) && v.includes(id)) ds.push(`${b.type}/${b.slug}`)
  }
  return ds
}

const TEP = { cpt: "concepts.yaml", cat: "categories.yaml" }
const TRUONG = { cpt: "concepts", cat: "category" }

/**
 * PATCH /api/{concepts,categories}/:id — FR-021, sửa NHÃN HIỂN THỊ.
 * KHÔNG cho đổi `id`: đó là thứ bài viết trỏ vào (validate so `id`, không so
 * label). `label_vi`/`gom` chỉ để hiển thị. aliases CHỈ THÊM.
 */
/**
 * PATCH /api/loai-nguon/:id — doi CHU HIEN THI cua mot loai nguon (WO-019).
 *
 * Chi `label_vi`. `module` den tu PHEP SUY (`nguonCua`), khong tu nguoi go:
 * gan `pdf` sang `video` thi man Video liet ke mot dinh dang khong video nao
 * co, va facet noi sai ve chinh ban ghi.
 *
 * Khong co POST/DELETE: danh sach den tu schema va whitelist. Them mot loai
 * ma DDL khong biet la hua thu `CHECK` se tu choi; xoa mot loai con ban ghi
 * dung la lam facet mat mot nhom.
 */
export async function suaLoaiNguonHttp(req, res, id) {
  const p = await docP(req, res)
  if (!p) return
  return tuanTu(async () => {
    if (p.module !== undefined) {
      return json(res, 400, {
        loi: "Khong doi duoc `module` — do la thu phep suy quyet.",
        cach_sua: "Chi gui `label_vi`.",
      })
    }
    const nhan = String(p.label_vi ?? "").trim()
    if (!nhan) {
      return json(res, 422, {
        loi: "Khong co gi de sua — gui `label_vi`.",
      })
    }
    if (!(await suaLoaiNguon(id, nhan))) {
      return json(res, 404, { loi: `Khong co loai nguon \`${id}\`.` })
    }
    await ghiNhatKyDanhMuc("loai_nguon", "SUA", id, { da_sua: ["label_vi"] })
    return json(res, 200, { id, da_sua: ["label_vi"] })
  })
}

export async function suaNhan(req, res, loai, id) {
  const p = await docP(req, res)
  if (!p) return
  return tuanTu(async () => {
    if (p.id !== undefined && p.id !== id) {
      return json(res, 400, {
        loi: "Không đổi được `id` — bài viết trỏ vào nó.",
        cach_sua: "Thêm nhãn mới, sửa từng bài sang nhãn đó, rồi xoá nhãn cũ.",
      })
    }
    const co = ["label_vi", "gom"].filter((k) => typeof p[k] === "string" && p[k].trim())
    const themAlias = Array.isArray(p.aliases) ? p.aliases.filter(laSlug) : []
    if (!co.length && !themAlias.length) {
      return json(res, 422, { loi: "Không có gì để sửa (label_vi, gom, hoặc aliases)." })
    }

    const kq = await suaDanhMuc(TEP[loai], (ds) => {
      const m = ds.find((c) => c?.id === id)
      if (!m) return { loi: `Không có \`${id}\` trong ${TEP[loai]}.`, ma: 404 }
      for (const k of co) m[k] = p[k].trim()
      // aliases CHỈ THÊM: gỡ một alias là mất một đường tra cứu người khác đang dùng.
      if (themAlias.length) {
        const cu = Array.isArray(m.aliases) ? m.aliases : []
        m.aliases = [...new Set([...cu, ...themAlias])]
      }
      return { ds }
    })
    if (!kq.ok) return json(res, kq.ma ?? 500, { loi: kq.loi })

    await ghiNhatKyDanhMuc(loai === "cpt" ? "concepts" : "categories", "SUA", id,
      { da_sua: co, them_alias: themAlias })
    return json(res, 200, { id, da_sua: co })
  })
}

/**
 * DELETE /api/{concepts,categories}/:id — FR-021, xoá nhãn.
 *
 * Server TỰ ĐẾM, không tin client. Nhãn còn bài dùng → 409 kèm số VÀ danh
 * sách bài; `?force=1` (FR-031) xoá và ĐỂ NGUYÊN bài trỏ vào — hệ quả thật:
 * validate chặn mọi lần ghi những bài đó về sau, nên đáp trả PHẢI mang
 * `gay_hong`. Guard "kho rỗng ⇒ 409" giữ nguyên và giờ CHÍNH XÁC tuyệt đối:
 * đếm trên DB, không còn cửa sổ index async (FR-034 xoá luôn lý do cũ phải
 * đọc đĩa).
 */
export async function xoaNhan(req, res, loai, id, u) {
  const ep = u?.searchParams.get("force") === "1"
  return tuanTu(async () => {
    const soBai = demSoBai()
    if (soBai === 0) {
      return json(res, 409, {
        loi: "Kho chưa có bài nào — không đếm được nhãn nào đang dùng, nên không xoá được nhãn nào.",
        cach_sua: "Nạp bài trước. Xoá lúc kho rỗng thì mọi nhãn đều 'không ai dùng'.",
      })
    }

    const dungBoi = baiDangDung(TRUONG[loai], id)
    if (dungBoi.length > 0 && !ep) {
      return json(res, 409, {
        loi: `\`${id}\` đang được ${dungBoi.length} bài dùng — xoá là bài đó trỏ vào nhãn không tồn tại.`,
        cach_sua: "Sửa từng bài sang nhãn khác trước, rồi xoá. "
          + "Hoặc thêm `?force=1` để xoá luôn — các bài đó sẽ không ghi lại được.",
        dang_dung: dungBoi.length,
        bai: dungBoi,
      })
    }

    const kq = await suaDanhMuc(TEP[loai], (ds) => {
      if (!ds.some((c) => c?.id === id)) return { loi: `Không có \`${id}\`.`, ma: 404 }
      return { ds: ds.filter((c) => c?.id !== id) }
    })
    if (!kq.ok) return json(res, kq.ma ?? 500, { loi: kq.loi })

    await ghiNhatKyDanhMuc(loai === "cpt" ? "concepts" : "categories",
      dungBoi.length ? "EP-XOA" : "XOA", id,
      dungBoi.length ? { gay_hong: dungBoi } : null)
    return json(res, 200, {
      id, so_muc: kq.so_muc,
      ...(dungBoi.length ? { ep: true, gay_hong: dungBoi } : {}),
    })
  })
}
