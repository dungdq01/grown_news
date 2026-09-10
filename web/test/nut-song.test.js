#!/usr/bin/env node
/**
 * NÚT SỐNG — mỗi nút phải TỚI được một nhánh xử lý, và "đang xem mục nào" không
 * được lẫn với "đang đọc bản nào".
 *
 * ═══ HAI BUG THẬT, người dùng báo cùng một câu: "nút loại không hoạt động" ═══
 *
 * 1 · `cur` MANG HAI NGHĨA. `tai()` đặt nó là chỉ số BẢN (`bans[cur]`); `dongBo()`
 *   — chạy mỗi lần cuộn thân bài — ghi đè bằng chỉ số MỤC H2, đúng con số
 *   "03 / 09" ở chân cửa sổ. Cuộn tới mục 3 ⇒ `bans[2] === undefined` ⇒ cả bốn
 *   nút biên tập `return` KHÔNG NÓI GÌ.
 *
 *   Bài một bản + đứng ở mục 1 thì hai nghĩa trùng nhau ⇒ mọi phép thử tay đều
 *   xanh. Bug chỉ hiện khi người ta CUỘN — tức khi người ta thật sự đọc bài.
 *
 * 2 · `.bk-f button` LẤY THEO VỊ TRÍ. Sau khi chân cửa sổ tách hai hàng, `.bk-f`
 *   chứa cả hàng nút biên tập, nên `f[0]` là nút **Loại**: `f[0].disabled =
 *   (muc === 0)` khoá đúng nút Loại ở mục 1, `f[1]` khoá nút Sửa ở mục cuối, còn
 *   ‹trước/tiếp› không bao giờ bị khoá.
 *
 * ═══ VÌ SAO 44 FILE TEST CŨ KHÔNG BẮT ═══════════════════════════════════════
 * Chúng kiểm API (đúng), kiểm markup có nút (có), kiểm đường FE khớp route
 * (khớp). Không file nào hỏi *"bấm cái nút này thì tới ĐÂU"* — và cả hai bug
 * nằm đúng ở đó. `duong-api-khop-route` là cái gần nhất, nhưng nó đo ĐƯỜNG chứ
 * không đo có ai gọi tới đường đó không.
 *
 * Dự án không có trình duyệt headless, nên phép kiểm này KHÔNG mô phỏng cú bấm.
 * Nó đo cấu trúc — và nói rõ giới hạn đó ở §4.
 */
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { GOC, taoKiem } from "./_api.mjs"
import { tatCaTrang, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const { ok, chot } = taoKiem()

// FR-034/C5 · nguồn đổi từ output build sang renderTrang/taiSan — assertion
// giữ nguyên. Gom mọi trang render (real từ kho tạm + mock) — nút được vẽ ở
// cả HTML lẫn JS.
const js = (await taiSan()).gnJs
const trang = [...(await tatCaTrang()).values()]
const hoa = js + trang.join("")

// ─── §1 · MỌI `data-act` ĐƯỢC VẼ ĐỀU CÓ NHÁNH — VÀ NGƯỢC LẠI ────────────────
// Hai chiều, vì hai chiều là hai bệnh khác nhau:
//   vẽ mà không xử  = nút chết, người dùng bấm không ra gì  ← bệnh đang chữa
//   xử mà không vẽ  = nhánh mồ côi, và nó GIẤU việc nút đã bị xoá khỏi giao diện
const ve = new Set([...hoa.matchAll(/data-act=["']([a-z-]+)["']/g)].map((m) => m[1]))
// `\s*` quanh `===`: bundle đi qua `minifyWhitespace` (`WO-057`) nên
// `act === "dang"` thành `act==="dang"`. Neo có khoảng trắng cứng làm cổng này
// báo MỌI nút là chết — đỏ toàn tập vì một lý do không liên quan tới nút nào,
// và đó là kiểu đỏ dạy người ta bỏ qua màu đỏ.
const xu = new Set([...js.matchAll(/act\s*===\s*["']([a-z-]+)["']/g)].map((m) => m[1]))
ok(ve.size >= 10, `tìm thấy ${ve.size} loại nút \`data-act\` trong trang đã build`,
   "quá ít — có thể regex không khớp markup nữa, phép kiểm sẽ xanh vô căn cứ")
const chet = [...ve].filter((a) => !xu.has(a)).sort()
ok(chet.length === 0, "không nút `data-act` nào thiếu nhánh xử lý",
   chet.length ? `nút CHẾT: ${chet.join(" · ")}` : "")
const moCoi = [...xu].filter((a) => !ve.has(a)).sort()
ok(moCoi.length === 0, "không nhánh xử lý nào mồ côi",
   moCoi.length ? `nhánh không có nút: ${moCoi.join(" · ")}` : "")

// ─── §2 · `cur` (BẢN) KHÔNG LẪN VỚI `muc` (MỤC H2) ──────────────────────────
ok(/\.muc\s*=/.test(js), "bundle có trường `muc` riêng cho chỉ số mục",
   "không có `muc` ⇒ chỉ số mục lại đang ghi vào `cur` ⇒ bốn nút chết khi cuộn")

// Hàm vẽ số trang phải ghi `muc`, và KHÔNG được ghi `cur`. Cắt thân hàm bằng
// mốc riêng của nó (`" / "` — chuỗi dựng "03 / 09") rồi soi quanh đó.
const iPg = js.indexOf('" / "')
ok(iPg > 0, "tìm được chỗ dựng số trang `nn / mm`")
if (iPg > 0) {
  const quanh = js.slice(Math.max(0, iPg - 1200), iPg + 600)
  ok(/\.muc\s*=/.test(quanh), "chỗ dựng số trang ghi vào `muc`")
  ok(!/\.cur\s*=/.test(quanh), "chỗ dựng số trang KHÔNG ghi vào `cur`",
     "đây CHÍNH LÀ bug: cuộn bài ghi chỉ số mục vào `cur` ⇒ `bans[cur]` rỗng")
}

// Phép đọc bản phải nằm ở MỘT chỗ. Nhiều chỗ đọc `bans[...cur]` nghĩa là lần sau
// sửa một chỗ và quên ba chỗ — đúng cách bug này sống qua hai lượt sửa.
const soDoc = (js.match(/\.bans\[\s*[a-zA-Z_$][\w$]*\.cur\s*\]/g) ?? []).length
ok(soDoc === 1, `chỉ MỘT chỗ đọc \`bans[…cur]\` (thấy ${soDoc})`,
   "gom về một helper, và helper đó phải KÊU khi không có bản")

// Và nó phải kêu, không được `return` im lặng — im lặng là thứ làm bug vô hình.
const iH = js.indexOf("function banDangDoc")
ok(iH > 0, "có helper `banDangDoc`")
if (iH > 0) {
  ok(/bao\(\s*true/.test(js.slice(iH, iH + 500)),
     "`banDangDoc` BÁO LỖI khi không xác định được bản",
     "trả `null` im lặng ⇒ người dùng bấm nút và không có gì xảy ra, không lời nào")
}

// ─── §3 · KHÔNG KHOÁ NÚT THEO VỊ TRÍ TRONG `.bk-f` ──────────────────────────
// `.bk-f` chứa hàng nút biên tập TRƯỚC hàng meta, nên chỉ số vị trí đo cấu trúc
// DOM chứ không đo điều nó muốn nói — và nó âm thầm đổi nghĩa khi thêm một nút.
ok(!/querySelectorAll\([^)]*\.bk-f button/.test(js),
   "không ai lấy nút chân cửa sổ theo `.bk-f button` rồi đánh số",
   "`f[0]` là nút Loại, không phải ‹trước — dòng đó khoá đúng nút người dùng cần")
ok(/\[data-act=["']prev["']\]/.test(js) && /\[data-act=["']next["']\]/.test(js),
   "‹trước/tiếp› được chọn theo `data-act`, không theo vị trí")

// ─── §4 · GIỚI HẠN, nói ra để không ai tin quá ──────────────────────────────
// Phép kiểm này đo CẤU TRÚC, không bấm nút thật. Nó bắt được: nút không có
// nhánh, trạng thái lẫn nghĩa, chỉ số theo vị trí. Nó KHÔNG bắt được: nhánh có
// mà làm sai việc, CSS che nút, `pointer-events:none`, lỗi lúc chạy.
// Người chốt vẫn phải bấm thật. Đừng đọc màu xanh này là "mọi nút đều chạy".
ok(true, "§4 · giới hạn đã khai: đây là phép kiểm cấu trúc, không phải cú bấm thật")

// ─── §6 · MỘT BÀI = MỘT THẺ TRONG CÙNG MỘT MOUNT ───────────────────────────
/*
 * `.cd` là một `<button>`, nên thẻ trùng cũng là nút trùng. Người dùng báo:
 * *"cái này bị double bài viết hay sao?"* rồi *"sao 3 bài mà hiển thị 2"* —
 * ba thẻ, hai bài, và ô đếm `#acount` nói 2 ngay cạnh cái lưới có 3.
 *
 * Gốc: `dongBoThe()` lọc trùng bằng `h4.textContent` so với `b.title`. Hai bên
 * dựng tiêu đề bằng hai đường, nên bài KHÔNG có `title` trong frontmatter thì
 * fallback lệch: emitter `fm.title ?? slug` ra "article/thu-realtime" (slug CÓ
 * tiền tố), API `fm.title ?? r.slug` ra "thu-realtime" (slug TRẦN). Chữ khác ⇒
 * không khớp ⇒ chèn thêm thẻ cho bài đã có.
 *
 * Lớp lỗi: "so HÌNH THỨC HIỂN THỊ thay vì so DANH TÍNH" — cùng họ với bug
 * `duongBai` cộng tiền tố hai lần. Cả hai đến từ một khoá được dựng bằng hai
 * công thức mà không ai đối chiếu hai công thức.
 *
 * CỬA SỔ ĐO: theo TỪNG MOUNT, không theo cả trang. Bản đầu của §6a quét cả
 * trang và đỏ oan trên 5 trang — vì cùng một bài xuất hiện ở `#grid` (nổi bật)
 * VÀ `#grid2` (lưới đầy) là ĐÚNG THIẾT KẾ. Đo được: `/mock/` có `grid` 4 thẻ +
 * `grid2` 13 thẻ, không mount nào tự lặp. Một phép kiểm đỏ oan là một phép kiểm
 * sẽ bị tắt.
 */
{
  /*
   * DANH SÁCH MOUNT phải gồm CẢ mount của ba màn loại (FR-038/C5) — và lấy từ
   * bảng khai, không gõ thêm ba tên vào regex.
   *
   * Vì sao: luật gán là *"thẻ thuộc mount CUỐI CÙNG đứng trước nó"*. Một mount
   * không có tên trong danh sách này thì thẻ của nó bị tính cho mount trước đó,
   * và mount trước đó bỗng "lặp slug". Vừa đo được: ba lưới mới nằm sau `grid2`
   * ⇒ `grid2` báo 30 thẻ với 15 slug lặp — **đỏ oan**, mà đỏ oan là loại đỏ sẽ
   * bị tắt.
   *
   * Gõ tay ba tên vào đây thì lần thêm màn sau lại đỏ oan y hệt. Dẫn xuất thì
   * không.
   */
  const idLoai = JSON.parse(readFileSync(
    join(GOC, "core", "assets", "man-hinh.json"), "utf8"))
    .man.filter((m) => m.module).map((m) => `g-${m.id_shell}`)
  const MOUNT = new RegExp(
    `id="(brk|nw|grid|grid2|feat|${idLoai.join("|")})"`, "g")
  let tongThe = 0, tongTrang = 0, xauTieuDe = []
  for (const t of trang) {
    const moc = [...t.matchAll(MOUNT)].map((m) => [m.index, m[1]])
    const the = [...t.matchAll(/<button[^>]*class="cd[^"]*"[^>]*>/g)]
    if (!the.length) continue
    tongThe += the.length; tongTrang++

    // Thẻ thuộc mount nào = mount CUỐI CÙNG đứng trước nó.
    const theo = new Map()
    for (const m of the) {
      const slug = (m[0].match(/data-slug="([^"]*)"/) ?? [])[1] ?? ""
      let ten = "(ngoài mount)"
      for (const [vt, t2] of moc) if (vt < m.index) ten = t2
      if (!theo.has(ten)) theo.set(ten, [])
      theo.get(ten).push(slug)
      // Tiêu đề không được LÀ chính slug có tiền tố: nếu bằng nhau thì fallback
      // tiêu đề đang in ra đường dẫn, và mọi phép so theo chữ sẽ lệch.
      const c = t.slice(m.index, m.index + 900)
      const h4 = ((c.match(/<h4>([\s\S]*?)<\/h4>/) ?? [])[1] ?? "").trim()
      if (slug.includes("/") && h4 === slug) xauTieuDe.push(slug)
    }
    for (const [ten, ds] of theo) {
      const lap = [...new Set(ds.filter((x, i) => x && ds.indexOf(x) !== i))]
      ok(lap.length === 0, `mount \`${ten}\`: ${ds.length} thẻ, không slug nào lặp`,
         lap.length ? `slug lặp TRONG CÙNG mount: ${lap.join(" · ")}` : "")
    }
  }
  ok(tongThe > 0, `${tongThe} thẻ bài trên ${tongTrang} trang đã build`,
     "0 thẻ ⇒ regex không còn khớp markup, §6 sẽ xanh vô căn cứ")
  ok(xauTieuDe.length === 0, "không thẻ nào lấy slug-có-tiền-tố làm tiêu đề",
     xauTieuDe.length ? `${[...new Set(xauTieuDe)].join(" · ")} — fallback tiêu đề `
       + `của emitter phải khớp API (\`fm.title ?? slug trần\`)` : "")

  // 6c · `dongBoThe` phải lọc trùng bằng `data-slug`, KHÔNG bằng chữ trong h4
  /*
   * NHẬN CẢ HAI HÌNH DẠNG. Bundle từng viết `document.getElementById("grid2")`;
   * WO-020 gom 128 lời gọi đó về một hàm `G` (đoạn cũ dài 23 ký tự × 128 lần
   * ≈ 2.9 KB trong một bundle trần 100 KB). Phép kiểm này ghim chuỗi dài nên
   * nó đỏ vì một lý do KHÔNG liên quan tới thứ nó canh.
   */
  const iG = ['G("grid2")', 'getElementById("grid2")']
    .map((m) => js.indexOf(m)).find((x) => x > 0) ?? -1
  ok(iG > 0, "tìm được `dongBoThe` qua mốc `grid2`")
  if (iG > 0) {
    const than = js.slice(Math.max(0, iG - 200), iG + 900)
    ok(/dataset\.slug/.test(than), "lọc trùng đọc `dataset.slug`",
       "so theo danh tính thì fallback tiêu đề lệch bao nhiêu cũng không sinh thẻ trùng")
    ok(!/h4["'`]\s*\)\s*\?\.textContent/.test(than),
       "lọc trùng KHÔNG so `h4.textContent`",
       "so chữ hiển thị: đúng cái đã sinh ra 3 thẻ cho 2 bài")
  }
}

// ─── §5 · MỌI FILE TEST ĐỀU NẰM TRONG `npm test` ────────────────────────────
// Chuỗi `npm test` là một danh sách GÕ TAY. Chính file này sinh ra NGOÀI chuỗi
// đó: nó xanh khi chạy riêng, còn `npm test` không hề gọi nó — một phép kiểm
// không ai chạy là một phép kiểm không tồn tại.
//
// Đây là lớp lỗi "tập gõ tay bị lạc hậu" mà repo đã sửa bốn lần ở chỗ khác
// (enum trạng thái, ma trận chuyển, allow-list `renameSync`). Ở đây nó ăn cả
// những phép kiểm dùng để bắt lớp lỗi ấy.
//
//
// ⚠️ §5 GIỮ NGHĨA GỐC — bản "có CHỦ không?" (T03-100) đã GỠ 2026-09-04.
//
// `rule.md` mục 8 chốt: KHÔNG luật nào nhường, đổi **CHỖ ĐO** `R5`. "Đỏ trước"
// chứng minh bằng **bằng chứng trong worklog** (output cổng ĐỎ tại mốc
// trước-code + XANH sau, cùng entry, `object` = SHA/mốc giờ) — KHÔNG bằng
// trạng thái suite trên cây làm việc CHUNG. Suite chung chỉ cần xanh lúc
// BÀN GIAO.
//
// ⇒ Cổng viết-trước sống ở **thư mục task** (`07_plan/**/T*.test.js`), và dời
//   vào `web/test/` + đăng ký `npm test` **CÙNG LƯỢT** với mã. Nên §5 lại đo
//   được đúng thứ nó sinh ra để đo, và không còn phạt `R5`: một file trong
//   `web/test/` mà ngoài chuỗi `npm test` nay là một cổng **thật sự mồ côi**.
//
// Khuôn đó là khuôn `T03-92` đã chạy: cổng đỗ ở `07_plan/M03_web/tasks/`, rồi
// vào `web/test/chung-cat-ui.test.js` cùng lượt với mã và cùng lượt đăng ký.
{
  const pkg = JSON.parse(readFileSync(join(WEB, "package.json"), "utf8"))
  const chuoi = pkg.scripts?.test ?? ""
  const file = readdirSync(join(WEB, "test")).filter((t) => t.endsWith(".test.js"))
  const thieu = file.filter((t) => !chuoi.includes("test/" + t)).sort()
  ok(file.length > 40, `${file.length} file test trong thư mục`)
  ok(thieu.length === 0, "mọi file test đều được `npm test` gọi",
     thieu.length ? `KHÔNG được gọi: ${thieu.join(" · ")}` : "")
}

/*
 * §6 · TRẦN BUNDLE chỉ được khai ở MỘT chỗ.
 *
 * Đo 2026-09-08: `grep -l 102400 web/test/*.test.js` = **11 file**. Nới một
 * trần (`FR-074`) làm **8 cổng đỏ cùng lúc**, và không cổng nào đỏ vì hệ sai —
 * chúng đỏ vì mỗi file giữ một bản sao của con số.
 *
 * Hôm 2026-09-07 tôi đã chẩn đúng lớp lỗi ấy trong `page-weight.test.js`
 * (`100 + 100` gõ cứng cạnh `102` của `FR-068`) và chỉ vá TRONG file đó. Mười
 * bản sao còn lại vẫn nằm im cho tới hôm nay.
 *
 * ⇒ Vá một bản sao KHÔNG phải vá lớp lỗi. Vế này giữ cho `_tran.mjs` là nguồn
 * duy nhất, để lần nới thứ tư sửa một dòng chứ không mười một dòng.
 *
 * Comment được phép giữ con số: một ghi chú lịch sử (*"FR-068 nới 100 → 102"*)
 * là thứ nên đọc được, và nó không đổi hành vi của cổng nào.
 */
{
  const bo = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
  const xau = []
  for (const f of readdirSync(join(WEB, "test")).filter((x) => x.endsWith(".test.js"))) {
    const ma = bo(readFileSync(join(WEB, "test", f), "utf8"))
    const so = [...ma.matchAll(/\b10[0-9]{4}\b/g)].map((m) => m[0])
      .filter((n) => Number(n) % 1024 === 0)
    if (so.length) xau.push(`${f} (${[...new Set(so)].join(",")})`)
  }
  ok(xau.length === 0,
    "6 · trần bundle chỉ khai ở `_tran.mjs`, không gõ tay trong cổng nào",
    xau.length
      ? `còn gõ cứng: ${xau.join(" · ")} — import từ \`./_tran.mjs\` thay vì`
        + " gõ lại, không thì lần nới sau lại làm cả loạt cổng đỏ"
      : "")
}

chot("nút sống · mỗi nút tới được một nhánh, `cur` không lẫn `muc`")
