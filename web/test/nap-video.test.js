#!/usr/bin/env node
/**
 * C6b — ĐƯỜNG TẠO VIDEO. Trước đơn vị này nó **chưa hề tồn tại**.
 *
 * Đo được ở plan (sự thật 6): không tab nạp video, không hàm nào POST
 * `source_type: "video"`. Phần video đã có chỉ là **XEM** (`idVideo()` ·
 * `nhungVideo()`). Đăng ký một video hôm nay phải đi qua form viết bài chung —
 * tức đúng "gộp chung" người dùng cấm.
 *
 * VẾ NẶNG: **FE phải gọi `/api/video`, không gọi `/api/articles`.**
 * Gọi đường cũ vẫn TẠO ĐƯỢC bản video (bí danh còn sống từ FR-040), nên mọi phép
 * kiểm "tạo được video" đều xanh — và cổng riêng của module video (whitelist host
 * phía server) **không chạy**. Đó là cách một tính năng trông đúng mà bỏ qua
 * đúng cái cổng sinh ra cho nó.
 *
 * VẾ NẶNG THỨ HAI: **FE KHÔNG được tự tính `url_normalized`.** Một phép chuẩn
 * hoá thứ hai bằng JS là đúng lớp lỗi `dongBoThe` (hai công thức, không ai đối
 * chiếu). T01-29 cho `validate.py --fix` điền bằng `normalize_url()` — một công
 * thức, chạy một nơi.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, GOC, batServer, dungKho, dungSchema, goi, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
const BANG = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
const HOST = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8")).video_host
await napRender()

function khoiView(html, id) {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}

console.log("\n1 · Màn `/video/nap/` tồn tại và TÁCH BIỆT\n")

const m = BANG.find((x) => x.ten === "nap-video")
ok(!!m, "bảng khai có `nap-video`")
ok(m?.module === "video", `  khai \`module: video\` (được ${m?.module})`)
ok(m?.cat_khi_khac === true, "  bị cắt khỏi trang khác")

let h = ""
try { h = await trangHtml("nap-video", { mock: true }) } catch (e) {
  ok(false, "màn `nap-video` render được", String(e.message ?? e))
}
const v = khoiView(h, m?.id_shell ?? "napvideo")
ok(v.length > 0, `khối \`v-${m?.id_shell}\` có trong trang của nó (${v.length} ký tự)`)
ok(h.includes(`<div class="view on" id="v-${m?.id_shell}"`),
  "  và nó là màn ĐANG MỞ",
  "có mặt trong tài liệu ≠ được HIỆN — đúng lỗ đã bỏ lọt ở C6a")

// Chiều ÂM của "tách biệt": màn này KHÔNG mang lối của hai module kia.
ok(!v.includes('id="f-bai"'),
  "màn nạp Video KHÔNG có form viết bài",
  "form 9 KB của bản phân tích không thuộc màn dán một URL")
ok(!v.includes('id="up-tv-f"'),
  "màn nạp Video KHÔNG có ô chọn hiện vật",
  "video không có byte vào kho — nó vượt trần 25 MB theo định nghĩa")

console.log("\n2 · FE gọi `/api/video`, KHÔNG gọi `/api/articles`\n")

// `jsMoi` = bundle chung + MỌI chunk. Đọc riêng `gnJs` là đọc một phần rồi
// kết luận về toàn thể — `T03-104` dời `ghiVideo`/`ganNapVideo` sang chunk
// `napvideo`, hành vi KHÔNG đổi, và cổng đỏ vì nó đo SAI CHỖ.
const js = (await taiSan()).jsMoi ?? ""
const iFn = js.indexOf("function ghiVideo")
const than = iFn > 0 ? js.slice(iFn, js.indexOf(String.fromCharCode(10) + "}", iFn) + 2) : ""
ok(iFn > 0, "có hàm ghi video riêng (`ghiVideo`)",
  "không có ⇒ đường video đang đi qua hàm của module khác")
ok(than.includes('"/api/video"') || than.includes("'/api/video'"),
  "  gọi `/api/video`",
  "gọi `/api/articles` vẫn tạo được bản video (bí danh còn sống), nên cổng riêng "
  + "của module video KHÔNG chạy — tính năng trông đúng mà bỏ qua cổng của nó")
ok(!than.includes('"/api/articles"'),
  "  và KHÔNG gọi `/api/articles`")

// FE KHÔNG tự tính `url_normalized`: không được dựng dạng chuẩn từ id.
const tuTinh = HOST.some((x) => {
  const goc2 = x.mien.replace(/\./g, "\\.")
  return new RegExp(goc2 + '[^"\'`]*\\$\\{').test(than)
})
ok(!tuTinh && !than.includes("url_normalized"),
  "  KHÔNG tự tính `url_normalized` — `validate.py --fix` điền",
  "một phép chuẩn hoá thứ hai bằng JS là đúng lớp lỗi `dongBoThe`")

console.log("\n3 · Host chặn TẠI CHỖ DÁN (M11-R3)\n")

ok(/video_host/.test(js), "FE đọc whitelist từ bảng khai (`video_host`)")
const iCh = js.indexOf("function ganNapVideo")
/*
 * Cắt thân hàm bằng ĐẾM NGOẶC, không bằng một cửa sổ 2200 ký tự.
 *
 * Cửa sổ cố định TRÀN sang hàm kế bên, và phép kiểm dưới từng XANH nhờ đúng
 * điều đó: `idVideo` nằm ngay sau `ganNapVideo` trong `gn.js`, nên chuỗi
 * `idVideo(` lọt vào cửa sổ dù `ganNapVideo` không hề gọi nó. `T03-104` dời
 * `ganNapVideo` sang chunk (nó thành hàm CUỐI, hết chỗ tràn) và phép kiểm đỏ —
 * lộ ra rằng nó chưa bao giờ đo thứ nó khai đo.
 */
const thanCh = (() => {
  if (iCh < 0) return ""
  const b = js.indexOf("{", js.indexOf(")", iCh))
  let sau = 0
  for (let k = b; k < js.length; k++) {
    if (js[k] === "{") sau++
    else if (js[k] === "}") { sau--; if (!sau) return js.slice(b, k + 1) }
  }
  return ""
})()
ok(iCh > 0, "có hàm gắn màn nạp video (`ganNapVideo`)")
// Tính chất THẬT: form kiểm host NGAY LÚC DÁN. Bằng chứng là `ganNapVideo` gọi
// phép kiểm host trên sự kiện của ô nhập — không phải một chuỗi tình cờ ở gần.
ok(/hostVideoHopLe\(/.test(thanCh),
  "  chặn host ngay lúc dán, không chờ 422 từ máy chủ",
  "chờ 422 nghĩa là người dùng dán xong, điền xong, bấm ghi rồi mới biết sai host")

console.log("\n4 · Vòng THẬT qua HTTP — dán URL hợp lệ ⇒ bản ghi vào kho\n")

const { kho, rac, don } = dungKho("gn-nap-video-kb", { chuDe: true })
const { schema } = dungSchema("gn-nap-video-sc", { chuDe: true })
const sv = await batServer({ kho, rac, schema })
try {
  // Host TRONG whitelist, KHÔNG gửi `url_normalized` — để `--fix` điền. Đây là
  // phép kiểm cho quyết định "một công thức" của T01-29.
  const r = await goi(sv.cong, "POST", "/api/video", {
    body: {
      frontmatter: {
        id: "src_vidc6b01", slug: "video-c6b", source_type: "video",
        url: "https://www.youtube.com/watch?v=abc123nhom9",
        protocol_version: "2.0", analyzed_at: "2026-08-28",
        one_liner: "Ban thu dang ky video", credibility_max: "plausible",
        conformance: "B", concepts: ["idempotency"], category: [CAT_FX[0][0]], ho_so: "thu-vien",
      },
      body: "Ban thu dang ky video.",
    },
  })
  ok(r.ma === 201, `POST /api/video (không gửi url_normalized) ⇒ 201 (được ${r.ma})`,
    `${JSON.stringify(r.json).slice(0, 240)} — nếu 422 vì thiếu url_normalized thì `
    + "`--fix` chưa điền, và FE sẽ buộc phải tự tính")

  const d = await goi(sv.cong, "GET", "/api/articles/video/video-c6b")
  ok(d.json?.frontmatter?.url_normalized === "youtube.com/watch?v=abc123nhom9",
    `  \`url_normalized\` do MÁY điền (được ${d.json?.frontmatter?.url_normalized})`,
    "một công thức: `normalize_url()` của Python, không có bản JS thứ hai")

  const dsV = await goi(sv.cong, "GET", "/api/video")
  ok((dsV.json?.items ?? []).some((b) => b.slug === "video-c6b"),
    "  bản ghi xuất hiện trên `/api/video`")

  // Host NGOÀI whitelist ⇒ cổng SERVER chặn, không chỉ FE.
  const xau = await goi(sv.cong, "POST", "/api/video", {
    body: {
      frontmatter: {
        id: "src_vidc6b02", slug: "video-host-la", source_type: "video",
        url: "https://khong-co-trong-whitelist.example/v/1",
        url_normalized: "khong-co-trong-whitelist.example/v/1",
        protocol_version: "2.0", analyzed_at: "2026-08-28",
        one_liner: "Ban thu host la", credibility_max: "plausible",
        conformance: "B", concepts: ["idempotency"], category: [CAT_FX[0][0]], ho_so: "thu-vien",
      },
      body: "Ban thu host la.",
    },
  })
  ok(xau.ma === 422 && xau.json && "loi" in xau.json,
    `host ngoài whitelist ⇒ 422 từ CỔNG MODULE (được ${xau.ma})`,
    "chặn ở FE là tiện lợi cho NGƯỜI; cổng cho MÁY phải ở server")
} finally {
  sv.dung()
  don()
}

/* ══ T03-109 · Ô FILE MP4 — nguồn PHỤ của bản ghi video ═══════════════════════
 *
 * Chủ dự án chốt (2026-09-04, quyết 4): video nguồn CHÍNH là URL, nguồn PHỤ là
 * MP4 upload. Đo trước đơn vị này: plugin `napvideo` có **0** tham chiếu
 * file/upload/accept — mp4 chỉ vào kho được qua ô file của TÀI LIỆU, vốn không
 * lọc gì. Đó là lỗ `MP4-lạc-bảng` của backlog M12.
 *
 * ĐO NGUỒN CHUNK, không đo DOM: ô file do chính chunk dựng (xem ghi chú dưới),
 * và dựng một bản mô phỏng trình duyệt trong cổng tĩnh là dựng thứ sẽ lệch khỏi
 * trình duyệt thật. Vế "bấm chạy được" là ảnh chụp — NGƯỜI chấm.
 */
{
  const NL = String.fromCharCode(10)
  const chiMa = (x) => x.replace(/[/][*][^]*?[*][/]/g, NL)
    .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)
  const NV = chiMa(readFileSync(
    join(GOC, "web", "plugins", "napvideo", "src", "napvideo.inline.ts"), "utf8"))
  const MM = JSON.parse(readFileSync(
    join(GOC, "core", "assets", "media-mime.json"), "utf8"))
  const nhomVideo = MM.loai.filter((l) => l.nhom_thu_vien === "video")

  console.log(`${NL}T03-109 · ô file MP4 ở màn nạp video${NL}`)

  ok(nhomVideo.length >= 2,
    `bảng khai ${nhomVideo.length} định dạng nhóm video`,
    "không có dòng nào ⇒ `accept` không dẫn xuất được, và mọi mp4 rơi vào "
    + "`mac_dinh` = application/octet-stream")

  ok(/accept/.test(NV) && /type\s*=\s*["'`]file|type = "file"|\.type = "file"/.test(NV),
    "chunk dựng ô `type=file` CÓ `accept`",
    "thiếu `accept` là bài học `#up-tv-f` lặp lại: hộp thoại cho chọn `.exe`, "
    + "người chọn, rồi mới biết là sai")

  /*
   * `accept` phải DẪN XUẤT từ bảng, không gõ tay.
   *
   * Gõ tay thì thêm một dòng mime ở `media-mime.json` sẽ âm thầm không vào
   * `accept` — cùng lớp lỗi WO-018 đã trả giá một lần ở dòng chữ "định dạng
   * nhận" (nó kể `douyin · bilibili` trong khi whitelist có hai host khác).
   */
  ok(!/["'`]video\/mp4["'`]/.test(NV) && /nhom_thu_vien/.test(NV),
    "`accept` dẫn xuất từ `nhom_thu_vien` của bảng, KHÔNG gõ danh sách mime",
    "một danh sách gõ tay ở đây là bản sao thứ hai của bảng khai, và bản thứ "
    + "hai luôn là bên lệch")

  ok(/MEDIA\.tran_byte|tran_byte/.test(NV),
    "trần đọc từ bảng khai — chặn phía FE TRƯỚC khi gửi (AC2)",
    "không chặn ⇒ người chờ hết một lượt tải 800 MB rồi mới nhận 413")

  ok(!/[^_a-zA-Z]1073741824|[^_a-zA-Z]26214400/.test(NV),
    "  và KHÔNG gõ con số trần mồ côi trong mã",
    "một con số trần gõ trong mã là chỗ thứ hai nó được khai; nới ở bảng thì "
    + "chỗ này vẫn chặn theo số cũ và không ai báo")

  ok(/\/api\/articles\/media/.test(NV),
    "upload đi qua CỬA MEDIA SẴN CÓ `/api/articles/media` (AC3)",
    "một cửa ghi mới cho cùng một việc là một cửa nữa phải canh; "
    + "`api-guard` whitelist không được đổi vì đơn vị này")
}

chot("đường tạo video có thật · gọi /api/video · một công thức url_normalized")
