# M11_video — diagram flow

## Vị trí trong hệ

```mermaid
flowchart LR
  N["/video/nap/"] -->|"URL"| FE["FE: rút host + id<br/>whitelist + id_mau"]
  FE -->|"host lạ ⇒ báo TẠI CHỖ DÁN"| N
  FE -->|"POST bản ghi"| M08["M08 · cửa ghi"]
  M08 -->|"validate ho_so thu-vien"| M01["M01 · normalize_url"]
  M08 -->|"INSERT"| VD[("video")]
  VD --> BG[["VIEW ban_ghi"]]
  BV[("bai_viet")] --> BG
  TL[("tai_lieu")] --> BG
  BG --> KHO["/kho/ · /tat-ca/<br/>TRỘN cả ba"]
  VD --> MAN["/video/<br/>KHÔNG trộn"]
  VD --> TCM[["VIEW tham_chieu_media"]]
  MAN -->|"người BẤM"| IF["iframe src = nhung + id"]
  IF -.->|"lần ĐẦU gọi ra ngoài"| HOST["youtube-nocookie<br/>tiktok"]
```

Ba điều hình này nói ra:

**Đường nạp là MỘT request**, không hai. `tai_lieu` phải POST byte trước rồi POST
bản ghi; `video` chỉ POST bản ghi. Đó là khác biệt cấu trúc, không phải chi tiết.

**`video` VẪN chảy vào `tham_chieu_media`** dù video không có byte. Vì schema là
`anyOf [media | url]` — nó **không cấm** một bản ghi video khai cả `media`. Bỏ
nhánh này vì "video không có byte" là đúng lớp lỗi M09-R1.

**Mũi tên gạch nối là mũi tên duy nhất ra khỏi máy người dùng** trong cả sản phẩm,
và nó chỉ tồn tại **sau một cú bấm**.

## Đường nhúng — click-to-load

```mermaid
sequenceDiagram
  participant Ng as người đọc
  participant M as màn /video/
  participant JS as nhungVideo()
  participant H as host ngoài
  Note over M: mở màn: 0 request ra ngoài
  Ng->>M: bấm ▶
  M->>JS: data-act="nhung-video"<br/>data-nhan · data-vid
  JS->>JS: tra `nhan` trong whitelist<br/>xác nhận id khớp id_mau LẦN NỮA
  Note over JS: DOM giữa lúc vẽ và lúc bấm<br/>là thứ ai cũng sửa được
  JS->>M: thay nút bằng iframe<br/>src = HẰNG nhung + id
  M->>H: request đầu tiên
  H-->>M: video
```

## Vòng đời

```mermaid
stateDiagram-v2
  [*] --> approved: POST /api/articles
  approved --> edited: PATCH /status
  approved --> rejected: PATCH /status (kèm lý do)
  edited --> approved: PATCH /status
  rejected --> approved: PATCH /status
  approved --> rac: DELETE (If-Match)
  rac --> approved: POST /restore
  note right of rac
    Không byte mồ côi nào —
    video sống ngoài kho
  end note
```

## Chỗ dễ vỡ

| # | Chỗ | Vỡ ra sao |
|---|---|---|
1 | `video` → `ban_ghi` | thiếu nhánh ⇒ `xuat_kho.py:141-146` coi mọi `.md` loại `video` là mồ côi và **xoá sạch**; `banXuat()` chạy tự động sau mỗi lần ghi |
2 | `video` → `tham_chieu_media` | dễ bỏ sót vì "video không có byte" — nhưng schema cho phép nó khai `media` |
3 | hàm dựng thẻ chứa `.nhung` | mở màn = 50 request ra ngoài; kiểm hai chiều ở B8b đã chứng minh phép kiểm "không chứa hằng host" xanh oan khi host qua một biến |
4 | `url_normalized` nhận từ client | hai video khác nhau gộp thành một, hoặc một video thành hai — hệ số kiểm chứng chéo bị thổi |
5 | báo lỗi host sau khi POST | người dùng đọc `422` thành "mạng lỗi" — cùng bài học `413` ở B5 |
