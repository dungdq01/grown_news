# T03-158 — đơn vị TEST (ĐỎ trước): prototype ghép tên dịch vụ với số cổng phải khớp `dich-vu.json`

> Nguồn: ô backlog M13 `backlog.md:26`. ID rule 9: dải CHẴN dev chính, max 156 ⇒ **158**.
>
> **PM ghi nhận một lỗi của chính mình**: bản nháp đầu của đơn vị này khai
> `cmd: python core/tests/check_dich_vu_cong.py` — **cổng đó không tồn tại**. Đo lúc
> 2026-09-15: `ls core/tests/check_dich_vu_cong.py` ⇒ không có. Một `cmd` trỏ file vắng
> là AC **xanh oan tuyệt đối**, đúng lớp lỗi đã bắt ở `T13-0 AC2`. Nên đơn vị tách đôi:
> cổng ở đây, mã ở `T03-160`.
>
> **Vì sao cổng nằm ở `web/test/` chứ không `core/tests/`**: `core/tests/**` là đất M01;
> M03 viết cổng ở đó là ghi ngoài boundary — `check_g6b` trên `main` đang báo đúng lớp lỗi
> này 40 lần. Cổng này đo `05_uiux/prototype/**`, đất M03 từ map v17/FR-042.
>
> **Bug cổng phải bắt được**, đo hôm nay: `sinh_v21.py:216` và `app-v21.html:196` ghi
> *"Service chatbot không chạy (cổng 8791)"*. `core/assets/dich-vu.json` khai
> **8788 = chatbot** · **8791 = truyhoi**. Trước lượt M13 đây chỉ là nhãn sai trong bản
> mẫu; nay 8791 **có** dịch vụ thật đang chạy ⇒ người đọc thông báo sẽ khởi động lại
> **nhầm tiến trình**, còn tiến trình đúng vẫn chết.

phạm_vi_ghi:
  - web/test/proto-ten-dich-vu-va-cong.test.js

phụ_thuộc: —

verifiability: hard
tiêu_chí:
  - AC1: **ĐỎ trước**. Quét `05_uiux/prototype/*.py` + `*.html`, bắt mọi chỗ một **tên dịch vụ**
      đứng cùng câu với một **số cổng 4 chữ số**, đối chiếu `core/assets/dich-vu.json`.
      Trên mã hôm nay phải ĐỎ **đúng 2 chỗ** (`sinh_v21.py:216` · `app-v21.html:196`), mỗi
      chỗ nêu đủ: file · dòng · tên đọc được · cổng đọc được · cổng đúng
    cmd: cd web && node test/proto-ten-dich-vu-va-cong.test.js
    đỏ_khi: có ≥1 cặp (tên, cổng) không khớp `dich-vu.json`
    xanh_khi: 0 cặp lệch
  - AC2: cổng **không đỏ oan** — fixture ở **thư mục tạm** chứa một câu ghép **đúng**
      (`"chatbot ... 8788"`) ⇒ cổng im lặng, exit 0. Ca này không quét file thật
    cmd: cd web && node test/proto-ten-dich-vu-va-cong.test.js --tu-kiem
    đỏ_khi: báo lệch trên một câu ghép đúng
    xanh_khi: exit 0
  - AC3: số cổng **không** đi kèm tên dịch vụ nào thì **bỏ qua**, không đoán — fixture tạm
      chứa `"trần 8791 byte"` ⇒ 0 báo
    cmd: cd web && node test/proto-ten-dich-vu-va-cong.test.js --tu-kiem
  - AC4: cổng chạy trong `npm test` — grep tên file trong `web/package.json` ⇒ 1
    cmd: cd web && npm test

# AC2 và AC3 là vế **chống đỏ oan**: một cổng chỉ grep số `8791` sẽ báo cả trần byte lẫn
# mọi tài liệu nói về cổng — rồi người ta tắt nó đi. Cổng phải đọc `dich-vu.json` làm
# nguồn sự thật, không gõ cứng cặp nào.
