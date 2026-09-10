# T03-68 — WO-030: đọc danh mục không phụ thuộc mốc màn khác (đơn vị TEST)

> Thêm §5 vào `web/test/moc-fe-con-that.test.js`. ĐỎ trước (R5).
>
> **§5 tự chứng minh tiền đề trước khi kết luận**: render `/khai-niem/` rồi đòi
> đúng **0** mốc `[data-dm]` — nhưng **vẫn có** `#cb` · `#cchua` · `#catlist`. Nếu
> tiền đề đó sai thì §5 đang đo một thế giới khác, và nó nói ra điều ấy.
>
> Rồi hai vế hành vi: `napLoaiDanhMuc` không được có `if (!moc.length) return`, và
> `napMotDanhMuc` phải fetch trước chứ không bỏ cuộc vì thiếu mốc.

phạm_vi_ghi:
  - web/test/moc-fe-con-that.test.js
  - web/test/WORKLOG.md

verifiability: hard
tiêu_chí:
  - AC1: cổng ĐỎ trên mã hiện tại
    cmd: cd web && node test/moc-fe-con-that.test.js; test $? -ne 0
  - AC2: sau T03-69 XANH
    cmd: cd web && node test/moc-fe-con-that.test.js
