# T03-108 — FE: BẬT nút Sinh transcript + xem/sửa transcript trước chưng

> T03-92 đã dựng nút ở trạng thái disabled-có-lý-do ("tới C4b"). C4b tới:
> bật nút cho bản ghi VIDEO, popup xác nhận cùng khuôn T03-106 (gọn, một câu),
> POST /api/job loai sinh-transcript. Sau khi .vtt về: cửa sổ đọc video hiện
> transcript (cue theo mốc, bấm cue → [t=..] chip như ma trận [N]); nút
> "Sửa transcript" mở .vtt trong khung sửa → lưu = THAY media qua cửa sẵn có
> (bump ban — FR-054 §9.1), kieu_moc chuyển nguoi_sua (T01-45).
> CHẶN CỨNG: sau T12-16 (đường backend sống) + T01-45 (mime/cột).

phạm_vi_ghi:
  - web/plugins/chungcat/src/chungcat.inline.ts   # bật nút + popup + polling job
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts  # cửa sổ đọc video: tab transcript
  - web/styles/prototype.css
# Cổng `web/test/sinh-transcript-ui.test.js` thuộc ĐƠN VỊ TEST `T03-110b`
# (mở rộng CÙNG LƯỢT). Bản đầu khai nó ở ĐÂY và `check_g6b §5` bắt đúng: `R1`
# nói đơn vị không phải test thì không chạm file test — người viết mã không
# được cầm bút viết thước chấm chính mình.
  - web/package.json

verifiability: hard
tiêu_chí:
  - AC1: bản ghi video ⇒ nút BẬT; tai-lieu/phan-tich giữ nguyên hành vi T03-92
      (không vỡ chung-cat-ui)
    cmd: node web/test/sinh-transcript-ui.test.js && node web/test/chung-cat-ui.test.js
  - AC2: bấm lần một 0 request; xác nhận → POST /api/job loai sinh-transcript;
      toast link ?job=
    cmd: node web/test/sinh-transcript-ui.test.js
  - AC3: có .vtt ⇒ tab transcript render cue; bấm cue chèn chip [t=mm:ss]
    cmd: node web/test/sinh-transcript-ui.test.js
  - AC4: suite web xanh
    cmd: cd web && npm test

## USER FLOW CHỐT 2026-09-05 (ĐÈ hình dạng tab tĩnh ở trên — chủ dự án):
## "sinh chữ tới đâu SHOW tới đó · xong thì có nút CHƯNG CẤT cho chính bản
## transcript · 3 cửa sổ song song cho video (url/mp4)"

1. Bấm **Sinh transcript** (popup xác nhận gọn) ⇒ mở **CỬA SỔ TRANSCRIPT
   song song** cạnh cửa sổ video (khuôn cửa-sổ-chưng-cất T03-112, cùng
   stepper animation: tai → asr → vtt → gan-hien-vat).
2. **Pha ASR — chữ hiện DẦN**: poll `GET /api/viec/<ulid>` đọc `tien_do`
   (T12-19 cung cấp `vtt_tung_phan` + `cue_xong` + `giay_xong`) ⇒ cue mới
   TRƯỢT vào cuối khối chữ (animation một nhịp, reduced-motion giữ);
   thanh mốc "đã tới phút mm:ss / tổng".
3. **Xong** ⇒ khoảnh khắc chuyển cảnh, transcript đầy đủ + hai nút:
   **"Chưng cất bản transcript này"** (POST /api/job chung-cat-mot-nguon
   trên chính bản ghi — mở TIẾP cửa sổ chưng cất T03-112 ⇒ đúng cảnh
   3 CỬA SỔ: video · transcript · chưng cất) và "Sửa transcript" (giữ khuôn
   cũ: thay media qua cửa sẵn có, bump ban, kieu_moc=nguoi_sua).
4. Tab transcript TĨNH trong cửa sổ video (đặc tả cũ ở trên) GIỮ cho bản
   ghi ĐÃ có .vtt — xem lại + bấm cue chèn chip [t=..].

# AC BỔ SUNG (cùng đơn vị test đi kèm):
#   AC5: pha ASR — mock tien_do 2 nhịp ⇒ khối chữ DÀI RA giữa hai nhịp poll,
#        cue mới nằm cuối; cmd: node web/test/sinh-transcript-ui.test.js
#        đỏ_khi: chữ chỉ xuất hiện khi job xong; xanh_khi: partial hiện được
#   AC6: xong ⇒ nút "Chưng cất bản transcript này" tồn tại và POST đúng
#        /api/job với slug bản ghi; mở cửa sổ chưng cất (2→3 cửa sổ);
#        cmd: node web/test/sinh-transcript-ui.test.js
# CHẶN CỨNG bổ sung: AC5/AC6 chạy SAU T12-19 (tien_do API).
