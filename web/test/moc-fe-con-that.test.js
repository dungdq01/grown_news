#!/usr/bin/env node
/**
 * MỌI MỐC `G("id")` FE VỚI TAY TỚI PHẢI CÓ THẬT.
 *
 * Người dùng báo: dán một URL youtube hợp lệ vào `/video/nap/` thì màn trả
 * *"Địa chỉ trong kho phải là chữ thường, số và dấu gạch nối."* — và không cách
 * nào qua được.
 *
 * Nguyên nhân: WO-021 gỡ ô *"Địa chỉ trong kho"* (`vd-slug` · `tv-slug` ·
 * `f-slug`) theo đúng yêu cầu người dùng, nhưng HAI hàm gửi vẫn đọc nó:
 *
 *     const oS = G("vd-slug")            // null — ô đã bị gỡ
 *     const slug = (oS?.value ?? "")     // ""
 *     if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return  // LUÔN đỏ
 *
 * ⇒ **đường nạp video và đường nạp tài liệu chết hẳn**. Bài viết sống sót vì nó
 * tự suy: `slug: FM_GOC?.slug ?? slugGoiY(gt("f-title") || gt("f-1l"))`.
 *
 * VÌ SAO 75 CỔNG KHÔNG BẮT: `format-chung` §2 hỏi *"ô đã bị gỡ chưa"* và
 * *"`guiFormThat` có tự điền không"* — nhưng `guiFormThat` là hàm của BÀI VIẾT,
 * đúng cái duy nhất không hỏng. `ba-duong-nap-that` POST thẳng API nên bỏ qua
 * nút. Cả hai đo thứ ở CẠNH chỗ hỏng.
 *
 * Nên cổng này đo theo hướng CẤU TRÚC, bắt cả lớp: một mốc FE với tay tới mà
 * không tồn tại là một nhánh code chết — hoặc im lặng (có `if (!o) return`),
 * hoặc chặn cứng như ca trên.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { taoKiem } from "./_api.mjs"
import { maFeNguon, napRender, trangHtml } from "./_render.mjs"
await napRender()

const { ok, chot } = taoKiem()
const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
// `maFeNguon(".ts")` — multiwindow + MỌI chunk (T03-104). Đọc riêng
// multiwindow là đọc một phần rồi kết luận về toàn thể.
const TS = maFeNguon(".ts")
const SHELL = readFileSync(join(WEB, "render", "shell.html"), "utf8")

// Bỏ bình luận TRƯỚC khi quét: một `G("x")` trong chú thích không phải lời gọi.
// (Đã trúng: lượt đầu tôi đếm cả một ví dụ nằm trong khối `/* … */`.)
const MA = TS.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ")

console.log("\n1 · Mọi `G(\"id\")` phải có mốc thật\n")

const moc = [...new Set([...MA.matchAll(/\bG\("([a-zA-Z0-9_-]+)"\)/g)].map((m) => m[1]))]
ok(moc.length > 20, `quét được ${moc.length} mốc FE`,
  "quá ít ⇒ regex hỏng và mọi phép dưới đúng vô điều kiện")

const coShell = new Set([...SHELL.matchAll(/id="([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]))
// Mốc do chính FE dựng ra lúc chạy cũng hợp lệ.
const coJs = new Set([...MA.matchAll(/id\s*=\s*["'`]([a-zA-Z0-9_-]+)/g)].map((m) => m[1]))
ok(coShell.size > 50, `shell khai ${coShell.size} id`,
  "quá ít ⇒ phép so ở dưới báo oan hàng loạt")

/*
 * NGOAI LE CO TEN, KHONG PHAI DANH SACH BO QUA.
 *
 * `kp-rac` la mo coi cua mot lan go KHAC (thiet ke lai KPI), khong phai cua
 * WO-021. `CLAUDE.md` §3 noi: ma chet KHONG lien quan thi NEU RA, dung xoa.
 * Da mo o backlog. Ghi ten no o day de mot moc treo MOI van do duoc — mot
 * cong bo qua ca lop thi khong con la cong.
 */
const THA = { "kp-rac": "mồ côi của lần thiết kế lại KPI — ô backlog M01_core 2026-08-29" }
for (const [id, vi] of Object.entries(THA)) {
  ok(moc.includes(id) && !coShell.has(id) && !coJs.has(id),
    `ngoại lệ \`${id}\` VẪN đúng thực tế`,
    "ngoại lệ không còn đúng ⇒ xoá nó khỏi `THA`, đừng để nó che một mốc khác")
  console.log(`       (tha: ${id} — ${vi})`)
}

const treo = moc.filter((i) => !coShell.has(i) && !coJs.has(i) && !(i in THA))
ok(treo.length === 0,
  `không mốc nào treo (${moc.length} mốc, ${treo.length} treo)`,
  `treo: ${treo.join(" · ")} — mỗi cái là một nhánh code CHẾT: hoặc im lặng `
  + "không làm gì, hoặc chặn cứng cả thao tác như `vd-slug` đã làm với đường video")

console.log("\n2 · Ba hàm gửi phải TỰ SUY slug, không đọc ô đã gỡ\n")

// Đo TRUTH: ô `*-slug` đã bị gỡ (WO-021), nên hàm gửi nào còn ĐỌC nó là hàm gửi
// không bao giờ chạy xong. Đo cả hai vế — không đọc ô, VÀ có suy.
const than = (ten) => {
  const i = MA.indexOf(`function ${ten}`)
  if (i < 0) return ""
  const b = MA.indexOf("{", i)
  let sau = 0
  for (let k = b; k < MA.length; k++) {
    if (MA[k] === "{") sau++
    else if (MA[k] === "}") { sau--; if (!sau) return MA.slice(b, k + 1) }
  }
  return ""
}

for (const [ten, tien] of [["ghiVideo", "vd"], ["ghiBanGhiThuVien", "tv"]]) {
  const t = than(ten)
  ok(t.length > 0, `tìm được thân \`${ten}\``)
  ok(!t.includes(`G("${tien}-slug")`),
    `  \`${ten}\` KHÔNG đọc ô \`${tien}-slug\` (đã gỡ ở WO-021)`,
    "đọc một ô không tồn tại ⇒ slug rỗng ⇒ phép kiểm slug LUÔN đỏ, và người "
    + "dùng không có cách nào qua")
  ok(/slugGoiY\(/.test(t),
    `  và \`${ten}\` TỰ SUY slug bằng \`slugGoiY\``,
    "bỏ ô mà không tự điền thì hoặc chặn cứng, hoặc gửi slug rỗng lên server")
}

// Bài viết là bản ĐÚNG có sẵn — giữ nó trong phép đo để phép sửa không làm hỏng
// cái đang chạy được.
ok(/slug:\s*FM_GOC\?\.slug\s*\?\?\s*slugGoiY\(/.test(MA),
  "bài viết vẫn tự suy slug (bản đúng có sẵn, không được đổi)")

console.log("\n3 · `slugGoiY` phải sinh ra slug HỢP LỆ\n")

// Luật server: `^[a-z0-9]+(-[a-z0-9]+)*$`. Nếu `slugGoiY` sinh ra chữ hoa hay
// dấu gạch dưới thì tự suy cũng vô ích — id youtube `85kbC_s8Ldg` có CẢ HAI.
const tSlug = than("slugGoiY")
ok(tSlug.length > 0, "tìm được thân `slugGoiY`")
ok(/toLowerCase\(\)/.test(tSlug), "  hạ chữ thường")
ok(/replace\(/.test(tSlug), "  và thay ký tự ngoài bảng")

console.log("\n4 · KHÔNG id nào TRÙNG trong shell\n")

/*
 * §1 hoi *"moc co ton tai khong"*. No KHONG hoi *"co DUNG MOT khong"* — va mot
 * id trung thi `getElementById` tra PHAN TU DAU TIEN theo thu tu tai lieu, lang
 * le, khong canh bao nao.
 *
 * Nguoi dung bao: them mot chu de moi o `/khai-niem/` thi man noi *"can NGUOI
 * khai: label_vi"* trong khi o "Ten hien thi" DA DIEN. Do: `<dialog
 * id="dlg-nhan">` va `<input id="dlg-nhan">` cung ton tai, nen `G("dlg-nhan")`
 * tra ve cai DIALOG — `.value` cua no la `undefined` ⇒ nhan gui len luon rong.
 *
 * Hai chuc nang khac cua cung id do lai CHAY DUNG (`showModal`/`close` thuoc ve
 * dialog), nen loi chi lo o mot nhanh — kieu loi khong ai doan ra bang mat.
 */
for (const [ten, duong] of [
  ["render/shell.html", join(WEB, "render", "shell.html")],
  ["plugins/home-pages/shell.html", join(WEB, "plugins", "home-pages", "shell.html")],
]) {
  const h = readFileSync(duong, "utf8")
  const dem = {}
  for (const m of h.matchAll(/id="([a-zA-Z0-9_-]+)"/g)) dem[m[1]] = (dem[m[1]] ?? 0) + 1
  const so = Object.keys(dem).length
  ok(so > 50, `${ten} khai ${so} id`,
    "quá ít ⇒ regex hỏng và phép dưới đúng vô điều kiện")
  const trung = Object.entries(dem).filter(([, n]) => n > 1)
  ok(trung.length === 0, `  ${ten}: không id nào trùng`,
    trung.map(([k, n]) => `${k}×${n}`).join(" · ")
    + " — `getElementById` trả phần tử ĐẦU TIÊN, im lặng; mọi chỗ cần phần tử "
    + "thứ hai sẽ đọc nhầm sang thứ khác")
}

// Và về HÀNH VI: ô nhập của hộp thoại phải là một `<input>`, không phải thẻ bao.
const iNhan = SHELL.match(/<(\w+)[^>]*\bid="dlg-nhan-o"/)
ok(iNhan?.[1] === "input",
  'ô "Tên hiển thị" của hộp thoại là `<input id="dlg-nhan-o">`',
  `được <${iNhan?.[1] ?? "(không thấy)"}> — nếu G() trả về thẻ bao thì \`.value\` `
  + "là undefined và nhãn gửi lên LUÔN rỗng")
ok(/v\("dlg-nhan-o"\)/.test(MA), "  và `guiPopupNhan` đọc đúng ô đó")

console.log("\n5 · Đọc danh mục KHÔNG phụ thuộc mốc của màn KHÁC\n")

/*
 * Nguoi dung bao: them mot khai niem va mot chu de, DB co that, KPI tren cung
 * man hien 01/01 — ma danh sach ben duoi noi *"Danh muc khai niem dang trong"*.
 *
 * Do duoc tren server that:
 *   GET /api/concepts   -> {items:[{id:"talkshow",...}], tong:1}   DUNG
 *   GET /khai-niem/     -> 0 phan tu `[data-dm]`
 *   GET /bai-viet/nap/  -> 4 phan tu `[data-dm]`
 *
 * `[data-dm]` chi co tren cac man NAP, va `catNap()` CAT cac man nap khoi moi
 * trang khac de tiet kiem byte. Nen tren man Danh muc, `napDanhMuc()` khong tim
 * thay mount nao, `napLoaiDanhMuc` thoat som `return []` — va KHONG GOI API lan
 * nao. `veDanhMuc([], [])` ve ra chu "dang trong".
 *
 * Man Danh muc can CHINH DU LIEU, khong can cai o tich cua man nap. Buoc phep
 * doc vao mount cua mot man khac la buoc no vao mot thu co the bi cat di.
 */
const vKn = await trangHtml("khai-niem", { mock: true })
ok(vKn.length > 0, "render được màn `/khai-niem/`")
const soDm = (vKn.match(/data-dm=/g) ?? []).length
ok(soDm === 0, `màn Danh mục có ${soDm} mốc \`[data-dm]\` — đúng 0`,
  "nếu > 0 thì tiền đề của phép dưới sai, và §5 đang đo một thế giới khác")
for (const m of ["cb", "cchua", "catlist"]) {
  ok(vKn.includes(`id="${m}"`), `  nhưng VẪN có mốc \`#${m}\` để vẽ danh sách`)
}

const tNap = than("napLoaiDanhMuc")
ok(tNap.length > 0, "tìm được thân `napLoaiDanhMuc`")
ok(!/if\s*\(!moc\.length\)\s*return/.test(tNap),
  "  `napLoaiDanhMuc` KHÔNG thoát sớm khi vắng mốc",
  "thoát sớm ⇒ màn Danh mục không gọi API lần nào và luôn hiện \"đang trống\"")

const tMot = than("napMotDanhMuc")
ok(tMot.length > 0, "tìm được thân `napMotDanhMuc`")
ok(tMot.indexOf("fetch(") < tMot.indexOf("return null")
  || !/const o = G\(mocId\);\s*if \(!o\) return null/.test(tMot),
  "  và nó FETCH trước, không bỏ cuộc vì thiếu mốc",
  "phép đọc buộc vào mount của một màn khác là buộc vào thứ `catNap()` cắt đi")

console.log("\n6 · CHẠY THẬT hai hàm gửi — bắt `ReferenceError`\n")

/*
 * WO-028 xoa dong khai `const oS = G("vd-slug")` nhung de sot
 * `if (oS) oS.value = ""` NAM SAU loi goi POST. Ban ghi duoc tao that, roi FE
 * nem ReferenceError, va `catch` bao nham *"Khong goi duoc /api/video"*.
 *
 * `node --check` khong bat duoc (loi LUC CHAY, khong phai cu phap), va doc ma
 * cung khong — toi vua doc chinh doan do khi sua WO-028.
 *
 * Nen o day GOI ham. Sandbox tra stub cho moi ten module BIET TRUOC va NEM cho
 * moi ten la, nen mot bien mat khai bao lo ngay lap tuc.
 */
// `maFeNguon(".js")` — multiwindow + MỌI chunk đã biên dịch (T03-104).
const JS = maFeNguon(".js")
const thanJs = (ten) => {
  // GIU tu khoa `async`: cat tu `function` lam mat no, va than ham co `await`
  // se nem "await is only valid in async functions" — mot ĐO SAI, khong phai
  // loi cua ma. (Da trung o luot dau.)
  let i2 = JS.indexOf(`async function ${ten}`)
  if (i2 < 0) i2 = JS.indexOf(`function ${ten}`)
  if (i2 < 0) return ""
  const b = JS.indexOf("{", i2)
  let sau = 0
  for (let k = b; k < JS.length; k++) {
    if (JS[k] === "{") sau++
    else if (JS[k] === "}") { sau--; if (!sau) return JS.slice(i2, k + 1) }
  }
  return ""
}

// Ô nhập giả: mọi thứ `ghiVideo` cần đọc.
const oGia = (v) => ({ value: v, dataset: {}, hidden: false, disabled: false,
  innerHTML: "", textContent: "", checked: false, files: [],
  closest: () => null, querySelectorAll: () => [], querySelector: () => null,
  addEventListener: () => {}, setAttribute: () => {}, removeAttribute: () => {},
  focus: () => {}, classList: { add() {}, remove() {}, toggle() {} } })

for (const [ten, duongCho] of [
  ["ghiVideo", "/api/video"], ["ghiBanGhiThuVien", "/api/tai-lieu"],
]) {
  const t = thanJs(ten)
  ok(t.length > 0, `cắt được \`${ten}\` từ bundle đã build`)
  let duongGoi = null
  const bao = []
  const O = {
    G: (id) => oGia(id.endsWith("-1l") ? "Một câu tóm tắt thử"
      : id.endsWith("-title") ? "Tiêu đề thử" : ""),
    hostVideoHopLe: () => ({ nhan: "youtube" }),
    slugGoiY: () => "tieu-de-thu",
    nhanCua: () => ["x"],
    thanTu: (_, c) => c,
    kqTV: (chu, loai) => { bao.push([String(chu), loai]) },
    bao: () => {}, esc: (x) => String(x),
    loiMay: () => "loi", LOI_HOST: "", LOI_MOT_CAU: "", LOI_SLUG: "",
    loiNhan: () => "", napDanhMuc: async () => {}, capNhatDem: () => {},
    hienVatCho: { sha256: "a".repeat(64), mime: "application/pdf",
      ten_goc: "x.pdf", so_byte: 9 },
    datLaiForm: () => {}, doiView: () => {}, veLai: () => {},
    SUA_TL: null, FM_GOC: null, DANH_MUC: Promise.resolve(),
    fetch: async (u) => { duongGoi = u; return {
      ok: true, status: 201, json: async () => ({ path: "kb/video/x.md" }) } },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    // `setTimeout` là GLOBAL CỦA NỀN, cùng hạng `Date`/`fetch`/`document` đã có
    // sẵn ở đây. Hộp cát này canh việc hàm gọi một HELPER CHƯA KHAI của ứng
    // dụng; cấm luôn cả hàm của nền thì nó tố oan mọi đoạn hẹn giờ — và
    // `ghiVideo` cần đúng một nhịp chờ để người kịp đọc câu xác nhận trước khi
    // màn chuyển (`WO-060`).
    setTimeout: (f) => { f() },
    location: { href: "", assign: () => {} },
    Date, JSON, String, Number, Array, Object, Math, console,
  }
  const bay = new Proxy(O, {
    has: () => true,
    get: (o2, k) => {
      if (k === Symbol.unscopables) return undefined
      if (k in o2) return o2[k]
      throw new ReferenceError(`${String(k)} is not defined`)
    },
  })
  let noiDau = null
  try {
    const f = new Function("__s", `with (__s) { ${t}; return ${ten} }`)(bay)
    await f()
  } catch (e) { noiDau = String(e && e.message || e) }
  ok(noiDau === null, `  \`${ten}()\` không ném ra ngoài`, String(noiDau))
  /*
   * VE QUYET DINH — va la ve ma luot dau toi do THIEU: ham nay co `try/catch`
   * RIENG, nen mot `ReferenceError` ben trong KHONG nem ra ngoai; no bi nuot va
   * bien thanh cau "Khong goi duoc /api/... — may chu chua chay?".
   *
   * Do "co nem khong" la do sai cho. Phai do THU NGUOI DUNG THAY.
   */
  const cuoi = bao.length ? bao[bao.length - 1] : ["(khong bao gi)", "?"]
  /*
   * Neo vao LOAI thong bao (`"ok"`), khong vao CHU trong cau (`WO-060`).
   *
   * Ve nay giu dung mot tinh chat, va doan chu thich ngay tren da noi ro no la
   * gi: *nguoi dung phai thay bao THANH CONG, khong phai mot loi bi nuot*.
   * `"ok"` la chinh tinh chat do. Con `/Đã ghi/` la mot CACH VIET cau — doi
   * cau bao cho de hieu hon la cong do, du hanh vi khong doi mot ly nao.
   *
   * Va no van bat dung ca nguy hiem: `ReferenceError` bi nuot se bao loai
   * `"loi"`, nen ve nay do ngay.
   */
  ok(cuoi[1] === "ok",
    `  và BÁO THÀNH CÔNG: ${JSON.stringify(cuoi[0].slice(0, 60))}`,
    "POST xong mà màn báo lỗi ⇒ có gì đó SAU lời gọi ném, và `catch` của chính "
    + "hàm nuốt nó rồi đổ cho máy chủ")
  ok(duongGoi === duongCho, `  và nó gọi \`${duongCho}\``,
    `gọi ${duongGoi}`)
}

chot("mọi mốc FE có thật · ba hàm gửi tự suy slug · slugGoiY sinh slug hợp lệ")
