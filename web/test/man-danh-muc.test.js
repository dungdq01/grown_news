#!/usr/bin/env node
/**
 * FR-021 · màn Danh mục — bốn tab (WO-016), phân trang, popup tạo/sửa nhãn.
 *
 * VÌ SAO CẦN: ba thứ này là JS chạy trên trình duyệt. Không test nào canh chúng —
 * type-check xanh, build xanh, và trang vẫn hỏng nếu mốc bị đổi tên hoặc handler
 * không nối. Cùng lớp lỗi với bug nhãn dài phình cột: chỉ hiện khi có người bấm.
 *
 * Quét TĨNH (markup + bundle) chứ không chạy trình duyệt: repo không có
 * playwright/jsdom, và thêm một phụ thuộc để kiểm ba mốc là không tương xứng
 * (security_baseline §7). Thứ kiểm được tĩnh: mốc có mặt · handler nối đúng
 * `data-*` · popup là <dialog> · số hàng khớp ngưỡng phân trang.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
const loi = []
const ok = (dieu, chu, them = "") => {
  console.log(`  ${dieu ? "ok  " : "FAIL"} ${chu}`)
  if (!dieu) loi.push(chu + (them ? ` — ${them}` : ""))
}

// FR-034/C5 · nguồn đổi từ output build sang renderTrang/taiSan — assertion giữ nguyên.
const html = await trangHtml("khai-niem")
const TAI_SAN = await taiSan()
const js = TAI_SAN.gnJs
const css = TAI_SAN.gnCss

console.log("\n1 · Bốn tab — nút, panel, và handler nối được\n")

/*
 * BẤT BIẾN thay cho con số cứng (WO-016).
 *
 * Bản trước ghim `=== 3` tab và `=== 2` panel đóng. Tab thứ tư — loại nguồn —
 * làm cả hai đỏ vì một lý do KHÔNG liên quan tới thứ chúng canh, và cách sửa dễ
 * nhất là bump số lên 4, tức phép kiểm không còn nói gì.
 *
 * Điều thật sự phải đúng: mỗi tab có ĐÚNG MỘT panel, và ĐÚNG MỘT panel đang mở.
 * Hai câu đó đúng với 3 tab, với 4, và với tab thứ năm ai thêm sau.
 */
const TAB_PHAI_CO = ["cpt", "cat", "cho", "nguon"]
const tabCo = [...html.matchAll(/data-dmtab="([a-z]+)"/g)].map((m) => m[1])
const viewCo = [...html.matchAll(/data-dmview="([a-z]+)"/g)].map((m) => m[1])
for (const t of TAB_PHAI_CO) {
  ok(tabCo.includes(t), `có nút tab \`${t}\``)
  ok(viewCo.includes(t), `có panel \`${t}\``)
}
ok(new Set(tabCo).size === tabCo.length,
  `${tabCo.length} tab, không tab nào khai hai lần`,
  `thấy [${tabCo}] — trùng khoá thì hai nút cùng mở một panel`)
ok(JSON.stringify([...tabCo].sort()) === JSON.stringify([...viewCo].sort()),
  "mỗi tab có ĐÚNG MỘT panel, và ngược lại",
  `tab [${[...tabCo].sort()}] · panel [${[...viewCo].sort()}] — `
  + "một tab không panel là bấm vào thấy vùng trắng; một panel không tab là "
  + "nội dung không ai vào được")
ok(js.includes("data-dmtab"), "bundle có handler đọc data-dmtab — nút không phải trang trí")
// Đúng MỘT panel mở: mọi panel còn lại phải `hidden`, không thì chúng hiện
// cùng lúc và màn thành một cột dài không ai đọc.
const dong = (html.match(/data-dmview="[a-z]+" hidden/g) ?? []).length
ok(dong === viewCo.length - 1,
  `${dong}/${viewCo.length} panel đóng sẵn — đúng MỘT panel mở`,
  "hơn một panel mở ⇒ cả màn hiện cùng lúc; không panel nào mở ⇒ màn trắng")
// Đếm trên CHÍNH các nút dm-tab, không quét cả trang: màn Nạp nguồn cũng có
// `aria-selected="true"` và bản đầu của phép kiểm này bắt lẫn nó.
const nutTab = html.match(/<button[^>]*data-dmtab="[a-z]+"[^>]*>/g) ?? []
const dangChon = nutTab.filter((b) => /aria-selected="true"/.test(b))
ok(dangChon.length === 1 && /data-dmtab="cpt"/.test(dangChon[0]),
  "đúng MỘT tab mang aria-selected=true, và đó là tab đầu",
  `${dangChon.length} tab được chọn`)

console.log("\n2 · Phân trang — client-side, có mốc và có handler\n")

for (const t of ["cpt", "cat", "cho"]) {
  ok(html.includes(`id="pg-${t}"`), `có mốc phân trang \`pg-${t}\``)
}
ok(js.includes("DM_MOI_TRANG"), "bundle có ngưỡng mục/trang")
ok(js.includes("data-dmpg"), "bundle có handler đổi trang")
// `.pgn` là CSS của phân trang màn Tất cả — dùng lại, không viết bản thứ hai.
ok(/\.dm-pgn button\{/.test(css), "nút phân trang có CSS riêng (là <button>, không phải <a>)")
ok(/\.dm-pgn button:disabled\{/.test(css),
  "nút vô hiệu có trạng thái thấy được — trang 1 không được trông như bấm được")

// Ngưỡng phải khớp giữa JS và số hàng thật, nếu không nav ẩn mà vẫn còn hàng bị che.
const mNg = js.match(/DM_MOI_TRANG\s*=\s*(\d+)/)
const nguong = mNg ? Number(mNg[1]) : 0
const soHang = (html.match(/class="rc-r r-cpt/g) ?? []).length
ok(nguong > 0, `đọc được ngưỡng: ${nguong} mục/trang`)
// FR-031 · danh mục có thể RỖNG (người dùng xoá sạch để nhập lại). Điều PHẢI
// đúng ở cả hai nhánh: số hàng không bao giờ vượt ngưỡng một trang mà thiếu nav
// phân trang — đó mới là lỗi "hàng bị che". Số hàng = 0 chỉ là kho rỗng.
ok(soHang <= nguong || /dm-pgn/.test(html),
   `${soHang} hàng khái niệm / ngưỡng ${nguong} — vượt ngưỡng thì phải có nav phân trang`,
   "nhiều hàng hơn một trang mà không có nav = hàng bị che, không ai tới được")

console.log("\n3 · Popup — <dialog> native, không phải div tự dựng\n")

ok(/<dialog[^>]*id="dlg-nhan"/.test(html), "popup TẠO là <dialog>")
ok(/<dialog[^>]*id="dlg-sua"/.test(html), "popup SỬA là <dialog>")
ok(js.includes("showModal()"),
  "dùng showModal() — focus-trap/ESC/backdrop do trình duyệt lo, không tự viết")
ok(/\.dlg::backdrop\{/.test(css), "có tạo hình cho ::backdrop")
ok(/\.dlg:not\(\[open\]\)\{display:none\}/.test(css),
  "dialog đóng phải ẩn bất kể body.api-co — `.api-only` bên trong là display:block")

// MỌI form phải api-only (AC-2.5.1). Form trong dialog cũng là form.
const forms = html.match(/<form[^>]*>/g) ?? []
ok(forms.length > 0 && forms.every((f) => /\bapi-only\b/.test(f)),
  `${forms.length} form trên màn này, tất cả api-only`,
  forms.filter((f) => !/api-only/.test(f)).join(" "))

ok(html.includes('data-mopopup="cpt"') && html.includes('data-mopopup="cat"'),
  "hai nút mở popup — mỗi danh mục một nút")
ok(js.includes("data-mopopup"), "bundle có handler mở popup")
ok(js.includes("data-dlgdong"), "bundle có handler đóng popup")
// Nút tạo nằm trong .api-only: bundle tĩnh không được mời người bấm rồi 404.
ok(/data-mopopup="cpt"[^>]*>/.test(html)
  && /class="bt pri sm api-only" data-mopopup/.test(html),
  "nút tạo mang api-only — bundle tĩnh không hiện đường ghi")

console.log("\n4 · Không còn prompt() cho việc sửa nhãn\n")

// prompt() không sửa được nhiều ô, không validate được, và không hiện lỗi từ
// server tại chỗ. Popup thay nó — nhưng phải chắc bản cũ đã đi hẳn.
ok(!/prompt\(\s*`Nhãn tiếng Việt cho/.test(js), "bản prompt() sửa nhãn đã xoá")
ok(js.includes("dlg-sua-nhan"), "popup sửa nối vào bundle")

console.log("\n5 · Màu — chỉ dùng token đã audit, không sinh hue mới\n")

// contrast-audit.json: 50/50 pass WCAG AA. Thêm màu ngoài đó là phá hợp đồng G5.
// BỎ COMMENT trước khi soi: comment giải thích thường TRÍCH hex để nói vì sao
// một màu bị loại ("nút đỏ đặc #B3261E dàn dọc trang"). Bản đầu của phép kiểm
// này báo sai đúng vì thế — hex trong comment không phải hex gõ tay.
const khoiDm = css.slice(css.indexOf(".dm-tabs{")).replace(/\/\*[\s\S]*?\*\//g, "")
const hexLa = [...khoiDm.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0])
ok(hexLa.length === 0, "không hex gõ tay trong khối màn Danh mục",
  `thấy: ${hexLa.join(" ")}`)
//  PHAI co trong danh sach nay: vong nay la thu duy nhat canh mot
// tab moi khong sinh hue moi, va mot tab khong duoc liet ke thi khong duoc canh.
for (const [lop, bien] of [["t-cpt", "--brand"], ["t-cat", "--ok"],
                           ["t-cho", "--warn"], ["t-nguon", "--vien-nhan"]]) {
  ok(new RegExp(`\\.dm-tab\\.${lop}\\{border-top-color:var\\(${bien}\\)`).test(css),
    `tab ${lop} dùng ${bien} (đã audit)`)
}

console.log("\n6 · FR-028 · màn Danh mục đọc API, không đọc bản build\n")

// ── 6a · hai bản `hangNhan` không lệch ──────────────────────────────────
//
// Emitter in hàng nhãn lúc build; FE in lại hàng ấy từ API. Song sinh có chủ ý
// (hai đích biên dịch), nhưng thiếu một `data-*` ở bản FE là nút chết IM LẶNG:
// markup có, CSS có, chỉ handler không tìm thấy gì để bắt. Cùng cổng mà
// `api-index-khong-can-build` mục 4 dựng cho `the()`/`theFE()`.
// FR-034/C5 · bản "emitter" sống ở web/render/trang.mjs (port từ index.ts).
const em = readFileSync(join(WEB, "render", "trang.mjs"), "utf8")
const fe = readFileSync(
  join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")

/*
 * BÓC COMMENT TRƯỚC KHI SO — và đây là một lỗi phép kiểm THẬT đã xảy ra.
 *
 * Bản trước so chuỗi trên NGUYÊN VĂN nguồn, comment và tất cả. FR-031 đổi bản
 * FE (nút "xoá" thay chữ "đang dùng") mà chưa đổi bản emitter — đúng thứ phép
 * kiểm này tồn tại để bắt. Nó vẫn XANH, vì comment tôi vừa viết trong hàm FE có
 * chứa mấy chữ "đang dùng" để giải thích cái vừa bỏ.
 *
 * Tức là: phép kiểm đối chiếu hai bản CÀI ĐẶT lại đi đọc hai bản VĂN XUÔI. Một
 * dòng giải thích đủ để nó tin rằng markup còn nguyên.
 *
 * Từ giờ nó chỉ đọc mã.
 */
const boCmt = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
const khoiEm = boCmt(em.slice(em.indexOf("const hangNhan = ("), em.indexOf('chen(shell, "cchua"')))
const khoiFe = boCmt(fe.slice(fe.indexOf("function hangNhanFE("), fe.indexOf("function barCptFE(")))
ok(khoiEm.length > 0 && khoiFe.length > 0, "tìm được cả hai khối để so")

// `đang dùng` KHÔNG còn trong danh sách: FR-031 bỏ nó khỏi markup (nhãn đang
// dùng giờ có nút xoá thật). `data-dung` vào thay — nó là thứ mang số bài sang
// cho hộp xác nhận, và thiếu nó ở một bản là hộp thoại hỏi sai câu.
for (const t of ["rc-r", "r-dung", "rc-act", "data-suanhan", "data-nhan", "data-gom",
  "data-xoanhan", "data-dung", "bt ghost sm api-only", "bt dstr sm api-only"]) {
  const a = khoiEm.includes(t), b = khoiFe.includes(t)
  ok(a && b, `cả hai bản hàng nhãn có \`${t}\``, `emitter:${a} FE:${b}`)
}
// Chiều ngược: chữ "đang dùng" phải ĐI KHỎI CẢ HAI bản. Còn ở một bên nghĩa là
// một bên vẫn khoá nút xoá, và người dùng gặp lại đúng điều họ vừa báo.
for (const [ten, khoi] of [["emitter", khoiEm], ["FE", khoiFe]]) {
  ok(!khoi.includes("đang dùng"), `bản ${ten} không còn in chữ "đang dùng" thay nút`,
     "nhãn đang dùng cũng phải xoá được — đó là điều người dùng yêu cầu mở")
}

// Bar khái niệm cũng là song sinh — và nó mang `data-loc`/`data-gt`, tức đường
// LỌC. Lệch là bấm vào bar không lọc được gì.
const barEm = em.slice(em.indexOf('shell = chen(shell, "cb"'), em.indexOf('shell = chen(shell, "ccount"'))
const barFe = fe.slice(fe.indexOf("function barCptFE("), fe.indexOf("function datMoc("))
/**
 * FR-030 · nhãn đang dùng vẽ bằng HÀNG, không bằng bar — cả hai bản.
 *
 * Đo trên dữ liệu thật: mọi cột dài 50%/100% (mock) hoặc TOÀN BỘ 100% (real).
 * Độ dài cột không mang thông tin, nên nó không phải biểu đồ.
 *
 * Phép kiểm đổi THỨ ĐO nhưng giữ Y NGUYÊN ý định: hai bản song sinh không được
 * lệch, và đường LỌC (`data-loc`/`data-gt`) phải còn ở cả hai. Tôi đổi bản
 * emitter mà quên bản FE, và chính phép kiểm này bắt được — nếu để nguyên thì
 * sau một lần thêm nhãn, danh sách lặng lẽ quay về bar.
 */
for (const x of ['data-loc="cpt"', "data-gt=", 'aria-pressed="false"',
  'class="rc-r r-cpt r-dung"', "<time>", "<code>", 'class="rc-act"']) {
  const a = barEm.includes(x), b = barFe.includes(x)
  ok(a && b, `cả hai bản hàng nhãn có \`${x}\``, `emitter:${a} FE:${b}`)
}
// Và KHÔNG bản nào còn vẽ thanh — giữ lại một bản là giữ lại đúng thứ vừa bỏ.
for (const x of ['class="bw"', 'class="bn"', 'class="br brc"']) {
  ok(!barEm.includes(x) && !barFe.includes(x), `không bản nào còn \`${x}\``,
     `emitter:${barEm.includes(x)} FE:${barFe.includes(x)}`)
}
// Cả hai sắp GIẢM DẦN theo số bài — thứ tự tuỳ ý bắt người dùng quét cả danh sách.
ok(/sort\(\(a, b\) => \(demCpt\[b\.id\] \?\? 0\) - \(demCpt\[a\.id\] \?\? 0\)\)/.test(barEm),
   "bản emitter sắp giảm dần theo số bài")
ok(/sort\(\(a, b\) => b\.dang_dung - a\.dang_dung\)/.test(fe),
   "bản FE sắp giảm dần theo số bài")

// ── 6b · vẽ lại ĐÚNG mốc là hàm của danh mục, không hơn ─────────────────
//
// Vẽ thiếu ⇒ màn hình nửa mới nửa cũ. Vẽ thừa ⇒ dựng lại khối 3D từ JS và mất
// hoạt hình `data-bar` (chạy lúc tải trang, không chạy lại).
const khoiVe = fe.slice(fe.indexOf("function veDanhMuc("), fe.indexOf("function doiNhan3D("))
for (const m of ["cb", "ccount", "cchua", "catlist", "catcount", "dmn-cpt", "dmn-cat"]) {
  ok(khoiVe.includes(`"${m}"`), `veDanhMuc vẽ lại mốc \`${m}\` (hàm của danh mục)`)
}
for (const m of ["cprop", "pcount", "pnguong", "mbdm"]) {
  ok(!khoiVe.includes(`"${m}"`), `veDanhMuc KHÔNG đụng \`${m}\` (hàm của bài viết)`)
}
ok(khoiVe.includes("veDm()"),
  "vẽ xong gọi lại phân trang — hàng mới mà không tính lại là trang 2 hiện rỗng")

// ── 6c · năm toast của nhãn không còn nhắc build ────────────────────────
//
// Đây là câu người dùng nhìn thấy, và nó phải nói THẬT: sau FR-028 màn Danh mục
// tự cập nhật, nên bảo người ta chạy `npm run build` là hướng dẫn sai.
const sauKhiThem = (mo) => {
  const i = fe.indexOf(mo)
  return i < 0 ? "" : fe.slice(i, i + 400)
}
for (const [mo, ten] of [
  ['bao(false, `Đã thêm "${id}"`)', "thêm nhãn (popup)"],
  ['bao(false, `Đã sửa "${id}"`)', "sửa nhãn"],
  ["danh mục có ${d.so_muc} mục", "kết nạp khái niệm"],
  ["còn ${d.so_muc} mục", "xoá nhãn"],
  ['và tích cho bài này`)', "tạo nhanh chủ đề"],
]) {
  ok(fe.includes(mo), `còn toast: ${ten}`)
  ok(!sauKhiThem(mo).slice(0, mo.length + 20).includes("NHAC_BUILD"),
    `toast ${ten} KHÔNG còn nhắc build`)
}
// FR-034 · NHAC_BUILD chết HẲN — trang render lúc request từ DB, không có độ
// trễ build nào để nhắc. Chiều đảo của phép kiểm cũ (">= 4 chỗ giữ lời nhắc"):
// một lời nhắc mọc lại là nói sai về hệ thống.
ok(!/NHAC_BUILD\s*=/.test(fe) && !/\+ NHAC_BUILD/.test(fe),
  "KHÔNG toast nào còn nhắc build — SSR đọc DB lúc request (FR-034)")

// ── 6d · popup không còn khai về cổng đã gỡ ─────────────────────────────
ok(!fe.includes("concepts_proposed` của đủ số bài"),
  "popup thêm khái niệm KHÔNG còn nói về ngưỡng đã gỡ (FR-028)",
  "câu hướng dẫn sai còn tệ hơn không có câu nào")

if (loi.length) {
  console.log(`\nFAIL · ${loi.length} lỗi:\n`)
  for (const d of loi) console.log(`  x  ${d}`)
  process.exit(1)
}
console.log("\npass · bốn tab · phân trang client-side · popup native · màu đã audit")
