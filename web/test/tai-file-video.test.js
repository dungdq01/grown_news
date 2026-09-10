#!/usr/bin/env node
/**
 * WO-058 · FR-075 · T08-37 + T03-128 — TẢI FILE .mp4 rồi GHI ĐƯỢC vào kho.
 *
 * Chủ dự án 2026-09-09: *"Nơi phát này không nằm trong danh sách nhận… dù tôi
 * tải file .mp4"*. Người dùng làm đúng thứ màn mời (*"…hoặc tải lên file"*) và
 * cửa từ chối bằng một câu nói về thứ họ chưa nhập.
 *
 * ── Hai tầng cùng đòi `url` vô điều kiện ────────────────────────────────
 * FE `ghiVideo()` mở đầu bằng `if (!hostVideoHopLe(tho)) return`, và
 * `hienVatVideo` — biến giữ hiện vật vừa nạp — KHÔNG AI ĐỌC (khai 331, gán 392,
 * hết). Server `CONG.video` thì `if (!u) return 422`.
 *
 * ── Vì sao đây là FR chứ không phải một dòng sửa ────────────────────────
 * `frontmatter.schema.json allOf[6]` khai `anyOf [media | url]`, và
 * `M11_video/spec:38` CHÉP LẠI đúng câu đó — nhưng `spec:11` nói *"không byte,
 * không dòng media"*. Spec tự chỏi, và bản FROZEN không sửa được không qua FR.
 * `FR-075` duyệt lối A: byte HOẶC url.
 *
 * Cổng đo cả hai tầng, và đo tầng server trên SERVER THẬT.
 */
import { createHash } from "node:crypto"
import { request as httpReq } from "node:http"
import { readFileSync } from "node:fs"

import { batServer, CAT_FX, CPT_FX, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"
import { taiSan } from "./_render.mjs"

const { ok, chot } = taoKiem()
const CR = String.fromCharCode(13)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const NV = boCT(doc("../plugins/napvideo/src/napvideo.inline.ts"))

const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 32]), Buffer.from("ftyp"), Buffer.alloc(48),
])
const SHA = createHash("sha256").update(MP4).digest("hex")

console.log("\nWO-058 · tải file .mp4 rồi ghi được vào kho\n")

// ══ PHẦN I · FE (T03-128) ═══════════════════════════════════════════════
{
  const iGhi = NV.indexOf("async function ghiVideo")
  const than = iGhi < 0 ? "" : NV.slice(iGhi, NV.indexOf("\n}", iGhi))
  ok(iGhi >= 0, "0 · tìm được thân `ghiVideo` để đo")

  ok(than.includes("hienVatVideo"),
    "1 · `ghiVideo` ĐỌC `hienVatVideo`",
    "hôm nay biến ấy khai ở 331, gán ở 392, và KHÔNG AI ĐỌC — ô file là trang trí")
  ok(/media\s*:/.test(than),
    "2 · payload có nhánh gửi `media`",
    "schema `anyOf [media|url]` cho phép; FE chưa bao giờ gửi vế media")
  // AC3 · câu lỗi khi CHƯA nhập gì phải nhắc CẢ HAI lối.
  ok(/t[aả]i\s*(l[eê]n\s*)?(file|t[eệ]p)/i.test(than) && /link|url|đ[iị]a ch[iỉ]/i.test(than),
    "3 · có một câu lỗi nhắc CẢ `link` LẪN `tải file`",
    "câu cũ nói *nơi phát không nằm trong danh sách* với người chưa dán nơi phát nào")
  // AC4 · đường URL không được nới: kiểm host vẫn còn.
  ok(than.includes("hostVideoHopLe"),
    "4 · đường URL VẪN kiểm host (M11-R3) — FR-075 §4 không nới whitelist")
  /*
   * Neo CHINH XAC vao dieu kien, khong dung mot mau `[\s\S]{0,200}` roi tin no:
   * mau long ay khop CA khoi `if (!tho && !hienVatVideo)` nam ngay tren, nen
   * phep thu do-duoc 2026-09-09 bat duoc no XANH OAN khi da hoan nguyen bug.
   */
  ok(/if\s*\(\s*tho\s*&&\s*!hostVideoHopLe\(/.test(than),
    "4b · kiểm host nằm sau `tho &&` — chỉ chạy khi CÓ url người dán",
    "vô điều kiện thì đường tải file chết ngay dòng đầu của `ghiVideo`")
}

// ══ PHẦN II · SERVER (T08-37) — trên server THẬT ════════════════════════
/*
 * `chuDe: true` ở CẢ HAI chỗ. `check_danh_muc.py` so `categories.yaml` với
 * `enum category` của schema, và `khoVaSchemaLech()` chặn nếu kho tạm đi với
 * schema repo — lệch một bên là 409/500, không phải một vế đỏ dễ đọc.
 */
const { kho, rac, don } = dungKho("gn-taifilevideo", { chuDe: true })
const sch = dungSchema("gn-taifilevideo", { chuDe: true })
const sv = await batServer({ kho, rac, schema: sch.duong ?? sch })

const napByte = () => new Promise((xong, loi) => {
  const req = httpReq({
    host: "127.0.0.1", port: sv.cong, path: "/api/articles/media", method: "POST",
    headers: { "content-type": "video/mp4", "content-length": MP4.length,
               "x-ten-goc": encodeURIComponent("Thầy ôn.mp4") },
  }, (res) => { res.resume(); res.on("end", () => xong(res.statusCode)) })
  req.on("error", loi)
  req.end(MP4)
})

const fm = (slug, { url, media } = {}) => ({
  frontmatter: {
    id: "src_" + slug.replace(/-/g, "").slice(0, 10).padEnd(6, "0"),
    slug, source_type: "video",
    protocol_version: "2.0", analyzed_at: "2026-09-09",
    one_liner: `Ban ghi thu ${slug}`, credibility_max: "plausible",
    conformance: "B", ho_so: "thu-vien",
    category: [CAT_FX[0][0]], concepts: [CPT_FX[0][0]],
    ...(url ? { url } : {}),
    ...(media ? { media } : {}),
  },
  body: "## 1 · Mở\n\nMột đoạn thân bài ngắn cho bản ghi thử.\n",
})

try {
  ok(await napByte() === 201, "5 · nạp byte mp4 vào kho ⇒ 201")

  const HV = [{ sha256: SHA, mime: "video/mp4", ten_goc: "Thầy ôn.mp4",
                so_byte: MP4.length }]

  /*
   * NAM CA cua `FR-075 §3.1`. `url` van BAT BUOC — no nam trong `required`
   * GOC cua schema FROZEN — nen duong tai file dung quy uoc `kho://` mà
   * `tai-lieu` da dung tu dau (`kb/tai-lieu/*.md` · `multiwindow:1328`).
   */
  // Ca 1 · dán link, host hợp lệ.
  {
    const r = await goi(sv.cong, "POST", "/api/video",
      { body: fm("dan-link", { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }) })
    ok(r.ma === 201, `6 · \`url\` host hợp lệ ⇒ 201 (được ${r.ma})`,
      `lỗi: ${JSON.stringify(r.json?.loi ?? r.json?.loi_validate ?? r.json).slice(0, 240)}`)
  }

  // Ca 2 · TẢI FILE — `kho://video/<slug>` + media. ĐÂY là ca người báo bug.
  {
    const r = await goi(sv.cong, "POST", "/api/video",
      { body: fm("tai-file", { url: "kho://video/tai-file", media: HV }) })
    ok(r.ma === 201, `7 · \`kho://video/<slug>\` + media ⇒ 201 (được ${r.ma})`,
      `lỗi: ${JSON.stringify(r.json?.loi ?? r.json?.loi_validate ?? r.json).slice(0, 240)}`)
  }

  // Ca 3 · `kho://` mà KHÔNG có byte — một url nội bộ trỏ vào hư không.
  {
    const r = await goi(sv.cong, "POST", "/api/video",
      { body: fm("kho-rong", { url: "kho://video/kho-rong" }) })
    ok(r.ma === 422, `8 · \`kho://\` KHÔNG kèm media ⇒ 422 (được ${r.ma})`,
      "một địa chỉ trong kho mà không có byte nào là một bản ghi rỗng")
  }

  // Ca 4 · host NGOÀI whitelist ⇒ 422, và có media cũng KHÔNG miễn.
  {
    const a = await goi(sv.cong, "POST", "/api/video",
      { body: fm("host-la", { url: "https://ke-xau.example/v/1" }) })
    ok(a.ma === 422, `9 · host ngoài whitelist ⇒ 422 (được ${a.ma})`)
    const b = await goi(sv.cong, "POST", "/api/video",
      { body: fm("host-la-byte", { url: "https://ke-xau.example/v/2", media: HV }) })
    ok(b.ma === 422, `9a · host lạ KÈM media ⇒ VẪN 422 (được ${b.ma})`,
      "nếu media miễn phép kiểm host thì `anyOf` thành CỬA SAU cho url xấu")
  }

  // Ca 5 · `url` vắng hẳn ⇒ 422, và câu lỗi phải nêu CẢ HAI lối.
  {
    const r = await goi(sv.cong, "POST", "/api/video", { body: fm("khong-gi-ca") })
    const c = String(r.json?.loi ?? r.json?.loi_validate ?? "")
    ok(r.ma === 422, `10 · thiếu CẢ HAI ⇒ 422 (được ${r.ma})`)
    ok(/media|t[aả]i (l[eê]n |file|t[eệ]p)/i.test(c) && /url|link/i.test(c),
      "10a · câu lỗi nêu CẢ hai lối, không chỉ `url`",
      `nhận: ${JSON.stringify(c).slice(0, 240)}`)
  }

  // ══ PHẦN III · WO-064 · mp4 trong kho phải XEM ĐƯỢC ═══════════════════
  //
  // `FR-075` vừa biến "mp4 trong kho" từ ca biên thành đường CHÍNH, nên
  // `xem_truoc: "tai"` của bảng khai thành lạc hậu — và HAI chỗ dẫn xuất từ nó
  // đều làm đúng việc của mình với một con số sai.
  {
    const MIME = JSON.parse(doc("../../core/assets/media-mime.json"))
    const nhomVideo = MIME.loai.filter((l) => l.nhom_thu_vien === "video")
    ok(nhomVideo.length >= 5, `11 · bảng khai có ${nhomVideo.length} dòng nhóm video`)
    ok(nhomVideo.every((l) => l.xem_truoc === "phat"),
      "11a · MỌI dòng nhóm video khai `xem_truoc: \"phat\"`",
      "còn tai: " + (nhomVideo.filter((l) => l.xem_truoc !== "phat")
        .map((l) => l.duoi).join(" ") || "—"))

    // Cổng của bảng (đất M01) phải NHẬN giá trị mới, không thì nó đỏ vì chính
    // thứ vừa thêm.
    ok(/"phat"/.test(doc("../../core/tests/check_dinh_dang_mo.py")),
      "11b · `check_dinh_dang_mo.py` nhận `phat` trong enum")

    // Viewer: có nhánh dựng thẻ PHÁT gốc của trình duyệt.
    const MW2 = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
    ok(/xem_truoc === "phat"|"phat" ===/.test(MW2),
      "12 · viewer có nhánh `xem_truoc === \"phat\"`")
    ok(/<video[\s>]/.test(MW2) && /<audio[\s>]/.test(MW2),
      "12a · viewer dựng CẢ `<video>` lẫn `<audio>`",
      "mp3/wav cùng nhóm nhưng phải là `<audio>`; một `<video>` cho mp3 là một khung đen")
    ok(/controls/.test(MW2), "12b · thẻ phát có `controls`")
    ok(/preload="metadata"/.test(MW2),
      "12c · `preload=\"metadata\"` — không tải cả file khi mở cửa sổ",
      "trần là 1 GB (FR-054); `preload=auto` là một lần tải cả gigabyte cho một lần mở")

    /*
     * Thẻ phát phải CÓ LUẬT CSS. Không có thì `<video>` ra 300x150 mặc định và
     * tràn khỏi cửa sổ — cùng hạng lỗi `.cd-n[data-i]::before` thiếu `content`
     * (WO-057 cùng ngày): một thẻ có mặt trong DOM mà không ai khai hình.
     * Và `aspect-ratio` chỉ được áp cho `<video>`, không cho `<audio>`.
     */
    const cssP = (await taiSan()).gnCss.replace(/\/\*[^]*?\*\//g, "")
    ok(/video\.hv-p\{/.test(cssP), "12d · có luật CSS cho `video.hv-p`")
    ok(/audio\.hv-p\{/.test(cssP), "12e · có luật RIÊNG cho `audio.hv-p`")
    ok(!/audio\.hv-p\{[^}]*aspect-ratio/.test(cssP),
      "12f · `<audio>` KHÔNG bị ép aspect-ratio",
      "một thanh phát nhạc cao 200px là một ô trống, không phải một trình phát")

    // ĐO TRÊN SERVER THẬT: `attachment` thì `<video>` không phát được.
    const r = await new Promise((xong, loi) => {
      const req = httpReq({ host: "127.0.0.1", port: sv.cong,
        path: "/api/articles/media/" + SHA, method: "GET" }, (res) => {
        res.resume()
        res.on("end", () => xong({ ma: res.statusCode, dd: res.headers }))
      })
      req.on("error", loi)
      req.end()
    })
    ok(r.ma === 200, `13 · GET hiện vật ⇒ 200 (được ${r.ma})`)
    ok(String(r.dd["content-disposition"] ?? "").startsWith("inline"),
      "13a · phục vụ `inline`, không `attachment`",
      `nhận: ${JSON.stringify(r.dd["content-disposition"])} — attachment thì thẻ <video> không phát`)
    ok(String(r.dd["x-content-type-options"] ?? "") === "nosniff",
      "13b · `nosniff` vẫn đứng — `inline` không được đổi lấy lớp soi kiểu")
  }

} finally {
  sv.dung()
  don()
}

chot("WO-058 · tải file video vào kho")
