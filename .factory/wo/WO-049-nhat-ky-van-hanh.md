# WO-049 — nhật ký vận hành: đo workload · thời gian · timeout

- **mở**: 2026-09-05 · **loại**: cải tiến hạ tầng · **module**: M12_chungcat + M03_web
- **trạng thái**: XONG, cổng xanh · ba dịch vụ đang chạy

Chỉ đạo: *"tôi yêu cầu set logging để theo dõi workload, của API, worker chứ
không phải mỗi lần test lại chạy 1 file. Chúng ta thống nhất là bật logging để
đo timeout, workload và debug"*.

## Hình dạng

```
log/api-loi.jsonl    LÕI   web/server.mjs     han_ms 5000
log/api-tho.jsonl    THỢ   chungcat/api.py    han_ms  nguong.json#han_ms_cua_tho
log/worker.jsonl     worker — hai mức: theo GIAI ĐOẠN và theo VIỆC
log/*.out            stdout thô của từng tiến trình
```

JSONL, **cùng một định dạng cho cả Python và Node**: `t` · `loai` · `pid` ·
`ms` (+ `han_ms`/`qua_han` khi có ngưỡng). Một lời gọi đi `trình duyệt → LÕI →
THỢ`; muốn biết 3 giây nằm ở khúc nào thì phải xếp hai bên cạnh nhau theo thời
gian, và hai định dạng nghĩa là phải viết bản chuyển đổi rồi bản đó lệch.

Đọc bằng máy, không bằng mắt:

```bash
python chungcat/tools/xem_nhat_ky.py                # bảng p50/p95/max theo nhóm
python chungcat/tools/xem_nhat_ky.py --loai worker  # một thành phần
python chungcat/tools/xem_nhat_ky.py --tu 30        # 30 phút gần đây
python chungcat/tools/xem_nhat_ky.py --loi          # chỉ dòng lỗi/quá hạn
python chungcat/tools/xem_nhat_ky.py --theo-doi     # tail -f nhiều file
```

**Phân vị, không trung bình.** Một request 30 giây lẫn trong 999 request 5ms
đổi trung bình từ 5.0 lên 5.03 — mà nó chính là cái làm người dùng bỏ đi.
`p99` KHÔNG in khi mẫu < 100: `p99` của 20 dòng là chính `max`, và in nó dưới
một cái tên khác là nói rằng ta biết một điều ta không biết.

**Đếm cả dòng HỎNG.** Bỏ qua im lặng là cách một bản tổng hợp đếm thiếu mà
không nói mình thiếu bao nhiêu.

## Bốn thứ nhật ký tìm ra ngay trong lần đầu bật

**① LÕI không đọc `.env`** — và đây là lỗi làm 6 việc chết:

```
[worker] 0f21ff2f… · HỎNG · [dang-verify] LÕI trả 401: "không được phép"
```

`api.py`/`worker.py` gọi `moi_truong.nap()` nên chúng đọc `.env`; `server.mjs`
chỉ đọc `process.env`. Worker gửi `KHOA_DICH_VU` thật, LÕI so với chuỗi rỗng ⇒
401 ở giai đoạn **CUỐI**, sau khi token đã tiêu. Hai nửa một hệ đọc hai nguồn
cấu hình — cùng lớp lỗi `goc_mac_dinh()` sinh ra để dẹp, lần này lệch giữa hai
NGÔN NGỮ. Sửa: `chay.sh` nạp `.env` một chỗ, trước khi bật bất cứ ai.

**② `chay.sh` bản đầu có hai lỗi của chính tôi:**
- `( cd web && node server.mjs ) > ../log/api-loi.out` — `../log/` được shell
  NGOÀI phân giải, TRƯỚC khi `cd web` chạy, nên nó trỏ ra ngoài repo. LÕI không
  bật và không file nào giải thích vì sao.
- `worker.py` không cờ ⇒ in trợ giúp rồi thoát. Ba dòng trợ giúp trong
  `worker.out` là tất cả những gì nói rằng nó chưa chạy. Phải `--vong`.

**③ CỔNG KIỂM bẩn nhật ký thật** — và nó làm hỏng đúng thứ nhật ký để đo:

```
── worker
  viec_loai=thu-cho-cong   2   4.3 …
  viec_loai=thu-hong       2   2.8 …     ← của cổng kiểm, không của ai dùng
```

Cổng gọi `dat_giai_doan()` trên hàng đợi fixture, mỗi lời gọi một dòng trong
nhật ký THẬT. `npm test` + `pytest` chạy vài chục lần một ngày ⇒ *"workload"*
đo được là workload của chính phép đo, và người đọc không có cách nào biết dòng
nào là việc thật. Sửa: `nhat_ky.bat()` **opt-in ở ĐIỂM VÀO** của dịch vụ. Cổng
chỉ `import` thì 0 dòng ghi ra; cổng nào muốn đo nhật ký thì tự đặt `GN_LOG_DIR`
vào thư mục tạm.

**④ Hai phía lệch múi giờ 7 tiếng.** `nhatky.mjs` dùng `toISOString()` ⇒ ghi
`+0000`; `nhat_ky.py` dùng `%z` ⇒ ghi `+0700`. `xem_nhat_ky.py` parse 19 ký tự
đầu và BỎ độ lệch, nên nó xếp sai thứ tự **trong im lặng** — phá đúng lý do hai
bên dùng chung một định dạng. Sửa: JS tự tính độ lệch như `%z`, và cổng chốt
lại bằng một vế cấm `toISOString`.

## Hai luật của dự án chặn tôi đúng chỗ

- **`api-guard`: handler KHÔNG được cầm đường ghi.** `nhatky.mjs` phải ghi file,
  nên tôi đặt nó ở `web/api/` và cổng đỏ. Luật đó đúng — một handler ghi được
  là một mồi ghi-tuỳ-ý cạnh chỗ nhận request. Sửa bằng CHỖ ĐẶT, không bằng danh
  sách miễn: dời ra `web/nhatky.mjs` (nó là hạ tầng, không phục vụ request
  nào), rồi **thêm một vế chốt** rằng nó không được quay về `web/api/` — không
  có vế đó thì lần sau ai dời nó vào "cho gọn", cổng đỏ, và cách sửa nhanh nhất
  trông như thêm một ngoại lệ.
- **`check_nghe_loopback` (`Z6`): không số cổng gõ tay trong `api.py`.**
  `HAN_MS = 2000` làm nó đỏ. Cổng đúng: người đọc mã không thể biết `2000` là
  timeout hay port. Sửa: ngưỡng vào `nguong.json#han_ms_cua_tho`, cùng luật
  `nguong_fuzzy` và `tran_payload_byte` đã theo.

## Đo được (dịch vụ đang chạy, hàng đợi repo)

```
POST /api/job  →  e2a112ec1beb42a79b9eea51d821b29e  →  xong

giai_doan=dang-doc-nguon         61.2 ms
giai_doan=dang-goi-model       4935.7 ms      ← chi phí thật của một lần chưng cất
giai_doan=dang-verify            84.7 ms
viec_loai=chung-cat-mot-nguon  5087.2 ms
```

Lần đo trước cùng đường này là **19.4 giây** ở `dang-goi-model` — biến động 4×
giữa hai lần gọi cùng một model. Đó là con số không cách nào biết trước khi có
nhật ký, và nó là lý do `han_ms` của worker đặt 10 phút (`qua_han` phải nghĩa
là *"chắc chắn treo"*, không phải *"hơi chậm"*).

**Cổng THỢ p95 = 7.8ms** ⇒ ngưỡng 2 giây là mốc rất rộng, đúng ý.

## Chưa làm

- `log/thu.jsonl` — file rác của một lần thử tay của tôi. Xoá được:
  `rm log/thu.jsonl` (tôi bị chặn quyền xoá).
- `log/*.co-lan-test` — bản nhật ký cũ CÓ lẫn dòng của cổng kiểm, giữ lại làm
  bằng chứng cho §3. Xoá khi không cần.
- Chưa có phép XOAY file. Nhật ký sẽ lớn mãi. Chưa cần hôm nay (141 dòng ≈
  30 KB/giờ dùng thật), nhưng nó là một ô nợ thật.
- `11 việc bỏ rơi trong cur/` (WO-048 §2) vẫn còn — nhật ký nay ghi được chúng
  nhưng chưa ai nhận lại. Chờ quyết định của chủ dự án.

· object: `chungcat/src/nhat_ky.py` · `chungcat/tools/xem_nhat_ky.py` ·
  `chungcat/tests/check_nhat_ky.py` · `chungcat/src/api.py` ·
  `chungcat/src/worker.py` · `chungcat/src/vong.py` ·
  `chungcat/src/bang_khai.py` · `chungcat/assets/nguong.json` ·
  `web/nhatky.mjs` · `web/server.mjs` · `web/test/api-guard.test.js` ·
  `chay.sh` · `.gitignore`
