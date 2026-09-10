# M04_ci — spec

> **Module này là bề mặt S3.** Mọi AC `hard` của sáu module kia đều trỏ về một
> lệnh, và S3 là nơi lệnh đó chạy ở chỗ agent không với tới được.
>
> Vì sao làm trước tiên (B1): đơn vị việc đầu tiên chạy qua vòng lặp Factory cần
> bằng chứng máy xanh ở nhịp ⑤. Làm sau thì reviewer đòi evidence mà chỉ có lời
> khai — R2 đánh trượt.

## 1 · Phạm vi

| | |
|---|---|
| **Sở hữu** | `.github/workflows/**` (S3) · `.githooks/**` (S4, FR-003) · việc pin phiên bản, định nghĩa "máy xanh" |
| **Không sở hữu** | không file nào của M01/M02 — nó **kiểm**, không sửa |
| **Vào** | mọi PR và push chạm `core/**`, `kb/**`, `web/**` |
| **Ra** | xanh / đỏ + log. Không artifact nào khác |
| **Ghi được** | `.github/**`, `.githooks/**` |

## 2 · Business logic

### 2.1 · CI phải đỏ được

Một CI không bao giờ đỏ thì không phải cổng, là trang trí. Trước khi tin nó,
phải **cố tình phá một luật và thấy nó đỏ**.

> **AC-2.1.1** · Sửa fixture cho sai một luật ⇒ CI đỏ.
> `hard` · `cmd: python core/tests/check_ci_teeth.py`
> Script phá từng luật trong bộ nhớ, khẳng định `check()` trả lỗi, rồi khôi phục.
> Không đợi một PR thật để biết CI có răng.

> **AC-2.1.2** · Toàn bộ test xanh trên cây sạch.
> `hard` · `cmd: python -m pytest core/tests -q`

### 2.2 · Chạy lại validate, không tin hook local

Pre-commit hook (S4) chặn ở máy người dùng. `git commit --no-verify` bỏ qua nó
trong một giây.

**CI chạy lại toàn bộ validate** — đó là lý do S3 và S4 là hai bề mặt khác nhau
chứ không phải một việc làm hai lần.

> **AC-2.2.1** · CI chạy `validate.py kb/` độc lập với hook.
> `hard` · `cmd: python core/src/source_distiller/validate.py kb/`
> *(kho rỗng ⇒ exit 0 hợp lệ; giá trị thật của AC này xuất hiện ở chặng C)*

### 2.3 · Pin phiên bản — ADR-02

`python-version: '3.11'` pin cứng trong workflow, và `pyproject.toml` phải khớp.

**Hiện tại KHÔNG khớp**: workflow template ghi `3.11`, `pyproject.toml` ghi
`requires-python = ">=3.9"`. Toàn bộ phiên làm việc s5–s6 chạy trên **3.9**.

Hai số khác nhau nghĩa là CI kiểm một môi trường, người phát triển chạy môi
trường khác — và lỗi chỉ lộ ra trên CI, chỗ đắt nhất để phát hiện.

> **AC-2.3.1** · `python-version` trong workflow khớp `requires-python`.
> `hard` · `cmd: python core/tests/check_version_pin.py`

### 2.4 · Bật CI là một quyết định, không phải mặc định

Workflow hiện là `ci.yml.template` — **chưa kích hoạt**, có chủ ý.

Bật ngay bây giờ sẽ đỏ vì môi trường chưa dọn (2.3), và **một CI đỏ từ commit đầu
sẽ bị bỏ qua** — đúng thứ làm S3 mất răng.

Thứ tự bắt buộc: dọn môi trường (2.3) → chạy được cả 4 lệnh trên máy → **rồi mới**
đổi tên `.template` thành `.yml`.

> **AC-2.4.1** · Khi đổi tên, cả 4 lệnh `hard` ở trên phải xanh trước đó.
> `soft` — thứ tự thao tác người, không có lệnh nào kiểm được. Người chốt.

## 3 · Công thức

Không có. Module này không tính gì — nó chạy lệnh của module khác.

**Đây là điểm quan trọng**: M04 **không định nghĩa** luật nào. Nó chỉ chạy lệnh
mà AC của module khác đã khai. Luật sống ở `validate.py` và `test_gates.py`.

## 4 · Điều module này CẤM

| Cấm | Vì |
|---|---|
| Sửa file trong `core/` hoặc `kb/` | nó **kiểm** hai module đó — luật gốc: không ai sở hữu thứ dùng để đánh giá mình |
| Có bước nào tự `--fix` rồi commit | CI sửa dữ liệu là CI che lỗi |
| `continue-on-error: true` ở bước test | biến cổng thành trang trí |
| Bật CI khi chưa dọn môi trường | CI đỏ từ đầu bị bỏ qua, S3 mất răng |

### 2.5 · Hook local là bề mặt S4 (FR-003)

`.githooks/pre-commit` chặn ở máy người dùng — nhanh, nhưng `--no-verify` bỏ qua
được trong một giây.

**Hai bề mặt, không phải một việc làm hai lần**:

| | S4 hook | S3 CI |
|---|---|---|
| Nhanh | ✅ ngay lúc commit | ❌ sau khi push |
| Bỏ qua được | ✅ `--no-verify` | ❌ |

Hook bắt sớm cho người làm; CI bắt chắc cho hệ thống.

**Vì sao M04 sở hữu chứ không M01**: M01 sở hữu *luật* (`validate.py`), M04 sở hữu
*bề mặt chạy luật*. Hook chạy luật của M01 nhưng bản thân nó là cơ chế — cùng loại
với CI.

> **AC-2.5.1** · Hook chặn commit file `.md` sai format.
> `hard` · `cmd: bash .githooks/test-hook.sh`

> **AC-2.5.2** · `--no-verify` bỏ qua được hook, và CI vẫn bắt.
> `hard` · `cmd: bash .githooks/test-hook.sh --no-verify-case`
> AC này **khẳng định** hook bỏ qua được — đó là lý do CI phải chạy lại validate,
> không phải lỗi cần sửa.

## 5 · Trạng thái

✅ **as-built** — s8 chặng A, 2026-08-19.

`ci.yml` đã kích hoạt, **31 bước**. Nợ 2.3 đã trả: pin `3.13` khớp cả hai chỗ
(FR-005 — máy không có 3.11, và 3.13 đã chạy sạch toàn bộ bộ kiểm).

Hook S4 có test hai chiều: chặn file sai, và `--no-verify` bỏ qua được — vế thứ
hai là **khẳng định**, đó là lý do CI phải chạy lại validate.
