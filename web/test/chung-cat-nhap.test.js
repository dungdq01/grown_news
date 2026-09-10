#!/usr/bin/env node
/**
 * T03-94 — màn HÀNG ĐỢI NHÁP tại `/chung-cat/nhap/` (FR-046).
 *
 * Cổng ĐÃ ĐỖ ở thư mục task (`rule.md` mục 8) và dời vào đây CÙNG LƯỢT với mã
 * + đăng ký `npm test`. Bằng chứng đỏ-trước: **14 lỗi** tại mốc trước-code.
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Đây là màn người ta KÝ DUYỆT một bản do máy viết. Ba thứ, nếu sai, làm người
 * duyệt ký vào thứ họ không thấy:
 *
 *   1  "⚠ đã tỉa N" phải hiện **TRƯỚC** nút Duyệt. Bản nháp bị cắt bớt khẳng
 *      định mà không nói ra thì người duyệt ký vào một bản đã bị tỉa — và họ
 *      tin đó là bản đầy đủ. Không hiện là NÓI DỐI, không phải thiếu sót.
 *   2  Diff so `ban_goc_ai` với `ban_hien_tai`. Bản chưa ai sửa phải NÓI
 *      "trùng bản AI gốc" — im lặng đọc ra như "chưa tải xong".
 *   3  Trả lại bắt kèm lý do. Không lý do thì cùng loại nháp quay lại, và
 *      người trả lại lần sau không biết lần trước vướng gì.
 *
 * Và một thứ về NGÂN SÁCH, vì nó quyết hình dạng màn (đo 2026-09-04):
 *   trang chủ HTML dư 10 byte · gn.css dư 362 · gn.js dư 2535
 *   ⇒ shell chỉ được MỘT mốc rỗng · 0 luật CSS mới · JS vào chunk `chungcat`
 *
 * ĐỎ_KHI  màn dựng markup trong shell · thêm luật CSS · "đã tỉa" hiện SAU nút
 *         duyệt (hoặc không hiện) · bản chưa sửa im lặng · Trả lại qua được khi
 *         thiếu lý do · có nút Xoá (cửa CHƯA CÓ — S18) · màn tự set
 *         `review_status`
 * XANH_KHI ba nút, ba fact hợp đồng được tôn trọng, 0 byte HTML/CSS mới
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { maFeNguon } from "./_render.mjs"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
let loi = 0
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi++
}

const src = maFeNguon(".ts")
const shell = readFileSync(join(WEB, "render", "shell.html"), "utf8")
const shell2 = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")
const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
const manHinh = JSON.parse(readFileSync(
  join(WEB, "..", "core", "assets", "man-hinh.json"), "utf8")).man

console.log("\n1 · Màn khai ĐÚNG chỗ — dưới url module, không phải mục nav thứ hai\n")

const m = manHinh.find((x) => x.path === "/chung-cat/nhap/")
ok(m !== undefined, "`man-hinh.json` có màn `/chung-cat/nhap/`")
ok(m?.menu === false,
  "`menu: false` — vào từ `/chung-cat/`, không mọc mục nav thứ hai (T03-97/rule 5)")
/*
 * `cat_khi_khac: true` — VÀ nó KHÔNG được kéo màn này vào cụm `+ nạp`.
 *
 * Bản đầu của cổng đòi `false`, vì tôi đọc cờ đó là "màn NẠP". Nó mang HAI
 * nghĩa: (1) *cắt khỏi trang khác* — việc của render; (2) *là màn nạp* — thứ
 * cụm `+ nạp` dùng. `T03-98` đã va đúng chỗ này (`/dot-hai/` mọc trong
 * dropdown `+ nạp`). Màn này CẦN nghĩa (1): mốc view của nó tốn ~50 byte mà
 * trang chủ dư 10 — không cắt là vượt trần ngay (đo: 61488/61440).
 *
 * ⇒ `trang.mjs` nay lọc cụm `+ nạp` bằng `cat_khi_khac && module`. Màn này
 *   không có `module`, nên nó chỉ nhận nghĩa CẮT. Cổng đo cả hai vế.
 */
ok(m?.cat_khi_khac === true,
  "`cat_khi_khac: true` — bị CẮT khỏi trang khác (mốc view tốn ~50B, trang chủ dư 10)")
ok(m?.module === undefined,
  "KHÔNG khai `module` — đó là thứ giữ nó ra khỏi cụm `+ nạp`",
  "khai `module` sẽ làm nó mọc thành `+ hàng đợi nháp` cạnh `+ nạp bài viết`")

console.log("\n2 · Shell chỉ MỘT mốc rỗng — trang chủ dư 10 byte\n")

for (const [ten, s] of [["render", shell], ["home-pages", shell2]]) {
  const khoi = s.match(/<div class="view" id="v-chungcatnhap"[^>]*>([\s\S]*?)<\/div>/)
  ok(khoi !== null, `shell ${ten} có view \`v-chungcatnhap\``)
  ok(khoi === null || khoi[1].trim() === "",
    `shell ${ten}: view RỖNG — khung dựng bằng JS`,
    "shell đi theo cả chín màn; mỗi thẻ trong nó nhân với chín, và trang chủ dư 10 byte")
}
ok(shell === shell2, "hai shell còn byte-identical")

console.log("\n3 · 0 luật CSS mới — gn.css dư 362 byte\n")

for (const c of ["nh-", "hd-nhap", "triage"]) {
  ok(!new RegExp("\\." + c).test(css), `KHÔNG luật \`.${c}…\` mới`)
}

console.log("\n4 · Ba fact hợp đồng của cửa T08-22\n")

/*
 * Lấy TOÀN BỘ mã của màn, không neo vào một TÊN HÀM.
 *
 * Bản đầu đòi `function ccNhapDung` — một cái tên tôi tự đặt lúc viết cổng, và
 * mã đặt tên khác. Đó đúng lớp lỗi đã trúng SÁU cổng ở `T03-104`: đo TÊN thay
 * vì đo TÍNH CHẤT. Mốc `v-chungcatnhap` mới là hợp đồng thật — shell khai nó,
 * và mã phải cắm vào đúng nó.
 */
const iMan = src.indexOf("v-chungcatnhap")
const than = iMan >= 0 ? src.slice(iMan, iMan + 9000) : ""
ok(than !== "", "mã có nhắc mốc `v-chungcatnhap` — màn cắm vào đúng chỗ shell khai")

// Fact 1 · "đã tỉa N" TRƯỚC nút Duyệt — vị trí trong chuỗi markup là phép đo.
const iTia = than.search(/khang_dinh_bi_tia|đã tỉa/)
const iDuyet = than.search(/cc-duyet|Duyệt/)
ok(iTia >= 0, "màn đọc `khang_dinh_bi_tia`")
ok(iTia >= 0 && iDuyet >= 0 && iTia < iDuyet,
  "`⚠ đã tỉa N` dựng TRƯỚC nút Duyệt — người duyệt thấy nó trước khi ký",
  `vị trí tỉa ${iTia} · duyệt ${iDuyet}`)

// Fact 2 · diff hai bản, và bản chưa sửa NÓI RA.
ok(/ban_goc_ai/.test(than) && /ban_hien_tai/.test(than),
  "diff đọc CẢ HAI bản từ một lời gọi `GET /api/nhap-chung-cat/<ulid>`")
ok(/trùng bản AI gốc|chưa ai sửa|trùng bản gốc/.test(src),
  "bản chưa sửa NÓI RA 'trùng bản AI gốc' — im lặng đọc ra như 'chưa tải xong'")

// Fact 3 · Trả lại bắt lý do NGAY Ở FE, không chờ 422.
ok(/tra-lai/.test(src), "có đường gọi `POST …/tra-lai`")
ok(/ly_do/.test(than), "màn thu `ly_do` cho ca trả lại")

console.log("\n5 · BA nút, KHÔNG bốn — cửa Xoá chưa có (S18)\n")

ok(/cc-duyet/.test(than) && /cc-sua/.test(than) && /cc-tra/.test(than),
  "ba hành động: Duyệt · Sửa · Trả lại")
ok(!/cc-xoa|data-act="xoa"/.test(than),
  "KHÔNG nút Xoá — `FR-046` chưa có trạng thái 'đã bỏ' và `T08-22` chưa mở cửa đó",
  "render một nút gọi đường chưa có là `S18` cấm; ô nợ M08 chờ NGƯỜI quyết")

console.log("\n6 · Màn KHÔNG tự quyết trạng thái duyệt\n")

/*
 * Quét THÂN MÀN NÁP, không quét cả mã FE.
 *
 * Bản đầu quét `src` và trúng `ban.review_status = "approved"` của luồng duyệt
 * bài KHO — một dòng hợp lệ, không liên quan. Tính chất cần giữ có PHẠM VI:
 * *màn nháp* không được tự đặt trạng thái duyệt, vì bảng nháp có `CHECK` hằng
 * `= 'draft'` và "duyệt" ở đây là CHUYỂN SANG KHO, không phải đổi một cột.
 */
ok(!/review_status/.test(than),
  "màn nháp KHÔNG đụng `review_status` — 'duyệt' là CHUYỂN SANG KHO, " +
  "không phải đổi một cột (DDL có `CHECK` hằng `= 'draft'`)")

/* ══ T03-113 · CỬA SỔ NHÁP đi ĐÚNG CỬA, và bộ nút đúng vai ════════════════
 *
 * Bug chủ dự án bắt trên màn thật 2026-09-05: mở một nháp từ tab Kết quả ⇒
 * `GET /api/articles/article/phan-tich-…` trả **404**, thân trống, và bốn nút
 * chân cửa sổ là bộ nút BÀI KHO (*Đưa lên site · Loại · Sửa · Bỏ khỏi kho*),
 * tất cả chết cùng lỗi đó.
 *
 * Bản nháp KHÔNG có trong kho — nó sống ở DB nháp, khoá `job_ulid`. Sai CỬA,
 * không sai API. Ba vế dưới đây khoá lại cả ba mặt của phép sửa.
 *
 * ĐO NGUỒN FE: cửa sổ chỉ dựng sau một chuỗi bấm, và dựng lại chuỗi đó trong
 * một cổng tĩnh là dựng một bản mô phỏng trình duyệt.
 */
{
  const NL2 = String.fromCharCode(10)
  const chiMa2 = (x) => x.replace(/[/][*][^]*?[*][/]/g, NL2)
    .split(NL2).map((l) => l.split(String.fromCharCode(47, 47))[0]).join(NL2)
  const docNguon = (...q) => chiMa2(readFileSync(join(WEB, ...q), "utf8"))
  const CCTAB2 = docNguon("plugins", "cctab", "src", "cctab.inline.ts")
  const CHUNGCAT2 = docNguon("plugins", "chungcat", "src",
    "chungcat.inline.ts")
  const MW2 = docNguon("plugins", "multiwindow", "src", "scripts",
    "multiwindow.inline.ts")

  console.log(NL2 + "T03-113 · nháp đi cửa nháp, không đi cửa bài-kho" + NL2)

  const than2 = (src, mau) => {
    const i = src.search(mau)
    if (i < 0) return ""
    const b = src.indexOf("{", i)
    let sau = 0
    for (let k = b; k < src.length; k++) {
      if (src[k] === "{") sau++
      else if (src[k] === "}") { sau--; if (!sau) return src.slice(b, k + 1) }
    }
    return ""
  }

  const moNhap = than2(CCTAB2, /async function moCuaSoNhap\b/)
  ok(moNhap.length > 0, "có `moCuaSoNhap` — cửa sổ riêng cho bản nháp",
    "không có ⇒ nháp lại mở bằng cửa sổ bài-kho và 404 như cũ")

  ok(/\/api\/nhap-chung-cat\//.test(moNhap),
    "đọc `GET /api/nhap-chung-cat/<id>` (AC1)",
    "một lời gọi trả CẢ `ban_goc_ai` lẫn `ban_hien_tai` (T08-22)")

  /*
   * Vế NẶNG của AC1: KHÔNG chạm `/api/articles/*` cho bản chưa vào kho.
   * `da_duyet` là ngoại lệ DUY NHẤT — lúc đó bài có thật trong kho.
   */
  const truocDuyet = moNhap.split("da_duyet")[0]
  ok(!/\/api\/articles/.test(truocDuyet),
    "  và KHÔNG gọi `/api/articles/*` cho bản chưa vào kho",
    "đó chính là request 404 mà chủ dự án bắt được")

  ok(/da_duyet/.test(moNhap),
    "nháp `da_duyet` ⇒ dẫn sang bài kho thật (AC3)",
    "sau khi duyệt thì đường `/api/articles/…` mới đúng, và người cần đủ bộ "
    + "nút của bài trên site")

  console.log(NL2 + "T03-113 · bộ nút ĐÚNG VAI của bản nháp (AC2)" + NL2)

  const veNhap = than2(CCTAB2, /function veCuaSoNhap\b/)
  ok(veNhap.length > 0, "có hàm phát nút cho cửa sổ nháp")
  for (const [mau, nhan] of [
    [/data-nhduyet/, "Duyệt vào kho"],
    [/data-nhtra/, "Trả lại (có lý do)"],
    [/data-nhbo/, "Bỏ nháp"],
    [/chung-cat\/nhap\//, "Sửa ở hàng nháp"],
  ]) {
    ok(mau.test(veNhap), `  có nút \`${nhan}\``,
      "bốn nút này là VAI của bản nháp; thiếu một cái là một hành động người "
      + "phải đi màn khác mới làm được")
  }
  ok(!/data-act="dang"|Đưa lên site|Bỏ khỏi kho/.test(veNhap),
    "  và KHÔNG có nút của BÀI ĐÃ VÀO KHO",
    "*Đưa lên site* / *Bỏ khỏi kho* là đời sống của bài đã duyệt — trên một "
    + "bản nháp chúng chỉ 404")

  /* `prompt()` bị `FR-022` cấm; lý do trả lại hỏi bằng `<dialog>`. */
  ok(/hoiLyDo/.test(CCTAB2) && !/\bprompt\(/.test(CCTAB2),
    "  lý do trả lại hỏi bằng `<dialog>`, không `prompt()`",
    "`FR-022` bỏ hộp thoại của trình duyệt")

  console.log(NL2 + "T03-113 · khung cửa sổ biết loại `nhap`" + NL2)

  /*
   * WO-087 · Đo HÀNH VI, không đo chuỗi.
   *
   * Vế cũ tìm chữ `kieu !== "nhap"`. `WO-087` đảo guard sang danh sách CHO
   * PHÉP (`!tuyChon?.kieu`) — chặt hơn hẳn, vì nó chặn cả `transcript` và mọi
   * `kieu` chưa tồn tại — nhưng không còn chuỗi ấy, nên vế đỏ dù bất biến được
   * giữ MẠNH HƠN trước. Đó là đỏ oan.
   *
   * Nên chạy thật điều kiện gác `tai()` với `kieu: "nhap"`.
   */
  const _i = MW2.indexOf("tai(id, 0)")
  const _t = _i > 0 ? MW2.slice(Math.max(0, _i - 220), _i).trimEnd() : ""
  const _m = /if\s*\(([^)]*(?:\([^)]*\))?[^)]*)\)\s*(?:void\s*)?$/.exec(_t)
  let _bqua = false
  try {
    _bqua = _m ? !new Function("tuyChon", `return !!(${_m[1]})`)({ kieu: "nhap" }) : false
  } catch { _bqua = false }
  ok(_bqua,
    "`mo()` nhận `kieu: \"nhap\"` và BỎ QUA `tai()`",
    "`tai()` là đường bài-kho: nó fetch `/api/articles` rồi phát bộ nút của "
    + "bài đã lên site — hai thứ đều sai cho một bản nháp")

  ok(/moCuaSoNhap/.test(CHUNGCAT2),
    "tab Kết quả mở nháp bằng `moCuaSoNhap`",
    "gọi thẳng `mw.mo()` là quay lại đúng bug")
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · đã tỉa hiện trước khi ký · diff hai bản · ba nút · 0 byte HTML/CSS mới\n")
