#!/usr/bin/env node
/**
 * AC-2.4.x (M09) — SÁU ĐẦU ĐỀ AN TOÀN trên đường phục vụ hiện vật (FR-036/B6).
 *
 * Đo trên SERVER THẬT, không soi mã nguồn. Một đầu đề khai trong code mà không
 * tới được trình duyệt là một đầu đề KHÔNG TỒN TẠI — đúng lớp lỗi
 * `PRAGMA foreign_keys = ON` của repo này: khai trong header DDL suốt mấy tháng
 * mà không cơ chế nào bật, vô hại chỉ vì DDL không có FK nào.
 *
 * Đây là lần đầu byte do NGƯỜI DÙNG nạp được phục vụ lại **same-origin**. Nếu
 * `nosniff` vắng thì một file HTML-có-script dán nhãn `application/pdf` (đã bị
 * magic-byte chặn ở cửa nạp — nhưng lớp thứ hai tồn tại vì lớp thứ nhất có thể
 * sai) được trình duyệt re-sniff và CHẠY trong gốc của chính trang.
 *
 * Bảng khai lái phép kiểm: `content-type` và `content-disposition` so với
 * `core/assets/media-mime.json`, KHÔNG so với một chuỗi gõ tay ở đây. Gõ tay là
 * bản thứ hai, và bản thứ hai luôn là bản sẽ lệch.
 */
import { createHash } from "node:crypto"
import { request as httpReq } from "node:http"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { batServer, dungKho, taoKiem } from "./_api.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const GOC = join(TEST, "..", "..")
const { ok, chot } = taoKiem()

const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const LOAI_THEO_MIME = new Map(BANG.loai.map((l) => [l.mime, l]))

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n", "utf8")
const PPTX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(64)])
const MIME_PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
const bam = (b) => createHash("sha256").update(b).digest("hex")

const { kho, rac, don } = dungKho("gn-daude")

/** Request thô — cần `res.headers` NGUYÊN VĂN, không qua lớp gói của fetch. */
function goiTho(cong, method, duong, headers = {}) {
  return new Promise((xong, loi) => {
    const req = httpReq({ host: "127.0.0.1", port: cong, path: duong, method, headers },
      (res) => {
        const phan = []
        res.on("data", (c) => phan.push(c))
        res.on("end", () => xong({
          ma: res.statusCode, dd: res.headers, byte: Buffer.concat(phan),
        }))
      })
    req.on("error", loi)
    req.end()
  })
}

const sv = await batServer({ kho, rac })
try {
  const nap = (byte, mime) => new Promise((xong, loi) => {
    const req = httpReq({
      host: "127.0.0.1", port: sv.cong, path: "/api/articles/media", method: "POST",
      headers: { "content-type": mime, "content-length": byte.length },
    }, (res) => { res.resume(); res.on("end", () => xong(res.statusCode)) })
    req.on("error", loi)
    req.end(byte)
  })

  const taoBanGhi = (slug, sha, mime, soByte) => new Promise((xong, loi) => {
    const than = JSON.stringify({
      frontmatter: {
        // `id` phai khop `^src_[a-z0-9]{6,}$` — nen PAD, khong cat. Ban dau toi
        // sinh `src_tlpdf` (5 ky tu) va no bi schema chan, trong khi
        // `src_tlpptx` (6) di qua: mot fixture do do nua la mot fixture day
        // nguoi doc di sai huong.
        id: `src_${(slug.replace(/[^a-z0-9]/g, "") + "000000").slice(0, 8)}`, slug,
        source_type: "tai-lieu", url: `kho://tai-lieu/${slug}`,
        protocol_version: "2.0", analyzed_at: "2026-08-27",
        one_liner: `Hien vat ${slug}`, credibility_max: "plausible",
        conformance: "B", concepts: ["idempotency"], ho_so: "thu-vien",
        media: [{ sha256: sha, mime, ten_goc: "goc.bin", so_byte: soByte }],
      },
      body: "Ghi chu ngan.",
    })
    const req = httpReq({
      host: "127.0.0.1", port: sv.cong, path: "/api/articles", method: "POST",
      headers: { "content-type": "application/json", "content-length": Buffer.byteLength(than) },
    }, (res) => {
      const p = []
      res.on("data", (c) => p.push(c))
      res.on("end", () => xong({ ma: res.statusCode, than: Buffer.concat(p).toString() }))
    })
    req.on("error", loi)
    req.end(than)
  })

  console.log("\n1 · Tien de — nap byte roi tao ban ghi tro tới no\n")

  ok(await nap(PDF, "application/pdf") === 201, "nap PDF ⇒ 201")
  ok(await nap(PPTX, MIME_PPTX) === 201, "nap PPTX ⇒ 201")
  const rTao = await taoBanGhi("tl-pdf", bam(PDF), "application/pdf", PDF.length)
  ok(rTao.ma === 201, "tao ban ghi tro PDF ⇒ 201", rTao.than.slice(0, 200))
  const rTao2 = await taoBanGhi("tl-pptx", bam(PPTX), MIME_PPTX, PPTX.length)
  ok(rTao2.ma === 201, "tao ban ghi tro PPTX ⇒ 201", rTao2.than.slice(0, 200))

  console.log("\n2 · Sau dau de, do bang res.headers CUA REQUEST THAT\n")

  const r = await goiTho(sv.cong, "GET", `/api/articles/media/${bam(PDF)}`)
  ok(r.ma === 200, "GET hien vat co ban ghi tro ⇒ 200", `duoc ${r.ma}`)
  ok(Buffer.compare(r.byte, PDF) === 0, "than tra ve DUNG byte, khong lech mot byte")

  const mongDoi = LOAI_THEO_MIME.get("application/pdf")
  ok(r.dd["content-type"] === mongDoi.mime,
    "1 · content-type tu ENUM DONG trong media-mime.json",
    `khai ${mongDoi.mime}, tra ${r.dd["content-type"]}`)
  ok(r.dd["x-content-type-options"] === "nosniff",
    "2 · x-content-type-options: nosniff",
    "vang no ⇒ blob dan nhan sai bi re-sniff thanh HTML va CHAY same-origin")
  ok(String(r.dd["content-disposition"] ?? "").startsWith("inline"),
    `3 · content-disposition: inline (xem_truoc: ${mongDoi.xem_truoc})`,
    `tra ${r.dd["content-disposition"]}`)
  const csp = String(r.dd["content-security-policy"] ?? "")
  ok(/default-src\s+'none'/.test(csp) && /object-src\s+'none'/.test(csp)
     && /\bsandbox\b/.test(csp),
    "4 · content-security-policy o HEADER: default-src none · object-src none · sandbox",
    `tra ${csp || "(vang)"}`)
  ok(String(r.dd.etag ?? "").includes(bam(PDF)),
    "5 · etag LA dia chi noi dung (sha256)", `tra ${r.dd.etag}`)
  ok(/immutable/.test(String(r.dd["cache-control"] ?? "")),
    "6 · cache-control: immutable — hop phap vi dia chi theo noi dung",
    `tra ${r.dd["cache-control"]}`)
  ok(!("accept-ranges" in r.dd) || r.dd["accept-ranges"] === "none",
    "KHONG hua Range o v1 — hua ma khong cai la hua doi")

  console.log("\n3 · attachment CHINH LA chinh sach xem truoc cua ppt/word\n")

  const rP = await goiTho(sv.cong, "GET", `/api/articles/media/${bam(PPTX)}`)
  const mongP = LOAI_THEO_MIME.get(MIME_PPTX)
  ok(rP.ma === 200, "GET PPTX ⇒ 200", `duoc ${rP.ma}`)
  ok(rP.dd["content-type"] === mongP.mime, "content-type cua pptx tu bang khai")
  // Bang khai lai phep kiem: `xem_truoc: "the"` ⇒ attachment. Doi bang thi phep
  // kiem doi theo, khong phai sua tay o hai cho.
  const mongDisp = mongP.xem_truoc === "iframe" ? "inline" : "attachment"
  ok(String(rP.dd["content-disposition"] ?? "").startsWith(mongDisp),
    `xem_truoc "${mongP.xem_truoc}" ⇒ content-disposition: ${mongDisp}`,
    `tra ${rP.dd["content-disposition"]}`)
  ok(String(rP.dd["content-disposition"] ?? "").includes(mongP.duoi),
    `filename mang duoi ${mongP.duoi} tu bang khai`,
    `tra ${rP.dd["content-disposition"]}`)

  console.log("\n4 · 304 — etag co nhanh, khong phai trang tri\n")

  // `?? '"chua-co"'` khong phai phong xa: khi etag chua duoc cai thi
  // `r.dd.etag` la `undefined`, va `setHeader` NEM — ca file test chet o day,
  // truoc khi in duoc mot dong nao ve bon phep kiem con lai. Phep kiem phai
  // SONG SOT qua dung thu no dang cham.
  const r304 = await goiTho(sv.cong, "GET", `/api/articles/media/${bam(PDF)}`,
    { "if-none-match": r.dd.etag ?? '"chua-co-etag"' })
  ok(r304.ma === 304, "If-None-Match khop ⇒ 304", `duoc ${r304.ma}`)
  ok(r304.byte.length === 0, "304 khong mang than")
  const rKhac = await goiTho(sv.cong, "GET", `/api/articles/media/${bam(PDF)}`,
    { "if-none-match": '"khong-khop"' })
  ok(rKhac.ma === 200 && rKhac.byte.length > 0,
    "If-None-Match KHONG khop ⇒ 200 co than (khong 304 oan)", `duoc ${rKhac.ma}`)

  console.log("\n5 · Bon ca choi\n")

  const rDang = await goiTho(sv.cong, "GET", "/api/articles/media/khong-phai-sha")
  ok(rDang.ma === 400 || rDang.ma === 404,
    "sha256 lech dang ⇒ 400/404, khong 500", `duoc ${rDang.ma}`)
  const rVang = await goiTho(sv.cong, "GET", `/api/articles/media/${"f".repeat(64)}`)
  ok(rVang.ma === 404, "sha256 khong co trong kho ⇒ 404", `duoc ${rVang.ma}`)

  // MO COI: byte CO trong kho (vua nap PPTX o §1... nhung no da co ban ghi).
  // Nen nap mot blob thu ba va KHONG tao ban ghi nao cho no.
  const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    Buffer.alloc(32)])
  ok(await nap(DOC, "application/msword") === 201, "  (tien de) nap mot blob KHONG ai tro")
  const rMoCoi = await goiTho(sv.cong, "GET", `/api/articles/media/${bam(DOC)}`)
  ok(rMoCoi.ma === 404,
    "blob CO byte ma KHONG ban ghi nao tro ⇒ 404 (staging khong phai cong khai)",
    `duoc ${rMoCoi.ma} — mot blob dang dien form khong duoc phuc vu ra ngoai`)

  // 405, KHONG 400. Do duoc mot lan: de mac thi request nay roi xuong cong cau
  // truc `:type/:slug` va nhan 400 "type phai thuoc: …" — cau tra loi NOI SAI
  // CHO (bao duong dan sai trong khi thu sai la METHOD), va nguoi goi doc no
  // roi di sua URL.
  const rDel = await goiTho(sv.cong, "DELETE", `/api/articles/media/${bam(PDF)}`)
  ok(rDel.ma === 405, "method khac GET tren duong phuc vu ⇒ 405", `duoc ${rDel.ma}`)
  ok(rDel.dd.allow === "GET", "405 kem `Allow: GET` — khong thi 405 khong noi duoc gi",
    `tra ${rDel.dd.allow}`)
  const rPut = await goiTho(sv.cong, "PUT", "/api/articles/media")
  ok(rPut.ma === 405 && rPut.dd.allow === "POST",
    "PUT tren duong NAP ⇒ 405 kem `Allow: POST`",
    `duoc ${rPut.ma} · allow=${rPut.dd.allow}`)
} finally {
  sv.dung()
  don()
}

chot("sau dau de an toan · bang khai lai phep kiem · staging khong ra ngoai")
