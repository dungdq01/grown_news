# T03-104 — GIẢM BÉO `gn.js`: chunk JS ba màn `nap` theo khuôn T03-102

> **Quyết PM 2026-09-04 (lối i)** cho chỗ chặn của T03-95: khối dashboard cần
> ~1512B trong `gn.js` mà bundle chỉ dư 1453B (thiếu 59B); lối chunk-riêng cho
> trang chủ chết vì thẻ `<script>` +48B > 9B dư của HTML trang chủ; nới trần bị
> FR-027f cấm ("SIẾT, không nới"). Lối còn lại: DỌN chỗ trong bundle chung —
> chỗ béo dev đã chỉ: **JS của ba màn `nap` (form 14 trường) chỉ cần trên
> `/…/nap/`** — đúng ứng viên chunk theo T03-102 (khuôn đã chạy được).
> Chặn cứng: T03-95 chạy SAU đơn vị này.

phạm_vi_ghi:
  - web/plugins/multiwindow/src/scripts/multiwindow.inline.ts   # tách JS form nap ra
  - web/plugins/*/                                              # chunk mới gn-nap (theo khuôn T03-102)
  - web/render/trang.mjs                                        # ba trang /…/nap/ phát thẻ script chunk
  - web/build-fe.mjs                                            # CHỈ nếu khuôn T03-102 đòi đăng ký chunk
  - web/package.json                                            # đăng ký cổng nếu sinh test mới (rule backlog M08)

verifiability: hard
tiêu_chí:
  - AC1: gn.js giảm ≥2000 byte so mốc trước (đo máy trước/sau, số vào worklog);
      trần 102400 GIỮ NGUYÊN
    cmd: cd web && npm run build && npm test
    đỏ_khi: gn.js sau build giảm <2000B, hoặc bất kỳ cổng nào của suite đỏ
    xanh_khi: hiệu hai số ≥2000 và suite xanh
  - AC2: ba màn /…/nap/ vẫn hoạt động — form nạp đủ, chunk chỉ tải trên trang nap
      (trang khác 0 tham chiếu gn-nap)
    cmd: node web/test/ssr-routes.test.js && node web/test/page-weight.test.js
    đỏ_khi: route nap vỡ, hoặc trang ngoài nap mang thẻ gn-nap
    xanh_khi: cả hai cổng exit 0
  - AC3: không phá gì — suite web xanh
    cmd: cd web && npm test
