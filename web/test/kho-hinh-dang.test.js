#!/usr/bin/env node
/**
 * FR-041 · MÀN KHO — mỗi câu hỏi một hình dạng, chuyển động một nhịp.
 *
 * VÌ SAO CÓ FILE NÀY: FR-031 tự đề *"ba góc nhìn, ba HÌNH DẠNG"* nhưng không
 * cổng nào canh nguyên tắc đó — nên nó mòn: đến 2026-08-29 màn Kho có bar
 * ngang ×3 và thanh chia đoạn ×3 cho 7 bộ dữ liệu. Người dùng chỉ vào ảnh:
 * *"các biểu đồ đang cùng 1 form quá — không đa dạng"*.
 *
 * Cổng hỏi TÍNH CHẤT, không đếm chuỗi:
 *   1 mỗi hình dạng xuất hiện đúng MỘT lần trên màn Kho
 *   2 mọi lớp chuyển động mới có chốt reduced-motion, và KHÔNG vòng lặp mới —
 *     dashboard là ảnh chụp, hiệu ứng "đang xử lý" trên trang tĩnh là nói sai
 *     về hệ thống (ranh giới FR-027i giữ nguyên)
 *   3 SVG không mang hex — chỉ var(token); palette là hợp đồng đã audit
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
let loi = 0
const ok = (d, chu, them = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${chu}${d ? "" : `  <- ${them}`}`)
  if (!d) loi++
}

// Bản mock có đủ dữ liệu cho mọi vùng — bản real kho 2 bài sẽ để vùng rỗng
// hợp lệ, và một vùng rỗng thì không nói gì về hình dạng.
const html = await trangHtml("kho", { mock: true })
const TAI_SAN = await taiSan()
const css = TAI_SAN.gnCss
const kho = html.slice(html.indexOf('id="v-kho"'), html.indexOf('id="v-concepts"'))

console.log("\nFR-041 · màn Kho — hình dạng và chuyển động\n")

console.log("1 · Mỗi hình dạng xuất hiện đúng MỘT lần\n")

// HÌNH DẠNG nhận diện bằng class GỐC của nó — danh sách ĐÓNG. Thêm một hình
// mới ⇒ thêm dòng ở đây, tức có người kiểm nó không trùng hình đã có.
// FR-041 lượt 2 · người dùng chốt BỐN tổng hợp (thời gian · phân loại ·
// loại nguồn · trạng thái). Bậc thang tin cậy + thanh chia đoạn origin RỜI
// danh sách; thêm CỘT DỌC theo ngày. Bar ngang giờ mang pane PHÂN LOẠI.
const HINH = [
  ["donut phần-của-tổng", /class="dn"/g],
  ["lưới ô (1 ô = 1 bài)", /class="wf"/g],
  ["vòng đời trạng thái", /class="lc"/g],
  ["đường vùng theo tháng", /class="sl"/g],
  ["cột dọc theo ngày", /class="cot"/g],
  ["khối 3D", /class="tw-w[ "]/g],
]
for (const [ten, re] of HINH) {
  const n = (kho.match(re) ?? []).length
  ok(n === 1, `${ten}: đúng 1 (được ${n})`,
    n === 0 ? "hình bị bỏ — màn quay về đơn điệu" : "hai vùng cùng hình — đúng bệnh WO-036")
}
// Bar ngang: đúng MỘT vùng còn dùng — pane PHÂN LOẠI (kf-nhom). Đếm theo
// VÙNG chứa `.br`, không đếm từng thanh.
const vungBar = ["bars2", "bars4", "kf-nhom", "kf-thang", "kf-ngay"]
  .filter((id) => new RegExp(`id="${id}"[^>]*>(?:(?!</div>).)*class="br"`, "s").test(kho))
ok(vungBar.length === 1 && vungBar[0] === "kf-nhom",
  `bar ngang: đúng 1 vùng, là kf-nhom (được: ${vungBar.join(", ") || "không vùng nào"})`,
  "bar lặp ở vùng thứ hai là mòn trở lại")

// Hai hình đã RỜI màn không được quay lại lặng lẽ — và thanh chia đoạn
// (`tp-b`) giờ KHÔNG còn trong v-kho (nó vẫn hợp lệ ở màn khác).
for (const [ten, re] of [["bậc thang tin cậy", /class="fn"/],
                         ["thanh chia đoạn", /<div class="tp-b"/]]) {
  ok(!re.test(kho), `\`${ten}\` không còn trong v-kho (FR-041 lượt 2)`,
    "quay lại nghĩa là có người khôi phục pane đã bỏ mà không đọc FR")
}

// Pane phân loại phải đọc ĐỦ BA mảng từ bảng khai — thiếu một là màn nói
// thiếu về chính kho.
for (const nhan of ["Bài viết", "Tài liệu", "Video"]) {
  ok(new RegExp(`id="kf-nhom"[^>]*>(?:(?!</div>\s*</div>).)*${nhan}`, "s").test(kho)
     || kho.includes(nhan),
    `pane phân loại có mảng \`${nhan}\``)
}

console.log("\n2 · Dữ liệu không đổi theo hình\n")

// Vòng đời phải lặp trên TRANG_THAI từ schema — bốn nhãn đủ mặt trên trang.
for (const st of ["draft", "approved", "edited", "rejected"]) {
  ok(new RegExp(`class="lc-n[^"]*"[^>]*data-st="${st}"`).test(kho),
    `vòng đời có node \`${st}\``, "thiếu một trạng thái là lặp lại bug bốn-trạng-thái-đủ-bốn")
}
// Donut: tổng ở tâm phải là con số thật (2 chữ số như mọi ô đếm).
ok(/class="dn-v"[^>]*>\d{2}</.test(kho), "tâm donut mang tổng bản ghi")
// Lưới ô khai nghĩa của MỘT Ô — không khai là người đọc đoán tỉ lệ.
ok(/data-o="/.test(kho), "lưới ô khai mỗi ô bằng bao nhiêu bài (`data-o`)")

console.log("\n3 · Chuyển động — một nhịp, có chốt, không vòng lặp mới\n")

const motion = readFileSync(
  join(WEB, "plugins", "home-motion", "src", "home-motion.inline.ts"), "utf8")
// Mọi hàm vẽ mới đi qua cờ `reduced` sẵn có.
for (const ham of ["veDonut", "veLuoiO", "veVongDoi", "veDuongVung"]) {
  ok(new RegExp(`function ${ham}`).test(motion), `có \`${ham}\` trong máy reveal`)
  // BỎ COMMENT trước khi soi — comment giải thích cũng nhắc chữ "reduced",
  // và kiểm hai chiều đã bắt được: gỡ chốt thật mà cổng vẫn xanh vì khớp
  // nhầm vào chữ trong comment. Chốt là MÃ: `if (reduced)`.
  const than = motion.slice(motion.indexOf(`function ${ham}`),
    motion.indexOf("function", motion.indexOf(`function ${ham}`) + 10))
    .split("\n").map((d) => d.replace(/\/\/.*$/, "")).join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
  ok(/if \(reduced\)/.test(than), `\`${ham}\` có chốt reduced-motion (mã, không phải comment)`,
    "thiếu chốt là chuyển động ép lên người đã tắt nó")
}
/*
 * KHÔNG vòng lặp mới — đo TÍNH LẶP, không đếm chỗ gọi.
 *
 * Bản đầu của phép kiểm này đếm số lần gọi rAF/setInterval và tự đỏ oan: một
 * rAF MỘT NHỊP (thêm class rồi thôi) không phải vòng lặp, và chặn nó là chặn
 * đúng cách làm rẻ nhất. Tính chất thật cần canh:
 *   · mọi setInterval phải CÓ ĐƯỜNG DỪNG — tự clear khi tới đích, hoặc clear
 *     trong addCleanup (ba vòng xoay pane có sẵn thuộc loại này);
 *   · không rAF ĐỆ QUY mới — callback tự đặt lại chính nó mới là vòng lặp.
 */
const nItv = (motion.match(/setInterval\(/g) ?? []).length
const nClr = (motion.match(/clearInterval\(/g) ?? []).length
ok(nItv <= nClr,
  `mọi setInterval có đường dừng (${nItv} mở / ${nClr} clear)`,
  "một interval không ai clear là hiệu ứng lặp vô hạn — nói sai về trang tĩnh")
const rafDeQuy = [...motion.matchAll(/requestAnimationFrame\(/g)]
  .filter((m) => /requestAnimationFrame\(/.test(motion.slice(m.index + 24, m.index + 220)))
ok(rafDeQuy.length === 0,
  "không rAF đệ quy trong home-motion (rAF một-nhịp thì được)",
  "callback tự đặt lại chính nó = vòng lặp — dashboard là ảnh chụp (FR-027i)")

console.log("\n4 · Palette — SVG cũng chỉ token đã audit\n")

// Hex trong markup vùng Kho (kể cả thuộc tính SVG fill/stroke) là màu ngoài audit.
const hexKho = [...kho.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0])
ok(hexKho.length === 0, "không hex nào trong markup màn Kho",
  `thấy: ${[...new Set(hexKho)].slice(0, 5).join(" ")}`)
ok(!/backdrop-filter/.test(css.slice(css.indexOf(".dn"),
    css.indexOf(".dn") + 4000)),
  "khối chart mới không thêm lớp backdrop-filter (ngưỡng hệ kính đã kịch)")

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\npass · màn Kho: 8 hình mỗi hình một lần, chuyển động một nhịp có chốt\n")
