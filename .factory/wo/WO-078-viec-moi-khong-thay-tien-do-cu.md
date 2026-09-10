# WO-078 — Việc MỚI không thấy tiến độ cũ; mỗi lần 502 là mất cả bản phiên âm

- **Loại**: bug · **Module**: M12_chungcat · **Mức**: hard
- **Task**: `T12-34`
- Chủ dự án 2026-09-09, ảnh màn: job `sinh-transcript` cho
  `video/thien-duong-chuot-tuong-lai-nhan-loai-giai-ma-loi-tien-tri-d` hỏng.

## Cái KHÔNG phải bug

```
HTTPStatusError: Server error '502 Bad Gateway'
  for url 'https://platform.beeknoee.com/v1/chat/completions'   (dang-goi-model)
```

Cửa Beeknoee chập chờn — đã đo và ghi từ 2026-09-05 (`nguon-transcript.json`:
*3 lần gọi cùng một clip, 1 thành công*). `M12-R6` cho đúng 2 lần gửi, đã dùng
hết. Hệ **xử đúng**: đánh hỏng, vào thùng rác, giữ nguyên phần đã phiên âm.

## Cái LÀ bug — và nó nằm ở câu hệ tự khuyên

Màn hiện hai câu, và ghép lại chúng là một lời khuyên **dẫn tới mất việc**:

> *"Transcript đã có tới đâu vẫn giữ."*
> *"Đã dùng hết 2 lần gửi (M12-R6). Cần nữa thì tạo VIỆC MỚI."*

Đo được trên đĩa:

| | |
|---|---|
| `rac/ce3e0387….tien-do.vtt` | **17 904 byte · 151 cue · tới 10:42** — còn nguyên |
| `chay_lai` | **TỪ CHỐI**: `lan_gui 2/2` ⇒ *"Tạo job mới nếu thật sự cần"* (`vong.py:791`) |
| việc MỚI | `q.duong_tien_do(ulid)` khoá theo **ULID** (`vong.py:648`) ⇒ ULID mới = file mới = **bắt đầu từ giây 0** |

⇒ Bản phiên âm 10 phút 42 giây **nằm ngay đó**, hệ **bảo** người tạo việc mới,
và việc mới **không nhìn thấy nó**. Mỗi lần cửa 502 là trả tiền lại từ đầu cho
phần đã đúng — đúng thứ `WO-067` dựng checkpoint để tránh, nhưng checkpoint ấy
chỉ sống trong phạm vi MỘT ulid.

## Vì sao KHÔNG sửa bằng cách reset `lan_gui`

`M12-R6` cấm reset, và luật ấy đúng: trần 2 lần là **lan can chi phí của một
việc**. Nới nó là mở lại đúng vòng lặp `WO-066`/`WO-069` đã đóng.

Việc MỚI thì khác hẳn: đó là một **quyết định mới của NGƯỜI**, có trần riêng
2 lần của nó. Cái nó không được phép làm là **trả tiền lại cho giây đã mua**.

## Kỳ vọng

Job `sinh-transcript` không có tiến độ của riêng nó ⇒ tìm bản tiến độ **mới
nhất của CÙNG `slug`** (mọi ngăn: `cur` `done` `rac`), nạp làm checkpoint, chạy
tiếp từ giây cuối. Nói ra ở log và ở màn, không làm lặng lẽ.

## Ràng buộc

- Chỉ ghép khi **`slug` khớp** — ghép nhầm bản ghi là dán transcript của video
  khác vào, và không cổng nào bắt được vì `.vtt` nào cũng hợp lệ.
- `lan_gui` của việc mới **vẫn bắt đầu từ 0 và vẫn trần 2** — không đụng `M12-R6`.
- Không tự xoá bản cũ trong rác: nó là bằng chứng, và `WO-070` đã cho người
  đường xoá.
