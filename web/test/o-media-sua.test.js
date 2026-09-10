#!/usr/bin/env node
/**
 * WO-013/2 — form sửa tài liệu phải HIỆN hiện vật đang gắn, và thay được nó.
 *
 * `media` KHÔNG mất khi sửa (đo ở `WL-01K9NNWO013`: `{...FM_GOC}` giữ nó, và ca
 * `FM_GOC = null` trả 422 vì schema đòi `media` cho `ho_so: thu-vien`). Đây là
 * THIẾU TÍNH NĂNG, không phải mất dữ liệu — người dùng sửa một tài liệu mà không
 * thấy file của nó.
 *
 * VẾ NẶNG là §3: **lưu mà KHÔNG đổi file thì `sha256` không đổi.** "Thay được
 * file" là chiều dương, và nó xanh cả với một cài đặt ghi đè `media` mỗi lần
 * lưu; chỉ vế này bắt được cài đặt đó.
 *
 * Chạy trên KHO TẠM. Bài học C6b: một bản ghi thử đã đi vào kho THẬT vì tôi trỏ
 * server vào `kb/` thay vì `KB_DIR`.
 */
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, CPT_FX, GOC, batServer, dungKho, dungSchema, goi, napLaiDb, taoKiem, xuatKho } from "./_api.mjs"
import { napRender, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
await napRender()

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const SHA = createHash("sha256").update(PDF).digest("hex")
const PDF2 = Buffer.from("%PDF-1.4\n2 0 obj<</Type/Page>>endobj\n%%EOF\n", "utf8")
const SHA2 = createHash("sha256").update(PDF2).digest("hex")

console.log("\n1 · Màn nạp tài liệu có chỗ HIỆN hiện vật đang gắn\n")

const h = await trangHtml("nap-tai-lieu", { mock: true })
for (const [id, vs] of [
  ["tv-hv-ten", "tên gốc"],
  ["tv-hv-cd", "định dạng + kích cỡ"],
]) {
  ok(h.includes(`id="${id}"`), `màn có mốc \`#${id}\` (${vs})`,
    "không có ⇒ người dùng sửa một tài liệu mà không thấy file của nó")
}
ok(/id="tv-hv-thay"/.test(h), "màn có nút THAY hiện vật",
  "không thay được thì sửa một tài liệu là sửa nhãn, không sửa tài liệu")

console.log("\n2 · FE điền ba mốc đó khi vào chế độ sửa\n")

const js = readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8")
ok(/tv-hv-ten/.test(js) && /tv-hv-cd/.test(js),
  "FE điền tên gốc và định dạng/kích cỡ",
  "mốc có trong markup mà không ai điền là một ô rỗng vĩnh viễn")
ok(/function suaTaiLieu|suaTaiLieu\(/.test(js),
  "có đường sửa RIÊNG cho tài liệu (`suaTaiLieu`)",
  "dùng lại form viết bài là gộp chung tính năng — WO-013/1 vừa tách đường đi")

console.log("\n3 · VÒNG THẬT — lưu mà KHÔNG đổi file thì sha256 KHÔNG đổi\n")

const { kho, rac, don } = dungKho("gn-omedia-kb", { chuDe: true })
mkdirSync(join(kho, "_media"), { recursive: true })
writeFileSync(join(kho, "_media", `${SHA}.pdf`), PDF)
mkdirSync(join(kho, "tai-lieu"), { recursive: true })
writeFileSync(join(kho, "tai-lieu", "tl-om.md"), [
  "---", 'id: "src_tlom001"', 'slug: "tl-om"', 'source_type: "tai-lieu"',
  'url: "kho://tai-lieu/tl-om"', 'protocol_version: "2.0"',
  'analyzed_at: "2026-08-28"', 'one_liner: "Ban thu o media"',
  'credibility_max: "plausible"', 'review_status: "approved"',
  'origin: "manual"', 'conformance: "B"', 'ho_so: "thu-vien"',
  `concepts: ["${CPT_FX[0][0]}"]`, `category: ["${CAT_FX[0][0]}"]`,
  // FR-052 · MANG. Dau `-` bien block map thanh mot phan tu cua mang.
  "media:", `- sha256: "${SHA}"`, '  mime: "application/pdf"',
  '  ten_goc: "bia.pdf"', `  so_byte: ${PDF.length}`,
  "---", "", "Ghi chu ngan.", "",
].join("\n"), "utf8")
napLaiDb(kho, rac)
xuatKho(kho, rac)

const { schema } = dungSchema("gn-omedia-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })
try {
  const truoc = await goi(sv.cong, "GET", "/api/articles/tai-lieu/tl-om")
  ok(truoc.json?.frontmatter?.media?.[0]?.sha256 === SHA, "gieo được bản có hiện vật")

  // Lưu mà KHÔNG đụng `media` — đúng hình dạng FE gửi.
  const fm = { ...truoc.json.frontmatter, one_liner: "Da sua cau tom tat" }
  const r = await goi(sv.cong, "PUT", "/api/articles/tai-lieu/tl-om", {
    body: { frontmatter: fm, body: "Ghi chu da sua." },
    headers: { "if-match": truoc.json.etag },
  })
  ok(r.ma === 200, `PUT không đụng file ⇒ 200 (được ${r.ma})`,
    JSON.stringify(r.json).slice(0, 200))
  const sau = await goi(sv.cong, "GET", "/api/articles/tai-lieu/tl-om")
  ok(sau.json?.frontmatter?.media?.[0]?.sha256 === SHA,
    "  `media.sha256` KHÔNG đổi khi không thay file",
    `được ${sau.json?.frontmatter?.media?.[0]?.sha256} — form đang ghi đè media mỗi lần lưu`)

  console.log("\n4 · THAY file ⇒ trỏ sang sha MỚI, và vẫn qua validate\n")

  const nap = await goi(sv.cong, "POST", "/api/articles/media", {
    tho: PDF2,
    headers: { "content-type": "application/pdf", "x-ten-goc": "bia-moi.pdf" },
  })
  ok(nap.ma === 201 && nap.json?.sha256 === SHA2, `nạp file mới ⇒ ${nap.ma}`)

  const sau2 = await goi(sv.cong, "GET", "/api/articles/tai-lieu/tl-om")
  const fm2 = {
    ...sau2.json.frontmatter,
    media: [{ sha256: SHA2, mime: "application/pdf", ten_goc: "bia-moi.pdf",
             so_byte: PDF2.length }],
  }
  const r2 = await goi(sv.cong, "PUT", "/api/articles/tai-lieu/tl-om", {
    body: { frontmatter: fm2, body: "Ghi chu da sua." },
    headers: { "if-match": sau2.json.etag },
  })
  ok(r2.ma === 200, `PUT với hiện vật MỚI ⇒ 200 (được ${r2.ma})`,
    JSON.stringify(r2.json).slice(0, 220))
  const cuoi = await goi(sv.cong, "GET", "/api/articles/tai-lieu/tl-om")
  ok(cuoi.json?.frontmatter?.media?.[0]?.sha256 === SHA2,
    "  `media` trỏ sang hiện vật mới",
    `được ${cuoi.json?.frontmatter?.media?.[0]?.sha256}`)
} finally {
  sv.dung()
  don()
}


console.log("\n5 · RĂNG cho ca 'form ghi đè media' — bundle, không phải trình duyệt\n")

/*
 * §3 đo qua HTTP nên nó KHÔNG thấy được lỗi nằm hoàn toàn trong trình duyệt:
 * `suaTaiLieu` gán `hienVatCho = null` thay vì con trỏ cũ thì người dùng bấm
 * "Lưu thay đổi" và `media` thành `null` — mà mọi phép kiểm HTTP vẫn xanh vì
 * chúng tự dựng payload.
 *
 * Đo được: tôi phá đúng dòng đó và `npm test` VẪN exit 0. Nên răng này đọc
 * BUNDLE và đòi `suaTaiLieu` lấy `hienVatCho` TỪ bản ghi.
 */
const iSua = js.indexOf("function suaTaiLieu")
// Cắt bằng NGOẶC KHỚP, không bằng dấu xuống dòng + ngoặc nhọn: chữ ký của
// `suaTaiLieu` trải HAI dòng và kết thúc bằng ngoặc nhọn mở, nên mốc đó trúng
// ngay chữ ký — lát cắt thành chữ ký, thân hàm nằm ngoài, phép kiểm đỏ oan.
const thanSua = (() => {
  if (iSua < 0) return ""
  const b = js.indexOf("{", js.indexOf(")", iSua))
  let sau = 0
  for (let k = b; k < js.length; k++) {
    if (js[k] === "{") sau++
    else if (js[k] === "}") { sau--; if (!sau) return js.slice(b, k + 1) }
  }
  return ""
})()
ok(iSua > 0, "tìm được thân `suaTaiLieu`")
/*
 * T03-105 · ĐO ĐƯỜNG SỬA, không đo MỘT HÀM.
 *
 * Phép này từng quét riêng thân `suaTaiLieu`. `WO-045` tách phần điền form ra
 * `dienFormSua()` để `noiLaiSua()` dùng LẠI sau khi `doiView` điều hướng —
 * hành vi KHÔNG đổi, chỉ chỗ đặt đổi, và cổng đỏ vì nó đo chỗ đặt.
 *
 * Tính chất cần giữ vẫn nguyên: `hienVatCho` phải lấy từ `media` của bản ghi,
 * không phải `null`. Nên phép đo nay quét CẢ đường sửa — `suaTaiLieu` HOẶC
 * `dienFormSua` — kèm một vế phủ định.
 */
const thanDien = (() => {
  const i = js.indexOf("function dienFormSua")
  if (i < 0) return ""
  const b = js.indexOf("{", js.indexOf(")", i))
  let sau = 0
  for (let k = b; k < js.length; k++) {
    if (js[k] === "{") sau++
    else if (js[k] === "}") { sau--; if (!sau) return js.slice(b, k + 1) }
  }
  return ""
})()
const duongSua = thanSua + thanDien
ok(/hienVatCho\s*=\s*m\b/.test(duongSua),
  "đường SỬA gán `hienVatCho` TỪ `media` của bản ghi",
  "gán `null` ⇒ bấm Lưu là `media` biến mất, và mọi phép kiểm HTTP vẫn xanh vì "
  + "chúng tự dựng payload — đúng lỗ vừa đo được")
ok(!/hienVatCho\s*=\s*null/.test(duongSua),
  "và KHÔNG nhánh nào trong đường sửa gán thẳng `hienVatCho = null`")
ok(/SUA_TL[\s\S]{0,400}method:\s*"PUT"/.test(js) || /SUA_TL \? await fetch/.test(js),
  "đang SỬA thì PUT, không POST",
  "POST khi sửa ⇒ 409 trùng slug, người dùng đọc ra 'hỏng'")

chot("form sửa hiện hiện vật · không đụng thì sha giữ nguyên · thay được")
