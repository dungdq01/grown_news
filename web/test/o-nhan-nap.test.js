#!/usr/bin/env node
/**
 * WO-016 — hai đường nạp còn lại phải có ô CHỦ ĐỀ + KHÁI NIỆM.
 *
 * VÌ SAO CỔNG NÀY BẮT BUỘC: T08-17 vừa đặt luật server đòi `≥1 category` +
 * `≥1 concepts` cho tài liệu/video. Đo được: hai màn nạp có **0** `<select>`.
 * Nghĩa là nạp một tài liệu qua UI hiện là **422 mà không có ô nào để điền** —
 * luật và ô phải về cùng lượt, để lệch là làm sản phẩm xấu hơn khi chưa có luật.
 *
 * LOẠI NGUỒN không cần ô: nó suy từ chính đường nạp (`/tai-lieu/nap/` ⇒
 * `tai-lieu`) và từ `media.mime` / `url_normalized`. Một ô cho nó là hỏi người
 * dùng thứ máy đã biết.
 *
 * ═══ BA ĐIỀU ĐO, KHÔNG ĐIỀU NÀO LÀ "CÓ CHUỖI TRONG FILE" ═══════════════════
 *
 * §1 mốc phải khai bằng THUỘC TÍNH. `napDanhMuc` gõ hai id (`f-cpt`, `f-cat`)
 *    thì form thứ ba im lặng không được nạp — đúng bệnh `#acount` của WO-015,
 *    và cách chữa cùng hình dạng (`data-dem`).
 * §2 `napDanhMuc` nạp MỌI mốc, không phải hai mốc đầu.
 * §3 hai hàm gửi đưa `category` + `concepts` vào frontmatter chúng POST. Thiếu
 *    vế này thì ô hiện ra mà giá trị không đi đâu, và server vẫn 422.
 *
 * CA ÂM của §3: nếu hai hàm gửi đọc mốc của form BÀI VIẾT (`f-cat`) thì phép
 * kiểm "có đọc nhãn" vẫn xanh trong khi hai form gửi nhãn của một form khác.
 * Nên §3 đòi mỗi hàm đọc mốc CỦA NÓ.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { GOC, taoKiem } from "./_api.mjs"
import { napRender, trangHtml } from "./_render.mjs"
// TRAN doc tu MOT nguon (`_tran.mjs`) — con so nay tung song o 11 file,
// va noi mot tran lam 8 cong do cung luc. Xem `FR-074`.
import { TRAN } from "./_tran.mjs"

const { ok, chot } = taoKiem()
await napRender()

/*
 * NGUỒN = multiwindow + MỌI chunk theo màn (T03-104).
 *
 * Đọc riêng `multiwindow.inline.ts` là đọc MỘT PHẦN rồi kết luận về toàn thể:
 * `T03-104` dời `ghiVideo`/`ganNapVideo` sang `plugins/napvideo/`, hành vi
 * KHÔNG đổi, và cổng đỏ vì nó nhìn sai chỗ. Ghép mọi `.inline.ts` của các
 * plugin chunk lại — thêm một chunk sau này thì không phải sửa cổng nữa.
 */
const CHUNK_TS = ["napvideo/src/napvideo.inline.ts", "chungcat/src/chungcat.inline.ts"]
  .map((f) => {
    try { return readFileSync(join(GOC, "web", "plugins", f), "utf8") } catch { return "" }
  })
const TS = [readFileSync(join(GOC, "web", "plugins", "multiwindow", "src",
  "scripts", "multiwindow.inline.ts"), "utf8"), ...CHUNK_TS]
  .join(String.fromCharCode(10))

const NL = String.fromCharCode(10)
/** Bỏ chú thích trước khi đo: chú thích DẪN LẠI mã cũ để nói vì sao nó sai. */
const chiMa = (s) => s.replace(/[/][*][^]*?[*][/]/g, NL)
  .split(NL).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL)
const MA = chiMa(TS)

/** Thân một hàm, cắt bằng NGOẶC KHỚP — chữ ký có thể trải nhiều dòng. */
function thanHam(ma, ten) {
  const i = ma.search(new RegExp("function\\s+" + ten + "\\b"))
  if (i < 0) return ""
  const b = ma.indexOf("{", i)
  let sau = 0
  for (let k = b; k < ma.length; k++) {
    if (ma[k] === "{") sau++
    else if (ma[k] === "}") { sau--; if (!sau) return ma.slice(b, k + 1) }
  }
  return ""
}

/** Cắt một view — mốc là view KẾ TIẾP, không phải `</main>`. */
function vungMan(html, idShell) {
  const mo = `id="v-${idShell}"`
  const i = html.indexOf(mo)
  if (i < 0) return ""
  const sau = html.slice(i + mo.length)
  const j = sau.search(/id="v-[a-z]+"/)
  return j < 0 ? sau.slice(0, sau.indexOf("</main>")) : sau.slice(0, j)
}

const MAN = [
  { ten: "tai-lieu/nap", view: "naptailieu", tien: "tv", ham: "ghiBanGhiThuVien" },
  { ten: "video/nap", view: "napvideo", tien: "vd", ham: "ghiVideo" },
]

console.log("\n1 · Hai màn nạp có mốc CHỦ ĐỀ + KHÁI NIỆM\n")

const vung = {}
for (const m of MAN) {
  const h = await trangHtml(m.view === "naptailieu" ? "nap-tai-lieu" : "nap-video",
    { mock: true })
  vung[m.tien] = vungMan(h, m.view)
  ok(vung[m.tien].length > 500, `vùng \`v-${m.view}\` ${vung[m.tien].length} byte`)
  for (const [loai, nhan] of [["cat", "chủ đề"], ["cpt", "khái niệm"]]) {
    ok(new RegExp(`data-dm="${loai}"`).test(vung[m.tien]),
      `\`/${m.ten}/\` có mốc ${nhan} khai bằng \`data-dm="${loai}"\``,
      "khai bằng id gõ cứng ⇒ `napDanhMuc` phải gõ thêm một cặp id cho mỗi form, "
      + "và form nào bị quên thì im lặng không được nạp")
  }
}

console.log("\n2 · `napDanhMuc` nạp MỌI mốc, không phải hai mốc gõ cứng\n")

const thanNap = thanHam(MA, "napDanhMuc")
ok(thanNap.length > 0, "tìm được thân `napDanhMuc`")
ok(/querySelectorAll\(\s*["'`]\[data-dm/.test(thanNap)
  || /data-dm/.test(thanNap),
  "`napDanhMuc` tìm mốc THEO thuộc tính",
  "gõ `f-cpt`/`f-cat` cứng ⇒ hai form mới không bao giờ được nạp danh mục, "
  + "và không có lời nào nói ra")
// CA ÂM · vẫn còn đúng HAI id gõ cứng nghĩa là chưa đổi gì.
const idCung = (thanNap.match(/["'`]f-(?:cpt|cat)["'`]/g) ?? []).length
ok(idCung === 0, "`napDanhMuc` không còn id form gõ cứng",
  `còn ${idCung} id — mỗi id cứng là một form phải nhớ thêm tay`)

console.log("\n3 · Hai hàm gửi đưa `category` + `concepts` vào frontmatter\n")

for (const m of MAN) {
  const than = thanHam(MA, m.ham)
  ok(than.length > 0, `tìm được thân \`${m.ham}\``)
  for (const truong of ["category", "concepts"]) {
    ok(new RegExp(`\\b${truong}\\s*:`).test(than),
      `\`${m.ham}\` đưa \`${truong}\` vào frontmatter`,
      "ô hiện ra mà giá trị không đi đâu thì server vẫn 422, và người dùng "
      + "không hiểu vì sao")
  }
  // CA ÂM · đọc mốc CỦA NÓ, không đọc mốc của form bài viết.
  ok(!/["'`]f-(?:cat|cpt)["'`]/.test(than),
    `  \`${m.ham}\` KHÔNG đọc mốc của form bài viết`,
    "đọc `f-cat` ⇒ hai form gửi nhãn của một form khác, và phép kiểm có-mặt "
    + "ở trên vẫn xanh")
  ok(new RegExp(`["'\`]${m.tien}-(?:cat|cpt)["'\`]|data-dm|nhanCua`).test(than),
    `  \`${m.ham}\` đọc mốc theo tiền tố \`${m.tien}-\` hoặc qua hàm chung`)
}

console.log("\n4 · Ngân sách — đo BYTE, không đo KB làm tròn\n")

const { taiSan } = await import("./_render.mjs")
const TS_AS = await taiSan()
// FR-068 (2026-09-06): `gn.css` 102400 → 104448. `gn.js` KHÔNG đổi.
for (const [ten, noi, tran] of [["gn.js", TS_AS.gnJs, TRAN.js],
                                ["gn.css", TS_AS.gnCss, TRAN.css]]) {
  const b = Buffer.byteLength(noi ?? "", "utf8")
  ok(b <= tran, `${ten} ${b}/${tran} byte (dư ${tran - b})`,
    "`page-weight` so KB làm tròn nên cho lọt tới 511 byte quá trần; "
    + "phép kiểm này đo BYTE")
}

chot("hai màn nạp có ô nhãn · mốc khai bằng thuộc tính · hàm gửi mang nhãn đi")
