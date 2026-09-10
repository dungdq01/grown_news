#!/usr/bin/env node
/**
 * LUỒNG NẠP BÀI end-to-end: `POST /api/inbox` → `_inbox/` → `gate.py` → `kb/`.
 *
 * VÌ SAO CÓ FILE NÀY: khảo sát độ phủ (2026-08-24) tìm ra đây là **đường ghi
 * duy nhất không có một test hành vi nào** — 10 nhánh, chỉ được canh bằng regex
 * tĩnh trong `no-write-path.test.js`. Đo được: bỏ `existsSync(dich)` chống ghi
 * đè hoặc bỏ hẳn lời gọi `tenAnToan()` thì KHÔNG test nào đỏ.
 *
 * Nó không test được vì `INBOX` trong server.mjs và `INBOX`/`KB` trong gate.py
 * là đường CỨNG — mọi phép kiểm sẽ ghi vào `_inbox/` và `kb/` thật. FR-023 GĐ 3
 * thêm `INBOX_DIR`/`KB_DIR` cho cả hai, nên giờ test được.
 *
 * Hai bug thật đã tìm ra bằng thực nghiệm trên kho thật trước khi có file này:
 *   · gate GHI ĐÈ bài đã có trong kho — sửa một bài trên web rồi chạy gate thì
 *     sửa đó biến mất, không cảnh báo. Mất dữ liệu người dùng.
 *   · gate không dọn `_inbox/` — nên mỗi lần chạy lại ghi đè kho bằng bản cũ.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { batServer, dungKho, goi, taoKiem, thanBai } from "./_api.mjs"

const { kho, rac, don } = dungKho("gn-luong-nap")
const inbox = mkdtempSync(join(tmpdir(), `gn-inbox-${process.pid}-`))
const sv = await batServer({ kho, rac, inbox })
const CONG = sv.cong
const { ok, chot } = taoKiem()

/** POST /api/inbox với body THÔ (file .md, không phải JSON). */
const nop = async (ten, noi) => {
  const r = await fetch(`http://127.0.0.1:${CONG}/api/inbox`, {
    method: "POST",
    headers: { "content-type": "text/markdown", ...(ten === null ? {} : { "x-ten-file": ten }) },
    body: noi,
  })
  let j = null
  try { j = await r.json() } catch { /* rỗng */ }
  return { ma: r.status, json: j }
}

/**
 * Bản .md ĐẠT cổng M05: 9 trường người khai + citations_sampled ≥ 2, và thân
 * bài đủ 9 mục.
 *
 * Thân bài lấy từ `thanBai()` của harness — KHÔNG tự viết bản thứ hai. Bài học
 * đo được ngay khi viết test này: bản tôi tự gõ trượt cổng với "Thiếu mục:
 * [1..9]" vì `validate.py:181` đòi đủ 9 mục số, thứ chỉ nhìn frontmatter thì
 * không thấy.
 */
const banDat = (slug, id) => `---
id: ${id}
slug: ${slug}
source_type: article
url: https://example.com/${slug}
protocol_version: "2.0"
analyzed_at: '2026-08-24'
one_liner: Bản thử luồng nạp ${slug}
credibility_max: plausible
conformance: B
citations_sampled: 2
citations_verified: 2
concepts: [idempotency]
---

${thanBai(`Bản thử luồng nạp ${slug}.`)}`

try {
  console.log("\n1 · Từ chối trước khi ghi — bốn cổng\n")

  let r = await nop("rong.md", "")
  ok(r.ma === 400, `file rỗng ⇒ 400 — được ${r.ma}`)
  ok(!existsSync(join(inbox, "rong.md")), "không tạo file rỗng trong _inbox/")

  r = await nop("khong-fm.md", "Không có frontmatter, chỉ là văn bản.")
  ok(r.ma === 400 && /frontmatter/i.test(JSON.stringify(r.json)),
     `thiếu \`---\` ⇒ 400 nói rõ frontmatter — được ${r.ma}`)
  ok(r.json?.cach_sua, "thông báo kèm CÁCH SỬA, không chỉ nói sai")
  ok(!existsSync(join(inbox, "khong-fm.md")), "không ghi file thiếu frontmatter")

  console.log("\n2 · tenAnToan — whitelist, không có đường lách\n")

  // Traversal: tên phải bị chuẩn hoá thành slug an toàn, KHÔNG được thoát thư mục.
  const truocKho = readdirSync(join(kho, "article")).length
  r = await nop("../../kb/paper/thoat.md", banDat("thoat-thu", "src_thoat1"))
  ok(r.ma === 200, `nộp tên traversal ⇒ 200 (tên bị chuẩn hoá) — được ${r.ma}`)
  ok(!/[\\/]/.test(String(r.json?.ten ?? "x/y")),
     `tên trả về không còn dấu phân cách: ${r.json?.ten}`)
  ok(!existsSync(join(kho, "paper", "thoat.md")),
     "KHÔNG file nào rơi vào kb/paper/ — traversal bị chặn bằng CẤU TRÚC")
  // Bài này ĐẠT cổng nên gate đã dọn: `_inbox/` giữ bản `.da-vao-kho.md`, không
  // giữ tên gốc. Điều cần khẳng định là tên đã CHUẨN HOÁ và file ở trong `_inbox/`
  // — dưới dạng nào cũng được, miễn không thoát ra ngoài.
  const dauVet = readdirSync(inbox).filter((f) => f.startsWith("kb-paper-thoat"))
  ok(dauVet.length === 1,
     `dấu vết nằm trong _inbox/ với tên chuẩn hoá: ${dauVet.join(", ") || "(không có)"}`)

  // Tên vắng hẳn ⇒ `khong-ten.md`, không phải chuỗi rỗng.
  r = await nop(null, banDat("khong-ten-thu", "src_konten"))
  ok(r.json?.ten === "khong-ten.md", `thiếu header tên ⇒ khong-ten.md — được ${r.json?.ten}`)

  // Tên chỉ có ký tự ngoài whitelist ⇒ cũng chuẩn hoá về `khong-ten.md`.
  // Bài trước đã vào kho nên gate dọn tên gốc ⇒ lần này KHÔNG trùng, 200.
  // Điều cần khẳng định: tên không mang ký tự lạ nào.
  r = await nop("###.md", banDat("ky-tu-la", "src_kytula"))
  ok(r.json?.ten === "khong-ten.md",
     `tên toàn ký tự lạ ⇒ khong-ten.md — được ${r.json?.ten}`,
     "whitelist gộp mọi tên vô nghĩa về một chỗ, không sinh tên lạ")

  console.log("\n3 · Nộp trùng tên ⇒ 409, bản đầu không đổi byte\n")

  // Dùng bài TRƯỢT cổng: bài đạt thì gate dọn tên gốc ngay, nên không còn gì
  // để trùng. Cổng 409 này bảo vệ đúng ca thật: người nộp lại lần hai trong khi
  // bản đầu còn đang chờ sửa.
  const ten1 = "trung-ten.md"
  const truot = "---\nid: src_truot1\nslug: truot-cong\nsource_type: article\n---\n\nthiếu trường.\n"
  await nop(ten1, truot)
  ok(existsSync(join(inbox, ten1)), "bản trượt cổng nằm lại _inbox/ chờ sửa")
  const byte1 = readFileSync(join(inbox, ten1))
  r = await nop(ten1, truot.replace("src_truot1", "src_truot2"))
  ok(r.ma === 409, `nộp lại cùng tên ⇒ 409 — được ${r.ma}`)
  ok(readFileSync(join(inbox, ten1)).equals(byte1),
     "bản nộp ĐẦU không đổi một byte",
     "ghi đè thì bản trước biến mất không dấu vết")

  console.log("\n4 · Bài ĐẠT cổng ⇒ vào kho, _inbox/ được dọn\n")

  // Kho tạm dùng concepts.yaml thật nên `idempotency` là nhãn hợp lệ.
  r = await nop("bai-dat.md", banDat("bai-dat-cong", "src_datco1"))
  ok(r.ma === 200, `nộp bài đạt ⇒ 200 — được ${r.ma}`)
  ok(r.json?.vao_kho === true,
     `gate cho vào kho (gate_ma=${r.json?.gate_ma}) — vao_kho=${r.json?.vao_kho}`,
     String(r.json?.gate_ra ?? "").slice(0, 300))
  ok(existsSync(join(kho, "article", "bai-dat-cong.md")),
     "file có thật trong kb/article/")

  // Đường nạp PHẢI ép draft + external (M05-R1) — máy không tự duyệt.
  const vao = readFileSync(join(kho, "article", "bai-dat-cong.md"), "utf8")
  ok(/^review_status:\s*draft$/m.test(vao), "bản vào kho ở `draft`")
  ok(/^origin:\s*external$/m.test(vao), "bản vào kho mang `origin: external`")
  ok(/^word_count:\s*[1-9]/m.test(vao), "word_count do MÁY tính, không phải 0")

  ok(!existsSync(join(inbox, "bai-dat.md")),
     "_inbox/ không còn `bai-dat.md` chờ gác")
  ok(existsSync(join(inbox, "bai-dat.da-vao-kho.md")),
     "đổi tên thành `.da-vao-kho.md` — đổi tên, KHÔNG xoá thật")

  console.log("\n5 · Bài trượt cổng ⇒ KHÔNG vào kho, giữ nguyên để sửa\n")

  const soTruoc = readdirSync(join(kho, "article")).length
  r = await nop("thieu-truong.md", `---
id: src_thieu1
slug: thieu-truong
source_type: article
review_status: draft
---

Thiếu gần hết trường người phải khai.
`)
  ok(r.ma === 200 && r.json?.vao_kho === false,
     `bài thiếu trường ⇒ vao_kho=false — được ${r.json?.vao_kho}`)
  ok(readdirSync(join(kho, "article")).length === soTruoc,
     "kho KHÔNG có thêm file nào")
  ok(existsSync(join(inbox, "thieu-truong.rejected.md")), "sinh file .rejected.md")
  ok(existsSync(join(inbox, "thieu-truong.md")),
     "bản gốc CÒN NGUYÊN trong _inbox/ để người sửa rồi thả lại")
  const rj = readFileSync(join(inbox, "thieu-truong.rejected.md"), "utf8")
  ok(/THIẾU|SỬA/.test(rj), "file trả lại ghi rõ THIẾU gì và SỬA thế nào")

  console.log("\n6 · gate KHÔNG ghi đè bài đã có trong kho\n")

  // BUG THẬT đã đo trên kho thật: sửa một bài trên web rồi chạy gate thì sửa đó
  // biến mất. Đây là phép kiểm ở tầng HTTP cho đúng ca đó.
  const f = join(kho, "article", "bai-dat-cong.md")
  writeFileSync(f, readFileSync(f, "utf8")
    .replace(/^one_liner:.*$/m, "one_liner: SUA TREN WEB — phai con sau khi nap lai"), "utf8")
  const byteSua = readFileSync(f)

  r = await nop("nap-lai.md", banDat("bai-dat-cong", "src_datco1"))
  ok(r.json?.vao_kho === false,
     `nộp lại cùng slug ⇒ KHÔNG vào kho — vao_kho=${r.json?.vao_kho}`,
     String(r.json?.gate_ra ?? "").slice(0, 200))
  ok(readFileSync(f).equals(byteSua),
     "bản SỬA TRÊN WEB không đổi một byte",
     "gate ghi đè = mất sửa của người dùng, im lặng — bug thật đã xảy ra")
  ok(existsSync(join(inbox, "nap-lai.rejected.md")), "có file trả lại nói lý do")

  console.log("\n7 · GET /api/inbox — liệt kê đúng thứ đang chờ\n")

  r = await goi(CONG, "GET", "/api/inbox")
  ok(r.ma === 200 && Array.isArray(r.json?.files), `GET ⇒ 200 + mảng — được ${r.ma}`)
  // `.da-vao-kho.md` vẫn khớp `*.md` nên nó CÓ trong danh sách này — ghi ra để
  // người đọc test biết đó là hành vi đã biết, không phải chỗ sót.
  ok(r.json.files.includes("thieu-truong.md"),
     "bài đang chờ sửa có trong danh sách")
} finally {
  sv.dung()
  don()
  rmSync(inbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}

chot("luồng nạp: 4 cổng chặn, traversal chặn bằng cấu trúc, không ghi đè kho")
