# WO-050 — việc bỏ rơi nhận lại được · dọn hết nợ nhật ký

- **mở/đóng**: 2026-09-05 · **loại**: bug vận hành + nợ hạ tầng
- **module**: M12_chungcat + M03_web + M01_core · **trạng thái**: XONG, 31/31 cổng xanh

Chỉ đạo: *"còn nợ gì thì fix luôn, tôi cần done task gấp để tôi tự test tay"*.

## §1 · VIỆC BỎ RƠI — lease + nhịp tim  ✅

`cur/` nghĩa là *"đã lấy ra xử lý"*. Trước bản này, worker chết giữa việc thì
việc ở lại đó **vĩnh viễn**: không ai nhận lại, không ai báo. Đo được ở
`WO-048 §2`: `cur/` 13 việc · KPI *"ĐANG CHẠY 6"* · **0 tiến trình** giữ việc nào.

**Lease.** `nhan_viec()` chiếm việc xong đóng dấu `nhan_luc` + `nhan_pid`. Cạn
`new/` thì nó tìm trong `cur/` một việc có `nhan_luc` quá `HAN_TREO_GIAY` và
nhận lại. `nhan_pid` chỉ để ĐỌC lúc tìm lỗi — **không** dùng làm phép kiểm
còn-sống, vì pid được OS cấp lại và một pid trùng sẽ nói "còn sống" cho một
việc đã chết.

**Nhịp tim.** `dat_giai_doan` chạm `nhan_luc` mỗi lần đổi giai đoạn, nên 30
phút là trần cho MỘT GIAI ĐOẠN, không cho cả việc — một job ASR hai tiếng vẫn
an toàn miễn nó còn tiến triển.

**30 phút, và đánh đổi phải nói ra:**

| lease | hậu quả |
|---|---|
| quá NGẮN | cướp việc đang chạy thật ⇒ HAI worker gửi cho MỘT việc ⇒ tiền tiêu đôi, và `M12-R6` (trần 2 lần gửi) bị lách vì mỗi worker đếm riêng. **Chiều đắt.** |
| quá DÀI | việc chết chờ lâu mới nhận lại. Chỉ tốn thời gian. |

⇒ Nghiêng về DÀI.

**Cuộc đua còn lại, khai ra chứ không che:** phép nhận-lại KHÔNG nguyên tử theo
nghĩa của `rename` (việc đã ở `cur/` rồi, phép chiếm là ghi `nhan_luc` mới).
Hai worker cùng đọc một việc quá hạn thì cả hai có thể ghi. Cửa sổ đua là một
lần đọc-ghi file (~ms) trên một việc đã đứng ≥30 phút, nên xác suất thực tế rất
thấp — và phép chặn **thiệt hại** là `M12-R6`, đếm trong chính file việc.

**Đo trên hệ thật sau khi bật lại:**

```
trước:  new 0 · cur 11 · done  4        ← 11 việc đứng vĩnh viễn
sau:    new 0 · cur  1 · done 16        ← worker nhận lại và chạy hết
```

## §2 · KPI NÓI THẬT — ba trạng thái, không hai  ✅

`ccDangChay` cũ đếm `giai_doan === "cho"` là "đang chạy". Nay:

```
CHỜ       chưa ai chiếm, HOẶC đã bỏ rơi   → !dang_giu && chưa kết thúc
ĐANG CHẠY có worker đang giữ THẬT         → dang_giu === true
XONG/DỪNG kết thúc                        → giai_doan
```

`dang_giu` do **THỢ** tính từ lease (`vong.con_giu`), không do FE đoán: FE không
biết worker nào còn sống, và một phép đoán ở đây là đúng cái vừa nói sai.

`dang_giu` là **cột THÊM**, không sửa `giai_doan`: `giai_doan` là trạng thái
công việc (*"đã tới đâu"*), `dang_giu` là trạng thái vận hành (*"có ai đang
làm"*). Nhập hai thứ vào một cột là mất một trong hai, và cái mất sẽ là cái
người ta cần lúc đang tìm lỗi.

Ô **`chờ`** hiện riêng, có cảnh báo khi > 0 — việc chờ mà không worker nào chạy
là tình huống cần người biết.

`CHỜ` gộp cả việc bỏ rơi: với người dùng thì *"chưa ai làm"* và *"có người nhận
rồi chết"* là cùng một tình huống. Phân biệt hai cái đó là việc của nhật ký.

## §3 · `check_frozen.py` — cổng ĐỎ OAN, đã sửa  ✅

Nó in tiếng Việt ra `cp1252` của console Windows ⇒ `UnicodeEncodeError` **sau
khi** đã kết luận XANH, và vỏ nhận **exit 1**. Cổng nói ĐỎ trong khi vật XANH,
và nó chặn đúng cái gate NGƯỜI phải ký.

Sửa trong chính script (`reconfigure(encoding="utf-8", errors="replace")`), KHÔNG
bắt người gõ `PYTHONIOENCODING=utf-8`: một cổng chỉ đúng khi gọi kèm một biến
môi trường là cổng sẽ đỏ oan lần đầu ai đó quên — kể cả CI.

**Đo:** `./.venv/Scripts/python.exe core/tests/check_frozen.py` (không biến nào)
⇒ **exit 0**. Trước sửa: exit 1.

## §4 · XOAY FILE nhật ký  ✅

`TRAN_BYTE = 8 MB` ⇒ `x.jsonl` → `x.jsonl.1`, ghi đè bản `.1` cũ.

**MỘT bản `.1`, không phải `.1 .2 .3 …`**: bản `.1` trả lời câu hỏi thật
(*"chuyện gì xảy ra trước lúc nó hỏng"*), còn giữ mười bản là giữ dữ liệu không
ai đọc rồi phải viết thêm luật xoá.

Kiểm trần bằng `tell()` trên handle đang mở, không `stat()` mỗi dòng — `stat()`
là một lần đi đĩa trên đường NÓNG. Cộng một lần kiểm lúc MỞ, cho tiến trình vừa
khởi động gặp file đã quá trần từ lần chạy trước.

`xem_nhat_ky.py` đọc **cả** `*.jsonl.1`: nó chứa đúng đoạn người ta đi tìm, và
bỏ nó là bỏ nửa dữ liệu ngay lúc cần nhất.

## §5 · Dọn rác

12 file rác trong `log/` đã xoá (`thu.jsonl` của một lần tôi thử tay, các bản
`.co-lan-test`/`.truoc-fix`). `log/` giờ chỉ có nhật ký của lần chạy hiện tại.

## Đo cuối

```
31/31 cổng M12 XANH        (+ check_viec_bo_roi.py, + check_nhat_ky.py)
49 passed                  pytest core/tests
npm test exit 0            web
new 0 · cur 1 · done 16    hàng đợi repo, sau khi nhận lại
dang_giu có trong /api/job: true
```

## CÒN LẠI — không phải nợ của WO này, nhưng phải nói

- **Trần HTML trang chủ 61433/61440 — 7 byte.** Ô/chip mới nào cũng vỡ nó. Đây
  là ngưỡng THẬT đang chặn mọi việc FE, không phải `gn.js`.
- **`FR-062` và `FR-063` chờ chủ dự án ký** — mã đã xanh, chờ xác nhận ba chỗ
  hợp đồng (đáng chú ý nhất: quyết 2 chỏi `FR-052`, tôi đã chọn nghĩa hẹp).
- **`check_g6b` 30 lỗi** toàn dự án (`T08-16`/`T09-8` khai PATCH mà là BUILD) —
  thuộc M08/M09, ngoài mọi đơn vị của phiên này.
- **Transcript** chờ bạn chọn: nạp ví (~217đ/audio) hoặc
  `pip install "./chungcat[asr]"` (0đ, 0 egress).

· object: `chungcat/src/vong.py` · `chungcat/src/nhat_ky.py` ·
  `chungcat/tools/xem_nhat_ky.py` · `chungcat/tests/check_viec_bo_roi.py` ·
  `chungcat/tests/check_nhat_ky.py` · `core/tests/check_frozen.py` ·
  `web/plugins/chungcat/src/chungcat.inline.ts`
