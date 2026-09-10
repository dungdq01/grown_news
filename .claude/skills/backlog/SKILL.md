---
name: backlog
description: >
  Sổ chi tiết của MỘT bước — ghi cái đã thử rồi bỏ, vì sao rẽ hướng, và cái bị kéo
  theo (lỗi thời) sau mỗi lần sửa. Dùng NGAY sau khi sửa một artifact trong bước
  (prototype, spec, scaffold, code module), và đọc trước khi ký gate để biết còn
  nợ gì. Khác worklog (thô, mỗi bàn giao) và decisions.md (quyết định bền).
---

# Backlog — sổ trong-bước

> Ghi thứ **git không ghi được**. Git đã có "cái gì đã đổi"; đừng chép lại.
> Ba thứ git không có: cái đã **thử rồi bỏ** · **vì sao** rẽ hướng · cái bị **kéo theo**.

## File nằm ở đâu

Một file cho mỗi bước, đặt cạnh artifact của bước đó:

```
04_system/backlog.md
05_uiux/backlog.md
06_modules/M01_web/backlog.md      # mỗi module một file
07_plan/M01/backlog.md
```

**Append-only.** Không sửa entry cũ. Quyết định đổi ⇒ entry mới trỏ về entry cũ.

## Format — sáu dòng, không thêm

```markdown
## <ISO time> · <agent|người> · <bước / phần>
đã làm:    <một câu, việc gì>
thay vì:   <cái bị loại — bỏ trống nếu không loại gì>
vì:        <ràng buộc/lý do THẬT, không phải "để tốt hơn">
vật thể:   <path @ commit-sha>
kéo theo:  <cái gì vừa thành lỗi thời — "không" nếu thật sự không>
```

## Hai dòng bắt buộc có răng

**`vật thể`** — path hoặc commit SHA đối chiếu được. Cùng cơ chế trường `object`
của worklog: không có vật thể thì entry là **lời khai**, reviewer FAIL được và
phải trích entry id. Ghi `vật thể: (chưa commit)` là hợp lệ tạm thời, nhưng entry
đó chưa dùng làm bằng chứng được.

**`kéo theo`** — mỗi mục là **một món nợ**. Nợ chưa dọn thì gate không đóng. Đây
là dòng biến sổ ghi chép thành cơ chế, và là lý do file này tồn tại.

Ghi `kéo theo: không` phải là một khẳng định có trách nhiệm, không phải mặc định
cho tiện. Sửa artifact hạ nguồn mà bảo không kéo theo gì thì thường là chưa nghĩ.

## Vòng đời — SỐNG trong bước, CHẾT ở gate

```
① sửa artifact          → append 1 entry
② còn `kéo theo`?       → dọn: sửa thượng nguồn cho khớp, HOẶC đánh dấu superseded
③ mọi nợ đã dọn         → gate mới đủ điều kiện xét
④ ký gate               → kết luận bền nâng lên memory/decisions.md
                          gate ghi 1 entry .factory/worklog/
                          backlog.md thành hồ sơ lịch sử, không sửa nữa
```

Không có nhịp ④ thì đây thành **sổ thường trú thứ ba** cạnh worklog và decisions —
ba file cùng kể một chuyện, bản nào cũng hơi khác. Khung cấm đúng chuyện đó.

## Ranh giới với hai sổ kia

| Sổ | Trả lời | Nhịp ghi | Tuổi thọ |
|---|---|---|---|
| `.factory/worklog/` | ai · lúc nào · ở đâu · vật gì | mỗi bàn giao / gate | suốt dự án |
| `memory/decisions.md` | vì sao — quyết định bền | khi chốt một hướng | suốt dự án |
| `<bước>/backlog.md` | thử gì, bỏ gì, kéo theo gì | mỗi lần sửa artifact | trong bước |

Nghi ngờ nên ghi đâu, hỏi: *"ba tháng sau còn ai cần dòng này không?"* Còn ⇒
`decisions.md`. Chỉ cần cho tới lúc ký gate ⇒ `backlog.md`.

## Không được dùng làm gì

**Không phải evidence.** Entry backlog là lời của bên làm về việc bên làm. Reviewer
đọc nó để hiểu ngữ cảnh, **không** để chấm. Bằng chứng vẫn phải là output máy —
log CI, output lệnh, diff (`cases.md#tự-khai`).

**Không phải chỗ chép nội dung artifact.** Ghi `vật thể: 05_uiux/prototype/ @ a3f9c21`,
đừng dán code hay danh sách màn vào đây. Chép là tạo bản sao, bản sao sẽ trôi.

## Ví dụ thật — ca đầu tiên của dự án này

```markdown
## 2026-08-18T14:20Z · agent · s5 / prototype
đã làm:    dựng lại SCR-02 thành layout 3 cột
thay vì:   feed dọc như wireframe ban đầu
vì:        kb/ đã có tag — lọc ngang đọc nhanh hơn cuộn dọc trên kho >50 bài
vật thể:   05_uiux/prototype/index.html @ (chưa commit)
kéo theo:  05_uiux/wireframes/SCR-02-trang-chu.md lỗi thời · ui_kit grid token đổi

## 2026-08-18T15:05Z · dung · s5 / dọn nợ
đã làm:    vẽ lại SCR-02 khớp prototype 3 cột
thay vì:   —
vì:        dọn nợ entry 14:20 trước khi xét G5
vật thể:   05_uiux/wireframes/SCR-02-trang-chu.md @ (chưa commit)
kéo theo:  không — wireframes và prototype giờ cùng mô tả một bộ màn
```
