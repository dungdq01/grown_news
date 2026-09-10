#!/usr/bin/env node
/**
 * WO-071 · T08-38 — cửa gắn hiện vật THAY theo `kieu_moc`, và `image/*` vào bảng.
 *
 * ── Vì sao phải THAY ────────────────────────────────────────────────────
 * `articles.mjs` gắn bằng `media: [...media, entry]` — THÊM. Sinh thumbnail
 * lần hai đẻ entry thứ hai, và `nenThe` lấy cái ĐẦU = cái CŨ. Đúng bug append
 * của transcript (ô backlog 2026-09-08) còn treo ở tầng cửa.
 *
 * ── Vì sao `image/*` phải VÀO BẢNG ──────────────────────────────────────
 * `luuHienVat` chỉ soi magic `if (loai)` ⇒ mime lạ **lọt qua không kiểm**, và
 * `hienVatPhucVu` trả `octet-stream` + `attachment`. Byte thumbnail đến từ một
 * CDN ngoài, nên lớp thứ sáu của intake vắng đúng lúc cần nó nhất — còn thẻ
 * thì không hiện nổi vì `attachment`.
 */
import { createHash } from "node:crypto"
import { createServer, request as httpReq } from "node:http"
import { readFileSync } from "node:fs"

import { batServer, CAT_FX, CPT_FX, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const CR = String.fromCharCode(13)
const NL2 = String.fromCharCode(10)
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const MIME = JSON.parse(doc("../../core/assets/media-mime.json"))

/* JPEG tối thiểu: magic `ffd8ff`. PNG: `89504e47`. */
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 7)])
const JPG2 = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1]), Buffer.alloc(64, 9)])
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(64, 3)])
const GIA = Buffer.concat([Buffer.from("<html>hack"), Buffer.alloc(64)])
const bam = (b) => createHash("sha256").update(b).digest("hex")

console.log("\nWO-071 · cửa gắn THAY + image/* vào bảng mime\n")

// ── Bảng khai ───────────────────────────────────────────────────────────
{
  const anh = MIME.loai.filter((l) => String(l.mime).startsWith("image/"))
  ok(anh.length >= 2, `0 · bảng mime có ≥2 dòng \`image/*\` (được ${anh.length})`)
  const jpg = MIME.loai.find((l) => l.mime === "image/jpeg")
  const png = MIME.loai.find((l) => l.mime === "image/png")
  ok(jpg?.magic === "ffd8ff", "0a · `image/jpeg` khai magic `ffd8ff`", JSON.stringify(jpg?.magic))
  ok(png?.magic === "89504e47", "0b · `image/png` khai magic `89504e47`", JSON.stringify(png?.magic))
  ok(anh.length > 0 && anh.every((l) => l.xem_truoc === "anh"),
    "0c · cả hai khai `xem_truoc: \"anh\"` — không thì phục vụ `attachment` và thẻ câm")
  ok(anh.length > 0 && anh.every((l) => l.chi_dan_xuat === true),
    "0d · `chi_dan_xuat` — máy sinh, người không nạp ⇒ không thành chip lọc")
  ok(/"anh"/.test(doc("../../core/tests/check_dinh_dang_mo.py")),
    "0e · `check_dinh_dang_mo.py` nhận `anh` trong enum — không thì cổng đỏ vì chính thứ vừa thêm")
  ok(/la_thumbnail/.test(doc("../../core/assets/kho.schema.sql")),
    "0f · `kho.schema.sql` CHECK nhận `la_thumbnail`")
}

const { kho, rac, don } = dungKho("gn-thumb", { chuDe: true })
const sch = dungSchema("gn-thumb", { chuDe: true })
const KHOA = "khoa-thu-cho-cong-thumbnail"
const sv = await batServer({ kho, rac, schema: sch.duong ?? sch,
  loi: { KHOA_DICH_VU: KHOA } })
/* Cửa `hien-vat` là cửa THỢ→LÕI (`FR-047`): đòi `x-khoa-dich-vu` + `x-aud`.
   Không gửi thì cổng đo phép XÁC THỰC, không đo phép GẮN — đỏ sai lý do. */
const DAU = { "x-khoa-dich-vu": KHOA, "x-aud": "loi" }

const nap = (byte, mime) => new Promise((xong, loi) => {
  const req = httpReq({
    host: "127.0.0.1", port: sv.cong, path: "/api/articles/media", method: "POST",
    headers: { "content-type": mime, "content-length": byte.length },
  }, (res) => { res.resume(); res.on("end", () => xong(res.statusCode)) })
  req.on("error", loi)
  req.end(byte)
})

const fm = (slug) => ({
  frontmatter: {
    id: "src_" + slug.replace(/-/g, "").slice(0, 10).padEnd(6, "0"),
    slug, source_type: "video", url: "https://www.tiktok.com/@a/video/12345678",
    protocol_version: "2.0", analyzed_at: "2026-09-09",
    one_liner: "Ban ghi thu cho thumbnail", credibility_max: "plausible",
    conformance: "B", ho_so: "thu-vien",
    category: [CAT_FX[0][0]], concepts: [CPT_FX[0][0]],
  },
  body: "## 1 · Mở\n\nBản ghi thử.\n",
})

try {
  // ── AC3 · magic được kiểm ─────────────────────────────────────────────
  ok(await nap(JPG, "image/jpeg") === 201, "3 · nạp jpg đúng magic ⇒ 201")
  ok(await nap(PNG, "image/png") === 201, "3a · nạp png đúng magic ⇒ 201")
  ok(await nap(GIA, "image/jpeg") === 422,
    "3b · byte KHÔNG phải jpeg mà dán nhãn `image/jpeg` ⇒ 422",
    "byte thumbnail tới từ CDN ngoài — thiếu vế này thì lớp magic vắng đúng chỗ cần")

  const r0 = await goi(sv.cong, "POST", "/api/video", { body: fm("thumb-thu") })
  ok(r0.ma === 201, `4 · tạo bản ghi video ⇒ 201 (được ${r0.ma})`,
    JSON.stringify(r0.json?.loi_validate ?? r0.json).slice(0, 200))

  const gan = (sha, extra) => goi(sv.cong, "POST", "/api/video/video/thumb-thu/hien-vat",
    { headers: DAU,
      body: { sha256: sha, mime: "image/jpeg", ten_goc: "t.jpg",
              kieu_moc: "la_thumbnail", ...extra } })

  // ── AC1 · gắn lần hai VỚI cờ ⇒ THAY ───────────────────────────────────
  {
    const a = await gan(bam(JPG), { thay_kieu_moc: true })
    ok(a.ma === 200, `1 · gắn thumbnail lần đầu ⇒ 200 (được ${a.ma})`,
      JSON.stringify(a.json).slice(0, 200))
    await nap(JPG2, "image/jpeg")
    const b = await gan(bam(JPG2), { thay_kieu_moc: true })
    const m = b.json?.media ?? []
    const anh = m.filter((x) => String(x.mime).startsWith("image/"))
    ok(b.ma === 200 && anh.length === 1,
      `1a · gắn lần HAI với cờ ⇒ media[] còn ĐÚNG MỘT ảnh (được ${anh.length})`,
      JSON.stringify(m).slice(0, 240))
    ok(anh[0]?.sha256 === bam(JPG2),
      "1b · và ảnh còn lại là ảnh MỚI, không phải ảnh cũ",
      "`nenThe` lấy entry đầu — giữ cái cũ nghĩa là người dùng thấy ảnh cũ mãi")
  }

  // ── AC2 · KHÔNG cờ ⇒ hành vi cũ (thêm) — đường transcript không đổi ───
  {
    const VTT = Buffer.from("WEBVTT\n\n00:00.000 --> 00:01.000\nx\n", "utf8")
    await nap(VTT, "text/vtt")
    const c = await goi(sv.cong, "POST", "/api/video/video/thumb-thu/hien-vat",
      { headers: DAU,
        body: { sha256: bam(VTT), mime: "text/vtt", ten_goc: "t.vtt", kieu_moc: "la_asr" } })
    const m = c.json?.media ?? []
    ok(c.ma === 200 && m.some((x) => x.mime === "text/vtt"),
      `2 · gắn .vtt KHÔNG cờ ⇒ THÊM như cũ (được ${c.ma})`)
    ok(m.filter((x) => String(x.mime).startsWith("image/")).length === 1,
      "2a · và ảnh KHÔNG bị đụng — cờ chỉ tác động cùng `kieu_moc`",
      JSON.stringify(m.map((x) => x.mime)))
  }

  // ── AC4 · phục vụ ảnh: inline + đúng content-type + nosniff ───────────
  {
    const r = await new Promise((xong, loi) => {
      const req = httpReq({ host: "127.0.0.1", port: sv.cong, method: "GET",
        path: "/api/articles/media/" + bam(JPG2) }, (res) => {
        res.resume(); res.on("end", () => xong({ ma: res.statusCode, dd: res.headers }))
      })
      req.on("error", loi); req.end()
    })
    ok(r.dd["content-type"] === "image/jpeg",
      "5 · phục vụ đúng `content-type: image/jpeg`", String(r.dd["content-type"]))
    ok(String(r.dd["content-disposition"] ?? "").startsWith("inline"),
      "5a · `inline` — `attachment` thì `<img>` không hiện được",
      String(r.dd["content-disposition"]))
    ok(String(r.dd["x-content-type-options"]) === "nosniff",
      "5b · `nosniff` vẫn đứng — `inline` không mua bằng cách bỏ lớp soi kiểu")
  }
} finally {
  sv.dung()
  don()
}

// ══ LỐI (a) · LÕI TỰ XẾP việc `sinh-thumbnail` sau khi tạo bản ghi ══════
//
// Chủ dự án chọn lối (a): ảnh bìa không phải một quyết định của người dùng.
// Đo bằng một THỢ GIẢ ghi lại mọi `POST /job` — đo THÂN REQUEST tới cửa, không
// đọc nguồn: một `void goiTho(...)` viết đúng mà URL sai thì grep vẫn xanh.
{
  const nhan = []
  const stub = createServer((rq, rs) => {
    let b = ""
    rq.on("data", (c) => { b += c })
    rq.on("end", () => {
      if (rq.method === "POST" && rq.url === "/job") {
        try { nhan.push(JSON.parse(b || "{}")) } catch { nhan.push({ hong: b }) }
      }
      rs.writeHead(200, { "content-type": "application/json" })
      rs.end(JSON.stringify({ viec_id: "x".repeat(32) }))
    })
  })
  await new Promise((x) => stub.listen(0, "127.0.0.1", x))
  const cong2 = stub.address().port

  const k2 = dungKho("gn-thumb-auto", { chuDe: true })
  const s2 = dungSchema("gn-thumb-auto", { chuDe: true })
  const sv2 = await batServer({ kho: k2.kho, rac: k2.rac, schema: s2.duong ?? s2,
    loi: { CHUNGCAT_GOC: `http://127.0.0.1:${cong2}` } })
  const tao = (slug, url) => goi(sv2.cong, "POST", "/api/video", { body: {
    frontmatter: {
      id: "src_" + slug.replace(/-/g, "").slice(0, 10).padEnd(6, "0"),
      slug, source_type: "video", url,
      protocol_version: "2.0", analyzed_at: "2026-09-09",
      one_liner: "Ban ghi thu tu xep", credibility_max: "plausible",
      conformance: "B", ho_so: "thu-vien",
      category: [CAT_FX[0][0]], concepts: [CPT_FX[0][0]],
    },
    body: "## 1 · Mở" + NL2 + NL2 + "Bản ghi thử." + NL2,
  } })
  const cho = () => new Promise((x) => setTimeout(x, 400))
  try {
    const a = await tao("tu-xep-tiktok", "https://www.tiktok.com/@a/video/987654321")
    await cho()
    ok(a.ma === 201, `6 · tạo bản ghi tiktok ⇒ 201 (được ${a.ma})`,
      JSON.stringify(a.json?.loi_validate ?? a.json).slice(0, 200))
    const v = nhan.find((x) => x.slug === "video/tu-xep-tiktok")
    ok(!!v, "6a · LÕI TỰ xếp một việc sau khi ghi — không cần ai bấm",
      JSON.stringify(nhan).slice(0, 200))
    ok(v?.loai === "sinh-thumbnail", "6b · và đúng loại `sinh-thumbnail`", JSON.stringify(v))

    nhan.length = 0
    await tao("tu-xep-youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    await cho()
    ok(nhan.length === 0,
      "6c · YouTube KHÔNG xếp — `nenThe` lớp 2 đã có ảnh từ id, job là lời gọi không mua gì",
      JSON.stringify(nhan).slice(0, 160))

    nhan.length = 0
    await tao("tu-xep-kho", "kho://video/tu-xep-kho")
    await cho()
    ok(nhan.length === 0,
      "6d · `kho://` KHÔNG xếp — byte đã trong kho, không có gì để tải")

    // THỢ CHẾT không được làm hỏng một lần ghi đã thành công.
    await new Promise((x) => stub.close(x))
    const c = await tao("tu-xep-tho-chet", "https://www.tiktok.com/@a/video/111222333")
    await cho()
    ok(c.ma === 201,
      `6e · THỢ CHẾT ⇒ tạo bản ghi VẪN 201 (được ${c.ma})`,
      "fire-and-forget: người vừa đăng ký video không được nhận 500 vì ảnh bìa")
    /*
     * Và LÕI PHẢI CÒN SỐNG.
     *
     * Vế trên một mình là XANH OAN: `201` đã gửi TRƯỚC khi promise vỡ, nên nó
     * xanh cả khi thiếu `.catch()`. Thứ thiếu `.catch()` thật sự gây ra là một
     * unhandled rejection — và từ Node 15 nó GIẾT tiến trình. Bản ghi vào kho
     * xong, rồi cả LÕI chết: đúng ca tệ nhất, và mã trả về không nói gì.
     */
    await cho()
    let song = { ma: 0 }
    try { song = await goi(sv2.cong, "GET", "/api/health") }
    catch (e) { song = { ma: 0, loi: String(e?.message ?? e) } }
    ok(song.ma === 200,
      `6f · và LÕI CÒN SỐNG sau đó (được ${song.ma || "không nối được: " + song.loi})`,
      "thiếu `.catch()` ⇒ unhandled rejection giết tiến trình từ Node 15")
  } finally {
    sv2.dung()
    k2.don()
    try { stub.close() } catch { /* đã đóng */ }
  }
}

// ══ 7 · CỬA SỔ ĐỌC không được nói "không mở được" cho một tấm ảnh ══════
//
// Bug chủ dự án bắt 2026-09-09: mở bản ghi ra thì cửa sổ nói *"Tệp khác · 45 KB
// — Trình duyệt không mở được dạng này"*.
//
// Gốc KHÔNG phải thiếu một nhánh vẽ. Gốc là `image/jpeg` chưa có trong BẢNG:
// mime lạ ⇒ `loai` rơi về `mac_dinh` (*"Tệp khác"*) và rơi luôn nhánh cuối.
// Thêm dòng bảng + `chi_dan_xuat: true` chữa cả hai: ảnh thôi bị coi là hiện
// vật CHÍNH, nên bản ghi video hiện TRÌNH PHÁT — đúng thứ người mở muốn thấy.
//
// Tôi đã thêm một nhánh `xem_truoc === "anh"` rồi GỠ trong cùng lượt: đo được
// nó không bao giờ chạy. Cổng này canh HÀNH VI, không canh nhánh ấy — canh một
// nhánh chết là buộc người sau giữ mã chết.
{
  // BỎ CHÚ THÍCH trước khi đo: chính đoạn chú thích giải thích vì sao nhánh
  // `anh` bị gỡ có chứa đúng chuỗi ấy, và vế 7b tố oan nó. Cùng bài học
  // `check_bang_khai_model` — một cổng đọc lời giải thích rồi tố nó là cổng
  // dạy người ta đừng viết lý do.
  const mwTho = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
  const mw = mwTho.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  const anhDanXuat = MIME.loai
    .filter((l) => String(l.mime).startsWith("image/"))
    .every((l) => l.chi_dan_xuat === true)
  ok(anhDanXuat,
    "7 · MỌI mime ảnh khai `chi_dan_xuat` ⇒ viewer bỏ qua khi tìm hiện vật CHÍNH",
    "thiếu cờ thì ảnh thành `m`, và với mime ngoài bảng thì rơi `mac_dinh` = 'Tệp khác'")
  // Phép tìm phải LỌC theo cờ, không gõ cứng `text/vtt`.
  ok(/chi_dan_xuat/.test(mw),
    "7a · viewer lọc theo cờ `chi_dan_xuat`, không gõ cứng một mime",
    "gõ cứng thì loại dẫn xuất thứ hai (ảnh bìa) lại chiếm chỗ y hệt `.vtt` từng chiếm")
  ok(!/xem_truoc === "anh"/.test(mw),
    "7b · KHÔNG giữ nhánh `anh` chết — trần trang đang âm, mã chết là byte thật",
    "ngày nào ảnh thành hiện vật CHÍNH thì thêm lại, kèm một vế đo được")
}

chot("WO-071 · thumbnail video URL")
