#!/usr/bin/env node
/**
 * FR-027f/g · CÁC MÀN NGOÀI TRANG CHỦ — đồng bộ thang, dải "máy đã làm gì",
 * 3D đúng chỗ, và việc gộp Chờ duyệt vào Kho.
 *
 * Người dùng: *"đồng bộ size, font UI"* · *"gọn gàng, thông minh, design bố cục
 * bắt mắt nhưng phải có tính AI - tự động, 3D ở trong đó"* · *"gộp màn chờ
 * duyệt và kho lại với nhau… đưa luôn url /cho-duyet vào /kho"*.
 *
 * Tên file KHÔNG mang số: bản đầu tên `nam-man-con-lai` và con số đó sai ngay
 * ở lần sửa kế tiếp (gộp xong còn bốn màn). Tên mang số là tên sẽ lạc hậu.
 *
 * File này canh ba điều, mỗi điều một lý do đã trả giá:
 *
 *  1 THANG. Đo được trước khi sửa: **9 luật `font-size` gõ px** và **59 giá trị
 *    ≥8px gõ tay** nằm im trong `prototype.css` — vì `token-only.test.js` miễn
 *    CẢ FILE với lý do "bê nguyên 437 dòng hợp đồng G5", mà file đã 2046 dòng.
 *    Miễn cả file = M03-R4 không có răng trên file CSS lớn nhất dự án.
 *
 *  2 DẢI "MÁY ĐÃ LÀM GÌ". Mọi con số trên năm màn này do máy tính (`priority`,
 *    đếm nhãn, ngưỡng kết nạp) mà không màn nào nói ra điều đó. Dải này phải
 *    nói điều máy THẬT SỰ làm, kèm số thật — và mỗi màn một sự thật KHÁC nhau.
 *    Năm dải nói cùng một câu thì nó là nhãn "AI-powered", không phải thông tin.
 *
 *  3 3D ĐÚNG CHỖ. Có PHÂN BỐ → khối 3D (mắt so chiều cao ba cột). Có TRÌNH TỰ
 *    → chiều sâu `perspective`. Rải khối 3D lên một dãy bước là trang trí.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { GOC } from "./_api.mjs"
import { trangHtml, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "")
const css = boCmt(readFileSync(join(WEB, "styles", "prototype.css"), "utf8"))
const cssGoc = css.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "")
/*
 * WO-027 · KHONG NEO BANG `(?:^|\})`.
 *
 * Neo do NUOT dau `}` cua luat truoc, nen phep quet chi thay CACH MOT luat:
 * do duoc tren chinh file nay — 416 luat thay vi 832, dung mot nua. Cung bug
 * da sua o WO-015, noi mot luat CO THAT bi bao la "thay 0 luat".
 *
 * Hom nay moi selector dang dung van tim thay, vi ham lay match CUOI CUNG va
 * chung co it nhat mot lan roi vao nhip chan. Do la MAY: them mot luat khong
 * lien quan o phia tren file la doi nhip, va mot phep kiem co the lang le
 * thanh vo hieu — khong ai bao gi.
 *
 * `[^{}@]*` khong the vuot qua mot `}`, nen no khong tro sang luat khac duoc:
 * NEO LA THUA ngay tu dau.
 */
const cuoi = (sel) => {
  const m = [...cssGoc.matchAll(new RegExp(`(?:^|[};])\\s*${sel}\\{([^}]*)\\}`, "gm"))]
  return m.length ? m[m.length - 1][1] : ""
}
const tokens = readFileSync(join(WEB, "..", "05_uiux", "tokens.css"), "utf8")
const shell = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")
// FR-034/C5 · template render sống ở web/render/trang.mjs (port từ emitter).
const emit = readFileSync(join(WEB, "render", "trang.mjs"), "utf8")

console.log("\nFR-027f/g · các màn ngoài Trang chủ\n")

// ══ 1 · THANG ĐỒNG BỘ ═════════════════════════════════════════════════════
console.log("1 · Thang chữ và hằng số bố cục — một nguồn\n")

// Bốn bậc `ui_guide §3` đòi mà thang 10 bậc cũ KHÔNG có. Thiếu chúng chính là
// lý do 9 luật kia gõ px: không có bậc thì người viết gõ số.
for (const [t, cho] of [
  ["--fs-nano", "10.5 · siêu dữ liệu nhỏ nhất"],
  ["--fs-card", "15.5 · tít thẻ nhỏ"],
  ["--fs-stat", "27 · số liệu bậc dưới"],
  ["--fs-feat", "tít nổi bật (clamp)"],
]) {
  ok(new RegExp(`${t}:`).test(tokens), `có bậc \`${t}\` — ${cho}`,
     "thiếu bậc là lý do người viết gõ px thẳng vào CSS")
}
for (const [t, cho] of [
  ["--rail-w", "78px rail — ui_guide §9"],
  ["--mid-w", "bề rộng khung giữa"],
  ["--mid-pad", "48px máng hai bên"],
  ["--pn-py", "26px panel dọc — ui_guide §4"],
  ["--pn-gap", "18px giữa hai panel"],
  ["--r-pill", "999px viên thuốc"],
]) {
  ok(new RegExp(`${t}:`).test(tokens), `có hằng số \`${t}\` — ${cho}`)
}

// `--rail-w` là token quan trọng nhất trong nhóm: rail và phần bù của khung
// nội dung PHẢI khớp. Đọc cùng token thì khớp do CẤU TẠO, không cần ai kiểm.
ok(/width:var\(--rail-w\)/.test(cuoi("\\.top"))
   && /padding-left:var\(--rail-w\)/.test(cssGoc),
   "rail và phần bù cùng đọc `--rail-w`",
   "hai số gõ ở hai chỗ thì lệch được, và lệch chỉ hiện ra bằng một dải mỏng bị che")

// Tít thẻ lưới: 14px là bậc của Ô NHẬP. Dùng nó cho tít làm thẻ đọc ra như form.
ok(/font-size:var\(--fs-card\)/.test(cuoi("\\.cd h4")),
   "tít thẻ lưới dùng `--fs-card` (15.5px, ui_guide §3)",
   "14px = --fs-small là bậc ô nhập, không phải bậc tít")

// Miễn trừ của `token-only` phải theo GIÁ TRỊ, không theo FILE.
const tOnly = readFileSync(join(WEB, "test", "token-only.test.js"), "utf8")
ok(!/HOP_DONG_G5/.test(tOnly) && /chi_duoi_8px/.test(tOnly),
   "`token-only` miễn theo giá trị (<8px), không miễn cả file",
   "miễn cả prototype.css = M03-R4 không có răng trên 2000 dòng")

// ══ 2 · DẢI "MÁY ĐÃ LÀM GÌ" — năm màn, năm câu KHÁC nhau ══════════════════
console.log("\n2 · Dải tự động — mỗi màn một sự thật riêng\n")

const MOC = [
  ["mball", "v-all", "Tất cả bài"],
  // FR-033 · dải `mbq` ĐÃ BỎ cùng mục Chờ duyệt. Màn Kho trở lại MỘT dải.
  // Nó từng nói ranh giới B-B1 ("máy không điền hộ ba trường M1") — câu đó mất
  // vai khi không còn bước duyệt nào để máy có thể điền hộ.
  ["mbkho", "v-kho", "Kho"],
  ["mbdm", "v-concepts", "Danh mục"],
  // FR-038/C6a · man `/nap/` chung DA BO. Hai man nap rieng, moi man mot dai
  // — va moi dai mot ID rieng: `chen()` thay theo id, nen hai the cung id la
  // mot phep thay khong xac dinh (vua bat duoc dung the).
  ["mbnap", "v-napbaiviet", "Nạp bài viết"],
  // WO-012 · ba dải của ba màn loại — DẪN XUẤT, không gõ ba dòng. Gõ tay thì
  // hôm nào thêm một màn loại, dải của nó ra khỏi phép đo mà không ai thấy.
  ...JSON.parse(readFileSync(
    join(GOC, "core", "assets", "man-hinh.json"), "utf8"))
    .man.filter((m) => m.menu && m.module)
    .map((m) => [`mb-${m.id_shell}`, `v-${m.id_shell}`, m.nhan]),
]
for (const [id, view, ten] of MOC) {
  // Mốc phải nằm TRONG đúng màn của nó — `chen()` là phép thay chuỗi theo id
  // nên đặt sai chỗ vẫn build xanh, dữ liệu chỉ rơi vào sai vùng.
  const iV = shell.indexOf(`id="${view}"`)
  const iM = shell.indexOf(`id="${id}"`)
  const iSau = shell.indexOf('<div class="view"', iV + 1)
  ok(iM > iV && (iSau < 0 || iM < iSau),
     `\`#${id}\` nằm trong \`${view}\` (${ten})`,
     "chen() thay theo id nên đặt sai màn vẫn build xanh")
  /*
   * WO-012 · nhận CẢ dạng dẫn xuất `chen(shell, \`mb-${m.id_shell}\`, …)`.
   *
   * Phép kiểm cũ tìm chuỗi `chen(shell, "<id>"` — nó chỉ thấy được lời gọi gõ
   * TAY từng id. Ba dải của ba màn loại đổ trong MỘT vòng lặp, nên nó báo
   * "emitter không điền" trong khi emitter điền đúng. Một cổng chỉ thấy bản gõ
   * tay là cổng ép người ta gõ tay.
   */
  const goTay = emit.includes(`chen(shell, "${id}"`)
  const danXuat = emit.includes("chen(shell, `mb-${m.id_shell}`")
    && emit.includes("chen(shell, `g-${m.id_shell}`")
  ok(goTay || (id.startsWith("mb-") && danXuat),
    `emitter điền \`#${id}\``,
    "không thấy lời gọi `chen` nào — gõ tay hay dẫn xuất đều được")
}

ok(/const daiMay = /.test(emit), "có một hàm `daiMay()` dùng chung",
   "năm dải viết tay riêng thì chúng lệch nhau ngay lần sửa đầu")

// Năm câu phải KHÁC nhau. Đây là phép kiểm quan trọng nhất của mục này: một
// dải nói "AI-powered" ở cả năm màn là nhãn trang trí, không phải thông tin.
// Cắt CỬA SỔ từ chỗ gọi `chen(...)` thay vì khớp tới dòng trống: file dùng
// CRLF nên `\n\n` không khớp, và một phép kiểm trượt vì escape thì nó im lặng
// báo "0 dải" thay vì báo điều nó định đo.
/**
 * FR-029 · DẢI KHÔNG CÒN CÂU VĂN — và phép kiểm đổi chiều theo.
 *
 * Trước đây mỗi dải mang một câu giải thích, và mục này canh năm câu phải KHÁC
 * nhau (một câu dùng chung ở năm màn là nhãn quảng cáo, không phải thông tin).
 * FR-027j chuyển các câu đó vào `title=`; FR-029 bỏ hẳn.
 *
 * Người dùng: *"truy tìm tất cả comment hay text guide trên web để xóa đi,
 * thiếu chuyên nghiệp quá"* — rồi chốt phạm vi gồm CẢ năm dải này.
 *
 * Nên câu hỏi không còn là "năm câu có khác nhau không" mà là "dải có còn câu
 * nào không". Đổi tiêu chí là việc CÓ CHỦ ĐÍCH: R3 đòi tiêu chí sống trong FR
 * trước, và FR-029 §AC-2 là chỗ nó được khai.
 */
// WO-012 · nhan CA dang dan xuat, cung ly do nhu phep kiem tren: ba dai cua ba
// man loai do trong MOT vong lap, nen mot cong chi thay ban go tay se bao
// "khong tim thay" trong khi emitter dien dung.
const DX = emit.includes("chen(shell, `mb-${m.id_shell}`")
let nKhop = 0
for (const [id] of MOC) {
  const co = emit.includes(`chen(shell, "${id}"`)
    || (id.startsWith("mb-") && DX)
  if (!co) { ok(false, `tim duoc loi goi \`chen\` cho \`#${id}\``); continue }
  nKhop++
}
ok(nKhop === MOC.length, `khop duoc ca ${MOC.length} dai (duoc ${nKhop})`)

// `daiMay` chỉ còn nhận MẢNG SỐ — không còn tham số câu văn nào để ai đó
// lặng lẽ nhét một đoạn giải thích trở lại.
// (C5: bản .mjs bỏ type annotation — ràng buộc "một tham số, không câu văn"
// đo bằng chữ ký một-đối-số + phép cấm lời gọi truyền chuỗi ngay dưới.)
const iDai = emit.indexOf("const daiMay = (")
ok(/const daiMay = \(o\) =>/.test(emit.slice(iDai, iDai + 120)),
   "`daiMay` chỉ nhận mảng nhãn+số, không nhận câu văn",
   "thêm lại tham số câu là mở đường cho văn giải thích quay lại màn hình")
ok(!/daiMay\(\s*["'`]/.test(emit),
   "không lời gọi `daiMay` nào truyền một chuỗi",
   "năm màn từng mang năm câu — FR-029 bỏ hẳn")

// ══ 3 · 3D ĐÚNG CHỖ ══════════════════════════════════════════════════════
console.log("\n3 · 3D — khối cho PHÂN BỐ, chiều sâu cho TRÌNH TỰ\n")

ok(/const khoi3D = /.test(emit), "khối 3D là một hàm dựng được nhiều lần")
ok(!/id="tower"/.test(emit) && /class="tw-i"/.test(emit),
   "khối 3D dùng class `.tw-i`, không dùng id",
   "cả 6 màn nằm trong CÙNG tài liệu — id thứ hai là HTML sai và ba khối sau im lặng")
ok(/cot3D:\s*3/.test(emit), "số cột khai ở `NGUONG.cot3D` = 3",
   "từ cột thứ tư trở đi cột sau che cột trước — khối thành trang trí")

// Ba màn có PHÂN BỐ ⇒ có khối. Ba phân bố phải KHÁC nhau, nếu không ba màn vẽ
// cùng một biểu đồ ba lần.
ok(/mb-3d/.test(emit), "dải mang khối 3D ở màn có phân bố")
const phanBo = [
  [/khoi3D\(\[\["cao", pCao\]/, "Tất cả · phân bố priority"],
  [/khoi3D\(ba3Loai/, "Kho · ba loại nguồn"],
  [/khoi3D\(top3Cpt/, "Danh mục · ba nhãn dùng nhiều nhất"],
]
for (const [re, ten] of phanBo) {
  ok(re.test(emit), `khối 3D ở ${ten}`,
     "ba màn vẽ cùng một phân bố là ba lần cùng một biểu đồ")
}

// Màn có TRÌNH TỰ ⇒ chiều sâu, KHÔNG khối.
//
// FR-033 · hai phép kiểm về `.qw`/`mbq` (mục Chờ duyệt) đã bỏ cùng cái mục đó.
// Luật thì KHÔNG đổi và vẫn được canh ở màn Nạp nguồn ngay dưới: một dãy BƯỚC
// không có chiều cao để so, nên nó nhận `perspective` chứ không nhận khối 3D.
ok(/perspective:1100px/.test(cuoi("\.np-tw")),
   "Nạp nguồn dùng `perspective` (một lựa chọn giữa ba lối)")
ok(!/khoi3D/.test(emit.slice(emit.indexOf('"mbnap"'), emit.indexOf('"mbnap"') + 900)),
   "Nạp nguồn KHÔNG có khối 3D")

// Chiều sâu phải TẮT HẲN khi reduced-motion (DESIGN.md §7), và tắt bằng cách
// bỏ perspective — không phải giảm biên độ.
const rm = css.match(/@media\s*\(prefers-reduced-motion:reduce\)\{([\s\S]*?)\n\}/g) ?? []
const rmAll = rm.join("")
ok(/\.qw\{perspective:none\}/.test(rmAll.replace(/\s+/g, "")) || /perspective:none/.test(rmAll),
   "reduced-motion bỏ `perspective` — tắt hẳn, không giảm biên độ")
ok(/transform:none/.test(rmAll), "reduced-motion trả transform về `none`")

// ══ 3b · GỘP CHỜ DUYỆT VÀO KHO (FR-027g) ═════════════════════════════════
console.log("\n3b · Chờ duyệt đã gộp vào Kho\n")

// Màn cũ phải BIẾN MẤT hẳn. Một `#v-queue` còn sót là khối chết: `DUONG` đã bỏ
// key `queue` nên không đường nào tới nó, mà nó vẫn nặng ở MỌI trang (cả 6 màn
// nằm trong cùng một tài liệu).
ok(!/id="v-queue"/.test(shell), "`v-queue` không còn trong shell")
ok(!/data-nav="queue"/.test(shell), "không nút nào còn trỏ `data-nav=\"queue\"`",
   "bấm vào sẽ đổi URL tới màn không tồn tại rồi tải lại trang đã bị xoá")

// Và bảng đường phải bỏ key theo — còn key thì `doiView(\"queue\")` tin rằng có
// một màn tên đó và điều hướng vào hư vô.
const mw = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")
const bangDuong = /const DUONG[^=]*=\s*\{([\s\S]*?)\}/.exec(mw)?.[1] ?? ""
ok(!/queue:/.test(bangDuong), "`DUONG` đã bỏ key `queue`",
   "còn key thì doiView() điều hướng tới một `.view` không tồn tại")

/**
 * THỨ TỰ trong màn Kho — phép kiểm dễ trôi nhất của mục này: đổi thứ tự không
 * làm hỏng gì và không test nào khác thấy.
 * Việc-phải-làm đứng TRƯỚC bối cảnh: bạn vào Kho để duyệt bài, biểu đồ là thứ
 * để tham khảo.
 *
 * ĐO TRÊN MARKUP ĐÃ BỎ BÌNH LUẬN. Bản đầu đo trên `shell` thô và nó KHÔNG bắt
 * được khi tôi đổi tên id của `<section>` — vì chuỗi `id="cho-duyet"` còn nằm
 * trong một dòng bình luận **tôi tự viết** ngay phía trên. Phép kiểm khớp vào
 * lời giải thích của chính mình thay vì vào thứ nó định đo. Cùng lớp lỗi đã
 * mắc ở `rail-trai` lượt trước.
 */
const shellSach = shell.replace(/<!--[\s\S]*?-->/g, "")

/*
 * ═══ FR-033 · HÀNG ĐỢI PHẢI BIẾN MẤT HẲN ═══════════════════════════════════
 *
 * FR-027g gộp màn Chờ duyệt vào Kho; mục này từng canh THỨ TỰ trong Kho
 * (KPI → Chờ duyệt → biểu đồ) và cái neo `#cho-duyet`.
 *
 * Người dùng bỏ hẳn bước duyệt: *"bỏ tất cả thứ gọi là chờ duyệt"*. Nên phép
 * kiểm đổi CHIỀU — không còn hỏi "mục nằm đúng chỗ chưa" mà hỏi "nó đi hẳn
 * chưa", và hỏi cho từng mảnh của nó.
 *
 * Vì sao liệt kê từng mốc thay vì một lần `!/cho-duyet/`: bỏ một `<section>` mà
 * quên một mốc `data-mount` thì emitter vẫn `chen()` vào hư không — im lặng, và
 * con số đó biến mất khỏi màn mà không ai biết. Mỗi mốc là một chỗ có thể sót.
 *
 * ĐO TRÊN MARKUP ĐÃ BỎ BÌNH LUẬN. Bản đầu đo trên `shell` thô và KHÔNG bắt được
 * khi tôi đổi tên id — vì chuỗi `id="cho-duyet"` còn nằm trong một dòng bình
 * luận **tôi tự viết** ngay phía trên. Phép kiểm khớp vào lời giải thích của
 * chính mình thay vì vào thứ nó định đo.
 */
for (const [moc, la] of [
  ['id="cho-duyet"', "mục Chờ duyệt"],
  ['id="queue"', "danh sách chờ"],
  ['id="qcount"', "ô đếm chờ"],
  ['id="mbq"', "dải B-B1 của mục chờ"],
  ['id="tbn"', "badge số trên tab Kho"],
]) {
  ok(!shellSach.includes(moc), `\`${moc}\` đã bỏ — ${la}`,
     "còn mốc là emitter vẫn chèn vào một chỗ không ai thấy")
}
// Emitter cũng phải thôi chèn — mốc mất mà lời gọi còn là `chen()` vào hư không.
for (const moc of ["queue", "qcount", "mbq", "tbn"]) {
  ok(!new RegExp(`chen\\(shell, "${moc}"`).test(emit),
     `emitter thôi chèn \`#${moc}\``)
}
// Và KHÔNG chữ "chờ duyệt" nào còn trên shell — đó là cái tên người dùng chỉ vào.
ok(!/chờ duyệt/i.test(shellSach), "shell không còn chữ \"chờ duyệt\"",
   "tên gọi là thứ người dùng yêu cầu bỏ, không chỉ là cái màn")

// Thứ tự trong Kho giờ: KPI → biểu đồ. Không còn gì chen giữa.
const iKho = shellSach.indexOf('id="v-kho"')
const iKpi = shellSach.indexOf('id="kpi2"', iKho)
const iBar = shellSach.indexOf('id="bars2"', iKho)
ok(iKpi > 0 && iBar > iKpi, "thứ tự trong Kho: KPI → biểu đồ",
   `được KPI@${iKpi} · biểu đồ@${iBar}`)

// ══ 3c · BIỂU ĐỒ THÀNH PHẦN thay số khô khan (FR-027i) ═══════════════════
console.log("\n3c · Màn Kho: biểu đồ thành phần\n")

ok(/class="tp-b"/.test(emit), "có thanh thành phần `.tp-b`")
ok(!/class="kpi" id="kpi2"/.test(shellSach) || /class="tp-b"/.test(emit),
   "năm ô số khô khan đã thay bằng biểu đồ")

/**
 * PHÉP KIỂM QUAN TRỌNG NHẤT của mục này: **thùng rác KHÔNG được là một đoạn**
 * của thanh.
 *
 * Bài xoá đã RỜI khỏi `kb/` nên nó không phải một phần của tổng. Gộp nó vào là
 * một biểu đồ NÓI SAI — và đó là loại lỗi tệ nhất, vì một thanh 100% đọc ra rất
 * thuyết phục kể cả khi mẫu số sai.
 */
const iTp = emit.indexOf("const doan = [")
const thanTp = emit.slice(iTp, iTp + 260)
// FR-033 · `choDuyet` đổi tên thành `chuaLen` — "chờ duyệt" mô tả một THỦ TỤC
// (có ai đó phải duyệt), `chuaLen` mô tả một TRẠNG THÁI. Thủ tục đã bỏ; trạng
// thái thì còn (bài `draft` từ `_inbox/`, `edited` ở dữ liệu cũ).
// Ba đoạn KHÔNG đổi: đây vẫn là ba phần của MỘT tổng.
ok(/\["ok", appr\.length\], \["warn", chuaLen\.length\], \["bad", rej\.length\]/
   .test(thanTp.replace(/\s+/g, " ")),
   "thanh có ĐÚNG ba đoạn: trên site · chưa lên · đã loại",
   "đây là ba phần của MỘT tổng — thêm/bớt một đoạn là đổi mẫu số")
ok(!/rac|recycle/i.test(thanTp), "thùng rác KHÔNG là một đoạn của thanh",
   "bài xoá đã RỜI khỏi kb/ — gộp vào là biểu đồ nói sai về chính mẫu số của nó")
ok(/class="tp-x api-only"/.test(emit),
   "thùng rác ở khối RIÊNG `.tp-x`, dưới một đường kẻ")
ok(/border-top:1px dashed/.test(cuoi("\\.tp-x")),
   "đường kẻ tách thùng rác khỏi thanh",
   "không có ranh giới thị giác thì mắt vẫn cộng nó vào tổng")
ok(/id="kp-rac"/.test(emit), "mốc `#kp-rac` còn nguyên cho JS điền từ API")

// Tỉ lệ tính trên `tatCa`, KHÔNG trên tổng ba đoạn: hai số đó bằng nhau thì
// tốt, lệch nhau thì có trạng thái không thuộc nhóm nào — và lúc đó thanh PHẢI
// hụt, không được tự làm cho vừa.
ok(/const tong = tatCa\.length/.test(emit),
   "mẫu số là `tatCa`, không phải tổng ba đoạn",
   "lấy tổng ba đoạn làm mẫu số thì thanh LUÔN đầy 100% — kể cả khi thiếu bản")
ok(/bản ở trạng thái khác/.test(emit),
   "nói ra khi ba đoạn KHÔNG cộng đủ tổng",
   "thanh hụt mà không giải thích thì đọc ra như lỗi vẽ")

// Khối 3D lấy loại nguồn từ DỮ LIỆU, không gõ cứng.
ok(!/\["paper", "video", "repo"\]/.test(emit),
   "khối 3D KHÔNG gõ cứng ba loại nguồn",
   "bản real chỉ có docs+article ⇒ gõ cứng cho ra BA CỘT 0 (người dùng chỉ vào ảnh)")
ok(/const loaiTatCa/.test(emit) && /for \(const b of tatCa\)/.test(emit),
   "khối 3D đếm trên `tatCa` — cùng gốc với câu của dải bao quanh nó",
   "đếm `appr` thì hai con số trong CÙNG một ô đếm hai tập khác nhau")
// Cắt bớt phải NÓI RA.
ok(/catBot > 0/.test(emit) && /loại nữa/.test(emit),
   "khối 3D khai số loại BỊ CẮT",
   "cắt im lặng thì ba cột cộng ra 9 cạnh câu nói 13 — đọc ra như đã phủ hết")

// FR-033 · Phép kiểm `62ch` cho hàng Chờ duyệt ĐÃ BỎ cùng mục đó.
//
// LUẬT thì không đổi, và nó vẫn được canh ở nơi còn văn bản dài: `ui_guide §9`
// đòi ràng buộc độ dài dòng nằm trên KHỐI CHỮ, không trên cả hàng. Đặt lên
// `.nw` (bản đầu của tôi) cho ra lỗi thị giác thật — dải `.mb` và dòng ghi chú
// trải hết panel còn hàng dừng ở 840px, để lại mảng trống bên phải mọi hàng.
//
// Thứ có ĐỘ DÀI DÒNG là văn bản; ngày/chip/nút là cột thao tác, thuộc mép phải.
ok(/max-width:62ch/.test(cuoi("\.feat-d")) || /62ch/.test(css),
   "ràng buộc độ dài dòng `62ch` vẫn còn ở khối chữ",
   "mất hẳn nghĩa là ui_guide §9 không còn răng ở đâu cả")
ok(!/max-width:840px/.test(cuoi("\\.qw \\.nw")),
   "`.qw .nw` KHÔNG bị chặn bề rộng — hàng thẳng lề với dải và ghi chú",
   "chặn cả hàng thì mép phải panel hở một mảng trống, đọc ra như trang vỡ")
ok(!/#v-queue/.test(css), "CSS không còn selector `#v-queue` nào",
   "selector trỏ vào một id không tồn tại là luật chết")

/**
 * LUẬT ẨN PANEL RỖNG — lỗi này sống im lặng cho tới khi người dùng chụp màn.
 *
 * Bản cũ: `.pn:has(> [data-mount]:empty:only-of-type)`. `:only-of-type` hỏi
 * *"có phải phần tử `<p>` DUY NHẤT trong panel không"* — không phải *"có phải
 * MỐC duy nhất không"*, là điều nó định hỏi. Panel đầu màn Kho có
 * `<p class="khocanh">` (rỗng khi mọi file đọc được) nằm cạnh `<div id="mbkho">`
 * và `<div id="kpi2">` đầy nội dung ⇒ `<p>` đó là `<p>` duy nhất ⇒ **cả panel
 * Kho + KPI bị `display:none`**, mà build vẫn xanh và mọi test vẫn xanh.
 *
 * Vì sao không phép kiểm MARKUP nào bắt được: markup luôn có đủ — chỉ CSS ẩn
 * nó. Muốn bắt bằng markup thì phải chạy trình duyệt thật. Nên răng đặt lên
 * chính LUẬT: nó phải diễn đạt "MỌI mốc đều rỗng", không phải một phép thử
 * gián tiếp về kiểu phần tử.
 */
const luatAn = /\.pn:has\(> \[data-mount\]:empty\)[^{]*\{display:none\}/.exec(
  cssGoc.replace(/\s+/g, " "))
ok(luatAn !== null, "có luật ẩn panel khi mọi mốc rỗng")
ok(!/:only-of-type/.test(luatAn?.[0] ?? ""),
   "luật ẩn panel KHÔNG dùng `:only-of-type`",
   "`:only-of-type` hỏi về KIỂU phần tử, không hỏi về số MỐC — một `<p>` rỗng " +
   "cạnh hai `<div>` đầy sẽ ẩn cả panel")
ok(/:not\(:has\(> \[data-mount\]:not\(:empty\)\)\)/.test(luatAn?.[0] ?? ""),
   "luật đòi KHÔNG có mốc nào không-rỗng — tức MỌI mốc đều rỗng",
   "thiếu vế này thì một mốc rỗng đủ để giết cả panel")

// Màu tiêu đề mục phải thắng bằng ĐẶC HIỆU, không bằng thứ tự nguồn — cái bẫy
// cascade dự án đã trả giá ba lần.
ok(/#v-kho #cho-duyet \.pn-h h2\{color:var\(--warning\)\}/.test(cssGoc.replace(/\s+/g, " "))
   || /#v-kho #cho-duyet \.pn-h h2/.test(css),
   "tiêu đề mục Chờ duyệt dùng hai id để thắng `#v-kho .pn-h h2`",
   "cùng đặc hiệu (1,1,1) thì chỉ thứ tự nguồn quyết định — sắp lại file là đổi màu")

// ══ 3d · KHÔNG VẼ VĂN GIẢI THÍCH RA MÀN (FR-027j) ═══════════════════════
console.log("\n3d · Chú thích ở `title=`, không vẽ ra màn\n")

/**
 * Người dùng: *"tất cả những thứ gọi là comment / guide thì đừng có show ra"*.
 *
 * Hai triệu chứng trong ảnh chụp: câu văn dài trong dải `.mb`, và dòng chú thích
 * bị `text-overflow:ellipsis` trong cột hẹp cắt còn **hai ký tự** — `"l.."`,
 * `"s.."`, `"7.."`. Một chú thích cắt còn hai ký tự thì nó không còn là thông
 * tin, chỉ còn là rác thị giác.
 *
 * Chú thích vào `title=`: tra được khi cần, không chiếm chỗ. Dự án đã dùng đúng
 * phép này một lần cho tab màn Danh mục.
 */
/**
 * ĐO TRÊN MÃ ĐÃ BỎ BÌNH LUẬN.
 *
 * Bản đầu đo trên `emit` thô và nó ĐỎ GIẢ: chuỗi `class="sub"` còn nằm trong một
 * dòng bình luận **tôi tự viết** để giải thích vì sao đã bỏ nó. Phép kiểm khớp
 * vào lời giải thích của chính mình — lần thứ hai cùng lớp lỗi trong dự án này
 * (lần trước ở neo `#cho-duyet`).
 *
 * Bỏ `//` theo DÒNG (chỉ khi `//` mở đầu dòng), không bỏ mọi `//` — `https://`
 * trong một chuỗi thật sẽ bị cắt mất nửa sau.
 */
const emitSach = boCmt(emit).replace(/^\s*\/\/.*$/gm, "")
ok(!/class="sub"/.test(emitSach), "emitter KHÔNG vẽ `<span class=\"sub\">` nào",
   "đó là dòng chú thích bị cắt còn hai ký tự trong ảnh người dùng gửi")
ok(!/class="mb-t"/.test(emitSach), "dải `.mb` KHÔNG vẽ đoạn văn `.mb-t`",
   "câu giải thích thuộc `title=`, không thuộc màn")
ok(/const chuTran = /.test(emit), "có helper bỏ thẻ cho `title=`",
   "`title` là thuộc tính — một `<b>` trong đó hiện nguyên văn \"<b>\"")
// FR-029 · dải KHÔNG còn câu văn ở đâu cả — kể cả `title`.
//
// FR-027j chuyển câu vào tooltip vì "bỏ hẳn là mất thông tin". Người dùng xem
// bản đó rồi chốt tiếp: bỏ hẳn. Tooltip vẫn là chỗ hợp lệ cho chú thích NGẮN
// (hàng KPI bên dưới còn dùng), nhưng không phải chỗ chứa cả đoạn.
ok(!/class="mb-l"[^>]*title=/.test(emit),
   "nhãn TỰ ĐỘNG của dải không mang tooltip văn xuôi",
   "chuyển chỗ chỉ là giấu; người dùng chốt bỏ hẳn")
ok(/title="\$\{esc\(chuTran\(phu\)\)\}"/.test(emit),
   "chú thích của mỗi hàng nằm ở `title` của hàng đó")
// Luật CSS của những phần tử đã bỏ cũng phải bỏ — luật trỏ vào class không còn
// tồn tại là luật chết.
for (const x of ["\.mb-t\{", "\.tp-r \.sub", "\.tp-x \.sub", "\.kp \.sub"]) {
  ok(!new RegExp(x).test(css), `CSS không còn luật mồ côi \`${x.replace(/\\/g, "")}\``,
     "luật trỏ vào class không còn tồn tại là luật chết")
}

// ══ 4 · NẠP NGUỒN — ba số phải có nguồn thật ═════════════════════════════
console.log("\n4 · Nạp nguồn — ba mức tự động, ba số có nguồn\n")

/*
 * FR-036/B7b · PHÉP KIỂM NÀY ĐÃ ĐƯỢC VIẾT LẠI, và đây là lý do.
 *
 * Bản trước ghim `length === 3` và dãy `3/2/1` chính xác. Màn Nạp nguồn giờ có
 * BỐN lối (thêm "Nạp tài liệu"), và trên một thang BA vạch thì bốn lối KHÔNG
 * THỂ có bốn mức khác nhau — điều kiện cũ trở thành **không thoả được**, không
 * phải "bị vi phạm".
 *
 * Nên giữ đúng Ý ĐỊNH mà chính bình luận cũ khai — *"ba lối cùng số vạch thì
 * vạch không nói gì, nó chỉ là hoa văn"* — và bỏ phần con số đã hết đúng:
 *   · số vạch DẪN XUẤT từ số tab, không gõ tay;
 *   · mọi vạch phải nằm trong 1..3 (thang có ba mức);
 *   · phải có ÍT NHẤT HAI mức khác nhau — bằng nhau hết là hoa văn;
 *   · "Tự viết bài" phải là mức THẤP NHẤT — đó là mệnh đề về sản phẩm còn giá
 *     trị: lối người viết tay là lối máy làm ít nhất.
 *
 * Hai lối CÓ THỂ cùng mức, và đó là sự thật: "dán link" và "nạp tài liệu" đều
 * là máy làm gần hết. Ép chúng khác nhau là bắt giao diện nói dối để một phép
 * kiểm được xanh.
 */
const soTabNap = (shell.match(/data-naptab=/g) ?? []).length
ok(shell.match(/np-au/g)?.length === soTabNap,
   `mỗi lối (${soTabNap}) có một vạch mức tự động`)
const vach = [...shell.matchAll(/<span class="np-au"[^>]*>((?:\s*<i[^>]*><\/i>)+)/g)]
  .map((m) => (m[1].match(/<i>/g) ?? []).length)
ok(vach.length === soTabNap && vach.every((v) => v >= 1 && v <= 3),
   `mỗi vạch nằm trong 1..3 (được ${vach.join("/")})`,
   "thang chỉ có ba mức — một giá trị ngoài thang là lỗi dựng hình")
ok(new Set(vach).size >= 2,
   `vạch mang thông tin: ${new Set(vach).size} mức khác nhau trên ${soTabNap} lối`,
   "mọi lối cùng số vạch thì vạch không nói gì — nó chỉ là hoa văn")
const iViet = [...shell.matchAll(/data-naptab="([a-z-]+)"/g)]
  .map((m) => m[1]).indexOf("viet")
ok(iViet >= 0 && vach[iViet] === Math.min(...vach),
   "lối \"Tự viết bài\" là mức tự động THẤP NHẤT",
   `viet ở vị trí ${iViet}, vạch ${vach[iViet]}, thấp nhất ${Math.min(...vach)}`)

/**
 * FR-029 · "9 cổng validate" · "6 pass" · "4 cổng" ĐÃ RA KHỎI MÀN HÌNH.
 *
 * Ba con số đó là BƯỚC KỸ THUẬT bên trong, và người dùng chốt bỏ: chúng nói
 * cho người đọc báo biết một thứ họ không dùng được vào việc gì.
 *
 * Nhưng phần CÒN GIÁ TRỊ của phép kiểm cũ không được mất theo: nó buộc con số
 * trên màn phải đến từ NGUỒN THẬT chứ không từ trí nhớ. Nên giữ vế đó và đổi
 * hướng — giờ canh rằng chúng KHÔNG còn trên màn, và canh ở CẢ HAI file, vì
 * "dọn xong" mà một tuần sau ai đó gõ lại "9 cổng" thì không ai biết.
 */
const val = readFileSync(
  join(WEB, "..", "core", "src", "source_distiller", "validate.py"), "utf8")
const soCong = (val.match(/^\s+# \d+ — /gm) ?? []).length
ok(soCong === 9, `validate.py vẫn có ${soCong} cổng (nguồn thật không đổi)`,
   "con số đổi thì đây là chỗ biết trước tiên")

// `boCmt` chỉ bỏ khối `/* … */`. Ở đây phải bỏ CẢ `//` của TS lẫn `<!-- -->`
// của HTML: comment là miễn trừ đã khai (viết cho người sửa file), và chính
// chúng nhắc "6 pass · 4 cổng" để giải thích VÌ SAO ba vạch dài ngắn khác nhau.
const emitVaShell = boCmt(emit).replace(/^\s*\/\/.*$/gm, "")
  + "\n" + shell.replace(/<!--[\s\S]*?-->/g, "")
for (const [mau, ten] of [
  [/\d+ pass\b/, "số pass của bộ rút trích"],
  [/\d+ cổng\b/, "số cổng kiểm"],
]) {
  const m = emitVaShell.match(new RegExp(mau, "g"))
  ok(!m, `màn Nạp nguồn không in ${ten}`,
     m ? `còn: ${[...new Set(m)].join(", ")} — đó là bước bên trong, không phải việc của người đọc` : "")
}

// ══ 4b · KHUNG GIỮA phải BỌC MỌI MÀN (FR-027h) ═══════════════════════════
console.log("\n4b · Khung giữa `.mid` bọc mọi màn — trên từng trang đã build\n")

/**
 * Lỗi này người dùng phải TỰ THẤY BẰNG MẮT, 37 file test không cái nào đỏ.
 *
 * Hai lỗi cấu trúc, cùng một gốc:
 *
 *  1 Một `</div>` LẠC (kèm một dòng `.foot api-thieu` sao y) đóng `.mid` ngay
 *    TRƯỚC `v-nap`. Hậu quả: riêng màn Nạp nguồn nằm NGOÀI khung giữa và trải
 *    gần hết bề ngang, trong khi `.ph` vẫn bị bó 1440px. Đo được: bốn màn mở ở
 *    độ sâu 2, `v-nap` mở ở độ sâu 1.
 *
 *  2 `catNap` cắt từ `v-nap` tới `</main>` — cắt luôn `</div>` của `.mid`. Nên
 *    bốn trang không-phải-nap có `.mid` KHÔNG BAO GIỜ đóng. Lỗi 1 che lỗi 2:
 *    khi `.mid` đã đóng sớm thì `catNap` không cắt mất gì.
 *
 * Vì sao phải đo trên TRANG ĐÃ BUILD chứ không trên shell: lỗi 2 do bước PHÁT
 * RA sinh ra, shell hoàn toàn cân bằng. Kiểm shell là kiểm sai vật.
 */
// FR-034/C5 · "trang đã build" → trang RENDER THẬT (bản real từ kho tạm):
// lỗi 2 do bước PHÁT RA sinh ra nên vẫn phải đo trên đầu ra renderTrang.
const TRANG = [["index.html", "trang-chu"], ["tat-ca/index.html", "tat-ca"],
               ["kho/index.html", "kho"], ["khai-niem/index.html", "khai-niem"],
               ["bai-viet/nap/index.html", "nap-bai-viet"],
               ["tai-lieu/nap/index.html", "nap-tai-lieu"]]
for (const [t, view] of TRANG) {
  const h = await trangHtml(view, { mock: false })
  const m0 = /<div[^>]*class="mid"[^>]*>/.exec(h)
  if (!m0) { ok(false, `${t}: có \`.mid\``, "thiếu khung giữa thì nội dung dán sát rail"); continue }
  // Đếm THẺ để tìm đúng thẻ đóng của `.mid`. `indexOf("</div>")` sẽ lấy thẻ
  // đóng của phần tử CON đầu tiên — cùng lớp lỗi đã mắc ở `catNap`.
  let sau = 0, dong = -1
  const re = /<(\/?)div\b[^>]*>/g
  re.lastIndex = m0.index
  for (let m = re.exec(h); m; m = re.exec(h)) {
    sau += m[1] ? -1 : 1
    if (sau === 0) { dong = m.index; break }
  }
  ok(dong > 0, `${t}: \`.mid\` ĐÓNG đúng`,
     "không đóng ⇒ HTML sai; trình duyệt tự vá ở </main> nên mắt không thấy")
  const ngoai = ["home", "all", "baiviet", "tailieu", "video", "kho",
                 "concepts", "napbaiviet", "naptailieu"]
    .map((n) => [n, h.indexOf(`id="v-${n}"`)])
    .filter(([, i]) => i > 0 && !(i > m0.index && i < dong))
    .map(([n]) => n)
  ok(ngoai.length === 0, `${t}: mọi màn nằm TRONG \`.mid\``,
     `màn ngoài khung: ${ngoai.join(", ")} — chúng sẽ trải hết bề ngang`)
}

// ══ 5 · Ba trường M1 — MÁY KHÔNG ĐIỀN HỘ ══════════════════════════════════
console.log("\n5 · Ba trường M1 — máy không điền hộ\n")

/*
 * FR-033 · Mục này ĐỔI THƯỚC ĐO, và phần còn lại là phần đáng giữ nhất.
 *
 * Trước đây nó canh hai thứ đã biến mất cùng bước duyệt: dải `#mbq` nêu đủ ba
 * tên trường, và phiếu duyệt hỏi đủ ba câu. Không còn dải, không còn phiếu.
 *
 * Thứ CÒN THẬT của B-B1/M08-R3: máy KHÔNG BAO GIỜ tự khai ba trường đó. Trước
 * đây luật ấy được bảo vệ gián tiếp — schema bắt buộc ⇒ ai đó phải điền ⇒ phiếu
 * hỏi người. Giờ chúng là tuỳ chọn, nên đường tắt "điền đại một giá trị mặc
 * định cho xong" MỞ RA, và đây là chỗ duy nhất canh nó.
 *
 * Đo trên MÃ, không trên màn: một giá trị mặc định là một dòng gán, và nó nằm
 * trong `status.mjs` — nơi duy nhất được ghi ba trường này.
 */
const st = readFileSync(join(WEB, "api", "status.mjs"), "utf8")
const M1 = ["insight_new", "skill_installed", "review_minutes"]
const iAp = st.indexOf('if (den === "approved")')
const thanAp = st.slice(iAp, iAp + 1800)

for (const x of M1) {
  // Mọi lần gán `fm.<trường>` phải lấy vế phải TỪ `p.<trường>`.
  //
  // KHÔNG dùng negative lookahead ở đây. Bản đầu tôi viết
  // `fm[.]x[ ]*=[ ]*(?!p[.]x)` và nó khớp CẢ dòng đúng: `[ ]*` lùi được về
  // 0 khoảng trắng, nên lookahead xét ngay sau dấu `=`, thấy một dấu cách
  // (không phải `p`), và "không phải p.x" thành đúng. Ba phép kiểm đỏ oan.
  //
  // So VẾ PHẢI trực tiếp thì không có chỗ nào để lùi.
  const ganSai = st.split("\n")
    .map((dong) => dong.match(new RegExp("fm[.]" + x + "\s*=\s*(.*)$")))
    .filter(Boolean)
    .filter((m) => !m[1].trim().startsWith("p." + x))
  ok(ganSai.length === 0,
     "`" + x + "` chỉ nhận từ người khai, không có giá trị mặc định",
     "một `?? false` ở đây là máy tự khai có vỏ bọc người bấm (B-B1 / M08-R3)"
     + (ganSai.length ? " — thấy: " + ganSai[0][0].trim() : ""))
  // Và phải CÓ nhánh vắng-mặt: vắng là sự thật ("không ai khai"), còn `false`
  // là một lời khai mà không ai đưa ra.
  ok(new RegExp("p[.]" + x + " !== undefined").test(thanAp),
     "`" + x + "` chỉ ghi khi payload CÓ nó",
     "thiếu nhánh `!== undefined` thì trường luôn được đặt, kể cả bằng undefined")
}

// Kiểu vẫn phải kiểm — bỏ bước duyệt không phải bỏ kiểm dữ liệu.
ok(thanAp.includes('typeof p.insight_new !== "boolean"')
   && thanAp.includes("Number.isInteger(p.review_minutes)"),
   "gửi sai KIỂU vẫn bị chặn",
   "tuỳ chọn nghĩa là được phép vắng, không phải được phép là rác")


// ══ 6 · Trên trang đã build ══════════════════════════════════════════════
console.log("\n6 · Trang đã build\n")

// FR-034/C5 · trang mock render trực tiếp — không còn nhánh "chưa build".
{
  // FR-038/C6a · man `/nap/` chung DA BO — moi loai mot man nap rieng.
  const h = await trangHtml("nap-bai-viet")
  const dem = (re) => (h.match(re) ?? []).length
  // Mọi trang mang cả 6 màn vì `doiView()` đổi màn client-side.
  // NĂM dải trên BỐN màn — không phải lỗi đếm: màn Kho mang HAI dải
  // (`#mbkho` cho dashboard, `#mbq` cho mục Chờ duyệt vừa gộp vào).
  // FR-033 · BỐN dải, không còn năm: `#mbq` (dải của mục Chờ duyệt) đã bỏ cùng
  // cái mục đó. Số này đọc TỪ `MOC` ở mục 2 chứ không gõ tay — thêm/bớt một dải
  // thì sửa MỘT chỗ, và hai chỗ không lệch nhau được.
  /*
   * FR-038/C6a · SỐ DẢI TRÊN MỘT TRANG KHÔNG CÒN BẰNG `MOC.length`.
   *
   * Câu "mọi trang mang cả các màn" đúng cho tới khi `cat_khi_khac` xuất hiện:
   * hai màn nạp bị cắt khỏi mọi trang không phải của chúng, nên trang này mang
   * ba dải nền + ĐÚNG MỘT dải nạp của chính nó.
   *
   * Đếm theo màn CÓ MẶT thay vì theo tổng — số vẫn dẫn xuất từ `MOC`, và nó
   * đúng cho cả trang có màn nạp lẫn trang không có.
   */
  const cho = MOC.filter(([, view]) => h.includes(`id="${view}"`)).length
  ok(dem(/class="mb"/g) === cho,
     `${cho} dải trên trang (được ${dem(/class="mb"/g)})`,
     "mọi trang mang cả các màn — doiView() đổi màn client-side")
  /*
   * FR-031 · CANH QUAN HỆ, KHÔNG CANH SỐ CỨNG.
   *
   * Bản trước đòi đúng 3 khối và 12 cột. Ý định thì đúng ("khối 3D chỉ ở nơi CÓ
   * PHÂN BỐ") nhưng thước đo lại là hai con số tuyệt đối — nên khi người dùng
   * xoá sạch danh mục, màn Danh mục KHÔNG CÒN phân bố nào và khối 3D của nó
   * vắng mặt. Đó là hành vi ĐÚNG, và phép kiểm đỏ.
   *
   * Điều thật sự phải đúng: mỗi khối 3D có ĐÚNG BA cột. Ba cột là hình dạng của
   * `khoi3D()` (ba tầng transform, `ui_guide §6`); một khối 2 cột hay 4 cột là
   * lỗi dựng hình, còn "không khối nào" chỉ là không có dữ liệu.
   *
   * `+1` là khối ở Trang chủ — nó không nằm trong dải `.mb` nên không mang class
   * `mb-3d`. Khai ra ở đây thay vì gộp vào một con số 12 không ai giải thích.
   */
  const soKhoi3D = dem(/class="mb-3d"/g)
  const soCot3D = dem(/class="tw-b"/g)
  ok(soKhoi3D >= 1, `${soKhoi3D} khối 3D trong dải — ít nhất một màn có phân bố`,
     "0 khối nghĩa là KHÔNG màn nào có dữ liệu phân bố, kể cả loại nguồn")
  ok(soCot3D === 3 * (soKhoi3D + 1),
     `${soCot3D} cột = 3 × (${soKhoi3D} khối trong dải + 1 khối Trang chủ)`,
     "mỗi khối phải đúng BA cột — lệch là lỗi dựng hình, không phải thiếu dữ liệu")
  // Số vạch DẪN XUẤT từ số tab (FR-036/B7b thêm lối thứ tư) — gõ tay một con
  // số ở đây là chỗ thứ hai phải sửa mỗi lần thêm lối, và chỗ thứ hai luôn là
  // chỗ bị bỏ quên.
  const soTab = (h.match(/data-naptab=/g) ?? []).length
  ok(dem(/class="np-au"/g) === soTab,
     `${soTab} vạch mức tự động cho ${soTab} lối (được ${dem(/class="np-au"/g)})`)
  // Không hex nào lọt vào markup ngoài logo (ui_guide §10).
  const hex = [...h.matchAll(/style="[^"]*#[0-9a-fA-F]{3,6}/g)].map((m) => m[0])
  ok(hex.length === 0, "không hex nào gõ trong `style=` của markup",
     `thấy: ${hex.slice(0, 2).join(" · ")}`)
  // Bình luận CSS không được lên bundle — 58 KB đo được.
  const gn = (await taiSan()).gnCss
  ok(!/\/\*/.test(gn), "bundle CSS không mang bình luận nào",
     "58 KB / 160 KB là bình luận — chúng viết cho người đọc repo, không cho trình duyệt")
  ok(/\.mb-t-w\{/.test(gn) && /--rail-w:/.test(gn),
     "cắt bình luận KHÔNG làm mất luật nào",
     "phép BỎ, không phải phép ĐỔI — mọi dòng còn lại y nguyên")
}

console.log("\nFR-031 · Dòng chảy kho — ba dashboard nữa, vòng RIÊNG\n")

{
  const kho = await trangHtml("kho", { mock: false })
  const mo = readFileSync(join(WEB, "plugins", "home-motion", "src",
    "home-motion.inline.ts"), "utf8")

  // 1 · Ba pane, ba mốc — và mốc KHÔNG BAO GIỜ trắng.
  //
  // Kho có thể RỖNG (người dùng xoá sạch để bắt đầu làm việc — trạng thái hoàn
  // toàn hợp lệ). Nên điều phải đúng không phải "mốc có biểu đồ" mà là "mốc có
  // thứ gì đó": biểu đồ khi có dữ liệu, một câu nói rõ đang trống khi không.
  //
  // Bản đầu của phép kiểm này (tôi viết ở FR-031) đòi thẳng `kf-c`/`tp-s`/`bw`,
  // và nó đỏ ngay lần đầu kho trắng — đúng lớp lỗi "phép kiểm mượn dữ liệu
  // người dùng" mà chính FR đó đi sửa ở 22 chỗ khác.
  // FR-041 lượt 2 · dòng chảy còn HAI pane thời gian (ngày · tháng) — origin
  // và ưu tiên rời màn theo chỉ đạo bốn-tổng-hợp. Điều bất biến KHÔNG phải con
  // số: mỗi pane một tab, và ngược lại.
  const soPane = (kho.match(/data-kpane=/g) ?? []).length
  const soTab = (kho.match(/data-ktab=/g) ?? []).length
  ok(soPane === 2, `màn Kho có 2 pane dòng chảy (được ${soPane})`)
  ok(soTab === soPane, `mỗi pane một tab để bấm tay (${soTab}/${soPane})`,
     "tab không pane là nút bấm vào vùng trắng; pane không tab là nội dung không ai tới được")
  /*
   * NỘI DUNG BÊN TRONG MỐC — đếm thẻ để tìm thẻ đóng KHỚP.
   *
   * Bản đầu tôi cắt `kho.slice(i, i + 900)` rồi tìm chữ trong đó. Kiểm hai chiều
   * phơi ra ngay: làm mốc RỖNG THẬT mà phép kiểm vẫn XANH — vì cửa sổ 900 ký tự
   * đọc luôn chữ của phần tử BÊN CẠNH.
   *
   * Một cửa sổ theo số ký tự không phải một phần tử. Phải đếm `<div>` mở/đóng.
   */
  const trongMoc = (html, id) => {
    const i = html.indexOf(`id="${id}"`)
    if (i < 0) return null
    const mo = html.indexOf(">", i)
    if (mo < 0) return null
    let sau = 1, k = mo + 1
    // `(?![a-z])` thay cho `\b` — CO CHU DICH, khong phai ngau hung.
    //
    // Ban truoc viet `\b` va toi ghi file nay qua mot script Python: trong
    // chuoi non-raw cua Python, `\b` la BACKSPACE (0x08). Regex thanh
    // `/<(\/?)div\x08/g` — khong khop gi, vong lap khong chay mot nhip nao, va
    // ham tra ve CA PHAN CON LAI cua trang. He qua: phep kiem "moc khong duoc
    // trang" LUON XANH, ke ca khi moc rong that. Kiem hai chieu phoi ra dung
    // dieu do — va day la lan thu hai `\b` qua Python can toi trong du an nay.
    //
    // `(?![a-z])` lam dung viec `\b` dinh lam (chan `<divider>`), va khong co
    // ky tu nao de tang escaping dich lai.
    const re = /<(\/?)div(?![a-z])[^>]*>/g
    re.lastIndex = k
    let m
    while ((m = re.exec(html))) {
      sau += m[1] ? -1 : 1
      if (sau === 0) return html.slice(mo + 1, m.index)
    }
    return html.slice(mo + 1)
  }

  let paneCoChart = 0
  // FR-041 lượt 2 · dòng chảy còn HAI pane thời gian (ngày · tháng); dấu
  // chart đổi theo hình mới (cột `.ct`, đường vùng `.sl`).
  for (const [moc, dauChart] of [["kf-ngay", "cot"], ["kf-thang", "sl-"]]) {
    const o = trongMoc(kho, moc)
    ok(o !== null, `mốc \`${moc}\` có trên trang`)
    if (o === null) continue
    const coChart = o.includes(dauChart)
    if (coChart) paneCoChart++
    // Chữ THẬT bên trong mốc — bỏ hết thẻ rồi xem còn ký tự nào không.
    const coChu = o.replace(/<[^>]*>/g, "").trim().length > 0
    ok(coChart || coChu, `\`${moc}\` được lấp: biểu đồ hoặc câu nói rõ đang trống`,
       "mốc TRẮNG là thứ người dùng đọc ra như hỏng — khác hẳn 'chưa có dữ liệu'")
  }

  /*
   * 2 · HAI VÒNG KHÔNG ĐƯỢC TRỘN — phép kiểm quan trọng nhất của mục này.
   *
   * `shell.html` là CHUNG cho mọi trang, nên markup vòng xoay của Trang chủ và
   * của Kho sống trong CÙNG một file và cùng lên mọi trang. Nếu vòng của Kho
   * dùng lại `data-pane`/`data-tab` thì `querySelectorAll` gom cả hai thành một
   * tập: bấm tab ở Kho đổi pane ở Trang chủ.
   *
   * Lỗi đó KHÔNG hiện ra ở màn Kho — nó hiện ở Trang chủ, nên người sửa sẽ đi
   * tìm ở đúng chỗ không có gì sai.
   *
   * Tiền đề đo trên `shell.html` chứ KHÔNG trên trang đã build: pane của Trang
   * chủ do dữ liệu sinh ra, nên kho rỗng là trang không có `data-pane` nào —
   * và lúc đó một tiền đề đọc trang sẽ tự sai trong khi luật vẫn cần canh.
   */
  // Vòng Trang chủ do EMITTER in ra (`index.ts`), vòng Kho nằm trong `shell.html`.
  // Cả hai đi vào CÙNG một trang, nên tên thuộc tính phải khác nhau.
  ok(/data-pane=/.test(emit) && /data-kpane=/.test(shell),
     "vòng Trang chủ (emitter) và vòng Kho (shell) cùng lên một trang",
     "nếu một vòng đã đi chỗ khác thì đọc lại mục này, đừng bỏ")
  const khoiK = mo.slice(mo.indexOf("function veKPane("), mo.indexOf("// ── Nối vào trang"))
  ok(khoiK.length > 0, "tìm được `veKPane`")
  ok(/\[data-kpane\]/.test(khoiK) && /\[data-ktab\]/.test(khoiK),
     "`veKPane` chỉ chọn `[data-kpane]`/`[data-ktab]`")
  ok(!/\[data-pane\]|\[data-tab\]/.test(khoiK),
     "`veKPane` KHÔNG chạm vào `[data-pane]`/`[data-tab]` của Trang chủ",
     "trộn hai tập là bấm ở màn này đổi màn kia")

  // 3 · Ba chốt của mọi vòng tự chuyển (ui_guide §5) — giống hai vòng đã có.
  ok(/treoKPane/.test(mo), "có cờ treo riêng cho vùng này")
  ok(/mouseenter[\s\S]{0,80}treoKPane\s*=\s*true/.test(mo), "chuột vào thì DỪNG")
  ok(/!treoKPane\s*&&\s*!document\.hidden/.test(mo),
     "tab ẩn thì không chạy — không đốt CPU sau lưng người dùng")
  ok(/if \(!reduced\)[\s\S]*hKPane\s*=/.test(mo) || /!reduced/.test(mo),
     "`reduced-motion` thì không lập vòng")
  ok(/clearInterval\(hKPane\)/.test(mo), "gỡ interval khi rời trang — không rò")

  // 4 · Cơ sở đếm phải KHAI ở từng pane: panel `.pt3` bên trên đếm `appr` ở hai
  // mục đầu, khối này đếm cả kho. Hai khối cạnh nhau khác mẫu số mà không nói
  // ra thì người đọc cộng ngang qua chúng.
  ok((kho.match(/class="kf-n"/g) ?? []).length >= paneCoChart,
     `${paneCoChart} pane có biểu đồ, và mỗi cái khai cơ sở đếm của mình`,
     "biểu đồ không khai mẫu số là biểu đồ đọc ra được nhiều nghĩa")
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · các màn đồng bộ thang, dải nói sự thật riêng, 3D đúng chỗ, " +
            "Chờ duyệt đã gộp vào Kho, dòng chảy kho có vòng riêng\n")
