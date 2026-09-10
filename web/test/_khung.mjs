#!/usr/bin/env node
/**
 * Khung thân bài cho phía Node — ĐỌC `core/assets/khung-than-bai.json`.
 *
 * Gương của `core/src/source_distiller/khung.py:than_mau()`. Hai bản cài đặt
 * là hai bản sẽ lệch, nên chúng đọc CÙNG một file khai và giữ CÙNG một luật:
 * mục nào khai `locator: true` mà chữ truyền vào không có `[...]` thì locator
 * mẫu được chèn thêm.
 *
 * Vì sao Node cần bản riêng thay vì gọi Python: `_seed.mjs` và `_api.mjs` chạy
 * đồng bộ trong tiến trình test; spawn Python cho mỗi thân bài là ~120ms × mọi
 * bản ghi seed của 40+ file test.
 *
 * Trước khi có file này, BỐN chỗ mỗi chỗ gõ một thân bài 9 mục riêng, và hai
 * trong bốn dùng một BỘ TÊN MỤC khác hẳn — cả hai vẫn qua cổng, vì cổng chỉ ép
 * SỐ mục chứ không đọc tên. Cổng canh việc đó bây giờ: `core/tests/check_khung.py`.
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const TEST = dirname(fileURLToPath(import.meta.url))
export const KHUNG_PATH = join(TEST, "..", "..", "core", "assets", "khung-than-bai.json")
export const KHUNG = JSON.parse(readFileSync(KHUNG_PATH, "utf8"))

const LOCATOR_MAU = "[nguon.md:1-2]"

/** Địa chỉ (`"3.2"`, `"4"`) của mọi mục đòi locator. */
export const CAN_LOCATOR = [
  ...KHUNG.muc.flatMap((m) => (m.con ?? []).filter((c) => c.locator).map((c) => c.so)),
  ...KHUNG.muc.filter((m) => m.locator).map((m) => String(m.so)),
]

/** Địa chỉ mục tinh túy, ví dụ `"3.4"` — suy bằng TÊN.
 *
 * WO-038 · cờ `tinh_tuy` đã bỏ khỏi bảng khai: mục này là ô văn xuôi như mọi
 * mục lá khác. Nhưng nó VẪN tồn tại và hai cổng vẫn cần địa chỉ của nó, nên suy
 * từ `ten`. Trả `undefined` nếu khung đổi tên — cổng dùng nó phải TỰ CHỐT,
 * đừng để `undefined` lặng lẽ đi tiếp thành một phép kiểm vô nghĩa.
 */
export const TINH_TUY_O = KHUNG.muc
  .flatMap((m) => m.con ?? []).find((c) => c.ten === "Tinh túy")?.so

/**
 * Thân bài tối thiểu đi qua mọi cổng hình dạng.
 * @param {Record<string,string>} noiDung {địa_chỉ: chữ} — vắng thì dùng `dai`.
 */
export function thanBaiKhung(noiDung = {}, dai = "—") {
  const chu = (dc) => {
    let t = String(noiDung[dc] ?? dai).trim() || dai
    if (CAN_LOCATOR.includes(dc) && !t.includes("[")) t += " " + LOCATOR_MAU
    return t
  }
  const khoi = []
  for (const m of KHUNG.muc) {
    khoi.push(`## ${m.so}. ${m.ten}`)
    const con = m.con ?? []
    if (!con.length) { khoi.push(chu(String(m.so))); continue }
    for (const c of con) {
      khoi.push(`### ${c.so} ${c.ten}`)
      // WO-038 · mục tinh túy KHÔNG còn nhánh riêng: một ô văn xuôi như mọi
      // mục lá khác. Giữ nhánh cũ là sinh ra thân bài theo hợp đồng đã bỏ.
      khoi.push(chu(c.so))
    }
  }
  return khoi.join("\n\n") + "\n"
}
