# WO-066 — việc HỎNG mang nhãn `cho`; phanh ASR bị coi "không phân loại"; đoạn không tiến phanh ngay

loại: bug (ba lỗi, một đường bấm)
module: M12_chungcat (chính) · M03_web (tab hiển thị)
mức: hard
người báo: chủ dự án 2026-09-09 — *"sao vẫn trạng thái chờ lâu vậy"* · *"tự back lại trạng thái chờ à"* · *"transcript mãi mà không dừng, dù đã hết video"*
chỉ đạo: *"bạn chọn hướng an toàn và xử lý cho tôi nhanh"*

## Đo trên hai job thật cùng buổi

```
4a1a59f1  giai_doan=cho  lan_gui=1  173 cue 00:00:08→00:28:14  audio 80.6 MB
caca4f98  giai_doan=cho  lan_gui=1
log/worker-w1.out:
  [cua-asr] bỏ 1 cue thiếu mốc thời gian
  [cua-asr] bỏ 37 cue thiếu mốc thời gian
  [worker] 4a1a59f1… · HỎNG (không phân loại) · PhienAmCut: vong 9 tai 1694s
           khong phien am them giay nao (nhan 0 cue). Dung de khoi dot them.
nhật ký: dang-goi-model → sang: 'cho'   (01:29:38)
```

Việc **đã dừng** lúc 01:29:38. Màn hiện "chờ" mãi.

## Ba lỗi

**A · không có nhãn "hỏng".** `GIAI_DOAN = (cho, dang-doc-nguon, dang-goi-model,
dang-verify, xong)`. Việc hỏng buộc mang một trong năm, và `except Exception`
chọn `cho` — trùng nghĩa *"sắp chạy"*. Sự thật ghi ở `ket: hong-la` trong nhật
ký, chỗ màn không đọc. FE `conChayGd("cho") = true` ⇒ poll mãi, hiện "xếp hàng".

**B · `PhienAmCut` không phải `ViecHong`.** Nó là **phanh cố ý** (tránh đốt
token khi vòng không tiến) — thứ được phân loại rõ nhất — mà rơi vào
`except Exception` ⇒ in "không phân loại" và đi đúng nhánh A.

**C · một phản hồi quên mốc thời gian giết cả job.** Vòng 9 cửa trả 37 cue
**thiếu `tu`/`den`**; lọc đúng (không bịa mốc) ⇒ 0 cue ⇒ `het <= moc` ⇒ phanh.
Nội dung CÓ, mốc KHÔNG — lỗi định dạng của **một** phản hồi, không phải hết
tiếng. Phanh ngay là mất phần còn lại của video vì một lần model quên số.

## Hướng AN TOÀN đã chọn (không hỏi lại — chỉ đạo)

| | làm | vì sao an toàn |
|---|---|---|
| A | thêm `hong` vào `GIAI_DOAN`; `danh_hong()` ghi `giai_doan_hong` + `loi`; lease **không** tự nhặt lại `hong`; `chay_lai` xoá vết | không đổi vòng đời việc; `chay_lai` vẫn resume đúng chỗ qua `giai_doan_hong` |
| B | `except asr_cua.PhienAmCut ⇒ raise ViecHong("dang-goi-model")` tại chỗ gọi | resume từ `dang-goi-model` với cue đã checkpoint |
| C | đoạn không tiến ⇒ **gửi lại đúng MỘT lần** rồi mới phanh | không bịa mốc, không bỏ đoạn; +1 lời gọi tối đa mỗi mốc; vẫn dưới `tran_vong_asr`; `M12-R6` đếm THỬ theo lượt trọn nguồn nên không đụng |
| FE | `hong` ⇒ nhãn "hỏng", vạch đỏ, hiện `loi` + chặng hỏng; thôi poll | không đổi hợp đồng API — `/viec/<id>` trả nguyên file việc nên `loi`/`giai_doan_hong` tự lộ |

**Không chọn**: bịa mốc thời gian cho cue thiếu mốc (đi thẳng vào `.vtt`, không
ai biết là số bịa); bỏ qua đoạn (mất nội dung im lặng); đổi model (quyết định
của người, tốn tiền thử).

## Đính chính một lời của tôi lượt trước

Tôi nói *"~28 phút audio rời máy tới cửa ASR không để lại dòng egress nào"*.
**SAI.** Sổ `egress.w1.jsonl` có đủ dòng `loi_dung: cua-asr` kèm `sha256`;
grep của tôi tìm `ulid` trong dòng egress, mà dòng egress **không mang ulid**.
`M12-R3` nguyên vẹn. Không có WO cho việc đó.

## Bẫy tự đặt lúc thi công — ghi vì nó sẽ lặp

Nối `hong` vào **cuối** `GIAI_DOAN` ⇒ `dong_viec` dùng `GIAI_DOAN[-1]` làm
"xong" ⇒ **mọi việc thành công lập tức được đánh `hong`**, `loi` rỗng. Hai
cổng cũ đỏ (`check_worker_mot_vong` · `check_viec_bo_roi`) — và chúng đỏ
ĐÚNG. Sửa: `dat_giai_doan(ulid, "xong")` bằng TÊN. Một vị trí trong tuple
không phải một ý nghĩa.

## Cổng

`chungcat/tests/check_hong_khong_mang_nhan_cho.py` — 11 vế, **chạy thật** một
vòng worker với hàm việc giả ném hai kiểu, và vòng ASR với cửa giả.
