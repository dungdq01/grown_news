/*
 * loidb.mjs — BẢNG KHAI cho DB riêng của LÕI (ADR-06, FR-047 T08-11)
 *
 * File này KHÔNG cầm SQL. `api-guard.test.js` răng 2 đòi mọi `prepare(` /
 * `DatabaseSync` / `BEGIN IMMEDIATE` sống trong ĐÚNG MỘT file —
 * `dungchung.mjs` — và bản đầu của tôi đặt `DatabaseSync` ở đây nên cổng đỏ.
 *
 * Cổng đúng, mã tôi sai. Câu trả lời KHÔNG phải nới danh sách miễn trừ: bất
 * biến "SQL ở một chỗ" là thứ làm câu hỏi *ai ghi được vào đâu* trả lời được
 * bằng một lần đọc file. Một DB thứ hai không tự nó là lý do để có một cửa SQL
 * thứ hai — nếu ngày nào nó là, thì đó là một FR.
 *
 * ⇒ `dungLoiDb()` sống trong `dungchung.mjs`. Ở đây chỉ còn tên và đường dẫn.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = dirname(fileURLToPath(import.meta.url));
export const WEB_GOC = join(API, "..");

/** Schema của DB LÕI — `dungchung.mjs` đọc file này. */
export const LOI_SCHEMA = join(API, "loi.schema.sql");

/*
 * Override cùng khuôn KB_DIR / RECYCLE_DIR / PYTHON (FR-010, FR-034) — để test
 * trỏ sang thư mục tạm. Không có override thì mọi test dùng chung một DB thật,
 * và ca "hai request đồng thời" của M18-R1 sẽ ăn vào dữ liệu thật.
 *
 * Hàm chứ không phải hằng: test đặt `process.env` rồi mới import là chuyện
 * thường, và một hằng chốt lúc import sẽ im lặng dùng đường cũ.
 */
export function duongLoiDb() {
  return process.env.LOI_DB ?? join(WEB_GOC, "_loi.sqlite");
}

/** Năm bảng — nguồn cho cổng đếm, không gõ lại ở chỗ thứ hai. */
export const BANG_LOI = [
  "nguoi_dung",
  "ma_moi",
  "dinh_danh_kenh",
  "phien",
  "nhap_chung_cat",
];
