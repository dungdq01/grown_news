/**
 * SCR-25 · T03-126 — THẺ 2 TẦNG: nền trực quan theo loại nguồn.
 *
 * Chủ dự án 2026-09-08: *"giao diện menu danh sách quá đơn giản… video
 * youtube/tiktok/douyin cần có nền tab, tài liệu doc/pdf/.md cũng vậy"*.
 * Bốn câu chốt: video chung `--c-video` khác ICON · tỉ lệ 4:3 · HOÃN vùng
 * lưới trang chủ. Câu 1 (*bài viết 1 tầng*) chủ dự án ĐẢO cùng ngày sau khi
 * nhìn màn thật — MỌI loại có nền; xem vế 1c-1e.
 *
 * ── Vế đắt nhất là §2c, và nó có tiền lệ ────────────────────────────────
 * `WO-022`: hạ chữ thường cả URL làm id YouTube `dQw4w9WgXcQ` thành
 * `dqw4w9wgxcq` — id sai VẪN khớp `^[A-Za-z0-9_-]{11}$` nên không cổng nào
 * kêu, và khung nhúng trỏ vào một video KHÁC. `nguonCua()` đang `toLowerCase()`
 * cả URL, nên phép rút id cho ytimg mà mượn chuỗi ấy là lặp lại đúng bug.
 * Mock có sẵn `dQw4w9WgXcQ` — dùng đúng nó làm fixture.
 *
 * §3b là vế "0 dòng FE": thêm một mime vào bảng khai thì thẻ tự có nền. Đo
 * bằng cách cấm FE gõ tên định dạng, KHÔNG bằng cách tin một lời khai.
 */
import { readFileSync } from "node:fs"
import { trangHtml, napRender, taiSan } from "./_render.mjs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const NL = String.fromCharCode(10)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const MIME = JSON.parse(doc("../../core/assets/media-mime.json"))
/*
 * Cắt từ mốc `id="X"` tới mốc `id=` KẾ TIẾP. KHÔNG cắt tới `</div>` đầu tiên:
 * thân thẻ có `<div class="mt">`, nên phép ấy dừng giữa thẻ THỨ NHẤT.
 */
const vung = (h, id) => {
  const i = h.indexOf(`id="${id}"`)
  if (i < 0) return ""
  const j = h.indexOf('id="', i + 5)
  return h.slice(i, j < 0 ? h.length : j)
}

const html = await trangHtml("tat-ca")
const src = boCT(doc("../render/trang.mjs"))

/*
 * ⚠️ MỌI phép tra thẻ chạy trên VÙNG `grid2` (màn Tất cả), KHÔNG trên cả trang.
 * Một `shell` chứa markup của MỌI màn, và vùng lưới TRANG CHỦ đứng TRƯỚC trong
 * tài liệu — nên `html.indexOf('data-nguon="article"')` bắt trúng thẻ của lưới
 * trang chủ, đúng vùng mà tầng nền CỐ Ý tắt. Đo ở đó thì mọi vế "không có nền"
 * xanh vĩnh viễn: phép thử đỏ-được 2026-09-08 bắt được ba vế chết vì lỗi này.
 */
const G2 = vung(html, "grid2")

/** Cắt đúng MỘT thẻ `.cd` chứa `khoa`. */
const the = (h, khoa) => {
  const i = h.indexOf(khoa)
  if (i < 0) return ""
  const d = h.lastIndexOf("<button", i)
  const c = h.indexOf("</button>", i)
  return d < 0 || c < 0 ? "" : h.slice(d, c)
}

console.log("\nSCR-25 · thẻ 2 tầng — nền theo loại nguồn\n")

// ── 1 · TẦNG NỀN có mặt trên MỌI loại, và ai trả byte cho màu ───────────
{
  const tVideo = the(G2, 'data-nguon="youtube"')
  const tPdf = the(G2, 'data-nguon="pdf"')
  const tBai = the(G2, 'data-nguon="article"')

  ok(tVideo !== "", "0 · trang /tat-ca/ có thẻ video youtube (fixture còn sống)")
  ok(tPdf !== "", "0b · có thẻ tài liệu pdf")
  ok(tBai !== "", "0c · có thẻ bài viết article")

  ok(/class="cd-n"|class="cd-n /.test(tVideo), "1 · thẻ video CÓ tầng nền `.cd-n`")
  ok(/class="cd-n"|class="cd-n /.test(tPdf), "1b · thẻ tài liệu CÓ tầng nền")
  // ĐẢO 2026-09-08: chủ dự án nhìn màn thật rồi đổi câu 1 — *"tài liệu và bài
  // viết chưa có"*. Lưới đều một nhịp thắng lý lẽ "khung trống là hứa hão".
  ok(/class="cd-n"|class="cd-n /.test(tBai),
    "1c · thẻ BÀI VIẾT CŨNG có tầng nền (câu 1 ĐẢO 2026-09-08)")
  ok(!tVideo.includes('style="--nm:') && !tBai.includes('style="--nm:'),
    "1d · bài viết và video KHÔNG trả byte cho `--nm` — chúng đọc `--c` của thẻ",
    "`--c: var(--c-<source_type>)` đã có sẵn; một style nữa là N byte trên MỌI trang")
  ok(tPdf.includes('style="--nm:var(--c-pdf)"'),
    "1e · TÀI LIỆU thì CÓ `--nm` — source_type của cả 5 định dạng đều là `tai-lieu`")
}

// ── 2 · YOUTUBE — ảnh ytimg dựng từ id ──────────────────────────────────
{
  const t = the(G2, "dQw4w9WgXcQ")
  ok(/i\.ytimg\.com\/vi\/dQw4w9WgXcQ\/hqdefault\.jpg/.test(t),
    "2 · nền là ảnh ytimg dựng từ id ĐÃ PARSE")
  ok(/loading="lazy"/.test(t), "2b · ảnh mang loading=\"lazy\"")

  // WO-022 · vế IM LẶNG: id hạ chữ thường vẫn khớp regex 11 ký tự.
  ok(!/dqw4w9wgxcq/.test(html),
    "2c · id GIỮ hoa-thường — 0 lần `dqw4w9wgxcq` trong cả trang",
    "WO-022: id hạ chữ vẫn khớp ^[A-Za-z0-9_-]{11}$ ⇒ trỏ NHẦM video, không cổng nào kêu")

  ok(/onerror=/.test(t), "2d · ảnh có onerror")
  ok(/onerror="[^"]*(remove|hidden|this\.style)/.test(t),
    "2e · onerror THẬT SỰ gỡ ảnh (rơi về nền màu), không phải thuộc tính suông",
    "một onerror trỏ hàm không tồn tại vẫn khớp phép grep `onerror=`")

  // Video không phải youtube ⇒ KHÔNG được dựng ytimg từ id rỗng.
  ok(!/ytimg\.com\/vi\/\/|ytimg\.com\/vi\/undefined/.test(html),
    "2f · không host nào khác sinh ra một URL ytimg rỗng")
}

// ── 3 · TÀI LIỆU — màu TỪ BẢNG KHAI, icon từ THƯ MỤC ────────────────────
{
  const t = the(G2, 'data-nguon="pdf"')
  ok(/--c-pdf/.test(t) || /--the-mau:\s*var\(--c-pdf\)/.test(t),
    "3 · thẻ pdf lấy màu `--c-pdf`")

  const taiLieu = MIME.loai.filter(
    (l) => !l.chi_dan_xuat && l.nhom_thu_vien !== "video" && l.chip_loc !== false)
  ok(taiLieu.every((l) => typeof l.mau === "string" && l.mau.startsWith("--")),
    "3a · MỌI dòng tài liệu trong bảng khai có cột `mau` là TÊN TOKEN",
    `thiếu: ${taiLieu.filter((l) => !l.mau).map((l) => l.duoi).join(" ") || "—"}`)
  ok(!MIME.loai.some((l) => /#[0-9a-fA-F]{3,8}/.test(String(l.mau ?? ""))),
    "3a2 · 0 mã hex trong bảng khai — giá trị sống ở tokens.css")

  // "0 dòng FE đổi": FE không được gõ tên định dạng nào.
  // Cửa sổ đo là THÂN HÀM `nenThe`, không phải N ký tự SAU chuỗi "cd-n" —
  // "cd-n" nằm ở CUỐI hàm, nên cửa sổ tiến tới bỏ sót toàn bộ phần suy màu và
  // suy icon phía trên nó (phép thử đỏ-được 2026-09-08 bắt được).
  const i0 = src.indexOf("function nenThe")
  const nen = i0 < 0 ? "" : src.slice(i0, src.indexOf(NL + "}", i0))
  ok(i0 >= 0, "3b0 · tìm được thân hàm `nenThe` để đo")
  ok(nen.includes("cd-n") && !/["'](pdf|docx|pptx|md|txt)["']/.test(nen),
    "3b · thân `nenThe` KHÔNG gõ tên định dạng nào — thêm 1 mime = 0 dòng FE")

  // Video dùng CHUNG --c-video (chốt câu 2): không đẻ token theo host.
  ok(!/--c-(youtube|tiktok|douyin|fb)\b/.test(src + doc("../../05_uiux/tokens.css")),
    "3c · KHÔNG token màu riêng cho youtube/tiktok/douyin/fb (chốt câu 2)")
  // MỌI `source_type` phải có token màu — thiếu thì thẻ rơi về `--ink-3` và
  // hai loại khác nhau trông y hệt.
  const tok = doc("../../05_uiux/tokens.css")
  for (const st of ["article", "repo", "paper", "docs", "announcement", "video"])
    ok(tok.includes(`--c-${st}:`), `3e · có token \`--c-${st}\``)
  ok(/--c-video/.test(the(G2, 'data-nguon="tiktok"') || the(G2, 'data-nguon="youtube"')),
    "3d · thẻ video dùng chung `--c-video`")
}

// ── 4 · HIỆN VẬT thumbnail THẮNG ytimg (AC3 — chờ T12-29) ───────────────
{
  const m = await napRender()
  const d = m.duLieuMock()
  const v = d.bans.find((b) => String(b.url_normalized ?? "").includes("dQw4w9WgXcQ"))
  ok(!!v, "4 · tìm được bản ghi video mock để gieo hiện vật")
  if (v) {
    const sha = "a1".repeat(32)
    const banSao = {
      ...d,
      bans: d.bans.map((b) => (b === v
        ? { ...b, media: [{ sha256: sha, mime: "image/jpeg",
                            ten_goc: "thumb.jpg", so_byte: 4096 }] }
        : b)),
    }
    const h2 = m.renderTrang("tat-ca", banSao)
    const t2 = the(h2, sha)
    ok(t2 !== "" && t2.includes(`/api/articles/media/${sha}`),
      "4a · có hiện vật ảnh ⇒ nền dùng ĐƯỜNG KHO, không ytimg")
    ok(!/ytimg\.com\/vi\/dQw4w9WgXcQ/.test(t2),
      "4b · hiện vật THẮNG ytimg — thẻ đó không còn URL ngoài",
      "ảnh trong kho không hết hạn và không phụ thuộc domain ngoài")
  }
}

// ── 5 · TỈ LỆ 4:3 và ô nền KHÔNG do ảnh quyết chiều cao ─────────────────
{
  const { gnCss } = await taiSan()
  const css = gnCss.replace(/\/\*[^]*?\*\//g, "")
  const khoi = css.slice(css.indexOf(".cd-n"), css.indexOf(".cd-n") + 400)
  ok(css.includes(".cd-n"), "5 · gn.css có luật `.cd-n`")
  ok(/aspect-ratio:\s*4\s*\/\s*3/.test(khoi),
    "5a · tỉ lệ 4/3 khai bằng aspect-ratio (chốt câu 3)",
    "chiều cao do TỈ LỆ quyết, không do ảnh — ảnh hỏng thì layout không xê")
  ok(/object-fit:\s*cover/.test(css), "5b · ảnh nền object-fit:cover")

  /*
   * ⚠️ Vế 5c-5e mở sau khi CHỦ DỰ ÁN NHÌN THẤY lỗi mà cổng không thấy
   * (2026-09-08): 19 luật mask nay là `[data-i=x]::before`, nhưng phần khai
   * `content`/`background`/`mask-size` vẫn nằm ở `.fl-b[data-i]::before` —
   * luật KHÔNG còn khớp `.cd-n`. Hệ quả: thẻ tài liệu ra ĐÚNG MÀU và MẤT
   * GLYPH, trong khi 5·5a·5b đều xanh. Một `::before` thiếu `content` không
   * tồn tại; đo "có luật `.cd-n`" không đo được điều đó.
   */
  const kn = css.slice(css.indexOf(".cd-n[data-i]::before"),
                       css.indexOf(".cd-n[data-i]::before") + 300)
  ok(css.includes(".cd-n[data-i]::before"), "5c · có luật glyph cho `.cd-n[data-i]`")
  ok(/content:\s*""/.test(kn),
    "5d · luật glyph khai `content` — thiếu nó thì pseudo KHÔNG TỒN TẠI",
    "màu nền vẫn đúng, glyph biến mất, và không vế nào khác kêu")
  ok(/background:\s*currentColor/.test(kn) && /mask-size/.test(kn) && /mask-repeat/.test(kn),
    "5e · luật glyph tự khai đủ background + mask-size + mask-repeat",
    "`.fl-b[data-i]::before` khai chúng, nhưng luật ấy không khớp `.cd-n`")

  // Và mask-image phải dùng CHUNG được: 19 luật đã bỏ tiền tố `.fl-b`.
  ok(css.includes(NL + "[data-i=pdf]::before{mask-image"),
    "5f · luật mask dùng chung chip + thẻ (0 tiền tố `.fl-b`)")
}

// ── 6 · VÙNG LƯỚI TRANG CHỦ hoãn (chốt câu 4) ───────────────────────────
//
// ⚠️ Đo CẤU TRÚC, không đếm thẻ trên mock. Bốn thẻ của lưới trang chủ trong
// `kb-mock` HIỆN đều là `bai-viet` — loại vốn không có nền — nên phép đếm
// "vùng grid có 0 cd-n" xanh dù cờ `coNen` bật hay tắt. Đó là một cổng chết,
// và phép thử đỏ-được 2026-09-08 bắt đúng nó. Hai vế dưới đây đỏ NGAY khi ai
// lật cờ, không phụ thuộc mock có bản ghi loại nào.
{
  ok(/\$\{coNen \? nenThe\(b\) : ""\}/.test(src),
    "6 · `the()` đặt tầng nền SAU cờ `coNen` — có chỗ để tắt")
  ok(/the\(b, iCua\(b\), false\)/.test(src),
    "6a · chỗ gọi của lưới TRANG CHỦ truyền `false` (chốt câu 4)",
    "page-weight trang chủ ĐỎ 61708/61440 TRƯỚC đơn vị này — không gánh nợ người khác")
  ok((src.match(/the\(b, iCua\(b\), false\)/g) ?? []).length === 1,
    "6b · ĐÚNG MỘT chỗ tắt — ba màn danh sách và /tat-ca/ vẫn có nền")
  ok(G2.includes("cd-n"), "6c · vùng màn Tất cả CÓ nền — cờ tắt đúng vùng, không tắt tính năng")
}

// ── 7 · GỌN THẺ — chiều cao cố định, nền/chữ = 6/4 (chủ dự án 2026-09-08) ──
//
// Cổng này đo KHAI BÁO CSS, không đo bố cục dựng xong — node không có trình
// duyệt. Số bố cục đã đo một lần bằng máy thật (9/9 thẻ: cao 256px · nền 152px
// · 0 thẻ tràn chữ) và ghi vào worklog; vế dưới đây canh cho ba khai báo sinh
// ra con số ấy không bị đổi lặng lẽ.
{
  const { gnCss } = await taiSan()
  const css = gnCss.replace(/\/\*[^]*?\*\//g, "")
  const lay = (sel) => {
    const i = css.indexOf(sel)
    return i < 0 ? "" : css.slice(i, css.indexOf("}", i))
  }
  ok(/height:\s*17\.375rem/.test(lay(".cd:has(.cd-n){")),
    "7 · thẻ có nền mang CHIỀU CAO CỐ ĐỊNH 17.375rem = 278px",
    "`aspect-ratio` nhân theo bề rộng cột ⇒ màn rộng thẻ cao trở lại, đúng thứ phải hạ")
  ok(/flex:\s*0 0 60%/.test(lay(".cd:has(.cd-n) .cd-n{")),
    "7a · nền chiếm ĐÚNG 60% (chốt 6/4)")
  // Khai LẠI `.cd-n{}` lần hai là đúng lớp lỗi mà khối `.cd` ở trên đã phải
  // viết một đoạn chú thích để bào chữa. Một selector có phạm vi thì không cần.
  ok(css.split("}").filter((b) => b.split("{")[0].trim() === ".cd-n").length === 1,
    "7a2 · chỉ MỘT luật `.cd-n{}` trần — bản gọn dùng selector có phạm vi")
  ok(!/margin-top:\s*auto/.test(lay(".cd:has(.cd-n) .mt{")),
    "7b · thẻ gọn KHÔNG còn `.mt{margin-top:auto}`",
    "nó đẩy meta xuống đáy và ép tít tràn ra ngoài 40% ⇒ tít bị CẮT NGANG DÒNG")
  ok(/position:\s*absolute/.test(lay(".cd:has(.cd-n) .tg{")),
    "7c · badge loại ĐÈ LÊN ảnh — trả ~22px lại cho tít")
  ok(/font-size:\s*var\(--fs-nano\)/.test(css) && /--fs-nano/.test(doc("../../05_uiux/tokens.css")),
    "7d · chữ phụ hạ xuống `--fs-nano`, và token đó có thật")

  // FOOTER MỘT DÒNG. Chủ dự án 2026-09-08: *"phần footer của tab chiếm nhiều
  // diện tích quá"* — `.mt` và `.cts` là hai hàng liên tiếp, ăn ~34px trong
  // vùng chữ chỉ có ~90px. Neo cả hai vào đáy thẻ ⇒ một dòng ~16px.
  for (const [sel, ten] of [[".cd:has(.cd-n) .mt{", "meta"], [".cd:has(.cd-n) .cts{", "chip"]])
    ok(/position:\s*absolute/.test(lay(sel)) && /bottom:\s*var\(--s-2xs\)/.test(lay(sel)),
      `7f · ${ten} neo vào ĐÁY thẻ — footer một dòng, không hai`)
  ok(!/margin-top:\s*auto/.test(lay(".cd:has(.cd-n) .cts{")),
    "7g · chip KHÔNG còn `margin-top:auto` — nó là cách đẩy của bố cục CŨ")
  // Lưới TRANG CHỦ không có nền ⇒ KHÔNG bị ép 16rem (một ô trống 102px vô nghĩa).
  ok(lay(".cd:has(.cd-n){").length > 0 && !/^\.cd\{height:16rem/m.test(css),
    "7e · chiều cao cố định chỉ áp cho thẻ CÓ nền, không áp cho mọi `.cd`")
}

console.log(loi ? `\n${loi} lỗi\n` : "\nĐủ vế — thẻ 2 tầng\n")
process.exit(loi ? 1 : 0)
