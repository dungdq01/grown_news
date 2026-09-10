# FR-044 — Hồ sơ thứ ba: `tong-hop`, bản ghi có N nguồn

- **mở**: 2026-08-31 · **người quyết**: chủ dự án (chọn phương án A) · **trạng thái**: chờ thi công
- **artifact FROZEN chạm**: `core/assets/frontmatter.schema.json`
- **mở khoá**: use case *"PDF + video về một chủ đề → một bản tổng hợp"* (PRD U9 mở rộng)

## 0 · Vì sao FR này tồn tại

Người dùng nêu use case, nguyên văn: *"web core có pdf + video của topic
AI-hermess. Module … sẽ phân tích + tổng hợp + xuất báo cáo"*.

Đo 2026-08-31 — hệ **không có chỗ** cho kết quả đó:

| | |
|---|---|
| `ho_so` enum | `["phan-tich", "thu-vien"]` — đúng hai |
| `url` | **trường BẮT BUỘC**, `format: uri` |

Một bản tổng hợp từ 1 PDF + 1 video:

- **không phải `phan-tich`** — hồ sơ đó là bản đọc **một** nguồn; `[§II.4]` của nó
  trỏ vào nguồn ấy, và câu hỏi *"§II.4 của cái nào?"* không trả lời được khi có N.
- **không phải `thu-vien`** — hồ sơ đó là **nguyên liệu**, miễn cổng hình dạng,
  trần 400 từ. Bản tổng hợp là **sản phẩm**, phải qua cổng.

> **Không có hồ sơ thứ ba thì use case chính của cả đợt hai — *"agent tổng hợp và
> học hộ"* — xây xong vẫn không đổ được kết quả vào kho.** Đó là lý do FR này
> mở TRƯỚC s4 chứ không để dành.

## 1 · Hình dạng chốt

### 1.1 · `ho_so` thêm một giá trị

```
enum: ["phan-tich", "thu-vien", "tong-hop"]
```

**Chỉ đổi enum này.** Không đụng `source_type`, không đụng DDL ba bảng.

### 1.2 · `source_type` KHÔNG thêm giá trị

Bản tổng hợp khai `source_type: docs`. Lý do: `ho_so` là **hồ sơ** (bộ cổng áp
lên bản ghi), `source_type` là **loại vật**. Hai trục khác nhau — đó chính là lý
do `ho_so` được đẻ ra ở FR-036, và `thu-vien` cũng trải trên hai `source_type`.

Thêm `source_type: tong-hop` sẽ kéo theo: `CHECK` của ba bảng trong
`kho.schema.sql` · `loai-nguon.json` · phép chiếu `__NHOM__` · ba màn danh sách.
**Bán kính lớn hơn nhiều mà không mua thêm được gì.**

*Chỗ có thể phản bác*: một bản do hệ thống viết không thật sự là `docs` (tài liệu
người khác viết). Nếu reviewer thấy nặng hơn cái lợi, phương án hai là thêm
`source_type: tong-hop` và trả giá bán kính ở trên.

### 1.3 · Trường mới `nguon` — bắt buộc, ≥ 2

```yaml
nguon: [xgboost-stap-by-step, thien-duong-chuot-tuong-lai]
```

Danh sách **slug** của bản ghi đã có trong kho.

**Vì sao ≥ 2**: tổng hợp từ một nguồn **là** một `phan-tich`. Cho phép 1 là mở
đường để dùng nhầm hồ sơ và thoát cổng locator của `phan-tich`.

### 1.4 · `url` — giữ bắt buộc, dùng URI TỰ ĐẶT TÊN

```
url: grown://tong-hop/<slug>
```

**Không gỡ `url` khỏi `required`.** Gỡ nó là đổi hợp đồng của **mọi** bản ghi
đang có để phục vụ một hồ sơ mới — sai tỉ lệ.

`grown://tong-hop/<slug>` là URI hợp lệ và nó **nói đúng sự thật**: bản ghi này
không đến từ đâu cả, hệ thống này làm ra nó. Đó không phải mẹo lách — `url` của
một bản tổng hợp mà trỏ vào một trong các nguồn mới là nói dối.

### 1.5 · `origin: pipeline`

Enum đã có sẵn ba giá trị `pipeline | external | manual`. `pipeline` nghĩa đúng
là *hệ thống này sinh ra*. Không cần giá trị mới.

## 2 · Cổng của hồ sơ `tong-hop`

Áp **bộ cổng của `phan-tich`** — khung 5 mục, trần từ, trần dẫn nhập, locator —
**cộng ba cổng riêng**:

| # | Bắt gì | Đỏ khi |
|---|---|---|
| T1 | `nguon` có ≥ 2 slug, **mỗi slug tồn tại trong kho** | slug trỏ vào hư không, hoặc < 2 mục |
| T2 | **Mọi địa chỉ phải phân giải về MỘT slug trong `nguon`** | một địa chỉ trỏ ra ngoài danh sách nguồn đã khai |
| T3 | **Mỗi nguồn trong `nguon` được nhắc ít nhất một lần** | khai một nguồn rồi không trích nó lần nào |

**T2 là cổng đắt nhất và là lý do hồ sơ này đáng tồn tại.** Ở `phan-tich`, câu
*"địa chỉ này trỏ đâu"* có đúng một đáp án. Ở `tong-hop` nó có N — nên địa chỉ
phải **mang tên nguồn**: `[xgboost-stap-by-step:p.7]`, không phải `[p.7]`.

T3 bắt một kiểu bịa riêng của tổng hợp: khai năm nguồn cho oai rồi chỉ đọc hai.

**Phụ thuộc**: T2 cần tập dạng địa chỉ của `B-A5` (Q5) đã cài. `FR-044` **không
thi công được trước S8**.

## 3 · Ràng buộc KHÔNG được nới

1. **`M05-R1` nguyên vẹn** — bản tổng hợp do máy viết vào qua `POST /api/nhap`,
   dừng ở `draft`. Không đường nào tự `approved`.
2. **`B-A5`, `B-A6` áp đủ** — địa chỉ phân giải được, `citations_*` do máy tính.
   Tổng hợp là chỗ **dễ bịa nhất** (nhiều nguồn, khó dò tay), nên miễn cổng ở đây
   là mở đúng cửa cần khoá nhất.
3. **Không hồ sơ thứ tư** trong FR này.

## 4 · Điều FR này KHÔNG làm

- **Không** thêm `source_type` mới (xem §1.2 và chỗ phản bác).
- **Không** gỡ `url` khỏi `required`.
- **Không** quyết engine tổng hợp — `ADR-05` đã khai engine cắm-rút-được, và chọn
  engine nào là việc của s4.
- **Không** ký `FROZEN.lock`. Sau khi FR duyệt, **người** ký.
