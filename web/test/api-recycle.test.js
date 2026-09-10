#!/usr/bin/env node
/**
 * AC-2.3.1 (M08) — xoá là RECYCLE, không bao giờ mất dữ liệu (M08-R4).
 *
 * kb/ là thứ backup F4 gọi là "mất là mất tất cả" — nút xoá trên web vì thế
 * không được unlink. Test đo: byte nguyên vẹn trong _recycle/, restore về đúng
 * chỗ, restore đè ⇒ 409, xoá hai lần ⇒ hậu tố epoch (bản trước không bị đè).
 */
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { batServer, dungKho, goi, taoKiem } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-api-recycle-kb")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

try {
  console.log("\n1 · DELETE giữ nguyên byte\n")

  const gocByte = readFileSync(join(kho, "article", "bai-nhap.md"))
  let r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  r = await goi(CONG, "DELETE", "/api/articles/article/bai-nhap",
    { headers: { "if-match": r.json.etag } })
  ok(r.ma === 200, `DELETE ⇒ 200 — được ${r.ma}`)
  // FR-034: rác là bảng `recycle`, export mang hậu tố stt — đường trả trong
  // response, không đoán tên file.
  ok(readFileSync(join(rac, r.json.recycle_path)).equals(gocByte),
    "export trong _recycle/ byte-equal bản gốc — snapshot nguyên văn fm+thân")

  r = await goi(CONG, "GET", "/api/recycle")
  ok(r.json.items.length === 1 && r.json.items[0].slug === "bai-nhap",
    `GET /api/recycle thấy 1 bản — được ${r.json?.items?.length}`)

  console.log("\n2 · Restore về đúng chỗ\n")

  r = await goi(CONG, "POST", "/api/articles/article/bai-nhap/restore")
  ok(r.ma === 200, `restore ⇒ 200 — được ${r.ma}`)
  ok(readFileSync(join(kho, "article", "bai-nhap.md")).equals(gocByte),
    "bài về đúng chỗ cũ, byte nguyên vẹn")
  r = await goi(CONG, "GET", "/api/recycle")
  ok(r.json.items.length === 0, "thùng rác trống lại")

  console.log("\n3 · Restore đè ⇒ 409, xoá 2 lần ⇒ hậu tố epoch\n")

  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  r = await goi(CONG, "DELETE", "/api/articles/article/bai-nhap",
    { headers: { "if-match": r.json.etag } })
  const racPath1 = r.json.recycle_path
  // dựng lại bài cùng tên qua POST, rồi thử restore đè
  const fmMoi = {
    id: "src_nhap02", slug: "bai-nhap", source_type: "article",
    url: "https://example.com/khac", protocol_version: "2.0",
    analyzed_at: "2026-08-19", one_liner: "Bản mới cùng slug",
    credibility_max: "claimed", conformance: "B", concepts: ["idempotency"],
  }
  const than = readFileSync(join(rac, racPath1), "utf8").split(/---\r?\n\r?\n/)[1]
  r = await goi(CONG, "POST", "/api/articles", { body: { frontmatter: fmMoi, body: than } })
  ok(r.ma === 201, `POST bài mới cùng slug ⇒ 201 — được ${r.ma} ${JSON.stringify(r.json).slice(0, 100)}`)
  r = await goi(CONG, "POST", "/api/articles/article/bai-nhap/restore")
  ok(r.ma === 409, `restore khi kho đã có bài cùng tên ⇒ 409, không đè — được ${r.ma}`)

  // xoá bản mới ⇒ trong rác đã có bai-nhap.md ⇒ bản hai phải mang hậu tố
  r = await goi(CONG, "GET", "/api/articles/article/bai-nhap")
  r = await goi(CONG, "DELETE", "/api/articles/article/bai-nhap",
    { headers: { "if-match": r.json.etag } })
  ok(r.ma === 200, `xoá lần hai ⇒ 200 — được ${r.ma}`)
  const trongRac = readdirSync(join(rac, "article"))
  // FR-034: MỌI bản trong rác mang hậu tố stt (autoincrement) — hai lần xoá
  // cùng slug là hai hàng, không bản nào đè bản nào.
  ok(trongRac.length === 2 && trongRac.every((t) => /^bai-nhap\.\d+\.md$/.test(t)),
    `2 bản trong rác, mỗi bản một stt — được: ${trongRac.join(", ")}`)

  console.log("\n4 · Không đường xoá thùng rác qua API\n")

  r = await goi(CONG, "DELETE", "/api/recycle")
  ok(r.ma === 404, `DELETE /api/recycle không tồn tại ⇒ 404 — được ${r.ma}`)
} finally {
  sv.dung()
  don()
}

chot("xoá thuận nghịch: byte nguyên vẹn, restore an toàn, không unlink")
