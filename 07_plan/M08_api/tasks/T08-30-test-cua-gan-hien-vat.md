# T08-30 — cửa HẸP: gắn hiện vật vào một bản ghi

> Chủ dự án chọn **lối 1** (2026-09-04): *một cửa LÕI mới chỉ để gắn hiện vật
> vào bản ghi*. Hai lối kia bị bác: đi qua bảng nháp thì một hiện vật máy sinh
> phải chờ người duyệt để... đính vào chính bản ghi nó dẫn xuất từ; nới `PUT`
> cho THỢ thì mở lại đúng cửa `M05-R1`/`FR-047 §0` vừa đóng.
> ID theo `rule.md` mục 9: `ls 07_plan/M08_api/tasks/` → max `T08-29` ⇒ 30.

## Vì sao một cửa MỚI, không dùng `PUT` sẵn có

`PUT /api/articles/<type>/<slug>` nhận **cả frontmatter và thân**. Một THỢ gọi
được nó là một THỢ ghi được mọi trường của một bản ghi đã duyệt — `suaBai` lột
`review_status`/`origin`, nhưng nó KHÔNG lột `category`, `concepts`,
`credibility_max`, thân bài. `M01-R2` cấm máy điền `credibility_max`, và
`AC-1.1` nói nháp của M12 đi qua **bảng nháp**.

⇒ Cửa mới **hẹp tới mức chỉ làm được đúng một việc**: thêm một `sha256` vào
`media[]`. Không nhận frontmatter, không nhận thân. Bề mặt hẹp là thứ duy nhất
làm cho câu *"THỢ không sửa được bản ghi"* còn đúng sau khi mở một cửa cho THỢ.

## Hợp đồng

```
POST /api/articles/<type>/<slug>/hien-vat      đòi khoá dịch vụ
  { sha256, mime, kieu_moc?, model_asr? }
  → 200 { ban, media: [...] }
```

- **Chỉ THÊM** vào `media[]`. Hiện vật đang có giữ **nguyên từng byte** (`AC-V6`).
- `sha256` phải **đã tồn tại** trong bảng `media` — cửa này gắn, không nạp byte.
  Nạp byte là `POST /api/articles/media` (`FR-036`).
- **KHÔNG bump `ban`** — và đó là một quyết định, không một chỗ bỏ quên.
  `FR-054 §9.1` bump `ban` cho lối **THAY** (sinh lại transcript: thay `sha256`
  cũ bằng mới ⇒ snapshot frontmatter cũ sang `article_versions`). Cửa này là lối
  **THÊM**: không hiện vật nào bị thay, nên không có bản cũ nào để snapshot.
  ⇒ Lối THAY là một đơn vị riêng, và nó cần đường ghi `article_versions` (hôm
  nay bảng đó chỉ được `dung_lai_db.py` nạp TỪ FILE `<slug>.v<n>.md` — tức
  version là FILE, đúng `B-C1`). Ô backlog đã mở.
- `kieu_moc` chỉ nhận `la_asr` | `nguoi_sua` (khớp `CHECK` của
  `kho.schema.sql`, `T01-45`).
- **BẤT ĐỘNG**: cùng `sha256` gọi hai lần ⇒ `media[]` vẫn một entry, `ban`
  **không** bump lần hai. Một cửa bump `ban` mỗi lần gọi là một cửa biến retry
  thành lịch sử giả.
- **KHÔNG** nhận `review_status`, `trang_thai`, `category`, `concepts`,
  `credibility_max`, thân bài. Payload có chúng ⇒ **bỏ**, không phải từ chối:
  từ chối biến một trường bị lột thành một lỗi người dùng thấy, còn hợp đồng
  chỉ nói *nó không được tin*.
- Ghi qua `ghiSauValidate` — **một** cửa ghi cho `kb/` (`B-C1`).

phạm_vi_ghi:
  - web/api/articles.mjs
  - web/api/router.mjs

# Cổng KHÔNG khai ở đây: `web/test/**` thuộc boundary **M03_web** (`fe`), không
# thuộc M08_api — cùng tiền lệ `T08-27`/`T08-29`. `web/test/hien-vat-gan.test.js`
# là file MỚI của đơn vị TEST, và nó đăng ký vào `npm test` cùng lượt với mã.
# Bằng chứng đỏ-trước là output chạy TRƯỚC khi dựng cửa (`rule.md` mục 8).

verifiability: hard

tiêu_chí:
  - AC1: gắn một `sha256` đã có ⇒ 200, `media[]` +1, hiện vật cũ nguyên byte
    cmd: node web/test/hien-vat-gan.test.js
    đỏ_khi: media[] không đổi · hiện vật cũ đổi một byte · thân bài đổi
    xanh_khi: cả ba đúng
  - AC2: BẤT ĐỘNG — gọi lần hai cùng `sha256` ⇒ `media[]` vẫn một entry, 200
      (không 409: retry sau một lỗi mạng là chuyện thường)
    cmd: node web/test/hien-vat-gan.test.js
    đỏ_khi: entry trùng · lần hai trả lỗi
    xanh_khi: bất động
  - AC3: cửa HẸP — payload mang `review_status`/`category`/thân bài đều bị BỎ,
      và `sha256` chưa có trong bảng `media` ⇒ 422
    cmd: node web/test/hien-vat-gan.test.js
    đỏ_khi: một trường lạ nào đó vào được bản ghi · sha lạ được gắn
    xanh_khi: mọi trường lạ bị lột · sha lạ ⇒ 422
  - AC4: đòi khoá dịch vụ — lời gọi không khoá ⇒ 401/403
    cmd: node web/test/hien-vat-gan.test.js
  - AC5: suite web xanh
    cmd: cd web && npm test

phụ_thuộc: T01-45
