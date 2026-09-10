#!/usr/bin/env node
/**
 * WO-082 · T03-136 — Trần hiển thị cho mọi lưới.
 *
 * Chủ dự án 2026-09-09: *"ko có cơ chế phân trang và limit size, nên khi dữ
 * liệu nhiều là bị tràn màn"*. Đo được: `/chung-cat/` vẽ cả 23 việc một lượt;
 * `/video/` trả `#grid2` với **30** thẻ `.cd`.
 *
 * ── Vì sao CHẠY, không grep ────────────────────────────────────────────────
 * `nhung: null` (WO-076) đã dạy đúng bài này: mọi cổng ĐỌC NGUỒN đều xanh
 * trong khi trang thật trả 500. Nên cổng này **trích `capNhin` ra khỏi chunk
 * đã build** rồi chạy nó trên một DOM tối giản. Bó tay ở chỗ nào
 * thì FAIL ở đó — không có nhánh nào lặng lẽ bỏ qua.
 *
 * ── Vì sao vế 5 (âm) nặng ngang vế 2 ───────────────────────────────────────
 * Trần và bộ lọc là hai phép ẩn chồng lên nhau. Một cài đặt đếm CẢ thẻ đã bị
 * lọc sẽ "đúng" ở màn Tổng hợp và ẩn nhầm ở màn `/video/`: lọc còn 5 video,
 * trần vẫn cắt ở thẻ thứ 12 của TẬP GỐC ⇒ màn trống trơn dù có 5 bản ghi.
 * Đó là mất dữ liệu trên màn, và không vế dương nào bắt được.
 *
 * ── Vì sao vế 8 ────────────────────────────────────────────────────────────
 * Cùng lý lẽ WO-015/BUG-2: một tổng kết đổi theo cái đang hiện thì không phải
 * tổng kết. Nhãn phải nói "23 bản", nút mới nói "còn 11".
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-082 · trần hiển thị cho mọi lưới\n")

/*
 * Đọc CHUNK ĐÃ BUILD, không đọc `.inline.ts` và không đọc `site/gn.js`.
 *
 * `.ts` thì chú thích còn nguyên ⇒ một câu văn xuôi nhắc tên hàm cũng làm vế
 * xanh. `site/gn.js` thì do `assets.mjs` ghép lúc server KHỞI ĐỘNG ⇒ cổng đo
 * bản của lần chạy trước, và đó đúng là cái bẫy `memory/` đã ghi hai lần.
 * Bản `.inline.js` là thứ `npm run build` vừa sinh: mã thật, tươi.
 */
const BUNDLE = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.js")
  + "\n" + doc("../plugins/chungcat/src/chungcat.inline.js")

/** Trích nguyên một `function <ten>(…){…}` khỏi bundle bằng phép đếm ngoặc. */
function tach(src, ten) {
  const i = src.indexOf("function " + ten + "(")
  if (i < 0) return null
  const j = src.indexOf("{", i)
  let sau = 0
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
  }
  return null
}

// ── DOM tối giản: đủ cho phép đo, không hơn ────────────────────────────────
class El {
  constructor(cls = "") {
    this.cls = new Set(String(cls).split(/\s+/).filter(Boolean))
    this.dataset = {}
    this.con = []
    this.cha = null
    this.textContent = ""
    this.nghe = {}
    this.classList = {
      add: (c) => this.cls.add(c),
      remove: (c) => this.cls.delete(c),
      contains: (c) => this.cls.has(c),
      toggle: (c, d) => (d === undefined
        ? (this.cls.has(c) ? this.cls.delete(c) : this.cls.add(c))
        : d ? this.cls.add(c) : this.cls.delete(c)),
    }
  }
  set className(v) { this.cls = new Set(String(v).split(/\s+/).filter(Boolean)) }
  get className() { return [...this.cls].join(" ") }
  them(e) { e.cha = this; this.con.push(e); return e }
  querySelectorAll(sel) {
    const co = sel.replace(/:not\([^)]*\)/g, "").split(".").filter(Boolean)
    const khong = [...sel.matchAll(/:not\(\.([\w-]+)\)/g)].map((m) => m[1])
    const ra = []
    const di = (n) => {
      for (const c of n.con) {
        if (co.every((k) => c.cls.has(k)) && khong.every((k) => !c.cls.has(k))) ra.push(c)
        di(c)
      }
    }
    di(this)
    return ra
  }
  get nextElementSibling() {
    if (!this.cha) return null
    return this.cha.con[this.cha.con.indexOf(this) + 1] ?? null
  }
  after(e) {
    e.cha = this.cha
    this.cha.con.splice(this.cha.con.indexOf(this) + 1, 0, e)
  }
  remove() {
    if (!this.cha) return
    this.cha.con.splice(this.cha.con.indexOf(this), 1)
    this.cha = null
  }
  addEventListener(t, f) { (this.nghe[t] ??= []).push(f) }
  bam() {
    for (const f of this.nghe.click ?? []) f({})
    if (this.onclick) this.onclick({})
  }
}

const src = tach(BUNDLE, "capNhin")
ok(!!src, "1 · `capNhin` có mặt trong chunk đã build",
  "chưa có ⇒ mọi lưới vẫn vẽ toàn bộ; đây là vế làm cổng ĐỎ trước khi sửa")

/*
 * Trần lấy TỪ MÃ, không gõ lại trong cổng — gõ lại là cổng đo con số của
 * chính nó. Nhưng một trần tự do cũng vô nghĩa: đặt 500 thì hàm vẫn "chạy
 * đúng" mà màn vẫn tràn, nên vế 1b canh khoảng người còn đọc được một màn.
 */
const TRAN = Number((BUNDLE.match(/TRAN_NHIN\s*=\s*(\d+)/) ?? [])[1])
ok(TRAN >= 6 && TRAN <= 24, `1b · \`TRAN_NHIN\` = ${TRAN} nằm trong 6..24`,
  "quá nhỏ thì bấm mãi; quá lớn thì vẫn tràn — trần phải vừa một màn")

let capNhin = null
if (src) {
  try {
    capNhin = new Function("document", "TRAN_NHIN", src + "; return capNhin")(
      { createElement: () => new El() }, TRAN)
  } catch (e) {
    ok(false, "1a · nạp được `capNhin` ra khỏi bundle", String(e).slice(0, 120))
  }
}

/** Một lưới `n` thẻ `.cd`, nằm trong một bao để có chỗ chèn nút. */
const dung = (n, soOff = 0) => {
  const bao = new El("wrap")
  const luoi = bao.them(new El("grid"))
  for (let i = 0; i < n; i++) luoi.them(new El(i < soOff ? "cd off" : "cd"))
  return { bao, luoi }
}
const hien = (luoi) => luoi.querySelectorAll(".cd")
  .filter((e) => !e.cls.has("off") && !e.cls.has("qua")).length
const nut = (luoi) => {
  const s = luoi.nextElementSibling
  return s && s.cls.has("xem-them") ? s : null
}

if (capNhin && TRAN) {
  console.log("\n2 · 30 thẻ ⇒ chỉ 12 nhìn thấy\n")
  const { luoi } = dung(30)
  capNhin(luoi, true)
  ok(hien(luoi) === TRAN, `2 · đúng ${TRAN} thẻ nhìn thấy (được ${hien(luoi)})`,
    "không cắt ⇒ 30 thẻ đổ một lượt, đúng thứ chủ dự án chụp")
  ok(luoi.querySelectorAll(".cd.qua").length === 30 - TRAN,
    `2a · ${30 - TRAN} thẻ dư mang class \`qua\` (được ${luoi.querySelectorAll(".cd.qua").length})`)

  console.log("\n3 · Có lối xem tiếp — người không bị mất dữ liệu\n")
  const n1 = nut(luoi)
  ok(!!n1, "3 · nút `.xem-them` nằm NGAY SAU lưới",
    "ẩn 18 thẻ mà không có lối mở là giấu dữ liệu, không phải phân trang")
  ok(!!n1 && n1.textContent.includes(String(30 - TRAN)),
    `3a · nút nói còn bao nhiêu (được ${JSON.stringify(n1 ? n1.textContent : "")})`)

  console.log("\n4 · Bấm thì nới, hết thì nút biến mất\n")
  if (n1) n1.bam()
  const sau1 = Math.min(TRAN * 2, 30)
  ok(hien(luoi) === sau1, `4 · bấm một lần ⇒ ${sau1} (được ${hien(luoi)})`)
  let vong = 0
  while (nut(luoi) && vong++ < 6) nut(luoi).bam()
  ok(hien(luoi) === 30, `4a · bấm tiếp ⇒ đủ 30 (được ${hien(luoi)}, ${vong} nhịp)`,
    "trần cũ đọc lại từ biến đóng (closure) ⇒ lần hai không nhích — bẫy thật")
  ok(nut(luoi) === null, "4b · hết thẻ dư thì nút tự rút",
    "một nút `xem thêm 0` là rác trên màn")

  console.log("\n5 · ÂM · Trần đếm trên tập ĐÃ LỌC, không trên tập gốc\n")
  const { luoi: l2 } = dung(30, 25)     // lọc còn 5 thẻ
  capNhin(l2, true)
  ok(hien(l2) === 5, `5 · lọc còn 5 ⇒ hiện đủ 5 (được ${hien(l2)})`,
    "đếm trên tập GỐC ⇒ 5 video ấy nằm sau thẻ thứ 12 của tập chung và màn "
    + "`/video/` trống trơn — mất dữ liệu trên màn, không vế dương nào bắt")
  ok(nut(l2) === null, "5a · và không mọc nút `xem thêm` vô nghĩa")

  console.log("\n6 · Đổi bộ lọc ⇒ trần tính LẠI, không giữ tập cũ\n")
  const { luoi: l3 } = dung(30)
  capNhin(l3, true)
  const n3 = nut(l3)
  if (n3) n3.bam()                                 // nới lên 24
  for (const e of l3.querySelectorAll(".cd").slice(0, 25)) e.classList.add("off")
  capNhin(l3, true)                                // lọc lại
  ok((Number(l3.dataset.cap) || TRAN) === TRAN,
    `6 · lọc lại thì trần về ${TRAN} (được ${l3.dataset.cap ?? "(mặc định)"})`,
    "giữ trần cũ nghĩa là bộ lọc kế tiếp mở sẵn 24 ô — trần thành vô dụng sau "
    + "lần bấm đầu")
}

// ── 7 · Nối dây THẬT: ai gọi capNhin ───────────────────────────────────────
console.log("\n7 · Nối dây — hàm không ai gọi là hàm chết\n")

const than = tach(BUNDLE, "apLoc") ?? ""
ok(than.includes("capNhin"), "7 · `apLoc` gọi `capNhin`",
  "bộ lọc chạy mà trần không chạy theo ⇒ lọc xong lại tràn màn")
ok(/querySelectorAll\([^)]*\.grid/.test(than),
  "7a · và quét MỌI `.grid`, không riêng `grid2`",
  "ba màn loại dùng lưới riêng; bỏ sót là bỏ sót đúng chỗ dữ liệu nhiều nhất")

ok(/\bcapNhin\b/.test(tach(BUNDLE, "_cau") ?? ""),
  "7b · `capNhin` xuất qua cầu `_cau()`",
  "chunk `chungcat` là IIFE riêng — không qua cầu thì nó ném ReferenceError "
  + "ngay lần vẽ đầu (đúng lớp lỗi `chunk-tu-chua` canh)")

const cc = tach(BUNDLE, "ccNap") ?? ""
ok(cc.includes("capNhin"), "7c · danh sách việc `#g-cc` cũng được áp trần",
  "23 việc là chính con số chủ dự án chụp — bỏ sót nó là bỏ sót cái repro")

// ── 8 · Trần KHÔNG được làm tụt số đếm ─────────────────────────────────────
console.log("\n8 · Nhãn đếm vẫn nói về tập sau LỌC, không phải phần đang hiện\n")

ok(/\.cd:not\(\.off\)/.test(than) && !/:not\(\.qua\)[^)]*\.length/.test(than),
  "8 · phép đếm của `apLoc` bỏ `.off`, KHÔNG bỏ `.qua`",
  "đếm cả `.qua` ra ngoài ⇒ nhãn tụt xuống 12 và người tưởng kho chỉ có 12 bản")

// ── 9 · CSS: `qua` phải THẬT SỰ ẩn ─────────────────────────────────────────
console.log("\n9 · `.qua` có luật CSS ẩn\n")

const css = doc("../styles/prototype.css")
/*
 * Bất biến là *"`.cd.qua` giải ra `display:none`"*, không phải *"chuỗi
 * `.cd.qua{display:none}` có mặt"*. `WO-086` gộp nó vào một danh sách selector
 * (`.cd.qua,.cc-bai.qua{…}`) để lấy lại byte, và vế cũ đỏ dù luật y nguyên.
 * Mẫu dưới đây nhận cả hai dạng, và vẫn đỏ khi luật BỊ XOÁ.
 */
ok(/\.cd\.qua[^{}]*\{[^}]*display:\s*none/.test(css.replace(/\s+/g, " ")),
  "9 · `.cd.qua` giải ra `display:none` trong `prototype.css`",
  "gắn class mà không có luật ⇒ 30 thẻ vẫn hiện, cổng hành vi xanh, màn vẫn tràn")
ok(/\.xem-them\s*[,{]/.test(css), "9a · `.xem-them` có luật của nó")

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — trần theo tập đã lọc, có lối xem tiếp, nhãn không tụt\n")
