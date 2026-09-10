#!/usr/bin/env node
/**
 * SỬA · XOÁ · KHÔI PHỤC — chạy thật, cả BA loại, trong MỘT kho.
 *
 * `ba-duong-nap-that` canh nửa đầu vòng đời (tạo + đọc). Đây là nửa sau, và nó
 * mang luật NẶNG NHẤT của dự án:
 *
 *   M08-R4 · xoá là CHUYỂN SANG `_recycle`, không bao giờ `unlink`
 *   M09-R1 · byte hiện vật phải sống sót lần xoá — `recycle` là một trong năm
 *            nhánh của `tham_chieu_media`; bỏ sót nó thì MỖI DELETE phá byte
 *            VĨNH VIỄN, và `phucHoi()` sau đó VẪN BÁO THÀNH CÔNG (nó chạy lại
 *            validate, mà validate không bao giờ thấy blob)
 *   M08-R5 · client KHÔNG đặt được `review_status`/`origin`; địa chỉ
 *            (`id`/`slug`/`source_type`) bất biến qua PUT
 *
 * `vong-doi-bai.test.js` đã đi vòng này cho **một** bài viết. Thứ ở đây khác:
 * cả ba loại cùng một kho, nên một `xoaBai` xoá nhầm bảng, hay một `recycle`
 * chỉ phủ `articles`, sẽ lộ ra — với một loại duy nhất thì không có gì để lẫn.
 */
import { createHash } from "node:crypto"

import { banGhi, batServer, CAT_FX, CPT_FX, dungKho, dungSchema, goi, taoKiem }
  from "./_api.mjs"

const { ok, chot } = taoKiem()
const { kho, rac, don } = dungKho("gn-vong-doi-ba", { chuDe: true })
const { schema } = dungSchema("gn-vong-doi-ba-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })

const CAT = CAT_FX[0][0]
const CPT = CPT_FX[0][0]
const chung = (n, st) => ({
  id: `src_vongba${n}${n}${n}`, source_type: st, protocol_version: "2.0",
  analyzed_at: "2026-08-29", credibility_max: "plausible", conformance: "B",
  concepts: [CPT], category: [CAT],
})
const noiLoi = (r) => String(r.json?.loi_validate ?? JSON.stringify(r.json)).slice(0, 260)

try {
  console.log("\n0 · Gieo một bản MỖI LOẠI vào cùng một kho\n")

  const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
  const SHA = createHash("sha256").update(PDF).digest("hex")
  const up = await goi(sv.cong, "POST", "/api/articles/media", {
    tho: PDF, headers: { "content-type": "application/pdf", "x-ten-goc": "kem.pdf" },
  })
  ok(up.ma === 201 && up.json?.sha256 === SHA, "nạp byte hiện vật ⇒ 201", noiLoi(up))

  const mau = banGhi({ id: "src_vongba111", slug: "vd-bai" })
  const than = mau.split("---\n\n")[1]
  const GIEO = [
    ["article", "/api/bai-viet", {
      ...chung(1, "article"), slug: "vd-bai", title: "Bài vòng đời",
      url: "https://example.com/vd-bai", one_liner: "Bản thử vòng đời bài viết",
    }, than],
    ["tai-lieu", "/api/tai-lieu", {
      ...chung(2, "tai-lieu"), slug: "vd-tai-lieu", ho_so: "thu-vien",
      title: "Tài liệu vòng đời", url: "https://example.com/vd-tl",
      one_liner: "Bản thử vòng đời tài liệu",
      media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "kem.pdf",
               so_byte: PDF.length }],
    }, "Ghi chú tài liệu."],
    ["video", "/api/video", {
      ...chung(3, "video"), slug: "vd-video", ho_so: "thu-vien",
      title: "Video vòng đời", one_liner: "Bản thử vòng đời video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }, "Ghi chú video."],
  ]
  for (const [st, duong, fm, b] of GIEO) {
    const r = await goi(sv.cong, "POST", duong, { body: { frontmatter: fm, body: b } })
    ok(r.ma === 201, `  ${st} ⇒ 201 (được ${r.ma})`, noiLoi(r))
  }

  console.log("\n1 · SỬA — M08-R5: client không đặt được trạng thái, địa chỉ bất biến\n")

  for (const [st, , fm, thanGoc] of GIEO) {
    const truoc = await goi(sv.cong, "GET", `/api/articles/${st}/${fm.slug}`)
    const cu = truoc.json?.frontmatter ?? {}
    // Client CỐ TÌNH nhét hai thứ nó không được đặt — nhưng KHÔNG đổi slug:
    // server TỪ CHỐI HẲN request có slug khác (400), nên nhét nó vào đây thì
    // cả lần sửa hỏng và mọi phép dưới xanh/đỏ vì lý do khác.
    const r = await goi(sv.cong, "PUT", `/api/articles/${st}/${fm.slug}`, {
      body: {
        frontmatter: {
          ...cu, one_liner: `ĐÃ SỬA · ${st}`,
          review_status: "approved", origin: "external",
        },
        // GIỮ thân gốc: hồ sơ `phan-tich` của bài viết đòi khung 5 mục, nên
        // thay nó bằng một câu là 422 `Thiếu mục` — và đó là server ĐÚNG.
        body: thanGoc,
      },
      headers: { "if-match": truoc.json?.etag ?? "" },
    })
    ok(r.ma === 200, `${st} · PUT ⇒ 200 (được ${r.ma})`, noiLoi(r))

    const sau = await goi(sv.cong, "GET", `/api/articles/${st}/${fm.slug}`)
    const f2 = sau.json?.frontmatter ?? {}
    ok(f2.one_liner === `ĐÃ SỬA · ${st}`, `  nội dung ĐÃ đổi`, JSON.stringify(f2.one_liner))
    // Địa chỉ bất biến — thử RIÊNG, và đòi 400. Lượt đầu tôi nhét `slug` khác
    // vào chính lần sửa trên; server từ chối cả request, nên phép này xanh vì
    // KHÔNG CÓ GÌ ĐỔI CẢ — xanh vô nghĩa, đúng lớp lỗi đang săn.
    const t2 = await goi(sv.cong, "GET", `/api/articles/${st}/${fm.slug}`)
    const doi = await goi(sv.cong, "PUT", `/api/articles/${st}/${fm.slug}`, {
      body: {
        frontmatter: { ...(t2.json?.frontmatter ?? {}), slug: "dia-chi-khac" },
        body: thanGoc,
      },
      headers: { "if-match": t2.json?.etag ?? "" },
    })
    ok(doi.ma === 400, `  đổi \`slug\` qua PUT bị TỪ CHỐI (được ${doi.ma})`,
      "địa chỉ đổi được là mất mọi liên kết đã phát (M08-R5)")
    const f3 = (await goi(sv.cong, "GET", `/api/articles/${st}/${fm.slug}`)).json
    ok(f3?.frontmatter?.slug === fm.slug, "  và bản ghi vẫn ở địa chỉ cũ",
      JSON.stringify(f3?.frontmatter?.slug))
    ok(f2.origin !== "external", "  `origin` client gửi bị LỌT bỏ (M08-R5)",
      `giữ nguyên ${JSON.stringify(f2.origin)}`)
  }

  console.log("\n2 · Hiện vật SỐNG SÓT qua lần sửa\n")

  const tl = await goi(sv.cong, "GET", "/api/articles/tai-lieu/vd-tai-lieu")
  ok(tl.json?.frontmatter?.media?.[0]?.sha256 === SHA,
    "`media.sha256` không đổi sau PUT",
    `được ${tl.json?.frontmatter?.media?.[0]?.sha256}`)
  const byte = await goi(sv.cong, "GET", `/api/articles/media/${SHA}`)
  ok(byte.ma === 200, "  và byte vẫn phục vụ được", `được ${byte.ma}`)

  console.log("\n3 · XOÁ — M08-R4: chuyển sang thùng rác, KHÔNG unlink\n")

  // DELETE đòi `If-Match` — lượt đầu tôi quên và cả ba trả 400, khiến §4 và §5
  // xanh VÔ NGHĨA (chẳng có gì bị xoá thì byte tất nhiên còn, và bản ghi tất
  // nhiên còn trong danh sách).
  for (const [st, , fm] of GIEO) {
    const g = await goi(sv.cong, "GET", `/api/articles/${st}/${fm.slug}`)
    ok(!!g.json?.etag, `  ${st} · lấy được etag để xoá`)
    const r = await goi(sv.cong, "DELETE", `/api/articles/${st}/${fm.slug}`, {
      headers: { "if-match": g.json?.etag ?? "" },
    })
    ok(r.ma === 200 || r.ma === 204, `${st} · DELETE ⇒ ${r.ma}`, noiLoi(r))
  }

  // TỰ KIỂM VẬT LIỆU cho §4: phải THỰC SỰ biến mất khỏi danh sách trước khi
  // nói bất cứ điều gì về byte.
  for (const [st, duong, fm] of GIEO) {
    const ds = await goi(sv.cong, "GET", duong)
    const slugs = (ds.json?.items ?? []).map((b) => b.slug)
    ok(!slugs.includes(fm.slug), `  \`${fm.slug}\` ĐÃ rời \`${duong}\``,
      `được [${slugs.join(", ")}] — chưa xoá thật thì §4 xanh vô nghĩa`)
  }
  const thung = await goi(sv.cong, "GET", "/api/recycle")
  const trongThung = JSON.stringify(thung.json ?? {})
  for (const [st, , fm] of GIEO) {
    ok(trongThung.includes(fm.slug), `  \`${fm.slug}\` (${st}) CÓ trong thùng rác`,
      "xoá mà không vào thùng là `unlink` trá hình — M08-R4")
  }

  console.log("\n4 · M09-R1 — byte hiện vật SỐNG SÓT lần xoá\n")

  // Đây là luật nặng nhất. `recycle` là một trong NĂM nhánh của
  // `tham_chieu_media`; bỏ sót nó thì mỗi DELETE phá byte VĨNH VIỄN, và
  // `phucHoi()` sau đó VẪN báo thành công.
  const byte2 = await goi(sv.cong, "GET", `/api/articles/media/${SHA}`)
  ok(byte2.ma === 200,
    "byte vẫn phục vụ được SAU khi bản ghi bị xoá",
    `được ${byte2.ma} — bản duy nhất trỏ vào byte này đã vào thùng; nếu luật mồ `
    + "côi không tính nhánh `recycle` thì byte đã bị dọn và khôi phục sẽ ra một "
    + "bản ghi TRỎ VÀO HƯ KHÔNG mà vẫn báo thành công")

  console.log("\n5 · KHÔI PHỤC — bản ghi quay lại đúng loại của nó\n")

  for (const [st, , fm] of GIEO) {
    const r = await goi(sv.cong, "POST", `/api/articles/${st}/${fm.slug}/restore`)
    ok(r.ma === 200 || r.ma === 201, `${st} · restore ⇒ ${r.ma}`, noiLoi(r))
  }
  for (const [st, duong, fm] of GIEO) {
    const ds = await goi(sv.cong, "GET", duong)
    const slugs = (ds.json?.items ?? []).map((b) => b.slug)
    ok(slugs.includes(fm.slug), `  \`${fm.slug}\` trở lại \`${duong}\``,
      `được [${slugs.join(", ")}] — khôi phục vào NHẦM bảng thì màn của loại đó `
      + "mất một bản mà không ai báo")
  }

  const cuoi = await goi(sv.cong, "GET", "/api/articles/tai-lieu/vd-tai-lieu")
  ok(cuoi.json?.frontmatter?.media?.[0]?.sha256 === SHA,
    "và tài liệu khôi phục vẫn giữ ĐÚNG hiện vật",
    `được ${cuoi.json?.frontmatter?.media?.[0]?.sha256}`)
} finally {
  sv.dung()
  don()
}

chot("sửa · xoá · khôi phục chạy thật trên cả ba loại · byte sống sót · địa chỉ bất biến")
