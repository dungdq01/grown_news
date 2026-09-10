# T03-100 — cổng ĐỎ-TRƯỚC phải CÓ CHỦ, không phải phải-nằm-trong-`npm test`

> **Chủ dự án duyệt 2026-09-03**: *"tìm phương án phù hợp đi"* cho ô nợ M08
> *"npm test KHÔNG THỂ xanh khi tồn tại một cổng đỏ-trước"*.
>
> Đơn vị TEST (R1: chỉ đơn vị test chạm `web/test/**`).

## Luật chỏi luật — nói lại cho gọn

```
R5                     cổng phải TỒN TẠI và ĐỎ trước khi có mã
nut-song.test.js §5    mọi file test phải nằm trong chuỗi `npm test`
```

Cổng đỏ-trước mà đăng ký ⇒ `npm test` đỏ. Không đăng ký ⇒ §5 đỏ.
**Không nước đi nào xanh.** Đã vướng hai lần trong một ngày, hai tác nhân khác
nhau: `cai-dat.test.js` (T08-17, 02:57) và `chung-cat-ui.test.js` (T03-92).

## Phương án — đổi CÂU HỎI của §5

§5 đang hỏi *"file này có trong `npm test` không?"*. Câu đó trộn hai thứ khác
nhau vào một phép đo:

| bệnh thật | dấu hiệu |
|---|---|
| **cổng mồ côi** — ai đó viết một phép kiểm rồi bỏ đấy, không ai chạy, không ai nhận | file KHÔNG có trong `npm test` **và KHÔNG task nào khai nó** |
| **cổng đang chờ mã** — R5 làm đúng: cổng có trước, đỏ trước | file KHÔNG có trong `npm test` **nhưng CÓ task khai nó** |

⇒ §5 hỏi câu mới: **"file này có CHỦ không?"**

- có trong `npm test` ⇒ xanh, không cần gì thêm
- không có, nhưng **được một task file khai** ⇒ **CHỜ MÃ**, in ra danh sách mỗi
  lần chạy, KHÔNG đỏ
- không có và **không task nào khai** ⇒ **ĐỎ** — đó là cổng mồ côi thật

Sức bắt lỗi không mất: lớp *"tập gõ tay bị lạc hậu"* mà §5 sinh ra để bắt vẫn
bị bắt, vì một file không ai khai vẫn đỏ. Cái mất đi chỉ là phép phạt đánh vào
**R5 làm đúng**.

**Vì sao lấy chủ từ TASK FILE, không từ một marker trong chính file test:**
marker là chữ ai đó phải nhớ gõ, và nó sống **trong thứ bị đo** — bên bị đánh
giá tự khai mình có chủ (luật gốc). Task file là biên ngoài: nó đã là chỗ R1
đọc `phạm_vi_ghi`, đã do PM/người duyệt, và nếu task bị xoá thì cổng lập tức
thành mồ côi — đúng lúc nó thật sự mồ côi.

**Danh sách CHỜ MÃ phải IN RA, không được im.** Một ngoại lệ im lặng là một
ngoại lệ vĩnh viễn: sáu tháng sau không ai biết ba file kia chưa bao giờ chạy.
In ra thì mỗi lần suite chạy là một lần nhắc.

phạm_vi_ghi:
  - web/test/nut-song.test.js              # §5 — đổi câu hỏi

# KHÔNG chạm `web/test/cai-dat.test.js` hay `chung-cat-ui.test.js`: chúng là
# cổng của đơn vị khác. Phương án này CỐ Ý không cần sửa file của ai — chủ đã
# nằm trong task file của họ rồi.

verifiability: hard
tiêu_chí:
  - AC1: file KHÔNG trong `npm test` mà KHÔNG task nào khai ⇒ §5 ĐỎ
      (đo bằng fixture: tạo `web/test/_mo-coi-thu.test.js` ở thư mục TẠM thì
      không đo được §5 — nên đo bằng cách đọc mã: nhánh đỏ tồn tại và nó
      phân biệt hai ca)
    cmd: node web/test/nut-song.test.js
    đỏ_khi: mã §5 không còn nhánh nào exit khác 0 cho ca mồ côi
    xanh_khi: nut-song xanh, và §5 in ra danh sách CHỜ MÃ khác rỗng
  - AC2: `cai-dat.test.js` (T08-17 khai) và `chung-cat-ui.test.js` KHÔNG làm
      suite đỏ nữa, nhưng PHẢI xuất hiện trong danh sách CHỜ MÃ in ra
    cmd: 'node web/test/nut-song.test.js 2>&1 | grep -i "chờ mã"'
    đỏ_khi: grep không ra dòng nào — ngoại lệ đang im lặng
    xanh_khi: in ra tên từng file kèm task file đang nhận nó
  - AC3: suite web XANH HẲN — 0 lỗi
    cmd: cd web && npm test
    đỏ_khi: còn bất kỳ lỗi nào
    xanh_khi: exit 0

phụ_thuộc: T03-26
