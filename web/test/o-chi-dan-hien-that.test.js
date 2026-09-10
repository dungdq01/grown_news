/**
 * Ô CHỈ DẪN của người phải HIỆN THẬT trên màn.
 *
 * Chủ dự án hỏi 2026-09-07: *"check lại chức năng chưng cất — input đã có chỗ
 * cho user nhập prompt chưa?"*.
 *
 * ĐO ĐƯỢC, và câu trả lời là CHƯA:
 *
 *     :8790/model      → tran_chi_dan_ky_tu: 500 · chi_dan_mau: 3 chip
 *     :8787/api/model  → {dong:[…]}          ← HAI TRƯỜNG KIA BIẾN MẤT
 *
 * `cuaModel` dựng lại phản hồi BẰNG TAY (`Object.fromEntries` theo `CHO_RA`)
 * và quên hai trường ấy. Còn `veOChiDan(j)` mở đầu bằng
 * `if (!tran) return ""` — *"cửa cũ chưa trả trần ⇒ KHÔNG dựng ô nửa vời"*.
 *
 * ⇒ Ô chỉ dẫn của `T12-25` **chưa bao giờ hiện** trên màn. Tính năng có thật ở
 * thợ, có thật trong mã FE, và vô hình với người dùng vì một cửa proxy chép
 * thiếu hai dòng.
 *
 * Loại lỗi này không tự lộ: không ai thấy lỗi, chỉ thấy *"chỗ nhập đâu?"*.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}
const doc = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const cua = boCT(doc("../api/tho-cua.mjs"))
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))

console.log("\nô chỉ dẫn hiện thật\n")

// ── 1 · cửa proxy CHỞ ĐỦ hai trường của `T12-25` ─────────────────────
{
  const i = cua.indexOf("export async function cuaModel")
  const than = i > 0 ? cua.slice(i, i + 1400) : ""
  ok(/tran_chi_dan_ky_tu/.test(than),
    "1 · `cuaModel` chở `tran_chi_dan_ky_tu`",
    "`veOChiDan` trả rỗng khi thiếu trần — nên ô nhập biến mất, im lặng")
  ok(/chi_dan_mau/.test(than),
    "1b · và chở `chi_dan_mau` (chip gợi ý)",
    "chip DẪN XUẤT từ bảng khai — `T12-25 AC4` khoá đúng tính chất ấy; cắt "
    + "chúng ở proxy là vô hiệu hoá một AC đã xanh")
}

// ── 2 · MỘT đường, không hai ─────────────────────────────────────────
//
// Vế này TRƯỚC ĐÂY hỏi *"đường MỚI cũng đủ chất chưa"*, và nó XANH SUỐT trong
// lúc đường mới rõ ràng nghèo hơn: nó khớp `/chi_dan_mau|goiY|chip/`, mà chuỗi
// `goiY` của `hoiChiDan` có mặt — cổng đo *"có chữ gợi ý ở đâu đó"* thay vì đo
// *"hai đường cùng một phiếu"*. Chủ dự án bắt bằng mắt, không bằng cổng:
// *"sao nút chưng cất tài liệu và video khác nhau vậy"*.
//
// Bất biến ĐÚNG rẻ hơn và mạnh hơn: **chỉ có MỘT phiếu.** Hai đường cùng chất
// là thứ phải canh mãi; một đường thì không có gì lệch được.
ok(!/function hoiChiDan/.test(tab),
  "2 · KHÔNG còn phiếu thứ hai (`hoiChiDan` đã xoá)",
  "hai phiếu cho một việc ⇒ người gặp phiếu nào là do may rủi")
{
  const i = tab.indexOf("async function moPhieuChungCat")
  const than = i > 0 ? tab.slice(i, i + 3000) : ""
  ok(i > 0, "2b · phiếu duy nhất là `moPhieuChungCat`")
  ok(/veOChiDan/.test(than) && /ganOChiDan/.test(than),
    "2c · và nó dùng `veOChiDan`/`ganOChiDan` — chip + trần ký tự",
    "chất lượng nằm ở MỘT chỗ, nên không có bản thứ hai để lạc hậu")
}
// Chi tiết đủ-chất của phiếu ấy do `mot-phieu-chung-cat.test.js` canh — cổng
// này chỉ giữ vế *"cửa proxy chở đủ hai trường"* và vế *"một đường"*.

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · ô chỉ dẫn hiện thật, và chỉ có MỘT phiếu")
process.exit(loi ? 1 : 0)
