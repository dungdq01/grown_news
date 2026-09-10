# FR-065 — cắt đoạn audio dài: `lan_gui` đang gộp hai nghĩa

trạng_thái: CHỦ DỰ ÁN ĐÃ QUYẾT — lối A (2026-09-05)
mở: 2026-09-05
đơn_vị: T12-21 (`WO-054`)
artifact_frozen: `06_modules/M12_chungcat/rules.md` — `M12-R6`

## Việc đã làm được mà KHÔNG cần FR này

Đường ASL lối `cua-asr` nay **chạy thật** (xem `T12-21`): nguồn 5 phút phiên âm
trọn vẹn, nguồn 19 phút phiên âm trọn vẹn ở lần gọi thành công. Năm lỗi thật đã
sửa, không lỗi nào cần nới luật.

FR này **chỉ** về phần còn lại: nguồn dài mà cửa không nuốt nổi trong MỘT lời gọi.

## Chỗ chặn

Cách sửa hiển nhiên là cắt nguồn thành đoạn ngắn rồi gửi từng đoạn. Nhưng:

> `M12-R6` — vi_phạm: *"**GỬI lần thứ 3 cho cùng một job**, hoặc một lần gửi
> không có dòng log sha256 riêng, hoặc chạy lại RESET bộ đếm gửi"*

Nguồn 60 phút cắt 5 phút = **12 lần gửi cho một job** ⇒ đỏ ngay.

## Hai cách đọc `M12-R6`, và vì sao tôi không tự chọn

| đọc | căn cứ trong chính rule | hệ quả |
|---|---|---|
| **A · trần THỬ LẠI** | `why` viết *"Một vòng retry 'cho chắc'…"*, và `đỏ_khi` mô tả *"giả lập model lỗi liên tục"* — cả hai đều nói về LẶP LẠI cùng một payload | 12 đoạn khác nhau không phải retry ⇒ cắt được |
| **B · trần SỐ LẦN RA** | `vi_phạm` viết thẳng *"gửi lần thứ 3"*, và `why` cũng viết *"trần cho số lần dữ liệu đi ra"* | 12 đoạn = 12 lần ra ⇒ phải chặn |

Chính `rules.md` chứa cả hai. Tôi không tự chọn một cách đọc rồi thi công: đó là
nới một luật frozen bằng cách diễn giải, và nó nới cho MỌI lối chứ không riêng
transcript.

## Đề xuất

Tách **hai bộ đếm**, đúng khuôn `FR-054 §1.5` đã làm với chữ *egress*:

- `lan_thu_lai` — trần **2**, không reset. Giữ nguyên nghĩa `M12-R6` bảo vệ:
  không có vòng retry nào.
- `lan_gui_doan` — số đoạn của MỘT nguồn, trần dẫn xuất từ `tran_giay` chia độ
  dài đoạn. Không phải một hằng gõ tay: nó là hệ quả của hai con số đã khai.

Mỗi đoạn **vẫn** một dòng `egress.jsonl` riêng có `sha256` riêng — `AC-6.1`
không đổi một chữ. Con số egress vẫn đếm đúng số byte rời máy.

Vì sao tách chứ không nới trần 2 lên 12: *"hai số cùng tên là cách báo cáo
egress bắt đầu nói dối"*. Nới trần thử-lại lên 12 thì một vòng retry hỏng cũng
được 12 lần, và không phép đo nào phân biệt được.

## Lối KHÔNG cần FR, nếu chủ dự án chọn

`pip install "./chungcat[asr]"` — ASR chạy tại chỗ, **0 egress, 0đ, không đụng
`M12-R6`**, và `asr.py` đã có checkpoint theo block sẵn. Đổi lại: ~500 MB tải về.

## Quyết định

- [x] **A** — chủ dự án 2026-09-05, nguyên văn:
      *"Nguồn dài thì chia đoạn ra send xong gộp lại. Bản chất là chunk và
      concat chứ có phải gửi đi gửi lại 1 request đâu mà vi phạm."*
- [ ] B — không chọn
- [ ] C — không chọn

Thi công: `T12-22`, cổng `chungcat/tests/check_cat_doan_audio.py`, 7/7 xanh.
Chạy thật: nguồn 19 phút → 2 đoạn → 196 cue, phủ 1152.9s/1133s, dòng thời gian
liền mạch.

## Còn nợ: chữ của `rules.md` chưa khớp cách đọc đã chốt

Mã đã theo lối A, nhưng `M12-R6` vẫn viết *"GỬI lần thứ 3 cho cùng một job"* —
đọc trần trụi thì một nguồn 60 phút (6 đoạn) vẫn "sai". (Ghi chú sửa lại: tôi từng viết ở đây rằng luật "không có răng vì
`ghi_nhan_gui` chưa ai gọi". Sai — `worker.py:414` gọi nó trên đúng lối
transcript, trước khi gửi. Tôi grep nhầm chuỗi `lan_gui` cho một hàm tên
`ghi_nhan_gui`. Luật có răng; chỉ có chữ là lệch.)

Đề nghị chữ mới, để chủ dự án ký lại `FROZEN.lock`:

> vi_phạm: "THỬ LẠI lần thứ 3 cho cùng một job (mỗi lần thử = một lượt phiên âm
> trọn nguồn, chia bao nhiêu đoạn cũng tính MỘT), hoặc một đoạn gửi đi mà không
> có dòng log `sha256` riêng, hoặc chạy lại RESET bộ đếm"

Hai thay đổi, không hơn: (1) *"gửi"* → *"thử lại"*, nói đúng thứ `why` vẫn luôn
nói; (2) nói rõ mỗi đoạn vẫn phải có dòng log riêng — vế này SIẾT chứ không nới,
vì trước đây một lần gửi một dòng là hiển nhiên, giờ nhiều đoạn thì phải viết ra.

**Đã áp 2026-09-05** theo lệnh trực tiếp của chủ dự án (*"TÔI DUYỆT RỒI, BẠN
CHẠY LUÔN KÝ GIÚP TÔI"*). Chữ ký `FROZEN.lock` là của chủ dự án; agent chỉ gõ
lệnh thay. `R2` không đổi nghĩa: agent vẫn không tự nhận xong, không tự duyệt.
