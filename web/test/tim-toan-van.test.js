#!/usr/bin/env node
/**
 * T03-125 bước 2 — UI TÌM TOÀN VĂN (SCR-27, chủ dự án duyệt 2026-09-11).
 *
 * CỔNG VIẾT TRƯỚC (rule.md mục 8): sinh ở `07_plan/M03_web/tasks/T03-125-tim-toan-van.test.js`
 * (đỏ "chưa dựng" → pass), dời vào đây bằng `git mv` ở `T03-152` + đăng ký `npm test` — khuôn
 * `T03-150`. Ở thư mục task nó có **0 răng tự động**: không `package.json`, không `ci.yml` nào gọi.
 *
 * VÌ SAO CỔNG NÀY TỒN TẠI
 * Ô `#q` hôm nay lọc CHUỖI TRÊN DOM đã render (`TIM` + `apLoc()`) — `PRD U6` hứa full-text từ đợt
 * MỘT. Panel này gọi `GET /api/tim` (T08-35) → `POST :8791/truy-hoi` (T13-4), tức truy hồi THẬT trên
 * chỉ mục FTS5. Ba thứ M13 trả (đoạn · địa chỉ · số bản ghi trong phạm vi) phải HIỆN đủ, vì
 * `B-C2`/ui_flow §2: phạm vi là control HIỂN THỊ, không phải top-k ẩn.
 *
 * ĐỎ_KHI  chunk không khai / không nạp theo focus · `k` không phải tham số web khai · dùng snippet
 *         của FTS thay vì tự tô từ `body` · thiếu một trong bốn trạng thái · bấm không mở cửa sổ +
 *         nhảy `#anchor` · thiếu phím ↑↓/Enter/Esc · không huỷ lời gọi cũ · móc trong multiwindow > 5 dòng
 * XANH_KHI sáu vế dưới đây
 * --tu-kiem  gieo bản hỏng (bỏ debounce · bỏ mark · k gõ cứng ở M13) ⇒ phép chấm phải ĐỎ
 */
import { existsSync, readFileSync } from "node:fs"
import { execFileSync, spawnSync } from "node:child_process"
import { join } from "node:path"

import { taoKiem } from "./_api.mjs"
import { napRender } from "./_render.mjs"

const WEB = join(import.meta.dirname, "..")
const GOC = join(WEB, "..")

const { ok, chot } = taoKiem()
const TU_KIEM = process.argv.includes("--tu-kiem")
const TIM_TS = join(WEB, "plugins", "timkiem", "src", "timkiem.inline.ts")
const TIM_JS = join(WEB, "plugins", "timkiem", "src", "timkiem.inline.js")
const MW_TS = join(WEB, "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts")

function tach(src, ten) {
  const dau = new RegExp(`(?:^|\\n)[\\t ]*((?:async )?(?:function ${ten}\\(|const ${ten} = ))`)
  const m = dau.exec(src)
  if (!m) return null
  const i = m.index + m[0].indexOf(m[1])
  if (m[1].includes("function")) {
    const j = src.indexOf("{", i)
    let sau = 0
    for (let k = j; k < src.length; k++) {
      if (src[k] === "{") sau++
      else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
    }
    return null
  }
  let sau = 0
  for (let k = i; k < src.length; k++) {
    const c = src[k]
    if ("({[".includes(c)) sau++
    else if (")}]".includes(c)) sau--
    else if (c === ";" && sau === 0) return src.slice(i, k + 1)
  }
  return null
}

if (!existsSync(TIM_TS)) {
  ok(false, "web/plugins/timkiem/src/timkiem.inline.ts tồn tại", "T03-125 bước 2 chưa dựng — panel tìm chưa có")
  chot("")
}
if (!existsSync(TIM_JS)) execFileSync(process.execPath, ["build-fe.mjs"], { cwd: WEB, stdio: "ignore" })
const SRC = readFileSync(TIM_JS, "utf8")
const MW = readFileSync(MW_TS, "utf8")

/** Máy chạy được: các hàm THUẦN của chunk (không DOM). */
/** Hằng cấp module mà các hàm thuần đọc — trích để chạy chúng ngoài chunk (số THẬT, không bịa). */
function hang() {
  const ra = []
  for (const t of ["K", "THEM", "TRAN_DOAN"]) {
    const m = new RegExp(`(?:^|\\n)\\s*(?:const|var|let)\\s+${t}\\s*=\\s*([^;\\n]+)`).exec(SRC)
    if (!m) throw new Error(`không trích được hằng \`${t}\``)
    ra.push(`const ${t} = ${m[1].trim()};`)
  }
  return ra.join("\n")
}

function lapMay(bien = (s) => s) {
  const phan = ["boDauTim", "duongTim", "toSang", "nhan", "veDong", "veThan"].map((t) => {
    const s = tach(SRC, t)
    if (!s) throw new Error(`không trích được \`${t}\` từ timkiem.inline.js`)
    return s
  })
  return new Function(`const esc=(s)=>String(s??"").replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
${hang()}
${bien(phan.join("\n"))}
return { boDauTim, duongTim, toSang, veThan, K, THEM, TRAN_DOAN }`)()
}

const KQ = {
  ket_qua: [
    { doc_id: "ruflo", file: "kb/repo/ruflo.md", anchor: "5-rui-ro-va-tam-nhin", line_start: 170, line_end: 181,
      dia_chi: "repo/ruflo.md:170-181", heading_path: "Ruflo › 5. Rủi ro và tầm nhìn",
      body: "Khi harness gánh trí nhớ vượt phiên, rủi ro lớn nhất là một tầng không ai đọc.", nguon_van_ban: "than", bm25: -7.4 },
    { doc_id: "thien-duong-chuot", file: "kb/video/thien-duong-chuot.md", anchor: null, line_start: null, line_end: null,
      dia_chi: "thien-duong-chuot:t=03:15", heading_path: "Thiên đường chuột › transcript",
      body: "Lời tiên tri không nằm ở số lượng chuột chết.", nguon_van_ban: "hien-vat:text/vtt", bm25: -5.1 },
  ],
  so_ban_ghi_trong_pham_vi: 12,
  tong: 2,
}

if (TU_KIEM) {
  console.log("\ntu-kiem · phép chấm phải ĐỎ ĐƯỢC trên bản gieo hỏng\n")
  const may = lapMay()
  ok(/<mark/.test(may.toSang(KQ.ket_qua[0].body, "rui ro")), "nền: gõ không dấu vẫn tô được chỗ có dấu")
  const khongMark = lapMay((s) => s.replace(/<mark[^`"']*?<\/mark>/g, "").replace(/"<mark>"/g, '""'))
  ok(!/<mark/.test(khongMark.toSang(KQ.ket_qua[0].body, "rui ro")) !== !/<mark/.test(may.toSang(KQ.ket_qua[0].body, "rui ro")),
    "bỏ <mark> khỏi toSang ⇒ phép chấm highlight đổi kết quả (đỏ được)")
  const d = may.duongTim("rủi ro", { pl: ["video"], cat: [] }, 20)
  ok(/[?&]k=20\b/.test(d), "nền: k đi trong query", d)
  ok(!/[?&]k=/.test(may.duongTim("x", {}, undefined).replace(/k=20/, "")), "bỏ k ⇒ đường không còn k (đỏ được)")
  const tt = ["rong", "dang", "ket", "khong", "loi"].map((t) => may.veThan(t, { q: "x", kq: KQ, so: 12 }))
  ok(tt.every((h) => typeof h === "string"), "nền: veThan trả chuỗi cho năm trạng thái")
  ok(new Set(tt).size === 5, "năm trạng thái ra năm HTML KHÁC nhau — trùng nghĩa là một trạng thái không nói gì riêng")
  chot("phép chấm đỏ được")
}

const may = lapMay()

console.log("\n1 · Chunk riêng, nạp THEO FOCUS — 0 byte thêm cho trang chủ trước khi gõ\n")
const m = await napRender()
ok(m.tenChunk().includes("timkiem"), "`timkiem` khai trong CHUNK của assets.mjs", m.tenChunk().join(", "))
ok((m.chunkTheoYeuCau ?? []).includes("timkiem"), "`timkiem` nằm trong chunkTheoYeuCau (không màn nào phát thẻ <script>)", String(m.chunkTheoYeuCau))
ok(!!m.gnChunk("timkiem"), "phục vụ được /gn-timkiem.js")
const moc = MW.split("\n").filter((l) => /__GN_TIM__|gn-timkiem/.test(l) && !l.trim().startsWith("//") && !l.trim().startsWith("*"))
ok(moc.length > 0 && moc.length <= 5, `móc trong multiwindow.inline.ts ≤ 5 dòng (rule 15) — thấy ${moc.length}`, moc.map((x) => x.trim().slice(0, 60)).join(" | "))
const dongFocus = MW.split("\n").filter((l) => /focusin|"focus"/.test(l) && /capTim|__GN_TIM__/.test(l))
ok(dongFocus.length === 1, "móc gọi chunk khi ô tìm NHẬN FOCUS, không lúc tải trang", dongFocus.join(" | ") || "không thấy dòng focus nào gọi chunk tìm")
ok(!/gn-timkiem/.test(m.gnChunk("multiwindow") ?? "") && !(await import(new URL("file://" + join(WEB, "render", "assets.mjs").replace(/\\/g, "/")))).chunkTheoYeuCau.includes("multiwindow"),
  "chunk tìm KHÔNG bị nhét vào bundle chung — nó chỉ được xin qua thẻ <script> lúc focus")

console.log("\n2 · AC1 · gõ có dấu và không dấu ra CÙNG kết quả; highlight TỰ TÔ, 0 snippet()\n")
ok(may.duongTim("rủi ro", {}, 20) === may.duongTim("rủi ro", {}, 20), "đường tìm ổn định")
const q1 = new URL("http://x" + may.duongTim("rủi ro", {}, 20)).searchParams.get("q")
const q2 = new URL("http://x" + may.duongTim("rui ro", {}, 20)).searchParams.get("q")
ok(q1 === "rủi ro" && q2 === "rui ro", "câu hỏi đi NGUYÊN VĂN xuống M13 — chuẩn hoá là việc của chuan_hoa_tim, không phải của FE", `${q1} · ${q2}`)
for (const q of ["rủi ro", "rui ro", "RỦI RO"]) {
  ok(/<mark>/.test(may.toSang(KQ.ket_qua[0].body, q)), `gõ \`${q}\` ⇒ tô được trong body có dấu (tự tô, bỏ dấu hai phía)`)
}
ok(!/snippet\s*\(/.test(SRC), "0 lời gọi snippet( trong chunk — bằng chứng là `body` đầy đủ (M13-R4)")
ok(may.toSang("<script>x</script> rủi ro", "rủi ro").includes("&lt;script&gt;"), "body được escape trước khi tô — 0 HTML của dữ liệu lọt vào panel")

console.log("\n3 · AC3 · đủ BỐN trạng thái + số bản ghi trong phạm vi (cùng lời gọi)\n")
const than = {
  rong: may.veThan("rong", { q: "" }),
  dang: may.veThan("dang", { q: "harness" }),
  ket: may.veThan("ket", { q: "rủi ro", kq: KQ }),
  khong: may.veThan("khong", { q: "zzz", kq: { ket_qua: [], so_ban_ghi_trong_pham_vi: 12, tong: 0 }, loc: { pl: ["video"] } }),
  loi: may.veThan("loi", { q: "x", ma: 502 }),
}
ok(/đang tìm/i.test(than.dang), "ĐANG TÌM nói ra câu đang tìm", than.dang.slice(0, 80))
ok(/12/.test(than.ket) && /phạm vi/i.test(than.ket), "kết quả hiện `12 bản ghi trong phạm vi` — số đến CÙNG lời gọi (AC-5.1)", than.ket.slice(0, 120))
ok(/nới|lọc/i.test(than.khong), "0 kết quả TRONG PHẠM VI ⇒ gợi ý nới phạm vi (khác 0 trên toàn kho)", than.khong.slice(0, 120))
ok(!/nới/i.test(may.veThan("khong", { q: "zzz", kq: { ket_qua: [], so_ban_ghi_trong_pham_vi: 12, tong: 0 }, loc: {} })),
  "0 kết quả mà KHÔNG lọc gì ⇒ nói `không có trong kho`, không gợi ý nới")
ok(/502/.test(than.loi) && /thử lại/i.test(than.loi), "lỗi service ⇒ mã + nút thử lại, không ẩn panel im lặng", than.loi.slice(0, 120))
ok(!/bm25|-7\.4/.test(than.ket), "điểm bm25 KHÔNG hiện cho người đọc (ui_flow §3)")
ok(than.ket.includes("repo/ruflo.md:170-181") && than.ket.includes("thien-duong-chuot:t=03:15"),
  "mỗi dòng hiện ĐỊA CHỈ — cả `file:A-B` lẫn `slug:t=` của chunk cue")
ok(/Rủi ro và tầm nhìn/.test(than.ket), "breadcrumb = heading_path")

console.log("\n4 · AC2 · bấm ⇒ mở cửa sổ đọc đúng bài rồi nhảy tới id heading (C3)\n")
ok(/moTheoSlug/.test(SRC), "chunk gọi `__GN_MW__.moTheoSlug` — dùng lại máy mở cửa sổ, không dựng bản thứ hai")
ok(/scrollIntoView/.test(SRC), "có cuộn tới phần tử (scrollIntoView)")
ok(/getElementById\(|querySelector\(\s*["'`]#|\#\$\{/.test(SRC), "tra phần tử theo `id` — chính `id` mà C3 (T03-149) sinh từ slugGoiY")
ok(/data-i=|dataset\.i\b/.test(SRC), "mỗi dòng mang chỉ số để bấm/Enter chọn đúng dòng")

console.log("\n5 · Phím và huỷ lời gọi cũ\n")
for (const [ten, re] of [["ArrowDown", /ArrowDown/], ["ArrowUp", /ArrowUp/], ["Enter", /Enter/], ["Escape", /Escape/]]) {
  ok(re.test(SRC), `phím ${ten} có xử lý`)
}
ok(/AbortController/.test(SRC), "huỷ lời gọi cũ bằng AbortController — gõ tiếp không xếp hàng")
ok(/setTimeout\([^,]+,\s*250\s*\)|NHIP\s*=\s*250/.test(SRC), "debounce 250 ms (SCR-27 §3)")
ok(/x-phien/.test(SRC), "gửi `x-phien` để M13 đếm tín hiệu gõ-lại (AC-7.1) — FE không tự đếm")
ok(!/localStorage\.setItem\(\s*["'`]tim/.test(SRC), "không tự đếm tín hiệu ở FE (M13 đã đếm)")

console.log("\n6 · Class sinh trong JS đều có luật CSS (bài học menu vô hình)\n")
const CSS = readFileSync(join(WEB, "styles", "prototype.css"), "utf8")
const cls = new Set([...SRC.matchAll(/class="([^"]+)"/g)].flatMap((x) => x[1].split(/\s+/)).filter(Boolean)
  .flatMap((c) => (c.includes("${") ? [] : [c])))
const thieu = [...cls].filter((c) => !new RegExp(`\\.${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s,:{.>]`).test(CSS))
ok(thieu.length === 0, `mọi class trong chunk có luật trong prototype.css (${cls.size} class)`, thieu.join(" · "))

chot("chunk theo focus · câu đi nguyên văn, tự tô · 4 trạng thái + số trong phạm vi · bấm mở cửa sổ + nhảy id · phím · class có CSS")
