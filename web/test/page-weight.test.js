#!/usr/bin/env node
/**
 * Trang phải NHẸ và có giới hạn số thẻ.
 *
 * Người dùng hỏi: *"phần số lượng bài có giới hạn không? khi nhiều bài là có
 * vấn đề về UI đấy"*. Đo thật trên bản 13 bản ghi: mỗi thẻ ~2379 byte HTML.
 *
 *    50 bản ghi →  172 KB
 *   200 bản ghi →  520 KB
 *   500 bản ghi → 1217 KB   trang không dùng được
 *
 * Hai sửa: CSS/JS tách ra file (86 KB → 22 KB mỗi trang), màn Tất cả phân
 * trang 24 thẻ. Test này canh cả hai không tụt lại.
 *
 * FR-034/C5 · nguồn đo đổi từ output build Quartz sang renderTrang/taiSan —
 * mọi ngưỡng và luận cứ giữ nguyên. Kho 120 bản giờ là DATA DỰNG TAY đưa
 * thẳng vào renderTrang (không cần ghi đĩa): chính vì thế phép kiểm phân
 * trang giờ đo được THẬT — bản build cũ có regex phân trang không bao giờ
 * khớp (no-op), 120 bản vẫn ra một trang, và không ai thấy.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { napRender, tatCaTrang, trangHtml, taiSan, maFeNguon } from "./_render.mjs"
// TRẦN đọc từ MỘT nguồn. Con số này từng sống ở 11 file, và nới một trần
// (`FR-074`) làm 8 cổng đỏ cùng lúc — không cổng nào đỏ vì hệ sai.
import { TRAN_KB } from "./_tran.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const ROOT = join(TEST, "..", "..")

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// ── dựng data 120 bản ghi từ contract (hình dạng Ban của web/render) ──────
const contract = JSON.parse(
  readFileSync(join(ROOT, "05_uiux", "contracts", "analyses.sample.v5.json"), "utf8"))
const SO_BAN = 120

const bans = []
for (let i = 0; i < SO_BAN; i++) {
  const r = { ...contract.analyses[i % contract.analyses.length] }
  bans.push({
    slug: `${r.source_type}/bai-${String(i).padStart(3, "0")}`,
    id: `src_w${String(i).padStart(4, "0")}`,
    title: `Bài thử số ${i}`,
    priority: 0,
    credibility_max: String(r.credibility_max ?? ""),
    origin: String(r.origin ?? "manual"),
    source_type: String(r.source_type),
    review_status: String(r.review_status),
    analyzed_at: String(r.analyzed_at ?? ""),
    one_liner: String(r.one_liner ?? ""),
    concepts: [], concepts_proposed: [], category: [],
    // url RIÊNG từng bản — trùng là tinhChiMuc gộp và 120 bản co lại
    url_normalized: `https://example.com/w/${i}`,
    than: "## 1. Bối cảnh\n\nx\n",
  })
}
const data120 = { bans, concepts: [], categories: [], hong: [], mock: true }

const m = await napRender()
const TAI_SAN = await taiSan()
/*
 * SO THEO BYTE, HIEN THEO KB.
 *
 * `kb()` lam tron, nen mot bundle 100.499 KB ra `100` va `100 <= 100` CHO
 * QUA — cong im lang nhuong toi **511 byte** qua tran danh nghia. Tren mot
 * tripwire ma du an noi ro *"SIET, khong noi"* (FR-027f) thi 511 byte nhuong
 * lang le la mot nua lan noi tran ma khong ai quyet.
 *
 * `kb()` giu nguyen — cau bao cho NGUOI doc phai la KB. Chi phep SO doi.
 */
const byte = (s) => Buffer.byteLength(s, "utf8")
const kb = (s) => Math.round(byte(s) / 1024)
const duoiTran = (s, tranKb) => byte(s) <= tranKb * 1024

console.log(`\nCSS và JS phải tách ra file — cache được\n`)

for (const [f, than] of [["gn.css", TAI_SAN.gnCss], ["gn.js", TAI_SAN.gnJs]]) {
  ok(than.length > 0, `mock/${f} tồn tại`,
    "nhúng vào HTML thì lặp ở mọi trang, không cache được")
}

const home = await trangHtml("trang-chu")
ok(!home.includes("<style>"), "HTML không nhúng <style>",
  "CSS 46KB nhúng vào mỗi trang là 8×46KB lặp lại")
ok(home.includes("gn.css") && home.includes("gn.js"), "HTML trỏ tới file ngoài")

// TRẦN CHO CHÍNH BUNDLE — lỗ hổng tìm ra 2026-08-24 (FR-027).
//
// Test này canh "CSS phải TÁCH ra file" từ đầu, nhưng KHÔNG ai canh file đó
// nặng bao nhiêu. Hệ quả đo được: comment ở đầu file nói 86 KB, `css-applied`
// nói 46 KB, thực tế `gn.css` đã **118 KB** — phình 2.4× mà không phép kiểm
// nào đỏ. Tách file cứu được phần LẶP; nó không cứu được phần PHÌNH.
//
// FR-027f · gn.css 160 → **100**. SIẾT, không nới. Trần 160 được canh khi bundle
// còn cõng **58 KB bình luận** (36% — đo được); giờ comment bị cắt lúc gộp nên
// bundle là 83 KB. Giữ 160 nghĩa là tripwire chỉ nổ khi CSS tăng GẤP ĐÔI — tức
// nó thôi làm tripwire. 100 cho ~20% dư: đủ cho CSS của các màn còn lại, mà vẫn
// nổ khi có ai nhúng lại hoặc thêm một bộ luật trùng.
/*
 * RANG TU CHUNG MINH — day khong phai suy luan, day la phep tinh.
 *
 * Dung mot chuoi dai DUNG 100.499 KB roi hoi ca hai phep so. Neu ban cu
 * (`Math.round(...) <= tran`) cho qua ma ban moi chan, thi con so hien ra
 * chinh la so byte cong nay tung im lang nhuong.
 */
{
  const TRAN = 100
  const qua = 'x'.repeat(Math.floor(100.4999 * 1024))
  ok(Math.round(byte(qua) / 1024) <= TRAN && !duoiTran(qua, TRAN),
    `phép so CŨ nhường ${byte(qua) - TRAN * 1024} byte quá trần; phép so MỚI chặn`,
    'hai phép cho cùng kết quả ⇒ hoặc lỗ không tồn tại, hoặc tôi đo sai — '
    + 'đừng sửa mã, hãy sửa phép đo này trước')
  const vua = 'x'.repeat(TRAN * 1024)
  ok(duoiTran(vua, TRAN),
    '  và phép so MỚI không chặn oan một file ĐÚNG BẰNG trần',
    'chặn cả file đúng bằng trần là siết quá tay, không phải siết')
}

/*
 * FR-068 (2026-09-06) · `gn.css` 100 → 102 KB. `gn.js` KHÔNG đổi.
 *
 * Đảo một vế của `FR-061 §3` ("bundle CHUNG giữ nguyên 102400"). Lý do: hệ
 * màu trạng thái của `T03-120` sống ở THẺ trong lưới, mà thẻ do máy dựng
 * trang vẽ — không chunk nào chở nó được. Đo lúc mở FR: 102382/102400, còn
 * 18 byte, tức không đủ cho một dòng.
 *
 * +2 KB chứ không +380 "vừa đủ": một trần chạm đúng vào mặt mình là một trần
 * sẽ vỡ ở đơn vị kế tiếp, và mỗi lần vỡ tốn một FR. Nợ giảm béo `FR-061 §4`
 * KHÔNG được tick bởi FR này.
 */
// MOT nguon cho hai phep kiem. Truoc 2026-09-07 con so 102 (FR-068 noi tran
// `gn.css`) chi song o day, con cong thuc tran TRANG duoi kia go cung
// `100 + 100`. Nen `gn.css` hop le o 102 KB lam MOI trang do — moi trang, cung
// mot luc, vi mot ly do khong nam o trang nao. Do dung lop loi "hai so cho mot
// thu" ma ca du an nay canh o cho khac.
// FR-074 (chu du an duyet 2026-09-08) · css 102 -> 104, js 100 -> 102.
// +2 KB moi bundle, khong +250 "vua du": FR-068 da ghi ly le ay — mot tran
// cham dung vao mat minh la mot tran se vo o don vi ke tiep. Hom mo FR nay
// `gn.css` con DUNG 9 byte, tuc no dang o dung cai mat ay.
//
// No CHUA tick `FR-061 §4` (giam beo bundle). Ba lan noi lien tiep
// (FR-061 -> FR-068 -> FR-074) la mot tin hieu: duong dung la DOI VAO CHUNK.
// (khai o `_tran.mjs` — mot nguon cho moi cong)
for (const [f, than, tran] of [["gn.css", TAI_SAN.gnCss, TRAN_KB.css],
                               ["gn.js", TAI_SAN.gnJs, TRAN_KB.js]]) {
  const n = kb(than)
  ok(duoiTran(than, tran),
    `${f} ${n} KB (${byte(than)} / ${tran * 1024} byte)`,
    "tách file cứu phần LẶP, không cứu phần PHÌNH — lần tải đầu vẫn phải chờ")
}

/*
 * T03-102 · TRẦN CHO TỔNG BYTE ĐƯỜNG TẢI ĐẦU CỦA TỪNG TRANG.
 *
 * Vì sao phép đo này phải tồn tại: từ khi có **chunk theo màn**, ba trần
 * từng-file ở trên KHÔNG còn bao được tổng. Chuyển 8 KB từ `gn.js` sang một
 * chunk làm cả ba con số kia xuống, trong khi trang nạp chunk đó **không nhẹ
 * đi một byte nào**. Tức tách bundle sẽ thành cách LÁCH chính thước đo này —
 * và nó lách được mà không ai nói dối một câu nào.
 *
 * ⇒ Đo thứ người dùng thật sự chờ: `HTML + gn.css + gn.js + mọi chunk mà CHÍNH
 * TRANG ĐÓ xin`. Danh sách chunk **đọc từ HTML đã render**, không từ một bảng
 * khai thứ hai — bảng thứ hai là chỗ nó lệch, và lệch theo chiều nói ít hơn
 * thật thì cổng xanh oan.
 *
 * TRẦN KHÔNG phải "số hiện tại + một khoảng" — nó DẪN XUẤT từ những trần ĐÃ
 * DUYỆT: `gn.css` 100 + `gn.js` 100 + trần HTML CỦA CHÍNH TRANG ĐÓ. Nói cách
 * khác: một trang được phép nặng đúng bằng thứ ba trần kia đã cho phép, và
 * chunk phải nằm TRONG đó chứ không cộng thêm ngoài.
 *
 * ⚠️ Trần HTML **không phải một số**: trang chủ 60 KB, các trang khác 74 KB
 * (hai con số đã duyệt, đo ở hai phép kiểm dưới). Bản đầu của mục này lấy 60
 * cho MỌI trang và đỏ oan ngay ở `bai-viet/nap` — trang vốn đã được cho 74.
 *
 * ═══ FR-061 (2026-09-04) · TRANG CÓ CHUNK được cộng thêm ═══════════════════
 *
 * Trần một trang nay = `100 + 100 + <trần HTML>` **cộng** kích thước chunk nó
 * xin **cộng `DU_MAN`**. Chủ dự án chọn nới (*"chọn b → nới trần ra"*) sau khi
 * đo: `/chung-cat/nhap/` còn **155 byte** trong khi `T03-110` cần ~600-900
 * byte CSS cho pipeline stepper, và thứ duy nhất còn cắt được ở task đó là vế
 * `prefers-reduced-motion` — task cấm đúng điều đó, đúng.
 *
 * ⚠️ RĂNG KHÔNG MẤT, và đây là chỗ dễ đọc sai: cộng **đúng bằng** chunk nghĩa
 * là tách một khối sang chunk **KHÔNG tự mua thêm chỗ** — chunk to lên thì
 * trần to lên đúng bằng nó, nên phép *"tách để lách thước đo"* mà `assets.mjs`
 * cảnh báo vẫn bị chặn y như trước. Thứ THẬT SỰ được nới là `DU_MAN`, và nó là
 * MỘT con số phải quyết bằng tay.
 *
 * `DU_MAN` = 4 KB: `T03-110` ước 600-900 byte CSS + ~2 KB JS ⇒ còn dư cho một
 * đơn vị nữa, KHÔNG dư cho mười. Nới nó lần sau là một FR nữa — cố ý.
 *
 * `gn.css`/`gn.js` **giữ 102400**: đó là bundle CHUNG, nới nó là nới cho mọi
 * trang kể cả trang đọc. `FR-027f` (*"SIẾT, không nới"*) còn nguyên ở đó.
 */
const DU_MAN = 4 * 1024
{
  const cssJs = byte(TAI_SAN.gnCss) + byte(TAI_SAN.gnJs)
  const nang = []
  for (const [ten, html] of await tatCaTrang()) {
    // Chunk mà chính trang này xin — đọc từ thẻ script ĐÃ RENDER, không từ một
    // bảng khai thứ hai: bảng thứ hai là chỗ nó lệch, và lệch theo chiều nói ít
    // hơn thật thì cổng xanh oan.
    const xin = [...html.matchAll(/gn-([a-z0-9-]+)\.js\?/g)].map((x) => x[1])
    const byteChunk = xin.reduce((a, k) => a + byte(TAI_SAN.gnChunk(k) ?? ""), 0)
    const tranHtml = ten === "index.html" || ten === "mock/index.html" ? 60 : 74
    // Cộng chunk vào CẢ HAI vế: vào tổng (byte thật tới trình duyệt) và vào
    // trần (FR-061). Chỉ cộng vào một vế là hoặc mất răng, hoặc đỏ oan.
    // Doc `TRAN_KB` — KHONG go lai `100 + 100`. Neu mai FR nao noi tran mot
    // bundle, cong thuc nay theo ngay, va khong co mot ngay nao ma tung file
    // hop le trong khi moi trang bao do.
    const tran = (TRAN_KB.css + TRAN_KB.js + tranHtml) * 1024
      + (byteChunk ? byteChunk + DU_MAN : 0)
    nang.push([ten, byte(html) + cssJs + byteChunk, xin, tran])
  }
  const vuot = nang.filter(([, tong, , tran]) => tong > tran)
  nang.sort((a, b) => b[1] - a[1])
  const [tenNang, tongNang, xinNang, tranNang] = nang[0]
  ok(vuot.length === 0,
    `tải đầu nặng nhất ${Math.round(tongNang / 1024)} KB — ${tenNang}`
    + ` (${tongNang} / ${tranNang} byte`
    + (xinNang.length ? `, kèm chunk ${xinNang.join(" + ")}` : ", không chunk") + ")",
    `vượt trần: ${vuot.map(([t, s, , r]) => `${t} ${s}/${r}`).join(" · ")} — `
    + "tách bundle KHÔNG cứu được: byte vẫn tới trình duyệt trong cùng một lần tải")

  /*
   * Và chunk phải THẬT SỰ **không đi theo MỌI trang**. Không có phép này thì
   * một thẻ `<script>` chunk lỡ đặt vào shell sẽ đi theo mọi trang, mà tổng
   * của từng trang vẫn có thể còn dưới trần — cổng xanh trong khi ý nghĩa của
   * việc tách đã mất hẳn.
   *
   * ⚠️ Phép đếm ĐỔI 2026-09-04: bản đầu đòi **đúng MỘT màn** xin chunk, và nó
   * đỏ oan ngay ở `T03-95` — trang chủ xin `chungcat` cho khối ba số, một lần
   * xin CÓ LÝ (khối đó là dữ liệu của chưng cất, và tổng của `/` vẫn dưới
   * trần). Tính chất cần giữ không phải "một màn", mà là "còn màn KHÔNG xin".
   *
   * Đếm theo MÀN, không theo trang: `tatCaTrang()` trả cả bản real và bản
   * `mock/` của cùng một màn, nên đếm trang cho ra số gấp đôi.
   */
  const man = new Set(nang.map(([ten]) => ten.replace(/^mock\//, "")))

  /*
   * ĐO TỪNG CHUNK, không đếm gộp. Bản đầu đếm *"bao nhiêu MÀN xin chunk"* —
   * con số đó không phân biệt được ba chunk mỗi cái một màn với một chunk ba
   * màn, và nó KHÔNG thấy một chunk **khai mà không trang nào xin**: mã chết
   * nằm trong repo, build ra, rồi không ai tải.
   *
   * Hai vế cho mỗi chunk:
   *   ≥1 màn xin   ⇒ chunk còn sống
   *   < mọi màn xin ⇒ việc tách còn nghĩa (nếu mọi trang đều xin thì nó nên
   *                   nằm trong bundle chung ngay từ đầu)
   */
  const theoChunk = new Map()
  for (const [ten, , xin] of nang) {
    for (const k of xin) {
      if (!theoChunk.has(k)) theoChunk.set(k, new Set())
      theoChunk.get(k).add(ten.replace(/^mock\//, ""))
    }
  }
  const khai = TAI_SAN.tenChunk ?? [...theoChunk.keys()]
  /*
   * Có HAI cách một chunk được nạp, và mệnh đề "sống" phải nhận cả hai:
   *
   *   thẻ `<script>` của một màn  — `trang.mjs` phát, đo bằng `theoChunk`
   *   nạp THEO YÊU CẦU từ FE      — `document.createElement("script")` lúc bấm
   *
   * Bản đầu chỉ đếm cách một, nên `cctab` (tab Chưng cất, nạp lúc bấm) bị tố
   * *"mã chết"* trong khi nó là mã sống nhất — chỉ không sống trên đường tải
   * đầu. Vế còn răng: chunk theo-yêu-cầu phải THẬT SỰ có người nạp trong nguồn
   * FE, và **không** trang nào được phát thẻ cho nó (phát thẻ = nó lại vào
   * đường tải đầu, tức trần đã bị lách).
   */
  const MA_FE = maFeNguon(".ts")
  for (const k of khai) {
    const xinK = theoChunk.get(k) ?? new Set()
    if (TAI_SAN.chunkTheoYeuCau?.includes(k)) {
      ok(MA_FE.includes(`/gn-${k}.js`) && xinK.size === 0,
        `chunk \`${k}\`: nạp THEO YÊU CẦU — có người nạp trong nguồn FE, 0 màn phát thẻ`,
        !MA_FE.includes(`/gn-${k}.js`)
          ? `khai theo-yêu-cầu nhưng KHÔNG nguồn FE nào nạp \`/gn-${k}.js\` ⇒ mã chết`
          : `${xinK.size} màn phát thẻ cho \`${k}\` ⇒ nó đã vào đường tải đầu, `
            + "tức trần bị lách chứ không phải nạp theo yêu cầu")
      continue
    }
    ok(xinK.size >= 1 && xinK.size < man.size,
      `chunk \`${k}\`: ${xinK.size}/${man.size} màn xin — sống, và không đi theo mọi trang`,
      xinK.size === 0
        ? `KHÔNG trang nào xin \`gn-${k}.js\` ⇒ mã chết: build ra rồi không ai tải`
        : `MỌI màn đều xin \`${k}\` ⇒ nó nên nằm trong bundle chung`)
  }
}

console.log(`\nTrang phải nhẹ — đo thật, không ước\n`)

// Ngưỡng 48 chứ không phải 40 (FR-016). Shell giờ mang cả SCR-04 bàn biên tập
// — form 14 trường kèm mô tả từng trường — và shell lặp ở MỌI trang. Đó là NỘI
// DUNG người dùng yêu cầu, không phải phình.
//
// Vì sao vẫn giữ một ngưỡng: lỗi mà test này sinh ra để bắt là CSS/JS bị nhúng
// lại vào HTML — hồi đó 86 KB/trang. Cách xa 48 nên tripwire vẫn nổ đúng lúc,
// mà không đỏ mỗi lần thêm một câu mô tả.
// FR-027e · 48 → 60 KB. Cùng lý lẽ đã dùng khi nâng 40→48: đó là **NỘI DUNG
// người dùng yêu cầu**, không phải phình (3 tin nổi bật xếp chồng + 9 ô số
// liệu + khối 3D + 3 pane biểu đồ). 60 vẫn CÁCH XA 86 nên tripwire còn nổ.
const nTrangChu = kb(home)
ok(duoiTran(home, 60),
  `trang chủ ${nTrangChu} KB (${byte(home)} / ${60 * 1024} byte)`,
  "CSS/JS đã tách rồi mà vẫn nặng ⇒ có gì đó nhúng lại")

/**
 * FR-027f · TRẦN CHO TRANG LỚN NHẤT — trước đây KHÔNG có.
 *
 * Lỗ đo được: chỉ `mock/index.html` bị canh. Trang lớn nhất site là
 * `mock/nap/` (66 KB — nó mang thêm form viết bài 14 KB) và **không ai canh nó**.
 * Mà chính nó là nơi lỗi "CSS/JS bị nhúng lại" sẽ hiện ra sớm nhất.
 *
 * Vì sao MỌI trang mang cả 6 màn: `doiView()` đổi màn **client-side** (bỏ `.on`
 * khỏi mọi `.view`, gắn vào `#v-<tên>`), nên thiếu một màn là đổi sang nó bị
 * trắng. Đó là đánh đổi đã chọn — đổi màn không cần mạng — không phải phình.
 *
 * 74 vẫn cách xa **86**, con số hồi CSS/JS còn nhúng trong HTML.
 */
const TRAN_MAX = 74
// Sap theo BYTE: sap theo KB da lam tron thi hai trang lech 400 byte co the
// doi cho nhau, va cau loi se chi sai ten trang nang nhat.
const moiTrang = [...(await tatCaTrang())].map(([t, h]) => [t, byte(h)])
moiTrang.sort((a, b) => b[1] - a[1])
const [tenMax, byteMax] = moiTrang[0] ?? ["(không có)", 0]
ok(byteMax <= TRAN_MAX * 1024,
  `trang lớn nhất ${Math.round(byteMax / 1024)} KB — /${tenMax} `
  + `(${byteMax} / ${TRAN_MAX * 1024} byte)`,
  `${moiTrang.length} trang; nặng nhất vượt trần ⇒ có gì đó nhúng lại hoặc một màn phình`)

console.log(`\nMàn Tất cả phải PHÂN TRANG — ${SO_BAN} bản ghi\n`)

// Kiểm ngưỡng khai trong code thay vì đoán — nguồn sống là web/render/trang.mjs.
const src = readFileSync(join(TEST, "..", "render", "trang.mjs"), "utf8")
const nguong = Number((src.match(/moiTrang:\s*(\d+)/) ?? [])[1] ?? 0)

ok(nguong > 0, `ngưỡng phân trang khai trong code: ${nguong} thẻ/trang`,
  "không khai ngưỡng ⇒ 500 bản ghi thành một trang 1.2MB")
ok(nguong <= 50, `ngưỡng ${nguong} đủ nhỏ`, "trên 50 thẻ thì cuộn quá dài")

// Đo trên TRANG RENDER THẬT với 120 bản: trang 1 đúng `nguong` thẻ, nav khai
// đúng tổng số trang, và trang cuối mang phần dư. Trước C5 phép kiểm này chỉ
// đếm THƯ MỤC build ra — mà emitter có regex no-op nên nó chưa bao giờ đo
// được việc CẮT.
const soTrangMong = Math.ceil(SO_BAN / nguong)
/*
 * Đếm thẻ TRONG lưới của màn Tổng hợp — cắt tới `<div class="view"` KẾ TIẾP,
 * không cắt tới `</main>`.
 *
 * Bản cũ cắt tới `</main>` và điều đó ĐÚNG khi `v-all` là view cuối trước
 * `v-nap`. FR-038/C5 chèn ba màn loại vào giữa, nên lát cắt ấy nuốt luôn lưới
 * của cả ba: kho 120 bản đọc ra 144 thẻ thay vì 24 — con số vừa đo được.
 *
 * Đây đúng lớp lỗi `#acount` (BUG-2): một phép đo lấy phạm vi CẢ TRANG trong khi
 * cái nó nói tới là MỘT vùng. Nó đúng cho tới hôm có vùng thứ hai.
 */
const demThe = (h) => {
  const i = h.indexOf('id="grid2"')
  if (i < 0) return -1
  const ke = h.indexOf('<div class="view"', i)
  const cuoi = h.indexOf("</main>", i)
  return (h.slice(i, ke >= 0 && (cuoi < 0 || ke < cuoi) ? ke : cuoi)
    .match(/class="cd /g) ?? []).length
}
const p1 = m.renderTrang("tat-ca", data120)
ok(demThe(p1) === nguong, `trang 1 có đúng ${nguong} thẻ (được ${demThe(p1)})`,
  "quá ngưỡng là phân trang không cắt — đúng no-op mà bản build cũ mang")
const mNav = p1.match(/trang <b>1<\/b> \/ (\d+) · (\d+) bản ghi/)
ok(!!mNav && Number(mNav[1]) === soTrangMong,
  `${SO_BAN} bản ghi ⇒ ${mNav?.[1] ?? "?"} trang`, `mong ${soTrangMong}`)
const pCuoi = m.renderTrang("tat-ca-trang-n", data120, soTrangMong)
ok(demThe(pCuoi) === SO_BAN - (soTrangMong - 1) * nguong,
  `trang cuối mang phần dư ${SO_BAN - (soTrangMong - 1) * nguong} thẻ (được ${demThe(pCuoi)})`)

console.log(`\nNgưỡng trang chủ phải khai một chỗ\n`)

for (const k of ["noiBat", "moi", "luoi", "moiTrang"]) {
  ok(new RegExp(`${k}:\\s*\\d+`).test(src), `NGUONG.${k} khai trong code`)
}
// Không được rải số cứng: slice(1, 3) thay vì slice(1, NGUONG.noiBat)
//
// QUÉT MÃ, KHÔNG QUÉT COMMENT. Bản trước quét nguyên văn nguồn, nên một dòng
// giải thích nhắc lại cách cắt cũ (để nói vì sao nó bị bỏ) làm cổng đỏ. Cổng
// báo động giả là cổng sẽ bị tắt — và ở đây nó còn dạy người ta ĐỪNG VIẾT chú
// thích về đoạn mã vừa sửa, tức phạt đúng thứ đáng khuyến khích.
//
// Bóc comment không làm cổng yếu đi: một `.slice(1, 3)` nằm trong comment thì
// không chạy, nên nó chưa bao giờ là thứ cổng này cần bắt.
const srcMa = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
const sliceCung = [...srcMa.matchAll(/\.slice\((\d+),\s*(\d+)\)/g)]
ok(sliceCung.length === 0, "không slice() số cứng nào",
  `còn ${sliceCung.map((m2) => m2[0]).join(" ")} — sửa ngưỡng phải sửa nhiều chỗ`)

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · CSS/JS tách file, trang nhẹ, màn Tất cả có phân trang")
