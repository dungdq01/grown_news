# T03-18 — FR-036/B8b: cổng xem trước hiện vật (đơn vị TEST)

> Tách khỏi T03-17 vì R1. Viết TRƯỚC code, phải ĐỎ trước.
>
> Hai tầng cố ý: §1–§3 soi **bundle** (luật về CÁCH dựng `src` sống trong code),
> §4 đo **hai đường dữ liệu thật** — `duLieuMock()` và `GET /api/index` — vì đó là
> hai chỗ cửa sổ đọc lấy `BAI`, và một trong hai đã thiếu trường (xem T08-9).

phạm_vi_ghi:
  - web/test/media-cua-so.test.js
  - web/package.json
  - web/test/WORKLOG.md
  - web/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: dạng xem trước lấy từ `xem_truoc` của bảng khai; `iframe` cho pdf, thẻ +
      `download` cho ppt/word
    cmd: cd web && node test/media-cua-so.test.js
  - AC2: M09-R3 hai chiều — `src` dựng từ hằng `nhung` + id khớp `id_mau`, và
      KHÔNG dòng nào dựng `src` từ `url`/`url_normalized`
    cmd: cd web && node test/media-cua-so.test.js
  - AC3: click-to-load — hàm dựng xem trước KHÔNG chứa host video (iframe chỉ
      sinh sau khi bấm); nút có nhánh xử lý
    cmd: cd web && node test/media-cua-so.test.js && node test/nut-song.test.js
  - AC4: `media` tới được CẢ HAI đường dữ liệu của cửa sổ đọc — mock (flow JSON
      qua parser tự chế) và `/api/index` (builder thứ ba)
    cmd: cd web && node test/media-cua-so.test.js
phụ_thuộc: T03-17
