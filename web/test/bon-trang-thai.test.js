#!/usr/bin/env node
/**
 * BỐN trạng thái phải được đối xử ĐỦ BỐN — ở nút, ở màn, ở đếm, ở màu.
 *
 * VÌ SAO CÓ FILE NÀY: `review_status` có 4 giá trị (M02 §2.2) nhưng code liệt kê
 * tay ba giá trị ở nhiều chỗ, và mỗi lần bỏ sót `edited` là một lỗi khác nhau —
 * đã xảy ra BA lần, mỗi lần một chỗ:
 *
 *   1 chỉ mục cửa sổ gom `[...appr, ...draft, ...rej]` ⇒ bài edited không có
 *     `data-open` ⇒ bấm thẻ không mở được gì. (đã sửa, `open-card.test.js` canh)
 *   2 màn Chờ duyệt lọc `=== "draft"` ⇒ bài edited KHÔNG hiện, dù API cho phép
 *     `edited → approved` và cửa sổ đọc CÓ vẽ nút Duyệt. Đường cụt: API cho,
 *     nút có, không màn nào dẫn tới.
 *   3 `st-edited` không có luật CSS nào ⇒ nó trông y hệt `approved`, dù đã rời
 *     khỏi site và đang chờ duyệt lại.
 *
 * Đo được lúc phát hiện: kho 2 draft + 1 edited, ô KPI "chờ duyệt" hiện **2**,
 * "tổng bản ghi" hiện **3** — bài edited không nằm trong BẤT KỲ ô nào trong 4 ô.
 * Và nó đến đó bằng một đường bình thường: sửa một bài approved.
 *
 * Nên test này không kiểm "có sửa đúng chỗ đó chưa" mà kiểm TÍNH CHẤT: mọi nơi
 * nói về "chờ duyệt" phải bao gồm mọi trạng thái mà API cho phép duyệt.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

console.log("\nBốn trạng thái — nút · màn · đếm · màu\n")

// ── 1 · Nguồn chân lý: đọc BANG_CHUYEN, không gõ lại ────────────────────────
console.log("1 · Trạng thái nào duyệt được — đọc từ BANG_CHUYEN\n")

const mjs = readFileSync(join(WEB, "api", "status.mjs"), "utf8")
const khoiBang = /const BANG_CHUYEN = \{([\s\S]*?)\n\}/.exec(mjs)
ok(!!khoiBang, "đọc được BANG_CHUYEN từ status.mjs",
   "không đọc được thì test này chỉ là lời khai thứ hai")

// Trạng thái nào có `approved` trong danh sách đích ⇒ duyệt được từ đó.
// Và TẤT CẢ khoá của bảng = tập trạng thái có vòng đời — dùng lại ở §2b, không
// mở nguồn thứ hai trong cùng một file.
const duyetDuoc = new Set()
const TRANG_THAI = []
for (const d of (khoiBang?.[1] ?? "").split("\n")) {
  const m = /^\s*(\w+)\s*:\s*\[([^\]]*)\]/.exec(d)
  if (!m) continue
  TRANG_THAI.push(m[1])
  if (/["']approved["']/.test(m[2])) duyetDuoc.add(m[1])
}
ok(duyetDuoc.size >= 2,
   `duyệt được từ: ${[...duyetDuoc].join(", ")}`,
   "phải có cả `draft` và `edited` theo M02 §2.2")
ok(duyetDuoc.has("draft") && duyetDuoc.has("edited"),
   "cả `draft` và `edited` đều duyệt được")

// ── 2 · Cửa sổ đọc: nút Duyệt hiện cho ĐÚNG những trạng thái đó ─────────────
console.log("\n2 · Cửa sổ đọc — nút Duyệt khớp bảng, không nút chết\n")

const fe = readFileSync(join(WEB, "plugins", "multiwindow", "src", "scripts",
  "multiwindow.inline.ts"), "utf8")
/*
 * FR-033 · nút "Duyệt" thành "Đưa lên site" (`data-act="dang"`), và điều kiện
 * hiện nó gom vào MỘT biến `chuaLen` thay vì một chuỗi `||` dài.
 *
 * Ý ĐỊNH KHÔNG ĐỔI: tập trạng thái mà FE vẽ nút phải KHỚP tập mà `BANG_CHUYEN`
 * cho đi tới `approved`. Lệch một chiều là nút chết (bấm rồi API từ chối), lệch
 * chiều kia là đường cụt (API cho mà không nút nào).
 *
 * Đọc từ định nghĩa `chuaLen` trong FE chứ không từ chuỗi điều kiện: gom vào
 * một biến là việc đúng, và một phép kiểm bám hình dạng cũ sẽ cấm mọi lần dọn.
 */
const dnChuaLen = /const chuaLen = ([^\n]+)/.exec(fe)
const trongFE = new Set(
  [...(dnChuaLen?.[1] ?? "").matchAll(/st === "(\w+)"/g)].map((m) => m[1]))
ok(/data-act="dang"/.test(fe), "FE có nút `dang` (Đưa lên site)")
ok(trongFE.size === duyetDuoc.size && [...duyetDuoc].every((s) => trongFE.has(s)),
   `FE vẽ nút Đưa-lên-site cho đúng ${[...trongFE].join(", ")}`,
   `BANG_CHUYEN cho ${[...duyetDuoc].join(", ")} — lệch nghĩa là nút chết ` +
   "(hiện mà API từ chối) hoặc đường cụt (API cho mà không nút)")

// ── 2b · Trạng thái KHÔNG duyệt được phải NÓI vì sao, không im lặng ────────
console.log("\n2b · Chân cửa sổ không bao giờ trống trơn\n")

// BUG THẬT (người dùng báo: "chưa thấy work cho các trạng thái duyệt"):
// kho có 2 rejected + 1 approved, tức KHÔNG bài nào duyệt được. Nút Duyệt
// đơn giản không được vẽ — đúng luật, nhưng người dùng thấy một chân cửa sổ
// thiếu nút và kết luận chức năng hỏng.
//
// Và tệ hơn: `/mock/` là trang DUY NHẤT có bài draft, mà ở đó `API_CO` bị tắt
// CÓ CHỦ Ý ⇒ trước đây `o.innerHTML = ""` xoá sạch. Người dùng mở đúng bài
// trông-như-duyệt-được, thấy trống trơn, không một chữ giải thích.
//
// Luật: mỗi nhánh KHÔNG-vẽ-nút phải kèm một câu nói lý do.
const khoiBt = fe.slice(fe.indexOf("function veBienTap("), fe.indexOf("async function docChiTiet("))
ok(khoiBt.length > 0, "tìm được khối veBienTap")
ok(!/if \(!API_CO\) \{ o\.innerHTML = ""/.test(khoiBt),
   "nhánh không-API KHÔNG xoá trắng chân cửa sổ",
   "xoá trắng là triệu chứng y hệt 'nút hỏng' — người dùng không phân biệt được")
ok(/goc\(\) === "\/"/.test(khoiBt),
   "nhánh không-API phân biệt HAI lý do (API chưa chạy · đang ở bản mẫu)",
   "gộp một câu là đoán hộ người dùng đang gặp cái nào")
ok(/npm run api/.test(khoiBt), "ở bản THẬT: nói cách bật API")
ok(/kb\//.test(khoiBt), "ở bản MẪU: nói API chỉ đọc kho thật")

// ĐỔI THƯỚC ĐO, GIỮ Ý ĐỊNH — và siết chặt hơn (FR-031).
//
// Bản trước đòi mỗi trạng thái cụt có một CÂU GIẢI THÍCH (`<em class="hint">`).
// Câu đó ra đời vì `rejected` là NGÕ CỤT: không nút Duyệt, không nút nào khác,
// chân cửa sổ trống trơn. Nó là cách bù cho một chỗ THIẾU NÚT.
//
// FR-026 vế B/B2 đã mở cả hai đường ra, nên giờ chỗ đó CÓ nút. Đòi lại câu chữ
// là đòi giữ miếng vá sau khi vết thương đã lành — và một câu giải thích trên
// màn là thứ người dùng gọi thẳng là "rác web".
//
// Thước mới KHÓ hơn: mỗi trạng thái phải có LỐI RA THẬT — một `data-act` bấm
// được. Câu chữ hứa; nút thì làm.
// FR-033 · ba lối ra, không còn bốn. `bo-duyet` (approved → hàng chờ) và
// `hoi-sinh` (rejected → hàng chờ) đã bỏ cùng hàng chờ; `dang` thay cả hai
// vai "đưa bài lên site".
const LOI_RA = {
  // trạng thái     : nút BẮT BUỘC phải có, và vì sao nó là lối ra
  draft: ["dang", "loai"],
  edited: ["dang", "loai"],
  // rejected giờ lên site được THẲNG (FR-033 mở `rejected → approved`).
  // Không có nút này thì nó là ngõ cụt y như trước FR-026.
  rejected: ["dang"],
  // approved chỉ còn MỘT lối ra: Loại — một PHÁN QUYẾT có lý do, không phải
  // một chỗ đứng chờ.
  approved: ["loai"],
}
/*
 * TÍNH tập nút từ ĐIỀU KIỆN, không đo khoảng cách chuỗi.
 *
 * Bản trước hỏi "tên trạng thái có xuất hiện gần nút không". Nó chỉ đúng khi
 * mỗi nút nằm trong một nhánh `st === "..."` riêng. FR-033 gộp điều kiện lại
 * (`chuaLen` cho `dang`, `st !== "rejected"` cho `loai`) và phép kiểm đỏ oan,
 * dù FE vẽ đúng.
 *
 * Đọc HAI điều kiện đó từ FE rồi tính ra tập nút của từng trạng thái.
 */
const mLoai = /\(st !== "(\w+)"[\s\S]{0,120}?data-act="loai"/.exec(khoiBt)
ok(!!mLoai, "đọc được điều kiện của nút `loai`")
const khongLoai = mLoai?.[1]
for (const st of TRANG_THAI) {
  const can = LOI_RA[st]
  ok(Array.isArray(can) && can.length > 0,
     `\`${st}\` có khai lối ra trong phép kiểm`,
     "trạng thái mới trong enum ⇒ khai lối ra của nó ở đây")
  const thuc = [
    ...(trongFE.has(st) ? ["dang"] : []),
    ...(st !== khongLoai ? ["loai"] : []),
  ]
  ok(thuc.length > 0, `\`${st}\` KHÔNG là ngõ cụt (${thuc.join(", ") || "không nút nào"})`,
     "không nút nào dẫn ra khỏi trạng thái này ⇒ người dùng kết luận chức năng hỏng")
  ok(JSON.stringify(thuc.slice().sort()) === JSON.stringify((can ?? []).slice().sort()),
     `\`${st}\` có đúng lối ra đã khai: ${thuc.join(", ")}`,
     `phép kiểm khai [${(can ?? []).join(", ")}], FE vẽ [${thuc.join(", ")}]`)
}
// Và chân cửa sổ không bao giờ chỉ có chữ: `sua` + `xoa` luôn có mặt.
for (const act of ["sua", "xoa"]) {
  ok(new RegExp(`data-act="${act}"`).test(khoiBt), `\`${act}\` có ở mọi trạng thái`)
}

// ── 3 · Nút nào có hệ quả thì phải NÓI hệ quả ──────────────────────────────
console.log("\n3 · Mọi nút hành động có `title` nói hệ quả\n")

// Bug thật: `✎ Sửa` là nút có hệ quả NẶNG NHẤT trên bài approved (đổi nội dung
// ⇒ tụt edited ⇒ rời khỏi site) mà lại là nút DUY NHẤT không có `title`.
for (const act of ["dang", "loai", "sua", "xoa"]) {
  const re = new RegExp(`data-act="${act}"[^>]{0,400}?title=`, "s")
  ok(re.test(fe), `nút \`${act}\` có \`title\``,
     "ba nút kia đều nói hệ quả; nút im lặng là nút người dùng bấm mà không biết trước")
}
// FR-033 · câu về `edited + rời site` ĐÃ BỎ: sửa bài không còn hạ trạng thái,
// nên một `title` nói thế là lời khai SAI về hệ thống. Điều còn phải đúng: nút
// Sửa vẫn nói bài Ở LẠI trên site — người dùng cần biết trước khi bấm.
ok(fe.includes("bài Ở LẠI trên site sau khi lưu"),
   "`title` của nút Sửa nói rõ: bài Ở LẠI trên site sau khi lưu",
   "nhãn `Sửa` ngụ ý một việc nhỏ — nói hệ quả ra là việc của title")

// ── 4 · Màn Chờ duyệt: gồm MỌI trạng thái duyệt được ───────────────────────
console.log("\n4 · Màn Chờ duyệt + ô đếm — không bỏ sót trạng thái nào\n")

// FR-034/C5 · nguồn sống của render là web/render/ (port từ emitter) — soi ở
// đó: trang.mjs mang template, data.mjs mang TRANG_THAI đọc từ schema.
const emit = readFileSync(join(WEB, "render", "trang.mjs"), "utf8")
  + readFileSync(join(WEB, "render", "data.mjs"), "utf8")
// Không quét tên biến (dễ đổi) mà quét: có định nghĩa nào gom cả hai trạng thái?
const coGomCaHai = /review_status === "draft" \|\| b\.review_status === "edited"/.test(emit)
  || /\["draft",\s*"edited"\]\.includes/.test(emit)
ok(coGomCaHai, "emitter có một tập `chờ duyệt` gồm cả draft và edited")

// Ba mốc phải dùng tập đó, KHÔNG dùng `draft` một mình.
// FR-033 · hai mốc đầu (`queue`, `qcount`) đã bỏ cùng mục Chờ duyệt, và nhãn
// đổi từ "chờ duyệt" (một THỦ TỤC) sang "chưa lên site" (một TRẠNG THÁI).
//
// Điều được canh KHÔNG đổi, và nó là cả lý do file này tồn tại: chỗ nào đếm
// cũng phải dùng tập gồm CẢ HAI trạng thái, không riêng `draft` — nếu không
// bài `edited` biến mất khỏi mọi con số trên màn.
for (const [ten, re] of [
  ["KPI `chưa lên site`", /oKpi\("chưa lên site", (\w+)\.length/],
  ["KPI nhỏ trang chủ", /oNho\("chưa lên site", (\w+)\.length/],
]) {
  const m = re.exec(emit)
  ok(m && m[1] !== "draft",
     `${ten} dùng \`${m?.[1] ?? "(không thấy)"}\` (không phải riêng \`draft\`)`,
     `đang dùng \`${m?.[1] ?? "?"}\` — riêng \`draft\` thì bài edited chờ duyệt ` +
     "mà không màn nào, không ô nào có nó")
}

/**
 * ── 4b · Biểu đồ TRẠNG THÁI phải có ĐỦ BỐN cột (FR-027k) ─────────────────
 *
 * Danh sách bốn mốc ở trên là danh sách **liệt kê tay** — và nó bỏ sót đúng cái
 * nó tồn tại để bắt. Mốc `bars4` ("Trạng thái duyệt") gõ tay
 * `[approved, draft, rejected]`, tức **thiếu `edited`**, và không phép kiểm nào
 * ở đây thấy vì `bars4` không có trong bốn dòng trên.
 *
 * Đo được: `review_status` có BỐN giá trị trong enum, biểu đồ vẽ BA cột. Một bài
 * đã duyệt rồi bị sửa không xuất hiện ở đâu trong biểu đồ trạng thái.
 *
 * Đây là lần thứ TƯ cùng lớp lỗi (xem đầu file này: ba lần trước ở chỉ mục cửa
 * sổ, màn Chờ duyệt, luật CSS). Nên lần này sửa GỐC: emitter đọc enum TỪ SCHEMA
 * thay vì liệt kê tay. Phép kiểm dưới canh chính điều đó — hỏi "có liệt kê tay
 * không", không phải "có đủ bốn không". Đếm bốn thì lần thứ năm vẫn lọt.
 */
console.log("\n4b · Biểu đồ trạng thái — đọc enum, không liệt kê tay\n")

ok(/const TRANG_THAI/.test(emit), "emitter có `TRANG_THAI` đọc từ schema",
   "liệt kê tay là cách bốn lỗi trước đã xảy ra")
const iTT = emit.indexOf("const TRANG_THAI")
ok(/properties\?\.review_status\?\.enum/.test(emit.slice(iTT, iTT + 700)),
   "`TRANG_THAI` lấy từ `properties.review_status.enum` của schema",
   "nguồn chân lý của TẬP trạng thái là schema, không phải một mảng trong code")
const iB4 = emit.indexOf('chen(shell, "bars4"')
ok(iB4 > 0 && /TRANG_THAI/.test(emit.slice(iB4, iB4 + 220)),
   "`bars4` vẽ theo `TRANG_THAI`, không theo mảng gõ tay",
   "gõ tay thì thêm một trạng thái thứ năm là biểu đồ lặng lẽ thiếu nó")

// Và trên TRANG RENDER THẬT: đủ bốn nhãn. Phép kiểm nguồn ở trên có thể xanh
// mà dữ liệu vẫn hụt (vd `demTrang` lọc sai) — nên đo cả đầu ra.
// FR-034/C5 · bản real render từ KHO TẠM qua DB, không đọc output build nữa.
{
  const h = await trangHtml("kho", { mock: false })
  const s = h.slice(h.indexOf('id="bars4"'))
  // FR-041 · bars4 đổi từ bar ngang sang VÒNG ĐỜI (node `.lc-n`, nhãn trong
  // `data-st`). Điều phép kiểm này canh KHÔNG đổi: đủ bốn trạng thái trên
  // trang render thật — chỉ chỗ đọc nhãn đổi theo hình.
  const nhan = [...s.slice(0, 1800).matchAll(/data-st="([a-z]+)"/g)].map((x) => x[1])
  const thieu = ["draft", "approved", "edited", "rejected"].filter((x) => !nhan.includes(x))
  ok(thieu.length === 0, `biểu đồ trạng thái đủ bốn cột: ${nhan.join(" · ")}`,
     `thiếu: ${thieu.join(", ")}`)
}

// ── 5 · Bốn trạng thái, bốn dấu hiệu thị giác ─────────────────────────────
console.log("\n5 · CSS — bốn trạng thái đều có dấu hiệu riêng\n")

const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
const sach = css.replace(/\/\*[\s\S]*?\*\//g, "")   // bỏ comment trước khi quét
for (const st of ["draft", "edited", "rejected"]) {
  ok(new RegExp(`\\.(cd\\.)?st-${st}\\b[^{]*\\{`).test(sach),
     `\`st-${st}\` có luật CSS`,
     "không có luật nào thì trạng thái đó trông y hệt approved")
}
// `edited` KHÔNG được làm mờ: nó cần hành động, mờ là ngược nghĩa (và opacity
// trên chữ là thứ hợp đồng tương phản phải canh).
const luatEdited = /\.cd\.st-edited\s*\{([^}]*)\}/.exec(sach)
ok(luatEdited && !/opacity/.test(luatEdited[1]),
   "`st-edited` KHÔNG dùng opacity (cần hành động, không phải đã bỏ)",
   `luật hiện tại: ${luatEdited?.[1]?.trim() ?? "(không có)"}`)

// ── 6 · Trên trang ĐÃ BUILD: bài edited có mặt ở màn Chờ duyệt ─────────────
console.log("\n6 · Trang đã build — kiểm trên output thật\n")

// FR-027g · danh sach cho duyet gio la MUC `#cho-duyet` trong man Kho.
// Luat khong doi: bai `draft`/`edited` o man Tat ca deu phai co mat o day.
{
  const html = await trangHtml("kho", { mock: false })
  const all = await trangHtml("tat-ca", { mock: false })
  // Slug nào ở màn Tất cả mang st-draft hoặc st-edited thì PHẢI có ở Chờ duyệt.
  const canCo = [...all.matchAll(/class="cd st-(draft|edited)"[^>]*data-slug="([^"]+)"/g)]
    .map((m) => m[2])
  const thieu = canCo.filter((s) => !html.includes(`data-slug="${s}"`))
  ok(thieu.length === 0,
     `${canCo.length} bài draft/edited đều có ở màn Chờ duyệt`,
     `thiếu: ${thieu.join(", ")}`)

  // Ô đếm phải khớp số hàng thật.
  //
  // Đếm `.qr` (một hàng = một `<div class="qr">`), KHÔNG đếm `data-slug`: mỗi
  // hàng mang HAI data-slug (thẻ `<a>` mở bài + nút "đọc & duyệt"), nên đếm
  // thuộc tính cho số gấp đôi. Đây là lỗi của phép đếm, không của trang.
  const soHang = (html.match(/<div class="qr">/g) ?? []).length
  const dem = /id="qcount"[^>]*>(\d+)/.exec(html)
  ok(!dem || Number(dem[1]) === soHang,
     `ô qcount (${dem?.[1] ?? "—"}) khớp số hàng (${soHang})`,
     "con số nói ít hơn việc thật thì người duyệt tưởng đã xong")
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · bốn trạng thái được đối xử đủ bốn ở mọi tầng\n")
