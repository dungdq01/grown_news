#!/usr/bin/env node
/**
 * FR-031 · Ba đường API mới — phân trang danh mục · ép xoá nhãn · khôi phục
 * dưới tên khác.
 *
 * Ba việc khác nhau, một file: chúng dùng CHUNG một kho tạm và một server, và
 * tách ba file là spawn ba server cho ba nhóm phép kiểm ngắn.
 *
 * Kho tạm ở `os.tmpdir()` — không phép kiểm nào đụng `kb/` thật.
 */
import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const { kho, rac, don } = dungKho("gn-fr031", { chuDe: true })
const { goc: schema, don: donSchema } = dungSchema("gn-fr031-schema", { chuDe: true })
const { cong, dung } = await batServer({ kho, rac, schema })

try {
  // ═══ 1 · PHÂN TRANG ═══════════════════════════════════════════════════════
  console.log("\n1 · Phân trang danh mục — mặc định KHÔNG cắt\n")

  const het = await goi(cong, "GET", "/api/concepts")
  ok(het.ma === 200, "GET /api/concepts ⇒ 200")
  const tong = het.json?.items?.length ?? 0
  ok(tong > 3, `kho mẫu có ${tong} khái niệm để phân trang`)

  /*
   * VÌ SAO MẶC ĐỊNH PHẢI TRẢ ĐỦ — và vì sao đây là phép kiểm quan trọng nhất
   * của mục này:
   *
   * `/nap/` vẽ MỘT checkbox cho MỖI nhãn từ cửa này. Nếu mặc định cắt 20 mục
   * thì form nạp bài lặng lẽ mất nhãn thứ 21: người dùng không thấy lỗi, chỉ
   * thấy nhãn "không tồn tại". Đó là mất chức năng, không phải phân trang.
   *
   * Nên "thêm phân trang" ở đây nghĩa là THÊM MỘT LỰA CHỌN, không phải đổi
   * hành vi mặc định.
   */
  ok(het.json?.tong === tong,
     "`tong` có mặt ngay cả khi không phân trang",
     "thiếu `tong` thì client phải đoán 'còn nữa nếu đủ limit' — sai ở trang cuối")
  ok(het.json?.limit === null, "không truyền `limit` ⇒ `limit: null` (đã trả đủ)")

  const tr1 = await goi(cong, "GET", "/api/concepts?limit=2&offset=0")
  ok(tr1.json?.items?.length === 2, "limit=2 ⇒ đúng 2 mục",
     `nhận ${tr1.json?.items?.length}`)
  ok(tr1.json?.tong === tong, `\`tong\` vẫn là ${tong} khi đang xem một phần`)

  const tr2 = await goi(cong, "GET", "/api/concepts?limit=2&offset=2")
  ok(tr2.json?.items?.length === 2, "offset=2 ⇒ trang thứ hai")
  const id1 = (tr1.json?.items ?? []).map((x) => x.id).join(",")
  const id2 = (tr2.json?.items ?? []).map((x) => x.id).join(",")
  ok(id1 !== id2 && id1 && id2, "hai trang KHÁC nhau",
     `trang 1: ${id1} · trang 2: ${id2} — giống nhau nghĩa là offset bị bỏ qua`)

  // Tham số rác không được làm sập cửa đọc, và không được trả về mảng rỗng
  // bí ẩn. Fail closed về hành vi MẶC ĐỊNH (trả đủ), không về hành vi rỗng.
  for (const q of ["limit=abc", "limit=-5", "offset=-1", "limit=999999999"]) {
    const r = await goi(cong, "GET", `/api/concepts?${q}`)
    ok(r.ma === 200 && Array.isArray(r.json?.items) && r.json.items.length > 0,
       `\`?${q}\` không làm sập, vẫn trả mục`,
       `nhận ${r.ma}, ${r.json?.items?.length} mục`)
  }

  const cat = await goi(cong, "GET", "/api/categories?limit=1")
  ok(cat.json?.items?.length === 1 && typeof cat.json?.tong === "number",
     "chủ đề cũng phân trang được (cùng khuôn)")

  // ═══ 2 · KHÔI PHỤC DƯỚI TÊN KHÁC ══════════════════════════════════════════
  console.log("\n2 · Khôi phục dưới tên khác\n")

  // Dựng đúng tình huống người dùng gặp: một bản trong rác TRÙNG TÊN với bản
  // đang ở kho. Cách dựng: xoá `bai-ngoai` (sang rác), rồi tạo lại một bài mới
  // CÙNG slug — giờ hai bên cùng tên.
  const b2 = (await goi(cong, "GET", "/api/articles/article/bai-ngoai")).json
  const xoa = await goi(cong, "DELETE", "/api/articles/article/bai-ngoai",
                        { headers: { "if-match": b2.etag } })
  ok(xoa.ma === 200, "đưa `bai-ngoai` vào rác", `nhận ${xoa.ma}`)

  const tao = await goi(cong, "POST", "/api/articles",
                        { body: { frontmatter: b2.frontmatter, body: b2.body } })
  ok(tao.ma === 201 || tao.ma === 200, "tạo lại một bài CÙNG slug ở kho",
     `nhận ${tao.ma}: ${tao.json?.loi ?? ""}`)

  const trung = await goi(cong, "POST", "/api/articles/article/bai-ngoai/restore")
  ok(trung.ma === 409, "khôi phục tên cũ ⇒ 409 (đúng, không ghi đè)",
     `nhận ${trung.ma}`)

  const xau = await goi(cong, "POST", "/api/articles/article/bai-ngoai/restore",
                        { body: { slug_moi: "Ten Sai_2" } })
  ok(xau.ma === 400, "tên mới sai định dạng ⇒ 400", `nhận ${xau.ma}`)

  const doi = await goi(cong, "POST", "/api/articles/article/bai-ngoai/restore",
                        { body: { slug_moi: "bai-ngoai-2" } })
  ok(doi.ma === 200, "khôi phục dưới tên `bai-ngoai-2` ⇒ 200",
     `nhận ${doi.ma}: ${doi.json?.loi ?? ""}`)
  ok(doi.json?.path === "article/bai-ngoai-2.md", "đường mới đúng",
     `nhận ${doi.json?.path}`)

  // CẢ HAI còn — đó là toàn bộ lý do đường này tồn tại.
  for (const s of ["bai-ngoai", "bai-ngoai-2"]) {
    const r = await goi(cong, "GET", `/api/articles/article/${s}`)
    ok(r.ma === 200, `\`${s}\` có trong kho`, `nhận ${r.ma}`)
  }

  // `slug` trong frontmatter PHẢI theo tên file.
  //
  // Vì sao đây không phải chi tiết vụn: `slug` mà API trả về lấy từ TÊN FILE
  // (`quetKho`), còn form sửa bài đọc `fm.slug`. Để lệch thì file tự khai hai
  // địa chỉ, và form điền địa chỉ cũ — một bug im lặng chờ sẵn.
  const moi = (await goi(cong, "GET", "/api/articles/article/bai-ngoai-2")).json
  ok(moi?.frontmatter?.slug === "bai-ngoai-2",
     "`slug` trong frontmatter đã đổi theo tên file",
     `frontmatter còn ghi: ${moi?.frontmatter?.slug}`)

  // Rác đã hết bản đó — khôi phục là DI CHUYỂN, không phải sao chép.
  const conRac = (await goi(cong, "GET", "/api/recycle")).json.items ?? []
  ok(!conRac.some((x) => x.slug === "bai-ngoai"),
     "bản trong rác đã đi, không nhân đôi")

  // Trượt validate thì KHÔNG để lại file nửa vời trong kho.
  const hong = await goi(cong, "POST", "/api/articles/article/khong-co/restore",
                         { body: { slug_moi: "bat-ky" } })
  ok(hong.ma === 404, "khôi phục bản không có trong rác ⇒ 404", `nhận ${hong.ma}`)
  ok((await goi(cong, "GET", "/api/articles/article/bat-ky")).ma !== 200,
     "không tạo ra file rỗng nào ở đích")
  /*
   * ÉP XOÁ ĐỨNG CUỐI — và đây là một bài học về THỨ TỰ TEST.
   *
   * Bản đầu tôi để mục này ở giữa. `_api.mjs` gán `concepts: ["idempotency"]`
   * cho MỌI bản ghi seed, nên xoá nhãn đó làm CẢ KHO trỏ hụt — và mọi phép
   * kiểm sau đó trượt validate với lý do chẳng liên quan gì đến nó.
   *
   * Nghĩa là: mục này không chỉ phá dữ liệu của nó, nó phá TIỀN ĐỀ của mọi
   * phép kiểm còn lại. Thứ đó phải đứng cuối, y như DELETE đứng cuối trong
   * `duong-api-khop-route.test.js`.
   */
  // ═══ 3 · ÉP XOÁ NHÃN ══════════════════════════════════════════════════════
  console.log("\n3 · Ép xoá nhãn đang được bài dùng\n")

  // `_api.mjs` gán `concepts: ["idempotency"]` cho MỌI bản ghi seed ⇒ nhãn này
  // chắc chắn đang được dùng. Đọc lại số từ API chứ không tin giả định.
  const dsC = (await goi(cong, "GET", "/api/concepts")).json.items
  const dangDung = dsC.find((c) => c.id === "idempotency")
  ok(!!dangDung, "`idempotency` có trong danh mục kho tạm")

  const chan = await goi(cong, "DELETE", "/api/concepts/idempotency")
  ok(chan.ma === 409, "không `force` ⇒ vẫn 409 (mặc định KHÔNG đổi)",
     `nhận ${chan.ma}`)
  ok(typeof chan.json?.dang_dung === "number" && chan.json.dang_dung > 0,
     `409 kèm số bài đang dùng (${chan.json?.dang_dung})`)
  ok(Array.isArray(chan.json?.bai) && chan.json.bai.length === chan.json.dang_dung,
     "409 kèm DANH SÁCH bài, không chỉ con số",
     "một con số không cho người dùng đường nào đi tiếp; mấy cái slug thì có")
  ok((chan.json?.bai ?? []).every((x) => /^[a-z]+\/[a-z0-9-]+$/.test(x)),
     "mỗi bài ghi dạng `<type>/<slug>` — mở được bằng đúng đường API")

  const ep = await goi(cong, "DELETE", "/api/concepts/idempotency?force=1")
  ok(ep.ma === 200, "`?force=1` ⇒ xoá được", `nhận ${ep.ma}: ${ep.json?.loi ?? ""}`)
  ok(ep.json?.ep === true, "đáp trả tự khai đây là ép xoá")
  ok(Array.isArray(ep.json?.gay_hong) && ep.json.gay_hong.length > 0,
     `trả về ${ep.json?.gay_hong?.length} bài giờ trỏ hụt`,
     "200 rỗng là để người dùng tự phát hiện ba tuần sau, lúc sửa bài và trượt")

  const conKhong = (await goi(cong, "GET", "/api/concepts")).json.items
  ok(!conKhong.some((c) => c.id === "idempotency"), "nhãn đã rời danh mục thật")

  // Hệ quả PHẢI thật: bài trỏ hụt không ghi lại được nữa. Đây là điều đáng đo
  // nhất — nếu nó KHÔNG xảy ra thì cảnh báo vừa in ra là một lời nói suông.
  const bai = (await goi(cong, "GET", "/api/articles/article/bai-nhap")).json
  const luu = await goi(cong, "PUT", "/api/articles/article/bai-nhap", {
    body: { frontmatter: bai.frontmatter, body: bai.body },
    headers: { "if-match": bai.etag },
  })
  ok(luu.ma === 422, "bài trỏ hụt KHÔNG ghi lại được (422) — cảnh báo là thật",
     `nhận ${luu.ma}`)

} finally {
  dung()
  don()
  donSchema()
}

chot("phân trang danh mục · ép xoá có cảnh báo thật · khôi phục dưới tên khác")
