# M10_tailieu — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
là *một màn*, *một luật DDL*, hoặc *một cổng của form*, và cả ba viết được thành
đỏ trước.

Bốn chỗ áp riêng — **không** phải bước mới:

**① PHÂN TÍCH — đọc `kho.schema.sql` để lấy TÊN BẢNG, không đọc spec.**
`spec.md` viết `documents` và `articles`; bảng thật là `tai_lieu` và `bai_viet`
(`testcases.md §cuối` mục 2). Một người tin spec sẽ viết `INSERT INTO documents`
và gặp lỗi runtime.

**② PLAN — mỗi màn mới phải sửa BẢY nơi**, và bỏ nơi thứ sáu là lỗ **im lặng**:

```
core/assets/man-hinh.json         bảng khai (VIEW_SSR + MAN + DUONG dẫn xuất từ đây)
web/render/shell.html
web/plugins/home-pages/shell.html (byte-identical với trên)
web/render/trang.mjs              bảng MAN
web/server.mjs                    VIEW_SSR
multiwindow.inline.ts             DUONG
web/test/_render.mjs  VIEWS   ← quên nơi này ⇒ màn mới VÔ HÌNH với 7 test quét-mọi-trang
web/styles/prototype.css          luật cho class mới + icon mask cho tab
```

**③ MÔ PHỎNG — ba bảng, ba lần gieo.** `AC-2.2.1` chỉ có nghĩa nếu gieo **cả**
bài viết **và** video: gieo một loại thôi thì một bộ lọc sai (`!= 'video'`) vẫn
xanh. Và mọi ca DDL chạy trên **bản sao** DB.

**④ CODE — nút CRUD phải bắt TRƯỚC `bam():638`.** Dòng đó có
`const win = t.closest(".bk"); if (!win) return` ⇒ **mọi `data-act` bắt buộc nằm
trong `.bk`**. Nút trên màn danh sách không nằm trong `.bk`, nên nó phải theo
khuôn `data-suanhan`/`data-xoanhan` mà màn Danh mục đã dùng (`:622`, `:629`).

## Ngân sách là ràng buộc CỨNG, không phải khuyến nghị

```
gn.js   102395 / 102400 byte   ← dư 5
gn.css   ~92 / 100 KB
```

Lựa chọn khi hết chỗ là **siết một khối cũ** hoặc **tách bundle** — **không** nới
trần. Repo có tiền lệ *"SIẾT, không nới"* (`page-weight.test.js:85-89`), và nới
một tripwire đang sát ngưỡng là bỏ nó.

⇒ Đo lại **sau mỗi** `node build-fe.mjs`, không đo một lần ở cuối.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| SQL | **M08** — mọi mutation qua `dungchung.mjs` (M08-R2, `api-guard` răng 2). Đã đỏ thật một lần: cách đúng là **dời mã**, không nới cổng |
| byte hiện vật · `sha256` · trần 25 MB | **M09** — M10 chỉ là giao diện; byte đi trước, bản ghi đi sau (M09 §2.3) |
| bảng `video` | **M11** — cùng hồ sơ `thu-vien`, **khác thứ bắt buộc** (`media` vs `url_normalized`) |
| màn Kho · Tổng hợp | **M03** — hai màn **duy nhất** được trộn ba loại |
| `priority` | luôn **0** cho tài liệu ⇒ ra khỏi ba pane chất lượng (M09-R4) |
