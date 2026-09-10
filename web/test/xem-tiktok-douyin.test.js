#!/usr/bin/env node
/**
 * WO-074 · T03-131 — CỬA SỔ XEM cho TikTok + Douyin, và đường lùi cho mọi host.
 *
 * Chủ dự án 2026-09-09 nạp hai bản ghi THẬT rồi báo "hai cái đó không xem được
 * video". Đo ra BA lỗi khác nhau, và chúng đòi ba phép sửa khác nhau — gộp
 * chúng vào một vế là cách một trong ba lặng lẽ không được sửa:
 *
 *  1 `id_tu` của douyin khai `/video/([0-9]{6,24})`, mà URL thật của chủ dự án
 *    là `douyin.com/jingxuan/course?modal_id=7543503016624655654`. Không khớp
 *    ⇒ `idVideo()` trả `null`.
 *
 *  2 `xemTruocHienVat` gặp `null` thì chạy `return ""` — cửa sổ hiện TRẮNG
 *    TRƠN. Không nút, không link, không câu giải thích. Người dùng không phân
 *    biệt được "app hỏng" với "nguồn này không nhúng được".
 *
 *  3 Nhúng douyin `open.douyin.com/player/video?vid=` trả 403 ở `aweme/detail`
 *    kể cả khi id ĐÚNG (đo trực tiếp, không qua app). Nên sửa (1) mà không sửa
 *    (3) thì nút "▶ Xem video" hiện ra để nhúng một khung trống — TỆ HƠN
 *    trạng thái hôm nay. Đó là vì sao `nhung: null` và vế 3 phải đi cùng nhau.
 *
 * ── Vì sao đo `id_tu` bằng URL THẬT, không bằng URL tự nghĩ ─────────────
 * Bản khai `/video/([0-9]{6,24})` không sai về cú pháp — nó chỉ chưa từng gặp
 * dạng URL mà douyin thật sự phát ra. Một vế gieo `douyin.com/video/123456`
 * sẽ XANH mãi mãi và không bao giờ bắt được lỗi này. Nên ba chuỗi ở `THAT`
 * dưới đây là URL chép NGUYÊN VĂN từ bản ghi của chủ dự án.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const NL = String.fromCharCode(10)
const TEST = dirname(fileURLToPath(import.meta.url))
const WEB = join(TEST, "..")
const GOC = join(WEB, "..")

let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

const BANG = JSON.parse(readFileSync(join(GOC, "core", "assets", "media-mime.json"), "utf8"))
const FE = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

/**
 * BẢN SAO của `idVideo()` — và một bản sao là một thứ đáng ngờ, nên nó phải tự
 * chứng minh mình còn khớp. Vế 0 dưới đây đọc chính mã nguồn FE và đòi ba mệnh
 * đề của hàm thật còn nguyên. Ngày ai đó đổi phép so host, vế 0 đỏ TRƯỚC khi
 * các vế dưới kịp xanh oan trên một bản sao đã lạc hậu.
 */
const idVideo = (un) => {
  const g = String(un ?? "")
  const s = g.toLowerCase()
  for (const h of BANG.video_host) {
    if (s !== h.mien && !s.startsWith(h.mien + "/") && !s.startsWith(h.mien + "?")) continue
    const m = new RegExp(h.id_tu, "i").exec(g)
    if (!m) return null
    if (!new RegExp(h.id_mau).test(m[1])) return null
    return { nhan: h.nhan, nhungDuoc: !!h.nhung, id: m[1] }
  }
  return null
}

console.log("\nWO-074 · TikTok + Douyin: nhận URL thật, và luôn có đường lùi\n")

// ── 0 · Bản sao còn khớp hàm thật ────────────────────────────────────────
{
  const ba = [
    [/startsWith\(h\.mien \+ "\/"\)/, "so host theo hậu tố có dấu chấm"],
    [/new RegExp\(h\.id_tu, "i"\)\.exec\(g\)/, "bóc id bằng `id_tu`, KHÔNG hạ chữ (WO-022)"],
    [/new RegExp\(h\.id_mau\)\.test\(m\[1\]\)/, "kiểm hình dạng id bằng `id_mau`"],
  ]
  for (const [re, ten] of ba) {
    ok(re.test(FE), `0 · bản sao khớp hàm thật: ${ten}`,
      "hàm thật đã đổi ⇒ mọi vế dưới đo một bản sao lạc hậu")
  }
}

// ── 1 · URL THẬT của chủ dự án ───────────────────────────────────────────
console.log("\n1 · Ba dạng URL douyin thật + tiktok thật\n")
{
  /* Dạng `url_normalized` — `normalize_url()` (T01-29) đã bỏ `www.` và scheme. */
  const THAT = [
    ["tiktok.com/video/7669845290265890069", "tiktok", "7669845290265890069",
      "TikTok · bản ghi thật của chủ dự án"],
    ["douyin.com/jingxuan/course?modal_id=7543503016624655654", "douyin",
      "7543503016624655654", "Douyin · CHÍNH dạng chủ dự án nạp — dạng làm lộ lỗi"],
    ["douyin.com/video/7543170111641865522", "douyin", "7543170111641865522",
      "Douyin · dạng chuẩn"],
    ["douyin.com/share/video/7543170111641865522", "douyin", "7543170111641865522",
      "Douyin · dạng chia sẻ"],
  ]
  for (const [u, nhan, id, ten] of THAT) {
    const v = idVideo(u)
    ok(v !== null && v.nhan === nhan && v.id === id, `1 · ${ten}`,
      v === null ? `trả null — \`id_tu\` của ${nhan} không khớp \`${u}\``
        : `được ${v.nhan}/${v.id}`)
  }

  /* ĐỎ ĐƯỢC: một id sai hình dạng phải bị `id_mau` chặn, không lọt. */
  ok(idVideo("douyin.com/jingxuan/course?modal_id=abc") === null,
    "1b · id không phải số ⇒ null (id_mau còn răng)",
    "nới `id_tu` mà quên `id_mau` là mở cửa cho mọi chuỗi")
  ok(idVideo("douyin.com.ke-xau.example/video/123456") === null,
    "1c · host giả mạo hậu tố ⇒ null",
    "`includes` thay vì so hậu tố là chỗ này thủng")
}

// ── 2 · Douyin khai KHÔNG nhúng được ─────────────────────────────────────
console.log("\n2 · `nhung: null` cho host không nhúng được\n")
{
  const d = BANG.video_host.find((x) => x.nhan === "douyin")
  ok(!!d, "2 · bảng còn dòng douyin")
  ok(d && d.nhung === null,
    "2a · douyin khai `nhung: null`",
    "đo 2026-09-09: `open.douyin.com/player/video?vid=` nạp player rồi "
    + "`aweme/detail` trả 403 — nút nhúng chỉ dẫn tới một khung trống")
  /* Các host CÒN nhúng được phải giữ nguyên — loại trừ douyin không được lan. */
  for (const n of ["youtube", "tiktok", "fb"]) {
    const h = BANG.video_host.find((x) => x.nhan === n)
    ok(h && typeof h.nhung === "string" && h.nhung.startsWith("https://"),
      `2b · ${n} VẪN có \`nhung\` — phép loại trừ không lan`,
      JSON.stringify(h?.nhung))
  }
}

// ── 3 · Cửa sổ xem: luôn có đường lùi ────────────────────────────────────
console.log("\n3 · Cửa sổ luôn cho người một lối đi\n")
{
  /* Vùng đo = thân `xemTruocHienVat`, không phải cả file: chuỗi `return ""`
     xuất hiện nhiều nơi hợp lệ, và quét cả file là một vế đỏ oan. */
  /* Cắt tới ĐẦU hàm kế tiếp, KHÔNG cắt theo một số ký tự đoán trước: thân hàm
     dài ra là chuyện thường, và một vùng đo hụt làm vế xanh-hoá-đỏ vì lý do
     không liên quan gì tới thứ nó canh. (Đã xảy ra ngay trong đơn vị này.) */
  const i = FE.indexOf("function xemTruocHienVat")
  const ke = FE.indexOf(NL + "function ", i + 1)
  const than = i < 0 ? "" : FE.slice(i, ke < 0 ? FE.length : ke)
  ok(i >= 0, "3 · tìm được `xemTruocHienVat`")

  ok(!/const v = idVideo\([^)]*\);\s*\n\s*if \(!v\) return "";/.test(than),
    "3a · KHÔNG còn `if (!v) return \"\"` — bản ghi không bóc được id vẫn phải hiện gì đó",
    "hôm nay douyin rơi đúng nhánh này và cửa sổ trắng trơn")

  ok(/rel="noopener"><b>▶ Xem ở nguồn/.test(than),
    "3b · có nhánh LINK mở ở nguồn ngay trên poster",
    "cần một lối đi khi không nhúng được — không thì người không phân biệt "
    + "được `app hỏng` với `nguồn này không nhúng được`")

  ok(/v\??\.nhungDuoc/.test(than),
    "3c · nhánh nhúng đọc CỜ `nhungDuoc`, host khai `null` thì không hiện nút",
    "thiếu phép này thì sửa `id_tu` xong nút hiện ra để nhúng một khung 403. "
    + "Và phải là CỜ, không phải chuỗi: `media-cua-so` cấm hàm dựng markup chạm "
    + "`.nhung` — một chuỗi host đi qua đây là một bước gần hơn tới chỗ nó lọt "
    + "vào markup, và lúc đó mở trang thành một lời gọi ra ngoài.")

  ok(/rel="[^"]*noopener/.test(than) && /target="_blank"/.test(than),
    "3d · link ra ngoài có `target=_blank` + `rel=noopener`",
    "mở tab mới mà không `noopener` là trao `window.opener` cho trang đích")
}

// ── 4 · Nút nhúng không dựng src từ `null` ───────────────────────────────
{
  const i = FE.indexOf("function nhungVideo")
  const ke = FE.indexOf(NL + "function ", i + 1)
  const than = i < 0 ? "" : FE.slice(i, ke < 0 ? FE.length : ke)
  ok(i >= 0 && /if \(!h(\b|\s)[^)]*\|\|[^)]*h\.nhung|!h\?\.nhung|!h\.nhung/.test(than),
    "4 · `nhungVideo` chặn khi `nhung` rỗng",
    "không chặn thì `f.src = null + id` ra `\"null7543…\"` — một request rác")
}

// ── 5 · SSR phải SỐNG khi một cột bảng khai là `null` ────────────────────
//
// Vế đắt nhất của đơn vị này, và nó tồn tại vì một lần chết THẬT: đổi `nhung`
// của douyin thành `null` làm `trang.mjs:197` chạy `h.nhung.includes("youtube")`
// trên `null` ⇒ **HTTP 500 ở MỌI màn**, kể cả trang chủ. Bốn cổng đọc-nguồn
// phía trên đều XANH trong lúc app không mở được — chúng hỏi "mã có viết đúng
// chữ không", không hỏi "trang có dựng được không".
//
// Nên vế này DỰNG TRANG THẬT bằng đúng đường `server.mjs` đi, với một bản ghi
// video mang URL douyin. Một `null` mới ở bất kỳ cột bảng khai nào cũng đi qua
// đây.
{
  /* `_render.mjs` là đường CHUẨN của suite: nó dựng kho tạm, nạp cả ba module
     render, và `data` truyền thẳng thì bỏ qua mock/real — đúng khe cần ở đây. */
  const { trangHtml, napRender } = await import("./_render.mjs")
  const m = await napRender()
  /* NHÂN BẢN một bản ghi mock có thật rồi chỉ đổi URL — KHÔNG dựng tay.
     Dựng tay thì mỗi trường thiếu là một lần bản ghi bị lọc khỏi màn, và vế 5
     lặng lẽ đo một trang không có douyin trong đó. (Đúng chuyện vừa xảy ra:
     ba lần sửa fixture, và chỉ vế 5a giữ cho vế 5 khỏi xanh oan.) */
  const d = m.duLieuMock()
  const goc = (d.bans ?? []).find((x) => x.source_type === "video")
  ok(!!goc, "5 · kho mock có sẵn một bản ghi video để nhân bản")
  const BG = { ...goc, slug: "thu-douyin", title: "thử douyin",
    url: "https://www.douyin.com/jingxuan/course?modal_id=7543503016624655654",
    url_normalized: "douyin.com/jingxuan/course?modal_id=7543503016624655654",
    media: undefined }

  let chet = null
  let html = ""
  try {
    const d = m.duLieuMock()
    /* Chèn bản ghi douyin vào ĐẦU danh sách để chắc chắn nó được vẽ, không phụ
       thuộc kho thật có sẵn một bản douyin hay không — vế phụ thuộc dữ liệu là
       vế tự tắt vào ngày ai đó dọn kho. */
    html = await trangHtml("video", { data: { ...d, bans: [BG, ...(d.bans ?? [])] } })
  } catch (e) { chet = String(e?.stack ?? e).split(NL).slice(0, 3).join(" | ") }
  ok(chet === null, "5 · dựng màn Video với bản ghi douyin KHÔNG ném", `ném: ${chet}`)
  ok(chet === null && html.includes("thu-douyin"),
    "5a · và bản ghi douyin CÓ MẶT trong HTML — vế 5 không đo một trang rỗng",
    "không thấy slug ⇒ bản ghi bị lọc mất, và vế 5 xanh oan")
}

// ── 6 · Trường mà nhánh đường-lùi ĐỌC phải CÓ trong phong bì cửa sổ ──────
//
// Bẫy đã sập một lần trong chính đơn vị này: tôi viết `ban.url`, mọi vế
// đọc-nguồn XANH, và cửa sổ douyin trên máy thật vẫn TRẮNG TRƠN — vì `mo()`
// dựng bản ghi cho cửa sổ từ `frontmatter` và KHÔNG chép `url` vào. Một cổng
// đọc chữ không bao giờ thấy được lỗ ấy.
//
// Vế này nối hai đầu: trường nào nhánh đường-lùi đọc thì phong bì phải mang.
{
  const iX = FE.indexOf("function xemTruocHienVat")
  const keX = FE.indexOf(NL + "function ", iX + 1)
  const thanX = FE.slice(iX, keX < 0 ? FE.length : keX)
  const m = /const ng = (?:String\()?ban\.([a-z_]+)/.exec(thanX)
  ok(!!m, "6 · đọc được tên trường mà nhánh đường-lùi dùng", thanX.slice(0, 80))
  const truong = m ? m[1] : ""
  const iM = FE.indexOf("bans: [{")
  const phongBi = iM < 0 ? "" : FE.slice(iM, iM + 1400)
  ok(!!truong && new RegExp(truong + ":").test(phongBi),
    `6a · phong bì cửa sổ CÓ chép \`${truong}\``,
    "nhánh đường-lùi đọc một trường phong bì không mang ⇒ href rỗng, "
    + "cửa sổ trắng trơn, và mọi vế đọc-nguồn vẫn xanh")
}


// ── 7 · WO-075 · MỘT khung, hai kết cục ──────────────────────────────────
//
// Trước đó là hai khối markup rời: `hv vid` (nút nhúng) và `hv the ngoai`
// (link trơ). Người dùng thấy hai hình dạng khác hẳn nhau cho cùng một việc
// "xem video", và cái thứ hai trông như app hỏng — chủ dự án đã báo đúng thế.
//
// Nay MỘT poster, khác nhau đúng ở cú bấm. Ba vế dưới kẹp cả ba mệnh đề.
{
  const iX = FE.indexOf("function xemTruocHienVat")
  const keX = FE.indexOf(NL + "function ", iX + 1)
  const thanX = FE.slice(iX, keX < 0 ? FE.length : keX)

  ok(/class="cd-n"/.test(thanX),
    "7 · poster DÙNG LẠI `.cd-n` của thẻ — không dựng bộ nền thứ hai",
    "một bản nền thứ hai là chỗ hai bên bắt đầu lệch icon/màu")

  // Một `return` duy nhất cho cả hai kết cục: nếu tách lại thành hai khối thì
  // hình dạng lại rẽ đôi, và đó chính là lỗi vừa sửa.
  const soKhung = (thanX.match(/<div class="hv vid"/g) ?? []).length
  ok(soKhung === 1, `7a · đúng MỘT khung poster (đếm được ${soKhung})`,
    "hai khối markup rời là cách hai kết cục lại trông khác hẳn nhau")

  ok(/onerror="this\.remove\(\)"/.test(thanX),
    "7b · ảnh bìa hỏng thì GỠ, không để khung vỡ",
    "ảnh 404 mà không gỡ ⇒ icon vỡ đè lên nền")

  // Ảnh bìa lấy từ `media`, KHÔNG hotlink: kho có ảnh thì dùng ảnh kho.
  ok(/api\/articles\/media\//.test(thanX),
    "7c · nền lấy hiện vật TRONG KHO, không hotlink ra ngoài")
}


// ── 8 · WO-075 · Nhãn GIỮA khung, và nút lấy lại ảnh bìa ─────────────────
{
  const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
  const iX = FE.indexOf("function xemTruocHienVat")
  const keX = FE.indexOf(NL + "function ", iX + 1)
  const thanX = FE.slice(iX, keX < 0 ? FE.length : keX)

  // Chủ dự án 2026-09-09: nhãn phải ở GIỮA khung. Bản trước tôi đẩy nó xuống
  // đáy để né va chạm với icon — né, không phải giải.
  const luat = /\.hv\.vid \.hv-play\{[^}]*\}/.exec(css)?.[0] ?? ""
  ok(/place-items:\s*center/.test(luat) && !/place-items:\s*end/.test(luat),
    "8 · nhãn nằm GIỮA khung poster", luat.slice(0, 120))

  // Ở giữa cũng là chỗ icon/chi tiết ảnh, nên nhãn phải có nền ĐẶC — không thì
  // chữ chồng lên icon và không đọc nổi trên cả hai loại nền.
  ok(/<b>▶/.test(thanX) && /\.hv\.vid \.hv-play b\{[^}]*background:/.test(css),
    "8a · nhãn bọc `<b>` và có nền đặc — không chữ trần đè lên icon",
    "chữ trần ở giữa khung là thứ vừa phải sửa lại")

  // Nút ↻ CHỈ hiện khi đã có ảnh: đó là ca dùng đúng của nó ("tấm này sai, lấy
  // lại"). Bản ghi chưa có ảnh thì LÕI đã tự xếp việc; và với douyin thì job
  // chắc chắn hỏng, nên một cái nút ở đó là một cái nút lừa người.
  ok(/const lai = bia$/m.test(thanX) || /lai = bia\s*$/m.test(thanX)
     || /const lai = bia[\s\S]{0,10}\?/.test(thanX),
    "8b · nút ↻ chỉ dựng khi ĐÃ CÓ ảnh bìa",
    "hiện nó cho douyin là mời người bấm vào một việc chắc chắn hỏng")

  // Đo trong THÂN `layLaiAnhBia`, không quét cả file: chuỗi `ep: true` có thể
  // xuất hiện ở chỗ khác và làm vế này xanh oan. (Bản đầu quét cả file, và
  // phép thử gieo-lỗi cho thấy nó KHÔNG đỏ khi cờ bị gỡ — một vế trang trí.)
  const iL = FE.indexOf("async function layLaiAnhBia")
  const keL = FE.indexOf(NL + "function ", iL + 1)
  const thanL = iL < 0 ? "" : FE.slice(iL, keL < 0 ? FE.length : keL)
  ok(/data-act="anh-bia"/.test(thanX) && /"?ep"?:\s*true/.test(thanL),
    "8c · nút gọi job `sinh-thumbnail` kèm cờ `ep`",
    "thiếu `ep` thì job bị chính luật `đã có ảnh` chặn — bấm mãi không đổi gì")
  ok(/sinh-thumbnail/.test(thanL),
    "8c2 · và gọi ĐÚNG loại việc `sinh-thumbnail`", thanL.slice(0, 120))

  // Đường phải là `<loai>/<slug>`, và HAI đường mở cửa sổ mang hai hình dạng
  // khác nhau — đo được trên máy thật: mở từ danh sách thì `ban.slug` đã đầy
  // đủ; mở từ URL thì phong bì đặt `slug` = `url_normalized` và đường thật ở
  // `duong`. Đọc một trong hai thì một nửa số cửa sổ có nút không làm gì.
  ok(/ban\.duong \?\? ban\.slug/.test(thanX),
    "8d · đường lấy từ `duong ?? slug` — phủ CẢ HAI đường mở cửa sổ",
    "chỉ đọc `ban.duong` thì cửa sổ mở từ danh sách có nút chết câm")
  ok(/duong: slug,/.test(FE),
    "8e · phong bì `mo()` CÓ chép `duong` — nửa còn lại của cặp đó")
}


if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · douyin bóc được id, không nhúng bừa, và cửa sổ luôn có đường lùi\n")
