#!/usr/bin/env node
/**
 * M11_video — AC-2.2.1 · AC-2.2.2 · AC-2.3.1 · AC-2.3.2.
 *
 * Spec `06_modules/M11_video/spec.md` khai bốn AC bằng `cmd: node
 * test/man-video.test.js` từ C0 (FR-038) — và FILE ĐÓ CHƯA TỪNG TỒN TẠI. Tức
 * bốn dòng hợp đồng trỏ vào hư không suốt từ lúc mở module. `check_g6b` báo
 * "KHÔNG ai sinh: 2" nhưng nó CẢNH BÁO chứ không đỏ, nên không ai phải dừng.
 *
 * VẾ NẶNG NHẤT là §2 (AC-2.2.2), và không cổng nào trong 71 file đang đo nó:
 * `no-leak.test.js` đo LISTENER rò, không đo REQUEST ra ngoài. Nhúng video là
 * lần đầu sản phẩm này gọi ra mạng ngoài — mở một màn danh sách mà tự gọi
 * youtube là gửi địa chỉ IP người đọc cho bên thứ ba, không ai bấm gì cả.
 *
 * Đo được lúc viết: màn `/video/` có **0 iframe** và **0 src/href tuyệt đối ra
 * ngoài**. Nên cổng này XANH ngay — giá trị của nó là giữ điều đó đúng. Để nó
 * không thành trang trí, §2 tự chứng minh mình ĐỎ ĐƯỢC: dựng một trang giả có
 * đúng cái vi phạm rồi đòi phép đo bắt được.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, CPT_FX, GOC, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
const MEDIA = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
await napRender()

const CAT = CAT_FX.map(([id]) => id)
const CPT = CPT_FX.map(([id]) => id)
const ban = (slug, type, them = {}) => ({
  slug, id: `src_${slug.replace(/-/g, "")}`, title: `Bản ${slug}`,
  source_type: type, review_status: "approved", origin: "manual",
  analyzed_at: "2026-08-20", one_liner: `Bản thử ${slug}`,
  credibility_max: "verified", priority: 3,
  concepts: [CPT[0]], concepts_proposed: [], category: [CAT[0]],
  url_normalized: `example.com/${slug}`,
  ho_so: null, media: null, than: "## Mục\n\nNội dung.", ...them,
})

// Gieo CẢ BA module. Chỉ gieo video thì "màn chỉ hiện video" xanh một cách rỗng
// — không có gì để lọt vào thì phép lọc không được thử.
const BANS = [
  ban("a-article", "article"),
  ban("a-repo", "repo", { category: [CAT[1]] }),
  ban("t-pdf", "tai-lieu", {
    ho_so: "thu-vien", category: [CAT[1]],
    media: [{ sha256: "a".repeat(64), mime: "application/pdf",
             ten_goc: "bia.pdf", so_byte: 1024 }],
  }),
  ban("v-yt", "video", {
    ho_so: "thu-vien", url_normalized: "youtube.com/watch?v=dQw4w9WgXcQ" }),
  ban("v-tt", "video", {
    ho_so: "thu-vien", category: [CAT[1]],
    url_normalized: "tiktok.com/@ai/video/7300000000000000001" }),
]
const DU_LIEU = {
  bans: BANS, mock: true, hong: [],
  concepts: CPT_FX.map(([id, nhan, al]) => ({ id, label_vi: nhan, aliases: al })),
  categories: CAT_FX.map(([id, nhan, gom]) => ({ id, label_vi: nhan, gom })),
  loai_nguon: [],
}

const khoi = (html, id) => {
  const i = html.indexOf(`id="v-${id}"`)
  if (i < 0) return ""
  const j = html.indexOf('<div class="view"', i + 5)
  const k = html.indexOf("</main>", i)
  return html.slice(i, j >= 0 && (k < 0 || j < k) ? j : (k < 0 ? html.length : k))
}
const demThe = (s) => (s.match(/class="cd/g) ?? []).length

console.log("\n0 · TỰ KIỂM vật liệu\n")

const SO_VIDEO = BANS.filter((b) => b.source_type === "video").length
ok(SO_VIDEO === 2, `gieo đúng ${SO_VIDEO} bản video`)
ok(BANS.length - SO_VIDEO === 3, "và 3 bản KHÔNG phải video để có thứ lọt vào")

const html = await trangHtml("video", { data: DU_LIEU })
const V = khoi(html, "video")
ok(V.length > 0, "cắt được khối `v-video`", "không có khối ⇒ mọi phép dưới đo rỗng")

console.log("\n1 · AC-2.2.1 — màn `/video/` CHỈ hiện bản ghi video\n")

ok(demThe(V) === SO_VIDEO,
  `màn hiện đúng ${SO_VIDEO} thẻ`,
  `được ${demThe(V)} — gieo 3 bản loại khác, chúng lọt vào`)

const loai = [...new Set(V.match(/data-loai="([^"]*)"/g) ?? [])]
ok(loai.length === 1 && loai[0] === 'data-loai="video"',
  "mọi thẻ trên màn đều `data-loai=\"video\"`", loai.join(" "))

// Ca âm cho chính phép đếm: nếu `demThe` đếm toàn trang thay vì trong khối, nó
// sẽ ra số của CẢ shell. Đây là lỗi đã trúng ở BUG-2 (`#acount` đếm toàn trang).
ok(demThe(html) > demThe(V),
  "phép đếm có PHẠM VI — toàn trang nhiều thẻ hơn khối `v-video`",
  "bằng nhau ⇒ tôi đang đếm toàn trang và §1 vô nghĩa")

console.log("\n2 · AC-2.2.2 — mở màn ⇒ 0 gọi ra ngoài; `src` chỉ có sau khi bấm\n")

// M09-R3. Đo cả trang, không riêng khối: một `<iframe>` của màn video nằm ở đâu
// trong tài liệu cũng gọi ra ngoài như nhau.
const NGOAI = /(?:src|href|srcset|data-src)\s*=\s*["']https?:\/\/(?!localhost|127\.)/gi
const viPham = html.match(NGOAI) ?? []
ok(viPham.length === 0,
  "0 thuộc tính trỏ tuyệt đối ra host ngoài",
  `${viPham.length} chỗ: ${viPham.slice(0, 3).join(" · ")}`)
ok((html.match(/<iframe/gi) ?? []).length === 0,
  "0 `<iframe>` trong HTML dựng sẵn",
  "iframe có mặt lúc dựng ⇒ trình duyệt tải nó trước khi ai bấm")

// PHÉP ĐO NÀY PHẢI ĐỎ ĐƯỢC. Một cổng xanh trên mã đúng mà chưa ai thử phá thì
// chưa biết nó có bắt gì không — hai lần trong dự án này một cổng đã xanh vì
// phép cắt sai chỗ, không vì luật đúng.
const gia = html.replace("</main>",
  '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe></main>')
ok((gia.match(NGOAI) ?? []).length === 1 && (gia.match(/<iframe/gi) ?? []).length === 1,
  "  và phép đo ĐỎ ĐƯỢC: chèn một iframe youtube thì cả hai vế bắt",
  "không bắt ⇒ hai vế trên là trang trí")

// Vế thứ hai của AC: `src` được dựng KHI BẤM. Đo trên byte đã build.
// `jsMoi` = bundle chung + MOI chunk (T03-104). Doc rieng `gnJs` la doc mot
// phan roi ket luan ve toan the — ma nap video nay song trong chunk.
const js = (await taiSan()).jsMoi ?? ""
const i = js.indexOf("function nhungVideo")
const than = i >= 0 ? js.slice(i, js.indexOf("\n}", i) + 2) : ""
ok(than.length > 0, "tìm được `nhungVideo` trong `gn.js`")
ok(/\.src\s*=\s*h\.nhung/.test(than),
  "  `src` chỉ được gán TRONG `nhungVideo` (hàm của cú bấm)",
  "gán ở chỗ khác ⇒ nó chạy lúc dựng màn, không lúc bấm")
ok(/id_mau/.test(than) && than.indexOf("id_mau") < than.indexOf(".src"),
  "  và `id_mau` được kiểm TRƯỚC khi gán `src` (M09-R3)",
  "kiểm sau khi gán là không kiểm")

console.log("\n3 · AC-2.3.1 — host ngoài whitelist chặn Ở FE\n")

const iH = js.indexOf("function hostVideoHopLe")
const thanH = iH >= 0 ? js.slice(iH, js.indexOf("\n}", iH) + 2) : ""
ok(thanH.length > 0, "có `hostVideoHopLe` phía FE",
  "không có ⇒ người dùng biết sai sau khi bấm Ghi, không lúc dán")
/*
 * Nhận CẢ HAI cách đọc bảng khai: `MEDIA.video_host` (bundle chung) và
 * `mediaCua().video_host` (chunk `napvideo` — `T03-104` đọc bảng qua
 * `globalThis.__GN_MEDIA__` vì tự khai `__MEDIA__` sẽ nhúng thêm 6590 byte).
 *
 * Tính chất cần giữ KHÔNG phải một cách viết, mà là: whitelist đến TỪ BẢNG
 * KHAI. Nên có thêm vế phủ định — không tên miền nào gõ tay trong thân hàm.
 */
ok(/\bvideo_host\b/.test(thanH),
  "  đọc whitelist TỪ BẢNG KHAI, không gõ tay tên miền")
// KHÔNG thêm vế "không tên miền nào gõ tay": `hostVideoHopLe` CÓ một tên gõ
// tay có chủ đích — `PHU = { "youtube.com": ["youtu.be"] }`, vì `youtu.be` là
// tên rút gọn CÙNG NHÀ mà FE tự sinh ra. Một phép phủ định quét cả thân hàm
// sẽ phạt đúng ngoại lệ đã được ghi lý do — tôi thêm nó rồi gỡ ngay trong
// cùng lượt. Vế trên (`video_host` đến từ bảng khai) mới là tính chất thật.
// So theo hậu tố CÓ DẤU CHẤM: `includes("youtube.com")` khớp cả
// `youtube.com.ke-xau.example`.
ok(/endsWith\(["'`]\.["'`]\s*\+/.test(thanH) || /endsWith\("\." \+/.test(thanH),
  "  so theo hậu tố có dấu chấm, không `includes`",
  "`includes` cho lọt `youtube.com.ke-xau.example`")
ok(js.includes("hostVideoHopLe("),
  "  và nó ĐƯỢC GỌI — một phép kiểm không ai gọi là chú thích")

console.log("\n4 · AC-2.3.2 — form nạp có ô `category` + `concepts` từ danh mục\n")

const hN = await trangHtml("nap-video", { data: DU_LIEU })
const N = khoi(hN, "napvideo")
ok(N.length > 0, "cắt được khối `v-napvideo`")
for (const [ten, hau] of [["chủ đề", "cat"], ["khái niệm", "cpt"]]) {
  // KHÔNG đoán tiền tố id. Lượt đầu tôi đo bằng `nv-` và nó FAIL trong khi ô CÓ
  // THẬT (id thật là `vd-`) — suýt đi sửa MÀN thay vì sửa PHÉP ĐO. Đo hai vế độc
  // lập: CHỮ người đọc thấy, và MỘT Ô thật sự tồn tại cho chiều đó.
  ok(new RegExp(ten, "i").test(N), `form nạp video có nhãn "${ten}"`)
  ok(new RegExp(`id="[a-z0-9-]*-${hau}"`).test(N),
    `  và có ô nhận giá trị \`${hau}\``,
    "thiếu ô ⇒ mọi bản video vào kho không nhãn và facet rỗng vĩnh viễn")
}
// Nhãn phải ĐẾN TỪ danh mục, không phải người gõ tự do: một nhãn ngoài danh mục
// là một nhãn không cổng 5/5b nào của `validate.py` nhận.
ok(/napDanhMuc|\/api\/categories|\/api\/concepts/.test(js),
  "FE nạp danh mục từ API, không gõ tay danh sách nhãn")

console.log("\n5 · Nơi phát hiện trên màn nạp = whitelist, không gõ tay\n")

const ten = MEDIA.video_host.map((h) => h.nhan)
ok(ten.every((t) => hN.includes(t)),
  `màn nạp nhắc đủ ${ten.length} nơi phát: ${ten.join(" · ")}`,
  "thiếu một cái ⇒ dải chữ gõ tay, và nó lệch ngay lần thêm host sau")

chot("M11_video: màn chỉ video · 0 gọi ra ngoài lúc mở · host chặn ở FE · form có nhãn")
