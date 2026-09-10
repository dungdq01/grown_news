/**
 * T03-115 · MỘT biến màu cho một thẻ, thay hai inline lặp (`WO-055`).
 *
 * Đo trên HTML DỰNG THẬT, không đọc mã nguồn: cái ta muốn giữ là "byte đi tới
 * trình duyệt", và một phép đo trên mã nguồn vẫn xanh khi ai đó thêm inline ở
 * chỗ thứ tư.
 */
import { trangHtml } from "./_render.mjs"
import { readFileSync } from "node:fs"

let loi = 0
const ok = (dieu, cau, viSao = "") => {
  console.log(`  ${dieu ? "ok  " : "FAIL"} ${cau}${!dieu && viSao ? `  ${viSao}` : ""}`)
  if (!dieu) loi++
}

const h = await trangHtml("trang-chu")
const B = (s) => Buffer.byteLength(s, "utf8")

console.log("\nT03-115 · một biến màu cho một thẻ\n")

// ── AC3 · không còn hai inline lặp cho một `source_type` ────────────────
//
// Hai khuôn này là CHÍNH hai chỗ `WO-055` đếm được: 176 `style=` / 6531 byte,
// mà mười giá trị tốn nhất đều là màu theo loại.
ok(!/style="[^"]*border-top-color:var\(--c-[a-z-]+/.test(h),
  "AC3 · 0 inline `border-top-color:var(--c-<loai>`",
  "thẻ vẫn tự khai màu viền thay vì đặt `--c`")

// Huy hiệu `<b>` trong `.tg` KHÔNG được mang `style=` — đó là inline thứ hai
// cho cùng một `source_type`, và nó chính là thứ `WO-055` đo được.
const huy = h.match(/<i class="tg"><b[^>]*>/g) || []
ok(huy.length > 0 && huy.every((x) => !/style=/.test(x)),
  `AC3 · ${huy.length} huy hiệu, không cái nào tự khai màu`,
  "còn huy hiệu mang `style=` ⇒ vẫn hai inline cho một dữ kiện")

/*
 * `.tp-c` (chấm nhóm nguồn) VẪN dùng `background:var(--c-…)` và cổng này KHÔNG
 * đòi đổi. Nói ra vì đó là một ngoại lệ có chủ ý, không phải chỗ sót:
 *
 *   - nó phát MỘT inline cho MỘT dữ kiện — không lặp, nên không thuộc khuyết
 *     tật `WO-055` mô tả;
 *   - đo được: đổi ba chấm ấy sang `--c` tiết kiệm ~21 byte HTML nhưng tốn
 *     thêm một luật CSS (~30 byte), mà `gn.css` chỉ còn dư 22. Tức nó LỖ trên
 *     đúng ràng buộc đang bó.
 *
 * Trần ĐẾM dưới đây thay cho phép cấm tuyệt đối: ngoại lệ được phép tồn tại,
 * nhưng không được lớn dần mà không ai thấy.
 */
const bg = (h.match(/style="[^"]*background:var\(--c-[a-z-]+/g) || []).length
ok(bg <= 5, `AC3 · inline màu-theo-loại còn lại ${bg} ≤ 5 (chấm .tp-c)`,
  "vượt trần đếm ⇒ có chỗ mới lại tự khai màu, gom về `--c`")

// ── AC4 · biến `--c` CÓ mặt, và CSS CÓ luật đọc nó ─────────────────────
//
// Vế này giữ chiều ngược: xoá inline mà quên đặt biến thì AC3 xanh trong khi
// mọi thẻ mất màu — cổng phải bắt được ca "sạch byte, hỏng giao diện".
const bien = h.match(/style="--c:var\(--c-[a-z-]+,var\(--ink-2\)\)"/g) || []
ok(bien.length > 0, "AC4 · thẻ mang `--c` theo loại",
  "không thẻ nào đặt biến ⇒ màu viền và huy hiệu mất sạch")

const css = readFileSync(new URL("../styles/prototype.css", import.meta.url), "utf8")
ok(/\.cd\b[^{]*\{[^}]*border-top-color:\s*var\(--c\b/.test(css),
  "AC4 · CSS đọc `--c` cho viền thẻ")
ok(/\.tg\b[^{]*b[^{]*\{[^}]*background:\s*var\(--c\b/.test(css)
  || /\.cd[^{]*\.tg\s+b\s*\{[^}]*var\(--c\b/.test(css),
  "AC4 · CSS đọc `--c` cho nền huy hiệu")

// ── AC5 · ba chỗ sinh thẻ ĐỀU đổi, không sót bản nào ───────────────────
//
// Lệch hai đường đọc là lớp lỗi đã trúng dự án này nhiều lần: sửa SSR mà quên
// bản FE thì thẻ đổi hình dạng ngay khi người dùng mở cửa sổ đọc.
for (const f of ["../render/trang.mjs",
                 "../plugins/home-pages/index.ts",
                 "../plugins/multiwindow/src/scripts/multiwindow.inline.ts"]) {
  const ma = readFileSync(new URL(f, import.meta.url), "utf8")
  const cu = /style="(?:border-top-color|background):var\(--c-\$\{/.test(ma)
  ok(!cu, `AC5 · ${f.split("/").pop()} không còn inline cũ`)
}

// ── AC1 · byte trang chủ ────────────────────────────────────────────────
ok(B(h) <= 61440, `AC1 · trang chủ ${B(h)} / 61440 byte`,
  `vượt ${B(h) - 61440}`)

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · một dữ kiện, một chỗ khai")
process.exit(loi ? 1 : 0)
