# T03-137 — Cắt thụt đầu dòng khỏi bundle · ĐÃ HOÀN TÁC

> `WO-083`. **Trạng thái: hoàn tác 2026-09-09.** Giữ file này làm VẾT — đây là
> một đường CỤT đã được đo, đừng đi lại.

phạm_vi_ghi:
  - 07_plan/M03_web/tasks/T03-137-cat-thut-dau-dong.md

verifiability: soft
tiêu_chí:
  - AC1: (VOID) `catThutDauDong` cắt thụt đầu dòng ngoài mọi chuỗi, giữ
      nguyên số dòng, và hạ `gn.js` xuống dưới trần
    ket_qua: KHÔNG ĐẠT. Cài xong, trọng tài `esbuild.minify` xanh trên cả ba
      file thật, cắt được 9846 byte ở TẦNG NGUỒN — nhưng `gn.js` không đổi một
      byte, vì `assets.mjs:330` đã chạy `minifyWhitespace` từ `WO-057`.
      Đổi lại làm ĐỎ `id-video-hoa-thuong` + `nap-video` (hai cổng cắt một hàm
      khỏi chunk THEO DÒNG rồi chạy). ⇒ hoàn tác, `render/assets.mjs` về
      nguyên trạng, cổng `cat-thut-dau-dong.test.js` xoá.

thu_duoc: |
  Trọng tài `minify(gốc) === minify(đã cắt)` đáng giữ làm khuôn cho lần sau:
  nó bắt được HAI bug thật của máy quét mà không phép kiểm cú pháp nào thấy —
  template lồng trong `${}` (parity lật ngược), và regex `/`([^`]+)`/g` mang
  ba dấu backtick.

  Và một bài học về cổng: bản đầu cổng khoe *"lấy lại 9846 byte"*. Con số đó
  NÓI DỐI về thứ được ship. Một cổng đo chuỗi TRUNG GIAN thay vì vật được
  giao là một cổng xanh oan.

trỏ: .factory/wo/WO-083-lay-lai-byte-gn-js.md (bảng bốn đường cụt)
