# FR-003 — `.githooks/**` chưa có module sở hữu

mở_bởi: s7 (PM), 2026-08-18
tới: s4 (project_map · boundaries)
mức: chặn T04-3
trạng_thái: MỞ — chờ người duyệt

## Vấn đề

`check_g6b.py` bắt được khi kiểm phạm vi ghi: task T04-3 khai ghi `.githooks/**`,
nhưng **không module nào sở hữu path đó**.

```
M01_core      be = core/**
M04_ci        be = .github/**        ← KHÁC .githooks/
```

`.github/` và `.githooks/` là hai thư mục khác nhau. `.githooks/pre-commit` đã
tồn tại (2 commit) mà không thuộc về ai.

## Vì sao phải sửa, không bỏ qua

Không chủ ⇒ ba hệ quả:

| | |
|---|---|
| R1 mất địa chỉ | diff chạm `.githooks/` không quy được về đơn vị việc nào |
| Không ai bảo trì | hook hỏng thì không module nào có AC đối ứng |
| Deny + frozen vô chủ | hai bề mặt đang canh một file không ai nhận |

`.githooks/pre-commit` **là bề mặt S4** — một trong bốn bề mặt duy nhất rule có
răng. Để nó vô chủ là để một phần tư hệ thống cưỡng chế không có người chịu.

## Đề xuất

Thêm `.githooks/**` vào `M04_ci.be`:

```yaml
  M04_ci:
    be: [.github/**, .githooks/**]
```

**Vì sao M04 chứ không M01**: M04 sở hữu *bề mặt cưỡng chế* (S3 + S4). M01 sở hữu
*luật* (`validate.py`). Hook chạy luật của M01 nhưng bản thân nó là cơ chế — cùng
loại với CI.

## Ảnh hưởng nếu duyệt

| Chỗ | Đổi |
|---|---|
| `project_map.modules.M04_ci.be` | thêm path, bump version |
| `06_modules/M04_ci/spec.md` §1 | bảng phạm vi thêm `.githooks/**` — **file frozen**, cần bump |
| `check_frozen.py` | ký lại sau khi sửa spec |
| T04-3 | bỏ dòng `chờ:`, chạy được |

## Nếu KHÔNG duyệt

T04-3 bị huỷ, và dự án **không có bề mặt S4**. Chấp nhận được nếu coi CI (S3) là
đủ — nhưng phải ghi rõ vào `security_baseline` rằng S4 không tồn tại, thay vì để
người đọc tưởng có bốn bề mặt.

---

## ĐÃ DUYỆT — 2026-08-19

Người dùng duyệt. Thi hành:

| Chỗ | Đổi |
|---|---|
| `project_map.modules.M04_ci.be` | `[.github/**, .githooks/**]`, map bump v7 |
| `06_modules/M04_ci/spec.md` | §1 bảng phạm vi · §2.5 mới + 2 AC hard |
| `FROZEN.lock` | ký lại sau khi sửa spec |
| `07_plan/M04_ci/tasks/T04-3` | bỏ dòng `chờ:` |

Dự án **có đủ bốn bề mặt**: S1 deny · S2 reviewer · S3 CI · S4 hook + git.
