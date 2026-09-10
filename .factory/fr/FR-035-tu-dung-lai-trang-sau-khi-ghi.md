# FR-035 — Tự dựng lại trang sau mỗi lần ghi

**Mức**: s8 (M03_web + M08_api) · **không** đụng file frozen nào
**Ngày**: 2026-08-26
**Nguồn**: người dùng, hai lượt:
> *"ủa, bắn qua API thì phải lên web luôn chứ sao phải run build nữa?"*
> *"tôi yêu cầu hệ thống sau khi có DB và backend thì dữ liệu update realtime,
> user bắn nội dung là phải lên web luôn, build làm gì nữa?"*

---

## 0 · ĐÃ BỊ THAY THẾ — 2026-08-26, cùng ngày mở

> **`dungLaiTrang()` đã bị gỡ bởi FR-034/C3.** SSR đọc DB ngay lúc request nên
> không còn trang tĩnh nào phải dựng lại. FR này **hết hiệu lực về cơ chế**;
> giữ lại vì §1 (số đo 34-vs-9 mốc) và §3 (lỗ `kyLaiBaseline` tự ký lại
> `FROZEN.lock`) là hai thứ đã đo được và vẫn đúng lịch sử.
>
> Vết còn lại, có chủ đích: `web/api/dungchung.mjs:293` là comment ghi nhận việc
> gỡ, và `api-guard §6` đã **đảo chiều** — nay nó khẳng định `dungLaiTrang`
> KHÔNG còn trong `dungchung.mjs`. Răng cũ không bị xoá, nó bị quay ngược.
>
> Mục §0 dưới đây viết TRƯỚC khi FR-034 đóng; nó đã dự đoán đúng chuyện này.

## 0b · Quan hệ với FR-034 — đọc trước khi làm gì thêm

FR-034 (agent khác, duyệt cùng ngày) chốt **bỏ dần site tĩnh Quartz, FE 100%
API**. Khi nó xong thì FR này **hết lý do tồn tại**: không còn trang tĩnh thì
không còn gì phải dựng lại.

FR này là **cầu tạm**, và tôi khai nó là cầu tạm chứ không giả vờ là kiến trúc:
người dùng cần bài lên web *hôm nay*, FR-034 là một cuộc chuyển nền dài. Khi
FR-034 đóng, gỡ `dungLaiTrang()` — đừng để lại một tiến trình dựng trang mồ côi
nổ mỗi lần ghi vào một site không còn ai đọc.

## 1 · Vấn đề, đo bằng số

Emitter lấp **34 mốc** lúc build; FE chỉ vẽ lại **9** mốc khi API sống
(`veDanhMuc` 7 + `grid2` + `acount`). Nên sau `POST /api/articles`:

| Đổi ngay | Chỉ đổi sau khi dựng lại |
|---|---|
màn Tất cả (thẻ + ô đếm) · cửa sổ đọc · Danh mục · thùng rác | Trang chủ (nổi bật · mới phân tích · lưới · KPI · biểu đồ) · **toàn bộ dashboard Kho** · sidebar lọc · trang tĩnh riêng của bài |

Người dùng ghi bài xong, mở Trang chủ, không thấy bài ⇒ tưởng ghi thất bại. Đây
là hỏng **thật**, không phải bất tiện: hệ thống báo 201 rồi hiện một trang nói
điều ngược lại.

Tôi từng báo cáo sai chỗ này — nói *"chỉ thiếu trang tĩnh riêng"*. Thiếu Trang
chủ và cả dashboard Kho. Con số 34-vs-9 ở trên là để lần sau không đoán nữa.

## 2 · Cách làm — `dungLaiTrang()` và ba chốt

`web/api/dungchung.mjs`, gọi ngay sau mỗi `void capNhatIndex()` — **cả ba** đường
ghi. Mỗi chốt chặn một cách hỏng đã lường được:

| Chốt | Chặn gì | Không có nó thì |
|---|---|---|
`KB_DIR`/`SCHEMA_DIR` đặt ⇒ return | kho TẠM không được dựng site thật | **mỗi** test ghi bài là một lần dựng ~7 giây vào `web/site/`, trong khi test khác đang đọc chính chỗ đó — 44 file test |
`clearTimeout` + hoãn 500ms | gộp nhiều lần ghi liên tiếp | một lượt nạp ghi 3 lần = 21 giây dựng |
cờ `_dang` + `_lai` | không dựng chồng | hai `quartz build` cùng ghi một thư mục |

`GN_KHONG_DUNG=1` để tắt tay khi cần.

Chốt 1 là chốt quan trọng nhất và nó **được đo**, không phải được tin: mốc thời
gian `site/index.html` trước và sau `node test/api-crud.test.js` — không đổi.

## 3 · Lỗ đã bịt cùng lượt

`kyLaiBaseline()` chạy **vô điều kiện** trong đường ghi, nên `npm test` âm thầm
ký lại `FROZEN.lock`. Một bộ test tự ký lại baseline của chính nó là R2: bên bị
đánh giá sở hữu thước đo. Thêm cùng chốt `KB_DIR`/`SCHEMA_DIR`, kiểm hai chiều.

`phucHoi()` từng `unlinkSync` — vi phạm M08-R4 (*trong `web/api/**`, xoá nghĩa là
chuyển vào `_recycle/`*). Viết lại chỉ dùng `renameSync`, có đường lui đúng byte.

## 4 · Kết quả đo

Server thật, không gõ lệnh dựng nào:

```
13:19:27  POST /api/articles          -> 201
13:19:33  site/index.html             đã dựng lại   (+6s)
13:19:33  site/kho/index.html         đã dựng lại
13:19:33  site/article/thu-realtime.html  xuất hiện
```

| | |
|---|---|
`npm test` | **44/44** · exit 0 |
`npm run check` | xanh |
pytest | **30 passed** |
test KHÔNG kích hoạt build thật | `site/index.html` mtime không đổi qua `api-crud` |

## 5 · Răng

`api-guard §6` đọc `dungchung.mjs` và đòi: có `dungLaiTrang`, có **cả ba** chốt,
và **được gọi ở đủ số đường ghi** — đếm theo `void capNhatIndex()` chứ không gõ
tay số 3, để thêm một đường ghi mới mà quên gọi thì đỏ.

## 6 · Chữ người dùng thấy — sửa vì nó NÓI SAI

`NHAC_BUILD` (6 thông báo) từng viết *"chạy `npm run build` để cập nhật"*. Sau FR
này đó là lời nói sai. Đổi thành *"trang tự dựng lại sau ~7 giây — tải lại trang
để thấy"*.

**Không bỏ hẳn câu nhắc**: phần tĩnh chỉ đổi sau khi bản dựng xong **và người
dùng tải lại trang**. Bỏ câu này thì người ta ghi xong, mở Trang chủ, không thấy
bài — đúng cái nhầm FR này sinh ra để chữa.

## 7 · Điều KHÔNG làm

- **Không** cho build chạy khi kho là kho tạm — xem chốt 1.
- **Không** dùng watcher trên `kb/`: đường ghi đã biết chính xác khi nào có thay
  đổi; một watcher sẽ còn nổ vì chính bản dựng, và vì agent khác đang sửa `kb/`.
- **Không** coi đây là "realtime". Nó là **~7 giây và phải tải lại trang**. Gọi
  đúng tên để không ai tin quá — realtime thật là việc của FR-034.
- Không commit, không push.
