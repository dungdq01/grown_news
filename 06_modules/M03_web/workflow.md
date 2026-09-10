# M03_web — workflow

**Dùng trình tự chuẩn** (PHÂN TÍCH → PLAN → MÔ PHỎNG → CODE) — vì mỗi đơn vị việc
là *một màn*, *một hành vi FE*, hoặc *một luật thị giác*, và cả ba viết được thành
đỏ trước.

Nhưng M03 là module lớn nhất (29 AC · 22 lệnh · 85 file test), và bốn ràng buộc
dưới đây **không suy ra được** từ trình tự chuẩn.

## ① Thêm một màn: BẢY nơi, và một khe DUY NHẤT

```
core/assets/man-hinh.json          bảng khai — VIEW_SSR + MAN + DUONG dẫn xuất từ đây
web/render/shell.html
web/plugins/home-pages/shell.html  byte-identical với trên
web/render/trang.mjs               bảng MAN
web/server.mjs                     VIEW_SSR
multiwindow.inline.ts              DUONG
web/test/_render.mjs  VIEWS   ← QUÊN NƠI NÀY ⇒ màn mới VÔ HÌNH với 7 test quét-mọi-trang
web/styles/prototype.css           luật class mới + icon mask cho tab
```

**Khe chèn view bị kẹp hai đầu:**

```
trang-chu-layout.test.js:200   slice(indexOf('v-home'), indexOf('v-all'))
                               ⇒ KHÔNG chèn giữa v-home và v-all (7 phép ===3/9/4 sai)
catNap()  trang.mjs:247        cắt từ id="v-nap" tới </main>
                               ⇒ KHÔNG đặt sau v-nap (màn bị cắt IM LẶNG khỏi 4 trang kia)
⇒ khe hợp lệ: SAU v-all, TRƯỚC v-nap.  Đúng một.
```

Và **bảng khai chỉ được chứa màn ĐÃ DỰNG** (plan `S18`): `server.mjs` dẫn xuất
`VIEW_SSR` từ nó, nên khai một màn chưa làm ⇒ **500 thật** trên URL đó. Không dùng
cờ `da_dung: false` — thứ phải nhớ lật sẽ có ngày không được lật.

## ② `data-nav` PHẢI thuần `[a-z]` — không gạch nối

Hai regex `rail-trai.test.js:137` và `:167` bắt `data-nav="[a-z]+"`. Tên
`bai-viet`/`tai-lieu` **không khớp** ⇒ nhãn mới lặng lẽ **ra khỏi phép đo**, và
`soTab >= 4` (`:172`) **tụt rồi đỏ** (plan `S1`). Dùng `tonghop` · `baiviet` ·
`tailieu` · `video`. *(Path URL vẫn được có gạch nối — chỉ `data-nav` bị ràng.)*

Và **thuộc tính thứ ba** trên thẻ nút làm đứt một trong hai regex, **im lặng** ⇒
nhóm tab khai ở thẻ bao `.tbg`, không nhét vào `<button>` (plan `S21`).

## ③ Ngân sách là ràng buộc CỨNG

```
gn.js   102395 / 102400 byte   ← dư 5
gn.css   ~92 / 100 KB
chữ phụ trợ  ≤ 480 ký tự/trang  (chu-giao-dien.test.js:196)
```

Hết chỗ ⇒ **siết** hoặc **tách bundle**, **không nới trần**. Tiền lệ
`page-weight.test.js:85-89` viết thẳng *"SIẾT, không nới"*.

⚠️ Chữ phụ trợ cộng dồn: **mọi màn ở cùng tài liệu**, nên chữ của một màn mới tiêu
ngân sách của **từng** trang. Đo lại sau **mỗi** `node build-fe.mjs`.

## ④ Đo HÀNH VI, không đo markup — bốn bug đã trả giá

| bug | vì sao markup xanh | thứ bắt được nó |
|---|---|---|
`#acount` 16→20 | markup đúng; `locThe` đếm `.cd:not(.off)` **toàn trang** thay vì trong lưới | đếm theo **lưới** |
`#f-bai` luôn hiện | `[hidden]` có trong markup; `.api-only{display:block}` (0,2,1) **thắng** (0,1,0) | đọc `display` **đã tính** |
bốn nút biên tập chết | mọi test gọi API bằng đường **tự gõ đúng** | đọc đường **FE dựng** |
`cur`/`muc` lẫn nghĩa | bài một bản + mục 1 ⇒ hai nghĩa **TRÙNG** ⇒ thử tay xanh | cuộn tới mục ≥2 rồi bấm |

Luật rút ra: **một phép đo phải cắt đúng phạm vi mà nhãn của nó nói về.** Ba phép
đo khác đã lấy sai phạm vi vì đúng chuyện này (plan `S20`), và một trong ba đỏ
oan vì một **bình luận** chứa literal `id="v-nap"`.

## Thứ tự trong công thức gộp là một phần của luật

```
lọc `approved`  →  gộp theo url_normalized  →  sắp giảm dần theo max(priority trong nhóm)
```

Đảo hai bước đầu: một bản `draft` **kéo** bản `approved` cùng nguồn lên site. Cả
hai thứ tự cho ra một danh sách **trông đúng**, nên phép thử phải gieo đúng ca đó.

## Không thuộc module này

| Việc | Đi đâu |
|---|---|
| `web/api/**` | **M08** (FR-011) — M03 sở hữu `web/**` **trừ** chỗ đó |
| kho | chỉ **đọc** qua `khoDoc()` — FE + module render **RỖNG** với kho (B-C3) |
| `tokens.css` | **s5 sở hữu**, M03 chỉ *dùng*; `tokens.css` **thắng mọi tài liệu** |
| công thức `priority` | **M06 §3** — M03 chỉ đọc để sắp |
| màn `/tai-lieu/` · `/video/` | **M10** · **M11** — nhưng **shell** và bảng khai màn thuộc M03 |
| `*.v<n>.md` không lên web | AC ở **đây** (M02 `AC-2.5.1` tự khai *"chủ AC là M03"*) — ⚠️ và lệnh của nó **chưa tồn tại** |
