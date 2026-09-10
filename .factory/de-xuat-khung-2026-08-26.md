# Đề xuất khung Factory — 5 yêu cầu, đo từ một phiên thật

**Nguồn**: một phiên s8 trên Grown_news, hai AI song song một working tree.
Bằng chứng ở `WL-01K9KKNUTBIENTAP` (bug + răng), `WL-01K9M7KIEMTOANDB` (kiểm toán
FR-034), `06_modules/M0{3,8}_*/backlog.md`.

**Không đề xuất lại**: field `đỏ_khi:` vừa thêm đã phủ đúng lớp lỗi tôi trúng bốn
lần trong phiên này — `ok(da_chen > 0 or True, …)`, `\b` thành byte 0x08 làm regex
không bao giờ khớp, `if (co) {…}` không có `else`, `\n` qua heredoc thành newline
thật. Cả bốn đều là "cổng không bao giờ đỏ", và `đỏ_khi` bắt cả bốn. Nó là bổ sung
đúng chỗ.

Năm mục dưới đây là những chỗ `đỏ_khi` **không** với tới.

---

## P1 · `xanh_khi:` — cặp còn thiếu của `đỏ_khi:`

```yaml
vi_phạm:  Cổng khai `đỏ_khi` mà không khai một đầu vào HỢP LỆ nó phải exit 0 trên đó.
bề_mặt:   S3
lệnh:     <rule-surface-check>  — chạy BA lượt, không phải hai
đỏ_khi:   một rule có `đỏ_khi` nhưng thiếu `xanh_khi`
why:      cases.md#cổng-đỏ-oan
```

`đỏ_khi` chứng minh cổng **đỏ được**. Nó không chứng minh cổng **không đỏ oan**. Và
khung đã tự viết ra hệ quả ở chỗ khác: *một phép kiểm đỏ oan là một phép kiểm sẽ bị
tắt.* Nêu hậu quả mà không có field để chặn thì hậu quả vẫn xảy ra.

Ba ca đo được trong **một** phiên, cả ba đều là "cửa sổ đo rộng hơn chủ thể":

| Cổng | Đỏ oan vì |
|---|---|
`nut-song §6a` bản đầu | đếm slug trùng theo **cả trang** ⇒ đỏ 5 trang, trong khi cùng một bài xuất hiện ở `#grid` (nổi bật) *và* `#grid2` (lưới đầy) là **đúng thiết kế**. Sửa: đo theo từng mount |
`man-danh-muc §6a` | khớp chính **comment của tôi** chứa chữ "đang dùng" |
`page-weight` | đếm `.slice(0, 7)` nằm trong một **comment** |

Nghi thức đề nghị:

```
lượt 1  repo sạch    ⇒ exit 0
lượt 2  đỏ_khi       ⇒ exit ≠ 0
lượt 3  xanh_khi     ⇒ exit 0
```

`xanh_khi` **không được là repo sạch** — repo sạch là ca dễ, và nó đã là lượt 1. Nó
phải là fixture riêng chứa đúng cấu hình **hợp lệ dễ bị nhầm nhất**: cùng một bài ở
hai mount, một comment nói đúng thứ mà regex đang tìm, một chuỗi escape hợp lệ.

---

## P2 · Cổng phải đọc đúng hiện vật mà PRODUCTION đọc

```yaml
vi_phạm:  Cổng đo một file/đường mà hệ thống chạy thật không dùng.
bề_mặt:   S3
lệnh:     <mutation trên ĐƯỜNG PRODUCTION> && <cổng phải exit ≠ 0>
đỏ_khi:   cổng vẫn exit 0 sau khi thứ nó khai là đang đo đã bị phá
why:      cases.md#hiện-vật-chết
```

`đỏ_khi` không bắt được lớp này: fixture làm cổng đỏ đúng như khai, mà cổng vẫn đang
soi một file **không ai đọc nữa**. Cổng xanh, hệ thống hỏng, không ai đỏ.

Đo được: hai test của tôi đọc `web/site/gn.js`. FR-034 chuyển sang SSR, ghép bundle từ
`plugins/*/src/**/*.inline.js` **lúc nạp module**. `site/gn.js` thành hiện vật chết —
mtime 14:13 trong khi nguồn 15:33 — và `/gn.js` server trả về khớp **từng byte** với
hiện vật đó, tức server phục vụ kiến trúc đã bị bỏ.

Bài học về *nghi thức*, không chỉ về rule: tôi chạy thí nghiệm này **hai lần**. Lần
đầu tôi phá một dòng mà chỉ **một** trong hai cổng kiểm, thấy cổng kia xanh, và kết
luận sai rằng nó mất răng. Nên câu chốt phải là: **phá đúng thứ mà CHÍNH cổng đó khai
là đang đo** — không phá một thứ cạnh đó rồi suy diễn.

Hệ quả cho ngữ pháp: `đỏ_khi` của một cổng nên là **một phép biến đổi trên đường
production**, không phải một fixture đặt cạnh nó. Fixture cạnh chứng minh cổng biết
đọc; mutation trên đường thật chứng minh cổng đang canh đúng cửa.

---

## P3 · Khung phải tuân ngữ pháp bốn field cho artifact CỦA CHÍNH NÓ

```yaml
vi_phạm:  Một skill của khung kê ra cơ chế ("gate không đóng khi…", "reviewer đối
          chiếu…", "đếm được từ…") mà không kèm `lệnh:` chạy được + `đỏ_khi:`.
bề_mặt:   S3
lệnh:     <rule-surface-check> quét CẢ rule của khung, không chỉ rules.md dự án
đỏ_khi:   một câu "gate không đóng khi…" không trỏ tới lệnh nào có thật
why:      cases.md#rule-trang-trí  (cùng gốc, khác đối tượng)
```

Field `lệnh:` sinh ra vì *"khai S3 là rẻ, viết script thì không"*. Cùng câu đó áp cho
chính khung. Ba chỗ đo được trong một kho **đã** áp dụng khung:

**a · `backlog.md`** — skill viết *"Gate không đóng khi còn `[ ]`"*. Tôi grep 14 cổng
Python + CI + Makefile: **0** chỗ biết đến `backlog`. Lỗ khung tự khai (*"xoá file thì
qua mặt được gate"*) có lệnh vá — `git log --diff-filter=D --name-only` — nhưng nó nằm
trong **văn bản** của `m-review` bước 5, không nằm trong lệnh nào chạy được.

**b · `.factory/worklog/`** — luật 2 viết *"Không `object` = không phải trace"*, và R6
dựa vào việc reviewer đối chiếu `object` với git. `check_worklog.py` **không**
`import yaml`, không parse, không kiểm `object`. Tôi làm hỏng YAML worklog **ba lần**
trong phiên này (trộn sequence với mapping; giá trị chứa `: ` không quote) — cổng vẫn
xanh cả ba lần. Trong khi `project_map.yaml` được **ba** cổng `safe_load`. Đúng file mà
R6 tựa vào lại là file duy nhất không ai parse.

**c · R4** — nay khai *"đếm được từ `.factory/rule-fire/<nhánh>.jsonl`"*. Thư mục đó
**không tồn tại** trong kho này. R4 đang đếm rỗng, và không cổng nào nói ra điều đó.

Ba ca này không phải lỗi của dự án — dự án làm theo tài liệu. Chúng là dấu hiệu khung
đang áp một chuẩn cho rule dự án mà chưa áp cho chính mình.

---

## P4 · Không tập nào được gõ tay hai lần (ứng viên R7)

```yaml
vi_phạm:  Cùng một tập giá trị tồn tại ở ≥2 nơi mà không nơi nào DẪN XUẤT từ nơi kia.
bề_mặt:   S3
lệnh:     thêm một phần tử vào NGUỒN, đòi mọi nơi khác đổi theo
đỏ_khi:   thêm vào nguồn mà một nơi khác không đổi ⇒ nơi đó đang gõ tay
why:      cases.md#tập-gõ-tay-lạc-hậu
```

Đây là lớp lỗi tôi trúng **năm lần** trong dự án này, mỗi lần một hình dạng khác:

| Tập | Nằm ở |
|---|---|
6 loại nguồn | `CHECK source_type IN (…)` trong DDL · `enum` trong **hai** bản `frontmatter.schema.json` · `LOAI` trong API — **bốn** nơi |
danh sách file test | chuỗi `npm test` là `&&` gõ tay 43 tên. File test tôi vừa viết sinh ra **ngoài** nó: xanh khi chạy riêng, `npm test` không hề gọi. **Một phép kiểm không ai chạy là một phép kiểm không tồn tại** — tôi phải tự viết meta-test để bắt |
ma trận chuyển trạng thái | từng gõ tay 16 cặp; sửa thành đọc `BANG_CHUYEN` từ nguồn |
allow-list `renameSync` | đếm **số lần** thay vì đếm **hàm** ⇒ bớt một chỗ, thêm một chỗ thì tổng vẫn khớp |
nút chân cửa sổ | `f[0]`, `f[1]` — chỉ số **theo vị trí** vào một cấu trúc DOM đổi được; sau khi tôi tách hai hàng, `f[0]` thành nút **Loại** và dòng đó tự khoá nút người dùng cần |

Hai dòng cuối cho thấy tập gõ tay không chỉ là *danh sách*: một **chỉ số theo vị trí**
cũng là một tập gõ tay, và nó lạc hậu im lặng hơn nữa vì trông không giống danh sách.

`đỏ_khi` tự nhiên của rule này rất rẻ: thêm một phần tử vào nguồn rồi đòi mọi nơi khác
đổi theo. Không đổi ⇒ nơi đó đang gõ tay.

---

## P5 · Đỏ chưa phải phán quyết khi chưa quy được chủ

```yaml
vi_phạm:  Phán về một đơn vị việc dựa trên máy đỏ, trong khi cây làm việc đang bị
          một tác nhân KHÁC sửa.
bề_mặt:   S4
lệnh:     git status + mtime các file đỏ, đối chiếu mốc sửa của chính mình
đỏ_khi:   một file trong đường đỏ có mtime sau lần ghi cuối của đơn vị việc này
why:      cases.md#đỏ-của-người-khác
```

Khung khai *"một đơn vị việc = một nhánh"* là **điều kiện áp dụng**, và nói đúng hệ
quả khi vi phạm: *R1·R3·R4 mất địa chỉ*. Nhưng không có bộ dò nào cho biết điều kiện
đó **đang** bị vi phạm — nên phần "bộ máy chỉ không đo được" trở thành "bộ máy đo ra
số sai mà không ai biết".

Đo được, hai AI cùng một working tree, không nhánh riêng:

```
14:16  tôi đo 9 test đỏ
       6 trong đó: validate.py bị agent kia sửa 14:09
       3 trong đó: schema họ sửa 13:52–13:53
16:23  họ đóng xong  →  45/45 xanh
```

Tôi quy được chủ **chỉ vì** đã chạy `find core kb -newermt` và đối chiếu mtime với mốc
ghi cuối của mình. Không có bước đó thì bản báo cáo của tôi sẽ nói "kho đang đỏ 9 chỗ"
— đúng về số, sai về nghĩa, và tố cáo oan một bên khác.

Đề nghị: một nhịp trước khi phán trong skill `factory`, và một dòng **bắt buộc** trong
worklog khi báo đỏ: *đỏ do ai*. Kèm một câu vào `cases.md`: **đỏ oan cho người khác
đắt hơn đỏ oan cho mình** — nó phá thứ R6 tồn tại để bảo vệ, là tính bất đối xứng của
người chấm.

---

## Nếu chỉ làm một mục

**P3**, và trong P3 làm **b** trước: thêm `yaml.safe_load` + kiểm `object:` vào
`check_worklog.py`. Khoảng năm dòng, `đỏ_khi` có sẵn (một worklog thiếu `object`), và
nó vá đúng chỗ R6 đang tựa vào. Ba lần YAML hỏng trong một phiên là tần suất đủ để
biết nó sẽ hỏng lần thứ tư.

Rẻ thứ hai là **P1** — thêm một field và một lượt chạy, không cần cơ chế mới.