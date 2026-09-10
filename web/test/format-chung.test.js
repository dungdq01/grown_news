#!/usr/bin/env node
/**
 * WO-021 — MỘT format chung cho ba form nạp, và bố cục không lệch trái.
 *
 * Người dùng: *"format của viết bài và nạp tài liệu / video chưa đồng bộ form
 * input ⇒ cần thống nhất 1 format chung và bỏ đi 1 số trường ko cần thiết"* ·
 * *"UI các màn nhập input nạp đang bị lệch về bên trái quá"*.
 *
 * ═══ ĐO TẬP, KHÔNG ĐO SỰ CÓ MẶT ═══════════════════════════════════════════
 *
 * "Màn A có ô Tiêu đề" là một phép kiểm xanh khi tôi thêm ô cho một màn và quên
 * hai màn kia. Điều phải đúng là BA TẬP GIỐNG NHAU — nên §1 đo tập giao và tập
 * hiệu, và nói ra màn nào thiếu trường nào.
 *
 * Và §2 đo hai vế của cùng một việc: bốn trường đã gỡ KHÔNG còn ô, nhưng VẪN đi
 * vào payload. Gỡ ô mà quên tự điền thì schema trả 422 — sau khi người dùng gõ
 * xong cả form.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CAT_FX, CPT_FX, GOC, batServer, dungKho, dungSchema, goi, taoKiem,
  thanBai } from "./_api.mjs"
import { napRender, taiSan, trangHtml } from "./_render.mjs"

const { ok, chot } = taoKiem()
await napRender()
const AS = await taiSan()
const CSS = AS.gnCss ?? ""

const NL = String.fromCharCode(10)
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)
const MA = chiMa(readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8"))

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

function vungMan(html, idShell) {
  const mo = `id="v-${idShell}"`
  const i = html.indexOf(mo)
  if (i < 0) return ""
  const sau = html.slice(i + mo.length)
  const j = sau.search(/id="v-[a-z]+"/)
  return j < 0 ? sau.slice(0, sau.indexOf("</main>")) : sau.slice(0, j)
}

const MAN = [
  { ten: "nap-bai-viet", shell: "napbaiviet", tien: "f" },
  { ten: "nap-tai-lieu", shell: "naptailieu", tien: "tv" },
  { ten: "nap-video", shell: "napvideo", tien: "vd" },
]

/* Năm trường CỐ ĐỊNH — cùng nhãn, cùng thứ tự, ở cả ba màn. */
const CO_DINH = [
  ["tiêu đề", "title"],
  ["tóm tắt", "1l"],
  ["mô tả", "mo"],
  ["chủ đề", "cat"],
  ["khái niệm", "cpt"],
]

console.log("\n1 · BA form CÙNG một bộ trường cố định — đo TẬP\n")

const co = {}
for (const m of MAN) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.shell)
  ok(v.length > 300, `vùng \`v-${m.shell}\` ${v.length} byte`)
  co[m.ten] = new Set(CO_DINH
    .filter(([, hau]) => v.includes(`id="${m.tien}-${hau}"`))
    .map(([nhan]) => nhan))
}
for (const m of MAN) {
  const thieu = CO_DINH.map(([n]) => n).filter((n) => !co[m.ten].has(n))
  ok(thieu.length === 0,
    `\`/${m.ten}/\` có đủ ${CO_DINH.length} trường cố định`,
    `THIẾU: ${thieu.join(" · ")} — người dùng: *các fields cố định thì up gì lên `
    + "cũng nên hiển thị lên UI*")
}
// TẬP HIỆU · hai màn bất kỳ không được lệch nhau trường cố định nào.
for (let i = 0; i < MAN.length; i++) {
  for (let j = i + 1; j < MAN.length; j++) {
    const a = co[MAN[i].ten], b = co[MAN[j].ten]
    const lech = [...new Set([...a, ...b])].filter((x) => a.has(x) !== b.has(x))
    ok(lech.length === 0,
      `\`${MAN[i].ten}\` và \`${MAN[j].ten}\` KHÔNG lệch trường nào`,
      `lệch: ${lech.join(" · ")} — thêm ô cho một màn mà quên màn kia thì phép `
      + "kiểm có-mặt vẫn xanh")
  }
}

console.log("\n2 · Bốn trường đã GỠ: không còn ô, nhưng VẪN vào payload\n")

const GO = [
  ["f-id", "id", "Mã bài"],
  ["f-slug", "slug", "Tên đường dẫn"],
  ["f-cred", "credibility_max", "Tín cậy tối đa"],
  ["f-conf", "conformance", "Mức đầy đủ"],
]
const vBv = vungMan(await trangHtml("nap-bai-viet", { mock: true }), "napbaiviet")
for (const [id, , nhan] of GO) {
  ok(!vBv.includes(`id="${id}"`), `form KHÔNG còn ô \`${nhan}\` (\`#${id}\`)`,
    "người dùng: *Cất ở đâu trong kho / Tín cậy tối đa / Mức đầy đủ → "
    + "chưa cần thiết*")
}
// Và slug cũng gỡ khỏi hai màn kia — cùng nhóm "cất ở đâu trong kho".
for (const [shell, tien] of [["naptailieu", "tv"], ["napvideo", "vd"]]) {
  const v = vungMan(await trangHtml(
    shell === "naptailieu" ? "nap-tai-lieu" : "nap-video", { mock: true }), shell)
  ok(!v.includes(`id="${tien}-slug"`),
    `\`v-${shell}\` KHÔNG còn ô \`Địa chỉ trong kho\``,
    "cùng nhóm với `Cất ở đâu trong kho` đã gỡ ở màn bài viết")
}

/*
 * VẾ THỨ HAI, và nó là vế dễ quên: schema đòi cả bốn trường. Gỡ ô mà không tự
 * điền thì mọi lần bấm Ghi là 422 — sau khi người dùng đã gõ xong cả form.
 */
const thanGui = thanHam(MA, "guiFormThat")
ok(thanGui.length > 0, "tìm được thân `guiFormThat`")
for (const [, khoa, nhan] of GO) {
  ok(new RegExp(`\\b${khoa}\\s*:`).test(thanGui),
    `  payload VẪN có \`${khoa}\` (thay cho ô ${nhan})`,
    "gỡ ô mà quên tự điền ⇒ 422 mỗi lần bấm Ghi, và 422 đó tới sau khi người "
    + "dùng gõ xong")
}

console.log("\n3 · Nhãn hai ô nhãn: 'nên có', KHÔNG phải 'bắt buộc'\n")

for (const m of MAN) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.shell)
  for (const hau of ["cat", "cpt"]) {
    const i = v.indexOf(`id="${m.tien}-${hau}"`)
    if (i < 0) continue
    // hàng chứa ô: từ `<div class="f-row"` gần nhất phía trước
    const dau = v.lastIndexOf("f-row", i)
    const hang = dau < 0 ? "" : v.slice(dau, i)
    ok(!/f-req/.test(hang),
      `\`/${m.ten}/\` ô \`${hau}\` KHÔNG ghi "bắt buộc"`,
      "server nhận khi trống mà màn ghi 'bắt buộc' là màn nói sai về luật")
  }
}

console.log("\n4 · Cổng module KHÔNG còn chặn — đo qua HTTP THẬT\n")

/*
 * Đây là ĐẢO một phép kiểm cũ (`nhan-bat-buoc` §1-§2 đòi 422). Người dùng chốt
 * bỏ chặn, nên phải đo qua HTTP: đọc chuỗi trong `cong-module.mjs` thì một hàm
 * trả `null` ở nhánh khác vẫn làm phép kiểm nói sai.
 */
{
  const kv = dungKho("gn-format-kb", { chuDe: true })
  const sc = dungSchema("gn-format-sc", { chuDe: true })
  const sv = await batServer({ kho: kv.kho, rac: kv.rac, schema: sc.schema })
  try {
    const { createHash } = await import("node:crypto")
    const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n",
      "utf8")
    const SHA = createHash("sha256").update(PDF).digest("hex")
    await goi(sv.cong, "POST", "/api/articles/media", {
      tho: PDF,
      headers: { "content-type": "application/pdf", "x-ten-goc": "bia.pdf" },
    })
    const fm = (slug, type, them) => ({
      id: `src_${slug.replace(/-/g, "")}zzzzzz`.slice(0, 14),
      slug, source_type: type, url: `https://example.com/${slug}`,
      protocol_version: "2.0", analyzed_at: "2026-08-28",
      one_liner: `Ban thu ${slug}`, credibility_max: "plausible",
      conformance: "B", ...them,
    })
    for (const [ten, duong, f] of [
      ["tài liệu", "/api/tai-lieu", fm("fc-tl", "tai-lieu", {
        ho_so: "thu-vien", category: [], concepts: [],
        media: [{ sha256: SHA, mime: "application/pdf", ten_goc: "bia.pdf",
                 so_byte: PDF.length }],
      })],
      ["video", "/api/video", fm("fc-vd", "video", {
        ho_so: "thu-vien", category: [], concepts: [],
        url: "https://youtu.be/abc123fmt01",
        url_normalized: "youtube.com/watch?v=abc123fmt01",
      })],
    ]) {
      const r = await goi(sv.cong, "POST", duong,
        { body: { frontmatter: f, body: thanBai() } })
      ok(r.ma === 201, `${ten} THIẾU chủ đề + khái niệm ⇒ 201 (được ${r.ma})`,
        `${JSON.stringify(r.json ?? "")} — người dùng chốt BỎ chặn: `
        + "*ko hẳn cần require*")
    }
    // Và bản ĐỦ nhãn vẫn phải vào được — không đổi vế dương.
    const rDu = await goi(sv.cong, "POST", "/api/video",
      { body: { frontmatter: fm("fc-vd2", "video", {
        ho_so: "thu-vien", category: [CAT_FX[0][0]], concepts: [CPT_FX[0][0]],
        url: "https://youtu.be/abc123fmt02",
        url_normalized: "youtube.com/watch?v=abc123fmt02",
      }), body: thanBai() } })
    ok(rDu.ma === 201, `video ĐỦ nhãn vẫn ⇒ 201 (được ${rDu.ma})`,
      JSON.stringify(rDu.json ?? ""))
  } finally {
    sv.dung()
    kv.don()
  }
}

console.log("\n5 · Cột form KHÔNG dán vào mép trái panel\n")

/*
 * ĐO ĐƯỢC hiện trạng trên Chromium: `.f-row` `max-width: 600px` trong panel
 * **1344px** ⇒ trống **715px = 53%** bên phải.
 *
 * Bản đầu của phép kiểm này đòi một khối bao `.np-2c` (hai cột). Tôi bỏ cách
 * đó: nó cần ba thẻ bao mỗi panel, và một lát cắt lấy sai mốc làm hỏng DOM
 * trong khi PHÉP ĐẾM THĂNG BẰNG VẪN XANH — cân bằng đạt ở sai chỗ vẫn là cân
 * bằng. Mất sáu lượt vá mới về lại được.
 *
 * Nên đo ĐIỀU CẦN ĐÚNG, không đo tên khối: cột form phải căn giữa panel.
 */
const cssMa = CSS.replace(/[/][*][^]*?[*][/]/g, " ")
const luatNp = [...cssMa.matchAll(/([^{}@]*\.np-p[^{}@]*)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim(), than: m[2] }))
ok(luatNp.length > 0, `tìm được ${luatNp.length} luật \`.np-p\``)

const canGiua = luatNp.filter((l) => /margin-inline\s*:\s*auto/.test(l.than))
ok(canGiua.length > 0, "cột form CĂN GIỮA panel (`margin-inline: auto`)",
  "không căn ⇒ form dán mép trái và trống 53% bên phải")
// `margin:auto` một mình không căn được: cần một `max-width` chặn bề rộng.
ok(canGiua.some((l) => /max-width\s*:/.test(l.than)),
  "  và có `max-width` — thiếu nó thì `auto` không căn được gì",
  `được: ${canGiua.map((l) => l.than.trim().slice(0, 50)).join(" | ")}`)

// CA ÂM · KHÔNG chữa bằng cách kéo ô nhập rộng cả panel.
const oRong = luatNp.filter((l) => /\.f-row/.test(l.sel))
  .filter((l) => {
    const m = l.than.match(/max-width\s*:\s*([\d.]+)(rem|px)/)
    if (!m) return false
    const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1])
    return px > 800
  })
ok(oRong.length === 0, "  ô nhập KHÔNG bị kéo rộng quá 800px",
  `${oRong.map((l) => l.sel).join(" · ")} — một dòng chữ dài thế thì mắt mất `
  + "hàng khi xuống dòng; chữa lệch trái bằng cách kéo ô là đổi lỗi lấy lỗi")

// Dải lối căn theo CÙNG cột — lệch nhau thì mắt thấy hai mép trái.
const luatTw = [...cssMa.matchAll(/([^{}@]*\.np-tw[^{}@]*)\{([^{}]*)\}/g)]
  .map((m) => m[2])
ok(luatTw.some((t) => /margin-inline\s*:\s*auto/.test(t)),
  "  dải lối căn theo cùng cột với form",
  "lệch nhau thì màn có hai mép trái, và mắt thấy ngay")

console.log("\n6 · Dải TAB sinh cột theo số tab CÓ MẶT, không đếm cứng\n")

/*
 * WO-021 chua COT FORM (`.np-p`) va §5 do dung cai do. Dai tab nam NGOAI
 * `.np-p` nen no khong nam trong pham vi phep do — chua nua man roi do dung
 * nua da chua.
 *
 * DO TRUTH, KHONG DO FORM: khong hoi "CSS co chuoi auto-flow khong" ma hoi
 * "co man nao ma so COT khai ra lon hon so TAB that khong".
 */
const soTab = {}
for (const m of MAN) {
  const v = vungMan(await trangHtml(m.ten, { mock: true }), m.shell)
  soTab[m.ten] = (v.match(/class="np-tab /g) ?? []).length
}
ok(new Set(Object.values(soTab)).size > 1,
  `phép đếm PHÂN BIỆT được ba màn: ${JSON.stringify(soTab)}`,
  "ra cùng một số cho cả ba ⇒ tôi đang đếm sai phạm vi, và §6 xanh vì MÙ")

const luatTab = [...cssMa.matchAll(/([^{}@]*\.np-tabs[^{}@]*)\{([^{}]*)\}/g)]
  .map((m) => ({ sel: m[1].trim(), than: m[2] }))
ok(luatTab.length > 0, `tìm được ${luatTab.length} luật \`.np-tabs\``)

const itNhat = Math.min(...Object.values(soTab))
const cotCung = luatTab
  .map((l) => [l, /grid-template-columns\s*:\s*repeat\(\s*(\d+)/.exec(l.than)])
  .filter(([, m]) => m && Number(m[1]) > itNhat)
// Dung MOT bien cho cau loi. Cat mot template literal giua chung qua hai
// chuoi backtick lam `${...` dong som va phan sau thanh phep noi chuoi —
// cong CHET thay vi BAO, va mot cong chet khong noi duoc gi.
const manItNhat = Object.entries(soTab)
  .filter(([, n]) => n === itNhat).map(([t]) => t).join(" · ")
const cauCotCung = cotCung.map(([l, m]) => `${l.sel} khai ${m[1]} cột`).join(" · ")
ok(cotCung.length === 0,
  `không luật nào khai cứng nhiều hơn ${itNhat} cột (màn ít tab nhất)`,
  `${cauCotCung} — màn ${manItNhat} chỉ có ${itNhat} tab, phần còn lại BỎ TRỐNG`)

// Truy van hep phai doi `grid-auto-flow`, KHONG doi `grid-template-columns`:
// voi `auto-flow: column` thi thuoc tinh kia VO HIEU, nen mot truy van hep
// "da sua" tren giay se khong lam gi ca va ba tab nam ngang tren dien thoai.
const hep = [...CSS.matchAll(/@media[^{]*max-width[^{]*\{([^]*?)\}\s*\}/g)]
  .map((m) => m[1]).filter((t) => t.includes(".np-tabs"))
ok(hep.length > 0, `có truy vấn hẹp cho \`.np-tabs\` (${hep.length})`)
ok(hep.some((t) => /grid-auto-flow\s*:\s*row/.test(t))
  || luatTab.every((l) => !/grid-auto-flow\s*:\s*column/.test(l.than)),
  "  truy vấn hẹp xếp tab thành HÀNG",
  "đổi `grid-template-columns` trong khi luật gốc dùng `auto-flow: column` là đổi một thuộc tính đã vô hiệu — ba tab vẫn nằm ngang trên điện thoại")

chot("ba form một format · bốn trường máy điền · không chặn · cột form căn giữa")
