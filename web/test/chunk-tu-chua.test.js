/**
 * WO-059 · CHUNK PHẢI TỰ CHỨA — không gọi hàm của `gn.js`.
 *
 * Bug chủ dự án bắt 2026-09-06: bấm "Ghi vào kho" ở `/video/nap/` không có gì
 * xảy ra. Console: `ReferenceError: nhanCua is not defined`.
 *
 * Cơ chế: mỗi chunk bọc IIFE riêng (`assets.mjs`: *"chunk phải TỰ CHỨA"*), nên
 * một hàm khai trong `gn.js` KHÔNG nhìn thấy được từ chunk. `napvideo` gọi
 * `nhanCua()` — hàm sống ở `multiwindow.inline.ts` — nên nó ném ngay lần bấm
 * ĐẦU TIÊN của người dùng.
 *
 * Vì sao không cổng nào bắt: mọi cổng đo VĂN BẢN MÃ. `nhanCua("vd","cat")` có
 * mặt trong nguồn, trông đúng, và chỉ nổ khi CHẠY. `plugins/WORKLOG.md` đã ghi
 * đúng bài học này một lần — *"suite 2796 phép đo XANH trong khi chunk ném
 * ReferenceError ngay lần gõ URL đầu tiên"* — nhưng chưa ai dựng cổng cho nó.
 * Đây là cổng đó.
 */
import { napRender } from "./_render.mjs"

let loi = 0
const ok = (d, cau, vs = "") => {
  console.log(`  ${d ? "ok  " : "FAIL"} ${cau}${!d && vs ? `  ${vs}` : ""}`)
  if (!d) loi++
}

const m = await napRender()
console.log("\nWO-059 · chunk tự chứa\n")

/*
 * Chạy chunk trong một hộp cát KHÔNG có `gn.js`, rồi hỏi V8 xem nó tham chiếu
 * định danh tự do nào. Đó là phép đo THẬT — khác hẳn việc grep tên hàm.
 */
for (const ten of m.tenChunk()) {
  const ma = m.gnChunk(ten)
  if (!ma) continue
  let tuDo = []
  try {
    // `new Function` biên dịch mà không chạy: lỗi cú pháp lộ ngay, còn định
    // danh tự do thì lấy bằng cách dò từng cái dưới đây.
    new Function(ma)
  } catch (e) {
    ok(false, `chunk \`${ten}\` biên dịch được`, String(e.message).slice(0, 90))
    continue
  }
  // Tên hàm chunk gọi mà chính nó không khai.
  // KHONG tinh loi goi PHUONG THUC (`x.map(`): chung thuoc doi tuong ben
  // trai, khong phai mot dinh danh tu do.
  // BO CHUOI + TEMPLATE truoc khi quet. CSS/HTML nhung song trong template
  // literal, va `var(` `calc(` `translate(` o do la CU PHAP CSS — dem chung
  // la no la ham JS thi cong bao mot danh sach dai toan nhieu, ma nhieu thi
  // nguoi doc bo qua ca dong that nam giua.
  const sach = ma.replace(/`(?:\\[^]|[^\`\\])*`|"(?:\\[^]|[^"\\])*"|'(?:\\[^]|[^'\\])*'/g, '""')
  const goi = new Set([...sach.matchAll(/(^|[^.\w$])([a-zA-Z_$][\w$]*)\s*\(/g)].map((x) => x[2]))
  const khai = new Set([
    ...[...ma.matchAll(/\bfunction\s+([a-zA-Z_$][\w$]*)/g)].map((x) => x[1]),
    ...[...sach.matchAll(/\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=/g)].map((x) => x[1]),
    // Ten lay bang DESTRUCTURING cung la khai: `const { mo, bao } = mw()`.
    // Thieu ve nay thi cong to oan `cctab`, von lay ham qua cau `__GN_MW__`
    // DUNG cach — va mot cong to oan thi nguoi ta thoi doc no.
    ...[...sach.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)]
      .flatMap((x) => x[1].split(",").map((t) => t.split(":").pop().trim())),
  ])
  // Tên của trình duyệt/ngôn ngữ — không phải nợ của chunk.
  const SAN = new Set(["if", "for", "while", "switch", "catch", "return", "typeof",
    "await", "function", "fetch", "Number", "String", "Boolean", "Array", "Object",
    "JSON", "Math", "Date", "Set", "Map", "Promise", "Error", "RegExp", "parseInt",
    "parseFloat", "isNaN", "setTimeout", "setInterval", "clearInterval",
    "clearTimeout", "encodeURIComponent", "decodeURIComponent", "queueMicrotask",
    "requestAnimationFrame", "structuredClone", "FormData", "Event", "CustomEvent",
    "IntersectionObserver", "MutationObserver", "AbortController", "URL", "Blob",
    "File", "FileReader", "TextDecoder", "TextEncoder", "console", "alert", "atob",
    "btoa", "crypto", "document", "window", "globalThis", "navigator", "history",
    "location", "localStorage", "sessionStorage", "Intl", "Symbol", "BigInt",
    "Proxy", "Reflect", "WeakMap", "WeakSet", "Uint8Array", "ArrayBuffer",
    "DataView", "Function", "eval", "super", "this", "new", "do", "else", "in",
    "of", "delete", "void", "yield", "import", "class", "extends", "try"])
  tuDo = [...goi].filter((g) => !khai.has(g) && !SAN.has(g)
    && !/^[A-Z_]+$/.test(g)
    // `u1EDA…` la manh cua mot escape `\uXXXX` con sot sau khi bo chuoi —
    // no chua bao gio la mot ten ham.
    && !/^u[0-9A-Fa-f]{4}/.test(g) && !(g in globalThis))
  ok(tuDo.length === 0, `chunk \`${ten}\` không gọi hàm nào của \`gn.js\``,
    `thiếu: ${tuDo.join(" · ")} — chunk bọc IIFE riêng nên nó ném ngay lần bấm đầu`)
}

console.log(loi ? `\nĐỎ — ${loi} vế` : "\npass · mỗi chunk tự chứa, 0 tham chiếu ra ngoài")
process.exit(loi ? 1 : 0)
