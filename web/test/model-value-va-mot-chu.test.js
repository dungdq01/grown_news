/**
 * Hai bug chủ dự án bắt 2026-09-07, và cả hai là *"một thứ có hai chủ"*.
 *
 * ── BUG 1 · NGHIÊM TRỌNG · nhãn thành GIÁ TRỊ ──────────────────────────
 *
 * Payload thật, chụp từ DevTools:
 *
 *     {loai: "chung-cat-mot-nguon", model: "gemini-2.5-flash-lite · free", …}
 *     → {loi: "`gemini-2.5-flash-lite · free` không có trong bảng khai"}
 *
 * `veModelTheoNha` dựng `<option>` KHÔNG có `value`, và nhãn mang thêm hậu tố
 * `· free`. Khi `<option>` không khai `value`, trình duyệt lấy **text làm
 * value** — nên tên model gửi đi có dán một chuỗi hiển thị vào.
 *
 * Hai vai trong MỘT chuỗi: *"cái này tên gì"* và *"cái này miễn phí không"*.
 * `M12-R4` cấm tên model xuất hiện ở chỗ thứ hai, và đây là biến thể của cùng
 * lỗi: một chuỗi vừa là định danh vừa là câu hiển thị. `value` và nhãn phải
 * TÁCH.
 *
 * Nó chỉ nổ với model MIỄN PHÍ — model thường không có hậu tố nên đi qua được.
 * Vì thế nó sống lâu: đường thử của tôi dùng `deepseek-v4-flash` (không free).
 *
 * ── BUG 2 · thẻ transcript mở HAI cửa sổ ───────────────────────────────
 *
 * Chủ dự án: *"click vào 1 thẻ transcript ở chung-cat thì bị double window…
 * chỉ Transcript bị, còn chưng cất thì không"*.
 *
 * `[data-cctr]` có HAI bộ nghe, cả hai ở tầng `document`:
 *   · `cctab.inline.ts`   — của tab trong cửa sổ đọc
 *   · `chungcat.inline.ts` — của màn `/chung-cat/`
 *
 * Trang `/chung-cat/` nạp CẢ HAI chunk, nên một cú click chạy cả hai. Chưng
 * cất không bị vì act của nó chỉ có một chủ.
 *
 * KHÔNG vá bằng `stopPropagation` hay một cờ *"đã mở rồi"*: cả hai chỉ CHE
 * chuyện có hai chủ. Vá bằng cách chia ĐẤT — `cctab` nghe TRONG cửa sổ đọc
 * (`.bk`), `chungcat` nghe NGOÀI nó.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const cc = boCT(doc("../plugins/chungcat/src/chungcat.inline.ts"))

console.log("\nmodel value tách nhãn · một act một chủ\n")

// ── 1 · `<option>` khai `value` RIÊNG, không để nhãn làm giá trị ───────
{
  const i = tab.indexOf("function veModelTheoNha")
  const h = i > 0 ? tab.indexOf("\n}\n", i) : -1
  const t = i > 0 ? tab.slice(i, h > 0 ? h : i + 900) : ""
  ok(t.length > 0, "1 · tìm thấy `veModelTheoNha`")
  ok(/<option value="/.test(t),
    "1b · `<option>` khai `value` riêng",
    "vắng `value` thì trình duyệt lấy TEXT làm giá trị, và text có hậu tố "
    + "`· free` ⇒ tên model gửi đi mang một chuỗi hiển thị")
  // Chủ dự án 2026-09-07: *"model `gemini-2.5-flash-lite`, còn free là dạng
  // đánh dấu thôi, đừng chèn text `free` vào"*.
  //
  // ⇒ `<option>` KHÔNG mang chữ `free` ở đâu cả — không ở `value`, không ở
  // nhãn. Một `<option>` chỉ chứa được text, nên mọi cách nhét dấu vào nó đều
  // là nhét CHỮ. Dấu phải sống NGOÀI `<select>`.
  ok(!/free/.test(t),
    "1c · `<option>` KHÔNG chứa chữ `free`",
    "option chỉ chứa được text, nên nhét dấu vào nó là nhét chữ vào tên model")
  ok(/data-f="mp"|data-f=mp/.test(tab),
    "1d · dấu miễn phí là một Ô RIÊNG ngoài `<select>`",
    "cái giá vẫn phải hiện trước cú bấm — ví còn ít thì một model không-free "
    + "là một job chết vì hết tiền; chỉ là nó không được nằm trong tên")
}

// ── 2 · `[data-cctr]` có ĐÚNG MỘT chủ cho mỗi vùng ────────────────────
{
  const iT = tab.indexOf('closest("[data-cctr]")')
  const iC = cc.indexOf('closest("[data-cctr]")')
  ok(iT > 0 && iC > 0, "2 · cả hai chunk đều có bộ nghe (đúng, mỗi bên một đất)")

  // Vế này lượt đầu XANH OAN: `/closest\(".bk"\)/` khớp cả
  // `tr.closest(".bk")?.id ?? null` — một THAM SỐ, không phải phép chặn.
  // Đòi đúng hình dạng của phép chặn: `.bk` phải là điều kiện của `if`.
  const quanhT = iT > 0 ? tab.slice(Math.max(0, iT - 200), iT + 400) : ""
  ok(/if\s*\(\s*tr\s*&&\s*bk\s*\)|if\s*\([^)]*closest\("\.bk"\)[^)]*\)\s*\{/
    .test(quanhT),
    "2b · `cctab` CHẶN theo `.bk`, không chỉ đọc `.bk` làm tham số",
    "không giới hạn đất thì trên `/chung-cat/` cả hai chunk cùng chạy ⇒ hai cửa sổ")

  const quanhC = iC > 0 ? cc.slice(Math.max(0, iC - 200), iC + 500) : ""
  ok(/!\s*t\.closest\("\.bk"\)|closest\("\.bk"\)\s*\)\s*return|khongTrongBk/
    .test(quanhC),
    "2c · `chungcat` chỉ nghe NGOÀI cửa sổ đọc",
    "hai vùng rời nhau thì không cú click nào chạy hai lần")

  // KHÔNG được vá bằng cách che: cờ *đã mở rồi* hay `stopPropagation` chỉ làm
  // triệu chứng biến mất và để lại hai chủ cho một act.
  ok(!/stopImmediatePropagation/.test(tab + cc),
    "2d · KHÔNG vá bằng `stopImmediatePropagation`",
    "che chuyện có hai chủ thì bug thứ hai của cùng gốc sẽ tới mà không ai hiểu")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · `value` tách nhãn, và mỗi act đúng một chủ")
