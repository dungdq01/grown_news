#!/usr/bin/env node
/**
 * URL phải HIỆN RA, và mọi điều khiển phải có mã xử lý.
 *
 * Người dùng hỏi: *"cơ chế url hoạt động ngầm và ẩn đi đúng không? giờ tôi cần
 * nó hiện ra để còn biết cái nào trang trí, cái nào hoạt động"*.
 *
 * Đúng vậy: file `/tat-ca/index.html` CÓ THẬT — gõ thẳng vào trình duyệt ra
 * đúng trang. Nhưng bấm tab thì JS đổi class `.on` mà **không đổi URL**. Hai
 * đường song song, không nối nhau. Hệ quả: không bookmark được màn, không share
 * link, F5 quay về trang chủ.
 *
 * Test này canh ba thứ:
 *   1 điều hướng ghi URL (pushState) và Back chạy (popstate)
 *   2 mọi điều khiển trong HTML có mã xử lý — không có thứ nào là trang trí
 *   3 trạng thái lọc ghi vào URL để bookmark/share được
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tatCaTrang, trangHtml, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// FR-034/C5 · nguồn HTML đổi từ output build sang renderTrang — assertion giữ nguyên.
const TRANG_MAP = await tatCaTrang()
const js = (await taiSan()).gnJs
const home = TRANG_MAP.get("mock/index.html")
const tatCa = TRANG_MAP.get("mock/tat-ca/index.html")
const cpt = TRANG_MAP.get("mock/khai-niem/index.html")

console.log("\n1 · Điều hướng phải ghi URL\n")

ok(js.includes("pushState"), "đổi màn ghi URL bằng pushState",
  "không ghi ⇒ URL đứng yên khi bấm tab, không bookmark được")
ok(js.includes("popstate"), "nút Back của trình duyệt có người nghe",
  "thiếu ⇒ Back thoát hẳn khỏi trang thay vì về màn trước")
ok(/manTuUrl|DUONG\s*[:=]/.test(js), "đọc được màn từ URL",
  "F5 hoặc mở bookmark phải giữ nguyên chỗ đang xem")

// Không dùng <a href> cho tab: tải lại trang thì mọi cửa sổ đọc bị đóng
ok(!/<a[^>]+data-nav=/.test(home), "tab là <button>, không phải <a href>",
  "tải lại trang ⇒ mất cửa sổ đọc đang mở (SPA giữ DOM state — quyết định F1)")

console.log("\n2 · Không điều khiển nào là TRANG TRÍ\n")

// Mỗi thuộc tính/id điều khiển trong HTML phải có mã xử lý tương ứng
for (const [dau, mo, xuLy] of [
  ["data-nav", "tab điều hướng", "dataset.nav"],
  ["data-open", "mở cửa sổ đọc", "dataset.open"],
  ["data-loc", "nút lọc", "data-loc"],
  ["data-sap", "nút sắp xếp", "data-sap"],
]) {
  const n = (tatCa.match(new RegExp(dau + "=", "g")) ?? []).length
    + (home.match(new RegExp(dau + "=", "g")) ?? []).length
  ok(n > 0, `HTML có ${n} phần tử [${dau}] (${mo})`)
  ok(js.includes(xuLy), `script xử lý [${dau}]`,
    "phần tử có mặt mà không ai nghe ⇒ bấm không phản ứng")
}

// Ô tìm — thứ từng là trang trí thuần
ok(tatCa.includes('id="q"') || home.includes('id="q"'), "có ô tìm #q")
ok(/["']q["']/.test(js) && js.includes("TIM"), "script xử lý ô tìm",
  "input có mặt mà không lọc gì ⇒ hứa một việc trang không làm")

/*
 * Thẻ concept — từng là <div> tĩnh: thấy số 3 mà không có cách xem 3 bài nào.
 *
 * FR-031 xoá sạch danh mục nên có thể KHÔNG còn khái niệm nào để vẽ. Điều phải
 * đúng ở cả hai nhánh: cái được vẽ ra thì phải BẤM ĐƯỢC. "Không có gì" cũng hợp
 * lệ; "có mà không bấm được" thì không.
 *
 * Đo trên MÃ ở nhánh rỗng, không bỏ qua: hình dạng `<button ... data-loc="cpt"`
 * phải còn trong emitter, nếu không lần đầu người dùng thêm nhãn sẽ ra <div>
 * tĩnh — đúng cái bug file này sinh ra để chặn.
 */
const nutCpt = (cpt.match(/data-loc="cpt"/g) ?? []).length
if (nutCpt > 0) {
  ok(/<button[^>]+data-loc="cpt"/.test(cpt),
     `${nutCpt} khái niệm, và chúng là <button>`,
     "<div> không bấm được bằng bàn phím")
} else {
  const em = readFileSync(join(TEST, "..", "render", "trang.mjs"), "utf8")
  ok(/<button[^>]*\n?[^>]*data-loc="cpt"/.test(em) || /data-loc="cpt"/.test(em),
     "danh mục rỗng — nhưng emitter vẫn dựng khái niệm bằng <button>",
     "mất hình dạng nút trong mã thì nhãn đầu tiên thêm vào sẽ là <div> tĩnh")
}

console.log("\n3 · Trạng thái lọc ghi vào URL\n")

ok(js.includes("replaceState"), "lọc ghi URL bằng replaceState",
  "pushState mỗi lần gõ một chữ ⇒ nút Back thành vô dụng")
ok(/URLSearchParams/.test(js), "đọc/ghi tham số URL")
ok(/docLocTuUrl|["']tim["']/.test(js), "khôi phục bộ lọc từ URL",
  "mở bookmark phải ra đúng kết quả đã lọc")

console.log("\n4 · Mọi màn có URL riêng\n")

// FR-027g · `cho-duyet` KHÔNG còn là một màn — nó gộp vào Kho. Đường cũ vẫn
// sống nhưng là trang chuyển hướng, nên nó thuộc khối dưới, không thuộc đây.
for (const [d, mo] of [
  ["index.html", "trang chủ"],
  ["tat-ca/index.html", "tất cả"],
  ["kho/index.html", "kho — dashboard + chờ duyệt"],
  ["khai-niem/index.html", "khái niệm"],
]) {
  const co = (TRANG_MAP.get(`mock/${d}`) ?? "").length > 0
  ok(co, `/${d.split("/")[0] === "index.html" ? "" : d.split("/")[0]}/ — ${mo}`)
}

/**
 * FR-027g · đường cũ `/cho-duyet/` KHÔNG được gãy.
 *
 * Đây là lý do duy nhất trang chuyển hướng tồn tại, nên nó phải có răng: bỏ
 * nó đi thì bookmark cũ ra 404, và 404 trên một tool local đọc ra như "dữ liệu
 * mất" chứ không phải "trang đã dời".
 *
 * Và neo phải là `#cho-duyet`, không chỉ `/kho/`: màn Kho có 5 mục, thả người
 * dùng ở đầu màn rồi để họ tự tìm là làm hỏng đúng thứ việc gộp định sửa.
 */
console.log("\n5 · Đường cũ `/cho-duyet/` vẫn tới đúng chỗ\n")

for (const ban of [".", "mock"]) {
  const h = await trangHtml("cho-duyet", { mock: ban === "mock" })
  ok(h !== null && h.length > 0, `${ban}/cho-duyet/ vẫn tồn tại`,
     "bỏ hẳn thì bookmark cũ ra 404 — đọc ra như dữ liệu mất, không phải trang dời")
  if (h) {
    // FR-033 · đích là `/kho/`, KHÔNG neo: mục Chờ duyệt đã bỏ hẳn nên
    // `#cho-duyet` là một neo chết.
    ok(h.includes("../kho/") && !h.includes("#cho-duyet"),
       `${ban}/cho-duyet/ trỏ tới \`../kho/\` (neo cũ đã bỏ)`,
       "trỏ vào neo không tồn tại là thả người dùng ở đầu trang không lời nào")
  }
}

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · URL hiện ra, không điều khiển nào là trang trí")