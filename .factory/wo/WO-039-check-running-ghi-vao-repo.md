# WO-039 — `check_running` ghi vào repo khi kiểm, và bộ phát hiện của nó đoán bằng TÊN CỜ

- **loại**: bug
- **module**: **M01_core** (`core/tests/**`) — một module, không frozen ⇒ PATCH
- **mức**: soft — không mất dữ liệu, nhưng làm mù công cụ quy chủ

## Repro

```bash
git status --porcelain            # ghi lại
for g in core/tests/check_*.py; do python "$g"; done
git status --porcelain            # so lại
```

Kết quả đo 2026-08-31 23:10 và lặp lại được:

| xuất hiện | do đâu |
|---|---|
| `?? 07_curate/reports/2026-W36.md` | **file mới**, chưa track |
| ` M 07_curate/reports/2026-08.md` | **ghi đè** |
| `kb/_kho.sqlite-wal` · `-shm` | `curate.py` mở DB |

## Nguyên nhân

`check_running.py:50` **thực thi** mọi lệnh liệt trong `RUNNING.md`
(`subprocess.run`). `RUNNING.md:181-182` liệt:

```
| Báo cáo tuần  | `python 07_curate/curate.py week`  |
| Báo cáo tháng | `python 07_curate/curate.py month` |
```

Cổng **đã có** nhánh cho lệnh ghi — nhưng nó phát hiện bằng **hậu tố cờ**:

```python
CHI_CU_PHAP = ("--fix", "--ghi", "--ky")     # check_running.py:28
```

`curate.py week` **ghi mà không có cờ nào** ⇒ lọt qua bộ phát hiện.

> Đây là một heuristic đúng cho ba lệnh và **im lặng sai** ở lệnh thứ tư. Lỗi
> không phải "thiếu một dòng trong danh sách" — lỗi là **cách phát hiện đoán từ
> hình dạng tên**, nên mọi lệnh ghi tương lai cũng sẽ lọt y như vậy.

## Kỳ vọng

Chạy bộ cổng **không để lại vết** trong working tree.

## Vì sao đáng sửa (không phải mỹ quan)

`CLAUDE.md` bắt dùng `git status` để **quy chủ** khi máy đỏ:

> *"máy đỏ mà **chưa quy được chủ** ⇒ `git status` + `find -newermt` trước khi phán"*

Sau mỗi lần chạy bộ cổng, `git status` lẫn giữa *"tôi vừa sửa gì"* và *"cổng vừa
sinh gì"*. Cổng làm mù đúng dụng cụ mà bộ luật dựa vào để **không tố cáo oan** —
tức nó phá thứ **R6** bảo vệ.

## Điều WO này KHÔNG làm

- **Không** sửa `07_curate/curate.py`. Nó không nhận `out` trên CLI
  (`curate.py:171-177` chỉ đọc `argv[1]`), nên chuyển hướng output = chạm M07 =
  hai module = BUILD. Ngoài phạm vi một PATCH.
- **Không** bỏ vế *"lệnh chạy thật"* của cổng cho các lệnh khác — đó là lý do
  cổng này tồn tại, vì tài liệu hay nói dối.
- **Không** xoá `2026-W36.md` đã sinh. Người dùng đã dặn không xoá gì.
