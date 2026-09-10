# M10_tailieu — diagram flow

## Vị trí trong hệ

```mermaid
flowchart LR
  N["/tai-lieu/nap/"] -->|"POST byte"| M09["M09 · kho hiện vật<br/>magic-byte · sha256"]
  M09 -->|"201 sha256"| N
  N -->|"POST bản ghi"| M08["M08 · cửa ghi<br/>ghiSauValidate"]
  M08 -->|"validate ho_so thu-vien"| M01["M01 · validate.py"]
  M08 -->|"INSERT"| TL[("tai_lieu")]
  TL --> BG[["VIEW ban_ghi"]]
  BV[("bai_viet")] --> BG
  VD[("video")] --> BG
  BG --> KHO["/kho/ · /tat-ca/<br/>TRỘN cả ba"]
  TL --> MAN["/tai-lieu/<br/>KHÔNG trộn"]
  TL --> TCM[["VIEW tham_chieu_media"]]
  AV[("article_versions")] --> TCM
  RC[("recycle")] --> TCM
  TCM -->|"luật mồ côi"| XK["xuat_kho.py"]
  XK --> F["kb/tai-lieu/*.md<br/>kb/_media/*.pdf"]
```

Hai điều hình này nói ra mà văn xuôi hay bỏ qua:

**`tai_lieu` chảy vào HAI view, hai mục đích.** `ban_ghi` cho đường **đọc** (Kho,
Tổng hợp, `khoDoc()`); `tham_chieu_media` cho **luật mồ côi**. Bỏ nhánh `tai_lieu`
khỏi view thứ hai là mỗi DELETE phá byte vĩnh viễn (M09-R1).

**Màn `/tai-lieu/` đọc bảng, không đọc view.** Đó là điều tách ra: nếu nó đọc
`ban_ghi` rồi lọc trong JS thì nó vẫn là màn gộp, chỉ khác chỗ lọc.

## Đường nạp — hai request, một lần bấm

```mermaid
sequenceDiagram
  participant Ng as người
  participant FE as màn /tai-lieu/nap/
  participant API as web/api
  participant DB as kb/_kho.sqlite
  Ng->>FE: chọn file .pdf
  FE->>FE: kiểm đuôi ∈ bảng khai<br/>kiểm file.size ≤ 25 MB
  Note over FE: TRƯỚC khi POST — 413 không tới được<br/>client giữa lúc upload
  FE->>API: POST /api/articles/media (byte thô)
  API->>API: magic-byte khớp mime khai?
  API->>DB: INSERT OR IGNORE media
  API-->>FE: 201 { sha256, so_byte, mime, ten_goc đã lọc }
  FE->>Ng: hiện khối metadata (trước đó `hidden`)
  Ng->>FE: một câu + slug + nhãn
  FE->>API: POST /api/articles
  API->>API: validate hồ sơ thu-vien<br/>kiểm con trỏ treo
  API->>DB: INSERT INTO tai_lieu
  API->>API: banXuat() → kb/tai-lieu/… + kb/_media/…
  API-->>FE: 201 { path, id, etag }
```

## Vòng đời một bản ghi

```mermaid
stateDiagram-v2
  [*] --> approved: POST /api/articles<br/>(taoBai đặt literal — FR-033)
  approved --> edited: PATCH /status
  approved --> rejected: PATCH /status (kèm lý do)
  edited --> approved: PATCH /status
  rejected --> approved: PATCH /status
  approved --> rac: DELETE (If-Match)
  rac --> approved: POST /restore
  rac --> [*]: dọn rác (chưa có ở v1)
  note right of rac
    Byte VẪN CÒN: recycle nằm trong
    tham_chieu_media (M09-R1)
  end note
```

## Chỗ dễ vỡ, đánh dấu trên hình

| # | Chỗ | Vỡ ra sao |
|---|---|---|
1 | `tai_lieu` → `ban_ghi` | thiếu nhánh ⇒ `xuat_kho.py:141-146` coi mọi `.md` loại này là mồ côi và **xoá sạch**; `banXuat()` chạy tự động nên không cần ai gõ lệnh |
2 | `tai_lieu` → `tham_chieu_media` | thiếu nhánh ⇒ mỗi DELETE phá byte, và `phucHoi()` vẫn báo thành công |
3 | màn đọc `ban_ghi` thay vì bảng | màn "tách" thành màn gộp có lọc — M10-R1 đo bằng số đếm |
4 | form sửa thiếu ô `media` | mất con trỏ im lặng, lỗi lộ ở lần dựng lại DB kế tiếp — M10-R2 |
