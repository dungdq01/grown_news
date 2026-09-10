#!/usr/bin/env node
/**
 * WO-016 → WO-021 · HỢP ĐỒNG ĐÃ ĐẢO: nhãn KHÔNG còn bắt buộc.
 *
 * Bản đầu của file này đòi **422** khi tài liệu/video thiếu chủ đề hoặc khái
 * niệm — người dùng chọn thế ở T08-17. Hai lượt sau họ đảo lại: *"các fields
 * cố định thì up gì lên cũng nên hiển thị lên UI — ko hẳn cần require"*, và
 * tôi hỏi lại trước khi gỡ.
 *
 * File KHÔNG bị xoá, vì nó nay canh chiều ngược: một lần siết lại ngoài ý
 * muốn sẽ làm nó đỏ. Và nó là hồ sơ của lần đảo — xoá đi thì lần sau không ai
 * biết vế 422 từng tồn tại và vì sao nó đi.
 *
 * Ô vẫn hiện đủ và vẫn nhắc ("nên có"); hệ quả đã nói ra: facet Chủ đề sẽ
 * rỗng dần nếu bỏ qua thường xuyên. */
import { createHash } from "node:crypto"

import { CAT_FX, CPT_FX, batServer, dungKho, dungSchema, goi, taoKiem, thanBai }
  from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-nhan-bat-buoc-kb", { chuDe: true })
const { schema } = dungSchema("gn-nhan-bat-buoc-sc", { chuDe: true })
const { ok, chot } = taoKiem()
const sv = await batServer({ kho, rac, schema })
const CONG = sv.cong

const CAT = CAT_FX[0][0]
const CPT = CPT_FX[0][0]

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")

// `id` PHẢI ≥6 ký tự sau `src_`; bản ngắn hơn thì 422 vì lý do không liên quan
// và phép kiểm đo nhầm một lời từ chối khác.
const fm = (slug, type, them = {}) => ({
  id: `src_${slug.replace(/-/g, "")}zzzzzz`.slice(0, 14),
  slug, source_type: type,
  url: `https://example.com/${slug}`, protocol_version: "2.0",
  analyzed_at: "2026-08-28", one_liner: `Ban thu ${slug}`,
  credibility_max: "plausible", conformance: "B",
  concepts: [CPT], category: [CAT],
  ...them,
})
// FR-052 · MANG
const MEDIA = [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf",
                 so_byte: PDF.length }]
const TL = (slug, them = {}) =>
  fm(slug, "tai-lieu", { ho_so: "thu-vien", media: MEDIA, ...them })
const VD = (slug, them = {}) =>
  fm(slug, "video", { ho_so: "thu-vien", url: "https://youtu.be/abc123nhan01",
                      url_normalized: "youtube.com/watch?v=abc123nhan01", ...them })

const dat = (duong, f, method = "POST", headers) =>
  goi(CONG, method, duong, { body: { frontmatter: f, body: thanBai() }, headers })

/** Câu lỗi của một phản hồi, bất kể server gói nó ở khoá nào. */
const cauLoi = (r) => JSON.stringify(r.json ?? "")

try {
  await goi(CONG, "POST", "/api/articles/media", {
    tho: PDF, headers: { "content-type": "application/pdf", "x-ten-goc": "bia.pdf" },
  })

  console.log("\n0 · TỰ KIỂM: bản ĐỦ nhãn phải được NHẬN\n")

  /*
   * Không có mục này thì mọi phép kiểm "bị chặn" bên dưới có thể xanh vì một lý
   * do khác hẳn — schema tạm lệch, media chưa gieo, id sai dạng. Một cổng chỉ đo
   * vế TỪ CHỐI thì nó không phân biệt được "luật chạy" với "mọi thứ đều 422".
   */
  for (const [ten, f] of [["tài liệu", TL("n-tl-du")], ["video", VD("n-vd-du")]]) {
    const r = await dat(`/api/${f.source_type}`, f)
    ok(r.ma === 201, `${ten} ĐỦ chủ đề + khái niệm ⇒ 201 (được ${r.ma})`,
      `${cauLoi(r)} — vế dương không xanh thì vế âm không nói được gì`)
  }

  console.log("\n1 · TÀI LIỆU thiếu nhãn ⇒ bị chặn\n")

  // SLUG PHAI TUONG MINH. Ban dau toi dung `n-tl-${thieu.length}` va hai ca
  // trung slug ("chủ đề" va "cả hai" cung 6 ky tu) ⇒ ca thu hai duoc 409 XUNG
  // DOT, va toi doc con so ≥400 do thanh "luat da no". Mot phep kiem xanh vi ly
  // do khac han thu no khai la loai xanh te nhat.
  for (const [ma, thieu, them] of [["cd", "chủ đề", { category: [] }],
                                   ["kn", "khái niệm", { concepts: [] }],
                                   ["ch", "cả hai", { category: [], concepts: [] }]]) {
    const r = await dat("/api/tai-lieu", TL(`n-tl-${ma}`, them))
    ok(r.ma === 201, `tài liệu thiếu ${thieu} ⇒ 201 (được ${r.ma})`,
      "người dùng chốt BỎ chặn — 422 ở đây là siết lại ngoài ý muốn")
  }

  console.log("\n2 · VIDEO thiếu nhãn ⇒ bị chặn\n")

  for (const [ma, thieu, them] of [["cd", "chủ đề", { category: [] }],
                                   ["kn", "khái niệm", { concepts: [] }]]) {
    const r = await dat("/api/video", VD(`n-vd-${ma}`, them))
    ok(r.ma === 201, `video thiếu ${thieu} ⇒ 201 (được ${r.ma})`,
      "người dùng chốt BỎ chặn — 422 ở đây là siết lại ngoài ý muốn")
  }
  // Trường VẮNG khác trường RỖNG: `category: []` và không có khoá `category`
  // là hai hình dạng, và một phép kiểm chỉ thử một trong hai để lọt hình kia.
  const rV = await dat("/api/video", (() => {
    const f = VD("n-vd-vang"); delete f.category; return f
  })())
  ok(rV.ma === 201, `video KHÔNG CÓ khoá \`category\` ⇒ 201 (được ${rV.ma})`,
    "vắng và rỗng phải được đối xử NHƯ NHAU — nay cả hai đều nhận")

  console.log("\n3 · CA ÂM · BÀI VIẾT không bị luật này chặn\n")

  /*
   * Hồ sơ `phan-tich` đã có cổng mục/dẫn nhập/tinh túy/locator trong
   * `validate.py`. Thêm luật nhãn cho bài viết ở tầng route là bản THỨ HAI của
   * một luật, và nó chặn cả bản ghi cũ — một thứ người dùng không xin.
   */
  for (const [ma, ten, them] of [["cd", "không chủ đề", { category: [] }],
                                 ["kn", "không khái niệm", { concepts: [] }]]) {
    const r = await dat("/api/bai-viet", fm(`n-bv-${ma}`, "paper", them))
    ok(r.ma === 201, `bài viết ${ten} ⇒ 201 (được ${r.ma})`,
      `${cauLoi(r)} — luật rải sang bài viết là chặn thứ không ai xin chặn`)
  }

  console.log("\n4 · CA ÂM · PUT cũng bị chặn, không chỉ POST\n")

  const rTao = await dat("/api/tai-lieu", TL("n-tl-sua"))
  ok(rTao.ma === 201, `dựng bản để sửa ⇒ 201 (được ${rTao.ma})`, cauLoi(rTao))
  const etag = rTao.headers?.etag ?? rTao.json?.etag
  // PUT can BON doan: /api/<nhom>/<loai>/<slug> (router.mjs:172). Ba doan ⇒
  // 404, va 404 nghia la SAI CHO — khong phai luat nhan da no.
  const rSua = await dat("/api/tai-lieu/tai-lieu/n-tl-sua",
    TL("n-tl-sua", { category: [] }), "PUT",
    etag ? { "if-match": etag } : undefined)
  ok(rSua.ma === 200, `PUT bỏ hết chủ đề ⇒ 200 (được ${rSua.ma})`,
    "nới POST mà quên PUT là nới một nửa — hai đường phải nói cùng một luật")

  console.log("\n5 · BÀI VIẾT vẫn không bị chặn — vế này KHÔNG đổi\n")

/*
 * Mục 5 cũ đòi "câu lỗi nêu tên trường thiếu" — nay không còn câu lỗi nào để
 * đòi. Thay bằng vế vẫn đúng và vẫn cần canh: luật (dù đã nới) KHÔNG được rải
 * sang bài viết, vì hồ sơ `phan-tich` có cổng riêng trong `validate.py`.
 */
  const rBv = await dat("/api/bai-viet",
    fm("n-bv-cuoi", "paper", { category: [], concepts: [] }))
  ok(rBv.ma === 201, `bài viết không nhãn ⇒ 201 (được ${rBv.ma})`,
    cauLoi(rBv))

  chot("nhãn KHÔNG bắt buộc · POST và PUT cùng luật · bài viết không bị chặn")
} finally {
  sv.dung()
  don()
}
