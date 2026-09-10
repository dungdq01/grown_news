#!/usr/bin/env node
/**
 * Mọi nút trên trang phải CÓ NGƯỜI XỬ LÝ.
 *
 * Lỗi đã gặp: shell prototype dùng `onclick="nav('all')"` gọi hàm toàn cục.
 * Tôi đổi sang `data-nav="all"` cho hợp module scope — nhưng KHÔNG port hàm
 * `nav()`. 10 nút nằm đó không làm gì cả, và không test nào bắt được.
 *
 * Test này soi từng thuộc tính điều khiển trong HTML và đòi script có mã xử lý
 * tương ứng.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { trangHtml, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// Doc ban MOCK: ban mock doc kb-mock (13 ban ghi contract) nen luon co du
// lieu de kiem. real-vs-mock.test.js lo phan "hai ban phai khac nhau".
// FR-034/C5 · nguon HTML doi tu output build sang renderTrang — assertion giu nguyen.
const html = await trangHtml("trang-chu")
const script = (await taiSan()).gnJs

console.log("\nMọi thuộc tính điều khiển phải có mã xử lý\n")

// Đếm nút trong HTML, rồi đòi script biết xử lý loại đó
for (const [attr, xuLy, mo] of [
  ["data-nav", "dataset.nav", "điều hướng bốn màn"],
  ["data-open", "dataset.open", "mở cửa sổ đọc"],
]) {
  const n = (html.match(new RegExp(attr + "=", "g")) ?? []).length
  ok(n > 0, `HTML có ${n} nút [${attr}] (${mo})`)
  ok(script.includes(xuLy) || script.includes(`"[${attr}]"`),
    `script xử lý [${attr}]`,
    "nút nằm đó mà không ai nghe ⇒ bấm không phản ứng")
}

// Ba nút trên thanh — id cố định trong shell
for (const [id, mo] of [
  ["bgp", "tạm dừng đổi ảnh"],
  ["bgb", "đổi ảnh ngay"],
  ["tb", "đổi tone sáng/tối"],
]) {
  ok(html.includes(`id="${id}"`), `HTML có nút #${id} (${mo})`)
  ok(script.includes(`#${id}`), `script xử lý #${id}`,
    "nút có mặt mà không có mã ⇒ bấm không phản ứng")
}

console.log("\nKhông còn onclick gọi hàm toàn cục\n")

// Prototype dùng onclick="nav('all')" — trong module scope thì hàm không nằm
// trên window, inline handler gọi không tới.
const inline = (html.match(/onclick="[a-z_]+\(/gi) ?? [])
  .filter((x) => !x.includes("return false"))
ok(inline.length === 0, "không onclick gọi hàm toàn cục", `còn ${inline}`)

console.log("\nBốn view phải có mặt để điều hướng tới\n")

// FR-027g · `queue` KHÔNG còn là một view — màn Chờ duyệt gộp vào Kho.
for (const v of ["home", "all", "kho", "concepts"]) {
  ok(html.includes(`id="v-${v}"`), `có view v-${v}`)
}
// Và view cũ phải BIẾN MẤT hẳn, không sót lại một khối rỗng: `doiView()` đọc
// `DUONG` (đã bỏ key `queue`) nên một `#v-queue` còn sót là khối chết không
// đường nào tới, mà vẫn nặng ở mọi trang.
ok(!html.includes('id="v-queue"'), "view `v-queue` đã bỏ hẳn",
   "còn khối rỗng thì nó nặng ở mọi trang mà không nút nào tới được")
ok(!html.includes('data-nav="queue"'), "không nút nào còn trỏ `data-nav=\"queue\"`",
   "bấm vào sẽ đổi URL tới màn không tồn tại rồi tải lại trang đã bị xoá")
const dangBat = (html.match(/class="view on"/g) ?? []).length
ok(dangBat === 1, "đúng một view mang class 'on'", `có ${dangBat}`)

console.log("\nHai chế độ dữ liệu (FR-034 — một server, hai nguồn)\n")

// Trước FR-034 hai chế độ chọn lúc BUILD (dev/dev:kb + quartz build). Giờ cả
// hai sống trên MỘT server: `/` đọc DB, `/mock/` đọc kb-mock/ — kiểm ở tầng
// render thay vì tầng script npm.
const pkg = JSON.parse(readFileSync(join(TEST, "..", "package.json"), "utf8"))
ok("api" in pkg.scripts && !/quartz/.test(pkg.scripts.api),
  "script `api` là đường chạy duy nhất, không còn quartz")
ok(!("dev" in pkg.scripts) && !("serve" in pkg.scripts),
  "script dev/serve (Quartz build-time) đã nhổ — hai chế độ giờ là hai ĐƯỜNG trên một server")
ok(pkg.scripts.build.includes("build-fe"),
  "npm run build chỉ còn biên dịch FE — trang không build nữa, render lúc request")

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · mọi nút có mã xử lý, hai chế độ dữ liệu khai đủ")
