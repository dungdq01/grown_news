/**
 * NHẬT KÝ VẬN HÀNH của LÕI — cùng định dạng JSONL với `chungcat/src/nhat_ky.py`.
 *
 * Chỉ đạo 2026-09-05: *"bật logging để đo timeout, workload và debug"*.
 *
 * VÌ SAO CÙNG ĐỊNH DẠNG, KHÔNG PHẢI ĐỊNH DẠNG RIÊNG CỦA JS
 * Một lời gọi đi `trình duyệt → LÕI → THỢ`. Muốn biết 3 giây nằm ở khúc nào
 * thì phải xếp hai bên cạnh nhau theo thời gian, và hai định dạng khác nhau
 * nghĩa là phải viết bản chuyển đổi — rồi bản chuyển đổi lệch. Cùng `t` ·
 * `loai` · `pid` · `ms` thì `xem_nhat_ky.py` đọc cả hai mà không biết bên nào
 * viết bằng ngôn ngữ gì.
 *
 * VÌ SAO Ở `web/`, KHÔNG Ở `web/api/`
 * `api-guard` cấm MỌI handler cầm đường ghi (`writeFileSync`, `mkdirSync`, …):
 * một handler ghi được là một handler biến thành mồi ghi-tuỳ-ý. Luật đó đúng,
 * và module này thì **phải** ghi — nên chỗ đúng của nó là ngoài thư mục
 * handler. Nó không phục vụ request nào; nó là hạ tầng.
 *
 * Không phải lách cổng: `web/api/**` vẫn 0 đường ghi, và tên file cố định +
 * `JSON.stringify` (thoát mọi ký tự xuống dòng) làm nội dung request không
 * chèn được dòng giả vào nhật ký.
 *
 * KHÔNG khoá vào nhật ký (`ADR-06`) — `lot()` chặn theo tên trường VÀ theo
 * hình dạng giá trị, vì khoá đi lẫn trong một object lồng.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..", "..")

/** `GN_LOG_DIR` thắng — CÙNG biến với phía Python, một phép phân giải. */
const DIR = process.env.GN_LOG_DIR || join(GOC, "log")

const TEN_MAT = /khoa|key|token|secret|auth|password|matkhau|bearer|cookie/i
const HINH_MAT = /(sk-[A-Za-z0-9_-]{6,}|Bearer\s+\S+|AIza[A-Za-z0-9_-]{10,})/g
const MAT = "<đã-lột>"

function lot(v) {
  if (Array.isArray(v)) return v.map(lot)
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v)
      .map(([k, x]) => [k, TEN_MAT.test(k) ? MAT : lot(x)]))
  }
  if (typeof v === "string") return v.replace(HINH_MAT, MAT)
  return v
}

let daTao = false

/**
 * Mốc thời gian GIỜ ĐỊA PHƯƠNG kèm độ lệch — `2026-09-05T01:58:20+0700`.
 *
 * Phải khớp `time.strftime("%Y-%m-%dT%H:%M:%S%z")` của phía Python. Bản đầu
 * dùng `toISOString()` nên nó ghi `+0000` (UTC) trong khi worker ghi `+0700`,
 * và đo được ngay: hai file cạnh nhau lệch **7 giờ** cho cùng một khoảnh khắc.
 *
 * Đó đúng là thứ định dạng dùng chung sinh ra để tránh — xếp hai bên theo thời
 * gian để biết 3 giây nằm ở khúc nào — nên nó là một lỗi, không phải một chi
 * tiết hiển thị. `xem_nhat_ky.py` parse 19 ký tự đầu và BỎ độ lệch, nên hai
 * quy ước làm nó xếp sai thứ tự mà không báo gì.
 */
function moc() {
  const d = new Date()
  const p = (n, r = 2) => String(Math.abs(n)).padStart(r, "0")
  const lech = -d.getTimezoneOffset()      // JS trả ngược dấu so với thường lệ
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    + `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    + `${lech < 0 ? "-" : "+"}${p(Math.floor(Math.abs(lech) / 60))}${p(lech % 60)}`
}

/**
 * Một dòng nhật ký. KHÔNG NÉM — nhật ký hỏng không được giết một request.
 *
 * `appendFileSync` chứ không `createWriteStream`: một stream giữ trạng thái
 * qua các lần gọi và phải đóng đúng lúc, còn `append` đồng bộ ở đây là một lần
 * ghi ~200 byte vào cache của OS. Đo trước khi chọn: nó không hiện trong `ms`
 * của bất kỳ đường nào.
 */
export function ghi(loai, truong = {}) {
  try {
    if (!daTao) { mkdirSync(DIR, { recursive: true }); daTao = true }
    const d = { t: moc(), loai, pid: process.pid, ...lot(truong) }
    appendFileSync(join(DIR, `${loai}.jsonl`), JSON.stringify(d) + "\n")
  } catch { /* đĩa đầy không được làm sập server */ }
}

/**
 * Bọc một handler để đo. `han_ms` là ngưỡng cho `qua_han` có nghĩa: không có
 * ngưỡng khai trước thì một con số `ms` chỉ là một con số, và không ai nói
 * được nó chậm hay không.
 */
export function doThoiGian(loai, han_ms, xuLy) {
  return async (req, res) => {
    const t0 = process.hrtime.bigint()
    let loi = null
    try {
      return await xuLy(req, res)
    } catch (e) {
      loi = String(e?.message ?? e)
      throw e
    } finally {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6
      ghi(loai, {
        method: req.method,
        // Bỏ query: `?job=<ulid>` làm mỗi lời gọi một nhóm riêng, và phân vị
        // của một mẫu là chính nó.
        duong: String(req.url ?? "").split("?")[0],
        ma: res.statusCode, ms: Math.round(ms * 10) / 10,
        han_ms, qua_han: ms > han_ms,
        ...(loi ? { loi } : {}),
      })
    }
  }
}


/**
 * Ghi FILE PID của tiến trình này — `chay.sh` đọc để dừng đúng nó lần sau.
 *
 * `process.pid` chứ không `$!` của shell: `$!` trong Git Bash là PID của JOB
 * bash (MSYS), không phải PID Windows của `node.exe`, nên `taskkill` theo nó
 * không giết gì — và một lệnh dọn im lặng không dọn là cách sáu bản dịch vụ
 * cùng sống mà `netstat` chỉ hiện một.
 */
export function ghiPid(ten) {
  try {
    if (!daTao) { mkdirSync(DIR, { recursive: true }); daTao = true }
    writeFileSync(join(DIR, `${ten}.pid`), String(process.pid))
  } catch { /* không có PID thì lần sau dọn theo cổng — không đáng để chết */ }
}
