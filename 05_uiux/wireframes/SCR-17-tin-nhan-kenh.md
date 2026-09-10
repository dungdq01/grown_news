# SCR-17 · Tin nhắn kênh — giao diện ta KHÔNG sở hữu (M15)

> Contract: `kenh.sample.v2.json` (`hoi_thoai_mau` — 5 cảnh = 5 luật) · ma trận
> §1 dòng cuối · mock: `prototype/dot-hai/tin-nhan-kenh.html`.
> KHÔNG phải màn web — là HỢP ĐỒNG NỘI DUNG TIN NHẮN, minh hoạ bằng khung chat.

## Năm luật nội dung (mỗi luật một hội thoại demo)

1. Chưa buộc tài khoản ⇒ từ chối VÀ NÓI — nhưng không lộ gì về kho.
2. Kiểm trượt ⇒ trả NGUYÊN VĂN trường thiếu — "có lỗi xảy ra" là xoá thông tin.
3. Nạp xong ⇒ nói rõ đang ở NHÁP, chưa lên kho — không thì không ai quay lại duyệt.
4. Vượt trần file ⇒ nói TRƯỚC, kèm gợi ý kênh khác — lỗi của kênh không gợi ý được.
5. Hỏi-đáp: CÙNG endpoint + JSON với web (phiên theo tài khoản).

## Panel phụ (web — thuộc màn Kênh & tài khoản sau này, cùng M17)

Adapter trạng thái (chỉ GỌI RA) · bảng định danh chat ↔ tài khoản · mã mời một
lần có hạn. Màn quản trị đầy đủ port cùng M17/FR-045, không nằm trong đợt đầu.
