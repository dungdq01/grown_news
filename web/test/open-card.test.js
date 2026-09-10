#!/usr/bin/env node
/**
 * Bấm thẻ PHẢI mở được nội dung bài — ở CẢ HAI bản, MỌI trạng thái.
 *
 * Ba lỗi test này canh, cả ba từng cùng tồn tại và cùng lọt qua 15 test khác:
 *
 * 1 · **`data-open` chỉ gắn cho `approved`.** 4/17 thẻ ở màn Tất cả và MỌI dòng
 *     ở màn Chờ duyệt không bấm được. Nhưng hai màn đó là màn QUẢN LÝ — đọc nội
 *     dung bản draft chính là việc người duyệt cần làm.
 *
 * 2 · **Bản `/mock/` không có chỉ mục riêng.** `merge-by-source` chỉ phát MỘT
 *     `static/merged-index.json` ở gốc (nó đọc `content` đã bị Quartz lọc, không
 *     biết về hai kho). JS gọi đường TUYỆT ĐỐI nên trang `/mock/tat-ca/` đọc chỉ
 *     mục của kho THẬT ⇒ chỉ số trỏ vào kho khác.
 *
 * 3 · **Không có thân bài để mở.** `tai()` fetch `/{slug}` — nhưng Quartz chỉ
 *     sinh trang bài ở GỐC, nên bấm thẻ ở `/mock/` mở ra cửa sổ rỗng.
 *
 * Cả ba đều là lỗi IM LẶNG: build xanh, trang hiện đủ thẻ, chỉ là bấm vào không
 * ra gì. Chỉ người dùng bấm mới phát hiện.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { tatCaTrang, taiSan } from "./_render.mjs"

const TEST = dirname(fileURLToPath(import.meta.url))

// FR-034/C5 · nguồn đổi từ output build sang renderTrang/openIndexJson —
// assertion giữ nguyên. Bản real đọc KHO TẠM qua DB (không phải kb/ thật).
const TRANG_MAP = await tatCaTrang()
const TAI_SAN = await taiSan()

const loi = []
const ok = (c, ten, ghi = "") => {
  console.log((c ? "  ok   " : "  FAIL ") + ten + (c ? "" : "  <- " + ghi))
  if (!c) loi.push(ten)
}

console.log("\nChỉ mục mở cửa sổ — MỖI BẢN một file\n")

ok(TAI_SAN.openIndexMock !== TAI_SAN.openIndexReal, "bản /mock/ có chỉ mục RIÊNG",
   "JS sẽ đọc chỉ mục của kho khác ⇒ chỉ số trỏ sai bài")

const j = JSON.parse(TAI_SAN.openIndexMock)
const bans = j.articles.flatMap((a) => a.bans)
ok(j.articles.length > 0, `${j.articles.length} bài trong chỉ mục`)

// Chỉ mục phải gồm MỌI trạng thái — hai màn quản lý cần đọc cả draft
const tt = new Set(bans.map((b) => b.review_status))
ok(tt.has("draft"), `chỉ mục có bản draft (trạng thái: ${[...tt].join("/")})`,
   "màn Chờ duyệt không mở được bài nào")

// Mọi bản phải có thân bài — không có thì cửa sổ mở ra rỗng
const khongThan = bans.filter((b) => !b.than || b.than.length < 50)
ok(khongThan.length === 0, `${bans.length}/${bans.length} bản có thân bài`,
   `thiếu thân: ${khongThan.map((b) => b.slug).join(", ")}`)

console.log("\nThẻ bấm được — mọi trạng thái\n")

/** Nội dung thật giữa thẻ mở có id và thẻ đóng tương ứng */
function trong(src, id) {
  const m = src.match(new RegExp(`<(\\w+)[^>]*\\bid="${id}"[^>]*>`))
  if (!m) return null
  const the = m[1]
  const dau = m.index + m[0].length
  let sau = 1, k = dau
  while (k < src.length && sau > 0) {
    if (new RegExp(`^<${the}[\\s>]`, "i").test(src.slice(k, k + the.length + 2))) sau++
    else if (new RegExp(`^</${the}>`, "i").test(src.slice(k, k + the.length + 3))) {
      sau--
      if (sau === 0) break
    }
    k++
  }
  return src.slice(dau, k)
}

for (const [ban, goc] of [["mock", "mock/"], ["real", ""]]) {
  const hAll = TRANG_MAP.get(`${goc}tat-ca/index.html`)
  if (!hAll) { ok(false, `${ban}: có màn Tất cả`); continue }
  const grid = trong(hAll, "grid2") ?? ""
  const the = (grid.match(/class="cd /g) ?? []).length
  const co = (grid.match(/data-open="/g) ?? []).length
  if (the === 0) {
    console.log(`  ok   ${ban}: kho trống, không thẻ nào — đúng thực tế`)
    continue
  }
  ok(the === co, `${ban} · Tất cả: ${the} thẻ, ${co} bấm được`,
     "thẻ draft/rejected không có data-open ⇒ bấm không ra gì")

  // Chỉ số phải nằm trong chỉ mục của CHÍNH bản đó
  {
    const n = JSON.parse(ban === "mock" ? TAI_SAN.openIndexMock : TAI_SAN.openIndexReal)
      .articles.length
    const qua = [...grid.matchAll(/data-open="(\d+)"/g)]
      .map((x) => Number(x[1])).filter((x) => x >= n)
    ok(qua.length === 0, `${ban}: mọi chỉ số < ${n} (trong phạm vi chỉ mục)`,
       `vượt: ${qua.join(", ")}`)
  }

  // Chỉ mục phải phủ MỌI trạng thái. Bug thật: emitter gom
  // [...appr, ...draft, ...rej] — thiếu `edited` (trạng thái thứ tư, M02 §2.2)
  // ⇒ bản edited không có data-open. Phép kiểm trên (thẻ === bấm được) BẮT được
  // nhưng chỉ khi kho có bản edited; mock không có nên nó ngủ. Đây là phép kiểm
  // nói tên trạng thái nào thiếu, thay vì chỉ nói một con số lệch.
  const thieu = [...grid.matchAll(/class="cd st-([a-z]+)"([^>]*)>/g)]
    .filter((x) => !x[2].includes("data-open="))
    .map((x) => x[1])
  ok(thieu.length === 0,
     `${ban}: chỉ mục phủ mọi trạng thái (không thẻ nào rơi ngoài)`,
     `trạng thái không vào chỉ mục: ${[...new Set(thieu)].join(", ")}`)

  /*
   * FR-033 · MỐC `queue` PHẢI BIẾN MẤT — phép kiểm đổi chiều.
   *
   * Bản trước đòi mốc PHẢI CÓ (sau khi FR-027g gộp màn Chờ duyệt vào Kho), và
   * trước nữa nó bọc trong `if (dong > 0)` — nên khi mốc biến mất, phép kiểm
   * TỰ LOẠI MÌNH khỏi tồn tại và im lặng xanh.
   *
   * Người dùng bỏ hẳn bước duyệt, nên giờ điều đúng là ngược lại: mốc phải đi.
   * Nhưng KHÔNG bọc điều kiện lần nữa — hỏi thẳng, và hỏi ở cả hai bản.
   *
   * Tính chất "mọi bản ghi mở được" thì KHÔNG mất: khối ngay trên canh chỉ mục
   * phủ MỌI trạng thái, và màn Tất cả là nơi mọi bài — kể cả `draft` từ
   * `_inbox/` — hiện ra và bấm được.
   */
  const hQ = TRANG_MAP.get(`${goc}kho/index.html`)
  if (hQ) {
    ok(trong(hQ, "queue") === null, `${ban} · mốc \`queue\` đã bỏ khỏi màn Kho`,
       "còn mốc là emitter vẫn chèn danh sách vào một chỗ không ai thấy")
    ok(!/id="cho-duyet"/.test(hQ), `${ban} · không còn mục \`#cho-duyet\``)
  }
}

console.log("\nJS đọc chỉ mục theo bản đang xem\n")
{
  const src = readFileSync(
    join(TEST, "..", "plugins", "multiwindow", "src", "scripts", "multiwindow.inline.ts"), "utf8")
  ok(/location\.pathname/.test(src) && /\/mock\//.test(src),
     "JS suy gốc từ location.pathname, không dùng đường tuyệt đối",
     "trang /mock/ sẽ đọc chỉ mục kho thật")
  ok(src.includes("open-index.json"), "JS đọc open-index.json")
  ok(!/fetch\("\/static\/merged-index/.test(src),
     "KHÔNG còn fetch merged-index tuyệt đối")
  // Thân bài lấy từ chỉ mục, không fetch trang bài
  ok(!/fetch\("\/" \+ ban\.slug\)/.test(src),
     "không fetch trang bài (bản /mock/ không có trang bài)")
  ok(/function md\(/.test(src), "có renderer markdown tối thiểu")
  // Bảo mật: escape TRƯỚC rồi dựng thẻ
  ok(/const inline = \(s: string\) => esc\(s\)/.test(src),
     "escape HTML TRƯỚC khi dựng thẻ (thân bài là nội dung ngoài)")
}

console.log(loi.length
  ? `\n${loi.length} lỗi`
  : "\npass · bấm thẻ mở được bài ở cả hai bản, mọi trạng thái")
process.exit(loi.length ? 1 : 0)
