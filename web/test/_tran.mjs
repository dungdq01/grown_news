/**
 * TRẦN BYTE của hai bundle chung — MỘT nguồn cho MỌI cổng.
 *
 * Vì sao file này tồn tại, đo 2026-09-08 khi `FR-074` nới trần:
 *
 *     grep -l 102400 web/test/*.test.js   →  11 FILE
 *
 * Nới một trần làm **8 cổng đỏ cùng lúc**, và không cổng nào đỏ vì hệ sai —
 * chúng đỏ vì mỗi file giữ một bản sao của con số. Hôm 2026-09-07 tôi đã chẩn
 * đúng lớp lỗi này trong `page-weight.test.js` (`100 + 100` gõ cứng cạnh `102`
 * của `FR-068`) và chỉ vá TRONG file ấy. Mười bản sao còn lại vẫn nằm đó.
 *
 * Bài học, viết ra để không phải học lần thứ ba: **vá một bản sao không phải
 * vá lớp lỗi.** Khi một hằng số xuất hiện ở nơi thứ hai, việc cần làm là dựng
 * một nguồn — không phải đồng bộ hai chỗ.
 *
 * ⚠️ Cổng NÀO cũng phải `import` từ đây, không gõ lại. Một `102400` gõ tay
 * trong `web/test/**` là một bản sao thứ mười hai đang chờ.
 */

/**
 * Trần theo KB. `FR-061` → `FR-068` (css 100→102) → `FR-074` (css→104, js→102)
 * → `FR-061a` (js→103).
 *
 * BỐN lần nới liên tiếp. `FR-074 §3` đã ghi: nới trần mua thời gian, KHÔNG trả
 * nợ — câu đó vẫn đúng với lần thứ tư.
 *
 * `FR-061a §2` đã thi công thật bốn đường lấy lại byte cho `gn.js` và đo được
 * **cả bốn bằng 0** (bảng nhúng đã chiếu sạch · không hàm chết · chú thích đã
 * cắt · thụt đầu dòng đã bị `minifyWhitespace` bỏ từ `WO-057`). Nên lần này
 * không còn lối tối ưu nào để chọn thay.
 *
 * Nợ ĐÚNG không nằm ở đây, và `FR-061a §3` gọi đúng tên nó: dời `home-motion`
 * (6469 byte, chỉ Trang chủ dùng) vào chunk thì `gn.js` còn 98492 — nhưng HTML
 * Trang chủ dư **9 byte**, không đủ cho một thẻ `<script>` thứ hai (+48). Cửa
 * ra của bundle này bị khoá ở trần HTML Trang chủ, không ở chính nó.
 */
export const TRAN_KB = { css: 104, js: 103 }

/** Trần theo BYTE — thứ phần lớn cổng cần. */
export const TRAN = {
  css: TRAN_KB.css * 1024,
  js: TRAN_KB.js * 1024,
}

/**
 * `so > TRAN` chứ không `kb(so) > TRAN_KB`.
 *
 * Phép so theo KB làm tròn cho lọt tới **511 byte** quá trần — `nap-ba-khung`
 * đã ghi đúng cái bẫy ấy. Byte thì không có chỗ nào để lọt.
 */
export const duoiTran = (n, loai) => n <= TRAN[loai]
