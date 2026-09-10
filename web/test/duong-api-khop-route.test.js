#!/usr/bin/env node
/**
 * FR-031 · ĐƯỜNG FE DỰNG phải khớp ĐƯỜNG ROUTER NHẬN.
 *
 * ═══ BUG THẬT, VÀ VÌ SAO KHÔNG PHÉP KIỂM NÀO BẮT ĐƯỢC ═══════════════════════
 *
 * `router.mjs` nhận một bài ở `/api/articles/<type>/<slug>`. FE dựng URL chỉ
 * bằng `ban.slug` ở NĂM chỗ. Hệ quả đo được trên server đang chạy:
 *
 *   GET   /api/articles/<slug>              404   (route không khớp)
 *   GET   /api/articles/docs/<slug>         200
 *   PATCH /api/articles/<slug>/status       400   "type phải thuộc: …"
 *   PATCH /api/articles/docs/<slug>/status  409   (route KHỚP, handler xét tiếp)
 *
 * `docChiTiet` là bước ĐẦU của cả bốn nút biên tập (nó lấy `etag` cho If-Match),
 * nên bốn nút Duyệt · Loại · Bỏ duyệt · Bỏ khỏi kho chết ở CÙNG một chỗ. Người
 * dùng báo: "click vô dụng".
 *
 * Bộ test có 41 file và không file nào bắt. Vì sao:
 *   `vong-doi-bai.test.js` gọi API TRỰC TIẾP với đường đúng tay mình gõ. Nó
 *   chứng minh API tốt — và API tốt thật. Nó không bao giờ hỏi "FE dựng đường
 *   NÀO". Hai bên cùng đúng theo cách riêng, và chỗ nối giữa chúng không ai đo.
 *
 * Đây là bản một-mặt của lớp lỗi "bản song sinh": khi hai bên phải khớp nhau,
 * kiểm từng bên xanh KHÔNG suy ra chỗ nối xanh.
 *
 * ═══ HAI MỤC, CỐ Ý KHÁC LOẠI ════════════════════════════════════════════════
 *   §1 tĩnh   — soi BUNDLE ĐÃ BUILD, cấm đúng hình dạng đã gây lỗi
 *   §2 chạy   — server thật, chứng minh §1 có LÝ DO (router thật đòi `type`)
 *
 * §1 một mình là luật không có nguồn: ai đó đổi router cho nhận 3 đoạn thì §1
 * vẫn đỏ oan. §2 một mình không chặn được lần sau ai gõ lại `ban.slug`.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { batServer, dungKho, goi, taoKiem } from "./_api.mjs"
import { taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")
const { ok, chot } = taoKiem()

// ─── §1 · BUNDLE ───────────────────────────────────────────────────────────
// Đọc bundle SSR phát ở /gn.js (ghép từ *.inline.js đã dịch), KHÔNG đọc `.ts`.
// Thứ chạy trên trình duyệt là bundle; một helper đúng trong `.ts` mà esbuild
// inline sai thì `.ts` vẫn xanh. (FR-034/C5 — trước đây đọc `site/gn.js`.)
const js = (await taiSan()).gnJs

// 1a · `duongBai` phải TỒN TẠI và phải ghép ĐÚNG HAI đoạn.
//
// Kiểm cả nội dung, không chỉ cái tên: một `duongBai` trả về `b.slug` sẽ qua
// mọi phép kiểm chỉ tìm tên hàm — và đó chính là lớp lỗi "đếm một chuỗi rồi
// kết luận về hành vi" mà repo này đã trúng bốn lần.
// Cắt thân hàm theo NGOẶC KHỚP, không bằng một regex dừng ở cuối dòng: bundle
// giữ nguyên bình luận nên thân hàm trải nhiều dòng, và regex kiểu đó đọc được
// luận nên thân hàm trải nhiều dòng, và một regex dừng ở newline đọc được đúng
// dấu `(` rồi kết luận "thiếu source_type". Bản đầu của phép kiểm này đỏ oan
// đúng như vậy.
// Neo CHỊU ĐƯỢC MINIFY (`WO-057`): bundle nay đi qua `minifyWhitespace`, nên
// `duongBai = (` thành `duongBai=(`. Cổng này canh HÀNH VI của helper — nó đọc
// `slug` + `source_type` và có guard — chứ không canh định dạng nguồn. Neo vào
// khoảng trắng là neo vào một thứ không phải tính chất cần giữ.
const mDn = /duongBai\s*=\s*/.exec(js)
const iDn = mDn ? mDn.index : -1
ok(iDn > 0, "bundle có `duongBai`",
   "không có helper thì mỗi chỗ tự ghép đường, và chỗ thứ sáu sẽ ghép thiếu")
if (iDn > 0) {
  /*
   * Cắt thân theo HẾT CÂU LỆNH, không theo cặp ngoặc của tham số.
   *
   * Bản trước neo vào `duongBai = (` rồi tìm `(` sau `=>`. Cả hai mốc là ĐỊNH
   * DẠNG NGUỒN, và `minifyWhitespace` (`WO-057`) xoá sạch chúng: esbuild rút
   * `(b) => (` thành `b=>`, bỏ luôn ngoặc quanh một tham số duy nhất.
   *
   * Cổng này canh HÀNH VI — helper đọc `slug` + `source_type` và có guard —
   * nên nó phải neo vào thứ không đổi khi build đổi. Quét tới dấu `;` ở độ sâu
   * 0 là mốc của CÚ PHÁP, không của cách trình bày.
   */
  let sau = 0, het = js.length
  for (let k = iDn; k < js.length; k++) {
    const c = js[k]
    if (c === "(" || c === "[" || c === "{") sau++
    else if (c === ")" || c === "]" || c === "}") sau--
    else if (c === ";" && sau <= 0) { het = k; break }
  }
  const than = js.slice(iDn, het)
  ok(than.includes(".slug"), "`duongBai` đọc `slug`")
  ok(than.includes(".source_type"), "`duongBai` đọc `source_type`")
  ok(/includes\(\s*["'`]\/["'`]\s*\)/.test(than),
     "`duongBai` BẤT BIẾN — có guard `slug.includes(\"/\")`",
     "thiếu guard thì slug đã mang tiền tố loại bị cộng thêm lần nữa: "
     + "`repo/repo/hermes-agent` ⇒ 404 ⇒ bốn nút chết")
}

// 1b · CẤM đúng hình dạng đã gây lỗi: `"/api/articles/" + <gì đó>.slug`.
//
// Nêu CẤM chứ không nêu PHẢI-DÙNG-duongBai: ba chỗ truyền qua biến trung gian
// (`duong` của docChiTiet, `sua` của dataset) nên "phải thấy chữ duongBai ngay
// sau dấu +" là luật sai — nó sẽ đỏ oan và luật đỏ oan là luật bị tắt.
const XAU = /["'`]\/api\/articles\/["'`]\s*\+\s*[A-Za-z_$][\w$.]*\.slug\b/g
const viPham = [...js.matchAll(XAU)].map((m) => m[0])
ok(viPham.length === 0,
   "không đường bài nào ghép bằng `.slug` trần",
   viPham.length ? `${viPham.length} chỗ: ${viPham.join(" · ")}` : "")

// 1c · Router THẬT có đòi đoạn `type` không — đọc từ nguồn, không gõ lại.
//
// Nếu ai đó nới router cho nhận 3 đoạn thì §1b thành luật vô cớ, và phép kiểm
// phải nói ra điều đó chứ không im lặng canh một luật đã hết hiệu lực.
const rt = readFileSync(join(GOC, "web", "api", "router.mjs"), "utf8")
ok(/phan\.length\s*<\s*4/.test(rt),
   "`router.mjs` vẫn đòi >= 4 đoạn cho một bài",
   "router đã nới ⇒ xét lại §1b, đừng để nó canh một luật không còn")

// ─── §2 · SERVER THẬT ───────────────────────────────────────────────────────
// Kho TẠM (`os.tmpdir()`), không đụng `kb/` thật — cùng luật với 4 test api-*.
const { kho, rac, don } = dungKho("gn-duong-api")
const { cong, dung } = await batServer({ kho, rac })

try {
  const D = "article/bai-nhap"       // đường ĐÚNG: <type>/<slug>
  const S = "bai-nhap"               // đường SAI:  chỉ <slug>

  // 2a · GET — đường đúng đọc được, đường thiếu `type` thì KHÔNG.
  const gDung = await goi(cong, "GET", `/api/articles/${D}`)
  ok(gDung.ma === 200, "GET <type>/<slug> ⇒ 200", `nhận ${gDung.ma}`)
  const gSai = await goi(cong, "GET", `/api/articles/${S}`)
  ok(gSai.ma !== 200, "GET <slug> trần KHÔNG đọc được bài",
     `nhận ${gSai.ma} — nếu 200 thì router đã nới và §1b hết lý do`)

  const etag = gDung.json?.etag
  ok(typeof etag === "string" && etag.length > 0,
     "GET trả `etag` — bốn nút biên tập cần nó cho If-Match")

  // 2b · PATCH /status — phân biệt ROUTE KHỚP với ROUTE KHÔNG KHỚP.
  //
  // Gửi `to` không tồn tại CỐ Ý: nó không ghi gì, nên phép kiểm này không làm
  // bẩn kho, mà vẫn phân biệt được hai chuyện khác nhau hẳn:
  //   400 "type phải thuộc" = router chưa nhận, đường sai hình dạng
  //   409/422               = router NHẬN rồi, handler mới là chỗ từ chối
  // Đây đúng là cặp mã đã đo trên server thật khi tìm ra bug.
  const h = { "if-match": etag }
  const pDung = await goi(cong, "PATCH", `/api/articles/${D}/status`,
                          { body: { to: "khong-co-trang-thai-nay" }, headers: h })
  ok(pDung.ma !== 400 && pDung.ma !== 404,
     "PATCH <type>/<slug>/status ⇒ router KHỚP", `nhận ${pDung.ma}`)
  const pSai = await goi(cong, "PATCH", `/api/articles/${S}/status`,
                         { body: { to: "draft" }, headers: h })
  ok(pSai.ma === 400, "PATCH <slug>/status ⇒ 400 (slug bị đọc làm type)",
     `nhận ${pSai.ma} — đây là lỗi mà bốn nút biên tập từng gặp`)

  // 2c · PUT — đường của nút Sửa (`form.dataset.sua`).
  const put = await goi(cong, "PUT", `/api/articles/${S}`,
                        { body: { frontmatter: {}, body: "" }, headers: h })
  ok(put.ma === 404 || put.ma === 400, "PUT <slug> trần KHÔNG tới handler",
     `nhận ${put.ma}`)

  /*
   * ═══ 2c-bis · GIÁ TRỊ CHẠY RA, không chỉ hình dạng ═══════════════════════
   *
   * §1 soi hình dạng lời gọi trong bundle. Nó KHÔNG bắt được bug sau, và bug đó
   * đã lên tay người dùng: `/api/index` trả `slug` ĐÃ CÓ tiền tố loại
   * (`repo/hermes-agent`), nên `duongBai` cộng thêm `source_type` ra
   * `repo/repo/hermes-agent` ⇒ 404 ⇒ bốn nút biên tập chết lần thứ hai.
   *
   * Hình đúng, giá trị sai. Nên phép kiểm này lấy slug THẬT từ `/api/index`,
   * chạy CHÍNH công thức `duongBai` của FE lên nó, rồi GET kết quả.
   *
   * `duongBai` phải BẤT BIẾN: áp hai lần vẫn ra một đường.
   */
  const idx = await goi(cong, "GET", "/api/index")
  ok(idx.ma === 200 && (idx.json?.articles?.length ?? 0) > 0,
     `/api/index có ${idx.json?.articles?.length ?? 0} bài để thử`)
  const duongBai = (b) => (b.slug.includes("/") ? b.slug : b.source_type + "/" + b.slug)
  for (const g of idx.json.articles) {
    for (const b of g.bans) {
      const d1 = duongBai(b)
      const d2 = duongBai({ source_type: b.source_type, slug: d1 })
      ok(d1 === d2, `\`duongBai\` BẤT BIẾN cho ${b.slug}`,
         `áp hai lần ra hai đường: ${d1} vs ${d2} — đúng bug đã làm chết bốn nút`)
      const r = await goi(cong, "GET", `/api/articles/${d1}`)
      ok(r.ma === 200, `đường FE dựng cho \`${b.slug}\` GET được (${d1})`,
         `nhận ${r.ma} — nút Sửa/Loại/Bỏ khỏi kho sẽ chết ở bài này`)
    }
  }

  // 2d · DELETE — đường của nút Bỏ khỏi kho. Để CUỐI vì nó xoá thật.
  const dSai = await goi(cong, "DELETE", `/api/articles/${S}`, { headers: h })
  ok(dSai.ma !== 200, "DELETE <slug> trần không xoá được gì", `nhận ${dSai.ma}`)
  const dDung = await goi(cong, "DELETE", `/api/articles/${D}`, { headers: h })
  ok(dDung.ma === 200, "DELETE <type>/<slug> ⇒ 200", `nhận ${dDung.ma}`)
} finally {
  dung()
  don()
}

chot("đường FE dựng khớp đường router nhận")
