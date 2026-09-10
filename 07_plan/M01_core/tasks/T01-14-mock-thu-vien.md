# T01-14 — FR-036/B8a: bản ghi mock cho thư viện (đơn vị CODE)

> Màn `/mock/` phải **demo được lối thư viện mà không cần API** — nếu không thì
> mọi cổng FE của B8b chỉ đo được trên kho tạm có server, và người xem giao diện
> không thấy gì.
>
> **KHÔNG thêm vào contract.** `05_uiux/contracts/analyses.sample.v5.json` là hợp
> đồng G5 **frozen**, và `expected-render.test.js` dựng `Ban` **thẳng từ contract**
> để so `_expected_render`. Thêm bản ghi vào đó là bump 5 hash + FR cho một thứ
> chỉ để xem giao diện. Nên hai bản ghi thư viện khai **trong
> `sinh_kb_mock.py`**, tách khỏi vòng lặp đọc contract.
>
> **`media` phải viết FLOW JSON** — `media: {"sha256": …}`. Parser YAML tự chế của
> `docTuDia` đọc được block LIST và flow JSON nhưng **không** đọc được block
> MAPPING (đo ở `WL-01K9N9FR036B7A`); viết block style là bản mock im lặng mất
> `media`.

phạm_vi_ghi:
  - core/tools/sinh_kb_mock.py
  - kb-mock/tai-lieu/bao-cao-chi-phi-suy-luan.md
  - kb-mock/video/hoi-thao-context-engineering.md

verifiability: hard
tiêu_chí:
  - AC1: hai bản ghi mới đi qua cổng — `ho_so: thu-vien` miễn khung 5 mục,
      `tai-lieu` có `media`, `video` có `url_normalized`
    cmd: python core/src/source_distiller/validate.py kb-mock/ --no-concepts --no-categories
  - AC2: kho mock vẫn sạch theo đúng ca âm đã khai; sinh lại KHÔNG đổi byte
      (tất định)
    cmd: python core/tools/sinh_kb_mock.py && python core/tests/check_kb_mock.py
  - AC3: `media` tới được `Ban` qua đường ĐĨA (flow JSON, không block mapping).
      Cổng nằm ở đơn vị FE (`T03-18`) vì nó cần đọc trang mock đã render — nên AC
      này **cố ý đỏ** tới khi B8b xong, giống cách A1 canh A2–A4
    cmd: cd web && node test/media-cua-so.test.js
  - AC4: không hồi quy — `expected-render` không đổi (contract không bị chạm)
    cmd: cd web && npm test
phụ_thuộc: T03-15
