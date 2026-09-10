# FR-004 — AC-2.1.1 của M02 dùng lệnh không chạy được từ root

mở_bởi: s7 (PM), 2026-08-18
tới: s6 (spec M02_kb) — file frozen G6A
mức: nhỏ, sửa lệnh không sửa luật
trạng_thái: ĐÃ SỬA, chờ người xác nhận

## Vấn đề

`check_g6b.py` báo AC-2.1.1 của M02 "không task nào sinh và chưa xanh". Chạy thử:

```
$ python -m source_distiller.validate kb/ --strict     # từ root
  → lỗi, module không tìm thấy

$ cd core/src && python -m source_distiller.validate ../../kb/ --strict
  → 0 file · 0 lỗi · 0 cảnh báo   (exit 0)
```

Lệnh **có** chạy được, nhưng chỉ từ `core/src`. AC không ghi cwd.

## Vì sao đây là lỗi thật, không phải bắt bẻ

R3: `hard` phải có **lệnh chạy được**. Một lệnh chỉ chạy ở thư mục nào đó mà
không ghi thư mục ấy thì:

- CI chạy từ root ⇒ đỏ, và người sẽ tưởng luật hỏng chứ không phải lệnh thiếu
- reviewer ở nhịp ⑤ copy lệnh trong spec ⇒ đỏ ⇒ mất tin vào AC

## Sửa

```diff
- cmd: python -m source_distiller.validate kb/ --strict
+ cmd: python core/src/source_distiller/validate.py kb/ --strict
```

Chạy được từ root, exit 0. **Không đổi luật nào** — cùng validator, cùng 8 cổng.

## Ảnh hưởng

| Chỗ | Đổi |
|---|---|
| `06_modules/M02_kb/spec.md` AC-2.1.1 và AC-2.1.2 | đường dẫn lệnh |
| `FROZEN.lock` | ký lại sau FR này |
| Luật, rule, boundary | **không đổi gì** |

## Bài học ghi lại

AC `hard` phải chạy thử **từ thư mục CI sẽ chạy**, không phải từ thư mục tiện tay.
s6 tôi chạy thử 3 lệnh của M01 nhưng bỏ qua lệnh này của M02.
