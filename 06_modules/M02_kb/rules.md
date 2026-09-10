# M02_kb — rules

> Ngữ pháp bốn field, giống rule khung. Tầng dưới **chỉ thêm ràng buộc, không nới**
> R1–R6 hay BRD.

```yaml
- id: M02-R1
  vi_phạm: "một tiến trình tự động ghi review_status: approved vào file trong kb/"
  bề_mặt: S2          # reviewer rà diff mọi module có quyền ghi kb/
  why: >
    Ranh giới quyền DUY NHẤT của hệ thống (BRD B-B1, security_baseline §1).
    Mất nó thì lớp giảm thiểu prompt injection sập theo: security_baseline §6
    chấp nhận rủi ro chỉ vì "máy không bao giờ tự set approved".
    Không có bề mặt máy nào chứng minh được điều-không-xảy-ra ⇒ S2, không S3.

- id: M02-R2
  vi_phạm: >
    (FR-034 đảo chiều) module ngoài M05_intake và M08_api có đường ghi vào
    kb/_kho.sqlite; hoặc M08_api COMMIT mà không qua validate.py --strict;
    hoặc TỒN TẠI một đường ghi file kb/** ngoài core/tools/xuat_kho.py;
    hoặc server import/spawn dung_lai_db.py (đường file→DB tự động).
  bề_mặt: S3          # check_export_dan_xuat.py (răng 2+3) + api-guard.test.js + api-crud.test.js
  why: >
    Các module đọc kho (M03, M04, M06, M07). Một trong số đó ghi được thì
    kho có hai nguồn chân lý và không ai biết bản nào đúng.
    FR-011 thêm M08_api làm writer CÓ ĐIỀU KIỆN — điều kiện (validate trước
    COMMIT, không default trường người) nằm ở M08-R2/R3 và kiểm được bằng máy.

    FR-034 — mũi tên đảo nhưng bất biến MỘT CHIỀU giữ nguyên hình: trước cấm
    "index → .md", giờ cấm "file → DB tự động". File kb/** là export dẫn xuất;
    một đường ghi file thứ hai (ngoài xuat_kho.py) hoặc một đường nhập DB tự
    động trong server đều là "hai nguồn chân lý" — đúng thứ rule này chống từ
    đầu. Bốn răng ở core/tests/check_export_dan_xuat.py — bề mặt S3, không
    phải lời khai.

- id: M02-R3
  vi_phạm: >
    Một tiến trình TỰ SINH tên nhãn rồi ghi vào bảng concepts / categories
    (FR-034 — trước là hai file yaml; giờ yaml là export của hai bảng đó);
    hoặc một đường ghi vào hai bảng đó mà không đòi người khai nhãn; hoặc cho
    ĐỔI `id` của mục đã có, XOÁ `aliases`, hoặc XOÁ một nhãn đang có bài dùng.
    (FR-021 nắn vế ba: sửa `label_vi`/`gom` và xoá nhãn 0 bài KHÔNG còn là vi phạm.)
  bề_mặt: S3 + S2     # FR-019 đổi từ S1. Lý do ở dưới. FR-034: vết ghi chuyển từ
                      # kb/_nhat-ky-danh-muc.md sang bảng audit_log (trigger cấm
                      # sửa/xoá — răng cứng hơn appendFileSync), export ra file cũ.
  why: >
    Danh mục đóng chỉ có giá trị khi cùng một ý có cùng một tên. Cho máy thêm
    thì sau 60 bài có rag / RAG / retrieval-augmented / rag-pipeline —
    bốn tên một thứ, bộ lọc ra bốn tập rời nhau.
    M07 được ĐỀ XUẤT gộp, không được ghi.

    FR-019 — VÌ SAO ĐỔI BỀ MẶT S1 → S3+S2:

    (1) S1 KHÔNG cưỡng chế được rule này. security_baseline §5.1 ghi rõ: 21/21
    file trong deny list đã bị ghi qua Bash heredoc mà không bị chặn lần nào, kể
    cả kb/concepts.yaml. Deny chỉ canh tool Write của agent; một tiến trình Node
    không đi qua lớp đó. Khai S1 là khai một bề mặt không có răng.

    (2) Vi phạm THẬT là "máy TỰ SINH tên", không phải "ghi qua HTTP". Người bấm
    nút không sinh tên. Cùng khuôn lập luận security_baseline §1 dùng cho nút
    Duyệt — thứ nhạy cảm hơn nhiều: "thêm bề mặt, không thêm chủ thể".

    Răng thật sau FR-019:
    - S3 · web/test/danh-muc-them.test.js — PUT/PATCH/DELETE phải 404 · thiếu
      label_vi phải 422 · trùng id hoặc trùng alias phải 409 · mục cũ và comment
      nguyên văn.
      (FR-028 GỠ một răng khỏi danh sách này: "dưới ngưỡng concept_merge_min
      phải 422". Người dùng cần khai key liên tục, mà cổng đó chặn ngay từ key
      đầu tiên. Vi phạm THẬT của rule vẫn là "máy TỰ SINH tên" — endpoint chưa
      bao giờ sinh tên, nên vế cấm không bị nới. Cái mất: ngưỡng từng là bằng
      chứng "nhãn có thật trong kho". Cái còn: trùng id + trùng alias, và
      FR-021 đã cho SỬA/XOÁ nên nhãn thêm nhầm không còn ở lại vĩnh viễn —
      cổng vào chặt không còn là cách duy nhất giữ danh mục sạch.)
    - S3 · web/test/api-guard.test.js — mọi ghi qua dungchung.mjs, renameSync
      đúng 3 chỗ.
    - S3 · web/test/no-write-path.test.js — whitelist literal đóng; đường thứ sáu
      làm test đỏ.
    - S2 · kb/_nhat-ky-danh-muc.md — chỉ nối thêm. Bù cho việc server tự chạy
      check_frozen --ky: hash luôn khớp nên check_frozen không tự nói được "ai
      đổi", file này trả lời câu đó.

    Deny S1 GIỮ NGUYÊN — cố ý. Nó không cưỡng chế được, nhưng vẫn là lời khai ý
    định và vẫn bắt được lỗi vô ý khi agent gõ Write.

    FR-021 — VÌ SAO NẮN VẾ "CẤM SỬA/XOÁ":

    Vế đó (FR-019 viết) chặn RỘNG hơn thứ rule bảo vệ. Cái nó bảo vệ là `id` —
    thứ bài viết trỏ vào và bộ lọc so khớp. Đo ở validate.py:194-198: nó so `id`.
    `label_vi` và `gom` KHÔNG xuất hiện trong bất kỳ phép kiểm nào, chúng chỉ để
    hiển thị trên web. Cấm sửa một lỗi chính tả trên nhãn tiếng Việt không bảo vệ
    gì; cấm đổi `id` thì bảo vệ thật.

    Tương tự với xoá: đo trên kb-mock/ có 11/22 khái niệm và 1/6 chủ đề chưa bài
    nào dùng. Xoá một nhãn `đếm = 0` thì không file nào trỏ tới ⇒ không vỡ gì.
    Xoá nhãn `đếm > 0` thì bài đó trỏ vào nhãn không tồn tại, validate báo lỗi và
    MỌI lần ghi bài đó sau này bị chặn — nên vế này giữ cấm, và server TỰ ĐẾM
    (không tin client gửi số đếm).

    Ranh giới method: `PUT` = thay toàn bộ = đường đổi `id` ⇒ vẫn 404.
    `PATCH` = sửa một phần ⇒ mở cho label_vi/gom/thêm-aliases.

    Không có thùng rác cho nhãn (khác bài — bài có _recycle/). Bù bằng
    kb/_nhat-ky-danh-muc.md: ghi CẢ chiều thêm và chiều xoá.

- id: M02-R4
  vi_phạm: "thêm/sửa/xoá trường trong frontmatter.schema.json mà không có FR"
  bề_mặt: S1          # deny rule đã có: core/assets/frontmatter.schema.json
  why: >
    Schema là hợp đồng sáu module bám vào. Sửa tại chỗ thì module khác gãy im
    lặng — file cũ vẫn parse được, chỉ thiếu trường mới, và không ai biết.
    FR-001 là ví dụ làm đúng: thêm 3 trường + 5 test + worklog.
```

## Bề mặt chưa có răng — khai thẳng

`M02-R2` là **kỷ luật, chưa phải cơ chế**: `boundaries.kb_writers` trong
`project_map.yaml` là lời khai, không có deny rule nào chặn M06/M07 ghi vào `kb/`.
Nâng lên S1 khi s7 chốt path thật của hai module đó.
