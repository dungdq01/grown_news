#!/usr/bin/env node
/**
 * WO-087 · T03-140 — Chỉ cửa sổ BÀI KHO mới có bộ nút phán quyết.
 *
 * Chủ dự án 2026-09-10, ảnh chụp: hộp *"Loại bài"* mở trên cửa sổ **Transcript**,
 * bấm xong nhận **"Không đọc được bài từ API."**
 *
 * `tai()` là đường của bài trong kho — nó `fetch /api/articles/<loai>/<slug>`
 * rồi phát *Đưa lên site · Sửa · Loại · Bỏ khỏi kho*. Transcript không phải
 * một hàng trong kho, nên cửa ấy trả 404 và bốn nút chết.
 *
 * ── Vì sao vế 2 là vế QUAN TRỌNG NHẤT ───────────────────────────────────────
 * `T03-113` đã sửa đúng lớp lỗi này rồi — cho `kieu:"nhap"` — nhưng viết guard
 * thành `kieu !== "nhap"`, một danh sách LOẠI TRỪ có đúng một phần tử. `T03-122`
 * thêm `kieu:"transcript"` và ca mới lọt thẳng qua.
 *
 * Nên vế 2 không đo "transcript đã được chặn chưa". Nó đo **hình dạng của
 * guard**: một `kieu` CHƯA TỒN TẠI cũng phải bị chặn. Đo ca hiện tại thì lần
 * thứ ba lại hỏng y hệt, và cổng vẫn xanh suốt.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  <- ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const MW = doc("../plugins/multiwindow/src/scripts/multiwindow.inline.js")

function tach(src, ten) {
  const i = src.indexOf("function " + ten + "(")
  if (i < 0) return null
  const j = src.indexOf("{", i)
  let sau = 0
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") sau++
    else if (src[k] === "}" && --sau === 0) return src.slice(i, k + 1)
  }
  return null
}

console.log("\nWO-087 · chỉ cửa sổ bài kho mới có nút phán quyết\n")

// ── 1 · Guard là DANH SÁCH CHO PHÉP ─────────────────────────────────────
console.log("1 · Guard cho phép, không loại trừ\n")

const mo = tach(MW, "mo") ?? ""
ok(mo !== "", "1 · tìm thấy `mo()`")
ok(!/kieu\s*!==\s*"nhap"/.test(mo),
  "1a · KHÔNG còn `kieu !== \"nhap\"`",
  "một danh sách loại trừ có một phần tử: ca thứ hai (`transcript`) đã lọt, "
  + "và ca thứ ba sẽ lọt y hệt")

// ── 2 · CA CHƯA TỒN TẠI cũng phải bị chặn ───────────────────────────────
console.log("\n2 · Một `kieu` MỚI cũng phải bị chặn (fail-closed)\n")
{
  /*
   * Chạy thật cái điều kiện, không đọc chữ. Trích biểu thức trong `if (…)`
   * ngay trước `tai(id, 0)` rồi thử nó với bốn `tuyChon` khác nhau — kể cả
   * một `kieu` chưa ai viết ra.
   */
  const i = mo.indexOf("tai(id, 0)")
  const truoc = i > 0 ? mo.slice(Math.max(0, i - 220), i) : ""
  const m = /if\s*\(([^)]*(?:\([^)]*\))?[^)]*)\)\s*(?:void\s*)?$/.exec(truoc.trimEnd())
  ok(!!m, "2 · trích được điều kiện gác `tai()`",
    `không thấy trong: ${JSON.stringify(truoc.slice(-90))}`)
  if (m) {
    let f = null
    try { f = new Function("tuyChon", `return !!(${m[1]})`) } catch (e) {
      ok(false, "2a · điều kiện chạy được", String(e).slice(0, 90))
    }
    if (f) {
      const ca = [
        ["bài kho (không `kieu`)", undefined, true],
        ["bài kho (`{}`)", {}, true],
        ["nháp", { kieu: "nhap" }, false],
        ["transcript", { kieu: "transcript" }, false],
        ["một `kieu` CHƯA TỒN TẠI", { kieu: "so-sanh-hai-ban" }, false],
      ]
      for (const [ten, tc, mong] of ca) {
        let duoc = null
        try { duoc = f(tc) } catch { duoc = "ném" }
        ok(duoc === mong,
          `2 · ${ten} ⇒ ${mong ? "GỌI" : "không gọi"} \`tai()\` (được ${duoc})`,
          mong
            ? "bài kho mất `tai()` là mất cả thân bài lẫn bộ nút"
            : "gọi `tai()` cho thứ không nằm trong kho ⇒ 404 và bốn nút chết")
      }
    }
  }
}

// ── 3 · `veBienTap` không phát nút phán quyết cho cửa sổ khác ───────────
console.log("\n3 · Nút phán quyết chỉ có ở cửa sổ bài kho\n")
{
  const vb = tach(MW, "veBienTap") ?? ""
  ok(vb !== "", "3 · tìm thấy `veBienTap`")
  ok(/data-act="loai"/.test(vb) && /data-act="xoa"/.test(vb),
    "3a · nó vẫn là nơi phát `loai` + `xoa` (chưa dời đi đâu)")
  // Nó chỉ được gọi từ đường bài kho. Đếm chỗ gọi: `tai()` và hai chỗ sau
  // phán quyết — KHÔNG được có chỗ gọi nào từ đường transcript/nháp.
  const goi = (MW.match(/veBienTap\(/g) ?? []).length - 1   // trừ chính def
  ok(goi >= 1, `3b · có ${goi} chỗ gọi \`veBienTap\``)
  const tr = tach(MW, "moCuaSoTranscript") ?? ""
  ok(!/veBienTap\(/.test(tr),
    "3c · đường transcript KHÔNG tự gọi `veBienTap`",
    "gọi thẳng ở đó là dựng lại đúng bug này bằng một đường khác")
}

// ── 4 · Chống sửa quá tay: bài kho vẫn đủ nút ───────────────────────────
console.log("\n4 · Bài kho KHÔNG được mất gì\n")
{
  const vb = tach(MW, "veBienTap") ?? ""
  for (const k of ["dang", "sua", "loai", "xoa"]) {
    ok(new RegExp(`data-act="${k}"`).test(vb), `4 · bài kho vẫn có \`${k}\``,
      "chặn nhầm cả bài kho là chữa bệnh bằng cách bỏ đói bệnh nhân")
  }
}

if (loi) { console.log(`\n${loi} lỗi\n`); process.exit(1) }
console.log("\nĐủ vế — chỉ bài kho gọi `tai()`, `kieu` lạ bị chặn theo chiều an toàn\n")
