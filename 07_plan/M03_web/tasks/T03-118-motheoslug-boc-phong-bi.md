# T03-118 — BUG: `moTheoSlug` đưa nguyên phong bì API vào `mo()` — cửa sổ rỗng

> Chủ dự án bắt 2026-09-06 (2 triệu chứng, MỘT gốc): (1) "Xem bài gốc" mở cửa
> sổ trống; (2) bấm dòng `xong` trong tab Chưng cất → "Bản này không có thân
> bài" — trong khi /bai-viet/ xem cùng bài bình thường.
> ĐO: API `GET /api/articles/<type>/<slug>` trả **200** với hình
> `{frontmatter, body, etag}` (curl kiểm cả bài chưng cất lẫn bài gốc video);
> `moTheoSlug` (multiwindow.inline.ts:1655-1660) `mo(await r.json())` — trong
> khi `mo()` chờ bản PHẲNG như đường SSR. Sai chỗ BÓC, không sai API.

## Sửa

- `moTheoSlug`: bóc phong bì → dựng bản phẳng đúng hình `mo()` dùng
  (spread frontmatter + `than: body` + `slug` từ tham số) — MỘT chỗ, dùng
  chung cho mọi người gọi (act=goc · act=ban-cc · dòng xong của cctab).
- Đối chiếu hình với đường SSR (data.mjs) — hai đường phải ra CÙNG bản phẳng;
  lệch tên trường nào ghi chú tại chỗ.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # moTheoSlug bóc phong bì
# vế cổng thuộc đơn vị test đi kèm (tab-theo-doi-chung-cat + chung-cat-ui mở rộng CÙNG LƯỢT) — R1

verifiability: hard
tiêu_chí:
  - AC1: mở theo slug (mock API trả {frontmatter, body}) ⇒ cửa sổ có THÂN
      (chữ của body xuất hiện), tiêu đề + ngày đúng frontmatter
    cmd: node web/test/tab-theo-doi-chung-cat.test.js
    đỏ_khi: thân trống hoặc "Bản này không có thân bài" với body ≠ rỗng
    xanh_khi: thân hiện
  - AC2: "Xem bài gốc" từ bài chưng cất mở đúng bản ghi nguon[0] có thân;
      nguồn đã xoá ⇒ câu "không còn trong kho" (giữ hành vi cũ)
    cmd: node web/test/chung-cat-ui.test.js
  - AC3: suite web xanh
    cmd: cd web && npm test
