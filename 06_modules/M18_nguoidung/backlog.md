# backlog — M18_nguoidung (chết ở G6C)

> Nợ do một thay đổi **CỤ THỂ vừa gây ra**. Không phải TODO, không phải ý tưởng,
> và **không phải** *"thứ chưa xây"*.
> Ô `[ ]` trỏ artifact có thật; `[x]` phải kèm object (commit · PR · FR id).

## Trống — M18 chưa có mã, nên chưa có thay đổi nào gây nợ

M18 là module NGANG: nó **không sở hữu một file mã nào**. Mọi thứ nó đang chờ
đều là **hợp đồng với module khác** hoặc **quyết định của chủ dự án** — không
phải nợ.

| thứ đang chờ | sống ở đâu | vì sao KHÔNG phải backlog |
|---|---|---|
| DDL bốn bảng | `ADR-06` + `FR-047` | **việc của s8** |
| bảy cửa `C1–C7` | `FR-047` (**đã duyệt**) | hợp đồng với M08 |
| `check_db_dung_cho.py` | `M08-R6` + `M18-R2` | việc của s8 |
| wireframe màn admin | `05_uiux/` | **s5 quyết**, không phải task |
| ngưỡng rate limit | `security_baseline §8.1` | cần **FR mới** |
| *"vai nào làm được gì"* | `M18-R3` | **quyết định của chủ dự án** |

## Ba nợ cần FR MỚI — chưa mở, và tôi không tự mở

**a · Rate limit + entropy ≥128 bit + log thất bại.**
Lỗ trong `FR-045` **ĐÃ DUYỆT** (`security_baseline §8.1`). `ma_moi` một-lần +
hết-hạn chặn *dùng lại* và *dùng muộn*, **không** chặn **thử hàng nghìn lần trong
cửa sổ còn hiệu lực**. Hậu quả không phải *"đăng nhập sai"* — đoán được mã là
**THÀNH người khác trong kho**.

`AC-7.1/7.2/7.3` đã khai và **viết được testcase**. `FR-047 §4` cố ý không gộp;
`FR-048` cũng không. Nay nó **có chủ để gửi tới**: M18.

**b · *"Vai nào làm được gì"*.**
Cột `nguoi_dung.vai` tồn tại từ `FR-045` và **không một dòng mã nào đọc nó**.
`M18-R3` giữ nguyên trạng đó — nhưng "giữ nguyên trạng" không phải một đích đến.
Cần quyết định thật, và nó là **quyền của chủ dự án**.

**c · Dữ liệu cá nhân vào git trước lần `push` đầu tiên.**
`ADR-06 (c)` cho ba bảng xuất ra file trong git, và hai trong ba mang dữ liệu cá
nhân (`nguoi_dung.ten`, `dinh_danh_kenh.chat_id`). Trong git **local** không khác
gì DB. `git push` lên remote là **chuyển dữ liệu cá nhân ra ngoài** ⇒ `B-E5`
(NĐ 356/2025) áp vào, cùng hồ sơ DPIA chưa ai lập.

Không chặn gì hôm nay (repo chưa push). Chặn **lần push đầu tiên**.

⇒ Cả ba **không mở ô `[ ]`** vì mở FR là **quyền của chủ dự án**, không phải một
task. Ghi ra để chúng không rơi vào khe.

## Ô ĐẶT Ở MODULE KHÁC — hai hệ đánh số SCR lệch nhau

Phát hiện khi viết `ui_flow §0`: `project_map` khai `SCR-06`/`SCR-07` = màn Tài
liệu / nạp tài liệu (M10); `05_uiux/wireframes/` có `SCR-06-ba-man-nap.md` và
`SCR-07-chung-cat.md`. **Hai thứ khác hẳn cùng một số.**

Ô đặt ở `06_modules/M03_web/backlog.md` — M03 sở hữu `05_uiux/**` (`FR-042`).
Không đặt ở đây: s6 đòi **backlog module sạch** để đóng G6A, và một ô của module
khác nằm trong backlog của tôi thì nó chặn G6A của tôi vì một quyết định **không
phải của tôi**.

## Phép thử s6 đã chạy — 15/18 AC viết được ngay, 3 đã sửa

`testcases.md §cuối` + `spec §9`: ba AC (`AC-3.1` · `AC-4.1` · `AC-6.1`) đều đo
**sự vắng mặt của một chuỗi trong mã nguồn** — đúng lớp lỗi `B8b`, nơi phép kiểm
*"không chứa hằng số"* **xanh oan** ngay khi hằng số đi qua một biến. Cả ba đã
đổi sang đo thứ **có mặt**: một con số đếm được · một khả năng có/không · một
cặp kết quả so được với nhau.

Không mở ô vì **đã đóng trong cùng lượt**.

## 2026-09-02 · T04-6 — hai rule hạ `S4` rồi **promote lại `S3`** trong cùng ngày

`M18-R1` và `M18-R3` nay khai `bề_mặt: S4`, không còn `S3`. Không phải nới lỏng
— là **nói thật**. `R3`: *"`hard` mà không có lệnh chạy được ⇒ **nó là
`soft`**"*. Lệnh của chúng kiểm **hành vi runtime của bốn bảng chưa tồn tại**,
nên viết bây giờ là viết cổng rỗng, và khai `S3` là để `rules.md` nói một điều
không đúng về chính nó.

**ĐÃ PROMOTE** cùng ngày: `T08-11` dựng DDL, `T08-12` dựng thao tác, nên thứ
cần đo có thật. Hai rule nay khai `S3` với lệnh `cd web && node
test/loi-cua.test.js` — **chạy được**, và `check_rule_surfaces` đếm
`15 S3 lệnh chạy được · 0 đỏ`.

Điểm đáng giữ: bước **hạ xuống `S4`** không phải nới lỏng. Nó làm `rules.md`
ngừng nói sai về chính nó, và biến một lời hứa thành một nghĩa vụ **có địa
chỉ**. Không có bước đó thì hai rule ở lại `S3` với một lệnh không tồn tại —
và trước `T04-6` thì **không cổng nào biết**.

> ⚠️ **Tôi đã mở một ô `[ ]` cho việc này rồi gỡ trong cùng lượt.** Header của
> chính file này nói backlog **không phải** chỗ chứa *"thứ chưa xây"* — và
> "promote khi có bảng" đúng là thứ chưa xây. Một ô sai chỗ ở đây không vô hại:
> s6 đòi **backlog module sạch** để đóng `G6A`, nên nó sẽ chặn G6A của M18 vì
> một việc thuộc lịch trình của `FR-047`.
>
> Đây cũng chính là luật tôi đã viết ở mục trên cho ô SCR của M03 — và tôi vi
> phạm nó **hai mục sau đó**, trong cùng một file.

**Cổng mới tự bắt được chỗ này.** `check_rule_surfaces` PHẦN B (T04-6) đỏ **đúng
hai rule này** và không đỏ cái nào khác — khớp con số dự đoán viết trước trong
`07_plan/M04_ci/tasks/T04-6-rang-that-cho-rule-surface.md`.

- [ ] **`spec.md` trỏ `FR-054` với nghĩa CŨ — số đó nay là đường VIDEO của M12.**
  Hai chỗ: `:324` (*"mở 2026-09-03 · `FR-054` · `ADR-07` · `B-B6`"*) và `:504`
  (*"Không mở `M20`. Gộp vào `M18` (`FR-054 §8`)"*).
  Đo 2026-09-03: **hai file từng mang id `FR-054`** — bản *"ô quyền sửa được từ
  web"* (02:18, của tôi) và bản *"đường video transcript"* (03:43, agent khác).
  Đã đổi số bản của tôi thành **`FR-055`**, và sửa `adr.md` (2 chỗ) ·
  `security_baseline.md` (1) · `proposal-3` (1) theo.
  ⚠️ `spec.md` **FROZEN** nên hai chỗ này **không sửa tại chỗ** ⇒ tick bằng **FR
  id**, cùng lượt với nợ ký `§10` đang chờ.
  Cộng một lỗi thứ hai ở `:504`: `FR-054 §8` trỏ một mục **không tồn tại ở cả hai
  FR** — nội dung `§8` sống ở `02_proposal/proposal-3-quan-ly-cai-dat.md:173`.
  Ba file kia đã sửa thành `proposal-3 §8`; `spec.md` chưa.
  · object: `06_modules/M18_nguoidung/spec.md:324,504` ·
  `.factory/fr/FR-055-o-quyen-sua-duoc-tu-web.md` ⇒ **FR id**

- [ ] M18 có spec FROZEN với **5 AC hard mà không lệnh nào chạy được**:
      `check_ma_moi` · `check_tai_khoan` · `check_phien` · `check_dinh_danh` ·
      `check_thu_hoi` — cả năm file KHÔNG tồn tại trong `core/tests/`.
      *"Chưa cài ⇒ vế gate đó không tồn tại và không ai báo."*

      Trước 2026-09-05 KHÔNG ai thấy: `check_g6b` W5 chỉ tính lỗi khi module
      `co_plan` (có ít nhất một task), nên M18 — chưa có `07_plan/M18_*/` —
      được miễn TOÀN BỘ. Nó lộ ra vì `T18-1` tạo thư mục plan đầu tiên cho
      module này, không phải vì ai vừa làm hỏng gì.

      Đây là nợ CÓ SẴN, không phải hồi quy. Nhưng nó nay CHẶN G6B, nên PM cần
      quyết: xếp lượt build M18, hay tạm gỡ `T18-1` để M18 về lại trạng thái
      "chưa lập plan" (và mất luôn cả chủ quyền giấy tờ mà `T18-1` vừa lập).
      object: 06_modules/M18_nguoidung/spec.md · core/tests/ (5 file thiếu)
