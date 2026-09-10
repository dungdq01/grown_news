# M11_video — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
là *một màn*, *một luật DDL*, hoặc *một cổng URL*, và cả ba viết được thành đỏ
trước.

Nhưng M11 có **một nhịp thêm** mà không module nào khác có:

**⑤ ĐẾM REQUEST — sau CODE, trên trình duyệt thật.** M11 là chỗ **lần đầu sản
phẩm gọi ra mạng ngoài**. `M09-R3` (click-to-load) là luật nặng nhất ở đây, và
**hành vi đúng nằm ở thứ KHÔNG xảy ra** — không request nào. Đọc mã xanh được,
đọc markup xanh được, cả hai trên một trang đang rò. Chỉ **network log** đo được.

Ba thứ phải đếm, không chỉ iframe:

```
iframe src        ← rõ nhất, và không phải cái duy nhất
ảnh thumbnail     i.ytimg.com/... trên nút play  → vẫn là request ra ngoài
preconnect/dns-prefetch  → vẫn là một lần chạm mạng
```

Ba chỗ áp riêng khác:

**① PHÂN TÍCH — luật của module này sống ở HAI file, và spec trỏ sai một.**
`§2.1` nói cổng nằm ở `frontmatter.schema.json` nhánh `anyOf`. Đo được: cổng thật
là **`validate.py:398-401`**. Sửa `anyOf` không đổi hành vi; sửa `validate.py`
thì đổi (`testcases.md §cuối` mục 3).

**② PLAN — mỗi màn mới sửa BẢY nơi**, giống M10. Quên
`web/test/_render.mjs VIEWS` ⇒ màn mới **vô hình** với 7 test quét-mọi-trang.

**④ CODE — `src` chỉ dựng từ whitelist host + regex id, KHÔNG từ `fm.url`.**
`fm.url` là trường **người nộp khai**. Dựng `src` từ nó là để một URL của người
nộp thành một request của trình duyệt **người đọc**. `id_tu` rút id, `id_mau`
xác nhận — **hai** cổng, đọc từ `media-mime.json:video_host`.

## Whitelist host: FE là tiện lợi, KHÔNG phải cổng

```
FE (lúc dán)   → phản hồi ngay chỗ người vừa gõ     ← tiện lợi
server (/api)  → thứ duy nhất ai gọi API cũng gặp   ← CỔNG
```

⚠️ Đo được (plan `S23`): một bản video host lạ kèm `url_normalized` đi qua
`validate.py --strict` **sạch**. Whitelist host trước FR-040 **chỉ sống ở FE**.
Và `AC-6.3` (allowlist đích) **không** bắt được, vì `youtube.com` là một đích
trông hợp lý. ⇒ `/api/video` là lần đầu luật đó có mặt phía server.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| SQL | **M08** — mọi mutation qua `dungchung.mjs` (M08-R2) |
| trần 25 MB · mime enum · byte hiện vật | **M09** — và đó là thứ **thật sự** chặn byte video, không phải cổng nào của M11 |
| `normalize_url()` | **M01** — dùng lại, không viết bản thứ hai (M05-R3) |
| bảng `tai_lieu` | **M10** — cùng hồ sơ `thu-vien`, khác thứ bắt buộc |
| màn Kho · Tổng hợp | **M03** — hai màn **duy nhất** được trộn |
| gộp theo nguồn (M03-R5) | **M03** — nhưng nó **phụ thuộc** `url_normalized` của module này: hai bản ghi cùng video ra hai giá trị ⇒ một video thành hai *"nguồn độc lập"* |
