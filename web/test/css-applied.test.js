#!/usr/bin/env node
/**
 * CSS và script PHẢI đến được trang tự sinh.
 *
 * Lỗi này hỏng IM LẶNG: build vẫn `Emitted 79 files`, exit 0, mọi test khác
 * xanh — nhưng trang ra HTML thô, không nền, không kính, không lưới.
 *
 * Nguyên nhân đã gặp: Quartz sinh CSS component thành file riêng CÓ HASH
 * (component-4b41b8ff.css). Trang do Quartz render nạp đủ; trang do emitter
 * của ta sinh thì chỉ nạp /index.css — và index.css KHÔNG chứa CSS component.
 *
 * Không trỏ vào tên có hash được: emitter chạy TRƯỚC ComponentResources ghi
 * chúng. Nên CSS và script nhúng thẳng, và test này canh việc đó.
 */
import { existsSync } from "node:fs"
import { tatCaTrang, trangHtml, taiSan } from "./_render.mjs"

// FR-034/C5 · nguon doi tu output build sang renderTrang/taiSan — assertion
// giu nguyen. CSS van tach file (SSR phat o /gn.css), MOT bundle cho ca hai ban.
const TRANG_MAP = await tatCaTrang()
const TAI_SAN = await taiSan()
const docCss = () => TAI_SAN.gnCss

const loi = []
const ok = (dk, ten, ct = "") => {
  console.log(`  ${dk ? "ok  " : "FAIL"} ${ten}${dk ? "" : "  " + ct}`)
  if (!dk) loi.push(ten)
}

// FR-027g · `cho-duyet/index.html` không còn là một MÀN — nó là trang chuyển
// hướng sang `/kho/#cho-duyet`, và trang chuyển hướng thì KHÔNG được nạp CSS
// (nạp 84 KB rồi nhảy đi ngay là lãng phí thuần). Đổi sang `kho/` — màn thật
// mà mục Chờ duyệt giờ sống trong đó. Stub được kiểm riêng ở khối cuối file.
const trang = ["index.html", "tat-ca/index.html", "kho/index.html"]

console.log("\nCSS phải đến được trang — build xanh không đủ\n")

for (const t of trang) {
  const h = TRANG_MAP.get(t)
  const ten = t
  // CSS nam o gn.css — SSR dung MOT bundle cho ca hai ban
  const css = docCss()

  // Token: thiếu nó thì mọi var(--...) rỗng và trang trắng trơn
  ok(css.includes("--fs-body") && css.includes("--brand"),
    `${ten}: có token`, "thiếu token ⇒ mọi var() rỗng")

  // Bốn dấu vân tay của thiết kế s5 — mất một cái là mất một tầng
  for (const [dau, mo] of [
    [".sky{", "nền phong cảnh"],
    ["backdrop-filter", "kính mờ"],
    [".pn{", "panel"],
    [".brk-g{", "lưới bất đối xứng"],
  ]) {
    ok(css.includes(dau), `${ten}: có ${mo}`, `mất ${dau}`)
  }

  // Không được trỏ vào /index.css: nó KHÔNG chứa CSS component
  ok(h.includes("gn.css"), `${ten}: nạp gn.css`,
    "trang phai tro toi CSS, khong thi ra HTML tho")
  ok(!h.includes('href="/index.css"'),
    `${ten}: không trỏ /index.css`,
    "index.css không chứa CSS component ⇒ trang ra HTML thô")
}

console.log("\nScript phải chạy được\n")

// Doc ban mock — luon co du lieu tu kb-mock.
const home = TRANG_MAP.get("mock/index.html")
const js = TAI_SAN.gnJs
ok(home.includes("gn.js"), "trang chủ nạp gn.js")
ok(js.includes("static/bg/index.json"),
  "script nền có mặt", "không có thì ảnh nền không bao giờ đổi")
ok(home.includes("data-open"), "có điểm bấm mở cửa sổ")

// Script phải là JS đã dịch, không phải TypeScript thô
ok(!/\btype [A-Z]\w* = \{/.test(js),
  "script là JS đã dịch, không phải TS thô",
  "Quartz không strip TypeScript ⇒ trình duyệt báo lỗi cú pháp")

console.log("\nẢnh nền phải có mặt\n")

const idx = JSON.parse(TAI_SAN.anhNen.index)
ok((idx.light?.length ?? 0) > 0, `${idx.light?.length ?? 0} ảnh tone sáng`)
ok((idx.dark?.length ?? 0) > 0, `${idx.dark?.length ?? 0} ảnh tone tối`)
for (const u of [...(idx.light ?? []), ...(idx.dark ?? [])].slice(0, 3)) {
  // SSR stream thang tu public/: URL phai tro vao mot file THAT tren dia.
  const p = TAI_SAN.anhNen.file.get(u.replace("/static/bg/", ""))
  ok(!!p && existsSync(p), `ảnh ${u} tồn tại thật`)
}

/**
 * FR-027g · `/cho-duyet/` là TRANG CHUYỂN HƯỚNG — ngoại lệ được KHAI, không
 * phải điều bị bỏ qua.
 *
 * Nó cố ý **không** nạp CSS/JS: nạp 84 KB rồi nhảy đi ngay là lãng phí thuần.
 * Nhưng "không có CSS" cũng chính là triệu chứng của lỗi mà file này sinh ra để
 * bắt (trang ra HTML thô). Nên phải nói rõ: trang này được miễn VÌ nó là stub,
 * và điều đó phải kiểm được — chứ không phải chỉ bỏ nó khỏi danh sách rồi thôi.
 */
console.log("\n`/cho-duyet/` — trang chuyển hướng, cố ý không có CSS\n")

for (const ban of [".", "mock"]) {
  const h = await trangHtml("cho-duyet", { mock: ban === "mock" })

  // FR-033 · neo `#cho-duyet` KHÔNG còn — mục Chờ duyệt đã bỏ hẳn. Trỏ vào một
  // neo không tồn tại thì trình duyệt thả người dùng ở đầu trang mà không nói
  // gì, tức tệ hơn trỏ thẳng vào `/kho/`.
  ok(/http-equiv="refresh"[^>]*url=\.\.\/kho\//.test(h)
     && !/#cho-duyet/.test(h),
     `${ban}/cho-duyet: chuyển hướng tới \`../kho/\`, không neo chết`,
     "neo đã bỏ — trỏ vào nó là thả người dùng ở đầu trang không lời giải thích")
  // Đường TƯƠNG ĐỐI: `/mock/cho-duyet/` phải về `/mock/kho/`, không nhảy sang
  // bản real — người dùng sẽ tưởng dữ liệu biến mất.
  ok(!/url=\/(mock\/)?kho/.test(h), `${ban}/cho-duyet: dùng đường tương đối`,
     "đường tuyệt đối làm bản mock nhảy sang bản real")
  // Link THẬT, không chỉ meta refresh: refresh có thể bị chặn, và trình đọc
  // màn hình đọc trang trước khi nó kịp nhảy. Chỉ một trong hai là đường cụt.
  ok(/<a href="\.\.\/kho\/"/.test(h), `${ban}/cho-duyet: có link thật`,
     "chỉ meta refresh thì khi refresh bị chặn, trang thành ngõ cụt")
  ok(!h.includes("gn.css") && !h.includes("gn.js"),
     `${ban}/cho-duyet: KHÔNG nạp CSS/JS (đúng — nó chỉ chuyển hướng)`)
  const n = Buffer.byteLength(h, "utf8")
  ok(n <= 1024, `${ban}/cho-duyet: ${n} byte (≤ 1 KB)`,
     "stub phình ra là dấu hiệu ai đó bắt đầu dựng lại một màn ở đây")
}

console.log()
if (loi.length) { console.log(`${loi.length} lỗi`); process.exit(1) }
console.log("pass · CSS, script và ảnh nền đều đến được trang")
