#!/usr/bin/env node
/**
 * WO-085 · T03-138 — `/chung-cat/` nhóm theo BÀI GỐC, và có trục thời gian.
 *
 * Chủ dự án 2026-09-10: *"/chung-cat/ đang không phân loại theo bài. Ý tôi là
 * tôi cần biết bài chưng cất, transcript đó thuộc bài gốc nào? và có filter
 * theo thời gian nữa"*.
 *
 * Ảnh chụp: năm thẻ đầu đều là `video/mo-mang-tam-mat-sau-khi-xem-chi-lauren`
 * nhưng nằm rải; slug hiển thị bị cắt cụt, và nó là khoá KỸ THUẬT — tiêu đề
 * thật không xuất hiện ở đâu trên màn ấy.
 *
 * ── Vì sao CHẠY, không grep ────────────────────────────────────────────────
 * `grep "ccNhom"` xanh cả khi phép gộp trả về sai nhóm. Cổng này trích `ccNhom`
 * ra khỏi CHUNK ĐÃ BUILD rồi chạy trên dữ liệu thật-hình-dạng. Không đọc `.ts`
 * (ở đó chú thích còn nguyên nên một câu văn xuôi cũng làm vế xanh).
 *
 * ── Vì sao vế 3 nặng ngang vế 2 ────────────────────────────────────────────
 * Gộp theo `slug` rồi tra tiêu đề là một phép ĐỌC BẢNG KHÁC. Tra trượt là ca
 * THƯỜNG, không phải ca hiếm: bản ghi bị xoá, bị đổi slug, hay chỉ mục chưa
 * nạp xong. Nếu tra trượt làm khối biến mất thì người mất luôn đường tới một
 * việc đang chạy — tệ hơn hẳn cái bug đang sửa.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")

console.log("\nWO-085 · /chung-cat/ nhóm theo bài gốc + trục thời gian\n")

const CC = doc("../plugins/chungcat/src/chungcat.inline.js")
const MW = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.js")

/** Trích nguyên một `function <ten>(…){…}` khỏi bundle bằng phép đếm ngoặc. */
// Trích một khai báo TỰ CHỨA để `new Function` nạp chạy được. Phải đọc CẢ HAI
// dạng: `function ten(…) {…}` và `const ten = …;` — `WO-097` đổi vài phép sang
// dạng mũi tên để lấy lại byte, và một `tach` chỉ biết `function` sẽ trả `null`
// rồi báo "phép lọc không nằm ở cầu" trong khi nó nằm đó. Thước phải dịch theo
// code, không được nới vế.
function tach(src, ten) {
  const dau = new RegExp(
    `(?:^|\\n)[\\t ]*((?:async )?(?:function ${ten}\\(|const ${ten} = ))`)
  const m = dau.exec(src)
  if (!m) return null
  const i = m.index + m[0].indexOf(m[1])   // bỏ xuống-dòng + thụt lề
  if (m[1].includes("function")) {
    const j = src.indexOf("{", i)
    let sau = 0
    for (let k = j; k < src.length; k++) {
      if (src[k] === "{") sau++
      else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
    }
    return null
  }
  // Dạng mũi tên: chạy tới dấu `;` ở độ sâu 0 — hết một câu lệnh.
  let sau = 0
  for (let k = i; k < src.length; k++) {
    const c = src[k]
    if ("({[".includes(c)) sau++
    else if (")}]".includes(c)) sau--
    else if (c === ";" && sau === 0) return src.slice(i, k + 1)
  }
  return null
}

// ── 1 · Phép gộp tồn tại và nạp được ─────────────────────────────────────
console.log("1 · Phép gộp có mặt trong chunk đã build\n")

const src = tach(CC, "ccNhom")
ok(!!src, "1 · `ccNhom` có trong `chungcat.inline.js`",
  "chưa có ⇒ 25 việc vẫn nằm rải và người tự đọc slug từng thẻ")

let ccNhom = null
if (src) {
  try {
    ccNhom = new Function(src + "; return ccNhom")()
  } catch (e) {
    ok(false, "1a · nạp được `ccNhom`", String(e).slice(0, 120))
  }
}

const LAUREN = "video/mo-mang-tam-mat-sau-khi-xem-chi-lauren-xai-ai"
const DN = "video/doanh-nghiep-mot-nguoi-tai-viet-nam-dang-van-hanh-nhu-the-na"
const TEN = {
  [LAUREN]: "Mở mang tầm mắt sau khi xem chị Lauren xài AI.",
  [DN]: "Doanh nghiệp một người tại Việt Nam đang vận hành như thế nào?",
}
const tenBai = (s) => TEN[s] ?? ""

/** Đúng hình dạng `/api/job` trả về — `payload.slug` + `tao_luc` ở cấp trên. */
const viec = (slug, loai, tao) => ({
  ulid: `${loai}-${tao}`, payload: { loai, slug }, giai_doan: "xong",
  tao_luc: tao,
})

// Đúng cảnh trong ảnh: 1 thumbnail + 3 transcript của Lauren, 1 chưng cất của DN.
const DS = [
  viec(LAUREN, "sinh-thumbnail", "2026-09-09T07:34:45.736+00:00"),
  viec(LAUREN, "sinh-transcript", "2026-09-09T07:33:27.174+00:00"),
  viec(LAUREN, "sinh-transcript", "2026-09-09T06:10:00.000+00:00"),
  viec(LAUREN, "sinh-transcript", "2026-09-08T22:00:00.000+00:00"),
  viec(DN, "chung-cat-mot-nguon", "2026-09-10T02:00:00.000+00:00"),
]

// ── 2 · Gộp theo bài, ĐẦU KHỐI là tiêu đề thật ───────────────────────────
console.log("\n2 · Gộp theo bài gốc, đầu khối là TIÊU ĐỀ\n")

let nhom = []
if (ccNhom) nhom = ccNhom(DS, tenBai) ?? []

ok(nhom.length === 2, `2 · 5 việc / 2 bài ⇒ 2 khối (được ${nhom.length})`,
  "không gộp ⇒ đúng cảnh chủ dự án chụp: bốn thẻ Lauren nằm rải")

const kLauren = nhom.find((g) => g.slug === LAUREN)
ok(!!kLauren && (kLauren.viec ?? []).length === 4,
  `2a · khối Lauren ôm đủ 4 việc (được ${(kLauren?.viec ?? []).length})`,
  "sót một việc là giấu một việc")
ok(kLauren?.ten === TEN[LAUREN],
  `2b · đầu khối là TIÊU ĐỀ thật, không phải slug`,
  `được ${JSON.stringify(kLauren?.ten)} — slug là khoá kỹ thuật, và trên màn `
  + "nó còn bị cắt cụt giữa chừng")

// ── 3 · ÂM · Tra trượt tiêu đề ⇒ LÙI về slug, khối VẪN CÒN ───────────────
console.log("\n3 · ÂM · Tra trượt tiêu đề thì lùi về slug, không nuốt khối\n")

let nhom3 = []
if (ccNhom) nhom3 = ccNhom(DS, () => "") ?? []
ok(nhom3.length === 2,
  `3 · không tra được tiêu đề nào ⇒ VẪN 2 khối (được ${nhom3.length})`,
  "bản ghi bị xoá / đổi slug / chỉ mục chưa nạp là ca THƯỜNG; nuốt khối ở đây "
  + "là cắt đường tới một việc đang chạy — tệ hơn cái bug đang sửa")
// `[].every(…)` là `true` — một vế "mọi khối đều có tên" sẽ XANH trên mảng
// RỖNG, tức xanh đúng lúc phép gộp hỏng nhất. Đòi có khối trước đã.
ok(nhom3.length > 0 && nhom3.every((g) => String(g.ten ?? "").trim() !== ""),
  "3a · và đầu khối không rỗng — lùi về slug",
  `được ${JSON.stringify(nhom3.map((g) => g.ten))}`)

// ── 4 · Chỉ mục đi QUA CẦU, không tải bản thứ hai ────────────────────────
console.log("\n4 · Một chỉ mục, một lần tải\n")

const ccMa = CC.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
ok(!/fetch\([^)]*open-index/.test(ccMa),
  "4 · chunk `chungcat` KHÔNG tự `fetch` `open-index.json`",
  "`multiwindow` đã nạp và cache vào `BAI`; tải bản thứ hai là hai bản sẽ lệch")
ok(/__GN_MW__/.test(ccMa) && /tenBai|tieuDe/.test(ccMa),
  "4a · nó lấy tiêu đề qua cầu `__GN_MW__`",
  "chunk là IIFE riêng — gọi trần thì ReferenceError ngay lần vẽ đầu")
ok(/\btenBai\b|\btieuDe\b/.test(tach(MW, "_cau") ?? ""),
  "4b · và cầu `_cau()` có xuất phép tra ấy",
  "thiếu thì bên kia gọi vào `undefined`")

/*
 * Vế 5 CŨ (sắp mới/cũ + chip lọc khoảng) BỎ cùng `WO-086`: chủ dự án bác đúng
 * hàng nút ấy, và mốc ngày thay nó. Vế 11 bên dưới là phép đo THAY THẾ, canh
 * chiều ngược lại — ba hàng nút không được quay lại.
 */
// ── 6 · Nhóm xếp theo việc MỚI NHẤT, không theo tên bài ──────────────────
console.log("\n6 · Bài vừa chạy xong phải lên đầu\n")

ok(nhom[0]?.slug === DN,
  `6 · khối có việc mới nhất đứng trước (được ${String(nhom[0]?.slug).slice(0, 34)})`,
  "sắp theo slug thì `doanh-nghiep…` và `mo-mang…` xếp theo bảng chữ cái, và "
  + "một bài vừa chạy xong có thể nằm cuối màn")

// ── 7 · Tổng kết KHÔNG được tính lại trên tập đã lọc ─────────────────────
console.log("\n7 · Tổng kết nói về CẢ hàng đợi\n")
{
  const f = tach(CC, "ccNap") ?? ""
  // `CC_DS` là mảng GỐC; `CC_HIEN` là tập sau lọc. Con số tổng phải đọc mảng
  // gốc — đúng điều `WO-015/BUG-2` đã trả giá một lần.
  ok(/CC_DS/.test(f) && /j\.tong|tong/.test(f),
    "7 · số tổng đọc từ mảng GỐC / `tong` của cửa, không từ tập đã lọc",
    "một tổng kết đổi theo bộ lọc thì không phải tổng kết: hai ảnh chụp cùng "
    + "một hàng đợi cho hai bộ số")
}

/*
 * Vế 8 CŨ (`.cc-nhom` có luật CSS) BỎ cùng `WO-086`: khối `<h3>` chen giữa
 * lưới không còn tồn tại. Vế 14 đo bốn class của bố cục MỚI.
 */

/* ════════════════════════════════════════════════════════════════════════
 * WO-086 · SCR-26 — vẽ lại: dòng bài + đường ống, nhóm theo mốc ngày.
 *
 * `WO-085` (cùng ngày) trả lời đúng câu hỏi nhưng bằng một `<h3>` chen vào
 * lưới phẳng — vách ngăn, không phải bố cục — và thêm hàng nút THỨ BA vào một
 * màn đã có hai hàng. Chủ dự án từ chối: *"tôi ko chấp nhận kiểu list menu
 * design cổ hủ như thế"*. Đúng.
 *
 * Vế 1-8 ở trên GIỮ NGUYÊN: phép gộp và phép tra tiêu đề là nền của bản mới,
 * chỉ cách VẼ bị thay.
 * ════════════════════════════════════════════════════════════════════════ */

console.log("\n9 · Một bài MỘT DÒNG, chặng mang trạng thái bằng màu\n")

const ccMa2 = CC.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

ok(/cc-bai/.test(ccMa2), "9 · có dòng bài `.cc-bai`",
  "vẫn vẽ mỗi việc một thẻ rời thì `WO-086` chưa xảy ra")
ok(/cc-ong/.test(ccMa2), "9a · và dải chặng `.cc-ong` trên dòng ấy")

{
  // Bốn trạng thái phải là BỐN class khác nhau — một class dùng chung nghĩa là
  // màu không nói gì, và cả điểm của hướng A là trạng thái đọc được bằng mắt.
  const co = ["cc-chang", "xong", "chay", "hong", "trong"]
    .filter((k) => new RegExp(`["' ]${k}\\b`).test(ccMa2))
  ok(co.length === 5, `9b · đủ class chặng + bốn trạng thái (được ${co.join(",")})`,
    "thiếu một trạng thái là một ca người không phân biệt được")
  const f = tach(CC, "ccChangLop") ?? tach(CC, "ccThe") ?? ""
  ok(/giai_doan/.test(f),
    "9c · trạng thái chặng đọc từ `giai_doan` của CHÍNH việc ấy",
    "gán cứng thì mọi chặng cùng màu và dải ống thành trang trí")
}

console.log("\n10 · Mốc ngày làm tiêu đề nhóm\n")

const theoNgay = tach(CC, "ccTheoNgay")
ok(!!theoNgay, "10 · có phép `ccTheoNgay`",
  "không có mốc ngày thì hướng C chưa xảy ra, và chip thời gian không bỏ được")

if (theoNgay) {
  let fn = null
  try { fn = new Function(theoNgay + "; return ccTheoNgay")() } catch (e) {
    ok(false, "10a · nạp được `ccTheoNgay`", String(e).slice(0, 110))
  }
  if (fn) {
    // Neo BÂY GIỜ vào một mốc cố định — cổng đọc `Date.now()` là cổng đổi kết
    // quả theo giờ chạy, và nó sẽ đỏ lúc nửa đêm mà không ai hiểu vì sao.
    const NAY = Date.parse("2026-09-10T09:00:00+00:00")
    const g = (slug, moi) => ({ slug, ten: slug, viec: [], moi })
    const ra = fn([
      g("a", "2026-09-10T02:00:00.000+00:00"),
      g("b", "2026-09-09T07:34:00.000+00:00"),
      g("c", "2026-09-08T19:02:00.000+00:00"),
    ], NAY) ?? []
    ok(ra.length === 3, `10a · ba bài ba ngày ⇒ ba mốc (được ${ra.length})`)
    ok(/hôm nay/i.test(String(ra[0]?.nhan ?? "")),
      `10b · mốc của hôm nay ghi "Hôm nay" (được ${JSON.stringify(ra[0]?.nhan)})`,
      "một mốc `09-10` bắt người tự tính hôm nay là ngày mấy")
    ok(/hôm qua/i.test(String(ra[1]?.nhan ?? "")),
      `10b2 · và mốc liền trước ghi "Hôm qua" (được ${JSON.stringify(ra[1]?.nhan)})`)
    ok(/09-08|08/.test(String(ra[2]?.nhan ?? "")),
      `10b3 · mốc xa hơn ghi ngày tháng (được ${JSON.stringify(ra[2]?.nhan)})`)
  }
}

console.log("\n11 · BA hàng nút đã biến mất\n")
{
  const con = ["data-cclc", "data-ccsap", "data-cckhoang"]
    .filter((k) => ccMa2.includes(k))
  ok(con.length === 0,
    `11 · không còn hàng nút nào (còn: ${con.join(", ") || "—"})`,
    "mỗi hàng nút là một chiều chưa vào bố cục — đó là chính lời chủ dự án bác")
}

console.log("\n12 · Trần WO-082 vẫn chạy trên ĐƠN VỊ MỚI\n")
{
  // Bẫy đã đo trước: `capNhin` neo cứng `.cd`. Đơn vị bị cắt nay là DÒNG BÀI,
  // nên nếu không cho nó nhận selector thì trần im lặng ngừng chạy — và không
  // cổng nào báo. Đúng lớp `cong-xanh-vi-neo-sai`.
  const f = tach(MW, "capNhin") ?? ""
  ok(f !== "" && !/querySelectorAll\("\.cd"\)/.test(f),
    "12 · `capNhin` KHÔNG còn neo cứng `.cd`",
    "neo cứng ⇒ 40 dòng bài đổ một lượt và trần WO-082 thành trang trí")
  ok(/cc-bai/.test(ccMa2) && /capNhin\?\.\([^)]*cc-bai|capNhin[^)]*"\.cc-bai"/.test(ccMa2),
    "12a · và chunk `chungcat` truyền `.cc-bai` vào",
    "truyền thiếu ⇒ nó cắt theo mặc định `.cd`, tức cắt CHẶNG chứ không cắt BÀI")
}

console.log("\n13 · Ba số tổng kết bấm được để lọc\n")
ok(/data-cckpi/.test(ccMa2),
  "13 · ba số tổng kết mang móc bấm `data-cckpi`",
  "bỏ năm nút trạng thái mà không trả lại đường lọc nào là lấy mất một khả "
  + "năng — `SCR-26 §2.1` chọn cách trả nó về chính chỗ đã hiển thị con số")

/*
 * WO-088 · CSS của màn NAY TIÊM TỪ CHUNK (`ccCss`), không ở `prototype.css`.
 * `gn.css` chỉ còn dư 5 byte mà khối này 2096 — nên nó đi cùng màn của nó,
 * đúng lối `TX_CSS`. Phép đo dời theo, KHÔNG nới: vẫn đòi luật có thật.
 *
 * Không dùng `tach` ở đây: nó đếm ngoặc, mà thân hàm là một chuỗi CSS đầy
 * `{}` nên bộ đếm cân bằng nhầm và trả về một mẩu cụt. Cắt theo MỐC DÒNG.
 */
const CSS_CC = (() => {
  const i = CC.indexOf("function ccCss(")
  if (i < 0) return ""
  const j = CC.indexOf("\n}", i)
  return j < 0 ? CC.slice(i) : CC.slice(i, j)
})()

console.log("\n14 · CSS của bố cục mới có thật\n")
{
  const css = CSS_CC
  for (const k of ["cc-bai", "cc-ong", "cc-chang", "cc-ngay"]) {
    ok(new RegExp(`\\.${k}\\s*[,{>:]`).test(css), `14 · \`.${k}\` có luật CSS`,
      "gắn class không luật thì bố cục chỉ tồn tại trong wireframe")
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * WO-088 · SCR-26 §5 — đường ống chỉ việc của NGƯỜI, chỉ BẢN CUỐI, có màu.
 * ════════════════════════════════════════════════════════════════════════ */

console.log("\n15 · Đường ống chỉ việc của NGƯỜI\n")

const NGUOI = ["sinh-transcript", "chung-cat-mot-nguon"]
const MAY = ["sinh-thumbnail", "tai-video"]

/*
 * `ccViecNguoi`/`ccVatHong` bên `chungcat` là VỎ một dòng đi qua cầu — không
 * trích bằng `tach` (nó tìm `function`), mà đo bằng nguồn: có mặt, và đi qua
 * `__GN_MW__`. Bản THẬT nằm ở cầu và được chạy ở vế 15a bên dưới.
 */
const locNguoi = (CC.match(/const ccViecNguoi = [^;]+;/) ?? [""])[0]
ok(!!locNguoi, "15 · có vỏ `ccViecNguoi`",
  "không tách hai lớp thì `sinh-thumbnail` (7 việc máy tự xếp) vẫn đứng ngang "
  + "hàng với việc chủ dự án đặt — đúng thứ bị bác")

let fN = null
/*
 * Kéo theo cả HẰNG danh sách từ bundle, không gõ lại trong cổng: gõ lại là
 * cổng đo con số của chính nó, và nó sẽ xanh cả khi mã đọc một danh sách khác.
 */
/*
 * WO-092 · Hằng và phép lọc DỜI LÊN CẦU (`multiwindow`), vì chunk `cctab` cũng
 * cần. Nên chạy bản THẬT ở đó; `ccViecNguoi` bên `chungcat` chỉ còn là vỏ.
 */
const locThat = tach(MW, "viecNguoi")
ok(!!locThat, "15-0 · phép lọc `viecNguoi` nằm ở cầu (`multiwindow`)")
if (locThat) {
  // Hàm TỰ CHỨA danh sách nên trích ra chạy được ngay, không phải kéo theo
  // một `const` ở tầng module.
  try { fN = new Function(locThat + "; return viecNguoi")() }
  catch (e) { ok(false, "15-1 · nạp được `viecNguoi`", String(e).slice(0, 100)) }
}
ok(/globalThis\.__GN_MW__/.test(locNguoi ?? ""),
  "15-2 · `ccViecNguoi` bên `chungcat` chỉ là VỎ, đi qua cầu",
  "giữ bản chép ở đây là dựng lại đúng cái lệch WO-092 vừa sửa")
if (fN) {
  ok(NGUOI.every((l) => fN({ payload: { loai: l } }) === true),
    "15a · hai loại của NGƯỜI đi lên ống")
  ok(MAY.every((l) => fN({ payload: { loai: l } }) === false),
    "15a2 · hai loại của MÁY KHÔNG lên ống",
    "`tho-cua.mjs:203` tự xếp chúng; người không đặt nên chúng không phải "
    + "trạng thái của người")
  /*
   * Loại LẠ mặc định là của MÁY (fail-closed). Cùng bài học `WO-087`: một
   * danh sách LOẠI TRỪ thì ca thứ ba lại lọt. Ống là hợp đồng với người dùng,
   * nên chỉ thứ được kể tên mới được lên.
   */
  ok(fN({ payload: { loai: "don-kho-dinh-ky" } }) === false,
    "15a3 · loại LẠ mặc định KHÔNG lên ống",
    "thêm một việc nền mới không được tự chen vào trạng thái của người")
}

{
  const f = (CC.match(/const ccVatHong = [^;]+;/) ?? [""])[0]
  ok(f !== "" && /__GN_MW__/.test(f),
    "15b · có vỏ `ccVatHong`, và nó cũng đi qua cầu",
    "lọc trơn thì một `sinh-thumbnail` hỏng biến mất không dấu vết — giấu lỗi "
    + "còn tệ hơn bày rác")
}

console.log("\n16 · Mỗi chặng chỉ giữ lần chạy MỚI NHẤT\n")

const banCuoi = tach(CC, "ccBanCuoi")
ok(!!banCuoi, "16 · có phép `ccBanCuoi`",
  "đo được: 25 việc / 15 cặp (bài,chặng); `ecomerce-skill-claude` một mình có "
  + "BỐN lần chạy transcript đang đứng thành bốn thẻ")

let fC = null
if (banCuoi) {
  try { fC = new Function(banCuoi + "; return ccBanCuoi")() }
  catch (e) { ok(false, "16 · nạp được `ccBanCuoi`", String(e).slice(0, 100)) }
}

if (fC) {
  const S = "video/ecomerce-skill-claude"
  const v = (loai, tao, gd) => ({ ulid: loai + tao, giai_doan: gd,
    payload: { loai, slug: S }, tao_luc: tao })

  const bon = [
    v("sinh-transcript", "2026-09-08T19:02:00.000+00:00", "xong"),
    v("sinh-transcript", "2026-09-08T18:00:00.000+00:00", "dung"),
    v("sinh-transcript", "2026-09-08T17:00:00.000+00:00", "xong"),
    v("sinh-transcript", "2026-09-08T16:00:00.000+00:00", "dung"),
  ]
  const r1 = fC(bon) ?? []
  ok(r1.length === 1, `16a · 4 lần chạy ⇒ 1 chặng (được ${r1.length})`,
    "bốn thẻ cho một chặng là chính cái làm hàng việc thành cái sổ")
  ok(r1[0]?.tao_luc === "2026-09-08T19:02:00.000+00:00",
    "16a2 · và giữ đúng lần MỚI NHẤT")

  /*
   * BẪY, và là vế nặng nhất ở đây: một `xong` CŨ cạnh một `đang chạy` MỚI.
   * Chọn theo TRẠNG THÁI thì màn báo "xong" trong lúc máy đang chạy — sai
   * theo cách người tin ngay và không nghi ngờ.
   */
  const bay = [
    v("chung-cat-mot-nguon", "2026-09-09T08:00:00.000+00:00", "xong"),
    v("chung-cat-mot-nguon", "2026-09-10T02:00:00.000+00:00", "dang-goi-model"),
  ]
  const r2 = fC(bay) ?? []
  ok(r2.length === 1 && r2[0]?.giai_doan === "dang-goi-model",
    `16b · \`đang chạy\` MỚI thắng \`xong\` CŨ (được ${r2[0]?.giai_doan})`,
    "giữ theo `tao_luc`, không theo trạng thái")

  const hai = [
    v("sinh-transcript", "2026-09-09T07:00:00.000+00:00", "xong"),
    v("chung-cat-mot-nguon", "2026-09-09T08:00:00.000+00:00", "xong"),
  ]
  ok((fC(hai) ?? []).length === 2,
    "16c · hai CHẶNG khác nhau vẫn giữ cả hai",
    "gộp theo `slug` thôi là nuốt mất một chặng")
}

console.log("\n17 · Tổng kết vẫn đếm CẢ hàng đợi\n")
{
  const f = tach(CC, "ccKpi") ?? ""
  ok(/CC_DS/.test(f) && !/ccBanCuoi/.test(f),
    "17 · `ccKpi` đếm trên `CC_DS` GỐC, không trên tập đã gộp",
    "gộp xong mới đếm ⇒ `25 việc` tụt xuống ~10, và con số hết là tổng kết")
}

console.log("\n18 · Màu và nhịp\n")
{
  const css2 = CSS_CC
  const p = css2.replace(/\s+/g, " ")
  ok(/\.cc-song/.test(css2),
    "18 · có cột sống `.cc-song` mang màu loại nguồn")
  ok(/@keyframes/.test(css2) && /prefers-reduced-motion/.test(css2),
    "18a · có nhịp, và có chốt `prefers-reduced-motion`",
    "chuyển động là thông tin, không phải điều kiện để đọc được màn")
  ok(/\.cc-chang\.chay[^}]*animation/.test(p),
    "18b · CHỈ chặng `chay` mang chuyển động",
    "động khắp nơi thì không chỗ nào nổi bật — đó là trang trí, không phải "
    + "thông tin")
}


/* ════════════════════════════════════════════════════════════════════════
 * WO-089 · Bìa dòng bài mang ICON CỦA LOẠI NGUỒN.
 *
 * Ảnh 2026-09-10: ô bìa trống. `WO-086` đặt `data-i` bằng TIỀN TỐ SLUG
 * (`video`), nhưng bảng icon khai theo LOẠI NGUỒN (`youtube`, `pdf`, …) — nên
 * `::before` không có `mask-image` và ô rỗng.
 * ════════════════════════════════════════════════════════════════════════ */

console.log("\n19 · Icon theo loại nguồn\n")

/*
 * `nhanTuBan` sống ở CHUNK, không ở `gn.js`: chỉ màn này cần nó, và đo được
 * đặt vào bundle chung thì `gn.js` vượt trần 279 byte. Cầu chỉ đưa DỮ LIỆU.
 */
const nhanSrc = tach(CC, "nhanTuBan")
ok(!!nhanSrc, "19 · có phép THUẦN `nhanTuBan(ban, MEDIA)` ở cầu",
  "thuần thì cổng chạy được nó mà không cần DOM lẫn chỉ mục đã nạp")

let fNhan = null
if (nhanSrc) {
  try { fNhan = new Function(nhanSrc + "; return nhanTuBan")() }
  catch (e) { ok(false, "19-0 · nạp được `nhanTuBan`", String(e).slice(0, 100)) }
}

if (fNhan) {
  // Bảng GIẢ đúng hình dạng `media-mime.json` — cổng không phụ thuộc bảng thật
  // đổi, nhưng vẫn đo đúng phép tra.
  const M = {
    video_host: [
      { nhan: "youtube", mien: "youtube.com", id_tu: "[?&]v=([\\w-]{11})" },
      { nhan: "tiktok", mien: "tiktok.com", id_tu: "/video/(\\d{6,24})" },
      { nhan: "douyin", mien: "douyin.com", id_tu: "modal_id=(\\d{6,24})" },
    ],
    loai: [
      { mime: "application/pdf", duoi: ".pdf" },
      { mime: "text/markdown", duoi: ".md" },
    ],
  }
  const b = (o) => ({ source_type: "video", ...o })

  ok(fNhan(b({ url_normalized: "youtube.com/watch?v=dQw4w9WgXcQ" }), M) === "youtube",
    "19a · video youtube ⇒ `youtube`",
    "đây là chính ví dụ chủ dự án đưa ra")
  ok(fNhan(b({ url_normalized: "tiktok.com/@ai/video/7669845290265890069" }), M) === "tiktok",
    "19a2 · tiktok ⇒ `tiktok`")

  /*
   * Vế NẶNG: khớp HOST phải tách khỏi việc BÓC ID.
   *
   * `idVideo` trả `null` khi `id_tu` không khớp — dùng nó ở đây thì một URL
   * youtube lạ dạng (playlist, shorts chưa khai, có tham số lạ) mất icon dù
   * host đúng rành rành. Icon nói NGUỒN, không nói "bóc được id hay chưa".
   */
  ok(fNhan(b({ url_normalized: "youtube.com/playlist?list=PLabc" }), M) === "youtube",
    "19b · youtube mà `id_tu` KHÔNG khớp vẫn ra `youtube`",
    "cài bằng `idVideo` là để một url hợp lệ mất icon vì một regex về ID")

  ok(fNhan({ source_type: "tai-lieu", media: [{ mime: "application/pdf" }] }, M) === "pdf",
    "19c · tài liệu PDF ⇒ `pdf`")
  ok(fNhan({ source_type: "tai-lieu", media: [{ mime: "text/markdown" }] }, M) === "md",
    "19c2 · tài liệu Markdown ⇒ `md`",
    "mọi tài liệu cùng một icon thì icon không nói gì")

  // Lùi + không ném: một dòng bài lạ không được giết cả màn.
  ok(fNhan(b({ url_normalized: "vimeo.com/123" }), M) === "video",
    "19d · host lạ ⇒ lùi về `source_type`")
  let nem = null
  try { fNhan(undefined, M); fNhan({}, undefined) } catch (e) { nem = String(e).slice(0, 80) }
  ok(nem === null, "19d2 · `ban`/`MEDIA` thiếu ⇒ KHÔNG ném", nem ?? "")
}
{
  const cau = tach(MW, "_cau") ?? ""
  ok(/banTheoSlug/.test(cau) && /mediaBang/.test(cau),
    "19e · cầu `_cau()` đưa DỮ LIỆU sang (`banTheoSlug` + `mediaBang`)",
    "chunk là IIFE riêng — thiếu cầu thì nó không có chỉ mục lẫn bảng mime")
  ok(!/nhanTuBan/.test(MW),
    "19e2 · và phép SUY KHÔNG nằm trong `gn.js`",
    "chỉ một màn dùng nó; để ở bundle chung là bắt mọi trang tải — đo được "
    + "279 byte vượt trần đúng vì thế")
}
{
  const m = CC.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  ok(/nhanNguon/.test(m), "19f · dòng bài DÙNG `nhanNguon` cho `data-i`",
    "viết hàm mà không ai gọi là một hàm chết")
}


/* ════════════════════════════════════════════════════════════════════════
 * WO-092 · Cửa sổ dùng CÙNG phép lọc việc với màn `/chung-cat/`.
 *
 * `WO-088` bỏ việc của máy khỏi đường ống ở `ccNapNhap`, nhưng danh sách việc
 * trong CỬA SỔ là một bộ vẽ khác (`veViecCuaBan`, chunk `cctab`) và nó chỉ lọc
 * theo `slug`. Một luật, hai chỗ vẽ, sửa một — chính lớp lỗi `go_khung` đã ghi.
 *
 * Nên vế 20 KHÔNG đo "cctab đã lọc chưa". Nó đo **phép lọc chỉ có MỘT bản**:
 * nếu ai đó chép `["sinh-transcript", …]` sang chunk thứ hai thì vế đỏ, dù
 * hành vi hôm nay đúng. Đo hành vi thì lần lệch thứ ba lại lọt.
 * ════════════════════════════════════════════════════════════════════════ */

console.log("\n20 · MỘT phép lọc việc, hai chunk cùng đọc\n")

const CT = doc("../plugins/cctab/src/cctab.inline.js")

ok(/\bviecNguoi\b/.test(tach(MW, "_cau") ?? ""),
  "20 · cầu `_cau()` xuất phép lọc `viecNguoi`",
  "để ở một chunk rồi chunk kia chép lại là dựng bản thứ hai của một luật")

{
  const ctMa = CT.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  /*
   * Cấm MẢNG LỌC, không cấm bảng NHÃN. `cctab` có `NHAN_LOAI` khoá theo loại
   * việc — đó là chữ hiển thị, hợp lệ. Cái không được có là một danh sách
   * `["sinh-transcript", …]` dùng để LỌC.
   */
  /*
   * Cấm đúng CẶP tạo nên phép phân lớp người-vs-máy
   * (`sinh-transcript` + `chung-cat-mot-nguon` đứng cùng một danh sách).
   *
   * Không cấm mọi lần nhắc tên loại việc: `cctab` có `NHAN_LOAI` (chữ hiển
   * thị) và `LOAI_KHONG_NHAP` (loại việc không sinh nháp) — hai khái niệm
   * KHÁC, đều hợp lệ. Bản đầu của vế này bắt nhầm cả hai.
   */
  const cap = /\[[^\]]*sinh-transcript[^\]]*chung-cat-mot-nguon[^\]]*\]|\[[^\]]*chung-cat-mot-nguon[^\]]*sinh-transcript[^\]]*\]/
  ok(!cap.test(ctMa),
    "20a · chunk `cctab` KHÔNG chép danh sách phân lớp người-vs-máy",
    "chép là hai bản sẽ lệch — và lệch lần này đã xảy ra thật")

  const i = ctMa.indexOf("async function veViecCuaBan")
  const f = i > 0 ? ctMa.slice(i, i + 1200) : ""
  ok(f !== "", "20b-0 · tìm thấy `veViecCuaBan`")
  ok(/viecNguoi|vatHong/.test(f),
    "20b · nó lọc bằng phép CHUNG, không chỉ theo `slug`",
    "chỉ lọc `slug` thì `sinh-thumbnail` và `tai-video` lên thẳng danh sách — "
    + "đúng thứ chủ dự án chụp lại")
  ok(/vatHong/.test(f),
    "20c · và việc của máy HỎNG vẫn nổi",
    "lọc trơn là giấu một lỗi thật")
}


if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — dòng bài + đường ống, mốc ngày, 0 hàng nút, trần vẫn chạy\n")
