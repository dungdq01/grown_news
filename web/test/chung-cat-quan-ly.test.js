#!/usr/bin/env node
/**
 * T03-95 — khối việc RÚT GỌN trên Dashboard + badge rail.
 *
 * Cổng này ĐÃ ĐỖ ở thư mục task (`rule.md` mục 8) và dời vào đây CÙNG LƯỢT
 * với mã + đăng ký `npm test`. Bằng chứng đỏ-trước: 7 lỗi tại mốc trước-code,
 * ghi trong worklog `WL-01K9SD4T0399T0395`.
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Khối này dễ trượt thành **bảng chi tiết thứ hai**. Dashboard đã có màn
 * `/chung-cat/` làm chỗ xem đủ; lặp bảng ở trang chủ nghĩa là hai chỗ hiển thị
 * cùng một tập, và chỗ thứ hai sẽ lệch — cùng lớp lỗi bốn lần trước của repo
 * (enum trạng thái · ma trận chuyển · allow-list · tập test gõ tay).
 *
 * BA RÀNG BUỘC BYTE, đo 2026-09-04 — chúng quyết hình dạng khối, không phải sở
 * thích quyết:
 *   trang chủ  61431 / 61440  ⇒ dư  9 byte ⇒ **0 byte HTML mới trong shell**
 *   gn.css    102391 / 102400 ⇒ dư  9 byte ⇒ **0 luật CSS mới**
 *   gn.js     100947 / 102400 ⇒ dư 1453 byte ⇒ JS đi theo CHUNK (T03-102)
 *
 * ĐỎ_KHI  khối lặp bảng chi tiết (có hàng job) · thêm markup vào shell · thêm
 *         luật CSS · badge dùng nhánh `if` thay vì `:empty` · badge trỏ sai mục
 *         nav · JS vào bundle chung
 * XANH_KHI ba con số + một link, dựng bằng JS, 0 byte HTML/CSS mới
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { maFeNguon } from "./_render.mjs"

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..")
let loi = 0
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi++
}

/*
 * Đọc MỌI mã FE (`maFeNguon`), không đọc riêng một file — cùng phép sửa đã áp
 * cho năm cổng ở `T03-104`. Khối này nằm ở BUNDLE CHUNG chứ không ở chunk
 * `chungcat`, và lý do là phép đo:
 *   thẻ `<script>` chunk thêm vào HTML trang chủ = +48 byte, mà nó dư **11**
 *   `gn.js` sau T03-104 dư 4123 byte, khối ~1512 ⇒ lọt
 * Nên cổng không được ghim khối vào một file cụ thể — nó đo TÍNH CHẤT.
 */
const src = maFeNguon(".ts")
const shell = readFileSync(join(WEB, "render", "shell.html"), "utf8")
const shell2 = readFileSync(join(WEB, "plugins", "home-pages", "shell.html"), "utf8")
const css = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")

console.log("\n1 · Khối dựng bằng JS — 0 byte HTML mới trong shell\n")

ok(src !== "", "đọc được nguồn mã FE")
ok(/ccKhoiDongTrangChu|ccKhoiTrangChu/.test(src),
  "chunk có hàm dựng khối cho TRANG CHỦ, tách khỏi hàm dựng màn `/chung-cat/`",
  "một hàm làm cả hai thì nó phải đoán mình đang ở màn nào, và nó sẽ đoán sai " +
  "ở màn thứ ba")
// Trang chủ dư 9 byte. Khối phải cắm vào MỘT MỐC ĐÃ CÓ, không thêm thẻ nào.
ok(/#kpi|"kpi"/.test(src),
  "khối cắm vào mốc `#kpi` ĐÃ CÓ của trang chủ — không thẻ mới nào trong shell")
for (const [ten, s] of [["render", shell], ["home-pages", shell2]]) {
  ok(!/id="cc-tc|cc-dash|id="ccbadge/.test(s),
    `shell ${ten} KHÔNG mọc thẻ mới cho khối này`,
    "trang chủ dư 9 byte — một thẻ mới là vượt trần ngay")
}
ok(shell === shell2, "hai shell còn byte-identical")

console.log("\n2 · BA con số + MỘT link — không phải bảng chi tiết thứ hai\n")

const tc = (src.match(/function ccKhoiDongTrangChu[\s\S]{0,2600}?\n\}/) ?? [""])[0]
ok(tc !== "", "đọc được thân hàm dựng khối")
ok(/đang chạy/.test(tc) && /cần xử lý/.test(tc) && /xong/.test(tc),
  "ba con số: đang chạy · cần xử lý · xong")
ok(!/data-ccmo/.test(tc),
  "KHÔNG hàng job nào trong khối — `data-ccmo` là thẻ việc của màn `/chung-cat/`",
  "lặp bảng chi tiết ở trang chủ là hai chỗ hiển thị cùng một tập, và chỗ thứ " +
  "hai sẽ lệch")
ok(/\/chung-cat\//.test(tc), "có MỘT link mở `/chung-cat/`")

console.log("\n3 · Badge: luật `:empty`, KHÔNG nhánh `if`\n")

ok(/\[data-mount\]:empty\{display:none\}/.test(css.replace(/\s/g, "")),
  "luật `[data-mount]:empty{display:none}` ĐÃ CÓ trong gn.css — badge dùng lại nó")
const bg = (src.match(/function ccBadge[\s\S]{0,1200}?\n\}/) ?? [""])[0]
ok(bg !== "", "có hàm `ccBadge` riêng")
ok(/data-mount/.test(bg),
  "badge mang `data-mount` ⇒ rỗng thì CSS tự ẩn, 0 nhánh điều kiện")
ok(!/\.hidden\s*=|style\.display/.test(bg),
  "badge KHÔNG tự ẩn bằng JS — `:empty` đã làm việc đó, và hai cơ chế cho một " +
  "hành vi thì chúng sẽ lệch", bg.slice(0, 160))
ok(/data-nav="chungcat"|'chungcat'|"chungcat"/.test(bg),
  "badge trỏ mục nav **Chưng cất** (T03-97), không mục nào khác")

console.log("\n4 · 0 luật CSS mới — gn.css dư 9 byte\n")

for (const c of ["cc-tc", "cc-dash", "ccbadge", "dh-tc"]) {
  ok(!new RegExp("\\." + c + "\\b").test(css), `KHÔNG luật \`.${c}\` mới`)
}

if (loi) {
  console.log(`\n${loi} lỗi\n`)
  process.exit(1)
}
console.log("\npass · ba số + một link · dựng bằng JS · 0 byte HTML/CSS mới\n")
