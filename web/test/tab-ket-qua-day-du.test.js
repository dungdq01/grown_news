#!/usr/bin/env node
/**
 * WO-090 · T03-143 — Tab `Kết quả`: "tất cả" phải là TẤT CẢ.
 *
 * Ảnh chụp chủ dự án 2026-09-10: chip `tất cả` hiện **3**, chip `đã bỏ` hiện
 * **0** — trong khi DB có **8** bản (`da_bo 5 · nhap 2 · da_duyet 1`).
 *
 * ── Cửa KHÔNG sai ──────────────────────────────────────────────────────────
 * `loiLietKeNhap` mặc định `WHERE trang_thai <> 'da_bo'`, và đó là CỐ Ý
 * (`T08-29`/`FR-057`): danh sách ấy là HÀNG ĐỢI VIỆC của `T03-94`, một bản đã
 * bỏ không còn là việc. Sai là tab `Kết quả` mượn hàng-đợi-việc rồi dán nhãn
 * *"tất cả"*, và lọc client trên một tập đã bị server lọc — nên chip `đã bỏ`
 * không bao giờ có gì để lọc.
 *
 * ── Vì sao vế 1b nặng ngang vế 1a ──────────────────────────────────────────
 * Cách sửa DỄ là đổi mặc định của cửa. Làm thế thì hàng đợi việc bỗng cõng bản
 * đã bỏ — tức chữa một màn bằng cách phá một màn khác, và cái phá ấy không ai
 * thấy ngay. Nên vế 1b khoá lại: KHÔNG cờ ⇒ hành vi y như cũ.
 */
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => new URL(p, import.meta.url)

console.log("\nWO-090 · tab Kết quả — 'tất cả' phải là tất cả\n")

// ── Fixture: DB nháp Ở THƯ MỤC TẠM, không đụng `_loi.sqlite` thật ────────
const tam = mkdtempSync(join(tmpdir(), "gn-kq-"))
process.env.LOI_DB = join(tam, "_loi.sqlite")

const { loiLietKeNhap, dungLoiDb } = await import("../api/dungchung.mjs")

/* Đúng phân bố đo được trên DB thật của chủ dự án: 5 bỏ · 2 nháp · 1 duyệt. */
const GIEO = [
  ["j1", "da_bo"], ["j2", "da_bo"], ["j3", "da_bo"], ["j4", "da_bo"],
  ["j5", "da_bo"], ["j6", "nhap"], ["j7", "nhap"], ["j8", "da_duyet"],
]
let dungFx = true
try {
  dungLoiDb((db) => {
    for (const [u, tt] of GIEO) {
      db.prepare(
        "INSERT INTO nhap_chung_cat (job_ulid, ban_goc_ai, ban_hien_tai, trang_thai)"
        + " VALUES (?,?,?,?)").run(u, "---\nslug: x\n---\n", "---\nslug: x\n---\n", tt)
    }
  })
} catch (e) {
  dungFx = false
  ok(false, "0 · gieo được 8 bản nháp vào DB tạm", String(e).slice(0, 140))
}

// ── 1 · Cửa: cờ tường minh, mặc định KHÔNG đổi ───────────────────────────
console.log("1 · Cửa nhận cờ, và mặc định giữ nguyên\n")

if (dungFx) {
  const mac = loiLietKeNhap({ n: 200 })
  ok((mac.dong ?? []).length === 3,
    `1 · KHÔNG cờ ⇒ vẫn 3 (được ${(mac.dong ?? []).length})`,
    "mặc định đang bảo vệ HÀNG ĐỢI VIỆC của `T03-94` — đổi nó là chữa một màn "
    + "bằng cách phá một màn khác")

  const day = loiLietKeNhap({ n: 200, gom_da_bo: true })
  ok((day.dong ?? []).length === 8,
    `1a · CÓ cờ \`gom_da_bo\` ⇒ đủ 8 (được ${(day.dong ?? []).length})`,
    "đây là thứ tab `Kết quả` cần: nó là LỊCH SỬ, không phải hàng đợi")

  ok((mac.dong ?? []).every((v) => v.trang_thai !== "da_bo"),
    "1b · và bản mặc định VẪN KHÔNG cõng `da_bo`",
    "sửa quá tay ở đây thì hàng đợi việc bỗng đầy bản đã bỏ, và không ai thấy ngay")

  // `tong` phải đếm CÙNG tập với `dong` — `dungchung.mjs` đã ghi đúng bẫy này.
  ok(Number(mac.tong) === 3 && Number(day.tong) === 8,
    `1c · \`tong\` khớp \`dong\` ở CẢ HAI chế độ (được ${mac.tong} / ${day.tong})`,
    "hai câu lệnh đếm hai tập khác nhau là cách một badge nói dối")

  const bo = loiLietKeNhap({ n: 200, trang_thai: "da_bo" })
  ok((bo.dong ?? []).length === 5,
    `1d · lọc tường minh \`da_bo\` vẫn ra 5 (được ${(bo.dong ?? []).length})`,
    "cờ mới không được làm hỏng đường lọc đã có")
}

// ── 2 · FE: tab Kết quả xin tập ĐẦY ĐỦ ───────────────────────────────────
console.log("\n2 · Tab Kết quả gọi kèm cờ, và đếm trên tập đầy đủ\n")
{
  const { readFileSync } = await import("node:fs")
  const CC = readFileSync(doc("../plugins/chungcat/src/chungcat.inline.js"), "utf8")
  const ma = CC.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

  /*
   * Đo TRONG THÂN `ccNapNhap`, không đo cả chunk: `nhapNap` (danh sách nháp
   * trong CỬA SỔ) cũng gọi cùng đường và nó là một mặt khác — cấm chuỗi ấy ở
   * mọi nơi là bắt một hàm không liên quan đổi theo.
   */
  const iN = ma.indexOf("async function ccNapNhap")
  const fN = iN > 0 ? ma.slice(iN, iN + 1500) : ""
  ok(/nhap-chung-cat\?[^"']*gom_da_bo/.test(fN),
    "2 · tab `Kết quả` gọi kèm `gom_da_bo`",
    "không kèm ⇒ chip `đã bỏ` lọc trên một tập không có `da_bo` nào, và nó ra "
    + "0 vĩnh viễn")
  ok(!/nhap-chung-cat\?n=50/.test(fN),
    "2a · và KHÔNG còn lời gọi trần `?n=50` trong tab này",
    "đó là chính lời gọi đang nói dối")

  /*
   * Tab `Kết quả` của `/chung-cat/` là `ccNapNhap` — không phải `nhapNap`,
   * vốn là danh sách nháp trong CỬA SỔ. Bốn ô số ở đây ĐÃ đếm trên `CC_NHAP`
   * đầy đủ chứ không trên tập đã lọc chip; vế này khoá lại điều đang ĐÚNG để
   * bản sửa không làm hỏng nó.
   */
  const i = ma.indexOf("async function ccNapNhap")
  const f = i > 0 ? ma.slice(i, i + 1500) : ""
  ok(f !== "", "2b-0 · tìm thấy `ccNapNhap`")
  ok(/for \(const v of CC_NHAP\)/.test(f),
    "2b · bốn ô số đếm trên TẬP ĐẦY ĐỦ (`CC_NHAP`), không trên `hien` đã lọc",
    "đếm sau khi lọc thì bấm một chip là bốn con số đổi theo — chúng hết là "
    + "tổng kết")
}

// ── 3 · Vẽ theo SCR-26, nhưng KHÔNG gộp về bản cuối ──────────────────────
console.log("\n3 · Ngôn ngữ SCR-26, và đây là LỊCH SỬ\n")
{
  const { readFileSync } = await import("node:fs")
  const CC = readFileSync(doc("../plugins/chungcat/src/chungcat.inline.js"), "utf8")
  const i = CC.indexOf("async function ccNapNhap")
  const f = i > 0 ? CC.slice(i, CC.indexOf("\n}", i)) : ""
  ok(f !== "", "3 · tìm thấy bộ vẽ tab `Kết quả`")
  ok(/ccNhom|cc-bai|cc-ngay/.test(f),
    "3a · dùng lại bộ hình đã duyệt (`SCR-26`), không phát minh bộ thứ hai",
    "hai ngôn ngữ hình cho hai tab của cùng một màn là hai thứ người phải học")
  ok(!/ccBanCuoi/.test(f),
    "3b · KHÔNG gọi `ccBanCuoi` — đây là LỊCH SỬ",
    "gộp về bản cuối ở đây là giấu đúng thứ tab này sinh ra để hiện")
}

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — 'tất cả' là tất cả, mặc định không đổi, lịch sử không bị gộp\n")
