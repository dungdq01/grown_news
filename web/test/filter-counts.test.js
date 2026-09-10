#!/usr/bin/env node
/**
 * Sidebar lọc: số trên nhãn phải KHỚP số thẻ, và parser phải đọc được mảng.
 *
 * Hai lớp lỗi test này bắt:
 *
 * 1 · **Số đếm nói dối.** Nhãn "paper 3" mà lọc ra 2 thẻ là lỗi im lặng — build
 *     xanh, trang hiện đủ, chỉ con số sai. Người dùng tin con số đó để biết kho
 *     lệch về loại nào.
 *
 * 2 · **Parser không đọc được mảng YAML.** `docTuDia` thử `JSON.parse` từng dòng
 *     rồi fallback về chuỗi. YAML flow style hợp lệ `[a, b]` KHÔNG phải JSON hợp
 *     lệ (thiếu ngoặc kép) nên nó ngã và trả về CHUỖI "[a, b]".
 *     `mau-dat-chuan.md:11` viết đúng dạng đó. Nếu tin vào `Array.isArray` thì
 *     mọi filter rỗng với FILE THẬT, còn sample (JSON) vẫn chạy đúng — lỗi chỉ
 *     lộ ra khi nạp bài thật, tức muộn nhất có thể.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))

const loi = []
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi.push(ten)
}

/** Nội dung thật giữa thẻ mở có id và thẻ đóng tương ứng */
function trong(src, id) {
  const m = src.match(new RegExp(`<(\\w+)[^>]*\\bid="${id}"[^>]*>`))
  if (!m) return null
  const the = m[1]
  const dau = m.index + m[0].length
  let sau = 1, j = dau
  while (j < src.length && sau > 0) {
    if (new RegExp(`^<${the}[\\s>]`, "i").test(src.slice(j, j + the.length + 2))) sau++
    else if (new RegExp(`^</${the}>`, "i").test(src.slice(j, j + the.length + 3))) {
      sau--
      if (sau === 0) break
    }
    j++
  }
  return src.slice(dau, j)
}

// Bản mock có dữ liệu (kb-mock, 13 bản ghi contract).
// FR-034/C5 · nguồn HTML đổi từ output build sang renderTrang — assertion giữ nguyên.
const all = await trangHtml("tat-ca")
const kn = await trangHtml("khai-niem")

const fl = trong(all, "filter") ?? ""
const grid = trong(all, "grid2") ?? ""

/*
 * ═══ FR-031 · DANH MỤC RỖNG LÀ TRẠNG THÁI HỢP LỆ ═══════════════════════════
 *
 * Người dùng xoá sạch danh mục để nhập lại của mình. Sau đó 10 phép kiểm ở file
 * này đỏ cùng lúc — và không cái nào tìm ra bug: chúng chỉ mất thứ để đo.
 *
 * Tôi đã thử cho fixture tự dựng danh mục và nó KHÔNG chạy: emitter đọc kho từ
 * repo (`duongKho()` = `join(GOC, "..", "kb"|"kb-mock")`), còn `-d` chỉ quyết
 * định Quartz sinh trang bài. Ghi lại ở `_seed.mjs` để không ai thử lại.
 *
 * Nên thước đo phải đổi — nhưng KHÔNG được thành `if (co) { ... }`, vì khi danh
 * mục rỗng thì cả khối tự biến mất và phép kiểm tự vô hiệu (đúng lớp lỗi đã bắt
 * ở `open-card.test.js`).
 *
 * Cách làm: khẳng định CẢ HAI NHÁNH. Có nhãn ⇒ tầng lọc phải có mặt, đúng thứ
 * tự. Không nhãn ⇒ tầng phải VẮNG *và* màn Danh mục phải nói ra là đang trống.
 * Nhánh nào cũng có răng.
 */
const coNhanCat = /data-loc="cat"/.test(fl)
const coNhanCpt = /data-loc="cpt"/.test(fl)

console.log("\nSidebar lọc — ba tầng (FR-009)\n")
ok(fl.includes('data-loc="reset"'), 'có nút "tất cả"')
// WO-014 · màn TRỘN (Tổng hợp) dựng tầng **phân loại** (`pl`), màn loại dựng
// **loại nguồn** (`nguon`). Tầng `loai` cũ KHÔNG còn — nó là một ô chở hai ý:
// sidebar `/video/` khi đó hiện đúng một dòng "video".
//
// Ý ĐỊNH của phép kiểm giữ nguyên: phải có MỘT tầng không phụ thuộc danh mục.
const TANG_LOAI = /data-loc="pl"/.test(fl) ? "pl"
  : (/data-loc="nguon"/.test(fl) ? "nguon" : "")
ok(TANG_LOAI !== "", "có tầng phân loại hoặc loại nguồn",
   "tầng này đọc từ chính bản ghi — KHÔNG phụ thuộc danh mục, nên nó phải có "
   + "mặt dù danh mục rỗng")
// `tags` đã bị THAY bằng `category` (FR-009) — không còn trường tự do nào
ok(!/data-loc="tag"/.test(fl), "không còn tầng tags")

if (coNhanCat || coNhanCpt) {
  ok(coNhanCat && coNhanCpt, "có nhãn ⇒ có CẢ HAI tầng chủ đề và khái niệm",
     `cat:${coNhanCat} cpt:${coNhanCpt} — một tầng có mà tầng kia không là lệch`)
  // Thứ tự THÔ → MỊN: chủ đề phải đứng trước khái niệm
  ok(fl.indexOf('data-loc="cat"') < fl.indexOf('data-loc="cpt"'),
     "chủ đề đứng trước khái niệm (thô → mịn)")
} else {
  ok(true, "không nhãn nào ĐANG DÙNG ⇒ không tầng nhãn nào (đúng)")
  /*
   * Nhánh này TỪNG suy: *"không có tầng nhãn ⇒ danh mục RỖNG"* — và đòi màn
   * nói "đang trống". Suy luận đó SAI: danh mục có thể CÓ MỤC mà chưa bài nào
   * dùng (`dang_dung: 0`), khi đó cũng không có tầng nào, nhưng màn nói
   * *"có N khái niệm, chưa bài nào dùng tới"*.
   *
   * Và nó thành ĐỎ THẬT khi người dùng thêm nhãn đầu tiên: `sinh_kb_mock.py`
   * CỐ Ý chép `kb/concepts.yaml` sang `kb-mock/` (để bản mock hiện nhãn tiếng
   * Việt), nên danh mục mock đi theo danh mục thật.
   *
   * Điều CÒN ĐÚNG cho cả hai trạng thái: màn PHẢI NÓI RA. Rỗng mà im lặng đọc
   * ra y như hỏng — đó mới là răng của nhánh này.
   */
  ok(/đang trống|chưa bài nào dùng tới/.test(kn),
     "màn Danh mục nói rõ tình trạng (trống, hoặc có mục mà chưa ai dùng)",
     "một khu trắng không giải thích thì người dùng đi tìm lỗi không có")
  ok(!/Chưa đọc được danh mục/.test(kn),
     "KHÔNG nói \"chưa đọc được\" — rỗng khác lỗi đọc file",
     "nói sai nguyên nhân thì người dùng sửa sai chỗ")
}

console.log("\nSố trên nhãn khớp số thẻ\n")
const demThe = (attr, gt) =>
  (grid.match(new RegExp(`${attr}="${gt}"`, "g")) ?? []).length

// Thẻ mang `data-pl`/`data-nguon` khớp đúng tầng đang dựng — WO-014.
let soNut = 0
const attrCua = TANG_LOAI === "pl" ? "data-pl" : "data-nguon"
// `String.raw`: trong template literal thường, `\s` và `\d` bị nuốt dấu gạch
// chéo (escape lạ ⇒ JS bỏ backslash), nên regex thành `s*` và `d+` — khớp 0 nút
// mà không lời nào. Vừa xảy ra đúng vậy.
for (const m of fl.matchAll(new RegExp(String.raw`data-loc="` + TANG_LOAI
  + String.raw`" data-gt="([^"]+)"[^>]*>\s*<span>[^<]*</span><b>(\d+)</b>`, "g"))) {
  soNut++
  const [, gt, so] = m
  ok(Number(so) === demThe(attrCua, gt),
    `${TANG_LOAI} ${gt}: nhãn ${so} = thẻ ${demThe(attrCua, gt)}`)
}
ok(soNut > 0, `kiểm ${soNut} nút ${TANG_LOAI}`)

// Với category và concepts, thẻ mang nhiều giá trị trong một attribute
// ⇒ tách theo khoảng trắng rồi đếm, không dùng includes() trên cả chuỗi
// (nếu không thì "backend" khớp cả "backend-integration").
const demNhieu = (attr, gt) =>
  [...grid.matchAll(new RegExp(`${attr}="([^"]*)"`, "g"))]
    .filter((x) => x[1].split(" ").includes(gt)).length

for (const [khoa, attr, nhan] of [
  ["cat", "data-cat", "chủ đề"],
  ["cpt", "data-cpt", "khái niệm"],
]) {
  let n = 0
  for (const m of fl.matchAll(new RegExp(
    `data-loc="${khoa}" data-gt="([^"]+)"[^>]*>\\s*<span>[^<]*</span><b>(\\d+)</b>`, "g"))) {
    n++
    const [, gt, so] = m
    const dem = demNhieu(attr, gt)
    ok(Number(so) === dem, `${nhan} ${gt}: nhãn ${so} = thẻ ${dem}`)
  }
  // Số nút = số nhãn ĐANG được bài dùng. Rỗng là hợp lệ; điều PHẢI đúng là
  // "mỗi nhãn có nút thì số trên nút khớp số thẻ" — vòng lặp trên đã canh.
  // Ở đây chỉ khai ra để đọc log biết đã đo bao nhiêu.
  ok(n === 0 || n > 0, `đã kiểm ${n} nút ${nhan}`)
  if (n === 0) {
    ok(!new RegExp(`data-loc="${khoa}"`).test(fl),
       `không nút ${nhan} nào ⇒ tầng ${nhan} cũng không có`,
       "có tầng mà 0 nút là một khu lọc rỗng — người dùng bấm vào hư không")
  }
}

console.log("\nParser đọc được mảng — cả JSON và YAML flow style\n")
// Nhãn trên thẻ chỉ tồn tại khi kho có nhãn. Cái PHẢI luôn đúng: thuộc tính
// mang nhãn không bao giờ chứa chuỗi YAML thô — đó mới là lỗi parser, và nó
// đo được kể cả khi mọi thẻ rỗng.
const coCpt = (grid.match(/data-cpt="[^"]+"/g) ?? []).length
ok(!/data-cpt="\[|data-cat="\[/.test(grid),
   `${coCpt} thẻ mang nhãn, không thẻ nào chứa chuỗi YAML thô`,
   "`data-cpt=\"[a, b]\"` nghĩa là parser trả chuỗi thay vì mảng")
if (coCpt > 0) {
  ok(/class="cts"/.test(grid), "badge chủ đề hiện trên thẻ")
}
// FR-009 đổi tên trường — không được còn dấu vết `tags` trong markup
ok(!/data-tags=|class="tgs"/.test(grid), "không còn markup tags cũ")

// Kiểm trực tiếp: chuỗi YAML flow style phải ra mảng, không ra chuỗi.
// Đây là hình dạng mau-dat-chuan.md:11 dùng.
const gnJs = (await taiSan()).gnJs
ok(!gnJs.includes("[walk-forward-validation, data-leakage]"),
   "không lọt chuỗi YAML thô vào output")

// ── YAML BLOCK STYLE ─────────────────────────────────────────────────────
// `05_intake/gate.py` ghi bằng yaml.dump ⇒ ra BLOCK style:
//     concepts:
//     - context-management
// Sample và kb-mock dùng FLOW style (`[a, b]`) nên mọi test khác xanh trong
// khi bài nạp qua _inbox/ lên web với category/concepts RỖNG. Lỗi chỉ lộ ra
// với file thật — đúng loại lỗi tốn nhất nếu phát hiện muộn.
// Kiểm THẲNG trên mã parser: nó phải nhận cả hai dạng.
// FR-034/C5 · parser sống ở web/render/data.mjs (docTuDia port từ emitter,
// giờ chỉ còn phục vụ kb-mock/) — soi ở đó; emitter cũ sẽ bị nhổ ở C6.
{
  const src = readFileSync(join(TEST, "..", "render", "data.mjs"), "utf8")
  ok(/\^\\s\*-\\s\+/.test(src) || src.includes("^\\s*-\\s+"),
     "parser có nhánh đọc YAML block list (`- item`)",
     "chỉ đọc flow style ⇒ bài nạp qua _inbox/ mất category và concepts")
  // kb-mock dùng flow style, gate.py dùng block style — cả hai đều thật
  ok(src.includes("05_intake") || /block/i.test(src),
     "mã ghi rõ vì sao cần hai dạng")
}

console.log("\nMàn Khái niệm — mốc #cb\n")
const cb = trong(kn, "cb") ?? ""
// `chen()` lấp mốc bằng câu trạng thái khi không có mục — nên mốc KHÔNG BAO GIỜ
// được để trắng, dù danh mục rỗng. Đó là điều phải đúng ở cả hai nhánh.
ok(cb.trim().length > 20, "#cb được lấp (hàng, hoặc câu nói rõ đang trống)",
   "mốc này từng rỗng vĩnh viễn")
// FR-030 · #cb ve HANG, khong ve BAR.
//
// Do tren du lieu that: moi cot dai 50% hoac 100% (1 hoac 2 bai) o ban mock, va
// TOAN BO 100% o ban real. Do dai cot khong mang thong tin — nen no khong phai
// bieu do, chi la mot danh sach ve to hon can thiet.
//
// Phep kiem doi THU DO nhung giu Y DINH: moi muc VAN la nut loc (`data-loc`),
// va so muc VAN phai khop nhan dem. Do la hai dieu file nay ton tai de canh.
// KHÔNG BAO GIỜ có bar ở #cb — đúng ở cả hai nhánh, nên nó ở ngoài mọi điều kiện.
ok(!/class="bw"/.test(cb), "không còn thanh `.bw` trong #cb",
   "giữ lại thanh là giữ lại thứ vừa bỏ vì nó không mang thông tin")
const cbHang = (cb.match(/class="rc-r/g) ?? []).length
if (cbHang > 0) {
  ok(/data-loc="cpt"/.test(cb),
     `${cbHang} hàng, và mỗi hàng VẪN là nút lọc — đổi hình dạng, không đổi chức năng`)
} else {
  // Nhánh rỗng cũng có răng: hình dạng HÀNG phải còn trong MÃ, để lần tới có
  // nhãn là nó vẽ đúng ngay. `man-danh-muc §6a` canh cả hai bản song sinh.
  const em = readFileSync(join(TEST, "..", "render", "trang.mjs"), "utf8")
  ok(/class="rc-r r-cpt r-dung"/.test(em),
     "danh mục rỗng, nhưng emitter vẫn dựng hàng `.rc-r` khi có nhãn",
     "mất hình dạng trong mã thì lần đầu người dùng thêm nhãn sẽ ra bar lại")
}
const cc = trong(kn, "ccount") ?? ""
// `ccount` rỗng khi danh mục rỗng (emitter khai rõ vậy) — có chữ thì PHẢI đúng dạng.
ok(cc.trim() === "" || /\d+\/\d+/.test(cc),
   `nhãn đếm "${cc.trim() || "(trống — danh mục rỗng)"}" đúng dạng`)
// Số bar phải bằng số concept đang được dùng, khớp nhãn
/*
 * HAI PHEP DUOI DAY TUNG CHET. Do duoc khi chay: nhan dem la
 * "(trong - danh muc rong)", nen `if (mCc)` khong chay — KHONG CO CA MOT
 * DONG BAO — va `soTrongHang` rong, `.every` tren [] dung vo dieu kien.
 *
 * Kho mock khong co nhan nao dang dung, va do la trang thai HOP LE cua no.
 * Nen dung MOT ban render rieng co nhan that cho dung hai phep nay, thay vi
 * doi `kn` — ca chuc phep khac trong file dua vao `kn`.
 */
const CPT_D = [
  { id: "ba-lan", label_vi: "Ba lần" },
  { id: "hai-lan", label_vi: "Hai lần" },
  { id: "mot-lan", label_vi: "Một lần" },
]
const banCpt = (slug, cpt) => ({
  slug, id: `src_${slug.replace(/-/g, "")}`, title: `Bản ${slug}`,
  source_type: "article", review_status: "approved", origin: "manual",
  analyzed_at: "2026-08-20", one_liner: `Bản thử ${slug}`,
  credibility_max: "verified", priority: 3, concepts: cpt,
  concepts_proposed: [], category: [], url_normalized: `example.com/${slug}`,
  ho_so: null, media: null, than: "## Mục",
})
// 3 · 2 · 1 lượt dùng — thứ tự ĐÚNG phải là 3, 2, 1.
const knD = await trangHtml("khai-niem", { data: {
  mock: true, hong: [], categories: [], loai_nguon: [],
  concepts: CPT_D.map((c) => ({ ...c, aliases: [] })),
  bans: [
    banCpt("b-1", ["ba-lan"]), banCpt("b-2", ["ba-lan"]),
    banCpt("b-3", ["ba-lan", "hai-lan"]), banCpt("b-4", ["hai-lan"]),
    banCpt("b-5", ["mot-lan"]),
  ],
} })
const cbD = trong(knD, "cb") ?? ""
const ccD = trong(knD, "ccount") ?? ""

// TU KIEM VAT LIEU: neu ban render nay CUNG rong thi hai phep duoi lai chet,
// chi khac la chet o cho moi.
const soHang = (cbD.match(/class="rc-r/g) ?? []).length
ok(soHang > 0, `bản render riêng có ${soHang} hàng nhãn`,
  "rỗng ⇒ hai phép dưới lại đo trên tập rỗng và xanh vô điều kiện")

const mCc = ccD.match(/(\d+)\/(\d+)/)
ok(mCc !== null, `nhãn đếm có dạng \`n/m\` — được "${ccD.trim()}"`,
  "không có số ⇒ phép kiểm hàng-khớp-nhãn ngay dưới KHÔNG CHẠY, và im lặng")
if (mCc) {
  ok(soHang === Number(mCc[1]), `${soHang} hàng = ${mCc[1]} nhãn đang dùng`)
}
// Sap theo SO GIAM DAN — nhan dung nhieu nhat len truoc. Man nay de TIM mot
// nhan; thu tu tuy y bat nguoi dung quet ca danh sach.
const soTrongHang = [...cbD.matchAll(/<time>(\d+) bài<\/time>/g)].map((m) => Number(m[1]))
ok(soTrongHang.length >= 2,
  `có ${soTrongHang.length} hàng mang số — đủ để phép SẮP có nghĩa`,
  "dưới 2 hàng thì `.every` đúng vô điều kiện và không đo gì")
ok(soTrongHang.every((n, i) => i === 0 || soTrongHang[i - 1] >= n),
   `hàng sắp giảm dần: ${soTrongHang.slice(0, 6).join(" ")}`,
   "thứ tự tuỳ ý bắt người dùng quét cả danh sách để tìm nhãn dùng nhiều nhất")

const cp = trong(kn, "cprop") ?? ""
ok(/\d+×/.test(cp), "cột chờ-duyệt hiện số lần đề xuất")

console.log(loi.length
  ? `\n${loi.length} lỗi`
  : "\npass · số đếm khớp số thẻ, parser đọc được mảng, #cb đã nối")
process.exit(loi.length ? 1 : 0)
