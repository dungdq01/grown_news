# WO-052 — "xong rồi thì kết quả ở đâu?"

- **mở/đóng**: 2026-09-05 · **module**: M12_chungcat + M08_api + M03_web
- **trạng thái**: XONG · 31/31 cổng M12 · 49 pytest · web còn 1 vế đỏ **của đơn vị khác**

Chủ dự án: *"Tôi không [thấy] button để xem trạng thái nháp — đáng ra nó phải ở
màn /chung-cat/ chứ. Các bản status 'xong' done rồi thì kết quả ở đâu, có link
với bài viết gốc không?"*

## Đo trước khi sửa — ba mắt xích đứt, kết quả thì CÓ

```
web/_loi.sqlite · nhap_chung_cat  →  16 bản nháp, đủ nội dung
GET /api/nhap-chung-cat            →  ĐÃ CÓ (list + chi tiết + duyệt/sửa/bỏ)
```

Kết quả tồn tại và API đọc được. Ba chỗ đứt:

| # | đứt ở đâu | hệ quả người dùng thấy |
|---|---|---|
| ① | việc `xong` **không mang** con trỏ nào tới bản nháp | bấm vào việc xong là ngõ cụt |
| ② | danh sách nháp **không có trường nguồn** | không dựng nổi link "bài gốc" |
| ③ | **không màn nào** hiện bản nháp (`/chung-cat/nhap/` chưa từng tồn tại) | link `xem bản nháp ›` tôi viết ở `T03-108` trỏ vào hư không |

③ là lỗi của tôi ở lượt trước: tôi viết một link tới một màn chưa có và không
kiểm nó mở được.

## Sửa

**① Việc mang con trỏ.** `worker` ghi `ket_qua: {nhap_id, citations}` vào file
việc **trước** `dong_viec`. Chỉ CON TRỎ, không nhân đôi nội dung: bản nháp sống
ở bảng của LÕI (`M12-R2` — M12 không sở hữu trạng thái duyệt), và hai bản của
một thứ thì một bản sẽ mục. Chiều `việc → kết quả` là chiều người dùng đi, nên
nó phải trả lời được mà không quét cả bảng nháp tìm bản khớp slug.

**② Danh sách nháp mang nguồn.** `loiLietKeNhap` đọc thêm `ban_goc_ai` và rút
`nguon` · `slug_nhap` · `model_da_dung` · cặp citations từ frontmatter, rồi
**không trả** `ban_goc_ai` ra. Rút ở server chứ không để FE gọi từng bản: 50 bản
nháp = 50 request, mỗi request kéo nguyên bài chỉ để lấy một dòng `nguon:`. Và
danh sách là danh sách — trả cả bài cho 50 dòng là vài trăm KB cho một màn tóm
tắt.

**③ Mục KẾT QUẢ ngay trên `/chung-cat/`.** Đúng chỗ chủ dự án chỉ, và một màn
riêng thì cần một dòng `man-hinh.json` + markup trong shell — mà shell đi theo
MỌI trang, còn trần HTML trang chủ đang âm.

Mỗi dòng hai lối, cả hai trả lời một câu hỏi thật:

```
xem bản nháp  → nội dung model sinh ra, mở trong panel nổi (dùng lại #cc-hv)
bài gốc ›     → /tai-lieu/?tim=<slug>, bản ghi đã chưng cất, để đối chiếu
```

Link "bài gốc" dùng phép LỌC vì dự án **không có** deep-link "mở đúng bản ghi".
Lọc là cách trung thực nhất: nó đưa đúng tới bản ghi mà không giả vờ có một
tính năng chưa tồn tại.

Thân bản nháp đổ bằng `textContent`, KHÔNG `innerHTML`: nội dung do MODEL sinh
ra là dữ liệu không tin được, và đổ nó thành DOM là mở một đường XSS ngay trong
màn quản lý.

## Đo sau sửa (hệ thật)

```
GET /api/nhap-chung-cat  →  tổng 16
  5f4105f914 | nguồn: tai-lieu/linux-foundation | gemini-2.5-flash-lite | 1/1
FE  →  16 bản nháp · link "bài gốc" = /tai-lieu/?tim=linux-foundation
       bấm một dòng ⇒ panel "Bản nháp" hiện nội dung
việc mới  →  ket_qua.nhap_id đã ghi (f073b3b6a0 → d72535a1f7)
```

## Một lỗi tôi gây ra trên đường

`tomTatNhap` bản đầu viết regex trong CHUỖI đơn: `'[\\s\\S]'` trong chuỗi JS là
`[sS]` — lớp ký tự khớp chữ *s/S* thay vì mọi khoảng trắng, nên hàm trả `null`
cho MỌI trường mà không ném gì. Bắt được vì tôi chạy thử hàm trên một mẫu thật
trước khi đấu vào API; nếu chỉ đọc mã thì nó xanh.

## Vế đỏ còn lại — không phải của đơn vị này

`trang chủ 61981/61440` — hai chip `md`/`txt` của `T03-111` (phiên khác) trên
một trần vốn chỉ còn 7 byte. Đã quy chủ bằng phép đo và ghi backlog M03 ở
`WO-051`; không tự xoá dòng của họ, không tự nới trần.

· object: `chungcat/src/worker.py` · `chungcat/src/vong.py`
  · `web/api/dungchung.mjs` · `web/plugins/chungcat/src/chungcat.inline.ts`
