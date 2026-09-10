#!/usr/bin/env node
/**
 * M09-R4 — TỔNG HỢP ALL, nhưng KHÔNG trộn thước đo chất lượng (FR-036/B9).
 *
 * Người dùng chốt *"dashboard tổng hợp All"*. **Số đếm** đúng là phải tổng hợp.
 * **Thước đo chất lượng** thì không có nghĩa trên một bản ghi thư viện:
 * `priority` sinh từ `skill_candidates` nên tài liệu luôn **0**, và
 * `credibility_max` mô tả một *bản phân tích* chứ không mô tả một file PDF.
 * 50 PDF sẽ đẩy histogram ưu tiên về ~100% "thấp" — dashboard **tệ hơn trước**
 * trong khi mọi con số vẫn "đúng".
 *
 * CÁCH ĐO: dựng HAI bộ dữ liệu — một chỉ có bản phân tích, một thêm 4 bản thư
 * viện — rồi so CÙNG MỘT pane giữa hai bản render.
 *
 * Vì sao không so với một con số gõ tay: khi đó không phân biệt được "pane đổi
 * vì thư viện" với "pane đổi vì tôi gõ sai số mong đợi". Hai bộ dữ liệu khác
 * nhau ĐÚNG MỘT ĐIỀU thì mọi khác biệt còn lại đều quy được về điều đó.
 */
import { taoKiem } from "./_api.mjs"
import { trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()

const banGoc = (i, them = {}) => ({
  slug: `article/pt-${i}`, id: `src_pt0000${i}`, title: `Bản phân tích ${i}`,
  url_normalized: `example.com/pt-${i}`,
  priority: [70, 55, 30, 80][i % 4],
  credibility_max: ["verified", "plausible", "claimed", "verified"][i % 4],
  origin: "manual", source_type: "article", review_status: "approved",
  analyzed_at: `2026-0${(i % 8) + 1}-15`, one_liner: `Tóm tắt ${i}`,
  concepts: [], concepts_proposed: [], category: [],
  ho_so: "phan-tich", media: null, than: "## 1. Overview\n\nNội dung.\n",
  ...them,
})

// Bản thư viện: `priority` 0 và `credibility_max` "plausible" — ĐÚNG như
// `data.mjs` sinh ra cho một bản ghi không có `skill_candidates`. Đây là hình
// dạng THẬT, không phải một fixture cực đoan dựng cho dễ đỏ.
const banThuVien = (i) => banGoc(i, {
  slug: `tai-lieu/tl-${i}`, id: `src_tl0000${i}`, title: `Tài liệu ${i}`,
  url_normalized: `kho://tai-lieu/tl-${i}`,
  priority: 0, credibility_max: "plausible", source_type: "tai-lieu",
  ho_so: "thu-vien",
  media: [{ sha256: String(i).repeat(64).slice(0, 64), mime: "application/pdf",
           ten_goc: `t${i}.pdf`, so_byte: 1000 + i }],
  than: "Ghi chú ngắn.\n",
})

const PT = [0, 1, 2, 3].map((i) => banGoc(i))
const TV = [4, 5, 6, 7].map((i) => banThuVien(i))
const dl = (bans) => ({ bans, concepts: [], categories: [], hong: [], mock: false })

/** Nội dung một mount `<div id="X" data-mount>` sau khi chèn. */
function pane(html, id) {
  const i = html.indexOf(`id="${id}"`)
  if (i < 0) return null
  const a = html.indexOf(">", i)
  if (a < 0) return null
  // Mount là `<div class="mb" id="X" data-mount>…</div>` — cắt theo NGOẶC KHỚP
  // của thẻ div, không theo `</div>` đầu tiên: nội dung chèn vào có div lồng.
  let sau = 1, k = a + 1
  const mo = /<div\b/gi, dong = /<\/div>/gi
  const con = html.slice(a + 1)
  let iMo = 0, iDong = 0
  for (let b = 0; b < 4000; b++) {
    mo.lastIndex = iMo; dong.lastIndex = iDong
    const m1 = mo.exec(con), m2 = dong.exec(con)
    if (!m2) break
    if (m1 && m1.index < m2.index) { sau++; iMo = m1.index + 1; continue }
    sau--; iDong = m2.index + 1
    if (!sau) return con.slice(0, m2.index)
    iMo = Math.max(iMo, m2.index)
  }
  return con.slice(0, 2000)
}

const chiPT = { all: await trangHtml("tat-ca", { data: dl(PT) }),
                kho: await trangHtml("kho", { data: dl(PT) }) }
const coTV = { all: await trangHtml("tat-ca", { data: dl([...PT, ...TV]) }),
               kho: await trangHtml("kho", { data: dl([...PT, ...TV]) }) }

console.log("\n1 · Pane SO DEM phai DOI — do la 'tong hop All'\n")

// Doi ĐÚNG bằng số bản ghi thêm vào, không chỉ "khác nhau": mot pane doi vi
// mot ly do khac cung "khac nhau".
/*
 * Doc DUNG o `#acount`, khong tim chuoi tren CA TRANG.
 *
 * Kiem hai chieu bat duoc lo: doi `acount` sang nen `phanTich` (tuc mat y
 * "tong hop All") ma cong VAN XANH — vi `#tcount` in "4 bai · 8 ban ghi", va
 * chuoi "8 ban" nam trong do. Mot phep kiem tim chuoi tren ca trang do BAT KY
 * o nao co con so, khong do o minh dang noi ve.
 */
const oNho = (html, id) => {
  const m = new RegExp(`id="${id}"[^>]*>([^<]*)<`).exec(html)
  return m ? m[1].trim() : null
}
ok(oNho(coTV.all, "acount") === `${PT.length + TV.length} bản`,
  `#acount noi ${PT.length + TV.length} ban khi kho co ca thu vien`,
  `duoc ${JSON.stringify(oNho(coTV.all, "acount"))}`)
ok(oNho(chiPT.all, "acount") === `${PT.length} bản`,
  `va noi ${PT.length} ban khi chi co phan tich`,
  `duoc ${JSON.stringify(oNho(chiPT.all, "acount"))}`)
for (const id of ["bars4", "mbkho"]) {
  const a = pane(chiPT.kho, id), b = pane(coTV.kho, id)
  ok(a !== null && b !== null, `tim duoc pane \`${id}\` o ca hai ban`)
  ok(a !== b, `pane so dem \`${id}\` DOI khi them ban thu vien`,
    "khong doi nghia la no khong tong hop All")
}

console.log("\n2 · Pane CHAT LUONG phai KHONG DOI (M09-R4 do_khi)\n")

/*
 * FR-041 luot 2 · nguoi dung chot man Kho chi con BON tong hop => hai pane
 * chat luong cua man Kho (kf-uutien · bars3) DA ROI MAN; spec §pane chat luong
 * da amend cung FR. Tinh chat M09-R4 khong doi va van do duoc — tren pane
 * chat luong CON LAI (`mball`, man Tat ca).
 */
const CHAT_LUONG = [
  ["mball", "all", "phan bo uu tien tren man Tat ca"],
]
// Phep kiem KHONG duoc tu vo hieu: tap pane chat luong phai khong rong.
ok(CHAT_LUONG.length >= 1, `${CHAT_LUONG.length} pane chat luong duoc canh`)
for (const [id, man, ten] of CHAT_LUONG) {
  const a = pane(man === "all" ? chiPT.all : chiPT.kho, id)
  const b = pane(man === "all" ? coTV.all : coTV.kho, id)
  ok(a !== null && b !== null, `tim duoc pane \`${id}\` (${ten}) o ca hai ban`,
    `chiPT=${a === null ? "khong" : "co"} coTV=${b === null ? "khong" : "co"}`)
  /*
   * So SAU KHI BO dong khai nen.
   *
   * Dong `.kf-n "nen: N ban phan tich…"` CO Y chi xuat hien khi kho that su co
   * ban thu vien — mot chu thich "nen: ban phan tich" tren mot kho toan phan
   * tich la mot chu thich khong giai thich gi. Nen hai ban render KHAC nhau
   * dung o dong do, va do la HANH VI DUNG.
   *
   * Luat can do la "CON SO chat luong khong doi". So ca chuoi thi phep kiem do
   * lan mot thu khac va bao sai nguyen nhan — dung lop loi ma B8b vua tru.
   */
  const boNen = (s) => String(s).replace(/<div class="kf-n">[\s\S]*?<\/div>/g, "")
  ok(a !== null && boNen(a) === boNen(b),
    `\`${id}\` (${ten}) KHONG doi SO khi them 4 ban thu vien`,
    "tron vao la day histogram uu tien ve ~100% 'thap' — dashboard TE HON TRUOC")
}

console.log("\n3 · Moi pane chat luong KHAI RO NEN cua no\n")

for (const [id, man, ten] of CHAT_LUONG) {
  const b = pane(man === "all" ? coTV.all : coTV.kho, id) ?? ""
  ok(/phân tích/i.test(b),
    `\`${id}\` (${ten}) noi ra nen la ban PHAN TICH`,
    "hai con so canh nhau voi hai nen khac nhau ma khong noi ra la nguoi doc tu tru roi tin vao hieu")
}
// Chieu nguoc: pane SO DEM khai nen la CA KHO — de hai loai nhan khong lan nhau.
// FR-041 lượt 2 · kf-nguon rời màn — pane số đếm đại diện giờ là kf-nhom (phân loại, nền cả kho).
const nenKho = pane(coTV.kho, "kf-nhom") ?? ""
ok(/cả kho/i.test(nenKho), "pane so dem van khai nen la CA KHO",
  "doi het sang 'phan tich' la mat y 'tong hop All' cua nguoi dung")

chot("tong hop All o so dem · thuoc do chat luong khong tron · moi pane khai nen")
