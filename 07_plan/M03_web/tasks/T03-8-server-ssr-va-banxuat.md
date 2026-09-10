# T03-8 — FR-034: server.mjs — banXuat sau gate (B5) + mount SSR (C2/C3)

phạm_vi_ghi:
  - web/server.mjs
  - web/render/**
verifiability: hard
tiêu_chí:
  - AC1: luồng nạp end-to-end vẫn nguyên trên DB (inbox → gate → hàng DB → export)
    cmd: node web/test/luong-nap-bai.test.js
  - AC2: 5 màn + /mock/* + deep-link /:type/:slug trả 200 từ SSR; kho 0 bài
      không màn trắng; GN_SSR=0 rơi về hành vi cũ
    cmd: node web/test/ssr-routes.test.js
phụ_thuộc: T08-4
