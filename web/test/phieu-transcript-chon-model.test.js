/**
 * Phiếu SINH TRANSCRIPT phải cho chọn model — và chỉ model NHẬN ĐƯỢC AUDIO.
 *
 * Chủ dự án 2026-09-08: *"tab sinh transcript cần design lại, hiện tại nó
 * không có input chọn model?"* — đúng: `moPhieuTranscript` chỉ có tiêu đề,
 * slug, một khối cảnh báo và hai nút.
 *
 * ── Vì sao LỌC `ho_tro_audio` là vế nặng nhất ────────────────────────────
 *
 * Đo trên bảng khai 2026-09-08: **22 / 100** dòng có `ho_tro_audio: true`.
 * Và cái bẫy nằm ngay ở model mặc định:
 *
 *     gemini-2.5-flash-lite         ho_tro_audio = FALSE
 *     google/gemini-2.5-flash-lite  ho_tro_audio = TRUE
 *
 * Hai dòng, tên gần như nhau, một dòng nhận audio một dòng không. Bày cả 100
 * dòng là mời người bấm vào 78 dòng sẽ chết — và chết theo kiểu tệ nhất:
 * `beeknoee-api-guide §2.5` khai cửa **BỎ QUA phần media ÂM THẦM**, tức lời
 * gọi vẫn trả về một thứ trông như bản phiên âm, bịa từ prompt.
 *
 * `asr_cua.phien_am` đã chặn ca ấy (`CuaKhongNhanAudio`), nhưng chặn SAU khi
 * người đã chọn là bắt họ mất một vòng. Bộ chọn không được bày thứ không dùng
 * được.
 *
 * ── Và cửa proxy phải CHỞ được cờ ấy ────────────────────────────────────
 *
 * Lần thứ BA cùng một lỗi trong dự án này: `tran_chi_dan_ky_tu` (2026-09-07),
 * `tran_payload_byte` (2026-09-07), nay `ho_tro_audio`. `cuaModel` dựng lại
 * phản hồi BẰNG TAY theo `CHO_RA`, nên mỗi trường mới là một dòng phải nhớ
 * thêm — và quên thì nó rơi ra IM LẶNG.
 */
import { readFileSync } from "node:fs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `\n       ${vs}` : ""}`)
  if (!d) loi++
}
const CR = String.fromCharCode(13)
const doc = (p) =>
  readFileSync(new URL(p, import.meta.url), "utf8").split(CR).join("")
const boCT = (t) => t.replace(/\/\*[^]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
const tab = boCT(doc("../plugins/cctab/src/cctab.inline.ts"))
const cua = boCT(doc("../api/tho-cua.mjs"))
const tho = boCT(doc("../../chungcat/src/api.py"))
const than = (src, ten, n = 2600) => {
  const i = src.indexOf(ten)
  if (i < 0) return ""
  const h = src.indexOf("\n}\n", i)
  return src.slice(i, h > 0 ? h : i + n)
}

console.log("\nphiếu transcript · chọn model nhận audio\n")

// ── 1 · cờ `ho_tro_audio` sống được qua CẢ HAI cửa ────────────────────
ok(/ho_tro_audio/.test(tho),
  "1 · cửa THỢ `/model` chở `ho_tro_audio`",
  "vắng nó thì FE không có gì để lọc, và bộ chọn bày 78 dòng sẽ chết")
ok(/ho_tro_audio/.test(cua),
  "1b · cửa PROXY `/api/model` cũng chở",
  "`cuaModel` dựng lại phản hồi BẰNG TAY theo `CHO_RA` — mỗi trường mới là "
  + "một dòng phải nhớ thêm, và quên thì nó rơi ra IM LẶNG (lần thứ ba)")

// ── 2 · phiếu có bộ chọn model, và nó LỌC ─────────────────────────────
{
  const t = than(tab, "async function moPhieuTranscript", 3200)
  ok(t.length > 0, "2 · tìm thấy `moPhieuTranscript`")
  ok(/data-f="model"|data-f=model/.test(t),
    "2b · phiếu có ô chọn model",
    "chủ dự án: *\"hiện tại nó không có input chọn model?\"*")
  ok(/ho_tro_audio/.test(t),
    "2c · và LỌC theo `ho_tro_audio`",
    "22/100 dòng nhận audio; `gemini-2.5-flash-lite` KHÔNG, còn "
    + "`google/gemini-2.5-flash-lite` CÓ — hai tên gần như nhau, một dòng chết")
  ok(/data-f="kv"|data-f=kv/.test(t),
    "2d · và hiện KHU VỰC của model đang chọn",
    "`spec §4.0c`: chọn model là chọn khu vực pháp lý, phải hiện")
}

// ── 3 · gửi đi ĐÚNG model người chọn ──────────────────────────────────
{
  const t = than(tab, "async function guiTranscript", 1800)
  ok(t.length > 0, "3 · tìm thấy `guiTranscript`")
  ok(/data-f=model|data-f="model"/.test(t),
    "3b · thân request đọc model từ ô chọn",
    "có ô chọn mà không gửi đi là một ô trang trí")
  ok(/sinh-transcript/.test(t), "3c · vẫn đúng `loai: sinh-transcript`")
}

// ── 4 · chống đỏ oan: cảnh báo egress KHÔNG được mất ──────────────────
{
  const t = than(tab, "async function moPhieuTranscript", 3200)
  ok(/RỜI KHỎI MÁY|rời khỏi máy/i.test(t) || /CANH_BAO_TR/.test(t),
    "4 · phiếu vẫn công bố audio RỜI KHỎI MÁY",
    "lối `cua-asr` gửi audio ra ngoài — `tieu_egress: true` trong bảng khai, "
    + "và người bấm phải biết trước cú bấm")
}

console.log()
if (loi) { console.log(`ĐỎ — ${loi} vế`); process.exit(1) }
console.log("pass · chọn được model, chỉ model nhận audio, và cờ sống qua hai cửa")
