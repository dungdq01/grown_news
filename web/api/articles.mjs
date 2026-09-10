/**
 * M08_api — đọc danh sách/chi tiết + tạo + sửa (FR-011).
 *
 * KHÔNG có lời gọi fs ghi nào ở đây — mọi ghi đi qua dungchung.ghiSauValidate
 * (api-guard.test.js canh). Trường server-quyết bị LỘT khỏi payload (M08-R5):
 * client không đặt được review_status/origin, không đổi được id/slug/source_type.
 */
import {
  docBai, docBody, docBodyMedia, docDanhMucDb, docHienVat, ghiSauValidate,
  hienVatPhucVu, json, khoDoc, laSlug, loaiCuaNhom, LOAI, loiKiemKhoaDichVu,
  luuHienVat, NHOM, TRAN_MEDIA, tuanTu, hienVat, ghiKieuMoc, shaTheoKieuMoc,
} from "./dungchung.mjs"
import { congLoai, congNhom } from "./cong-module.mjs"
import { xepViecThumbnail } from "./tho-cua.mjs"

/**
 * `?nhom=` → tập `source_type`, hoặc một lời lỗi (FR-038/C4).
 *
 * Trả `{ loai }` khi hợp lệ (`undefined` = không lọc) · `{ loi }` khi nhóm lạ.
 *
 * NHÓM LẠ ⇒ 400, KHÔNG PHẢI 200 RỖNG. Một danh sách rỗng không phân biệt được với
 * "kho chưa có gì", nên một lỗi chính tả ở FE thành "màn Video trống mãi mãi" mà
 * không ai báo. Cùng lớp lỗi `bangCua()` chọn NÉM thay vì rơi về bảng mặc định.
 *
 * `?nhom=` RỖNG là "không lọc", không phải nhóm lạ: FE dựng query bằng cách ghép
 * chuỗi, và một biến chưa gán thành `?nhom=` — chặn nó bằng 400 là biến một trạng
 * thái vô hại thành lỗi người dùng thấy.
 */
function locNhom(u) {
  const ten = u?.searchParams?.get("nhom")
  if (!ten) return { loai: undefined }
  const loai = loaiCuaNhom(ten)
  if (!loai) {
    return { loi: `nhom lạ: ${ten} — hợp lệ: ${NHOM.join(" · ")}` }
  }
  return { loai }
}

/**
 * Trường trả về cho thẻ danh sách — đủ để lọc và vẽ, không kèm body.
 *
 * `fm` và `etag` đến từ `khoDoc()` — cột trong DB (FR-034). Etag là
 * version+hash lưu sẵn lúc ghi: không còn chuyện "sửa file bằng editor ngoài"
 * vì file giờ là export, editor ngoài không phải đường ghi hợp lệ.
 */
function theBai(r) {
  const fm = r.fm
  if (!fm) return null
  return {
    id: fm.id, slug: r.slug, source_type: r.type,
    title: fm.title ?? null, one_liner: fm.one_liner ?? "",
    review_status: fm.review_status, origin: fm.origin,
    category: fm.category ?? [], concepts: fm.concepts ?? [],
    analyzed_at: fm.analyzed_at ?? null, url: fm.url ?? null,
    word_count: fm.word_count ?? null, credibility_max: fm.credibility_max ?? null,
    /*
     * FR-038/C4 · BUILDER HÌNH DẠNG THỨ TƯ, và hai trường này thiếu ở đây.
     *
     * `banTuDb` · `docTuDia` (B7a) và `chiMucMo` (B8b) đã mang `ho_so`+`media`.
     * Đây là bản còn lại — thẻ danh sách. Thiếu nó thì màn Tài liệu không phân
     * biệt được bản có hiện vật với bản không, và CRUD tại chỗ (C7) phải gọi
     * thêm một request nữa chỉ để biết một thẻ là tài liệu hay bài viết.
     *
     * Mặc định giữ ĐÚNG như ba builder kia: vắng `ho_so` là `phan-tich`, vắng
     * `media` là `null` (KHÔNG `undefined`) — một hình dạng ổn định là thứ FE
     * kiểm được bằng MỘT phép thử.
     */
    ho_so: String(fm.ho_so ?? "phan-tich"),
    // FR-052 · `media` là MẢNG. Bản đầu ở đây CHỦ ĐỘNG chặn mảng
    // (`!Array.isArray(...) ? fm.media : null`), nên đổi schema mà quên
    // dòng này là `media` thành `null` IM LẶNG trên mọi bản ghi —
    // không lỗi, không cảnh báo, chỉ là hiện vật biến mất khỏi API.
    media: hienVat(fm).length ? hienVat(fm) : null,
    // FR-067 · `nguon` là TRƯỜNG NHẬN DIỆN — bản chưng cất này sinh từ bản ghi
    // nào. Vắng ⇒ `[]`, KHÔNG `undefined`: cùng lý lẽ `ho_so`/`media` ở trên,
    // *một hình dạng ổn định là thứ FE kiểm được bằng MỘT phép thử*.
    // Không lọc, không chuẩn hoá — khuôn slug đã có chủ ở schema; sửa lại ở cửa
    // là dựng bản thứ hai của một luật đã có.
    nguon: Array.isArray(fm.nguon) ? fm.nguon : [],
    etag: r.etag,
  }
}

/**
 * GET /api/index — thay `static/open-index.json` khi API sống (FR-024, GĐ 1).
 *
 * VÌ SAO CẦN: `open-index.json` chỉ sinh lúc BUILD, nên sửa một bài rồi F5 vẫn
 * thấy bản cũ — người dùng phải `npm run build` sau mỗi thay đổi. Endpoint này
 * trả ĐÚNG hình dạng đó từ đĩa, đọc lúc request.
 *
 * Gộp theo `url_normalized` — cùng luật M03-R5 mà emitter dùng
 * (`home-pages/index.ts:432-445`): nhiều bản phân tích một nguồn hiện thành MỘT
 * bài, không thổi phồng số lượng. Sắp theo `priority` giảm dần rồi ngày.
 *
 * Gồm MỌI `review_status` + thân bài: màn Tất cả và Chờ duyệt là màn QUẢN LÝ,
 * đọc nội dung bản draft chính là việc người duyệt cần làm. Đây KHÔNG phải
 * đường lên trang công bố — `approved-only` (filter Quartz) vẫn là răng của
 * M03-R1, và nó chạy ở tầng build, không đụng endpoint này.
 */
export function chiMucMo(req, res, u) {
  const loc = locNhom(u)
  if (loc.loi) return json(res, 400, { error: loc.loi })
  const nhom = new Map()
  for (const r of khoDoc(loc.loai)) {
    const fm = r.fm
    // priority = max trong skill_candidates — cùng phép tính emitter dùng
    // (index.ts:125-126). Không có ứng viên nào ⇒ 0.
    const uv = Array.isArray(fm.skill_candidates) ? fm.skill_candidates : []
    const priority = uv.reduce(
      (mx, c) => Math.max(mx, typeof c?.priority === "number" ? c.priority : 0), 0)
    // `slug` PHẢI có tiền tố loại — `docs/ai-agent…`, không phải `ai-agent…`.
    //
    // BUG THẬT (FR-024 làm vỡ, người dùng báo "duyệt, loại, sửa, bỏ đều không
    // hoạt động"): emitter đặt `slug` = đường dẫn tương đối trong kho
    // (`index.ts:144`), nên FE dựng URL thẳng `"/api/articles/" + ban.slug` ở
    // cả bốn chỗ sửa đổi (multiwindow.inline.ts:1196·1289·1323·2249). Endpoint
    // này trả `r.slug` trần ⇒ URL còn 3 đoạn ⇒ `router.mjs` đòi >= 4 đoạn nên
    // rơi xuống 404 ⇒ mọi nút báo "Không đọc được bài từ API."
    //
    // Hai nguồn cùng nuôi một hàm `nap()` thì hình dạng phải khớp, không phải
    // "gần giống". `api-index-khong-can-build.test.js` mục 6 đi lại đúng đường
    // FE đi: lấy từng slug của endpoint này rồi GET nó, đỏ nếu không 200.
    const ban = {
      slug: `${r.type}/${r.slug}`, id: fm.id ?? "", title: fm.title ?? r.slug,
      nguon: Array.isArray(fm.nguon) ? fm.nguon : [],   // FR-067
      url_normalized: fm.url_normalized ?? "", priority,
      credibility_max: fm.credibility_max ?? "", origin: fm.origin ?? "",
      source_type: r.type, review_status: fm.review_status ?? "",
      analyzed_at: fm.analyzed_at ?? "", one_liner: fm.one_liner ?? "",
      category: fm.category ?? [], concepts: fm.concepts ?? [],
      /*
       * FR-038/C4 · TRUONG THU BA thieu o day, tim ra bang cong bon-builder.
       *
       * `banTuDb:156` va `docTuDia:255` deu tra `concepts_proposed`; builder nay
       * KHONG. He qua dung lop loi B8b da ke duoi day: cua so doc lay `BAI` tu
       * `/mock/static/open-index.json` (dung tu `data.mjs`) HOAC tu day, nen
       * truong nay CO tren ban mock va `undefined` tren kho THAT.
       */
      concepts_proposed: Array.isArray(fm.concepts_proposed)
        ? fm.concepts_proposed.map(String).filter(Boolean) : [],
      /*
       * FR-036/B8b · HAI TRUONG NAY THIEU O DAY LA MOT BUG DA DO.
       *
       * Cua so doc lay `BAI` tu HAI cho: ban mock doc
       * `/mock/static/open-index.json` (dung tu `data.mjs`), ban THAT doc
       * `/api/index` — tuc tu day. Day la danh sach truong GO TAY THU BA,
       * ngoai `banTuDb` va `docTuDia` cua `data.mjs`.
       *
       * B7a them `ho_so`+`media` vao HAI builder kia, va
       * `hai-ban-shape.test.js` canh hai ben do khop nhau. No KHONG biet
       * builder thu ba. He qua: xem truoc hien vat chay tren ban `/mock/` va
       * IM LANG khong chay tren kho that.
       *
       * Mac dinh giu DUNG nhu `data.mjs`: vang `ho_so` la `phan-tich`, vang
       * `media` la `null` (khong `undefined`) — mot hinh dang on dinh la thu FE
       * kiem duoc bang MOT phep thu.
       */
      ho_so: String(fm.ho_so ?? "phan-tich"),
      // FR-052 · `media` là MẢNG. Bản đầu ở đây CHỦ ĐỘNG chặn mảng
      // (`!Array.isArray(...) ? fm.media : null`), nên đổi schema mà quên
      // dòng này là `media` thành `null` IM LẶNG trên mọi bản ghi —
      // không lỗi, không cảnh báo, chỉ là hiện vật biến mất khỏi API.
      media: hienVat(fm).length ? hienVat(fm) : null,
      than: r.than.trim(),
    }
    // Gộp theo LỜI KHAI `fm.url_normalized`, KHÔNG theo cột tính lại của index
    // — dù cột đó "đúng hơn". Lý do: hai đường đọc (index / đĩa) phải trả CÙNG
    // kết quả, nếu không thì tắt index là màn hình đổi nội dung. Cổng 9 của
    // validate.py (`validate.py:233`) canh lời khai khớp hàm tính; chỗ nó CHƯA
    // canh là khi trường vắng hẳn — đã ghi vào phần nợ của worklog.
    const khoa = ban.url_normalized || ban.slug
    const co = nhom.get(khoa)
    if (co) {
      co.bans.push(ban)
      if (priority > co.priority) co.priority = priority
    } else {
      nhom.set(khoa, { url_normalized: khoa, priority, bans: [ban] })
    }
  }
  const articles = [...nhom.values()].sort((a, b) =>
    b.priority - a.priority ||
    (b.bans[0]?.analyzed_at ?? "").localeCompare(a.bans[0]?.analyzed_at ?? ""))
  return json(res, 200, { total: articles.length, articles })
}

export function danhSach(req, res, u) {
  const q = u.searchParams
  // `?nhom=` cùng lúc với `?type=`: `type` lọc MỘT loại, còn nhóm `bai-viet` gồm
  // NĂM loại. Không có nó thì FE phải gõ tay danh sách năm loại — tầng thứ hai
  // gõ tay đúng thứ `loai-nguon.json` sinh ra để dẹp.
  const nh = locNhom(u)
  if (nh.loi) return json(res, 400, { error: nh.loi })
  const loc = {
    status: q.get("status"), type: q.get("type"),
    category: q.get("category"), concept: q.get("concept"),
    tim: (q.get("q") ?? "").toLowerCase().trim(),
  }
  let ds = khoDoc(nh.loai).map(theBai).filter(Boolean)
  if (loc.status) ds = ds.filter((b) => b.review_status === loc.status)
  if (loc.type) ds = ds.filter((b) => b.source_type === loc.type)
  if (loc.category) ds = ds.filter((b) => (b.category ?? []).includes(loc.category))
  if (loc.concept) ds = ds.filter((b) => (b.concepts ?? []).includes(loc.concept))
  if (loc.tim) ds = ds.filter((b) =>
    `${b.title ?? ""} ${b.one_liner} ${b.slug}`.toLowerCase().includes(loc.tim))
  ds.sort((a, b) => String(b.analyzed_at).localeCompare(String(a.analyzed_at)))

  const perPage = Math.min(Math.max(Number(q.get("per_page")) || 50, 1), 200)
  const page = Math.max(Number(q.get("page")) || 1, 1)
  return json(res, 200, {
    items: ds.slice((page - 1) * perPage, page * perPage),
    total: ds.length, page, per_page: perPage,
  })
}

/**
 * Đếm bài ĐÃ DUYỆT dùng mỗi nhãn của một trường (FR-028).
 *
 * ⚠️ CHỈ `approved` — và đó là ràng buộc, không phải lựa chọn tuỳ tiện. Emitter
 * đếm trên `appr` (`home-pages/index.ts:730-740`) vì màn Danh mục hỏi *"nhãn này
 * được dùng tốt chưa"*, mà chỉ bài đã duyệt mới lên web và mới vào hệ số kiểm
 * chứng chéo. Con số ở đây thay con số đó khi API sống, nên đếm khác đi là bật
 * API lên thì số trên màn NHẢY — đúng lớp lỗi M05-R3 chống.
 *
 * ⚠️ KHÔNG phải con số của `danhmuc.mjs:demDangDung`. Cái đó đếm MỌI trạng thái
 * vì nó trả lời câu khác — *"có bài nào trỏ vào nhãn này không"* — và là guard
 * chống xoá nhãn còn bài dùng. Đếm hẹp lại ở đó là xoá nhầm nhãn một bài draft
 * đang dùng, rồi validate chặn mọi lần ghi bài đó về sau. Hai câu hỏi, hai con
 * số, cùng một repo: `api-index-khong-can-build.test.js` mục 7 ghim cả hai.
 */
function demDaDuyet(truong) {
  const dem = Object.create(null)
  for (const r of khoDoc()) {
    if (r.fm?.review_status !== "approved") continue
    const v = r.fm?.[truong]
    if (!Array.isArray(v)) continue
    for (const x of v) dem[x] = (dem[x] ?? 0) + 1
  }
  return dem
}

/** Danh mục từ DB (FR-034) — kho chưa có DB ⇒ mảng rỗng, không 500:
 *  kho tạm của test và kho mới tinh đều hợp lệ. */
function docDanhMuc(ten) {
  return docDanhMucDb(ten === "concepts.yaml" ? "concepts" : "categories")
}

/**
 * Danh mục khái niệm — CHỈ ĐỌC. Hai người dùng, một cửa:
 *
 *  · form tạo bài chọn concept từ đây thay vì gõ tự do (M02-R3: danh mục đóng;
 *    gõ tự do đi vào `concepts_proposed`) — cần `id` + `label_vi`;
 *  · màn Danh mục dựng lại hàng nhãn từ đây thay vì dùng bản build (FR-028) —
 *    cần thêm `aliases` + `dang_dung`.
 *
 * Trả đủ cho cả hai chứ không tách endpoint thứ hai: một danh mục thì một cửa
 * đọc, và bên gọi tự lấy trường nó cần.
 */
/**
 * FR-031 · Phân trang cho HAI cửa đọc danh mục — và MẶC ĐỊNH LÀ KHÔNG PHÂN TRANG.
 *
 * Vì sao mặc định trả đủ, dù người dùng yêu cầu "thêm phân trang":
 *   `/nap/` vẽ MỘT checkbox cho MỖI nhãn (`#f-cat`, `#f-cpt`). Nếu cửa này mặc
 *   định cắt 20 mục thì form nạp bài lặng lẽ mất nhãn thứ 21 — người dùng không
 *   thấy lỗi, chỉ thấy nhãn "không có". Đó là mất chức năng, không phải phân trang.
 *
 * Nên: có `limit` thì cắt, không có thì trả hết. `tong` LUÔN có, để bên gọi biết
 * mình đang xem một phần của bao nhiêu — không có `tong` thì client phải đoán,
 * và cách đoán duy nhất là "còn nữa nếu đủ limit", vốn sai ở trang cuối.
 *
 * Giới hạn trên 500: một `limit=99999999` không được biến thành lệnh cấp phát.
 */
function catTrang(u, items) {
  const soNguyen = (ten, macDinh) => {
    const v = u.searchParams.get(ten)
    if (v === null || v === "") return macDinh
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 ? n : macDinh
  }
  const tong = items.length
  const offset = Math.min(soNguyen("offset", 0), tong)
  const limitTho = u.searchParams.get("limit")
  if (limitTho === null || limitTho === "") return { items, tong, offset: 0, limit: null }
  const limit = Math.min(soNguyen("limit", tong), 500)
  return { items: items.slice(offset, offset + limit), tong, offset, limit }
}

export function danhMucKhaiNiem(req, res, u) {
  const ds = docDanhMuc("concepts.yaml")
  if (!ds) return json(res, 200, { items: [], tong: 0, offset: 0, limit: null })
  const dem = demDaDuyet("concepts")
  return json(res, 200, catTrang(u, ds.map((c) => ({
    id: c.id, label_vi: c.label_vi ?? c.id,
    aliases: Array.isArray(c.aliases) ? c.aliases : [],
    dang_dung: dem[c.id] ?? 0,
  }))))
}

/** Danh mục chủ đề — CHỈ ĐỌC, cùng khuôn danhMucKhaiNiem.
 *  Khác một điểm bản chất: concepts.yaml là CHÂN LÝ của chính nó, còn
 *  categories.yaml là bản dẫn xuất của enum trong frontmatter.schema.json.
 *  Ở đây không phân biệt được — cả hai chỉ là file để đọc. Thứ giữ hai bên
 *  khớp nhau là check_danh_muc.py, không phải endpoint này.
 *
 *  `gom` thay chỗ `aliases`: chủ đề không có alias, nhưng có câu mô tả ranh giới
 *  mảng — và màn Danh mục in nó ra cạnh nhãn. */
export function danhMucChuDe(req, res, u) {
  const ds = docDanhMuc("categories.yaml")
  if (!ds) return json(res, 200, { items: [], tong: 0, offset: 0, limit: null })
  const dem = demDaDuyet("category")
  return json(res, 200, catTrang(u, ds.map((c) => ({
    id: c.id, label_vi: c.label_vi ?? c.id, gom: c.gom ?? "",
    dang_dung: dem[c.id] ?? 0,
  }))))
}

export function chiTiet(req, res, type, slug) {
  const bai = docBai(type, slug)
  if (!bai) return json(res, 404, { loi: "Không có bài này." })
  return json(res, 200, { frontmatter: bai.fm, body: bai.body, etag: bai.etag })
}

async function docPayload(req, res) {
  let raw
  try { raw = await docBody(req) } catch (e) {
    if (String(e.message) === "qua-tran") { json(res, 413, { loi: "Vượt trần 1 MB." }); return null }
    throw e
  }
  let p
  try { p = JSON.parse(raw.toString("utf8")) } catch {
    json(res, 400, { loi: "Body phải là JSON." }); return null
  }
  if (!p || typeof p !== "object" || typeof p.frontmatter !== "object" || p.frontmatter === null) {
    json(res, 400, { loi: "Thiếu {frontmatter, body}." }); return null
  }
  return p
}

/**
 * Tên hiển thị của hiện vật — LỌC Ở SERVER, không ở client (M09-R2).
 *
 * `x-ten-goc` là tên file người dùng chọn, tức DỮ LIỆU của người gửi. Nó chỉ để
 * HIỆN: khoá lưu trữ là sha256 do máy tính, nên tên này không bao giờ chạm tới
 * một đường dẫn nào. Nhưng một chuỗi *trông như* đường dẫn nằm trong frontmatter
 * là mầm cho lần sau ai đó dùng nó làm đường dẫn thật.
 *
 * Lọc ở server chứ không ở FE vì client thứ hai (curl, một script) đi vòng qua
 * được luật nằm trong client. Một luật, một chỗ.
 */
function tenGocAnToan(tho) {
  // WO-057 · GIAI MA TRUOC, LOC SAU — va thu tu nay la ca luat.
  //
  // Vi sao co phep giai ma: gia tri header HTTP chi cho ISO-8859-1, nen FE
  // KHONG cho noi mot ten tieng Viet o dang tho — `fetch` nem TypeError ngay
  // luc dung request. FE percent-encode; day la dau nhan.
  // Cung khuon `ghepBoSung` cua `server.mjs` da dung cho `x-bo-sung`: mot
  // `try/catch` quanh `decodeURIComponent`, that bai thi GIU chuoi tho.
  // Phong ho la bat buoc, khong phai cho chac: `decodeURIComponent` NEM
  // `URIError` voi mot `%` le, va client thu hai (curl, mot script) gui
  // `100% xong.pdf` khong duoc lam cua nay 500.
  //
  // VI SAO GIAI MA TRUOC KHI LOC: lam nguoc lai la mot LO THAT —
  // `%2e%2e%2fx` khong chua `/` nen no di qua phep loc duoi day nguyen ven,
  // roi phep giai ma bien no thanh `../x` SAU khi cua da mo.
  let d
  try { d = decodeURIComponent(String(tho ?? "")) } catch { d = String(tho ?? "") }
  tho = d
  // Bo ky tu DIEU KHIEN truoc tien: chung khong hien ra duoc, nen mot ten
  // mang mot ky tu nhu vay la mot ten TRONG NGAN hon thu no thuc su chua.
  // Viet bang escape, KHONG dan ky tu that vao nguon: mot regex chua byte
  // dieu khien lam ca file thanh 'binary' voi git/grep, va khong ai doc noi.
  const s = String(tho ?? "").replace(/[\u0000-\u001f\u007f]/g, "")
  // Cắt lấy đoạn cuối theo CẢ hai dấu phân cách rồi bỏ mọi `..` còn lại —
  // `..` một mình vẫn là một tên vô nghĩa, và để nó lại là để một chuỗi trông
  // như đường lùi thư mục đi vào kho.
  const cuoi = s.split(/[/\\]/).pop() ?? ""
  return cuoi.replace(/\.{2,}/g, ".").replace(/^\.+/, "").trim().slice(0, 120)
}

/**
 * POST /api/articles/media — NẠP HIỆN VẬT. Byte đi TRƯỚC bản ghi (M09 §2.3).
 *
 * Vì sao byte trước: `source_type: tai-lieu ⇒ required: media` nghĩa là bản ghi
 * KHÔNG THỂ tồn tại hợp pháp trước blob của nó.
 *
 * Vì sao raw POST, không multipart: `web/package.json` có đúng HAI devDep và
 * `check_version_pin.py` canh kỷ luật đó. Thêm `busboy` là thêm dep runtime vào
 * repo không có dep nào; tự viết parser multipart là đúng thứ M05-R3 cấm; và
 * base64-in-JSON phồng 33% rồi buộc nới `TRAN` — hằng số chặn bù của MỌI lần
 * ghi bài. Raw POST: 0 parse, hai scalar đi trong header.
 *
 * Đường này nằm DƯỚI `/api/articles/…` nên whitelist theo tiền tố của
 * `no-write-path.test.js` không phải sửa — không URL thứ sáu.
 */
export async function napHienVat(req, res) {
  const mime = String(req.headers["content-type"] ?? "").split(";")[0].trim()
  let byte
  try {
    byte = await docBodyMedia(req)
  } catch (e) {
    if (String(e.message) === "qua-tran") {
      /*
       * WO-047 · `socket.end()` (FIN), KHÔNG `req.destroy()` (RST).
       *
       * Lịch sử hai lớp ở đây, cả hai đo được:
       *   1. `req.destroy()` NGAY sau `json()` ⇒ socket chết trước khi 413 kịp
       *      bay đi; client thấy `fetch failed`. Sửa: dời vào `res.on("finish")`.
       *   2. `res.on("finish")` VẪN đứt — `finish` chỉ nói *"đã trao cho OS"*,
       *      và `destroy()` gửi **RST**, thứ làm phía nhận BỎ luôn byte còn
       *      trong bộ đệm. Dưới tải (suite 91 test) client nhận `ngat` thay vì
       *      413, ~2/2 lần; chạy riêng thì thắng cuộc đua nên xanh.
       *
       * `socket.end()` gửi **FIN**: nửa ghi đóng lại một cách có trật tự, byte
       * đã xếp hàng vẫn tới đích. Vẫn đạt mục đích cũ — client không upload
       * tiếp được vô hạn — mà không đánh đổi bằng chính câu trả lời.
       *
       * `resume()` để tiêu phần body còn tới mà KHÔNG đệm: không có nó thì
       * Node giữ chunk trong bộ nhớ cho một request ta đã từ chối.
       */
      req.resume()
      res.on("finish", () => req.socket?.end())
      json(res, 413, { loi: `Hiện vật vượt trần ${TRAN_MEDIA} byte.` })
      return
    }
    throw e
  }
  const kq = await luuHienVat({ byte, mime })
  if (!kq.ok) return json(res, kq.ma ?? 422, { loi: kq.loi })
  return json(res, 201, {
    sha256: kq.sha256, so_byte: kq.so_byte, mime: kq.mime,
    ten_goc: tenGocAnToan(req.headers["x-ten-goc"]),
  })
}

/**
 * GET /api/articles/media/<sha256> — PHỤC VỤ byte (FR-036/B6).
 *
 * Lần đầu byte do người dùng nạp đi ra trình duyệt, và đi ra **same-origin**.
 * Sáu đầu đề, mỗi cái một lý do:
 *
 *  · `content-type` từ ENUM ĐÓNG (`media-mime.json`), KHÔNG sniff từ tên file —
 *    tên file là dữ liệu của người gửi.
 *  · `nosniff` — không có nó, một blob dán nhãn sai bị trình duyệt re-sniff
 *    thành HTML và CHẠY trong gốc của chính trang. Magic-byte ở cửa nạp là lớp
 *    thứ nhất; đây là lớp thứ hai, và lớp thứ hai tồn tại vì lớp thứ nhất có
 *    thể sai.
 *  · `content-disposition` — `inline` cho thứ trình duyệt render được,
 *    **`attachment`** cho ppt/word. Attachment CHÍNH LÀ chính sách xem trước cho
 *    format không render được; nó đến từ `xem_truoc` đã khai, không gõ lại ở đây.
 *  · `content-security-policy` ở **HEADER**, không ở attribute của iframe:
 *    `sandbox` attribute mà không kèm `allow-scripts` làm hỏng viewer PDF của
 *    Chromium. Cùng một chữ, hai chỗ đặt, hai hệ quả khác nhau.
 *  · `etag` + `cache-control: immutable` — hợp pháp vì địa chỉ THEO NỘI DUNG:
 *    cùng URL thì mãi mãi cùng byte. Kèm nhánh `304`; một etag không có nhánh
 *    304 là một etag trang trí.
 *
 * KHÔNG `Range` ở v1 — và không hứa `accept-ranges`: hứa mà không cài là hứa dối.
 */
/*
 * WO-091 · Dựng phần định danh của `Content-Disposition`.
 *
 * TÁCH RA THÀNH HÀM THUẦN để cổng CHẠY được nó. Một phép lọc ký tự nằm chìm
 * trong tay-nghe HTTP thì cổng chỉ đọc được chữ, và một phép lọc chưa ai chạy
 * thử là một phép lọc chưa biết đúng.
 *
 * Vì sao KHÔNG dán thẳng `ten_goc`: nó là chuỗi của NGƯỜI GỬI, và một
 * `filename=` mang `"` hay newline là đường tách đầu đề HTTP. Chú thích cũ ở
 * đây đã đúng khi từ chối nó — chỉ là nó dừng ở chỗ trả lại một cái tên vô
 * nghĩa (`6714ee19086f.pdf`).
 *
 * Đường đúng là RFC 5987: `filename*=UTF-8''<phần-trăm-mã-hoá>` — phép mã hoá
 * biến mọi ký tự nguy hiểm thành `%XX`, nên không còn gì để tách. Kèm một
 * `filename="…"` ASCII đã lọc làm đường lùi cho cửa sổ cũ.
 */
export function dinhDanhTai(ten_goc, sha256, duoi) {
  const dui = String(duoi ?? "")
  const lui = String(sha256).slice(0, 12) + dui
  /*
   * ĐUÔI luôn lấy từ BẢNG KHAI, chỉ phần TÊN lấy từ `ten_goc`.
   *
   * Đo được: fixture nạp một PPTX dưới tên `goc.bin`. Tin đuôi của người gửi
   * thì file lưu ra `.bin` và máy người dùng mở bằng nhầm ứng dụng — `nosniff`
   * tồn tại đúng vì lời khai của client có thể sai, và đuôi cũng là một lời
   * khai. Bản đầu của tôi dán cả `ten_goc` và `media-dau-de` bắt đúng chỗ đó.
   */
  const ten = String(ten_goc ?? "").trim().replace(/\.[A-Za-z0-9]{1,8}$/, "")
  // ASCII an toàn: giữ ĐÚNG ba lớp ký tự. Mọi thứ khác — kể cả `"` `\` CR LF —
  // thành `_`. Danh sách CHO PHÉP, không loại trừ.
  const ascii = ten.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "")
  // Không còn gì đọc được ⇒ lùi hẳn về sha.
  if (!ten || !/[A-Za-z0-9]/.test(ascii)) return `filename="${lui}"`
  return `filename="${ascii}${dui}"; filename*=UTF-8''`
    + encodeURIComponent(ten) + dui
}

export function phucVuHienVat(req, res, sha256) {
  if (!/^[0-9a-f]{64}$/.test(String(sha256 ?? ""))) {
    return json(res, 400, { loi: "sha256 phải là 64 ký tự hex thường." })
  }
  const hv = hienVatPhucVu(sha256)
  if (!hv) return json(res, 404, { loi: "Không có hiện vật này." })

  const etag = `"${sha256}"`
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { etag, "cache-control": "public, max-age=31536000, immutable" })
    return res.end()
  }
  // `filename` dùng ĐUÔI từ bảng khai, không dùng `ten_goc` thô: tên gốc là
  // chuỗi của người gửi, và một `filename=` mang dấu ngoặc kép hay newline là
  // đường tách đầu đề. Tên đọc được vẫn còn trong frontmatter để FE hiện.
  // WO-064 · `phat` cung phai INLINE. Mot the `<video src=…>` KHONG phat duoc
  // khi cua tra `attachment` — trinh duyet tai file ve thay vi phat. Day la
  // toan bo ly do nguoi dung thay *"Trinh duyet khong mo duoc dang nay"* cho
  // mot .mp4. `nosniff` khong doi: `inline` mua duoc cho `<video>`, khong mua
  // bang cach bo lop soi kieu.
  // `anh` cùng nhóm INLINE với `iframe`/`phat`: một `<img src=…>` trỏ vào cửa
  // trả `attachment` thì trình duyệt TẢI FILE thay vì hiện, và thẻ 2 tầng câm.
  /*
   * WO-091 · `?dang=goc` nói Ý ĐỊNH TẢI, và ý định thắng chính sách xem trước.
   *
   * PDF có `xem_truoc: iframe` nên mặc định `inline` — đúng cho thẻ nhúng.
   * Nhưng người bấm *Tải xuống ▾ → Bản gốc* thì muốn một FILE, và trình duyệt
   * mở thêm một tab là sai việc họ vừa bấm.
   *
   * Ép `attachment` mọi lúc thì `<video>` không phát và thẻ 2 tầng câm — đúng
   * bug `WO-064` đã sửa một lần. Nên ý định phải nói ra ở URL, không suy từ
   * mime.
   */
  const taiVe = new URL(req.url, "http://x").searchParams.get("dang") === "goc"
  const dat = !taiVe && ["iframe", "phat", "anh"].includes(hv.xem_truoc)
    ? "inline" : "attachment"
  res.writeHead(200, {
    "content-type": hv.mime,
    "content-length": hv.byte.length,
    "x-content-type-options": "nosniff",
    "content-disposition": `${dat}; ${dinhDanhTai(hv.ten_goc, sha256, hv.duoi)}`,
    "content-security-policy": "default-src 'none'; object-src 'none'; sandbox",
    etag,
    "cache-control": "public, max-age=31536000, immutable",
  })
  return res.end(hv.byte)
}

/**
 * POST — tạo bài NGƯỜI TỰ VIẾT. Server ÁP `origin: manual` + `approved`.
 *
 * ═══ FR-033 · BỎ HẲN BƯỚC DUYỆT ═══════════════════════════════════════════
 *
 * Người dùng: *"bỏ logic duyệt bài mới… user tạo là lên chính thức luôn"*, và
 * *"bỏ tất cả thứ gọi là chờ duyệt"*.
 *
 * Trước đây dòng này là `draft`, với lý do B-B1: mọi đường vào đều draft, và chỉ
 * NGƯỜI mới đặt được `approved`. Lý do đó vẫn đúng về mặt cơ chế — nhưng nó
 * phòng một tình huống KHÔNG CÒN: hàng đợi tồn tại để chủ kho đọc lại thứ do
 * máy hoặc người khác đưa vào. Bài đi qua đường này do CHÍNH chủ kho gõ ra trên
 * form của họ. Bắt họ tự duyệt bài mình vừa viết là một nhịp bấm không thêm
 * thông tin nào.
 *
 * RANH GIỚI VẪN CÒN, và nó nằm ở chỗ khác: `gate.py:123` (M05-R1) giữ nguyên
 * `draft` cho hàng NHẬP TỪ NGOÀI qua `_inbox/`. Một file thả vào thư mục mà tự
 * lên site là chuyện khác hẳn với việc bạn bấm "Ghi vào kho".
 *
 * Cái GIÁ, nói thẳng: schema thôi đòi ba trường M1 khi `approved` (FR-033 gỡ
 * ràng buộc đó), nên M1 không còn đo được từ kho. Đây là đánh đổi người dùng
 * chọn sau khi đã được nêu.
 *
 * KHÔNG đi qua gate.py: gate là cổng cho hàng NHẬP (external, đòi spot-check ≥2
 * — với bài tự viết là ép khai man, đúng thứ M05-R2 gọi là bịa có hệ thống).
 */
export async function taoBai(req, res, nhom = null) {
  const p = await docPayload(req, res)
  if (!p) return
  const fm = { ...p.frontmatter }
  delete fm.review_status
  delete fm.origin
  fm.origin = "manual"
  fm.review_status = "approved"

  /*
   * FR-040 · CỔNG RIÊNG của module, chấm SAU khi lột trường server-quyết và
   * TRƯỚC mọi phép ghi. `nhom` là `null` trên đường bí danh `/api/articles`,
   * và ở đó `congNhom` trả `null` ngay — hợp đồng cũ không đổi.
   *
   * Đặt ở đây chứ không ở `router.mjs`: router chưa đọc body, và đọc body hai
   * lần là hai cơ hội để hai bên nhìn thấy hai thứ khác nhau.
   */
  const cong = congNhom(nhom, fm)
  if (cong) return json(res, cong.ma, { loi: cong.loi })

  const type = fm.source_type, slug = fm.slug
  if (!LOAI.includes(type)) return json(res, 400, { loi: `source_type phải thuộc: ${LOAI.join(", ")}` })
  if (!laSlug(slug)) return json(res, 400, { loi: "slug phải khớp [a-z0-9]+(-[a-z0-9]+)*" })
  if (docBai(type, slug)) return json(res, 409, { loi: `kho đã có ${type}/${slug}.md — PUT để sửa.` })

  return tuanTu(async () => {
    if (docBai(type, slug)) return json(res, 409, { loi: `kho đã có ${type}/${slug}.md.` })
    const kq = await ghiSauValidate(fm, p.body, type, slug)
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    // WO-071 lối (a) · ảnh bìa tự xếp. SAU khi ghi thành công, và không `await`:
    // xem `xepViecThumbnail` — THỢ chết không được làm hỏng một lần ghi đã xong.
    xepViecThumbnail(fm)
    return json(res, 201, { path: `${type}/${slug}.md`, id: fm.id, etag: kq.etag })
  })
}

/** PUT — sửa nội dung/metadata. Địa chỉ bất biến; trạng thái theo vòng đời:
 *  approved + nội dung đổi ⇒ edited (M02 §2.2). If-Match bắt lost-update. */
export async function suaBai(req, res, type, slug) {
  const p = await docPayload(req, res)
  if (!p) return
  return tuanTu(async () => {
    const cu = docBai(type, slug)
    if (!cu) return json(res, 404, { loi: "Không có bài này." })

    const im = req.headers["if-match"]
    if (!im) return json(res, 400, { loi: "Thiếu header If-Match (lấy etag từ GET)." })
    if (im !== cu.etag) return json(res, 412, { loi: "Bài đã đổi ở nơi khác — GET lại rồi sửa tiếp." })

    const fm = { ...p.frontmatter }
    // Địa chỉ bất biến qua PUT — đổi tên/loại là việc khác (M08-R5)
    for (const k of ["id", "slug", "source_type"]) {
      if (k in fm && fm[k] !== cu.fm[k]) {
        return json(res, 400, { loi: `Không đổi được ${k} qua PUT.` })
      }
      fm[k] = cu.fm[k]
    }
    // Trường server-quyết: LỘT khỏi payload, tính theo vòng đời
    delete fm.review_status
    delete fm.origin
    fm.origin = cu.fm.origin
    fm.review_status = cu.fm.review_status

    /*
     * WO-016 · CỔNG MODULE cũng chấm ở PUT.
     *
     * Đo được: chặn ở POST mà bỏ PUT thì sửa một tài liệu rồi bỏ hết nhãn vẫn
     * 200 — cùng một lỗ, qua một method khác. Suy module TỪ `type` của bản
     * ghi, không từ đường: `suaBai` không nhận `nhom`, và luật nhãn thuộc bản
     * ghi chứ không thuộc URL.
     *
     * Chấm SAU khi lột trường server-quyết, TRƯỚC mọi phép ghi — cùng vị trí
     * với `congNhom` trong `taoBai`, vì cùng một lý do.
     */
    const congPut = congLoai(type, fm)
    if (congPut) return json(res, congPut.ma, { loi: congPut.loi })
    const body = typeof p.body === "string" ? p.body : cu.body
    /*
     * ═══ FR-033 · SỬA BÀI KHÔNG CÒN HẠ TRẠNG THÁI ═══════════════════════════
     *
     * Cả khối so-sắp-khoá ở đây đã BỎ. Việc duy nhất của nó là: bài `approved`
     * mà nội dung đổi thì hạ xuống `edited` ⇒ RỜI KHỎI SITE ⇒ phải duyệt lại.
     *
     * Đó chính là hàng đợi, chỉ mang tên khác. Người dùng bỏ bước duyệt, nên
     * giữ nhánh này là dựng lại đúng thứ vừa bỏ: sửa một dấu phẩy trong bài của
     * mình và bài biến mất khỏi site cho tới khi tự duyệt lại bản thân.
     *
     * `review_status` giờ CHỈ đổi qua `PATCH .../status` — tức khi người dùng
     * cố ý bấm một nút, không phải như tác dụng phụ của việc lưu.
     *
     * Bug cũ mà khối đó từng chữa (so chuỗi thô ⇒ MỌI PUT đều hạ `edited` vì
     * `delete` rồi gán lại đẩy khoá xuống cuối object) không còn địa chỉ để
     * xảy ra — không còn nhánh nào hạ trạng thái.
     */

    const kq = await ghiSauValidate(fm, body, type, slug)
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    return json(res, 200, { etag: kq.etag, review_status: fm.review_status })
  })
}

/* ═══ T08-30 · POST /api/articles/<type>/<slug>/hien-vat ══════════════════
 *
 * CỬA HẸP — chỉ GẮN một `sha256` đã có vào `media[]`. Chủ dự án chọn lối này
 * (2026-09-04) thay vì cho THỢ dùng `PUT`.
 *
 * Vì sao không dùng `PUT` sẵn có: nó nhận CẢ frontmatter và thân. `suaBai` lột
 * `review_status`/`origin`, nhưng nó KHÔNG lột `category`, `concepts`,
 * `credibility_max`, thân bài — và `M01-R2` cấm MÁY điền `credibility_max`.
 * Một THỢ gọi được `PUT` là một THỢ ghi được mọi thứ đó.
 *
 * ⇒ Bề mặt hẹp tới mức chỉ làm được đúng một việc. Đó là thứ duy nhất làm câu
 * *"THỢ không sửa được bản ghi"* còn đúng sau khi mở một cửa cho THỢ.
 *
 * BỐN tính chất, cả bốn có cổng (`web/test/hien-vat-gan.test.js`):
 *   · chỉ THÊM — hiện vật cũ nguyên từng byte (`AC-V6` vế happy)
 *   · BẤT ĐỘNG — cùng `sha256` gọi hai lần vẫn một entry
 *   · byte phải ĐÃ CÓ trong bảng `media` — cửa này gắn, không nạp
 *   · mọi trường lạ bị LỘT, không bị từ chối: từ chối biến một trường bị lột
 *     thành một lỗi người dùng thấy, còn hợp đồng chỉ nói *nó không được tin*
 */
const KIEU_MOC = ["la_asr", "nguoi_sua", "la_thumbnail"]

export async function ganHienVat(req, res, type, slug) {
  // Khoá dịch vụ: cửa này của THỢ, không của trình duyệt. Cùng phép kiểm với
  // bảy cửa `FR-047` — `aud` được soi, và khoá session KHÔNG mở được nó.
  const khoa = req.headers["x-khoa-dich-vu"] ?? ""
  const aud = req.headers["x-aud"] ?? ""
  if (!loiKiemKhoaDichVu({ khoa, aud })) {
    return json(res, 401, { loi: "không được phép" })
  }
  /*
   * `docPayload` KHÔNG dùng được ở đây: nó đòi `{frontmatter, body}` — đúng
   * hình dạng của cửa BẢN GHI, và cửa này cố ý không nhận hai thứ đó.
   * `docBody` trả BUFFER, nên phải parse tại đây.
   */
  let p
  try {
    p = JSON.parse((await docBody(req)).toString("utf8"))
  } catch {
    return json(res, 400, { loi: "Body phải là JSON." })
  }
  if (!p || typeof p !== "object") {
    return json(res, 400, { loi: "Body phải là một object JSON." })
  }
  const sha = String(p.sha256 ?? "")
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    return json(res, 422, { loi: "`sha256` phải là 64 hex" })
  }
  if (p.kieu_moc !== undefined && !KIEU_MOC.includes(p.kieu_moc)) {
    return json(res, 422, {
      loi: `\`kieu_moc\` chỉ nhận ${KIEU_MOC.join(" | ")} — khớp \`CHECK\` của `
        + "`kho.schema.sql`",
    })
  }
  // Byte phải CÓ THẬT. Gắn một con trỏ vào hư không là dựng một hiện vật mồ
  // côi ngược chiều — `M09-R1` canh chiều còn lại (byte không bị xoá).
  if (!docHienVat(sha)) {
    return json(res, 422, {
      loi: "`sha256` chưa có trong bảng `media` — nạp byte qua "
        + "`POST /api/articles/media` trước, cửa này chỉ GẮN",
    })
  }
  return tuanTu(async () => {
    const cu = docBai(type, slug)
    if (!cu) return json(res, 404, { loi: "Không có bài này." })
    const media = hienVat(cu.fm)
    if (media.some((m) => m.sha256 === sha)) {
      // BẤT ĐỘNG, và trả 200 chứ không 409: gọi lại sau một lỗi mạng là chuyện
      // thường, và một cửa trả lỗi cho retry là một cửa buộc người gọi đoán.
      return json(res, 200, { media, bat_dong: true })
    }
    const byte = docHienVat(sha)
    /*
     * Bốn trường của `media[]` — `frontmatter.schema.json` khai
     * `additionalProperties: false`, nên `kieu_moc`/`model_asr` KHÔNG vào được
     * đây. Chỗ của chúng là CỘT trong bảng `media` (`T01-45`), và đó là chỗ
     * đúng: chúng nói về BYTE, không nói về bản ghi trỏ tới byte.
     */
    const entry = {
      sha256: sha,
      mime: String(p.mime ?? "application/octet-stream"),
      ten_goc: String(p.ten_goc ?? `${slug}.bin`),
      so_byte: byte.length,
    }
    /*
     * WO-071 · `thay_kieu_moc` — SINH LẠI thì THAY, không THÊM.
     *
     * Mặc định `false` ⇒ hành vi cũ nguyên vẹn (0 ca gọi hiện tại đổi). Bật
     * lên thì mọi entry mang CÙNG `kieu_moc` nhường chỗ cho entry mới.
     *
     * Khoá vào CỘT `kieu_moc` của bảng `media`, không vào `media[]` của
     * frontmatter: `additionalProperties: false` nên cờ ấy không tồn tại ở đó.
     * Cột này tới đợt WO-071 mới THẬT SỰ được ghi (`ghiKieuMoc`) — trước đó
     * cửa kiểm giá trị rồi vứt đi.
     *
     * Vì sao cần: `nenThe` lấy entry ĐẦU. Thêm mãi thì người dùng thấy ảnh
     * CŨ sau mỗi lần sinh lại — đúng bug append của transcript (backlog
     * 2026-09-08), và đây là chỗ chữa nó ở tầng cửa.
     */
    const km = p.kieu_moc
    let giu = media
    if (p.thay_kieu_moc === true && km !== undefined) {
      const cungLoai = shaTheoKieuMoc(km)
      giu = media.filter((m) => !cungLoai.has(String(m.sha256)))
    }
    // CHỈ `media` đổi. Mọi khoá khác của frontmatter đi qua nguyên vẹn, nên
    // không trường nào của payload tới được bản ghi.
    const fm = { ...cu.fm, media: [...giu, entry] }
    // GHI CỘT trước khi validate: nếu validate trượt thì cột đã ghi là một cờ
    // mồ côi — nhưng nó trỏ vào một byte CÓ THẬT trong `media`, và lần gắn sau
    // sẽ ghi đè. Ngược lại (ghi sau) thì một lần gắn thành công có thể để cột
    // rỗng, và phép THAY lần sau không tìm ra gì.
    if (km !== undefined) ghiKieuMoc(sha, km)
    const kq = await ghiSauValidate(fm, cu.body, type, slug)
    if (!kq.ok) return json(res, 422, { loi_validate: kq.loi })
    return json(res, 200, { media: fm.media, etag: kq.etag })
  })
}
