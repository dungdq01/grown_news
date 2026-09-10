/**
 * T03-124 · Nhịp SINH — dải sóng lúc phiên âm, vòng xoay lúc chưng cất.
 *
 * `SCR-22` duyệt 2026-09-07. Note của chủ dự án, nguyên văn:
 * *"UI và animation lúc transcript / chưng cất phải hiệu ứng 3D, superpower
 * (kiểu dải tần số, hiệu ứng âm thanh...) vào nha. now, it's basic"*
 *
 * VẾ QUAN TRỌNG NHẤT — chuyển động phải là một PHÉP ĐO:
 *
 * FE **không có** byte audio (audio sống ở thợ, `M12-R1`). Không `AudioContext`,
 * không FFT, không phổ thật. Nên dải lấy nhịp từ **cue thật**: số cue mới và
 * số ký tự mới mỗi nhịp poll.
 *
 * Một dải ngẫu nhiên đẹp hơn — và nó NÓI DỐI. Một dải nhảy múa trong lúc thợ
 * đã chết là thứ tệ hơn không có dải: người ngồi đợi một thanh chạy cho một
 * việc đã dừng.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tabGoc = doc("../plugins/cctab/src/cctab.inline.ts")
const tab = boCT(tabGoc)

console.log("\nT03-124 · nhịp sinh\n")

// ── 1 · dải PHIÊN ÂM lấy nhịp từ CUE THẬT ────────────────────────────
ok(/veDaiSong|daiNhip/.test(tab), "1 · có hàm vẽ dải nhịp")
{
  const i = tab.search(/function veDaiSong|function daiNhip/)
  const than = i > 0 ? tab.slice(i, i + 1600) : ""
  ok(i > 0, "1b · tìm thấy thân hàm")
  ok(!/Math\.random/.test(than),
    "1c · KHÔNG `Math.random()` — chuyển động là PHÉP ĐO",
    "một dải nhảy múa trong lúc thợ đã chết tệ hơn không có dải")
  ok(/cue_xong|so_cue|length/.test(than),
    "1d · chiều cao cột dẫn từ SỐ CUE / SỐ KÝ TỰ thật")
}

// ── 2 · chưng cất dùng VÒNG XOAY, không dải tần ──────────────────────
//
// Chưng cất không có âm thanh. Vẽ dải tần ở đây là mượn hình của một việc
// khác — cùng lỗi «mượn màu của chiều phân loại khác» mà `SCR-20` đã cấm.
ok(/ns-vong|veVongNghi/.test(tab), "2 · có vòng xoay cho chưng cất")
ok(!/veDaiSong\([^)]*\)[^]{0,200}?chung-cat-mot-nguon/.test(tab),
  "2b · KHÔNG dùng dải tần cho chưng cất")

// ── 3 · KHÔNG hứa phần trăm ──────────────────────────────────────────
{
  // Cắt ĐÚNG thân hàm, không cắt "400 ký tự kể từ đây": cửa sổ rộng tràn sang
  // `veTienDo` — nơi `phan_tram` là HỢP LỆ (thanh tải file của `T12-27`) — và
  // vế này đỏ oan cho một dòng đúng.
  const i = tab.indexOf("function veVongNghi")
  const het = i > 0 ? tab.indexOf("\n}", i) : -1
  const than = i > 0 ? tab.slice(i, het > 0 ? het : i + 400) : ""
  ok(i > 0, "3 · tìm thấy thân `veVongNghi`")
  ok(i > 0 && !/%|phan_tram|td-thanh/.test(than),
    "3b · vòng xoay KHÔNG kèm thanh phần trăm",
    "ta không biết model còn bao lâu — bịa một con số là hứa thứ mình không "
    + "đo được")
}

// ── 4 · chỉ animate `transform`/`opacity` ────────────────────────────
{
  const m = tabGoc.match(/@keyframes\s+ns-[\s\S]{0,400}?\}\s*\}/g) ?? []
  ok(m.length > 0, "4 · có `@keyframes` của nhịp sinh")
  const xau = m.filter((k) => /(height|width|top|left|margin|padding)\s*:/.test(k))
  ok(xau.length === 0,
    "4b · 0 thuộc tính LAYOUT được animate",
    "`AC6` của khuôn UI cấm — `height` bắt trình duyệt tính lại bố cục 60 lần "
    + "một giây")
}

// ── 5 · người khai «giảm chuyển động» vẫn ĐỌC ĐƯỢC tiến độ ───────────
//
// `SCR-22` vẽ một khối `reduce { animation: none }`. Nhà này viết chiều
// NGƯỢC LẠI và viết đúng hơn: mặc định TĨNH, chuyển động chỉ bật trong
// `no-preference`. Quên một luật ở chiều tắt-sau là một animation LỌT QUA;
// quên ở chiều opt-in thì chỉ là một thứ đứng yên. Vế này đo cái bất biến
// («không có chuyển động nào ngoài guard»), không đo cách viết.
{
  const guard = tabGoc.match(
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[^]*?\n\}/g) ?? []
  const trong = guard.join("\n")
  ok(guard.length > 0, "5 · có guard chuyển động")
  ok(/\.ns-cot\{transition|\.ns-vong\{animation/.test(trong),
    "5b · chuyển động của nhịp sinh nằm TRONG guard")

  // Mọi `animation:`/`transition:` chạm lớp `ns-` phải ở trong guard — kể cả
  // một dòng lỡ tay thêm sau này.
  const ngoai = tabGoc.split(/@media\s*\(prefers-reduced-motion[^]*?\n\}/).join("")
  ok(!/\.ns-[\w+.\s]*\{[^}]*(animation|transition):(?!\s*none)/.test(ngoai),
    "5c · KHÔNG chuyển động `.ns-*` nào nằm NGOÀI guard",
    "một animation lọt ra ngoài là người đã khai cần tắt vẫn phải chịu nó")

  ok(!/display:\s*none|visibility:\s*hidden/.test(trong),
    "5d · guard KHÔNG giấu khối nào",
    "người đã khai cần tắt chuyển động vẫn phải ĐỌC ĐƯỢC tiến độ; giấu cả "
    + "khối là phạt họ hai lần")
}

// ── 6 · dải là HÌNH của con số, không đọc lại bằng giọng nói ─────────
{
  ok(/class="ns-dai"\s+aria-hidden/.test(tab),
    "6 · chính thẻ `.ns-dai` mang `aria-hidden`",
    "con số thật (`142 câu · tới 09:12`) đã nằm ngay trên nó — đọc lại là bắt "
    + "người nghe hai lần một thông tin")
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · chuyển động nói thật, tắt được, 0 layout")
process.exit(loi ? 1 : 0)
