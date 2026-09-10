#!/usr/bin/env node
/**
 * CẢNH BÁO không được chặn ghi — nhưng LỖI thì phải chặn.
 *
 * BUG THẬT, người dùng gặp ở bài kb/ đầu tiên: bấm Duyệt, không có gì xảy ra.
 * API trả 422 với nội dung `1 file · 0 lỗi · 1 cảnh báo`.
 *
 * Gốc: `validate.py:339` — `sys.exit(1 if n_err or (a.strict and n_warn) else 0)`.
 * `--strict` exit 1 cả khi CHỈ có cảnh báo. Đúng cho CI chấm cả kho, sai cho API
 * chặn một lần ghi. Bài dùng `concepts_proposed` — đúng như `kb/concepts.yaml:3`
 * chỉ định — nên KHÔNG BÀI NÀO đề xuất khái niệm mới duyệt được qua web.
 *
 * Sửa: `coLoiThat()` đọc số LỖI trong output thay vì tin exit code. M08-R2 vẫn
 * nguyên — `--strict` VẪN chạy, chỉ khác chỗ đọc kết quả.
 *
 * Test này canh HAI chiều, vì nới cổng dễ nới quá tay:
 *   cảnh báo  ⇒ ghi ĐƯỢC
 *   lỗi       ⇒ vẫn 422, kho KHÔNG đổi
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { banGhi, batServer, dungKho, goi, napLaiDb, taoKiem } from "./_api.mjs"
import { CAN_LOCATOR } from "./_khung.mjs"

const { kho, rac, don } = dungKho("gn-api-canhbao")
const sv = await batServer({ kho, rac })
const CONG = sv.cong
const { ok, chot } = taoKiem()

try {
  console.log("\n1 · Logic đọc kết quả — chặn theo LỖI, không theo exit code\n")

  const dc = readFileSync(join(import.meta.dirname, "..", "api", "dungchung.mjs"), "utf8")
  ok(/function coLoiThat/.test(dc), "có hàm phân biệt lỗi với cảnh báo")
  ok(/\d\+\)\s\+lỗi/.test(dc) || /lỗi/.test(dc), "đọc số lỗi từ output validate")
  ok(!/if \(kq\.ma !== 0\) return \{ ok: false/.test(dc),
    "đường ghi bài KHÔNG còn chặn theo exit code")
  // M08-R2 đòi --strict VẪN chạy. Nới cổng không được biến thành bỏ cổng.
  ok(/"--strict"/.test(dc), "--strict vẫn được truyền (M08-R2)")
  ok(/ma < 0.*true|if \(ma < 0\) return true/s.test(dc),
    "spawn chết ⇒ coi như lỗi, không cho qua")

  console.log("\n2 · CẢNH BÁO (concepts_proposed) ⇒ duyệt ĐƯỢC\n")

  // Bản ghi có concepts_proposed: validate in "0 lỗi · 1 cảnh báo", exit 1.
  writeFileSync(join(kho, "article", "co-de-xuat.md"),
    banGhi({
      id: "src_dx0009", slug: "co-de-xuat", status: "draft", origin: "pipeline",
      them: { concepts_proposed: ["mot-khai-niem-moi"] },
    }), "utf8")
  napLaiDb(kho, rac)   // FR-034: gieo file thì phải nạp DB — server đọc DB

  let g = await goi(CONG, "GET", "/api/articles/article/co-de-xuat")
  ok(g.ma === 200, `đọc được bản ghi có concepts_proposed — được ${g.ma}`)

  let r = await goi(CONG, "PATCH", "/api/articles/article/co-de-xuat/status", {
    headers: { "If-Match": g.json.etag },
    body: { to: "approved", insight_new: true, skill_installed: false, review_minutes: 9 },
  })
  ok(r.ma === 200, `duyệt bài CÓ cảnh báo → 200 — được ${r.ma} ${JSON.stringify(r.json).slice(0, 140)}`,
    "cảnh báo không phải lý do chặn ghi")
  ok(/approved/.test(readFileSync(join(kho, "article", "co-de-xuat.md"), "utf8")),
    "file trong kho đã sang approved")

  console.log("\n3 · LỖI THẬT ⇒ vẫn 422, kho KHÔNG đổi\n")

  // Cắt từ mục con `### 3.2` trở đi ⇒ thiếu 3.2/3.3/3.4 và mất cả mục tinh túy
  // ⇒ vi phạm cổng "thiếu mục", cổng tinh túy, cổng locator ⇒ LỖI THẬT.
  // Mốc cắt đọc từ khung, không gõ tên mục vào test.
  const hong = join(kho, "article", "bai-hong.md")
  const catTu = new RegExp(`### ${CAN_LOCATOR[0].replace(".", "\\.")} [\\s\\S]*$`)
  writeFileSync(hong, banGhi({ id: "src_hong01", slug: "bai-hong", mo: "x" })
    .replace(catTu, "—\n"), "utf8")
  napLaiDb(kho, rac)   // FR-034: bản ghi hỏng vẫn vào DB được — validate là cổng GHI, không phải cổng nạp seed
  const truoc = readFileSync(hong, "utf8")

  g = await goi(CONG, "GET", "/api/articles/article/bai-hong")
  if (g.ma === 200) {
    r = await goi(CONG, "PATCH", "/api/articles/article/bai-hong/status", {
      headers: { "If-Match": g.json.etag },
      body: { to: "approved", insight_new: true, skill_installed: false, review_minutes: 3 },
    })
    ok(r.ma === 422, `bài có LỖI THẬT → 422 — được ${r.ma}`,
      "nới cổng cho cảnh báo KHÔNG được nới luôn cho lỗi")
    ok(readFileSync(hong, "utf8") === truoc, "bị chặn thì file không đổi một byte")
  } else {
    ok(false, `dựng được bản ghi hỏng để kiểm — GET trả ${g.ma}`)
  }
} finally {
  sv.dung()
  don()
}

chot("cảnh báo không chặn ghi, lỗi thì chặn")
