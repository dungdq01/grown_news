/**
 * T03-118 · `moTheoSlug` bóc PHONG BÌ của API — một chỗ hết hai triệu chứng.
 *
 * Chủ dự án báo hai thứ, hoá ra cùng một gốc:
 *   "Xem bài gốc" bấm không ra gì   ← `mo()` nhận sai hình dạng
 *   "không có thân bài"             ← `than` không bao giờ tới nơi
 *
 * Cửa `/api/articles/<loai>/<slug>` trả PHONG BÌ `{frontmatter, body, etag}`;
 * `mo()` đòi `{bans:[ban]}`. Truyền thẳng phong bì thì `bai.bans` là
 * `undefined` — cửa sổ dựng rỗng và không lỗi nào nổ.
 *
 * Cùng lớp lỗi đã trúng `_doc_nguon` của `T12-24` (đọc `category` ở cấp cao
 * nhất thay vì trong `frontmatter`). Hai lần, một bài học: **đọc hình dạng
 * THẬT của cửa, đừng đọc hình dạng mình tưởng.**
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const mw = readFileSync(new URL("../plugins/multiwindow/src/scripts/multiwindow.inline.ts",
  import.meta.url), "utf8")
const i = mw.indexOf("async function moTheoSlug")
const than = i > 0 ? mw.slice(i, i + 2200) : ""

console.log("\nT03-118 · moTheoSlug bóc phong bì\n")

ok(i > 0, "có `moTheoSlug`")
ok(!/mo\(await r\.json\(\)/.test(than),
  "1 · KHÔNG truyền thẳng phản hồi vào `mo()`",
  "cửa trả `{frontmatter, body, etag}`; `mo()` đòi `{bans:[ban]}` — truyền "
  + "thẳng thì `bai.bans` là undefined, cửa sổ dựng RỖNG và 0 lỗi nào nổ")
ok(/frontmatter/.test(than), "1b · đọc `frontmatter` từ phong bì")
ok(/\bbody\b/.test(than) && /\bthan\b/.test(than),
  "1c · lấy `body` của cửa và đổ vào `than` của bản ghi",
  "hai tên cho một thứ ở hai tầng — không bóc thì thân bài không tới nơi")
ok(/bans:\s*\[/.test(than), "1d · dựng đúng `{bans:[…]}`")

// `bao(loi, chu)` — HAI tham số. Gọi một tham số thì chuỗi rơi vào ô cờ lỗi,
// và toast hiện RỖNG: người bấm không biết chuyện gì vừa xảy ra.
const goiBao = [...than.matchAll(/\bbao\(([^)]*)\)/g)].map((m) => m[1])
ok(goiBao.length > 0 && goiBao.every((a) => a.includes(",")),
  `2 · mọi lời gọi \`bao()\` đủ HAI tham số (${goiBao.length} chỗ)`,
  "`bao(loi, chu)`; gọi một tham số thì câu rơi vào ô cờ và toast hiện rỗng")

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · bóc phong bì đúng tầng")
process.exit(loi ? 1 : 0)
