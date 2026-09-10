/**
 * Một lần mạng CHỚP không được giết một cửa sổ đang theo dõi việc đúng.
 *
 * Chủ dự án 2026-09-07, hai lần: *"Failed to fetch"* trong cửa sổ chưng cất.
 *
 * Quy chủ bằng log, không bằng đoán — `log/api-loi.jsonl` + `wmic`:
 *
 *     20:50:33  server CŨ (pid 41892) trả poll /api/viec/856ed116…
 *     20:50:37  `chay.sh` của TÔI kill + dựng lại  ⇒ cổng chết vài giây
 *     20:50:37  server MỚI (pid 27196) lên
 *
 * Nên "Failed to fetch" là **lỗi của tôi restart**, không phải lỗi mã. Nhưng
 * nó lộ ra một khuyết điểm thật, và đây là thứ cổng này canh:
 *
 * `veViec` gặp BẤT KỲ lỗi mạng ⇒ vẽ câu lỗi rồi `dungHen()` — dừng poll VĨNH
 * VIỄN. Bốn giây cổng chết giết hẳn một cửa sổ đang theo dõi một việc CHẠY
 * ĐÚNG, và người dùng phải đóng/mở lại mới biết việc đã xong.
 *
 * `theoDoiChungCat` cùng file thì làm ĐÚNG: `if (++treo > 60)` — 60 nhịp
 * (~90 giây) mới bỏ cuộc. Hai đường theo dõi, hai hành vi, và chủ dự án gặp
 * đúng đường không chịu được. Một khác biệt không ai chọn là một khác biệt
 * do quên.
 *
 * Và câu hiện ra phải là câu của SẢN PHẨM, không phải `e.message` thô của
 * trình duyệt: *"Failed to fetch"* không nói cho ai điều gì làm được.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const src = readFileSync(
  new URL("../plugins/cctab/src/cctab.inline.ts", import.meta.url), "utf8")
  .split(CR).join("")
const tab = src.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const than = (ten, n = 1800) => {
  const i = tab.indexOf(ten)
  if (i < 0) return ""
  const h = tab.indexOf("\n}\n", i)
  return tab.slice(i, h > 0 ? h : i + n)
}

console.log("\nmạng chớp không giết cửa sổ\n")

// ── 1 · CẢ HAI đường theo dõi đều chịu được mạng chớp ─────────────────
for (const [ten, nhan] of [
  ["async function veViec", "veViec"],
  ["function theoDoiChungCat", "theoDoiChungCat"],
]) {
  const t = than(ten)
  ok(t.length > 0, `1 · tìm thấy \`${nhan}\``)
  ok(/treo/.test(t),
    `1b · \`${nhan}\` có bộ đếm chịu-đựng`,
    "một lỗi mạng đơn lẻ dừng poll vĩnh viễn ⇒ 4 giây restart giết hẳn một "
    + "cửa sổ đang theo dõi một việc CHẠY ĐÚNG")
  // Nhận CẢ HAI chiều so — `treo > 60` và `treo <= 60` khai cùng một ngưỡng.
  // Bất biến là *"có một ngưỡng ≥ 20"*, không phải *"viết bằng toán tử nào"*;
  // khoá toán tử là khoá cách viết, và nó đỏ oan cho một dòng đúng.
  const m = t.match(/treo\s*(?:>=?|<=?)\s*(\d+)/)
  ok(m && Number(m[1]) >= 20,
    `1c · ngưỡng bỏ cuộc ≥ 20 nhịp (${nhan}: ${m ? m[1] : "không có"})`,
    "nhịp 1.2s ⇒ 20 nhịp là 24 giây, đủ qua một lần restart")
}

// ── 2 · KHÔNG dừng poll ngay ở nhịp lỗi ĐẦU TIÊN ──────────────────────
{
  const t = than("async function veViec")
  const iCatch = t.indexOf("catch")
  const sau = iCatch > 0 ? t.slice(iCatch, iCatch + 700) : ""
  ok(!/dungHen\([^)]*\);?\s*(\n\s*)*return/.test(sau)
    || /treo/.test(sau),
    "2 · nhánh `catch` KHÔNG `dungHen()` vô điều kiện",
    "dừng ở nhịp lỗi đầu tiên là biến một lần chớp thành một cửa sổ chết")
}

// ── 3 · câu hiện ra là câu của SẢN PHẨM, không phải `e.message` thô ───
{
  const t = than("async function veViec")
  ok(/mất liên lạc|Mất liên lạc|đang thử lại/i.test(t),
    "3 · có câu của sản phẩm cho ca mất liên lạc",
    "`Failed to fetch` là chuỗi của trình duyệt — nó không nói cho ai điều gì "
    + "làm được, và người đọc không biết việc còn chạy hay đã chết")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · hai đường theo dõi cùng chịu được mạng chớp")
