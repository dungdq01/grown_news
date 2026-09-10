#!/usr/bin/env node
/**
 * M10_tailieu — AC-2.2.1 · AC-2.2.2 · AC-2.3.1.
 *
 * Cùng lỗ với `man-video.test.js`: spec `06_modules/M10_tailieu/spec.md` khai ba
 * AC bằng `cmd: node test/man-tai-lieu.test.js` từ C0 (FR-038) và file đó chưa
 * từng tồn tại. Spec đang FROZEN nên không sửa spec cho nó trỏ chỗ khác.
 *
 * KHÔNG ĐO LẠI thứ đã có cổng. `o-media-sua.test.js` đã đo vế nặng của AC-2.2.2
 * — PUT không đụng file ⇒ `media.sha256` KHÔNG đổi, và nạp file mới thì nó ĐỔI
 * (chiều dương một mình xanh cả với cài đặt ghi đè `media` mỗi lần lưu). Chép
 * phép đo đó sang đây là hai bản của một sự thật, tức hai chỗ để lệch.
 *
 * Vế AC-2.2.2 mà nơi đó KHÔNG đo, và đây đo: **đường đi từ màn `/tai-lieu/` tới
 * form có ô hiện vật**. Spec nói rõ lý do — *"và điều đó đúng vì form CÓ ô
 * `media`, không vì `FM_GOC` giữ hộ"*. `sha256` không đổi là KẾT QUẢ; ô trên
 * form là CƠ CHẾ. Một kết quả đúng nhờ may thì vẫn đúng cho tới hôm nó không.
 */
import { CAT_FX, CPT_FX, taoKiem } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
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
// FR-052 · MANG — boc o MOT cho de ba loi goi duoi khong doi.
const tl = (slug, media) => ban(slug, "tai-lieu", { ho_so: "thu-vien", media: [media] })

// Gieo CẢ BA module — chỉ gieo tài liệu thì "màn chỉ hiện tài liệu" xanh rỗng.
const BANS = [
  ban("a-article", "article"),
  ban("a-repo", "repo", { category: [CAT[1]] }),
  ban("v-yt", "video", {
    ho_so: "thu-vien", url_normalized: "youtube.com/watch?v=dQw4w9WgXcQ" }),
  tl("t-pdf", { sha256: "a".repeat(64), mime: "application/pdf",
                ten_goc: "bia.pdf", so_byte: 1024 }),
  tl("t-docx", { sha256: "b".repeat(64), ten_goc: "ke-hoach.docx", so_byte: 2048,
                 mime: "application/vnd.openxmlformats-officedocument"
                   + ".wordprocessingml.document" }),
  tl("t-la", { sha256: "c".repeat(64), mime: "application/octet-stream",
               ten_goc: "ban-ve.dwg", so_byte: 4096 }),
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

const SO_TL = BANS.filter((b) => b.source_type === "tai-lieu").length
ok(SO_TL === 3, `gieo đúng ${SO_TL} bản tài liệu`)
ok(BANS.length - SO_TL === 3, "và 3 bản KHÔNG phải tài liệu để có thứ lọt vào")
// Một trong ba là ĐỊNH DẠNG LẠ (FR-039): bảng mime thôi làm cổng nhận, nên màn
// phải hiện nó như mọi bản khác. Bỏ ca này thì §1 chỉ chứng minh cho pdf/docx.
ok(BANS.some((b) => b.media?.[0]?.mime === "application/octet-stream"),
  "có một bản định dạng LẠ (`octet-stream`) — FR-039 nhận mọi định dạng")

const html = await trangHtml("tai-lieu", { data: DU_LIEU })
const T = khoi(html, "tailieu")
ok(T.length > 0, "cắt được khối `v-tailieu`", "không có khối ⇒ mọi phép dưới đo rỗng")

console.log("\n1 · AC-2.2.1 — màn `/tai-lieu/` CHỈ hiện bản ghi tài liệu\n")

ok(demThe(T) === SO_TL,
  `màn hiện đúng ${SO_TL} thẻ`,
  `được ${demThe(T)} — gieo 3 bản loại khác, chúng lọt vào`)

const loai = [...new Set(T.match(/data-loai="([^"]*)"/g) ?? [])]
ok(loai.length === 1 && loai[0] === 'data-loai="tai-lieu"',
  'mọi thẻ trên màn đều `data-loai="tai-lieu"`', loai.join(" "))

ok(demThe(html) > demThe(T),
  "phép đếm có PHẠM VI — toàn trang nhiều thẻ hơn khối `v-tailieu`",
  "bằng nhau ⇒ tôi đang đếm toàn trang và §1 vô nghĩa")

// Định dạng lạ KHÔNG được rơi khỏi màn: nếu nó rơi, `demThe === 2` và §1 trên
// đã bắt — nhưng câu lỗi sẽ nói "lọt vào", sai hướng. Nêu riêng cho rõ.
ok(T.includes("ban-ve.dwg") || demThe(T) === SO_TL,
  "  bản định dạng lạ vẫn có mặt trên màn",
  "định dạng ngoài bảng mime bị màn bỏ qua ⇒ người dùng nạp xong không thấy đâu")

/*
 * PHEP DO PHAI PHAN BIET DUOC. Ba muc tren van xanh neu toi cat nham vao
 * mot khoi khac cung chi chua the tai lieu — khong gi keu ca. Chung minh
 * bang mot khoi CO TRON: man Tong hop phai co nhieu hon mot loai.
 */
const A = khoi(html, "all")
const loaiA = new Set(A.match(/data-loai="([^"]*)"/g) ?? [])
ok(loaiA.size > 1,
  "  và phép đo PHÂN BIỆT được: khối `v-all` (Tổng hợp) có nhiều loại",
  `được ${loaiA.size} loại — nếu 1 thì phép cắt/đo của tôi không thấy loại ` + "nào khác, và §1 xanh vì MÙ, không vì đúng")
ok([...loaiA].some((x) => !x.includes("tai-lieu")),
  "  và trong đó CÓ loại không phải tài liệu",
  [...loaiA].join(" "))

console.log("\n2 · AC-2.2.2 — CƠ CHẾ, không phải kết quả: form sửa có ô hiện vật\n")

/*
 * `o-media-sua.test.js` §3 đã đo KẾT QUẢ (PUT không đụng file ⇒ `sha256` không
 * đổi; nạp file mới ⇒ nó đổi). Ở đây đo CƠ CHẾ mà spec nêu đích danh: có một ô
 * hiện vật thật trên form, và màn danh sách dẫn tới đúng form đó.
 */
const hN = await trangHtml("nap-tai-lieu", { data: DU_LIEU })
const N = khoi(hN, "naptailieu")
ok(N.length > 0, "cắt được khối `v-naptailieu`")
for (const [id, vs] of [
  ["tv-hv", "khối hiện vật"], ["tv-hv-ten", "tên file đang gắn"],
  ["tv-hv-thay", "nút THAY hiện vật"]]) {
  ok(N.includes(`id="${id}"`), `  form có \`#${id}\` — ${vs}`,
    "thiếu ⇒ người dùng sửa một tài liệu mà không thấy file của nó")
}

const js = (await taiSan()).gnJsNguon ?? ""
// Và màn danh sách phải dẫn TỚI form đó, không tới form bài viết. Lỗ đã đo ở
// WO-013: `suaTuCua` gọi `doiView("napbaiviet")` KHÔNG điều kiện, nên sửa một
// tài liệu đưa người dùng sang màn nạp BÀI VIẾT — đúng "gộp chung màn" bị cấm.
ok(/manNapCua/.test(js),
  "đích sửa tra bằng BẢNG (`manNapCua`), không gán cứng một màn",
  "gán cứng ⇒ sửa tài liệu nhảy sang màn bài viết")
const iS = js.indexOf("function suaTuCua")
const thanS = iS >= 0 ? js.slice(iS, js.indexOf("\n}", iS) + 2) : ""
ok(thanS.length > 0 && !/doiView\("nap[a-z]+"\)/.test(thanS),
  "  `suaTuCua` KHÔNG gọi `doiView` với một tên màn viết cứng",
  "một tên màn viết cứng trong đó là lỗ WO-013 quay lại")

console.log("\n3 · AC-2.3.1 — form nạp có ô `category` + `concepts` từ danh mục\n")

for (const [ten, hau] of [["chủ đề", "cat"], ["khái niệm", "cpt"]]) {
  // KHÔNG đoán tiền tố id — đo CHỮ người đọc thấy và MỘT Ô cho chiều đó.
  ok(new RegExp(ten, "i").test(N), `form nạp tài liệu có nhãn "${ten}"`)
  ok(new RegExp(`id="[a-z0-9-]*-${hau}"`).test(N),
    `  và có ô nhận giá trị \`${hau}\``,
    "thiếu ô ⇒ mọi tài liệu vào kho không nhãn và facet Chủ đề rỗng vĩnh viễn")
}
ok(/napDanhMuc|\/api\/categories|\/api\/concepts/.test(js),
  "FE nạp danh mục từ API, không gõ tay danh sách nhãn")

console.log("\n4 · Điều module này CẤM — màn không trộn loại khác\n")

// Spec §4: "Không trộn danh sách loại khác vào màn `/tai-lieu/` — chỉ Kho và
// Tổng hợp được trộn." §1 đã đo bằng số đếm; đây đo bằng SLUG, một phép đo khác
// hẳn: số đếm đúng vẫn có thể là ba thẻ SAI.
for (const b of BANS.filter((x) => x.source_type !== "tai-lieu")) {
  ok(!T.includes(`"${b.slug}"`) && !T.includes(`/${b.slug}/`),
    `  \`${b.slug}\` (${b.source_type}) KHÔNG có trên màn`)
}

chot("M10_tailieu: màn chỉ tài liệu · form sửa có ô hiện vật · form nạp có nhãn")
