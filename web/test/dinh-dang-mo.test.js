#!/usr/bin/env node
/**
 * FR-039 — nhận MỌI định dạng, nhưng định dạng lạ phải ra `octet-stream` +
 * `attachment`.
 *
 * ĐO QUA HTTP THẬT, không đo chuỗi trong mã. Một cổng đọc mã nguồn sẽ xanh ngay
 * cả khi `phucVuHienVat` có một nhánh sớm trả 404 trước khi tới chỗ đặt đầu đề —
 * và đó chính là hành vi hôm nay với mime ngoài enum.
 *
 * VẾ NẶNG LÀ CHIỀU ÂM. "Nạp được file .xyz" là điều người dùng xin. "File .xyz
 * phục vụ ra `inline` với content-type đoán từ tên file" là đúng cái lỗ mà
 * FR-039 §0 nói sẽ KHÔNG mở — và nó chỉ lộ khi đọc ĐẦU ĐỀ trả về.
 *
 * `ten_goc` là chuỗi của người gửi và nó đi vào `filename=`. Ba ca độc ở §4 là
 * lý do đuôi file hôm nay lấy từ bảng khai chứ không từ tên gốc — và lý do đó
 * KHÔNG mất đi khi bảng thôi làm cổng.
 */
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { request } from "node:http"
import { join } from "node:path"

import { batServer, dungKho, GOC, goi, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-dinh-dang-mo-kb")
const { ok, chot } = taoKiem()
const sv = await batServer({ kho, rac })
const CONG = sv.cong

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const LA = Buffer.from("ZZZZ-day-la-mot-dinh-dang-khong-ai-biet\n", "utf8")

/**
 * Nạp một hiện vật. Hợp đồng là **byte THÔ** + `content-type` + `x-ten-goc` —
 * không phải một body JSON. Gửi sai hình dạng thì mọi phép kiểm dưới đây đỏ vì
 * lý do không liên quan, và tôi vừa mất một lượt vào đúng chỗ đó.
 */
const nap = (byte, mime, ten) =>
  goi(CONG, "POST", "/api/articles/media", {
    tho: byte, headers: { "content-type": mime, "x-ten-goc": ten },
  })

/** GET hiện vật, trả `{ma, dau}` — đầu đề THẬT, không phải điều mã nguồn hứa. */
function layDauDe(sha) {
  return new Promise((xong) => {
    const r = request({
      host: "127.0.0.1", port: CONG, method: "GET",
      path: `/api/articles/media/${sha}`,
    }, (p) => {
      p.resume()
      p.on("end", () => xong({ ma: p.statusCode, dau: p.headers }))
    })
    r.on("error", () => xong({ ma: 0, dau: {} }))
    r.end()
  })
}

try {
  console.log("\n1 · Định dạng LẠ nạp được — điều người dùng xin\n")

  const shaLa = createHash("sha256").update(LA).digest("hex")
  let r = await nap(LA, "application/x-dinh-dang-la", "ghi-chu.xyz")
  ok(r.ma === 200 || r.ma === 201,
    `nạp \`.xyz\` mime lạ ⇒ ${r.ma} (chờ 200/201)`,
    `${JSON.stringify(r.json)} — cửa nhận chưa mở`)
  ok(r.json?.sha256 === shaLa, "sha256 do MÁY tính, khớp byte gửi lên",
    `được ${r.json?.sha256}`)

  console.log("\n2 · CHIỀU ÂM — định dạng lạ phải octet-stream + attachment\n")

  // Byte staging chưa có bản ghi trỏ tới thì endpoint phục vụ trả 404 (M09 —
  // cửa nạp không được thành chỗ chứa file ai cũng đọc). Nên phải GHI một bản
  // ghi trỏ vào nó trước khi đo đầu đề.
  r = await goi(CONG, "POST", "/api/articles", {
    body: {
      frontmatter: {
        id: "src_dmla01", slug: "tai-lieu-la", source_type: "tai-lieu",
        url: "https://example.com/tai-lieu-la", protocol_version: "2.0",
        analyzed_at: "2026-08-28", one_liner: "Ban thu dinh dang la",
        credibility_max: "plausible", conformance: "B",
        concepts: ["idempotency"], ho_so: "thu-vien",
        media: [{
          sha256: shaLa, mime: "application/x-dinh-dang-la",
          ten_goc: "ghi-chu.xyz", so_byte: LA.length,
        }],
      },
      body: "Ghi chu ngan.",
    },
  })
  ok(r.ma === 201 || r.ma === 200, `ghi bản ghi trỏ vào hiện vật lạ ⇒ ${r.ma}`,
    JSON.stringify(r.json).slice(0, 240))

  const d = await layDauDe(shaLa)
  ok(d.ma === 200, `GET hiện vật lạ ⇒ 200 (được ${d.ma})`,
    "404 nghĩa là `hienVatPhucVu` vẫn coi mime ngoài bảng là không tìm thấy")
  ok(d.dau["content-type"] === "application/octet-stream",
    `  content-type = octet-stream (được ${d.dau["content-type"]})`,
    "phục vụ mime của người gửi cho định dạng chưa soi được byte là tin lời khai")
  ok(String(d.dau["content-disposition"] ?? "").startsWith("attachment"),
    `  content-disposition = attachment (được ${d.dau["content-disposition"]})`,
    "`inline` ⇒ định dạng lạ render trong gốc của chính trang — đúng lỗ FR-039 §0 nói KHÔNG mở")
  ok(d.dau["x-content-type-options"] === "nosniff", "  `nosniff` còn nguyên")
  ok(String(d.dau["content-security-policy"] ?? "").includes("sandbox"),
    "  CSP `sandbox` còn nguyên")

  console.log("\n3 · KHÔNG hồi quy — PDF vẫn inline, vẫn qua magic-byte\n")

  const shaPdf = createHash("sha256").update(PDF).digest("hex")
  r = await nap(PDF, "application/pdf", "bia.pdf")
  ok(r.ma === 200 || r.ma === 201, `nạp PDF ⇒ ${r.ma}`)
  r = await goi(CONG, "POST", "/api/articles", {
    body: {
      frontmatter: {
        id: "src_dmpdf1", slug: "tai-lieu-pdf", source_type: "tai-lieu",
        url: "https://example.com/tai-lieu-pdf", protocol_version: "2.0",
        analyzed_at: "2026-08-28", one_liner: "Ban thu pdf",
        credibility_max: "plausible", conformance: "B",
        concepts: ["idempotency"], ho_so: "thu-vien",
        media: [{ sha256: shaPdf, mime: "application/pdf", ten_goc: "bia.pdf",
                 so_byte: PDF.length }],
      },
      body: "Ghi chu ngan.",
    },
  })
  const dp = await layDauDe(shaPdf)
  ok(dp.dau["content-type"] === "application/pdf",
    `PDF vẫn \`application/pdf\` (được ${dp.dau["content-type"]})`)
  ok(String(dp.dau["content-disposition"] ?? "").startsWith("inline"),
    `PDF vẫn \`inline\` — xem trước KHÔNG bị xoá (được ${dp.dau["content-disposition"]})`,
    "bỏ cả bảng render thì PDF hết xem trước — một tính năng không ai xin xoá")

  // magic-byte cho định dạng ĐÃ BIẾT phải còn: khai `application/pdf` nhưng byte
  // không phải PDF ⇒ vẫn chặn. FR-039 chỉ bỏ cửa cho loại LẠ.
  const gia = await nap(Buffer.from("<html><script>x</script>", "utf8"),
    "application/pdf", "gia.pdf")
  ok(gia.ma === 422,
    `khai \`application/pdf\` mà byte không phải PDF ⇒ 422 (được ${gia.ma})`,
    "magic-byte cho định dạng đã biết PHẢI còn — FR-039 chỉ bỏ cửa cho loại lạ")

  console.log("\n4 · `ten_goc` độc KHÔNG được vào `filename=`\n")

  const DOC = ['a".pdf', "a\nb.pdf", "../../etc/passwd", "a\r\nX-Bad: 1.pdf"]
  for (const ten of DOC) {
    const b = Buffer.from(`doc-${DOC.indexOf(ten)}-zzz`, "utf8")
    const sha = createHash("sha256").update(b).digest("hex")
    /*
     * Tên độc đi qua FRONTMATTER, không qua đầu đề `x-ten-goc`.
     *
     * Đo được: undici (và trình duyệt) TỪ CHỐI gửi một đầu đề có xuống dòng —
     * `Headers.append: "a\nb.pdf" is an invalid header value`. Nên đường đầu đề
     * đã có một lớp che ở phía client.
     *
     * Đường KHÔNG có lớp che nào là `frontmatter.media?.[0]?.ten_goc` trong body JSON:
     * nó là dữ liệu, đi thẳng vào DB, rồi `hienVatPhucVu` đọc lại nó để dựng
     * `filename=`. Kiểm đường có sẵn hàng rào mà bỏ qua đường không có là kiểm
     * đúng chỗ không cần kiểm.
     */
    await nap(b, "application/x-dinh-dang-la", "lanh.xyz")
    await goi(CONG, "POST", "/api/articles", {
      body: {
        frontmatter: {
          id: `src_dmd${DOC.indexOf(ten)}01`, slug: `doc-${DOC.indexOf(ten)}`,
          source_type: "tai-lieu",
          url: `https://example.com/doc-${DOC.indexOf(ten)}`,
          protocol_version: "2.0", analyzed_at: "2026-08-28",
          one_liner: "Ban thu ten doc", credibility_max: "plausible",
          conformance: "B", concepts: ["idempotency"], ho_so: "thu-vien",
          media: [{ sha256: sha, mime: "application/x-dinh-dang-la",
                   ten_goc: ten, so_byte: b.length }],
        },
        body: "Ghi chu ngan.",
      },
    })
    const dd = await layDauDe(sha)
    const cd = String(dd.dau["content-disposition"] ?? "")
    // ĐÒI 200 TRƯỚC. Không có vế đó thì mọi request 404 và `cd` là chuỗi rỗng —
    // chuỗi rỗng không chứa ký tự xấu nào, nên cả bốn phép kiểm XANH mà chưa
    // từng đo một `filename=` nào. Vừa xảy ra đúng như vậy ở lượt chạy đầu.
    //
    // So với MỘT khuôn đầy đủ, không đi tìm "ký tự xấu": bản đầu của tôi cấm mọi
    // `"` và đỏ oan trên `filename="051d…​.pdf"` — hai dấu ngoặc kép đó là dấu
    // BAO bắt buộc của cú pháp. Cái nguy là dấu ngoặc kép NẰM TRONG giá trị (nó
    // đóng sớm rồi mở một tham số mới), và một khuôn đầy đủ bắt được điều đó
    // trong khi danh sách ký tự cấm thì không.
    /*
     * WO-091 · Khuôn nới đúng MỘT tham số: `filename*` của RFC 5987.
     *
     * Bản trước đòi đầu đề KẾT THÚC ngay sau `filename="…"`, tức nó khoá luôn
     * bản thiết kế cũ *"chỉ có một tên đã lọc, không gì khác"*. Hệ quả: tên
     * thật không có đường nào đi ra, và người dùng nhận `6714ee19086f.pdf`.
     *
     * Răng KHÔNG bị nới: phần trong `filename="…"` vẫn chỉ bốn lớp ký tự, và
     * phần `filename*` chỉ nhận ký tự đã phần trăm-mã hoá — không `"`, không
     * `;`, không CR/LF, nên vẫn không có gì tách được đầu đề.
     */
    const KHUON = /^(inline|attachment); filename="[A-Za-z0-9._-]+"(; filename\*=UTF-8''[A-Za-z0-9%._~-]+)?$/
    const xau = !KHUON.test(cd)
    ok(dd.ma === 200 && !xau,
      `  \`filename=\` sạch với ten_goc ${JSON.stringify(ten)}`,
      dd.ma !== 200
        ? `chưa phục vụ được (${dd.ma}) — phép kiểm này CHƯA đo gì`
        : `được ${JSON.stringify(cd)}`)
  }

  console.log("\n5 · Trần dung lượng — cổng DUY NHẤT còn ở cửa nhận\n")

  /*
   * 413 KHÔNG đo được bằng `fetch`. Đo được ở B5: undici đẩy hết 26 MB, server
   * trả 413 rồi đóng, và client nhận ECONNRESET trên đường GHI **trước khi** kịp
   * ĐỌC phản hồi ⇒ `fetch` ném, cả file test chết chứ không đỏ một phép kiểm.
   *
   * `flushHeaders()` là bắt buộc: không có nó client giữ đầu đề lại và phép kiểm
   * treo cho tới timeout — hồi B5 tôi suýt kết luận "server đo sau khi đọc hết"
   * từ một sự IM LẶNG ở phía client.
   */
  const TRAN = JSON.parse(readFileSync(
    join(GOC, "core", "assets", "media-mime.json"), "utf8")).tran_byte
  const maTran = await new Promise((xong) => {
    const rq = request({
      host: "127.0.0.1", port: CONG, method: "POST",
      path: "/api/articles/media",
      // `content-length` ĐỌC TỪ TRẦN, không gõ 26214401: `FR-054 §9` nới
      // trần 25 MB → 1 GiB, và một số gõ cứng ở đây ĐỎ ngay lúc trần đổi dù
      // mệnh đề (*"khai vượt trần ⇒ 413 ở CỬA HEADER"*) không đổi một chữ.
      // Chỉ KHAI số lớn, không GỬI byte — đó là cả điểm của phép đo này.
      headers: { "content-type": "application/x-dinh-dang-la",
                 "x-ten-goc": "to.xyz", "content-length": String(TRAN + 1) },
    }, (p) => { p.resume(); xong(p.statusCode) })
    rq.on("error", () => xong("ngat"))
    rq.flushHeaders()
    rq.write(Buffer.alloc(1024 * 1024, 0x41))
  })
  ok(maTran === 413,
    `client KHAI ${TRAN + 1} byte > trần ${TRAN}, mà chỉ GỬI 1 MB`
    + ` ⇒ 413 ngay ở HEADER, chưa đọc byte body nào (được ${maTran})`,
    "bỏ whitelist làm trần thành cổng DUY NHẤT ở cửa nhận — nó không được mất theo")
} finally {
  sv.dung()
  don()
}

chot("định dạng lạ nạp được · phục vụ octet-stream+attachment · PDF không hồi quy")
