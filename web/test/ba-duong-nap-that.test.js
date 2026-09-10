#!/usr/bin/env node
/**
 * BA ĐƯỜNG NẠP, CHẠY THẬT, TRONG MỘT KHO.
 *
 * Từng mảnh đã có cổng riêng: `luong-nap-bai` · `thu-vien-nap` · `nap-video` ·
 * `man-tai-lieu` · `man-video`. Thứ **chưa ai làm**: một NGƯỜI dùng làm cả ba
 * việc trong MỘT phiên, rồi đọc lại bằng chính các màn họ sẽ mở.
 *
 * Vì sao vế đó khác: mỗi cổng module gieo **chỉ loại của nó**, nên câu *"màn A
 * không lẫn loại khác"* ở đó xanh một cách rỗng — không có gì để lẫn. Chỉ khi cả
 * ba cùng nằm trong một kho thì phép lọc mới bị thử thật.
 *
 * Và đây là chỗ canh LUẬT THƯỜNG TRỰC của người dùng — *"ba module tách biệt ở
 * MỌI tầng; chỉ Kho và Tổng hợp được gộp"* — ở tầng DỮ LIỆU THẬT, không ở markup.
 *
 * §6 canh WO-022 đi trọn đường: id YouTube phải giữ nguyên chữ hoa sau khi
 * `normalize_url()` của Python chạm vào nó.
 */
import { createHash } from "node:crypto"

import { banGhi, batServer, CAT_FX, CPT_FX, dungKho, dungSchema, goi, taoKiem }
  from "./_api.mjs"

const { ok, chot } = taoKiem()
const { kho, rac, don } = dungKho("gn-ba-duong-that", { chuDe: true })
const { schema } = dungSchema("gn-ba-duong-that-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })

const CAT = CAT_FX[0][0]
const CPT = CPT_FX[0][0]
// `id` phải ≥ 6 ký tự sau `src_` (schema `^src_[a-z0-9]{6,}$`). Lượt đầu tôi đặt
// `src_khoi1` và cả ba đường trả 422 — fixture sai, không phải hệ thống sai.
const chung = (n, st) => ({
  id: `src_khoiphien${n}`, source_type: st, protocol_version: "2.0",
  analyzed_at: "2026-08-29", credibility_max: "plausible", conformance: "B",
  concepts: [CPT], category: [CAT],
})
const noiLoi = (r) => String(r.json?.loi_validate ?? JSON.stringify(r.json)).slice(0, 300)

try {
  console.log("\n1 · BÀI VIẾT — form viết bài\n")

  const mau = banGhi({ id: "src_khoiphien1", slug: "khoi-bai" })
  const than = mau.split("---\n\n")[1]
  const r1 = await goi(sv.cong, "POST", "/api/bai-viet", {
    body: {
      frontmatter: {
        ...chung(1, "article"), slug: "khoi-bai", title: "Bài của phiên khói",
        url: "https://example.com/khoi-bai", one_liner: "Bản thử đường bài viết",
      },
      body: than,
    },
  })
  ok(r1.ma === 201, `POST /api/bai-viet ⇒ 201 (được ${r1.ma})`, noiLoi(r1))

  console.log("\n2 · TÀI LIỆU — byte TRƯỚC, bản ghi SAU\n")

  const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
  const SHA = createHash("sha256").update(PDF).digest("hex")
  const up = await goi(sv.cong, "POST", "/api/articles/media", {
    tho: PDF,
    headers: { "content-type": "application/pdf", "x-ten-goc": "bao-cao.pdf" },
  })
  ok(up.ma === 201, `nạp byte ⇒ 201 (được ${up.ma})`, noiLoi(up))
  // M09-R2 · máy tính sha, không nhận từ client. So với sha ta tự băm.
  ok(up.json?.sha256 === SHA, "  sha256 do MÁY tính, khớp byte gửi lên (M09-R2)",
    `máy trả ${up.json?.sha256}`)

  const r2 = await goi(sv.cong, "POST", "/api/tai-lieu", {
    body: {
      frontmatter: {
        ...chung(2, "tai-lieu"), slug: "khoi-tai-lieu", ho_so: "thu-vien",
        title: "Tài liệu của phiên khói", url: "https://example.com/khoi-tl",
        one_liner: "Bản thử đường tài liệu",
        media: [{ sha256: up.json?.sha256, mime: "application/pdf",
                 ten_goc: "bao-cao.pdf", so_byte: PDF.length }],
      },
      body: "Ghi chú về tài liệu này.",
    },
  })
  ok(r2.ma === 201, `POST /api/tai-lieu ⇒ 201 (được ${r2.ma})`, noiLoi(r2))

  console.log("\n3 · VIDEO — đăng ký URL\n")

  const r3 = await goi(sv.cong, "POST", "/api/video", {
    body: {
      frontmatter: {
        ...chung(3, "video"), slug: "khoi-video", ho_so: "thu-vien",
        title: "Video của phiên khói", one_liner: "Bản thử đường video",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      body: "Ghi chú về video này.",
    },
  })
  ok(r3.ma === 201, `POST /api/video ⇒ 201 (được ${r3.ma})`, noiLoi(r3))

  console.log("\n4 · Đọc lại — mỗi màn CHỈ thấy loại của nó\n")

  // Vế NẶNG: cả ba đang nằm trong CÙNG một kho, nên "không lẫn loại khác" ở đây
  // có nội dung — khác với cổng từng module, nơi chỉ có một loại tồn tại.
  for (const [duong, cho, la] of [
    ["/api/bai-viet", "khoi-bai", ["khoi-tai-lieu", "khoi-video"]],
    ["/api/tai-lieu", "khoi-tai-lieu", ["khoi-bai", "khoi-video"]],
    ["/api/video", "khoi-video", ["khoi-bai", "khoi-tai-lieu"]],
  ]) {
    const ds = await goi(sv.cong, "GET", duong)
    const slugs = (ds.json?.items ?? []).map((b) => b.slug)
    ok(slugs.includes(cho), `${duong} có \`${cho}\``, `được [${slugs.join(", ")}]`)
    ok(!la.some((x) => slugs.includes(x)), "  và KHÔNG lẫn loại khác",
      `được [${slugs.join(", ")}]`)
  }

  console.log("\n5 · Kho TRỘN phải thấy CẢ BA\n")

  const idx = await goi(sv.cong, "GET", "/api/index")
  const het = (idx.json?.articles ?? []).flatMap((g) => g.bans ?? [])
    .map((b) => String(b.slug).split("/").pop())
  for (const s of ["khoi-bai", "khoi-tai-lieu", "khoi-video"]) {
    ok(het.includes(s), `/api/index có \`${s}\``,
      `được [${het.join(", ")}] — Kho và Tổng hợp là HAI màn duy nhất được trộn`)
  }

  console.log("\n6 · `url_normalized` do MÁY điền, và id video GIỮ chữ hoa (WO-022)\n")

  const v = await goi(sv.cong, "GET", "/api/articles/video/khoi-video")
  const un = v.json?.frontmatter?.url_normalized
  ok(un === "youtube.com/watch?v=dQw4w9WgXcQ",
    `url_normalized = ${JSON.stringify(un)}`,
    "máy phải tự chuẩn hoá (một công thức, `normalize_url()` của Python) và GIỮ "
    + "NGUYÊN chữ hoa của id — hạ chữ thường là trỏ vào một video khác")
} finally {
  sv.dung()
  don()
}

chot("ba đường nạp chạy thật · ba màn tách · kho trộn đủ · url_normalized do máy")
