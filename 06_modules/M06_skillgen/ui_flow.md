# M06_skillgen — ui flow

**Không có màn.** Chạy bằng CLI.

| Thao tác | Lệnh | Ra |
|---|---|---|
| Chấm lại verdict toàn kho | `python -m skillgen verdict kb/` | bảng: capability → verdict → lý do |
| Sinh nháp | `python -m skillgen draft --min-priority 25` | file nháp + đường dẫn |
| Kiểm manifest | `python 06_skillgen/test_manifest.py` | thiếu `$why` ở đâu |

Ghi trống có chủ ý — nháp đọc và sửa trong editor, không cần giao diện.

## Một điều về output CLI

Bảng verdict phải in **lý do**, không chỉ kết quả. `OVERLAP` mà không ghi
`reason_rejected` thì cùng loại ứng viên sẽ quay lại mãi — schema đã cưỡng chế
điều này, CLI chỉ hiện ra cho người đọc.
