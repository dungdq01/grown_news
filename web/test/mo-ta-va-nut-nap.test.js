#!/usr/bin/env node
/**
 * WO-018 — ô mô tả · ô nhãn nhìn thấy được · nút nạp không chết · chữ không dối.
 *
 * Bốn điều người dùng chỉ vào, và ba trong bốn là thứ markup-check bỏ lọt.
 *
 * §1 Hai màn nạp gửi `body: motCau` — thân bài LẶP LẠI câu tóm tắt. "Có ô mô tả"
 *    một mình xanh cả khi giá trị người dùng gõ không đi đâu.
 * §2 `tv-cat`/`vd-cat` CÓ trong DOM (WO-016) nhưng nằm trong khối `hidden`.
 *    "Có trong DOM" là markup; "người mở màn thấy nó" là thứ khác.
 * §3 `nutNap` giải ra CHÍNH màn đang đứng ⇒ nút chết.
 * §4 Dải lối video ghi `youtube · tiktok · douyin · bilibili` còn whitelist có
 *    HAI host. Chữ trên màn nói dối, và không cổng nào so nó với bảng khai.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { maFeNguon, napRender, taiSan, trangHtml } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()
const AS = await taiSan()
// `jsMoi` = bundle chung + MỌI chunk (T03-104). Đọc riêng `gnJs` là đọc một
// phần rồi kết luận về toàn thể — mã màn nap nay sống trong chunk `napvideo`.
const JS = AS.jsMoi ?? ""

const MEDIA = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const BANG_MAN = JSON.parse(
  readFileSync(join(GOC, "core", "assets", "man-hinh.json"), "utf8")).man
/*
 * "Màn nạp" != "màn bị cắt": proxy `cat_khi_khac` từng vỡ khi một màn thường
 * (T03-90, đã gỡ) cũng cắt-khi-khác để giữ page-weight — và đợt hai sẽ thêm
 * màn như thế nữa. Lọc theo NGHĨA: màn nạp là màn CÓ `module` và bị cắt.
 */
const MAN_NAP = BANG_MAN.filter((m) => m.cat_khi_khac && m.module)

const NL = String.fromCharCode(10)
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)
// `maFeNguon()` — multiwindow + MỌI chunk (T03-104). Đọc riêng multiwindow là
// đọc một phần rồi kết luận về toàn thể.
const MA = chiMa(maFeNguon(".ts"))

/** Thân một hàm, cắt bằng ngoặc khớp — chữ ký có thể trải nhiều dòng. */
function thanHam(ma, ten) {
  const i = ma.search(new RegExp("function\\s+" + ten + "[\\s(]"))
  if (i < 0) return ""
  const b = ma.indexOf("{", i)
  let sau = 0
  for (let k = b; k < ma.length; k++) {
    if (ma[k] === "{") sau++
    else if (ma[k] === "}") { sau--; if (!sau) return ma.slice(b, k + 1) }
  }
  return ""
}

/** Cắt một view — mốc là view kế tiếp, không phải `</main>`. */
function vungMan(html, idShell) {
  const mo = `id="v-${idShell}"`
  const i = html.indexOf(mo)
  if (i < 0) return ""
  const sau = html.slice(i + mo.length)
  const j = sau.search(/id="v-[a-z]+"/)
  return j < 0 ? sau.slice(0, sau.indexOf("</main>")) : sau.slice(0, j)
}

/**
 * Phần tử `id` có nằm trong một khối mang `hidden` không.
 *
 * Đếm độ sâu thẻ ngược từ đầu vùng: mọi thẻ mở còn CHƯA đóng tại vị trí của `id`
 * là tổ tiên của nó. Đây là phép đo THẬT của quan hệ chứa, không phải "có chuỗi
 * `hidden` ở gần đó" — thứ sau khớp cả một thẻ chị em.
 */
function toTienAn(vung, id) {
  const iId = vung.indexOf(`id="${id}"`)
  if (iId < 0) return null
  const ngan = []
  for (const m of vung.slice(0, iId).matchAll(/<(\/?)(div|section|form)\b([^>]*)>/g)) {
    if (m[1]) ngan.pop()
    else if (!m[3].endsWith("/")) ngan.push(m[0])
  }
  return ngan.filter((t) => /\shidden(\s|>|=)/.test(t))
}

console.log("\n1 · Ô MÔ TẢ, và thân bài lấy TỪ nó\n")

const O_MO_TA = { naptailieu: "tv-mo", napvideo: "vd-mo" }
for (const m of MAN_NAP.filter((x) => x.id_shell !== "napbaiviet")) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.id_shell)
  ok(v.length > 300, `vùng \`v-${m.id_shell}\` ${v.length} byte`)
  const id = O_MO_TA[m.id_shell]
  ok(v.includes(`id="${id}"`), `\`/${m.ten}/\` có ô mô tả \`#${id}\``,
    "người dùng: *cần thêm 1 số fields như viết bài … mô tả — description*")
  ok(/<textarea/.test(v), `  ô mô tả là \`<textarea>\`, không phải \`<input>\``,
    "mô tả nhiều dòng nhồi vào một dòng là bắt người ta viết ngắn hơn ý họ")
  // Giới hạn số từ phải NÓI RA trước, không để 422 nói hộ.
  ok(/\d+\s*t[ừu]/i.test(v) || /giới hạn|tối đa/i.test(v),
    `  màn nói ra giới hạn độ dài`,
    "không nói ⇒ người dùng gõ xong mới biết mình vượt")
}

// CA ÂM · ô có mà hàm gửi vẫn dùng câu tóm tắt ⇒ giá trị gõ vào không đi đâu.
for (const [ham, id] of [["ghiBanGhiThuVien", "tv-mo"], ["ghiVideo", "vd-mo"]]) {
  const than = thanHam(MA, ham)
  ok(than.length > 0, `tìm được thân \`${ham}\``)
  /*
   * NHẬN CẢ HAI HÌNH DẠNG: đọc id thẳng, hoặc gọi một helper CHUNG. Bản đầu
   * đòi thân hàm chứa chuỗi `tv-mo` — và bản cài đặt tốt hơn (một `thanTu()`
   * cho cả hai đường) không chứa chuỗi đó. Điều thật sự phải đúng: giá trị ô
   * mô tả tới được payload, dù đi đường nào.
   */
  const tien = id.split("-")[0]
  const quaHelper = new RegExp("thanTu\\(\\s*[\"'`]" + tien).test(than)
  const thanHelper = thanHam(MA, "thanTu")
  ok(than.includes(id) || (quaHelper && /-mo/.test(thanHelper)),
    `\`${ham}\` đưa ô mô tả \`${id}\` vào thân bài`,
    "ô hiện ra mà hàm gửi không đọc thì giá trị người dùng gõ biến mất")
  const nBody = (than.match(/body:\s*motCau/g) ?? []).length
  ok(nBody === 0, `  \`${ham}\` KHÔNG còn gửi \`body: motCau\``,
    `còn ${nBody} chỗ — thân bài lặp lại câu tóm tắt là một bản ghi tự nói hai lần`)
}

console.log("\n2 · Ô CHỦ ĐỀ + KHÁI NIỆM nhìn thấy được khi mở màn\n")

for (const [shell, tien] of [["naptailieu", "tv"], ["napvideo", "vd"]]) {
  const m = MAN_NAP.find((x) => x.id_shell === shell)
  const v = vungMan(await trangHtml(m.ten, { mock: true }), shell)
  for (const loai of ["cat", "cpt"]) {
    const an = toTienAn(v, `${tien}-${loai}`)
    ok(an !== null, `\`#${tien}-${loai}\` có trong vùng`)
    ok(an !== null && an.length === 0,
      `  \`#${tien}-${loai}\` KHÔNG nằm trong khối ẩn`,
      `tổ tiên ẩn: ${(an ?? []).map((t) => t.slice(0, 42)).join(" | ")} — hai `
      + "nhãn này là BẮT BUỘC, mà người mở màn không thấy chúng")
  }
}

console.log("\n3 · Nút nạp trên màn nạp mời lối KHÁC, không trỏ vào chỗ đang đứng\n")

for (const m of MAN_NAP) {
  const h = await trangHtml(m.ten, { mock: true })
  /*
   * CẮT ĐÚNG MỐC `#nutnap`. Bản đầu cắt `slice(0, indexOf("<main"))` vì tôi
   * tưởng nút ở header — đo ra nút nằm ở vị trí 2541 còn `<main>` ở 2050, tức
   * SAU nó. Lát cắt tìm được 0 nút, nên phép kiểm "không trỏ vào chính nó"
   * đúng một cách VÔ CĂN CỨ.
   */
  const iN = h.indexOf('id="nutnap"')
  const sauN = iN < 0 ? "" : h.slice(iN)
  const dau = sauN.slice(0, sauN.indexOf("</span>", sauN.indexOf("</span>") + 7) + 7)
  ok(iN > 0 && dau.length > 20, `\`/${m.ten}/\` có mốc \`#nutnap\``,
    "không có mốc ⇒ mọi phép kiểm dưới đây đo trên chuỗi rỗng")
  const nav = [...new Set([...dau.matchAll(/data-nav="(nap[a-z]+)"/g)]
    .map((x) => x[1]))]
  ok(nav.length > 0, `  mốc chứa ${nav.length} nút nạp`,
    "0 nút trong mốc ⇒ phép kiểm sau xanh vô căn cứ")
  ok(!nav.includes(m.data_nav),
    `\`/${m.ten}/\` KHÔNG có nút trỏ vào chính nó (\`${m.data_nav}\`)`,
    `được [${nav}] — nút trỏ vào trang đang đứng là nút chết, và người dùng `
    + "không có đường sang lối nạp khác")
  const khac = MAN_NAP.filter((x) => x.data_nav !== m.data_nav)
    .map((x) => x.data_nav)
  const co = khac.filter((k) => nav.includes(k))
  ok(co.length === khac.length,
    `  mời cả ${khac.length} lối khác (thấy ${co.length})`,
    `thiếu [${khac.filter((k) => !nav.includes(k))}]`)
}

console.log("\n4 · Dòng liệt kê nơi phát / định dạng KHÔNG gõ tay\n")

/*
 * Chữ trên màn phải KHỚP bảng khai. Dải lối video hiện ghi bốn nơi phát trong khi
 * `video_host` có hai — dán link douyin thì 422, mà màn đọc như nó được nhận.
 * Cách duy nhất không nói dối lần nữa là dẫn xuất, nên phép kiểm so hai bên.
 */
const HOST = MEDIA.video_host.map((h) => h.nhan)
const DINH_DANG = MEDIA.loai.map((l) => l.duoi.replace(".", ""))

const vVd = vungMan(await trangHtml("nap-video", { mock: true }), "napvideo")
// Đọc theo ID của mốc: dòng này nay do SSR đổ, nên nó CÓ thuộc tính và mẫu
// `<span>` trơn khớp 0 — cổng báo "0 nơi phát" trong khi mốc đầy chữ.
const chuVd = (vVd.match(/id="vd-nph"[^>]*>([^<]*)/) ?? [])[1] ?? ""
const keVd = chuVd.split("·").map((x) => x.trim()).filter(Boolean)
ok(keVd.length > 0, `dải lối video liệt kê ${keVd.length} nơi phát: ${keVd}`)
const laVd = keVd.filter((x) => !HOST.includes(x))
ok(laVd.length === 0,
  `mọi nơi phát trên màn ĐỀU có trong whitelist (${HOST.length} host)`,
  `màn kể [${keVd}] · whitelist [${HOST}] · KHÔNG có trong whitelist: [${laVd}] `
  + "— dán link đó thì 422, mà màn đọc như nó được nhận")
ok(keVd.length === HOST.length,
  `  số nơi phát trên màn = số host trong bảng khai`,
  `màn ${keVd.length} · bảng ${HOST.length} — thiếu thì người dùng không biết `
  + "mình dán được gì")

const vTl = vungMan(await trangHtml("nap-tai-lieu", { mock: true }), "naptailieu")
const chuTl = (vTl.match(/id="tv-dd"[^>]*>([^<]*)/) ?? [])[1] ?? ""
const keTl = chuTl.split("·").map((x) => x.trim().replace(/^\./, ""))
  .filter((x) => x && !/khác|tệp/i.test(x))
const laTl = keTl.filter((x) => !DINH_DANG.includes(x))
ok(laTl.length === 0,
  `mọi định dạng trên màn ĐỀU có trong bảng khai (${DINH_DANG.length} đuôi)`,
  `màn kể [${keTl}] · bảng [${DINH_DANG}] · lạ: [${laTl}]`)

console.log("\n5 · Menu `+ nạp` dùng token của theme\n")

const CSS = AS.gnCss ?? ""
const luatMenu = [...CSS.matchAll(/\.nap-ba-m\s*\{([^}]*)\}/g)].map((m) => m[1])
ok(luatMenu.length > 0, `tìm được ${luatMenu.length} luật \`.nap-ba-m\``)
const than = luatMenu.join(" ")
for (const [tp, mau] of [["nền", /background\s*:\s*var\(--/],
                         ["viền", /border\s*:[^;]*var\(--/]]) {
  ok(mau.test(than), `  ${tp} của menu qua token`,
    `được: ${than.slice(0, 90)} — màu gõ tay không đổi theo theme, và ảnh người `
    + "dùng gửi là panel trắng trên nền sáng")
}

console.log("\n6 · Ngân sách — đo BYTE\n")

for (const [ten, noi] of [["gn.js", AS.gnJs], ["gn.css", AS.gnCss]]) {
  const b = Buffer.byteLength(noi ?? "", "utf8")
  // FR-068: `gn.css` 104448, `gn.js` giữ 102400.
  const tran = ten === "gn.css" ? TRAN.css : TRAN.js
  ok(b <= tran, `${ten} ${b}/${tran} byte (dư ${tran - b})`,
    "`page-weight` so KB làm tròn nên cho lọt tới 511 byte quá trần")
}

console.log("\n7 · Lối `file` cũng có mô tả + gán nhãn — file THẮNG\n")

/*
 * Template `mau-nap-nguon.md` ĐÃ khai `one_liner` · `concepts` · `category`,
 * nên ba ô ở lối này KHÔNG phải nguồn thứ hai: chúng BỔ SUNG khi file thiếu.
 * Không có luật "file thắng" thì hai nơi khai một sự thật.
 */
const vBv = vungMan(await trangHtml("nap-bai-viet", { mock: true }),
  "napbaiviet")
const iF = vBv.indexOf('data-napview="file"')
const sauF = iF < 0 ? "" : vBv.slice(iF)
const jF = sauF.indexOf('data-napview=', 20)
const vungF = jF < 0 ? sauF : sauF.slice(0, jF)
ok(vungF.length > 200, `vùng lối \`file\` ${vungF.length} byte`,
  "không cắt được vùng ⇒ mọi phép kiểm dưới đo trên chuỗi rỗng")

for (const [id, ten] of [["up-mo", "mô tả"], ["up-cat", "chủ đề"],
                         ["up-cpt", "khái niệm"]]) {
  ok(vungF.includes(`id="${id}"`), `lối \`file\` có ô ${ten} \`#${id}\``,
    "người dùng: *mục nộp file .md cũng chưa có mô tả và gán concept/category*")
}
// Hai ô nhãn tự nạp từ DB qua `data-dm` — không thêm một đường nạp thứ hai.
for (const [id, dm] of [["up-cat", "cat"], ["up-cpt", "cpt"]]) {
  const i = vungF.indexOf(`id="${id}"`)
  const the = i < 0 ? "" : vungF.slice(vungF.lastIndexOf("<", i), i + 60)
  ok(new RegExp(`data-dm="${dm}"`).test(the),
    `  \`#${id}\` khai \`data-dm="${dm}"\` để tự nạp từ DB`,
    "không khai ⇒ ô rỗng vĩnh viễn, và bộ nạp chung không thấy nó")
}

// LUẬT PHẢI NÓI RA trên màn: file thắng.
ok(/thiếu|bổ sung|file khai/i.test(vungF),
  "  màn nói ra luật: ba ô chỉ bổ sung khi file thiếu",
  "không nói ⇒ người dùng không biết ô hay file thắng, và sẽ điền cả hai")

// FE phải GỬI ba giá trị đó đi, không thì ô là trang trí.
const thanNop = thanHam(MA, "nopFile")
ok(thanNop.length > 0, "tìm được thân `nopFile`")
ok(/x-bo-sung|boSung/i.test(thanNop),
  "`nopFile` GỬI phần bổ sung lên server",
  "ô hiện ra mà không gửi đi thì giá trị người dùng gõ biến mất")

// Và server phải GHÉP theo luật file-thắng.
const SV = readFileSync(join(GOC, "web", "server.mjs"), "utf8")
ok(/x-bo-sung/.test(SV), "`server.mjs` ĐỌC phần bổ sung",
  "FE gửi mà server không đọc thì nó đi vào hư không")

/*
 * ĐO HÀNH VI, KHÔNG KHỚP VĂN XUÔI.
 *
 * Bản đầu tìm chữ "thiếu"/"chỉ khi" quanh `x-bo-sung` trong `server.mjs` — và
 * chú thích của tôi viết "THIEU" không dấu nên nó không khớp. Một phép kiểm
 * khớp văn xuôi kể VỀ luật thì đổi một chữ là nó nói sai, còn luật đổi thì nó
 * vẫn xanh. Cả hai chiều đều vô dụng.
 *
 * Nên gọi thật: file CÓ `category` + header đề nghị `category` khác ⇒ giá trị
 * trong FILE phải sống. File THIẾU ⇒ phần bổ sung được điền.
 */
{
  const { batServer: bs, dungKho: dk, dungSchema: ds, CAT_FX: CF, CPT_FX: CP }
    = await import("./_api.mjs")
  const { mkdtempSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const kv = dk("gn-bosung-kb", { chuDe: true })
  const sc = ds("gn-bosung-sc", { chuDe: true })
  const inbox = mkdtempSync(join(tmpdir(), "gn-bosung-in-"))
  const sv = await bs({ kho: kv.kho, rac: kv.rac, schema: sc.schema, inbox })
  try {
    const fmMd = (them) => [
      "---", 'id: "src_bosung01"', 'slug: "bs-thu"',
      'source_type: "article"', 'url: "https://example.com/bs"',
      'protocol_version: "2.0"', 'analyzed_at: "2026-08-28"',
      'one_liner: "Ban thu bo sung"', 'credibility_max: "plausible"',
      'conformance: "B"', ...them, "---", "", "Than bai co san.", "",
    ].join("\n")

    const nop = async (md, bsung, ten) => {
      const r = await fetch(`http://127.0.0.1:${sv.cong}/api/inbox`, {
        method: "POST",
        headers: {
          "content-type": "text/markdown", "x-ten-file": ten,
          "x-bo-sung": encodeURIComponent(JSON.stringify(bsung)),
        },
        body: md,
      })
      return r
    }

    // (a) FILE CÓ `category` ⇒ giá trị của file phải sống
    const rCo = await nop(fmMd([`category: [${CF[0][0]}]`]),
      { category: [CF[1][0]], concepts: [], than: "" }, "bs-co.md")
    const fCo = readFileSync(join(inbox, "bs-co.md"), "utf8")
    ok(new RegExp(`category:\\s*\\[${CF[0][0]}`).test(fCo),
      `file khai \`${CF[0][0]}\` ⇒ giá trị đó SỐNG qua phép ghép`,
      `được: ${(fCo.match(/^category:.*/m) ?? [])[0]} — ghi đè khoá file đã `
      + "khai là làm mất thứ người dùng viết trong file")
    ok(!fCo.includes(CF[1][0]),
      `  giá trị bổ sung KHÔNG chen vào`,
      `thấy \`${CF[1][0]}\` trong file — hai giá trị cho một khoá`)

    // (b) FILE THIẾU ⇒ phần bổ sung được điền
    const rThieu = await nop(fmMd([]),
      { category: [CF[2][0]], concepts: [CP[0][0]], than: "" }, "bs-thieu.md")
    const fT = readFileSync(join(inbox, "bs-thieu.md"), "utf8")
    ok(new RegExp(`category:\\s*\\[${CF[2][0]}`).test(fT),
      `file THIẾU \`category\` ⇒ phần bổ sung được điền`,
      `frontmatter: ${fT.slice(0, 240)} — không điền thì ba ô là trang trí`)
    ok(rCo.status < 500 && rThieu.status < 500,
      `hai lần nộp không làm server ném (${rCo.status} · ${rThieu.status})`)
  } finally {
    sv.dung()
    kv.don()
  }
}

console.log("\n8 · Nút `Ghi vào kho` đứng SAU mọi ô của form\n")

/*
 * NGƯỜI DÙNG: *"button ghi vào kho để ở dưới cùng chứ"*.
 *
 * Ở hai màn tài liệu/video nút bị kẹt TRONG khối `#tv-meta`/`#vd-meta` — khối
 * này đứng trước Tiêu đề · Mô tả · Chủ đề · Khái niệm, nên nút hiện ra GIỮA
 * form. Màn bài viết bọc nút trong `.f-act` đặt cuối, và đó là bản đúng.
 *
 * ĐO THỨ TỰ TRONG DOM, không đo "có nút hay không": phép kiểm có-mặt vẫn xanh
 * y nguyên khi nút nằm sai chỗ — đúng lỗi đang phải chữa.
 */
const TIEN = { napbaiviet: "f", naptailieu: "tv", napvideo: "vd" }
for (const m of MAN_NAP) {
  const tien = TIEN[m.id_shell]
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.id_shell)
  const viTri = (id) => v.indexOf(`id="${id}"`)
  const iGui = viTri(`${tien}-gui`)
  ok(iGui > 0, `\`/${m.ten}/\` có nút \`#${tien}-gui\` (vị trí ${iGui})`,
    "không có mốc ⇒ mọi phép so thứ tự dưới đây đo trên -1")
  for (const o of ["title", "cat", "cpt"]) {
    const i = viTri(`${tien}-${o}`)
    ok(i > 0, `  có ô \`#${tien}-${o}\` (vị trí ${i})`,
      "vắng ô ⇒ phép so thứ tự xanh vô căn cứ")
    ok(iGui > 0 && i > 0 && iGui > i,
      `  nút đứng SAU \`#${tien}-${o}\``,
      `nút ở ${iGui} · ô ở ${i} — nút nằm TRƯỚC ô thì người dùng gặp "Ghi vào `
      + "kho\" khi còn nửa form chưa điền")
  }
  // Bọc như màn bài viết: nút cuối form sống trong `.f-act`.
  const the = iGui < 0 ? "" : v.slice(Math.max(0, iGui - 400), iGui)
  ok(/class="f-act"/.test(the), `  nút nằm trong khối \`.f-act\``,
    "màn bài viết bọc nút bằng `.f-act` (thanh hành động dính đáy); hai màn "
    + "kia thả nút trần thì cùng một việc có hai hình dạng")
}

console.log("\n9 · Ô tích Chủ đề/Khái niệm KHÔNG bị dàn ra hai mép\n")

/*
 * ẢNH NGƯỜI DÙNG GỬI: `aitalkshow` sát mép trái, `ml` sát mép phải, khoảng
 * trống mênh mông ở giữa.
 *
 * ĐO ĐƯỢC (Chromium, `getComputedStyle(#tv-cat)`): `justify-content:
 * space-between`, hai nhãn ở 646..736 và 1237..1276 — cách nhau 501px.
 *
 * NGUỒN: mốc `.f-chon` là một `<span>` con TRỰC TIẾP của `.f-row`, nên luật
 * dành cho NHÃN (`.f-row > span{…justify-content:space-between}`, độ cụ thể
 * 0-1-1) đè luật của chính mốc (`.f-chon`, 0-1-0). `flex-wrap` một mình không
 * dàn hai mép — `justify-content` mới dàn.
 *
 * Phép kiểm này đo CẢ HAI VẾ: markup (mốc đúng là `<span>` con của `.f-row`)
 * và CSS (không luật nào khớp mốc đó mà khai lại thứ `.f-chon` đã khai).
 */

/** Cắt stylesheet thành {sel, than} bằng cách QUÉT NGOẶC theo độ sâu.
 *  Không dùng neo `(?:^|[};])`: neo đó nuốt dấu `}` của luật liền trước nên
 *  chỉ thấy CÁCH MỘT luật — lỗi đã trúng hai lần trong dự án. */
function catLuat(css, ra = []) {
  let i = 0
  while (i < css.length) {
    const mo = css.indexOf("{", i)
    if (mo < 0) break
    const sel = css.slice(i, mo).trim()
    let sau = 1, k = mo + 1
    for (; k < css.length && sau; k++) {
      if (css[k] === "{") sau++
      else if (css[k] === "}") sau--
    }
    const than = css.slice(mo + 1, k - 1)
    if (sel.startsWith("@")) catLuat(than, ra)
    else ra.push({ sel, than })
    i = k
  }
  return ra
}

/** Bộ chọn có rơi trúng mốc `<span class="f-chon">` con của `.f-row` không? */
function deLenMoc(sel) {
  const s = sel.trim().replace(/\s*>\s*/g, ">")
  const i = Math.max(s.lastIndexOf(">"), s.lastIndexOf(" "))
  if (i < 0) return false
  const cuoi = s.slice(i + 1)
  if (!s.slice(0, i).includes(".f-row")) return false
  if (!/^span\b/.test(cuoi)) return false
  return !cuoi.includes(":not(.f-chon)")
}

const CSS_GOC = readFileSync(join(GOC, "web", "styles", "prototype.css"), "utf8")
  .replace(/\/\*[^]*?\*\//g, " ")
const LUAT = catLuat(CSS_GOC)
ok(LUAT.length > 300, `cắt được ${LUAT.length} luật CSS`,
  "cắt hỏng ⇒ mọi phép kiểm dưới đây xanh vì không thấy gì")

// VẾ MARKUP · mốc đúng là `<span>` con trực tiếp của `.f-row`.
const SHELL = readFileSync(join(GOC, "web", "render", "shell.html"), "utf8")
const moc = [...SHELL.matchAll(/<(\w+)([^>]*class="f-chon"[^>]*)>/g)]
ok(moc.length >= 6, `shell có ${moc.length} mốc \`.f-chon\``,
  "0 mốc ⇒ vế markup không đo gì")
const laSpan = moc.filter((x) => x[1] === "span")
const conCuaFRow = moc.filter((x) => {
  const truoc = SHELL.slice(0, x.index)
  const ngan = []
  for (const t of truoc.matchAll(/<(\/?)(div|label|span|fieldset|section|form)\b([^>]*)>/g)) {
    if (t[1]) ngan.pop()
    else if (!t[3].endsWith("/")) ngan.push(t[0])
  }
  return /class="[^"]*\bf-row\b/.test(ngan[ngan.length - 1] ?? "")
})
ok(laSpan.length === moc.length && conCuaFRow.length === moc.length,
  `cả ${moc.length} mốc đều là \`<span>\` con trực tiếp của \`.f-row\``,
  `span: ${laSpan.length} · con của .f-row: ${conCuaFRow.length} — đổi hình `
  + "dạng mốc thì vế CSS dưới đây không còn là điều phải đúng")

// VẾ CSS · luật của chính mốc khai gì, và luật nhãn có giẫm lên không.
const luatChon = LUAT.filter((r) =>
  r.sel.split(",").some((s) => s.trim() === ".f-chon"))
ok(luatChon.length > 0, `tìm được ${luatChon.length} luật \`.f-chon\``,
  "không có luật gốc ⇒ không suy ra được thứ gì đang bị giẫm")
const KHAI = [...new Set(luatChon.flatMap((r) =>
  [...r.than.matchAll(/(?:^|;)\s*([a-z-]+)\s*:/g)].map((m) => m[1])))]
// `justify-content` mốc KHÔNG khai — mặc định `flex-start`. Luật khác đưa
// `space-between` vào chính là thứ dàn hai mép trên ảnh người dùng gửi.
const CAM = [...new Set([...KHAI, "justify-content"])]
ok(CAM.includes("display") && CAM.includes("justify-content"),
  `bộ thuộc tính cấm giẫm: ${CAM.join(" · ")}`)

const giam = []
for (const r of LUAT) {
  const sel = r.sel.split(",").map((s) => s.trim()).filter(deLenMoc)
  if (!sel.length) continue
  for (const p of CAM) {
    if (new RegExp(`(?:^|;)\s*${p}\s*:`).test(r.than))
      giam.push(`${sel.join(",")} { ${p} }`)
  }
}
ok(giam.length === 0,
  "không luật nhãn nào giẫm lên mốc `.f-chon`",
  `giẫm: ${giam.join(" | ")} — mốc là <span> con của .f-row nên luật NHÃN `
  + "(0-1-1) đè luật của mốc (0-1-0); `justify-content:space-between` là thứ "
  + "đẩy `aitalkshow` sang mép trái và `ml` sang mép phải")

chot("ba lối đều có mô tả + nhãn · nút nạp mời lối khác · chữ khớp bảng")
