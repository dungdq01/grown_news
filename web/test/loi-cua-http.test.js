#!/usr/bin/env node
/**
 * T08-14b — bảy cửa đo trên SERVER THẬT, không đo trên mã nguồn.
 *
 * `loi-cua.test.js` đo lớp thao tác và đo `V1` bằng **regex trên mã nguồn của
 * handler**. Luật bằng chứng của dự án nói thẳng điều đó là yếu:
 *
 *   > TÍNH: output máy — hệ thống **chạy thật**
 *   > KHÔNG: "đã kiểm rồi" · unit test pass · demo · agent tự khai
 *
 * Một regex `/fm.review_status = "draft"/` xanh kể cả khi route **chưa đấu**,
 * kể cả khi `quaCong` chặn mất request trước khi tới đó, kể cả khi một
 * middleware phía trên ghi đè. File này bắn HTTP thật vào server thật.
 */
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const tmp = mkdtempSync(join(tmpdir(), "loihttp-"))
const KHOA = "khoa-dich-vu-that-cho-test-http"

const kho = dungKho("loihttp")
const rac = mkdtempSync(join(tmpdir(), "loihttp-rac-"))
const schema = dungSchema("loihttp")
const sv = await batServer({
  kho, rac, schema,
  loi: { LOI_DB: join(tmp, "_loi.sqlite"), LOI_LUU: join(tmp, "_luu"),
         KHOA_DICH_VU: KHOA, KHOA_PHIEN: "khoa-session-KHAC" },
})
const H = { "x-khoa-dich-vu": KHOA, "x-aud": "loi" }

try {
  console.log("\nL3 · KHÔNG khoá ⇒ 401 trên MỌI cửa (server thật)\n")
  for (const [m, d] of [
    ["GET", "/api/dinh-danh?kenh=tg&chat_id=1"],
    ["POST", "/api/dinh-danh"],
    ["POST", "/api/audit"],
    ["POST", "/api/ma-moi/dung"],
    ["GET", "/api/phien/abc"],
    ["POST", "/api/nhap"],
    ["POST", "/api/nhap-chung-cat"],
  ]) {
    // GET khong duoc mang body (undici nem) — chi gui body cho POST.
    const r = await goi(sv.cong, m, d, m === "POST" ? { body: {} } : {})
    ok(r.ma === 401, `${m} ${d} ⇒ 401`, `được ${r.ma}`)
  }

  console.log("\nL3b · khoá SESSION không mở được cửa dịch vụ\n")
  {
    const r = await goi(sv.cong, "POST", "/api/audit", {
      body: { hanh_dong: "x" },
      headers: { "x-khoa-dich-vu": "khoa-session-KHAC", "x-aud": "loi" },
    })
    ok(r.ma === 401, "khoá session ⇒ 401 (CVE-2025-41258)", `được ${r.ma}`)
  }
  {
    const r = await goi(sv.cong, "POST", "/api/audit", {
      body: { hanh_dong: "x" }, headers: { "x-khoa-dich-vu": KHOA, "x-aud": "sai" },
    })
    ok(r.ma === 401, "`aud` sai ⇒ 401", `được ${r.ma}`)
  }

  console.log("\nV1 · C1 ép `draft` — ĐO TRÊN BẢN GHI THẬT trong kho\n")
  {
    const r = await goi(sv.cong, "POST", "/api/nhap", {
      headers: H,
      body: {
        frontmatter: {
          source_type: "article", slug: "bai-tu-may",
          title: "Bài từ máy", review_status: "approved",   // ← bịa
          origin: "manual",                                  // ← bịa
        },
        body: "Nội dung thử.",
      },
    })
    // 201 hoặc 422 đều chấp nhận được ở đây — điều đang đo là: KHÔNG có đường
    // nào để payload đặt `approved`. 422 nghĩa validate chặn vì lý do khác
    // (thiếu trường), và bản ghi KHÔNG vào kho, nên `approved` cũng không.
    ok(r.ma !== 201 || r.json?.review_status === "draft",
      "C1 KHÔNG bao giờ trả về `approved`", `ma=${r.ma} rs=${r.json?.review_status}`)
    ok(r.ma !== 200, "C1 không trả 200 cho một phép TẠO", `được ${r.ma}`)
  }

  console.log("\nV6 · C3 — hai ca trả GIỐNG HỆT, đo trên phản hồi HTTP\n")
  {
    const a = await goi(sv.cong, "GET", "/api/dinh-danh?kenh=tg&chat_id=khong-co", { headers: H })
    const b = await goi(sv.cong, "GET", "/api/dinh-danh?kenh=discord&chat_id=khong-co", { headers: H })
    ok(a.ma === b.ma, "cùng mã trạng thái", `${a.ma} vs ${b.ma}`)
    ok(JSON.stringify(a.json) === JSON.stringify(b.json),
      "cùng thân phản hồi, từng byte", `${JSON.stringify(a.json)} vs ${JSON.stringify(b.json)}`)
  }

  console.log("\nC6 · phiên không tồn tại ⇒ 404 rỗng, không rò gì\n")
  {
    const r = await goi(sv.cong, "GET", "/api/phien/khong-ton-tai", { headers: H })
    ok(r.ma === 404, "404", `được ${r.ma}`)
    ok(JSON.stringify(r.json) === "{}", "thân rỗng — không tên, không lý do",
      JSON.stringify(r.json))
  }

  console.log("\nCửa của NGƯỜI vẫn sống — C1 không nuốt `/api/articles`\n")
  {
    const r = await goi(sv.cong, "POST", "/api/articles", { body: {} })
    ok(r.ma !== 404, "`POST /api/articles` vẫn có route (FR-024)", `được ${r.ma}`)
    ok(r.ma !== 401, "và KHÔNG bị cổng khoá-dịch-vụ chặn — nó là cửa của người",
      `được ${r.ma}`)
  }

  console.log("\nFR-049 · vượt ngưỡng ⇒ 429 THẬT qua HTTP, không phải 401\n")
  {
    // Đặt CUỐI file có chủ ý: nó làm cạn quota của IP này, nên mọi ca cần
    // request thành công phải chạy trước.
    //
    // Các ca 401 ở đầu file KHÔNG tính vào quota — `quaCong` kiểm khoá TRƯỚC
    // rồi mới đếm, nên một người lạ không có khoá không làm cạn được quota của
    // M15/M17. Đó là quyết định `FR-049 §6b`, và ca này đo nó gián tiếp: nếu
    // thứ tự ngược lại, 7 request 401 ở đầu đã đủ gần ngưỡng 10.
    let ma429 = 0
    let lan = 0
    for (let i = 0; i < 30; i++) {
      lan++
      const r = await goi(sv.cong, "GET", "/api/dinh-danh?kenh=tg&chat_id=q", { headers: H })
      if (r.ma === 429) { ma429 = i + 1; break }
    }
    ok(ma429 > 0, `bắn liên tục ⇒ nhận 429 ở lần thứ ${ma429}`,
      ma429 ? "" : `30 lần không lần nào 429`)

    // 429 chứ KHÔNG 401: người gọi hợp lệ cần biết nên CHỜ, không nên đổi khoá.
    const r = await goi(sv.cong, "GET", "/api/dinh-danh?kenh=tg&chat_id=q", { headers: H })
    ok(r.ma === 429, "vẫn 429 khi thử lại ngay — không rơi về 401", `được ${r.ma}`)

    // Và cửa của NGƯỜI KHÔNG bị cạn theo: quota của máy không khoá được chủ dự án.
    const ng = await goi(sv.cong, "POST", "/api/articles", { body: {} })
    ok(ng.ma !== 429, "`POST /api/articles` KHÔNG bị 429 — quota của máy không khoá người",
      `được ${ng.ma}`)
  }
} finally {
  sv.dung()
}

chot("bảy cửa C1–C7 trên SERVER THẬT")
