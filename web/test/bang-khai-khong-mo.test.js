#!/usr/bin/env node
/**
 * T03-84 · BẢNG KHAI NHÚNG KHÔNG ĐƯỢC MANG BYTE CHẾT — và không được rơi mất
 * trường FE đang đọc.
 *
 * `build-fe.mjs` nhúng bốn bảng khai vào bundle qua esbuild `define`. Nhúng
 * NGUYÊN bảng thì mọi trường đi theo, kể cả trường chỉ dành cho Python. File đó
 * đã hai lần phải chiếu tay (`magic`, rồi `__MAN__`) — nghĩa là đây không phải
 * ca lẻ mà là một lớp lỗi lặp lại, và nó xứng đáng có cổng.
 *
 * HAI CHIỀU, vì phép chiếu có hai cách sai:
 *   A · thừa — khoá trong bundle mà FE không đọc: người dùng tải byte vô ích.
 *   B · thiếu — FE đọc một khoá phép chiếu vừa bỏ: `undefined` lúc chạy, form
 *       thiếu một ô, KHÔNG cổng nào đỏ. Chiều này mới là chiều đắt.
 *
 * ĐO PHÉP ĐỌC, KHÔNG ĐO KHAI BÁO KIỂU. `interface Khung { phien_ban: number }`
 * không phải một phép đọc. Tính nó là "FE có dùng" thì cổng bảo vệ đúng những
 * byte nó sinh ra để dẹp.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
/*
 * NGUỒN "AI ĐỌC" phải gồm MỌI plugin, không chỉ `multiwindow`.
 *
 * `gn.js` công bố `globalThis.__GN_MEDIA__` và các CHUNK đọc nó — `napvideo`
 * khai đúng điều đó ở đầu file, và `T03-109` đọc `nhom_thu_vien` từ đó. Đọc một
 * file duy nhất thì một khoá chỉ chunk dùng trông y như khoá chết, và cổng này
 * đã báo đúng như vậy: *"khoá chết: nhom_thu_vien"* trong khi nó là thứ dựng
 * `accept` của ô file mp4.
 *
 * Cùng lớp lỗ với `page-weight` (chunk nạp-theo-yêu-cầu trông như mã chết):
 * kiến trúc có hai đường, phép đo chỉ đếm một.
 */
const TS = [
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"),
  ...readdirSync(join(WEB, "plugins"))
    .map((d) => join(WEB, "plugins", d, "src", `${d}.inline.ts`))
    .filter((p) => existsSync(p)),
].map((p) => readFileSync(p, "utf8")).join(String.fromCharCode(10))
const JS = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js"), "utf8")

/*
 * CẮT MỌI KHỐI KHAI BÁO KIỂU khỏi mã trước khi tìm phép đọc.
 *
 * `type X = {...}` và `interface X {...}` biến mất lúc biên dịch, nên một tên
 * chỉ xuất hiện trong đó là tên KHÔNG được đọc lúc chạy. Không cắt thì cổng đọc
 * `phien_ban` trong khai báo kiểu và kết luận "FE có dùng" — sai cả hai chiều
 * cùng lúc.
 */
function boKieu(src) {
  let ra = ""
  let i = 0
  // `declare const X: {…}` cũng là khai báo kiểu và biến mất lúc biên dịch.
  // Bản đầu của cổng chỉ bắt `interface`/`type` — cắt 0 byte, và §0 tự tố.
  const re = /(?:^|\n)\s*(?:export\s+)?(?:declare\s+const\s+\w+\s*:|interface\s+\w+|type\s+\w+\s*=)\s*\{/g
  for (let m = re.exec(src); m; m = re.exec(src)) {
    ra += src.slice(i, m.index)
    let sau = 1
    let k = m.index + m[0].length
    for (; k < src.length && sau; k++) {
      if (src[k] === "{") sau++
      else if (src[k] === "}") sau--
    }
    i = k
    re.lastIndex = k
  }
  return ra + src.slice(i)
}

const MA = boKieu(TS)
ok(MA.length > 0 && MA.length < TS.length,
  `cắt được ${TS.length - MA.length} byte khai báo kiểu khỏi mã chạy`,
  "không cắt được ⇒ mọi trường trong `interface` bị tính là 'FE có dùng',"
  + " và cổng này bảo vệ đúng thứ nó sinh ra để dẹp")

/** Một tên có được ĐỌC như thuộc tính trong mã chạy không. */
const doc = (ten) => new RegExp(
  `(?:\\.${ten}\\b|\\[["'\`]${ten}["'\`]\\]|(?<![\\w$])${ten}\\s*[,:}])`).test(MA)

/** Mọi khoá xuất hiện trong một literal đã in ra bundle. */
function khoaTrong(bien) {
  const i = JS.indexOf(`var ${bien} =`)
  if (i < 0) return { khoa: [], byte: 0 }
  const b = JS.indexOf("{", i)
  let sau = 0
  let k = b
  for (; k < JS.length; k++) {
    if (JS[k] === "{") sau++
    else if (JS[k] === "}") { sau--; if (!sau) break }
  }
  const blok = JS.slice(i, k + 1)
  /*
   * BỎ MỌI CHUỖI trước khi tìm khoá. Bản đầu quét thẳng và nhận `"Chuyển
   * giao:"` là một khoá tên `giao` — rồi báo nó chết. Đỏ oan, và đỏ oan làm
   * người ta thôi tin cổng nhanh hơn là xanh mù.
   */
  let tran = ""
  for (let x = 0; x < blok.length; x++) {
    const c = blok[x]
    if (c === '"' || c === "'" || c === "`") {
      for (x++; x < blok.length && blok[x] !== c; x++) if (blok[x] === "\\") x++
      continue
    }
    tran += c
  }
  return {
    khoa: [...new Set([...tran.matchAll(/(?:^|[{,\s])(\$?\w+):/g)].map((m) => m[1]))],
    byte: blok.length,
  }
}

console.log("\n1 · Chiều A — không byte chết trong bundle\n")

/*
 * CHỈ hai bảng TRƯỜNG. `__DUONG__` và `__NAP_CUA__` là bảng TRA: khoá của
 * chúng là DỮ LIỆU (id màn hình), FE tra động bằng `DUONG[id]` chứ không đọc
 * từng tên. Đòi FE nhắc tên từng khoá ở đó là đo nhầm loại bảng — và bản đầu
 * của cổng này đã báo 5 khoá chết ở đúng chỗ đó, toàn bộ là oan.
 */
const BANG = ["define_KHUNG_default", "define_MEDIA_default"]
let coBang = 0
for (const b of BANG) {
  const { khoa, byte } = khoaTrong(b)
  if (!khoa.length) continue
  coBang++
  const chet = khoa.filter((k) => !doc(k) && !/^\d+$/.test(k))
  ok(chet.length === 0,
    `  ${b} — ${byte} byte, ${khoa.length} khoá, ${chet.length} khoá FE không đọc`,
    `khoá chết: ${chet.join(" · ")} — tải về trình duyệt rồi không ai đọc`)
}
ok(coBang === BANG.length, `  đọc được ${coBang} bảng khai đã nhúng`,
  "thiếu bảng ⇒ chưa build, và mọi phép trên đúng vô điều kiện")

console.log("\n2 · Chiều B — không trường nào FE đọc bị rơi khỏi bundle\n")

/*
 * Chiều này CHỈ đo được với các khoá mà bảng khai gốc có. Đọc thẳng file JSON —
 * nếu FE đọc một trường có trong file mà KHÔNG có trong bundle, phép chiếu vừa
 * nuốt nó. Đây là ca không cổng nào khác bắt được: `undefined` không ném.
 */
const lot = (o) => Array.isArray(o)
  ? o.map(lot)
  : (o && typeof o === "object"
      ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, lot(v)]))
      : o)
const doKhoa = (o, ra = new Set()) => {
  if (Array.isArray(o)) o.forEach((x) => doKhoa(x, ra))
  else if (o && typeof o === "object") {
    for (const [k, v] of Object.entries(o)) { ra.add(k); doKhoa(v, ra) }
  }
  return ra
}
for (const [tep, bien] of [
  ["khung-than-bai.json", "define_KHUNG_default"],
  ["media-mime.json", "define_MEDIA_default"],
]) {
  const goc = lot(JSON.parse(readFileSync(join(WEB, "..", "core", "assets", tep), "utf8")))
  const { khoa } = khoaTrong(bien)
  const co = new Set(khoa)
  const roi = [...doKhoa(goc)]
    .filter((k) => !k.startsWith("$") && doc(k) && !co.has(k))
  ok(roi.length === 0,
    `  ${tep} — mọi trường FE đọc còn trong bundle`,
    `rơi mất: ${roi.join(" · ")} — FE đọc thì nhận \`undefined\`, và không cổng nào đỏ`)
}

chot("bảng khai nhúng: không byte chết, không trường rơi")
