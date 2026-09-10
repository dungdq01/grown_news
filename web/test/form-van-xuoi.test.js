#!/usr/bin/env node
/**
 * WO-037 → WO-038 · FORM VIẾT BÀI CHỈ NHẬN VĂN XUÔI.
 *
 * Người dùng, hai lượt:
 *   1. *"user chỉ nhập text, tuyệt đối ko nhập dấu markdown như `###` hay `##`,
 *      `***`… form của ta định nghĩa sẵn."*
 *   2. *"Tinh túy: chỉ cần 1 header duy nhất là tinh túy, sau đó tất cả là text
 *      văn bản gõ vào, giống các ô khác. Các fields như 'chuyển giao', 'tin
 *      cậy'… bỏ hết."*
 *
 * WO-037 đạt yêu cầu 1 bằng cách cho MÁY gõ dấu hộ (ô con → `#### 3.4.k` +
 * `- **…**`). WO-038 đạt nó bằng cách **bỏ hẳn cấu trúc**: mục 3.4 là một
 * textarea như bảy ô kia. Cổng này canh hợp đồng thứ hai.
 *
 * CHẠY HÀM, KHÔNG ĐỌC MÃ: form do `dungKhung()` dựng lúc chạy, không nằm trong
 * `shell.html`. Đọc mã chỉ cho biết chuỗi nào có mặt; nó không cho biết ô nào
 * thật sự hiện ra. (Bài học §6 của `moc-fe-con-that`.)
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { taoKiem } from "./_api.mjs"

const { ok, chot } = taoKiem()
const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const JS = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.js"), "utf8")
const KHUNG = JSON.parse(readFileSync(
  join(WEB, "..", "core", "assets", "khung-than-bai.json"), "utf8"))

/** Cắt một hàm theo ĐỘ SÂU NGOẶC — không neo regex (bài học WO-027). */
function than(ten) {
  let i = JS.indexOf(`async function ${ten}`)
  if (i < 0) i = JS.indexOf(`function ${ten}`)
  if (i < 0) return ""
  const b = JS.indexOf("{", i)
  let sau = 0
  for (let k = b; k < JS.length; k++) {
    if (JS[k] === "{") sau++
    else if (JS[k] === "}") { sau--; if (!sau) return JS.slice(i, k + 1) }
  }
  return ""
}

/** Nút giả có `value` — đủ để `raiKhung` ghi vào và `gomKhung` đọc ra. */
function taoThe() {
  const t = {
    innerHTML: "", className: "", value: "", dataset: {}, children: [], o: {},
    appendChild: (c) => { t.children.push(c); return c },
    addEventListener: () => {}, focus: () => {},
    querySelector: (q) => (t.o[q] ??= taoThe()),
    querySelectorAll: () => [],
  }
  return t
}

console.log("\n0 · TỰ KIỂM vật liệu — bảng khai không còn cấu trúc con\n")

/*
 * Bảng khai là NGUỒN của cả ba tầng (Python · test Node · bundle FE). Nếu nó
 * còn khai `tinh_tuy` thì đơn vị M01 chưa xong, và mọi phép dưới đo một hệ nửa
 * vời — xanh hay đỏ đều không nói lên điều gì.
 */
ok(!("tinh_tuy" in KHUNG), "bảng khai không còn khối `tinh_tuy`",
  `còn: ${JSON.stringify(KHUNG.tinh_tuy)}`)
const LA = KHUNG.muc.flatMap((m) => (m.con?.length ? m.con : [{ ...m, so: String(m.so) }]))
const mucTT = LA.filter((c) => c.ten === "Tinh túy")
ok(mucTT.length === 1, `bảng khai có đúng 1 mục lá tên \`Tinh túy\` (${mucTT.length})`,
  "0 thì mọi phép dưới mất đối tượng; >1 thì cổng này đo thiếu")
ok(mucTT[0]?.nang === true && mucTT[0]?.locator === true,
  "và nó VẪN là mục nặng, VẪN cần locator",
  "bỏ cấu trúc con không phải hạ cấp mục, cũng không phải bỏ luật địa chỉ")

console.log("\n1 · Mỗi mục lá MỘT ô, và không ô nào gợi ý cú pháp markdown\n")

/*
 * Dựng form THẬT trong hộp cát. Hộp cát THIẾU là cách xanh mù rẻ nhất: bản đầu
 * của cổng này thiếu `define_KHUNG_default` (tên esbuild nội `__KHUNG__` thành)
 * nên `dungKhung()` ném, form ra 0 byte, và mọi phép "không có markdown" đúng
 * VÔ ĐIỀU KIỆN — ba dòng `ok` màu xanh trên không khí.
 */
const moc = taoThe()
const O = {
  define_KHUNG_default: KHUNG,
  __KHUNG__: KHUNG,
  G: (id) => (id === "f-o-muc" ? moc : null),
  esc: (x) => String(x).replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c])),
  // KHÔNG stub bừa mọi tên: hộp cát ném cho tên lạ là thứ bắt được biến mất
  // khai báo (bài học WO-031).
  nghe: () => {}, soiThanBai: () => {}, dat: () => {}, bao: () => {},
  document: { querySelector: () => null, querySelectorAll: () => [] },
  JSON, String, Number, Array, Object, Math, Boolean, RegExp, console,
}
const boc = (o) => new Proxy(o, {
  has: () => true,
  get: (t, k) => {
    if (k === Symbol.unscopables) return undefined
    if (k in t) return t[k]
    throw new ReferenceError(`${String(k)} is not defined`)
  },
})

/*
 * Cắt từ `const KHUNG =` tới hết `chiaKhuc` — KHÔNG tới hết `dungKhung`.
 *
 * `gomKhung` gọi `layMuc`, và `layMuc` là một `const` khai SAU `raiKhung`. Cắt
 * ngắn thì `gomKhung` ném `layMuc is not defined` ở §3, và một hộp cát ném là
 * một cổng không đo gì.
 */
const iK = JS.indexOf("const KHUNG =")
const tCK = than("chiaKhuc")
const khoi = iK >= 0 && tCK ? JS.slice(iK, JS.indexOf(tCK) + tCK.length) : ""
ok(khoi.length > 0, "cắt được khối dựng form + ráp/rải từ bundle đã build")

let html = ""
let noiDau = null
try {
  new Function("__s", `with (__s) { ${khoi}; dungKhung() }`)(boc(O))
  html = moc.innerHTML
} catch (e) { noiDau = String(e?.message ?? e) }
ok(noiDau === null, "  `dungKhung()` chạy được trong hộp cát", String(noiDau))

// Gom mọi gợi ý mà người dùng NHÌN THẤY.
const goiY = [...html.matchAll(/placeholder="([^"]*)"/g)].map((m) => m[1])
/*
 * CHỐT VẬT LIỆU — và nó DỪNG HẲN, không chỉ báo. Ba phép markdown ở dưới đúng
 * VÔ ĐIỀU KIỆN khi form rỗng.
 *
 * WO-038 · ngưỡng về đúng `LA.length`, hết phép trừ. WO-037 phải trừ mục tinh
 * túy ra vì nó không góp `placeholder` nào; nay nó là ô bình thường, nên giữ
 * phép trừ là tự nới ngưỡng đi một ô.
 */
ok(goiY.length === LA.length,
  `  form có ${goiY.length} ô mang gợi ý (mong đúng ${LA.length} mục lá)`,
  "lệch ⇒ form chưa dựng xong, và mọi phép dưới đúng vô điều kiện")
if (goiY.length !== LA.length) {
  console.log("\n  DỪNG: vật liệu không đủ để kết luận điều gì.\n")
  process.exit(1)
}

const MD = [
  [/#{2,}\s/, "heading `##`/`###`/`####`"],
  [/\*\*/, "in đậm `**`"],
  [/^\s*-\s+\*\*/m, "bullet `- **`"],
]
for (const [re, ten] of MD) {
  const dinh = goiY.filter((g) => re.test(g.replace(/&quot;/g, '"')))
  ok(dinh.length === 0, `  không gợi ý nào chứa ${ten}`,
    `${dinh.length} ô: ${dinh.map((g) => JSON.stringify(g.slice(0, 46))).join(" · ")}`
    + " — người dùng phải gõ cú pháp, đúng thứ họ bảo bỏ")
}

console.log("\n2 · Không đâu trong form sinh ra cấp thứ TƯ\n")

/*
 * Đo trên KHỐI ĐÃ CẮT, không trên cả bundle: cửa sổ đọc render `####` của bài
 * cũ là việc hợp lệ và không liên quan. Đo cả bundle là đỏ oan.
 */
ok(!/[`"']#### /.test(khoi), "khối form không sinh tiêu đề `####`",
  "còn sinh ⇒ vẫn ép người viết theo cấu trúc con đã bỏ")
ok(!/- \*\*\$\{/.test(khoi), "khối form không sinh dòng bullet đậm")
ok(!/tinh_tuy|TT_B|gomTinhTuy|raiTinhTuy|themTinhTuy/.test(khoi),
  "không còn nhánh riêng nào cho tinh túy",
  "mục 3.4 phải đi CÙNG ĐƯỜNG với bảy ô kia")

console.log("\n3 · Vòng khép: markdown → ô → markdown\n")

/*
 * ĐO BẰNG CÁCH CHẠY. Đây là phép đắt nhất của cổng: `raiKhung()` rải một thân
 * bài vào ô, `gomKhung()` ráp lại, và hai bên phải bằng nhau.
 *
 * Không khép thì mở một bài cũ ra sửa rồi lưu là GHI ĐÈ bằng bản thiếu — hỏng
 * im lặng, chỉ lộ khi ai đó mở lại bài và thấy mất một mục.
 */
const chuMau = (so) => `Văn xuôi của mục ${so}, có địa chỉ [§${so}].`
const than0 = KHUNG.muc.map((m) => {
  const con = m.con ?? []
  if (!con.length) return `## ${m.so}. ${m.ten}\n\n${chuMau(m.so)}`
  return [`## ${m.so}. ${m.ten}`,
    ...con.map((c) => `### ${c.so} ${c.ten}\n\n${chuMau(c.so)}`)].join("\n\n")
}).join("\n\n") + "\n"

const oMuc = {}
const OO = {
  ...O,
  MD_VAO: than0,
  document: {
    querySelector: (q) => {
      const m = /\[data-muc="([^"]+)"\]/.exec(q)
      return m ? (oMuc[m[1]] ??= taoThe()) : null
    },
    querySelectorAll: () => [],
  },
}
let rai = null
let lai = ""
let loi3 = null
try {
  const r = new Function("__s", `with (__s) { ${khoi};
    const _r = raiKhung(MD_VAO); return [_r, gomKhung()] }`)(boc(OO))
  rai = r[0]
  lai = String(r[1])
} catch (e) { loi3 = String(e?.message ?? e) }
ok(loi3 === null, "  `raiKhung()` + `gomKhung()` chạy được", String(loi3))
ok(rai === true, "  `raiKhung()` nhận thân bài 8 mục", `trả về ${rai}`)
ok(Object.keys(oMuc).length === LA.length,
  `  rải vào đúng ${Object.keys(oMuc).length}/${LA.length} ô`,
  "thiếu ô nào là mất đúng mục đó khi lưu")
ok(lai.trim() === than0.trim(), "  ráp lại BẰNG thân bài ban đầu",
  `lệch:\n--- vào ---\n${than0.trim().slice(0, 260)}\n--- ra ---\n${lai.trim().slice(0, 260)}`)
// Mục tinh túy là chỗ dễ rơi nhất — gọi tên nó ra, đừng để nó lẫn trong phép trên.
ok(oMuc[mucTT[0]?.so]?.value === chuMau(mucTT[0]?.so),
  `  ô ${mucTT[0]?.so} (Tinh túy) nhận đúng văn của nó`,
  `nhận: ${JSON.stringify(oMuc[mucTT[0]?.so]?.value)}`)

console.log("\n4 · Không còn chế độ soạn THÔ\n")

ok(!/data-soan/.test(JS), "không còn nút chuyển chế độ `[data-soan]`",
  "người dùng chốt bỏ hẳn chế độ thô")
ok(!/f-tho-o/.test(JS), "không còn khối `#f-tho-o`")

/*
 * VẾ NẶNG NHẤT. `#f-than` KHÔNG chỉ là ô soạn thô — nó là ĐÍCH LẮP RÁP:
 * `gomKhung()` ghi markdown đã ráp vào đó, rồi form mới gửi giá trị ấy đi.
 * Xoá thẻ mà quên đổi hàm sang TRẢ VỀ chuỗi là mất đường gửi thân bài — hỏng
 * im lặng, và chỉ lộ khi một bài vào kho với thân rỗng.
 */
const tGom = than("gomKhung")
ok(/return\s/.test(tGom) && !/G\("f-than"\)/.test(tGom),
  "`gomKhung` TRẢ VỀ chuỗi, không ghi vào `#f-than`",
  "còn ghi vào một thẻ đã bị xoá ⇒ thân bài rỗng mà không ai báo")

console.log("\n5 · Chốt an toàn — không mở form cho bài không khớp khung\n")

/*
 * Chế độ thô từng là LƯỚI AN TOÀN. Bỏ lưới mà không thay gì ⇒ sửa một bài cũ
 * là mất thân bài, âm thầm. Lưới mới nằm ở `dienForm()`, KHÔNG ở `suaTuCua` —
 * bản đầu của cổng này đo nhầm hàm và xanh mù.
 */
const tDien = than("dienForm")
const tDo = than("doThan")
ok(tDien.length > 0, "tìm được `dienForm` — nơi thân bài được nạp vào form")
// Phép kiểm đi QUA `doThan` — theo nó tới nơi, và đòi `doThan` thật sự gọi
// `raiKhung`. Chỉ đòi tên `doThan` có mặt là đo một cái tên, không đo gì.
ok(/raiKhung/.test(tDien) || (/doThan\s*\(/.test(tDien) && /raiKhung/.test(tDo)),
  "  `dienForm` VẪN kiểm thân bài có khớp khung không",
  "bỏ phép kiểm ⇒ mở form rồi lưu là ghi đè thân bài bằng rỗng, âm thầm")
ok(!/doiSoan/.test(tDien),
  "  và không còn chuyển sang chế độ thô (chế độ đó đã bỏ)")
ok(/(bao|kqTV|canh)\s*\(/.test(tDien) || /doThan\s*\(/.test(tDien),
  "  không khớp thì BÁO ra, không im lặng",
  "im lặng ở đây nghĩa là người dùng mất bài mà không biết vì sao")
ok(!/doThan\s*\(/.test(tDien) || /bao\s*\(/.test(tDo),
  "  và đường báo đó THẬT SỰ gọi `bao()`",
  "`doThan` nuốt lỗi ⇒ cả ba chỗ gọi cùng im lặng một lượt")

chot("form văn xuôi · tinh túy là một ô · vòng khép · không chế độ thô · có chốt an toàn")
