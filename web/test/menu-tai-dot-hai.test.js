/**
 * T03-121 · Menu "Tải xuống" đợt hai (`SCR-21`, duyệt 2026-09-06).
 *
 * NÓI TRƯỚC PHÉP ĐO NÀY KHÔNG LÀM ĐƯỢC GÌ:
 * `AC1` của `SCR-21` đòi đo **toạ độ thật** (`getBoundingClientRect`), mà bộ
 * test này chạy trên Node **không có DOM** — dự án cố ý không kéo
 * jsdom/playwright vào (`man-danh-muc.test.js` ghi lý do). Nên ở đây tôi đo
 * những **điều kiện quyết định** cái neo ấy, và phần hình học đo TAY trên
 * trình duyệt rồi ghi số vào worklog.
 *
 * Nói ra chỗ này vì một cổng im lặng về giới hạn của mình là một cổng cho
 * người ta tin nhầm rằng vế đó đã được canh.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const mwGoc = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.ts")
// Chú thích KHÔNG phải mã. Một vế đo cả văn xuôi thì nó đỏ vì một câu
// GIẢI THÍCH tại sao chuỗi ấy đã bị bỏ — đúng loại đỏ oan tệ nhất.
const mw = mwGoc.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const xuat = JSON.parse(doc("../../core/assets/xuat-dang.json"))

console.log("\nT03-121 · menu tải xuống đợt hai\n")

// ── 1 · NEO: điều kiện quyết định, đo được tĩnh ───────────────────────
//
// Menu bung giữa màn khi `.tx-ds{position:absolute}` không tìm thấy tổ tiên
// nào có `position` gần hơn — nó trèo lên tới `<body>`. Ba điều kiện phải
// cùng đúng, và cả ba nằm trong CÙNG một khối CSS tiêm.
ok(/details\.tx\{[^}]*position:\s*relative/.test(mw),
  "1 · `details.tx` có `position:relative`",
  "thiếu nó thì neo trèo lên tổ tiên xa hơn và menu bung ra giữa màn")
ok(/\.tx-ds\{[^}]*position:\s*absolute/.test(mw), "1b · `.tx-ds` neo tuyệt đối")
ok(/\.tx-ds\{[^}]*right:\s*0/.test(mw) && /\.tx-ds\{[^}]*bottom:\s*(100%|calc\()/.test(mw),
  "1c · neo vào MÉP PHẢI + ĐÁY nút (mở LÊN)")
// Neo chỉ đúng khi `.tx-ds` thật sự là con của `details.tx` trong markup.
ok(/<details class="tx"[^>]*>[\s\S]{0,200}?tx-ds/.test(mw)
  || /'<details class="tx">'[\s\S]{0,400}?tx-ds/.test(mw),
  "1d · markup: `.tx-ds` nằm TRONG `<details class=\"tx\">`",
  "CSS đúng mà DOM lồng sai thì neo vẫn sai — đây là vế CSS không nói được")
{
  // `--card` và `--background` là token KÍNH (alpha .72 / .8) — đo được
  // 2026-09-06. Nền menu phải ĐẶC, không thì chữ dưới lòi qua.
  const tok = doc("../../05_uiux/tokens.css")
  const nen = (mw.match(/\.tx-ds\{[^}]*background:\s*var\((--[a-z0-9-]+)\)/) ?? [])[1]
  ok(!!nen, "1e · `.tx-ds` lấy nền từ một token")
  const gt = nen ? [...tok.matchAll(new RegExp(`${nen}\\s*:\\s*([^;]+);`, "g"))].map((m) => m[1].trim()) : []
  ok(gt.length >= 2 && gt.every((v) => !/rgba\([^)]*,\s*0?\.\d/.test(v)),
    `1e2 · và token ấy ĐẶC ở cả hai hệ (${nen} = ${gt.join(" | ") || "?"})`,
    "nền trong suốt ⇒ chữ dưới lòi qua — đúng ảnh chủ dự án chụp")
}

// ── 1g · CHUỖI CSS TIÊM phải PARSE ĐƯỢC ───────────────────────────────
//
// Bug thật 2026-09-06: `TX_CSS` mở đầu bằng văn xuôi (chú thích bị bộ cắt của
// build gỡ mất cặp dấu), và bộ phân tích CSS nuốt cả đoạn ấy làm selector rác
// tới dấu `{` đầu tiên ⇒ RULE ĐẦU TIÊN BIẾN MẤT. Cổng đọc nguồn `.ts` không
// thấy được — ở đó chú thích còn nguyên.
{
  const m = mwGoc.match(/const TX_CSS = `([^`]*)`/)
  ok(!!m, "1g · tìm thấy chuỗi `TX_CSS`")
  const dau = (m?.[1] ?? "").split("\n").map((l) => l.trim()).filter(Boolean)[0] ?? ""
  ok(/^[@.#a-zA-Z\[:*]/.test(dau) && /[{,]/.test(dau),
    "1g2 · dòng ĐẦU của `TX_CSS` là một selector, không phải văn xuôi",
    `đo được: ${JSON.stringify(dau.slice(0, 70))} — một chữ trần ở đây nuốt `
    + "luôn rule kế tiếp, và không có lỗi nào được báo")
}
ok(/\.tx-ds\{[^}]*z-index:/.test(mw), "1f · có `z-index`")

// ── 2 · hết chữ "File gốc" mù mờ ──────────────────────────────────────
// Nhãn sống ở BẢNG KHAI, không ở mã màn — bản đầu của vế này đo `mw` nên nó
// XANH OAN ngay từ trước khi có một dòng mã nào.
ok(xuat.dang?.goc?.ten !== "File gốc",
  '2 · bảng khai KHÔNG còn dùng nhãn trống "File gốc"',
  "`goc` là khoá KỸ THUẬT; người bấm không biết mình sắp tải 2.8 MB hay 210 MB")
ok(!/File gốc/.test(mw), "2a · và mã màn (BỎ chú thích) không gõ cứng chuỗi ấy")
ok(typeof xuat.mime_ten === "object" && xuat.mime_ten !== null,
  "2b · `xuat-dang.json` có bảng `mime → tên người đọc`",
  "gõ cứng bảng mime trong FE là dựng nguồn khai thứ hai")
ok(/function nhanGoc|nhanBanGoc/.test(mw),
  "2c · có hàm dựng nhãn bản gốc từ `media[]`")
ok(/function coByte|doiByte|function cheByte/.test(mw),
  "2d · có hàm đổi byte sang chữ người đọc (MB/KB)")

// ── 3 · hộp thoại XÁC NHẬN cho mọi bản gốc nhị phân ───────────────────
//
// Chủ dự án chốt: hỏi cho MỌI bản gốc nhị phân, không ngưỡng byte. Dạng dẫn
// xuất (md/txt/docx/in) KHÔNG hỏi — hỏi ở đó là dạy người bấm Đồng ý mà không
// đọc, rồi họ bấm quen tay khi tới lượt file 210 MB.
ok(/data-taigoc|data-xacnhan/.test(mw),
  "3 · mục bản gốc đi qua một CHẶNG xác nhận, không tải thẳng")
{
  // Đường xác nhận MỚI phải đi qua hộp thoại của SẢN PHẨM (`hoi()`), không
  // `confirm()`. Đo trong thân hàm xử lý `data-taigoc`, không đo cả file:
  // `hoi()` CÓ SẴN một nhánh dự phòng `confirm()` từ trước lượt này (khi
  // markup `<dialog>` vắng) — đó là nợ `FR-022` của người khác, và bắt nó ở
  // đây là tố cáo oan `T03-121`.
  // `data-taigoc` là MARKUP; thân XỬ LÝ đọc nó qua `dataset.taigoc`. Bản đầu
  // của vế này cắt từ chỗ markup nên nó soi vào một khúc không có `hoi()`.
  const i = mw.indexOf("dataset.taigoc")
  const than = i > 0 ? mw.slice(i, i + 1600) : ""
  ok(/hoi\(\{/.test(than) || /await hoi\(/.test(than),
    "3b · xác nhận đi qua `hoi()` — hộp thoại SẢN PHẨM (`FR-022`)")
  ok(!/\bconfirm\(/.test(than), "3b2 · và KHÔNG `confirm()` trên đường ấy")
  // Bug thật 2026-09-06: handler đọc nút qua `nutAct` (`closest("[data-act]")`)
  // trong khi nút bản gốc mang `data-taigoc` — `nutAct` là `null`, handler ném
  // ngay dòng đầu và hộp thoại KHÔNG mở. Cổng cũ XANH cả trước lẫn sau; chỉ
  // phép đo trên trình duyệt thấy. Vế này là chỗ nó không lọt lại được.
  ok(!/nutAct\.dataset\.(taigoc|taibac)/.test(mw),
    "3b3 · handler đọc ĐÚNG nút của mình, không mượn `nutAct`",
    "nút bản gốc/bậc không mang `data-act`, nên `nutAct` là null")
}
// GHI NHẬN nợ có sẵn — vế này ĐỎ nghĩa là ai đó đã gỡ nhánh dự phòng, tin tốt.
ok(/return Promise\.resolve\(t\.nhap \? prompt\(/.test(mw),
  "3d · (ghi nhận) `hoi()` VẪN còn nhánh dự phòng `prompt()/confirm()`",
  "nợ `FR-022` CÓ SẴN trước T03-121 — ô backlog đã mở. Vế này đỏ ⇒ nợ đã trả, "
  + "bỏ vế đi")
{
  // Huỷ ⇒ 0 request. Đo tĩnh được một vế QUYẾT ĐỊNH: mục bản gốc không được
  // mang `download href` trần — có `href` là trình duyệt đã đi lấy file trước
  // khi ai kịp hỏi gì.
  const i = mw.search(/data-taigoc|data-xacnhan/)
  const quanh = i > 0 ? mw.slice(Math.max(0, i - 400), i + 400) : ""
  ok(i > 0 && !/<a class="tx-m" download href/.test(quanh),
    "3c · mục bản gốc KHÔNG phải `<a download href>` trần",
    "một hộp thoại hỏi xong mà request đã bay rồi là hộp thoại trang trí")
}

// ── 4 · màn video: BA NHÓM, không mục nào vừa mờ vừa chết ─────────────
// Đòi ĐÚNG markup tiêu đề nhóm, không chỉ đòi chuỗi có mặt: "VIDEO" nằm sẵn
// trong `video/mp4` và vài chỗ khác, nên phép so bằng `includes` XANH OAN.
// Tiêu đề nhóm dựng bằng helper, nên đo HAI vế rời: helper phát ra `tx-nhom`,
// và ba tên nhóm được truyền vào ĐÚNG helper ấy.
ok(/tx-nhom/.test(mw), "4 · có class tiêu đề nhóm `tx-nhom`")
for (const n of ["VIDEO", "TRANSCRIPT", "BẢN CHƯNG CẤT"]) {
  ok(new RegExp(`nhom\\("${n}"\\)`).test(mw) || new RegExp(`tx-nhom">${n}`).test(mw),
    `4 · menu có nhóm \`${n}\``)
}
ok(/chưa sinh/.test(mw),
  "4b · sản phẩm chưa có ⇒ nói RÕ `chưa sinh`",
  "giấu ⇒ người không biết chức năng tồn tại; mục chết ⇒ màn hứa thứ nó "
  + "không giao. Mờ + chỉ đường là lối duy nhất nói đủ ba vế")
{
  const i = mw.indexOf("chưa sinh")
  const quanh = i > 0 ? mw.slice(Math.max(0, i - 500), i + 500) : ""
  // `href="#"` LÀ một href, và bản đầu của cổng nhận nó — nên mục chết lọt
  // qua: bấm vào chỉ đổi URL thành `/video/#`. Đòi một việc THẬT: hoặc
  // `data-act` (đi cùng đường với nút ⚗ ở thanh chân), hoặc một `href` trỏ
  // tới một trang có thật.
  // Mục dựng bằng helper `chuaSinh`, nên đo THÂN HELPER — bản trước soi vào
  // CHỖ GỌI, ở đó chỉ có tên helper chứ không có markup.
  const iH = mw.indexOf("function chuaSinh")
  const thanH = iH > 0 ? mw.slice(iH, iH + 700) : ""
  ok(/data-act=/.test(thanH),
    "4c · mục mờ vẫn LÀM ĐƯỢC VIỆC (`data-act`), không chỉ có `href`")
  ok(!/href="#"/.test(mw),
    "4c2 · KHÔNG chỗ nào dùng `href=\"#\"` làm chỗ dựa",
    "bấm vào chỉ đổi URL thành `/video/#` — mục chết là lối TỆ NHẤT theo "
    + "chính SCR-21: màn hứa một thứ nó không giao")
}

// ── 5 · hàng CHẤT LƯỢNG, chỉ cho video URL ────────────────────────────
ok(/BAC_CL|bacChatLuong|chat_luong/.test(mw), "5 · có hàng bậc chất lượng")
ok(/360[\s\S]{0,60}1080/.test(mw) || /\[360, ?480, ?720, ?1080/.test(mw),
  "5b · bày ĐỦ 5 bậc (chủ dự án chốt)",
  "giấu 360 để tiết kiệm một dòng là bỏ rơi đúng người cần nó nhất")
{
  // MP4 người TẢI LÊN chỉ có một bản gốc — bày bậc cho nó là hứa một thứ
  // không tồn tại, và dựng bậc ấy nghĩa là transcode.
  // `url_normalized` có mặt sẵn khắp mã — đòi một HÀM có tên nói đúng việc.
  ok(/function laVideoUrl|const laVideoUrl/.test(mw),
    "5c · có `laVideoUrl(ban)` — hàng bậc CHỈ hiện khi bản ghi có URL nguồn",
    "MP4 người TẢI LÊN chỉ có một bản gốc; bày 480p cho nó là hứa một bậc "
    + "không tồn tại")
}
ok(/api\/tai-video\//.test(mw), "5d · mục tải trỏ cửa `/api/tai-video/<ulid>`")

// ── 6 · tải xong ⇒ TỰ LƯU về máy, không hỏi lại một câu đã trả lời ────
{
  const i = mw.indexOf("function theoDoiBac")
  const than = i > 0 ? mw.slice(i, i + 2600) : ""
  ok(/a\.click\(\)/.test(than),
    "6 · job xong ⇒ tự kích hoạt lưu về máy",
    "người đã bấm một lần để nói *tôi muốn file này*; bắt bấm lần nữa sau khi "
    + "chờ vài phút là hỏi lại một câu đã trả lời")
  ok(/replaceWith\(a\)/.test(than),
    "6b · nhưng VẪN giữ đường dẫn sau đó",
    "tải trượt hoặc xoá nhầm thì phải bấm lại được — một thứ tự lưu rồi biến "
    + "mất là một thứ không lấy lại được")
  ok(!/tx-b-chay[\s\S]{0,400}?\.click\(\)/.test(than.slice(0, 400)),
    "6c · KHÔNG tự bấm khi việc chưa xong")
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · menu neo đúng, nhãn nói thật, không mục chết")
process.exit(loi ? 1 : 0)
